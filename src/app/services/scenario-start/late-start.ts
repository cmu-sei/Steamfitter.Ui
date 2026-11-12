// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Scenario } from 'src/app/generated/steamfitter.api';

/**
 * A planned window at least this long has no real end. Steamfitter and
 * Blueprint both use start + 100 years for "no end".
 */
export const NO_END_YEARS = 50;

/** How far past its planned start a scenario has to be to count as late. */
export const LATE_AFTER_MS = 60_000;

/** A scenario being started after its planned start. */
export interface LateStart {
  plannedStart: Date;
  plannedEnd: Date;
  /** Planned end minus planned start. */
  plannedLengthMs: number;
  /** Time left before the planned end; zero or less once it has passed. */
  remainingMs: number;
  endPassed: boolean;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Describes how late a scenario is being started, or returns null when
 * starting it now needs no choice: it is on time, it has no end, or its dates
 * are missing or out of order.
 */
export function lateStart(scenario: Scenario, now: Date): LateStart | null {
  const plannedStart = toDate(scenario?.startDate);
  const plannedEnd = toDate(scenario?.endDate);
  if (!plannedStart || !plannedEnd) {
    return null;
  }
  const plannedLengthMs = plannedEnd.getTime() - plannedStart.getTime();
  const noEnd = new Date(plannedStart);
  noEnd.setFullYear(noEnd.getFullYear() + NO_END_YEARS);
  if (
    plannedLengthMs <= 0 ||
    plannedEnd >= noEnd ||
    now.getTime() - plannedStart.getTime() < LATE_AFTER_MS
  ) {
    return null;
  }
  const remainingMs = plannedEnd.getTime() - now.getTime();
  return {
    plannedStart,
    plannedEnd,
    plannedLengthMs,
    remainingMs,
    endPassed: remainingMs <= 0,
  };
}

/** A duration as days, hours and minutes, e.g. "2 h 30 m". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 1) {
    return 'under 1 m';
  }
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return [
    days ? `${days} d` : '',
    hours ? `${hours} h` : '',
    minutes ? `${minutes} m` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * A time in the viewer's time zone with its short name, e.g. "1:00 PM EST".
 * The date is added when it falls on another day than `now`, and the year
 * when it falls in another year. `timeZone` is for tests.
 */
export function formatTime(date: Date, now: Date, timeZone?: string): string {
  const dayOf = (d: Date) =>
    d.toLocaleDateString('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  if (dayOf(date) !== dayOf(now)) {
    options.month = 'short';
    options.day = 'numeric';
    if (dayOf(date).slice(0, 4) !== dayOf(now).slice(0, 4)) {
      options.year = 'numeric';
    }
  }
  return date.toLocaleString(undefined, options);
}
