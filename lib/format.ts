export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

export function discountCents(priceCents: number, percent: number) {
  if (percent <= 0 || priceCents <= 0) return 0;
  return Math.min(priceCents, Math.round((priceCents * percent) / 100));
}

export function priceAfterPercent(priceCents: number, percent: number) {
  return priceCents - discountCents(priceCents, percent);
}

export function formatWhen(iso: string, timeZone: string, locale: "en" | "vi" = "en") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-SG", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone: string, locale: "en" | "vi" = "en") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-SG", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(iso: string, timeZone: string, locale: "en" | "vi" = "en") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-SG", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function dayKey(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function timeInputValue(value: string) {
  return value.slice(0, 5);
}

export function timeInputFromIso(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour === "24" ? "00" : hour}:${minute}`;
}

export function spotsLabel(taken: number, capacity: number) {
  const left = Math.max(capacity - taken, 0);
  if (left === 0) return "Full";
  if (left === 1) return "1 spot left";
  return `${left} spots left`;
}

export function creditsLabel(used: number, total: number) {
  const left = Math.max(total - used, 0);
  if (left === 0) return `${used}/${total} · used up`;
  return `${used}/${total} · ${left} left`;
}
