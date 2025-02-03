// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { SystemPermission } from 'src/app/generated/steamfitter.api';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { TopbarView } from './../../shared/top-bar/topbar.models';
import { RouterQuery } from '@datorama/akita-ng-router-store';
import {
  ComnSettingsService,
  ComnAuthQuery,
  ComnAuthService,
  Theme,
} from '@cmusei/crucible-common';
import { CurrentUserQuery } from 'src/app/data/user/user.query';
import { SignalRService } from 'src/app/services/signalr/signalr.service';

@Component({
  selector: 'app-admin-container',
  templateUrl: './admin-container.component.html',
  styleUrls: ['./admin-container.component.scss'],
})
export class AdminContainerComponent implements OnDestroy, OnInit {
  public username: string;
  public titleText: string;
  usersText = 'Users';
  rolesText = 'Roles';
  groupsText = 'Groups';
  scenarioTemplatesText = 'Scenario Templates';
  scenariosText = 'Scenarios';
  showSection = '';
  isSidebarOpen = true;
  private unsubscribe$ = new Subject();
  TopbarView = TopbarView;
  hideTopbar = false;
  topbarColor = '#BB0000';
  topbarTextColor = '#FFFFFF';
  theme$: Observable<Theme>;
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private routerQuery: RouterQuery,
    private permissionDataService: PermissionDataService,
    private settingsService: ComnSettingsService,
    private authService: ComnAuthService,
    private authQuery: ComnAuthQuery,
    private signalRService: SignalRService,
    private currentUserQuery: CurrentUserQuery
  ) {
    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();
    // Set the display settings from config file
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor
      ? this.settingsService.settings.AppTopBarHexTextColor
      : this.topbarTextColor;
    this.signalRService.joinSystem();
  }

  ngOnInit() {
    // Set the page title from configuration file
    this.titleText = this.settingsService.settings.AppTopBarText;
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor;
    this.currentUserQuery
      .select()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((cu) => {
        this.username = cu.name;
      });
    this.userDataService.setCurrentUser();

    this.routerQuery
      .selectQueryParams<string>('section')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((section) => {
        if (section != null) {
          this.showSection = section;
          this.navigateToSection(section);
        }
      });

    this.permissionDataService
      .load()
      .subscribe(
        (x) => (this.permissions = this.permissionDataService.permissions)
      );
  }

  canViewScenarioTemplateList(): boolean {
    return this.permissionDataService.canViewScenarioTemplateList();
  }

  canViewScenarioList(): boolean {
    return this.permissionDataService.canViewScenarioList();
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

  /**
   * Set the display to Users
   */
  adminGotoUsers(): void {
    this.navigateToSection(this.usersText);
  }

  /**
   * Sets the display to Roles
   */
  adminGotoRoles(): void {
    this.navigateToSection(this.rolesText);
  }

  /**
   * Sets the display to Groups
   */
  adminGotoGroups(): void {
    this.navigateToSection(this.groupsText);
  }

  /**
   * Sets the display to ScenarioTemplates
   */
  adminGotoScenarioTemplates(): void {
    this.navigateToSection(this.scenarioTemplatesText);
  }

  /**
   * Sets the display to Scenarios
   */
  adminGotoScenarios(): void {
    this.navigateToSection(this.scenariosText);
  }

  private navigateToSection(sectionName: string) {
    this.router.navigate([], {
      queryParams: { section: sectionName },
      queryParamsHandling: 'merge',
    });
  }

  ngOnDestroy() {
    this.signalRService.leaveSystem();
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
