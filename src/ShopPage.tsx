import { hoursRows, shop, shopStatus, soupOfDay, taipeiClock } from "./shop";
import { useShop } from "./ShopContext";

export function ShopPage() {
  const { now } = useShop();
  const status = shopStatus(now);
  const clock = taipeiClock(now);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.mapsQuery)}`;

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">店址</p>
        <h1>來的路上</h1>
        <p className="lede">
          {shop.address}，{shop.walk}。{shop.seats}，尖峰多是外帶。{shop.payment}。
        </p>
      </header>

      <div className="row halves">
        <article className="card ink">
          <p className="kicker">{status.label}</p>
          <h2>{shop.name}</h2>
          <p>{status.detail}</p>
          <p>今日湯品：{clock.weekday === 0 ? "公休" : soupOfDay(clock.weekday)}</p>
          <p>LINE：{shop.lineId}</p>
          <a className="btn" href={maps} target="_blank" rel="noreferrer">
            在地圖打開
          </a>
        </article>
        <article className="card">
          <h2>時間</h2>
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
        </article>
      </div>

      <section className="row thirds">
        <article className="card">
          <h3>內用嗎？</h3>
          <p className="muted">
            可以，但只有約八個位子。兩個人還坐得下；中午團體建議外帶，避免占到後面排隊的人。
          </p>
        </article>
        <article className="card">
          <h3>可以挑菜嗎？</h3>
          <p className="muted">
            不行。配菜跟湯看當天備料。便當打開會有菜、有辣菜脯；想再加菜，菜單裡有高麗菜。
          </p>
        </article>
        <article className="card">
          <h3>會不會很鹹？</h3>
          <p className="muted">
            烤肉醬偏鹹香。怕鹹請在外帶單選少醬，或多配白飯跟菜脯。排骨有時醬會厚一點。
          </p>
        </article>
      </section>
    </div>
  );
}
