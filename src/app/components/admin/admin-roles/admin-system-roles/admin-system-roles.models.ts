/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { SystemPermission } from 'src/app/generated/steamfitter.api';

export class SystemRolesModel {
  public static SystemPermissions = new Map<string, string>([
    ['All', 'Gives permission to perform any action'],
    [
      SystemPermission.CreateScenarioTemplates,
      'Allows creation of new ScenarioTemplates. The creating User will be added as a Manager to the new ScenarioTemplate.',
    ],
    [
      SystemPermission.EditScenarioTemplates,
      'Allows performing most actions in a ScenarioTemplate. Can make changes to the contents of a ScenarioTemplate.',
    ],
    [
      SystemPermission.ViewScenarioTemplates,
      'Allows viewing all ScenarioTemplates and their Users and Groups. Implictly allows listing all Users and Groups. Enables the ScenarioTemplates Administration panel',
    ],
    [
      SystemPermission.ManageScenarioTemplates,
      'Allows for making changes to ScenarioTemplate Memberships.',
    ],
    [
      SystemPermission.CreateScenarios,
      'Allows creation of new Scenarios. The creating User will be added as a Manager to the new Scenario.',
    ],
    [
      SystemPermission.EditScenarios,
      'Allows performing most actions in a Scenario. Can make changes to the contents of a Scenario.',
    ],
    [
      SystemPermission.ViewScenarios,
      'Allows viewing all Scenarios and their Users and Groups. Implictly allows listing all Users and Groups. Enables the Scenarios Administration panel',
    ],
    [
      SystemPermission.ManageScenarios,
      'Allows for making changes to Scenario Memberships.',
    ],
    [
      SystemPermission.ExecuteScenarios,
      'Allows executing tasks in a Scenario.',
    ],
    [
      SystemPermission.ManageTasks,
      'Allows use of the Tasks tab for creating and running tasks independent of a scenario.',
    ],
    [
      SystemPermission.ViewGroups,
      'Allows viewing all Groups and Group Memberships. Implicitly allows listing of Users. Enables the Groups Administration panel. ',
    ],
    [
      SystemPermission.ViewRoles,
      'Allows viewing all Roles and Role Memberships.  Enables the Roles Administration panel. ',
    ],
    [
      SystemPermission.ManageGroups,
      'Allows for creating and making changes to all Groups and Group Memberships.',
    ],
    [
      SystemPermission.ManageRoles,
      'Allows for making changes to Roles. Can create new Roles, rename existing Roles, and assign and remove Permissions to Roles.',
    ],
    [
      SystemPermission.ViewUsers,
      'Allows viewing all Users. Enables the Users Administration panel',
    ],
    [
      SystemPermission.ManageUsers,
      'Allows for making changes to Users. Can add or remove Users and change their assigned Roles.',
    ],
  ]);
}
