/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
  selector: 'app-scenario-template-memberships-page',
  templateUrl: './scenario-template-memberships-page.component.html',
  styleUrls: ['./scenario-template-memberships-page.component.scss'],
})
export class ScenarioTemplateMembershipsPageComponent implements OnInit {
  scenarioTemplateId: string;

  activatedRoute = inject(ActivatedRoute);
  permissionDataService = inject(PermissionDataService);

  ngOnInit(): void {
    this.scenarioTemplateId = this.activatedRoute.snapshot.paramMap.get('id');
    this.permissionDataService
      .loadScenarioTemplatePermissions(this.scenarioTemplateId)
      .subscribe();
  }
}
