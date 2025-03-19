/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioTemplateRolesComponent } from './scenarioTemplate-roles.component';

describe('ScenarioTemplateRolesComponent', () => {
  let component: ScenarioTemplateRolesComponent;
  let fixture: ComponentFixture<ScenarioTemplateRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioTemplateRolesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioTemplateRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
