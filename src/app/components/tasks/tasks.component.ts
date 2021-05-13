// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { Result, Task } from 'src/app/generated/steamfitter.api/model/models';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})
export class TasksComponent {
  @Input() taskList: Observable<Task[]>;
  @Input() resultList: Observable<Result[]>;
  @Input() isLoading: Observable<boolean>;
  @Input() scenarioTemplateId: string;
  @Input() scenarioId: string;
  @Input() isEditable: boolean;
  @Input() isExecutable: boolean;
  clipboard = this.taskDataService.clipboard;

  constructor(private taskDataService: TaskDataService) {}

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
    if (taskId) {
      this.taskDataService.pasteClipboard({ id: taskId, locationType: 'task' });
    } else if (this.scenarioTemplateId) {
      this.taskDataService.pasteClipboard({
        id: this.scenarioTemplateId,
        locationType: 'scenarioTemplate',
      });
    } else if (this.scenarioId) {
      this.taskDataService.pasteClipboard({
        id: this.scenarioId,
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
