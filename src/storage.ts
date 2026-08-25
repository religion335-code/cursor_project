import { DEFAULT_ITEMS, STARTING_CAPITAL } from "./catalog";
import type { StudioState } from "./types";

const KEY = "lanyang-cloud-v1";

export function emptyState(): StudioState {
  return {
    capital: STARTING_CAPITAL,
    items: DEFAULT_ITEMS.map((item) => ({ ...item })),
    projects: [],
    quotes: [],
    messages: [],
    checklist: {},
    sampleLoaded: false,
  };
}

export function loadState(): StudioState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    const base = emptyState();
    return {
      ...base,
      ...parsed,
      items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : base.items,
      projects: parsed.projects ?? [],
      quotes: parsed.quotes ?? [],
      messages: parsed.messages ?? [],
      checklist: parsed.checklist ?? {},
      capital: typeof parsed.capital === "number" ? parsed.capital : base.capital,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: StudioState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function sampleProjects(): StudioState["projects"] {
  return [
    {
      id: "p-demo-1",
      client: "礁溪山形民宿",
      title: "訂房回覆 Agent 診斷",
      offerId: "spark",
      status: "inquiry",
      amount: 18000,
      due: daysFromNow(5),
      notes: "示範案件。LINE 回覆週末訂房問答，重複率高。",
    },
    {
      id: "p-demo-2",
      client: "羅東診所櫃檯",
      title: "預約與注意事項 Agent",
      offerId: "build",
      status: "active",
      amount: 48000,
      due: daysFromNow(18),
      notes: "示範案件。目標：減少櫃檯電話中 40% 的重複說明。",
    },
  ];
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
