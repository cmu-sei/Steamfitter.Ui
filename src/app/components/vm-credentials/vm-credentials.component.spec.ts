// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Provider, inject, provideEnvironmentInitializer } from '@angular/core';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Subject, of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
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
import { ScenarioTemplateStore } from 'src/app/data/scenario-template/scenario-template.store';
import { TestBed } from '@angular/core/testing';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
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

async function renderCredentials(
  parent: 'scenario' | 'template',
  options: {
    inputs?: Record<string, unknown>;
    providers?: Provider[];
    /** What the store holds before the component loads the parent; the API's credentials by default. */
    storedVmCredentials?: VmCredential[] | null;
    /** What the API returns; all of CREDENTIALS by default. */
    apiVmCredentials?: VmCredential[];
  } = {},
) {
  // The API's records, which a delete changes, as the stubs below read them.
  const apiCredentials = structuredClone(
    options.apiVmCredentials ?? CREDENTIALS,
  );
  const scenario: Scenario = {
    id: 's1',
    name: 'Alpha',
    defaultVmCredentialId: 'c2',
    vmCredentials: apiCredentials,
  };
  const template: ScenarioTemplate = {
    id: 'st1',
    name: 'Base',
    defaultVmCredentialId: 'c2',
    vmCredentials: apiCredentials,
  };
  // The record as the store holds it before the component loads it: null stands for one stored without
  // credentials, as a record first pushed over SignalR is.
  const stored = <T extends Scenario | ScenarioTemplate>(record: T): T => {
    const copy = structuredClone(record);
    if (options.storedVmCredentials === null) {
      delete copy.vmCredentials;
    } else if (options.storedVmCredentials) {
      copy.vmCredentials = structuredClone(options.storedVmCredentials);
    }
    return copy;
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
      of<ScenarioTemplate>(structuredClone(template)),
    ),
  } satisfies ApiStub<ScenarioTemplateService>;
  const vmCredentialApi = {
    deleteVmCredential: vi.fn((id: string) => {
      apiCredentials.splice(
        apiCredentials.findIndex((c) => c.id === id),
        1,
      );
      return of(null);
    }),
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
      ...(options.providers ?? []),
      // The host activates the scenario or template before this renders.
      provideEnvironmentInitializer(() => {
        if (parent === 'scenario') {
          const store = inject(ScenarioStore);
          store.set([stored(scenario)]);
          store.setActive('s1');
        } else {
          const store = inject(ScenarioTemplateStore);
          store.set([stored(template)]);
          store.setActive('st1');
        }
      }),
    ],
    inputs: {
      ...(parent === 'scenario'
        ? { scenarioId: 's1' }
        : { scenarioTemplateId: 'st1' }),
      ...(options.inputs ?? {}),
    },
  });
  const selected = vi.fn<(credential: VmCredential) => void>();
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
    templateApi,
    vmCredentialApi,
    usernames,
    confirm,
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
    const { user, vmCredentialApi, usernames, fixture, confirm } =
      await renderCredentials('template');

    await user.click(screen.getByTitle('Delete alice from list'));
    expect(confirm).toHaveBeenCalledWith({
      title: 'Delete VM Credential',
      message: 'Are you sure that you want to delete alice?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(vmCredentialApi.deleteVmCredential).toHaveBeenCalledWith('c1');
    expect(usernames()).toEqual(['bob']);
  });

  /**
   * Verifies: deleting a credential of a scenario reloads that scenario, and the credential leaves the list.
   * Interacts with: real ScenarioDataService.deleteVmCredential and loadById, ScenarioService.getScenario stub, VmCredentialService.deleteVmCredential stub, captureUnhandledRxErrors.
   * Data: active scenario s1 with bob and alice; alice is deleted.
   */
  it('reloads the scenario after a credential is deleted', async () => {
    const errors = captureUnhandledRxErrors();
    const { user, vmCredentialApi, scenarioApi, usernames, fixture } =
      await renderCredentials('scenario');

    await user.click(screen.getByTitle('Delete alice from list'));
    await flush();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(vmCredentialApi.deleteVmCredential).toHaveBeenCalledWith('c1');
    expect(scenarioApi.getScenario).toHaveBeenLastCalledWith('s1');
    expect(errors).toEqual([]);
    expect(usernames()).toEqual(['bob']);
  });

  /**
   * Verifies: the parent is loaded over REST whenever the credentials are shown, so they are current, and a record stored without them (as one first pushed over SignalR is) lists them.
   * Interacts with: real ScenarioDataService/ScenarioTemplateDataService.loadById, the ScenarioService and ScenarioTemplateService stubs.
   * Data: s1 or st1 stored without credentials; the API returns bob and alice.
   */
  it.each(['scenario', 'template'] as const)(
    'loads the %s and lists its credentials when it was stored without them',
    async (parent) => {
      const { scenarioApi, templateApi, usernames } = await renderCredentials(
        parent,
        { storedVmCredentials: null },
      );

      if (parent === 'scenario') {
        expect(scenarioApi.getScenario).toHaveBeenCalledWith('s1');
      } else {
        expect(templateApi.getScenarioTemplate).toHaveBeenCalledWith('st1');
      }
      expect(usernames()).toEqual(['alice', 'bob']);
    },
  );

  /**
   * Verifies: credentials stored earlier are replaced by what the API now returns, as for a user who has lost edit (sent none) or after another editor deleted one.
   * Interacts with: real ScenarioDataService.loadById, ScenarioService.getScenario stub.
   * Data: s1 stored with bob and alice; the API returns none.
   */
  it('replaces stale stored credentials with the ones the API returns', async () => {
    const { usernames } = await renderCredentials('scenario', {
      storedVmCredentials: CREDENTIALS,
      apiVmCredentials: [],
    });

    expect(usernames()).toEqual([]);
  });

  /**
   * Verifies: nothing is listed or used as the default until the fresh load returns, so a cached default with an old password is never applied.
   * Interacts with: a ScenarioService.getScenario stub that answers later, the selectedVmCredentialChanged output.
   * Data: s1 stored with default bob holding password old; the API later returns bob with password new.
   */
  it('waits for the fresh load before applying the default credential', async () => {
    const response = new Subject<Scenario>();
    const { fixture, selected, usernames } = await renderCredentials(
      'scenario',
      {
        storedVmCredentials: [{ ...CREDENTIALS[0], password: 'old' }],
        providers: [
          {
            provide: ScenarioService,
            useValue: { getScenario: () => response },
          },
        ],
      },
    );

    expect(selected).not.toHaveBeenCalled();
    expect(usernames()).toEqual([]);

    response.next({
      id: 's1',
      name: 'Alpha',
      defaultVmCredentialId: 'c2',
      vmCredentials: [{ ...CREDENTIALS[0], password: 'new' }],
    });
    response.complete();
    // the parent stream is delayed by one macrotask
    await flush();
    fixture.detectChanges();

    expect(selected.mock.calls.map(([c]) => c.password)).toEqual(['new']);
    expect(usernames()).toEqual(['bob']);
  });

  /**
   * Verifies: a failed fresh load says so and forgets the stored credentials, without leaving the store loading.
   * Interacts with: a ScenarioService.getScenario stub that fails, real ScenarioStore and ScenarioQuery.
   * Data: s1 stored with bob and alice; the GET fails with a 403.
   */
  it('says the credentials could not be loaded and forgets the stored ones', async () => {
    const errors = captureUnhandledRxErrors();
    const { usernames } = await renderCredentials('scenario', {
      storedVmCredentials: CREDENTIALS,
      providers: [
        {
          provide: ScenarioService,
          useValue: {
            getScenario: () => throwError(() => ({ status: 403 })),
          },
        },
      ],
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      /The VM Credentials could not be loaded/,
    );
    expect(usernames()).toEqual([]);
    const query = TestBed.inject(ScenarioQuery);
    expect(query.getEntity('s1').vmCredentials).toEqual([]);
    expect(query.getValue().loading).toBe(false);
    expect(errors).toEqual([]);
  });

  /**
   * Verifies: the hint says why the password went empty when the Task editor cleared a redacted one for a new username.
   * Interacts with: the secretCleared input, the password hint.
   * Data: the Task editor cleared the password (secretCleared true, password empty).
   */
  it('says a cleared password was for the previous username', async () => {
    await renderCredentials('scenario', {
      inputs: { username: 'other', password: '', secretCleared: true },
    });

    expect(
      screen.getByText(/The saved password was for the previous username/),
    ).toBeTruthy();
  });

  /**
   * Verifies: a Task that keeps a password the API withheld says so while the field is empty, and not once a password is entered.
   * Interacts with: the passwordKept input, the password hint.
   * Data: active scenario s1; the kept password's field is empty, then holds a typed password.
   */
  it('says a redacted password is kept unless changed', async () => {
    await renderCredentials('scenario', {
      inputs: { username: 'guest', password: '', passwordKept: true },
    });

    expect(
      screen.getByText(
        'The saved password is hidden. It is kept unless you enter a new one.',
      ),
    ).toBeTruthy();
  });

  it('does not show the redacted-password hint for a password of its own', async () => {
    await renderCredentials('scenario', {
      inputs: { username: 'guest', password: 'typed', passwordKept: true },
    });

    expect(screen.queryByText(/The saved password is hidden/)).toBeNull();
  });

  /**
   * Verifies: Add VM Credential offers no password for a Task that keeps one the API withheld (the field is empty), never the placeholder.
   * Interacts with: a MatDialog stub capturing the dialog data.
   * Data: active scenario s1; the Task keeps a redacted password.
   */
  it('does not copy a redacted password into a new credential', async () => {
    const open = vi.fn(() => ({
      componentInstance: { editComplete: new Subject() },
      close: vi.fn(),
    }));
    const { user } = await renderCredentials('scenario', {
      inputs: { username: 'guest', password: '', passwordKept: true },
      providers: [{ provide: MatDialog, useValue: { open } }],
    });

    await user.click(screen.getByTitle('Add VM Credential'));

    const [, config] = open.mock.calls[0] as unknown as [
      unknown,
      { data: { vmCredential: VmCredential } },
    ];
    expect(config.data.vmCredential.username).toBe('guest');
    expect(config.data.vmCredential.password).toBe('');
  });

  /**
   * Verifies: a scenario stored without credentials, as a viewer's or one pushed before any were loaded, lists none rather than failing.
   * Interacts with: real ScenarioStore and ScenarioQuery (selectActive), captureUnhandledRxErrors.
   * Data: active scenario s1 with vmCredentials null.
   */
  it('lists no credentials for a scenario stored without them', async () => {
    const errors = captureUnhandledRxErrors();
    const { usernames } = await renderCredentials('scenario', {
      storedVmCredentials: null,
      apiVmCredentials: [],
    });

    expect(usernames()).toEqual([]);
    expect(errors).toEqual([]);
  });
});
