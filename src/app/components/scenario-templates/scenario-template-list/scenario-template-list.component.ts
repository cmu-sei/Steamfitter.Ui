/*
Crucible
Copyright 2020 Carnegie Mellon University.
NO WARRANTY. THIS CARNEGIE MELLON UNIVERSITY AND SOFTWARE ENGINEERING INSTITUTE MATERIAL IS FURNISHED ON AN "AS-IS" BASIS. CARNEGIE MELLON UNIVERSITY MAKES NO WARRANTIES OF ANY KIND, EITHER EXPRESSED OR IMPLIED, AS TO ANY MATTER INCLUDING, BUT NOT LIMITED TO, WARRANTY OF FITNESS FOR PURPOSE OR MERCHANTABILITY, EXCLUSIVITY, OR RESULTS OBTAINED FROM USE OF THE MATERIAL. CARNEGIE MELLON UNIVERSITY DOES NOT MAKE ANY WARRANTY OF ANY KIND WITH RESPECT TO FREEDOM FROM PATENT, TRADEMARK, OR COPYRIGHT INFRINGEMENT.
Released under a MIT (SEI)-style license, please see license.txt or contact permission@sei.cmu.edu for full terms.
[DISTRIBUTION STATEMENT A] This material has been approved for public release and unlimited distribution.  Please see Copyright notice for non-US Government use and distribution.
Carnegie Mellon(R) and CERT(R) are registered in the U.S. Patent and Trademark Office by Carnegie Mellon University.
DM20-0181
*/

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
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ScenarioTemplateEditDialogComponent } from 'src/app/components/scenario-templates/scenario-template-edit-dialog/scenario-template-edit-dialog.component';
import { ScenarioTemplateEditComponent } from 'src/app/components/scenario-templates/scenario-template-edit/scenario-template-edit.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import {
  Scenario,
  ScenarioTemplate,
} from 'src/app/swagger-codegen/dispatcher.api';
import { ComnSettingsService } from '@crucible/common';

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
  @Input() filterControl: FormControl;
  @Input() filterString: string;
  @Output() saveScenarioTemplate = new EventEmitter<ScenarioTemplate>();
  @Output() setActive = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @ViewChild(ScenarioTemplateEditComponent)
  scenarioTemplateEditComponent: ScenarioTemplateEditComponent;
  topbarColor = '#ef3a47';
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
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor ? this.settingsService.settings.AppTopBarHexColor : this.topbarColor;
  }

  ngOnInit() {
    this.filterControl.setValue(this.filterString);
    const id = this.selectedScenarioTemplate
      ? this.selectedScenarioTemplate.id
      : '';
    // force already expanded scenarioTemplate to refresh details
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

  selectScenarioTemplate(scenarioTemplateId: string) {
    if (
      !!this.selectedScenarioTemplate &&
      scenarioTemplateId === this.selectedScenarioTemplate.id
    ) {
      this.setActive.emit('');
    } else {
      this.setActive.emit(scenarioTemplateId);
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
}
