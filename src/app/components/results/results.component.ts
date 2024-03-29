// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { Result } from 'src/app/generated/steamfitter.api';

enum ResultStatus {
  all = 0,
  success = 1,
  failed = 2,
  pending = 3,
  queued = 4,
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent implements OnInit, OnDestroy {
  @Input() results: Observable<Result[]>;
  @Input() taskId: string;
  @Input() taskAction: string;

  allResults: Result[];
  currentResults: Result[];
  filteredResults: Result[];
  selectedTabStatus = '';
  showResults: Record<string, boolean | undefined> = {};
  private lastExecutionTime: Date;
  private unsubscribe$ = new Subject();
  showVmFields: boolean;

  constructor(private playerDataService: PlayerDataService) {}

  ngOnInit() {
    this.results.pipe(takeUntil(this.unsubscribe$)).subscribe((results) => {
      if (!this.taskId) {
        this.allResults = results;
      } else {
        this.allResults = results.filter((r) => r.taskId === this.taskId);
      }
      this.filterCurrentResults();
    });
    this.showVmFields = this.hasVmFields();
  }

  hasVmFields() {
    if (/^http|linux|core/.test(this.taskAction)) {
      return false;
    };
    return true;
  }

  filterCurrentResults() {
    if (this.allResults.length === 0) {
      this.lastExecutionTime = new Date();
    } else {
      this.lastExecutionTime = this.allResults.reduce((m, v, i) =>
        v.dateCreated.valueOf() > m.dateCreated.valueOf() && i ? v : m
      ).dateCreated;
    }
    this.currentResults = this.allResults
      .filter((r) => this.isCurrentResult(new Date(r.dateCreated)))
      .sort((a: Result, b: Result) =>
        a.vmName.toLowerCase() <= b.vmName.toLowerCase() ? -1 : 1
      );
    this.filteredResults = this.currentResults;
  }

  isCurrentResult(dateCreated: Date) {
    const dc = new Date(dateCreated);
    const lxt = new Date(this.lastExecutionTime);
    return dc.valueOf() >= lxt.valueOf();
  }

  oldResults(current: Result) {
    return this.allResults
      .filter(
        (r) =>
          r.id !== current.id &&
          (!this.taskId || r.taskId === this.taskId) &&
          r.vmId === current.vmId
      )
      .sort((a: Result, b: Result) =>
        a.dateCreated.valueOf() <= b.dateCreated.valueOf() ? 1 : -1
      );
  }

  toggleResultDisplay(id: string) {
    if (!this.showResults[id]) {
      this.showResults[id] = true;
    } else {
      this.showResults[id] = false;
    }
  }

  resultCount(status: string) {
    return !this.currentResults
      ? 0
      : status === 'all'
        ? this.currentResults.length
        : this.currentResults.filter((r) => r.status === status).length;
  }

  onTabChanged(index: number) {
    switch (index) {
      case 0:
        this.filteredResults = this.currentResults.sort(
          (a: Result, b: Result) =>
            a.vmName.toLowerCase() < b.vmName.toLowerCase() ? -1 : 1
        );
        break;
      case 1:
        this.filteredResults = this.currentResults
          .filter((r) => r.status === 'succeeded')
          .sort((a: Result, b: Result) =>
            a.vmName.toLowerCase() < b.vmName.toLowerCase() ? -1 : 1
          );
        break;
      case 2:
        this.filteredResults = this.currentResults
          .filter((r) => r.status === 'failed')
          .sort((a: Result, b: Result) =>
            a.vmName.toLowerCase() < b.vmName.toLowerCase() ? -1 : 1
          );
        break;
      case 3:
        this.filteredResults = this.currentResults
          .filter((r) => r.status === 'pending')
          .sort((a: Result, b: Result) =>
            a.vmName.toLowerCase() < b.vmName.toLowerCase() ? -1 : 1
          );
        break;
      case 4:
        this.filteredResults = this.currentResults
          .filter((r) => r.status === 'queued')
          .sort((a: Result, b: Result) =>
            a.vmName.toLowerCase() < b.vmName.toLowerCase() ? -1 : 1
          );
        break;
      default:
        this.filteredResults = this.currentResults.sort(
          (a: Result, b: Result) =>
            a.vmName.toLowerCase() < b.vmName.toLowerCase() ? -1 : 1
        );
        break;
    }
  }

  openVmConsole(id: string) {
    const vms = this.playerDataService.vms.value;
    const vm = vms.find((v) => v.id === id);
    if (!!vm) {
      window.open(vm.url, '_blank');
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
