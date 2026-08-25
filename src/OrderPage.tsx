import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { cartCount, cartTotal, lineKey, lineTotal, sauceLabels } from "./cart";
import { itemById } from "./menu";
import { ntd } from "./money";
import { availableSlots } from "./shop";
import { useShop } from "./ShopContext";
import type { Sauce } from "./types";

const sauces: Sauce[] = ["normal", "less", "extra"];

export function OrderPage() {
  const {
    now,
    cart,
    changeQty,
    changeSauce,
    changeNote,
    checkout,
    lastReceipt,
    dismissReceipt,
    clearCart,
  } = useShop();
  const slots = useMemo(() => availableSlots(now), [now]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slotValue, setSlotValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selected = slotValue || (slots[0] ? slotToken(slots[0]) : "");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const slot = slots.find((item) => slotToken(item) === selected);
    if (!slot) {
      setError("目前沒有可預訂的時段");
      return;
    }
    const result = checkout({
      customerName: name,
      phone,
      isoDate: slot.isoDate,
      window: slot.window,
      pickupAt: slot.pickupAt,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setName("");
    setPhone("");
  }

  if (lastReceipt) {
    return (
      <div className="page">
        <article className="card receipt">
          <p className="kicker">取餐號</p>
          <h1>{lastReceipt.id}</h1>
          <p>
            {lastReceipt.customerName}，{lastReceipt.isoDate} {lastReceipt.pickupAt}{" "}
            {lastReceipt.window === "lunch" ? "午餐" : "晚餐"}到店取。
          </p>
          <ul className="plain">
            {lastReceipt.lines.map((line) => {
              const item = itemById(line.itemId);
              return (
                <li key={lineKey(line)}>
                  {item?.name} × {line.qty}（{sauceLabels[line.sauce]}）{ntd(lineTotal(line))}
                </li>
              );
            })}
          </ul>
          <p className="price">合計 {ntd(lastReceipt.total)}</p>
          <p className="muted">到店報取餐號。現場若已售完，我們會用留的電話連絡。</p>
          <div className="actions">
            <button type="button" className="btn" onClick={dismissReceipt}>
              再點一筆
            </button>
            <Link className="btn ghost" to="/menu">
              回菜單
            </Link>
          </div>
        </article>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="page">
        <header className="page-head">
          <p className="kicker">外帶</p>
          <h1>購物袋是空的</h1>
          <p className="lede">先從菜單把要烤的飯加進來。點餐資料只存在這台瀏覽器，沒有後台扣款。</p>
        </header>
        <Link className="btn" to="/menu">
          去菜單
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">外帶</p>
        <h1>確認便當與取餐時間</h1>
        <p className="lede">
          {cartCount(cart)} 份，合計 {ntd(cartTotal(cart))}。選取餐時段後留下姓名電話，到店報號。
        </p>
      </header>

      <div className="row halves">
        <section className="stack">
          {cart.map((line) => {
            const item = itemById(line.itemId);
            if (!item) return null;
            const key = lineKey(line);
            return (
              <article key={key} className="card line">
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted">{ntd(item.price)} / 份</p>
                </div>
                <label>
                  醬
                  <select
                    value={line.sauce}
                    onChange={(event) => changeSauce(key, event.target.value as Sauce)}
                  >
                    {sauces.map((sauce) => (
                      <option key={sauce} value={sauce}>
                        {sauceLabels[sauce]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  數量
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={line.qty}
                    onChange={(event) => changeQty(key, Number(event.target.value))}
                  />
                </label>
                <label className="wide">
                  備註
                  <input
                    value={line.note}
                    placeholder="去蔥、飯少一點…"
                    onChange={(event) => changeNote(key, event.target.value)}
                  />
                </label>
                <p className="price">{ntd(lineTotal(line))}</p>
              </article>
            );
          })}
          <button type="button" className="btn ghost" onClick={clearCart}>
            清空購物袋
          </button>
        </section>

        <form className="card form" onSubmit={onSubmit}>
          <h2>取餐資料</h2>
          <label>
            姓名
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            電話
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0912-000-000"
              required
            />
          </label>
          <label>
            取餐時段
            <select value={selected} onChange={(event) => setSlotValue(event.target.value)}>
              {slots.map((slot) => (
                <option key={slotToken(slot)} value={slotToken(slot)}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn">
            送出外帶 {ntd(cartTotal(cart))}
          </button>
          <p className="muted">現場付款。這份訂單會出現在店內看板，方便對號。</p>
        </form>
      </div>
    </div>
  );
}

function slotToken(slot: { isoDate: string; window: string; pickupAt: string }): string {
  return `${slot.isoDate}|${slot.window}|${slot.pickupAt}`;
}
