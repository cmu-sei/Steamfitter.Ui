// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { ComnAuthService } from '@cmusei/crucible-common';
import {
  HealthService,
  HealthStatus,
  PlayerService,
  SystemPermission,
  SystemPermissionsService,
  UserService,
} from 'src/app/generated/steamfitter.api';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { permissionApiStubs } from 'src/app/test-utils/mock-permission-data.service';
import { TopbarView } from '../shared/top-bar/topbar.models';
import { HomeAppComponent } from './home-app.component';

@Component({ selector: 'app-topbar', template: '', standalone: false })
class TopbarStubComponent {
  @Input() title?: string;
  @Input() topbarView?: TopbarView;
}

@Component({ selector: 'app-scenarios', template: '', standalone: false })
class ScenariosStubComponent {
  @Input() filterString?: string;
  @Input() paginator?: unknown;
  @Input() selectedStatuses?: string[];
}

@Component({
  selector: 'app-scenario-templates',
  template: '',
  standalone: false,
})
class ScenarioTemplatesStubComponent {
  @Input() filterString?: string;
  @Input() paginator?: unknown;
}

@Component({ selector: 'app-vm-task-execute', template: '', standalone: false })
class VmTaskExecuteStubComponent {}

@Component({ selector: 'app-history', template: '', standalone: false })
class HistoryStubComponent {
  @Input() filterString?: string;
  @Input() paginator?: unknown;
  @Input() historyView?: string;
  @Input() selectedUser?: unknown;
  @Input() selectedView?: unknown;
  @Input() selectedVm?: unknown;
}

type OidcUser =
  ComnAuthService['user$'] extends Observable<infer U> ? U : never;
const signedIn = { profile: { name: 'Ada', sub: 'u1' } } as OidcUser;

async function renderHome(
  overrides: {
    system?: SystemPermission[];
    tab?: string;
    health?: HealthStatus;
    user$?: Observable<OidcUser>;
    systemPermissionsApi?: ApiStub<SystemPermissionsService>;
    userApi?: ApiStub<UserService>;
  } = {},
) {
  const {
    system = [],
    tab,
    health = 'Healthy',
    user$ = of(signedIn),
  } = overrides;
  const auth: Pick<ComnAuthService, 'user$' | 'logout'> = {
    user$,
    logout: vi.fn(() => Promise.resolve()),
  };
  const signalR: Pick<SignalRService, 'joinSystem' | 'leaveSystem'> = {
    joinSystem: vi.fn(),
    leaveSystem: vi.fn(),
  };
  // HomeAppComponent loads the system permissions itself (ngOnInit), so the
  // real PermissionDataService runs over the stubbed endpoint, not primed.
  const permissionApi = permissionApiStubs({ system });
  // Only the route is a stub: routerLink needs the real Router.
  // PlayerDataService (a real dependency here) reads the initial viewId from
  // the route snapshot at construction; the stub's snapshot is live.
  const { route } = activatedRouteStub(tab ? { tab } : {});

  const rendered = await renderComponent(HomeAppComponent, {
    declarations: [
      HomeAppComponent,
      TopbarStubComponent,
      ScenariosStubComponent,
      ScenarioTemplatesStubComponent,
      VmTaskExecuteStubComponent,
      HistoryStubComponent,
    ],
    imports: [
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      MatFormFieldModule,
      MatSelectModule,
      MatInputModule,
      MatPaginatorModule,
    ],
    providers: [
      {
        provide: SystemPermissionsService,
        useValue:
          overrides.systemPermissionsApi ?? permissionApi.systemPermissions,
      },
      { provide: ComnAuthService, useValue: auth },
      { provide: SignalRService, useValue: signalR },
      { provide: ActivatedRoute, useValue: route },
      {
        provide: HealthService,
        useValue: {
          healthGetReadiness: () => of(health),
        } satisfies ApiStub<HealthService>,
      },
      {
        provide: PlayerService,
        useValue: { getViews: () => of([]) } satisfies ApiStub<PlayerService>,
      },
      {
        provide: UserService,
        useValue:
          overrides.userApi ??
          ({ getUsers: () => of([]) } satisfies ApiStub<UserService>),
      },
    ],
  });
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);
  const user = userEvent.setup();
  const panels = {
    scenarios: ScenariosStubComponent,
    templates: ScenarioTemplatesStubComponent,
    tasks: VmTaskExecuteStubComponent,
    history: HistoryStubComponent,
  };
  const renderedPanels = () =>
    (Object.keys(panels) as Array<keyof typeof panels>).filter((key) =>
      rendered.fixture.debugElement.query(By.directive(panels[key])),
    );
  const sectionMenu = async () => {
    await user.click(screen.getByRole('button', { name: /^My / }));
    await screen.findByRole('menuitem', { name: 'History' });
    return screen
      .getAllByRole('menuitem')
      .map((item) => item.textContent?.trim());
  };
  return {
    ...rendered,
    user,
    navigate,
    signalR,
    sectionMenu,
    renderedPanels,
    permissionApi,
  };
}

