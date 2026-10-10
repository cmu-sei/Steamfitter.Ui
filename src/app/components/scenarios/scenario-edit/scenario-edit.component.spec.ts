// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  Result,
  ResultService,
  Scenario,
  ScenarioPermission,
  Task,
  TaskService,
} from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { ScenarioEditComponent } from './scenario-edit.component';

@Component({ selector: 'app-tasks', template: '', standalone: false })
class TasksStubComponent {
  @Input() taskList?: Observable<Task[]>;
  @Input() resultList?: Observable<Result[]>;
  @Input() isLoading?: Observable<boolean>;
  @Input() scenarioTemplateId?: string;
  @Input() scenarioId?: string;
  @Input() isEditable?: boolean;
  @Input() isExecutable?: boolean;
  @Output() taskListChanged = new EventEmitter<void>();
  @Output() deleteTaskRequested = new EventEmitter<string>();
}

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return { id: 's1', name: 'Alpha', status: 'ready', ...overrides };
}

async function renderEdit(
  input: Scenario,
  // Every task permission on s1, so the status rows do not depend on which
  // one is read.
  scenarioPermissions: ScenarioPermission[] = [
    'ManageScenario',
    'EditScenario',
    'ExecuteScenario',
  ],
) {
  const taskApi = {
    getScenarioTasks: vi.fn(() =>
      of<Task[]>([
        { id: 't1', name: 'Ping', scenarioId: 's1' },
        { id: 't2', name: 'Reboot', scenarioId: 's1' },
      ]),
    ),
    deleteTask: vi.fn(() => of(null)),
  } satisfies ApiStub<TaskService>;
  const rendered = await renderComponent(ScenarioEditComponent, {
    declarations: [ScenarioEditComponent, TasksStubComponent],
    providers: [
      ...permissionDataProviders({
        scenarios: [{ scenarioId: 's1', permissions: scenarioPermissions }],
      }),
      { provide: TaskService, useValue: taskApi },
      {
        provide: ResultService,
        useValue: {
          getScenarioResults: vi.fn(() => of<Result[]>([])),
        } satisfies ApiStub<ResultService>,
      },
    ],
    inputs: { scenario: input },
  });
  const tasks = () =>
    rendered.fixture.debugElement.query(By.directive(TasksStubComponent))
      ?.componentInstance as TasksStubComponent | undefined;
  const taskNames = async () =>
    (await firstValueFrom(tasks()!.taskList!)).map((t) => t.name);
  return { ...rendered, taskApi, tasks, taskNames };
}

describe('ScenarioEditComponent', () => {
  /**
   * Verifies: the task tree is editable for a ready or active scenario and executable only for an active one.
   * Interacts with: the tasks stub's isEditable and isExecutable inputs.
   * Data: each row pairs a scenario status with the expected flags; the user holds Manage, Edit and Execute on the scenario.
   */
  it.each([
    { status: 'ready', isEditable: true, isExecutable: false },
    { status: 'active', isEditable: true, isExecutable: true },
    { status: 'ended', isEditable: false, isExecutable: false },
  ] as Array<{
    status: Scenario['status'];
    isEditable: boolean;
    isExecutable: boolean;
  }>)(
    'makes the tasks of a $status scenario editable $isEditable and executable $isExecutable',
    async ({ status, isEditable, isExecutable }) => {
      const { tasks } = await renderEdit(scenario({ status }));

      expect(tasks()?.scenarioId).toBe('s1');
      expect(tasks()?.isEditable).toBe(isEditable);
      expect(tasks()?.isExecutable).toBe(isExecutable);
    },
  );

  /**
   * Verifies: the task tree is editable and executable for a user who can only view the scenario (current behavior).
   * Interacts with: the tasks stub's isEditable and isExecutable inputs, real PermissionDataService via permissionDataProviders.
   * Data: an active scenario; ViewScenario on s1 only.
   */
  it('makes the tasks editable and executable for a user who can only view the scenario', async () => {
    const { tasks } = await renderEdit(scenario({ status: 'active' }), [
      'ViewScenario',
    ]);

    // Current behavior; see agent-docs/ui-test-bugs/steamfitter.ui.md.
    expect(tasks()?.isEditable).toBe(true);
    expect(tasks()?.isExecutable).toBe(true);
  });

  /**
   * Verifies: nothing is rendered until a scenario is given.
   * Interacts with: the template's scenario guard.
   * Data: scenario null.
   */
  it('renders no task tree without a scenario', async () => {
    const { tasks } = await renderEdit(null as unknown as Scenario);

    expect(tasks()).toBeUndefined();
  });

  /**
   * Verifies: a taskListChanged event reloads the scenario's tasks into the list the tree shows.
   * Interacts with: the tasks stub's taskListChanged output, real TaskDataService.loadByScenario and TaskQuery, TaskService.getScenarioTasks and ResultService.getScenarioResults stubs.
   * Data: a ready scenario s1 whose API task list holds Ping and Reboot.
   */
  it('reloads the task list when the tree reports a change', async () => {
    const { tasks, taskApi, taskNames } = await renderEdit(scenario());
    expect(await taskNames()).toEqual([]);

    tasks()!.taskListChanged.emit();

    expect(taskApi.getScenarioTasks).toHaveBeenCalledWith('s1');
    expect(await taskNames()).toEqual(['Ping', 'Reboot']);
  });

  /**
   * Verifies: a delete request from the tree deletes the task and removes it from the list.
   * Interacts with: the tasks stub's deleteTaskRequested output, real TaskDataService.delete, TaskService.deleteTask stub.
   * Data: tasks Ping and Reboot loaded; Ping is deleted.
   */
  it('removes a task the tree asks to delete', async () => {
    const { tasks, taskApi, taskNames } = await renderEdit(scenario());
    tasks()!.taskListChanged.emit();

    tasks()!.deleteTaskRequested.emit('t1');

    expect(taskApi.deleteTask).toHaveBeenCalledWith('t1');
    expect(await taskNames()).toEqual(['Reboot']);
  });
});
