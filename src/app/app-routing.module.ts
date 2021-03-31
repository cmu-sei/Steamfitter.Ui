// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComnAuthGuardService } from '@cmusei/crucible-common';
import { AdminContainerComponent } from './components/admin/admin-container/admin-container.component';
import { HomeAppComponent } from './components/home-app/home-app.component';
import { ManualTasksPageComponent } from './components/manual-tasks-page/manual-tasks-page.component';

export const ROUTES: Routes = [
  {
    path: '',
    component: HomeAppComponent,
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'view',
    component: HomeAppComponent,
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'admin',
    component: AdminContainerComponent,
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'view/:viewId',
    component: ManualTasksPageComponent,
    canActivate: [ComnAuthGuardService],
  },
];

@NgModule({
  exports: [RouterModule],
  imports: [
    CommonModule,
    RouterModule.forRoot(ROUTES, { relativeLinkResolution: 'legacy' }),
  ],
})
export class AppRoutingModule {}
