// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CrucibleThemeService, Theme } from '@cmusei/crucible-common';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  /**
   * Verifies: the component mounts with the default test providers and applies the user's theme.
   * Interacts with: getDefaultProviders (placeholders and stubs only), ComnAuthQuery.userTheme$, CrucibleThemeService.applyTheme.
   * Data: user theme light (default ComnAuthQuery stub).
   */
  it('renders with the default test providers', async () => {
    const applyTheme = vi.fn();
    const theme: Pick<CrucibleThemeService, 'applyTheme'> = { applyTheme };
    const { fixture } = await renderComponent(AppComponent, {
      declarations: [AppComponent],
      imports: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: CrucibleThemeService, useValue: theme }],
    });

    expect(fixture.componentInstance).toBeInstanceOf(AppComponent);
    expect(fixture.nativeElement).toBeInTheDocument();
    expect(applyTheme).toHaveBeenCalledWith(Theme.LIGHT);
  });
});
