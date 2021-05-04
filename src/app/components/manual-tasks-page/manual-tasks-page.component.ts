/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved. 
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterQuery } from '@datorama/akita-ng-router-store';
import { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { TaskQuery } from 'src/app/data/task/task.query';
import { Scenario, Task } from 'src/app/generated/steamfitter.api';
import { SignalRService } from 'src/app/services/signalr/signalr.service';

@Component({
  selector: 'app-manual-tasks-page',
  templateUrl: './manual-tasks-page.component.html',
  styleUrls: ['./manual-tasks-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualTasksPageComponent implements OnInit {
  viewId: string;

  public tasks$: Observable<Task[]>;
  public scenario$: Observable<Scenario>;

  constructor(
    private signalRService: SignalRService,
    private taskDataService: TaskDataService,
    private routerQuery: RouterQuery,
    private taskQuery: TaskQuery,
    private scenarioDataService: ScenarioDataService,
    private scenarioQuery: ScenarioQuery
  ) {}

  ngOnInit(): void {
    this.viewId = this.routerQuery.getParams('viewId');
    this.taskDataService.loadByView(this.viewId, false);
    this.scenarioDataService.loadByViewId(this.viewId);

    this.scenario$ = this.scenarioQuery.selectByViewId(this.viewId).pipe(
      map((x) => x[0]),
      tap((x) => {
        if (x) {
          this.tasks$ = this.taskQuery.selectAllUserExecutable(x.id);
          this.signalRService.joinScenario(x.id);
        }
      })
    );
  }
}
