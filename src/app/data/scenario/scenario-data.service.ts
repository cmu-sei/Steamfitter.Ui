// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ScenarioStore } from './scenario.store';
import { ScenarioQuery } from './scenario.query';
import { Injectable } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Scenario,
  ScenarioService,
  VmCredential,
  VmCredentialService,
} from 'src/app/generated/steamfitter.api';
import {
  map,
  take,
  tap,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { PlayerDataService } from 'src/app/data/player/player-data-service';

@Injectable({
  providedIn: 'root',
})
export class ScenarioDataService {
  private _requestedScenarioId: string;
  private _requestedScenarioId$ = this.activatedRoute.queryParamMap.pipe(
    map((params) => params.get('scenarioId') || '')
  );
  readonly allScenarios = this.scenarioQuery.selectAll();
  readonly scenarioList: Observable<Scenario[]>;
  readonly selected: Observable<Scenario>;
  readonly filterControl = new UntypedFormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor(
    private scenarioStore: ScenarioStore,
    private scenarioQuery: ScenarioQuery,
    private scenarioService: ScenarioService,
    private taskDataService: TaskDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private playerDataService: PlayerDataService,
    private vmCredentialService: VmCredentialService
  ) {
    this.filterControl.valueChanges.subscribe((term) => {
      router.navigate([], {
        queryParams: { scenariomask: term },
        queryParamsHandling: 'merge',
      });
    });
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('scenariomask') || '')
    );
    this.sortColumn = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('sorton') || 'name')
    );
    this.sortIsAscending = activatedRoute.queryParamMap.pipe(
      map((params) => (params.get('sortdir') || 'asc') === 'asc')
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pagesize') || '20', 10))
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pageindex') || '0', 10))
    );
    this.scenarioList = combineLatest([
      this.allScenarios,
      this.filterTerm,
      this.sortColumn,
      this.sortIsAscending,
    ]).pipe(
      map(([items, filterTerm, sortColumn, sortIsAscending]) =>
        items
          ? (items as Scenario[])
              .sort((a: Scenario, b: Scenario) =>
                this.sortScenarios(a, b, sortColumn, sortIsAscending)
              )
              .filter(
                (scenario) =>
                  ('' + scenario.name)
                    .toLowerCase()
                    .includes(filterTerm.toLowerCase()) ||
                  ('' + scenario.description)
                    .toLowerCase()
                    .includes(filterTerm.toLowerCase()) ||
                  ('' + scenario.view)
                    .toLowerCase()
                    .includes(filterTerm.toLowerCase())
              )
          : []
      )
    );
    this.selected = combineLatest([
      this.scenarioList,
      this._requestedScenarioId$,
    ]).pipe(
      distinctUntilChanged(),
      map(([scenarioList, requestedScenarioId]) => {
        let selectedScenario: Scenario = null;
        if (scenarioList && scenarioList.length > 0 && requestedScenarioId) {
          selectedScenario = scenarioList.find(
            (scenario) => scenario.id === requestedScenarioId
          );
          if (
            selectedScenario &&
            selectedScenario.id !== this._requestedScenarioId
          ) {
            this.scenarioStore.setActive(requestedScenarioId);
            this._requestedScenarioId = requestedScenarioId;
            this.taskDataService.loadByScenario(requestedScenarioId);
            this.playerDataService.selectView(selectedScenario.viewId);
          }
        } else {
          this._requestedScenarioId = '';
          this.scenarioStore.setActive('');
          this.scenarioStore.update({ taskList: [] });
        }
        return selectedScenario;
      })
    );
  }

  private sortScenarios(
    a: Scenario,
    b: Scenario,
    column: string,
    isAsc: boolean
  ) {
    switch (column) {
      case 'name':
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'description':
        return (
          (a.description.toLowerCase() < b.description.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'status':
        return (
          (a.status.toLowerCase() < b.status.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'startDate':
        return (
          (a.startDate.getTime() < b.startDate.getTime() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'endDate':
        return (
          (a.endDate.getTime() < b.endDate.getTime() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'view':
        return (a.view + '' < b.view + '' ? -1 : 1) * (isAsc ? 1 : -1);
      default:
        return 0;
    }
  }

  load() {
    this.scenarioStore.setLoading(true);
    this.scenarioService
      .getScenarios()
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (scenarios) => {
          scenarios.forEach((scenario) => {
            this.setAsDates(scenario);
          });
          this.scenarioStore.set(
            scenarios.filter(
              (s) => s.description !== 'Personal Task Builder Scenario'
            )
          );
        },
        (error) => {
          this.scenarioStore.set([]);
        }
      );
  }

  loadById(id: string) {
    this.scenarioStore.setLoading(true);
    return this.scenarioService
      .getScenario(id)
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.scenarioStore.upsert(s.id, { ...s });
      });
  }

  loadByViewId(viewId: string) {
    this.scenarioStore.setLoading(true);
    return this.scenarioService
      .getScenariosByViewId(viewId)
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.scenarioStore.upsertMany(s);
      });
  }

  loadTaskBuilderScenario() {
    this.scenarioStore.setLoading(true);
    this.setActive('');
    return this.scenarioService
      .getMyScenario()
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((scenario) => {
        this.updateStore({ ...scenario });
        this.setActive(scenario.id);
        this.taskDataService.loadByScenario(scenario.id);
      });
  }

  add(scenario: Scenario) {
    this.scenarioStore.setLoading(true);
    this.scenarioService
      .createScenario(scenario)
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.scenarioStore.add(s);
        this.setActive(s.id);
      });
  }

  copyScenario(scenarioId: string) {
    this.scenarioStore.setLoading(true);
    this.scenarioService
      .copyScenario(scenarioId)
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.scenarioStore.add(s);
        this.setActive(s.id);
      });
  }

  createScenarioFromScenarioTemplate(scenarioTemplateId: string) {
    this.scenarioStore.setLoading(true);
    this.scenarioService
      .createScenarioFromScenarioTemplate(scenarioTemplateId, {})
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.scenarioStore.add(s);
        this.setActive(s.id);
      });
  }

  updateScenario(scenario: Scenario) {
    this.scenarioStore.setLoading(true);
    this.scenarioService
      .updateScenario(scenario.id, scenario)
      .pipe(
        tap(() => {
          this.scenarioStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.updateStore(s);
      });
  }

  delete(id: string) {
    this.scenarioService
      .deleteScenario(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
        this.setActive('');
      });
  }

  start(id: string) {
    this.scenarioService
      .startScenario(id)
      .pipe(take(1))
      .subscribe((s) => {
        this.updateStore(s);
      });
  }

  end(id: string) {
    this.scenarioService
      .endScenario(id)
      .pipe(take(1))
      .subscribe((s) => {
        this.updateStore(s);
      });
  }

  setActive(id: string) {
    this.router.navigate([], {
      queryParams: { scenarioId: id },
      queryParamsHandling: 'merge',
    });
  }

  addVmCredential(vmCredential: VmCredential) {
    this.vmCredentialService
      .createVmCredential(vmCredential)
      .pipe(take(1))
      .subscribe(() => {
        this.loadById(vmCredential.scenarioId);
      });
  }

  deleteVmCredential(scenarioId: string, vmCredentialId: string) {
    this.vmCredentialService
      .deleteVmCredential(vmCredentialId)
      .pipe(take(1))
      .subscribe(() => {
        this.loadById(scenarioId);
      });
  }

  setPageEvent(pageEvent: PageEvent) {
    this.scenarioStore.update({ pageEvent: pageEvent });
  }

  updateStore(scenario: Scenario) {
    this.setAsDates(scenario);
    this.scenarioStore.upsert(scenario.id, scenario);
  }

  deleteFromStore(id: string) {
    this.scenarioStore.remove(id);
  }

  setAsDates(scenario: Scenario) {
    // set to a date object.
    scenario.dateCreated = new Date(scenario.dateCreated);
    scenario.dateModified = new Date(scenario.dateModified);
    scenario.startDate = new Date(scenario.startDate);
    scenario.endDate = new Date(scenario.endDate);
  }
}
