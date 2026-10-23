// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, NgZone, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { EMPTY, of, throwError } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterQuery } from '@datorama/akita-ng-router-store';
import { ComnAuthService } from '@cmusei/crucible-common';
import {
  SystemPermission,
  SystemPermissionsService,
} from 'src/app/generated/steamfitter.api';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { permissionApiStubs } from 'src/app/test-utils/mock-permission-data.service';
import { TopbarView } from '../../shared/top-bar/topbar.models';
import { AdminContainerComponent } from './admin-container.component';
import { TopbarComponent } from 'src/app/components/shared/top-bar/topbar.component';
import { AdminScenarioTemplatesComponent } from 'src/app/components/admin/admin-scenario-templates/admin-scenario-templates.component';
import { AdminScenariosComponent } from 'src/app/components/admin/admin-scenarios/admin-scenarios.component';
import { AdminUsersComponent } from 'src/app/components/admin/admin-users/admin-users.component';
import { AdminRolesComponent } from 'src/app/components/admin/admin-roles/admin-roles.component';
import { AdminGroupsComponent } from 'src/app/components/admin/admin-groups/admin-groups.component';

@Component({ selector: 'app-topbar', template: '' })
class TopbarStubComponent {
  readonly title = input<string>(undefined);
  readonly topbarView = input<TopbarView>(undefined);
}

@Component({
  selector: 'app-admin-scenario-templates',
  template: '',
})
class AdminScenarioTemplatesStubComponent {}

@Component({
  selector: 'app-admin-scenarios',
  template: '',
})
class AdminScenariosStubComponent {}

@Component({
  selector: 'app-admin-users',
  template: '',
})
class AdminUsersStubComponent {}

@Component({
  selector: 'app-admin-roles',
  template: '',
})
class AdminRolesStubComponent {}

@Component({
  selector: 'app-admin-groups',
  template: '',
})
class AdminGroupsStubComponent {}

const SECTIONS = [
  'Scenario Templates',
  'Scenarios',
  'Users',
  'Roles',
  'Groups',
];
const PANELS = {
  templates: AdminScenarioTemplatesStubComponent,
  scenarios: AdminScenariosStubComponent,
  users: AdminUsersStubComponent,
  roles: AdminRolesStubComponent,
  groups: AdminGroupsStubComponent,
};
type Panel = keyof typeof PANELS;

async function renderAdmin(
  overrides: {
    system?: SystemPermission[];
    section?: string | null;
    systemPermissionsApi?: ApiStub<SystemPermissionsService>;
    logout?: ComnAuthService['logout'];
  } = {},
) {
  const { system = [], section = null } = overrides;
  // AdminContainerComponent loads the system permissions itself (ngOnInit),
  // so the real PermissionDataService runs over the stubbed endpoint.
  const permissionApi = permissionApiStubs({ system });
  const auth: Pick<ComnAuthService, 'user$' | 'logout'> = {
    user$: EMPTY,
    logout: overrides.logout ?? (() => Promise.resolve()),
  };
  const signalR: Pick<SignalRService, 'joinSystem' | 'leaveSystem'> = {
    joinSystem: vi.fn(),
    leaveSystem: vi.fn(),
  };
  const routerQuery: Pick<RouterQuery, 'selectQueryParams'> = {
    selectQueryParams: <T>() => of(section as T),
  };

  const rendered = await renderComponent(AdminContainerComponent, {
    childStubs: [
      { replace: TopbarComponent, with: TopbarStubComponent },
      {
        replace: AdminScenarioTemplatesComponent,
        with: AdminScenarioTemplatesStubComponent,
      },
      { replace: AdminScenariosComponent, with: AdminScenariosStubComponent },
      { replace: AdminUsersComponent, with: AdminUsersStubComponent },
      { replace: AdminRolesComponent, with: AdminRolesStubComponent },
      { replace: AdminGroupsComponent, with: AdminGroupsStubComponent },
    ],
    imports: [
      MatSidenavModule,
      MatToolbarModule,
      MatIconModule,
      MatListModule,
      MatButtonModule,
    ],
    providers: [
      {
        provide: SystemPermissionsService,
        useValue:
          overrides.systemPermissionsApi ?? permissionApi.systemPermissions,
      },
      { provide: SignalRService, useValue: signalR },
      { provide: RouterQuery, useValue: routerQuery },
      { provide: ComnAuthService, useValue: auth },
    ],
  });
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);
  // A stubbed panel renders nothing, so its presence is read off the stub.
  const visiblePanels = () =>
    (Object.keys(PANELS) as Panel[]).filter((key) =>
      rendered.fixture.debugElement.query(By.directive(PANELS[key])),
    );
  return { ...rendered, signalR, navigate, visiblePanels, permissionApi };
}

