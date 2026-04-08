/*
Copyright 2024 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, OnInit } from '@angular/core';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';
import { ScenarioTemplate } from 'src/app/generated/steamfitter.api';

@Component({
    selector: 'app-admin-scenario-templates',
    templateUrl: './admin-scenario-templates.component.html',
    styleUrls: ['./admin-scenario-templates.component.scss'],
    standalone: false
})
export class AdminScenarioTemplatesComponent implements OnInit {
  constructor(
    private scenarioTemplateDataService: ScenarioTemplateDataService,
    private scenarioTemplateQuery: ScenarioTemplateQuery
  ) {}

  scenarioTemplates$ = this.scenarioTemplateQuery.selectAll();
  loading$ = this.scenarioTemplateQuery.selectLoading();

  ngOnInit(): void {
    this.scenarioTemplateDataService.load();
  }

  saveScenarioTemplate(scenarioTemplate: ScenarioTemplate) {
    if (!scenarioTemplate.id) {
      this.scenarioTemplateDataService.add(scenarioTemplate);
    } else {
      this.scenarioTemplateDataService.updateScenarioTemplate(scenarioTemplate);
    }
  }
}
