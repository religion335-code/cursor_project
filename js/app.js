import { STRINGS } from "./i18n.js";
import {
  ELIGIBLE_PLANS,
  OFFICIAL,
  PLATFORMS,
  detectPlatform,
  eligibilityResult,
  getPlatform,
} from "./platforms.js";

const LANG_KEY = "grok-bot-download-lang";
const PLAN_KEY = "grok-bot-download-plans";

const $ = (sel, root = document) => root.querySelector(sel);

function readLang() {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "en" || stored === "zh-TW") return stored;
  const nav = (navigator.language || "").toLowerCase();
  return nav.startsWith("zh") ? "zh-TW" : "en";
}

async function architectureHint() {
  const uaData = navigator.userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const { architecture } = await uaData.getHighEntropyValues([
        "architecture",
      ]);
      return architecture || "";
    } catch {
      return "";
    }
  }
  return "";
}

function renderFaq(t) {
  return t.faq
    .map(
      (item) => `
      <details class="faq">
        <summary>${item.q}</summary>
        <p>${item.a}</p>
      </details>`,
    )
    .join("");
}

function platformCopy(t, id) {
  return t.platforms[id];
}

function renderPlatformButtons(t, selectedId) {
  return PLATFORMS.map((p) => {
    const copy = platformCopy(t, p.id);
    const pressed = p.id === selectedId ? "true" : "false";
    return `
      <button type="button" class="chip" data-platform="${p.id}" aria-pressed="${pressed}">
        <span class="chip-name">${copy.name}</span>
        <span class="chip-need">${p.needs}</span>
      </button>`;
  }).join("");
}

function renderPlans(t, selected) {
  const set = new Set(selected);
  return ELIGIBLE_PLANS.map((plan) => {
    const checked = set.has(plan.id) ? "checked" : "";
    return `
      <label class="plan">
        <input type="checkbox" name="plan" value="${plan.id}" ${checked} />
        <span>
          <strong>${plan.name}</strong>
          <em>${plan.group === "grok" ? "xAI SuperGrok" : "Cursor"}</em>
        </span>
      </label>`;
  }).join("");
}

function renderSteps(t, id) {
  const copy = platformCopy(t, id);
  return `
    <ol>
      ${copy.steps.map((step) => `<li>${step}</li>`).join("")}
    </ol>
    <p class="check">${copy.check}</p>
  `;
}

function noteForDetection(t, detection) {
  if (detection.note === "ipad-unsupported") return t.ipadNote;
  if (detection.note === "macos-arch-unknown") return t.macosArchNote;
  if (!detection.id) return t.detectedUnknown;
  return "";
}

