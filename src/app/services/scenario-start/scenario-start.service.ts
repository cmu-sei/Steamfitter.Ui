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
 * end is saved as now + the planned length before starting) or the planned
 * end. Every Start action goes through here.
 */
@Injectable({
  providedIn: 'root',
})
export class ScenarioStartService {
  private scenarioDataService = inject(ScenarioDataService);
  private confirmService = inject(CrucibleDialogService);
  private dialog = inject(MatDialog);
  private errorService = inject(ErrorService);

  start(scenario: Scenario): void {
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
            this.scenarioDataService.start(scenario.id);
          }
        });
      return;
    }
    const data: LateStartDialogData = {
      scenarioName: scenario.name,
      late,
      now,
    };
    const dialogRef: MatDialogRef<LateStartDialogComponent, LateStartChoice> =
      this.dialog.open(LateStartDialogComponent, {
        width: '520px',
        maxWidth: '90vw',
        data,
      });
    dialogRef.afterClosed().subscribe((choice) => {
      if (choice === 'end') {
        this.scenarioDataService.start(scenario.id);
      } else if (choice === 'keep') {
        const endDate = new Date(Date.now() + late.plannedLengthMs);
        this.scenarioDataService
          .saveScenario({ ...scenario, endDate })
          .subscribe({
            next: () => this.scenarioDataService.start(scenario.id),
            error: (err) => this.errorService.handleError(err),
          });
      }
    });
  }
}
