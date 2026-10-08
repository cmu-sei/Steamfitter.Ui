// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import {
  PlayerService,
  Scenario,
  ScenarioService,
  View,
} from 'src/app/generated/steamfitter.api';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminScenariosComponent } from './admin-scenarios.component';

describe('AdminScenariosComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), real ScenarioDataService and PlayerDataService over ScenarioService.getScenarios and PlayerService.getViews.
   * Data: no scenarios and no views.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(AdminScenariosComponent, {
      declarations: [AdminScenariosComponent],
      imports: [],
      providers: [
        {
          provide: ScenarioService,
          useValue: {
            getScenarios: vi.fn(() => of<Scenario[]>([])),
          } satisfies ApiStub<ScenarioService>,
        },
        {
          provide: PlayerService,
          useValue: {
            getViews: vi.fn(() => of<View[]>([])),
          } satisfies ApiStub<PlayerService>,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(AdminScenariosComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
