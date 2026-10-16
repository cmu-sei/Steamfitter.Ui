// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { ScenarioTemplateStore } from './scenario-template.store';
import { ScenarioTemplateQuery } from './scenario-template.query';

function createState() {
  const store = new ScenarioTemplateStore();
  const query = new ScenarioTemplateQuery(store);
  return { store, query };
}

describe('ScenarioTemplateStore / ScenarioTemplateQuery', () => {
  /**
   * Verifies: selectAll orders templates by name ascending, per the @QueryConfig sort.
   * Interacts with: ScenarioTemplateQuery.selectAll.
   * Data: three templates set out of name order.
   */
  it('selectAll returns templates sorted by name', () => {
    const { store, query } = createState();
    store.set([
      { id: '2', name: 'Bravo' },
      { id: '3', name: 'Charlie' },
      { id: '1', name: 'Alpha' },
    ]);
    const seen = recordEmissions(query.selectAll());
    expect(seen[0].map((t) => t.id)).toEqual(['1', '2', '3']);
  });

  /**
   * Verifies: selectById emits the current template and then each change to it.
   * Interacts with: ScenarioTemplateQuery.selectById, ScenarioTemplateStore.upsert.
   * Data: template 't1' upserted with a new description.
   */
  it('selectById follows upserts of the template', () => {
    const { store, query } = createState();
    store.set([{ id: 't1', name: 'Template', description: 'old' }]);
    const seen = recordEmissions(query.selectById('t1'));

    store.upsert('t1', { description: 'new' });

    expect(seen.map((t) => t.description)).toEqual(['old', 'new']);
  });
});
