// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { formatDuration, formatTime, lateStart } from './late-start';

const HOUR = 3_600_000;

// Planned 09:00 to 13:00 EST.
function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's1',
    name: 'Alpha',
    startDate: new Date('2026-11-12T14:00:00Z'),
    endDate: new Date('2026-11-12T18:00:00Z'),
    ...overrides,
  };
}

describe('lateStart', () => {
  /**
   * Verifies: a scenario started on time, early, or under a minute late needs no choice.
   * Interacts with: lateStart.
   * Data: the 09:00 to 13:00 scenario started at 08:00, 09:00 and 09:00:59.
   */
  it.each([
    { label: 'early', now: '2026-11-12T13:00:00Z' },
    { label: 'at its start', now: '2026-11-12T14:00:00Z' },
    { label: 'under a minute late', now: '2026-11-12T14:00:59Z' },
  ])('returns null when started $label', ({ now }) => {
    expect(lateStart(scenario(), new Date(now))).toBeNull();
  });

  /**
   * Verifies: a late start before the planned end reports the planned window, length and time left.
   * Interacts with: lateStart.
   * Data: the 09:00 to 13:00 scenario started at 10:30.
   */
  it('describes a late start before the planned end', () => {
    expect(lateStart(scenario(), new Date('2026-11-12T15:30:00Z'))).toEqual({
      plannedStart: new Date('2026-11-12T14:00:00Z'),
      plannedEnd: new Date('2026-11-12T18:00:00Z'),
      plannedLengthMs: 4 * HOUR,
      remainingMs: 2.5 * HOUR,
      endPassed: false,
    });
  });

  /**
   * Verifies: a start at or after the planned end is reported as past its end.
   * Interacts with: lateStart.
   * Data: the 09:00 to 13:00 scenario started at 13:00 and at 14:00.
   */
  it.each([
    { now: '2026-11-12T18:00:00Z', remaining: 0 },
    { now: '2026-11-12T19:00:00Z', remaining: -HOUR },
  ])('reports the end as passed at $now', ({ now, remaining }) => {
    expect(lateStart(scenario(), new Date(now))).toEqual(
      expect.objectContaining({
        plannedLengthMs: 4 * HOUR,
        remainingMs: remaining,
        endPassed: true,
      }),
    );
  });

  /**
   * Verifies: a window of 50 years or more counts as no end, and a shorter long window does not.
   * Interacts with: lateStart, NO_END_YEARS.
   * Data: a scenario started a day late whose end is start + 100 years (Blueprint and Steamfitter's "no end"), + 50 years, and + 49 years.
   */
  it.each([
    { years: 100, late: false },
    { years: 50, late: false },
    { years: 49, late: true },
  ])('treats an end $years years out as no end: $late', ({ years, late }) => {
    const endDate = new Date('2026-11-12T14:00:00Z');
    endDate.setFullYear(endDate.getFullYear() + years);

    const result = lateStart(
      scenario({ endDate }),
      new Date('2026-11-13T14:00:00Z'),
    );

    expect(result !== null).toBe(late);
  });

  /**
   * Verifies: missing, unparseable or out-of-order dates need no choice.
   * Interacts with: lateStart.
   * Data: scenarios without a start, without an end, with an invalid date, and ending before they start; started a day late.
   */
  it.each([
    { label: 'no start', overrides: { startDate: undefined } },
    { label: 'no end', overrides: { endDate: null } },
    { label: 'an invalid start', overrides: { startDate: new Date('nope') } },
    {
      label: 'an end before its start',
      overrides: { endDate: new Date('2026-11-12T13:00:00Z') },
    },
    {
      label: 'an end equal to its start',
      overrides: { endDate: new Date('2026-11-12T14:00:00Z') },
    },
  ])('returns null for $label', ({ overrides }) => {
    expect(
      lateStart(scenario(overrides), new Date('2026-11-13T14:00:00Z')),
    ).toBeNull();
  });

  /**
   * Verifies: an on-demand scenario needs no choice however late it starts.
   * Interacts with: lateStart.
   * Data: the 09:00 to 13:00 scenario marked onDemand, started at 10:30 and at 14:00.
   */
  it.each(['2026-11-12T15:30:00Z', '2026-11-12T19:00:00Z'])(
    'returns null for an on-demand scenario at %s',
    (now) => {
      expect(lateStart(scenario({ onDemand: true }), new Date(now))).toBeNull();
    },
  );

  /**
   * Verifies: ISO strings (dates not yet converted by the store) are read as dates.
   * Interacts with: lateStart.
   * Data: the 09:00 to 13:00 scenario as ISO strings, started at 10:30.
   */
  it('reads ISO date strings', () => {
    const result = lateStart(
      scenario({
        startDate: '2026-11-12T14:00:00Z' as unknown as Date,
        endDate: '2026-11-12T18:00:00Z' as unknown as Date,
      }),
      new Date('2026-11-12T15:30:00Z'),
    );

    expect(result?.remainingMs).toBe(2.5 * HOUR);
  });
});

