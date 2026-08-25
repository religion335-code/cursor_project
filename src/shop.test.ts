import { describe, expect, it } from "vitest";
import { availableSlots, shopStatus, soupOfDay, taipeiClock } from "./shop";

function at(iso: string): Date {
  return new Date(iso);
}

describe("taipeiClock", () => {
  it("reads Tuesday lunch hour in Taipei, not UTC", () => {
    const clock = taipeiClock(at("2026-08-25T11:00:00+08:00"));
    expect(clock.weekday).toBe(2);
    expect(clock.hour).toBe(11);
    expect(clock.isoDate).toBe("2026-08-25");
    expect(clock.mmdd).toBe("0825");
  });
});

describe("shopStatus", () => {
  it("is open during Tuesday lunch", () => {
    const status = shopStatus(at("2026-08-25T11:05:00+08:00"));
    expect(status.open).toBe(true);
    expect(status.window).toBe("lunch");
    expect(status.label).toBe("午餐營業中");
  });

  it("rests between lunch and dinner", () => {
    const status = shopStatus(at("2026-08-25T14:10:00+08:00"));
    expect(status.open).toBe(false);
    expect(status.label).toBe("午後休息");
  });

  it("is open during Tuesday dinner", () => {
    const status = shopStatus(at("2026-08-25T17:00:00+08:00"));
    expect(status.open).toBe(true);
    expect(status.window).toBe("dinner");
  });

  it("is closed after the dinner window", () => {
    const status = shopStatus(at("2026-08-25T20:00:00+08:00"));
    expect(status.open).toBe(false);
    expect(status.label).toBe("今日已收爐");
  });

  it("is closed all day Sunday", () => {
    const status = shopStatus(at("2026-08-30T12:00:00+08:00"));
    expect(status.open).toBe(false);
    expect(status.label).toBe("週日公休");
  });

  it("is not yet open before 10:30", () => {
    const status = shopStatus(at("2026-08-25T09:00:00+08:00"));
    expect(status.open).toBe(false);
    expect(status.label).toBe("尚未開烤");
  });
});

describe("availableSlots", () => {
  it("skips slots that are already too soon during an open window", () => {
    const slots = availableSlots(at("2026-08-25T11:00:00+08:00"));
    expect(slots[0]?.pickupAt).toBe("11:15");
    expect(slots.some((slot) => slot.window === "lunch" && slot.pickupAt === "10:30")).toBe(
      false,
    );
    expect(slots.some((slot) => slot.window === "dinner")).toBe(true);
  });

  it("rolls to Monday lunch after Sunday", () => {
    const slots = availableSlots(at("2026-08-30T12:00:00+08:00"));
    expect(slots[0]?.isoDate).toBe("2026-08-31");
    expect(slots[0]?.window).toBe("lunch");
    expect(slots[0]?.pickupAt).toBe("10:30");
  });

  it("rolls to next-day lunch after dinner closes", () => {
    const slots = availableSlots(at("2026-08-25T20:05:00+08:00"));
    expect(slots[0]?.isoDate).toBe("2026-08-26");
    expect(slots[0]?.window).toBe("lunch");
  });
});

describe("soupOfDay", () => {
  it("follows weekday index", () => {
    expect(soupOfDay(2)).toBe("紫菜貢丸湯");
  });
});
