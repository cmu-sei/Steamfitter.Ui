// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { Injectable } from '@angular/core';

export interface ScenarioState extends EntityState<Scenario> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'scenarios' })
export class ScenarioStore extends EntityStore<ScenarioState> {
  constructor() {
    super();
  }
}
