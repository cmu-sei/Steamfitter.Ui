/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioTemplateMembershipsPageComponent } from './scenario-template-memberships-page.component';

describe('ScenarioTemplateMembershipsPageComponent', () => {
  let component: ScenarioTemplateMembershipsPageComponent;
  let fixture: ComponentFixture<ScenarioTemplateMembershipsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioTemplateMembershipsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioTemplateMembershipsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
