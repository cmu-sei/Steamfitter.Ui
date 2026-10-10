// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { inject, provideEnvironmentInitializer } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  Scenario,
  ScenarioService,
  ScenarioTemplate,
  ScenarioTemplateService,
  VmCredential,
  VmCredentialService,
} from 'src/app/generated/steamfitter.api';
import { ScenarioStore } from 'src/app/data/scenario/scenario.store';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { ScenarioTemplateStore } from 'src/app/data/scenario-template/scenario-template.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { VmCredentialsComponent } from './vm-credentials.component';

const CREDENTIALS: VmCredential[] = [
  { id: 'c2', username: 'bob', password: 'pw2', description: '' },
  { id: 'c1', username: 'alice', password: 'pw1', description: '' },
];

async function renderCredentials(parent: 'scenario' | 'template') {
  const scenario: Scenario = {
    id: 's1',
    name: 'Alpha',
    defaultVmCredentialId: 'c2',
    vmCredentials: structuredClone(CREDENTIALS),
  };
  const template: ScenarioTemplate = {
    id: 'st1',
    name: 'Base',
    defaultVmCredentialId: 'c2',
    vmCredentials: structuredClone(CREDENTIALS),
  };
  const scenarioApi = {
    // The generated client throws synchronously on a missing id.
    getScenario: vi.fn((id: string) => {
      if (id == null) {
        throw new Error(
          'Required parameter id was null or undefined when calling getScenario.',
        );
      }
      return of(structuredClone(scenario));
    }),
    updateScenario: vi.fn((id: string, body: Scenario) =>
      of(structuredClone(body)),
    ),
  } satisfies ApiStub<ScenarioService>;
  const templateApi = {
    getScenarioTemplate: vi.fn(() =>
      of<ScenarioTemplate>({
        ...structuredClone(template),
        vmCredentials: [structuredClone(CREDENTIALS[0])],
      }),
    ),
  } satisfies ApiStub<ScenarioTemplateService>;
  const vmCredentialApi = {
    deleteVmCredential: vi.fn(() => of(null)),
  } satisfies ApiStub<VmCredentialService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };

  const rendered = await renderComponent(VmCredentialsComponent, {
    declarations: [VmCredentialsComponent],
    imports: [
      MatExpansionModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      MatButtonModule,
    ],
    providers: [
      { provide: ScenarioService, useValue: scenarioApi },
      { provide: ScenarioTemplateService, useValue: templateApi },
      { provide: VmCredentialService, useValue: vmCredentialApi },
      { provide: CrucibleDialogService, useValue: dialogService },
      // The host activates the scenario or template before this renders.
      provideEnvironmentInitializer(() => {
        if (parent === 'scenario') {
          const store = inject(ScenarioStore);
          store.set([scenario]);
          store.setActive('s1');
        } else {
          const store = inject(ScenarioTemplateStore);
          store.set([template]);
          store.setActive('st1');
        }
      }),
    ],
    inputs:
      parent === 'scenario'
        ? { scenarioId: 's1' }
        : { scenarioTemplateId: 'st1' },
  });
  const selected = vi.fn();
  rendered.fixture.componentInstance.selectedVmCredentialChanged.subscribe(
    selected,
  );
  // The parent streams are delayed by one macrotask.
  rendered.fixture.detectChanges();
  await rendered.fixture.whenStable();
  rendered.fixture.detectChanges();
  const usernames = () =>
    // The buttons are found by their title attributes, which is cheaper than
    // role queries.
    screen
      .queryAllByTitle(/^Use /)
      .map((b) => b.getAttribute('title')?.replace('Use ', ''));
  return {
    ...rendered,
    user: userEvent.setup(),
    selected,
    scenarioApi,
    vmCredentialApi,
    usernames,
  };
}

describe('VmCredentialsComponent', () => {
  /**
   * Verifies: the active scenario's credentials are listed by username, its default is emitted first, and Use emits the chosen credential.
   * Interacts with: real ScenarioStore and ScenarioQuery (selectActive), the selectedVmCredentialChanged output.
   * Data: active scenario s1 with bob (default) and alice; alice is used.
   */
  it("lists the scenario's credentials and emits the one used", async () => {
    const { user, selected, usernames } = await renderCredentials('scenario');

    expect(usernames()).toEqual(['alice', 'bob']);
    await user.click(screen.getByTitle('Use alice'));

    expect(selected.mock.calls.map(([c]) => c.username)).toEqual([
      'bob',
      'alice',
    ]);
  });

  /**
   * Verifies: Set as Default saves the scenario with the new default and the list then offers Unset Default for it.
   * Interacts with: real ScenarioDataService.updateScenario, ScenarioService.updateScenario stub, real ScenarioStore.
   * Data: active scenario s1 whose default is bob; alice is made the default.
   */
  it('makes a credential the default', async () => {
    const { user, scenarioApi, fixture } = await renderCredentials('scenario');

    await user.click(screen.getAllByTitle('Set as Default')[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(scenarioApi.updateScenario).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ defaultVmCredentialId: 'c1' }),
    );
    expect(screen.getAllByTitle('Unset Default')).toHaveLength(1);
    expect(screen.getAllByTitle('Set as Default')).toHaveLength(1);
  });

  /**
   * Verifies: deleting a credential of a template reloads the template, and the credential leaves the list.
   * Interacts with: CrucibleDialogService.confirm stub, real ScenarioTemplateDataService.deleteVmCredential and loadById, VmCredentialService.deleteVmCredential stub.
   * Data: active template st1 with bob and alice; alice is deleted; the reloaded template holds only bob.
   */
  it('removes a deleted credential from a template', async () => {
    const { user, vmCredentialApi, usernames, fixture } =
      await renderCredentials('template');

    await user.click(screen.getByTitle('Delete alice from list'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(vmCredentialApi.deleteVmCredential).toHaveBeenCalledWith('c1');
    expect(usernames()).toEqual(['bob']);
  });

  /**
   * Verifies: deleting a credential of a scenario reloads the scenario with no id, which throws, leaves loading set and the credential listed (current behavior).
   * Interacts with: real ScenarioDataService.deleteVmCredential and loadById, ScenarioService.getScenario stub (throws on a missing id like the generated client), captureUnhandledRxErrors.
   * Data: active scenario s1 with bob and alice; alice is deleted.
   */
  it('reloads the scenario without its id after a credential is deleted', async () => {
    const errors = captureUnhandledRxErrors();
    const { user, vmCredentialApi, scenarioApi, usernames, fixture } =
      await renderCredentials('scenario');

    await user.click(screen.getByTitle('Delete alice from list'));
    await flush();
    fixture.detectChanges();

    expect(vmCredentialApi.deleteVmCredential).toHaveBeenCalledWith('c1');
    // Current behavior; see agent-docs/ui-test-bugs/steamfitter.ui.md.
    expect(scenarioApi.getScenario).toHaveBeenCalledWith(undefined);
    expect(errors).toEqual([
      new Error(
        'Required parameter id was null or undefined when calling getScenario.',
      ),
    ]);
    expect(TestBed.inject(ScenarioQuery).getValue().loading).toBe(true);
    expect(usernames()).toEqual(['alice', 'bob']);
  });
});
