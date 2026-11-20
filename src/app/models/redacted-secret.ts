// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

/**
 * What the API sends in place of a Task's guest password or private key to a caller who may not edit its
 * Scenario or Scenario Template, and in every SignalR message. A Task saved with it keeps the secret it has;
 * a new Task or VM Credential cannot be saved with it.
 */
export const REDACTED_SECRET = '********';
