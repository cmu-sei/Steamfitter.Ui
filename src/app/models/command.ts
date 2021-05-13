// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Task, TaskAction } from 'src/app/generated/steamfitter.api';
export interface CommandParameterChoice {
  key: string;
  display: string;
}

export interface CommandParameters {
  key: string;
  inputType: string;
  display: string;
  hint: string;
  value: string;
  choices: CommandParameterChoice[];
}

export interface Command {
  api: string;
  action: TaskAction;
  display: string;
  requiresVm: boolean;
  parameters: CommandParameters[];
}
