// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ManualTasksPageComponent } from './manual-tasks-page.component';

const signalR: Pick<SignalRService, 'joinScenario' | 'leaveScenario'> = {
  joinScenario: vi.fn(),
  leaveScenario: vi.fn(),
};

describe('ManualTasksPageComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only), a SignalRService stub (the page leaves its scenario group on destroy).
   * Data: no scenarioId or viewId route parameter.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(ManualTasksPageComponent, {
      declarations: [ManualTasksPageComponent],
      imports: [],
      providers: [{ provide: SignalRService, useValue: signalR }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(ManualTasksPageComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
