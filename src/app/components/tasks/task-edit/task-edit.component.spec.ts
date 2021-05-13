// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TaskEditComponent } from './task-edit.component';

describe('TaskEditComponent', () => {
  let component: TaskEditComponent;
  let fixture: ComponentFixture<TaskEditComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TaskEditComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
