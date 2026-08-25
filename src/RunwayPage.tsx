import { DEFAULT_ITEMS } from "./catalog";
import { monthsLabel, ntd } from "./money";
import {
  categoryBurn,
  defaultItems,
  forecastCash,
  leanItems,
  monthlyBurn,
  offerById,
  projectsToCoverBurn,
  runwayMonths,
  setupCost,
  workingCapital,
} from "./runway";
import { useStudio } from "./studio-context";
import type { CostCategory } from "./types";

const labels: Record<CostCategory, string> = {
  living: "宜蘭生活",
  tooling: "一人工具",
  cloud: "雲端廠房",
  setup: "開辦一次",
};

export function RunwayPage() {
  const { state, setCapital, setItems, patchItem } = useStudio();
  const burn = monthlyBurn(state.items);
  const setup = setupCost(state.items);
  const pool = workingCapital(state.capital, state.items);
  const months = runwayMonths(state.capital, state.items);
  const build = offerById("build");
  const retain = offerById("retain");
  const retainersNeeded = projectsToCoverBurn(burn, retain);
  const forecast = forecastCash({
    capital: state.capital,
    items: state.items,
    firstProjectMonth: 2,
    firstOffer: build,
    retainerFromMonth: 3,
    retainer: retain,
  });
  const maxCash = Math.max(...forecast.map((point) => Math.abs(point.cash)), pool, 1);

  return (
    <article>
      <span className="kicker">NT$100,000 規劃假設</span>
      <h1>跑道</h1>
      <p className="lede">
        把十萬當成生活與交件的緩衝，不是行銷預算。數字可改，會立刻重算月燒與可撐多久。這不是投資建議，是一人工作室的現金算術。
      </p>
      <div className="actions">
        <button className="btn ghost" type="button" onClick={() => setItems(defaultItems())}>
          恢復預設
        </button>
        <button className="btn forest" type="button" onClick={() => setItems(leanItems(state.items))}>
          極省：先關掉勞保與 API
        </button>
      </div>

      <section className="row stats">
        <label className="card stat">
          資本
          <input
            type="number"
            min={0}
            step={1000}
            value={state.capital}
            onChange={(event) => setCapital(Number(event.target.value) || 0)}
            style={{
              marginTop: 8,
              width: "100%",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 8,
            }}
          />
        </label>
        <div className="card stat">
          開辦支出
          <b>{ntd(setup)}</b>
        </div>
        <div className="card stat">
          月燒
          <b>{ntd(burn)}</b>
        </div>
        <div className="card stat ink">
          無收入可撐
          <b>{monthsLabel(months)}</b>
        </div>
      </section>

      <section className="row halves">
        <div className="card">
          <h2>科目</h2>
          {(Object.keys(labels) as CostCategory[]).map((category) => (
            <div key={category}>
              <h3>
                {labels[category]}
                {category !== "setup" ? (
                  <span className="muted"> · {ntd(categoryBurn(state.items, category))}/月</span>
                ) : null}
              </h3>
              {state.items
                .filter((item) => item.category === category)
                .map((item) => (
                  <label className="toggle" key={item.id}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) => patchItem(item.id, { enabled: event.target.checked })}
                    />
                    <span>
                      <strong>{item.name}</strong>
                      <div className="muted">{item.note}</div>
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={item.amount}
                      onChange={(event) =>
                        patchItem(item.id, { amount: Number(event.target.value) || 0 })
                      }
                    />
                  </label>
                ))}
            </div>
          ))}
        </div>
        <div>
          <div className="card">
            <h2>若第 2 月交一案、第 3 月留月費</h2>
            <p className="muted">
              建置 {ntd(build.price)}，月費 {ntd(retain.price)}。一份月費打不平{" "}
              {ntd(burn)} 的生活，約需 {retainersNeeded.toFixed(1)}{" "}
              份月費才蓋過月燒；所以第 2 月進帳後，若只有一份月費，水位仍會再往下走。
            </p>
            <div className="bars">
              {forecast.map((point) => (
                <div className={`bar${point.cash < 0 ? " neg" : ""}`} key={point.month}>
                  <span>{point.label}</span>
                  <span className="track">
                    <i style={{ width: `${Math.min(100, (Math.abs(point.cash) / maxCash) * 100)}%` }} />
                  </span>
                  <span>{ntd(point.cash)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>可用水位</h2>
            <p>
              開辦後 {ntd(pool)}。預設把共創空間關掉、LLM 用量維持低檔，因為還沒有客戶時，token 就是伙食費。
            </p>
            <p className="muted">
              預設租金參考宜蘭／羅東套房，不是台北。若你把租金改成 25,000，跑道會立刻變短——這就是為什麼據點選宜蘭。
            </p>
            <p className="muted">預設科目 {DEFAULT_ITEMS.length} 項，全部可關可改。</p>
          </div>
        </div>
      </section>
    </article>
  );
}
