// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResultDataService } from 'src/app/data/result/result-data.service';
import { ResultQuery } from 'src/app/data/result/result.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { Result, User, View, Vm } from 'src/app/generated/steamfitter.api';

export enum HistoryView {
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
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class HistoryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() filterString = '';
  @Input() paginator: MatPaginator;
  @Input() historyView: HistoryView = HistoryView.user;
  @Input() selectedUser: User;
  @Input() selectedView: View;
  @Input() selectedVm: Vm;
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
  filterValue = '';
  expandedResult: Result;
  private unsubscribe$ = new Subject();
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private resultQuery: ResultQuery,
    private taskDataService: TaskDataService,
    private resultDataService: ResultDataService
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
          this.paginator?.firstPage();
        },
        (error) => {
          console.log('API is not responding:', error.message);
        }
      );
  }

  ngOnInit() {
    if (this.paginator) {
      this.modelDataSource.paginator = this.paginator;
      this.paginator.pageIndex = 0;
    }
    this.modelDataSource.sort = this.sort;

    this.pageEvent = new PageEvent();
    this.pageEvent.pageIndex = 0;
    this.pageEvent.pageSize = this.defaultPageSize;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.paginator && this.paginator) {
      this.modelDataSource.paginator = this.paginator;
    }
    if (changes.filterString !== undefined) {
      this.applyFilter(this.filterString || '');
    }
    if (changes.historyView) {
      this.onCategoryChanged();
    } else {
      if (changes.selectedUser && this.historyView === HistoryView.user) {
        this.loadByUser(this.selectedUser);
      }
      if (changes.selectedView && this.historyView === HistoryView.view) {
        this.loadByView(this.selectedView);
      }
      if (changes.selectedVm && this.historyView === HistoryView.vm) {
        this.loadByVm(this.selectedVm);
      }
    }
  }

  applyFilter(filterValue: string) {
    this.filterValue = filterValue.trim().toLowerCase();
    this.pageEvent.pageIndex = 0;
    this.modelDataSource.filter = this.filterValue;
  }

  private onCategoryChanged() {
    switch (this.historyView) {
      case HistoryView.user:
        this.loadByUser(this.selectedUser);
        break;
      case HistoryView.view:
        this.loadByView(this.selectedView);
        break;
      case HistoryView.vm:
        this.loadByVm(this.selectedVm);
        break;
    }
  }

  private loadByUser(user: User) {
    if (!user || !user.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByUser(user.id);
    }
    this.paginator?.firstPage();
  }

  private loadByView(view: View) {
    if (!view || !view.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByView(view.id);
    }
    this.paginator?.firstPage();
  }

  private loadByVm(vm: Vm) {
    if (!vm || !vm.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByVm(vm.id);
    }
    this.paginator?.firstPage();
  }

  private static readonly STATUS_ICON_MAP: Record<string, string> = {
    succeeded: 'mdi-star-circle-outline',
    success: 'mdi-star-circle-outline',
    failed: 'mdi-close-circle-outline',
    failure: 'mdi-close-circle-outline',
    pending: 'mdi-z-wave',
    expired: 'mdi-clock-alert-outline',
    expiration: 'mdi-clock-alert-outline',
    error: 'mdi-alert-outline',
    completion: 'mdi-check-circle-outline',
    manual: 'mdi-gesture-tap-button',
    queued: 'mdi-clock-time-three-outline',
    sent: 'mdi-send',
    time: 'mdi-alarm',
  };

  statusIcon(status: string): string {
    return HistoryComponent.STATUS_ICON_MAP[status?.toLowerCase()] || 'mdi-help-circle-outline';
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
