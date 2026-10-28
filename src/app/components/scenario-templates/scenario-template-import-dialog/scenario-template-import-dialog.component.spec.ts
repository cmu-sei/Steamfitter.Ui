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
  const { dialogRef, close, keydown } = dialogRefStub<
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
  return { user, importScenarioTemplates, close, chooseFile, keydown };
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
   * Verifies: while the import runs the dialog cannot be dismissed (Cancel disabled, Escape ignored by
   * crucible-dialog while loading), since whether the API saved it is unknown until it answers; once the
   * result shows, OK closes it.
   * Data: an import that answers only when the test says so.
   */
  it('cannot be closed while the import runs, then closes with OK', async () => {
    const answer = new Subject<ImportScenarioTemplatesResult>();
    const { user, close, chooseFile, keydown } = await renderDialog(
      answer.asObservable(),
    );

    await chooseFile(exportFile());
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Importing...' })).toBeDisabled();
    keydown.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(close).not.toHaveBeenCalled();

    answer.next({ scenarioTemplates: [{ id: 'n1', name: 'Alpha' }] });
    answer.complete();
    expect(await screen.findByText('Alpha')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(close).toHaveBeenCalled();
  });

  /**
   * Verifies: before an import is sent, Cancel closes the dialog.
   */
  it('closes from Cancel before an import is sent', async () => {
    const { user, close } = await renderDialog(of({}));

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(close).toHaveBeenCalled();
  });
});
