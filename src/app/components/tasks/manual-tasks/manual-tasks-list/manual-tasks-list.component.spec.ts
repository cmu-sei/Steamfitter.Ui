// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ManualTasksListComponent } from './manual-tasks-list.component';

describe('ManualTasksListComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: no tasks and no scenario yet.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(ManualTasksListComponent, {
      declarations: [ManualTasksListComponent],
      imports: [MatIconModule, MatButtonModule, MatTooltipModule],
      inputs: { tasks: [], scenario: null },
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(ManualTasksListComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });

  /**
   * Verifies: Execute asks with the standard wording: "Execute Task", the task named in the question, and Execute/Cancel buttons.
   * Interacts with: executeTask, CrucibleDialogService.confirm stub (declines).
   * Data: a manual task named Ping.
   */
  it('confirms Execute with the standard wording', async () => {
    const confirm = vi.fn(
      () => dialogRefStub<unknown, boolean>(false).dialogRef,
    );
    const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };
    const { fixture } = await renderComponent(ManualTasksListComponent, {
      declarations: [ManualTasksListComponent],
      imports: [MatIconModule, MatButtonModule, MatTooltipModule],
      inputs: { tasks: [], scenario: null },
      providers: [{ provide: CrucibleDialogService, useValue: dialogService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture.componentInstance.executeTask({ id: 't1', name: 'Ping' });

    expect(confirm).toHaveBeenCalledWith({
      title: 'Execute Task',
      message: 'Are you sure that you want to execute Ping?',
      confirmText: 'Execute',
      cancelText: 'Cancel',
    });
  });
});
