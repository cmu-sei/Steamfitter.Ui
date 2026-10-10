// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ScenarioTemplateEditDialogComponent } from './scenario-template-edit-dialog.component';

describe('ScenarioTemplateEditDialogComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: dialog data with a new, empty scenario template.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(
      ScenarioTemplateEditDialogComponent,
      {
        declarations: [ScenarioTemplateEditDialogComponent],
        imports: [
          MatDialogModule,
          MatFormFieldModule,
          MatInputModule,
          MatButtonModule,
        ],
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: { scenarioTemplate: { name: '', description: '' } },
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    );

    expect(fixture.componentInstance).toBeInstanceOf(
      ScenarioTemplateEditDialogComponent,
    );
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
