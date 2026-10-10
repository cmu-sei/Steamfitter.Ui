// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  ScenarioMembership,
  ScenarioMembershipsService,
} from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { ScenarioMembershipDataService } from './scenario-membership-data.service';

function membership(
  overrides: Partial<ScenarioMembership> = {},
): ScenarioMembership {
  return {
    id: 'm1',
    scenarioId: 's1',
    userId: 'u1',
    roleId: 'r1',
    ...overrides,
  };
}

function setup(api?: ApiStub<ScenarioMembershipsService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      api
        ? { provide: ScenarioMembershipsService, useValue: api }
        : unstubbed(ScenarioMembershipsService),
    ]),
  });
  return TestBed.inject(ScenarioMembershipDataService);
}

describe('ScenarioMembershipDataService', () => {
  /**
   * Verifies: loadMemberships() fetches the scenario's memberships and publishes them on scenarioMemberships$.
   * Interacts with: ScenarioMembershipsService.getAllScenarioMemberships stub.
   * Data: two memberships for scenario 's1'.
   */
  it('loadMemberships() publishes the fetched memberships', async () => {
    const api = {
      getAllScenarioMemberships: vi.fn(() =>
        of([membership(), membership({ id: 'm2', userId: 'u2' })]),
      ),
    } satisfies ApiStub<ScenarioMembershipsService>;
    const service = setup(api);

    await firstValueFrom(service.loadMemberships('s1'));

    expect(api.getAllScenarioMemberships).toHaveBeenCalledWith('s1');
    const published = await firstValueFrom(service.scenarioMemberships$);
    expect(published.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  /**
   * Verifies: the CRUD methods are cold — the request is not sent and nothing is published until the caller subscribes.
   * Interacts with: ScenarioMembershipsService.createScenarioMembership stub returning a subscription-counting observable.
   * Data: a create call that is never subscribed.
   */
  it('does not send the request until the returned observable is subscribed', async () => {
    let requests = 0;
    const service = setup({
      createScenarioMembership: () =>
        new Observable<ScenarioMembership>((subscriber) => {
          requests++;
          subscriber.next(membership());
          subscriber.complete();
        }),
    });

    const pending = service.createMembership('s1', membership());

    expect(requests).toBe(0);
    expect(await firstValueFrom(service.scenarioMemberships$)).toEqual([]);

    await firstValueFrom(pending);
    expect(requests).toBe(1);
  });

  /**
   * Verifies: createMembership() appends the created membership; editMembership() merges the API result into it.
   * Interacts with: createScenarioMembership/updateScenarioMembership stubs, scenarioMemberships$.
   * Data: membership 'm1' created with role r1, then edited to role r2.
   */
  it('creates, then edits, a membership in the published list', async () => {
    const service = setup({
      createScenarioMembership: (_scenarioId: string, m: ScenarioMembership) =>
        of({ ...m, id: 'm1' }),
      updateScenarioMembership: (_id: string, m: ScenarioMembership) =>
        of({ ...m }),
    });
    const seen = recordEmissions(service.scenarioMemberships$);

    await firstValueFrom(
      service.createMembership('s1', membership({ id: undefined })),
    );
    await firstValueFrom(service.editMembership(membership({ roleId: 'r2' })));

    expect(seen.map((list) => list.map((m) => m.roleId))).toEqual([
      [],
      ['r1'],
      ['r2'],
    ]);
  });

  /**
   * Verifies: deleteMembership() removes the membership from the published list.
   * Interacts with: deleteScenarioMembership stub, scenarioMemberships$.
   * Data: two memberships; 'm1' deleted.
   */
  it('deleteMembership() removes the membership', async () => {
    const api = {
      deleteScenarioMembership: vi.fn(() => of(null)),
    } satisfies ApiStub<ScenarioMembershipsService>;
    const service = setup(api);
    service.updateStore(membership());
    service.updateStore(membership({ id: 'm2' }));

    await firstValueFrom(service.deleteMembership('m1'));

    expect(api.deleteScenarioMembership).toHaveBeenCalledWith('m1');
    const published = await firstValueFrom(service.scenarioMemberships$);
    expect(published.map((m) => m.id)).toEqual(['m2']);
  });

  /**
   * Verifies: updateStore() (the SignalR entry point) updates an existing membership in place and re-emits the same array.
   * Interacts with: ScenarioMembershipDataService.updateStore, scenarioMemberships$.
   * Data: membership 'm1' pushed twice with different roles.
   */
  it('updateStore() mutates the existing membership and re-emits the same array instance', () => {
    const service = setup();
    service.updateStore(membership());
    const seen: ScenarioMembership[][] = [];
    const sub = service.scenarioMemberships$.subscribe((list) =>
      seen.push(list),
    );
    const before = seen[0];
    const original = before[0];

    service.updateStore(membership({ roleId: 'r2' }));
    sub.unsubscribe();

    // Characterization only: ScenarioMembershipsComponent derives members$
    // and groupMembers$ as new arrays from this stream, so the member list's
    // ngOnChanges still runs and rebuilds its rows with the updated role.
    expect(seen[1]).toBe(before);
    expect(original.roleId).toBe('r2');
  });

  /**
   * Verifies: deleteFromStore() (the SignalR entry point) drops the membership; unknown ids are ignored.
   * Interacts with: ScenarioMembershipDataService.deleteFromStore, scenarioMemberships$.
   * Data: one membership; deletes of 'missing' then 'm1'.
   */
  it('deleteFromStore() removes by id and ignores unknown ids', async () => {
    const service = setup();
    service.updateStore(membership());

    service.deleteFromStore('missing');
    expect((await firstValueFrom(service.scenarioMemberships$)).length).toBe(1);

    service.deleteFromStore('m1');
    expect(await firstValueFrom(service.scenarioMemberships$)).toEqual([]);
  });
});
