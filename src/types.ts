export type Sauce = "normal" | "less" | "extra";

export type Category = "bento" | "extra" | "soup" | "drink";

export type ServiceWindowId = "lunch" | "dinner";

export type OrderStatus = "queued" | "grilling" | "ready" | "done" | "cancelled";

export type MenuItem = {
  id: string;
  category: Category;
  name: string;
  desc: string;
  price: number;
  popular?: boolean;
  tags: string[];
};

export type CartLine = {
  itemId: string;
  qty: number;
  sauce: Sauce;
  note: string;
};

export type PickupOrder = {
  id: string;
  createdAt: string;
  isoDate: string;
  customerName: string;
  phone: string;
  window: ServiceWindowId;
  pickupAt: string;
  lines: CartLine[];
  total: number;
  status: OrderStatus;
};

export type GrillJob = {
  id: string;
  orderId: string;
  itemId: string;
  sauce: Sauce;
  note: string;
  slot: number | null;
  startedAt: number | null;
  durationMs: number;
  doneAt: number | null;
};

export type ShopStore = {
  cart: CartLine[];
  orders: PickupOrder[];
  soldOut: string[];
  jobs: GrillJob[];
  demoSpeed: number;
};
