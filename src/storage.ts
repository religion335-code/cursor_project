import type { ShopStore } from "./types";

export const storageKey = "yilan-bbq-rice-v1";

export const emptyStore: ShopStore = {
  cart: [],
  orders: [],
  soldOut: [],
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
    };
  } catch {
    return emptyStore;
  }
}

export function saveStore(store: ShopStore): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(store));
}
