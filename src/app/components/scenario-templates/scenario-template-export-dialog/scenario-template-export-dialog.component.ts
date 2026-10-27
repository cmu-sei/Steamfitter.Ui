// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import { finalize } from 'rxjs';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';

export interface ScenarioTemplateExportDialogData {
  /** The Scenario Templates to export. */
  ids: string[];
  /** Whether the ids are an explicit selection rather than every template in the list. */
  selected: boolean;
  /** Export every Scenario Template by sending no ids. The count shown is still ids.length. */
  all: boolean;
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
export class ScenarioTemplateExportDialogComponent {
  private scenarioTemplateDataService = inject(ScenarioTemplateDataService);
  private dialogRef = inject(
    MatDialogRef<ScenarioTemplateExportDialogComponent>,
  );
  readonly data = inject<ScenarioTemplateExportDialogData>(MAT_DIALOG_DATA);

  loading = false;
  errorMessage = '';

  export(): void {
    this.loading = true;
    this.errorMessage = '';
    this.scenarioTemplateDataService
      .exportScenarioTemplates(this.data.all ? [] : this.data.ids)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => this.showError(err),
      });
  }

  /** A blob request returns its error body as a Blob too, so read the ProblemDetails out of it. */
  private async showError(err: any) {
    let title: string | undefined;
    try {
      title =
        err?.error instanceof Blob
          ? JSON.parse(await err.error.text())?.title
          : err?.error?.title;
    } catch {
      title = undefined;
    }
    this.errorMessage =
      title ?? 'The Scenario Templates could not be exported.';
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
