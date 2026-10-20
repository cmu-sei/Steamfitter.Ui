// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  Input,
  NgZone,
  ViewChild,
  inject,
  output,
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
  imports: [TasksComponent],
})
export class ScenarioTemplateEditComponent {
  private scenarioTemplateQuery = inject(ScenarioTemplateQuery);
  private taskDataService = inject(TaskDataService);
  private taskQuery = inject(TaskQuery);
  zone = inject(NgZone);

  @Input() scenarioTemplate: ScenarioTemplate;
  readonly editComplete = output<boolean>();
  readonly editScenarioTemplate = output<ScenarioTemplate>();
  @ViewChild(ScenarioTemplateEditComponent) child;
  @ViewChild(TasksComponent) tasks: TasksComponent;

  taskList = this.taskQuery.selectAll();
  isLoading = this.scenarioTemplateQuery.selectLoading();
  tasksAreLoading = this.taskQuery.selectLoading();

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
