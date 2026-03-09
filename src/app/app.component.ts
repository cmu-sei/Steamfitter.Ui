// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, HostBinding, OnDestroy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  ComnAuthQuery,
  ComnAuthService,
  ComnSettingsService,
  Theme,
} from '@cmusei/crucible-common';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnDestroy {
  @HostBinding('class') componentCssClass: string;
  theme$: Observable<Theme> = this.authQuery.userTheme$;
  private paramTheme;
  unsubscribe$: Subject<null> = new Subject<null>();

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private authQuery: ComnAuthQuery,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: ComnAuthService,
    private settingsService: ComnSettingsService
  ) {
    iconRegistry.setDefaultFontSetClass('mdi');

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
    document.body.classList.toggle('darkMode', theme === Theme.DARK);
    const topBarColor = this.settingsService.settings?.AppTopBarHexColor || '#BB0000';
    const topBarTextColor = this.settingsService.settings?.AppTopBarHexTextColor || '#FFFFFF';
    if (topBarColor) {
      document.documentElement.style.setProperty('--mat-sys-primary', topBarColor);
      document.body.style.setProperty('--mat-sys-primary', topBarColor);
    }
    if (topBarTextColor) {
      document.documentElement.style.setProperty('--mat-sys-on-primary', topBarTextColor);
      document.body.style.setProperty('--mat-sys-on-primary', topBarTextColor);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
