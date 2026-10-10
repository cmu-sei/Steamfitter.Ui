// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Result, ResultService } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { ResultDataService } from './result-data.service';
import { ResultQuery } from './result.query';
import { ResultStore } from './result.store';

// HttpClient hands the data services parsed JSON, so dates arrive as ISO
// strings even though the generated model types them as Date.
const iso = (value: string) => value as unknown as Date;

function apiResult(overrides: Partial<Result> = {}): Result {
  return {
    id: 'r1',
    taskId: 't1',
    vmId: 'vm1',
    vmName: 'vm-one',
    status: 'succeeded',
    actualOutput: 'hello',
    expectedOutput: 'hello',
    dateCreated: iso('2026-01-01T00:00:00Z'),
    dateModified: iso('2026-01-01T00:01:00Z'),
    statusDate: iso('2026-01-01T00:02:00Z'),
    sentDate: iso('2026-01-01T00:03:00Z'),
    ...overrides,
  };
}

function setup(
  options: { params?: Params; resultApi?: ApiStub<ResultService> } = {},
) {
  const { route, setQueryParams } = activatedRouteStub(options.params);
  const router = {
    navigate: vi.fn<Router['navigate']>(() => Promise.resolve(true)),
  } satisfies Pick<Router, 'navigate'>;
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      options.resultApi
        ? { provide: ResultService, useValue: options.resultApi }
        : unstubbed(ResultService),
    ]),
  });
  return {
    service: TestBed.inject(ResultDataService),
    store: TestBed.inject(ResultStore),
    query: TestBed.inject(ResultQuery),
    navigate: router.navigate,
    setQueryParams,
  };
}

const ids = (results: Result[]) => results.map((r) => r.id);

