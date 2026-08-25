import { cartTotal } from "./cart";
import { availableSlots, taipeiClock } from "./shop";
import type { CartLine, PickupOrder, ServiceWindowId } from "./types";

export function nextOrderId(existing: PickupOrder[], now: Date): string {
  const { mmdd } = taipeiClock(now);
  const prefix = `YL-${mmdd}-`;
  const seq = existing.filter((order) => order.id.startsWith(prefix)).length + 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\s|-/g, "");
}

export function isValidPhone(raw: string): boolean {
  const phone = normalizePhone(raw);
  return /^09\d{8}$/.test(phone) || /^0[2-8]\d{7,8}$/.test(phone);
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 20;
}

export type DraftOrder = {
  customerName: string;
  phone: string;
  isoDate: string;
  window: ServiceWindowId;
  pickupAt: string;
};

export function placeOrder(
  existing: PickupOrder[],
  lines: CartLine[],
  draft: DraftOrder,
  now: Date,
): { ok: true; order: PickupOrder } | { ok: false; error: string } {
  if (lines.length === 0) return { ok: false, error: "購物袋是空的" };
  if (!isValidName(draft.customerName)) return { ok: false, error: "請留下取餐姓名" };
  if (!isValidPhone(draft.phone)) return { ok: false, error: "電話請填手機或市話" };

  const slots = availableSlots(now);
  const match = slots.find(
    (slot) =>
      slot.isoDate === draft.isoDate &&
      slot.window === draft.window &&
      slot.pickupAt === draft.pickupAt,
  );
  if (!match) return { ok: false, error: "這個取餐時段已經過了，請另選" };

  const order: PickupOrder = {
    id: nextOrderId(existing, now),
    createdAt: now.toISOString(),
    isoDate: draft.isoDate,
    customerName: draft.customerName.trim(),
    phone: normalizePhone(draft.phone),
    window: draft.window,
    pickupAt: draft.pickupAt,
    lines,
    total: cartTotal(lines),
    status: "queued",
  };
  return { ok: true, order };
}

export function todaysOrders(orders: PickupOrder[], now: Date): PickupOrder[] {
  const { isoDate } = taipeiClock(now);
  return orders.filter((order) => order.isoDate === isoDate);
}

export const statusLabels: Record<PickupOrder["status"], string> = {
  queued: "排隊",
  grilling: "炭烤中",
  ready: "可取餐",
  done: "已取",
  cancelled: "取消",
};
