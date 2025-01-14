/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioRolesComponent } from './scenario-roles.component';

describe('ScenarioRolesComponent', () => {
  let component: ScenarioRolesComponent;
  let fixture: ComponentFixture<ScenarioRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenarioRolesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
