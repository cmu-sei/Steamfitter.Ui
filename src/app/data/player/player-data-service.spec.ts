// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PlayerService, View, Vm } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { PlayerDataService } from './player-data-service';

const views: View[] = [
  { id: 'v-2', name: 'bravo' },
  { id: 'v-1', name: 'Alpha' },
];

const vmsByView: Record<string, Vm[]> = {
  'v-1': [
    { id: 'vm-b', name: 'web' },
    { id: 'vm-a', name: 'DC' },
  ],
  'v-2': [{ id: 'vm-c', name: 'kali' }],
};

function setup(
  options: { params?: Params; playerApi?: ApiStub<PlayerService> } = {},
) {
  const playerApi =
    options.playerApi ??
    ({
      getViews: vi.fn(() => of(views.map((v) => ({ ...v })))),
      getVms: vi.fn((viewId?: string) => of(vmsByView[viewId] ?? [])),
    } satisfies ApiStub<PlayerService>);
  // PlayerDataService reads the initial viewId from the route snapshot once,
  // at construction; the stub's snapshot is live.
  const { route, setQueryParams } = activatedRouteStub(options.params);
  const router = {
    navigate: vi.fn<Router['navigate']>(() => Promise.resolve(true)),
  } satisfies Pick<Router, 'navigate'>;
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      { provide: PlayerService, useValue: playerApi },
    ]),
  });
  return {
    service: TestBed.inject(PlayerDataService),
    playerApi,
    navigate: router.navigate,
    setQueryParams,
  };
}

