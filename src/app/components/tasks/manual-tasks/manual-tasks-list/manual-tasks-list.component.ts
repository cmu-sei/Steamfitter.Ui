/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  inject,
  input,
} from '@angular/core';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { Scenario, Task } from 'src/app/generated/steamfitter.api';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton } from '@angular/material/button';
import { PercentPipe } from '@angular/common';

@Component({
  selector: 'app-manual-tasks-list',
  templateUrl: './manual-tasks-list.component.html',
  styleUrls: ['./manual-tasks-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, MatTooltip, MatIconButton, PercentPipe],
})
export class ManualTasksListComponent implements OnInit {
  private taskDataService = inject(TaskDataService);
  private confirmDialogService = inject(CrucibleDialogService);

  readonly tasks = input<Array<Task>>(undefined);
  @Input() scenario: Scenario;

  ngOnInit(): void {}

  private static readonly STATUS_ICON_MAP: Record<string, string> = {
    succeeded: 'mdi-star-circle-outline',
    success: 'mdi-star-circle-outline',
    failed: 'mdi-close-circle-outline',
    failure: 'mdi-close-circle-outline',
    pending: 'mdi-z-wave',
    expired: 'mdi-clock-alert-outline',
    expiration: 'mdi-clock-alert-outline',
    error: 'mdi-alert-outline',
    completion: 'mdi-check-circle-outline',
    manual: 'mdi-gesture-tap-button',
    queued: 'mdi-clock-time-three-outline',
    sent: 'mdi-send',
    time: 'mdi-alarm',
    cancelled: 'mdi-cancel',
  };

  statusIcon(status: string): string {
    return (
      ManualTasksListComponent.STATUS_ICON_MAP[status?.toLowerCase()] ||
      'mdi-help-circle-outline'
    );
  }

  executeTask(task: Task) {
    this.confirmDialogService
      .confirm({
        title: 'Execute Task?',
        message: `Are you sure you want to execute "${task.name}"?`,
        confirmText: 'Execute',
        cancelText: 'Cancel',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.taskDataService.execute(task.id);
        }
      });
  }
}
