// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { HistoryView, HistoryComponent } from '../history/history.component';
import {
  ComnSettingsService,
  Theme,
  ComnAuthQuery,
  ComnAuthService,
} from '@cmusei/crucible-common';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { UserDataService } from '../../data/user/user-data.service';
import { CurrentUserQuery, UserQuery } from 'src/app/data/user/user.query';
import { CurrentUserState } from 'src/app/data/user/user.store';
import { TopbarView } from './../shared/top-bar/topbar.models';
import { HealthService, User, Vm } from 'src/app/generated/steamfitter.api';
import { SystemPermission } from 'src/app/generated/steamfitter.api';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { TopbarComponent } from '../shared/top-bar/topbar.component';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import {
  MatFormField,
  MatLabel,
  MatInput,
  MatSuffix,
} from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/autocomplete';
import { ScenariosComponent } from '../scenarios/scenarios.component';
import { ScenarioTemplatesComponent } from '../scenario-templates/scenario-templates.component';
import { VmTaskExecuteComponent } from '../vm-task-execute/vm-task-execute.component';
import { AsyncPipe, KeyValuePipe } from '@angular/common';

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
  imports: [
    TopbarComponent,
    MatIconButton,
    RouterLink,
    MatIcon,
    MatButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatFormField,
    MatLabel,
    MatSelect,
    FormsModule,
    MatOption,
    MatInput,
    MatSuffix,
    ScenariosComponent,
    ScenarioTemplatesComponent,
    VmTaskExecuteComponent,
    HistoryComponent,
    MatPaginator,
    AsyncPipe,
    KeyValuePipe,
  ],
})
export class HomeAppComponent implements OnDestroy, OnInit {
  private currentUserQuery = inject(CurrentUserQuery);
  private authService = inject(ComnAuthService);
  private userDataService = inject(UserDataService);
  private router = inject(Router);
  private playerDataService = inject(PlayerDataService);
  private settingsService = inject(ComnSettingsService);
  private signalRService = inject(SignalRService);
  private healthService = inject(HealthService);
  private authQuery = inject(ComnAuthQuery);
  private permissionDataService = inject(PermissionDataService);
  private userQuery = inject(UserQuery);

  readonly homePaginator = viewChild<MatPaginator>('homePaginator');
  apiIsSick = false;
  apiMessage = 'The API web service is not responding.';
  titleText = 'Steamfitter';
  section = Section;
  selectedSection: Section;
  loggedInUser = this.currentUserQuery.select();
  currentUser$: Observable<CurrentUserState>;
  isSuperUser = false;
  isAuthorizedUser = false;
  canViewAdministration = false;
  viewList = this.playerDataService.viewList;
  selectedTaskView = this.playerDataService.selectedView;
  private unsubscribe$ = new Subject();
  hideTopbar = false;
  TopbarView = TopbarView;
  theme$: Observable<Theme>;
  username: string;
  readonly SystemPermission = SystemPermission;
  permissions: SystemPermission[] = [];
  filterString = '';
  selectedStatuses: string[] = ['active', 'ready'];
  readonly HistoryView = HistoryView;
  historyView = HistoryView.user;
  historyUsers$: Observable<User[]>;
  historyVmList: Vm[] = [];
  selectedHistoryUser: User;
  selectedHistoryView: any;
  selectedHistoryVm: Vm;

  constructor() {
    const activatedRoute = inject(ActivatedRoute);

    this.healthCheck();

    this.theme$ = this.authQuery.userTheme$;
    this.hideTopbar = this.inIframe();

    this.playerDataService.getViewsFromApi();
    activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        this.selectedSection = (params.get('tab') ||
          Section.scenarios) as Section;
      });
    this.signalRService.joinSystem();

    // Set the display settings from config file
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
    this.userDataService.load().pipe(take(1)).subscribe();
    this.historyUsers$ = this.userQuery.selectAll();
    this.playerDataService.vms
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((vms) => {
        this.historyVmList =
          !!vms && vms.length > 0
            ? vms.sort((a, b) =>
                a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1,
              )
            : [];
      });
    this.permissionDataService.load().subscribe((x) => {
      this.permissions = this.permissionDataService.permissions;
      this.canViewAdministration =
        this.permissionDataService.canViewAdiminstration();
    });
  }

  selectTab(section: Section) {
    this.filterString = '';
    this.router.navigate([], {
      queryParams: {
        tab: section,
        scenarioId: null,
        scenarioTemplateId: null,
        viewId: null,
        taskId: null,
        resultId: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  applyFilter(value: string) {
    this.filterString = value;
  }

  onHistoryCategoryChange(value: HistoryView) {
    if (value === HistoryView.vm) {
      this.playerDataService.getAllVmsFromApi();
    }
  }

  onTaskViewChange(event: any) {
    if (event?.value?.id) {
      this.playerDataService.selectView(event.value.id);
    }
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

  healthCheck() {
    this.healthService.healthGetReadiness('body').subscribe(
      (message) => {
        this.apiIsSick = message !== 'Healthy';
        this.apiMessage = message;
      },
      (error) => {
        this.apiIsSick = true;
      },
    );
  }

  ngOnDestroy() {
    this.signalRService.leaveSystem();
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