describe('PlayerDataService', () => {
  describe('views', () => {
    /**
     * Verifies: getViewsFromApi() publishes the views, and viewList sorts them by name case-insensitively.
     * Interacts with: PlayerService.getViews stub, PlayerDataService.viewList.
     * Data: views 'bravo' and 'Alpha'.
     */
    it('loads the views and lists them by name', async () => {
      const { service } = setup();

      service.getViewsFromApi();

      const list = await firstValueFrom(service.viewList);
      expect(list.map((v) => v.id)).toEqual(['v-1', 'v-2']);
    });

    /**
     * Verifies: a failed view load publishes an empty list.
     * Interacts with: PlayerService.getViews stub (throws), PlayerDataService.views.
     * Data: the API errors.
     */
    it('publishes no views when the API fails', async () => {
      const { service } = setup({
        playerApi: { getViews: () => throwError(() => new Error('down')) },
      });

      service.getViewsFromApi();

      expect(await firstValueFrom(service.views)).toEqual([]);
    });

    /**
     * Verifies: the exmask query param filters views by name or id; typing in viewFilter writes exmask.
     * Interacts with: PlayerDataService.viewList and viewFilter, Router.navigate spy, ActivatedRoute stub.
     * Data: mask 'BRA' (name), then the typed term 'v-1' (id) pushed back through the route.
     */
    it('filters views by the exmask param', async () => {
      const { service, navigate, setQueryParams } = setup({
        params: { exmask: 'BRA' },
      });
      service.getViewsFromApi();
      expect((await firstValueFrom(service.viewList)).map((v) => v.id)).toEqual(
        ['v-2'],
      );

      service.viewFilter.setValue('v-1');

      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { exmask: 'v-1' },
        queryParamsHandling: 'merge',
      });
      setQueryParams({ exmask: 'v-1' });
      expect((await firstValueFrom(service.viewList)).map((v) => v.id)).toEqual(
        ['v-1'],
      );
    });
  });

  describe('selectedView', () => {
    /**
     * Verifies: selecting a view emits it and replaces the VM list with that view's VMs, fetched once.
     * Interacts with: PlayerDataService.selectView/selectedView, PlayerService.getVms stub, vms subject.
     * Data: views loaded; view 'v-1' selected; the view list then re-emits.
     */
    it('emits the selected view and loads its VMs once', async () => {
      const { service, playerApi } = setup();
      service.getViewsFromApi();
      const selected = recordEmissions(service.selectedView);

      service.selectView('v-1');
      service.views.next(service.views.getValue());

      expect(selected.map((v) => v?.id)).toEqual([undefined, 'v-1', 'v-1']);
      expect(playerApi.getVms).toHaveBeenCalledTimes(1);
      expect((await firstValueFrom(service.vms)).map((vm) => vm.id)).toEqual([
        'vm-b',
        'vm-a',
      ]);
    });

    /**
     * Verifies: a viewId in the URL at construction is used as the initial selection.
     * Interacts with: ActivatedRoute snapshot (stub), PlayerDataService.selectedView.
     * Data: URL viewId=v-2.
     */
    it('seeds the selection from the viewId in the URL', async () => {
      const { service } = setup({ params: { viewId: 'v-2' } });
      service.getViewsFromApi();

      expect((await firstValueFrom(service.selectedView))?.name).toBe('bravo');
    });

    /**
     * Verifies: selecting an id that is not in the view list emits undefined and loads no VMs.
     * Interacts with: PlayerDataService.selectedView, PlayerService.getVms stub.
     * Data: selectView('missing').
     */
    it('emits undefined for an unknown view', async () => {
      const { service, playerApi } = setup();
      service.getViewsFromApi();

      service.selectView('missing');

      expect(await firstValueFrom(service.selectedView)).toBeUndefined();
      expect(playerApi.getVms).not.toHaveBeenCalled();
    });
  });

  describe('VMs', () => {
    /**
     * Verifies: getAllVmsFromApi() clears the VM list and then collects the VMs of every loaded view.
     * Interacts with: PlayerService.getVms stub, PlayerDataService.vms.
     * Data: two views with two and one VMs; a stale VM published beforehand.
     */
    it('getAllVmsFromApi() collects the VMs of every view', async () => {
      const { service, playerApi } = setup();
      service.getViewsFromApi();
      service.vms.next([{ id: 'stale', name: 'old' }]);

      service.getAllVmsFromApi();

      expect(playerApi.getVms).toHaveBeenCalledTimes(2);
      const ids = (await firstValueFrom(service.vms)).map((vm) => vm.id).sort();
      expect(ids).toEqual(['vm-a', 'vm-b', 'vm-c']);
    });

    /**
     * Verifies: a failed VM request for one view lets the API error escape unhandled while the other views' VMs still load (current behavior).
     * Interacts with: PlayerService.getVms stub failing for one view, captureUnhandledRxErrors, PlayerDataService.vms.
     * Data: views v-1 and v-2; getVms fails for v-2 with 'boom'.
     */
    it('getAllVmsFromApi() lets a failed VM request escape unhandled', async () => {
      const errors = captureUnhandledRxErrors();
      const failure = new Error('boom');
      const { service } = setup({
        playerApi: {
          getViews: () => of(views.map((v) => ({ ...v }))),
          getVms: (viewId?: string) =>
            viewId === 'v-2'
              ? throwError(() => failure)
              : of(vmsByView[viewId] ?? []),
        },
      });
      service.getViewsFromApi();

      service.getAllVmsFromApi();
      await flush();

      expect(errors).toEqual([failure]);
      const ids = (await firstValueFrom(service.vms)).map((vm) => vm.id).sort();
      expect(ids).toEqual(['vm-a', 'vm-b']);
    });

    /**
     * Verifies: vmList sorts VMs by name and filters by the vmFilter control on name or id.
     * Interacts with: PlayerDataService.vmList and vmFilter.
     * Data: VMs 'web', 'DC', 'kali'; filter terms 'dc' and 'vm-c'.
     */
    it('vmList sorts by name and follows the VM filter', () => {
      const { service } = setup();
      service.getViewsFromApi();
      service.getAllVmsFromApi();
      const lists = recordEmissions(service.vmList);

      service.vmFilter.setValue('dc');
      service.vmFilter.setValue('vm-c');

      expect(lists.map((list) => list.map((vm) => vm.name))).toEqual([
        ['DC', 'kali', 'web'],
        ['DC'],
        ['kali'],
      ]);
    });

    /**
     * Verifies: only VMs that are loaded can be selected, removal works by id, and reset clears the selection.
     * Interacts with: addSelectedVm/removeSelectedVm/resetSelectedVms, selectedVms subject.
     * Data: loaded VMs for view 'v-1'; ids 'vm-a', 'unknown', and 'vm-b'.
     */
    it('tracks the selected VMs', async () => {
      const { service } = setup();
      service.getViewVmsFromApi('v-1', true);

      service.addSelectedVm('vm-a');
      service.addSelectedVm('unknown');
      service.addSelectedVm('vm-b');
      expect(await firstValueFrom(service.selectedVms)).toEqual([
        'vm-a',
        'vm-b',
      ]);

      service.removeSelectedVm('vm-a');
      expect(await firstValueFrom(service.selectedVms)).toEqual(['vm-b']);

      service.resetSelectedVms();
      expect(await firstValueFrom(service.selectedVms)).toEqual([]);
    });

    /**
     * Verifies: selecting the same VM twice records it twice.
     * Interacts with: PlayerDataService.addSelectedVm, selectedVms subject.
     * Data: 'vm-a' added twice.
     */
    it('does not de-duplicate repeated selections', async () => {
      const { service } = setup();
      service.getViewVmsFromApi('v-1', true);

      service.addSelectedVm('vm-a');
      service.addSelectedVm('vm-a');

      expect(await firstValueFrom(service.selectedVms)).toEqual([
        'vm-a',
        'vm-a',
      ]);
    });
  });
});