describe('HomeAppComponent', () => {
  /**
   * Verifies: the section menu lists only the sections the system permissions allow; History is always offered.
   * Interacts with: real PermissionDataService (canViewScenarioList/canViewScenarioTemplateList, ManageTasks) over the stubbed getMySystemPermissions, MatMenu.
   * Data: each permission set in the table with its expected menu; the denied sections get a near miss (another system permission).
   */
  it.each([
    { system: ['ViewUsers', 'ManageGroups'], items: ['History'] },
    { system: ['ViewScenarios'], items: ['Scenarios', 'History'] },
    {
      system: ['CreateScenarioTemplates'],
      items: ['Scenario Templates', 'History'],
    },
    { system: ['ManageTasks'], items: ['Tasks', 'History'] },
    {
      system: ['ExecuteScenarios', 'EditScenarioTemplates', 'ManageTasks'],
      items: ['Scenarios', 'Scenario Templates', 'Tasks', 'History'],
    },
  ] as Array<{ system: SystemPermission[]; items: string[] }>)(
    'offers $items for $system',
    async ({ system, items }) => {
      const { sectionMenu, permissionApi } = await renderHome({ system });
      expect(
        permissionApi.systemPermissions.getMySystemPermissions,
      ).toHaveBeenCalled();
      expect(await sectionMenu()).toEqual(items);
    },
  );

  /**
   * Verifies: the default Scenarios tab shows the scenario list only to users who may view scenarios.
   * Interacts with: the tab content gates, stub child panels.
   * Data: ViewScenarios vs. ViewScenarioTemplates (the near miss), with no tab in the URL.
   */
  it.each([
    { system: ['ViewScenarios'], panels: ['scenarios'] },
    { system: ['ViewScenarioTemplates'], panels: [] },
  ] as Array<{ system: SystemPermission[]; panels: string[] }>)(
    'renders $panels on the default tab for $system',
    async ({ system, panels }) => {
      const { renderedPanels } = await renderHome({ system });
      expect(
        screen.getByRole('button', { name: 'My Scenarios' }),
      ).toBeInTheDocument();
      expect(renderedPanels()).toEqual(panels);
    },
  );

  /**
   * Verifies: a tab named in the URL renders its content only when permitted.
   * Interacts with: ActivatedRoute queryParamMap (fake), tab content gates, stub child panels.
   * Data: tab=Tasks with ManageTasks and with ManageScenarios (near miss); tab=Scenario Templates with ViewScenarioTemplates and with ViewScenarios (near miss); tab=History, which is not gated.
   */
  it.each([
    { tab: 'Tasks', system: ['ManageTasks'], panels: ['tasks'] },
    { tab: 'Tasks', system: ['ManageScenarios'], panels: [] },
    {
      tab: 'Scenario Templates',
      system: ['ViewScenarioTemplates'],
      panels: ['templates'],
    },
    { tab: 'Scenario Templates', system: ['ViewScenarios'], panels: [] },
    { tab: 'History', system: ['ViewUsers'], panels: ['history'] },
  ] as Array<{
    tab: string;
    system: SystemPermission[];
    panels: string[];
  }>)(
    'renders $panels on the $tab tab for $system',
    async ({ tab, system, panels }) => {
      const { renderedPanels } = await renderHome({ tab, system });
      expect(renderedPanels()).toEqual(panels);
    },
  );

  /**
   * Verifies: the Administration button needs a View* system permission.
   * Interacts with: real PermissionDataService.canViewAdiminstration.
   * Data: ViewGroups vs. ManageGroups + ManageTasks.
   */
  it.each([
    { system: ['ViewGroups'], shown: true },
    { system: ['ManageGroups', 'ManageTasks'], shown: false },
  ] as Array<{ system: SystemPermission[]; shown: boolean }>)(
    'shows the Administration button = $shown for $system',
    async ({ system, shown }) => {
      await renderHome({ system });
      const admin = screen.queryByRole('button', {
        name: 'Show Administration Page',
      });
      expect(admin !== null).toBe(shown);
    },
  );

  /**
   * Verifies: nothing but the top bar renders until a signed-in user is known.
   * Interacts with: real UserDataService.setCurrentUser over a ComnAuthService.user$ that never emits.
   * Data: ViewScenarios only; no user.
   */
  it('waits for a signed-in user before showing the page', async () => {
    // NEVER on purpose: the auth service has not produced a user yet.
    await renderHome({ system: ['ViewScenarios'], user$: NEVER });
    expect(
      screen.queryByRole('button', { name: /^My / }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: an unhealthy API replaces the page with the health message.
   * Interacts with: HealthService.healthGetReadiness stub.
   * Data: readiness 'Degraded'.
   */
  it('shows the API health message instead of the page when the API is not healthy', async () => {
    await renderHome({ system: ['ViewScenarios'], health: 'Degraded' });
    expect(
      screen.getByRole('heading', { name: 'Degraded' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^My / }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: a failed user or permission load on page open lets the API error escape unhandled (current behavior).
   * Interacts with: UserService.getUsers or SystemPermissionsService.getMySystemPermissions failing, real UserDataService and PermissionDataService, captureUnhandledRxErrors.
   * Data: one row per call site; the failing endpoint throws a 500.
   */
  it.each([
    {
      site: 'userDataService.load()',
      failing: (failure: Error) => ({
        userApi: {
          getUsers: () => throwError(() => failure),
        } satisfies ApiStub<UserService>,
      }),
    },
    {
      site: 'permissionDataService.load()',
      failing: (failure: Error) => ({
        systemPermissionsApi: {
          getMySystemPermissions: () => throwError(() => failure),
        } satisfies ApiStub<SystemPermissionsService>,
      }),
    },
  ])('lets a failed $site escape unhandled', async ({ failing }) => {
    const errors = captureUnhandledRxErrors();
    const failure = new Error('500');

    await renderHome({ system: ['ViewScenarios'], ...failing(failure) });
    await flush();

    expect(errors).toEqual([failure]);
  });

  /**
   * Verifies: choosing a section writes the tab to the URL and clears every selection param.
   * Interacts with: Router.navigate spy, the section menu.
   * Data: ManageTasks; the Tasks item is chosen.
   */
  it('selects a section through the URL and clears the selections', async () => {
    const { sectionMenu, user, navigate } = await renderHome({
      system: ['ManageTasks'],
    });
    await sectionMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Tasks' }));

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: {
        tab: 'Tasks',
        scenarioId: null,
        scenarioTemplateId: null,
        viewId: null,
        taskId: null,
        resultId: null,
      },
      queryParamsHandling: 'merge',
    });
  });

  /**
   * Verifies: the page joins the SignalR system group on creation and leaves it on destroy.
   * Interacts with: SignalRService stub spies.
   * Data: default render, then fixture destroy.
   */
  it('joins the system hub group while it is open', async () => {
    const { signalR, fixture } = await renderHome();
    expect(signalR.joinSystem).toHaveBeenCalledTimes(1);

    fixture.destroy();

    expect(signalR.leaveSystem).toHaveBeenCalledTimes(1);
  });
});
