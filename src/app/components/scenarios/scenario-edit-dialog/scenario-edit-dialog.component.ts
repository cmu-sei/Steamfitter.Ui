// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import {
  MatFormField,
  MatLabel,
  MatInput,
  MatError,
  MatSuffix,
} from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';
import { MatTooltip } from '@angular/material/tooltip';
import {
  NgxMatDatepickerInput,
  NgxMatDatepickerToggle,
  NgxMatDatetimepicker,
  NgxMatDatepickerActions,
  NgxMatDatepickerApply,
  NgxMatDatepickerCancel,
} from '@ngxmc/datetime-picker';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: 'app-scenario-edit-dialog',
  templateUrl: './scenario-edit-dialog.component.html',
  styleUrls: ['./scenario-edit-dialog.component.scss'],
  imports: [
    CrucibleDialogComponent,
    CrucibleDialogContentDirective,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    ReactiveFormsModule,
    MatError,
    MatSelect,
    MatOption,
    MatTooltip,
    NgxMatDatepickerInput,
    NgxMatDatepickerToggle,
    MatSuffix,
    NgxMatDatetimepicker,
    NgxMatDatepickerActions,
    MatButton,
    NgxMatDatepickerApply,
    NgxMatDatepickerCancel,
    DatePipe,
  ],
})
export class ScenarioEditDialogComponent {
  data = inject(MAT_DIALOG_DATA);

  @Output() editComplete = new EventEmitter<any>();

  public scenarioNameFormControl = new UntypedFormControl(
    this.data.scenario.name,
    [Validators.required, Validators.minLength(4)],
  );
  public descriptionFormControl = new UntypedFormControl(
    this.data.scenario.description ? this.data.scenario.description : ' ',
    [Validators.required, Validators.minLength(4)],
  );
  public startDateFormControl = new UntypedFormControl(
    this.data.scenario.startDate ? this.data.scenario.startDate : '',
    [Validators.required],
  );
  public endDateFormControl = new UntypedFormControl(
    this.data.scenario.endDate ? this.data.scenario.endDate : '',
    [Validators.required],
  );
  public matcher = new UserErrorStateMatcher();

  errorFree() {
    return !(
      this.scenarioNameFormControl.hasError('required') ||
      this.scenarioNameFormControl.hasError('minlength') ||
      this.descriptionFormControl.hasError('required') ||
      this.descriptionFormControl.hasError('minlength') ||
      this.startDateFormControl.hasError('required') ||
      this.endDateFormControl.hasError('required') ||
      !this.data.scenario.viewId
    );
  }

  trimInitialDescription() {
    if (
      this.descriptionFormControl.value &&
      this.descriptionFormControl.value.toString()[0] === ' '
    ) {
      this.descriptionFormControl.setValue(
        this.descriptionFormControl.value.toString().trim(),
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
      if (this.errorFree()) {
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
          (v) => v.id === this.data.scenario.viewId,
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
