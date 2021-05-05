/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved. 
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
} from '@angular/core';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { Scenario, Task } from 'src/app/generated/steamfitter.api';

@Component({
  selector: 'app-manual-tasks-list',
  templateUrl: './manual-tasks-list.component.html',
  styleUrls: ['./manual-tasks-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualTasksListComponent implements OnInit {
  @Input() tasks: Array<Task>;
  @Input() scenario: Scenario;

  constructor(private taskDataService: TaskDataService) {}

  ngOnInit(): void {}

  executeTask(taskId: string) {
    this.taskDataService.execute(taskId);
  }
}
