// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  SystemRole,
  SystemRolesService,
} from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { RoleDataService } from './role-data.service';

function setup(api?: ApiStub<SystemRolesService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      api
        ? { provide: SystemRolesService, useValue: api }
        : unstubbed(SystemRolesService),
    ]),
  });
  return TestBed.inject(RoleDataService);
}

describe('RoleDataService', () => {
  /**
   * Verifies: getRoles() publishes the system roles on roles$.
   * Interacts with: SystemRolesService.getAllSystemRoles stub.
   * Data: an immutable Administrator role and an Observer role.
   */
  it('getRoles() publishes the system roles', async () => {
    const roles: SystemRole[] = [
      {
        id: 'admin',
        name: 'Administrator',
        allPermissions: true,
        immutable: true,
      },
      { id: 'obs', name: 'Observer', permissions: ['ViewScenarios'] },
    ];
    const service = setup({ getAllSystemRoles: () => of(roles) });

    await firstValueFrom(service.getRoles());

    expect(await firstValueFrom(service.roles$)).toEqual(roles);
  });

  /**
   * Verifies: createRole() adds, editRole() merges the API result, and deleteRole() removes a role.
   * Interacts with: SystemRolesService.createSystemRole/updateSystemRole/deleteSystemRole stubs.
   * Data: role 'r1' created with ViewUsers, granted ManageUsers, then deleted.
   */
  it('create, edit and delete update the published roles', async () => {
    const api = {
      createSystemRole: vi.fn((r: SystemRole) => of({ ...r, id: 'r1' })),
      updateSystemRole: vi.fn((id: string, r: SystemRole) => of({ ...r, id })),
      deleteSystemRole: vi.fn(() => of(null)),
    } satisfies ApiStub<SystemRolesService>;
    const service = setup(api);
    const seen = recordEmissions(service.roles$);

    await firstValueFrom(
      service.createRole({ name: 'Ops', permissions: ['ViewUsers'] }),
    );
    await firstValueFrom(
      service.editRole({
        id: 'r1',
        name: 'Ops',
        permissions: ['ViewUsers', 'ManageUsers'],
      }),
    );
    await firstValueFrom(service.deleteRole('r1'));

    expect(api.updateSystemRole).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ name: 'Ops' }),
    );
    expect(seen.map((list) => list.map((r) => r.permissions))).toEqual([
      [],
      [['ViewUsers']],
      [['ViewUsers', 'ManageUsers']],
      [],
    ]);
  });
});
