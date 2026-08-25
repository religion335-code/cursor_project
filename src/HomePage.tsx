import { Link } from "react-router-dom";
import { PLAYBOOK } from "./catalog";
import { monthsLabel, ntd } from "./money";
import { monthlyBurn, runwayMonths, workingCapital } from "./runway";
import { useStudio } from "./studio-context";

export function HomePage() {
  const { state } = useStudio();
  const burn = monthlyBurn(state.items);
  const months = runwayMonths(state.capital, state.items);
  const pool = workingCapital(state.capital, state.items);

  return (
    <article>
      <span className="kicker">宜蘭 · 遠距 · Agent AI</span>
      <div className="hero">
        <h1>十萬起步，把 Agent 做成可接案的雲上工作室。</h1>
        <p className="lede">
          不住台北、不租辦公室。Cloud 當廠房，Agent 當員工，人留在蘭陽平原。這份程式是對外作品集，也是一人公司的作業系統：算跑道、開報價、排案件、問策劃 Agent。
        </p>
        <div className="actions">
          <Link className="btn" to="/runway">
            先算十萬能撐多久
          </Link>
          <Link className="btn ghost" to="/agent">
            問本地 Agent
          </Link>
        </div>
      </div>

      <section className="row stats">
        <div className="card stat">
          資本
          <b>{ntd(state.capital)}</b>
        </div>
        <div className="card stat">
          開辦後可用
          <b>{ntd(pool)}</b>
        </div>
        <div className="card stat">
          預估月燒
          <b>{ntd(burn)}</b>
        </div>
        <div className="card stat ink">
          無收入跑道
          <b>{monthsLabel(months)}</b>
        </div>
      </section>

      <section className="row thirds">
        <div className="card">
          <h2>Agent AI</h2>
          <p className="muted">把每週都在複製貼上的工作做成可交付的代理人：客服草稿、預約、報價、內部問答。</p>
        </div>
        <div className="card">
          <h2>Cloud</h2>
          <p className="muted">網站、信箱、Worker 先吃免費額度。沒有發票時不開 LLM 用量，避免十萬塊變成 token。</p>
        </div>
        <div className="card">
          <h2>遠距</h2>
          <p className="muted">客戶在台北或海外，你在羅東或礁溪。宜蘭的雨正好拿來交件，不必為了辦公室去燒租金。</p>
        </div>
      </section>

      <section className="row halves" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>九十天只做一件事</h2>
          <p className="muted">讓本金不再是唯一收入。不是做平台夢，是開出第一張帳單再留下月費。</p>
          <ol className="list">
            {PLAYBOOK.map((block) => (
              <li key={block.window}>
                <strong>{block.window}</strong> {block.title}
              </li>
            ))}
          </ol>
        </div>
        <div className="card ink">
          <h2>為什麼是宜蘭</h2>
          <p>
            同樣十萬，台北租屋可能兩個月就瘦一圈。宜蘭／羅東的套房與生活費，夠你走完「示範 → 診斷 → 建置」一個循環。觀光季不穩定，反而適合做不靠客流的雲上生意。
          </p>
          <p className="muted">本系統可部署到 Cloudflare Pages，月費可以是零。</p>
        </div>
      </section>
    </article>
  );
}
