// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { ComnSettingsService, Theme, ComnAuthQuery } from '@cmusei/crucible-common';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { UserDataService } from '../../data/user/user-data.service';
import { TopbarView } from './../shared/top-bar/topbar.models';

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
export class HomeAppComponent implements OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenav;
  titleText = 'Steamfitter';
  section = Section;
  selectedSection: Section;
  loggedInUser = this.userDataService.loggedInUser;
  isSuperUser = false;
  isAuthorizedUser = false;
  isSidebarOpen = true;
  viewList = this.playerDataService.viewList;
  private unsubscribe$ = new Subject();
  topbarColor = '#ef3a47';
  topbarTextColor = '#FFFFFF';
  TopbarView = TopbarView;
  theme$: Observable<Theme>;

  constructor(
    private userDataService: UserDataService,
    private router: Router,
    activatedRoute: ActivatedRoute,
    private playerDataService: PlayerDataService,
    private settingsService: ComnSettingsService,
    private signalRService: SignalRService,
    private authQuery: ComnAuthQuery
  ) {

    this.theme$ = this.authQuery.userTheme$;

    this.playerDataService.getViewsFromApi();
    activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        this.selectedSection = (params.get('tab') ||
          Section.taskBuilder) as Section;
      });
    this.userDataService.isSuperUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isSuper) => {
        this.isSuperUser = isSuper;
      });
    this.userDataService.isAuthorizedUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isAuthorized) => {
        this.isAuthorizedUser = isAuthorized;
      });
    this.signalRService.startConnection();

    // Set the display settings from config file
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor ? this.settingsService.settings.AppTopBarHexColor : this.topbarColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor ? this.settingsService.settings.AppTopBarHexTextColor : this.topbarTextColor;
    this.titleText = this.settingsService.settings.AppTitle ? this.settingsService.settings.AppTitle : this.titleText;
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
    this.userDataService.logout();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
