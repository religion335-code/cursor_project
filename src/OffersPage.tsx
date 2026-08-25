import { useMemo, useState } from "react";
import { OFFERS } from "./catalog";
import { ntd } from "./money";
import { buildQuote, quoteText } from "./quotes";
import { contribution, offerById, taxIncluded } from "./runway";
import { useStudio } from "./studio-context";
import type { OfferId } from "./types";

export function OffersPage() {
  const { addQuote, state } = useStudio();
  const [client, setClient] = useState("羅東示範店家");
  const [contact, setContact] = useState("");
  const [offerId, setOfferId] = useState<OfferId>("spark");
  const [scope, setScope] = useState("週末訂房與常見問答的 Agent 診斷");
  const latest = state.quotes[0];
  const preview = useMemo(
    () => buildQuote({ client, contact, offerId, scope }),
    [client, contact, offerId, scope],
  );
  const offer = offerById(offerId);
  const tax = taxIncluded(offer.price);

  return (
    <article>
      <span className="kicker">可賣的三件事</span>
      <h1>方案</h1>
      <p className="lede">
        十萬預算養不起客製到虧的案子。對外只賣診斷、建置、月費。成交順序是讓陌生人先跨過 18,000，而不是一次要 48,000。
      </p>

      <section className="row thirds">
        {OFFERS.map((item) => (
          <div className="card" key={item.id}>
            <p className="muted">{item.tag}</p>
            <h2>{item.name}</h2>
            <p className="stat">
              <b>{ntd(item.price)}</b>
            </p>
            <p>{item.summary}</p>
            <ul className="list">
              {item.deliverables.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="muted">
              估列工時 {item.hours} 小時 · API 成本 {ntd(item.apiCost)} · 貢獻 {ntd(contribution(item))}
            </p>
            <p className="muted">{item.bestFor}</p>
          </div>
        ))}
      </section>

      <section className="row halves" style={{ marginTop: 16 }}>
        <form
          className="card form"
          onSubmit={(event) => {
            event.preventDefault();
            addQuote(buildQuote({ client, contact, offerId, scope }));
          }}
        >
          <h2>開報價</h2>
          <label>
            客戶
            <input value={client} onChange={(event) => setClient(event.target.value)} />
          </label>
          <label>
            聯絡
            <input
              value={contact}
              placeholder="LINE / Email"
              onChange={(event) => setContact(event.target.value)}
            />
          </label>
          <label>
            方案
            <select
              value={offerId}
              onChange={(event) => setOfferId(event.target.value as OfferId)}
            >
              {OFFERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {ntd(item.price)}
                </option>
              ))}
            </select>
          </label>
          <label>
            範圍
            <textarea rows={4} value={scope} onChange={(event) => setScope(event.target.value)} />
          </label>
          <p className="muted">
            含稅 {ntd(tax.total)}（未稅 {ntd(tax.pretax)}＋稅 {ntd(tax.tax)}）。尚未設立時請在對話裡講清楚開立方式。
          </p>
          <button className="btn" type="submit">
            存到工作室
          </button>
        </form>
        <div className="card quote-sheet">
          <h2>預覽</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {quoteText(latest ?? preview)}
          </pre>
          <button className="btn ghost" type="button" onClick={() => window.print()}>
            列印／存 PDF
          </button>
        </div>
      </section>
    </article>
  );
}
