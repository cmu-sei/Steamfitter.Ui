// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Routes } from '@angular/router';
import { ComnAuthGuardService } from '@cmusei/crucible-common';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home-app/home-app.component').then(
        (m) => m.HomeAppComponent,
      ),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'view',
    loadComponent: () =>
      import('./components/home-app/home-app.component').then(
        (m) => m.HomeAppComponent,
      ),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin-container/admin-container.component').then(
        (m) => m.AdminContainerComponent,
      ),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'view/:viewId',
    loadComponent: () =>
      import('./components/manual-tasks-page/manual-tasks-page.component').then(
        (m) => m.ManualTasksPageComponent,
      ),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'scenario/:scenarioId',
    loadComponent: () =>
      import('./components/manual-tasks-page/manual-tasks-page.component').then(
        (m) => m.ManualTasksPageComponent,
      ),
    canActivate: [ComnAuthGuardService],
  },
];
