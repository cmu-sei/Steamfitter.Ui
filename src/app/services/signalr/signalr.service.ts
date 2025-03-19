// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { ComnAuthService, ComnSettingsService } from '@cmusei/crucible-common';
import * as signalR from '@microsoft/signalr';
import { ResultDataService } from 'src/app/data/result/result-data.service';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioTemplateMembershipDataService } from 'src/app/data/scenario-template/scenario-template-membership-data.service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { ScenarioMembershipDataService } from 'src/app/data/scenario/scenario-membership-data.service';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { GroupMembershipService } from 'src/app/data/group/group-membership.service';
import {
  GroupMembership,
  Result,
  Scenario,
  ScenarioMembership,
  ScenarioTemplate,
  ScenarioTemplateMembership,
  Task,
} from 'src/app/generated/steamfitter.api';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  private connectionPromise: Promise<void>;

  private systemGroupJoined = false;
  private scenarioIds = [];

  constructor(
    private authService: ComnAuthService,
    private scenarioTemplateDataService: ScenarioTemplateDataService,
    private scenarioTemplateMembershipDataService: ScenarioTemplateMembershipDataService,
    private scenarioDataService: ScenarioDataService,
    private scenarioMembershipDataService: ScenarioMembershipDataService,
    private groupMembershipDataService: GroupMembershipService,
    private taskDataService: TaskDataService,
    private resultDataService: ResultDataService,
    private settingsService: ComnSettingsService
  ) {}

  public startConnection(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const token = this.authService.getAuthorizationToken();
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(
        `${this.settingsService.settings.ApiUrl}/hubs/engine?bearer=${token}`
      )
      .withAutomaticReconnect(new RetryPolicy(120, 0, 5))
      .withStatefulReconnect()
      .build();

    this.hubConnection.onreconnected(() => {
      this.joinGroups();
    });

    this.addHandlers();
    this.connectionPromise = this.hubConnection.start();

    return this.connectionPromise;
  }

  private joinGroups() {
    if (this.systemGroupJoined) {
      this.joinSystem();
    }

    this.scenarioIds.forEach((x) => this.joinScenario(x));
  }

  private addHandlers() {
    this.addScenarioTemplateHandlers();
    this.addScenarioTemplateMembershipHandlers();
    this.addScenarioHandlers();
    this.addScenarioMembershipHandlers();
    this.addTaskHandlers();
    this.addResultHandlers();
    this.addGroupMembershipHandlers();
  }

  private addScenarioTemplateHandlers() {
    this.hubConnection.on(
      'ScenarioTemplateCreated',
      (scenarioTemplate: ScenarioTemplate) => {
        this.scenarioTemplateDataService.updateStore(scenarioTemplate);
      }
    );

    this.hubConnection.on(
      'ScenarioTemplateUpdated',
      (scenarioTemplate: ScenarioTemplate) => {
        this.scenarioTemplateDataService.updateStore(scenarioTemplate);
      }
    );

    this.hubConnection.on('ScenarioTemplateDeleted', (id: string) => {
      this.scenarioTemplateDataService.deleteFromStore(id);
    });
  }

  private addScenarioTemplateMembershipHandlers() {
    this.hubConnection.on(
      'ScenarioTemplateMembershipCreated',
      (scenarioTemplateMembership: ScenarioTemplateMembership) => {
        this.scenarioTemplateMembershipDataService.updateStore(
          scenarioTemplateMembership
        );
      }
    );

    this.hubConnection.on(
      'ScenarioTemplateMembershipUpdated',
      (scenarioTemplateMembership: ScenarioTemplateMembership) => {
        this.scenarioTemplateMembershipDataService.updateStore(
          scenarioTemplateMembership
        );
      }
    );

    this.hubConnection.on('ScenarioTemplateMembershipDeleted', (id: string) => {
      this.scenarioTemplateMembershipDataService.deleteFromStore(id);
    });
  }

  private addScenarioHandlers() {
    this.hubConnection.on('ScenarioCreated', (scenario: Scenario) => {
      this.scenarioDataService.updateStore(scenario);
    });

    this.hubConnection.on('ScenarioUpdated', (scenario: Scenario) => {
      this.scenarioDataService.updateStore(scenario);
    });

    this.hubConnection.on('ScenarioDeleted', (id: string) => {
      this.scenarioDataService.deleteFromStore(id);
    });
  }

  private addScenarioMembershipHandlers() {
    this.hubConnection.on(
      'ScenarioMembershipCreated',
      (scenarioMembership: ScenarioMembership) => {
        this.scenarioMembershipDataService.updateStore(scenarioMembership);
      }
    );

    this.hubConnection.on(
      'ScenarioMembershipUpdated',
      (scenarioMembership: ScenarioMembership) => {
        this.scenarioMembershipDataService.updateStore(scenarioMembership);
      }
    );

    this.hubConnection.on('ScenarioMembershipDeleted', (id: string) => {
      this.scenarioMembershipDataService.deleteFromStore(id);
    });
  }

  private addGroupMembershipHandlers() {
    this.hubConnection.on(
      'GroupMembershipCreated',
      (groupMembership: GroupMembership) => {
        this.groupMembershipDataService.updateStore(groupMembership);
      }
    );

    this.hubConnection.on(
      'GroupMembershipUpdated',
      (groupMembership: GroupMembership) => {
        this.groupMembershipDataService.updateStore(groupMembership);
      }
    );

    this.hubConnection.on('GroupMembershipDeleted', (id: string) => {
      this.groupMembershipDataService.deleteFromStore(id);
    });
  }

  private addTaskHandlers() {
    this.hubConnection.on('TaskCreated', (task: Task) => {
      this.taskDataService.updateStore(task);
    });

    this.hubConnection.on('TaskUpdated', (task: Task) => {
      this.taskDataService.updateStore(task);
    });

    this.hubConnection.on('TaskDeleted', (id: string) => {
      this.taskDataService.deleteFromStore(id);
    });
  }

  private addResultHandlers() {
    this.hubConnection.on('ResultCreated', (result: Result) => {
      this.resultDataService.updateStore(result);
    });

    this.hubConnection.on('ResultUpdated', (result: Result) => {
      this.resultDataService.updateStore(result);
    });

    this.hubConnection.on('ResultsUpdated', (results: Result[]) => {
      this.resultDataService.updateStoreMany(results);
    });

    this.hubConnection.on('ResultDeleted', (id: string) => {
      this.resultDataService.deleteFromStore(id);
    });
  }

  public joinSystem() {
    this.systemGroupJoined = true;
    this.startConnection().then((x) => this.hubConnection.invoke('JoinSystem'));
  }

  public leaveSystem() {
    this.systemGroupJoined = false;
    this.startConnection().then((x) =>
      this.hubConnection.invoke('LeaveSystem')
    );
  }

  public joinScenario(scenarioId: string) {
    this.scenarioIds.push(scenarioId);
    this.startConnection().then((x) =>
      this.hubConnection.invoke('JoinScenario', scenarioId)
    );
  }

  public leaveScenario(scenarioId: string) {
    this.scenarioIds = this.scenarioIds.filter((x) => x === scenarioId);
    this.startConnection().then((x) =>
      this.hubConnection.invoke('LeaveScenario', scenarioId)
    );
  }
}

class RetryPolicy {
  constructor(
    private maxSeconds: number,
    private minJitterSeconds: number,
    private maxJitterSeconds: number
  ) {}

  nextRetryDelayInMilliseconds(
    retryContext: signalR.RetryContext
  ): number | null {
    let nextRetrySeconds = Math.pow(2, retryContext.previousRetryCount + 1);
    if (retryContext.elapsedMilliseconds / 1000 > this.maxSeconds) {
      location.reload();
    }

    nextRetrySeconds +=
      Math.floor(
        Math.random() * (this.maxJitterSeconds - this.minJitterSeconds + 1)
      ) + this.minJitterSeconds; // Add Jitter

    return nextRetrySeconds * 1000;
  }
}
