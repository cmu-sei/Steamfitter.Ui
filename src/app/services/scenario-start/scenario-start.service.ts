// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  LateStartChoice,
  LateStartDialogComponent,
  LateStartDialogData,
} from 'src/app/components/scenarios/late-start-dialog/late-start-dialog.component';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { ErrorService } from '../error/error.service';
import { lateStart } from './late-start';

/**
 * Starts a scenario after asking the user. The API keeps a scenario's planned
 * end when it starts, so a scenario started late loses the delay from its
 * length. When it is late this asks whether to keep the planned length (the
 * start and end are saved as now and now + the planned length before
 * starting) or the planned end. Keeping the length saves the scenario, so it
 * is offered only when `canEdit` is true. A failed save or start is shown
 * through ErrorService. Every Start action goes through here.
 */
@Injectable({
  providedIn: 'root',
})
export class ScenarioStartService {
  private scenarioDataService = inject(ScenarioDataService);
  private confirmService = inject(CrucibleDialogService);
  private dialog = inject(MatDialog);
  private errorService = inject(ErrorService);

  start(scenario: Scenario, canEdit: boolean): void {
    const now = new Date();
    const late = lateStart(scenario, now);
    if (!late) {
      this.confirmService
        .confirm({
          title: 'Start Scenario',
          message: `Are you sure that you want to start ${scenario.name}?`,
          confirmText: 'Start',
          cancelText: 'Cancel',
        })
        .afterClosed()
        .subscribe((confirmed) => {
          if (confirmed) {
            this.begin(scenario.id);
          }
        });
      return;
    }
    const data: LateStartDialogData = {
      scenarioName: scenario.name,
      late,
      now,
      canEdit,
    };
    const dialogRef: MatDialogRef<LateStartDialogComponent, LateStartChoice> =
      this.dialog.open(LateStartDialogComponent, {
        width: '520px',
        maxWidth: '90vw',
        data,
      });
    dialogRef.afterClosed().subscribe((choice) => {
      if (choice === 'end') {
        this.begin(scenario.id);
      } else if (choice === 'keep' && canEdit) {
        // The start date moves too, so the saved window stays the planned
        // length even if the start below fails and Start is pressed again.
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + late.plannedLengthMs);
        this.scenarioDataService
          .saveScenario({ ...scenario, startDate, endDate })
          .subscribe({
            next: () => this.begin(scenario.id),
            error: (err) => this.errorService.handleError(err),
          });
      }
    });
  }

  private begin(id: string): void {
    this.scenarioDataService.startScenario(id).subscribe({
      error: (err) => this.errorService.handleError(err),
    });
  }
}
