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
import { TaskService } from 'src/app/generated/steamfitter.api';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { renderComponent } from 'src/app/test-utils/render-component';
import { TaskEditComponent } from './task-edit.component';

describe('TaskEditComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), TaskService.getAvailableCommands stub.
   * Data: dialog data with a new manual task and no VM credentials; an empty command catalog.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(TaskEditComponent, {
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
              of(JSON.stringify({ availableCommands: [] })),
            ),
          } satisfies ApiStub<TaskService>,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            task: { name: '', action: 'guest_process_run', vmList: [] },
            vmCredentials: [],
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(TaskEditComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
