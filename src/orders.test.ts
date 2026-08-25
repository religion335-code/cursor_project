import { describe, expect, it } from "vitest";
import { addLine } from "./cart";
import { nextOrderId, placeOrder } from "./orders";

const tuesdayLunch = new Date("2026-08-25T11:00:00+08:00");

describe("placeOrder", () => {
  it("rejects an empty cart", () => {
    const result = placeOrder(
      [],
      [],
      {
        customerName: "林小姐",
        phone: "0912345678",
        isoDate: "2026-08-25",
        window: "lunch",
        pickupAt: "11:15",
      },
      tuesdayLunch,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a bad phone number", () => {
    const result = placeOrder(
      [],
      addLine([], "pork-loin"),
      {
        customerName: "林小姐",
        phone: "123",
        isoDate: "2026-08-25",
        window: "lunch",
        pickupAt: "11:15",
      },
      tuesdayLunch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/電話/);
  });

  it("rejects a slot that already passed", () => {
    const result = placeOrder(
      [],
      addLine([], "pork-loin"),
      {
        customerName: "林小姐",
        phone: "0912345678",
        isoDate: "2026-08-25",
        window: "lunch",
        pickupAt: "10:30",
      },
      tuesdayLunch,
    );
    expect(result.ok).toBe(false);
  });

  it("issues sequential ticket ids for the Taipei day", () => {
    const first = placeOrder(
      [],
      addLine([], "pork-rib"),
      {
        customerName: "林小姐",
        phone: "03-9351234",
        isoDate: "2026-08-25",
        window: "lunch",
        pickupAt: "11:15",
      },
      tuesdayLunch,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.order.id).toBe("YL-0825-001");
    expect(first.order.total).toBe(110);
    expect(first.order.status).toBe("queued");
    expect(nextOrderId([first.order], tuesdayLunch)).toBe("YL-0825-002");
  });
});
