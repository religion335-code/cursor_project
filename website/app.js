const regions = {
  yilan: {
    kicker: "宜蘭母廠 · 直營",
    title: "配方與稽核留在山谷",
    body: "人口約 45 萬，加上觀光流。母廠負責訓練、季節 SKU、宜花東前期供貨。不把全島訂單壓在宜蘭冷凍車上。",
    bullets: ["目標：樣板產線可被見習", "不對外授權宜蘭設廠"],
  },
  north: {
    kicker: "P1 · 北北基",
    title: "第一座對外工廠的首選之一",
    body: "約 680 萬人的盆地。廠址靠近新五泰或汐止工業區，供貨半徑壓在 90 分鐘。市場夠大，競爭也夠兇，要靠穩定品質而不是再開一間冰店。",
    bullets: ["可與桃園劃清專屬區", "樣板廠優先"],
  },
  taoyuan: {
    kicker: "P1 · 桃園",
    title: "航空城與夜市帶",
    body: "約 236 萬人，近國道、餐飲密度高。離宜蘭母廠支援也近，適合作為首座區域廠。",
    bullets: ["與北北基不可重疊授權", "適合有物流背景的加盟主"],
  },
  hsinchu: {
    kicker: "P3 · 竹苗",
    title: "科學園區外食圈",
    body: "約 159 萬人。第三波再開放，避免前兩座工廠尚未穩定就稀釋總部陪跑能量。",
    bullets: ["建議新竹工業區設廠", "可先做經銷觀察"],
  },
  central: {
    kicker: "P2 · 中彰投",
    title: "中台灣的夜市與觀光",
    body: "約 455 萬人。台中工業區出發，供彰化夜市與南投風景區。第二波複製的主力區。",
    bullets: ["第二座或第三座廠", "淡季靠埔里／日月潭活動與甜湯線"],
  },
  "south-mid": {
    kicker: "P3 · 雲嘉南",
    title: "府城餐飲帶",
    body: "約 323 萬人。台南永康或嘉義工業區。雪花冰競爭成熟，必須用真水果差異化。",
    bullets: ["第三波", "對既有冰店做經銷升級"],
  },
  south: {
    kicker: "P2 · 高屏",
    title: "高雄日常＋墾丁季節",
    body: "約 349 萬人。夏季與連假高峰明顯，工廠必須先準備淡季 OEM，不能只靠墾丁。",
    bullets: ["第二波", "冷凍庫容量要比北部估得更大"],
  },
  east: {
    kicker: "衛星 · 花東",
    title: "先供貨，不急著蓋廠",
    body: "約 52 萬人。觀光季強、平時薄。前期由宜蘭直供或授權經銷，避免為了地圖好看而讓加盟主套牢產能。",
    bullets: ["不開放工廠招商", "季節專案支援"],
  },
};

const regionFixed = {
  north: 360000,
  taoyuan: 320000,
  hsinchu: 280000,
  central: 330000,
  "south-mid": 300000,
  south: 320000,
};

const mapPanel = document.getElementById("map-panel");
const regionNodes = document.querySelectorAll(".region");
const regionChips = document.querySelectorAll(".region-chips button");

function renderRegion(key) {
  const data = regions[key];
  if (!data || !mapPanel) return;
  regionNodes.forEach((node) => {
    node.classList.toggle("is-on", node.dataset.region === key);
  });
  regionChips.forEach((chip) => {
    const on = chip.dataset.region === key;
    chip.classList.toggle("is-on", on);
    chip.setAttribute("aria-selected", String(on));
  });
  mapPanel.innerHTML = `
    <p class="map-kicker">${data.kicker}</p>
    <h3>${data.title}</h3>
    <p>${data.body}</p>
    <ul>${data.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
  `;
}

function bindRegionControl(node) {
  node.addEventListener("click", () => renderRegion(node.dataset.region));
  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      renderRegion(node.dataset.region);
    }
  });
}

regionNodes.forEach((node) => {
  node.setAttribute("tabindex", "0");
  node.setAttribute("role", "button");
  bindRegionControl(node);
});
regionChips.forEach((chip) => bindRegionControl(chip));

