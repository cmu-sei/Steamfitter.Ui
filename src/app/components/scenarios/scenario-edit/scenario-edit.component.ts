// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, ViewChild, inject, output } from '@angular/core';
import { TaskTreeComponent } from 'src/app/components/tasks/task-tree/task-tree.component';
import { ResultQuery } from 'src/app/data/result/result.query';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { TaskQuery } from 'src/app/data/task/task.query';
import {
  Scenario,
  ScenarioStatus,
} from 'src/app/generated/steamfitter.api/model/models';
import { TasksComponent } from '../../tasks/tasks.component';

@Component({
  selector: 'app-scenario-edit',
  templateUrl: './scenario-edit.component.html',
  styleUrls: ['./scenario-edit.component.scss'],
  imports: [TasksComponent],
})
export class ScenarioEditComponent {
  private scenarioQuery = inject(ScenarioQuery);
  private taskDataService = inject(TaskDataService);
  private taskQuery = inject(TaskQuery);
  private resultQuery = inject(ResultQuery);

  @Input() scenario: Scenario;
  readonly editComplete = output<boolean>();
  @ViewChild(ScenarioEditComponent) child: ScenarioEditComponent;
  @ViewChild(TaskTreeComponent) taskTree: TaskTreeComponent;

  public changesWereMade = false;
  public scenarioStates = Object.values(ScenarioStatus);
  taskList = this.taskQuery.selectAll();
  resultList = this.resultQuery.selectAll();
  isLoading = this.scenarioQuery.selectLoading();

  refreshTaskList() {
    if (this && this.scenario) {
      this.taskDataService.loadByScenario(this.scenario.id);
    }
  }

  deleteTask(id: string) {
    this.taskDataService.delete(id);
  }

  returnToScenarioList() {
    this.editComplete.emit(true);
  }
} // End Class
