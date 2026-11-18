// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CrucibleDialogActionsDirective,
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import {
  LateStart,
  formatDuration,
  formatTime,
} from 'src/app/services/scenario-start/late-start';

export interface LateStartDialogData {
  scenarioName: string;
  late: LateStart;
  now: Date;
  /** False hides "Start and keep", which has to save the scenario's end. */
  canEdit: boolean;
}

/** keep: move the end to now + the planned length. end: keep the planned end. */
export type LateStartChoice = 'keep' | 'end';

/**
 * Asks how to start a scenario that is past its planned start: keep its
 * planned length, or keep its planned end. Keeping the length is offered only
 * to users who can edit the scenario. Closes with a LateStartChoice, or
 * undefined when cancelled.
 */
@Component({
  selector: 'app-late-start-dialog',
  templateUrl: './late-start-dialog.component.html',
  imports: [
    CrucibleDialogComponent,
    CrucibleDialogContentDirective,
    CrucibleDialogActionsDirective,
    MatButton,
  ],
})
export class LateStartDialogComponent {
  private data = inject<LateStartDialogData>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<LateStartDialogComponent, LateStartChoice>>(
      MatDialogRef,
    );

  readonly endPassed = this.data.late.endPassed;
  readonly canEdit = this.data.canEdit;
  readonly plannedLength = formatDuration(this.data.late.plannedLengthMs);
  readonly plannedEnd = formatTime(this.data.late.plannedEnd, this.data.now);
  readonly message = this.endPassed
    ? `${this.data.scenarioName}'s end (${this.plannedEnd}) has passed. ` +
      'Starting now would end it within a minute.' +
      (this.canEdit
        ? ''
        : ' Ask someone who can edit this scenario to move its end.')
    : `${this.data.scenarioName} was planned to start at ` +
      `${formatTime(this.data.late.plannedStart, this.data.now)} and ends at ` +
      `${this.plannedEnd}. Starting now leaves ` +
      `${formatDuration(this.data.late.remainingMs)} of its planned ` +
      `${this.plannedLength}.`;

  close(choice?: LateStartChoice): void {
    this.dialogRef.close(choice);
  }
}
