/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortHeader } from '@angular/material/sort';
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
  MatNoDataRow,
} from '@angular/material/table';
import {
  ScenarioTemplateMembership,
  Group,
  User,
} from 'src/app/generated/steamfitter.api';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import {
  MatFormField,
  MatLabel,
  MatInput,
  MatSuffix,
} from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { ClipboardModule } from 'ngx-clipboard';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-scenario-template-membership-list',
  templateUrl: './scenario-template-membership-list.component.html',
  styleUrls: ['./scenario-template-membership-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbar,
    MatToolbarRow,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatIconButton,
    MatSuffix,
    MatPaginator,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    ClipboardModule,
    MatTooltip,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatNoDataRow,
  ],
})
export class ScenarioTemplateMembershipListComponent
  implements OnInit, OnChanges, AfterViewInit
{
  snackBar = inject(MatSnackBar);

  readonly users = input<User[]>(undefined);

  readonly groups = input<Group[]>(undefined);

  readonly canEdit = input<boolean>(undefined);

  readonly createMembership = output<ScenarioTemplateMembership>();

  viewColumns = ['name', 'type'];
  editColumns = ['actions'];
  displayedColumns = this.viewColumns;

  dataSource = new MatTableDataSource<ScenarioTemplateMemberModel>();

  filterString = '';

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges() {
    this.dataSource.data = this.buildModel();

    this.displayedColumns = this.viewColumns.concat(
      this.canEdit() ? this.editColumns : [],
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

    this.users().forEach((x) => {
      scenarioTemplateMemberModels.push({
        user: x,
        group: null,
        id: x.id,
        name: x.name,
        type: 'User',
      });
    });

    this.groups().forEach((x) => {
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
