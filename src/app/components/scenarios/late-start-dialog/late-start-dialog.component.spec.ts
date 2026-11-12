// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import {
  LateStart,
  formatTime,
} from 'src/app/services/scenario-start/late-start';
import {
  LateStartChoice,
  LateStartDialogComponent,
  LateStartDialogData,
} from './late-start-dialog.component';

const HOUR = 3_600_000;
const plannedStart = new Date('2026-11-12T14:00:00Z');
const plannedEnd = new Date('2026-11-12T18:00:00Z');

async function renderDialog(
  now: Date,
  late: Partial<LateStart>,
  canEdit = true,
) {
  const data: LateStartDialogData = {
    scenarioName: 'Alpha',
    now,
    canEdit,
    late: {
      plannedStart,
      plannedEnd,
      plannedLengthMs: 4 * HOUR,
      remainingMs: plannedEnd.getTime() - now.getTime(),
      endPassed: false,
      ...late,
    },
  };
  const { dialogRef, close } = dialogRefStub<unknown, LateStartChoice>();
  await renderComponent(LateStartDialogComponent, {
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialogRef },
    ],
  });
  return { close, user: userEvent.setup() };
}

const buttonNames = () =>
  screen.getAllByRole('button').map((b) => b.textContent?.trim());

describe('LateStartDialogComponent', () => {
  /**
   * Verifies: a late start before the planned end explains the time left and offers keep length, keep end, and Cancel.
   * Interacts with: the dialog template, formatTime (viewer's zone).
   * Data: Alpha planned 09:00 to 13:00 EST (4 h), started at 10:30 EST.
   */
  it('offers to keep the length or the end of a late scenario', async () => {
    const now = new Date('2026-11-12T15:30:00Z');
    await renderDialog(now, {});
    const start = formatTime(plannedStart, now);
    const end = formatTime(plannedEnd, now);

    expect(
      screen.getByRole('heading', { name: 'Start Scenario' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Alpha was planned to start at ${start} and ends at ${end}. ` +
          'Starting now leaves 2 h 30 m of its planned 4 h.',
      ),
    ).toBeInTheDocument();
    expect(buttonNames()).toEqual([
      'Cancel',
      `Start, end at ${end}`,
      'Start and keep 4 h',
    ]);
  });

  /**
   * Verifies: once the planned end has passed, the dialog says so and offers only keep length and Cancel.
   * Interacts with: the dialog template, formatTime (viewer's zone).
   * Data: Alpha planned 09:00 to 13:00 EST, started at 14:00 EST.
   */
  it('offers only to keep the length once the end has passed', async () => {
    const now = new Date('2026-11-12T19:00:00Z');
    await renderDialog(now, { endPassed: true });
    const end = formatTime(plannedEnd, now);

    expect(
      screen.getByText(
        `Alpha's end (${end}) has passed. ` +
          'Starting now would end it within a minute.',
      ),
    ).toBeInTheDocument();
    expect(buttonNames()).toEqual(['Cancel', 'Start and keep 4 h']);
  });

  /**
   * Verifies: a user who cannot edit the scenario is not offered to keep the length of a late start.
   * Interacts with: the dialog template, formatTime (viewer's zone).
   * Data: Alpha planned 09:00 to 13:00 EST, started at 10:30 EST; canEdit false.
   */
  it('offers only to keep the end to a user who cannot edit', async () => {
    const now = new Date('2026-11-12T15:30:00Z');
    await renderDialog(now, {}, false);
    const end = formatTime(plannedEnd, now);

    expect(
      screen.getByText(
        /^Alpha was planned to start at .* of its planned 4 h\.$/,
      ),
    ).toBeInTheDocument();
    expect(buttonNames()).toEqual(['Cancel', `Start, end at ${end}`]);
  });

  /**
   * Verifies: once the end has passed, a user who cannot edit the scenario gets only Cancel and is told who can move the end.
   * Interacts with: the dialog template, formatTime (viewer's zone).
   * Data: Alpha planned 09:00 to 13:00 EST, started at 14:00 EST; canEdit false.
   */
  it('offers only Cancel once the end has passed to a user who cannot edit', async () => {
    const now = new Date('2026-11-12T19:00:00Z');
    await renderDialog(now, { endPassed: true }, false);
    const end = formatTime(plannedEnd, now);

    expect(
      screen.getByText(
        `Alpha's end (${end}) has passed. ` +
          'Starting now would end it within a minute. ' +
          'Ask someone who can edit this scenario to move its end.',
      ),
    ).toBeInTheDocument();
    expect(buttonNames()).toEqual(['Cancel']);
  });

  /**
   * Verifies: each button closes the dialog with its choice; Cancel closes with nothing.
   * Interacts with: MatDialogRef.close stub.
   * Data: Alpha started at 10:30 EST; one button per row.
   */
  it.each([
    { button: /^Start and keep/, result: 'keep' },
    { button: /^Start, end at/, result: 'end' },
    { button: /^Cancel$/, result: undefined },
  ])('closes with $result for $button', async ({ button, result }) => {
    const { close, user } = await renderDialog(
      new Date('2026-11-12T15:30:00Z'),
      {},
    );

    await user.click(screen.getByRole('button', { name: button }));

    expect(close).toHaveBeenCalledWith(result);
  });
});
