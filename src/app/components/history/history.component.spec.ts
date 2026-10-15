// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { renderComponent } from 'src/app/test-utils/render-component';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: no inputs beyond what the template needs to render.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(HistoryComponent, {
      declarations: [HistoryComponent],
      imports: [
        MatTableModule,
        MatSortModule,
        MatIconModule,
        MatCardModule,
        MatProgressSpinnerModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(HistoryComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
