// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  Result,
  ResultService,
  Task,
  TaskService,
} from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { ResultQuery } from 'src/app/data/result/result.query';
import { ResultStore } from 'src/app/data/result/result.store';
import { TaskDataService } from './task-data.service';
import { TaskQuery } from './task.query';
import { TaskStore } from './task.store';

// HttpClient hands the data services parsed JSON, so dates arrive as ISO
// strings even though the generated model types them as Date.
const iso = (value: string) => value as unknown as Date;

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    name: 'Ping',
    scenarioId: 's1',
    status: 'none',
    ...overrides,
  };
}

function apiResult(overrides: Partial<Result> = {}): Result {
  return {
    id: 'r1',
    taskId: 't1',
    vmName: 'vm-1',
    status: 'succeeded',
    dateCreated: iso('2026-01-01T00:00:00Z'),
    dateModified: iso('2026-01-01T00:01:00Z'),
    statusDate: iso('2026-01-01T00:02:00Z'),
    sentDate: iso('2026-01-01T00:03:00Z'),
    ...overrides,
  };
}

function setup(
  options: {
    params?: Params;
    taskApi?: ApiStub<TaskService>;
    resultApi?: ApiStub<ResultService>;
  } = {},
) {
  const { route, setQueryParams } = activatedRouteStub(options.params);
  const router = {
    navigate: vi.fn<Router['navigate']>(() => Promise.resolve(true)),
  } satisfies Pick<Router, 'navigate'>;
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      options.taskApi
        ? { provide: TaskService, useValue: options.taskApi }
        : unstubbed(TaskService),
      options.resultApi
        ? { provide: ResultService, useValue: options.resultApi }
        : unstubbed(ResultService),
    ]),
  });
  return {
    service: TestBed.inject(TaskDataService),
    store: TestBed.inject(TaskStore),
    query: TestBed.inject(TaskQuery),
    resultQuery: TestBed.inject(ResultQuery),
    navigate: router.navigate,
    setQueryParams,
  };
}

