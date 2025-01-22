/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioTemplateMembershipsComponent } from './scenario-template-memberships.component';

describe('ScenarioTemplateMembershipsComponent', () => {
  let component: ScenarioTemplateMembershipsComponent;
  let fixture: ComponentFixture<ScenarioTemplateMembershipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioTemplateMembershipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioTemplateMembershipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