const visibleSections = () =>
  SECTIONS.filter((s) => screen.queryByText(s) !== null);

describe('AdminContainerComponent', () => {
  /**
   * Verifies: the sidebar lists exactly the sections the system permissions allow.
   * Interacts with: real PermissionDataService over the stubbed getMySystemPermissions; the template's section gates.
   * Data: each permission set in the table with the sections it should reveal; the denied sections get near misses (Manage without View, another resource's View).
   */
  it.each([
    {
      label: 'ViewUsers + ViewGroups',
      system: ['ViewUsers', 'ViewGroups'],
      sections: ['Users', 'Groups'],
    },
    {
      label: 'EditScenarioTemplates',
      system: ['EditScenarioTemplates'],
      sections: ['Scenario Templates'],
    },
    {
      label: 'ExecuteScenarios + ViewRoles',
      system: ['ExecuteScenarios', 'ViewRoles'],
      sections: ['Scenarios', 'Roles'],
    },
    {
      label: 'ManageUsers without ViewUsers',
      system: ['ManageUsers'],
      sections: [],
    },
    {
      label: 'every View permission',
      system: [
        'ViewScenarioTemplates',
        'ViewScenarios',
        'ViewUsers',
        'ViewRoles',
        'ViewGroups',
      ],
      sections: SECTIONS,
    },
  ] as Array<{
    label: string;
    system: SystemPermission[];
    sections: string[];
  }>)('lists the sections allowed by $label', async ({ system, sections }) => {
    const { permissionApi } = await renderAdmin({ system });
    expect(
      permissionApi.systemPermissions.getMySystemPermissions,
    ).toHaveBeenCalled();
    expect(visibleSections()).toEqual(sections);
  });

  /**
   * Verifies: each accepted system permission alone reveals its sidebar section.
   * Interacts with: real PermissionDataService and the rendered sidebar buttons.
   * Data: one non-Root system permission per render.
   */
  it.each([
    { permission: 'CreateScenarioTemplates', section: 'Scenario Templates' },
    { permission: 'ViewScenarioTemplates', section: 'Scenario Templates' },
    { permission: 'EditScenarioTemplates', section: 'Scenario Templates' },
    { permission: 'ManageScenarioTemplates', section: 'Scenario Templates' },
    { permission: 'CreateScenarios', section: 'Scenarios' },
    { permission: 'ViewScenarios', section: 'Scenarios' },
    { permission: 'EditScenarios', section: 'Scenarios' },
    { permission: 'ExecuteScenarios', section: 'Scenarios' },
    { permission: 'ManageScenarios', section: 'Scenarios' },
    { permission: 'ViewUsers', section: 'Users' },
    { permission: 'ViewRoles', section: 'Roles' },
    { permission: 'ViewGroups', section: 'Groups' },
  ] satisfies Array<{ permission: SystemPermission; section: string }>)(
    'shows $section with exactly $permission',
    async ({ permission, section }) => {
      const { fixture, navigate } = await renderAdmin({ system: [permission] });
      const sidebar = within(fixture.nativeElement);
      await userEvent.setup().click(sidebar.getByRole('button', { name: section }));
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { section },
        queryParamsHandling: 'merge',
      });
    },
  );

  /**
   * Verifies: each sidebar gate hides its control and panel for a neighbouring permission.
   * Interacts with: real PermissionDataService, sidebar buttons and stubbed section panels.
   * Data: another resource's View or Manage on the same resource instead of View.
   */
  it.each([
    { gate: 'canViewScenarioTemplateList', permission: 'ViewScenarios', section: 'Scenario Templates' },
    { gate: 'canViewScenarioList', permission: 'ViewScenarioTemplates', section: 'Scenarios' },
    { gate: 'SystemPermission.ViewUsers', permission: 'ManageUsers', section: 'Users' },
    { gate: 'SystemPermission.ViewRoles', permission: 'ManageRoles', section: 'Roles' },
    { gate: 'SystemPermission.ViewGroups', permission: 'ManageGroups', section: 'Groups' },
  ] satisfies Array<{ gate: string; permission: SystemPermission; section: string }>)(
    'hides $section for $gate with $permission',
    async ({ permission, section }) => {
      const { fixture, visiblePanels } = await renderAdmin({ system: [permission], section });
      expect(within(fixture.nativeElement).queryByRole('button', { name: section })).not.toBeInTheDocument();
      expect(visiblePanels()).toEqual([]);
    },
  );

  /**
   * Verifies: with no section in the URL, the first permitted section opens, in the order templates, scenarios, users, roles, groups.
   * Interacts with: real PermissionDataService, the component's default-section logic, stub section panels.
   * Data: permission sets that each make a different section the first allowed one.
   */
  it.each([
    { system: ['ViewScenarioTemplates', 'ViewUsers'], panel: 'templates' },
    { system: ['ExecuteScenarios', 'ViewRoles'], panel: 'scenarios' },
    { system: ['ViewRoles', 'ViewUsers'], panel: 'users' },
    { system: ['ViewGroups', 'ViewRoles'], panel: 'roles' },
    { system: ['ViewGroups'], panel: 'groups' },
  ] as Array<{ system: SystemPermission[]; panel: Panel }>)(
    'opens $panel by default for $system',
    async ({ system, panel }) => {
      const { visiblePanels } = await renderAdmin({ system });
      expect(visiblePanels()).toEqual([panel]);
    },
  );

  /**
   * Verifies: a permitted section named in the URL opens instead of the default.
   * Interacts with: RouterQuery.selectQueryParams stub, stub section panels.
   * Data: URL section=Groups with ViewScenarioTemplates and ViewGroups.
   */
  it('opens the section named in the URL', async () => {
    const { visiblePanels } = await renderAdmin({
      system: ['ViewScenarioTemplates', 'ViewGroups'],
      section: 'Groups',
    });
    expect(visiblePanels()).toEqual(['groups']);
  });

  /**
   * Verifies: a section named in the URL stays hidden when the user lacks its permission.
   * Interacts with: RouterQuery.selectQueryParams stub, the template's panel gates.
   * Data: URL section=Users with ViewGroups and ManageUsers (Manage instead of View on users).
   */
  it('does not open a URL section the user cannot view', async () => {
    const { visiblePanels } = await renderAdmin({
      system: ['ViewGroups', 'ManageUsers'],
      section: 'Users',
    });
    expect(visiblePanels()).toEqual([]);
  });

  /**
   * Verifies: a failed permission load lets the API error escape unhandled and leaves the sidebar empty (current behavior).
   * Interacts with: SystemPermissionsService.getMySystemPermissions failing, real PermissionDataService, captureUnhandledRxErrors.
   * Data: getMySystemPermissions throws a 500.
   */
  it('lets a failed permission load escape unhandled', async () => {
    const errors = captureUnhandledRxErrors();
    const failure = new Error('500');
    const { visiblePanels } = await renderAdmin({
      systemPermissionsApi: {
        getMySystemPermissions: () => throwError(() => failure),
      },
    });
    await flush();

    expect(errors).toEqual([failure]);
    expect(visibleSections()).toEqual([]);
    expect(visiblePanels()).toEqual([]);
  });

  /**
   * Verifies: clicking a section writes it to the URL's section param.
   * Interacts with: Router.navigate spy, the section list items.
   * Data: ViewUsers and ViewRoles; the Roles item is clicked.
   */
  it('navigates to a section when it is clicked', async () => {
    const { navigate } = await renderAdmin({
      system: ['ViewUsers', 'ViewRoles'],
    });

    await userEvent.setup().click(screen.getByText('Roles'));

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { section: 'Roles' },
      queryParamsHandling: 'merge',
    });
  });

  /**
   * Verifies: calling logout with a rejected redirect leaves the admin page visible and lets the error escape.
   * Interacts with: ComnAuthService.logout, NgZone and captureUnhandledRxErrors.
   * Data: the redirect rejects with a missing end-session endpoint.
   */
  it('lets a rejected logout escape while keeping the admin page visible', async () => {
    const errors = captureUnhandledRxErrors();
    const failure = new Error('No end session endpoint');
    const logoutCalled = vi.fn();
    const { fixture } = await renderAdmin({
      system: ['ViewUsers'],
      logout: () => {
        logoutCalled();
        return Promise.reject(failure);
      },
    });

    TestBed.inject(NgZone).run(() => fixture.componentInstance.logout());
    await flush();
    await flush();

    expect(logoutCalled).toHaveBeenCalledTimes(1);
    expect(errors).toEqual([failure]);
    expect(within(fixture.nativeElement).getByRole('button', { name: 'Users' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  /**
   * Verifies: the component joins the SignalR system group on creation and leaves it on destroy.
   * Interacts with: SignalRService stub spies.
   * Data: default render, then fixture destroy.
   */
  it('joins the system hub group while it is open', async () => {
    const { signalR, fixture } = await renderAdmin();
    expect(signalR.joinSystem).toHaveBeenCalledTimes(1);

    fixture.destroy();

    expect(signalR.leaveSystem).toHaveBeenCalledTimes(1);
  });
});