describe('ResultDataService', () => {
  describe('loading results', () => {
    /**
     * Verifies: loadByScenario(), loadByUser() and loadByView() replace the stored results and convert their dates.
     * Interacts with: ResultService.getScenarioResults/getUserResults/getViewResults stubs, ResultQuery.
     * Data: a stale result 'old' in the store; each call returns 'r1'.
     */
    it.each([
      {
        name: 'loadByScenario',
        method: 'getScenarioResults' as const,
        act: (s: ResultDataService) => s.loadByScenario('id'),
      },
      {
        name: 'loadByUser',
        method: 'getUserResults' as const,
        act: (s: ResultDataService) => s.loadByUser('id'),
      },
      {
        name: 'loadByView',
        method: 'getViewResults' as const,
        act: (s: ResultDataService) => s.loadByView('id'),
      },
    ])('$name() replaces the stored results', ({ method, act }) => {
      const resultApi = {
        getScenarioResults: vi.fn(() => of([apiResult()])),
        getUserResults: vi.fn(() => of([apiResult()])),
        getViewResults: vi.fn(() => of([apiResult()])),
      } satisfies ApiStub<ResultService>;
      const { service, store, query } = setup({ resultApi });
      store.set([apiResult({ id: 'old' })]);

      act(service);

      expect(resultApi[method]).toHaveBeenCalledWith('id');
      expect(ids(query.getAll())).toEqual(['r1']);
      expect(query.getEntity('r1').dateCreated).toEqual(
        new Date('2026-01-01T00:00:00Z'),
      );
    });

    /**
     * Verifies: loadByTask() merges the task's results into the store, keeping other results.
     * Interacts with: ResultService.getTaskResults stub, ResultQuery.
     * Data: an existing result for another task; the task has 'r1' and 'r2'.
     */
    it('loadByTask() merges the task results', () => {
      const { service, store, query } = setup({
        resultApi: {
          getTaskResults: () => of([apiResult(), apiResult({ id: 'r2' })]),
        },
      });
      store.set([apiResult({ id: 'other', taskId: 't9' })]);

      service.loadByTask('t1');

      expect(ids(query.getAll())).toEqual(['other', 'r1', 'r2']);
    });

    /**
     * Verifies: loadByVm() merges a VM's results into whatever is already stored instead of replacing it.
     * Interacts with: ResultService.getVmResults stub, ResultQuery.
     * Data: results already loaded for vm1; the History tab then switches to vm2.
     */
    it('loadByVm() keeps the previous VM results', () => {
      const { service, query } = setup({
        resultApi: {
          getVmResults: (vmId: string) =>
            of([apiResult({ id: `${vmId}-result`, vmId })]),
        },
      });

      service.loadByVm('vm1');
      service.loadByVm('vm2');

      expect(ids(query.getAll())).toEqual(['vm1-result', 'vm2-result']);
    });
  });

  describe('failed requests', () => {
    const fail = () => throwError(() => new Error('boom'));
    const failingApi = {
      getScenarioResults: fail,
      getTaskResults: fail,
      getUserResults: fail,
      getViewResults: fail,
      getVmResults: fail,
      getResult: fail,
      createResult: fail,
      updateResult: fail,
      deleteResult: fail,
    } satisfies ApiStub<ResultService>;

    /**
     * Verifies: a failed request in any loader or change method escapes as an unhandled rxjs error, and add()/updateResult() also leave loading set (current behavior).
     * Interacts with: failing ResultService stubs, captureUnhandledRxErrors, ResultQuery.
     * Data: one row per method; every API call fails with 'boom'; the store starts with loading false.
     */
    it.each([
      {
        name: 'loadByScenario',
        act: (s: ResultDataService) => s.loadByScenario('id'),
        loading: false,
      },
      {
        name: 'loadByTask',
        act: (s: ResultDataService) => s.loadByTask('id'),
        loading: false,
      },
      {
        name: 'loadByUser',
        act: (s: ResultDataService) => s.loadByUser('id'),
        loading: false,
      },
      {
        name: 'loadByView',
        act: (s: ResultDataService) => s.loadByView('id'),
        loading: false,
      },
      {
        name: 'loadByVm',
        act: (s: ResultDataService) => s.loadByVm('id'),
        loading: false,
      },
      {
        name: 'loadById',
        act: (s: ResultDataService) => s.loadById('id'),
        loading: false,
      },
      {
        name: 'add',
        act: (s: ResultDataService) => s.add({ taskId: 't1' }),
        loading: true,
      },
      {
        name: 'updateResult',
        act: (s: ResultDataService) => s.updateResult(apiResult()),
        loading: true,
      },
      {
        name: 'delete',
        act: (s: ResultDataService) => s.delete('r1'),
        loading: false,
      },
    ])(
      '$name() lets the API error escape unhandled (loading left $loading)',
      async ({ act, loading }) => {
        const errors = captureUnhandledRxErrors();
        const { service, store, query } = setup({ resultApi: failingApi });
        store.setLoading(false);

        act(service);
        await flush();

        expect(errors).toEqual([new Error('boom')]);
        expect(query.getValue().loading).toBe(loading);
      },
    );
  });

  describe('URL selection', () => {
    /**
     * Verifies: the resultId in the URL is only fetched once something subscribes to resultList.
     * Interacts with: ResultService.getResult stub, ResultDataService.resultList/selected.
     * Data: URL resultId=r1.
     */
    it('fetches the URL result once resultList is subscribed', async () => {
      const resultApi = {
        getResult: vi.fn((id: string) => of(apiResult({ id }))),
      } satisfies ApiStub<ResultService>;
      const { service, query } = setup({
        params: { resultId: 'r1' },
        resultApi,
      });
      expect(resultApi.getResult).not.toHaveBeenCalled();

      const selected = await firstValueFrom(service.selected);

      expect(resultApi.getResult).toHaveBeenCalledWith('r1');
      expect(selected?.id).toBe('r1');
      expect(query.getEntity('r1').statusDate).toBeInstanceOf(Date);
    });

    /**
     * Verifies: resetStore() empties the store and refetches the result still selected in the URL.
     * Interacts with: ResultService.getResult stub, ResultDataService.resetStore.
     * Data: URL resultId=r1 plus another stored result.
     */
    it('resetStore() empties the store and reloads the selected result', () => {
      const resultApi = {
        getResult: vi.fn((id: string) => of(apiResult({ id }))),
      } satisfies ApiStub<ResultService>;
      const { service, store, query } = setup({
        params: { resultId: 'r1' },
        resultApi,
      });
      recordEmissions(service.resultList);
      store.add(apiResult({ id: 'other' }));

      service.resetStore();

      expect(resultApi.getResult).toHaveBeenCalledTimes(2);
      expect(ids(query.getAll())).toEqual(['r1']);
    });
  });

  describe('result changes', () => {
    /**
     * Verifies: add() stores the created result, clears loading, and selects it in the URL.
     * Interacts with: ResultService.createResult stub, Router.navigate spy.
     * Data: the API creates result 'new'.
     */
    it('add() stores and selects the created result', () => {
      const { service, query, navigate } = setup({
        resultApi: {
          createResult: () => of(apiResult({ id: 'new' })),
        },
      });

      service.add({ taskId: 't1' });

      expect(query.hasEntity('new')).toBe(true);
      expect(query.getValue().loading).toBe(false);
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { resultId: 'new' },
        queryParamsHandling: 'merge',
      });
    });

    /**
     * Verifies: updateResult() stores the API's version and delete() removes the result.
     * Interacts with: ResultService.updateResult/deleteResult stubs, ResultQuery.
     * Data: result 'r1' updated to failed, then deleted.
     */
    it('updateResult() stores the update and delete() removes it', () => {
      const resultApi = {
        updateResult: vi.fn((id: string, r: Result) =>
          of({ ...r, id, status: 'failed' as const }),
        ),
        deleteResult: vi.fn(() => of(null)),
      } satisfies ApiStub<ResultService>;
      const { service, store, query } = setup({ resultApi });
      store.set([apiResult()]);
      const seen = recordEmissions(query.selectById('r1'));

      service.updateResult(apiResult());
      service.delete('r1');

      expect(seen.map((r) => r?.status)).toEqual([
        'succeeded',
        'failed',
        undefined,
      ]);
      expect(resultApi.deleteResult).toHaveBeenCalledWith('r1');
    });

    /**
     * Verifies: the SignalR entry points upsert one or many results with Date fields and remove by id.
     * Interacts with: ResultDataService.updateStore/updateStoreMany/deleteFromStore, ResultQuery.
     * Data: 'r1' pushed, then 'r1'+'r2' pushed together, then 'r1' deleted.
     */
    it('updateStore(), updateStoreMany() and deleteFromStore() keep the store in sync', () => {
      const { service, query } = setup();

      service.updateStore(apiResult());
      service.updateStoreMany([
        apiResult({ status: 'failed' }),
        apiResult({ id: 'r2' }),
      ]);
      service.deleteFromStore('r1');

      expect(ids(query.getAll())).toEqual(['r2']);
      expect(query.getEntity('r2').sentDate).toEqual(
        new Date('2026-01-01T00:03:00Z'),
      );
    });
  });

  describe('dates', () => {
    /**
     * Verifies: a null dateModified from the API is stored as the 1970 epoch.
     * Interacts with: ResultDataService.updateStore (setAsDates), ResultQuery.
     * Data: a result that was never modified (dateModified null, as the API's DateTime? sends it).
     */
    it('turns a null dateModified into the 1970 epoch', () => {
      const { service, query } = setup();

      service.updateStore(apiResult({ dateModified: null }));

      expect(query.getEntity('r1').dateModified).toEqual(new Date(0));
    });
  });

  describe('resultList', () => {
    /**
     * Verifies: the resultmask param filters on VM name, actual output, or expected output, case-insensitively.
     * Interacts with: ResultDataService.resultList, fake route params.
     * Data: three results with distinct VM names and outputs; masks 'WEB', 'denied', 'exp-3'.
     */
    it.each([
      { mask: 'WEB', expected: ['r1'] },
      { mask: 'denied', expected: ['r2'] },
      { mask: 'exp-3', expected: ['r3'] },
    ])('filters by resultmask "$mask"', async ({ mask, expected }) => {
      const { service, store } = setup({ params: { resultmask: mask } });
      store.set([
        apiResult({
          id: 'r1',
          vmName: 'web-01',
          actualOutput: 'ok',
          expectedOutput: 'ok',
        }),
        apiResult({
          id: 'r2',
          vmName: 'db-01',
          actualOutput: 'Access DENIED',
          expectedOutput: 'ok',
        }),
        apiResult({
          id: 'r3',
          vmName: 'dc-01',
          actualOutput: null,
          expectedOutput: 'exp-3',
        }),
      ]);

      const list = await firstValueFrom(service.resultList);

      expect(ids(list)).toEqual(expected);
    });

    /**
     * Verifies: resultList returns only the first page and reports the page's size, not the total, as the page length.
     * Interacts with: ResultDataService.resultList and pageEvent.
     * Data: 12 results with the default page size of 10.
     */
    it('returns one page and reports the page size as the length', async () => {
      const { service, store } = setup();
      store.set(
        Array.from({ length: 12 }, (_, i) => apiResult({ id: `r${i}` })),
      );

      const list = await firstValueFrom(service.resultList);

      expect(list).toHaveLength(10);
      expect((await firstValueFrom(service.pageEvent)).length).toBe(10);
    });
  });
});
