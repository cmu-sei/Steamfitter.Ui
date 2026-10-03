// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Task } from 'src/app/generated/steamfitter.api';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { TaskStore } from './task.store';
import { TaskQuery } from './task.query';

function createState() {
  const store = new TaskStore();
  const query = new TaskQuery(store);
  return { store, query };
}

describe('TaskStore / TaskQuery', () => {
  /**
   * Verifies: a new task store starts with no active task, empty UI task lists, and the loading flag set.
   * Interacts with: TaskStore initial state via TaskQuery.getValue.
   * Data: a freshly constructed store.
   */
  it('starts with no active task and empty UI lists', () => {
    const { query } = createState();
    expect(query.getValue()).toMatchObject({
      active: null,
      loading: true,
      ui: {
        scenarioTemplateTaskList: [],
        scenarioTaskList: [],
        userTaskList: [],
      },
    });
    expect(query.getAll()).toEqual([]);
  });

  /**
   * Verifies: selectAll orders tasks by name ascending, per the @QueryConfig sort.
   * Interacts with: TaskQuery.selectAll.
   * Data: three tasks set out of name order.
   */
  it('selectAll returns tasks sorted by name', () => {
    const { store, query } = createState();
    store.set([
      { id: 'c', name: 'Gamma' },
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]);
    expect(query.getAll().map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  /**
   * Verifies: selectAllUserExecutable keeps only user-executable tasks of the given scenario and tracks changes.
   * Interacts with: TaskQuery.selectAllUserExecutable, TaskStore.update.
   * Data: a mix of executable/non-executable tasks across scenarios s1 and s2; one task later made executable.
   */
  it('selectAllUserExecutable filters by scenario and userExecutable', () => {
    const { store, query } = createState();
    const tasks: Task[] = [
      { id: '1', name: 'A', scenarioId: 's1', userExecutable: true },
      { id: '2', name: 'B', scenarioId: 's1', userExecutable: false },
      { id: '3', name: 'C', scenarioId: 's2', userExecutable: true },
    ];
    store.set(tasks);
    const seen = recordEmissions(query.selectAllUserExecutable('s1'));

    store.update('2', { userExecutable: true });

    expect(seen.map((list) => list.map((t) => t.id))).toEqual([
      ['1'],
      ['1', '2'],
    ]);
  });

  /**
   * Verifies: selectById emits the task, then status changes pushed into the store.
   * Interacts with: TaskQuery.selectById, TaskStore.upsert.
   * Data: task 't1' moving from pending to succeeded.
   */
  it('selectById follows the task through status changes', () => {
    const { store, query } = createState();
    store.set([{ id: 't1', name: 'T', status: 'pending' }]);
    const seen = recordEmissions(query.selectById('t1'));

    store.upsert('t1', { status: 'succeeded' });

    expect(seen.map((t) => t.status)).toEqual(['pending', 'succeeded']);
  });
});
