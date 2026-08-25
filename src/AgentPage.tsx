import { useEffect, useRef, useState, type FormEvent } from "react";
import { SUGGESTED_PROMPTS, advise } from "./agent";
import { useStudio } from "./studio-context";

export function AgentPage() {
  const { state, addMessage, addQuote, clearMessages } = useStudio();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages.length]);

  function ask(text: string) {
    const question = text.trim();
    if (!question) return;
    addMessage("user", question);
    const reply = advise(question, state);
    addMessage("agent", reply.text);
    if (reply.quote) addQuote(reply.quote);
    setDraft("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  return (
    <article>
      <span className="kicker">不上雲也能答</span>
      <h1>策劃 Agent</h1>
      <p className="lede">
        這不是聊天玩具。它讀你目前的跑道數字與套餐，用規則引擎回答宜蘭十萬創業的具體問題。有案再把真正的 LLM 接在後面；沒案時，不該為了問自己問題而付 token。
      </p>

      <div className="chips">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button type="button" key={prompt} onClick={() => ask(prompt)}>
            {prompt}
          </button>
        ))}
        {state.messages.length > 0 ? (
          <button type="button" onClick={clearMessages}>
            清除對話
          </button>
        ) : null}
      </div>

      <section className="card chat" style={{ marginTop: 16, minHeight: 280 }}>
        {state.messages.length === 0 ? (
          <p className="muted">從上面的問題開始，或自己打：例如「如果資本只有 8 萬呢？」</p>
        ) : (
          state.messages.map((message) => (
            <div className={`bubble ${message.role}`} key={message.id}>
              {message.text}
            </div>
          ))
        )}
        <div ref={endRef} />
      </section>

      <form className="form" onSubmit={onSubmit} style={{ marginTop: 12 }}>
        <textarea
          rows={3}
          value={draft}
          placeholder="問跑道、報價、第一個客戶、雲端或一週怎麼排"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="btn" type="submit">
          送出
        </button>
      </form>
    </article>
  );
}
