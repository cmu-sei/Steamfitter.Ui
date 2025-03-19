/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioTemplateMembershipListComponent } from './scenario-template-membership-list.component';

describe('ScenarioTemplateMembershipUserListComponent', () => {
  let component: ScenarioTemplateMembershipListComponent;
  let fixture: ComponentFixture<ScenarioTemplateMembershipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioTemplateMembershipListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioTemplateMembershipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
