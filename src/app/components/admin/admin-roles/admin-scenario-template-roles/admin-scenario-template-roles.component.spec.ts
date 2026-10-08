// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of } from 'rxjs';
import {
  ScenarioTemplateRole,
  ScenarioTemplateRolesService,
} from 'src/app/generated/steamfitter.api';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminScenarioTemplateRolesComponent } from './admin-scenario-template-roles.component';

describe('AdminScenarioTemplateRolesComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), ScenarioTemplateRolesService.getAllScenarioTemplateRoles stub.
   * Data: no scenario template roles.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(
      AdminScenarioTemplateRolesComponent,
      {
        declarations: [AdminScenarioTemplateRolesComponent],
        imports: [
          MatTableModule,
          MatCheckboxModule,
          MatIconModule,
          MatButtonModule,
          MatTooltipModule,
        ],
        providers: [
          {
            provide: ScenarioTemplateRolesService,
            useValue: {
              getAllScenarioTemplateRoles: vi.fn(() =>
                of<ScenarioTemplateRole[]>([]),
              ),
            } satisfies ApiStub<ScenarioTemplateRolesService>,
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    );

    expect(fixture.componentInstance).toBeInstanceOf(
      AdminScenarioTemplateRolesComponent,
    );
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
