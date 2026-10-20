// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  enableProdMode,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableAkitaProdMode, persistState } from '@datorama/akita';

import { environment } from './environments/environment';
import { SystemMessageService } from './app/services/system-message/system-message.service';
import { UserDataService } from './app/data/user/user-data.service';
import { BASE_PATH } from './app/generated/steamfitter.api';
import {
  ComnSettingsService,
  provideCrucibleTheme,
  ComnAuthModule,
  ComnSettingsModule,
} from '@cmusei/crucible-common';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipDefaultOptions,
} from '@angular/material/tooltip';
import {
  provideNativeDateAdapter,
} from '@angular/material/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ROUTES } from './app/app.routes';
import { A11yModule } from '@angular/cdk/a11y';
import { AppComponent } from './app/app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export function getBasePath(settingsSvc: ComnSettingsService) {
  return settingsSvc.settings.ApiUrl;
}

/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 0,
  touchendHideDelay: 1000,
};

export const storage = persistState({
  key: 'akita-steamfitter-ui',
  include: ['auth.ui'],
});

if (environment.production) {
  enableProdMode();
  enableAkitaProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(
      environment.production ? [] : AkitaNgDevtools.forRoot(),
      AkitaNgRouterStoreModule,
      A11yModule,
      ComnAuthModule.forRoot(),
      ComnSettingsModule.forRoot(),
    ),
    SystemMessageService,
    UserDataService,
    {
      provide: BASE_PATH,
      useFactory: getBasePath,
      deps: [ComnSettingsService],
    },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults },
    provideNativeDateAdapter(),
    provideRouter(ROUTES),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    provideCrucibleTheme({ brand: { color: '#B1282F', text: '#FFFFFF' } }),
  ],
}).catch((err) => console.error(err));
