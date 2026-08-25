// AI 中文家教 MVP 的核心邏輯。
// 刻意把「純函式」（免費額度、糾正偵測、示範回覆）與「連線 LLM」分開，
// 前者可測試、可離線展示；後者要等使用者填入自己的 API key 才會啟用。

export type TutorRole = "learner" | "tutor";

export type Correction = {
  original: string;
  suggestion: string;
  note: string;
};

export type TutorTurn = {
  id: string;
  role: TutorRole;
  text: string;
  pinyin?: string;
  english?: string;
  corrections?: Correction[];
  createdAt: string;
};

export type LlmConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type Usage = {
  date: string;
  count: number;
};

export type TutorState = {
  turns: TutorTurn[];
  usage: Usage;
  pro: boolean;
  config: LlmConfig;
};

// 免費層每天限量，保護 token 成本：免費使用者不能無限燒你的 API 帳單。
export const FREE_DAILY_LIMIT = 5;

export const DEFAULT_CONFIG: LlmConfig = {
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  apiKey: "",
  model: "gemini-2.5-flash",
};

export const SUGGESTED_OPENERS = [
  "你好，我想學一點中文",
  "How do I order bubble tea?",
  "我叫 David，你呢？",
  "廁所在哪裡？",
];

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// 讀進來的用量若不是今天的，就視為 0（跨日自動歸零）。
export function normalizeUsage(usage: Usage, now: Date = new Date()): Usage {
  const today = todayKey(now);
  if (usage.date !== today) return { date: today, count: 0 };
  return usage;
}

export function remainingToday(usage: Usage, now: Date = new Date()): number {
  const fresh = normalizeUsage(usage, now);
  return Math.max(0, FREE_DAILY_LIMIT - fresh.count);
}

export function canSend(usage: Usage, pro: boolean, now: Date = new Date()): boolean {
  if (pro) return true;
  return remainingToday(usage, now) > 0;
}

export function registerSend(usage: Usage, now: Date = new Date()): Usage {
  const fresh = normalizeUsage(usage, now);
  return { date: fresh.date, count: fresh.count + 1 };
}

// 常見羅馬拼音 → 漢字，MVP 用來示範「糾正」價值。
const PINYIN_FIX: Array<[RegExp, string, string]> = [
  [/\bni\s*hao\b/i, "你好", "打招呼用漢字寫更自然"],
  [/\bxie\s*xie\b/i, "謝謝", "「謝謝」是最常用的道謝"],
  [/\bzai\s*jian\b/i, "再見", "道別可以直接說「再見」"],
  [/\bduo\s*shao\b/i, "多少", "問價錢用「多少錢」"],
  [/\bwo\b/i, "我", "第一人稱直接用「我」"],
];

// 偵測學習者訊息裡可以糾正的地方。純函式，方便測試。
export function detectCorrections(text: string): Correction[] {
  const corrections: Correction[] = [];

  for (const [pattern, suggestion, note] of PINYIN_FIX) {
    const match = text.match(pattern);
    if (match) {
      corrections.push({ original: match[0], suggestion, note });
    }
  }

  // 常見語法錯誤：介紹名字時把「我叫」寫成「我是叫」。
  if (text.includes("我是叫")) {
    corrections.push({
      original: "我是叫",
      suggestion: "我叫",
      note: "介紹名字說「我叫…」，不用加「是」",
    });
  }

  return corrections;
}

type DemoScript = {
  keywords: string[];
  text: string;
  pinyin: string;
  english: string;
};

// 離線示範腳本：台灣中文口吻。真正的智慧來自接上 LLM，
// 但這足以展示對話 + 拼音 + 英文對照 + 糾正的 UX。
const DEMO_SCRIPTS: DemoScript[] = [
  {
    keywords: ["你好", "hello", "hi", "嗨", "ni hao", "nihao", "早安", "早"],
    text: "你好！很高興認識你。你今天想練什麼？",
    pinyin: "Nǐ hǎo! Hěn gāoxìng rènshì nǐ. Nǐ jīntiān xiǎng liàn shénme?",
    english: "Hello! Nice to meet you. What would you like to practice today?",
  },
  {
    keywords: ["叫", "name", "我是", "i am", "i'm", "my name", "david", "叫什麼"],
    text: "原來如此，很高興認識你！我是你的中文老師。你為什麼想學中文呢？",
    pinyin: "Yuánlái rúcǐ, hěn gāoxìng rènshì nǐ! Wǒ shì nǐ de Zhōngwén lǎoshī. Nǐ wèishéme xiǎng xué Zhōngwén ne?",
    english: "I see, nice to meet you! I'm your Chinese teacher. Why do you want to learn Chinese?",
  },
  {
    keywords: ["吃", "eat", "food", "order", "餐", "飯", "珍珠", "奶茶", "bubble", "tea", "咖啡", "coffee", "喝"],
    text: "在台灣點珍珠奶茶可以說：「我要一杯珍珠奶茶，微糖少冰。」你要不要試試看？",
    pinyin: "Zài Táiwān diǎn zhēnzhū nǎichá kěyǐ shuō: Wǒ yào yì bēi zhēnzhū nǎichá, wéi táng shǎo bīng. Nǐ yào bú yào shìshì kàn?",
    english: "To order bubble tea in Taiwan, you can say: 'I'd like a bubble tea, less sugar and less ice.' Want to try?",
  },
  {
    keywords: ["哪", "where", "廁所", "toilet", "bathroom", "捷運", "mrt", "車站", "station", "怎麼去", "how do i get", "怎麼走"],
    text: "問路可以說：「請問廁所在哪裡？」或「請問捷運站怎麼走？」記得先說「請問」比較有禮貌。",
    pinyin: "Wènlù kěyǐ shuō: Qǐngwèn cèsuǒ zài nǎlǐ? Huò qǐngwèn jiéyùn zhàn zěnme zǒu? Jìdé xiān shuō qǐngwèn bǐjiào yǒu lǐmào.",
    english: "To ask for directions: 'Excuse me, where is the bathroom?' or 'How do I get to the MRT station?' Start with 'qǐngwèn' to be polite.",
  },
  {
    keywords: ["多少", "how much", "錢", "price", "塊", "元", "貴"],
    text: "問價錢最常用：「這個多少錢？」如果覺得貴，可以說：「可以算便宜一點嗎？」",
    pinyin: "Wèn jiàqián zuì chángyòng: Zhège duōshǎo qián? Rúguǒ juédé guì, kěyǐ shuō: Kěyǐ suàn piányí yìdiǎn ma?",
    english: "To ask a price: 'How much is this?' If it feels pricey: 'Can you make it a bit cheaper?'",
  },
];

