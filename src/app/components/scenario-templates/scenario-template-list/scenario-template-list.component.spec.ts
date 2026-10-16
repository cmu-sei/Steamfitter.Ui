// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Directive, Input } from '@angular/core';
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
  ScenarioService,
  ScenarioTemplate,
  ScenarioTemplatePermission,
  ScenarioTemplateService,
  SystemPermission,
} from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';
import { ScenarioTemplateStore } from 'src/app/data/scenario-template/scenario-template.store';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { ScenarioTemplateListComponent } from './scenario-template-list.component';

@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
}

@Component({
  selector: 'app-scenario-template-edit',
  template: '',
  standalone: false,
})
class ScenarioTemplateEditStubComponent {
  @Input() scenarioTemplate?: ScenarioTemplate;
}

@Component({
  selector: 'app-scenario-template-memberships',
  template: '',
  standalone: false,
})
class ScenarioTemplateMembershipsStubComponent {
  @Input() scenarioTemplateId?: string;
  @Input() showHeader?: boolean;
}

function template(overrides: Partial<ScenarioTemplate> = {}): ScenarioTemplate {
  return {
    id: 't1',
    name: 'Alpha',
    description: 'first',
    durationHours: 2,
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    scenarioTemplatePermissions: [],
    ...overrides,
  };
}

async function renderList(
  overrides: {
    system?: SystemPermission[];
    templates?: ScenarioTemplate[];
    confirmed?: boolean;
  } = {},
) {
  const { system = [], templates = [template()], confirmed = true } = overrides;
  const templateApi = {
    getScenarioTemplates: vi.fn(() => of([])),
    copyScenarioTemplate: vi.fn(() =>
      of(template({ id: 't2', name: 'Alpha copy' })),
    ),
    deleteScenarioTemplate: vi.fn(() => of(null)),
  } satisfies ApiStub<ScenarioTemplateService>;
  const scenarioApi = {
    createScenarioFromScenarioTemplate: vi.fn(() =>
      of({ id: 's-new', name: 'From template' }),
    ),
  } satisfies ApiStub<ScenarioService>;
  const confirm = vi.fn(
    () => dialogRefStub<unknown, boolean>(confirmed).dialogRef,
  );
  const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };
  const dialog: Pick<MatDialog, 'open'> = { open: vi.fn() };

  const rendered = await renderComponent(ScenarioTemplateListComponent, {
    declarations: [
      ScenarioTemplateListComponent,
      ClipboardStubDirective,
      ScenarioTemplateEditStubComponent,
      ScenarioTemplateMembershipsStubComponent,
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
      { provide: ScenarioTemplateService, useValue: templateApi },
      { provide: ScenarioService, useValue: scenarioApi },
      { provide: CrucibleDialogService, useValue: dialogService },
      { provide: MatDialog, useValue: dialog },
    ],
    inputs: { scenarioTemplateList: templates },
  });

  const user = userEvent.setup();
  // Rows are found by their text: a role query with a name computes the
  // accessible name of every row, which is slow on Material tables.
  const rowOf = (name: string) =>
    within(screen.getByRole('table'))
      .getByText(name)
      .closest('tr') as HTMLElement;
  const rowMenuButton = (name: string) =>
    within(rowOf(name)).queryByRole('button', {
      name: 'Scenario Template Menu',
    });
  const openRowMenu = async (name: string) => {
    await user.click(rowMenuButton(name));
  };
  const menuItems = () =>
    screen.queryAllByRole('menuitem').map((item) => item.textContent?.trim());

  return {
    ...rendered,
    user,
    templateApi,
    scenarioApi,
    confirm,
    rowOf,
    rowMenuButton,
    openRowMenu,
    menuItems,
  };
}

