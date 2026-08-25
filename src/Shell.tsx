import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cartCount } from "./cart";
import { shop, shopStatus } from "./shop";
import { useShop } from "./ShopContext";

const links = [
  { to: "/", label: "首頁", end: true },
  { to: "/menu", label: "菜單" },
  { to: "/order", label: "外帶" },
  { to: "/shop", label: "店址" },
];

export function Shell() {
  const { now, cart } = useShop();
  const status = shopStatus(now);
  const count = cartCount(cart);
  const location = useLocation();

  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand">
          <img src="/mark.svg" alt="" width={42} height={42} />
          <span>
            <small>{shop.mark}</small>
            <strong>{shop.name}</strong>
          </span>
        </NavLink>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="top-meta">
          <span className={status.open ? "pill open" : "pill"}>{status.label}</span>
          <NavLink to="/order" className="cart-link">
            購物袋{count > 0 ? ` ${count}` : ""}
          </NavLink>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      {count > 0 && location.pathname !== "/order" ? (
        <NavLink to="/order" className="cart-dock">
          查看外帶 {count} 份 · 去結帳
        </NavLink>
      ) : null}
      <footer className="foot">
        <p>
          {shop.name} · {shop.address}
        </p>
        <p className="muted">
          週一至週六午餐、晚餐兩段營業，週日公休。店內看板給現場用，資料存在這台瀏覽器。
        </p>
        <NavLink to="/kitchen">店內看板</NavLink>
      </footer>
    </div>
  );
}
