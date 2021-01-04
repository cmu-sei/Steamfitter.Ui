// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

export * from './bondAgent.service';
import { BondAgentService } from './bondAgent.service';
export * from './files.service';
import { FilesService } from './files.service';
export * from './permission.service';
import { PermissionService } from './permission.service';
export * from './player.service';
import { PlayerService } from './player.service';
export * from './result.service';
import { ResultService } from './result.service';
export * from './scenario.service';
import { ScenarioService } from './scenario.service';
export * from './scenarioTemplate.service';
import { ScenarioTemplateService } from './scenarioTemplate.service';
export * from './task.service';
import { TaskService } from './task.service';
export * from './user.service';
import { UserService } from './user.service';
export * from './userPermission.service';
import { UserPermissionService } from './userPermission.service';
export * from './vmCredential.service';
import { VmCredentialService } from './vmCredential.service';
export const APIS = [BondAgentService, FilesService, PermissionService, PlayerService, ResultService, ScenarioService, ScenarioTemplateService, TaskService, UserService, UserPermissionService, VmCredentialService];
