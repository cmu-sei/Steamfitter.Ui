/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioTemplateMemberListComponent } from './scenario-template-member-list.component';

describe('ScenarioTemplateMemberListComponent', () => {
  let component: ScenarioTemplateMemberListComponent;
  let fixture: ComponentFixture<ScenarioTemplateMemberListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioTemplateMemberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioTemplateMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
