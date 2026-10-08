// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  ScenarioTemplate,
  Task,
  TaskService,
} from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { ScenarioTemplateEditComponent } from './scenario-template-edit.component';

@Component({ selector: 'app-tasks', template: '', standalone: false })
class TasksStubComponent {
  @Input() taskList?: Observable<Task[]>;
  @Input() isLoading?: Observable<boolean>;
  @Input() scenarioTemplateId?: string;
  @Input() isEditable?: boolean;
  @Input() isExecutable?: boolean;
  @Output() taskListChanged = new EventEmitter<void>();
  @Output() deleteTaskRequested = new EventEmitter<string>();
}

async function renderEdit(input: ScenarioTemplate | null) {
  const taskApi = {
    getScenarioTemplateTasks: vi.fn(() =>
      of<Task[]>([
        { id: 't1', name: 'Ping', scenarioTemplateId: 'st1' },
        { id: 't2', name: 'Reboot', scenarioTemplateId: 'st1' },
      ]),
    ),
    deleteTask: vi.fn(() => of(null)),
  } satisfies ApiStub<TaskService>;
  const rendered = await renderComponent(ScenarioTemplateEditComponent, {
    declarations: [ScenarioTemplateEditComponent, TasksStubComponent],
    providers: [
      ...permissionDataProviders({
        scenarioTemplates: [
          { scenarioTemplateId: 'st1', permissions: ['ViewScenarioTemplate'] },
        ],
      }),
      { provide: TaskService, useValue: taskApi },
    ],
    inputs: { scenarioTemplate: input },
  });
  const tasks = () =>
    rendered.fixture.debugElement.query(By.directive(TasksStubComponent))
      ?.componentInstance as TasksStubComponent | undefined;
  const taskNames = async () =>
    (await firstValueFrom(tasks()!.taskList!)).map((t) => t.name);
  return { ...rendered, taskApi, tasks, taskNames };
}

describe('ScenarioTemplateEditComponent', () => {
  /**
   * Verifies: a template's task tree is always editable and never executable, also for a user who can only view the template (current behavior).
   * Interacts with: the tasks stub's isEditable and isExecutable inputs, real PermissionDataService via permissionDataProviders.
   * Data: template st1; ViewScenarioTemplate on st1 only.
   */
  it('makes the tasks editable for a user who can only view the template', async () => {
    const { tasks } = await renderEdit({ id: 'st1', name: 'Base' });

    expect(tasks()?.scenarioTemplateId).toBe('st1');
    // Current behavior; see agent-docs/ui-test-bugs/steamfitter.ui.md.
    expect(tasks()?.isEditable).toBe(true);
    expect(tasks()?.isExecutable).toBe(false);
  });

  /**
   * Verifies: nothing is rendered until a template is given.
   * Interacts with: the template's scenarioTemplate guard.
   * Data: scenarioTemplate null.
   */
  it('renders no task tree without a template', async () => {
    const { tasks } = await renderEdit(null);

    expect(tasks()).toBeUndefined();
  });

  /**
   * Verifies: a taskListChanged event reloads the template's tasks into the list the tree shows.
   * Interacts with: the tasks stub's taskListChanged output, real TaskDataService.loadByScenarioTemplate and TaskQuery, TaskService.getScenarioTemplateTasks stub.
   * Data: template st1 whose API task list holds Ping and Reboot.
   */
  it('reloads the task list when the tree reports a change', async () => {
    const { tasks, taskApi, taskNames } = await renderEdit({ id: 'st1' });

    tasks()!.taskListChanged.emit();

    expect(taskApi.getScenarioTemplateTasks).toHaveBeenCalledWith('st1');
    expect(await taskNames()).toEqual(['Ping', 'Reboot']);
  });

  /**
   * Verifies: a delete request from the tree deletes the task and removes it from the list.
   * Interacts with: the tasks stub's deleteTaskRequested output, real TaskDataService.delete, TaskService.deleteTask stub.
   * Data: tasks Ping and Reboot loaded; Reboot is deleted.
   */
  it('removes a task the tree asks to delete', async () => {
    const { tasks, taskApi, taskNames } = await renderEdit({ id: 'st1' });
    tasks()!.taskListChanged.emit();

    tasks()!.deleteTaskRequested.emit('t2');

    expect(taskApi.deleteTask).toHaveBeenCalledWith('t2');
    expect(await taskNames()).toEqual(['Ping']);
  });
});
