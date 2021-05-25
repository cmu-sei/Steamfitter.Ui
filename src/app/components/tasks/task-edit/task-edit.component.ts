// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { Command } from 'src/app/models/command';
import {
  Task,
  TaskIterationTermination,
  TaskService,
  TaskTrigger,
  VmCredential,
} from 'src/app/generated/steamfitter.api';

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss'],
})
export class TaskEditComponent implements OnInit, OnDestroy {
  @Output() editComplete = new EventEmitter<any>();
  triggerConditions = [
    TaskTrigger.Time,
    TaskTrigger.Manual,
    TaskTrigger.Completion,
    TaskTrigger.Success,
    TaskTrigger.Failure,
    TaskTrigger.Expiration,
  ];
  iterationTerminations = [
    TaskIterationTermination.IterationCount,
    TaskIterationTermination.UntilSuccess,
    TaskIterationTermination.UntilFailure,
  ];
  availableCommands: Command[];
  selectedCommand: Command;
  chooseVms = false;
  username = new BehaviorSubject<string>('');
  password = new BehaviorSubject<string>('');
  private unsubscribe$ = new Subject();

  constructor(
    public taskService: TaskService,
    private taskDataService: TaskDataService,
    dialogRef: MatDialogRef<TaskEditComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { task: Task; vmCredentials: Array<VmCredential> }
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    this.taskService
      .getAvailableCommands()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (cmdsJson) => {
          if (cmdsJson != null) {
            const cmds: AvailableCommands = JSON.parse(cmdsJson.toString());
            this.availableCommands = cmds.availableCommands;
            this.selectTheTaskCommand();
          }
        },
        (error) => {
          console.log(
            'The Steamfitter API is not responding.  ' + error.message
          );
        }
      );
    this.taskDataService.selected
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((t) => {
        if (!!t && !!t.id) {
          this.data.task = this.formatTaskVmList({ ...t });
          if (!t.iterationTermination) {
            t.iterationTermination = TaskIterationTermination.IterationCount;
          }
          this.selectTheTaskCommand();
        }
      });
  }

  formatTaskVmList(task: Task) {
    if (task.vmMask) {
      const splitMask = task.vmMask.split(',');
      if (
        splitMask[0].length === 36 &&
        splitMask[0][8] === '-' &&
        splitMask[0][13] === '-' &&
        splitMask[0][18] === '-' &&
        splitMask[0][23] === '-'
      ) {
        task.vmList = splitMask;
        task.vmMask = '';
        this.chooseVms = true;
      } else {
        this.chooseVms = false;
      }
    } else {
      this.chooseVms = !!task.vmList && task.vmList.length > 0;
    }
    return task;
  }

  switchChooseVmsMethod(event: any) {
    this.chooseVms = !this.chooseVms;
    if (!this.chooseVms && this.data.task.vmList) {
      this.data.task.vmList.length = 0;
    }
  }

  onCommandChange() {
    const actionParameters: Record<string, string> = {};
    this.selectedCommand.parameters.forEach((param) => {
      actionParameters[param.key] = param.value;
      if (param.key.toLowerCase() === 'username') {
        this.username.next(param.value);
      } else if (param.key.toLowerCase() === 'password') {
        this.password.next(param.value);
      }
    });
    this.data.task.actionParameters = actionParameters;
    this.data.task.apiUrl = this.selectedCommand.api;
    this.data.task.action = this.selectedCommand.action;
  }

  credentialsAreRequired() {
    if (this.selectedCommand && this.selectedCommand.parameters) {
      return this.selectedCommand.parameters.some(
        (parameter) => parameter.key.toLowerCase() === 'username'
      );
    }
    return false;
  }

  private selectTheTaskCommand() {
    if (!!this.availableCommands && this.availableCommands.length > 0) {
      this.availableCommands.forEach((cmd) => {
        if (
          cmd.api === this.data.task.apiUrl &&
          cmd.action === this.data.task.action
        ) {
          cmd.parameters.forEach((p) => {
            p.value = this.data.task.actionParameters[p.key];
            if (p.key.toLowerCase() === 'username') {
              this.username.next(p.value);
            } else if (p.key.toLowerCase() === 'password') {
              this.password.next(p.value);
            }
          });
          this.selectedCommand = cmd;
        } else {
          cmd.parameters.forEach((p) => {
            p.value = '';
          });
        }
      });
    }
  }

  errorFree() {
    const isOkay =
      this.data.task && this.data.task.name && this.data.task.name.length > 0;
    return isOkay;
  }

  handleEditComplete(saveChanges: boolean) {
    if (this.chooseVms) {
      this.data.task.vmMask = '';
    } else {
      this.data.task.vmList = [];
    }
    this.editComplete.emit({ saveChanges: saveChanges, task: this.data.task });
  }

  handleUpdateVmList(vmList: string[]) {
    this.data.task.vmList = vmList;
  }

  handleVmCredentialChange(vmCredential: VmCredential) {
    this.selectedCommand.parameters.find((p) => p.key === 'Username').value =
      vmCredential.username;
    this.selectedCommand.parameters.find((p) => p.key === 'Password').value =
      vmCredential.password;
    this.onCommandChange();
  }

  loadFileContent(param, fileSelector) {
    const fileList: FileList = fileSelector.files;
    if (!fileList || fileList.length !== 1) {
      param.value = '';
      this.onCommandChange();
    } else {
      const self = this;
      const file = fileList[0];
      const fileReader: FileReader = new FileReader();
      fileReader.onloadend = function (x) {
        if (file.name.endsWith('.json')) {
          param.value = JSON.stringify(
            JSON.parse(fileReader.result.toString())
          );
        }
        param.value = fileReader.result.toString();
        self.onCommandChange();
      };
      fileReader.readAsText(file);
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}

interface AvailableCommands {
  availableCommands: Command[];
}
