// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import {
  Directive,
  inject,
  Input,
  provideEnvironmentInitializer,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  SystemRole,
  SystemRolesService,
  User,
  UserService,
} from 'src/app/generated/steamfitter.api';
import { UserQuery } from 'src/app/data/user/user.query';
import { UserStore } from 'src/app/data/user/user.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminUserListComponent } from './admin-user-list.component';

@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice', roleId: 'r1' },
  { id: 'u2', name: 'Bob' },
];

async function renderUserList(canEdit: boolean) {
  const rolesApi = {
    getAllSystemRoles: vi.fn(() =>
      of<SystemRole[]>([
        { id: 'r1', name: 'Observer' },
        { id: 'r2', name: 'Content Developer' },
      ]),
    ),
  } satisfies ApiStub<SystemRolesService>;
  const userApi = {
    updateUser: vi.fn((id: string, body: User) => of({ ...body })),
  } satisfies ApiStub<UserService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };
  const rendered = await renderComponent(AdminUserListComponent, {
    declarations: [AdminUserListComponent, ClipboardStubDirective],
    imports: [
      MatTableModule,
      MatSortModule,
      MatPaginatorModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatIconModule,
      MatButtonModule,
      MatTooltipModule,
      MatCardModule,
      MatProgressSpinnerModule,
    ],
    providers: [
      { provide: SystemRolesService, useValue: rolesApi },
      { provide: CrucibleDialogService, useValue: dialogService },
      { provide: UserService, useValue: userApi },
      // AdminUsersComponent loads the same users into the store first.
      provideEnvironmentInitializer(() =>
        inject(UserStore).set(structuredClone(USERS)),
      ),
    ],
    inputs: { users: USERS, isLoading: false, canEdit },
  });
  const created = vi.fn();
  const deleted = vi.fn();
  rendered.fixture.componentInstance.create.subscribe(created);
  rendered.fixture.componentInstance.delete.subscribe(deleted);
  const table = () => screen.getByRole('table');
  // Rows are found by their text: a role query with a name computes the
  // accessible name of every row, which is slow on Material tables.
  const row = (name: string) =>
    within(table()).getByText(name).closest('tr') as HTMLElement;
  return {
    ...rendered,
    user: userEvent.setup(),
    userApi,
    confirm,
    created,
    deleted,
    table,
    row,
  };
}

describe('AdminUserListComponent', () => {
  /**
   * Verifies: with canEdit true a user manager picks another role, which is sent to the API; the stored user keeps its old role.
   * Interacts with: the role mat-select, real UserDataService.update, UserService.updateUser stub, real UserStore and UserQuery.
   * Data: users Alice (Observer) and Bob in the store; canEdit true; Alice's role is changed to Content Developer.
   */
  it('sends a changed role to the API', async () => {
    const { user, row, userApi } = await renderUserList(true);
    const select = within(row('Alice')).getByRole('combobox');
    expect(select).toHaveAttribute('aria-disabled', 'false');

    // MatSelect opens from its trigger element, inside the combobox host.
    await user.click(select.querySelector('.mat-mdc-select-trigger')!);
    await user.click(screen.getByRole('option', { name: 'Content Developer' }));

    expect(userApi.updateUser).toHaveBeenCalledWith('u1', {
      id: 'u1',
      name: 'Alice',
      roleId: 'r2',
    });
    // Same case as 'update() calls the API but does not change the stored user' in user-data.service.spec.ts.
    expect(TestBed.inject(UserQuery).getEntity('u1')?.roleId).toBe('r1');
  });

  /**
   * Verifies: with canEdit true each user has a Delete User button, and a confirmed delete emits the user id.
   * Interacts with: CrucibleDialogService.confirm stub, the delete output.
   * Data: users Alice (role Observer) and Bob; canEdit true; Bob is deleted and the user confirms.
   */
  it('deletes a user after confirmation', async () => {
    const { user, row, deleted, confirm } = await renderUserList(true);

    await user.click(
      within(row('Bob')).getByRole('button', { name: 'Delete User' }),
    );

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete Bob?' }),
    );
    expect(deleted.mock.calls).toEqual([['u2']]);
  });

  /**
   * Verifies: with canEdit false the role selects are disabled and no Delete User button is rendered.
   * Interacts with: the role cell's canEdit bindings.
   * Data: the same users; canEdit false.
   */
  it('hides Delete User and disables the role select without canEdit', async () => {
    const { row, table } = await renderUserList(false);

    expect(within(row('Alice')).getByRole('combobox')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      within(table()).queryByRole('button', { name: 'Delete User' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: the Add User button and the new-user form are offered whether or not the user can edit (current behavior).
   * Interacts with: the ID column header's Add User button and the new-user form.
   * Data: canEdit false; Add User is clicked.
   */
  it('offers Add User without canEdit', async () => {
    const { user, table } = await renderUserList(false);

    const add = within(table()).getByRole('button', { name: 'Add User' });

    // Current behavior; see agent-docs/ui-test-bugs/steamfitter.ui.md.
    expect(add).toBeEnabled();
    await user.click(add);
    expect(screen.getByPlaceholderText('User ID')).toBeInTheDocument();
  });

  /**
   * Verifies: filling in the new-user form and confirming emits the new user and closes the form.
   * Interacts with: the new-user row's inputs and its add button, the create output.
   * Data: canEdit true; ID 'u3' and name 'Carol'.
   */
  it('emits a new user from the new-user form', async () => {
    const { user, table, created } = await renderUserList(true);
    await user.click(within(table()).getByRole('button', { name: 'Add User' }));

    const id = screen.getByPlaceholderText('User ID');
    id.focus();
    await user.type(id, 'u3', { skipClick: true });
    const name = screen.getByPlaceholderText('User Name');
    name.focus();
    await user.type(name, 'Carol', { skipClick: true });
    const form = id.closest('.new-user-row') as HTMLElement;
    await user.click(within(form).getAllByRole('button')[0]);

    expect(created.mock.calls).toEqual([[{ id: 'u3', name: 'Carol' }]]);
    expect(screen.queryByPlaceholderText('User ID')).not.toBeInTheDocument();
  });
});
