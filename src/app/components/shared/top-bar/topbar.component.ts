// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
} from '@angular/core';
import { ComnAuthQuery, ComnAuthService, Theme } from '@cmusei/crucible-common';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CurrentUserQuery } from 'src/app/data/user/user.query';
import { CurrentUserState } from 'src/app/data/user/user.store';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { TopbarView } from './topbar.models';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatIconButton, MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatLabel } from '@angular/material/input';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbar,
    MatToolbarRow,
    MatIconButton,
    RouterLink,
    MatIcon,
    MatButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatSlideToggle,
    MatLabel,
    AsyncPipe,
  ],
})
export class TopbarComponent implements OnInit, OnDestroy {
  private authService = inject(ComnAuthService);
  private currentUserQuery = inject(CurrentUserQuery);
  private permissionDataService = inject(PermissionDataService);
  private authQuery = inject(ComnAuthQuery);

  readonly title = input<string>(undefined);
  readonly topbarView = input<TopbarView>(undefined);
  @Output() editView?: EventEmitter<any> = new EventEmitter<any>();
  currentUser$: Observable<CurrentUserState>;
  theme$: Observable<Theme>;
  unsubscribe$: Subject<null> = new Subject<null>();
  TopbarView = TopbarView;
  canViewAdmin = false;

  ngOnInit() {
    this.permissionDataService
      .load()
      .subscribe(
        (x) =>
          (this.canViewAdmin =
            this.permissionDataService.canViewAdiminstration()),
      );

    this.currentUser$ = this.currentUserQuery.select().pipe(
      filter((user) => user !== null),
      takeUntil(this.unsubscribe$),
    );

    this.theme$ = this.authQuery.userTheme$;
  }

  themeFn(event) {
    const theme = event.checked ? Theme.DARK : Theme.LIGHT;
    this.authService.setUserTheme(theme);
  }
  editFn(event) {
    this.editView.emit(event);
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
