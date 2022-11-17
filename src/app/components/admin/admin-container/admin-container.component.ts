// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { PermissionService } from 'src/app/generated/steamfitter.api/api/api';
import {
  Permission,
  User,
  UserPermission,
} from 'src/app/generated/steamfitter.api/model/models';
import { UserDataService } from '../../../data/user/user-data.service';
import { TopbarView } from './../../shared/top-bar/topbar.models';
import {
  ComnSettingsService,
  ComnAuthQuery,
  Theme,
} from '@cmusei/crucible-common';

@Component({
  selector: 'app-admin-container',
  templateUrl: './admin-container.component.html',
  styleUrls: ['./admin-container.component.scss'],
})
export class AdminContainerComponent implements OnDestroy {
  loggedInUser = this.userDataService.loggedInUser;
  usersText = 'Users';
  showSection: Observable<string>;
  isSidebarOpen = true;
  isSuperUser = false;
  userList: Observable<User[]>;
  filterControl: FormControl = this.userDataService.filterControl;
  filterString: Observable<string>;
  permissionList: Observable<Permission[]>;
  pageSize: Observable<number>;
  pageIndex: Observable<number>;
  private unsubscribe$ = new Subject();
  TopbarView = TopbarView;
  hideTopbar = false;
  topbarColor = '#BB0000';
  topbarTextColor = '#FFFFFF';
  theme$: Observable<Theme>;

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    activatedRoute: ActivatedRoute,
    private permissionService: PermissionService,
    private settingsService: ComnSettingsService,
    private authQuery: ComnAuthQuery
  ) {
    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();

    this.userDataService.isSuperUser
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((result) => {
        this.isSuperUser = result;
        if (!result) {
          router.navigate(['/']);
        }
      });
    this.userList = this.userDataService.userList;
    this.permissionList = this.permissionService.getPermissions();
    this.filterString = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('filter') || '')
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pagesize') || '20', 10))
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pageindex') || '0', 10))
    );
    this.showSection = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('section') || this.usersText)
    );
    this.userDataService.getUsersFromApi();
    this.userDataService
      .getPermissionsFromApi()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe();
    this.gotoUserSection();
    // Set the display settings from config file
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.topbarTextColor = this.settingsService.settings.AppTopBarHexTextColor
      ? this.settingsService.settings.AppTopBarHexTextColor
      : this.topbarTextColor;
  }

  gotoUserSection() {
    this.router.navigate([], {
      queryParams: { section: this.usersText },
      queryParamsHandling: 'merge',
    });
  }

  logout() {
    this.userDataService.logout();
  }

  inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  selectUser(userId: string) {
    this.router.navigate([], {
      queryParams: { userId: userId },
      queryParamsHandling: 'merge',
    });
  }

  addUserHandler(user: User) {
    this.userDataService.addUser(user);
  }

  deleteUserHandler(user: User) {
    this.userDataService.deleteUser(user);
  }

  addUserPermissionHandler(userPermission: UserPermission) {
    this.userDataService.addUserPermission(userPermission);
  }

  removeUserPermissionHandler(userPermission: UserPermission) {
    this.userDataService.deleteUserPermission(userPermission);
  }

  sortChangeHandler(sort: Sort) {
    this.router.navigate([], {
      queryParams: { sorton: sort.active, sortdir: sort.direction },
      queryParamsHandling: 'merge',
    });
  }

  pageChangeHandler(page: PageEvent) {
    this.router.navigate([], {
      queryParams: { pageindex: page.pageIndex, pagesize: page.pageSize },
      queryParamsHandling: 'merge',
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
