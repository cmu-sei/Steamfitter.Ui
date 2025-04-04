/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved. 
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

export * from './group.service';
import { GroupService } from './group.service';
export * from './health.service';
import { HealthService } from './health.service';
export * from './player.service';
import { PlayerService } from './player.service';
export * from './result.service';
import { ResultService } from './result.service';
export * from './scenario.service';
import { ScenarioService } from './scenario.service';
export * from './scenarioMemberships.service';
import { ScenarioMembershipsService } from './scenarioMemberships.service';
export * from './scenarioPermissions.service';
import { ScenarioPermissionsService } from './scenarioPermissions.service';
export * from './scenarioRoles.service';
import { ScenarioRolesService } from './scenarioRoles.service';
export * from './scenarioTemplate.service';
import { ScenarioTemplateService } from './scenarioTemplate.service';
export * from './scenarioTemplateMemberships.service';
import { ScenarioTemplateMembershipsService } from './scenarioTemplateMemberships.service';
export * from './scenarioTemplatePermissions.service';
import { ScenarioTemplatePermissionsService } from './scenarioTemplatePermissions.service';
export * from './scenarioTemplateRoles.service';
import { ScenarioTemplateRolesService } from './scenarioTemplateRoles.service';
export * from './systemPermissions.service';
import { SystemPermissionsService } from './systemPermissions.service';
export * from './systemRoles.service';
import { SystemRolesService } from './systemRoles.service';
export * from './task.service';
import { TaskService } from './task.service';
export * from './user.service';
import { UserService } from './user.service';
export * from './vmCredential.service';
import { VmCredentialService } from './vmCredential.service';
export const APIS = [GroupService, HealthService, PlayerService, ResultService, ScenarioService, ScenarioMembershipsService, ScenarioPermissionsService, ScenarioRolesService, ScenarioTemplateService, ScenarioTemplateMembershipsService, ScenarioTemplatePermissionsService, ScenarioTemplateRolesService, SystemPermissionsService, SystemRolesService, TaskService, UserService, VmCredentialService];
