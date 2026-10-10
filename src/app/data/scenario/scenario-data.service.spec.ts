// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  ResultService,
  Scenario,
  ScenarioService,
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
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { ScenarioDataService } from './scenario-data.service';
import { ScenarioQuery } from './scenario.query';
import { ScenarioStore } from './scenario.store';

// HttpClient hands the data services parsed JSON, so dates arrive as ISO
// strings even though the generated model types them as Date.
const iso = (value: string) => value as unknown as Date;

function apiScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's1',
    name: 'Alpha',
    description: 'first scenario',
    status: 'ready',
    view: 'View One',
    viewId: 'v1',
    dateCreated: iso('2026-01-01T00:00:00Z'),
    dateModified: iso('2026-01-02T00:00:00Z'),
    startDate: iso('2026-02-01T00:00:00Z'),
    endDate: iso('2026-02-02T00:00:00Z'),
    ...overrides,
  };
}

function setup(
  options: {
    params?: Params;
    scenarioApi?: ApiStub<ScenarioService>;
    taskApi?: ApiStub<TaskService>;
    resultApi?: ApiStub<ResultService>;
    vmCredentialApi?: ApiStub<VmCredentialService>;
  } = {},
) {
  // PlayerDataService (a real dependency here) reads the initial viewId from
  // the route snapshot at construction; the stub's snapshot is live.
  const { route, setQueryParams } = activatedRouteStub(options.params);
  const router = {
    navigate: vi.fn<Router['navigate']>(() => Promise.resolve(true)),
  } satisfies Pick<Router, 'navigate'>;
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      options.scenarioApi
        ? { provide: ScenarioService, useValue: options.scenarioApi }
        : unstubbed(ScenarioService),
      options.taskApi
        ? { provide: TaskService, useValue: options.taskApi }
        : unstubbed(TaskService),
      options.resultApi
        ? { provide: ResultService, useValue: options.resultApi }
        : unstubbed(ResultService),
      options.vmCredentialApi
        ? { provide: VmCredentialService, useValue: options.vmCredentialApi }
        : unstubbed(VmCredentialService),
    ]),
  });
  return {
    service: TestBed.inject(ScenarioDataService),
    store: TestBed.inject(ScenarioStore),
    query: TestBed.inject(ScenarioQuery),
    taskQuery: TestBed.inject(TaskQuery),
    playerDataService: TestBed.inject(PlayerDataService),
    navigate: router.navigate,
    setQueryParams,
  };
}

