// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { screen, within } from '@testing-library/angular';
import { SystemMessageComponent } from '../../components/shared/system-message/system-message.component';
import { SystemMessageService } from './system-message.service';

describe('SystemMessageService', () => {
  /**
   * Verifies: displayMessage opens one bottom sheet that renders SystemMessageComponent with the title as its heading and the message as its body.
   * Interacts with: the real MatBottomSheet and its overlay container; SystemMessageComponent template (declared as in AppModule, noop animations).
   * Data: title 'Task failed', message 'The task could not be executed on the VM.'.
   */
  it('opens the system message bottom sheet with the title and message', async () => {
    TestBed.configureTestingModule({
      declarations: [SystemMessageComponent],
      imports: [
        NoopAnimationsModule,
        MatBottomSheetModule,
        MatButtonModule,
        MatIconModule,
        MatIconTestingModule,
      ],
      providers: [SystemMessageService],
    });
    const service = TestBed.inject(SystemMessageService);

    service.displayMessage(
      'Task failed',
      'The task could not be executed on the VM.',
    );
    await TestBed.inject(ApplicationRef).whenStable();

    const sheet = document.querySelector<HTMLElement>(
      'mat-bottom-sheet-container',
    );
    expect(sheet).not.toBeNull();
    const content = within(sheet as HTMLElement);
    expect(
      content.getByRole('heading', { level: 2, name: 'Task failed' }),
    ).toBeInTheDocument();
    expect(
      content.getByText('The task could not be executed on the VM.'),
    ).toHaveClass('messagebody');
    expect(
      screen.getAllByRole('heading', { name: 'Task failed' }),
    ).toHaveLength(1);
  });
});
