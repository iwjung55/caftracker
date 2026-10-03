/**
 * Local-time helpers. All storage is UTC epoch ms; "days" are logical days
 * in the viewer's local time that start at `dayStartMin` (default 04:00),
 * so a 1 am study espresso counts toward the evening before it.
 * Date#setHours handles DST transitions for us.
 */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Start (epoch ms) of the logical day containing `t`. */
export function logicalDayStart(t: number, dayStartMin: number): number {
  const d = new Date(t);
  const minutes = d.getHours() * 60 + d.getMinutes();
  if (minutes < dayStartMin) d.setDate(d.getDate() - 1);
  d.setHours(Math.floor(dayStartMin / 60), dayStartMin % 60, 0, 0);
  return d.getTime();
}

/** Start of the logical day `offset` days from the one containing `t`. */
export function shiftLogicalDay(dayStart: number, offset: number, dayStartMin: number): number {
  const d = new Date(dayStart);
  d.setDate(d.getDate() + offset);
  d.setHours(Math.floor(dayStartMin / 60), dayStartMin % 60, 0, 0);
  return d.getTime();
}

/** Stable key like '2026-10-02' for the logical day containing `t`. */
export function logicalDayKey(t: number, dayStartMin: number): string {
  const d = new Date(logicalDayStart(t, dayStartMin));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Bedtime that ends the logical day containing `t`. A bedtime earlier in
 * the clock than the day start (e.g. 00:30 with a 04:00 day start) falls
 * on the following calendar date.
 */
export function bedtimeFor(t: number, bedtimeMin: number, dayStartMin: number): number {
  const d = new Date(logicalDayStart(t, dayStartMin));
  if (bedtimeMin < dayStartMin) d.setDate(d.getDate() + 1);
  d.setHours(Math.floor(bedtimeMin / 60), bedtimeMin % 60, 0, 0);
  return d.getTime();
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const hourFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const formatTime = (t: number) => timeFmt.format(t);
export const formatHour = (t: number) => hourFmt.format(t);
export const formatWeekday = (t: number) => weekdayFmt.format(t);
export const formatDate = (t: number) => dateFmt.format(t);

/** "in 3 h 20 min" / "40 min ago" */
export function formatRelative(target: number, now: number): string {
  const diff = target - now;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / HOUR);
  const m = Math.round((abs % HOUR) / MINUTE);
  const span = h > 0 ? (m > 0 ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
  return diff >= 0 ? `in ${span}` : `${span} ago`;
}

/** Minutes-after-midnight ↔ 'HH:MM' for <input type="time">. */
export const minToHHMM = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
export function hhmmToMin(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

export function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/** Minutes-after-midnight as a locale clock time, e.g. 240 → '4:00 AM'. */
export function formatClockMin(min: number): string {
  const d = new Date();
  d.setHours(Math.floor(min / 60) % 24, min % 60, 0, 0);
  return formatTime(d.getTime());
}
