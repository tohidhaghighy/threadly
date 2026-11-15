export type JalaliDate = { jy: number; jm: number; jd: number };

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Saturday-first weekday labels */
export const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const LEAP_REMAINDERS = new Set([1, 5, 9, 13, 17, 22, 26, 30]);

export function isJalaliLeap(jy: number) {
  return LEAP_REMAINDERS.has(((jy % 33) + 33) % 33);
}

export function jalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

/** Convert a Gregorian civil date to Jalali. */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gdm[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/** Convert a Jalali date to Gregorian civil components. */
export function jalaliToGregorian(jy: number, jm: number, jd: number) {
  const year = jy + 1595;
  let days =
    -355668 +
    365 * year +
    Math.floor(year / 33) * 8 +
    Math.floor(((year % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const md = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  for (; gm <= 12 && gd > md[gm]; gm++) gd -= md[gm];
  return { gy, gm, gd };
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(gy: number, gm: number, gd: number) {
  return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

export function parseIsoDate(value: string): { gy: number; gm: number; gd: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const gy = Number(match[1]);
  const gm = Number(match[2]);
  const gd = Number(match[3]);
  if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;
  return { gy, gm, gd };
}

export function isoToJalali(value: string): JalaliDate | null {
  const g = parseIsoDate(value);
  if (!g) return null;
  return gregorianToJalali(g.gy, g.gm, g.gd);
}

export function jalaliToIso(j: JalaliDate) {
  const g = jalaliToGregorian(j.jy, j.jm, j.jd);
  return toIsoDate(g.gy, g.gm, g.gd);
}

export function formatJalali(j: JalaliDate) {
  return `${j.jy.toLocaleString("fa-IR", { useGrouping: false })}/${pad2(j.jm).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}/${pad2(j.jd).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}`;
}

/** Saturday = 0 … Friday = 6 */
export function jalaliWeekday(j: JalaliDate) {
  const g = jalaliToGregorian(j.jy, j.jm, j.jd);
  const jsDay = new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay();
  return (jsDay + 1) % 7;
}

export function todayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function compareJalali(a: JalaliDate, b: JalaliDate) {
  if (a.jy !== b.jy) return a.jy - b.jy;
  if (a.jm !== b.jm) return a.jm - b.jm;
  return a.jd - b.jd;
}
