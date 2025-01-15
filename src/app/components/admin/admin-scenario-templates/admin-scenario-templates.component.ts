/*
Copyright 2024 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, OnInit } from '@angular/core';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';

@Component({
  selector: 'cas-admin-scenario-templates',
  templateUrl: './admin-scenario-templates.component.html',
  styleUrls: ['./admin-scenario-templates.component.scss'],
})
export class AdminScenarioTemplatesComponent implements OnInit {
  constructor(
    private scenarioTemplateDataService: ScenarioTemplateDataService,
    private scenarioTemplateQuery: ScenarioTemplateQuery
  ) {}

  public scenarioTemplates$ = this.scenarioTemplateQuery.selectAll();
  public loading$ = this.scenarioTemplateQuery.selectLoading();
  public selectedScenarioTemplateId: string;

  ngOnInit(): void {
    this.scenarioTemplateDataService.load();
  }
}
