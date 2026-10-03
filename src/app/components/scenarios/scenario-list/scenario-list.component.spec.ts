// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Directive, EventEmitter, Input } from '@angular/core';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  Scenario,
  ScenarioPermission,
  ScenarioService,
  SystemPermission,
} from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ScenarioEditDialogComponent } from '../scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { ScenarioListComponent } from './scenario-list.component';

@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
}

@Component({ selector: 'app-scenario-edit', template: '', standalone: false })
class ScenarioEditStubComponent {
  @Input() scenario?: Scenario;
}

@Component({
  selector: 'app-scenario-memberships',
  template: '',
  standalone: false,
})
class ScenarioMembershipsStubComponent {
  @Input() scenarioId?: string;
  @Input() showHeader?: boolean;
}

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's1',
    name: 'Alpha',
    status: 'ready',
    view: 'View One',
    viewId: 'v1',
    startDate: new Date('2026-02-01T10:00:00Z'),
    endDate: new Date('2026-02-02T10:00:00Z'),
    scenarioPermissions: [],
    ...overrides,
  };
}

async function renderList(
  overrides: {
    system?: SystemPermission[];
    scenarios?: Scenario[];
    confirmed?: boolean;
  } = {},
) {
  const { system = [], scenarios = [scenario()], confirmed = true } = overrides;
  const scenarioApi = {
    getScenarios: vi.fn(() => of([])),
    startScenario: vi.fn((id: string) =>
      of(scenario({ id, status: 'active' })),
    ),
    endScenario: vi.fn((id: string) => of(scenario({ id, status: 'ended' }))),
    deleteScenario: vi.fn(() => of(null)),
  } satisfies ApiStub<ScenarioService>;
  const confirm = vi.fn(
    () => dialogRefStub<unknown, boolean>(confirmed).dialogRef,
  );
  const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };
  const dialog: Pick<MatDialog, 'open'> = { open: vi.fn() };

  const rendered = await renderComponent(ScenarioListComponent, {
    declarations: [
      ScenarioListComponent,
      ClipboardStubDirective,
      ScenarioEditStubComponent,
      ScenarioMembershipsStubComponent,
    ],
    imports: [
      MatTableModule,
      MatSortModule,
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      MatCardModule,
      MatProgressSpinnerModule,
    ],
    providers: [
      ...permissionDataProviders({ system }),
      { provide: ScenarioService, useValue: scenarioApi },
      { provide: CrucibleDialogService, useValue: dialogService },
      { provide: MatDialog, useValue: dialog },
    ],
    inputs: { scenarioList: scenarios, views: [] },
  });

  const user = userEvent.setup();
  const openRowMenu = async (name: string) => {
    const row = screen.getByRole('row', { name: new RegExp(name) });
    await user.click(
      within(row).getByRole('button', { name: 'Scenario Menu' }),
    );
  };
  const menuItems = () =>
    screen.queryAllByRole('menuitem').map((item) => item.textContent?.trim());

  // The next dialog.open() returns a dialogRefStub whose component exposes an
  // editComplete emitter the test fires itself.
  const openEditDialog = () => {
    const { dialogRef, close } = dialogRefStub<ScenarioEditDialogComponent>();
    const editComplete = new EventEmitter();
    const instance: Pick<ScenarioEditDialogComponent, 'editComplete'> = {
      editComplete,
    };
    dialogRef.componentInstance = instance as ScenarioEditDialogComponent;
    vi.mocked(dialog.open).mockReturnValue(dialogRef);
    return { editComplete, close };
  };

  return {
    ...rendered,
    user,
    scenarioApi,
    confirm,
    dialog,
    openEditDialog,
    openRowMenu,
    menuItems,
  };
}

