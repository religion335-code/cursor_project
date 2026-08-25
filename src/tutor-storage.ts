import { DEFAULT_CONFIG, todayKey, type LlmConfig, type TutorState } from "./tutor";

const KEY = "lanyang-tutor-v1";

export function emptyTutorState(): TutorState {
  return {
    turns: [],
    usage: { date: todayKey(), count: 0 },
    pro: false,
    config: { ...DEFAULT_CONFIG },
  };
}

export function loadTutorState(): TutorState {
  if (typeof window === "undefined") return emptyTutorState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyTutorState();
    const parsed = JSON.parse(raw) as Partial<TutorState>;
    const base = emptyTutorState();
    let config: LlmConfig = { ...base.config, ...(parsed.config ?? {}) };
    // 遷移：舊版預設是 OpenAI，切到 Gemini 時把殘留的舊設定重設（保留使用者自填的 key）。
    if (/openai/i.test(config.baseUrl) || /^gpt/i.test(config.model)) {
      config = { ...base.config, apiKey: config.apiKey };
    }
    return {
      turns: parsed.turns ?? [],
      usage: parsed.usage ?? base.usage,
      pro: typeof parsed.pro === "boolean" ? parsed.pro : false,
      config,
    };
  } catch {
    return emptyTutorState();
  }
}

export function saveTutorState(state: TutorState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
