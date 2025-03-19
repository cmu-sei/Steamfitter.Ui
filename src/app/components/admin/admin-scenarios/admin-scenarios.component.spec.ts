/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminScenariosComponent } from './admin-scenarios.component';

describe('AdminScenariosComponent', () => {
  let component: AdminScenariosComponent;
  let fixture: ComponentFixture<AdminScenariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminScenariosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminScenariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
