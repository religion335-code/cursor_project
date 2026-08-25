import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { addLine, setNote, setQty, setSauce } from "./cart";
import { placeOrder, type DraftOrder } from "./orders";
import { loadStore, saveStore } from "./storage";
import type { CartLine, OrderStatus, PickupOrder, Sauce } from "./types";

type ShopContextValue = {
  now: Date;
  cart: CartLine[];
  orders: PickupOrder[];
  soldOut: string[];
  lastReceipt: PickupOrder | null;
  addToCart: (itemId: string) => void;
  changeQty: (key: string, qty: number) => void;
  changeSauce: (key: string, sauce: Sauce) => void;
  changeNote: (key: string, note: string) => void;
  clearCart: () => void;
  checkout: (draft: DraftOrder) => { ok: true; order: PickupOrder } | { ok: false; error: string };
  setOrderStatus: (id: string, status: OrderStatus) => void;
  toggleSoldOut: (itemId: string) => void;
  resetShop: () => void;
  dismissReceipt: () => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [store, setStore] = useState(loadStore);
  const [lastReceipt, setLastReceipt] = useState<PickupOrder | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const addToCart = useCallback((itemId: string) => {
    setStore((prev) => {
      if (prev.soldOut.includes(itemId)) return prev;
      return { ...prev, cart: addLine(prev.cart, itemId) };
    });
  }, []);

  const changeQty = useCallback((key: string, qty: number) => {
    setStore((prev) => ({ ...prev, cart: setQty(prev.cart, key, qty) }));
  }, []);

  const changeSauce = useCallback((key: string, sauce: Sauce) => {
    setStore((prev) => ({ ...prev, cart: setSauce(prev.cart, key, sauce) }));
  }, []);

  const changeNote = useCallback((key: string, note: string) => {
    setStore((prev) => ({ ...prev, cart: setNote(prev.cart, key, note) }));
  }, []);

  const clearCart = useCallback(() => {
    setStore((prev) => ({ ...prev, cart: [] }));
  }, []);

  const checkout = useCallback((draft: DraftOrder) => {
    const result = placeOrder(store.orders, store.cart, draft, new Date());
    if (!result.ok) return result;
    setLastReceipt(result.order);
    setStore((prev) => ({
      ...prev,
      cart: [],
      orders: [result.order, ...prev.orders],
    }));
    return result;
  }, [store]);

  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setStore((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => (order.id === id ? { ...order, status } : order)),
    }));
  }, []);

  const toggleSoldOut = useCallback((itemId: string) => {
    setStore((prev) => ({
      ...prev,
      soldOut: prev.soldOut.includes(itemId)
        ? prev.soldOut.filter((id) => id !== itemId)
        : [...prev.soldOut, itemId],
    }));
  }, []);

  const resetShop = useCallback(() => {
    setStore({ cart: [], orders: [], soldOut: [] });
    setLastReceipt(null);
  }, []);

  const dismissReceipt = useCallback(() => setLastReceipt(null), []);

  const value = useMemo(
    () => ({
      now,
      cart: store.cart,
      orders: store.orders,
      soldOut: store.soldOut,
      lastReceipt,
      addToCart,
      changeQty,
      changeSauce,
      changeNote,
      clearCart,
      checkout,
      setOrderStatus,
      toggleSoldOut,
      resetShop,
      dismissReceipt,
    }),
    [
      now,
      store,
      lastReceipt,
      addToCart,
      changeQty,
      changeSauce,
      changeNote,
      clearCart,
      checkout,
      setOrderStatus,
      toggleSoldOut,
      resetShop,
      dismissReceipt,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
