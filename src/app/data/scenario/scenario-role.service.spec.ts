// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import {
  ScenarioRole,
  ScenarioRolesService,
} from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import { ScenarioRoleService } from './scenario-role.service';

const observer: ScenarioRole = {
  id: 'r1',
  name: 'Observer',
  permissions: ['ViewScenario'],
};
const manager: ScenarioRole = { id: 'r2', name: 'Manager', allPermissions: true };

function setup(api: ApiStub<ScenarioRolesService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      { provide: ScenarioRolesService, useValue: api },
    ]),
  });
  return TestBed.inject(ScenarioRoleService);
}

describe('ScenarioRoleService', () => {
  /**
   * Verifies: loadRoles() returns the fetched roles and publishes them on scenarioRoles$, which starts empty.
   * Interacts with: ScenarioRolesService.getAllScenarioRoles stub.
   * Data: two scenario roles, one with a permission list and one with allPermissions.
   */
  it('publishes the fetched roles on scenarioRoles$ after an empty start', async () => {
    const api = {
      getAllScenarioRoles: vi.fn(() => of([observer, manager])),
    } satisfies ApiStub<ScenarioRolesService>;
    const service = setup(api);
    const seen = recordEmissions(service.scenarioRoles$);

    expect(await firstValueFrom(service.loadRoles())).toEqual([
      observer,
      manager,
    ]);

    expect(api.getAllScenarioRoles).toHaveBeenCalledTimes(1);
    expect(api.getAllScenarioRoles).toHaveBeenCalledWith();
    expect(seen).toEqual([[], [observer, manager]]);
  });

  /**
   * Verifies: loadRoles() builds the request but sends and publishes nothing until the caller subscribes.
   * Interacts with: ScenarioRolesService.getAllScenarioRoles stub (a cold observable that counts subscriptions, like HttpClient's).
   * Data: one role; loadRoles() called, then subscribed.
   */
  it('publishes nothing until the loadRoles() result is subscribed', async () => {
    let requests = 0;
    const request = new Observable<ScenarioRole[]>((subscriber) => {
      requests++;
      subscriber.next([observer]);
      subscriber.complete();
    });
    const api = {
      getAllScenarioRoles: vi.fn(() => request),
    } satisfies ApiStub<ScenarioRolesService>;
    const service = setup(api);
    const seen = recordEmissions(service.scenarioRoles$);

    const load = service.loadRoles();

    expect(api.getAllScenarioRoles).toHaveBeenCalledTimes(1);
    expect(requests).toBe(0);
    expect(seen).toEqual([[]]);

    await firstValueFrom(load);

    expect(requests).toBe(1);
    expect(seen).toEqual([[], [observer]]);
  });

  /**
   * Verifies: a second load replaces the published roles with the new response.
   * Interacts with: ScenarioRolesService.getAllScenarioRoles stub (two responses).
   * Data: the first load returns both roles, the second only Manager.
   */
  it('replaces the published roles on the next load', async () => {
    const api = {
      getAllScenarioRoles: vi
        .fn<() => Observable<ScenarioRole[]>>()
        .mockReturnValueOnce(of([observer, manager]))
        .mockReturnValueOnce(of([manager])),
    } satisfies ApiStub<ScenarioRolesService>;
    const service = setup(api);
    const seen = recordEmissions(service.scenarioRoles$);

    await firstValueFrom(service.loadRoles());
    await firstValueFrom(service.loadRoles());

    expect(api.getAllScenarioRoles).toHaveBeenCalledTimes(2);
    expect(seen).toEqual([[], [observer, manager], [manager]]);
  });

  /**
   * Verifies: a failed request reaches the loadRoles() subscriber and leaves scenarioRoles$ empty.
   * Interacts with: ScenarioRolesService.getAllScenarioRoles stub (fails).
   * Data: getAllScenarioRoles errors with a 500 before any role was loaded.
   */
  it('passes a failed request to the caller and publishes nothing', async () => {
    const failure = new Error('500');
    const api = {
      getAllScenarioRoles: vi.fn(() => throwError(() => failure)),
    } satisfies ApiStub<ScenarioRolesService>;
    const service = setup(api);
    const seen = recordEmissions(service.scenarioRoles$);

    await expect(firstValueFrom(service.loadRoles())).rejects.toBe(failure);

    expect(seen).toEqual([[]]);
  });

  /**
   * Verifies: a failed reload reaches the caller and keeps the roles published by the earlier load.
   * Interacts with: ScenarioRolesService.getAllScenarioRoles stub (succeeds, then fails).
   * Data: the first load returns both roles, the second errors with a 500.
   */
  it('keeps the earlier roles when a reload fails', async () => {
    const failure = new Error('500');
    const api = {
      getAllScenarioRoles: vi
        .fn<() => Observable<ScenarioRole[]>>()
        .mockReturnValueOnce(of([observer, manager]))
        .mockReturnValueOnce(throwError(() => failure)),
    } satisfies ApiStub<ScenarioRolesService>;
    const service = setup(api);
    const seen = recordEmissions(service.scenarioRoles$);

    await firstValueFrom(service.loadRoles());
    await expect(firstValueFrom(service.loadRoles())).rejects.toBe(failure);

    expect(seen).toEqual([[], [observer, manager]]);
    expect(await firstValueFrom(service.scenarioRoles$)).toEqual([
      observer,
      manager,
    ]);
  });
});
