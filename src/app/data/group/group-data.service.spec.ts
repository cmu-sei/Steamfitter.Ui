// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { Group, GroupService } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { GroupDataService } from './group-data.service';

function setup(api?: ApiStub<GroupService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      api ? { provide: GroupService, useValue: api } : unstubbed(GroupService),
    ]),
  });
  return TestBed.inject(GroupDataService);
}

describe('GroupDataService', () => {
  /**
   * Verifies: load() publishes the API's groups on groups$.
   * Interacts with: GroupService.getAllGroups stub.
   * Data: two groups.
   */
  it('load() publishes the groups', async () => {
    const service = setup({
      getAllGroups: () =>
        of([
          { id: 'g1', name: 'Red' },
          { id: 'g2', name: 'Blue' },
        ]),
    });

    await firstValueFrom(service.load());

    expect((await firstValueFrom(service.groups$)).map((g) => g.id)).toEqual([
      'g1',
      'g2',
    ]);
  });

  /**
   * Verifies: create() appends, edit() replaces by id, and delete() removes a group from groups$.
   * Interacts with: GroupService.createGroup/updateGroup/deleteGroup stubs.
   * Data: group 'g1' created as 'Red', renamed to 'Crimson', then deleted.
   */
  it('create, edit and delete update the published groups', async () => {
    const api = {
      createGroup: vi.fn((g: Group) => of({ ...g, id: 'g1' })),
      updateGroup: vi.fn((id: string, g: Group) => of({ ...g, id })),
      deleteGroup: vi.fn(() => of(null)),
    } satisfies ApiStub<GroupService>;
    const service = setup(api);
    const seen = recordEmissions(service.groups$);

    await firstValueFrom(service.create({ name: 'Red' }));
    await firstValueFrom(service.edit({ id: 'g1', name: 'Crimson' }));
    await firstValueFrom(service.delete('g1'));

    expect(api.updateGroup).toHaveBeenCalledWith('g1', {
      id: 'g1',
      name: 'Crimson',
    });
    expect(seen.map((list) => list.map((g) => g.name))).toEqual([
      [],
      ['Red'],
      ['Crimson'],
      [],
    ]);
  });

  /**
   * Verifies: editing a group that is not in the list does not add it or re-emit.
   * Interacts with: GroupService.updateGroup stub, groups$.
   * Data: an empty list and an edit of 'unknown'.
   */
  it('ignores edits to groups that are not loaded', async () => {
    const service = setup({
      updateGroup: (id: string, g: Group) => of({ ...g, id }),
    });
    const seen = recordEmissions(service.groups$);

    await firstValueFrom(service.edit({ id: 'unknown', name: 'X' }));

    expect(seen).toEqual([[]]);
  });
});