describe('ScenarioListComponent', () => {
  describe('list', () => {
    /**
     * Verifies: only active and ready scenarios are listed by default, and a ready scenario without a view is flagged.
     * Interacts with: ScenarioListComponent status filter and status cell template.
     * Data: ready (no view), active, and ended scenarios.
     */
    it('lists active and ready scenarios and flags a ready one without a view', async () => {
      await renderList({
        scenarios: [
          scenario({ id: 's1', name: 'Alpha', view: null, viewId: null }),
          scenario({ id: 's2', name: 'Bravo', status: 'active' }),
          scenario({ id: 's3', name: 'Charlie', status: 'ended' }),
        ],
      });

      expect(screen.getByRole('row', { name: /Alpha/ })).toHaveTextContent(
        'Select a view!',
      );
      expect(screen.getByRole('row', { name: /Bravo/ })).toHaveTextContent(
        'active',
      );
      expect(
        screen.queryByRole('row', { name: /Charlie/ }),
      ).not.toBeInTheDocument();
    });

    /**
     * Verifies: the component reloads all scenarios on construction even when it is given a list.
     * Interacts with: real ScenarioDataService.load, ScenarioService.getScenarios stub.
     * Data: a one-scenario scenarioList input.
     */
    it('reloads scenarios on construction even when given a list', async () => {
      const { scenarioApi } = await renderList();

      expect(scenarioApi.getScenarios).toHaveBeenCalledTimes(1);
    });
  });

  describe('permission gates', () => {
    /**
     * Verifies: the Add Scenario button needs the CreateScenarios system permission.
     * Interacts with: real PermissionDataService.permissions via permissionDataProviders.
     * Data: CreateScenarios granted vs. Edit/Execute/Manage only.
     */
    it.each([
      { system: ['CreateScenarios'], shown: true },
      {
        system: ['EditScenarios', 'ExecuteScenarios', 'ManageScenarios'],
        shown: false,
      },
    ] as Array<{ system: SystemPermission[]; shown: boolean }>)(
      'shows Add Scenario = $shown for $system',
      async ({ system, shown }) => {
        await renderList({ system });
        const add = screen.queryByRole('button', { name: 'Add Scenario' });
        expect(add !== null).toBe(shown);
      },
    );

    /**
     * Verifies: each row's Copy ID button needs the CreateScenarios system permission.
     * Interacts with: real PermissionDataService.permissions via permissionDataProviders, the actions cell template.
     * Data: CreateScenarios granted vs. Edit/Execute/Manage only; one scenario 's1'.
     */
    it.each([
      { system: ['CreateScenarios'], shown: true },
      {
        system: ['EditScenarios', 'ExecuteScenarios', 'ManageScenarios'],
        shown: false,
      },
    ] as Array<{ system: SystemPermission[]; shown: boolean }>)(
      'shows the Copy ID button = $shown for $system',
      async ({ system, shown }) => {
        await renderList({ system });
        const row = screen.getByRole('row', { name: /Alpha/ });
        const copy = within(row).queryByRole('button', {
          name: /^Copy ID:\s+s1$/,
        });
        expect(copy !== null).toBe(shown);
      },
    );

    /**
     * Verifies: a row's Scenario Menu button appears only when the user can edit, execute, or manage that scenario.
     * Interacts with: ScenarioListComponent.canDoSomething over scenario-level and system permissions.
     * Data: EditScenario on 'Alpha', ExecuteScenario on 'Bravo', ViewScenario (the near miss) on 'Charlie'; no system permissions.
     */
    it('shows the row menu only where the user can act on the scenario', async () => {
      await renderList({
        scenarios: [
          scenario({
            id: 's1',
            name: 'Alpha',
            scenarioPermissions: [ScenarioPermission.EditScenario],
          }),
          scenario({
            id: 's2',
            name: 'Bravo',
            scenarioPermissions: [ScenarioPermission.ExecuteScenario],
          }),
          scenario({
            id: 's3',
            name: 'Charlie',
            scenarioPermissions: [ScenarioPermission.ViewScenario],
          }),
        ],
      });

      const hasMenu = (name: string) =>
        within(screen.getByRole('row', { name: new RegExp(name) })).queryByRole(
          'button',
          {
            name: 'Scenario Menu',
          },
        ) !== null;
      expect([hasMenu('Alpha'), hasMenu('Bravo'), hasMenu('Charlie')]).toEqual([
        true,
        true,
        false,
      ]);
    });

    /**
     * Verifies: users who may only create scenarios get no menu button, yet right-clicking the row opens the menu with Copy.
     * Interacts with: canDoSomething, the row's contextmenu binding, the context menu's CreateScenarios gate.
     * Data: system CreateScenarios only; a right-click on the 'Alpha' row.
     */
    it('hides the menu button from users who can only create scenarios but opens the menu on right-click', async () => {
      const { user, menuItems } = await renderList({
        system: ['CreateScenarios'],
      });
      const row = screen.getByRole('row', { name: /Alpha/ });

      expect(
        within(row).queryByRole('button', { name: 'Scenario Menu' }),
      ).toBeNull();
      await user.pointer({ keys: '[MouseRight]', target: row });
      expect(menuItems()).toEqual(['Copy']);
    });

    /**
     * Verifies: the row menu offers Edit, Copy, Start, End and Delete according to system permissions and status.
     * Interacts with: the context menu template, canEdit/canExecute/canManage, real PermissionDataService.
     * Data: each row of the table pairs system permissions and a scenario status with the expected items.
     */
    it.each([
      {
        label: 'Edit only',
        system: ['EditScenarios'],
        status: 'ready',
        items: ['Edit'],
      },
      {
        label: 'Create + Edit',
        system: ['CreateScenarios', 'EditScenarios'],
        status: 'ready',
        items: ['Edit', 'Copy'],
      },
      {
        label: 'Execute on ready',
        system: ['ExecuteScenarios'],
        status: 'ready',
        items: ['Start'],
      },
      {
        label: 'Execute on active',
        system: ['ExecuteScenarios'],
        status: 'active',
        items: ['End'],
      },
      {
        label: 'Manage',
        system: ['ManageScenarios'],
        status: 'active',
        items: ['Delete'],
      },
    ] as Array<{
      label: string;
      system: SystemPermission[];
      status: Scenario['status'];
      items: string[];
    }>)('offers $items for $label', async ({ system, status, items }) => {
      const { openRowMenu, menuItems } = await renderList({
        system,
        scenarios: [scenario({ status })],
      });
      await openRowMenu('Alpha');
      expect(menuItems()).toEqual(items);
    });

    /**
     * Verifies: scenario-level permissions alone drive the row menu items.
     * Interacts with: canEdit/canExecute/canManage reading scenario.scenarioPermissions.
     * Data: a ready scenario with Edit, Execute and Manage scenario permissions and no system permissions.
     */
    it('honors scenario-level permissions without system permissions', async () => {
      const { openRowMenu, menuItems } = await renderList({
        scenarios: [
          scenario({
            scenarioPermissions: [
              ScenarioPermission.EditScenario,
              ScenarioPermission.ExecuteScenario,
              ScenarioPermission.ManageScenario,
            ],
          }),
        ],
      });

      await openRowMenu('Alpha');

      expect(menuItems()).toEqual(['Edit', 'Start', 'Delete']);
    });

    /**
     * Verifies: a scenario-level ExecuteScenario grant shows Start on a ready scenario but not End on an active one.
     * Interacts with: the End item's canExecute(item.id) call in the context menu template.
     * Data: an active scenario with only the ExecuteScenario scenario permission.
     */
    it('hides End from users who can only execute this scenario', async () => {
      const { openRowMenu, menuItems } = await renderList({
        scenarios: [
          scenario({
            status: 'active',
            scenarioPermissions: [ScenarioPermission.ExecuteScenario],
          }),
        ],
      });

      await openRowMenu('Alpha');

      expect(menuItems()).toEqual([]);
    });

    /**
     * Verifies: the Manage-only Delete item is offered for an ended scenario once it is visible.
     * Interacts with: selectedStatuses input, canManage.
     * Data: an ended scenario, selectedStatuses including 'ended', ManageScenarios.
     */
    it('offers Delete on an ended scenario to a manager', async () => {
      const { openRowMenu, menuItems, rerender } = await renderList({
        system: ['ManageScenarios'],
        scenarios: [scenario({ status: 'ended' })],
      });
      await rerender({
        partialUpdate: true,
        inputs: { selectedStatuses: ['ended'] },
      });

      await openRowMenu('Alpha');

      expect(menuItems()).toEqual(['Delete']);
    });
  });

  describe('actions', () => {
    /**
     * Verifies: confirming Start sends the start request and stores the returned status.
     * Interacts with: CrucibleDialogService.confirm stub, real ScenarioDataService.start, real ScenarioStore and ScenarioQuery, ScenarioService.startScenario stub.
     * Data: a ready scenario with view; the user confirms; startScenario returns it as 'active'.
     */
    it('starts the scenario after confirmation', async () => {
      const { openRowMenu, user, confirm, scenarioApi } = await renderList({
        system: ['ExecuteScenarios'],
      });
      await openRowMenu('Alpha');

      await user.click(screen.getByRole('menuitem', { name: 'Start' }));

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Start Scenario Now' }),
      );
      expect(scenarioApi.startScenario).toHaveBeenCalledWith('s1');
      expect(TestBed.inject(ScenarioQuery).getEntity('s1')?.status).toBe(
        'active',
      );
    });

    /**
     * Verifies: cancelling the Delete confirmation sends nothing.
     * Interacts with: CrucibleDialogService.confirm stub returning false, ScenarioService.deleteScenario stub.
     * Data: a ready scenario; ManageScenarios; the user cancels.
     */
    it('does not delete when the confirmation is cancelled', async () => {
      const { openRowMenu, user, scenarioApi } = await renderList({
        system: ['ManageScenarios'],
        confirmed: false,
      });
      await openRowMenu('Alpha');

      await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

      expect(scenarioApi.deleteScenario).not.toHaveBeenCalled();
    });

    /**
     * Verifies: Add Scenario opens the edit dialog with a blank scenario and the views.
     * Interacts with: MatDialog.open stub.
     * Data: CreateScenarios; the dialog ref (dialogRefStub) exposes an editComplete that does not fire.
     */
    it('opens the edit dialog for a new scenario', async () => {
      const { user, openEditDialog, dialog } = await renderList({
        system: ['CreateScenarios'],
      });
      openEditDialog();

      await user.click(screen.getByRole('button', { name: 'Add Scenario' }));

      expect(dialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: { scenario: { name: '', description: '' }, views: [] },
        }),
      );
    });

    /**
     * Verifies: when the edit dialog completes, the scenario is emitted on saveScenario only if saveChanges is set, and the dialog closes either way.
     * Interacts with: MatDialog.open stub, the dialog's editComplete emitter, the saveScenario output, dialogRefStub close spy.
     * Data: CreateScenarios; editComplete emits saveChanges true with a scenario, then (second row) saveChanges false.
     */
    it.each([
      { saveChanges: true, emitted: [[{ name: 'New', description: 'd' }]] },
      { saveChanges: false, emitted: [] },
    ])(
      'emits saveScenario = $emitted when the dialog completes with saveChanges $saveChanges',
      async ({ saveChanges, emitted }) => {
        const { user, openEditDialog, fixture } = await renderList({
          system: ['CreateScenarios'],
        });
        const { editComplete, close } = openEditDialog();
        const saved = vi.fn();
        fixture.componentInstance.saveScenario.subscribe(saved);
        await user.click(screen.getByRole('button', { name: 'Add Scenario' }));

        editComplete.emit({
          saveChanges,
          scenario: { name: 'New', description: 'd' },
        });

        expect(saved.mock.calls).toEqual(emitted);
        expect(close).toHaveBeenCalledTimes(1);
      },
    );
  });
});
