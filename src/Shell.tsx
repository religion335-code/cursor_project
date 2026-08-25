import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/", "首頁"],
  ["/runway", "跑道"],
  ["/offers", "方案"],
  ["/studio", "工作室"],
  ["/agent", "Agent"],
] as const;

export function Shell() {
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <img src="/mark.svg" alt="" />
          <div>
            <small>Lanyang Cloud</small>
            <strong>蘭陽雲工</strong>
          </div>
        </div>
        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="side-note">
          十萬新台幣 · 宜蘭據點 · Agent 交件 · Cloud 當廠房。資料存在這個瀏覽器，不上雲、不收月費。
        </p>
      </aside>
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
