// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { Result, Task, TaskService } from 'src/app/generated/steamfitter.api';
import { TaskQuery } from 'src/app/data/task/task.query';
import { TaskStore } from 'src/app/data/task/task.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { TasksComponent } from './tasks.component';

@Component({ selector: 'app-task-tree', template: '', standalone: false })
class TaskTreeStubComponent {
  @Input() taskList?: Observable<Task[]>;
  @Input() resultList?: Observable<Result[]>;
  @Input() scenarioTemplateId?: string;
  @Input() scenarioId?: string;
  @Input() isEditableState?: boolean;
  @Input() isExecutableState?: boolean;
  @Input() isLoading?: Observable<boolean>;
  @Input() clipboard?: unknown;
  @Output() deleteTaskRequested = new EventEmitter<string>();
  @Output() executeRequested = new EventEmitter<string>();
  @Output() stopIterationsRequested = new EventEmitter<string>();
  @Output() saveTask = new EventEmitter<Task>();
  @Output() sendToClipboard = new EventEmitter<unknown>();
  @Output() pasteClipboard = new EventEmitter<string>();
  @Output() taskSelected = new EventEmitter<string>();
}

async function renderTasks(state: {
  isEditable: boolean;
  isExecutable: boolean;
}) {
  const taskApi = {
    deleteTask: vi.fn(() => of(null)),
  } satisfies ApiStub<TaskService>;
  const taskList = of<Task[]>([{ id: 't1', name: 'Ping', scenarioId: 's1' }]);
  const rendered = await renderComponent(TasksComponent, {
    declarations: [TasksComponent, TaskTreeStubComponent],
    providers: [{ provide: TaskService, useValue: taskApi }],
    inputs: { taskList, scenarioId: 's1', ...state },
  });
  const tree = () =>
    rendered.fixture.debugElement.query(By.directive(TaskTreeStubComponent))
      .componentInstance as TaskTreeStubComponent;
  return { ...rendered, taskApi, taskList, tree };
}

describe('TasksComponent', () => {
  /**
   * Verifies: the tree receives the task list, the scenario id, and the editable and executable flags exactly as given.
   * Interacts with: the task-tree stub's inputs.
   * Data: each row is one combination of isEditable and isExecutable for scenario s1.
   */
  it.each([
    { isEditable: true, isExecutable: true },
    { isEditable: true, isExecutable: false },
    { isEditable: false, isExecutable: false },
  ])(
    'passes isEditable $isEditable and isExecutable $isExecutable to the tree',
    async ({ isEditable, isExecutable }) => {
      const { tree, taskList } = await renderTasks({
        isEditable,
        isExecutable,
      });

      expect(tree().taskList).toBe(taskList);
      expect(tree().scenarioId).toBe('s1');
      expect(tree().isEditableState).toBe(isEditable);
      expect(tree().isExecutableState).toBe(isExecutable);
    },
  );

  /**
   * Verifies: a delete request from the tree deletes the task and removes it from the store.
   * Interacts with: the tree stub's deleteTaskRequested output, real TaskDataService.delete, TaskService.deleteTask stub, real TaskStore and TaskQuery.
   * Data: task t1 in the store; the tree asks to delete it.
   */
  it('deletes a task the tree asks to delete', async () => {
    const { tree, taskApi } = await renderTasks({
      isEditable: true,
      isExecutable: false,
    });
    TestBed.inject(TaskStore).set([
      { id: 't1', name: 'Ping', scenarioId: 's1' },
    ]);

    tree().deleteTaskRequested.emit('t1');

    expect(taskApi.deleteTask).toHaveBeenCalledWith('t1');
    expect(TestBed.inject(TaskQuery).getAll()).toEqual([]);
  });
});
