// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers.
   * Interacts with: getDefaultProviders (placeholders and stubs only).
   * Data: no inputs beyond what the template needs to render.
   */
  it('renders with the default test providers', async () => {
    const { fixture } = await renderComponent(AppComponent, {
      declarations: [AppComponent],
      imports: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    expect(fixture.componentInstance).toBeInstanceOf(AppComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
  });
});