function render(state) {
  const t = STRINGS[state.lang];
  const platform = getPlatform(state.selectedId) || PLATFORMS[0];
  const copy = platformCopy(t, platform.id);
  const detectionNote = noteForDetection(t, state.detection);
  const eligibility = eligibilityResult(state.plans);
  const detectedName = state.detection.id
    ? platformCopy(t, state.detection.id).name
    : state.detection.family === "ipad"
      ? "iPad"
      : "—";
  const badge =
    state.detection.confidence === "high"
      ? t.confidenceHigh
      : t.confidenceMedium;

  document.documentElement.lang = t.htmlLang;
  document.title = t.title;

  $("#app").innerHTML = `
    <header class="top">
      <div class="brand">
        <span class="mark" aria-hidden="true">G</span>
        <div>
          <p class="kicker">${t.brandKicker}</p>
          <strong>${t.brandName}</strong>
        </div>
      </div>
      <button type="button" class="ghost" id="lang-toggle">${t.langLabel}</button>
    </header>

    <section class="hero">
      <p class="eyebrow">${t.heroEyebrow}</p>
      <h1>${t.heroTitle}</h1>
      <p class="lead">${t.heroLead}</p>
    </section>

    <section class="panel detect" aria-labelledby="detect-label">
      <div class="detect-copy">
        <p class="label" id="detect-label">${t.detectedLabel}</p>
        <h2>${detectedName}</h2>
        <p class="badge">${badge}</p>
        ${detectionNote ? `<p class="warn">${detectionNote}</p>` : ""}
      </div>
      <div class="cta-block">
        <a class="primary" id="official-cta" href="${platform.href}" target="_blank" rel="noopener noreferrer">
          ${copy.cta}
        </a>
        <button type="button" class="ghost" id="copy-link">${t.copyLink}</button>
        <p class="fine">${t.moreLinux}</p>
      </div>
    </section>

    <section class="panel">
      <h2>${t.otherPlatforms}</h2>
      <div class="chips" id="platform-chips">
        ${renderPlatformButtons(t, platform.id)}
      </div>
    </section>

    <section class="split">
      <article class="panel">
        <h2>${t.stepsTitle}</h2>
        <div id="steps">${renderSteps(t, platform.id)}</div>
      </article>
      <article class="panel">
        <h2>${t.eligibilityTitle}</h2>
        <p>${t.eligibilityLead}</p>
        <p class="fine">${t.eligibilityHint}</p>
        <form id="plans" class="plans">${renderPlans(t, state.plans)}</form>
        <p class="${eligibility.eligible ? "ok" : "muted"}" id="elig-msg">
          ${eligibility.eligible ? t.eligibilityYes : t.eligibilityNo}
        </p>
        <a class="text-link" href="${OFFICIAL.cursorPricing}" target="_blank" rel="noopener noreferrer">${t.checkPricing}</a>
        <p class="warn slim">${t.privacyNote}
          <a href="${OFFICIAL.cursorPrivacy}" target="_blank" rel="noopener noreferrer">Cursor privacy</a>
        </p>
      </article>
    </section>

    <section class="panel">
      <h2>${t.firstTaskTitle}</h2>
      <p>${t.firstTaskLead}</p>
      <div class="tasks">
        <article class="task">
          <h3>${t.task1Title}</h3>
          <p id="task-1">${t.task1Body}</p>
          <button type="button" class="ghost" data-copy-task="task-1">${t.copyTask}</button>
        </article>
        <article class="task">
          <h3>${t.task2Title}</h3>
          <p id="task-2">${t.task2Body}</p>
          <button type="button" class="ghost" data-copy-task="task-2">${t.copyTask}</button>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2>${t.faqTitle}</h2>
      <div class="faqs">${renderFaq(t)}</div>
    </section>

    <footer>
      <p>${t.disclaimer}</p>
      <nav>
        <a href="${OFFICIAL.getStarted}" target="_blank" rel="noopener noreferrer">${t.footerDocs}</a>
        <a href="${OFFICIAL.faq}" target="_blank" rel="noopener noreferrer">${t.footerFaq}</a>
        <a href="${OFFICIAL.intro}" target="_blank" rel="noopener noreferrer">${t.footerIntro}</a>
      </nav>
    </footer>
  `;
}

async function boot() {
  const lang = readLang();
  const storedPlans = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem(PLAN_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  })();

  const arch = await architectureHint();
  const detection = detectPlatform(navigator.userAgent, {
    platform: navigator.platform,
    userAgentDataArch: arch,
  });

  const state = {
    lang,
    detection,
    selectedId: detection.id || "macos-apple",
    plans: storedPlans,
  };

  const bind = () => {
    const t = STRINGS[state.lang];
    $("#lang-toggle").addEventListener("click", () => {
      state.lang = state.lang === "zh-TW" ? "en" : "zh-TW";
      localStorage.setItem(LANG_KEY, state.lang);
      render(state);
      bind();
    });

    $("#platform-chips").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-platform]");
      if (!btn) return;
      state.selectedId = btn.getAttribute("data-platform");
      render(state);
      bind();
    });

    $("#copy-link").addEventListener("click", async () => {
      const href = getPlatform(state.selectedId)?.href;
      if (!href) return;
      try {
        await navigator.clipboard.writeText(href);
        $("#copy-link").textContent = t.copied;
      } catch {
        window.prompt(t.copyLink, href);
      }
    });

    $("#plans").addEventListener("change", () => {
      state.plans = [...document.querySelectorAll('input[name="plan"]:checked')].map(
        (el) => el.value,
      );
      localStorage.setItem(PLAN_KEY, JSON.stringify(state.plans));
      const result = eligibilityResult(state.plans);
      const msg = $("#elig-msg");
      msg.textContent = result.eligible ? t.eligibilityYes : t.eligibilityNo;
      msg.className = result.eligible ? "ok" : "muted";
    });

    document.querySelectorAll("[data-copy-task]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-copy-task");
        const text = document.getElementById(id)?.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = t.copied;
        } catch {
          window.prompt(t.copyTask, text);
        }
      });
    });
  };

  render(state);
  bind();
}

boot();
