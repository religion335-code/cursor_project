import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  FREE_DAILY_LIMIT,
  buildGeminiRequest,
  canSend,
  demoReply,
  detectCorrections,
  parseGeminiReply,
  registerSend,
  remainingToday,
  type GeminiResponse,
  type TutorTurn,
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

  it("gives directions guidance when asked where the bathroom is", () => {
    const reply = demoReply("廁所在哪裡？");
    expect(reply.text).toMatch(/請問/);
  });

  it("gives price-asking phrases when asked about cost", () => {
    const reply = demoReply("多少錢");
    expect(reply.text).toMatch(/多少錢/);
  });
});

describe("gemini request building", () => {
  const config = { ...DEFAULT_CONFIG, apiKey: "AIza-test", model: "gemini-2.5-flash" };

  it("targets the gemini generateContent endpoint with the api-key header", () => {
    const req = buildGeminiRequest(config, [], "你好");
    expect(req.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect(req.headers["x-goog-api-key"]).toBe("AIza-test");
  });

  it("maps learner/tutor history to user/model roles and appends the new turn", () => {
    const history: TutorTurn[] = [
      { id: "a", role: "learner", text: "hi", createdAt: "" },
      { id: "b", role: "tutor", text: "你好", createdAt: "" },
    ];
    const body = JSON.parse(buildGeminiRequest(config, history, "謝謝").body);
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
    expect(body.contents.at(-1).parts[0].text).toBe("謝謝");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.systemInstruction.parts[0].text).toMatch(/Taiwan Mandarin tutor/);
  });
});

describe("gemini response parsing", () => {
  it("parses a clean JSON candidate", () => {
    const data: GeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  reply: "你好！",
                  pinyin: "Nǐ hǎo!",
                  english: "Hello!",
                  corrections: [],
                }),
              },
            ],
          },
        },
      ],
    };
    const reply = parseGeminiReply(data);
    expect(reply.text).toBe("你好！");
    expect(reply.pinyin).toBe("Nǐ hǎo!");
    expect(reply.corrections).toEqual([]);
  });

  it("recovers JSON wrapped in a markdown code fence", () => {
    const data: GeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              { text: '```json\n{"reply":"謝謝","pinyin":"Xièxie","english":"Thanks","corrections":[]}\n```' },
            ],
          },
        },
      ],
    };
    expect(parseGeminiReply(data).text).toBe("謝謝");
  });

  it("degrades gracefully when the response is empty", () => {
    expect(parseGeminiReply({}).text).toBe("（沒有收到回覆）");
  });
});
