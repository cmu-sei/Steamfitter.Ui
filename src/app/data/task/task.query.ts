// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from "@datorama/akita";
import { TaskState, TaskStore } from "./task.store";
import { Task } from "src/app/generated/steamfitter.api";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@QueryConfig({
  sortBy: "name",
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: "root",
})
export class TaskQuery extends QueryEntity<TaskState> {
  constructor(protected store: TaskStore) {
    super(store);
  }

  selectById(id: string): Observable<Task> {
    return this.selectEntity(id);
  }
}