describe('ScenarioDataService', () => {
  describe('load()', () => {
    /**
     * Verifies: load() stores the API's scenarios except the personal Task Builder scenario, and clears loading.
     * Interacts with: ScenarioService.getScenarios stub, real ScenarioStore/ScenarioQuery.
     * Data: two normal scenarios plus one with the 'Personal Task Builder Scenario' description.
     */
    it('stores the scenarios, minus the personal Task Builder scenario, and clears loading', () => {
      const scenarioApi = {
        getScenarios: vi.fn(() =>
          of([
            apiScenario({ id: 'b', name: 'Bravo' }),
            apiScenario({ id: 'a', name: 'Alpha' }),
            apiScenario({
              id: 'mine',
              name: 'Me',
              description: 'Personal Task Builder Scenario',
            }),
          ]),
        ),
      } satisfies ApiStub<ScenarioService>;
      const { service, query } = setup({ scenarioApi });

      service.load();

      expect(query.getAll().map((s) => s.id)).toEqual(['a', 'b']);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: load() turns the ISO date strings from the API into Date objects before storing.
     * Interacts with: ScenarioService.getScenarios stub, ScenarioQuery.getEntity.
     * Data: one scenario whose four date fields arrive as ISO strings.
     */
    it('converts the API date strings to Date objects', () => {
      const { service, query } = setup({
        scenarioApi: { getScenarios: () => of([apiScenario()]) },
      });

      service.load();

      const stored = query.getEntity('s1');
      expect(stored.startDate).toEqual(new Date('2026-02-01T00:00:00Z'));
      expect(stored.endDate).toEqual(new Date('2026-02-02T00:00:00Z'));
      expect(stored.dateCreated).toEqual(new Date('2026-01-01T00:00:00Z'));
      expect(stored.dateModified).toEqual(new Date('2026-01-02T00:00:00Z'));
    });

    /**
     * Verifies: a failed load() empties the store and clears loading, without recording an error.
     * Interacts with: ScenarioService.getScenarios stub (throws), ScenarioQuery.
     * Data: a store pre-seeded with one scenario; the API call errors.
     */
    it('empties the store and clears loading when the API fails, without recording an error', () => {
      const { service, store, query } = setup({
        scenarioApi: {
          getScenarios: () => throwError(() => new Error('boom')),
        },
      });
      store.set([apiScenario()]);

      service.load();

      expect(query.getAll()).toEqual([]);
      expect(query.getValue().loading).toBe(false);
      // No data service in this app calls setError, so the failure is not
      // visible through the query.
      expect(query.getValue().error).toBeNull();
    });
  });

  describe('loadById()', () => {
    /**
     * Verifies: loadById() upserts the fetched scenario next to the existing ones and clears loading.
     * Interacts with: ScenarioService.getScenario stub, ScenarioQuery.
     * Data: an existing scenario 'a' and a fetched scenario 's1'.
     */
    it('upserts the fetched scenario and clears loading', () => {
      const scenarioApi = {
        getScenario: vi.fn((id: string) => of(apiScenario({ id }))),
      } satisfies ApiStub<ScenarioService>;
      const { service, store, query } = setup({ scenarioApi });
      store.set([apiScenario({ id: 'a', name: 'Existing' })]);

      service.loadById('s1');

      expect(scenarioApi.getScenario).toHaveBeenCalledWith('s1');
      expect(query.getAll().map((s) => s.id)).toEqual(['s1', 'a']);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: loadById() stores the API's ISO date strings unconverted, so a later date sort of the list throws.
     * Interacts with: ScenarioService.getScenario stub, ScenarioQuery, ScenarioDataService.scenarioList.
     * Data: one stored scenario with Date fields (from updateStore); 's1' fetched with ISO-string dates; URL sorton=startDate.
     */
    it('stores the fetched dates as strings, which breaks a date sort', async () => {
      const { service, query } = setup({
        params: { sorton: 'startDate' },
        scenarioApi: { getScenario: (id: string) => of(apiScenario({ id })) },
      });
      service.updateStore(apiScenario({ id: 'a', name: 'Existing' }));

      service.loadById('s1');

      expect(typeof query.getEntity('s1').startDate).toBe('string');
      await expect(firstValueFrom(service.scenarioList)).rejects.toThrow(
        TypeError,
      );
    });
  });

  describe('loadByViewId()', () => {
    /**
     * Verifies: loadByViewId() merges the view's scenarios into the store and they appear in selectByViewId.
     * Interacts with: ScenarioService.getScenariosByViewId stub, ScenarioQuery.selectByViewId.
     * Data: an existing scenario on v2 and two fetched scenarios on v1.
     */
    it('merges the view scenarios into the store', async () => {
      const scenarioApi = {
        getScenariosByViewId: vi.fn(() =>
          of([
            apiScenario({ id: 'x', name: 'X', viewId: 'v1' }),
            apiScenario({ id: 'y', name: 'Y', viewId: 'v1' }),
          ]),
        ),
      } satisfies ApiStub<ScenarioService>;
      const { service, store, query } = setup({ scenarioApi });
      store.set([apiScenario({ id: 'other', name: 'Other', viewId: 'v2' })]);

      service.loadByViewId('v1');

      expect(scenarioApi.getScenariosByViewId).toHaveBeenCalledWith('v1');
      const forView = await firstValueFrom(query.selectByViewId('v1'));
      expect(forView.map((s) => s.id)).toEqual(['x', 'y']);
      expect(query.getCount()).toBe(3);
    });
  });

  describe('loadTaskBuilderScenario()', () => {
    /**
     * Verifies: the Task Builder scenario is stored, selected in the URL, and its tasks loaded into TaskQuery.
     * Interacts with: ScenarioService.getMyScenario, TaskService.getScenarioTasks, ResultService.getScenarioResults stubs; Router.navigate spy.
     * Data: "my" scenario 'mine' with one task; the URL starts on another scenario.
     */
    it('stores and selects the personal scenario and loads its tasks', () => {
      const taskApi = {
        getScenarioTasks: vi.fn(() =>
          of([{ id: 't1', name: 'Task', scenarioId: 'mine' }]),
        ),
      } satisfies ApiStub<TaskService>;
      const { service, query, taskQuery, navigate } = setup({
        params: { scenarioId: 'previous' },
        scenarioApi: {
          getMyScenario: () => of(apiScenario({ id: 'mine', name: 'Me' })),
        },
        taskApi,
        resultApi: { getScenarioResults: () => of([]) },
      });

      service.loadTaskBuilderScenario();

      expect(query.getEntity('mine').name).toBe('Me');
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { scenarioId: 'mine', scenarioTemplateId: null },
        queryParamsHandling: 'merge',
      });
      expect(taskApi.getScenarioTasks).toHaveBeenCalledWith('mine');
      expect(taskQuery.getAll().map((t) => t.id)).toEqual(['t1']);
    });
  });

  describe('creating scenarios', () => {
    const created = apiScenario({ id: 'new', name: 'New' });
    const cases: Array<{
      name: string;
      act: (service: ScenarioDataService) => void;
      scenarioApi: ApiStub<ScenarioService>;
    }> = [
      {
        name: 'add()',
        act: (s) => s.add({ name: 'New' }),
        scenarioApi: { createScenario: () => of({ ...created }) },
      },
      {
        name: 'copyScenario()',
        act: (s) => s.copyScenario('s1'),
        scenarioApi: { copyScenario: () => of({ ...created }) },
      },
      {
        name: 'createScenarioFromScenarioTemplate()',
        act: (s) => s.createScenarioFromScenarioTemplate('tmpl'),
        scenarioApi: {
          createScenarioFromScenarioTemplate: () => of({ ...created }),
        },
      },
    ];

    /**
     * Verifies: each creation path stores the new scenario with Date fields, selects it in the URL, and clears the template selection.
     * Interacts with: the matching ScenarioService stub, ScenarioQuery, Router.navigate spy.
     * Data: the API returns scenario 'new'; the URL starts with a scenarioTemplateId.
     */
    it.each(cases)(
      '$name stores the created scenario and selects it',
      ({ act, scenarioApi }) => {
        const { service, query, navigate } = setup({
          params: { scenarioTemplateId: 'tmpl', tab: 'Scenarios' },
          scenarioApi,
        });

        act(service);

        expect(query.getEntity('new').startDate).toBeInstanceOf(Date);
        expect(navigate).toHaveBeenCalledWith([], {
          queryParams: { scenarioId: 'new', scenarioTemplateId: null },
          queryParamsHandling: 'merge',
        });
        expect(query.getValue().loading).toBe(false);
      },
    );

    /**
     * Verifies: createScenarioFromScenarioTemplate() posts the template id with empty clone options.
     * Interacts with: ScenarioService.createScenarioFromScenarioTemplate stub.
     * Data: template id 'tmpl'.
     */
    it('creates from a template with empty clone options', () => {
      const scenarioApi = {
        createScenarioFromScenarioTemplate: vi.fn(() => of({ ...created })),
      } satisfies ApiStub<ScenarioService>;
      const { service } = setup({ scenarioApi });

      service.createScenarioFromScenarioTemplate('tmpl');

      expect(
        scenarioApi.createScenarioFromScenarioTemplate,
      ).toHaveBeenCalledWith('tmpl', {});
    });
  });

  describe('updating and deleting', () => {
    /**
     * Verifies: updateScenario() sends the scenario and stores the API's version.
     * Interacts with: ScenarioService.updateScenario stub, ScenarioQuery.
     * Data: stored scenario 's1' renamed to 'Renamed' by the API response.
     */
    it('updateScenario() stores the updated scenario', () => {
      const scenarioApi = {
        updateScenario: vi.fn((id: string, form: Scenario) =>
          of(apiScenario({ ...form, id, name: 'Renamed' })),
        ),
      } satisfies ApiStub<ScenarioService>;
      const { service, store, query } = setup({ scenarioApi });
      store.set([apiScenario()]);

      service.updateScenario(apiScenario({ name: 'Edited' }));

      expect(scenarioApi.updateScenario).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ name: 'Edited' }),
      );
      expect(query.getEntity('s1').name).toBe('Renamed');
    });

    /**
     * Verifies: start() and end() store the scenario status the API returns.
     * Interacts with: ScenarioService.startScenario/endScenario stubs, ScenarioQuery.
     * Data: scenario 's1' moving ready → active → ended.
     */
    it('start() and end() store the returned status', () => {
      const { service, store, query } = setup({
        scenarioApi: {
          startScenario: (id: string) =>
            of(apiScenario({ id, status: 'active' })),
          endScenario: (id: string) => of(apiScenario({ id, status: 'ended' })),
        },
      });
      store.set([apiScenario()]);
      const statuses = recordEmissions(query.selectById('s1'));

      service.start('s1');
      service.end('s1');

      expect(statuses.map((s) => s.status)).toEqual([
        'ready',
        'active',
        'ended',
      ]);
    });

    /**
     * Verifies: delete() removes the scenario from the store and clears the scenario selection in the URL.
     * Interacts with: ScenarioService.deleteScenario stub, ScenarioQuery, Router.navigate spy.
     * Data: scenarios 's1' and 's2'; the URL selects 's1'.
     */
    it('delete() removes the scenario and clears the selection', () => {
      const scenarioApi = {
        deleteScenario: vi.fn(() => of(null)),
      } satisfies ApiStub<ScenarioService>;
      const { service, store, query, navigate } = setup({
        params: { scenarioId: 's1' },
        scenarioApi,
      });
      store.set([apiScenario(), apiScenario({ id: 's2', name: 'Two' })]);

      service.delete('s1');

      expect(scenarioApi.deleteScenario).toHaveBeenCalledWith('s1');
      expect(query.getAll().map((s) => s.id)).toEqual(['s2']);
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { scenarioId: null, scenarioTemplateId: null },
        queryParamsHandling: 'merge',
      });
    });

    /**
     * Verifies: adding or deleting a VM credential re-fetches the owning scenario so its credential list refreshes.
     * Interacts with: VmCredentialService.createVmCredential/deleteVmCredential and ScenarioService.getScenario stubs.
     * Data: scenario 's1' whose refetch returns one, then zero, credentials.
     */
    it('reloads the scenario after a VM credential is added or deleted', () => {
      const credential = { id: 'c1', scenarioId: 's1', username: 'u' };
      const getScenario = vi
        .fn((id: string) => of(apiScenario({ id })))
        .mockReturnValueOnce(of(apiScenario({ vmCredentials: [credential] })))
        .mockReturnValueOnce(of(apiScenario({ vmCredentials: [] })));
      const vmCredentialApi = {
        createVmCredential: vi.fn(() => of(credential)),
        deleteVmCredential: vi.fn(() => of(null)),
      } satisfies ApiStub<VmCredentialService>;
      const { service, query } = setup({
        scenarioApi: { getScenario },
        vmCredentialApi,
      });

      service.addVmCredential(credential);
      expect(query.getEntity('s1').vmCredentials).toEqual([credential]);

      service.deleteVmCredential('s1', 'c1');
      expect(vmCredentialApi.deleteVmCredential).toHaveBeenCalledWith('c1');
      expect(query.getEntity('s1').vmCredentials).toEqual([]);
      expect(getScenario).toHaveBeenCalledTimes(2);
    });

    /**
     * Verifies: updateStore() (the SignalR entry point) converts dates and upserts; deleteFromStore() removes.
     * Interacts with: ScenarioStore via the service, ScenarioQuery.
     * Data: a pushed scenario with ISO-string dates, then its removal.
     */
    it('updateStore() converts dates and upserts; deleteFromStore() removes', () => {
      const { service, query } = setup();

      service.updateStore(apiScenario());
      expect(query.getEntity('s1').startDate).toEqual(
        new Date('2026-02-01T00:00:00Z'),
      );

      service.deleteFromStore('s1');
      expect(query.hasEntity('s1')).toBe(false);
    });
  });

  describe('failed requests', () => {
    const fail = () => throwError(() => new Error('boom'));
    const failingScenarioApi = {
      getScenario: fail,
      getScenariosByViewId: fail,
      getMyScenario: fail,
      createScenario: fail,
      copyScenario: fail,
      createScenarioFromScenarioTemplate: fail,
      updateScenario: fail,
      deleteScenario: fail,
      startScenario: fail,
      endScenario: fail,
    } satisfies ApiStub<ScenarioService>;
    const failingVmCredentialApi = {
      createVmCredential: fail,
      deleteVmCredential: fail,
    } satisfies ApiStub<VmCredentialService>;

    /**
     * Verifies: a failed request in each scenario method other than load() escapes as an unhandled rxjs error, and the methods that set loading leave it set (current behavior).
     * Interacts with: failing ScenarioService and VmCredentialService stubs, captureUnhandledRxErrors, ScenarioQuery.
     * Data: one row per method; every API call fails with 'boom'; the store starts with loading false.
     */
    it.each([
      {
        name: 'loadById',
        act: (s: ScenarioDataService) => s.loadById('s1'),
        loading: true,
      },
      {
        name: 'loadByViewId',
        act: (s: ScenarioDataService) => s.loadByViewId('v1'),
        loading: true,
      },
      {
        name: 'loadTaskBuilderScenario',
        act: (s: ScenarioDataService) => s.loadTaskBuilderScenario(),
        loading: true,
      },
      {
        name: 'add',
        act: (s: ScenarioDataService) => s.add({ name: 'New' }),
        loading: true,
      },
      {
        name: 'copyScenario',
        act: (s: ScenarioDataService) => s.copyScenario('s1'),
        loading: true,
      },
      {
        name: 'createScenarioFromScenarioTemplate',
        act: (s: ScenarioDataService) =>
          s.createScenarioFromScenarioTemplate('tmpl'),
        loading: true,
      },
      {
        name: 'updateScenario',
        act: (s: ScenarioDataService) => s.updateScenario(apiScenario()),
        loading: true,
      },
      {
        name: 'delete',
        act: (s: ScenarioDataService) => s.delete('s1'),
        loading: false,
      },
      {
        name: 'start',
        act: (s: ScenarioDataService) => s.start('s1'),
        loading: false,
      },
      {
        name: 'end',
        act: (s: ScenarioDataService) => s.end('s1'),
        loading: false,
      },
      {
        name: 'addVmCredential',
        act: (s: ScenarioDataService) =>
          s.addVmCredential({ scenarioId: 's1', username: 'u' }),
        loading: false,
      },
      {
        name: 'deleteVmCredential',
        act: (s: ScenarioDataService) => s.deleteVmCredential('s1', 'c1'),
        loading: false,
      },
    ])(
      '$name() lets the API error escape unhandled (loading left $loading)',
      async ({ act, loading }) => {
        const errors = captureUnhandledRxErrors();
        const { service, store, query } = setup({
          scenarioApi: failingScenarioApi,
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

  describe('dates', () => {
    /**
     * Verifies: a null dateModified from the API is stored as the 1970 epoch.
     * Interacts with: ScenarioDataService.updateStore (setAsDates), ScenarioQuery.
     * Data: a scenario that was never modified (dateModified null, as the API's DateTime? sends it).
     */
    it('turns a null dateModified into the 1970 epoch', () => {
      const { service, query } = setup();

      service.updateStore(apiScenario({ dateModified: null }));

      expect(query.getEntity('s1').dateModified).toEqual(new Date(0));
    });
  });

  describe('scenarioList', () => {
    const scenarios = [
      apiScenario({
        id: '1',
        name: 'alpha',
        description: 'red team',
        view: 'Exercise B',
        status: 'active',
        startDate: iso('2026-03-01T00:00:00Z'),
      }),
      apiScenario({
        id: '2',
        name: 'Bravo',
        description: 'blue team',
        view: 'Exercise A',
        status: 'ready',
        startDate: iso('2026-01-01T00:00:00Z'),
      }),
      apiScenario({
        id: '3',
        name: 'charlie',
        description: 'red cell',
        view: 'Exercise C',
        status: 'ended',
        startDate: iso('2026-02-01T00:00:00Z'),
      }),
    ];

    function seeded(params: Params) {
      const ctx = setup({
        params,
        scenarioApi: {
          getScenarios: () => of(scenarios.map((s) => ({ ...s }))),
        },
      });
      ctx.service.load();
      return ctx;
    }

    /**
     * Verifies: the list sorts by name, case-insensitively, when the URL has no sort.
     * Interacts with: ScenarioDataService.scenarioList over the real query.
     * Data: names 'alpha', 'Bravo', 'charlie' in mixed case.
     */
    it('defaults to a case-insensitive name sort', async () => {
      const { service } = seeded({});
      const list = await firstValueFrom(service.scenarioList);
      expect(list.map((s) => s.id)).toEqual(['1', '2', '3']);
    });

    /**
     * Verifies: the scenariomask query param filters on name, description, or view name, case-insensitively.
     * Interacts with: ScenarioDataService.scenarioList, fake route params.
     * Data: masks 'RED' (description), 'exercise a' (view), and 'char' (name).
     */
    it.each([
      { mask: 'RED', ids: ['1', '3'] },
      { mask: 'exercise a', ids: ['2'] },
      { mask: 'char', ids: ['3'] },
    ])('filters by scenariomask "$mask"', async ({ mask, ids }) => {
      const { service } = seeded({ scenariomask: mask });
      const list = await firstValueFrom(service.scenarioList);
      expect(list.map((s) => s.id)).toEqual(ids);
    });

    /**
     * Verifies: sorton/sortdir query params choose the sort column and direction.
     * Interacts with: ScenarioDataService.scenarioList, fake route params.
     * Data: sorts by startDate desc, status asc, and view desc.
     */
    it.each([
      { sorton: 'startDate', sortdir: 'desc', ids: ['1', '3', '2'] },
      { sorton: 'status', sortdir: 'asc', ids: ['1', '3', '2'] },
      { sorton: 'view', sortdir: 'desc', ids: ['3', '1', '2'] },
    ])('sorts by $sorton $sortdir', async ({ sorton, sortdir, ids }) => {
      const { service } = seeded({ sorton, sortdir });
      const list = await firstValueFrom(service.scenarioList);
      expect(list.map((s) => s.id)).toEqual(ids);
    });

    /**
     * Verifies: sorting by description errors the list stream when a scenario has no description.
     * Interacts with: ScenarioDataService.scenarioList.
     * Data: one scenario with a null description; URL sorton=description.
     */
    it('errors when sorting by description and a scenario has none', async () => {
      const { service } = setup({
        params: { sorton: 'description' },
        scenarioApi: {
          getScenarios: () =>
            of([
              apiScenario(),
              apiScenario({ id: 's2', name: 'Two', description: null }),
            ]),
        },
      });
      service.load();

      await expect(firstValueFrom(service.scenarioList)).rejects.toThrow(
        TypeError,
      );
    });

    /**
     * Verifies: typing in the filter control merges the mask into the URL, and the list follows the mask the route then emits.
     * Interacts with: ScenarioDataService.filterControl and scenarioList, Router.navigate spy, ActivatedRoute stub.
     * Data: an existing tab param and the typed term 'bravo', pushed back through the route.
     */
    it('writes the filter control value to the scenariomask param', async () => {
      const { service, navigate, setQueryParams } = seeded({
        tab: 'Scenarios',
      });
      service.filterControl.setValue('bravo');

      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { scenariomask: 'bravo' },
        queryParamsHandling: 'merge',
      });
      setQueryParams({ tab: 'Scenarios', scenariomask: 'bravo' });
      const list = await firstValueFrom(service.scenarioList);
      expect(list.map((s) => s.id)).toEqual(['2']);
    });
  });

  describe('selected', () => {
    /**
     * Verifies: a scenarioId in the URL selects that scenario, makes it active, loads its tasks, and selects its Player view.
     * Interacts with: ScenarioDataService.selected, PlayerDataService.selectView,
     *   TaskService.getScenarioTasks and ResultService.getScenarioResults stubs.
     * Data: scenarios 's1' (view v1) and 's2'; URL scenarioId=s1.
     */
    it('selects the scenario in the URL and loads its tasks and view', () => {
      const taskApi = {
        getScenarioTasks: vi.fn(() =>
          of([{ id: 't1', name: 'T', scenarioId: 's1' }]),
        ),
      } satisfies ApiStub<TaskService>;
      const { service, store, query, taskQuery, playerDataService } = setup({
        params: { scenarioId: 's1' },
        taskApi,
        resultApi: { getScenarioResults: () => of([]) },
      });
      const selectView = vi.spyOn(playerDataService, 'selectView');
      store.set([apiScenario(), apiScenario({ id: 's2', name: 'Two' })]);

      const selected = recordEmissions(service.selected);

      expect(selected.map((s) => s?.id)).toEqual(['s1']);
      expect(query.getActiveId()).toBe('s1');
      expect(taskApi.getScenarioTasks).toHaveBeenCalledWith('s1');
      expect(taskQuery.getAll().map((t) => t.id)).toEqual(['t1']);
      expect(selectView).toHaveBeenCalledWith('v1');
    });

    /**
     * Verifies: later store changes re-emit the selection without reloading the selected scenario's tasks.
     * Interacts with: ScenarioDataService.selected, ScenarioStore.update, TaskService.getScenarioTasks stub.
     * Data: selected scenario 's1' renamed after selection.
     */
    it('does not reload tasks when the selected scenario changes in the store', () => {
      const taskApi = {
        getScenarioTasks: vi.fn(() => of([])),
      } satisfies ApiStub<TaskService>;
      const { service, store } = setup({
        params: { scenarioId: 's1' },
        taskApi,
        resultApi: { getScenarioResults: () => of([]) },
      });
      store.set([apiScenario()]);
      const selected = recordEmissions(service.selected);

      store.update('s1', { name: 'Renamed' });

      expect(selected.map((s) => s?.name)).toEqual(['Alpha', 'Renamed']);
      expect(taskApi.getScenarioTasks).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies: with no scenarioId in the URL, selected emits null and the active id is reset to an empty string.
     * Interacts with: ScenarioDataService.selected, ScenarioQuery.getActiveId.
     * Data: a stored scenario and an empty query string.
     */
    it('emits null and resets the active id when the URL selects nothing', () => {
      const { service, store, query } = setup();
      store.set([apiScenario()]);

      const selected = recordEmissions(service.selected);

      expect(selected).toEqual([null]);
      // Cleared with setActive(''), so the active id is '' rather than null.
      expect(query.getActiveId()).toBe('');
    });

    /**
     * Verifies: setActive() writes scenarioId to the URL and clears scenarioTemplateId; setActive('') removes scenarioId.
     * Interacts with: ScenarioDataService.setActive, Router.navigate spy.
     * Data: a URL with scenarioTemplateId and tab params.
     */
    it('setActive() writes scenarioId and clears scenarioTemplateId', () => {
      const { service, navigate } = setup({
        params: { scenarioTemplateId: 'tmpl', tab: 'Scenarios' },
      });

      service.setActive('s9');
      expect(navigate).toHaveBeenLastCalledWith([], {
        queryParams: { scenarioId: 's9', scenarioTemplateId: null },
        queryParamsHandling: 'merge',
      });

      service.setActive('');
      expect(navigate).toHaveBeenLastCalledWith([], {
        queryParams: { scenarioId: null, scenarioTemplateId: null },
        queryParamsHandling: 'merge',
      });
    });
  });
});
