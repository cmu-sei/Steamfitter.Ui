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
      'Allows performing most actions in a ScenarioTemplate. Can make changes to the contents of a ScenarioTemplate, including creating and editing Files, Directories, and Workspaces. Can Plan and Apply Workspace Runs.',
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
      SystemPermission.ViewGroups,
      'Allows viewing all Groups and Group Memberships. Implicitly allows listing of Users. Enables the Groups Administration panel. ',
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
