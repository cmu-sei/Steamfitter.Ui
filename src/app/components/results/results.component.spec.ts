// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { of } from 'rxjs';
import { Result } from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ResultsComponent } from './results.component';

describe('ResultsComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: an empty results stream for a task.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(ResultsComponent, {
      declarations: [ResultsComponent],
      imports: [MatTabsModule, MatIconModule, MatButtonModule],
      inputs: {
        results: of<Result[]>([]),
        taskId: 't1',
        taskAction: 'guest_process_run',
      },
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(ResultsComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
