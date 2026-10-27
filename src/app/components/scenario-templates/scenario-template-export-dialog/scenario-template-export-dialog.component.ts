// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import { Subscription, finalize } from 'rxjs';
import { archiveErrorMessage } from '../archive-error-message';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';

export interface ScenarioTemplateExportDialogData {
  /** The Scenario Templates to export. */
  ids: string[];
  /** Whether the ids are an explicit selection rather than every template in the list. */
  selected: boolean;
  /** Export every Scenario Template by sending no ids. The count shown is still ids.length. */
  all: boolean;
  /** Templates in the selection (or the filtered list) left out because the caller may not view them. */
  notViewable?: number;
}

/**
 * Exports Scenario Templates to a json file: an object for one template, a list for several.
 */
@Component({
  selector: 'app-scenario-template-export-dialog',
  templateUrl: './scenario-template-export-dialog.component.html',
  styleUrls: ['./scenario-template-export-dialog.component.scss'],
  imports: [CrucibleDialogComponent, CrucibleDialogContentDirective],
})
export class ScenarioTemplateExportDialogComponent implements OnDestroy {
  private scenarioTemplateDataService = inject(ScenarioTemplateDataService);
  private dialogRef = inject(
    MatDialogRef<ScenarioTemplateExportDialogComponent>,
  );
  readonly data = inject<ScenarioTemplateExportDialogData>(MAT_DIALOG_DATA);

  loading = false;
  errorMessage = '';
  private request: Subscription | undefined;

  export(): void {
    this.loading = true;
    this.errorMessage = '';
    this.request = this.scenarioTemplateDataService
      .exportScenarioTemplates(this.data.all ? [] : this.data.ids)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => this.showError(err),
      });
  }

  private async showError(err: unknown) {
    this.errorMessage = await archiveErrorMessage(
      err,
      'The Scenario Templates could not be exported.',
    );
  }

  /** Closing the dialog abandons an export still in flight, which aborts the request. */
  cancel(): void {
    this.request?.unsubscribe();
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }
}
