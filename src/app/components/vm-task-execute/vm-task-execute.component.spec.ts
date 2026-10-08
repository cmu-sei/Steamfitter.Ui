// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import {
  Scenario,
  ScenarioService,
  Task,
  TaskService,
} from 'src/app/generated/steamfitter.api';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { renderComponent } from 'src/app/test-utils/render-component';
import { VmTaskExecuteComponent } from './vm-task-execute.component';

describe('VmTaskExecuteComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), real ScenarioDataService and TaskDataService over ScenarioService.getMyScenario and TaskService.getScenarioTasks.
   * Data: the user's task-builder scenario with no tasks.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(VmTaskExecuteComponent, {
      declarations: [VmTaskExecuteComponent],
      imports: [],
      providers: [
        {
          provide: ScenarioService,
          useValue: {
            getMyScenario: vi.fn(() =>
              of<Scenario>({ id: 's1', name: 'My Tasks', viewId: 'v1' }),
            ),
          } satisfies ApiStub<ScenarioService>,
        },
        {
          provide: TaskService,
          useValue: {
            getScenarioTasks: vi.fn(() => of<Task[]>([])),
          } satisfies ApiStub<TaskService>,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(VmTaskExecuteComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
