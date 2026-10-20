// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Output, EventEmitter, inject } from '@angular/core';
import {
  CrucibleDialogComponent,
  CrucibleDialogContentDirective,
} from '@cmusei/crucible-common';
import { MatFormField, MatLabel, MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
  imports: [
    CrucibleDialogComponent,
    CrucibleDialogContentDirective,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
  ],
})
export class AddDialogComponent {
  data = inject(MAT_DIALOG_DATA);

  @Output() editComplete = new EventEmitter<any>();
  public title: string;
  public message: string;
  onClick(add: boolean): void {
    this.data.add = add;
    this.editComplete.emit(this.data);
  }
}
