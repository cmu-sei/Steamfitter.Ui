// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { PermissionService } from 'src/app/data/permission/permission-data.service';
import { SystemPermission } from 'src/app/generated/steamfitter.api';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { TopbarView } from './../../shared/top-bar/topbar.models';
import {
  ComnSettingsService,
  ComnAuthQuery,
  ComnAuthService,
  Theme,
} from '@cmusei/crucible-common';

@Component({
  selector: 'app-admin-container',
  templateUrl: './admin-container.component.html',
  styleUrls: ['./admin-container.component.scss'],
})
export class AdminContainerComponent implements OnDestroy {
  usersText = 'Users';
  showSection: Observable<string>;
  isSidebarOpen = true;
  isSuperUser = false;
  private unsubscribe$ = new Subject();
  TopbarView = TopbarView;
  hideTopbar = false;
  topbarColor = '#BB0000';
  topbarTextColor = '#FFFFFF';
  theme$: Observable<Theme>;
  public permissions$ = this.permissionService.permissions$;
  readonly SystemPermission = SystemPermission;

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    activatedRoute: ActivatedRoute,
    private permissionService: PermissionService,
    private settingsService: ComnSettingsService,
    private authService: ComnAuthService,
    private authQuery: ComnAuthQuery
  ) {
    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();

    this.showSection = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('section') || this.usersText)
    );
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
    this.authService.logout();
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