const volume = document.getElementById("calc-volume");
const price = document.getElementById("calc-price");
const cost = document.getElementById("calc-cost");
const region = document.getElementById("calc-region");
const result = document.getElementById("calc-result");

function money(value) {
  return Math.round(value).toLocaleString("zh-Hant-TW");
}

function renderCalc() {
  if (!volume || !result) return;
  document.getElementById("calc-volume-out").textContent = volume.value;
  document.getElementById("calc-price-out").textContent = price.value;
  document.getElementById("calc-cost-out").textContent = cost.value;

  const units = Number(volume.value);
  const unitPrice = Number(price.value);
  const unitCost = Number(cost.value);
  const contribution = unitPrice - unitCost;
  const days = 24;
  const monthly = units * days * contribution;
  const fixed = regionFixed[region.value] || 320000;
  const leftover = monthly - fixed;
  const annual = leftover * 12;
  const capexMid = 5400000;
  const years = leftover > 0 ? capexMid / leftover / 12 : null;

  let reading = "以目前假設，貢獻毛利還蓋不過固定費。這是淡季或客戶不足的樣子——先找經銷，再放大產能。";
  if (leftover > 80000) {
    reading = "旺季或客戶網絡成熟時才比較接近這個數字。請用淡季再跑一次滑桿，不要只看夏天。";
  } else if (leftover > 0) {
    reading = "開業年比較像這個區間：可能打平或小餘。回本以年計，不是以月計。";
  }

  result.innerHTML = `
    <div class="metric"><span>單顆貢獻</span><b>${money(contribution)} 元</b></div>
    <div class="metric"><span>月貢獻毛利（24 天）</span><b>${money(monthly)} 元</b></div>
    <div class="metric"><span>區域固定費假設</span><b>${money(fixed)} 元</b></div>
    <div class="metric"><span>月剩餘（未計稅）</span><b>${money(leftover)} 元</b></div>
    <div class="metric wide">${reading}<br />若以規劃中位投資 540 萬粗除，約當 ${
      years ? `${years.toFixed(1)} 年` : "無法估算回本（月剩餘為負）"
    }。年剩餘約 ${money(annual)} 元。此結果不是保證。</div>
  `;
}

["input", "change"].forEach((eventName) => {
  [volume, price, cost, region].forEach((el) => {
    if (el) el.addEventListener(eventName, renderCalc);
  });
});

renderCalc();

const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

const form = document.getElementById("apply-form");
const statusEl = document.getElementById("form-status");
const copyBtn = document.getElementById("copy-btn");
let draft = "";

function buildLetter(data) {
  return `主旨：宜蘭蜜谷冰磚工廠加盟意向／${data.area}／${data.name}

您好，我已閱讀招商頁之風險說明，了解數字並非保證收益，現階段僅登記意向、不支付訂金。

姓名：${data.name}
電話：${data.phone}
Email：${data.email}
希望區域：${data.area}
可動用資金：${data.capital}
方案傾向：${data.plan}
背景與想法：
${data.note || "（未填）"}

請安排後續說明或宜蘭母廠參觀。`;
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    draft = buildLetter(data);
    statusEl.innerHTML = `已產生意向信。請按「複製內容」，用郵件或 LINE 傳給宜蘭總店（03-935-1856 來電約定）。<pre class="letter-preview">${draft
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre>`;
    copyBtn.hidden = false;
    try {
      localStorage.setItem("megoo-franchise-draft", JSON.stringify(data));
    } catch (error) {
      /* ignore */
    }
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      statusEl.textContent = "已複製意向信，可直接貼到郵件或 LINE。";
    } catch (error) {
      statusEl.textContent = "無法自動複製，請手動選取郵件草稿內容。";
    }
  });
}

try {
  const saved = JSON.parse(localStorage.getItem("megoo-franchise-draft") || "null");
  if (saved && form) {
    Object.entries(saved).forEach(([key, value]) => {
      if (form.elements[key] && key !== "risk") form.elements[key].value = value;
    });
  }
} catch (error) {
  /* ignore */
}