const FALLBACK_SCRIPT: DemoScript = {
  keywords: [],
  text: "很好，繼續說！可以多告訴我一點嗎？你可以用中文或英文，我會幫你改成自然的中文。",
  pinyin: "Hěn hǎo, jìxù shuō! Kěyǐ duō gàosù wǒ yìdiǎn ma? Nǐ kěyǐ yòng Zhōngwén huò Yīngwén, wǒ huì bāng nǐ gǎi chéng zìrán de Zhōngwén.",
  english: "Great, keep going! Can you tell me a bit more? Use Chinese or English and I'll help you phrase it naturally.",
};

function pickScript(text: string): DemoScript {
  const lower = text.toLowerCase();
  for (const script of DEMO_SCRIPTS) {
    if (script.keywords.some((keyword) => lower.includes(keyword.toLowerCase()))) {
      return script;
    }
  }
  return FALLBACK_SCRIPT;
}

// 離線示範回覆（同步、純函式）。
export function demoReply(text: string): Omit<TutorTurn, "id" | "role" | "createdAt"> {
  const script = pickScript(text);
  return {
    text: script.text,
    pinyin: script.pinyin,
    english: script.english,
    corrections: detectCorrections(text),
  };
}

export function makeTurn(
  role: TutorRole,
  fields: Omit<TutorTurn, "id" | "role" | "createdAt">,
  seed = 0,
): TutorTurn {
  return {
    id: `${role}-${Date.now()}-${seed}`,
    role,
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

const SYSTEM_PROMPT =
  "You are a friendly Taiwan Mandarin tutor for an English-speaking beginner. " +
  "Reply ONLY with strict JSON matching the schema: reply (Traditional Chinese, one or two short sentences), " +
  "pinyin (Hanyu pinyin with tone marks), english (English translation), " +
  "corrections (array of {original, suggestion, note}). " +
  "Use Taiwan usage (繁體字、台灣詞彙). Keep it encouraging and short. " +
  "If the learner made mistakes, add corrections; otherwise return an empty array.";

// Gemini 結構化輸出的 schema：搭配 responseMimeType=application/json 才能保證回傳合法 JSON。
const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    pinyin: { type: "string" },
    english: { type: "string" },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          suggestion: { type: "string" },
          note: { type: "string" },
        },
        required: ["original", "suggestion", "note"],
      },
    },
  },
  required: ["reply", "pinyin", "english", "corrections"],
  propertyOrdering: ["reply", "pinyin", "english", "corrections"],
} as const;

export type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export function hasLiveConfig(config: LlmConfig): boolean {
  return config.apiKey.trim().length > 0;
}

// 純函式：組出 Gemini generateContent 請求，方便測試（不需要網路）。
export function buildGeminiRequest(
  config: LlmConfig,
  history: TutorTurn[],
  text: string,
): { url: string; headers: Record<string, string>; body: string } {
  const contents = [
    ...history.slice(-8).map((turn) => ({
      role: turn.role === "learner" ? "user" : "model",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text }] },
  ];

  const base = config.baseUrl.replace(/\/$/, "");
  return {
    url: `${base}/models/${config.model}:generateContent`,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: GEMINI_RESPONSE_SCHEMA,
      },
    }),
  };
}

// 從模型輸出裡挖出 JSON（即使被 ```json 包住也能處理）。
function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) return candidate.slice(start, end + 1);
  return candidate;
}

// 純函式：把 Gemini 回應轉成一則 tutor turn 的內容。
export function parseGeminiReply(
  data: GeminiResponse,
): Omit<TutorTurn, "id" | "role" | "createdAt"> {
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  let parsed: {
    reply?: string;
    pinyin?: string;
    english?: string;
    corrections?: Correction[];
  } = {};
  try {
    parsed = JSON.parse(extractJsonObject(text));
  } catch {
    parsed = { reply: text || "（沒有收到回覆）" };
  }

  return {
    text: parsed.reply ?? "（沒有收到回覆）",
    pinyin: parsed.pinyin,
    english: parsed.english,
    corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
  };
}

// 連線模式：呼叫 Gemini API。需要使用者自己的 key（存在瀏覽器）。
export async function llmReply(
  config: LlmConfig,
  history: TutorTurn[],
  text: string,
): Promise<Omit<TutorTurn, "id" | "role" | "createdAt">> {
  const request = buildGeminiRequest(config, history, text);
  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: request.body,
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let message = raw.slice(0, 200);
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } };
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      // 不是 JSON 就用原始文字。
    }
    throw new Error(`Gemini 回應錯誤（${response.status}）：${message}`);
  }

  const data = (await response.json()) as GeminiResponse;
  return parseGeminiReply(data);
}
