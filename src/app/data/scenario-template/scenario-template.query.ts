// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from '@datorama/akita';
import {
  ScenarioTemplateState,
  ScenarioTemplateStore,
} from './scenario-template.store';
import { ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { Injectable, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class ScenarioTemplateQuery extends QueryEntity<ScenarioTemplateState> {
  protected store: ScenarioTemplateStore;

  constructor() {
    const store = inject(ScenarioTemplateStore);

    super(store);

    this.store = store;
  }

  selectById(id: string): Observable<ScenarioTemplate> {
    return this.selectEntity(id);
  }
}
