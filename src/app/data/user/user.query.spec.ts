// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Theme } from '@cmusei/crucible-common';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { CurrentUserStore, UserStore } from './user.store';
import { CurrentUserQuery, UserQuery } from './user.query';

function createUsers() {
  const store = new UserStore();
  const query = new UserQuery(store);
  return { store, query };
}

describe('UserStore / UserQuery', () => {
  /**
   * Verifies: every user set into the store gets the initial UI state in the entity UI store.
   * Interacts with: UserStore.set, UserQuery.ui.getEntity.
   * Data: two users.
   */
  it('gives each user the initial UI state', () => {
    const { store, query } = createUsers();
    store.set([
      { id: 'u1', name: 'Ada' },
      { id: 'u2', name: 'Grace' },
    ]);
    expect(query.ui.getEntity('u1')).toEqual({
      id: 'u1',
      isSelected: false,
      isEditing: false,
      isSaved: false,
    });
    expect(query.ui.getCount()).toBe(2);
  });

  /**
   * Verifies: UI state updates show through query.ui, and a later set() resets them to the initial state.
   * Interacts with: UserStore.ui.update, UserStore.set, UserQuery.ui.selectEntity.
   * Data: user 'u1' marked selected, then the user list reloaded.
   */
  it('tracks UI state per user and resets it when the list is set again', () => {
    const { store, query } = createUsers();
    store.set([{ id: 'u1', name: 'Ada' }]);
    const ui = recordEmissions(query.ui.selectEntity('u1'));

    store.ui.update('u1', { isSelected: true });
    store.set([{ id: 'u1', name: 'Ada' }]);

    expect(ui.map((u) => u.isSelected)).toEqual([false, true, false]);
  });

  /**
   * Verifies: users added later get the initial UI state, and removing a user removes its UI entity.
   * Interacts with: UserStore.add/remove, UserQuery.ui.
   * Data: user 'u2' added to a store holding 'u1', then removed.
   */
  it('creates and removes UI entities with their users', () => {
    const { store, query } = createUsers();
    store.set([{ id: 'u1', name: 'Ada' }]);

    store.add({ id: 'u2', name: 'Grace' });
    expect(query.ui.getEntity('u2')?.isEditing).toBe(false);

    store.remove('u2');
    expect(query.ui.hasEntity('u2')).toBe(false);
  });

  /**
   * Verifies: users sort by name, isLoading$ follows the store's loading flag, and selectByUserId tracks one user.
   * Interacts with: UserQuery.selectAll, isLoading$, selectByUserId.
   * Data: two users set out of order, then one renamed.
   */
  it('sorts by name and exposes loading and per-user selection', () => {
    const { store, query } = createUsers();
    const loading = recordEmissions(query.isLoading$);
    store.set([
      { id: 'u2', name: 'Grace' },
      { id: 'u1', name: 'Ada' },
    ]);
    const user = recordEmissions(query.selectByUserId('u2'));

    store.update('u2', { name: 'Grace H.' });

    expect(query.getAll().map((u) => u.id)).toEqual(['u1', 'u2']);
    expect(loading).toEqual([true, false]);
    expect(user.map((u) => u.name)).toEqual(['Grace', 'Grace H.']);
  });
});

describe('CurrentUserStore / CurrentUserQuery', () => {
  /**
   * Verifies: the current-user store starts empty with the light theme, and userTheme$ follows theme changes.
   * Interacts with: CurrentUserStore.update, CurrentUserQuery.userTheme$.
   * Data: a theme switch to dark.
   */
  it('starts with the light theme and emits theme changes', () => {
    const store = new CurrentUserStore();
    const query = new CurrentUserQuery(store);
    const themes = recordEmissions(query.userTheme$);

    store.update({ theme: Theme.DARK });

    expect(query.getValue()).toMatchObject({ name: '', id: '', lastRoute: '' });
    expect(themes).toEqual([Theme.LIGHT, Theme.DARK]);
  });

  /**
   * Verifies: getLastRoute() falls back to '/' until a route is stored.
   * Interacts with: CurrentUserQuery.getLastRoute, CurrentUserStore.update.
   * Data: no route, then '/admin'.
   */
  it('getLastRoute() defaults to the root route', () => {
    const store = new CurrentUserStore();
    const query = new CurrentUserQuery(store);
    expect(query.getLastRoute()).toBe('/');

    store.update({ lastRoute: '/admin' });
    expect(query.getLastRoute()).toBe('/admin');
  });
});
