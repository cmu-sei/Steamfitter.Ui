// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EMPTY, of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
  ComnAuthQuery,
  ComnAuthService,
  ComnSettingsService,
  CrucibleDialogService,
  Theme,
} from '@cmusei/crucible-common';
import { AnyProvider, mergeProviders, unstubbed } from './unstubbed';

// 1. App services that components inject. Stores, queries and data services
//    (src/app/data/**, NewTaskService) stay REAL: they are the state under test.
import { ErrorService } from '../services/error/error.service';
import { SignalRService } from '../services/signalr/signalr.service';
import { SystemMessageService } from '../services/system-message/system-message.service';

// 2. Every generated API service under src/app/generated/steamfitter.api.
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

// 3. RouterQuery: steamfitter.ui uses @datorama/akita-ng-router-store.
import { RouterQuery } from '@datorama/akita-ng-router-store';

// 4. BASE_PATH: no data or hub service injects it.

// 5. Common-library services components inject: CrucibleDialogService (list
//    components confirm deletes and starts through it).

export function getDefaultProviders(
  overrides?: readonly AnyProvider[],
): AnyProvider[] {
  const defaults: AnyProvider[] = [
    // App services
    unstubbed(SignalRService),
    { provide: ErrorService, useValue: { handleError: () => {} } },
    unstubbed(SystemMessageService),

    // Generated API services: one `unstubbed(...)` per service. A test that
    // needs an endpoint passes `{ provide: XService, useValue: xApi }` built
    // with `satisfies ApiStub<XService>`.
    unstubbed(GroupService),
    unstubbed(HealthService),
    unstubbed(PlayerService),
    unstubbed(ResultService),
    unstubbed(ScenarioMembershipsService),
    unstubbed(ScenarioPermissionsService),
    unstubbed(ScenarioRolesService),
    unstubbed(ScenarioService),
    unstubbed(ScenarioTemplateMembershipsService),
    unstubbed(ScenarioTemplatePermissionsService),
    unstubbed(ScenarioTemplateRolesService),
    unstubbed(ScenarioTemplateService),
    unstubbed(SystemPermissionsService),
    unstubbed(SystemRolesService),
    unstubbed(TaskService),
    unstubbed(UserService),
    unstubbed(VmCredentialService),

    // Akita router
    {
      provide: RouterQuery,
      useValue: {
        selectQueryParams: () => of(null),
        select: () => of(null),
        getParams: () => undefined,
      },
    },

    // Common library
    unstubbed(CrucibleDialogService),
    {
      provide: ComnSettingsService,
      useValue: {
        settings: {
          ApiUrl: '',
          // 6. The keys steamfitter.ui reads from settings.json.
          AppTitle: 'Steamfitter',
          AppTopBarText: 'Steamfitter',
          AppTopBarHexColor: '#000000',
          AppTopBarHexTextColor: '#FFFFFF',
        },
      },
    },
    {
      provide: ComnAuthService,
      useValue: {
        isAuthenticated$: of(true),
        // No signed-in user until a test supplies one.
        user$: EMPTY,
        getAuthorizationToken: () => 'test-token',
        logout: () => {},
        setUserTheme: () => {},
      },
    },
    {
      provide: ComnAuthQuery,
      useValue: {
        userTheme$: of(Theme.LIGHT),
        isLoggedIn$: of(true),
      },
    },

    // Dialog tokens
    { provide: MAT_DIALOG_DATA, useValue: {} },
    {
      provide: MatDialogRef,
      useValue: {
        close: () => {},
        beforeClosed: () => EMPTY,
        afterClosed: () => EMPTY,
        keydownEvents: () => EMPTY,
      },
    },

    // Router
    {
      provide: ActivatedRoute,
      useValue: {
        params: of({}),
        paramMap: of(convertToParamMap({})),
        queryParams: of({}),
        queryParamMap: of(convertToParamMap({})),
        snapshot: {
          params: {},
          paramMap: convertToParamMap({}),
          queryParams: {},
          queryParamMap: convertToParamMap({}),
        },
      },
    },
  ];

  return mergeProviders(defaults, overrides);
}
