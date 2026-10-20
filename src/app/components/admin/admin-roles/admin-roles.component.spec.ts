// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminRolesComponent } from './admin-roles.component';
import { AdminSystemRolesComponent } from './admin-system-roles/admin-system-roles.component';
import { AdminScenarioTemplateRolesComponent } from './admin-scenario-template-roles/admin-scenario-template-roles.component';
import { AdminScenarioRolesComponent } from './admin-scenario-roles/admin-scenario-roles.component';

@Component({ selector: 'app-admin-system-roles', template: '' })
class SystemRolesStubComponent {}

@Component({ selector: 'app-admin-scenario-template-roles', template: '' })
class ScenarioTemplateRolesStubComponent {}

@Component({ selector: 'app-admin-scenario-roles', template: '' })
class ScenarioRolesStubComponent {}

describe('AdminRolesComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: no inputs beyond what the template needs to render.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(AdminRolesComponent, {
      imports: [MatTabsModule],
      childStubs: [
        { replace: AdminSystemRolesComponent, with: SystemRolesStubComponent },
        {
          replace: AdminScenarioTemplateRolesComponent,
          with: ScenarioTemplateRolesStubComponent,
        },
        {
          replace: AdminScenarioRolesComponent,
          with: ScenarioRolesStubComponent,
        },
      ],
    });

    expect(fixture.componentInstance).toBeInstanceOf(AdminRolesComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
