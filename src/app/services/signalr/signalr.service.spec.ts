// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ComnAuthService, ComnSettingsService } from '@cmusei/crucible-common';
import { Result, Scenario } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { mockHubConnectionBuilder } from 'src/app/test-utils/fake-hub-connection';
import {
  captureUnhandledRejections,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';
import { ScenarioTemplateMembershipDataService } from 'src/app/data/scenario-template/scenario-template-membership-data.service';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { ScenarioMembershipDataService } from 'src/app/data/scenario/scenario-membership-data.service';
import { TaskQuery } from 'src/app/data/task/task.query';
import { ResultQuery } from 'src/app/data/result/result.query';
import { ResultStore } from 'src/app/data/result/result.store';
import { GroupMembershipService } from 'src/app/data/group/group-membership.service';
import { SignalRService } from './signalr.service';

// HttpClient and SignalR both hand over parsed JSON, so dates arrive as ISO
// strings even though the generated model types them as Date.
const iso = (value: string) => value as unknown as Date;

let hub: ReturnType<typeof mockHubConnectionBuilder>;

function setup() {
  const auth: Pick<ComnAuthService, 'getAuthorizationToken'> = {
    getAuthorizationToken: () => 'tok-123',
  };
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      // The real service; the default provider is a placeholder.
      SignalRService,
      { provide: ComnAuthService, useValue: auth },
      {
        provide: ComnSettingsService,
        useValue: { settings: { ApiUrl: 'https://steamfitter.test' } },
      },
    ]),
  });
  const service = TestBed.inject(SignalRService);
  return {
    service,
    connect: async () => {
      await service.startConnection();
      return hub.connections[0];
    },
  };
}

