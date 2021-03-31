// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, QueryConfig, QueryEntity } from '@datorama/akita';
import { ScenarioState, ScenarioStore } from './scenario.store';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class ScenarioQuery extends QueryEntity<ScenarioState> {
  constructor(protected store: ScenarioStore) {
    super(store);
  }

  selectById(id: string): Observable<Scenario> {
    return this.selectEntity(id);
  }

  selectByViewId(viewId: string): Observable<Scenario[]> {
    return this.selectAll({ filterBy: (x) => x.viewId === viewId });
  }
}
