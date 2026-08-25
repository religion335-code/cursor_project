import { hhmmFromMinutes, minutesFromHhmm } from "./money";
import type { ServiceWindowId } from "./types";

export const shop = {
  name: "宜蘭烤肉飯",
  mark: "炭火舖",
  tagline: "炭火現烤，熱飯現蓋",
  lede: "火車站步行八分鐘的炭火便當。里肌、五花、排骨現場刷醬下炭，蓋上剛起鍋的白飯。內用位子不多，外帶的人更多；太晚來，招牌會先賣光。",
  address: "宜蘭縣宜蘭市農權路一段 58 號",
  walk: "宜蘭火車站步行約 8 分鐘",
  lineId: "@yilanbbq",
  seats: "內用約 8 席",
  payment: "現金、LINE Pay",
  note: "售完提早打烊。配菜與當日湯由廚房決定，不另挑菜。",
  mapsQuery: "宜蘭市農權路一段58號",
} as const;

export const lunch = { id: "lunch" as const, label: "午餐", start: "10:30", end: "13:30" };
export const dinner = { id: "dinner" as const, label: "晚餐", start: "16:30", end: "19:30" };
export const windows = [lunch, dinner];

/** Sunday. Date.getDay() style, Taipei local. */
export const closedWeekdays = [0];

export const weekdayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

const soups = [
  "味噌海帶芽湯",
  "冬瓜玉米湯",
  "紫菜貢丸湯",
  "番茄蛋花湯",
  "玉米濃湯",
  "白蘿蔔排骨湯",
  "金針菇蛋花湯",
];

export type TaipeiClock = {
  weekday: number;
  hour: number;
  minute: number;
  year: number;
  month: number;
  day: number;
  mmdd: string;
  isoDate: string;
  minutes: number;
};

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function taipeiClock(now: Date): TaipeiClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = weekdayMap[get("weekday")] ?? 0;
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return {
    weekday,
    hour,
    minute,
    year,
    month,
    day,
    mmdd: `${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`,
    isoDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    minutes: hour * 60 + minute,
  };
}

export function isClosedWeekday(weekday: number): boolean {
  return closedWeekdays.includes(weekday);
}

export function soupOfDay(weekday: number): string {
  return soups[weekday] ?? soups[1];
}

export type ShopStatus = {
  open: boolean;
  window: ServiceWindowId | null;
  label: string;
  detail: string;
};

export function shopStatus(now: Date): ShopStatus {
  const clock = taipeiClock(now);
  if (isClosedWeekday(clock.weekday)) {
    return {
      open: false,
      window: null,
      label: "週日公休",
      detail: "下一爐是週一 10:30 午餐",
    };
  }

  const lunchStart = minutesFromHhmm(lunch.start);
  const lunchEnd = minutesFromHhmm(lunch.end);
  const dinnerStart = minutesFromHhmm(dinner.start);
  const dinnerEnd = minutesFromHhmm(dinner.end);
  const t = clock.minutes;

  if (t >= lunchStart && t < lunchEnd) {
    return {
      open: true,
      window: "lunch",
      label: "午餐營業中",
      detail: `收到 ${lunch.end}`,
    };
  }
  if (t >= dinnerStart && t < dinnerEnd) {
    return {
      open: true,
      window: "dinner",
      label: "晚餐營業中",
      detail: `收到 ${dinner.end}，晚來會賣光`,
    };
  }
  if (t < lunchStart) {
    return {
      open: false,
      window: null,
      label: "尚未開烤",
      detail: `今日午餐 ${lunch.start} 開爐`,
    };
  }
  if (t >= lunchEnd && t < dinnerStart) {
    return {
      open: false,
      window: null,
      label: "午後休息",
      detail: `晚餐 ${dinner.start} 再開`,
    };
  }
  return {
    open: false,
    window: null,
    label: "今日已收爐",
    detail: "可先預訂下一營業日午餐",
  };
}

export type ServiceSlot = {
  isoDate: string;
  weekday: number;
  window: ServiceWindowId;
  label: string;
  pickupAt: string;
};

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const next = new Date(utc);
  const year = next.getUTCFullYear();
  const month = next.getUTCMonth() + 1;
  const day = next.getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekdayFromIso(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function windowById(id: ServiceWindowId) {
  return id === "lunch" ? lunch : dinner;
}

export function slotTimes(windowId: ServiceWindowId, step = 15): string[] {
  const w = windowById(windowId);
  const start = minutesFromHhmm(w.start);
  const end = minutesFromHhmm(w.end);
  const out: string[] = [];
  for (let t = start; t < end; t += step) {
    out.push(hhmmFromMinutes(t));
  }
  return out;
}

/**
 * Next pickup slots a customer can actually use.
 * Prep buffer is 15 minutes when the window is already open.
 */
export function availableSlots(now: Date, prepMinutes = 15): ServiceSlot[] {
  const clock = taipeiClock(now);
  const out: ServiceSlot[] = [];

  const consider = (isoDate: string, weekday: number, windowId: ServiceWindowId) => {
    if (isClosedWeekday(weekday)) return;
    const w = windowById(windowId);
    const sameDay = isoDate === clock.isoDate;
    const earliest = sameDay ? clock.minutes + prepMinutes : minutesFromHhmm(w.start);
    for (const pickupAt of slotTimes(windowId)) {
      const t = minutesFromHhmm(pickupAt);
      if (t < minutesFromHhmm(w.start) || t >= minutesFromHhmm(w.end)) continue;
      if (t < earliest) continue;
      out.push({
        isoDate,
        weekday,
        window: windowId,
        label: `${isoDate === clock.isoDate ? "今天" : weekdayNames[weekday]} ${w.label} ${pickupAt}`,
        pickupAt,
      });
    }
  };

  consider(clock.isoDate, clock.weekday, "lunch");
  consider(clock.isoDate, clock.weekday, "dinner");

  let iso = clock.isoDate;
  let weekday = clock.weekday;
  let guard = 0;
  while (out.length === 0 && guard < 8) {
    iso = addDaysIso(iso, 1);
    weekday = weekdayFromIso(iso);
    consider(iso, weekday, "lunch");
    consider(iso, weekday, "dinner");
    guard += 1;
  }

  return out;
}

export function hoursRows(): { day: string; value: string }[] {
  return weekdayNames.map((day, i) => ({
    day,
    value: isClosedWeekday(i)
      ? "公休"
      : `${lunch.start}–${lunch.end}　${dinner.start}–${dinner.end}`,
  }));
}
