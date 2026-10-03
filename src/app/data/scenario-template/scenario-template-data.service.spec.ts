// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  ScenarioTemplate,
  ScenarioTemplateService,
  TaskService,
  VmCredentialService,
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
import { TaskQuery } from 'src/app/data/task/task.query';
import { ScenarioTemplateDataService } from './scenario-template-data.service';
import { ScenarioTemplateQuery } from './scenario-template.query';
import { ScenarioTemplateStore } from './scenario-template.store';

function template(overrides: Partial<ScenarioTemplate> = {}): ScenarioTemplate {
  return {
    id: 't1',
    name: 'Alpha',
    description: 'first template',
    durationHours: 2,
    ...overrides,
  };
}

function setup(
  options: {
    params?: Params;
    templateApi?: ApiStub<ScenarioTemplateService>;
    taskApi?: ApiStub<TaskService>;
    vmCredentialApi?: ApiStub<VmCredentialService>;
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
      options.templateApi
        ? { provide: ScenarioTemplateService, useValue: options.templateApi }
        : unstubbed(ScenarioTemplateService),
      options.taskApi
        ? { provide: TaskService, useValue: options.taskApi }
        : unstubbed(TaskService),
      options.vmCredentialApi
        ? { provide: VmCredentialService, useValue: options.vmCredentialApi }
        : unstubbed(VmCredentialService),
    ]),
  });
  return {
    service: TestBed.inject(ScenarioTemplateDataService),
    store: TestBed.inject(ScenarioTemplateStore),
    query: TestBed.inject(ScenarioTemplateQuery),
    taskQuery: TestBed.inject(TaskQuery),
    navigate: router.navigate,
    setQueryParams,
  };
}

