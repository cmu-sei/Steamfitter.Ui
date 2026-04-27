// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EnvironmentProviders, Provider, ProviderToken } from '@angular/core';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

// App Services
// NewTaskService intentionally omitted — its module initializer reads a generated
// enum that isn't emitted by the current OpenAPI generator settings, which would
// crash on import. Tests that need it can provide a stub in their own `providers`.
import { DialogService } from '../services/dialog/dialog.service';
import { ErrorService } from '../services/error/error.service';
import { SystemMessageService } from '../services/system-message/system-message.service';

// Data Services
import { GroupDataService } from '../data/group/group-data.service';
import { GroupMembershipService } from '../data/group/group-membership.service';
import { PermissionDataService } from '../data/permission/permission-data.service';
import { ResultDataService } from '../data/result/result-data.service';
import { RoleDataService } from '../data/role/role-data.service';
import { ScenarioDataService } from '../data/scenario/scenario-data.service';
import { ScenarioMembershipDataService } from '../data/scenario/scenario-membership-data.service';
import { ScenarioRoleDataService } from '../data/scenario/scenario-role-data.service';
import { ScenarioTemplateDataService } from '../data/scenario-template/scenario-template-data.service';
import { ScenarioTemplateMembershipDataService } from '../data/scenario-template/scenario-template-membership-data.service';
import { ScenarioTemplateRoleDataService } from '../data/scenario-template/scenario-template-role-data.service';
import { TaskDataService } from '../data/task/task-data.service';
import { UserDataService } from '../data/user/user-data.service';

// Generated API Services
import {
  GroupService,
  HealthService,
  PlayerService,
  ResultService,
  ScenarioMembershipsService,
  ScenarioPermissionsService,
  ScenarioRolesService,
  ScenarioService,
  ScenarioTemplateMembershipsService,
  ScenarioTemplatePermissionsService,
  ScenarioTemplateRolesService,
  ScenarioTemplateService,
  SystemPermissionsService,
  SystemRolesService,
  TaskService,
  UserService,
  VmCredentialService,
} from '../generated/steamfitter.api';

// Akita Router
import { RouterQuery } from '@datorama/akita-ng-router-store';

// Common library
import {
  ComnAuthQuery,
  ComnAuthService,
  ComnSettingsService,
} from '@cmusei/crucible-common';

type AnyProvider = Provider | EnvironmentProviders;

function getProvideToken(provider: AnyProvider): ProviderToken<unknown> | null {
  if (typeof provider === 'function') return provider as ProviderToken<unknown>;
  const withProvide = provider as { provide?: ProviderToken<unknown> };
  return withProvide.provide ?? null;
}

export function getDefaultProviders(
  overrides?: readonly AnyProvider[]
): AnyProvider[] {
  const defaults: Provider[] = [
    // App Services
    { provide: DialogService, useValue: { confirm: () => of(true) } },
    { provide: ErrorService, useValue: { handleError: () => {} } },
    { provide: SystemMessageService, useValue: {} },

    // Data Services
    { provide: GroupDataService, useValue: { load: () => of([]) } },
    { provide: GroupMembershipService, useValue: {} },
    { provide: PermissionDataService, useValue: { load: () => of([]) } },
    { provide: ResultDataService, useValue: { load: () => of([]) } },
    { provide: RoleDataService, useValue: { load: () => of([]) } },
    { provide: ScenarioDataService, useValue: { load: () => of([]) } },
    { provide: ScenarioMembershipDataService, useValue: {} },
    { provide: ScenarioRoleDataService, useValue: { load: () => of([]) } },
    { provide: ScenarioTemplateDataService, useValue: { load: () => of([]) } },
    { provide: ScenarioTemplateMembershipDataService, useValue: {} },
    {
      provide: ScenarioTemplateRoleDataService,
      useValue: { load: () => of([]) },
    },
    { provide: TaskDataService, useValue: { load: () => of([]) } },
    { provide: UserDataService, useValue: { load: () => of([]) } },

    // Generated API Services
    { provide: GroupService, useValue: {} },
    { provide: HealthService, useValue: { healthCheck: () => of({}) } },
    { provide: PlayerService, useValue: {} },
    { provide: ResultService, useValue: {} },
    { provide: ScenarioMembershipsService, useValue: {} },
    { provide: ScenarioPermissionsService, useValue: {} },
    { provide: ScenarioRolesService, useValue: {} },
    { provide: ScenarioService, useValue: {} },
    { provide: ScenarioTemplateMembershipsService, useValue: {} },
    { provide: ScenarioTemplatePermissionsService, useValue: {} },
    { provide: ScenarioTemplateRolesService, useValue: {} },
    { provide: ScenarioTemplateService, useValue: {} },
    { provide: SystemPermissionsService, useValue: {} },
    { provide: SystemRolesService, useValue: {} },
    { provide: TaskService, useValue: {} },
    { provide: UserService, useValue: {} },
    { provide: VmCredentialService, useValue: {} },

    // Akita Router
    {
      provide: RouterQuery,
      useValue: {
        selectQueryParams: () => of(null),
        select: () => of(null),
      },
    },

    // Common library services
    {
      provide: ComnSettingsService,
      useValue: {
        settings: {
          ApiUrl: '',
          AppTopBarText: 'Steamfitter',
          AppTopBarHexColor: '#0F1D47',
          AppTopBarHexTextColor: '#FFFFFF',
        },
      },
    },
    {
      provide: ComnAuthService,
      useValue: {
        isAuthenticated$: of(true),
        user$: of({}),
        logout: () => {},
      },
    },
    {
      provide: ComnAuthQuery,
      useValue: {
        userTheme$: of('light-theme'),
        isLoggedIn$: of(true),
      },
    },

    // Dialog tokens
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: { close: () => {} } },

    // Router
    {
      provide: ActivatedRoute,
      useValue: {
        params: of({}),
        paramMap: of({ get: () => null, has: () => false }),
        queryParams: of({}),
        queryParamMap: of({ get: () => null, has: () => false }),
        snapshot: {
          params: {},
          paramMap: { get: () => null, has: () => false },
        },
      },
    },
  ];

  if (!overrides?.length) return defaults;

  const overrideTokens = new Set(overrides.map(getProvideToken));
  const filtered = defaults.filter(
    (p) => !overrideTokens.has(getProvideToken(p))
  );
  return [...filtered, ...overrides];
}
