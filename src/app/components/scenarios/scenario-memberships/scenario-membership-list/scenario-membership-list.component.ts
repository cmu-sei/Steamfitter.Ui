/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import {
  ScenarioMembership,
  Group,
  User,
} from 'src/app/generated/steamfitter.api';

@Component({
  selector: 'app-scenario-membership-list',
  templateUrl: './scenario-membership-list.component.html',
  styleUrls: ['./scenario-membership-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioMembershipListComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input()
  users: User[];

  @Input()
  groups: Group[];

  @Input()
  canEdit: boolean;

  @Output()
  createMembership = new EventEmitter<ScenarioMembership>();

  viewColumns = ['name', 'type'];
  editColumns = ['actions'];
  displayedColumns = this.viewColumns;

  dataSource = new MatTableDataSource<ScenarioMemberModel>();

  filterString = '';

  constructor(public snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges() {
    this.dataSource.data = this.buildModel();

    this.displayedColumns = this.viewColumns.concat(
      this.canEdit ? this.editColumns : []
    );
  }

  add(id: string, type: string) {
    const scenarioMembership = {} as ScenarioMembership;

    if (type === 'User') {
      scenarioMembership.userId = id;
    } else if (type === 'Group') {
      scenarioMembership.groupId = id;
    }

    this.createMembership.emit(scenarioMembership);
  }

  buildModel(): ScenarioMemberModel[] {
    const scenarioMemberModels = [] as ScenarioMemberModel[];

    this.users.forEach((x) => {
      scenarioMemberModels.push({
        user: x,
        group: null,
        id: x.id,
        name: x.name,
        type: 'User',
      });
    });

    this.groups.forEach((x) => {
      scenarioMemberModels.push({
        user: null,
        group: x,
        id: x.id,
        name: x.name,
        type: 'Group',
      });
    });

    return scenarioMemberModels;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  clearFilter() {
    this.filterString = '';
    this.dataSource.filter = this.filterString;
  }
}

export interface ScenarioMemberModel {
  user: User;
  group: Group;
  id: string;
  name: string;
  type: string;
}
