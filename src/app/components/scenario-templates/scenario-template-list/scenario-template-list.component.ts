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
import { UntypedFormControl } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacyMenuTrigger as MatMenuTrigger } from '@angular/material/legacy-menu';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import {
  ScenarioTemplateEditDialogComponent
} from 'src/app/components/scenario-templates/scenario-template-edit-dialog/scenario-template-edit-dialog.component';
import {
  ScenarioTemplateEditComponent
} from 'src/app/components/scenario-templates/scenario-template-edit/scenario-template-edit.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Scenario, ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { ComnSettingsService } from '@cmusei/crucible-common';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
  selector: 'app-scenario-template-list',
  templateUrl: './scenario-template-list.component.html',
  styleUrls: ['./scenario-template-list.component.scss'],
})
export class ScenarioTemplateListComponent implements OnInit {
  @Input() scenarioTemplateList: ScenarioTemplate[];
  @Input() selectedScenarioTemplate: ScenarioTemplate;
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Input() isLoading: boolean;
  @Input() filterControl: UntypedFormControl;
  @Input() filterString: string;
  @Input() manageMode = false;
  @Output() saveScenarioTemplate = new EventEmitter<ScenarioTemplate>();
  @Output() itemSelected = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @ViewChild(ScenarioTemplateEditComponent)
  scenarioTemplateEditComponent: ScenarioTemplateEditComponent;
  topbarColor = '#BB0000';
  displayedColumns: string[] = ['name', 'description', 'durationHours'];
  editScenarioTemplateText = 'Edit ScenarioTemplate';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(
    public dialogService: DialogService,
    private scenarioTemplateDataService: ScenarioTemplateDataService,
    private scenarioDataService: ScenarioDataService,
    private dialog: MatDialog,
    private settingsService: ComnSettingsService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    // this.filterControl.setValue(this.filterString);
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
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  onContextMenu(event: MouseEvent, scenarioTemplate: ScenarioTemplate) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: scenarioTemplate };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
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
    if (this.manageMode) {
      this.itemSelected.emit(scenarioTemplateId);
      this.selectedScenarioTemplate.id = '';
      event.stopPropagation();
    } else if (
      !!this.selectedScenarioTemplate &&
      scenarioTemplateId === this.selectedScenarioTemplate.id
    ) {
      this.itemSelected.emit('');
      this.selectedScenarioTemplate.id = '';
    } else {
      this.itemSelected.emit(scenarioTemplateId);
    }
  }

  paginateScenarioTemplates(
    scenarioTemplates: ScenarioTemplate[],
    pageIndex: number,
    pageSize: number
  ) {
    if (!scenarioTemplates) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = scenarioTemplates.slice();
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
