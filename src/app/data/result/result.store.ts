// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Result } from 'src/app/generated/steamfitter.api';
import { Injectable } from '@angular/core';

export interface ResultState extends EntityState<Result> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'tasks' })
export class ResultStore extends EntityStore<ResultState> {
  constructor() {
    super();
  }
}
