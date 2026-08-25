import { useState } from "react";
import { categories, categoryLabels, itemsByCategory } from "./menu";
import { ntd } from "./money";
import { useShop } from "./ShopContext";
import type { Category } from "./types";

export function MenuPage() {
  const { addToCart, soldOut } = useShop();
  const [active, setActive] = useState<Category>("bento");
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">菜單</p>
        <h1>今日炭火</h1>
        <p className="lede">
          便當附當日配菜與辣菜脯。內用熱湯自取；外帶湯品另外點。醬量在購物袋裡再選。
        </p>
      </header>
      <div className="chips" role="tablist">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={category === active ? "on" : undefined}
            onClick={() => setActive(category)}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>
      <div className="menu-grid">
        {itemsByCategory(active).map((item) => {
          const gone = soldOut.includes(item.id);
          return (
            <article key={item.id} className="card menu-card">
              <div>
                <div className="card-top">
                  {item.popular ? <span className="tag">常點</span> : null}
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag quiet">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3>{item.name}</h3>
                <p className="muted">{item.desc}</p>
              </div>
              <div className="card-foot">
                <b className="price">{ntd(item.price)}</b>
                <button
                  type="button"
                  className="btn"
                  disabled={gone}
                  onClick={() => {
                    addToCart(item.id);
                    setFlash(`${item.name} 已加入`);
                  }}
                >
                  {gone ? "今日售完" : "加入外帶"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {flash ? <p className="toast">{flash}</p> : null}
    </div>
  );
}
