// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the scenarioTemplate root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ScenarioPermission,
  ScenarioPermissionClaim,
  ScenarioPermissionsService,
  ScenarioTemplatePermission,
  ScenarioTemplatePermissionClaim,
  ScenarioTemplatePermissionsService,
  SystemPermission,
  SystemPermissionsService,
} from 'src/app/generated/steamfitter.api';

@Injectable({
  providedIn: 'root',
})
export class PermissionDataService {
  private permissionsSubject = new BehaviorSubject<SystemPermission[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  private scenarioPermissionsSubject = new BehaviorSubject<
    ScenarioPermissionClaim[]
  >([]);
  public scenarioPermissions$ = this.scenarioPermissionsSubject.asObservable();
  private scenarioTemplatePermissionsSubject = new BehaviorSubject<
    ScenarioTemplatePermissionClaim[]
  >([]);
  public scenarioTemplatePermissions$ =
    this.scenarioTemplatePermissionsSubject.asObservable();

  constructor(
    private permissionsService: SystemPermissionsService,
    private scenarioPermissionsService: ScenarioPermissionsService,
    private scenarioTemplatePermissionsService: ScenarioTemplatePermissionsService
  ) {}

  load(): Observable<SystemPermission[]> {
    return this.permissionsService
      .getMySystemPermissions()
      .pipe(tap((x) => this.permissionsSubject.next(x)));
  }

  canViewAdiminstration() {
    return this.permissions$.pipe(
      map((x) => x.filter((y) => y.startsWith('View'))),
      map((x) => x.length > 0)
    );
  }

  hasPermission(permission: SystemPermission) {
    return this.permissions$.pipe(map((x) => x.includes(permission)));
  }

  loadScenarioPermissions(scenarioId?: string) {
    return this.scenarioPermissionsService
      .getMyScenarioPermissions(scenarioId)
      .pipe(tap((x) => this.scenarioPermissionsSubject.next(x)));
  }

  loadScenarioTemplatePermissions(scenarioTemplateId?: string) {
    return this.scenarioTemplatePermissionsService
      .getMyScenarioTemplatePermissions(scenarioTemplateId)
      .pipe(tap((x) => this.scenarioTemplatePermissionsSubject.next(x)));
  }

  canEditScenario(scenarioId: string): Observable<boolean> {
    return this.canScenario(
      SystemPermission.EditScenarios,
      scenarioId,
      ScenarioPermission.EditScenario
    );
  }

  canEditScenarioTemplate(scenarioTemplateId: string): Observable<boolean> {
    return this.canScenarioTemplate(
      SystemPermission.EditScenarioTemplates,
      scenarioTemplateId,
      ScenarioTemplatePermission.EditScenarioTemplate
    );
  }

  canManageScenario(scenarioId: string): Observable<boolean> {
    return this.canScenario(
      SystemPermission.ManageScenarios,
      scenarioId,
      ScenarioPermission.ManageScenario
    );
  }

  canManageScenarioTemplate(scenarioTemplateId: string): Observable<boolean> {
    return this.canScenarioTemplate(
      SystemPermission.ManageScenarioTemplates,
      scenarioTemplateId,
      ScenarioTemplatePermission.ManageScenarioTemplate
    );
  }

  canExecuteScenario(scenarioId: string): Observable<boolean> {
    return this.canScenario(
      SystemPermission.ExecuteScenarios,
      scenarioId,
      ScenarioPermission.ExecuteScenario
    );
  }

  private canScenario(
    permission: SystemPermission,
    scenarioId?: string,
    scenarioPermission?: ScenarioPermission
  ) {
    return combineLatest([this.permissions$, this.scenarioPermissions$]).pipe(
      map(([permissions, scenarioPermissionClaims]) => {
        if (permissions.includes(permission)) {
          return true;
        } else if (scenarioId !== null && scenarioPermission !== null) {
          const scenarioPermissionClaim = scenarioPermissionClaims.find(
            (x) => x.scenarioId === scenarioId
          );

          if (
            scenarioPermissionClaim !== null &&
            scenarioPermissionClaim.permissions.includes(scenarioPermission)
          ) {
            return true;
          }
        }

        return false;
      })
    );
  }

  private canScenarioTemplate(
    permission: SystemPermission,
    scenarioTemplateId?: string,
    scenarioTemplatePermission?: ScenarioTemplatePermission
  ) {
    return combineLatest([
      this.permissions$,
      this.scenarioTemplatePermissions$,
    ]).pipe(
      map(([permissions, scenarioTemplatePermissionClaims]) => {
        if (permissions.includes(permission)) {
          return true;
        } else if (
          scenarioTemplateId !== null &&
          scenarioTemplatePermission !== null
        ) {
          const scenarioTemplatePermissionClaim =
            scenarioTemplatePermissionClaims.find(
              (x) => x.scenarioTemplateId === scenarioTemplateId
            );

          if (
            scenarioTemplatePermissionClaim !== null &&
            scenarioTemplatePermissionClaim.permissions.includes(
              scenarioTemplatePermission
            )
          ) {
            return true;
          }
        }

        return false;
      })
    );
  }
}
