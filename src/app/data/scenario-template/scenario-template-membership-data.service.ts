// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ScenarioTemplateMembership,
  ScenarioTemplateMembershipsService,
} from 'src/app/generated/steamfitter.api';

@Injectable({
  providedIn: 'root',
})
export class ScenarioTemplateMembershipDataService {
  private scenarioTemplateMembershipsSubject = new BehaviorSubject<
    ScenarioTemplateMembership[]
  >([]);
  public scenarioTemplateMemberships$ =
    this.scenarioTemplateMembershipsSubject.asObservable();

  constructor(
    private scenarioTemplateMembershipsService: ScenarioTemplateMembershipsService
  ) {}

  loadMemberships(
    scenarioTemplateId: string
  ): Observable<ScenarioTemplateMembership[]> {
    return this.scenarioTemplateMembershipsService
      .getAllScenarioTemplateMemberships(scenarioTemplateId)
      .pipe(tap((x) => this.scenarioTemplateMembershipsSubject.next(x)));
  }

  createMembership(
    scenarioTemplateId: string,
    scenarioTemplateMembership: ScenarioTemplateMembership
  ) {
    return this.scenarioTemplateMembershipsService
      .createScenarioTemplateMembership(
        scenarioTemplateId,
        scenarioTemplateMembership
      )
      .pipe(
        tap((x) => {
          this.upsert(x.id, x);
        })
      );
  }

  editMembership(scenarioTemplateMembership: ScenarioTemplateMembership) {
    return this.scenarioTemplateMembershipsService
      .updateScenarioTemplateMembership(
        scenarioTemplateMembership.id,
        scenarioTemplateMembership
      )
      .pipe(
        tap((x) => {
          this.upsert(scenarioTemplateMembership.id, x);
        })
      );
  }

  deleteMembership(id: string) {
    return this.scenarioTemplateMembershipsService
      .deleteScenarioTemplateMembership(id)
      .pipe(
        tap(() => {
          this.remove(id);
        })
      );
  }

  upsert(
    id: string,
    scenarioTemplateMembership: Partial<ScenarioTemplateMembership>
  ) {
    const memberships = this.scenarioTemplateMembershipsSubject.getValue();
    const membershipToUpdate = memberships.find((x) => x.id === id);

    if (membershipToUpdate != null) {
      Object.assign(membershipToUpdate, scenarioTemplateMembership);
    } else {
      memberships.push({
        ...scenarioTemplateMembership,
        id,
      } as ScenarioTemplateMembership);
    }

    this.scenarioTemplateMembershipsSubject.next(memberships);
  }

  remove(id: string) {
    let memberships = this.scenarioTemplateMembershipsSubject.getValue();
    memberships = memberships.filter((x) => x.id !== id);
    this.scenarioTemplateMembershipsSubject.next(memberships);
  }

  updateStore(scenarioTemplateMembership: ScenarioTemplateMembership) {
    this.upsert(scenarioTemplateMembership.id, scenarioTemplateMembership);
  }

  deleteFromStore(id: string) {
    this.remove(id);
  }
}
