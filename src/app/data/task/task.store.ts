// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  EntityState,
  EntityStore,
  ActiveState,
  StoreConfig,
} from '@datorama/akita';
import { Task } from 'src/app/generated/steamfitter.api';
import { Injectable } from '@angular/core';

export interface TaskState extends EntityState<Task>, ActiveState {
  ui: {
    scenarioTemplateTaskList: Task[];
    scenarioTaskList: Task[];
    userTaskList: Task[];
  };
}

const initialState = {
  active: null,
  ui: {
    scenarioTemplateTaskList: [],
    scenarioTaskList: [],
    userTaskList: [],
  },
};

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'tasks' })
export class TaskStore extends EntityStore<TaskState> {
  constructor() {
    super(initialState);
  }
}
