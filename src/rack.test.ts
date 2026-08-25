import { describe, expect, it } from "vitest";
import { addLine } from "./cart";
import { placeOrder } from "./orders";
import { emptyStore } from "./storage";
import {
  DEFAULT_DEMO_SPEED,
  SLOT_COUNT,
  advanceRack,
  durationMs,
  jobsFromOrder,
  shouldMount,
  syncOrderStatus,
  tickRack,
  waitingJobs,
} from "./rack";
import type { PickupOrder } from "./types";

const tuesdayLunch = new Date("2026-08-25T11:00:00+08:00");

function orderWith(itemId: string, qty = 1): PickupOrder {
  let lines = addLine([], itemId);
  for (let i = 1; i < qty; i += 1) lines = addLine(lines, itemId);
  const result = placeOrder(
    [],
    lines,
    {
      customerName: "林小姐",
      phone: "0912345678",
      isoDate: "2026-08-25",
      window: "lunch",
      pickupAt: "11:15",
    },
    tuesdayLunch,
  );
  if (!result.ok) throw new Error(result.error);
  return result.order;
}

describe("automatic rack", () => {
  it("turns a 4-minute loin into 8 seconds at 30x demo speed", () => {
    expect(durationMs("pork-loin", DEFAULT_DEMO_SPEED)).toBe(8000);
  });

  it("makes one hook job per grilled portion and ignores drinks", () => {
    const pork = orderWith("pork-loin", 2);
    const mixed: PickupOrder = {
      ...pork,
      lines: [...pork.lines, { itemId: "barley-tea", qty: 1, sauce: "normal", note: "" }],
    };
    const jobs = jobsFromOrder(mixed, DEFAULT_DEMO_SPEED);
    expect(jobs).toHaveLength(2);
    expect(jobs.every((job) => job.itemId === "pork-loin")).toBe(true);
  });

  it("fills six hooks and holds the seventh until a hook frees", () => {
    const order = orderWith("pork-loin", 7);
    const jobs = jobsFromOrder(order, DEFAULT_DEMO_SPEED);
    const t0 = 1_000;
    const mounted = advanceRack(jobs, t0);
    expect(mounted.filter((job) => job.slot !== null)).toHaveLength(SLOT_COUNT);
    expect(waitingJobs(mounted)).toHaveLength(1);

    const still = advanceRack(mounted, t0 + 7_999);
    expect(waitingJobs(still)).toHaveLength(1);

    const after = advanceRack(still, t0 + 8_000);
    expect(after.filter((job) => job.doneAt !== null)).toHaveLength(6);
    expect(after.filter((job) => job.slot !== null)).toHaveLength(1);
    expect(waitingJobs(after)).toHaveLength(0);
  });

  it("marks the ticket ready when every hook for that order is done", () => {
    const order = orderWith("pork-rib");
    const t0 = 5_000;
    const roasting = advanceRack(jobsFromOrder(order, DEFAULT_DEMO_SPEED), t0);
    expect(syncOrderStatus([order], roasting)[0]?.status).toBe("grilling");

    const done = advanceRack(roasting, t0 + durationMs("pork-rib", DEFAULT_DEMO_SPEED));
    expect(syncOrderStatus([order], done)[0]?.status).toBe("ready");
  });

  it("sends drink-only tickets straight to the pickup counter", () => {
    const tea = orderWith("barley-tea");
    expect(jobsFromOrder(tea, DEFAULT_DEMO_SPEED)).toEqual([]);
    expect(syncOrderStatus([tea], [])[0]?.status).toBe("ready");
  });

  it("does not light the charcoal for a next-day lunch until staff forces it", () => {
    const night = new Date("2026-08-25T21:00:00+08:00");
    const result = placeOrder(
      [],
      addLine([], "pork-loin"),
      {
        customerName: "陳先生",
        phone: "0912345678",
        isoDate: "2026-08-26",
        window: "lunch",
        pickupAt: "10:30",
      },
      night,
    );
    if (!result.ok) throw new Error(result.error);
    expect(shouldMount(result.order, night)).toBe(false);

    const seeded = {
      ...emptyStore,
      orders: [result.order],
      jobs: jobsFromOrder(result.order, DEFAULT_DEMO_SPEED),
    };
    const waiting = tickRack(seeded, night.getTime());
    expect(waiting.jobs.every((job) => job.slot === null)).toBe(true);
    expect(waiting.orders[0]?.status).toBe("queued");

    const forced = tickRack(
      { ...waiting, forcedMount: [result.order.id] },
      night.getTime(),
    );
    expect(forced.jobs[0]?.slot).toBe(0);
    expect(forced.orders[0]?.status).toBe("grilling");
  });

  it("starts a same-day ticket a few minutes before pickup", () => {
    const order = orderWith("pork-loin");
    expect(shouldMount(order, tuesdayLunch)).toBe(false);
    expect(shouldMount(order, new Date("2026-08-25T11:10:00+08:00"))).toBe(true);
  });
});