describe('formatDuration', () => {
  /**
   * Verifies: durations show as days, hours and minutes with zero parts left out, rounded to the minute.
   * Interacts with: formatDuration.
   * Data: 4 h, 2 h 30 m, 45 m, 1 d 2 h 5 m, 3 d, 89.6 s, 20 s and zero.
   */
  it.each([
    { ms: 4 * HOUR, text: '4 h' },
    { ms: 2.5 * HOUR, text: '2 h 30 m' },
    { ms: 45 * 60_000, text: '45 m' },
    { ms: 26 * HOUR + 5 * 60_000, text: '1 d 2 h 5 m' },
    { ms: 72 * HOUR, text: '3 d' },
    { ms: 89_600, text: '1 m' },
    { ms: 20_000, text: 'under 1 m' },
    { ms: 0, text: 'under 1 m' },
  ])('shows $ms ms as "$text"', ({ ms, text }) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe('formatTime', () => {
  const now = new Date('2026-11-12T15:30:00Z');

  /**
   * Verifies: a time on the same day shows as hours and minutes with the short zone name; another day adds the date, another year the year.
   * Interacts with: formatTime, Intl with an explicit time zone.
   * Data: America/New_York; 13:00 the same day, 13:00 the next day, 13:00 a year later; now is 10:30 on 2026-11-12.
   */
  it.each([
    { date: '2026-11-12T18:00:00Z', text: '1:00 PM EST' },
    { date: '2026-11-13T18:00:00Z', text: 'Nov 13, 1:00 PM EST' },
    { date: '2027-11-12T18:00:00Z', text: 'Nov 12, 2027, 1:00 PM EST' },
  ])('shows $date as "$text"', ({ date, text }) => {
    expect(formatTime(new Date(date), now, 'America/New_York', 'en-US')).toBe(
      text,
    );
  });

  /**
   * Verifies: the day comparison uses the viewer's zone, not UTC.
   * Interacts with: formatTime.
   * Data: 21:00 EST on 2026-11-12 (02:00 UTC on the 13th), with now 10:30 EST the same local day.
   */
  it('compares days in the given time zone', () => {
    expect(
      formatTime(
        new Date('2026-11-13T02:00:00Z'),
        now,
        'America/New_York',
        'en-US',
      ),
    ).toBe('9:00 PM EST');
  });

  /**
   * Verifies: the locale argument picks the format, so en-GB shows a 24-hour time.
   * Interacts with: formatTime, Intl with an explicit time zone and locale.
   * Data: 13:00 EST the same day, America/New_York, en-GB.
   */
  it('formats in the given locale', () => {
    const text = formatTime(
      new Date('2026-11-12T18:00:00Z'),
      now,
      'America/New_York',
      'en-GB',
    );

    expect(text).toMatch(/^13:00 /);
  });
});
