// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, NEVER, Observable, of, throwError } from 'rxjs';
import { ComnAuthService, Theme } from '@cmusei/crucible-common';
import { User, UserService } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { UserDataService } from './user-data.service';
import { CurrentUserQuery, UserQuery } from './user.query';
import { CurrentUserStore, UserStore } from './user.store';

type OidcUser =
  ComnAuthService['user$'] extends Observable<infer U> ? U : never;

function setup(
  options: {
    userApi?: ApiStub<UserService>;
    authUser$?: Observable<OidcUser>;
  } = {},
) {
  const auth: Pick<ComnAuthService, 'user$'> = {
    // NEVER by default: no signed-in user unless a test supplies one.
    user$: options.authUser$ ?? NEVER,
  };
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      options.userApi
        ? { provide: UserService, useValue: options.userApi }
        : unstubbed(UserService),
      { provide: ComnAuthService, useValue: auth },
    ]),
  });
  return {
    service: TestBed.inject(UserDataService),
    store: TestBed.inject(UserStore),
    query: TestBed.inject(UserQuery),
    currentUserQuery: TestBed.inject(CurrentUserQuery),
    currentUserStore: TestBed.inject(CurrentUserStore),
  };
}

describe('UserDataService', () => {
  /**
   * Verifies: load() marks loading immediately, then on subscription stores the users and clears loading.
   * Interacts with: UserService.getUsers stub, UserQuery.
   * Data: two users; the returned observable is subscribed after the loading check.
   */
  it('load() sets loading at once and stores users when subscribed', async () => {
    const userApi = {
      getUsers: vi.fn(() =>
        of<User[]>([
          { id: 'u1', name: 'Ada' },
          { id: 'u2', name: 'Grace' },
        ]),
      ),
    } satisfies ApiStub<UserService>;
    const { service, store, query } = setup({ userApi });
    store.setLoading(false);

    const pending = service.load();
    expect(query.getValue().loading).toBe(true);

    await firstValueFrom(pending);
    expect(query.getAll().map((u) => u.id)).toEqual(['u1', 'u2']);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: loadById() upserts the fetched user without dropping others.
   * Interacts with: UserService.getUser stub, UserQuery.
   * Data: an existing user 'u1'; 'u2' fetched.
   */
  it('loadById() upserts the fetched user', async () => {
    const { service, store, query } = setup({
      userApi: { getUser: (id: string) => of({ id, name: 'Fetched' }) },
    });
    store.set([{ id: 'u1', name: 'Ada' }]);

    await firstValueFrom(service.loadById('u2'));

    expect(query.getAll().map((u) => u.name)).toEqual(['Ada', 'Fetched']);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: a failed load() or loadById() passes the error to the caller and leaves loading set.
   * Interacts with: UserService.getUsers/getUser stubs returning an error, UserQuery.
   * Data: one row per method; the API fails with 'boom'.
   */
  it.each([
    {
      method: 'load',
      userApi: { getUsers: () => throwError(() => new Error('boom')) },
      call: (service: UserDataService): Observable<unknown> => service.load(),
    },
    {
      method: 'loadById',
      userApi: { getUser: () => throwError(() => new Error('boom')) },
      call: (service: UserDataService): Observable<unknown> =>
        service.loadById('u1'),
    },
  ] satisfies Array<{
    method: string;
    userApi: ApiStub<UserService>;
    call: (service: UserDataService) => Observable<unknown>;
  }>)(
    '$method() leaves loading set when the request fails',
    async ({ userApi, call }) => {
      const { service, query } = setup({ userApi });

      await expect(firstValueFrom(call(service))).rejects.toThrow('boom');

      expect(query.getValue().loading).toBe(true);
    },
  );

  /**
   * Verifies: create() adds the created user with the initial UI state.
   * Interacts with: UserService.createUser stub, UserQuery and its UI query.
   * Data: the API creates user 'u3'.
   */
  it('create() adds the user with initial UI state', async () => {
    const { service, query } = setup({
      userApi: { createUser: (u: User) => of({ ...u, id: 'u3' }) },
    });

    await firstValueFrom(service.create({ name: 'Linus' }));

    expect(query.getEntity('u3').name).toBe('Linus');
    expect(query.ui.getEntity('u3')).toMatchObject({
      isSelected: false,
      isEditing: false,
    });
  });

  /**
   * Verifies: update() sends the change but leaves the stored user unchanged, because it re-adds an existing id.
   * Interacts with: UserService.updateUser stub, UserQuery.
   * Data: stored user 'u1' named 'Ada'; the API returns the rename to 'Ada L.'.
   */
  it('update() calls the API but does not change the stored user', () => {
    const userApi = {
      updateUser: vi.fn((id: string, u: User) => of({ ...u, id })),
    } satisfies ApiStub<UserService>;
    const { service, store, query } = setup({ userApi });
    store.set([{ id: 'u1', name: 'Ada', roleId: 'old-role' }]);

    service.update({ id: 'u1', name: 'Ada L.', roleId: 'new-role' });

    expect(userApi.updateUser).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ roleId: 'new-role' }),
    );
    expect(query.getEntity('u1')).toMatchObject({
      name: 'Ada',
      roleId: 'old-role',
    });
  });

  /**
   * Verifies: a failed update() lets the API error escape unhandled (current behavior).
   * Interacts with: UserService.updateUser stub returning an error, captureUnhandledRxErrors.
   * Data: stored user 'u1'; the API fails with 'boom'.
   */
  it('update() lets the API error escape unhandled', async () => {
    const errors = captureUnhandledRxErrors();
    const { service, store } = setup({
      userApi: { updateUser: () => throwError(() => new Error('boom')) },
    });
    store.set([{ id: 'u1', name: 'Ada' }]);

    service.update({ id: 'u1', name: 'Ada L.' });
    await flush();

    expect(errors).toEqual([new Error('boom')]);
  });

  /**
   * Verifies: delete() removes the user and its UI entity.
   * Interacts with: UserService.deleteUser stub, UserQuery and its UI query.
   * Data: users 'u1' and 'u2'; 'u1' deleted.
   */
  it('delete() removes the user and its UI state', async () => {
    const userApi = {
      deleteUser: vi.fn(() => of(null)),
    } satisfies ApiStub<UserService>;
    const { service, store, query } = setup({ userApi });
    store.set([
      { id: 'u1', name: 'Ada' },
      { id: 'u2', name: 'Grace' },
    ]);

    await firstValueFrom(service.delete('u1'));

    expect(userApi.deleteUser).toHaveBeenCalledWith('u1');
    expect(query.getAll().map((u) => u.id)).toEqual(['u2']);
    expect(query.ui.hasEntity('u1')).toBe(false);
  });

  /**
   * Verifies: setActive() sets the active user in both the entity store and its UI store.
   * Interacts with: UserDataService.setActive, UserQuery.getActiveId and ui.getActiveId.
   * Data: two users; 'u2' made active.
   */
  it('setActive() activates the user in the store and the UI store', () => {
    const { service, store, query } = setup();
    store.set([
      { id: 'u1', name: 'Ada' },
      { id: 'u2', name: 'Grace' },
    ]);

    service.setActive('u2');

    expect(query.getActiveId()).toBe('u2');
    expect(query.ui.getActiveId()).toBe('u2');
  });

  /**
   * Verifies: setCurrentUser() copies the signed-in user's name and subject into the current-user store.
   * Interacts with: ComnAuthService.user$ stub, CurrentUserQuery.
   * Data: an OIDC user with profile name 'Ada' and sub 'u1'.
   */
  it('setCurrentUser() copies the signed-in user into the current-user store', () => {
    const signedIn = { profile: { name: 'Ada', sub: 'u1' } } as OidcUser;
    const { service, currentUserQuery } = setup({ authUser$: of(signedIn) });

    service.setCurrentUser();

    expect(currentUserQuery.getValue()).toMatchObject({
      name: 'Ada',
      id: 'u1',
    });
  });

  /**
   * Verifies: setCurrentUser() blanks the current user and ignores a null user from the auth service.
   * Interacts with: ComnAuthService.user$ stub, CurrentUserQuery.
   * Data: a stored current user, then a null auth user.
   */
  it('setCurrentUser() blanks the current user until one signs in', () => {
    const { service, currentUserQuery, currentUserStore } = setup({
      authUser$: of(null),
    });
    currentUserStore.update({ name: 'Old', id: 'x' });
    service.setUserTheme(Theme.DARK);
    expect(currentUserQuery.getValue()).toMatchObject({ name: 'Old', id: 'x' });

    service.setCurrentUser();

    expect(currentUserQuery.getValue()).toMatchObject({
      name: '',
      id: '',
      theme: Theme.DARK,
    });
  });
});
