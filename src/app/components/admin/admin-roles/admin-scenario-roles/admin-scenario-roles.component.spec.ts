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
  ScenarioRole,
  ScenarioRolesService,
} from 'src/app/generated/steamfitter.api';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminScenarioRolesComponent } from './admin-scenario-roles.component';

describe('AdminScenarioRolesComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), ScenarioRolesService.getAllScenarioRoles stub.
   * Data: no scenario roles.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(AdminScenarioRolesComponent, {
      declarations: [AdminScenarioRolesComponent],
      imports: [
        MatTableModule,
        MatCheckboxModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
      ],
      providers: [
        {
          provide: ScenarioRolesService,
          useValue: {
            getAllScenarioRoles: vi.fn(() => of<ScenarioRole[]>([])),
          } satisfies ApiStub<ScenarioRolesService>,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(
      AdminScenarioRolesComponent,
    );
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
