// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacyMenuTrigger as MatMenuTrigger } from '@angular/material/legacy-menu';
import {
  MatLegacyPaginator as MatPaginator,
  LegacyPageEvent as PageEvent,
} from '@angular/material/legacy-paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { SystemPermission } from 'src/app/generated/steamfitter.api';
import { View } from 'src/app/generated/steamfitter.api';
import { ScenarioEditComponent } from 'src/app/components/scenarios/scenario-edit/scenario-edit.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { ComnSettingsService } from '@cmusei/crucible-common';
import {
  fromMatSort,
  sortRows,
  fromMatPaginator,
  paginateRows,
} from 'src/app/datasource-utils';
import { Observable, of, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
  selector: 'app-scenario-list',
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss'],
})
export class ScenarioListComponent implements OnInit, OnChanges {
  @Input() scenarioList: Scenario[];
  @Input() selectedScenario: Scenario;
  @Input() isLoading: boolean;
  @Input() adminMode = false;
  @Input() statuses: string;
  @Input() views: View[];
  @Output() saveScenario = new EventEmitter<Scenario>();
  @Output() itemSelected = new EventEmitter<string>();
  @ViewChild(ScenarioEditComponent)
  scenarioEditComponent: ScenarioEditComponent;
  topbarColor = '#BB0000';
  displayedColumns: string[] = [
    'name',
    'view',
    'status',
    'startDate',
    'endDate',
    'description',
  ];
  showStatus = { active: true, ready: true, ended: false };
  statusFilteredScenarios: Scenario[];
  editScenarioText = 'Edit Scenario';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  pageSize = 10;
  pageIndex = 0;
  displayedRows: Scenario[] = [];
  totalRows$: Observable<number>;
  sortEvents$: Observable<Sort>;
  pageEvents$: Observable<PageEvent>;
  scenarioDataSource = new MatTableDataSource<Scenario>(new Array<Scenario>());
  filterString = '';
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    private scenarioDataService: ScenarioDataService,
    private permissionDataService: PermissionDataService,
    public dialogService: DialogService,
    private dialog: MatDialog,
    private settingsService: ComnSettingsService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.sortEvents$ = fromMatSort(this.sort);
    this.pageEvents$ = fromMatPaginator(this.paginator);
    const id = this.selectedScenario ? this.selectedScenario.id : '';
    // force already expanded scenario to refresh details
    if (id) {
      const here = this;
      this.itemSelected.emit('');
      setTimeout(function () {
        here.itemSelected.emit(id);
      }, 1);
    }
    this.filterAndSort();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.permissions = this.permissionDataService.permissions;
    if (!!changes.scenarioList && !!changes.scenarioList.currentValue) {
      this.filterByStatus(changes.scenarioList.currentValue);
    }
  }

  filterByStatus(scenarios: Scenario[]) {
    this.paginator.pageIndex = 0;
    this.statusFilteredScenarios = scenarios.filter(
      (m) =>
        (this.showStatus.active && m.status === 'active') ||
        (this.showStatus.ended && m.status === 'ended') ||
        (this.showStatus.ready && m.status === 'ready')
    );
    this.filterAndSort();
  }

  onContextMenu(event: MouseEvent, scenario: Scenario) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: scenario };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  canManage(id: string): boolean {
    return this.permissionDataService.canManageScenario(id);
  }

  canEdit(id: string): boolean {
    return this.permissionDataService.canEditScenario(id);
  }

  canExecute(id: string): boolean {
    return this.permissionDataService.canExecuteScenario(id);
  }

  canDoAnything(id: string): boolean {
    return this.canManage(id) || this.canEdit(id) || this.canExecute(id);
  }

  /**
   * Edits or adds a scenario
   */
  editScenario(scenario: Scenario) {
    scenario = !scenario ? <Scenario>{ name: '', description: '' } : scenario;
    const dialogRef = this.dialog.open(ScenarioEditDialogComponent, {
      width: '800px',
      data: { scenario: { ...scenario }, views: this.views },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.scenario) {
        this.saveScenario.emit(result.scenario);
      }
      dialogRef.close();
    });
  }

  /**
   * Delete a scenario after confirmation
   */
  deleteScenario(scenario: Scenario): void {
    this.dialogService
      .confirm(
        'Delete Scenario',
        'Are you sure that you want to delete scenario ' + scenario.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.scenarioDataService.delete(scenario.id);
        }
      });
  }

  /**
   * Copy a scenario after confirmation
   */
  copyScenario(scenario: Scenario): void {
    this.dialogService
      .confirm(
        'Copy Scenario',
        'Are you sure that you want to create a new scenario from ' +
          scenario.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.scenarioDataService.copyScenario(scenario.id);
        }
      });
  }

  /**
   * Start a scenario
   */
  startScenario(scenario: Scenario): void {
    this.dialogService
      .confirm(
        'Start Scenario Now',
        'Are you sure that you want to start scenario ' + scenario.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.scenarioDataService.start(scenario.id);
        }
      });
  }

  /**
   * End a scenario
   */
  endScenario(scenario: Scenario): void {
    this.dialogService
      .confirm(
        'End Scenario Now',
        'Are you sure that you want to end scenario ' + scenario.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.scenarioDataService.end(scenario.id);
        }
      });
  }

  selectScenario(event: any, scenarioId: string) {
    if (this.adminMode) {
      this.itemSelected.emit(scenarioId);
      if (this.selectedScenario) {
        this.selectedScenario.id = '';
      }
      event.stopPropagation();
    } else if (
      !!this.selectedScenario &&
      scenarioId === this.selectedScenario.id
    ) {
      this.itemSelected.emit('');
      this.selectedScenario = null;
    } else {
      this.itemSelected.emit(scenarioId);
    }
  }

  applyFilter(value: string) {
    this.filterString = value.toLowerCase();
    this.filterAndSort();
  }

  /**
   * filters and sorts the displayed rows
   */
  filterAndSort() {
    this.scenarioDataSource.data = this.statusFilteredScenarios;
    this.scenarioDataSource.filter = this.filterString;
    const rows$ = of(this.scenarioDataSource.filteredData);
    this.totalRows$ = rows$.pipe(map((rows) => rows.length));
    if (!!this.sortEvents$ && !!this.pageEvents$) {
      rows$
        .pipe(sortRows(this.sortEvents$), paginateRows(this.pageEvents$))
        .subscribe((rows) => (this.displayedRows = rows));
    }
  }

  trackByFn(index, item) {
    return item.id;
  }
}
