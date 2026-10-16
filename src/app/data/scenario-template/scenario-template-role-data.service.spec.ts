// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ScenarioTemplateRolesService } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { ScenarioTemplateRoleDataService } from './scenario-template-role-data.service';

describe('ScenarioTemplateRoleDataService', () => {
  /**
   * Verifies: loadRoles() fetches every template role and publishes them on scenarioTemplateRoles$.
   * Interacts with: ScenarioTemplateRolesService.getAllScenarioTemplateRoles stub.
   * Data: one editor role.
   */
  it('loadRoles() publishes the fetched roles', async () => {
    const roles = [
      {
        id: 'r1',
        name: 'Editor',
        permissions: ['EditScenarioTemplate' as const],
      },
    ];
    const api = {
      getAllScenarioTemplateRoles: vi.fn(() => of(roles)),
    } satisfies ApiStub<ScenarioTemplateRolesService>;
    TestBed.configureTestingModule({
      providers: getDefaultProviders([
        { provide: ScenarioTemplateRolesService, useValue: api },
      ]),
    });
    const service = TestBed.inject(ScenarioTemplateRoleDataService);

    expect(await firstValueFrom(service.scenarioTemplateRoles$)).toEqual([]);
    await firstValueFrom(service.loadRoles());
    expect(await firstValueFrom(service.scenarioTemplateRoles$)).toEqual(roles);
  });
});
