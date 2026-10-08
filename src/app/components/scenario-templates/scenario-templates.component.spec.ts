// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import {
  ScenarioTemplate,
  ScenarioTemplateService,
} from 'src/app/generated/steamfitter.api';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ScenarioTemplatesComponent } from './scenario-templates.component';

describe('ScenarioTemplatesComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), real ScenarioTemplateDataService over ScenarioTemplateService.getScenarioTemplates.
   * Data: no scenario templates.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(ScenarioTemplatesComponent, {
      declarations: [ScenarioTemplatesComponent],
      imports: [],
      providers: [
        {
          provide: ScenarioTemplateService,
          useValue: {
            getScenarioTemplates: vi.fn(() => of<ScenarioTemplate[]>([])),
          } satisfies ApiStub<ScenarioTemplateService>,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(
      ScenarioTemplatesComponent,
    );
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
