import test from "node:test";
import assert from "node:assert/strict";
import {
  ELIGIBLE_PLANS,
  OFFICIAL,
  PLATFORMS,
  detectPlatform,
  eligibilityResult,
  getPlatform,
} from "../js/platforms.js";

test("every platform CTA is an official https URL", () => {
  for (const platform of PLATFORMS) {
    assert.match(platform.href, /^https:\/\//);
    assert.ok(
      platform.href.includes("x.ai") ||
        platform.href.includes("apps.apple.com") ||
        platform.href.includes("play.google.com"),
    );
  }
});

test("desktop and docs stay on x.ai official hosts", () => {
  assert.equal(OFFICIAL.desktopHub, "https://x.ai/bot");
  assert.equal(OFFICIAL.getStarted, "https://docs.x.ai/grok-bot/get-started");
  assert.equal(OFFICIAL.ios, "https://apps.apple.com/app/grok-bot/id6794501026");
  assert.equal(
    OFFICIAL.android,
    "https://play.google.com/store/apps/details?id=ai.x.grok.bot",
  );
});

test("detects iPhone, Android, and unsupported iPad", () => {
  assert.deepEqual(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), {
    id: "ios",
    family: "ios",
    confidence: "high",
  });
  assert.equal(detectPlatform("Mozilla/5.0 (Linux; Android 14)").id, "android");
  const ipad = detectPlatform("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)");
  assert.equal(ipad.family, "ipad");
  assert.equal(ipad.id, null);
  assert.equal(ipad.note, "ipad-unsupported");
});

test("detects macOS architecture from hints", () => {
  const apple = detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", {
    platform: "MacARM",
    userAgentDataArch: "arm",
  });
  assert.equal(apple.id, "macos-apple");

  const intel = detectPlatform(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    { architecture: "x86_64" },
  );
  assert.equal(intel.id, "macos-intel");

  const fallback = detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
  assert.equal(fallback.id, "macos-apple");
  assert.equal(fallback.note, "macos-arch-unknown");
});

test("detects Windows and Linux variants", () => {
  assert.equal(
    detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)").id,
    "windows-x64",
  );
  assert.equal(
    detectPlatform("Mozilla/5.0 (Windows NT 10.0; ARM64)").id,
    "windows-arm64",
  );
  assert.equal(
    detectPlatform("Mozilla/5.0 (X11; Linux x86_64)").id,
    "linux-x64",
  );
  assert.equal(
    detectPlatform("Mozilla/5.0 (X11; Linux aarch64)").id,
    "linux-arm64",
  );
});

test("eligibility matches official plan ids only", () => {
  assert.equal(eligibilityResult([]).eligible, false);
  assert.equal(eligibilityResult(["hobby"]).eligible, false);
  assert.equal(eligibilityResult(["cur-ultra"]).eligible, true);
  assert.equal(ELIGIBLE_PLANS.length, 6);
  assert.equal(getPlatform("ios")?.store, "ios");
});
