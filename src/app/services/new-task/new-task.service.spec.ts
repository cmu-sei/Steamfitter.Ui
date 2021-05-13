// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { TestBed } from '@angular/core/testing';

import { NewTaskService } from './new-task.service';

describe('NewTaskService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NewTaskService = TestBed.get(NewTaskService);
    expect(service).toBeTruthy();
  });
});
