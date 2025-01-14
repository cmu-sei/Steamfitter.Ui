/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ScenarioTemplatePermission } from 'src/app/generated/steamfitter.api';

export class ScenarioTemplateRolesModel {
  public static ScenarioTemplatePermissions = new Map<string, string>([
    [
      'All',
      'Gives permission to perform any action within the ScenarioTemplate',
    ],
    [
      ScenarioTemplatePermission.EditScenarioTemplate,
      'Allows performing most actions in the ScenarioTemplate. Can make changes to the contents of the ScenarioTemplate, including creating and editing Files, Directories, and Workspaces. Can Plan and Apply Workspace Runs.',
    ],
    [
      ScenarioTemplatePermission.ManageScenarioTemplate,
      'Allows for making changes to ScenarioTemplate Memberships in the ScenarioTemplate.',
    ],
    [
      ScenarioTemplatePermission.ViewScenarioTemplate,
      'Allows viewing all contents of the ScenarioTemplate.',
    ],
  ]);
}
