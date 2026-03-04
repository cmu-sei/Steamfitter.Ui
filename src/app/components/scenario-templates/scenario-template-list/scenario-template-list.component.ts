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
import { ScenarioTemplatePermission, SystemPermission } from 'src/app/generated/steamfitter.api';
import { ScenarioTemplateEditDialogComponent } from 'src/app/components/scenario-templates/scenario-template-edit-dialog/scenario-template-edit-dialog.component';
import { ScenarioTemplateEditComponent } from 'src/app/components/scenario-templates/scenario-template-edit/scenario-template-edit.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Scenario, ScenarioTemplate } from 'src/app/generated/steamfitter.api';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
    selector: 'app-scenario-template-list',
    templateUrl: './scenario-template-list.component.html',
    styleUrls: ['./scenario-template-list.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class ScenarioTemplateListComponent implements OnInit, OnChanges {
  @Input() scenarioTemplateList: ScenarioTemplate[];
  @Input() selectedScenarioTemplate: ScenarioTemplate;
  @Input() isLoading: boolean;
  @Input() adminMode: boolean;
  @Output() saveScenarioTemplate = new EventEmitter<ScenarioTemplate>();
  @Output() itemSelected = new EventEmitter<string>();
  @ViewChild(ScenarioTemplateEditComponent)
  scenarioTemplateEditComponent: ScenarioTemplateEditComponent;
  displayedColumns: string[] = ['actions', 'name', 'description', 'durationHours', 'dateCreated'];
  editScenarioTemplateText = 'Edit ScenarioTemplate';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  @Input() paginator: MatPaginator;
  @Input() filterString = '';
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  expandedScenarioTemplateId: string | null = null;
  scenarioTemplateDataSource = new MatTableDataSource<ScenarioTemplate>(
    new Array<ScenarioTemplate>()
  );
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    public dialogService: DialogService,
    private permissionDataService: PermissionDataService,
    private scenarioTemplateDataService: ScenarioTemplateDataService,
    private scenarioDataService: ScenarioDataService,
    private dialog: MatDialog
  ) {
    if (!this.scenarioTemplateList || this.scenarioTemplateList.length === 0) {
      this.scenarioTemplateDataService.load();
    }
  }

  ngOnInit() {
    if (this.paginator) {
      this.scenarioTemplateDataSource.paginator = this.paginator;
      this.paginator.pageIndex = 0;
    }
    this.scenarioTemplateDataSource.sort = this.sort;
    const id = this.selectedScenarioTemplate
      ? this.selectedScenarioTemplate.id
      : '';
    // force already expanded scenarioTemplate to refresh details
    if (id) {
      this.expandedScenarioTemplateId = null;
      const here = this;
      this.itemSelected.emit('');
      setTimeout(function () {
        here.expandedScenarioTemplateId = id;
        here.itemSelected.emit(id);
      }, 1);
    }
    this.filterAndSort();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.permissions = this.permissionDataService.permissions;
    if (changes.paginator && this.paginator) {
      this.scenarioTemplateDataSource.paginator = this.paginator;
    }
    if (
      !!changes.scenarioTemplateList &&
      !!changes.scenarioTemplateList.currentValue
    ) {
      this.scenarioTemplateDataSource.data =
        changes.scenarioTemplateList.currentValue;
      this.filterAndSort();
    } else if (changes.filterString !== undefined) {
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

  hasPermission(permission: SystemPermission): boolean {
    return this.permissionDataService.hasPermission(permission);
  }

  canManage(scenarioTemplate: ScenarioTemplate): boolean {
    return scenarioTemplate?.scenarioTemplatePermissions?.some(m => m.includes(ScenarioTemplatePermission.ManageScenarioTemplate)) ||
      this.permissionDataService.hasPermission(SystemPermission.ManageScenarioTemplates);
  }

  canEdit(scenarioTemplate: ScenarioTemplate): boolean {
    return scenarioTemplate?.scenarioTemplatePermissions?.some(m => m === ScenarioTemplatePermission.EditScenarioTemplate) ||
      this.permissionDataService.hasPermission(SystemPermission.EditScenarioTemplates);
  }

  canDoSomething(scenarioTemplate: ScenarioTemplate): boolean {
    return this.canManage(scenarioTemplate) || this.canEdit(scenarioTemplate);
  }

  /**
   * Edits or adds a scenarioTemplate
   */
  editScenarioTemplate(scenarioTemplate: ScenarioTemplate | null) {
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

  selectScenarioTemplate(event: any, scenarioTemplateId: string | undefined) {
    if (this.expandedScenarioTemplateId === scenarioTemplateId) {
      this.expandedScenarioTemplateId = null;
      if (!this.adminMode) {
        this.itemSelected.emit('');
        this.selectedScenarioTemplate = null;
      }
    } else {
      this.expandedScenarioTemplateId = scenarioTemplateId;
      if (!this.adminMode) {
        this.itemSelected.emit(scenarioTemplateId ?? '');
      }
    }
  }

  /**
   * filters and sorts the displayed rows
   */
  filterAndSort() {
    this.scenarioTemplateDataSource.filter = (this.filterString || '').trim().toLowerCase();
  }
}