describe('TaskDataService', () => {
  describe('loading tasks', () => {
    /**
     * Verifies: loadByScenarioTemplate() replaces the stored tasks with the template's tasks and clears loading.
     * Interacts with: TaskService.getScenarioTemplateTasks stub, TaskQuery.
     * Data: a stale task; the template has two tasks.
     */
    it('loadByScenarioTemplate() replaces the stored tasks', () => {
      const taskApi = {
        getScenarioTemplateTasks: vi.fn(() =>
          of([task({ id: 'b', name: 'B' }), task({ id: 'a', name: 'A' })]),
        ),
      } satisfies ApiStub<TaskService>;
      const { service, store, query } = setup({ taskApi });
      store.set([task({ id: 'stale' })]);

      service.loadByScenarioTemplate('tmpl');

      expect(taskApi.getScenarioTemplateTasks).toHaveBeenCalledWith('tmpl');
      expect(query.getAll().map((t) => t.id)).toEqual(['a', 'b']);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: a failed task load empties the store and clears loading.
     * Interacts with: TaskService.getScenarioTemplateTasks stub (throws).
     * Data: one stored task; the API errors.
     */
    it('empties the store when the API fails', () => {
      const { service, store, query } = setup({
        taskApi: {
          getScenarioTemplateTasks: () => throwError(() => new Error('boom')),
        },
      });
      store.set([task()]);

      service.loadByScenarioTemplate('tmpl');

      expect(query.getAll()).toEqual([]);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: loadByScenario() loads the scenario's tasks and replaces the results with the scenario's results (dates converted).
     * Interacts with: TaskService.getScenarioTasks and ResultService.getScenarioResults stubs, TaskQuery, ResultQuery.
     * Data: scenario 's1' with one task and one result; a stale result already stored.
     */
    it('loadByScenario() loads the tasks and the scenario results', () => {
      const { service, query, resultQuery } = setup({
        taskApi: { getScenarioTasks: () => of([task()]) },
        resultApi: { getScenarioResults: () => of([apiResult()]) },
      });
      service.updateStore(task({ id: 'old' }));

      service.loadByScenario('s1');

      expect(query.getAll().map((t) => t.id)).toEqual(['t1']);
      expect(resultQuery.getAll().map((r) => r.id)).toEqual(['r1']);
      expect(resultQuery.getEntity('r1').statusDate).toEqual(
        new Date('2026-01-01T00:02:00Z'),
      );
    });

    /**
     * Verifies: loadByView() loads the view's tasks and only loads the view's results when asked to.
     * Interacts with: TaskService.getViewTasks and ResultService.getViewResults stubs.
     * Data: view 'v1'; called once with loadResults=false and once with true.
     */
    it('loadByView() loads results only when loadResults is true', () => {
      const resultApi = {
        getViewResults: vi.fn(() => of([apiResult()])),
      } satisfies ApiStub<ResultService>;
      const { service, query, resultQuery } = setup({
        taskApi: { getViewTasks: () => of([task()]) },
        resultApi,
      });

      service.loadByView('v1', false);
      expect(query.getAll().map((t) => t.id)).toEqual(['t1']);
      expect(resultApi.getViewResults).not.toHaveBeenCalled();

      service.loadByView('v1', true);
      expect(resultApi.getViewResults).toHaveBeenCalledWith('v1');
      expect(resultQuery.getCount()).toBe(1);
    });

    /**
     * Verifies: loadByUser() and loadByVm() fetch tasks from the scenario-tasks endpoint, passing the user or VM id as a scenario id.
     * Interacts with: TaskService.getScenarioTasks, ResultService.getUserResults/getVmResults stubs.
     * Data: user id 'u1' and VM id 'vm1'.
     */
    it('loadByUser() and loadByVm() query scenario tasks with a user or VM id', () => {
      const taskApi = {
        getScenarioTasks: vi.fn(() => of([])),
      } satisfies ApiStub<TaskService>;
      const resultApi = {
        getUserResults: vi.fn(() => of([])),
        getVmResults: vi.fn(() => of([])),
      } satisfies ApiStub<ResultService>;
      const { service } = setup({ taskApi, resultApi });

      service.loadByUser('u1');
      service.loadByVm('vm1');

      expect(taskApi.getScenarioTasks.mock.calls).toEqual([['u1'], ['vm1']]);
      expect(resultApi.getUserResults).toHaveBeenCalledWith('u1');
      expect(resultApi.getVmResults).toHaveBeenCalledWith('vm1');
    });
  });

  describe('URL selection', () => {
    /**
     * Verifies: a taskId in the URL loads that task and its results, and selected emits it.
     * Interacts with: TaskService.getTask, ResultService.getTaskResults stubs, TaskDataService.selected.
     * Data: URL taskId=t1; the task has one result.
     */
    it('loads and selects the task named in the URL', async () => {
      const taskApi = {
        getTask: vi.fn((id: string) => of(task({ id }))),
      } satisfies ApiStub<TaskService>;
      const { service, query, resultQuery } = setup({
        params: { taskId: 't1' },
        taskApi,
        resultApi: { getTaskResults: () => of([apiResult()]) },
      });

      expect(taskApi.getTask).toHaveBeenCalledWith('t1');
      expect(query.hasEntity('t1')).toBe(true);
      expect(resultQuery.getAll().map((r) => r.id)).toEqual(['r1']);
      expect((await firstValueFrom(service.selected))?.id).toBe('t1');
      expect(await firstValueFrom(service.requestedTaskId$)).toBe('t1');
    });

    /**
     * Verifies: re-navigating with the same taskId does not refetch, and clearing it does not fetch.
     * Interacts with: ActivatedRoute stub, TaskService.getTask stub.
     * Data: URL taskId=t1, then an unrelated param change, then taskId removed.
     */
    it('only fetches when the taskId changes to a non-empty value', () => {
      const taskApi = {
        getTask: vi.fn((id: string) => of(task({ id }))),
      } satisfies ApiStub<TaskService>;
      const { setQueryParams } = setup({
        params: { taskId: 't1' },
        taskApi,
        resultApi: { getTaskResults: () => of([]) },
      });

      setQueryParams({ taskId: 't1', taskmask: 'x' });
      setQueryParams({});

      expect(taskApi.getTask).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies: setActive() merges taskId into the URL and setActive('') clears it.
     * Interacts with: TaskDataService.setActive, Router.navigate spy.
     * Data: ids 't9' and ''.
     */
    it('setActive() writes and clears the taskId param', () => {
      const { service, navigate } = setup();

      service.setActive('t9');
      expect(navigate).toHaveBeenLastCalledWith([], {
        queryParams: { taskId: 't9' },
        queryParamsHandling: 'merge',
      });

      service.setActive('');
      expect(navigate).toHaveBeenLastCalledWith([], {
        queryParams: { taskId: null },
        queryParamsHandling: 'merge',
      });
    });
  });

  describe('task changes', () => {
    /**
     * Verifies: add() stores the created task and selects it in the URL.
     * Interacts with: TaskService.createTask stub, Router.navigate spy.
     * Data: the API returns task 'new'.
     */
    it('add() stores and selects the created task', () => {
      const { service, query, navigate } = setup({
        taskApi: {
          createTask: () => of(task({ id: 'new', name: 'New' })),
        },
      });

      service.add({ name: 'New' });

      expect(query.getEntity('new').name).toBe('New');
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { taskId: 'new' },
        queryParamsHandling: 'merge',
      });
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: stopIterations() sends the stored task back with status cancelled and stores the result.
     * Interacts with: TaskService.updateTask stub, TaskQuery.
     * Data: a running task with 5 iterations.
     */
    it('stopIterations() cancels the task through updateTask', () => {
      const taskApi = {
        updateTask: vi.fn((id: string, form: Task) => of({ ...form, id })),
      } satisfies ApiStub<TaskService>;
      const { service, query } = setup({ taskApi });
      service.updateStore(task({ status: 'pending', iterations: 5 }));

      service.stopIterations('t1');

      expect(taskApi.updateTask).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ status: 'cancelled', iterations: 5 }),
      );
      expect(query.getEntity('t1').status).toBe('cancelled');
    });

    /**
     * Verifies: execute() merges the returned results into the result store with Date fields.
     * Interacts with: TaskService.executeTask stub, ResultQuery.
     * Data: an existing result 'r0' and two new results from the execution.
     */
    it('execute() merges the execution results into the result store', () => {
      const taskApi = {
        executeTask: vi.fn(() =>
          of([
            apiResult({ id: 'r1' }),
            apiResult({ id: 'r2', vmName: 'vm-2' }),
          ]),
        ),
      } satisfies ApiStub<TaskService>;
      const { service, resultQuery } = setup({ taskApi });
      TestBed.inject(ResultStore).set([apiResult({ id: 'r0' })]);

      service.execute('t1');

      expect(taskApi.executeTask).toHaveBeenCalledWith('t1');
      expect(resultQuery.getAll().map((r) => r.id)).toEqual(['r0', 'r1', 'r2']);
      expect(resultQuery.getEntity('r2').sentDate).toBeInstanceOf(Date);
    });

    /**
     * Verifies: delete() removes the task; deleteFromStore() (SignalR) does the same without an API call.
     * Interacts with: TaskService.deleteTask stub, TaskQuery.
     * Data: tasks 't1' and 't2'.
     */
    it('delete() and deleteFromStore() remove tasks', () => {
      const taskApi = {
        deleteTask: vi.fn(() => of(null)),
      } satisfies ApiStub<TaskService>;
      const { service, store, query } = setup({ taskApi });
      store.set([task(), task({ id: 't2', name: 'Two' })]);

      service.delete('t1');
      service.deleteFromStore('t2');

      expect(taskApi.deleteTask).toHaveBeenCalledTimes(1);
      expect(query.getAll()).toEqual([]);
    });

    /**
     * Verifies: resetStore() clears tasks and results, then reloads the task still selected in the URL.
     * Interacts with: TaskService.getTask and ResultService.getTaskResults stubs, TaskQuery, ResultQuery.
     * Data: URL taskId=t1 plus extra stored tasks and results.
     */
    it('resetStore() clears tasks and results and reloads the selected task', () => {
      const taskApi = {
        getTask: vi.fn((id: string) => of(task({ id }))),
      } satisfies ApiStub<TaskService>;
      const { service, store, query, resultQuery } = setup({
        params: { taskId: 't1' },
        taskApi,
        resultApi: { getTaskResults: () => of([]) },
      });
      store.add(task({ id: 'extra', name: 'Extra' }));

      service.resetStore();

      expect(taskApi.getTask).toHaveBeenCalledTimes(2);
      expect(query.getAll().map((t) => t.id)).toEqual(['t1']);
      expect(resultQuery.getAll()).toEqual([]);
    });
  });

  describe('failed requests', () => {
    const fail = () => throwError(() => new Error('boom'));
    const failingApi = {
      getTask: fail,
      createTask: fail,
      updateTask: fail,
      executeTask: fail,
      deleteTask: fail,
      moveTask: fail,
      copyTask: fail,
      createTaskFromResult: fail,
    } satisfies ApiStub<TaskService>;
    const location = { id: 'parent', locationType: 'task' };

    /**
     * Verifies: a failed request in each task method escapes as an unhandled rxjs error, and the methods that set loading leave it set (current behavior).
     * Interacts with: failing TaskService stubs, captureUnhandledRxErrors, TaskQuery.
     * Data: one row per method (pasteClipboard once per clipboard kind); every API call fails with 'boom'; the store starts with loading false.
     */
    it.each([
      {
        name: 'loadById',
        act: (s: TaskDataService) => s.loadById('t1'),
        loading: true,
      },
      {
        name: 'add',
        act: (s: TaskDataService) => s.add({ name: 'New' }),
        loading: true,
      },
      {
        name: 'updateTask',
        act: (s: TaskDataService) => s.updateTask(task()),
        loading: true,
      },
      {
        name: 'execute',
        act: (s: TaskDataService) => s.execute('t1'),
        loading: false,
      },
      {
        name: 'delete',
        act: (s: TaskDataService) => s.delete('t1'),
        loading: false,
      },
      {
        name: 'pasteClipboard (cut)',
        act: (s: TaskDataService) => {
          s.setClipboard({ id: 't1', resultId: undefined, isCut: true });
          s.pasteClipboard(location);
        },
        loading: false,
      },
      {
        name: 'pasteClipboard (copy)',
        act: (s: TaskDataService) => {
          s.setClipboard({ id: 't1', resultId: undefined, isCut: false });
          s.pasteClipboard(location);
        },
        loading: false,
      },
      {
        name: 'pasteClipboard (result)',
        act: (s: TaskDataService) => {
          s.setClipboard({ id: undefined, resultId: 'r1', isCut: false });
          s.pasteClipboard(location);
        },
        loading: false,
      },
    ])(
      '$name lets the API error escape unhandled (loading left $loading)',
      async ({ act, loading }) => {
        const errors = captureUnhandledRxErrors();
        const { service, store, query } = setup({ taskApi: failingApi });
        store.setLoading(false);

        act(service);
        await flush();

        expect(errors).toEqual([new Error('boom')]);
        expect(query.getValue().loading).toBe(loading);
      },
    );
  });

  describe('clipboard', () => {
    const location = { id: 'parent', locationType: 'task' };

    /**
     * Verifies: pasting a cut task moves it, stores the moved tasks, selects the one with a trigger, and empties the clipboard.
     * Interacts with: TaskService.moveTask stub, TaskQuery, Router.navigate spy, clipboard subject.
     * Data: clipboard {id: 't1', isCut: true}; the API returns the moved task under 'parent'.
     */
    it('pastes a cut task by moving it', () => {
      const taskApi = {
        moveTask: vi.fn(() => of([task({ triggerTaskId: 'parent' })])),
      } satisfies ApiStub<TaskService>;
      const { service, store, query, navigate } = setup({ taskApi });
      store.set([task()]);
      const clipboard = recordEmissions(service.clipboard);

      service.setClipboard({ id: 't1', resultId: undefined, isCut: true });
      service.pasteClipboard(location);

      expect(taskApi.moveTask).toHaveBeenCalledWith('t1', location);
      expect(query.getEntity('t1').triggerTaskId).toBe('parent');
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { taskId: 't1' },
        queryParamsHandling: 'merge',
      });
      expect(clipboard.map((c) => c?.isCut ?? null)).toEqual([
        null,
        true,
        null,
      ]);
    });

    /**
     * Verifies: pasting a copied task adds the copies without selecting a copy that has no trigger.
     * Interacts with: TaskService.copyTask stub, TaskQuery, Router.navigate spy.
     * Data: clipboard {id: 't1', isCut: false}; the API returns copy 't1-copy' at the root.
     */
    it('pastes a copied task by adding the copy', () => {
      const taskApi = {
        copyTask: vi.fn(() => of([task({ id: 't1-copy', name: 'Ping copy' })])),
      } satisfies ApiStub<TaskService>;
      const { service, store, query, navigate } = setup({ taskApi });
      store.set([task()]);

      service.setClipboard({ id: 't1', resultId: undefined, isCut: false });
      service.pasteClipboard({ id: 's1', locationType: 'scenario' });

      expect(taskApi.copyTask).toHaveBeenCalledWith('t1', {
        id: 's1',
        locationType: 'scenario',
      });
      expect(query.getAll().map((t) => t.id)).toEqual(['t1', 't1-copy']);
      expect(navigate).not.toHaveBeenCalled();
    });

    /**
     * Verifies: pasting a result creates a task from it.
     * Interacts with: TaskService.createTaskFromResult stub, TaskQuery.
     * Data: clipboard {resultId: 'r1'} with no task id.
     */
    it('pastes a result by creating a task from it', () => {
      const taskApi = {
        createTaskFromResult: vi.fn(() => of(task({ id: 'from-result' }))),
      } satisfies ApiStub<TaskService>;
      const { service, query } = setup({ taskApi });

      service.setClipboard({ id: undefined, resultId: 'r1', isCut: false });
      service.pasteClipboard(location);

      expect(taskApi.createTaskFromResult).toHaveBeenCalledWith('r1', location);
      expect(query.hasEntity('from-result')).toBe(true);
    });

    /**
     * Verifies: pasting with an empty clipboard makes no API call and leaves the clipboard empty.
     * Interacts with: TaskDataService.pasteClipboard with the default (all-placeholder) TaskService stub.
     * Data: no clipboard set.
     */
    it('does nothing when the clipboard is empty', async () => {
      const { service } = setup();
      service.pasteClipboard(location);
      expect(await firstValueFrom(service.clipboard)).toBeNull();
    });
  });

  describe('dates', () => {
    /**
     * Verifies: setAsDates() turns a null dateModified into the 1970 epoch.
     * Interacts with: TaskDataService.setAsDates.
     * Data: a result that was never modified (dateModified null, as the API's DateTime? sends it).
     */
    it('setAsDates() turns a null dateModified into the 1970 epoch', () => {
      const { service } = setup();
      const result = apiResult({ dateModified: null });

      service.setAsDates(result);

      expect(result.dateModified).toEqual(new Date(0));
    });
  });

  describe('taskList', () => {
    /**
     * Verifies: the taskmask param filters tasks by name or id, case-insensitively.
     * Interacts with: TaskDataService.taskList, fake route params.
     * Data: tasks 'Ping' (t1) and 'Reboot' (t2); masks 'PING' and 't2'.
     */
    it.each([
      { mask: 'PING', ids: ['t1'] },
      { mask: 't2', ids: ['t2'] },
    ])('filters by taskmask "$mask"', async ({ mask, ids }) => {
      const { service, store } = setup({ params: { taskmask: mask } });
      store.set([task(), task({ id: 't2', name: 'Reboot' })]);
      const list = await firstValueFrom(service.taskList);
      expect(list.map((t) => t.id)).toEqual(ids);
    });

    /**
     * Verifies: taskList returns only the first page and reports the page's size, not the total, as the page length.
     * Interacts with: TaskDataService.taskList and pageEvent.
     * Data: 12 tasks with the default page size of 10.
     */
    it('returns one page and reports the page size as the length', async () => {
      const { service, store } = setup();
      store.set(
        Array.from({ length: 12 }, (_, i) =>
          task({ id: `t${i}`, name: `Task ${String(i).padStart(2, '0')}` }),
        ),
      );

      const list = await firstValueFrom(service.taskList);

      expect(list).toHaveLength(10);
      expect((await firstValueFrom(service.pageEvent)).length).toBe(10);
    });
  });
});
