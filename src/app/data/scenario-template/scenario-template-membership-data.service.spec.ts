// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  ScenarioTemplateMembership,
  ScenarioTemplateMembershipsService,
} from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { ScenarioTemplateMembershipDataService } from './scenario-template-membership-data.service';

function membership(
  overrides: Partial<ScenarioTemplateMembership> = {},
): ScenarioTemplateMembership {
  return {
    id: 'm1',
    scenarioTemplateId: 't1',
    groupId: 'g1',
    roleId: 'r1',
    ...overrides,
  };
}

function setup(api?: ApiStub<ScenarioTemplateMembershipsService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      api
        ? { provide: ScenarioTemplateMembershipsService, useValue: api }
        : unstubbed(ScenarioTemplateMembershipsService),
    ]),
  });
  return TestBed.inject(ScenarioTemplateMembershipDataService);
}

describe('ScenarioTemplateMembershipDataService', () => {
  /**
   * Verifies: loadMemberships() fetches the template's memberships and publishes them.
   * Interacts with: ScenarioTemplateMembershipsService.getAllScenarioTemplateMemberships stub.
   * Data: two memberships for template 't1'.
   */
  it('loadMemberships() publishes the fetched memberships', async () => {
    const api = {
      getAllScenarioTemplateMemberships: vi.fn(() =>
        of([membership(), membership({ id: 'm2' })]),
      ),
    } satisfies ApiStub<ScenarioTemplateMembershipsService>;
    const service = setup(api);

    await firstValueFrom(service.loadMemberships('t1'));

    expect(api.getAllScenarioTemplateMemberships).toHaveBeenCalledWith('t1');
    const published = await firstValueFrom(
      service.scenarioTemplateMemberships$,
    );
    expect(published.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  /**
   * Verifies: create, edit and delete each update the published membership list.
   * Interacts with: create/update/deleteScenarioTemplateMembership stubs, scenarioTemplateMemberships$.
   * Data: membership 'm1' created with role r1, edited to r2, then deleted.
   */
  it('creates, edits and deletes a membership in the published list', async () => {
    const api = {
      createScenarioTemplateMembership: vi.fn(
        (_templateId: string, m: ScenarioTemplateMembership) =>
          of({ ...m, id: 'm1' }),
      ),
      updateScenarioTemplateMembership: vi.fn(
        (_id: string, m: ScenarioTemplateMembership) => of({ ...m }),
      ),
      deleteScenarioTemplateMembership: vi.fn(() => of(null)),
    } satisfies ApiStub<ScenarioTemplateMembershipsService>;
    const service = setup(api);
    const seen = recordEmissions(service.scenarioTemplateMemberships$);

    await firstValueFrom(
      service.createMembership('t1', membership({ id: undefined })),
    );
    await firstValueFrom(service.editMembership(membership({ roleId: 'r2' })));
    await firstValueFrom(service.deleteMembership('m1'));

    expect(api.createScenarioTemplateMembership).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ groupId: 'g1' }),
    );
    expect(api.updateScenarioTemplateMembership).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ roleId: 'r2' }),
    );
    expect(seen.map((list) => list.map((m) => m.roleId))).toEqual([
      [],
      ['r1'],
      ['r2'],
      [],
    ]);
  });

  /**
   * Verifies: the SignalR entry points add unknown memberships, merge known ones, and remove by id.
   * Interacts with: updateStore/deleteFromStore, scenarioTemplateMemberships$.
   * Data: memberships 'm1' and 'm2' pushed, 'm1' re-pushed with a new role, then 'm2' deleted.
   */
  it('updateStore() upserts and deleteFromStore() removes', async () => {
    const service = setup();

    service.updateStore(membership());
    service.updateStore(membership({ id: 'm2', roleId: 'r9' }));
    service.updateStore(membership({ roleId: 'r2' }));
    service.deleteFromStore('m2');

    const published = await firstValueFrom(
      service.scenarioTemplateMemberships$,
    );
    expect(published).toEqual([membership({ roleId: 'r2' })]);
  });
});
