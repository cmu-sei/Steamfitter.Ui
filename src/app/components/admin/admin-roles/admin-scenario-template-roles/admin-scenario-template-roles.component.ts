/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, inject, OnInit } from '@angular/core';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import {
  ScenarioTemplatePermission,
  ScenarioTemplateRole,
} from 'src/app/generated/steamfitter.api';
import { ScenarioTemplateRolesModel } from './admin-scenario-template-roles.models';
import { map } from 'rxjs/operators';
import { ScenarioTemplateRoleDataService } from 'src/app/data/scenario-template/scenario-template-role-data.service';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-admin-scenario-template-roles',
  templateUrl: './admin-scenario-template-roles.component.html',
  styleUrls: ['./admin-scenario-template-roles.component.scss'],
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatCheckbox,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    AsyncPipe,
  ],
})
export class AdminScenarioTemplateRolesComponent implements OnInit {
  private scenarioTemplateRoleService = inject(ScenarioTemplateRoleDataService);

  public allPermission = 'All';

  public permissionMap = ScenarioTemplateRolesModel.ScenarioTemplatePermissions;

  public dataSource = new MatTableDataSource<string>([
    ...[this.allPermission],
    ...Object.values(ScenarioTemplatePermission),
  ]);

  public roles$ = this.scenarioTemplateRoleService.scenarioTemplateRoles$.pipe(
    map((roles) =>
      roles.sort((a, b) => {
        return a.name.localeCompare(b.name);
      }),
    ),
  );

  public displayedColumns$ = this.roles$.pipe(
    map((x) => {
      const columnNames = x.map((y) => y.name);
      return ['permissions', ...columnNames];
    }),
  );

  ngOnInit(): void {
    this.scenarioTemplateRoleService.loadRoles().subscribe();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  hasPermission(permission: string, role: ScenarioTemplateRole) {
    if (permission === this.allPermission) {
      return role?.allPermissions;
    }

    return role?.permissions?.some((x) => x === permission);
  }
}
