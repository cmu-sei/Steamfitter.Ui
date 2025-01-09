// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ScenarioMembership,
  ScenarioService,
} from 'src/app/generated/steamfitter.api';

@Injectable({
  providedIn: 'root',
})
export class ScenarioMembershipService {
  private scenarioMembershipsSubject = new BehaviorSubject<
    ScenarioMembership[]
  >([]);
  public scenarioMemberships$ = this.scenarioMembershipsSubject.asObservable();

  constructor(private scenarioService: ScenariosService) {}

  loadMemberships(scenarioId: string): Observable<ScenarioMembership[]> {
    return this.scenarioService
      .getScenarioMemberships(scenarioId)
      .pipe(tap((x) => this.scenarioMembershipsSubject.next(x)));
  }

  createMembership(
    scenarioId: string,
    command: CreateScenarioMembershipCommand
  ) {
    return this.scenarioService
      .createScenarioMembership(scenarioId, command)
      .pipe(
        tap((x) => {
          this.upsert(x.id, x);
        })
      );
  }

  editMembership(command: EditScenarioMembershipCommand) {
    return this.scenarioService.editScenarioMembership(command).pipe(
      tap((x) => {
        this.upsert(command.id, x);
      })
    );
  }

  deleteMembership(id: string) {
    return this.scenarioService.deleteScenarioMembership(id).pipe(
      tap(() => {
        this.remove(id);
      })
    );
  }

  upsert(id: string, scenarioMembership: Partial<ScenarioMembership>) {
    const memberships = this.scenarioMembershipsSubject.getValue();
    let membershipToUpdate = memberships.find((x) => x.id === id);

    if (membershipToUpdate != null) {
      Object.assign(membershipToUpdate, scenarioMembership);
    } else {
      memberships.push({ ...scenarioMembership, id } as ScenarioMembership);
    }

    this.scenarioMembershipsSubject.next(memberships);
  }

  remove(id: string) {
    let memberships = this.scenarioMembershipsSubject.getValue();
    memberships = memberships.filter((x) => x.id != id);
    this.scenarioMembershipsSubject.next(memberships);
  }
}
