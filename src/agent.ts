import { OFFERS, PLAYBOOK, STACK, WEEKLY_RITUAL } from "./catalog";
import { ntd, parseTaiwanMoney } from "./money";
import { buildQuote, quoteText } from "./quotes";
import {
  monthlyBurn,
  offerById,
  projectsToCoverBurn,
  runwayMonths,
  workingCapital,
} from "./runway";
import type { LineItem, OfferId, Quote, StudioState } from "./types";

export type AgentReply = {
  text: string;
  quote?: Quote;
};

type Intent =
  | "runway"
  | "quote"
  | "offer"
  | "first-client"
  | "week"
  | "stack"
  | "playbook"
  | "yilan"
  | "legal"
  | "fallback";

const INTENT_KEYWORDS: Record<Exclude<Intent, "fallback">, string[]> = {
  runway: [
    "跑道",
    "撐",
    "預算",
    "十萬",
    "10萬",
    "花費",
    "成本",
    "月燒",
    "燒多少",
    "夠不夠",
    "資本",
    "生活費",
    "租金",
  ],
  quote: ["報價", "報價單", "報一個", "出一份", "怎麼開價", "開帳", "帳單"],
  offer: ["方案", "套餐", "賣什麼", "定價", "價格", "產品"],
  "first-client": [
    "第一個客戶",
    "第一個案",
    "怎麼接",
    "客戶在哪",
    "開發",
    "名單",
    "接案",
  ],
  week: ["一週", "週間", "作息", "遠距", "時間表", "怎麼排"],
  stack: ["雲端", "cloud", "技術", "stack", "部署", "api", "工具"],
  playbook: ["90", "九十", "前三個月", "計畫", "playbook", "時程"],
  yilan: ["宜蘭", "羅東", "礁溪", "蘭陽", "為什麼在這"],
  legal: ["行號", "公司", "發票", "稅", "設立", "有限公司", "獨資"],
};

