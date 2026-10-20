// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
  input,
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResultDataService } from 'src/app/data/result/result-data.service';
import { ResultQuery } from 'src/app/data/result/result.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { Result, User, View, Vm } from 'src/app/generated/steamfitter.api';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TitleCasePipe, DatePipe, KeyValuePipe } from '@angular/common';

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
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
  imports: [
    MatCard,
    MatProgressSpinner,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatIconButton,
    MatIcon,
    MatSortHeader,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    TitleCasePipe,
    DatePipe,
    KeyValuePipe,
  ],
})
export class HistoryComponent implements OnInit, OnChanges, OnDestroy {
  private resultQuery = inject(ResultQuery);
  private taskDataService = inject(TaskDataService);
  private resultDataService = inject(ResultDataService);

  readonly filterString = input('');
  readonly paginator = input<MatPaginator>(undefined);
  readonly historyView = input<HistoryView>(HistoryView.user);
  readonly selectedUser = input<User>(undefined);
  readonly selectedView = input<View>(undefined);
  readonly selectedVm = input<Vm>(undefined);
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
  pageEvent: PageEvent = new PageEvent();
  loading = false;
  apiResponded = false;
  filterValue = '';
  expandedResult: Result;
  private unsubscribe$ = new Subject();
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor() {
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
              a.statusDate <= b.statusDate ? 1 : -1,
            );
          }
          this.paginator()?.firstPage();
        },
        (error) => {
          console.log('API is not responding:', error.message);
        },
      );
  }

  ngOnInit() {
    const paginator = this.paginator();
    if (paginator) {
      this.modelDataSource.paginator = paginator;
      paginator.pageIndex = 0;
    }
    this.modelDataSource.sort = this.sort;

    this.pageEvent.pageIndex = 0;
    this.pageEvent.pageSize = this.defaultPageSize;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const paginator = this.paginator();
    if (changes.paginator && paginator) {
      this.modelDataSource.paginator = paginator;
    }
    if (changes.filterString !== undefined) {
      this.applyFilter(this.filterString() || '');
    }
    if (changes.historyView) {
      this.onCategoryChanged();
    } else {
      const historyView = this.historyView();
      if (changes.selectedUser && historyView === HistoryView.user) {
        this.loadByUser(this.selectedUser());
      }
      if (changes.selectedView && historyView === HistoryView.view) {
        this.loadByView(this.selectedView());
      }
      if (changes.selectedVm && historyView === HistoryView.vm) {
        this.loadByVm(this.selectedVm());
      }
    }
  }

  applyFilter(filterValue: string) {
    this.filterValue = filterValue.trim().toLowerCase();
    this.pageEvent.pageIndex = 0;
    this.modelDataSource.filter = this.filterValue;
  }

  private onCategoryChanged() {
    switch (this.historyView()) {
      case HistoryView.user:
        this.loadByUser(this.selectedUser());
        break;
      case HistoryView.view:
        this.loadByView(this.selectedView());
        break;
      case HistoryView.vm:
        this.loadByVm(this.selectedVm());
        break;
    }
  }

  private loadByUser(user: User) {
    if (!user || !user.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByUser(user.id);
    }
    this.paginator()?.firstPage();
  }

  private loadByView(view: View) {
    if (!view || !view.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByView(view.id);
    }
    this.paginator()?.firstPage();
  }

  private loadByVm(vm: Vm) {
    if (!vm || !vm.id) {
      this.modelDataSource.data = [];
    } else {
      this.resultDataService.loadByVm(vm.id);
    }
    this.paginator()?.firstPage();
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
    return (
      HistoryComponent.STATUS_ICON_MAP[status?.toLowerCase()] ||
      'mdi-help-circle-outline'
    );
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
