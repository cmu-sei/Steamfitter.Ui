// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  ScenarioPermission,
  ScenarioPermissionClaim,
  ScenarioPermissionsService,
  ScenarioTemplatePermission,
  ScenarioTemplatePermissionClaim,
  ScenarioTemplatePermissionsService,
  SystemPermission,
  SystemPermissionsService,
} from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { PermissionDataService } from './permission-data.service';

function setup(
  options: {
    systemApi?: ApiStub<SystemPermissionsService>;
    scenarioApi?: ApiStub<ScenarioPermissionsService>;
    templateApi?: ApiStub<ScenarioTemplatePermissionsService>;
  } = {},
) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      options.systemApi
        ? { provide: SystemPermissionsService, useValue: options.systemApi }
        : unstubbed(SystemPermissionsService),
      options.scenarioApi
        ? { provide: ScenarioPermissionsService, useValue: options.scenarioApi }
        : unstubbed(ScenarioPermissionsService),
      options.templateApi
        ? {
            provide: ScenarioTemplatePermissionsService,
            useValue: options.templateApi,
          }
        : unstubbed(ScenarioTemplatePermissionsService),
    ]),
  });
  return TestBed.inject(PermissionDataService);
}

// The real service, preloaded from stubbed "my permissions" endpoints.
function permissionDataWith(grants: PermissionGrants): PermissionDataService {
  TestBed.configureTestingModule({
    providers: getDefaultProviders(permissionDataProviders(grants)),
  });
  return TestBed.inject(PermissionDataService);
}

const scenarioClaim = (
  scenarioId: string,
  ...permissions: ScenarioPermission[]
): ScenarioPermissionClaim => ({ scenarioId, permissions });

const templateClaim = (
  scenarioTemplateId: string,
  ...permissions: ScenarioTemplatePermission[]
): ScenarioTemplatePermissionClaim => ({ scenarioTemplateId, permissions });

const allSystemPermissions = Object.values(SystemPermission);