describe('ScenarioTemplateDataService', () => {
  describe('load()', () => {
    /**
     * Verifies: load() replaces the store contents with the API's templates and clears loading.
     * Interacts with: ScenarioTemplateService.getScenarioTemplates stub, real store/query.
     * Data: a stale template in the store; the API returns two others.
     */
    it('replaces the stored templates and clears loading', () => {
      const templateApi = {
        getScenarioTemplates: vi.fn(() =>
          of([
            template({ id: 'b', name: 'Bravo' }),
            template({ id: 'a', name: 'Alpha' }),
          ]),
        ),
      } satisfies ApiStub<ScenarioTemplateService>;
      const { service, store, query } = setup({ templateApi });
      store.set([template({ id: 'stale' })]);

      service.load();

      expect(query.getAll().map((t) => t.id)).toEqual(['a', 'b']);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: a failed load() empties the store and clears loading.
     * Interacts with: ScenarioTemplateService.getScenarioTemplates stub (throws).
     * Data: one stored template; the API errors.
     */
    it('empties the store when the API fails', () => {
      const { service, store, query } = setup({
        templateApi: {
          getScenarioTemplates: () => throwError(() => new Error('boom')),
        },
      });
      store.set([template()]);

      service.load();

      expect(query.getAll()).toEqual([]);
      expect(query.getValue().loading).toBe(false);
    });
  });

  describe('loadById()', () => {
    /**
     * Verifies: loadById() upserts the fetched template and clears loading.
     * Interacts with: ScenarioTemplateService.getScenarioTemplate stub.
     * Data: template 't1' fetched with a new name.
     */
    it('upserts the fetched template', () => {
      const templateApi = {
        getScenarioTemplate: vi.fn((id: string) =>
          of(template({ id, name: 'Fetched' })),
        ),
      } satisfies ApiStub<ScenarioTemplateService>;
      const { service, store, query } = setup({ templateApi });
      store.set([template()]);

      service.loadById('t1');

      expect(templateApi.getScenarioTemplate).toHaveBeenCalledWith('t1');
      expect(query.getEntity('t1').name).toBe('Fetched');
      expect(query.getValue().loading).toBe(false);
    });
  });

  describe('creating, updating and deleting', () => {
    /**
     * Verifies: add() and copyScenarioTemplate() store the new template and select it, clearing scenario and view selection.
     * Interacts with: createScenarioTemplate/copyScenarioTemplate stubs, Router.navigate spy.
     * Data: the URL starts with scenarioId and viewId; the API returns template 'new'.
     */
    it.each([
      {
        name: 'add()',
        act: (s: ScenarioTemplateDataService) => s.add({ name: 'New' }),
        templateApi: {
          createScenarioTemplate: () =>
            of(template({ id: 'new', name: 'New' })),
        } satisfies ApiStub<ScenarioTemplateService>,
      },
      {
        name: 'copyScenarioTemplate()',
        act: (s: ScenarioTemplateDataService) => s.copyScenarioTemplate('t1'),
        templateApi: {
          copyScenarioTemplate: () => of(template({ id: 'new', name: 'New' })),
        } satisfies ApiStub<ScenarioTemplateService>,
      },
    ])('$name stores and selects the new template', ({ act, templateApi }) => {
      const { service, query, navigate } = setup({
        params: { scenarioId: 's1', viewId: 'v1', tab: 'Scenario Templates' },
        templateApi,
      });

      act(service);

      expect(query.getEntity('new').name).toBe('New');
      // Merged into the URL: selects 'new' and drops scenarioId and viewId.
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: {
          scenarioTemplateId: 'new',
          scenarioId: null,
          viewId: null,
        },
        queryParamsHandling: 'merge',
      });
    });

    /**
     * Verifies: updateScenarioTemplate() sends the template and stores the API's version.
     * Interacts with: ScenarioTemplateService.updateScenarioTemplate stub.
     * Data: template 't1' whose duration the API changes to 8.
     */
    it('updateScenarioTemplate() stores the updated template', () => {
      const templateApi = {
        updateScenarioTemplate: vi.fn((id: string, form: ScenarioTemplate) =>
          of(template({ ...form, id, durationHours: 8 })),
        ),
      } satisfies ApiStub<ScenarioTemplateService>;
      const { service, store, query } = setup({ templateApi });
      store.set([template()]);

      service.updateScenarioTemplate(template({ name: 'Edited' }));

      expect(templateApi.updateScenarioTemplate).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ name: 'Edited' }),
      );
      expect(query.getEntity('t1')).toMatchObject({
        name: 'Edited',
        durationHours: 8,
      });
    });

    /**
     * Verifies: delete() removes the template and clears the template selection.
     * Interacts with: ScenarioTemplateService.deleteScenarioTemplate stub, Router.navigate spy.
     * Data: templates 't1' and 't2'; the URL selects 't1'.
     */
    it('delete() removes the template and clears the selection', () => {
      const templateApi = {
        deleteScenarioTemplate: vi.fn(() => of(null)),
      } satisfies ApiStub<ScenarioTemplateService>;
      const { service, store, query, navigate } = setup({
        params: { scenarioTemplateId: 't1' },
        templateApi,
      });
      store.set([template(), template({ id: 't2', name: 'Two' })]);

      service.delete('t1');

      expect(query.getAll().map((t) => t.id)).toEqual(['t2']);
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: {
          scenarioTemplateId: null,
          scenarioId: null,
          viewId: null,
        },
        queryParamsHandling: 'merge',
      });
    });

    /**
     * Verifies: adding or deleting a VM credential re-fetches the owning template.
     * Interacts with: VmCredentialService and ScenarioTemplateService.getScenarioTemplate stubs.
     * Data: template 't1' refetched with one credential, then none.
     */
    it('reloads the template after a VM credential is added or deleted', () => {
      const credential = { id: 'c1', scenarioTemplateId: 't1', username: 'u' };
      const getScenarioTemplate = vi
        .fn((id: string) => of(template({ id })))
        .mockReturnValueOnce(of(template({ vmCredentials: [credential] })))
        .mockReturnValueOnce(of(template({ vmCredentials: [] })));
      const { service, query } = setup({
        templateApi: { getScenarioTemplate },
        vmCredentialApi: {
          createVmCredential: () => of(credential),
          deleteVmCredential: () => of(null),
        },
      });

      service.addVmCredential(credential);
      expect(query.getEntity('t1').vmCredentials).toEqual([credential]);

      service.deleteVmCredential('t1', 'c1');
      expect(query.getEntity('t1').vmCredentials).toEqual([]);
    });

    /**
     * Verifies: updateStore() and deleteFromStore() (the SignalR entry points) upsert and remove templates.
     * Interacts with: ScenarioTemplateDataService.updateStore/deleteFromStore, ScenarioTemplateQuery.
     * Data: template 't1' pushed, updated, then deleted.
     */
    it('updateStore() upserts and deleteFromStore() removes', () => {
      const { service, query } = setup();
      const seen = recordEmissions(query.selectById('t1'));

      service.updateStore(template());
      service.updateStore(template({ name: 'Renamed' }));
      service.deleteFromStore('t1');

      expect(seen.map((t) => t?.name)).toEqual([
        undefined,
        'Alpha',
        'Renamed',
        undefined,
      ]);
    });
  });

  describe('failed requests', () => {
    const fail = () => throwError(() => new Error('boom'));
    const failingTemplateApi = {
      getScenarioTemplate: fail,
      createScenarioTemplate: fail,
      copyScenarioTemplate: fail,
      updateScenarioTemplate: fail,
      deleteScenarioTemplate: fail,
    } satisfies ApiStub<ScenarioTemplateService>;
    const failingVmCredentialApi = {
      createVmCredential: fail,
      deleteVmCredential: fail,
    } satisfies ApiStub<VmCredentialService>;

    /**
     * Verifies: a failed request in each template method other than load() escapes as an unhandled rxjs error, and the methods that set loading leave it set (current behavior).
     * Interacts with: failing ScenarioTemplateService and VmCredentialService stubs, captureUnhandledRxErrors, ScenarioTemplateQuery.
     * Data: one row per method; every API call fails with 'boom'; the store starts with loading false.
     */
    it.each([
      {
        name: 'loadById',
        act: (s: ScenarioTemplateDataService) => s.loadById('t1'),
        loading: true,
      },
      {
        name: 'add',
        act: (s: ScenarioTemplateDataService) => s.add({ name: 'New' }),
        loading: true,
      },
      {
        name: 'copyScenarioTemplate',
        act: (s: ScenarioTemplateDataService) => s.copyScenarioTemplate('t1'),
        loading: true,
      },
      {
        name: 'updateScenarioTemplate',
        act: (s: ScenarioTemplateDataService) =>
          s.updateScenarioTemplate(template()),
        loading: true,
      },
      {
        name: 'delete',
        act: (s: ScenarioTemplateDataService) => s.delete('t1'),
        loading: false,
      },
      {
        name: 'addVmCredential',
        act: (s: ScenarioTemplateDataService) =>
          s.addVmCredential({ scenarioTemplateId: 't1', username: 'u' }),
        loading: false,
      },
      {
        name: 'deleteVmCredential',
        act: (s: ScenarioTemplateDataService) =>
          s.deleteVmCredential('t1', 'c1'),
        loading: false,
      },
    ])(
      '$name() lets the API error escape unhandled (loading left $loading)',
      async ({ act, loading }) => {
        const errors = captureUnhandledRxErrors();
        const { service, store, query } = setup({
          templateApi: failingTemplateApi,
          vmCredentialApi: failingVmCredentialApi,
        });
        store.setLoading(false);

        act(service);
        await flush();

        expect(errors).toEqual([new Error('boom')]);
        expect(query.getValue().loading).toBe(loading);
      },
    );
  });

  describe('scenarioTemplateList', () => {
    const templates = [
      template({
        id: 'aaa-1',
        name: 'alpha',
        description: 'Zulu',
        durationHours: 3,
        dateCreated: '2026-03-01T00:00:00Z' as unknown as Date,
      }),
      template({
        id: 'bbb-2',
        name: 'Bravo',
        description: 'yankee',
        durationHours: 1,
        dateCreated: '2026-01-01T00:00:00Z' as unknown as Date,
      }),
      template({
        id: 'ccc-3',
        name: 'charlie',
        description: 'X-ray',
        durationHours: 2,
        dateCreated: '2026-02-01T00:00:00Z' as unknown as Date,
      }),
    ];

    function seeded(params: Params) {
      const ctx = setup({ params });
      ctx.store.set(templates.map((t) => ({ ...t })));
      return ctx;
    }

    /**
     * Verifies: the scenarioTemplatemask param filters on name or id, case-insensitively.
     * Interacts with: ScenarioTemplateDataService.scenarioTemplateList.
     * Data: masks 'BRAVO' (name) and 'ccc' (id).
     */
    it.each([
      { mask: 'BRAVO', ids: ['bbb-2'] },
      { mask: 'ccc', ids: ['ccc-3'] },
    ])('filters by scenarioTemplatemask "$mask"', async ({ mask, ids }) => {
      const { service } = seeded({ scenarioTemplatemask: mask });
      const list = await firstValueFrom(service.scenarioTemplateList);
      expect(list.map((t) => t.id)).toEqual(ids);
    });

    /**
     * Verifies: sorton/sortdir choose the column and direction for each supported column.
     * Interacts with: ScenarioTemplateDataService.scenarioTemplateList.
     * Data: sorts by name, description, durationHours, and dateCreated.
     */
    it.each([
      { sorton: 'name', sortdir: 'desc', ids: ['ccc-3', 'bbb-2', 'aaa-1'] },
      {
        sorton: 'description',
        sortdir: 'asc',
        ids: ['ccc-3', 'bbb-2', 'aaa-1'],
      },
      {
        sorton: 'durationHours',
        sortdir: 'asc',
        ids: ['bbb-2', 'ccc-3', 'aaa-1'],
      },
      {
        sorton: 'dateCreated',
        sortdir: 'desc',
        ids: ['aaa-1', 'ccc-3', 'bbb-2'],
      },
    ])('sorts by $sorton $sortdir', async ({ sorton, sortdir, ids }) => {
      const { service } = seeded({ sorton, sortdir });
      const list = await firstValueFrom(service.scenarioTemplateList);
      expect(list.map((t) => t.id)).toEqual(ids);
    });

    /**
     * Verifies: sorting by description errors the list stream when a template has no description.
     * Interacts with: ScenarioTemplateDataService.scenarioTemplateList.
     * Data: one template with a null description; URL sorton=description.
     */
    it('errors when sorting by description and a template has none', async () => {
      const { service, store } = setup({ params: { sorton: 'description' } });
      store.set([
        template(),
        template({ id: 't2', name: 'Two', description: null }),
      ]);

      await expect(
        firstValueFrom(service.scenarioTemplateList),
      ).rejects.toThrow(TypeError);
    });

    /**
     * Verifies: typing in the filter control writes scenarioTemplatemask to the URL.
     * Interacts with: ScenarioTemplateDataService.filterControl, Router.navigate spy.
     * Data: the typed term 'alp'.
     */
    it('writes the filter control value to the URL', () => {
      const { service, navigate } = seeded({});
      service.filterControl.setValue('alp');
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { scenarioTemplatemask: 'alp' },
        queryParamsHandling: 'merge',
      });
    });
  });

  describe('selected', () => {
    /**
     * Verifies: a scenarioTemplateId in the URL selects the template, makes it active, and loads its tasks once.
     * Interacts with: ScenarioTemplateDataService.selected, TaskService.getScenarioTemplateTasks stub, TaskQuery.
     * Data: templates 't1' and 't2'; URL scenarioTemplateId=t1; 't1' is then renamed.
     */
    it('selects the template in the URL and loads its tasks once', () => {
      const taskApi = {
        getScenarioTemplateTasks: vi.fn(() =>
          of([{ id: 'task-1', name: 'Ping', scenarioTemplateId: 't1' }]),
        ),
      } satisfies ApiStub<TaskService>;
      const { service, store, query, taskQuery } = setup({
        params: { scenarioTemplateId: 't1' },
        taskApi,
      });
      store.set([template(), template({ id: 't2', name: 'Two' })]);

      const selected = recordEmissions(service.selected);
      store.update('t1', { name: 'Renamed' });

      expect(selected.map((t) => t?.name)).toEqual(['Alpha', 'Renamed']);
      expect(query.getActiveId()).toBe('t1');
      expect(taskApi.getScenarioTemplateTasks).toHaveBeenCalledTimes(1);
      expect(taskQuery.getAll().map((t) => t.id)).toEqual(['task-1']);
    });

    /**
     * Verifies: an id in the URL that is not in the store selects nothing.
     * Interacts with: ScenarioTemplateDataService.selected.
     * Data: URL scenarioTemplateId=missing; store holds 't1'.
     */
    it('emits undefined when the requested template is not loaded', () => {
      const { service, store, query } = setup({
        params: { scenarioTemplateId: 'missing' },
      });
      store.set([template()]);

      const selected = recordEmissions(service.selected);

      // find() returns undefined for an unknown id.
      expect(selected).toEqual([undefined]);
      expect(query.getActiveId()).toBeUndefined();
    });

    /**
     * Verifies: when the URL moves from one template to another, the selection switches and the new template's tasks load.
     * Interacts with: ScenarioTemplateDataService.selected, ActivatedRoute stub, TaskService stub.
     * Data: templates 't1' and 't2'; the route's scenarioTemplateId changes from 't1' to 't2'.
     */
    it('follows the URL to a different template', () => {
      const taskApi = {
        getScenarioTemplateTasks: vi.fn(() => of([])),
      } satisfies ApiStub<TaskService>;
      const { service, store, query, setQueryParams } = setup({
        params: { scenarioTemplateId: 't1' },
        taskApi,
      });
      store.set([template(), template({ id: 't2', name: 'Two' })]);
      const selected = recordEmissions(service.selected);

      setQueryParams({ scenarioTemplateId: 't2' });

      // One navigation re-emits the old selection once per route-derived input
      // of the combineLatest (mask, sort column, direction, page size, page
      // index) before the new id arrives, so compare distinct values.
      const ids = selected.map((t) => t?.id);
      expect(ids.filter((id, i) => id !== ids[i - 1])).toEqual(['t1', 't2']);
      expect(query.getActiveId()).toBe('t2');
      expect(taskApi.getScenarioTemplateTasks.mock.calls).toEqual([
        ['t1'],
        ['t2'],
      ]);
    });
  });
});
