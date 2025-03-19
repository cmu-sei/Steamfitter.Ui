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
import { ScenarioTemplateEditDialogComponent } from 'src/app/components/scenario-templates/scenario-template-edit-dialog/scenario-template-edit-dialog.component';
import { ScenarioTemplateEditComponent } from 'src/app/components/scenario-templates/scenario-template-edit/scenario-template-edit.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Scenario, ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { ComnSettingsService } from '@cmusei/crucible-common';
import {
  fromMatSort,
  sortRows,
  fromMatPaginator,
  paginateRows,
} from 'src/app/datasource-utils';
import { Observable, of, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
  selector: 'app-scenario-template-list',
  templateUrl: './scenario-template-list.component.html',
  styleUrls: ['./scenario-template-list.component.scss'],
})
export class ScenarioTemplateListComponent implements OnInit, OnChanges {
  @Input() scenarioTemplateList: ScenarioTemplate[];
  @Input() selectedScenarioTemplate: ScenarioTemplate;
  @Input() isLoading: boolean;
  @Input() adminMode = false;
  @Output() saveScenarioTemplate = new EventEmitter<ScenarioTemplate>();
  @Output() itemSelected = new EventEmitter<string>();
  @ViewChild(ScenarioTemplateEditComponent)
  scenarioTemplateEditComponent: ScenarioTemplateEditComponent;
  topbarColor = '#BB0000';
  displayedColumns: string[] = ['name', 'description', 'durationHours'];
  editScenarioTemplateText = 'Edit ScenarioTemplate';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  pageSize = 10;
  pageIndex = 0;
  displayedRows: ScenarioTemplate[] = [];
  totalRows$: Observable<number>;
  sortEvents$: Observable<Sort>;
  pageEvents$: Observable<PageEvent>;
  scenarioTemplateDataSource = new MatTableDataSource<ScenarioTemplate>(
    new Array<ScenarioTemplate>()
  );
  filterString = '';
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    public dialogService: DialogService,
    private permissionDataService: PermissionDataService,
    private scenarioTemplateDataService: ScenarioTemplateDataService,
    private scenarioDataService: ScenarioDataService,
    private dialog: MatDialog,
    private settingsService: ComnSettingsService
  ) {
    if (!this.scenarioTemplateList || this.scenarioTemplateList.length === 0) {
      this.scenarioTemplateDataService.load();
    }
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.sortEvents$ = fromMatSort(this.sort);
    this.pageEvents$ = fromMatPaginator(this.paginator);
    const id = this.selectedScenarioTemplate
      ? this.selectedScenarioTemplate.id
      : '';
    // force already expanded scenarioTemplate to refresh details
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
    if (
      !!changes.scenarioTemplateList &&
      !!changes.scenarioTemplateList.currentValue
    ) {
      this.scenarioTemplateDataSource.data =
        changes.scenarioTemplateList.currentValue;
      this.filterAndSort();
    }
  }

  onContextMenu(event: MouseEvent, scenarioTemplate: ScenarioTemplate) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: scenarioTemplate };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  canManage(id: string): boolean {
    return this.permissionDataService.canManageScenarioTemplate(id);
  }

  canEdit(id: string): boolean {
    return this.permissionDataService.canEditScenarioTemplate(id);
  }

  canDoAnything(id: string): boolean {
    return this.canManage(id) || this.canEdit(id);
  }

  /**
   * Edits or adds a scenarioTemplate
   */
  editScenarioTemplate(scenarioTemplate: ScenarioTemplate) {
    scenarioTemplate = !scenarioTemplate
      ? <ScenarioTemplate>{ name: '', description: '' }
      : scenarioTemplate;
    const dialogRef = this.dialog.open(ScenarioTemplateEditDialogComponent, {
      width: '800px',
      data: { scenarioTemplate: scenarioTemplate },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.scenarioTemplate) {
        this.saveScenarioTemplate.emit(result.scenarioTemplate);
      }
      dialogRef.close();
    });
  }

  /**
   * Delete a scenarioTemplate after confirmation
   */
  deleteScenarioTemplate(scenarioTemplate: ScenarioTemplate): void {
    this.dialogService
      .confirm(
        'Delete ScenarioTemplate',
        'Are you sure that you want to delete scenarioTemplate ' +
          scenarioTemplate.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.scenarioTemplateDataService.delete(scenarioTemplate.id);
        }
      });
  }

  /**
   * Copy a scenarioTemplate after confirmation
   */
  copyScenarioTemplate(scenarioTemplate: ScenarioTemplate): void {
    this.dialogService
      .confirm(
        'Copy ScenarioTemplate',
        'Are you sure that you want to create a new scenarioTemplate from ' +
          scenarioTemplate.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.scenarioTemplateDataService.copyScenarioTemplate(
            scenarioTemplate.id
          );
        }
      });
  }

  /**
   * Create a scenario after confirmation
   */
  createScenario(scenarioTemplate: ScenarioTemplate): void {
    this.dialogService
      .confirm(
        'Create Scenario',
        'Are you sure that you want to create a scenario from ' +
          scenarioTemplate.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.scenarioDataService.createScenarioFromScenarioTemplate(
            scenarioTemplate.id
          );
        }
      });
  }

  /**
   * Edit the Scenario created from a ScenarioTemplate
   */
  editNewScenario(scenario: Scenario) {
    const dialogRef = this.dialog.open(ScenarioEditDialogComponent, {
      width: '800px',
      data: { scenario: scenario },
    });
    dialogRef.componentInstance.editComplete.subscribe((newScenario) => {
      dialogRef.close();
    });
  }

  selectScenarioTemplate(event: any, scenarioTemplateId: string) {
    if (this.adminMode) {
      this.itemSelected.emit(scenarioTemplateId);
      if (this.selectedScenarioTemplate) {
        this.selectedScenarioTemplate.id = '';
      }
      event.stopPropagation();
    } else if (
      !!this.selectedScenarioTemplate &&
      scenarioTemplateId === this.selectedScenarioTemplate.id
    ) {
      this.itemSelected.emit('');
      this.selectedScenarioTemplate = null;
    } else {
      this.itemSelected.emit(scenarioTemplateId);
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
    this.scenarioTemplateDataSource.filter = this.filterString;
    const rows$ = of(this.scenarioTemplateDataSource.filteredData);
    this.totalRows$ = rows$.pipe(map((rows) => rows.length));
    if (!!this.sortEvents$ && !!this.pageEvents$) {
      rows$
        .pipe(
          sortRows(this.sortEvents$),
          paginateRows(this.pageEvents$),
          take(1)
        )
        .subscribe((rows) => (this.displayedRows = rows));
    }
  }

  trackByFn(index, item) {
    return item.id;
  }
}
