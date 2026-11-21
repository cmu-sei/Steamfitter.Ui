// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { VmCredential } from 'src/app/generated/steamfitter.api';

/**
 * A Scenario or Scenario Template to store, keeping the VM Credentials already stored when it carries none.
 * SignalR sends them as null, since its groups take viewers, who may not read them; the API sends them only
 * to a caller who may edit, and an empty list to one who may only view. A record never loaded over REST is
 * stored without them, so the VM Credentials component knows to load it.
 */
export function keepVmCredentials<
  T extends { vmCredentials?: VmCredential[] | null },
>(incoming: T, stored: T | undefined): T {
  if (incoming.vmCredentials != null) {
    return incoming;
  }
  const rest = { ...incoming };
  delete rest.vmCredentials;
  return stored?.vmCredentials != null
    ? { ...rest, vmCredentials: stored.vmCredentials }
    : rest;
}
