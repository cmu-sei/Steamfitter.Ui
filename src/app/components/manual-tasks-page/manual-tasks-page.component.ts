/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterQuery } from '@datorama/akita-ng-router-store';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { TaskQuery } from 'src/app/data/task/task.query';
import { Scenario, Task } from 'src/app/generated/steamfitter.api';
import { SignalRService } from 'src/app/services/signalr/signalr.service';
import { ErrorService } from 'src/app/services/error/error.service';

@Component({
  selector: 'app-manual-tasks-page',
  templateUrl: './manual-tasks-page.component.html',
  styleUrls: ['./manual-tasks-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualTasksPageComponent implements OnInit, OnDestroy {
  viewId: string;
  scenarioId: string;

  public tasks$: Observable<Task[]>;
  public scenario$: Observable<Scenario>;

  constructor(
    private signalRService: SignalRService,
    private taskDataService: TaskDataService,
    private routerQuery: RouterQuery,
    private taskQuery: TaskQuery,
    private scenarioDataService: ScenarioDataService,
    private scenarioQuery: ScenarioQuery,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.scenarioId = this.routerQuery.getParams('scenarioId');
    if (this.scenarioId) {
      this.taskDataService.loadByScenario(this.scenarioId);
      this.scenarioDataService.loadById(this.scenarioId);
      this.scenario$ = this.scenarioQuery.selectEntity(this.scenarioId).pipe(
        map((scenario) => scenario),
        tap((scenario) => {
          if (scenario) {
            this.scenarioId = scenario.id;
            this.tasks$ = this.taskQuery.selectAllUserExecutable(scenario.id);
            this.signalRService.joinScenario(this.scenarioId);
          }
        })
      );
    } else {
      this.viewId = this.routerQuery.getParams('viewId');
      if (this.viewId) {
        this.taskDataService.loadByView(this.viewId, false);
        this.scenarioDataService.loadByViewId(this.viewId);
        this.scenario$ = this.scenarioQuery.selectByViewId(this.viewId).pipe(
          tap((scenarios) => {
            if (scenarios) {
              if (scenarios.length > 1) {
                const scenarioNames = scenarios.map(m => m.name).join('  ||  ');
                const err = {
                  'message': 'This URL is ambiguous because ' +
                    scenarios.length +
                    ' scenarios point to view ID ' +
                    this.viewId +
                    '.  (' +
                    scenarioNames +
                    ').  Please use the "scenario/{scenarioId}" URL instead of the "view/{viewId}" URL to select the specific scenario.'
                };
                this.errorService.handleError(err);
              } else if (scenarios.length === 1) {
                this.scenarioId = scenarios[0].id;
                this.tasks$ = this.taskQuery.selectAllUserExecutable(this.scenarioId);
                this.signalRService.joinScenario(this.scenarioId);
              }
            }
          }),
          map((scenarios) => scenarios.length === 1 ? scenarios[0] : null),
        );
      }
    }

  }

  ngOnDestroy() {
    this.signalRService.leaveScenario(this.scenarioId);
  }
}
