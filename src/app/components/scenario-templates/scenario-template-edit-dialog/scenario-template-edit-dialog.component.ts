// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

/** Error when control isn't an integer */
export class NotIntegerErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const hours = parseInt(control.value, 10);
    let isNotAnInteger = hours === NaN || hours <= 0;
    if (!isNotAnInteger && !!control.value) {
      isNotAnInteger = hours.toString() !== control.value.toString();
    }
    if (isNotAnInteger) {
      control.setErrors({ notAnInteger: true });
    }
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      (control.invalid || isNotAnInteger) &&
      (control.dirty || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-scenario-template-edit-dialog',
  templateUrl: './scenario-template-edit-dialog.component.html',
  styleUrls: ['./scenario-template-edit-dialog.component.scss'],
})
export class ScenarioTemplateEditDialogComponent {
  @Output() editComplete = new EventEmitter<any>();

  scenarioTemplateNameFormControl = new FormControl(
    this.data.scenarioTemplate.name,
    [Validators.required, Validators.minLength(4)]
  );
  descriptionFormControl = new FormControl(
    this.data.scenarioTemplate.description
      ? this.data.scenarioTemplate.description
      : ' ',
    [Validators.required, Validators.minLength(4)]
  );
  durationHoursFormControl = new FormControl(
    this.data.scenarioTemplate.durationHours,
    [Validators.required]
  );
  matcher = new UserErrorStateMatcher();
  notAnIntegerErrorState = new NotIntegerErrorStateMatcher();

  constructor(
    public dialogService: DialogService,
    dialogRef: MatDialogRef<ScenarioTemplateEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = true;
  }

  errorFree() {
    const hasError =
      this.scenarioTemplateNameFormControl.hasError('required') ||
      this.scenarioTemplateNameFormControl.hasError('minlength') ||
      this.descriptionFormControl.hasError('required') ||
      this.descriptionFormControl.hasError('minlength') ||
      this.durationHoursFormControl.hasError('required') ||
      this.durationHoursFormControl.hasError('notAnInteger');
    return !hasError;
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
      this.editComplete.emit({ saveChanges: false, scenarioTemplate: null });
    } else {
      const modifiedScenarioTemplate = {
        ...this.data.scenarioTemplate,
        id: this.data.scenarioTemplate.id,
      };
      modifiedScenarioTemplate.name = this.scenarioTemplateNameFormControl.value
        .toString()
        .trim();
      modifiedScenarioTemplate.description = this.descriptionFormControl.value
        .toString()
        .trim();
      modifiedScenarioTemplate.durationHours =
        this.durationHoursFormControl.value;
      if (this.errorFree) {
        this.editComplete.emit({
          saveChanges: saveChanges,
          scenarioTemplate: modifiedScenarioTemplate,
        });
      }
    }
  }
}
