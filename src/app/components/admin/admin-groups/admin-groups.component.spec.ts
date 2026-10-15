// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  Group,
  GroupService,
  SystemPermission,
  User,
  UserService,
} from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { NameDialogComponent } from '../../shared/name-dialog/name-dialog.component';
import { AdminGroupsComponent } from './admin-groups.component';

@Component({
  selector: 'app-admin-groups-detail',
  template: '',
  standalone: false,
})
class GroupDetailStubComponent {
  @Input() groupId?: string;
  @Input() canEdit?: boolean;
}

const GROUPS: Group[] = [
  { id: 'g1', name: 'Blue Team' },
  { id: 'g2', name: 'Red Team' },
];

async function renderGroups(
  overrides: {
    system?: SystemPermission[];
    confirmed?: boolean;
    renamedTo?: string;
  } = {},
) {
  const { system = [], confirmed = true } = overrides;
  const groupApi = {
    getAllGroups: vi.fn(() => of(structuredClone(GROUPS))),
    deleteGroup: vi.fn(() => of(null)),
    updateGroup: vi.fn((id: string, group: Group) => of({ ...group })),
    createGroup: vi.fn((group: Group) => of<Group>({ ...group, id: 'g3' })),
  } satisfies ApiStub<GroupService>;
  const userApi = {
    getUsers: vi.fn(() => of<User[]>([])),
  } satisfies ApiStub<UserService>;
  const confirm = vi.fn(
    () => dialogRefStub<unknown, boolean>(confirmed).dialogRef,
  );
  const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };
  // The name dialog closes with the edited name, as NameDialogComponent does.
  const open = vi.fn(() => {
    const { dialogRef } = dialogRefStub<NameDialogComponent, object>(
      overrides.renamedTo === undefined
        ? undefined
        : { nameValue: overrides.renamedTo },
    );
    // The component sets the dialog's title and message, nothing else.
    const instance: Pick<NameDialogComponent, 'title' | 'message'> = {
      title: '',
      message: '',
    };
    dialogRef.componentInstance = instance as NameDialogComponent;
    return dialogRef;
  });
  const dialog: Pick<MatDialog, 'open'> = { open };

  const rendered = await renderComponent(AdminGroupsComponent, {
    declarations: [AdminGroupsComponent, GroupDetailStubComponent],
    imports: [
      MatTableModule,
      MatSortModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      MatButtonModule,
      MatTooltipModule,
    ],
    providers: [
      ...permissionDataProviders({ system }),
      { provide: GroupService, useValue: groupApi },
      { provide: UserService, useValue: userApi },
      { provide: CrucibleDialogService, useValue: dialogService },
      { provide: MatDialog, useValue: dialog },
    ],
  });
  const user = userEvent.setup();
  const table = () => screen.getByRole('table');
  // Rows are found by their text: a role query with a name computes the
  // accessible name of every row, which is slow on Material tables.
  const row = (name: string) =>
    within(table()).getByText(name).closest('tr') as HTMLElement;
  // The icon buttons are named only by their tooltips (aria-describedby).
  const button = (scope: HTMLElement, tooltip: string) =>
    within(scope).getByRole('button', { description: tooltip });
  const groupNames = () =>
    Array.from(table().querySelectorAll('tr.element-row')).map((r) =>
      r.textContent?.trim(),
    );
  const header = () => table().querySelector('th') as HTMLElement;
  const detail = () =>
    rendered.fixture.debugElement.query(By.directive(GroupDetailStubComponent))
      ?.componentInstance as GroupDetailStubComponent | undefined;
  return {
    ...rendered,
    user,
    groupApi,
    confirm,
    header,
    row,
    button,
    groupNames,
    detail,
  };
}

describe('AdminGroupsComponent', () => {
  /**
   * Verifies: Add, Rename and Delete are enabled for a user with ManageGroups.
   * Interacts with: real PermissionDataService.hasPermission(ManageGroups) via permissionDataProviders.
   * Data: system ManageGroups; groups Blue Team and Red Team.
   */
  it('enables Add, Rename and Delete with ManageGroups', async () => {
    const { header, row, button } = await renderGroups({
      system: ['ManageGroups'],
    });

    expect(button(header(), 'Add New Group')).toBeEnabled();
    expect(button(row('Blue Team'), 'Rename')).toBeEnabled();
    expect(button(row('Blue Team'), 'Delete Blue Team')).toBeEnabled();
  });

  /**
   * Verifies: a user who can view but not manage groups sees Add, Rename and Delete disabled.
   * Interacts with: real PermissionDataService.hasPermission(ManageGroups).
   * Data: near miss: ViewGroups plus ManageUsers, without ManageGroups.
   */
  it('disables Add, Rename and Delete without ManageGroups', async () => {
    const { header, row, button } = await renderGroups({
      system: ['ViewGroups', 'ManageUsers'],
    });

    expect(button(header(), 'Add New Group')).toBeDisabled();
    expect(button(row('Red Team'), 'Rename')).toBeDisabled();
    expect(button(row('Red Team'), 'Delete Red Team')).toBeDisabled();
  });

  /**
   * Verifies: expanding a group passes canEdit to its detail panel, true with ManageGroups and false with only ViewGroups.
   * Interacts with: the row click toggle, the detail stub's canEdit input.
   * Data: each row pairs system permissions with the expected canEdit; Blue Team is clicked.
   */
  it.each([
    { system: ['ManageGroups'], canEdit: true },
    { system: ['ViewGroups'], canEdit: false },
  ] as Array<{ system: SystemPermission[]; canEdit: boolean }>)(
    'passes canEdit $canEdit to the expanded group for $system',
    async ({ system, canEdit }) => {
      const { user, row, detail } = await renderGroups({ system });

      await user.click(row('Blue Team'));

      expect(detail()?.groupId).toBe('g1');
      expect(detail()?.canEdit).toBe(canEdit);
    },
  );

  /**
   * Verifies: confirming Delete removes the group from the table.
   * Interacts with: CrucibleDialogService.confirm stub, real GroupDataService.delete, GroupService.deleteGroup stub.
   * Data: ManageGroups; the user confirms deleting Red Team.
   */
  it('deletes a group after confirmation', async () => {
    const { user, row, button, groupNames, groupApi } = await renderGroups({
      system: ['ManageGroups'],
    });

    await user.click(button(row('Red Team'), 'Delete Red Team'));

    expect(groupApi.deleteGroup).toHaveBeenCalledWith('g2');
    expect(groupNames()).toEqual(['Blue Team']);
  });

  /**
   * Verifies: renaming a group through the name dialog shows the new name in the table.
   * Interacts with: MatDialog.open stub (closes with the new name), real GroupDataService.edit, GroupService.updateGroup stub.
   * Data: ManageGroups; Blue Team is renamed to Green Team.
   */
  it('renames a group from the name dialog', async () => {
    const { user, row, button, groupNames } = await renderGroups({
      system: ['ManageGroups'],
      renamedTo: 'Green Team',
    });

    await user.click(button(row('Blue Team'), 'Rename'));

    expect(groupNames()).toEqual(['Green Team', 'Red Team']);
  });
});
