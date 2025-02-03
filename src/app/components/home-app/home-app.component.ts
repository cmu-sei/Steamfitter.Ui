// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import {
  ComnSettingsService,
  Theme,
  ComnAuthQuery,
  ComnAuthService,
} from '@cmusei/crucible-common';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { UserDataService } from '../../data/user/user-data.service';
import { CurrentUserQuery } from 'src/app/data/user/user.query';
import { CurrentUserState } from 'src/app/data/user/user.store';
import { TopbarView } from './../shared/top-bar/topbar.models';
import { HealthService } from 'src/app/generated/steamfitter.api';
import { SystemPermission } from 'src/app/generated/steamfitter.api';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

enum Section {
  taskBuilder = 'Tasks',
  history = 'History',
  scenarioTemplates = 'Scenario Templates',
  scenarios = 'Scenarios',
}

@Component({
  selector: 'app-home-app',
  templateUrl: './home-app.component.html',
  styleUrls: ['./home-app.component.scss'],
})
export class HomeAppComponent implements OnDestroy, OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;
  apiIsSick = false;
  apiMessage = 'The API web service is not responding.';
  titleText = 'Steamfitter';
  section = Section;
  selectedSection: Section;
  loggedInUser = this.currentUserQuery.select();
  currentUser$: Observable<CurrentUserState>;
  isSuperUser = false;
  isAuthorizedUser = false;
  isSidebarOpen = true;
  viewList = this.playerDataService.viewList;
  private unsubscribe$ = new Subject();
  hideTopbar = false;
  topbarColor = '#BB0000';
  topbarTextColor = '#FFFFFF';
  TopbarView = TopbarView;
  theme$: Observable<Theme>;
  username: string;
  readonly SystemPermission = SystemPermission;
  permissions: SystemPermission[] = [];

  constructor(
    private currentUserQuery: CurrentUserQuery,
    private authService: ComnAuthService,
    private userDataService: UserDataService,
    private router: Router,
    activatedRoute: ActivatedRoute,
    private playerDataService: PlayerDataService,
    private settingsService: ComnSettingsService,
    private signalRService: SignalRService,
    private healthService: HealthService,
    private authQuery: ComnAuthQuery,
    private permissionDataService: PermissionDataService
  ) {
    this.healthCheck();

    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();

    this.playerDataService.getViewsFromApi();
    activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        this.selectedSection = (params.get('tab') ||
          Section.taskBuilder) as Section;
      });
    this.signalRService.joinSystem();

    // Set the display settings from config file
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor
      ? this.settingsService.settings.AppTopBarHexTextColor
      : this.topbarTextColor;
    this.titleText = this.settingsService.settings.AppTitle
      ? this.settingsService.settings.AppTitle
      : this.titleText;
  }

  ngOnInit() {
    this.currentUserQuery
      .select()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cu) => {
        this.username = cu.name;
        this.isAuthorizedUser = !!cu.id;
      });
    this.userDataService.setCurrentUser();
    this.permissionDataService
      .load()
      .subscribe(
        (x) => (this.permissions = this.permissionDataService.permissions)
      );
  }

  selectTab(section: Section) {
    this.router.navigate([], {
      queryParams: { tab: section },
      queryParamsHandling: 'merge',
    });
  }

  sidenavToggleFn() {
    this.sidenav.toggle();
  }

  logout() {
    this.authService.logout();
  }

  inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  healthCheck() {
    this.healthService.healthGetReadiness('body').subscribe(
      (message) => {
        this.apiIsSick = message !== 'Healthy';
        this.apiMessage = message;
      },
      (error) => {
        this.apiIsSick = true;
      }
    );
  }

  ngOnDestroy() {
    this.signalRService.leaveSystem();
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
