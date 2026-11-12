// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import { Observable, of, Subject, throwError } from 'rxjs';
import { LateStartDialogComponent } from 'src/app/components/scenarios/late-start-dialog/late-start-dialog.component';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import {
  dialogRefStub,
  dismissedDialogRefStub,
} from 'src/app/test-utils/dialog-refs';
import { ErrorService } from '../error/error.service';
import { ScenarioStartService } from './scenario-start.service';

const HOUR = 3_600_000;

// Planned 09:00 to 13:00 EST.
function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's1',
    name: 'Alpha',
    status: 'ready',
    startDate: new Date('2026-11-12T14:00:00Z'),
    endDate: new Date('2026-11-12T18:00:00Z'),
    ...overrides,
  };
}

function setup(
  options: {
    confirmed?: boolean;
    choice?: 'keep' | 'end' | null;
    save?: () => Observable<Scenario>;
  } = {},
) {
  const calls: string[] = [];
  const data = {
    start: vi.fn((id: string) => {
      calls.push(`start ${id}`);
    }),
    saveScenario: vi.fn((s: Scenario) => {
      calls.push(`save ${s.id}`);
      return options.save ? options.save() : of(s);
    }),
  } satisfies Partial<Record<keyof ScenarioDataService, unknown>>;
  const confirm = vi.fn(
    () => dialogRefStub<unknown, boolean>(options.confirmed ?? true).dialogRef,
  );
  const open = vi.fn(() =>
    options.choice === null
      ? dismissedDialogRefStub().dialogRef
      : dialogRefStub(options.choice ?? 'keep').dialogRef,
  );
  const handleError = vi.fn();
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      { provide: ScenarioDataService, useValue: data },
      { provide: CrucibleDialogService, useValue: { confirm } },
      { provide: MatDialog, useValue: { open } },
      { provide: ErrorService, useValue: { handleError } },
    ]),
  });
  return {
    service: TestBed.inject(ScenarioStartService),
    data,
    confirm,
    open,
    handleError,
    calls,
  };
}

