import { describe, expect, it } from "vitest";
import { parseTaiwanMoney } from "./money";
import {
  forecastCash,
  leanItems,
  monthlyBurn,
  projectsToCoverBurn,
  runwayMonths,
  setupCost,
  workingCapital,
} from "./runway";
import { DEFAULT_ITEMS, OFFERS, STARTING_CAPITAL } from "./catalog";

describe("runway math", () => {
  const items = DEFAULT_ITEMS.map((item) => ({ ...item }));

  it("keeps a 100k Yilan bootstrap above three months with defaults", () => {
    const burn = monthlyBurn(items);
    const months = runwayMonths(STARTING_CAPITAL, items);
    expect(burn).toBeGreaterThan(20_000);
    expect(burn).toBeLessThan(40_000);
    expect(months).toBeGreaterThan(3);
    expect(months).toBeLessThan(5);
    expect(setupCost(items)).toBe(3300);
    expect(workingCapital(STARTING_CAPITAL, items)).toBe(STARTING_CAPITAL - 3300);
  });

  it("extends runway when optional coworking stays off and API is zeroed", () => {
    const tight = items.map((item) => {
      if (item.id === "llm") return { ...item, amount: 0 };
      if (item.id === "labor") return { ...item, enabled: false };
      return item;
    });
    expect(runwayMonths(STARTING_CAPITAL, tight)).toBeGreaterThan(
      runwayMonths(STARTING_CAPITAL, items),
    );
  });

  it("shows one build offer covering more than a month of burn", () => {
    const burn = monthlyBurn(items);
    const build = OFFERS.find((offer) => offer.id === "build");
    if (!build) throw new Error("missing build offer");
    expect(projectsToCoverBurn(burn, build)).toBeLessThan(1);
  });

  it("forecasts recovery when a build lands in month 2 and retainer in month 3", () => {
    const spark = OFFERS[0];
    const build = OFFERS[1];
    const retain = OFFERS[2];
    const points = forecastCash({
      capital: STARTING_CAPITAL,
      items,
      firstProjectMonth: 2,
      firstOffer: build,
      retainerFromMonth: 3,
      retainer: retain,
    });
    expect(points[0].cash).toBeLessThan(workingCapital(STARTING_CAPITAL, items));
    expect(points[1].revenue).toBe(build.price);
    expect(points[2].revenue).toBe(retain.price);
    expect(points[1].cash).toBeGreaterThan(points[0].cash);
    expect(points[5].cash).toBeLessThan(points[1].cash);
    expect(spark.price).toBe(18000);
  });

  it("lean preset lengthens runway and lowers retainers needed", () => {
    const lean = leanItems(items);
    const retain = OFFERS[2];
    expect(runwayMonths(STARTING_CAPITAL, lean)).toBeGreaterThan(
      runwayMonths(STARTING_CAPITAL, items),
    );
    expect(projectsToCoverBurn(monthlyBurn(lean), retain)).toBeLessThan(
      projectsToCoverBurn(monthlyBurn(items), retain),
    );
  });
});

describe("money parsing", () => {
  it("reads 萬 and NT$ forms", () => {
    expect(parseTaiwanMoney("10萬")).toBe(100_000);
    expect(parseTaiwanMoney("8.5 萬")).toBe(85_000);
    expect(parseTaiwanMoney("NT$12,000")).toBe(12_000);
    expect(parseTaiwanMoney("沒有數字")).toBeNull();
  });
});
