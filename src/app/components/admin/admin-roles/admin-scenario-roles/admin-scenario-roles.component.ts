/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, inject, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {
  ScenarioPermission,
  ScenarioRole,
} from 'src/app/generated/steamfitter.api';
import { ScenarioRolesModel } from './admin-scenario-roles.models';
import { map } from 'rxjs/operators';
import { ScenarioRoleDataService } from 'src/app/data/scenario/scenario-role-data.service';

@Component({
  selector: 'app-admin-scenario-roles',
  templateUrl: './admin-scenario-roles.component.html',
  styleUrls: ['./admin-scenario-roles.component.scss'],
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
      })
    )
  );

  public displayedColumns$ = this.roles$.pipe(
    map((x) => {
      const columnNames = x.map((y) => y.name);
      return ['permissions', ...columnNames];
    })
  );

  ngOnInit(): void {
    this.scenarioRoleService.loadRoles().subscribe();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  hasPermission(permission: string, role: ScenarioRole) {
    if (permission === this.allPermission) {
      return role.allPermissions;
    }

    return role.permissions.some((x) => x === permission);
  }
}
