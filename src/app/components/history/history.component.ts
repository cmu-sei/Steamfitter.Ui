// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatLegacyPaginator as MatPaginator, LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { MatSort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { Subject } from 'rxjs';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { ResultDataService } from 'src/app/data/result/result-data.service';
import { ResultQuery } from 'src/app/data/result/result.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { Result, User, View, Vm } from 'src/app/generated/steamfitter.api';
import { ComnSettingsService } from '@cmusei/crucible-common';

enum HistoryView {
  user = 'User',
  view = 'View',
  vm = 'VM',
}

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class HistoryComponent implements OnInit, OnDestroy {
  HistoryView = HistoryView;
  displayedColumns: string[] = [
    'id',
    'statusDate',
    'vmName',
    'status',
    'actualOutput',
    'expectedOutput',
  ];
  modelDataSource = new MatTableDataSource<Result>(new Array<Result>());
  // MatPaginator Output
  defaultPageSize = 10;
  pageEvent: PageEvent;
  loading = false;
  apiResponded = false;
  historyView = HistoryView.user;
  filterValue = undefined;
  userList: User[] = [];
  selectedUser: User;
  viewList: View[] = [];
  selectedView: View;
  vmList: Vm[] = [];
  selectedVm: Vm;
  expandedResult: Result;
  private unsubscribe$ = new Subject();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  topbarColor = '#BB0000';

  constructor(
    private resultQuery: ResultQuery,
    private taskDataService: TaskDataService,
    private userDataService: UserDataService,
    private playerDataService: PlayerDataService,
    private resultDataService: ResultDataService,
    private settingsService: ComnSettingsService
  ) {
    this.loading = true;
    this.apiResponded = false;

    this.resultQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (res) => {
          this.apiResponded = true;
          if (res != null) {
            this.modelDataSource.data = res.sort((a: Result, b: Result) =>
              a.statusDate <= b.statusDate ? 1 : -1
            );
          }
        },
        (error) => {
          console.log('API is not responding:', error.message);
        }
      );
    this.playerDataService.viewList
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((views) => {
        this.viewList =
          !!views && views.length > 0
            ? views.sort((a: User, b: User) =>
              a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
            )
            : [];
      });
    this.playerDataService.vms
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((vms) => {
        this.vmList =
          !!vms && vms.length > 0
            ? vms.sort((a: User, b: User) =>
              a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
            )
            : [];
      });
    this.playerDataService.selectView('');
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.modelDataSource.paginator = this.paginator;
    this.modelDataSource.sort = this.sort;

    this.pageEvent = new PageEvent();
    this.pageEvent.pageIndex = 0;
    this.pageEvent.pageSize = this.defaultPageSize;
  }

  applyFilter(filterValue: string) {
    this.pageEvent.pageIndex = 0;
    this.modelDataSource.filter = filterValue.trim().toLowerCase();
  }

  handleHistoryViewChange(historyView: HistoryView) {
    switch (historyView) {
      case HistoryView.user:
        this.handleUserChange(this.selectedUser);
        break;
      case HistoryView.view:
        this.handleViewChange(this.selectedView);
        break;
      case HistoryView.vm:
        this.playerDataService.getAllVmsFromApi();
        this.handleVmChange(this.selectedVm);
        break;
      default:
        this.vmList = [];
        break;
    }
  }

  handleUserChange(user: User) {
    this.selectedUser = user;
    if (!user || !user.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByUser(user.id);
    }
  }

  handleViewChange(view: View) {
    this.selectedView = view;
    if (!view || !view.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByView(view.id);
    }
  }

  handleVmChange(vm: Vm) {
    this.selectedVm = vm;
    if (!vm || !vm.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByVm(vm.id);
    }
  }

  copyTask(resultId: string) {
    this.taskDataService.setClipboard({
      id: undefined,
      resultId: resultId,
      isCut: false,
    });
  }

  showDetail(result: Result) {
    this.expandedResult = this.expandedResult === result ? null : result;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
