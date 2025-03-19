// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ScenarioMembership,
  ScenarioMembershipsService,
} from 'src/app/generated/steamfitter.api';

@Injectable({
  providedIn: 'root',
})
export class ScenarioMembershipDataService {
  private scenarioMembershipsSubject = new BehaviorSubject<
    ScenarioMembership[]
  >([]);
  public scenarioMemberships$ = this.scenarioMembershipsSubject.asObservable();

  constructor(private scenarioMembershipsService: ScenarioMembershipsService) {}

  loadMemberships(scenarioId: string): Observable<ScenarioMembership[]> {
    return this.scenarioMembershipsService
      .getAllScenarioMemberships(scenarioId)
      .pipe(tap((x) => this.scenarioMembershipsSubject.next(x)));
  }

  createMembership(scenarioId: string, scenarioMembership: ScenarioMembership) {
    return this.scenarioMembershipsService
      .createScenarioMembership(scenarioId, scenarioMembership)
      .pipe(
        tap((x) => {
          this.upsert(x.id, x);
        })
      );
  }

  editMembership(scenarioMembership: ScenarioMembership) {
    return this.scenarioMembershipsService
      .updateScenarioMembership(scenarioMembership.id, scenarioMembership)
      .pipe(
        tap((x) => {
          this.upsert(scenarioMembership.id, x);
        })
      );
  }

  deleteMembership(id: string) {
    return this.scenarioMembershipsService.deleteScenarioMembership(id).pipe(
      tap(() => {
        this.remove(id);
      })
    );
  }

  upsert(id: string, scenarioMembership: Partial<ScenarioMembership>) {
    const memberships = this.scenarioMembershipsSubject.getValue();
    const membershipToUpdate = memberships.find((x) => x.id === id);

    if (membershipToUpdate != null) {
      Object.assign(membershipToUpdate, scenarioMembership);
    } else {
      memberships.push({
        ...scenarioMembership,
        id,
      } as ScenarioMembership);
    }

    this.scenarioMembershipsSubject.next(memberships);
  }

  remove(id: string) {
    let memberships = this.scenarioMembershipsSubject.getValue();
    memberships = memberships.filter((x) => x.id !== id);
    this.scenarioMembershipsSubject.next(memberships);
  }

  updateStore(scenarioMembership: ScenarioMembership) {
    this.upsert(scenarioMembership.id, scenarioMembership);
  }

  deleteFromStore(id: string) {
    this.remove(id);
  }
}