describe('PermissionDataService', () => {
  describe('loading', () => {
    /**
     * Verifies: load() fetches the caller's system permissions and keeps them on `permissions`.
     * Interacts with: SystemPermissionsService.getMySystemPermissions stub.
     * Data: ViewUsers and ManageTasks.
     */
    it('load() stores the system permissions', async () => {
      const systemApi = {
        getMySystemPermissions: vi.fn(() =>
          of([SystemPermission.ViewUsers, SystemPermission.ManageTasks]),
        ),
      } satisfies ApiStub<SystemPermissionsService>;
      const service = setup({ systemApi });
      expect(service.permissions).toEqual([]);

      await firstValueFrom(service.load());

      expect(service.permissions).toEqual(['ViewUsers', 'ManageTasks']);
      expect(service.hasPermission(SystemPermission.ManageTasks)).toBe(true);
      expect(service.hasPermission(SystemPermission.ManageUsers)).toBe(false);
    });

    /**
     * Verifies: the scenario and template claim loaders pass the optional id through and store the claims.
     * Interacts with: getMyScenarioPermissions/getMyScenarioTemplatePermissions stubs.
     * Data: one scenario claim for 's1' and one template claim for 't1'.
     */
    it('loads scenario and scenario-template claims', async () => {
      const scenarioApi = {
        getMyScenarioPermissions: vi.fn(() =>
          of([scenarioClaim('s1', 'ViewScenario')]),
        ),
      } satisfies ApiStub<ScenarioPermissionsService>;
      const templateApi = {
        getMyScenarioTemplatePermissions: vi.fn(() =>
          of([templateClaim('t1', 'ViewScenarioTemplate')]),
        ),
      } satisfies ApiStub<ScenarioTemplatePermissionsService>;
      const service = setup({ scenarioApi, templateApi });

      await firstValueFrom(service.loadScenarioPermissions('s1'));
      await firstValueFrom(service.loadScenarioTemplatePermissions());

      expect(scenarioApi.getMyScenarioPermissions).toHaveBeenCalledWith('s1');
      expect(templateApi.getMyScenarioTemplatePermissions).toHaveBeenCalledWith(
        undefined,
      );
      expect(service.scenarioPermissions).toEqual([
        scenarioClaim('s1', 'ViewScenario'),
      ]);
      expect(service.scenarioTemplatePermissions).toEqual([
        templateClaim('t1', 'ViewScenarioTemplate'),
      ]);
    });

    /**
     * Verifies: before anything loads, every gate denies.
     * Interacts with: all PermissionDataService gate methods.
     * Data: a fresh service with no permissions loaded.
     */
    it('denies everything before permissions load', () => {
      const service = setup();
      expect(service.canViewAdiminstration()).toBe(false);
      expect(service.canViewScenarioList()).toBe(false);
      expect(service.canViewScenarioTemplateList()).toBe(false);
      expect(service.canEditScenario('s1')).toBe(false);
      expect(service.canManageScenario('s1')).toBe(false);
      expect(service.canExecuteScenario('s1')).toBe(false);
      expect(service.canEditScenarioTemplate('t1')).toBe(false);
      expect(service.canManageScenarioTemplate('t1')).toBe(false);
    });
  });

  describe('system-level gates', () => {
    // Expected gate results for a user holding exactly one system permission.
    const viewsAdmin = new Set<string>([
      'ViewScenarioTemplates',
      'ViewScenarios',
      'ViewUsers',
      'ViewRoles',
      'ViewGroups',
    ]);
    const templateList = new Set<string>([
      'CreateScenarioTemplates',
      'ViewScenarioTemplates',
      'EditScenarioTemplates',
      'ManageScenarioTemplates',
    ]);
    const scenarioList = new Set<string>([
      'CreateScenarios',
      'ViewScenarios',
      'EditScenarios',
      'ExecuteScenarios',
      'ManageScenarios',
    ]);

    /**
     * Verifies: for each single system permission, the admin, template-list and scenario-list gates allow or deny as expected.
     * Interacts with: canViewAdiminstration, canViewScenarioTemplateList, canViewScenarioList.
     * Data: every SystemPermission value, one at a time.
     */
    it.each(allSystemPermissions)(
      'applies the list and admin gates for %s alone',
      (permission) => {
        const service = permissionDataWith({ system: [permission] });
        expect({
          admin: service.canViewAdiminstration(),
          templates: service.canViewScenarioTemplateList(),
          scenarios: service.canViewScenarioList(),
        }).toEqual({
          admin: viewsAdmin.has(permission),
          templates: templateList.has(permission),
          scenarios: scenarioList.has(permission),
        });
      },
    );

    /**
     * Verifies: Manage* system permissions without the matching View* do not open Administration.
     * Interacts with: canViewAdiminstration.
     * Data: ManageUsers, ManageRoles, ManageGroups only.
     */
    it('does not show Administration for Manage permissions without View', () => {
      const service = permissionDataWith({
        system: ['ManageUsers', 'ManageRoles', 'ManageGroups'],
      });
      expect(service.canViewAdiminstration()).toBe(false);
    });
  });

  describe('scenario gates', () => {
    type Gate = 'canEditScenario' | 'canManageScenario' | 'canExecuteScenario';
    const cases: Array<{
      gate: Gate;
      grants: PermissionGrants;
      allowed: boolean;
      why: string;
    }> = [
      {
        gate: 'canEditScenario',
        grants: { system: ['EditScenarios'] },
        allowed: true,
        why: 'system EditScenarios',
      },
      {
        gate: 'canEditScenario',
        grants: { system: ['ManageScenarios'] },
        allowed: true,
        why: 'system ManageScenarios',
      },
      {
        gate: 'canEditScenario',
        grants: { scenarios: [scenarioClaim('s1', 'EditScenario')] },
        allowed: true,
        why: 'EditScenario on s1',
      },
      {
        gate: 'canEditScenario',
        grants: { scenarios: [scenarioClaim('s1', 'ManageScenario')] },
        allowed: true,
        why: 'ManageScenario on s1',
      },
      {
        gate: 'canEditScenario',
        grants: {
          scenarios: [scenarioClaim('s1', 'ViewScenario', 'ExecuteScenario')],
        },
        allowed: false,
        why: 'only view/execute on s1',
      },
      {
        gate: 'canEditScenario',
        grants: { scenarios: [scenarioClaim('s2', 'EditScenario')] },
        allowed: false,
        why: 'EditScenario on another scenario',
      },
      {
        gate: 'canEditScenario',
        grants: { system: ['ViewScenarios', 'ExecuteScenarios'] },
        allowed: false,
        why: 'system view/execute only',
      },
      {
        gate: 'canManageScenario',
        grants: { system: ['ManageScenarios'] },
        allowed: true,
        why: 'system ManageScenarios',
      },
      {
        gate: 'canManageScenario',
        grants: { scenarios: [scenarioClaim('s1', 'ManageScenario')] },
        allowed: true,
        why: 'ManageScenario on s1',
      },
      {
        gate: 'canManageScenario',
        grants: {
          system: ['EditScenarios'],
          scenarios: [scenarioClaim('s1', 'EditScenario')],
        },
        allowed: false,
        why: 'edit rights only',
      },
      {
        gate: 'canExecuteScenario',
        grants: { system: ['ExecuteScenarios'] },
        allowed: true,
        why: 'system ExecuteScenarios',
      },
      {
        gate: 'canExecuteScenario',
        grants: { scenarios: [scenarioClaim('s1', 'ExecuteScenario')] },
        allowed: true,
        why: 'ExecuteScenario on s1',
      },
      {
        gate: 'canExecuteScenario',
        grants: {
          system: ['ManageScenarios'],
          scenarios: [scenarioClaim('s1', 'ManageScenario')],
        },
        allowed: false,
        why: 'manage without execute',
      },
    ];

    /**
     * Verifies: each scenario gate allows via the matching system permission or a claim on that scenario, and denies otherwise.
     * Interacts with: canEditScenario, canManageScenario, canExecuteScenario (real precedence logic).
     * Data: the table above, always asking about scenario 's1'.
     */
    it.each(cases)(
      '$gate is $allowed with $why',
      ({ gate, grants, allowed }) => {
        const service = permissionDataWith(grants);
        expect(service[gate]('s1')).toBe(allowed);
      },
    );

    /**
     * Verifies: a system permission grants a scenario gate for every scenario, ignoring the claims.
     * Interacts with: canEditScenario.
     * Data: system EditScenarios plus a view-only claim on 's1'; asks about 's1' and an unclaimed 's9'.
     */
    it('lets a system permission override narrower scenario claims', () => {
      const service = permissionDataWith({
        system: ['EditScenarios'],
        scenarios: [scenarioClaim('s1', 'ViewScenario')],
      });
      expect(service.canEditScenario('s1')).toBe(true);
      expect(service.canEditScenario('s9')).toBe(true);
    });
  });

  describe('scenario-template gates', () => {
    type Gate = 'canEditScenarioTemplate' | 'canManageScenarioTemplate';
    const cases: Array<{
      gate: Gate;
      grants: PermissionGrants;
      allowed: boolean;
      why: string;
    }> = [
      {
        gate: 'canEditScenarioTemplate',
        grants: { system: ['EditScenarioTemplates'] },
        allowed: true,
        why: 'system EditScenarioTemplates',
      },
      {
        gate: 'canEditScenarioTemplate',
        grants: { system: ['ManageScenarioTemplates'] },
        allowed: true,
        why: 'system ManageScenarioTemplates',
      },
      {
        gate: 'canEditScenarioTemplate',
        grants: {
          scenarioTemplates: [templateClaim('t1', 'EditScenarioTemplate')],
        },
        allowed: true,
        why: 'EditScenarioTemplate on t1',
      },
      {
        gate: 'canEditScenarioTemplate',
        grants: {
          scenarioTemplates: [templateClaim('t1', 'ManageScenarioTemplate')],
        },
        allowed: true,
        why: 'ManageScenarioTemplate on t1',
      },
      {
        gate: 'canEditScenarioTemplate',
        grants: {
          scenarioTemplates: [templateClaim('t1', 'ViewScenarioTemplate')],
        },
        allowed: false,
        why: 'view-only on t1',
      },
      {
        gate: 'canEditScenarioTemplate',
        grants: {
          scenarioTemplates: [templateClaim('t2', 'EditScenarioTemplate')],
        },
        allowed: false,
        why: 'edit on another template',
      },
      {
        gate: 'canEditScenarioTemplate',
        grants: {
          system: ['CreateScenarioTemplates', 'ViewScenarioTemplates'],
        },
        allowed: false,
        why: 'system create/view only',
      },
      {
        gate: 'canManageScenarioTemplate',
        grants: { system: ['ManageScenarioTemplates'] },
        allowed: true,
        why: 'system ManageScenarioTemplates',
      },
      {
        gate: 'canManageScenarioTemplate',
        grants: {
          scenarioTemplates: [templateClaim('t1', 'ManageScenarioTemplate')],
        },
        allowed: true,
        why: 'ManageScenarioTemplate on t1',
      },
      {
        gate: 'canManageScenarioTemplate',
        grants: {
          system: ['EditScenarioTemplates'],
          scenarioTemplates: [templateClaim('t1', 'EditScenarioTemplate')],
        },
        allowed: false,
        why: 'edit rights only',
      },
    ];

    /**
     * Verifies: each template gate allows via the matching system permission or a claim on that template, and denies otherwise.
     * Interacts with: canEditScenarioTemplate, canManageScenarioTemplate (real precedence logic).
     * Data: the table above, always asking about template 't1'.
     */
    it.each(cases)(
      '$gate is $allowed with $why',
      ({ gate, grants, allowed }) => {
        const service = permissionDataWith(grants);
        expect(service[gate]('t1')).toBe(allowed);
      },
    );

    /**
     * Verifies: scenario claims do not grant scenario-template gates.
     * Interacts with: canEditScenarioTemplate.
     * Data: a ManageScenario claim whose scenario id equals the template id asked about.
     */
    it('does not mix scenario claims into template gates', () => {
      const service = permissionDataWith({
        scenarios: [scenarioClaim('t1', 'ManageScenario')],
      });
      expect(service.canEditScenarioTemplate('t1')).toBe(false);
    });
  });
});
