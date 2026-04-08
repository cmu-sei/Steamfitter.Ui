// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
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
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { ScenarioPermission, SystemPermission } from 'src/app/generated/steamfitter.api';
import { View } from 'src/app/generated/steamfitter.api';
import { ScenarioEditComponent } from 'src/app/components/scenarios/scenario-edit/scenario-edit.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Scenario } from 'src/app/generated/steamfitter.api';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
    selector: 'app-scenario-list',
    templateUrl: './scenario-list.component.html',
    styleUrls: ['./scenario-list.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
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
  displayedColumns: string[] = [
    'actions',
    'name',
    'view',
    'status',
    'startDate',
    'endDate',
  ];
  @Input() selectedStatuses: string[] = ['active', 'ready'];
  statusFilteredScenarios: Scenario[];
  editScenarioText = 'Edit Scenario';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  @Input() paginator: MatPaginator;
  @Input() filterString = '';
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  expandedScenarioId: string | null = null;
  scenarioDataSource = new MatTableDataSource<Scenario>(new Array<Scenario>());
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    private scenarioDataService: ScenarioDataService,
    private permissionDataService: PermissionDataService,
    public dialogService: DialogService,
    private dialog: MatDialog
  ) {
    if (!this.scenarioList || this.scenarioList.length === 0) {
      this.scenarioDataService.load();
    }
  }

  ngOnInit() {
    if (this.paginator) {
      this.scenarioDataSource.paginator = this.paginator;
      this.paginator.pageIndex = 0;
    }
    this.scenarioDataSource.sort = this.sort;
    const id = this.selectedScenario ? this.selectedScenario.id : '';
    // force already expanded scenario to refresh details
    if (id) {
      this.expandedScenarioId = null;
      const here = this;
      this.itemSelected.emit('');
      setTimeout(function () {
        here.expandedScenarioId = id;
        here.itemSelected.emit(id);
      }, 1);
    }
    this.filterAndSort();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.permissions = this.permissionDataService.permissions;
    // When selectedScenario arrives asynchronously (e.g. from URL query param
    // on initial load), expand that scenario's row.
    if (!!changes.selectedScenario && !!changes.selectedScenario.currentValue &&
        !!changes.selectedScenario.currentValue.id &&
        changes.selectedScenario.currentValue.id !== this.expandedScenarioId) {
      this.expandedScenarioId = changes.selectedScenario.currentValue.id;
    }
    if (changes.paginator && this.paginator) {
      this.scenarioDataSource.paginator = this.paginator;
    }
    if (!!changes.scenarioList && !!changes.scenarioList.currentValue) {
      this.filterByStatus(changes.scenarioList.currentValue);
    } else if (changes.selectedStatuses && this.scenarioList) {
      this.filterByStatus(this.scenarioList);
    } else if (changes.filterString !== undefined) {
      this.filterAndSort();
    }
  }

  filterByStatus(scenarios: Scenario[]) {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.statusFilteredScenarios = scenarios.filter(
      (m) => this.selectedStatuses.includes(m.status)
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

  canManage(scenario: Scenario): boolean {
    return scenario?.scenarioPermissions?.some(m => m === ScenarioPermission.ManageScenario) ||
      this.permissionDataService.hasPermission(SystemPermission.ManageScenarios);
  }

  canEdit(scenario: Scenario): boolean {
    return scenario?.scenarioPermissions?.some(m => m === ScenarioPermission.EditScenario) ||
      this.permissionDataService.hasPermission(SystemPermission.EditScenarios);
  }

  canExecute(scenario: Scenario): boolean {
    return scenario?.scenarioPermissions?.some(m => m === ScenarioPermission.ExecuteScenario) ||
      this.permissionDataService.hasPermission(SystemPermission.ExecuteScenarios);
  }

  canDoSomething(scenario: Scenario): boolean {
    return this.canManage(scenario) || this.canEdit(scenario) || this.canExecute(scenario);
  }

  /**
   * Edits or adds a scenario
   */
  editScenario(scenario: Scenario | null) {
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

  selectScenario(event: any, scenarioId: string | undefined) {
    if (this.expandedScenarioId === scenarioId) {
      this.expandedScenarioId = null;
      if (!this.adminMode) {
        this.itemSelected.emit('');
        this.selectedScenario = null;
      }
    } else {
      this.expandedScenarioId = scenarioId;
      if (!this.adminMode) {
        this.itemSelected.emit(scenarioId ?? '');
      }
    }
  }

  /**
   * filters and sorts the displayed rows
   */
  filterAndSort() {
    this.scenarioDataSource.data = this.statusFilteredScenarios || [];
    this.scenarioDataSource.filter = (this.filterString || '').trim().toLowerCase();
  }
}
