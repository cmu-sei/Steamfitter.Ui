// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  NgxMatDatepickerActions,
  NgxMatDatepickerApply,
  NgxMatDatepickerCancel,
  NgxMatDatepickerInput,
  NgxMatDatepickerToggle,
  NgxMatDatetimepicker,
} from '@ngxmc/datetime-picker';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ScenarioEditDialogComponent } from './scenario-edit-dialog.component';

describe('ScenarioEditDialogComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: dialog data with a new, empty scenario and no views.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(ScenarioEditDialogComponent, {
      declarations: [ScenarioEditDialogComponent],
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        MatButtonModule,
        NgxMatDatetimepicker,
        NgxMatDatepickerInput,
        NgxMatDatepickerToggle,
        NgxMatDatepickerActions,
        NgxMatDatepickerApply,
        NgxMatDatepickerCancel,
      ],
      providers: [
        provideNativeDateAdapter(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { scenario: { name: '', description: '' }, views: [] },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(
      ScenarioEditDialogComponent,
    );
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
