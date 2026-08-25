import { describe, expect, it } from "vitest";
import {
  FREE_DAILY_LIMIT,
  canSend,
  demoReply,
  detectCorrections,
  registerSend,
  remainingToday,
  type Usage,
} from "./tutor";

describe("tutor free-tier gating", () => {
  const now = new Date("2026-08-25T10:00:00Z");

  it("counts remaining sends for today", () => {
    const usage: Usage = { date: "2026-08-25", count: 2 };
    expect(remainingToday(usage, now)).toBe(FREE_DAILY_LIMIT - 2);
  });

  it("resets the counter on a new day", () => {
    const stale: Usage = { date: "2026-08-24", count: FREE_DAILY_LIMIT };
    expect(remainingToday(stale, now)).toBe(FREE_DAILY_LIMIT);
  });

  it("blocks free users at the daily limit but lets pro through", () => {
    const maxed: Usage = { date: "2026-08-25", count: FREE_DAILY_LIMIT };
    expect(canSend(maxed, false, now)).toBe(false);
    expect(canSend(maxed, true, now)).toBe(true);
  });

  it("increments usage when registering a send", () => {
    const usage: Usage = { date: "2026-08-25", count: 1 };
    expect(registerSend(usage, now)).toEqual({ date: "2026-08-25", count: 2 });
  });
});

describe("tutor corrections", () => {
  it("suggests characters for romanized greetings", () => {
    const corrections = detectCorrections("ni hao teacher");
    expect(corrections.some((c) => c.suggestion === "你好")).toBe(true);
  });

  it("fixes the 我是叫 grammar mistake", () => {
    const corrections = detectCorrections("我是叫 David");
    expect(corrections.some((c) => c.suggestion === "我叫")).toBe(true);
  });

  it("returns no corrections for clean Chinese", () => {
    expect(detectCorrections("我想學中文")).toHaveLength(0);
  });
});

describe("tutor demo replies", () => {
  it("greets with pinyin and english", () => {
    const reply = demoReply("你好");
    expect(reply.text).toMatch(/你好/);
    expect(reply.pinyin).toBeTruthy();
    expect(reply.english).toBeTruthy();
  });

  it("gives a food ordering script when asked about bubble tea", () => {
    const reply = demoReply("How do I order bubble tea?");
    expect(reply.text).toMatch(/珍珠奶茶/);
  });
});
