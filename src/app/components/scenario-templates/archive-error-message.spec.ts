// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { archiveErrorMessage } from './archive-error-message';

describe('archiveErrorMessage', () => {
  it('joins the messages of a validation error', async () => {
    expect(
      await archiveErrorMessage(
        {
          status: 400,
          error: {
            title: 'One or more validation errors occurred.',
            errors: { File: ['The File field is required.'], Ids: ['Bad id.'] },
          },
        },
        'fallback',
      ),
    ).toBe('The File field is required. Bad id.');
  });

  it('prefers the detail to the title', async () => {
    expect(
      await archiveErrorMessage(
        {
          status: 500,
          error: { title: 'Error', detail: 'The database is down' },
        },
        'fallback',
      ),
    ).toBe('The database is down');
  });

  it('reads a ProblemDetails returned as a Blob', async () => {
    const error = new Blob([
      JSON.stringify({ title: 'ScenarioTemplate not found' }),
    ]);
    expect(await archiveErrorMessage({ status: 404, error }, 'fallback')).toBe(
      'ScenarioTemplate not found',
    );
  });

  it('names the size limit on a 413', async () => {
    expect(
      await archiveErrorMessage({ status: 413, error: null }, 'fallback'),
    ).toMatch(/files up to 10 MB/);
  });

  it('says the server could not be reached on status 0', async () => {
    expect(await archiveErrorMessage({ status: 0 }, 'fallback')).toMatch(
      /could not be reached/,
    );
  });

  it('falls back when the body says nothing', async () => {
    expect(
      await archiveErrorMessage(
        { status: 502, error: new Blob(['<html>']) },
        'fallback',
      ),
    ).toBe('fallback');
  });
});
