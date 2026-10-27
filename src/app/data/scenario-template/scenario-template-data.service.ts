// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ScenarioTemplateStore } from './scenario-template.store';
import { ScenarioTemplateQuery } from './scenario-template.query';
import { Injectable, inject } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ImportScenarioTemplatesResult,
  ScenarioTemplate,
  ScenarioTemplateService,
  VmCredential,
  VmCredentialService,
} from 'src/app/generated/steamfitter.api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { TaskDataService } from 'src/app/data/task/task-data.service';

@Injectable({
  providedIn: 'root',
})
export class ScenarioTemplateDataService {
  private scenarioTemplateStore = inject(ScenarioTemplateStore);
  private scenarioTemplateQuery = inject(ScenarioTemplateQuery);
  private scenarioTemplateService = inject(ScenarioTemplateService);
  private taskDataService = inject(TaskDataService);
  private vmCredentialService = inject(VmCredentialService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private _requestedScenarioTemplateId: string;
  private _requestedScenarioTemplateId$ =
    this.activatedRoute.queryParamMap.pipe(
      map((params) => params.get('scenarioTemplateId') || ''),
    );
  readonly scenarioTemplateList: Observable<ScenarioTemplate[]>;
  readonly selected: Observable<ScenarioTemplate>;
  readonly filterControl = new UntypedFormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor() {
    const activatedRoute = this.activatedRoute;

    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('scenarioTemplatemask') || ''),
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { scenarioTemplatemask: term },
        queryParamsHandling: 'merge',
      });
    });
    this.sortColumn = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('sorton') || 'name'),
    );
    this.sortIsAscending = activatedRoute.queryParamMap.pipe(
      map((params) => (params.get('sortdir') || 'asc') === 'asc'),
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pagesize') || '20', 10)),
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pageindex') || '0', 10)),
    );
    this.scenarioTemplateList = combineLatest([
      this.scenarioTemplateQuery.selectAll(),
      this.filterTerm,
      this.sortColumn,
      this.sortIsAscending,
      this.pageSize,
      this.pageIndex,
    ]).pipe(
      map(
        ([
          items,
          filterTerm,
          sortColumn,
          sortIsAscending,
          pageSize,
          pageIndex,
        ]) =>
          items
            ? (items as ScenarioTemplate[])
                .sort((a: ScenarioTemplate, b: ScenarioTemplate) =>
                  this.sortScenarioTemplates(a, b, sortColumn, sortIsAscending),
                )
                .filter(
                  (scenarioTemplate) =>
                    ('' + scenarioTemplate.name)
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase()) ||
                    scenarioTemplate.id
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase()),
                )
            : [],
      ),
    );
    this.selected = combineLatest([
      this.scenarioTemplateList,
      this._requestedScenarioTemplateId$,
    ]).pipe(
      map(([scenarioTemplateList, requestedScenarioTemplateId]) => {
        let selectedScenarioTemplate: ScenarioTemplate = null;
        if (
          scenarioTemplateList &&
          scenarioTemplateList.length > 0 &&
          requestedScenarioTemplateId
        ) {
          selectedScenarioTemplate = scenarioTemplateList.find(
            (scenarioTemplate) =>
              scenarioTemplate.id === requestedScenarioTemplateId,
          );
          if (
            selectedScenarioTemplate &&
            selectedScenarioTemplate.id !== this._requestedScenarioTemplateId
          ) {
            this.scenarioTemplateStore.setActive(requestedScenarioTemplateId);
            this._requestedScenarioTemplateId = requestedScenarioTemplateId;
            this.taskDataService.loadByScenarioTemplate(
              requestedScenarioTemplateId,
            );
          }
        } else {
          this._requestedScenarioTemplateId = '';
          this.scenarioTemplateStore.setActive('');
          this.scenarioTemplateStore.update({ taskList: [] });
        }
        return selectedScenarioTemplate;
      }),
    );
  }

  private sortScenarioTemplates(
    a: ScenarioTemplate,
    b: ScenarioTemplate,
    column: string,
    isAsc: boolean,
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
      case 'durationHours':
        return (a.durationHours < b.durationHours ? -1 : 1) * (isAsc ? 1 : -1);
      case 'dateCreated':
        return (
          (a.dateCreated.valueOf() < b.dateCreated.valueOf() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  load() {
    this.scenarioTemplateStore.setLoading(true);
    this.scenarioTemplateService
      .getScenarioTemplates()
      .pipe(
        tap(() => {
          this.scenarioTemplateStore.setLoading(false);
        }),
        take(1),
      )
      .subscribe(
        (scenarioTemplates) => {
          this.scenarioTemplateStore.set(scenarioTemplates);
        },
        (error) => {
          this.scenarioTemplateStore.set([]);
        },
      );
  }

  loadById(id: string) {
    this.scenarioTemplateStore.setLoading(true);
    return this.scenarioTemplateService
      .getScenarioTemplate(id)
      .pipe(
        tap(() => {
          this.scenarioTemplateStore.setLoading(false);
        }),
        take(1),
      )
      .subscribe((s) => {
        this.scenarioTemplateStore.upsert(s.id, { ...s });
      });
  }

  add(scenarioTemplate: ScenarioTemplate) {
    this.scenarioTemplateStore.setLoading(true);
    this.scenarioTemplateService
      .createScenarioTemplate(scenarioTemplate)
      .pipe(
        tap(() => {
          this.scenarioTemplateStore.setLoading(false);
        }),
        take(1),
      )
      .subscribe((s) => {
        this.scenarioTemplateStore.add(s);
        this.setActive(s.id);
      });
  }

  copyScenarioTemplate(scenarioTemplateId: string) {
    this.scenarioTemplateStore.setLoading(true);
    this.scenarioTemplateService
      .copyScenarioTemplate(scenarioTemplateId)
      .pipe(
        tap(() => {
          this.scenarioTemplateStore.setLoading(false);
        }),
        take(1),
      )
      .subscribe((s) => {
        this.scenarioTemplateStore.add(s);
        this.setActive(s.id);
      });
  }

  /**
   * Downloads a json file of the given scenario templates, with their tasks
   */
  exportScenarioTemplates(ids: string[]): Observable<void> {
    return this.scenarioTemplateService
      .exportScenarioTemplates(ids, 'response')
      .pipe(
        take(1),
        map((response) => {
          const filename =
            this.getFilename(response.headers.get('Content-Disposition')) ||
            'scenario-templates.json';
          const url = window.URL.createObjectURL(response.body);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
        }),
      );
  }

  /**
   * Creates scenario templates from an exported json file (or a zip holding one), then refreshes the list
   */
  importScenarioTemplates(
    file: Blob,
  ): Observable<ImportScenarioTemplatesResult> {
    return this.scenarioTemplateService.importScenarioTemplates(file).pipe(
      take(1),
      tap((result) => {
        if (result.scenarioTemplates?.length > 0) {
          this.load();
        }
      }),
    );
  }

  private getFilename(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (encoded) {
      return decodeURIComponent(encoded[1]);
    }
    const plain = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return plain ? plain[1] : null;
  }

  updateScenarioTemplate(scenarioTemplate: ScenarioTemplate) {
    this.scenarioTemplateStore.setLoading(true);
    this.scenarioTemplateService
      .updateScenarioTemplate(scenarioTemplate.id, scenarioTemplate)
      .pipe(
        tap(() => {
          this.scenarioTemplateStore.setLoading(false);
        }),
        take(1),
      )
      .subscribe((n) => {
        this.updateStore(n);
      });
  }

  delete(id: string) {
    this.scenarioTemplateService
      .deleteScenarioTemplate(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
        this.setActive('');
      });
  }

  setActive(id: string) {
    this.router.navigate([], {
      queryParams: {
        scenarioTemplateId: id || null,
        scenarioId: null,
        viewId: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  addVmCredential(vmCredential: VmCredential) {
    this.vmCredentialService
      .createVmCredential(vmCredential)
      .pipe(take(1))
      .subscribe(() => {
        this.loadById(vmCredential.scenarioTemplateId);
      });
  }

  deleteVmCredential(scenarioTemplateId: string, vmCredentialId: string) {
    this.vmCredentialService
      .deleteVmCredential(vmCredentialId)
      .pipe(take(1))
      .subscribe(() => {
        this.loadById(scenarioTemplateId);
      });
  }

  setPageEvent(pageEvent: PageEvent) {
    this.scenarioTemplateStore.update({ pageEvent: pageEvent });
  }

  updateStore(scenarioTemplate: ScenarioTemplate) {
    this.scenarioTemplateStore.upsert(scenarioTemplate.id, scenarioTemplate);
  }

  deleteFromStore(id: string) {
    this.scenarioTemplateStore.remove(id);
  }
}
