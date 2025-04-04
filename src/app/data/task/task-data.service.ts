// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { TaskStore } from './task.store';
import { TaskQuery } from './task.query';
import { ResultDataService } from 'src/app/data/result/result-data.service';
import { Injectable } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Task,
  TaskService,
  Result,
  TaskStatus,
} from 'src/app/generated/steamfitter.api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

export interface Clipboard {
  id: string | undefined;
  resultId: string | undefined;
  isCut: boolean;
}

export interface PasteLocation {
  id: string;
  locationType: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskDataService {
  private _requestedTaskId$ = new BehaviorSubject<string>('');
  readonly taskList: Observable<Task[]>;
  readonly selected: Observable<Task>;
  readonly filterControl = new UntypedFormControl();
  private filterTerm: Observable<string>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  readonly clipboard = new BehaviorSubject<Clipboard>(null);
  private _clipboard = null;

  constructor(
    private taskStore: TaskStore,
    private taskQuery: TaskQuery,
    private taskService: TaskService,
    private resultDataService: ResultDataService,
    private router: Router,
    activatedRoute: ActivatedRoute
  ) {
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      tap((params) => {
        const taskId = params.get('taskId') || '';
        if (taskId !== this._requestedTaskId$.getValue()) {
          if (!!taskId) {
            this.loadById(taskId);
          }
          this._requestedTaskId$.next(taskId);
        }
      }),
      map((params) => params.get('taskmask') || '')
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { taskmask: term },
        queryParamsHandling: 'merge',
      });
    });
    this.taskList = combineLatest([
      this.taskQuery.selectAll(),
      this.filterTerm,
      this.pageEvent,
    ]).pipe(
      map(([items, filterTerm, page]) => {
        if (!items || items.length === 0) {
          if (page.length !== 0) {
            page.length = 0;
            page.pageIndex = 0;
          }
          return [];
        }

        let taskList = items ? (items as Task[]) : [];
        taskList = taskList.filter(
          (item) =>
            item.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(filterTerm.toLowerCase())
        );
        const pgsz = page.pageSize;
        const startIndex = page.pageIndex * pgsz;
        taskList = taskList.splice(startIndex, pgsz);
        // if the taskList length has changed, then a new pageEvent is needed
        if (this._pageEvent.length !== taskList.length) {
          this._pageEvent = {
            length: taskList.length,
            pageIndex: 0,
            pageSize: this._pageEvent.pageSize,
          };
          this.pageEvent.next(this._pageEvent);
        }
        return taskList;
      })
    );
    this.selected = combineLatest([this.taskList, this._requestedTaskId$]).pipe(
      map(([taskList, requestedTaskId]) =>
        taskList.find((task) => task.id === requestedTaskId)
      )
    );
  }

  loadByScenarioTemplate(scenarioTemplateId: string) {
    this.taskStore.setLoading(true);
    return this.taskService
      .getScenarioTemplateTasks(scenarioTemplateId)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (tasks) => {
          this.taskStore.set(tasks);
        },
        (error) => {
          this.taskStore.set([]);
        }
      );
  }

  loadByScenario(scenarioId: string) {
    this.taskStore.setLoading(true);
    this.taskService
      .getScenarioTasks(scenarioId)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (tasks) => {
          this.taskStore.set(tasks);
        },
        (error) => {
          this.taskStore.set([]);
        }
      );
    this.resultDataService.loadByScenario(scenarioId);
  }

  loadByUser(userId: string) {
    this.taskStore.setLoading(true);
    this.taskService
      .getScenarioTasks(userId)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (tasks) => {
          this.taskStore.set(tasks);
        },
        (error) => {
          this.taskStore.set([]);
        }
      );
    this.resultDataService.loadByUser(userId);
  }

  loadByView(viewId: string, loadResults: boolean) {
    this.taskStore.setLoading(true);
    this.taskService
      .getViewTasks(viewId)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (tasks) => {
          this.taskStore.set(tasks);
        },
        (error) => {
          this.taskStore.set([]);
        }
      );

    if (loadResults) {
      this.resultDataService.loadByView(viewId);
    }
  }

  loadByVm(vmId: string) {
    this.taskStore.setLoading(true);
    this.taskService
      .getScenarioTasks(vmId)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (tasks) => {
          this.taskStore.set(tasks);
        },
        (error) => {
          this.taskStore.set([]);
        }
      );
    this.resultDataService.loadByVm(vmId);
  }

  loadById(id: string) {
    this.taskStore.setLoading(true);
    this.taskService
      .getTask(id)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((task) => {
        this.updateStore({ ...task });
        this.resultDataService.loadByTask(id);
      });
  }

  add(task: Task) {
    this.taskStore.setLoading(true);
    this.taskService
      .createTask(task)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((t) => {
        this.taskStore.add(t);
        this.setActive(t.id);
      });
  }

  updateTask(task: Task) {
    this.taskStore.setLoading(true);
    this.taskService
      .updateTask(task.id, task)
      .pipe(
        tap(() => {
          this.taskStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((dt) => {
        this.updateStore(dt);
      });
  }

  stopIterations(id: string) {
    const task = { ...this.taskQuery.getEntity(id) };
    task.status = TaskStatus.Cancelled;
    this.updateTask(task);
  }

  execute(id: string) {
    this.taskService
      .executeTask(id)
      .pipe(take(1))
      .subscribe((results) => {
        this.resultDataService.updateStoreMany(results);
      });
  }

  delete(id: string) {
    this.taskService
      .deleteTask(id)
      .pipe(take(1))
      .subscribe((dt) => {
        this.deleteFromStore(id);
      });
  }

  setActive(id: string) {
    this.router.navigate([], {
      queryParams: { taskId: id },
      queryParamsHandling: 'merge',
    });
  }

  setPageEvent(pageEvent: PageEvent) {
    this.taskStore.update({ pageEvent: pageEvent });
  }

  setClipboard(data: Clipboard) {
    this._clipboard = data;
    this.clipboard.next(data);
  }

  pasteClipboard(location: PasteLocation) {
    if (!!this._clipboard) {
      if (this._clipboard.isCut) {
        // isCut, so move the existing task
        this.taskService
          .moveTask(this._clipboard.id, location)
          .pipe(take(1))
          .subscribe((dts) => {
            dts.forEach((dt) => {
              this.updateStore(dt);
              if (!!dt.triggerTaskId) {
                this.setActive(dt.id);
              }
            });
          });
      } else if (!!this._clipboard.id) {
        // Task ID is supplied, so copy the existing Task
        this.taskService
          .copyTask(this._clipboard.id, location)
          .pipe(take(1))
          .subscribe((dts) => {
            dts.forEach((dt) => {
              this.taskStore.add(dt);
              if (!!dt.triggerTaskId) {
                this.setActive(dt.id);
              }
            });
          });
      } else if (!!this._clipboard.resultId) {
        // Result ID is supplied, so create a Task from the Result
        this.taskService
          .createTaskFromResult(this._clipboard.resultId, location)
          .pipe(take(1))
          .subscribe((task) => {
            this.taskStore.add(task);
            if (!!task.triggerTaskId) {
              this.setActive(task.id);
            }
          });
      }
    }
    this.setClipboard(null);
  }

  updateStore(task: Task) {
    this.taskStore.upsert(task.id, task);
  }

  deleteFromStore(id: string) {
    this.taskStore.remove(id);
  }

  resetStore() {
    this.taskStore.set([]);
    this.resultDataService.resetStore();
    if (this._requestedTaskId$.getValue()) {
      this.loadById(this._requestedTaskId$.getValue());
    }
  }

  setAsDates(result: Result) {
    // set to a date object.
    result.dateCreated = new Date(result.dateCreated);
    result.dateModified = new Date(result.dateModified);
    result.statusDate = new Date(result.statusDate);
    result.sentDate = new Date(result.sentDate);
  }
}
