// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  ComnAuthQuery,
  ComnAuthService,
  ComnSettingsService,
  Theme,
} from '@cmusei/crucible-common';
import { User as AuthUser } from 'oidc-client';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CurrentUserQuery } from 'src/app/data/user/user.query';
import { CurrentUserState } from 'src/app/data/user/user.store';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { TopbarView } from './topbar.models';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() title?: string;
  @Input() sidenav?;
  @Input() topbarColor?;
  @Input() topbarTextColor?;
  @Input() topbarView?: TopbarView;
  @Output() sidenavToggle?: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() editView?: EventEmitter<any> = new EventEmitter<any>();
  currentUser$: Observable<CurrentUserState>;
  theme$: Observable<Theme>;
  unsubscribe$: Subject<null> = new Subject<null>();
  TopbarView = TopbarView;
  canViewAdmin$ = this.permissionDataService.canViewAdiminstration();

  constructor(
    private authService: ComnAuthService,
    private currentUserQuery: CurrentUserQuery,
    private permissionDataService: PermissionDataService,
    private authQuery: ComnAuthQuery,
    private settingsService: ComnSettingsService
  ) {}

  ngOnInit() {
    this.permissionDataService.load().subscribe();

    this.currentUser$ = this.currentUserQuery.select().pipe(
      filter((user) => user !== null),
      takeUntil(this.unsubscribe$)
    );

    this.theme$ = this.authQuery.userTheme$;

    if (!this.topbarColor) {
      this.topbarColor = this.settingsService.settings.AppTopBarHexColor;
    }

    if (!this.topbarTextColor) {
      this.topbarTextColor =
        this.settingsService.settings.AppTopBarHexTextColor;
    }
  }

  themeFn(event) {
    const theme = event.checked ? Theme.DARK : Theme.LIGHT;
    this.authService.setUserTheme(theme);
  }
  editFn(event) {
    this.editView.emit(event);
  }

  sidenavToggleFn() {
    this.sidenavToggle.emit(!this.sidenav.opened);
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
