// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { ScenarioStore } from './scenario.store';
import { ScenarioQuery } from './scenario.query';

function createState() {
  const store = new ScenarioStore();
  const query = new ScenarioQuery(store);
  return { store, query };
}

describe('ScenarioStore / ScenarioQuery', () => {
  /**
   * Verifies: the patched Akita ESM loads under Vitest and a real store feeds a real query.
   * Interacts with: ScenarioStore, ScenarioQuery.
   * Data: one scenario set into a fresh store.
   */
  it('loads Akita and round-trips an entity through store and query', () => {
    const { store, query } = createState();
    store.set([{ id: 's1', name: 'Alpha' }]);
    expect(query.getAll()).toEqual([{ id: 's1', name: 'Alpha' }]);
  });

  /**
   * Verifies: a new store reports loading until the first set(), which clears it.
   * Interacts with: ScenarioStore.set, ScenarioQuery.selectLoading.
   * Data: an empty set() on a fresh store.
   */
  it('starts in the loading state and clears it on the first set()', () => {
    const { store, query } = createState();
    const loading = recordEmissions(query.selectLoading());
    store.set([]);
    expect(loading).toEqual([true, false]);
  });

  /**
   * Verifies: selectAll orders scenarios by name ascending, per the @QueryConfig sort.
   * Interacts with: ScenarioQuery.selectAll.
   * Data: three scenarios added out of name order.
   */
  it('selectAll returns scenarios sorted by name', () => {
    const { store, query } = createState();
    store.set([
      { id: '3', name: 'Charlie' },
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Bravo' },
    ]);
    expect(query.getAll().map((s) => s.name)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ]);
  });

  /**
   * Verifies: selectById emits the current entity, then each update, and undefined once removed.
   * Interacts with: ScenarioQuery.selectById, ScenarioStore.update/remove.
   * Data: one scenario renamed and then removed.
   */
  it('selectById follows an entity through update and removal', () => {
    const { store, query } = createState();
    store.set([{ id: 's1', name: 'Before' }]);
    const seen = recordEmissions(query.selectById('s1'));

    store.update('s1', { name: 'After' });
    store.remove('s1');

    expect(seen).toEqual([
      { id: 's1', name: 'Before' },
      { id: 's1', name: 'After' },
      undefined,
    ]);
  });

  /**
   * Verifies: selectByViewId returns only scenarios for that view and re-emits as matching scenarios arrive.
   * Interacts with: ScenarioQuery.selectByViewId, ScenarioStore.add.
   * Data: scenarios split across views v1 and v2.
   */
  it('selectByViewId filters to the requested view', () => {
    const { store, query } = createState();
    const scenarios: Scenario[] = [
      { id: 'a', name: 'A', viewId: 'v1' },
      { id: 'b', name: 'B', viewId: 'v2' },
    ];
    store.set(scenarios);
    const seen = recordEmissions(query.selectByViewId('v1'));

    store.add({ id: 'c', name: 'C', viewId: 'v1' });

    expect(seen.map((list) => list.map((s) => s.id))).toEqual([
      ['a'],
      ['a', 'c'],
    ]);
  });
});
