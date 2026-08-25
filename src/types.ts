export type Cadence = "monthly" | "yearly" | "once";

export type CostCategory = "living" | "tooling" | "cloud" | "setup";

export type LineItem = {
  id: string;
  category: CostCategory;
  name: string;
  amount: number;
  enabled: boolean;
  cadence: Cadence;
  note: string;
};

export type OfferId = "spark" | "build" | "retain";

export type Offer = {
  id: OfferId;
  name: string;
  tag: string;
  price: number;
  deliveryDays: number;
  hours: number;
  apiCost: number;
  summary: string;
  deliverables: string[];
  bestFor: string;
};

export type ProjectStatus = "inquiry" | "active" | "delivered" | "retainer";

export type Project = {
  id: string;
  client: string;
  title: string;
  offerId: OfferId;
  status: ProjectStatus;
  amount: number;
  due: string;
  notes: string;
};

export type Quote = {
  id: string;
  client: string;
  contact: string;
  offerId: OfferId;
  scope: string;
  amount: number;
  taxIncluded: boolean;
  createdAt: string;
  validDays: number;
};

export type ChatRole = "user" | "agent";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
};

export type WeeklyTask = {
  id: string;
  weekday: string;
  title: string;
  detail: string;
};

export type StudioState = {
  capital: number;
  items: LineItem[];
  projects: Project[];
  quotes: Quote[];
  messages: ChatMessage[];
  checklist: Record<string, boolean>;
  sampleLoaded: boolean;
};
