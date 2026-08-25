import { minutesFromHhmm } from "./money";
import { taipeiClock } from "./shop";
import type { GrillJob, PickupOrder, ShopStore } from "./types";

export const SLOT_COUNT = 6;
export const DEFAULT_DEMO_SPEED = 30;

export const grillTimes: Record<string, { minutes: number; short: string }> = {
  "pork-loin": { minutes: 4, short: "里肌" },
  "pork-belly": { minutes: 5, short: "五花" },
  "pork-rib": { minutes: 7, short: "排骨" },
  chicken: { minutes: 6, short: "雞腿" },
  combo: { minutes: 5, short: "雙拼" },
  "extra-pork": { minutes: 3, short: "加烤肉" },
};

export function isGrillable(itemId: string): boolean {
  return itemId in grillTimes;
}

export function durationMs(itemId: string, demoSpeed: number): number {
  const spec = grillTimes[itemId];
  if (!spec) return 0;
  const speed = demoSpeed > 0 ? demoSpeed : 1;
  return Math.round((spec.minutes * 60 * 1000) / speed);
}

export function needsGrill(order: PickupOrder): boolean {
  return order.lines.some((line) => isGrillable(line.itemId));
}

export function maxGrillMinutes(order: PickupOrder): number {
  let max = 0;
  for (const line of order.lines) {
    const spec = grillTimes[line.itemId];
    if (spec) max = Math.max(max, spec.minutes);
  }
  return max;
}

/** Start the motors a few minutes before pickup so plating is not late. */
export function shouldMount(order: PickupOrder, now: Date): boolean {
  if (!needsGrill(order)) return false;
  const clock = taipeiClock(now);
  if (order.isoDate < clock.isoDate) return true;
  if (order.isoDate > clock.isoDate) return false;
  const pickup = minutesFromHhmm(order.pickupAt);
  const lead = maxGrillMinutes(order) + 2;
  return clock.minutes >= pickup - lead;
}

export function mountableIds(
  orders: PickupOrder[],
  nowMs: number,
  forcedMount: string[],
): Set<string> {
  const forced = new Set(forcedMount);
  const now = new Date(nowMs);
  const ids = new Set<string>();
  for (const order of orders) {
    if (forced.has(order.id) || shouldMount(order, now)) ids.add(order.id);
  }
  return ids;
}

export function jobsFromOrder(order: PickupOrder, demoSpeed: number): GrillJob[] {
  const jobs: GrillJob[] = [];
  let seq = 0;
  for (const line of order.lines) {
    if (!isGrillable(line.itemId)) continue;
    const duration = durationMs(line.itemId, demoSpeed);
    for (let i = 0; i < line.qty; i += 1) {
      jobs.push({
        id: `${order.id}#${seq}`,
        orderId: order.id,
        itemId: line.itemId,
        sauce: line.sauce,
        note: line.note,
        slot: null,
        startedAt: null,
        durationMs: duration,
        doneAt: null,
      });
      seq += 1;
    }
  }
  return jobs;
}

export function occupiedSlots(jobs: GrillJob[]): Set<number> {
  const taken = new Set<number>();
  for (const job of jobs) {
    if (job.slot !== null && job.doneAt === null) taken.add(job.slot);
  }
  return taken;
}

export function completeDueJobs(jobs: GrillJob[], nowMs: number): GrillJob[] {
  return jobs.map((job) => {
    if (job.doneAt !== null || job.startedAt === null) return job;
    if (nowMs >= job.startedAt + job.durationMs) {
      return { ...job, doneAt: job.startedAt + job.durationMs, slot: null };
    }
    return job;
  });
}

export function mountWaitingJobs(
  jobs: GrillJob[],
  nowMs: number,
  slotCount = SLOT_COUNT,
  allowedIds?: Set<string>,
): GrillJob[] {
  const next = jobs.map((job) => ({ ...job }));
  const taken = occupiedSlots(next);
  const waiting = next.filter((job) => job.doneAt === null && job.startedAt === null);
  for (const job of waiting) {
    if (allowedIds && !allowedIds.has(job.orderId)) continue;
    let free = -1;
    for (let slot = 0; slot < slotCount; slot += 1) {
      if (!taken.has(slot)) {
        free = slot;
        break;
      }
    }
    if (free < 0) break;
    job.slot = free;
    job.startedAt = nowMs;
    taken.add(free);
  }
  return next;
}

