// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import {
  CrucibleDialogActionsDirective,
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import { finalize } from 'rxjs';
import { archiveErrorMessage } from '../archive-error-message';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ImportScenarioTemplatesResult } from 'src/app/generated/steamfitter.api';

@Component({
  selector: 'app-scenario-template-import-dialog',
  templateUrl: './scenario-template-import-dialog.component.html',
  styleUrls: ['./scenario-template-import-dialog.component.scss'],
  imports: [
    CrucibleDialogComponent,
    CrucibleDialogContentDirective,
    CrucibleDialogActionsDirective,
    ReactiveFormsModule,
    MatButton,
  ],
})
export class ScenarioTemplateImportDialogComponent {
  private scenarioTemplateDataService = inject(ScenarioTemplateDataService);
  private dialogRef = inject(
    MatDialogRef<ScenarioTemplateImportDialogComponent>,
  );

  form = inject(FormBuilder).group({
    file: [null as File | null, Validators.required],
  });
  loading = false;
  errorMessage = '';
  result: ImportScenarioTemplatesResult | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.patchValue({ file: input.files?.[0] ?? null });
    this.form.markAsDirty();
  }

  import(): void {
    this.loading = true;
    this.errorMessage = '';
    this.scenarioTemplateDataService
      .importScenarioTemplates(this.form.value.file)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => (this.result = result),
        error: async (err) =>
          (this.errorMessage = await archiveErrorMessage(
            err,
            'The Scenario Templates could not be imported.',
          )),
      });
  }

  /**
   * Closes the dialog before an import is sent, or once its result is shown. While the import runs the
   * dialog cannot be closed: the browser cannot know whether the API has saved the templates until it
   * answers, so neither aborting nor closing early could tell the user what happened. crucible-dialog already
   * keeps a backdrop click from closing it and ignores Escape while [loading]; the template disables Cancel.
   */
  close(): void {
    if (this.loading) {
      return;
    }
    this.dialogRef.close(this.result);
  }
}
