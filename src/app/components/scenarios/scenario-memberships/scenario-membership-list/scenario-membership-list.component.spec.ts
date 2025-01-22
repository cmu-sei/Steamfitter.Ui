/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioMembershipListComponent } from './scenario-membership-list.component';

describe('ScenarioMembershipUserListComponent', () => {
  let component: ScenarioMembershipListComponent;
  let fixture: ComponentFixture<ScenarioMembershipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioMembershipListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioMembershipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