export function advanceRack(
  jobs: GrillJob[],
  nowMs: number,
  allowedIds?: Set<string>,
): GrillJob[] {
  return mountWaitingJobs(completeDueJobs(jobs, nowMs), nowMs, SLOT_COUNT, allowedIds);
}

export function dropOrderJobs(jobs: GrillJob[], orderId: string): GrillJob[] {
  return jobs.filter((job) => job.orderId !== orderId);
}

export function finishOrderJobs(jobs: GrillJob[], orderId: string, nowMs: number): GrillJob[] {
  return jobs.map((job) =>
    job.orderId === orderId && job.doneAt === null
      ? { ...job, doneAt: nowMs, slot: null }
      : job,
  );
}

export function ensureJobs(
  orders: PickupOrder[],
  jobs: GrillJob[],
  demoSpeed: number,
): GrillJob[] {
  const have = new Set(jobs.map((job) => job.orderId));
  let extra: GrillJob[] = [];
  for (const order of orders) {
    if (order.status === "cancelled" || order.status === "done" || order.status === "ready") {
      continue;
    }
    if (have.has(order.id)) continue;
    extra = extra.concat(jobsFromOrder(order, demoSpeed));
  }
  return extra.length === 0 ? jobs : [...jobs, ...extra];
}

export function syncOrderStatus(orders: PickupOrder[], jobs: GrillJob[]): PickupOrder[] {
  return orders.map((order) => {
    if (order.status === "cancelled" || order.status === "done") return order;
    const mine = jobs.filter((job) => job.orderId === order.id);
    if (mine.length === 0) {
      if (needsGrill(order)) {
        return order.status === "queued" ? order : { ...order, status: "queued" as const };
      }
      return order.status === "ready" ? order : { ...order, status: "ready" as const };
    }
    if (mine.every((job) => job.doneAt !== null)) {
      return order.status === "ready" ? order : { ...order, status: "ready" as const };
    }
    if (mine.some((job) => job.slot !== null)) {
      return order.status === "grilling" ? order : { ...order, status: "grilling" as const };
    }
    return order.status === "queued" ? order : { ...order, status: "queued" as const };
  });
}

export function tickRack(store: ShopStore, nowMs: number): ShopStore {
  const seeded = ensureJobs(store.orders, store.jobs, store.demoSpeed);
  const jobs = advanceRack(
    seeded,
    nowMs,
    mountableIds(store.orders, nowMs, store.forcedMount),
  );
  const orders = syncOrderStatus(store.orders, jobs);
  return { ...store, jobs, orders };
}

export function rackFingerprint(store: Pick<ShopStore, "jobs" | "orders">): string {
  const jobs = store.jobs
    .map((job) => `${job.id}:${job.slot}:${job.startedAt}:${job.doneAt}`)
    .join(",");
  const orders = store.orders.map((order) => `${order.id}:${order.status}`).join(",");
  return `${jobs}|${orders}`;
}

export function slotView(jobs: GrillJob[], slotCount = SLOT_COUNT): Array<GrillJob | null> {
  const slots: Array<GrillJob | null> = Array.from({ length: slotCount }, () => null);
  for (const job of jobs) {
    if (job.slot !== null && job.doneAt === null) slots[job.slot] = job;
  }
  return slots;
}

export function waitingJobs(jobs: GrillJob[]): GrillJob[] {
  return jobs.filter((job) => job.doneAt === null && job.startedAt === null);
}

export function jobProgress(job: GrillJob, nowMs: number): number {
  if (job.doneAt !== null) return 1;
  if (job.startedAt === null) return 0;
  return Math.min(1, Math.max(0, (nowMs - job.startedAt) / job.durationMs));
}

export function remainingMs(job: GrillJob, nowMs: number): number {
  if (job.doneAt !== null) return 0;
  if (job.startedAt === null) return job.durationMs;
  return Math.max(0, job.startedAt + job.durationMs - nowMs);
}

export function formatRemain(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds <= 0) return "好了";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes <= 0) return `${rest} 秒`;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
