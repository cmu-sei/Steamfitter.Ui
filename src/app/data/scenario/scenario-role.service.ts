// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ScenarioRole,
  ScenarioRolesService,
} from 'src/app/generated/steamfitter.api';

@Injectable({
  providedIn: 'root',
})
export class ScenarioRoleService {
  private scenarioRolesSubject = new BehaviorSubject<ScenarioRole[]>([]);
  public scenarioRoles$ = this.scenarioRolesSubject.asObservable();

  constructor(private scenarioRolesService: ScenarioRolesService) {}

  loadRoles(): Observable<ScenarioRole[]> {
    return this.scenarioRolesService
      .getAllScenarioRoles()
      .pipe(tap((x) => this.scenarioRolesSubject.next(x)));
  }
}
