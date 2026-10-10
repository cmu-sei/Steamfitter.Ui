// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ScenarioRolesService } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { ScenarioRoleDataService } from './scenario-role-data.service';

const roles = [
  { id: 'r1', name: 'Observer', permissions: ['ViewScenario' as const] },
  { id: 'r2', name: 'Manager', allPermissions: true },
];

// scenario-role.service.ts (ScenarioRoleService) is an unused copy of this
// service, so it is not covered separately.
describe('ScenarioRoleDataService', () => {
  /**
   * Verifies: loadRoles() fetches every scenario role and publishes them on scenarioRoles$.
   * Interacts with: ScenarioRolesService.getAllScenarioRoles stub.
   * Data: two scenario roles.
   */
  it('loadRoles() publishes the fetched roles', async () => {
    const api = {
      getAllScenarioRoles: vi.fn(() => of(roles)),
    } satisfies ApiStub<ScenarioRolesService>;
    TestBed.configureTestingModule({
      providers: getDefaultProviders([
        { provide: ScenarioRolesService, useValue: api },
      ]),
    });
    const service = TestBed.inject(ScenarioRoleDataService);

    expect(await firstValueFrom(service.scenarioRoles$)).toEqual([]);
    expect(await firstValueFrom(service.loadRoles())).toEqual(roles);
    expect(await firstValueFrom(service.scenarioRoles$)).toEqual(roles);
  });
});
