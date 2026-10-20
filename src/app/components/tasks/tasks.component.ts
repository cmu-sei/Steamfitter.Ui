// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, inject, input } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { Result, Task } from 'src/app/generated/steamfitter.api/model/models';
import { TaskTreeComponent } from './task-tree/task-tree.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
  imports: [TaskTreeComponent, AsyncPipe],
})
export class TasksComponent {
  private taskDataService = inject(TaskDataService);

  readonly taskList = input<Observable<Task[]>>(undefined);
  readonly resultList = input<Observable<Result[]>>(undefined);
  readonly isLoading = input<Observable<boolean>>(undefined);
  readonly scenarioTemplateId = input<string>(undefined);
  readonly scenarioId = input<string>(undefined);
  readonly isEditable = input<boolean>(undefined);
  readonly isExecutable = input<boolean>(undefined);
  clipboard = this.taskDataService.clipboard;

  deleteTask(id: string) {
    this.taskDataService.delete(id);
  }

  executeTask(id: string) {
    this.taskDataService.execute(id);
  }

  stopTaskIterations(id: string) {
    this.taskDataService.stopIterations(id);
  }

  saveTaskHandler(task: Task) {
    if (!task.id) {
      this.taskDataService.add(task);
    } else {
      this.taskDataService.updateTask(task);
    }
  }

  sendToClipboard(data: any) {
    this.taskDataService.setClipboard(data);
  }

  pasteClipboard(taskId: string) {
    const scenarioTemplateId = this.scenarioTemplateId();
    const scenarioId = this.scenarioId();
    if (taskId) {
      this.taskDataService.pasteClipboard({ id: taskId, locationType: 'task' });
    } else if (scenarioTemplateId) {
      this.taskDataService.pasteClipboard({
        id: scenarioTemplateId,
        locationType: 'scenarioTemplate',
      });
    } else if (scenarioId) {
      this.taskDataService.pasteClipboard({
        id: scenarioId,
        locationType: 'scenario',
      });
    } else {
      this.taskDataService.pasteClipboard({ id: '', locationType: '' });
    }
  }

  taskSelectedHandler(taskId: string) {
    this.taskDataService.setActive(taskId);
  }
}
