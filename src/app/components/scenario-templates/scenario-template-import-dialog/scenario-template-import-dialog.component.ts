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
        error: (err) =>
          (this.errorMessage =
            err?.error?.detail ||
            err?.error?.title ||
            err?.message ||
            'Import failed'),
      });
  }

  close(): void {
    this.dialogRef.close(this.result);
  }
}
