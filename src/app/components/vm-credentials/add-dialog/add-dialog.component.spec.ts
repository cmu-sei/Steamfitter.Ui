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
import { AddDialogComponent } from './add-dialog.component';

describe('AddDialogComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: dialog data with an empty VM credential.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(AddDialogComponent, {
      declarations: [AddDialogComponent],
      imports: [
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            vmCredential: { username: '', password: '', description: '' },
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(AddDialogComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
