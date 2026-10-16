// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  GroupMembership,
  GroupService,
} from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { GroupMembershipService } from './group-membership.service';

function setup(api?: ApiStub<GroupService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      api ? { provide: GroupService, useValue: api } : unstubbed(GroupService),
    ]),
  });
  return TestBed.inject(GroupMembershipService);
}

const member = (
  id: string,
  groupId: string,
  userId = 'u1',
): GroupMembership => ({
  id,
  groupId,
  userId,
});

describe('GroupMembershipService', () => {
  /**
   * Verifies: loading two groups' memberships accumulates them, and selectMemberships() filters per group.
   * Interacts with: GroupService.getGroupMemberships stub, selectMemberships.
   * Data: groups g1 (two members) and g2 (one member).
   */
  it('accumulates memberships across groups and filters by group', async () => {
    const api = {
      getGroupMemberships: vi.fn((groupId: string) =>
        of(
          groupId === 'g1'
            ? [member('m1', 'g1'), member('m2', 'g1', 'u2')]
            : [member('m3', 'g2')],
        ),
      ),
    } satisfies ApiStub<GroupService>;
    const service = setup(api);

    await firstValueFrom(service.loadMemberships('g1'));
    await firstValueFrom(service.loadMemberships('g2'));

    expect(
      (await firstValueFrom(service.selectMemberships('g1'))).map((m) => m.id),
    ).toEqual(['m1', 'm2']);
    expect(
      (await firstValueFrom(service.selectMemberships('g2'))).map((m) => m.id),
    ).toEqual(['m3']);
  });

  /**
   * Verifies: reloading a group replaces known memberships in place and keeps memberships the API no longer returns.
   * Interacts with: GroupService.getGroupMemberships stub, groupMemberships$.
   * Data: g1 loaded with m1 and m2, then reloaded with only m1 (new user).
   */
  it('reloading a group merges by id and keeps memberships the API no longer returns', async () => {
    const getGroupMemberships = vi
      .fn((_groupId: string) =>
        of([member('m1', 'g1'), member('m2', 'g1', 'u2')]),
      )
      .mockReturnValueOnce(of([member('m1', 'g1'), member('m2', 'g1', 'u2')]))
      .mockReturnValueOnce(of([member('m1', 'g1', 'u9')]));
    const service = setup({ getGroupMemberships });

    await firstValueFrom(service.loadMemberships('g1'));
    await firstValueFrom(service.loadMemberships('g1'));

    // Memberships deleted on the server stay listed until a SignalR
    // GroupMembershipDeleted event (deleteFromStore) removes them.
    const all = await firstValueFrom(service.groupMemberships$);
    expect(all).toEqual([member('m1', 'g1', 'u9'), member('m2', 'g1', 'u2')]);
  });

  /**
   * Verifies: createMembership() adds and deleteMembership() removes a membership.
   * Interacts with: GroupService.createGroupMembership/deleteGroupMembership stubs.
   * Data: membership 'm1' added to g1 and then removed.
   */
  it('creates and deletes memberships', async () => {
    const api = {
      createGroupMembership: vi.fn((groupId: string, m: GroupMembership) =>
        of({ ...m, id: 'm1', groupId }),
      ),
      deleteGroupMembership: vi.fn(() => of(null)),
    } satisfies ApiStub<GroupService>;
    const service = setup(api);
    const seen = recordEmissions(service.groupMemberships$);

    await firstValueFrom(service.createMembership('g1', { userId: 'u1' }));
    await firstValueFrom(service.deleteMembership('m1'));

    expect(api.createGroupMembership).toHaveBeenCalledWith('g1', {
      userId: 'u1',
    });
    expect(api.deleteGroupMembership).toHaveBeenCalledWith('m1');
    expect(seen.map((list) => list.map((m) => m.id))).toEqual([[], ['m1'], []]);
  });

  /**
   * Verifies: the SignalR entry points upsert and remove memberships by id.
   * Interacts with: updateStore/deleteFromStore, groupMemberships$.
   * Data: 'm1' pushed, re-pushed for a different user, then deleted.
   */
  it('updateStore() upserts and deleteFromStore() removes', async () => {
    const service = setup();

    service.updateStore(member('m1', 'g1'));
    service.updateStore(member('m1', 'g1', 'u2'));
    expect(await firstValueFrom(service.groupMemberships$)).toEqual([
      member('m1', 'g1', 'u2'),
    ]);

    service.deleteFromStore('m1');
    expect(await firstValueFrom(service.groupMemberships$)).toEqual([]);
  });
});
