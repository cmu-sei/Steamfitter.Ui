// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from "@datorama/akita";
import { ScenarioTemplate } from "src/app/generated/steamfitter.api";
import { Injectable } from "@angular/core";

export interface ScenarioTemplateState extends EntityState<ScenarioTemplate> {}

@Injectable({
  providedIn: "root",
})
@StoreConfig({ name: "scenarioTemplates" })
export class ScenarioTemplateStore extends EntityStore<ScenarioTemplateState> {
  constructor() {
    super();
  }
}
