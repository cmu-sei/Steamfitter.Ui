// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { Scenario, ScenarioService } from 'src/app/generated/steamfitter.api';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ScenariosComponent } from './scenarios.component';

describe('ScenariosComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), real ScenarioDataService over ScenarioService.getScenarios.
   * Data: no scenarios.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(ScenariosComponent, {
      declarations: [ScenariosComponent],
      imports: [],
      providers: [
        {
          provide: ScenarioService,
          useValue: {
            getScenarios: vi.fn(() => of<Scenario[]>([])),
          } satisfies ApiStub<ScenarioService>,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(ScenariosComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
