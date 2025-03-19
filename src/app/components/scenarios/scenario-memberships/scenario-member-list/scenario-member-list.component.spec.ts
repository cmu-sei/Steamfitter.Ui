/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioMemberListComponent } from './scenario-member-list.component';

describe('ScenarioMemberListComponent', () => {
  let component: ScenarioMemberListComponent;
  let fixture: ComponentFixture<ScenarioMemberListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioMemberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