function scoreIntent(text: string): Intent {
  const normalized = text.toLowerCase();
  let best: Intent = "fallback";
  let bestScore = 0;
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as Array<
    [Exclude<Intent, "fallback">, string[]]
  >) {
    const score = keywords.reduce(
      (sum, keyword) => sum + (normalized.includes(keyword.toLowerCase()) ? keyword.length : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  return best;
}

function detectOffer(text: string): OfferId {
  if (text.includes("月費") || text.includes("守夜") || text.includes("retain")) {
    return "retain";
  }
  if (text.includes("診斷") || text.includes("火花") || text.includes("spark")) {
    return "spark";
  }
  return "build";
}

function detectClient(text: string): string {
  const match =
    text.match(/幫(.{1,16}?)(報價|報一個|出一份|做一份)/) ||
    text.match(/客戶[是：:\s]*([^\s，。,]{2,12})/);
  return match?.[1]?.trim() || "宜蘭示範客戶";
}

function bullets(lines: string[]): string {
  return lines.map((line) => `• ${line}`).join("\n");
}

function runwayText(capital: number, items: LineItem[]): string {
  const burn = monthlyBurn(items);
  const pool = workingCapital(capital, items);
  const months = runwayMonths(capital, items);
  const spark = offerById("spark");
  const build = offerById("build");
  const retain = offerById("retain");
  const monthLabel = Number.isFinite(months)
    ? `${months.toFixed(1)} 個月`
    : "沒有月燒，理論上無限";

  return [
    `以資本 ${ntd(capital)}、開辦費後可用 ${ntd(pool)} 來算：`,
    bullets([
      `月燒約 ${ntd(burn)}（含生活與必要工具）`,
      `沒有收入時跑道約 ${monthLabel}`,
      `「火花診斷」貢獻約 ${ntd(spark.price - spark.apiCost)}，相當 ${((spark.price - spark.apiCost) / burn).toFixed(1)} 個月月燒`,
      `「可交件 Agent」貢獻約 ${ntd(build.price - build.apiCost)}，相當 ${((build.price - build.apiCost) / burn).toFixed(1)} 個月月燒`,
      `一份月費 ${ntd(retain.price)} 蓋不住生活費；打平約需 ${projectsToCoverBurn(burn, retain).toFixed(1)} 份月費，或建置案持續進來`,
    ]),
    "",
    "原則：沒有案件時把 LLM API 調成 0。十萬塊是生活跑道，不是模型訓練基金。",
  ].join("\n");
}

function offerText(): string {
  return [
    "對台灣中小企業，先賣三個套餐，不要客製到虧。",
    bullets(
      OFFERS.map(
        (offer) =>
          `${offer.name} ${ntd(offer.price)}／${offer.tag}：${offer.summary}`,
      ),
    ),
    "",
    "成交順序建議：診斷進門 → 建置回本 → 月費留存。第一個陌生人客戶很少直接買 4.8 萬，所以火花診斷是設計過的台階。",
  ].join("\n");
}

function firstClientText(): string {
  return [
    "第一個客戶幾乎不會來自廣告，而來自你已經認識、或騎車 20 分鐘到得了的地方。",
    bullets([
      "名單：以前同事、家人的店、民宿、診所櫃檯、小型電商、農產加工",
      "開口方式：不要問「要不要做 AI」，問「哪一件每週都在複製貼上的事最煩」",
      "交付物先小：一週診斷 18,000，讓對方有機會說好",
      "遠距成交：視訊示範 15 分鐘，比 20 頁提案有效",
      "宜蘭優勢：生活費低，所以你報 1.8 萬時仍然有毛利；台北同業報價若更高，你可以用「可遠距、可週更」去打",
    ]),
  ].join("\n");
}

function weekText(): string {
  return [
    "遠距不是躺著接案。把一週寫死，下雨天也照表走。",
    bullets(WEEKLY_RITUAL.map((task) => `週${task.weekday} ${task.title}：${task.detail}`)),
  ].join("\n");
}

function stackText(): string {
  return [
    "雲端廠房先用免費額度。有發票再升級。",
    bullets(STACK.map((row) => `${row.layer} → ${row.choice}（約 ${ntd(row.monthly)}/月）。${row.why}`)),
  ].join("\n");
}

function playbookText(): string {
  return [
    "九十天只做一件事：讓本金不再是唯一收入。",
    PLAYBOOK.map(
      (block) => `${block.window} ${block.title}\n${bullets(block.items)}`,
    ).join("\n\n"),
  ].join("\n");
}

function yilanText(): string {
  return [
    "選宜蘭不是浪漫，是算術。",
    bullets([
      "同樣十萬，在台北租屋可能兩個月就瘦一圈；在宜蘭／羅東，套房加生活費通常能撐過一個完整的開發—成交循環",
      "下雨多、觀光季人潮不穩定，反而適合做不靠客流的雲上生意",
      "客戶可以在台北、高雄、新加坡，你只需要穩定網路與能示範的 Agent",
      "在地可以當第一批案例：民宿訂房回覆、診所預約、農產出貨客服",
      "不要把時間花在「宜蘭新創園區」幻想，花在每週 10 次對話",
    ]),
  ].join("\n");
}

function legalText(): string {
  return [
    "這裡是規劃假設，不是律師或會計師意見。",
    bullets([
      "十萬先活下來：獨資行號或甚至先以個人接案，比一開始開有限公司便宜",
      "有限公司有資本額、會計與稅務固定成本，吃得動月費再轉",
      "發票：還沒設立時講清楚開收據／後補，不要承諾做不到的聯式發票",
      "海外收款可用國際帳戶，但跨境收入仍可能要報稅",
      "報價單寫 50/50，比月結 90 天更適合一人跑道",
    ]),
  ].join("\n");
}

function fallbackText(question: string): string {
  return [
    `你問的是「${question.trim()}」。我是蘭陽雲工的本地策劃 Agent，沒有外連模型也能回答創業算術。`,
    bullets([
      "問跑道、月燒、十萬能撐多久",
      "問方案與怎麼報價（可說：幫〇〇民宿報一個診斷）",
      "問第一個客戶、一週怎麼排、雲端要花多少",
      "問宜蘭為什麼划算、要不要先開公司",
    ]),
    "直接把問題寫具體一點，我會用目前工作室的數字回答。",
  ].join("\n");
}

export function advise(question: string, state: StudioState): AgentReply {
  const text = question.trim();
  if (!text) {
    return { text: "先把問題寫下來。例如：十萬塊在宜蘭能撐幾個月？" };
  }

  const intent = scoreIntent(text);
  const overrideCapital = parseCapitalOverride(text);
  const capital = overrideCapital ?? state.capital;

  if (intent === "quote" || /幫.+報/.test(text) || /報一個/.test(text)) {
    const offerId = detectOffer(text);
    const quote = buildQuote({
      client: detectClient(text),
      contact: "",
      offerId,
      scope: text,
    });
    return {
      text: [
        "已依目前套餐起草報價，並可到「工作室」查看已存清單。",
        "",
        quoteText(quote),
      ].join("\n"),
      quote: quote,
    };
  }

  switch (intent) {
    case "runway":
      return { text: runwayText(capital, state.items) };
    case "offer":
      return { text: offerText() };
    case "first-client":
      return { text: firstClientText() };
    case "week":
      return { text: weekText() };
    case "stack":
      return { text: stackText() };
    case "playbook":
      return { text: playbookText() };
    case "yilan":
      return { text: yilanText() };
    case "legal":
      return { text: legalText() };
    default:
      return { text: fallbackText(text) };
  }
}

function parseCapitalOverride(text: string): number | null {
  if (!/(資本|預算|只有|改成|如果)/.test(text)) return null;
  if (!/(萬|000|NT)/i.test(text) && !/\d{4,}/.test(text)) return null;
  return parseTaiwanMoney(text);
}

export const SUGGESTED_PROMPTS = [
  "十萬塊在宜蘭能撐幾個月？",
  "第一個客戶要賣什麼？",
  "幫羅東某間民宿報一個診斷",
  "遠距一週怎麼排？",
  "雲端要花多少？",
  "要不要先開公司？",
];
