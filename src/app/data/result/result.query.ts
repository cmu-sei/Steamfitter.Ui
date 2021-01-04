// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from "@datorama/akita";
import { ResultState, ResultStore } from "./result.store";
import { Result } from "src/app/generated/steamfitter.api";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@QueryConfig({
  sortBy: "name",
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: "root",
})
export class ResultQuery extends QueryEntity<ResultState> {
  constructor(protected store: ResultStore) {
    super(store);
  }

  selectById(id: string): Observable<Result> {
    return this.selectEntity(id);
  }
}
