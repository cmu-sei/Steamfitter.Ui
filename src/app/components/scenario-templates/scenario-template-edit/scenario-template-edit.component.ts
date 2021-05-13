// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { TaskQuery } from 'src/app/data/task/task.query';
import { ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { TasksComponent } from '../../tasks/tasks.component';

@Component({
  selector: 'app-scenario-template-edit',
  templateUrl: './scenario-template-edit.component.html',
  styleUrls: ['./scenario-template-edit.component.scss'],
})
export class ScenarioTemplateEditComponent {
  @Input() scenarioTemplate: ScenarioTemplate;
  @Output() editComplete = new EventEmitter<boolean>();
  @Output() editScenarioTemplate = new EventEmitter<ScenarioTemplate>();
  @ViewChild(ScenarioTemplateEditComponent) child;
  @ViewChild(TasksComponent) tasks: TasksComponent;

  taskList = this.taskQuery.selectAll();
  isLoading = this.scenarioTemplateQuery.selectLoading();
  tasksAreLoading = this.taskQuery.selectLoading();

  constructor(
    private scenarioTemplateQuery: ScenarioTemplateQuery,
    private taskDataService: TaskDataService,
    private taskQuery: TaskQuery,
    public zone: NgZone
  ) {}

  refreshTaskList() {
    if (this && this.scenarioTemplate) {
      this.taskDataService.loadByScenarioTemplate(this.scenarioTemplate.id);
    }
  }

  deleteTask(id: string) {
    this.taskDataService.delete(id);
  }

  returnToScenarioTemplateList() {
    this.editComplete.emit(true);
  }
} // End Class
