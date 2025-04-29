// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the scenarioTemplate root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
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
  private _permissions: SystemPermission[] = [];
  get permissions(): SystemPermission[] {
    return this._permissions;
  }

  private _scenarioPermissions: ScenarioPermissionClaim[] = [];
  get scenarioPermissions(): ScenarioPermissionClaim[] {
    return this._scenarioPermissions;
  }

  private _scenarioTemplatePermissions: ScenarioTemplatePermissionClaim[] = [];
  get scenarioTemplatePermissions(): ScenarioTemplatePermissionClaim[] {
    return this._scenarioTemplatePermissions;
  }

  constructor(
    private permissionsService: SystemPermissionsService,
    private scenarioPermissionsService: ScenarioPermissionsService,
    private scenarioTemplatePermissionsService: ScenarioTemplatePermissionsService
  ) {}

  load(): Observable<SystemPermission[]> {
    return this.permissionsService.getMySystemPermissions().pipe(
      take(1),
      tap((x) => (this._permissions = x))
    );
  }

  canViewAdiminstration() {
    return this._permissions.some((y) => y.startsWith('View'));
  }

  canViewScenarioTemplateList() {
    return this._permissions.some((y) => y.endsWith('ScenarioTemplates'));
  }

  canViewScenarioList() {
    return this._permissions.some((y) => y.endsWith('Scenarios'));
  }

  hasPermission(permission: SystemPermission) {
    return this._permissions.includes(permission);
  }

  loadScenarioPermissions(
    scenarioId?: string
  ): Observable<ScenarioPermissionClaim[]> {
    return this.scenarioPermissionsService
      .getMyScenarioPermissions(scenarioId)
      .pipe(
        take(1),
        tap((x) => (this._scenarioPermissions = x))
      );
  }

  loadScenarioTemplatePermissions(
    scenarioTemplateId?: string
  ): Observable<ScenarioTemplatePermissionClaim[]> {
    return this.scenarioTemplatePermissionsService
      .getMyScenarioTemplatePermissions(scenarioTemplateId)
      .pipe(
        take(1),
        tap((x) => {
          this._scenarioTemplatePermissions = x;
        })
      );
  }

  canEditScenario(scenarioId: string): boolean {
    return this.canScenario(
        SystemPermission.EditScenarios,
        scenarioId,
        ScenarioPermission.EditScenario) ||
      this.canScenario(
        SystemPermission.ManageScenarios,
        scenarioId,
        ScenarioPermission.ManageScenario);
  }

  canEditScenarioTemplate(scenarioTemplateId: string): boolean {
    return this.canScenarioTemplate(
        SystemPermission.EditScenarioTemplates,
        scenarioTemplateId,
        ScenarioTemplatePermission.EditScenarioTemplate) ||
      this.canScenarioTemplate(
        SystemPermission.ManageScenarioTemplates,
        scenarioTemplateId,
        ScenarioTemplatePermission.ManageScenarioTemplate
      );
  }

  canManageScenario(scenarioId: string): boolean {
    return this.canScenario(
      SystemPermission.ManageScenarios,
      scenarioId,
      ScenarioPermission.ManageScenario
    );
  }

  canManageScenarioTemplate(scenarioTemplateId: string): boolean {
    return this.canScenarioTemplate(
      SystemPermission.ManageScenarioTemplates,
      scenarioTemplateId,
      ScenarioTemplatePermission.ManageScenarioTemplate
    );
  }

  canExecuteScenario(scenarioId: string): boolean {
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
    const permissions = this._permissions;
    const scenarioPermissionClaims = this._scenarioPermissions;
    if (permissions.includes(permission)) {
      return true;
    } else if (scenarioId !== null && scenarioPermission !== null) {
      const scenarioPermissionClaim = scenarioPermissionClaims.find(
        (x) => x.scenarioId === scenarioId
      );

      if (
        scenarioPermissionClaim &&
        scenarioPermissionClaim.permissions.includes(scenarioPermission)
      ) {
        return true;
      }
    }

    return false;
  }

  private canScenarioTemplate(
    permission: SystemPermission,
    scenarioTemplateId?: string,
    scenarioTemplatePermission?: ScenarioTemplatePermission
  ) {
    const permissions = this._permissions;
    const scenarioTemplatePermissionClaims = this._scenarioTemplatePermissions;
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
        scenarioTemplatePermissionClaim &&
        scenarioTemplatePermissionClaim.permissions.includes(
          scenarioTemplatePermission
        )
      ) {
        return true;
      }
    }

    return false;
  }
}
