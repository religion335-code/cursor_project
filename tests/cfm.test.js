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
  assert.equal(result.requiredCmm, calc.round(requiredCmh / 60, 2));
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

test("quick reference includes living 8 ping", () => {
  const row = calc.QUICK_REFERENCE.find((item) => item.name === "客廳 8 坪");
  assert.ok(row);
  assert.equal(row.ach, 5);
  assert.ok(row.designCfm > row.requiredCfm);
});
