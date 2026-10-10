// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { throwError } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ComnAuthService, Theme } from '@cmusei/crucible-common';
import { CurrentUserStore } from 'src/app/data/user/user.store';
import { SystemPermissionsService } from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import {
  PermissionGrants,
  permissionApiStubs,
} from 'src/app/test-utils/mock-permission-data.service';
import { TopbarComponent } from './topbar.component';
import { TopbarView } from './topbar.models';

async function renderTopbar(
  overrides: {
    grants?: PermissionGrants;
    topbarView?: TopbarView;
    systemPermissionsApi?: ApiStub<SystemPermissionsService>;
  } = {},
) {
  const { grants = {}, topbarView = TopbarView.STEAMFITTER_HOME } = overrides;
  const setUserTheme = vi.fn();
  const logout = vi.fn(() => Promise.resolve());
  // TopbarComponent loads the system permissions itself (ngOnInit), so the
  // real PermissionDataService runs over the stubbed endpoint, not primed.
  const permissionApi = permissionApiStubs(grants);
  const auth: Pick<ComnAuthService, 'setUserTheme' | 'logout'> = {
    setUserTheme,
    logout,
  };

  const rendered = await renderComponent(TopbarComponent, {
    declarations: [TopbarComponent],
    imports: [
      MatToolbarModule,
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      MatSlideToggleModule,
      MatFormFieldModule,
    ],
    providers: [
      {
        provide: SystemPermissionsService,
        useValue:
          overrides.systemPermissionsApi ?? permissionApi.systemPermissions,
      },
      { provide: ComnAuthService, useValue: auth },
      // The real current-user store, seeded with the signed-in user.
      {
        provide: CurrentUserStore,
        useFactory: () => {
          const store = new CurrentUserStore();
          store.update({ name: 'Ada Lovelace', id: 'u1' });
          return store;
        },
      },
    ],
    inputs: { title: 'Steamfitter', topbarView },
  });

  const user = userEvent.setup();
  const openMenu = async () => {
    await user.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    // Logout is always present, so waiting on it proves the menu is open.
    await screen.findByRole('menuitem', { name: 'Logout' });
  };
  return { ...rendered, user, openMenu, setUserTheme, logout, permissionApi };
}

describe('TopbarComponent', () => {
  /**
   * Verifies: the title and the signed-in user's name render in the toolbar.
   * Interacts with: real CurrentUserQuery over a seeded CurrentUserStore.
   * Data: title 'Steamfitter', user 'Ada Lovelace'.
   */
  it('shows the title and the current user', async () => {
    await renderTopbar();
    expect(screen.getByText('Steamfitter')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: any View* system permission shows the Administration menu item on the home view.
   * Interacts with: real PermissionDataService (canViewAdiminstration) over the stubbed getMySystemPermissions, MatMenu.
   * Data: ViewUsers, ViewRoles, or ViewScenarios on their own.
   */
  it.each(['ViewUsers', 'ViewRoles', 'ViewScenarios'] as const)(
    'shows Administration with %s',
    async (permission) => {
      const { openMenu, permissionApi } = await renderTopbar({
        grants: { system: [permission] },
      });
      expect(
        permissionApi.systemPermissions.getMySystemPermissions,
      ).toHaveBeenCalled();
      await openMenu();
      expect(
        screen.getByRole('menuitem', { name: 'Administration' }),
      ).toBeInTheDocument();
    },
  );

  /**
   * Verifies: without a View* system permission the Administration item is hidden, even with Manage/Create rights.
   * Interacts with: real PermissionDataService over the stubbed getMySystemPermissions, MatMenu.
   * Data: near misses: ManageUsers alone (Manage instead of View on users); ManageUsers + CreateScenarios + ManageTasks.
   */
  it.each([
    { label: 'ManageUsers only', system: ['ManageUsers'] as const },
    {
      label: 'Manage/Create only',
      system: ['ManageUsers', 'CreateScenarios', 'ManageTasks'] as const,
    },
  ])('hides Administration with $label', async ({ system }) => {
    const { openMenu } = await renderTopbar({
      grants: { system: [...system] },
    });
    await openMenu();
    expect(
      screen.queryByRole('menuitem', { name: 'Administration' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: a failed permission load lets the API error escape unhandled and leaves Administration hidden (current behavior).
   * Interacts with: SystemPermissionsService.getMySystemPermissions failing, real PermissionDataService, captureUnhandledRxErrors, MatMenu.
   * Data: getMySystemPermissions throws a 500.
   */
  it('lets a failed permission load escape unhandled', async () => {
    const errors = captureUnhandledRxErrors();
    const failure = new Error('500');
    const { openMenu } = await renderTopbar({
      systemPermissionsApi: {
        getMySystemPermissions: () => throwError(() => failure),
      },
    });
    await flush();

    expect(errors).toEqual([failure]);
    await openMenu();
    expect(
      screen.queryByRole('menuitem', { name: 'Administration' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: on the admin view the menu offers Exit Administration instead of Administration.
   * Interacts with: TopbarComponent topbarView input, MatMenu.
   * Data: topbarView STEAMFITTER_ADMIN with ViewUsers.
   */
  it('offers Exit Administration instead of Administration on the admin view', async () => {
    const { openMenu } = await renderTopbar({
      grants: { system: ['ViewUsers'] },
      topbarView: TopbarView.STEAMFITTER_ADMIN,
    });
    await openMenu();
    expect(
      screen.getByRole('menuitem', { name: 'Exit Administration' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Administration' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: the home view never shows Exit Administration.
   * Interacts with: TopbarComponent topbarView input, MatMenu.
   * Data: topbarView STEAMFITTER_HOME with ViewUsers.
   */
  it('does not offer Exit Administration on the home view', async () => {
    const { openMenu } = await renderTopbar({
      grants: { system: ['ViewUsers'] },
    });
    await openMenu();
    expect(
      screen.queryByRole('menuitem', { name: 'Exit Administration' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: switching on Dark Theme asks the auth service for the dark theme.
   * Interacts with: MatSlideToggle in the menu, ComnAuthService.setUserTheme spy.
   * Data: the default light theme from ComnAuthQuery.
   */
  it('switches to the dark theme from the menu', async () => {
    const { openMenu, user, setUserTheme } = await renderTopbar();
    await openMenu();

    await user.click(screen.getByRole('switch', { name: 'Dark Theme' }));

    expect(setUserTheme).toHaveBeenCalledWith(Theme.DARK);
  });

  /**
   * Verifies: Logout calls the auth service's logout.
   * Interacts with: MatMenu Logout item, ComnAuthService.logout spy.
   * Data: default render.
   */
  it('logs out from the menu', async () => {
    const { openMenu, user, logout } = await renderTopbar();
    await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
