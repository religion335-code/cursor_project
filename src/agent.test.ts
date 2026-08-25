import { describe, expect, it } from "vitest";
import { advise } from "./agent";
import { emptyState } from "./storage";
import { quoteText } from "./quotes";
import { buildQuote } from "./quotes";

describe("studio agent", () => {
  const state = emptyState();

  it("answers runway questions with Yilan burn numbers", () => {
    const reply = advise("十萬塊在宜蘭能撐幾個月？", state);
    expect(reply.text).toMatch(/月燒/);
    expect(reply.text).toMatch(/NT\$/);
    expect(reply.text).toMatch(/跑道/);
  });

  it("drafts a quote for a named inn", () => {
    const reply = advise("幫羅東某間民宿報一個診斷", state);
    expect(reply.quote?.id).toBeTruthy();
    expect(reply.text).toMatch(/火花診斷/);
    expect(reply.text).toMatch(/民宿/);
    expect(reply.text).toMatch(/18,?000/);
  });

  it("explains the cloud stack without inventing hosting fees", () => {
    const reply = advise("雲端要花多少？Cloud stack 怎麼選", state);
    expect(reply.text).toMatch(/Cloudflare/);
    expect(reply.text).toMatch(/NT\$0/);
  });

  it("falls back with usable next questions", () => {
    const reply = advise("今天午餐吃什麼", state);
    expect(reply.text).toMatch(/本地策劃 Agent/);
  });
});

describe("quotes", () => {
  it("prints a 50/50 tax-included quote", () => {
    const quote = buildQuote({
      client: "測試診所",
      contact: "line:demo",
      offerId: "build",
      scope: "預約 Agent",
    });
    const text = quoteText(quote);
    expect(text).toMatch(/蘭陽雲工/);
    expect(text).toMatch(/測試診所/);
    expect(text).toMatch(/含稅/);
    expect(text).toMatch(/50%/);
  });
});
