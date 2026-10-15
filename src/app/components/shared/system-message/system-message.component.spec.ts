// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { bottomSheetRefStub } from 'src/app/test-utils/dialog-refs';
import { renderComponent } from 'src/app/test-utils/render-component';
import { SystemMessageComponent } from './system-message.component';

describe('SystemMessageComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), bottomSheetRefStub.
   * Data: sheet data with a title and a message.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(SystemMessageComponent, {
      declarations: [SystemMessageComponent],
      imports: [MatIconModule, MatButtonModule],
      providers: [
        { provide: MatBottomSheetRef, useValue: bottomSheetRefStub().sheetRef },
        {
          provide: MAT_BOTTOM_SHEET_DATA,
          useValue: { title: 'Error', message: 'Something failed' },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(SystemMessageComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
