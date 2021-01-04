// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Component, Inject, Output, EventEmitter} from '@angular/core';

@Component({
    selector: 'app-add-dialog',
    templateUrl: './add-dialog.component.html'
})
export class AddDialogComponent {
  @Output() editComplete = new EventEmitter<any>();
  public title: string;
  public message: string;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    public dialogRef: MatDialogRef<AddDialogComponent>
  ) {
    this.dialogRef.disableClose = true;
  }
  onClick(add: boolean): void {
    this.data.add = add;
    this.editComplete.emit(this.data);
  }
}


