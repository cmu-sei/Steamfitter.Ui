// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import {
  MatSidenavContainer,
  MatSidenav,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem, MatListItemIcon } from '@angular/material/list';
import { NgClass, AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { TopbarComponent } from '../../shared/top-bar/topbar.component';
import { AdminScenarioTemplatesComponent } from '../admin-scenario-templates/admin-scenario-templates.component';
import { AdminScenariosComponent } from '../admin-scenarios/admin-scenarios.component';
import { AdminUsersComponent } from '../admin-users/admin-users.component';
import { AdminRolesComponent } from '../admin-roles/admin-roles.component';
import { AdminGroupsComponent } from '../admin-groups/admin-groups.component';

@Component({
  selector: 'app-admin-container',
  templateUrl: './admin-container.component.html',
  styleUrls: ['./admin-container.component.scss'],
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatToolbar,
    RouterLink,
    MatIcon,
    MatList,
    MatListItem,
    NgClass,
    MatListItemIcon,
    MatIconButton,
    MatSidenavContent,
    TopbarComponent,
    AdminScenarioTemplatesComponent,
    AdminScenariosComponent,
    AdminUsersComponent,
    AdminRolesComponent,
    AdminGroupsComponent,
    AsyncPipe,
  ],
})
export class AdminContainerComponent implements OnDestroy, OnInit {
  private router = inject(Router);
  private userDataService = inject(UserDataService);
  private routerQuery = inject(RouterQuery);
  private permissionDataService = inject(PermissionDataService);
  private settingsService = inject(ComnSettingsService);
  private authService = inject(ComnAuthService);
  private authQuery = inject(ComnAuthQuery);
  private signalRService = inject(SignalRService);
  private currentUserQuery = inject(CurrentUserQuery);

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
  theme$: Observable<Theme>;
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor() {
    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();
    this.signalRService.joinSystem();
  }

  ngOnInit() {
    // Set the page title from configuration file
    this.titleText = this.settingsService.settings.AppTopBarText;
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
        }
      });

    this.permissionDataService.load().subscribe((x) => {
      this.permissions = this.permissionDataService.permissions;
      // Set default section if none is selected
      if (!this.showSection) {
        if (this.canViewScenarioTemplateList()) {
          this.showSection = this.scenarioTemplatesText;
        } else if (this.canViewScenarioList()) {
          this.showSection = this.scenariosText;
        } else if (this.permissions.includes(SystemPermission.ViewUsers)) {
          this.showSection = this.usersText;
        } else if (this.permissions.includes(SystemPermission.ViewRoles)) {
          this.showSection = this.rolesText;
        } else if (this.permissions.includes(SystemPermission.ViewGroups)) {
          this.showSection = this.groupsText;
        }
      }
    });
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

  getSelectedClass(section: string) {
    if (section === this.showSection) {
      return 'selected-item';
    } else {
      return 'showhand';
    }
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
