/**
 * Official Grok Bot download catalog and platform detection.
 * Direct installer binaries are not hosted here — every CTA opens an
 * official xAI / Apple / Google listing.
 */

export const OFFICIAL = {
  desktopHub: "https://x.ai/bot",
  getStarted: "https://docs.x.ai/grok-bot/get-started",
  faq: "https://docs.x.ai/grok-bot/faq",
  intro: "https://x.ai/news/introducing-grok-bot",
  ios: "https://apps.apple.com/app/grok-bot/id6794501026",
  android: "https://play.google.com/store/apps/details?id=ai.x.grok.bot",
  cursorPricing: "https://cursor.com/pricing",
  cursorPrivacy: "https://cursor.com/privacy",
};

export const ELIGIBLE_PLANS = [
  { id: "sg-plus", group: "grok", name: "SuperGrok Plus" },
  { id: "sg-heavy", group: "grok", name: "SuperGrok Heavy" },
  { id: "cur-proplus", group: "cursor", name: "Cursor Pro+" },
  { id: "cur-ultra", group: "cursor", name: "Cursor Ultra" },
  { id: "cur-teams-std", group: "cursor", name: "Cursor Teams Standard" },
  { id: "cur-teams-prem", group: "cursor", name: "Cursor Teams Premium" },
];

export const PLATFORMS = [
  {
    id: "macos-apple",
    family: "macos",
    store: "desktop",
    href: OFFICIAL.desktopHub,
    needs: "macOS · Apple silicon",
  },
  {
    id: "macos-intel",
    family: "macos",
    store: "desktop",
    href: OFFICIAL.desktopHub,
    needs: "macOS · Intel",
  },
  {
    id: "windows-x64",
    family: "windows",
    store: "desktop",
    href: OFFICIAL.desktopHub,
    needs: "Windows · x64",
  },
  {
    id: "windows-arm64",
    family: "windows",
    store: "desktop",
    href: OFFICIAL.desktopHub,
    needs: "Windows · Arm64",
  },
  {
    id: "linux-x64",
    family: "linux",
    store: "desktop",
    href: OFFICIAL.desktopHub,
    needs: "Linux · x64 · .deb / .rpm / AppImage",
  },
  {
    id: "linux-arm64",
    family: "linux",
    store: "desktop",
    href: OFFICIAL.desktopHub,
    needs: "Linux · Arm64 · .deb / .rpm / AppImage",
  },
  {
    id: "ios",
    family: "ios",
    store: "ios",
    href: OFFICIAL.ios,
    needs: "iPhone · iOS 18+",
  },
  {
    id: "android",
    family: "android",
    store: "android",
    href: OFFICIAL.android,
    needs: "Android 9+",
  },
];

export const UNSUPPORTED = {
  ipad: {
    id: "ipad",
    reason: "ipad",
    fallbackId: "ios",
  },
};

export function getPlatform(id) {
  return PLATFORMS.find((p) => p.id === id) ?? null;
}

/**
 * @param {string} ua
 * @param {{ platform?: string, architecture?: string, userAgentDataArch?: string }} [hints]
 * @returns {{ id: string | null, family: string, confidence: 'high' | 'medium' | 'low', note?: string }}
 */
export function detectPlatform(ua = "", hints = {}) {
  const u = String(ua).toLowerCase();
  const plat = String(hints.platform || "").toLowerCase();
  const archRaw = String(
    hints.userAgentDataArch || hints.architecture || "",
  ).toLowerCase();
  const isArm = /arm64|aarch64|armv8|\barm\b/.test(`${u} ${archRaw} ${plat}`);
  // Do not treat the legacy "Intel Mac OS X" UA token as a real chip
  // signal — Apple silicon still sends it for compatibility.
  const isIntelHint = /x86_64|amd64|win64|wow64/.test(`${u} ${archRaw}`) ||
    archRaw === "x86" ||
    archRaw === "x64";

  if (/ipad/.test(u) || plat === "ipad") {
    return {
      id: null,
      family: "ipad",
      confidence: "high",
      note: "ipad-unsupported",
    };
  }

  if (/iphone|ipod/.test(u) || plat === "iphone") {
    return { id: "ios", family: "ios", confidence: "high" };
  }

  if (/android/.test(u)) {
    return { id: "android", family: "android", confidence: "high" };
  }

  const isMac =
    /mac os x|macintosh|macintel|macarm/.test(u) ||
    plat === "macos" ||
    plat === "macintel" ||
    plat === "macarm";
  if (isMac) {
    if (isArm || plat === "macarm") {
      return { id: "macos-apple", family: "macos", confidence: "high" };
    }
    if (isIntelHint) {
      return { id: "macos-intel", family: "macos", confidence: "high" };
    }
    return {
      id: "macos-apple",
      family: "macos",
      confidence: "medium",
      note: "macos-arch-unknown",
    };
  }

  const isWin = /windows/.test(u) || plat === "win32" || plat === "windows";
  if (isWin) {
    if (isArm) {
      return { id: "windows-arm64", family: "windows", confidence: "high" };
    }
    return {
      id: "windows-x64",
      family: "windows",
      confidence: isIntelHint ? "high" : "medium",
    };
  }

  const isLinux =
    (/linux/.test(u) && !/android/.test(u)) ||
    plat === "linux" ||
    plat.startsWith("linux");
  if (isLinux) {
    if (isArm) {
      return { id: "linux-arm64", family: "linux", confidence: "high" };
    }
    return { id: "linux-x64", family: "linux", confidence: "medium" };
  }

  return { id: null, family: "unknown", confidence: "low", note: "unknown" };
}

export function eligibilityResult(selectedPlanIds) {
  const ids = new Set(selectedPlanIds || []);
  const matched = ELIGIBLE_PLANS.filter((p) => ids.has(p.id));
  return {
    eligible: matched.length > 0,
    matched,
  };
}
