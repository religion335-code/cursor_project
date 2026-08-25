import { Link } from "react-router-dom";
import { ntd } from "./money";
import { popularItems } from "./menu";
import { hoursRows, shop, shopStatus, soupOfDay, taipeiClock } from "./shop";
import { GrillBowl } from "./GrillBowl";
import { useShop } from "./ShopContext";

export function HomePage() {
  const { now } = useShop();
  const status = shopStatus(now);
  const clock = taipeiClock(now);
  const soup = soupOfDay(clock.weekday);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="kicker">宜蘭 · 炭火便當</p>
          <h1>
            {shop.name}
            <span>{shop.tagline}</span>
          </h1>
          <p className="lede">{shop.lede}</p>
          <div className="status-card">
            <b className={status.open ? "hot" : undefined}>{status.label}</b>
            <span>{status.detail}</span>
            <span>今日湯品：{clock.weekday === 0 ? "公休無湯" : soup}</span>
          </div>
          <div className="actions">
            <Link className="btn" to="/menu">
              看菜單
            </Link>
            <Link className="btn ghost" to="/order">
              外帶點餐
            </Link>
          </div>
        </div>
        <GrillBowl className="hero-bowl" />
      </section>

      <section>
        <h2>常點</h2>
        <div className="row thirds">
          {popularItems().map((item) => (
            <article key={item.id} className="card">
              <p className="kicker">{item.tags[0]}</p>
              <h3>{item.name}</h3>
              <p className="muted">{item.desc}</p>
              <p className="price">{ntd(item.price)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="row halves">
        <article className="card ink">
          <h2>三件事不變</h2>
          <ol className="list">
            <li>肉是當餐下炭，不是隔夜回烤。</li>
            <li>飯是現盛。便當打開還該有熱氣。</li>
            <li>賣完就收。晚餐六點後來，招牌可能已經沒了。</li>
          </ol>
        </article>
        <article className="card">
          <h2>營業時間</h2>
          <table className="table">
            <tbody>
              {hoursRows().map((row) => (
                <tr key={row.day}>
                  <th>{row.day}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">{shop.note}</p>
          <Link to="/shop">店址與內用說明</Link>
        </article>
      </section>
    </div>
  );
}
