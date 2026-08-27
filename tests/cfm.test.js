const test = require("node:test");
const assert = require("node:assert/strict");
const calc = require("../js/cfm.js");

test("1 ping converts to 3.305785 m²", () => {
  assert.equal(calc.areaM2FromPing(1), 3.305785);
});

test("volume from ping uses Taiwan ping and height", () => {
  assert.equal(calc.volumeFromPing(8, 2.7), 8 * 3.305785 * 2.7);
});

test("volume from box dimensions", () => {
  assert.equal(calc.round(calc.volumeFromDimensions(4, 3, 2.7), 1), 32.4);
});

test("8 ping living room uses ACH airflow over occupancy", () => {
  const result = calc.calculate({
    mode: "ping",
    ping: 8,
    heightM: 2.7,
    roomTypeId: "living",
    people: 4,
    margin: 0.2,
  });

  assert.equal(result.ok, true);
  assert.equal(result.driver, "ach");
  assert.equal(result.ach, 5);

  const volume = 8 * 3.305785 * 2.7;
  const requiredCmh = volume * 5;
  assert.equal(result.volumeM3, calc.round(volume, 2));
  assert.equal(result.requiredCmh, calc.round(requiredCmh, 1));
  assert.equal(result.requiredCfm, calc.round(requiredCmh * calc.CMH_TO_CFM, 1));
  assert.equal(result.designCfm, calc.round(requiredCmh * 1.2 * calc.CMH_TO_CFM, 1));
  assert.equal(result.requiredCmm, calc.round(requiredCmh / 60, 3));
});

test("high occupancy switches driver to people", () => {
  const result = calc.calculate({
    mode: "ping",
    ping: 4,
    heightM: 2.7,
    roomTypeId: "bedroom",
    people: 20,
    cmhPerPerson: 25,
    margin: 0.2,
  });

  assert.equal(result.ok, true);
  assert.equal(result.driver, "people");
  assert.equal(result.byPeopleCmh, 500);
  assert.equal(result.requiredCmh, 500);
});

test("box mode 4×3×2.7 kitchen at ACH 12", () => {
  const result = calc.calculate({
    mode: "box",
    lengthM: 4,
    widthM: 3,
    heightM: 2.7,
    roomTypeId: "kitchen",
    people: 1,
    margin: 0.2,
  });

  const requiredCmh = 32.4 * 12;
  assert.equal(result.ok, true);
  assert.equal(result.ach, 12);
  assert.equal(result.requiredCmh, calc.round(requiredCmh, 1));
  assert.equal(result.designCmh, calc.round(requiredCmh * 1.2, 1));
});

test("rejects non-positive dimensions", () => {
  const result = calc.calculate({
    mode: "ping",
    ping: 0,
    heightM: 2.7,
    roomTypeId: "living",
    people: 1,
  });
  assert.equal(result.ok, false);
});

test("CMH to CFM factor is 35.314666721 / 60", () => {
  assert.equal(calc.CMH_TO_CFM, 35.314666721 / 60);
  const cmh = 100;
  const cfm = cmh * calc.CMH_TO_CFM;
  assert.ok(Math.abs(cfm - 58.8578) < 0.001);
});

test("700×500×400 mm grow box needs about 3 CMF with margin", () => {
  const result = calc.calculate({
    mode: "mm",
    lengthM: 700,
    widthM: 500,
    heightM: 400,
    roomTypeId: "growbox",
    people: 0,
    margin: 0.2,
  });

  assert.equal(result.ok, true);
  assert.equal(result.occupancyApplies, false);
  assert.equal(result.volumeM3, 0.14);
  assert.equal(result.volumeL, 140);
  assert.equal(result.ach, 30);
  const requiredCmh = 0.14 * 30;
  assert.equal(result.requiredCmh, calc.round(requiredCmh, 2));
  assert.equal(result.requiredCfm, calc.round(requiredCmh * calc.CMH_TO_CFM, 2));
  assert.equal(result.designCfm, calc.round(requiredCmh * 1.2 * calc.CMH_TO_CFM, 2));
});

test("sub-1 m³ enclosure ignores occupancy", () => {
  const result = calc.calculate({
    mode: "mm",
    lengthM: 700,
    widthM: 500,
    heightM: 400,
    roomTypeId: "growbox",
    people: 4,
    margin: 0.2,
  });
  assert.equal(result.occupancyApplies, false);
  assert.equal(result.driver, "ach");
  assert.equal(result.byPeopleCmh, 0);
});

test("mm unit converts to metres", () => {
  const mm = calc.calculate({
    mode: "mm",
    lengthM: 700,
    widthM: 500,
    heightM: 400,
    roomTypeId: "enclosure",
    people: 0,
  });
  const metres = calc.calculate({
    mode: "box",
    unit: "m",
    lengthM: 0.7,
    widthM: 0.5,
    heightM: 0.4,
    roomTypeId: "enclosure",
    people: 0,
  });
  assert.equal(mm.ok, true);
  assert.equal(mm.volumeM3, metres.volumeM3);
  assert.equal(mm.designCfm, metres.designCfm);
});

test("quick reference includes the 700 mm grow box and living 8 ping", () => {
  const box = calc.QUICK_REFERENCE.find((item) => item.name === "700×400×500 mm 植物箱");
  const living = calc.QUICK_REFERENCE.find((item) => item.name === "客廳 8 坪");
  assert.ok(box);
  assert.equal(box.ach, 30);
  assert.ok(box.designCfm > box.requiredCfm);
  assert.ok(living);
  assert.equal(living.ach, 5);
});

test("35 mm duct at 15 m/s is 30.6 CMF", () => {
  const result = calc.dustCollectorFlow({
    diameterMm: 35,
    velocityMs: 15,
    mode: "mm",
    lengthM: 700,
    widthM: 400,
    heightM: 500,
  });

  const areaM2 = (Math.PI * 0.035 * 0.035) / 4;
  const cmh = 15 * areaM2 * 3600;
  assert.equal(result.ok, true);
  assert.equal(result.areaCm2, 9.62);
  assert.equal(result.requiredCmh, calc.round(cmh, 1));
  assert.equal(result.requiredCfm, calc.round(cmh * calc.CMH_TO_CFM, 1));
  assert.equal(result.volumeM3, 0.14);
  assert.equal(result.exchangeSeconds, calc.round(0.14 / (15 * areaM2), 2));
});

test("50 mm duct at 15 m/s is 62.4 CMF", () => {
  const result = calc.dustCollectorFlow({
    diameterMm: 50,
    velocityMs: 15,
    mode: "mm",
    lengthM: 700,
    widthM: 400,
    heightM: 500,
  });

  const areaM2 = (Math.PI * 0.05 * 0.05) / 4;
  const cmh = 15 * areaM2 * 3600;
  assert.equal(result.ok, true);
  assert.equal(result.areaCm2, 19.63);
  assert.equal(result.requiredCmh, calc.round(cmh, 1));
  assert.equal(result.requiredCfm, calc.round(cmh * calc.CMH_TO_CFM, 1));
  assert.equal(result.volumeM3, 0.14);
  assert.equal(result.volumeL, 140);
  assert.ok(result.enclosureAch > 700);
  assert.equal(result.exchangeSeconds, calc.round(0.14 / (15 * areaM2), 2));
});

test("dust collector rejects non-positive duct inputs", () => {
  const result = calc.dustCollectorFlow({
    diameterMm: 0,
    velocityMs: 15,
  });
  assert.equal(result.ok, false);
});
