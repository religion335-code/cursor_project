import { cartTotal, lineKey, sauceLabels } from "./cart";
import { itemById, itemsByCategory } from "./menu";
import { ntd } from "./money";
import { statusLabels, kitchenOrders } from "./orders";
import { waitingJobs, shouldMount } from "./rack";
import { RackView } from "./RackView";
import { shop, shopStatus } from "./shop";
import { useShop } from "./ShopContext";
import type { OrderStatus } from "./types";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  grilling: "ready",
  ready: "done",
};

const nextLabel: Partial<Record<OrderStatus, string>> = {
  grilling: "跳過計時",
  ready: "已取",
};

export function KitchenPage() {
  const { now, orders, soldOut, jobs, forcedMount, setOrderStatus, toggleSoldOut, resetShop, startEarly } =
    useShop();
  const status = shopStatus(now);
  const today = kitchenOrders(orders, now);
  const active = today.filter((order) => order.status !== "done" && order.status !== "cancelled");
  const waiting = waitingJobs(jobs);

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">店內看板</p>
        <h1>自動炭火</h1>
        <p className="lede">
          {shop.name} · {status.label}。烤肉架自己翻面計時，人顧盛飯跟對號。資料存在這台瀏覽器。
        </p>
      </header>

      <RackView />

      <div className="row halves">
        <section>
          <h2>取餐隊列（{active.length}）</h2>
          {today.length === 0 ? (
            <p className="muted">
              還沒有待取的外帶單。接近取餐才自動上鉤；湯跟飲料不用上架。
            </p>
          ) : (
            <div className="stack">
              {today.map((order) => (
                <article key={order.id} className={`card ticket status-${order.status}`}>
                  <div className="card-top">
                    <b>{order.id}</b>
                    <span className="tag">{statusLabels[order.status]}</span>
                  </div>
                  <p>
                    {order.isoDate} {order.pickupAt} · {order.customerName} · {order.phone}
                  </p>
                  <ul className="plain">
                    {order.lines.map((line) => (
                      <li key={lineKey(line)}>
                        {itemById(line.itemId)?.name} × {line.qty}（{sauceLabels[line.sauce]}）
                        {line.note ? ` · ${line.note}` : ""}
                      </li>
                    ))}
                  </ul>
                  {order.status === "queued" && waiting.some((job) => job.orderId === order.id) ? (
                    shouldMount(order, now) || forcedMount.includes(order.id) ? (
                      <p className="muted">架滿，等空鉤自動上。</p>
                    ) : (
                      <p className="muted">還沒到取餐時間，到點會自動上鉤。示範可提前開烤。</p>
                    )
                  ) : null}
                  <p className="price">{ntd(order.total)}</p>
                  <div className="actions">
                    {order.status === "queued" &&
                    waiting.some((job) => job.orderId === order.id) &&
                    !shouldMount(order, now) &&
                    !forcedMount.includes(order.id) ? (
                      <button type="button" className="btn" onClick={() => startEarly(order.id)}>
                        提前上鉤
                      </button>
                    ) : null}
                    {nextStatus[order.status] ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setOrderStatus(order.id, nextStatus[order.status]!)}
                      >
                        {nextLabel[order.status]}
                      </button>
                    ) : null}
                    {order.status === "queued" || order.status === "grilling" ? (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setOrderStatus(order.id, "cancelled")}
                      >
                        取消
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>今日售完</h2>
          <p className="muted">勾了以後，菜單上的「加入外帶」會關掉。</p>
          <div className="sold-list">
            {itemsByCategory("bento").map((item) => (
              <label key={item.id} className="check">
                <input
                  type="checkbox"
                  checked={soldOut.includes(item.id)}
                  onChange={() => toggleSoldOut(item.id)}
                />
                <span>
                  {item.name}
                  <small>{ntd(item.price)}</small>
                </span>
              </label>
            ))}
          </div>
          <p className="muted">
            進行中外帶合計 {ntd(cartTotal(active.flatMap((order) => order.lines)))}
          </p>
          <button type="button" className="btn ghost" onClick={resetShop}>
            清空本機資料
          </button>
        </section>
      </div>
    </div>
  );
}