describe('ScenarioTemplateListComponent', () => {
  /**
   * Verifies: the component reloads all templates on construction even when given a list.
   * Interacts with: real ScenarioTemplateDataService.load, ScenarioTemplateService.getScenarioTemplates stub.
   * Data: a one-template scenarioTemplateList input.
   */
  it('reloads templates on construction even when given a list', async () => {
    const { templateApi } = await renderList();

    expect(templateApi.getScenarioTemplates).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies: the Add Scenario Template button needs CreateScenarioTemplates.
   * Interacts with: real PermissionDataService.hasPermission via permissionDataProviders.
   * Data: CreateScenarioTemplates vs. Edit/Manage templates only.
   */
  it.each([
    { system: ['CreateScenarioTemplates'], shown: true },
    {
      system: ['EditScenarioTemplates', 'ManageScenarioTemplates'],
      shown: false,
    },
  ] as Array<{ system: SystemPermission[]; shown: boolean }>)(
    'shows Add Scenario Template = $shown for $system',
    async ({ system, shown }) => {
      await renderList({ system });
      const add = screen.queryByRole('button', {
        name: 'Add Scenario Template',
      });
      expect(add !== null).toBe(shown);
    },
  );

  /**
   * Verifies: each row's Copy ID button needs CreateScenarioTemplates.
   * Interacts with: real PermissionDataService.hasPermission via permissionDataProviders, the actions cell template.
   * Data: CreateScenarioTemplates vs. Edit/Manage templates and CreateScenarios only; one template 't1'.
   */
  it.each([
    { system: ['CreateScenarioTemplates'], shown: true },
    {
      system: [
        'EditScenarioTemplates',
        'ManageScenarioTemplates',
        'CreateScenarios',
      ],
      shown: false,
    },
  ] as Array<{ system: SystemPermission[]; shown: boolean }>)(
    'shows the Copy ID button = $shown for $system',
    async ({ system, shown }) => {
      const { rowOf } = await renderList({ system });
      const row = rowOf('Alpha');
      const copy = within(row).queryByRole('button', {
        name: /^Copy ID:\s+t1$/,
      });
      expect(copy !== null).toBe(shown);
    },
  );

  /**
   * Verifies: the row menu button appears only for users who can edit or manage that template.
   * Interacts with: canDoSomething over template-level and system permissions.
   * Data: Edit on 'Alpha', Manage on 'Bravo', View (the near miss) on 'Charlie'; no system permissions.
   */
  it('shows the row menu only to template editors and managers', async () => {
    const { rowMenuButton } = await renderList({
      templates: [
        template({
          id: 't1',
          name: 'Alpha',
          scenarioTemplatePermissions: [
            ScenarioTemplatePermission.EditScenarioTemplate,
          ],
        }),
        template({
          id: 't2',
          name: 'Bravo',
          scenarioTemplatePermissions: [
            ScenarioTemplatePermission.ManageScenarioTemplate,
          ],
        }),
        template({
          id: 't3',
          name: 'Charlie',
          scenarioTemplatePermissions: [
            ScenarioTemplatePermission.ViewScenarioTemplate,
          ],
        }),
      ],
    });

    expect(
      [
        rowMenuButton('Alpha'),
        rowMenuButton('Bravo'),
        rowMenuButton('Charlie'),
      ].map(Boolean),
    ).toEqual([true, true, false]);
  });

  /**
   * Verifies: users who may only create scenarios get no menu button, yet right-clicking the row opens the menu with "Create a Scenario".
   * Interacts with: canDoSomething, the row's contextmenu binding, the context menu's CreateScenarios gate.
   * Data: system CreateScenarios only; a right-click on the 'Alpha' row.
   */
  it('hides the menu button from users who can only create scenarios but opens the menu on right-click', async () => {
    const { rowOf, rowMenuButton, user, menuItems } = await renderList({
      system: ['CreateScenarios'],
    });

    expect(rowMenuButton('Alpha')).toBeNull();
    await user.pointer({
      keys: '[MouseRight]',
      target: rowOf('Alpha'),
    });
    expect(menuItems()).toEqual(['Create a Scenario']);
  });

  /**
   * Verifies: the row menu offers Edit, Copy, Delete and Create a Scenario according to system permissions.
   * Interacts with: the context menu template, canEdit/canManage/hasPermission, real PermissionDataService.
   * Data: each row pairs system permissions with the expected items.
   */
  it.each([
    { system: ['EditScenarioTemplates'], items: ['Edit'] },
    {
      system: ['EditScenarioTemplates', 'CreateScenarioTemplates'],
      items: ['Edit', 'Copy'],
    },
    { system: ['ManageScenarioTemplates'], items: ['Delete'] },
    {
      system: ['EditScenarioTemplates', 'CreateScenarios'],
      items: ['Edit', 'Create a Scenario'],
    },
  ] as Array<{ system: SystemPermission[]; items: string[] }>)(
    'offers $items for $system',
    async ({ system, items }) => {
      const { openRowMenu, menuItems } = await renderList({ system });
      await openRowMenu('Alpha');
      expect(menuItems()).toEqual(items);
    },
  );

  /**
   * Verifies: template-level Edit and Manage permissions alone unlock Edit and Delete.
   * Interacts with: canEdit/canManage reading scenarioTemplatePermissions.
   * Data: a template with Edit and Manage template permissions and no system permissions.
   */
  it('honors template-level permissions without system permissions', async () => {
    const { openRowMenu, menuItems } = await renderList({
      templates: [
        template({
          scenarioTemplatePermissions: [
            ScenarioTemplatePermission.EditScenarioTemplate,
            ScenarioTemplatePermission.ManageScenarioTemplate,
          ],
        }),
      ],
    });

    await openRowMenu('Alpha');

    expect(menuItems()).toEqual(['Edit', 'Delete']);
  });

  /**
   * Verifies: confirming "Create a Scenario" creates a scenario from the template.
   * Interacts with: CrucibleDialogService.confirm stub, real ScenarioDataService, real ScenarioStore and ScenarioQuery, ScenarioService.createScenarioFromScenarioTemplate stub.
   * Data: EditScenarioTemplates + CreateScenarios; the user confirms; the API returns scenario 's-new'.
   */
  it('creates a scenario from the template after confirmation', async () => {
    const { openRowMenu, user, confirm, scenarioApi } = await renderList({
      system: ['EditScenarioTemplates', 'CreateScenarios'],
    });
    await openRowMenu('Alpha');

    await user.click(
      screen.getByRole('menuitem', { name: 'Create a Scenario' }),
    );

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Create Scenario' }),
    );
    expect(scenarioApi.createScenarioFromScenarioTemplate).toHaveBeenCalledWith(
      't1',
      {},
    );
    expect(TestBed.inject(ScenarioQuery).hasEntity('s-new')).toBe(true);
  });

  /**
   * Verifies: cancelling the Copy confirmation sends nothing.
   * Interacts with: CrucibleDialogService.confirm stub returning false, ScenarioTemplateService.copyScenarioTemplate stub.
   * Data: CreateScenarioTemplates + EditScenarioTemplates; the user cancels.
   */
  it('does not copy when the confirmation is cancelled', async () => {
    const { openRowMenu, user, templateApi } = await renderList({
      system: ['CreateScenarioTemplates', 'EditScenarioTemplates'],
      confirmed: false,
    });
    await openRowMenu('Alpha');

    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));

    expect(templateApi.copyScenarioTemplate).not.toHaveBeenCalled();
  });

  /**
   * Verifies: confirming Delete deletes the template through the data service and removes it from the store.
   * Interacts with: CrucibleDialogService.confirm stub, real ScenarioTemplateDataService, real ScenarioTemplateStore and ScenarioTemplateQuery, deleteScenarioTemplate stub.
   * Data: ManageScenarioTemplates; template 't1' seeded into the store; the user confirms.
   */
  it('deletes the template after confirmation', async () => {
    const { openRowMenu, user, templateApi } = await renderList({
      system: ['ManageScenarioTemplates'],
    });
    TestBed.inject(ScenarioTemplateStore).set([template()]);
    const templateQuery = TestBed.inject(ScenarioTemplateQuery);
    expect(templateQuery.hasEntity('t1')).toBe(true);
    await openRowMenu('Alpha');

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(templateApi.deleteScenarioTemplate).toHaveBeenCalledWith('t1');
    expect(templateQuery.hasEntity('t1')).toBe(false);
  });
});
