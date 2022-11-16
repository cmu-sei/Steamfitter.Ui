// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, HostBinding, OnDestroy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ComnAuthQuery, ComnAuthService, Theme } from '@cmusei/crucible-common';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  @HostBinding('class') componentCssClass: string;
  theme$: Observable<Theme> = this.authQuery.userTheme$;
  private paramTheme;
  unsubscribe$: Subject<null> = new Subject<null>();

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private overlayContainer: OverlayContainer,
    private authQuery: ComnAuthQuery,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: ComnAuthService
  ) {
    iconRegistry.setDefaultFontSetClass('mdi');

    iconRegistry.addSvgIcon(
      'monitor',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/monitor.svg')
    );
    iconRegistry.addSvgIcon(
      'ic_clear',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/ic_clear.svg')
    );
    iconRegistry.addSvgIcon(
      'monkey_wrench',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/monkey_wrench.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_cancel_circle',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_cancel_circle.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_back_arrow',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_back_arrow.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_magnify_search',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_magnify_glass.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_chevron_down',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_chevron_down.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_chevron_right',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_chevron_right.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_square_edit_outline_48px',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_square_edit_outline_48px.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_plus_circle_outline',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_plus_circle_outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_trash_can',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_trash_can.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_expand_more',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_expand_more.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'build_24px',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/build-24px.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'history',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/history.svg')
    );
    iconRegistry.addSvgIcon(
      'menu',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/menu.svg')
    );
    iconRegistry.addSvgIcon(
      'playlist_play',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/playlist_play.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'input',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/input.svg')
    );
    iconRegistry.addSvgIcon(
      'play_circle_outline',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/play_circle_outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'open_in_new',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/open-in-new.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'content_paste',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/content_paste.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_clipboard_copy',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_clipboard_copy.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'storage',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/storage.svg')
    );
    iconRegistry.addSvgIcon(
      'check_box_outline_blank',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/check_box_outline_blank.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'check_box',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/check_box.svg')
    );
    iconRegistry.addSvgIcon(
      'ic_chevron_left',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_chevron_left.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'time',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/alarm.svg')
    );
    iconRegistry.addSvgIcon(
      'alert_outline',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/alert-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'error',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/alert-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'completion',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/check-circle-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'succeeded',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/star-circle-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'success',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/star-circle-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'clock_time_three_outline',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/clock-time-three-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'failed',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/close-circle-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'failure',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/close-circle-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'manual',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/gesture-tap-button.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'expiration',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/clock-alert-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'expired',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/clock-alert-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'send',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/send.svg')
    );
    iconRegistry.addSvgIcon(
      'pending',
      sanitizer.bypassSecurityTrustResourceUrl('assets/svg-icons/z-wave.svg')
    );
    iconRegistry.addSvgIcon(
      'queued',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/clock-time-three-outline.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'account_multiple',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/account-multiple.svg'
      )
    );
    iconRegistry.addSvgIcon(
      'ic_crucible_steamfitter',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/svg-icons/ic_crucible_steamfitter.svg'
      )
    );

    this.theme$.pipe(takeUntil(this.unsubscribe$)).subscribe((theme) => {
      if (this.paramTheme && this.paramTheme !== theme) {
        this.router.navigate([], {
          queryParams: { theme: theme },
          queryParamsHandling: 'merge',
        });
      }
      this.setTheme(theme);
    });
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        const theme = params.get('theme');

        if (theme != null) {
          this.paramTheme = theme === Theme.DARK ? Theme.DARK : Theme.LIGHT;
          this.authService.setUserTheme(this.paramTheme);
        }
      });

  }

  setTheme(theme: Theme) {
    const classList = this.overlayContainer.getContainerElement().classList;
    switch (theme) {
      case Theme.LIGHT:
        this.componentCssClass = theme;
        classList.add(theme);
        classList.remove(Theme.DARK);
        break;
      case Theme.DARK:
        this.componentCssClass = theme;
        classList.add(theme);
        classList.remove(Theme.LIGHT);
    }
  }

  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
}
