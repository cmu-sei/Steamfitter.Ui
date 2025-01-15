/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminScenarioTemplatesComponent } from './admin-scenario-templates.component';

describe('AdminScenarioTemplatesComponent', () => {
  let component: AdminScenarioTemplatesComponent;
  let fixture: ComponentFixture<AdminScenarioTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminScenarioTemplatesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminScenarioTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
