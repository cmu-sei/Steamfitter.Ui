/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved. 
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualTasksListComponent } from './manual-tasks-list.component';

describe('ManualTasksListComponent', () => {
  let component: ManualTasksListComponent;
  let fixture: ComponentFixture<ManualTasksListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManualTasksListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualTasksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
