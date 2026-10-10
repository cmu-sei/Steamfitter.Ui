// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { __stores__ } from '@datorama/akita';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { TaskStore } from 'src/app/data/task/task.store';
import { ResultStore } from './result.store';
import { ResultQuery } from './result.query';

describe('ResultStore / ResultQuery', () => {
  /**
   * Verifies: ResultStore registers under the Akita store name 'tasks', replacing TaskStore in the global registry.
   * Interacts with: Akita's __stores__ registry, TaskStore, ResultStore.
   * Data: one TaskStore constructed, then one ResultStore.
   */
  it('registers under the same store name as TaskStore', () => {
    const taskStore = new TaskStore();
    expect(__stores__['tasks']).toBe(taskStore);

    const resultStore = new ResultStore();

    expect(resultStore.storeName).toBe('tasks');
    expect(__stores__['tasks']).toBe(resultStore);
  });

  /**
   * Verifies: selectAll keeps insertion order, because the 'name' sort in @QueryConfig matches no Result field.
   * Interacts with: ResultQuery.selectAll.
   * Data: three results inserted in id order r3, r1, r2.
   */
  it('selectAll keeps insertion order', () => {
    const store = new ResultStore();
    const query = new ResultQuery(store);
    store.set([{ id: 'r3' }, { id: 'r1' }, { id: 'r2' }]);
    expect(query.getAll().map((r) => r.id)).toEqual(['r3', 'r1', 'r2']);
  });

  /**
   * Verifies: selectById emits the result and then its status updates.
   * Interacts with: ResultQuery.selectById, ResultStore.upsert.
   * Data: result 'r1' going from sent to succeeded.
   */
  it('selectById follows status updates', () => {
    const store = new ResultStore();
    const query = new ResultQuery(store);
    store.set([{ id: 'r1', status: 'sent' }]);
    const seen = recordEmissions(query.selectById('r1'));

    store.upsert('r1', { status: 'succeeded', actualOutput: 'ok' });

    expect(seen).toEqual([
      { id: 'r1', status: 'sent' },
      { id: 'r1', status: 'succeeded', actualOutput: 'ok' },
    ]);
  });
});
