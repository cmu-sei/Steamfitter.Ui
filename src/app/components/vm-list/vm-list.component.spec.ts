// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { renderComponent } from 'src/app/test-utils/render-component';
import { VmListComponent } from './vm-list.component';

describe('VmListComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: no selected VMs and an empty VM list.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(VmListComponent, {
      declarations: [VmListComponent],
      imports: [
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatTooltipModule,
      ],
      inputs: { selectedVms: [] },
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(VmListComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
