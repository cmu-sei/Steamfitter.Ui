/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioMembershipsComponent } from './scenario-memberships.component';

describe('ScenarioMembershipsComponent', () => {
  let component: ScenarioMembershipsComponent;
  let fixture: ComponentFixture<ScenarioMembershipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioMembershipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioMembershipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
