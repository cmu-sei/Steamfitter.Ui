// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Observable, Subject, of, throwError } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { ImportScenarioTemplatesResult } from 'src/app/generated/steamfitter.api';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ScenarioTemplateImportDialogComponent } from './scenario-template-import-dialog.component';

async function renderDialog(
  importResult: ReturnType<
    ScenarioTemplateDataService['importScenarioTemplates']
  >,
) {
  const importScenarioTemplates = vi.fn(() => importResult);
  const { dialogRef, close } = dialogRefStub<
    ScenarioTemplateImportDialogComponent,
    ImportScenarioTemplatesResult
  >();
  await renderComponent(ScenarioTemplateImportDialogComponent, {
    providers: [
      {
        provide: ScenarioTemplateDataService,
        useValue: { importScenarioTemplates },
      },
      { provide: MatDialogRef, useValue: dialogRef },
    ],
  });
  const user = userEvent.setup();
  const chooseFile = (file: File) =>
    user.upload(
      screen.getByLabelText(
        'Scenario Template export file',
      ) as HTMLInputElement,
      file,
    );
  return { user, importScenarioTemplates, close, chooseFile };
}

const exportFile = () =>
  new File(['[]'], 'Alpha.json', { type: 'application/json' });

describe('ScenarioTemplateImportDialogComponent', () => {
  /**
   * Verifies: the chosen file is imported and the result lists what was created, renamed and refused.
   * Interacts with: ScenarioTemplateDataService.importScenarioTemplates stub, crucible-dialog submit.
   * Data: one file; the API answers one template, one note and one failure.
   */
  it('imports the chosen file and shows what was imported, noted and refused', async () => {
    const { user, importScenarioTemplates, chooseFile } = await renderDialog(
      of({
        scenarioTemplates: [{ id: 'n1', name: 'Alpha - Importer' }],
        warnings: [
          'Scenario Template Alpha already exists and was imported as Alpha - Importer',
        ],
        failures: [
          { id: 'b1', name: 'Broken', reason: 'Trigger Tasks form a cycle' },
        ],
      }),
    );
    const file = exportFile();

    await chooseFile(file);
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(importScenarioTemplates).toHaveBeenCalledWith(file);
    expect(screen.getByText('Alpha - Importer')).toBeInTheDocument();
    expect(
      screen.getByText(/imported as Alpha - Importer/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Trigger Tasks form a cycle/)).toBeInTheDocument();
  });

  /**
   * Verifies: the file picker takes both the json export and a zip holding it.
   * Data: the hidden file input.
   */
  it('accepts json and zip files', async () => {
    await renderDialog(of({}));

    expect(
      screen
        .getByLabelText('Scenario Template export file')
        .getAttribute('accept'),
    ).toBe('.json,.zip');
  });

  /**
   * Verifies: an error answer is shown in the dialog, which stays open.
   * Interacts with: crucible-dialog errorMessage.
   * Data: the API fails with a ProblemDetails title.
   */
  it('shows the error when the import fails', async () => {
    const { user, close, chooseFile } = await renderDialog(
      throwError(() => ({ error: { title: 'Forbidden' } })),
    );

    await chooseFile(exportFile());
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });

  /**
   * Verifies: a validation error shows its reason, not just its title.
   * Data: a 400 ValidationProblemDetails naming the missing file.
   */
  it('shows the reason of a validation error', async () => {
    const { user, chooseFile } = await renderDialog(
      throwError(() => ({
        status: 400,
        error: {
          title: 'One or more validation errors occurred.',
          errors: { File: ['The File field is required.'] },
        },
      })),
    );

    await chooseFile(exportFile());
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(
      await screen.findByText('The File field is required.'),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: a 413, which has no body, says the file is too large and what an import reads.
   */
  it('says the file is too large on a 413', async () => {
    const { user, chooseFile } = await renderDialog(
      throwError(() => ({ status: 413, error: null })),
    );

    await chooseFile(exportFile());
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByText(/files up to 10 MB/)).toBeInTheDocument();
  });

  /**
   * Verifies: closing the dialog while the import is in flight does not abort it, since the API may already
   * have saved the templates.
   * Data: an import that answers only after the dialog is closed.
   */
  it('keeps an import in flight running when the dialog is closed', async () => {
    let aborted = false;
    const answer = new Subject<ImportScenarioTemplatesResult>();
    const { user, close, chooseFile } = await renderDialog(
      new Observable<ImportScenarioTemplatesResult>((subscriber) => {
        const inner = answer.subscribe(subscriber);
        return () => {
          inner.unsubscribe();
          aborted = !subscriber.closed;
        };
      }),
    );

    await chooseFile(exportFile());
    await user.click(screen.getByRole('button', { name: 'Import' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(close).toHaveBeenCalled();
    expect(aborted).toBe(false);
    answer.next({ scenarioTemplates: [{ id: 'n1', name: 'Alpha' }] });
    answer.complete();
    expect(aborted).toBe(false);
  });
});
