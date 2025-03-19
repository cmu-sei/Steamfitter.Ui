// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { Scenario } from 'src/app/generated/steamfitter.api';

@Component({
  selector: 'app-scenarios',
  templateUrl: './scenarios.component.html',
  styleUrls: ['./scenarios.component.scss'],
})
export class ScenariosComponent implements OnInit {
  @Output() editComplete = new EventEmitter<boolean>();
  @ViewChild(ScenariosComponent) child;
  @ViewChild('stepper') stepper: MatStepper;

  isLinear = false;
  scenarioList$ = this.scenarioDataService.scenarioList;
  selectedScenario$ = this.scenarioDataService.selected;
  scenarioPageEvent = this.scenarioDataService.pageEvent;
  isLoading$ = this.scenarioQuery.selectLoading();
  views$ = this.playerDataService.viewList;
  statuses$: Observable<string>;

  constructor(
    public zone: NgZone,
    private playerDataService: PlayerDataService,
    private scenarioDataService: ScenarioDataService,
    private scenarioQuery: ScenarioQuery,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.scenarioDataService.load();
    this.statuses$ = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('statuses') || 'active,ready')
    );
  }

  ngOnInit() {
    const statuses: string =
      this.activatedRoute.snapshot.queryParamMap.get('statuses');
    const secondParam: string =
      this.activatedRoute.snapshot.queryParamMap.get('secondParamKey');
  }
  setActive(id: string) {
    this.scenarioDataService.setActive(id);
  }

  sortChangeHandler(sort: Sort) {
    this.router.navigate([], {
      queryParams: { sorton: sort.active, sortdir: sort.direction },
      queryParamsHandling: 'merge',
    });
  }

  filterStatusChangeHandler(statusList: any) {
    let statuses = statusList.active ? 'active' : 'x';
    statuses = statusList.ready ? statuses + ',ready' : statuses;
    statuses = statusList.ended ? statuses + ',ended' : statuses;
    this.router.navigate([], {
      queryParams: { statuses: statuses },
      queryParamsHandling: 'merge',
    });
  }

  pageChangeHandler(page: PageEvent) {
    this.router.navigate([], {
      queryParams: { pageindex: page.pageIndex, pagesize: page.pageSize },
      queryParamsHandling: 'merge',
    });
  }

  saveScenario(scenario: Scenario) {
    if (!scenario.id) {
      this.scenarioDataService.add(scenario);
    } else {
      this.scenarioDataService.updateScenario(scenario);
    }
  }
} // End Class
