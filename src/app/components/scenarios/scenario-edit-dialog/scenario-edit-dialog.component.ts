// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: 'app-scenario-edit-dialog',
  templateUrl: './scenario-edit-dialog.component.html',
  styleUrls: ['./scenario-edit-dialog.component.scss'],
})
export class ScenarioEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  public scenarioNameFormControl = new UntypedFormControl(this.data.scenario.name, [
    Validators.required,
    Validators.minLength(4),
  ]);
  public descriptionFormControl = new UntypedFormControl(
    this.data.scenario.description ? this.data.scenario.description : ' ',
    [Validators.required, Validators.minLength(4)]
  );
  public startDateFormControl = new UntypedFormControl(
    this.data.scenario.startDate ? this.data.scenario.startDate : '',
    []
  );
  public endDateFormControl = new UntypedFormControl(
    this.data.scenario.endDate ? this.data.scenario.endDate : '',
    []
  );
  public matcher = new UserErrorStateMatcher();

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<ScenarioEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    return !(
      this.scenarioNameFormControl.hasError('required') ||
      this.scenarioNameFormControl.hasError('minlength') ||
      this.descriptionFormControl.hasError('required') ||
      this.descriptionFormControl.hasError('minlength') ||
      !this.data.scenario.viewId
    );
  }

  trimInitialDescription() {
    if (
      this.descriptionFormControl.value &&
      this.descriptionFormControl.value.toString()[0] === ' '
    ) {
      this.descriptionFormControl.setValue(
        this.descriptionFormControl.value.toString().trim()
      );
    }
  }

  /**
   * Closes the edit screen
   */
  handleEditComplete(saveChanges: boolean): void {
    if (!saveChanges) {
      this.editComplete.emit({ saveChanges: false, scenario: null });
    } else {
      this.data.scenario.name = this.scenarioNameFormControl.value
        .toString()
        .trim();
      this.data.scenario.description = this.descriptionFormControl.value
        .toString()
        .trim();
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          scenario: this.data.scenario,
        });
      }
    }
  }

  /**
   * Saves the current scenario
   */
  saveScenario(changedField): void {
    switch (changedField) {
      case 'name':
        this.data.scenario.name = this.scenarioNameFormControl.value.toString();
        break;
      case 'description':
        this.data.scenario.description =
          this.descriptionFormControl.value.toString();
        break;
      case 'view':
        const view = this.data.views.find(
          (v) => v.id === this.data.scenario.viewId
        );
        this.data.scenario.view = view ? view.name : '';
        break;
      case 'startDate':
        const newStart = new Date(this.startDateFormControl.value);
        const oldStart = new Date(this.data.scenario.startDate);
        this.data.scenario.startDate = newStart;
        break;
      case 'endDate':
        const newEnd = new Date(this.endDateFormControl.value);
        const oldEnd = new Date(this.data.scenario.endDate);
        this.data.scenario.endDate = newEnd;
        break;
      default:
        break;
    }
  }
}
