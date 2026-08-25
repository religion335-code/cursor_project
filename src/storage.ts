import { DEFAULT_DEMO_SPEED } from "./rack";
import type { ShopStore } from "./types";

export const storageKey = "yilan-bbq-rice-v1";

export const emptyStore: ShopStore = {
  cart: [],
  orders: [],
  soldOut: [],
  jobs: [],
  demoSpeed: DEFAULT_DEMO_SPEED,
};

export function loadStore(): ShopStore {
  if (typeof localStorage === "undefined") return emptyStore;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return emptyStore;
    const parsed = JSON.parse(raw) as Partial<ShopStore>;
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      soldOut: Array.isArray(parsed.soldOut) ? parsed.soldOut : [],
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      demoSpeed:
        typeof parsed.demoSpeed === "number" && parsed.demoSpeed > 0
          ? parsed.demoSpeed
          : DEFAULT_DEMO_SPEED,
    };
  } catch {
    return emptyStore;
  }
}

export function saveStore(store: ShopStore): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(store));
}
