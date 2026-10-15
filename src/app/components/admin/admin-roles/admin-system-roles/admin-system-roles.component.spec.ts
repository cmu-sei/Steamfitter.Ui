// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  SystemPermission,
  SystemRole,
  SystemRolesService,
} from 'src/app/generated/steamfitter.api';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { AdminSystemRolesComponent } from './admin-system-roles.component';

const ROLES: SystemRole[] = [
  {
    id: 'r2',
    name: 'Observer',
    immutable: false,
    permissions: ['ViewScenarios'],
  },
  {
    id: 'r1',
    name: 'Administrator',
    immutable: true,
    allPermissions: true,
    permissions: [],
  },
];

async function renderRoles(system: SystemPermission[], confirmed = true) {
  const rolesApi = {
    getAllSystemRoles: vi.fn(() => of(structuredClone(ROLES))),
    updateSystemRole: vi.fn((id: string, role: SystemRole) =>
      of(structuredClone(role)),
    ),
    deleteSystemRole: vi.fn(() => of(null)),
  } satisfies ApiStub<SystemRolesService>;
  const signalR: Pick<SignalRService, 'startConnection'> = {
    startConnection: vi.fn(() => Promise.resolve()),
  };
  const confirm = vi.fn(
    () => dialogRefStub<unknown, boolean>(confirmed).dialogRef,
  );
  const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };
  const rendered = await renderComponent(AdminSystemRolesComponent, {
    declarations: [AdminSystemRolesComponent],
    imports: [
      MatTableModule,
      MatCheckboxModule,
      MatIconModule,
      MatButtonModule,
      MatTooltipModule,
    ],
    providers: [
      ...permissionDataProviders({ system }),
      { provide: SystemRolesService, useValue: rolesApi },
      { provide: SignalRService, useValue: signalR },
      { provide: CrucibleDialogService, useValue: dialogService },
      unstubbed(MatDialog),
    ],
  });
  const table = () => screen.getByRole('table');
  // Headers are found by their text, which is cheaper than role queries.
  const header = (role: string) =>
    within(table()).getByText(role).closest('th') as HTMLElement;
  const permissionsHeader = () => table().querySelector('th') as HTMLElement;
  const roleNames = () =>
    Array.from(table().querySelectorAll('th p')).map((p) =>
      p.textContent?.trim(),
    );
  // The checkbox for a permission in a role's column (Administrator first,
  // because immutable roles sort first). mat-checkbox renders a native input.
  const checkbox = (permission: string, column: number) => {
    const row = Array.from(table().querySelectorAll('tr')).find(
      (r) => r.querySelector('td')?.textContent?.trim() === permission,
    ) as HTMLElement;
    return row
      .querySelectorAll('td')
      [column].querySelector('input[type="checkbox"]') as HTMLInputElement;
  };
  return {
    ...rendered,
    rolesApi,
    confirm,
    header,
    permissionsHeader,
    roleNames,
    checkbox,
    user: userEvent.setup(),
  };
}

describe('AdminSystemRolesComponent', () => {
  /**
   * Verifies: with ManageRoles the user can add roles, rename and delete a mutable role, and toggle its permissions; the immutable role stays locked.
   * Interacts with: real PermissionDataService.hasPermission(ManageRoles), real RoleDataService over SystemRolesService.getAllSystemRoles.
   * Data: system ManageRoles; Administrator (immutable, all permissions) and Observer (ViewScenarios).
   */
  it('lets a role manager edit the mutable roles', async () => {
    const { permissionsHeader, header, checkbox } = await renderRoles([
      'ManageRoles',
    ]);

    expect(
      within(permissionsHeader()).getByRole('button', {
        description: 'Add New Role',
      }),
    ).toBeEnabled();
    expect(
      within(header('Observer')).getByRole('button', { name: 'Rename Role' }),
    ).toBeInTheDocument();
    expect(
      within(header('Observer')).getByRole('button', { name: 'Delete Role' }),
    ).toBeInTheDocument();
    expect(checkbox('ViewUsers', 2).disabled).toBe(false);
    expect(checkbox('All', 1).disabled).toBe(true);
  });

  /**
   * Verifies: a user who can view but not manage roles gets no rename or delete buttons, a disabled Add button, and disabled checkboxes.
   * Interacts with: real PermissionDataService.hasPermission(ManageRoles).
   * Data: near miss: ViewRoles plus ManageUsers, without ManageRoles.
   */
  it('makes the roles read-only without ManageRoles', async () => {
    const { permissionsHeader, header, checkbox } = await renderRoles([
      'ViewRoles',
      'ManageUsers',
    ]);

    expect(
      within(permissionsHeader()).getByRole('button', {
        description: 'Add New Role',
      }),
    ).toBeDisabled();
    expect(
      within(header('Observer')).queryByRole('button', { name: 'Rename Role' }),
    ).not.toBeInTheDocument();
    expect(
      within(header('Observer')).queryByRole('button', { name: 'Delete Role' }),
    ).not.toBeInTheDocument();
    expect(checkbox('ViewUsers', 2).disabled).toBe(true);
    expect(checkbox('ViewScenarios', 2).disabled).toBe(true);
  });

  /**
   * Verifies: checking a permission for a role saves the role and shows the box checked.
   * Interacts with: the checkbox change handler, real RoleDataService.editRole, SystemRolesService.updateSystemRole stub.
   * Data: ManageRoles; ViewUsers is checked for Observer.
   */
  it('adds a permission to a role when its box is checked', async () => {
    const { user, checkbox, rolesApi } = await renderRoles(['ManageRoles']);

    await user.click(checkbox('ViewUsers', 2));

    expect(rolesApi.updateSystemRole).toHaveBeenCalledWith(
      'r2',
      expect.objectContaining({
        permissions: ['ViewScenarios', 'ViewUsers'],
      }),
    );
    expect(checkbox('ViewUsers', 2).checked).toBe(true);
  });

  /**
   * Verifies: confirming Delete Role removes the role's column.
   * Interacts with: CrucibleDialogService.confirm stub, real RoleDataService.deleteRole, SystemRolesService.deleteSystemRole stub.
   * Data: ManageRoles; the user confirms deleting Observer.
   */
  it('deletes a role after confirmation', async () => {
    const { user, header, roleNames, rolesApi } = await renderRoles([
      'ManageRoles',
    ]);

    await user.click(
      within(header('Observer')).getByRole('button', { name: 'Delete Role' }),
    );

    expect(rolesApi.deleteSystemRole).toHaveBeenCalledWith('r2');
    expect(roleNames()).toEqual(['Administrator']);
  });
});
