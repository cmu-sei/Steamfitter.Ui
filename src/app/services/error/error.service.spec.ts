// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { SystemMessageService } from '../system-message/system-message.service';
import { ErrorService } from './error.service';

function setup() {
  const displayMessage = vi.fn();
  const messages: Pick<SystemMessageService, 'displayMessage'> = {
    displayMessage,
  };
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      // The real service; the default provider is a no-op stand-in.
      ErrorService,
      { provide: SystemMessageService, useValue: messages },
    ]),
  });
  return { service: TestBed.inject(ErrorService), displayMessage };
}

describe('ErrorService', () => {
  beforeEach(() => {
    // The service logs every error; keep test output clean.
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  /**
   * Verifies: each kind of error is turned into the matching system message title and text.
   * Interacts with: ErrorService.handleError, SystemMessageService.displayMessage stub.
   * Data: an unreachable-API HttpErrorResponse, a ProblemDetails 403, a plain 500, two unhandled promise rejections, and a TypeError.
   */
  it.each([
    {
      label: 'an unreachable API',
      error: new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown Error',
        url: 'https://api.test/x',
      }),
      expected: ['API Error', 'The API could not be reached.'],
    },
    {
      label: 'an HTTP error with a ProblemDetails title',
      error: new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: { title: 'Not allowed' },
      }),
      expected: ['Forbidden', 'Not allowed'],
    },
    {
      label: 'an HTTP error without a title',
      error: new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        url: 'https://api.test/y',
      }),
      expected: [
        'Server Error',
        'Http failure response for https://api.test/y: 500 Server Error',
      ],
    },
    {
      label: 'an identity server network failure',
      error: Object.assign(new Error('Uncaught (in promise): Network Error'), {
        rejection: new Error('Network Error'),
      }),
      expected: [
        'Identity Server Error',
        'The Identity Server could not be reached for user authentication.',
      ],
    },
    {
      label: 'another unhandled promise rejection',
      error: Object.assign(new Error('Uncaught (in promise): nope'), {
        rejection: new Error('nope'),
      }),
      expected: ['Error', 'nope'],
    },
    {
      label: 'any other error',
      error: new TypeError('x is undefined'),
      expected: ['TypeError', 'x is undefined'],
    },
  ])('reports $label', ({ error, expected }) => {
    const { service, displayMessage } = setup();

    service.handleError(error);

    expect(displayMessage).toHaveBeenCalledWith(...expected);
  });
});
