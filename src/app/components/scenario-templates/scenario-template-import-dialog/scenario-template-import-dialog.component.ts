// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import {
  CrucibleDialogActionsDirective,
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import { Subscription, finalize } from 'rxjs';
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
export class ScenarioTemplateImportDialogComponent implements OnDestroy {
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
  private request: Subscription | undefined;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.patchValue({ file: input.files?.[0] ?? null });
    this.form.markAsDirty();
  }

  import(): void {
    this.loading = true;
    this.errorMessage = '';
    this.request = this.scenarioTemplateDataService
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
   * Closing the dialog abandons an import still in flight, which aborts the request. The API saves an
   * import in one SaveChanges, so an aborted import creates nothing.
   */
  close(): void {
    this.request?.unsubscribe();
    this.dialogRef.close(this.result);
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }
}
