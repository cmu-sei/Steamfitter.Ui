/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ScenarioPermission } from 'src/app/generated/steamfitter.api';

export class ScenarioRolesModel {
  public static ScenarioPermissions = new Map<string, string>([
    ['All', 'Gives permission to perform any action within the Scenario'],
    [
      ScenarioPermission.EditScenario,
      'Allows performing most actions in the Scenario. Can make changes to the contents of the Scenario, including creating and editing Files, Directories, and Workspaces. Can Plan and Apply Workspace Runs.',
    ],
    [
      ScenarioPermission.ManageScenario,
      'Allows for making changes to Scenario Memberships in the Scenario.',
    ],
    [
      ScenarioPermission.ViewScenario,
      'Allows viewing all contents of the Scenario.',
    ],
  ]);
}
