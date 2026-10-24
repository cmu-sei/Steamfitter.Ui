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
  ScenarioPermission,
  ScenarioRole,
} from 'src/app/generated/steamfitter.api';
import { ScenarioRolesModel } from './admin-scenario-roles.models';
import { map } from 'rxjs/operators';
import { ScenarioRoleDataService } from 'src/app/data/scenario/scenario-role-data.service';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-admin-scenario-roles',
  templateUrl: './admin-scenario-roles.component.html',
  styleUrls: ['./admin-scenario-roles.component.scss'],
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
export class AdminScenarioRolesComponent implements OnInit {
  private scenarioRoleService = inject(ScenarioRoleDataService);

  public allPermission = 'All';

  public permissionMap = ScenarioRolesModel.ScenarioPermissions;

  public dataSource = new MatTableDataSource<string>([
    ...[this.allPermission],
    ...Object.values(ScenarioPermission),
  ]);

  public roles$ = this.scenarioRoleService.scenarioRoles$.pipe(
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
    this.scenarioRoleService.loadRoles().subscribe();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  hasPermission(permission: string, role: ScenarioRole) {
    if (permission === this.allPermission) {
      return role?.allPermissions;
    }

    return role?.permissions?.some((x) => x === permission);
  }
}
