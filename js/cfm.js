(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CfmCalc = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /** 1 台灣坪 = 3.305785 m² */
  var PING_TO_M2 = 3.305785;
  /** 1 m³ = 35.314666721 ft³ */
  var M3_TO_FT3 = 35.314666721;
  /** CMH (m³/h) → CFM (ft³/min) = 35.314666721 / 60 */
  var CMH_TO_CFM = M3_TO_FT3 / 60;
  var CFM_TO_CMH = 60 / M3_TO_FT3;
  var DEFAULT_HEIGHT_M = 2.7;
  var DEFAULT_CMH_PER_PERSON = 25;
  var DEFAULT_MARGIN = 0.2;

  var ROOM_TYPES = [
    { id: "growbox", name: "植物箱／種植箱", ach: 30, achMin: 20, achMax: 60 },
    { id: "enclosure", name: "小型密閉箱／機櫃", ach: 15, achMin: 8, achMax: 30 },
    { id: "living", name: "客廳／起居室", ach: 5, achMin: 4, achMax: 6 },
    { id: "bedroom", name: "臥室", ach: 5, achMin: 4, achMax: 6 },
    { id: "kitchen", name: "廚房（住宅）", ach: 12, achMin: 8, achMax: 15 },
    { id: "bath", name: "衛浴", ach: 8, achMin: 8, achMax: 12 },
    { id: "office", name: "辦公室", ach: 6, achMin: 4, achMax: 8 },
    { id: "meeting", name: "會議室", ach: 8, achMin: 6, achMax: 12 },
    { id: "dining", name: "餐廳", ach: 10, achMin: 8, achMax: 12 },
    { id: "gym", name: "健身房", ach: 12, achMin: 10, achMax: 15 },
    { id: "server", name: "機房", ach: 20, achMin: 15, achMax: 30 },
    { id: "garage", name: "車庫", ach: 6, achMin: 4, achMax: 8 },
    { id: "warehouse", name: "倉庫", ach: 2, achMin: 1, achMax: 3 },
    { id: "custom", name: "自訂換氣次數", ach: 6, achMin: 0.35, achMax: 60 },
  ];

  function round(value, digits) {
    var factor = Math.pow(10, digits == null ? 1 : digits);
    return Math.round(value * factor) / factor;
  }

  function getRoomType(id) {
    for (var i = 0; i < ROOM_TYPES.length; i++) {
      if (ROOM_TYPES[i].id === id) return ROOM_TYPES[i];
    }
    return ROOM_TYPES[0];
  }

  function areaM2FromPing(ping) {
    return Number(ping) * PING_TO_M2;
  }

  function toMeters(value, unit) {
    var n = Number(value);
    return unit === "mm" ? n / 1000 : n;
  }

  function volumeFromDimensions(lengthM, widthM, heightM) {
    return Number(lengthM) * Number(widthM) * Number(heightM);
  }

  function roundAirflow(value) {
    return round(value, Math.abs(value) < 10 ? 2 : 1);
  }

  function roundVolume(value) {
    return round(value, value < 1 ? 3 : 2);
  }

  function volumeFromPing(ping, heightM) {
    return areaM2FromPing(ping) * Number(heightM);
  }

  /**
   * Required airflow for a space.
   *
   * Ventilation is the larger of:
   *   - volume × ACH  (air-change method)
   *   - people × 25 CMH/person (occupancy method)
   *
   * Design airflow adds a duct/filter margin (default 20%).
   */
  function calculate(input) {
    var mode = input.mode || "ping";
    var unit = mode === "mm" ? "mm" : input.unit || "m";
    if (mode === "ping") unit = "m";
    var heightM = toMeters(input.heightM, unit);
    var people = Number(input.people);
    var margin = input.margin == null ? DEFAULT_MARGIN : Number(input.margin);
    var cmhPerPerson =
      input.cmhPerPerson == null
        ? DEFAULT_CMH_PER_PERSON
        : Number(input.cmhPerPerson);
    var room = getRoomType(input.roomTypeId);
    var ach =
      input.ach == null || input.ach === "" ? room.ach : Number(input.ach);

    var areaM2;
    var volumeM3;

    if (mode === "box" || mode === "mm") {
      var lengthM = toMeters(input.lengthM, unit);
      var widthM = toMeters(input.widthM, unit);
      areaM2 = lengthM * widthM;
      volumeM3 = volumeFromDimensions(lengthM, widthM, heightM);
    } else {
      areaM2 = areaM2FromPing(input.ping);
      volumeM3 = volumeFromPing(input.ping, heightM);
    }

    if (
      !isFinite(areaM2) ||
      !isFinite(volumeM3) ||
      !isFinite(ach) ||
      areaM2 <= 0 ||
      volumeM3 <= 0 ||
      ach <= 0
    ) {
      return { ok: false, error: "請輸入大於 0 的空間尺寸與換氣次數。" };
    }

    if (!isFinite(people) || people < 0) people = 0;
    if (!isFinite(margin) || margin < 0) margin = DEFAULT_MARGIN;
    if (!isFinite(cmhPerPerson) || cmhPerPerson < 0) {
      cmhPerPerson = DEFAULT_CMH_PER_PERSON;
    }

    var occupancyApplies = volumeM3 >= 1;
    var byAchCmh = volumeM3 * ach;
    var byPeopleCmh = occupancyApplies ? people * cmhPerPerson : 0;
    var requiredCmh = Math.max(byAchCmh, byPeopleCmh);
    var driver = occupancyApplies && byPeopleCmh > byAchCmh ? "people" : "ach";
    var designCmh = requiredCmh * (1 + margin);
    var ping = areaM2 / PING_TO_M2;

    return {
      ok: true,
      room: room,
      ach: ach,
      people: people,
      cmhPerPerson: cmhPerPerson,
      margin: margin,
      driver: driver,
      occupancyApplies: occupancyApplies,
      ping: round(ping, volumeM3 < 1 ? 3 : 2),
      areaM2: round(areaM2, volumeM3 < 1 ? 3 : 2),
      heightM: round(heightM, 3),
      volumeM3: roundVolume(volumeM3),
      volumeL: round(volumeM3 * 1000, 1),
      volumeFt3: round(volumeM3 * M3_TO_FT3, volumeM3 < 1 ? 2 : 1),
      byAchCmh: roundAirflow(byAchCmh),
      byPeopleCmh: roundAirflow(byPeopleCmh),
      requiredCmh: roundAirflow(requiredCmh),
      requiredCmm: round(requiredCmh / 60, 3),
      requiredCfm: roundAirflow(requiredCmh * CMH_TO_CFM),
      designCmh: roundAirflow(designCmh),
      designCmm: round(designCmh / 60, 3),
      designCfm: roundAirflow(designCmh * CMH_TO_CFM),
    };
  }

  var QUICK_REFERENCE = [
    {
      name: "700×500×400 mm 植物箱",
      mode: "mm",
      unit: "mm",
      lengthM: 700,
      widthM: 500,
      heightM: 400,
      roomTypeId: "growbox",
      people: 0,
    },
    { name: "臥室 4 坪", ping: 4, heightM: 2.7, roomTypeId: "bedroom", people: 2 },
    { name: "臥室 6 坪", ping: 6, heightM: 2.7, roomTypeId: "bedroom", people: 2 },
    { name: "客廳 8 坪", ping: 8, heightM: 2.7, roomTypeId: "living", people: 4 },
    { name: "客廳 12 坪", ping: 12, heightM: 2.7, roomTypeId: "living", people: 6 },
    { name: "廚房 3 坪", ping: 3, heightM: 2.7, roomTypeId: "kitchen", people: 1 },
    { name: "衛浴 2 坪", ping: 2, heightM: 2.4, roomTypeId: "bath", people: 1 },
    { name: "辦公室 10 坪", ping: 10, heightM: 2.7, roomTypeId: "office", people: 6 },
    { name: "會議室 15 坪", ping: 15, heightM: 2.7, roomTypeId: "meeting", people: 10 },
  ].map(function (row) {
    var result = calculate(row);
    return {
      name: row.name,
      ping: row.ping,
      ach: result.ach,
      requiredCfm: result.requiredCfm,
      designCfm: result.designCfm,
      requiredCmh: result.requiredCmh,
      designCmh: result.designCmh,
    };
  });

  return {
    PING_TO_M2: PING_TO_M2,
    M3_TO_FT3: M3_TO_FT3,
    CMH_TO_CFM: CMH_TO_CFM,
    CFM_TO_CMH: CFM_TO_CMH,
    DEFAULT_HEIGHT_M: DEFAULT_HEIGHT_M,
    DEFAULT_CMH_PER_PERSON: DEFAULT_CMH_PER_PERSON,
    DEFAULT_MARGIN: DEFAULT_MARGIN,
    ROOM_TYPES: ROOM_TYPES,
    QUICK_REFERENCE: QUICK_REFERENCE,
    getRoomType: getRoomType,
    areaM2FromPing: areaM2FromPing,
    volumeFromDimensions: volumeFromDimensions,
    volumeFromPing: volumeFromPing,
    calculate: calculate,
    round: round,
  };
});
