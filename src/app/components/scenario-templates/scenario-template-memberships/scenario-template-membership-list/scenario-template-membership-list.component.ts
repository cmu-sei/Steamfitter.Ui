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
  ScenarioTemplateMembership,
  Group,
  User,
} from 'src/app/generated/steamfitter.api';

@Component({
  selector: 'app-scenario-template-membership-list',
  templateUrl: './scenario-template-membership-list.component.html',
  styleUrls: ['./scenario-template-membership-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioTemplateMembershipListComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input()
  users: User[];

  @Input()
  groups: Group[];

  @Input()
  canEdit: boolean;

  @Output()
  createMembership = new EventEmitter<ScenarioTemplateMembership>();

  viewColumns = ['name', 'type'];
  editColumns = ['actions'];
  displayedColumns = this.viewColumns;

  dataSource = new MatTableDataSource<ScenarioTemplateMemberModel>();

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
    const scenarioTemplateMembership = {} as ScenarioTemplateMembership;

    if (type === 'User') {
      scenarioTemplateMembership.userId = id;
    } else if (type === 'Group') {
      scenarioTemplateMembership.groupId = id;
    }

    this.createMembership.emit(scenarioTemplateMembership);
  }

  buildModel(): ScenarioTemplateMemberModel[] {
    const scenarioTemplateMemberModels = [] as ScenarioTemplateMemberModel[];

    this.users.forEach((x) => {
      scenarioTemplateMemberModels.push({
        user: x,
        group: null,
        id: x.id,
        name: x.name,
        type: 'User',
      });
    });

    this.groups.forEach((x) => {
      scenarioTemplateMemberModels.push({
        user: null,
        group: x,
        id: x.id,
        name: x.name,
        type: 'Group',
      });
    });

    return scenarioTemplateMemberModels;
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

export interface ScenarioTemplateMemberModel {
  user: User;
  group: Group;
  id: string;
  name: string;
  type: string;
}