describe('SignalRService', () => {
  beforeEach(() => {
    hub = mockHubConnectionBuilder();
  });

  describe('connection', () => {
    /**
     * Verifies: startConnection() connects to the engine hub with the bearer token, applies the server timeouts, and starts once.
     * Interacts with: mockHubConnectionBuilder, FakeHubConnection.start, ComnAuthService/ComnSettingsService stubs.
     * Data: ApiUrl https://steamfitter.test and token 'tok-123'; startConnection() called twice.
     */
    it('builds one engine-hub connection with the bearer token', async () => {
      const { service } = setup();

      const first = service.startConnection();
      const second = service.startConnection();
      await first;

      expect(second).toBe(first);
      expect(hub.connections).toHaveLength(1);
      expect(hub.withUrl).toHaveBeenCalledWith(
        'https://steamfitter.test/hubs/engine?bearer=tok-123',
      );
      expect(hub.connections[0].start).toHaveBeenCalledTimes(1);
      // The service assigns the timeouts onto the connection after build().
      expect(hub.connections[0]).toMatchObject({
        serverTimeoutInMilliseconds: 60000,
        keepAliveIntervalInMilliseconds: 15000,
      });
    });

    /**
     * Verifies: joinSystem/leaveSystem and joinScenario/leaveScenario invoke the matching hub methods once connected.
     * Interacts with: FakeHubConnection.invoke spy.
     * Data: scenario id 's1'.
     */
    it('invokes the hub group methods after the connection starts', async () => {
      const { service } = setup();

      service.joinSystem();
      service.joinScenario('s1');
      service.leaveScenario('s1');
      service.leaveSystem();
      await flush();

      expect(hub.connections[0].invoke.mock.calls).toEqual([
        ['JoinSystem'],
        ['JoinScenario', 's1'],
        ['LeaveScenario', 's1'],
        ['LeaveSystem'],
      ]);
    });

    /**
     * Verifies: after a reconnect the service rejoins the system group and every joined scenario.
     * Interacts with: FakeHubConnection.reconnectedCallbacks and invoke spy.
     * Data: joined the system group and scenarios s1 and s2.
     */
    it('rejoins its groups after reconnecting', async () => {
      const { service } = setup();
      service.joinSystem();
      service.joinScenario('s1');
      service.joinScenario('s2');
      await flush();
      const [connection] = hub.connections;
      connection.invoke.mockClear();

      connection.reconnect();
      await flush();

      expect(connection.invoke.mock.calls).toEqual([
        ['JoinSystem'],
        ['JoinScenario', 's1'],
        ['JoinScenario', 's2'],
      ]);
    });

    /**
     * Verifies: leaving one scenario keeps only that scenario in the rejoin list, so a reconnect rejoins the scenario that was left.
     * Interacts with: FakeHubConnection.reconnectedCallbacks and invoke spy.
     * Data: joined s1 and s2, left s1, then reconnected (system group never joined).
     */
    it('rejoins the scenario it left, and forgets the others, after reconnecting', async () => {
      const { service } = setup();
      service.joinScenario('s1');
      service.joinScenario('s2');
      service.leaveScenario('s1');
      await flush();
      const [connection] = hub.connections;
      connection.invoke.mockClear();

      connection.reconnect();
      await flush();

      expect(connection.invoke.mock.calls).toEqual([['JoinScenario', 's1']]);
    });

    /**
     * Verifies: the retry policy backs off exponentially from 2 s and adds 0-5 s of jitter.
     * Interacts with: the RetryPolicy passed to withAutomaticReconnect, Math.random spy.
     * Data: retry counts 0-3 with no jitter, and retry 0 with maximum jitter, all within the 120 s window.
     */
    it('backs off exponentially with jitter between reconnect attempts', async () => {
      const { connect } = setup();
      await connect();
      const policy = hub.retryPolicy();
      const delay = (previousRetryCount: number) =>
        policy?.nextRetryDelayInMilliseconds({
          previousRetryCount,
          elapsedMilliseconds: 1000,
          retryReason: new Error('lost'),
        });
      const random = vi.spyOn(Math, 'random').mockReturnValue(0);

      expect([0, 1, 2, 3].map(delay)).toEqual([2000, 4000, 8000, 16000]);

      random.mockReturnValue(0.999);
      expect(delay(0)).toBe(7000);
    });
  });

  describe('failed start', () => {
    const down = new Error('down');

    beforeEach(() => {
      hub = mockHubConnectionBuilder({
        onBuild: (c) => c.start.mockRejectedValue(down),
      });
    });

    /**
     * Verifies: after start() rejects, startConnection() keeps returning the same rejected promise and never builds or starts a new connection.
     * Interacts with: mockHubConnectionBuilder onBuild hook, FakeHubConnection.start rejecting.
     * Data: the hub is down ('down'); startConnection() called twice.
     */
    it('never retries after the first start() fails', async () => {
      const { service } = setup();

      await expect(service.startConnection()).rejects.toThrow('down');
      await expect(service.startConnection()).rejects.toThrow('down');

      expect(hub.connections).toHaveLength(1);
      expect(hub.connections[0].start).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies: each group method chains .then() on a failed start with no .catch(), so the rejection is unhandled and the group is never joined or left.
     * Interacts with: FakeHubConnection.start rejecting, invoke spy, captureUnhandledRejections (zone's unhandled-rejection report).
     * Data: one row per group method; the hub is down ('down').
     */
    it.each([
      { name: 'joinSystem', act: (s: SignalRService) => s.joinSystem() },
      { name: 'leaveSystem', act: (s: SignalRService) => s.leaveSystem() },
      {
        name: 'joinScenario',
        act: (s: SignalRService) => s.joinScenario('s1'),
      },
      {
        name: 'leaveScenario',
        act: (s: SignalRService) => s.leaveScenario('s1'),
      },
    ])('$name() leaves the failed start unhandled', async ({ act }) => {
      const rejections = captureUnhandledRejections();
      const { service } = setup();

      act(service);
      await flush();

      expect(hub.connections[0].invoke).not.toHaveBeenCalled();
      expect(rejections).toEqual([down]);
    });
  });

  describe('hub events', () => {
    /**
     * Verifies: scenario template events upsert and remove templates in ScenarioTemplateQuery.
     * Interacts with: FakeHubConnection.trigger, real ScenarioTemplateDataService/Store/Query.
     * Data: template 't1' created, renamed, then deleted.
     */
    it('applies scenario template events to the template store', async () => {
      const { connect } = setup();
      const connection = await connect();
      const query = TestBed.inject(ScenarioTemplateQuery);

      connection.trigger('ScenarioTemplateCreated', { id: 't1', name: 'New' });
      expect(query.getEntity('t1')?.name).toBe('New');

      connection.trigger('ScenarioTemplateUpdated', {
        id: 't1',
        name: 'Renamed',
      });
      expect(query.getEntity('t1')?.name).toBe('Renamed');

      connection.trigger('ScenarioTemplateDeleted', 't1');
      expect(query.hasEntity('t1')).toBe(false);
    });

    /**
     * Verifies: scenario events upsert scenarios with Date fields and remove them on delete.
     * Interacts with: FakeHubConnection.trigger, real ScenarioDataService/Store/Query.
     * Data: scenario 's1' pushed with ISO-string dates, then updated to active, then deleted.
     */
    it('applies scenario events to the scenario store', async () => {
      const { connect } = setup();
      const connection = await connect();
      const query = TestBed.inject(ScenarioQuery);
      const pushed: Scenario = {
        id: 's1',
        name: 'Live',
        status: 'ready',
        dateCreated: iso('2026-01-01T00:00:00Z'),
        dateModified: iso('2026-01-01T00:00:00Z'),
        startDate: iso('2026-01-02T00:00:00Z'),
        endDate: iso('2026-01-03T00:00:00Z'),
      };

      connection.trigger('ScenarioCreated', { ...pushed });
      expect(query.getEntity('s1')?.startDate).toEqual(
        new Date('2026-01-02T00:00:00Z'),
      );

      connection.trigger('ScenarioUpdated', { ...pushed, status: 'active' });
      expect(query.getEntity('s1')?.status).toBe('active');

      connection.trigger('ScenarioDeleted', 's1');
      expect(query.hasEntity('s1')).toBe(false);
    });

    /**
     * Verifies: task events upsert and remove tasks in TaskQuery.
     * Interacts with: FakeHubConnection.trigger, real TaskDataService/Store/Query.
     * Data: task 'k1' created pending, updated to succeeded, then deleted.
     */
    it('applies task events to the task store', async () => {
      const { connect } = setup();
      const connection = await connect();
      const query = TestBed.inject(TaskQuery);

      connection.trigger('TaskCreated', {
        id: 'k1',
        name: 'Ping',
        status: 'pending',
      });
      connection.trigger('TaskUpdated', {
        id: 'k1',
        name: 'Ping',
        status: 'succeeded',
      });
      expect(query.getEntity('k1')?.status).toBe('succeeded');

      connection.trigger('TaskDeleted', 'k1');
      expect(query.getCount()).toBe(0);
    });

    const result = (id: string, status: Result['status']): Result => ({
      id,
      status,
      dateCreated: iso('2026-01-01T00:00:00Z'),
      dateModified: iso('2026-01-01T00:00:00Z'),
      statusDate: iso('2026-01-01T00:05:00Z'),
      sentDate: iso('2026-01-01T00:00:00Z'),
    });

    /**
     * Verifies: a ResultsUpdated list upserts every result with Date fields.
     * Interacts with: FakeHubConnection.trigger, real ResultDataService/Store/Query.
     * Data: the list TaskExecutionService.SendNotificationAsync sends (TaskExecutionService.cs:833-840): 'r1' and 'r2' after execution.
     */
    it('applies a ResultsUpdated list to the result store', async () => {
      const { connect } = setup();
      const connection = await connect();
      const query = TestBed.inject(ResultQuery);

      connection.trigger('ResultsUpdated', [
        result('r1', 'succeeded'),
        result('r2', 'failed'),
      ]);

      expect(query.getAll().map((r) => [r.id, r.status])).toEqual([
        ['r1', 'succeeded'],
        ['r2', 'failed'],
      ]);
      expect(query.getEntity('r2')?.statusDate).toEqual(
        new Date('2026-01-01T00:05:00Z'),
      );
    });

    /**
     * Verifies: a ResultsUpdated event carrying a single result throws in the handler and leaves the stored result unchanged.
     * Interacts with: FakeHubConnection.trigger, real ResultDataService.updateStoreMany, ResultQuery.
     * Data: the single Result TaskMaintenanceService sends when a result expires (TaskMaintenanceService.cs:141-148); 'r1' stored as pending.
     */
    it('drops a ResultsUpdated event that carries a single result', async () => {
      const { connect } = setup();
      const connection = await connect();
      TestBed.inject(ResultStore).set([result('r1', 'pending')]);
      const query = TestBed.inject(ResultQuery);

      expect(() =>
        connection.trigger('ResultsUpdated', result('r1', 'expired')),
      ).toThrow(TypeError);
      expect(query.getEntity('r1')?.status).toBe('pending');
    });

    /**
     * Verifies: the single-result events upsert and remove results in ResultQuery.
     * Interacts with: FakeHubConnection.trigger, real ResultDataService/Store/Query.
     * Data: 'r1' created, updated, then deleted by id.
     */
    it('applies the single-result events to the result store', async () => {
      const { connect } = setup();
      const connection = await connect();
      const query = TestBed.inject(ResultQuery);

      // The API declares ResultCreated, ResultUpdated and ResultDeleted
      // (Steamfitter.Api/Hubs/EngineHub.cs:154-157) but sends none of them
      // today; the payload shapes follow the other entities' events.
      connection.trigger('ResultCreated', result('r1', 'sent'));
      connection.trigger('ResultUpdated', result('r1', 'succeeded'));
      expect(query.getEntity('r1')?.status).toBe('succeeded');

      connection.trigger('ResultDeleted', 'r1');
      expect(query.hasEntity('r1')).toBe(false);
    });

    /**
     * Verifies: scenario, scenario-template and group membership events upsert and remove memberships in their services.
     * Interacts with: FakeHubConnection.trigger; real ScenarioMembershipDataService,
     *   ScenarioTemplateMembershipDataService and GroupMembershipService.
     * Data: one membership of each kind created, updated, and deleted.
     */
    it.each([
      {
        kind: 'ScenarioMembership',
        created: { id: 'm1', scenarioId: 's1', userId: 'u1', roleId: 'r1' },
        updated: { id: 'm1', scenarioId: 's1', userId: 'u1', roleId: 'r2' },
        list: () =>
          TestBed.inject(ScenarioMembershipDataService).scenarioMemberships$,
      },
      {
        kind: 'ScenarioTemplateMembership',
        created: {
          id: 'm1',
          scenarioTemplateId: 't1',
          groupId: 'g1',
          roleId: 'r1',
        },
        updated: {
          id: 'm1',
          scenarioTemplateId: 't1',
          groupId: 'g1',
          roleId: 'r2',
        },
        list: () =>
          TestBed.inject(ScenarioTemplateMembershipDataService)
            .scenarioTemplateMemberships$,
      },
      {
        kind: 'GroupMembership',
        created: { id: 'm1', groupId: 'g1', userId: 'u1' },
        updated: { id: 'm1', groupId: 'g1', userId: 'u2' },
        list: () => TestBed.inject(GroupMembershipService).groupMemberships$,
      },
    ])(
      'applies $kind events to the membership list',
      async ({ kind, created, updated, list }) => {
        const { connect } = setup();
        const connection = await connect();

        connection.trigger(`${kind}Created`, { ...created });
        connection.trigger(`${kind}Updated`, { ...updated });
        expect(await firstValueFrom(list())).toEqual([updated]);

        connection.trigger(`${kind}Deleted`, 'm1');
        expect(await firstValueFrom(list())).toEqual([]);
      },
    );
  });
});
