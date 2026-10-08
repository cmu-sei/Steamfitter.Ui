// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import {
  SystemPermission,
  User,
  UserService,
} from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { AdminUsersComponent } from './admin-users.component';

@Component({ selector: 'app-admin-user-list', template: '', standalone: false })
class UserListStubComponent {
  @Input() users?: User[];
  @Input() isLoading?: boolean;
  @Input() canEdit?: boolean;
  @Output() create = new EventEmitter<User>();
  @Output() delete = new EventEmitter<string>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

async function renderUsers(system: SystemPermission[]) {
  const userApi = {
    getUsers: vi.fn(() => of(structuredClone(USERS))),
    createUser: vi.fn((user: User) => of({ ...user })),
    deleteUser: vi.fn(() => of(null)),
  } satisfies ApiStub<UserService>;
  const rendered = await renderComponent(AdminUsersComponent, {
    declarations: [AdminUsersComponent, UserListStubComponent],
    providers: [
      ...permissionDataProviders({ system }),
      { provide: UserService, useValue: userApi },
    ],
  });
  const list = () =>
    rendered.fixture.debugElement.query(By.directive(UserListStubComponent))
      .componentInstance as UserListStubComponent;
  return { ...rendered, userApi, list };
}

describe('AdminUsersComponent', () => {
  /**
   * Verifies: the user list gets the loaded users and canEdit true for a user with ManageUsers.
   * Interacts with: real PermissionDataService.hasPermission(ManageUsers), real UserDataService and UserQuery over UserService.getUsers, the list stub.
   * Data: system ManageUsers; users Alice and Bob.
   */
  it('passes canEdit true and the users to the list with ManageUsers', async () => {
    const { list } = await renderUsers(['ManageUsers']);

    expect(list().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);
    expect(list().isLoading).toBe(false);
    expect(list().canEdit).toBe(true);
  });

  /**
   * Verifies: a user who can view but not manage users gets a read-only list (canEdit false).
   * Interacts with: real PermissionDataService.hasPermission(ManageUsers), the list stub's canEdit input.
   * Data: near miss: ViewUsers plus ManageRoles, without ManageUsers.
   */
  it('passes canEdit false to the list without ManageUsers', async () => {
    const { list } = await renderUsers(['ViewUsers', 'ManageRoles']);

    expect(list().canEdit).toBe(false);
  });

  /**
   * Verifies: a user created from the list is stored and handed back to the list.
   * Interacts with: the list's create output, real UserDataService.create, UserService.createUser stub.
   * Data: ManageUsers; the list emits a new user Carol.
   */
  it('adds a created user to the list', async () => {
    const { list, fixture, userApi } = await renderUsers(['ManageUsers']);

    list().create.emit({ id: 'u3', name: 'Carol' });
    fixture.detectChanges();

    expect(userApi.createUser).toHaveBeenCalledWith({
      id: 'u3',
      name: 'Carol',
    });
    expect(list().users?.map((u) => u.name)).toEqual(['Alice', 'Bob', 'Carol']);
  });

  /**
   * Verifies: a user deleted from the list is removed from the store and from the list.
   * Interacts with: the list's delete output, real UserDataService.delete, UserService.deleteUser stub.
   * Data: ManageUsers; the list emits Alice's id.
   */
  it('removes a deleted user from the list', async () => {
    const { list, fixture } = await renderUsers(['ManageUsers']);

    list().delete.emit('u1');
    fixture.detectChanges();

    expect(list().users?.map((u) => u.name)).toEqual(['Bob']);
  });
});
