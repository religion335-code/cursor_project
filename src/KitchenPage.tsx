import { cartTotal, lineKey, sauceLabels } from "./cart";
import { itemById, itemsByCategory } from "./menu";
import { ntd } from "./money";
import { statusLabels, todaysOrders } from "./orders";
import { shop, shopStatus } from "./shop";
import { useShop } from "./ShopContext";
import type { OrderStatus } from "./types";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  queued: "grilling",
  grilling: "ready",
  ready: "done",
};

const nextLabel: Partial<Record<OrderStatus, string>> = {
  queued: "開始烤",
  grilling: "可取餐",
  ready: "已取",
};

export function KitchenPage() {
  const { now, orders, soldOut, setOrderStatus, toggleSoldOut, resetShop } = useShop();
  const status = shopStatus(now);
  const today = todaysOrders(orders, now);
  const active = today.filter((order) => order.status !== "done" && order.status !== "cancelled");

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">店內看板</p>
        <h1>今日炭火</h1>
        <p className="lede">
          {shop.name} · {status.label}。訂單跟售完狀態存在這台瀏覽器，給櫃台對號，不是雲端後台。
        </p>
      </header>

      <div className="row halves">
        <section>
          <h2>取餐隊列（{active.length}）</h2>
          {today.length === 0 ? (
            <p className="muted">今天還沒有外帶單。客人在「外帶」送出後會出現在這裡。</p>
          ) : (
            <div className="stack">
              {today.map((order) => (
                <article key={order.id} className={`card ticket status-${order.status}`}>
                  <div className="card-top">
                    <b>{order.id}</b>
                    <span className="tag">{statusLabels[order.status]}</span>
                  </div>
                  <p>
                    {order.pickupAt} · {order.customerName} · {order.phone}
                  </p>
                  <ul className="plain">
                    {order.lines.map((line) => (
                      <li key={lineKey(line)}>
                        {itemById(line.itemId)?.name} × {line.qty}（{sauceLabels[line.sauce]}）
                        {line.note ? ` · ${line.note}` : ""}
                      </li>
                    ))}
                  </ul>
                  <p className="price">{ntd(order.total)}</p>
                  <div className="actions">
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
