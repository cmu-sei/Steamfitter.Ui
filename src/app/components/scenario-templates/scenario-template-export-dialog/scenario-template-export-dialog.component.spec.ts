// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Observable, of, throwError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import {
  ScenarioTemplateExportDialogComponent,
  ScenarioTemplateExportDialogData,
} from './scenario-template-export-dialog.component';

async function renderDialog(
  data: ScenarioTemplateExportDialogData,
  exportResult: Observable<void> = of(undefined),
) {
  const exportScenarioTemplates = vi.fn(() => exportResult);
  const { dialogRef, close } = dialogRefStub<
    ScenarioTemplateExportDialogComponent,
    boolean
  >();
  await renderComponent(ScenarioTemplateExportDialogComponent, {
    providers: [
      {
        provide: ScenarioTemplateDataService,
        useValue: { exportScenarioTemplates },
      },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });
  return { user: userEvent.setup(), exportScenarioTemplates, close };
}

describe('ScenarioTemplateExportDialogComponent', () => {
  /**
   * Verifies: a selection is exported by its ids, and the dialog closes once the file is downloaded.
   * Interacts with: ScenarioTemplateDataService.exportScenarioTemplates stub, crucible-dialog submit.
   * Data: two selected ids.
   */
  it('exports the selected templates and closes', async () => {
    const { user, exportScenarioTemplates, close } = await renderDialog({
      ids: ['t1', 't2'],
      selected: true,
      all: false,
    });

    expect(
      screen.getByText(/Selected Scenario Templates:\s*2/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(exportScenarioTemplates).toHaveBeenCalledWith(['t1', 't2']);
    expect(close).toHaveBeenCalledWith(true);
  });

  /**
   * Verifies: an export of everything sends no ids, so the API exports every template.
   * Data: all, with three ids listed for the count.
   */
  it('sends no ids when exporting all', async () => {
    const { user, exportScenarioTemplates } = await renderDialog({
      ids: ['t1', 't2', 't3'],
      selected: false,
      all: true,
    });

    expect(screen.getByText(/All Scenario Templates:\s*3/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(exportScenarioTemplates).toHaveBeenCalledWith([]);
  });

  /**
   * Verifies: the dialog warns that VM Credential passwords travel in the file.
   */
  it('says that VM Credential passwords are included', async () => {
    await renderDialog({ ids: ['t1'], selected: false, all: false });

    expect(
      screen.getByText(/VM Credential passwords are included/),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: the ProblemDetails title of a failed blob request is shown, and the dialog stays open.
   * Interacts with: showError reading a Blob error body.
   * Data: the API answers a 404 whose body is a json Blob.
   */
  it('shows the error title from a blob error body', async () => {
    const { user, close } = await renderDialog(
      { ids: ['t1'], selected: true, all: false },
      throwError(() => ({
        error: new Blob(
          [JSON.stringify({ title: 'ScenarioTemplate not found' })],
          {
            type: 'application/json',
          },
        ),
      })),
    );

    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(
      await screen.findByText('ScenarioTemplate not found'),
    ).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });
});
