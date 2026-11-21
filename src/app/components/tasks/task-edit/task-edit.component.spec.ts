// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Task, TaskService } from 'src/app/generated/steamfitter.api';
import { REDACTED_SECRET } from 'src/app/models/redacted-secret';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { screen } from '@testing-library/angular';
import { renderComponent } from 'src/app/test-utils/render-component';
import { TaskEditComponent } from './task-edit.component';

function renderEdit(
  task: Partial<Task> = {},
  availableCommands: unknown[] = [],
) {
  return renderComponent(TaskEditComponent, {
    declarations: [TaskEditComponent],
    imports: [
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatTooltipModule,
      MatButtonModule,
      MatCheckboxModule,
    ],
    providers: [
      {
        provide: TaskService,
        useValue: {
          getAvailableCommands: vi.fn(() =>
            of(JSON.stringify({ availableCommands })),
          ),
        } satisfies ApiStub<TaskService>,
      },
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          task: {
            name: '',
            action: 'guest_process_run',
            vmList: [],
            ...task,
          },
          vmCredentials: [],
        },
      },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  });
}

describe('TaskEditComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), TaskService.getAvailableCommands stub.
   * Data: dialog data with a new manual task and no VM credentials; an empty command catalog.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderEdit();

    expect(fixture.componentInstance).toBeInstanceOf(TaskEditComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });

  /**
   * Verifies: the dialog is titled "Add Task" for a new task and "Edit Task" for an existing one.
   * Interacts with: the crucible-dialog title binding.
   * Data: a task without an id, then one with id t1.
   */
  it.each([
    { task: {}, title: 'Add Task' },
    { task: { id: 't1' }, title: 'Edit Task' },
  ])('is titled $title', async ({ task, title }) => {
    await renderEdit(task);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  /**
   * Verifies: a Task whose secrets came back redacted (as every SignalR update sends them) is saved with the placeholder unchanged, which the API reads as "keep the stored secret".
   * Interacts with: the command catalog stub, selectTheTaskCommand, handleEditComplete and the editComplete output.
   * Data: an existing guest command task with Password redacted, and an SSH task with PrivateKey redacted; neither is changed before saving.
   */
  it.each([
    {
      action: 'guest_process_run',
      api: 'stackstorm',
      secret: 'Password',
      parameters: {
        Username: 'guest',
        Password: REDACTED_SECRET,
        Command: 'whoami',
      },
    },
    {
      action: 'core_remote',
      api: 'stackstorm',
      secret: 'PrivateKey',
      parameters: {
        Hosts: 'h',
        Username: 'guest',
        PrivateKey: REDACTED_SECRET,
        Cmd: 'whoami',
      },
    },
  ])(
    'saves an unchanged redacted $secret as the placeholder',
    async ({ action, api, secret, parameters }) => {
      const command = {
        name: action,
        api,
        action,
        requiresVm: false,
        parameters: Object.keys(parameters).map((key) => ({
          key,
          default: '',
        })),
      };
      const { fixture } = await renderEdit(
        {
          id: 't1',
          name: 'Redacted',
          action: action as Task['action'],
          apiUrl: api,
          actionParameters: { ...parameters },
        },
        [command],
      );
      const saved = vi.fn();
      fixture.componentInstance.editComplete.subscribe(saved);

      fixture.componentInstance.onCommandChange();
      fixture.componentInstance.handleEditComplete(true);

      expect(saved).toHaveBeenCalledWith(
        expect.objectContaining({ saveChanges: true }),
      );
      const [{ task }] = saved.mock.calls[0] as [{ task: Task }];
      expect(task.actionParameters[secret]).toBe(REDACTED_SECRET);
      expect(task.actionParameters.Username).toBe('guest');
    },
  );
  /**
   * Verifies: a redacted secret is shown empty and kept while its field is left empty, whichever field changed: a new password replaces it as entered, a new username drops it (and says so), and a picked credential replaces it.
   * Interacts with: the command catalog stub, onCommandChange, the Action section's parameters and the password stream.
   * Data: a guest command task with Username guest and the redacted Password.
   */
  describe('a redacted password', () => {
    const command = {
      name: 'guest_process_run',
      api: 'stackstorm',
      action: 'guest_process_run',
      requiresVm: false,
      parameters: ['Username', 'Password', 'CommandText'].map((key) => ({
        key,
        default: '',
      })),
    };
    const renderRedacted = () =>
      renderEdit(
        {
          id: 't1',
          name: 'Redacted',
          action: 'guest_process_run',
          apiUrl: 'stackstorm',
          actionParameters: {
            Username: 'guest',
            Password: REDACTED_SECRET,
            CommandText: 'whoami',
          },
        },
        [command],
      );
    const parameter = (component: TaskEditComponent, key: string) =>
      component.selectedCommand.parameters.find((p) => p.key === key);

    it('is shown empty, and sent back as the placeholder while left empty', async () => {
      const { fixture } = await renderRedacted();
      const component = fixture.componentInstance;

      expect(parameter(component, 'Password').value).toBe('');
      expect(component.password.value).toBe('');
      expect(component.secretKept.Password).toBe(true);

      component.onCommandChange();

      expect(component.data.task.actionParameters.Password).toBe(
        REDACTED_SECRET,
      );
    });

    it('is replaced, as entered, by a new password', async () => {
      const { fixture } = await renderRedacted();
      const component = fixture.componentInstance;

      // eight asterisks inside a real password are kept as they are
      parameter(component, 'Password').value = `abc${REDACTED_SECRET}xyz`;
      component.onCommandChange();

      expect(component.data.task.actionParameters.Password).toBe(
        `abc${REDACTED_SECRET}xyz`,
      );
    });

    it('is kept again when an entered password is erased', async () => {
      const { fixture } = await renderRedacted();
      const component = fixture.componentInstance;

      parameter(component, 'Password').value = 'h';
      component.onCommandChange();
      parameter(component, 'Password').value = '';
      component.onCommandChange();

      expect(component.data.task.actionParameters.Password).toBe(
        REDACTED_SECRET,
      );
      expect(component.secretKept.Password).toBe(true);
    });

    it('is saved empty once cleared', async () => {
      const { fixture } = await renderRedacted();
      const component = fixture.componentInstance;

      component.clearKeptPassword();

      expect(component.data.task.actionParameters.Password).toBe('');
      expect(component.secretKept.Password).toBe(false);
      expect(component.secretCleared).toBe(false);
    });

    it('is cleared when the username changes', async () => {
      const { fixture } = await renderRedacted();
      const component = fixture.componentInstance;

      parameter(component, 'Username').value = 'other';
      component.onCommandChange();

      expect(component.data.task.actionParameters.Password).toBe('');
      expect(component.password.value).toBe('');
      expect(component.secretCleared).toBe(true);
    });

    it('is kept when something else changes', async () => {
      const { fixture } = await renderRedacted();
      const component = fixture.componentInstance;

      parameter(component, 'CommandText').value = 'hostname';
      component.onCommandChange();

      expect(component.data.task.actionParameters.Password).toBe(
        REDACTED_SECRET,
      );
      expect(component.secretCleared).toBe(false);
    });

    it('gives way to a picked credential, whose password is kept as it is', async () => {
      const { fixture } = await renderRedacted();
      const component = fixture.componentInstance;

      component.handleVmCredentialChange({
        id: 'c1',
        username: 'other',
        password: `${REDACTED_SECRET}x`,
      });

      expect(component.data.task.actionParameters.Username).toBe('other');
      expect(component.data.task.actionParameters.Password).toBe(
        `${REDACTED_SECRET}x`,
      );
      expect(component.secretCleared).toBe(false);
    });
  });
});
