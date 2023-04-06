// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from '@datorama/akita';
import {
  ScenarioTemplateState,
  ScenarioTemplateStore,
} from './scenario-template.store';
import { ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { Injectable } from '@angular/core';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class ScenarioTemplateQuery extends QueryEntity<ScenarioTemplateState> {
  constructor(protected store: ScenarioTemplateStore) {
    super(store);
  }

  selectById(id: string): Observable<ScenarioTemplate> {
    return this.selectEntity(id);
  }
}
