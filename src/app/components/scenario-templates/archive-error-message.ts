// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { HttpErrorResponse } from '@angular/common/http';

/**
 * A message for a failed Scenario Template export or import that says what to fix. Reads, in order, the
 * validation errors, detail and title of a ProblemDetails body (also when a blob request returns it as a
 * Blob), and names the cause of the answers that carry no body: a 413 for an upload past the server's
 * request limit, and a request that never reached the server.
 */
export async function archiveErrorMessage(
  err: unknown,
  fallback: string,
): Promise<string> {
  const response = err as Partial<HttpErrorResponse>;
  if (response?.status === 413) {
    return 'The file is too large to upload. An import reads files up to 10 MB.';
  }
  if (response?.status === 0) {
    return 'The server could not be reached. Check your connection and try again.';
  }

  let body: any = response?.error;
  if (body instanceof Blob) {
    try {
      body = JSON.parse(await body.text());
    } catch {
      body = undefined;
    }
  }

  const errors = body?.errors
    ? Object.values(body.errors as Record<string, string[] | string>).flat()
    : [];
  if (errors.length > 0) {
    return errors.join(' ');
  }
  return body?.detail || body?.title || fallback;
}