describe('ScenarioStartService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Verifies: a scenario started on time gets the simple confirm and starts when confirmed.
   * Interacts with: CrucibleDialogService.confirm stub, ScenarioDataService.start stub.
   * Data: Alpha planned 09:00 EST, started at 08:30 EST; the user confirms.
   */
  it('confirms and starts an on-time scenario', () => {
    vi.setSystemTime(new Date('2026-11-12T13:30:00Z'));
    const { service, confirm, open, data } = setup();

    service.start(scenario(), true);

    expect(confirm).toHaveBeenCalledWith({
      title: 'Start Scenario',
      message: 'Are you sure that you want to start Alpha?',
      confirmText: 'Start',
      cancelText: 'Cancel',
    });
    expect(open).not.toHaveBeenCalled();
    expect(data.start).toHaveBeenCalledWith('s1');
    expect(data.saveScenario).not.toHaveBeenCalled();
  });

  /**
   * Verifies: declining the simple confirm starts nothing.
   * Interacts with: CrucibleDialogService.confirm stub answering false.
   * Data: Alpha started on time; the user declines.
   */
  it('does not start when the confirm is declined', () => {
    vi.setSystemTime(new Date('2026-11-12T13:30:00Z'));
    const { service, data } = setup({ confirmed: false });

    service.start(scenario(), true);

    expect(data.start).not.toHaveBeenCalled();
  });

  /**
   * Verifies: a scenario with no end (start + 100 years) gets the simple confirm even when started late.
   * Interacts with: CrucibleDialogService.confirm stub, MatDialog.open stub.
   * Data: Alpha planned 09:00 EST with an end 100 years later, started a day late.
   */
  it('uses the simple confirm for a scenario with no end', () => {
    vi.setSystemTime(new Date('2026-11-13T14:00:00Z'));
    const { service, confirm, open, data } = setup();

    service.start(
      scenario({ endDate: new Date('2126-11-12T14:00:00Z') }),
      true,
    );

    expect(confirm).toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(data.start).toHaveBeenCalledWith('s1');
  });

  /**
   * Verifies: a late scenario opens the late start dialog with its planned window, and keep end starts it without saving.
   * Interacts with: MatDialog.open stub closing with 'end', ScenarioDataService stubs.
   * Data: Alpha planned 09:00 to 13:00 EST, started at 10:30 EST.
   */
  it('asks about a late start and keeps the end when chosen', () => {
    const now = new Date('2026-11-12T15:30:00Z');
    vi.setSystemTime(now);
    const { service, confirm, open, data } = setup({ choice: 'end' });

    service.start(scenario(), true);

    expect(confirm).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(
      LateStartDialogComponent,
      expect.objectContaining({
        data: {
          scenarioName: 'Alpha',
          now,
          canEdit: true,
          late: {
            plannedStart: new Date('2026-11-12T14:00:00Z'),
            plannedEnd: new Date('2026-11-12T18:00:00Z'),
            plannedLengthMs: 4 * HOUR,
            remainingMs: 2.5 * HOUR,
            endPassed: false,
          },
        },
      }),
    );
    expect(data.saveScenario).not.toHaveBeenCalled();
    expect(data.start).toHaveBeenCalledWith('s1');
  });

  /**
   * Verifies: keep length saves the end as now + the planned length, then starts, in that order.
   * Interacts with: MatDialog.open stub closing with 'keep', ScenarioDataService.saveScenario and start stubs.
   * Data: Alpha planned 09:00 to 13:00 EST, started at 10:30 EST; the new end is 14:30 EST.
   */
  it('saves the moved end before starting when keeping the length', () => {
    vi.setSystemTime(new Date('2026-11-12T15:30:00Z'));
    const { service, data, calls } = setup({ choice: 'keep' });

    service.start(scenario(), true);

    expect(data.saveScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 's1',
        name: 'Alpha',
        startDate: new Date('2026-11-12T14:00:00Z'),
        endDate: new Date('2026-11-12T19:30:00Z'),
      }),
    );
    expect(calls).toEqual(['save s1', 'start s1']);
  });

  /**
   * Verifies: once the end has passed the dialog says so, and keep length moves the end past now.
   * Interacts with: MatDialog.open stub closing with 'keep', ScenarioDataService stubs.
   * Data: Alpha planned 09:00 to 13:00 EST, started at 14:00 EST; the new end is 18:00 EST.
   */
  it('keeps the length of a scenario whose end has passed', () => {
    vi.setSystemTime(new Date('2026-11-12T19:00:00Z'));
    const { service, open, data, calls } = setup({ choice: 'keep' });

    service.start(scenario(), true);

    expect(open).toHaveBeenCalledWith(
      LateStartDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          late: expect.objectContaining({ endPassed: true }),
        }),
      }),
    );
    expect(data.saveScenario).toHaveBeenCalledWith(
      expect.objectContaining({ endDate: new Date('2026-11-12T23:00:00Z') }),
    );
    expect(calls).toEqual(['save s1', 'start s1']);
  });

  /**
   * Verifies: the start waits for the save to finish.
   * Interacts with: ScenarioDataService.saveScenario stub returning a pending Subject.
   * Data: Alpha started late; the save answers only after the check.
   */
  it('waits for the save before starting', () => {
    vi.setSystemTime(new Date('2026-11-12T15:30:00Z'));
    const saved = new Subject<Scenario>();
    const { service, data } = setup({
      choice: 'keep',
      save: () => saved,
    });

    service.start(scenario(), true);
    expect(data.start).not.toHaveBeenCalled();

    saved.next(scenario());
    expect(data.start).toHaveBeenCalledWith('s1');
  });

  /**
   * Verifies: a failed save starts nothing and shows the error through ErrorService.
   * Interacts with: ScenarioDataService.saveScenario stub failing, ErrorService.handleError stub.
   * Data: Alpha started late; the save fails with 'Forbidden'.
   */
  it('does not start when saving the end fails', () => {
    vi.setSystemTime(new Date('2026-11-12T15:30:00Z'));
    const failure = new Error('Forbidden');
    const { service, data, handleError } = setup({
      choice: 'keep',
      save: () => throwError(() => failure),
    });

    service.start(scenario(), true);

    expect(data.start).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalledWith(failure);
  });

  /**
   * Verifies: cancelling the late start dialog saves and starts nothing.
   * Interacts with: MatDialog.open stub dismissed.
   * Data: Alpha started late; the user cancels.
   */
  it('does nothing when the late start dialog is cancelled', () => {
    vi.setSystemTime(new Date('2026-11-12T15:30:00Z'));
    const { service, data } = setup({ choice: null });

    service.start(scenario(), true);

    expect(data.saveScenario).not.toHaveBeenCalled();
    expect(data.start).not.toHaveBeenCalled();
  });

  /**
   * Verifies: a user who cannot edit the scenario is told so in the dialog data, and a 'keep' answer saves and starts nothing.
   * Interacts with: MatDialog.open stub closing with 'keep', ScenarioDataService stubs.
   * Data: Alpha started late by a user who can execute but not edit it.
   */
  it('does not save the end for a user who cannot edit', () => {
    vi.setSystemTime(new Date('2026-11-12T15:30:00Z'));
    const { service, open, data } = setup({ choice: 'keep' });

    service.start(scenario(), false);

    expect(open).toHaveBeenCalledWith(
      LateStartDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({ canEdit: false }),
      }),
    );
    expect(data.saveScenario).not.toHaveBeenCalled();
    expect(data.start).not.toHaveBeenCalled();
  });
});
