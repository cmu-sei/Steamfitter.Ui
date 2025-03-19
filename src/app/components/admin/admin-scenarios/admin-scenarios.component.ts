/*
Copyright 2024 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-scenarios',
  templateUrl: './admin-scenarios.component.html',
  styleUrls: ['./admin-scenarios.component.scss'],
})
export class AdminScenariosComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private scenarioDataService: ScenarioDataService,
    private scenarioQuery: ScenarioQuery,
    private playerDataService: PlayerDataService
  ) {
    this.statuses = this.activatedRoute.queryParamMap.pipe(
      map((params) => params.get('statuses') || 'active,ready')
    );
    this.playerDataService.getViewsFromApi();
  }

  scenarios$ = this.scenarioQuery.selectAll();
  loading$ = this.scenarioQuery.selectLoading();
  selectedScenarioId: string;
  embedded = true;
  statuses: Observable<string>;
  viewList = this.playerDataService.viewList;

  ngOnInit(): void {
    this.scenarioDataService.load();
    const statuses: string =
      this.activatedRoute.snapshot.queryParamMap.get('statuses');
    const secondParam: string =
      this.activatedRoute.snapshot.queryParamMap.get('secondParamKey');
  }
}
