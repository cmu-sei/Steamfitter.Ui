// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ScenarioTemplateRole,
  ScenarioTemplateRolesService,
} from 'src/app/generated/steamfitter.api';

@Injectable({
  providedIn: 'root',
})
export class ScenarioTemplateRoleDataService {
  private scenarioTemplateRolesSubject = new BehaviorSubject<
    ScenarioTemplateRole[]
  >([]);
  public scenarioTemplateRoles$ =
    this.scenarioTemplateRolesSubject.asObservable();

  constructor(
    private scenarioTemplateRolesService: ScenarioTemplateRolesService
  ) {}

  loadRoles(): Observable<ScenarioTemplateRole[]> {
    return this.scenarioTemplateRolesService
      .getAllScenarioTemplateRoles()
      .pipe(tap((x) => this.scenarioTemplateRolesSubject.next(x)));
  }
}
