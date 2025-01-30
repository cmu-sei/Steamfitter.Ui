/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
  selector: 'app-scenario-memberships-page',
  templateUrl: './scenario-memberships-page.component.html',
  styleUrls: ['./scenario-memberships-page.component.scss'],
})
export class ScenarioMembershipsPageComponent implements OnInit {
  scenarioId: string;

  activatedRoute = inject(ActivatedRoute);
  permissionDataService = inject(PermissionDataService);

  ngOnInit(): void {
    this.scenarioId = this.activatedRoute.snapshot.paramMap.get('id');
    this.permissionDataService
      .loadScenarioPermissions(this.scenarioId)
      .subscribe();
  }
}
