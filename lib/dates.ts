export const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
] as const;

export function weekdayLabel(value: number) {
  return WEEKDAYS.find((day) => day.value === value)?.label ?? "Day";
}

export function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function mondayOf(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  return addDays(isoDate, delta);
}

export function todayISO(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function monthKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

export function upcomingMonthKeys(timeZone: string, monthsAhead = 12) {
  const [year, month] = monthKeyInTimeZone(new Date(), timeZone).split("-").map(Number);
  return Array.from({ length: monthsAhead + 1 }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

function zoneWallClock(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  const hour = value.hour === "24" ? 0 : Number(value.hour);
  return Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    hour,
    Number(value.minute),
    Number(value.second),
  );
}

export function zonedTimeToUtc(isoDate: string, time: string, timeZone: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const corrected = utcGuess - (zoneWallClock(new Date(utcGuess), timeZone) - utcGuess);
  const offset = zoneWallClock(new Date(corrected), timeZone) - corrected;
  return new Date(utcGuess - offset);
}

export function weekBounds(weekStart: string, timeZone: string) {
  const next = addDays(weekStart, 7);
  return {
    from: zonedTimeToUtc(weekStart, "00:00", timeZone).toISOString(),
    to: zonedTimeToUtc(next, "00:00", timeZone).toISOString(),
  };
}

export function dayBounds(isoDate: string, timeZone: string) {
  return {
    from: zonedTimeToUtc(isoDate, "00:00", timeZone).toISOString(),
    to: zonedTimeToUtc(addDays(isoDate, 1), "00:00", timeZone).toISOString(),
  };
}
