// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

// Provides steamfitter's REAL PermissionDataService over stubbed "my
// permissions" endpoints, so gate tests run the production precedence logic
// (system permission, then the scenario or scenario-template claim) and cannot
// drift from it.

import { inject, Provider } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import {
  ScenarioPermissionClaim,
  ScenarioPermissionsService,
  ScenarioTemplatePermissionClaim,
  ScenarioTemplatePermissionsService,
  SystemPermission,
  SystemPermissionsService,
} from '../generated/steamfitter.api';
import { PermissionDataService } from '../data/permission/permission-data.service';
import { ApiStub } from './api-stub';

export interface PermissionGrants {
  system?: SystemPermission[];
  scenarios?: ScenarioPermissionClaim[];
  scenarioTemplates?: ScenarioTemplatePermissionClaim[];
}

export function permissionApiStubs(grants: PermissionGrants = {}) {
  return {
    systemPermissions: {
      getMySystemPermissions: vi.fn(() => of(grants.system ?? [])),
    } satisfies ApiStub<SystemPermissionsService>,
    scenarioPermissions: {
      getMyScenarioPermissions: vi.fn(() => of(grants.scenarios ?? [])),
    } satisfies ApiStub<ScenarioPermissionsService>,
    scenarioTemplatePermissions: {
      getMyScenarioTemplatePermissions: vi.fn(() =>
        of(grants.scenarioTemplates ?? []),
      ),
    } satisfies ApiStub<ScenarioTemplatePermissionsService>,
  };
}

export function permissionDataProviders(
  grants: PermissionGrants = {},
): Provider[] {
  const stubs = permissionApiStubs(grants);
  return [
    { provide: SystemPermissionsService, useValue: stubs.systemPermissions },
    {
      provide: ScenarioPermissionsService,
      useValue: stubs.scenarioPermissions,
    },
    {
      provide: ScenarioTemplatePermissionsService,
      useValue: stubs.scenarioTemplatePermissions,
    },
    {
      provide: PermissionDataService,
      // inject() resolves the stubs above (or a test's own override) with the
      // real types, so the partial stubs need no casts.
      useFactory: () => {
        const service = new PermissionDataService(
          inject(SystemPermissionsService),
          inject(ScenarioPermissionsService),
          inject(ScenarioTemplatePermissionsService),
        );
        // The stubs emit synchronously, so the service is loaded on return.
        // The app primes these from its route guards and list components;
        // `load()` and the claim loaders still work if the code under test
        // calls them again.
        service.load().subscribe();
        service.loadScenarioPermissions().subscribe();
        service.loadScenarioTemplatePermissions().subscribe();
        return service;
      },
    },
  ];
}
