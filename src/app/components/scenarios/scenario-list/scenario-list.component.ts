// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioEditComponent } from 'src/app/components/scenarios/scenario-edit/scenario-edit.component';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Scenario, View } from 'src/app/generated/steamfitter.api';
import { ComnSettingsService } from '@cmusei/crucible-common';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
  selector: 'app-scenario-list',
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss'],
})
export class ScenarioListComponent implements OnInit {
  @Input() scenarioList: Scenario[];
  @Input() selectedScenario: Scenario;
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Input() isLoading: boolean;
  @Input() filterControl: FormControl;
  @Input() filterString: string;
  @Input() views: Observable<View[]>;
  @Input() statuses: string;
  @Output() saveScenario = new EventEmitter<Scenario>();
  @Output() setActive = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() filterStatusChange = new EventEmitter<any>();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(ScenarioEditComponent)
  scenarioEditComponent: ScenarioEditComponent;
  topbarColor = '#ef3a47';
  displayedColumns: string[] = [
    'name',
    'view',
    'status',
    'startDate',
    'endDate',
    'description',
  ];
  showStatus = { active: true, ready: true, ended: false };
  editScenarioText = 'Edit Scenario';
  scenarioToEdit: Scenario;
  scenarioDataSource = new MatTableDataSource<Scenario>(new Array<Scenario>());

  // MatPaginator Output
  defaultPageSize = 10;
  pageEvent: PageEvent;
  displayedRows$: Observable<Scenario[]>;
  totalRows$: Observable<number>;
  sortEvents$: Observable<Sort>;
  pageEvents$: Observable<PageEvent>;

  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(
    private scenarioDataService: ScenarioDataService,
    public dialogService: DialogService,
    private dialog: MatDialog,
    private settingsService: ComnSettingsService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.showStatus.active = this.statuses.indexOf('active') > -1;
    this.showStatus.ended = this.statuses.indexOf('ended') > -1;
    this.showStatus.ready = this.statuses.indexOf('ready') > -1;
    this.filterControl.setValue(this.filterString);
    const id = this.selectedScenario ? this.selectedScenario.id : '';
    // force already expanded scenario to refresh details
    if (id) {
      const here = this;
      this.setActive.emit('');
      setTimeout(function () {
        here.setActive.emit(id);
      }, 1);
    }
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  onContextMenu(event: MouseEvent, scenario: Scenario) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: scenario };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  /**
   * Edits or adds a scenario
   */
  editScenario(scenarioToEdit: Scenario) {
    let scenario: Scenario;
    if (!scenarioToEdit) {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 1);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 4);
      scenario = {
        name: '',
        description: '',
        startDate: startDate,
        endDate: endDate,
        status: 'ready',
      };
    } else {
      scenario = { ...scenarioToEdit };
    }
    const dialogRef = this.dialog.open(ScenarioEditDialogComponent, {
      width: '800px',
      data: { scenario: scenario, views: this.views },
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
        'Are you sure that you want to copy scenario ' + scenario.name + '?'
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

  /**
   * filters and sorts the displayed rows
   */
  filterStatus() {
    this.filterStatusChange.emit(this.showStatus);
  }

  selectScenario(scenarioId: string) {
    if (!!this.selectedScenario && scenarioId === this.selectedScenario.id) {
      this.setActive.emit('');
    } else {
      this.setActive.emit(scenarioId);
    }
  }

  paginateScenarios(
    scenarios: Scenario[],
    pageIndex: number,
    pageSize: number
  ) {
    if (!scenarios) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = scenarios.slice();
    return copy.splice(startIndex, pageSize);
  }

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  sortChanged(sort: Sort) {
    this.sortChange.emit(sort);
  }

  trackByFn(index, item) {
    return item.id;
  }
}
