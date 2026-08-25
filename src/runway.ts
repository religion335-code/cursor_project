import { DEFAULT_ITEMS, OFFERS } from "./catalog";
import type { LineItem, Offer } from "./types";

export function leanItems(items: LineItem[]): LineItem[] {
  return items.map((item) => {
    if (item.id === "labor" || item.id === "cowork") return { ...item, enabled: false };
    if (item.id === "llm") return { ...item, amount: 0 };
    if (item.id === "food") return { ...item, amount: 7000 };
    if (item.id === "rent") return { ...item, amount: 8000 };
    return { ...item };
  });
}

export function defaultItems(): LineItem[] {
  return DEFAULT_ITEMS.map((item) => ({ ...item }));
}

export function monthlyOf(item: LineItem): number {
  if (!item.enabled) return 0;
  if (item.cadence === "monthly") return item.amount;
  if (item.cadence === "yearly") return item.amount / 12;
  return 0;
}

export function onceOf(item: LineItem): number {
  if (!item.enabled) return 0;
  return item.cadence === "once" ? item.amount : 0;
}

export function monthlyBurn(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + monthlyOf(item), 0);
}

export function setupCost(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + onceOf(item), 0);
}

export function workingCapital(capital: number, items: LineItem[]): number {
  return capital - setupCost(items);
}

export function runwayMonths(capital: number, items: LineItem[]): number {
  const burn = monthlyBurn(items);
  const pool = workingCapital(capital, items);
  if (pool <= 0) return 0;
  if (burn <= 0) return Number.POSITIVE_INFINITY;
  return pool / burn;
}

export function categoryBurn(
  items: LineItem[],
  category: LineItem["category"],
): number {
  return items
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + monthlyOf(item), 0);
}

export function offerById(id: Offer["id"]): Offer {
  const found = OFFERS.find((offer) => offer.id === id);
  if (!found) throw new Error(`Unknown offer: ${id}`);
  return found;
}

export function contribution(offer: Offer): number {
  return offer.price - offer.apiCost;
}

export function projectsToCoverBurn(burn: number, offer: Offer): number {
  const margin = contribution(offer);
  if (margin <= 0) return Number.POSITIVE_INFINITY;
  return burn / margin;
}

export function taxIncluded(amount: number): { pretax: number; tax: number; total: number } {
  const total = Math.round(amount);
  const pretax = Math.round(total / 1.05);
  const tax = total - pretax;
  return { pretax, tax, total };
}

export type ForecastPoint = {
  month: number;
  label: string;
  cash: number;
  revenue: number;
};

/**
 * Naive cash forecast: burn every month, optional first project in a given month,
 * optional retainer starting the month after delivery.
 */
export function forecastCash(options: {
  capital: number;
  items: LineItem[];
  firstProjectMonth: number;
  firstOffer: Offer;
  retainerFromMonth: number | null;
  retainer: Offer;
  months?: number;
}): ForecastPoint[] {
  const months = options.months ?? 6;
  const burn = monthlyBurn(options.items);
  let cash = workingCapital(options.capital, options.items);
  const points: ForecastPoint[] = [];

  for (let month = 1; month <= months; month += 1) {
    let revenue = 0;
    if (month === options.firstProjectMonth) {
      revenue += options.firstOffer.price;
    }
    if (
      options.retainerFromMonth != null &&
      month >= options.retainerFromMonth
    ) {
      revenue += options.retainer.price;
    }
    cash += revenue - burn;
    points.push({
      month,
      label: `第 ${month} 月`,
      cash: Math.round(cash),
      revenue,
    });
  }
  return points;
}
