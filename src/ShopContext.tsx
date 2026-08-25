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
import {
  DEFAULT_DEMO_SPEED,
  dropOrderJobs,
  finishOrderJobs,
  jobsFromOrder,
  rackFingerprint,
  syncOrderStatus,
  tickRack,
} from "./rack";
import { emptyStore, loadStore, saveStore } from "./storage";
import type { CartLine, GrillJob, OrderStatus, PickupOrder, Sauce } from "./types";

type ShopContextValue = {
  now: Date;
  cart: CartLine[];
  orders: PickupOrder[];
  soldOut: string[];
  jobs: GrillJob[];
  demoSpeed: number;
  lastReceipt: PickupOrder | null;
  addToCart: (itemId: string) => void;
  changeQty: (key: string, qty: number) => void;
  changeSauce: (key: string, sauce: Sauce) => void;
  changeNote: (key: string, note: string) => void;
  clearCart: () => void;
  checkout: (draft: DraftOrder) => { ok: true; order: PickupOrder } | { ok: false; error: string };
  setOrderStatus: (id: string, status: OrderStatus) => void;
  toggleSoldOut: (itemId: string) => void;
  setDemoSpeed: (speed: number) => void;
  resetShop: () => void;
  dismissReceipt: () => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [store, setStore] = useState(loadStore);
  const [lastReceipt, setLastReceipt] = useState<PickupOrder | null>(null);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30_000);
    const rack = window.setInterval(() => {
      setStore((prev) => {
        const next = tickRack(prev, Date.now());
        if (rackFingerprint(next) === rackFingerprint(prev)) return prev;
        return next;
      });
    }, 250);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(rack);
    };
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
    const nowMs = Date.now();
    setStore((prev) => {
      const jobs = [...prev.jobs, ...jobsFromOrder(result.order, prev.demoSpeed)];
      return tickRack({ ...prev, cart: [], orders: [result.order, ...prev.orders], jobs }, nowMs);
    });
    return result;
  }, [store]);

  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    const nowMs = Date.now();
    setStore((prev) => {
      let jobs = prev.jobs;
      if (status === "cancelled") jobs = dropOrderJobs(jobs, id);
      if (status === "ready") jobs = finishOrderJobs(jobs, id, nowMs);
      const orders = prev.orders.map((order) => (order.id === id ? { ...order, status } : order));
      return { ...prev, jobs, orders: syncOrderStatus(orders, jobs) };
    });
  }, []);

  const toggleSoldOut = useCallback((itemId: string) => {
    setStore((prev) => ({
      ...prev,
      soldOut: prev.soldOut.includes(itemId)
        ? prev.soldOut.filter((id) => id !== itemId)
        : [...prev.soldOut, itemId],
    }));
  }, []);

  const setDemoSpeed = useCallback((speed: number) => {
    setStore((prev) => ({ ...prev, demoSpeed: speed > 0 ? speed : 1 }));
  }, []);

  const resetShop = useCallback(() => {
    setStore({ ...emptyStore, demoSpeed: DEFAULT_DEMO_SPEED });
    setLastReceipt(null);
  }, []);

  const dismissReceipt = useCallback(() => setLastReceipt(null), []);

  const value = useMemo(
    () => ({
      now,
      cart: store.cart,
      orders: store.orders,
      soldOut: store.soldOut,
      jobs: store.jobs,
      demoSpeed: store.demoSpeed,
      lastReceipt,
      addToCart,
      changeQty,
      changeSauce,
      changeNote,
      clearCart,
      checkout,
      setOrderStatus,
      toggleSoldOut,
      setDemoSpeed,
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
      setDemoSpeed,
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
