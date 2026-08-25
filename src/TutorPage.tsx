import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  DEFAULT_CONFIG,
  FREE_DAILY_LIMIT,
  SUGGESTED_OPENERS,
  canSend,
  demoReply,
  hasLiveConfig,
  llmReply,
  makeTurn,
  registerSend,
  remainingToday,
  todayKey,
  type LlmConfig,
  type TutorTurn,
} from "./tutor";
import { emptyTutorState, loadTutorState, saveTutorState } from "./tutor-storage";

export function TutorPage() {
  const [state, setState] = useState(() => loadTutorState());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveTutorState(state);
  }, [state]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.turns.length, busy]);

  const live = hasLiveConfig(state.config);
  const remaining = remainingToday(state.usage);
  const locked = !canSend(state.usage, state.pro);

  async function send(text: string) {
    const learnerText = text.trim();
    if (!learnerText || busy) return;
    if (!canSend(state.usage, state.pro)) return;

    setError("");
    const learnerTurn = makeTurn("learner", { text: learnerText }, state.turns.length);
    setState((prev) => ({
      ...prev,
      turns: [...prev.turns, learnerTurn],
      usage: registerSend(prev.usage),
    }));
    setDraft("");

    try {
      setBusy(true);
      const reply = live
        ? await llmReply(state.config, state.turns, learnerText)
        : demoReply(learnerText);
      const tutorTurn = makeTurn("tutor", reply, state.turns.length + 1);
      setState((prev) => ({ ...prev, turns: [...prev.turns, tutorTurn] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "回覆失敗，請檢查 API 設定");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  function unlockPro() {
    setState((prev) => ({ ...prev, pro: true }));
  }

  function resetToday() {
    setState((prev) => ({ ...prev, usage: { date: todayKey(), count: 0 } }));
  }

  function clearChat() {
    setState((prev) => ({ ...prev, turns: [] }));
  }

  function saveConfig(patch: Partial<LlmConfig>) {
    setState((prev) => ({ ...prev, config: { ...prev.config, ...patch } }));
  }

  return (
    <article>
      <span className="kicker">MVP · AI 中文口說家教</span>
      <h1>中文家教</h1>
      <p className="lede">
        給歐美學習者的台灣中文對話練習。用英文或中文開口，AI 會回覆中文、附拼音與英文對照，並即時糾正用詞。
        免費每天 {FREE_DAILY_LIMIT} 句，超過就升級——這樣免費使用者不會燒光你的 token。
      </p>

      <div className="tutor-status">
        <span className={`badge ${live ? "badge-live" : "badge-demo"}`}>
          {live ? "連線模式（你的 API key）" : "示範模式（離線腳本）"}
        </span>
        {state.pro ? (
          <span className="badge badge-pro">Pro · 無限練習</span>
        ) : (
          <span className="badge">今日剩餘 {remaining} / {FREE_DAILY_LIMIT} 句</span>
        )}
      </div>

      <div className="chips" style={{ marginTop: 12 }}>
        {SUGGESTED_OPENERS.map((prompt) => (
          <button type="button" key={prompt} onClick={() => void send(prompt)} disabled={locked || busy}>
            {prompt}
          </button>
        ))}
      </div>

      <section className="card chat" style={{ marginTop: 16, minHeight: 300 }}>
        {state.turns.length === 0 ? (
          <p className="muted">
            試著打「你好」或「How do I order coffee?」開始。你的每一句都會拿到自然中文＋拼音＋英文。
          </p>
        ) : (
          state.turns.map((turn) => <TurnBubble key={turn.id} turn={turn} />)
        )}
        {busy && <div className="bubble tutor muted">老師思考中…</div>}
        <div ref={endRef} />
      </section>

      {error && <p className="tutor-error">{error}</p>}

      {locked ? (
        <div className="card paywall" style={{ marginTop: 16 }}>
          <h2>今天的免費練習用完了</h2>
          <p>
            你今天已經練了 {FREE_DAILY_LIMIT} 句。升級 Pro 就能無限對話、解鎖情境課程與發音回饋。
            <br />
            <span className="muted">
              （MVP 示範：正式版這裡會接 Stripe 結帳。想先驗證願付價格，這顆按鈕就當作「已付款」。）
            </span>
          </p>
          <div className="actions">
            <button className="btn" type="button" onClick={unlockPro}>
              解鎖 Pro（示範）
            </button>
            <button className="btn ghost" type="button" onClick={resetToday}>
              重設今日用量（示範）
            </button>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={onSubmit} style={{ marginTop: 12 }}>
          <textarea
            rows={3}
            value={draft}
            placeholder="用英文或中文開口，例如：I want to learn how to greet people"
            onChange={(event) => setDraft(event.target.value)}
            disabled={busy}
          />
          <button className="btn" type="submit" disabled={busy || !draft.trim()}>
            送出
          </button>
        </form>
      )}

      <details className="card tutor-settings" style={{ marginTop: 16 }}>
        <summary>連線設定與工具</summary>
        <p className="muted">
          填入你自己的 OpenAI 相容 API key（存在這個瀏覽器，不上傳），就會從示範腳本切換成真正的 LLM 家教。
          沒填的話維持離線示範模式。
        </p>
        <div className="form" style={{ marginTop: 10 }}>
          <label>
            API Base URL
            <input
              value={state.config.baseUrl}
              placeholder={DEFAULT_CONFIG.baseUrl}
              onChange={(event) => saveConfig({ baseUrl: event.target.value })}
            />
          </label>
          <label>
            API Key
            <input
              type="password"
              value={state.config.apiKey}
              placeholder="sk-..."
              onChange={(event) => saveConfig({ apiKey: event.target.value })}
            />
          </label>
          <label>
            Model
            <input
              value={state.config.model}
              placeholder={DEFAULT_CONFIG.model}
              onChange={(event) => saveConfig({ model: event.target.value })}
            />
          </label>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={clearChat}>
            清空對話
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => setState(emptyTutorState())}
          >
            全部重設
          </button>
        </div>
      </details>
    </article>
  );
}

function TurnBubble({ turn }: { turn: TutorTurn }) {
  if (turn.role === "learner") {
    return <div className="bubble user">{turn.text}</div>;
  }
  return (
    <div className="bubble tutor">
      <p className="tutor-han">{turn.text}</p>
      {turn.pinyin && <p className="tutor-pinyin">{turn.pinyin}</p>}
      {turn.english && <p className="tutor-en">{turn.english}</p>}
      {turn.corrections && turn.corrections.length > 0 && (
        <div className="corrections">
          <b>糾正 Corrections</b>
          {turn.corrections.map((correction, index) => (
            <p key={index}>
              <s>{correction.original}</s> → <strong>{correction.suggestion}</strong>
              <span className="muted"> · {correction.note}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
