(function () {
  "use strict";

  var calc = window.CfmCalc;
  var form = document.getElementById("cfm-form");
  var modeInputs = form.querySelectorAll('input[name="mode"]');
  var methodInputs = form.querySelectorAll('input[name="method"]');
  var pingFields = document.getElementById("ping-fields");
  var boxFields = document.getElementById("box-fields");
  var ductFields = document.getElementById("duct-fields");
  var boothFields = document.getElementById("booth-fields");
  var achFields = document.getElementById("ach-fields");
  var velocityField = document.getElementById("velocity-field");
  var roomTypeSelect = document.getElementById("roomTypeId");
  var achInput = document.getElementById("ach");
  var achHint = document.getElementById("ach-hint");
  var results = document.getElementById("results");
  var errorBox = document.getElementById("error");
  var ductWarning = document.getElementById("duct-warning");
  var tableBody = document.getElementById("quick-ref-body");
  var facePresetSelect = document.getElementById("facePresetId");
  var lastMode = "mm";
  var lastMethod = "booth";

  function fillRoomTypes() {
    roomTypeSelect.innerHTML = calc.ROOM_TYPES.map(function (room) {
      return (
        '<option value="' +
        room.id +
        '">' +
        room.name +
        "（" +
        room.achMin +
        "–" +
        room.achMax +
        " 次/時）</option>"
      );
    }).join("");
    roomTypeSelect.value = "growbox";
  }

  function fillFacePresets() {
    facePresetSelect.innerHTML = calc.FACE_VELOCITY_PRESETS.map(function (preset) {
      return (
        '<option value="' +
        preset.id +
        '">' +
        preset.name +
        " · " +
        preset.velocityMs +
        " m/s</option>"
      );
    }).join("");
    facePresetSelect.value = "hse";
  }

  function syncFacePreset(force) {
    var preset = calc.getFacePreset(facePresetSelect.value);
    document.getElementById("face-hint").textContent =
      preset.fpm + " fpm。葡萄糖 <200 μm 建議至少 HSE 1.0 m/s，微粉可拉到 1.27 m/s。";
    if (force) {
      document.getElementById("faceVelocityMs").value = String(preset.velocityMs);
    }
  }

  function syncAchFromRoom(force) {
    var room = calc.getRoomType(roomTypeSelect.value);
    achHint.textContent =
      "建議 " + room.achMin + "–" + room.achMax + " 次／小時，預設 " + room.ach + "。";
    if (force || roomTypeSelect.value !== "custom") {
      achInput.value = String(room.ach);
    }
  }

  function currentMode() {
    var checked = form.querySelector('input[name="mode"]:checked');
    return checked ? checked.value : "mm";
  }

  function currentMethod() {
    var checked = form.querySelector('input[name="method"]:checked');
    return checked ? checked.value : "booth";
  }

  function setNumber(id, value, digits) {
    var n = Number(value);
    document.getElementById(id).value = String(
      calc.round(n, digits == null ? 3 : digits)
    );
  }

  function applyDimensionUnit(mode) {
    var isMm = mode === "mm";
    var unit = isMm ? "mm" : "m";
    var booth = currentMethod() === "booth";
    document.getElementById("length-label").textContent = booth
      ? "開口寬（" + unit + "）"
      : "長度（" + unit + "）";
    document.getElementById("width-label").textContent = booth
      ? "進深（" + unit + "）"
      : "寬度（" + unit + "）";
    document.getElementById("height-label").textContent = booth
      ? "開口高（" + unit + "）"
      : "高度（" + unit + "）";

    ["lengthM", "widthM", "heightM"].forEach(function (id) {
      var input = document.getElementById(id);
      input.min = isMm ? "1" : "0.01";
      input.step = isMm ? "1" : "0.01";
    });
  }

  function convertBoxValues(fromMode, toMode) {
    if (fromMode === toMode) return;
    if (fromMode === "ping" || toMode === "ping") return;
    if (fromMode === "mm" && toMode === "box") {
      setNumber("lengthM", numberValue("lengthM") / 1000, 3);
      setNumber("widthM", numberValue("widthM") / 1000, 3);
      setNumber("heightM", numberValue("heightM") / 1000, 3);
    } else if (fromMode === "box" && toMode === "mm") {
      setNumber("lengthM", numberValue("lengthM") * 1000, 0);
      setNumber("widthM", numberValue("widthM") * 1000, 0);
      setNumber("heightM", numberValue("heightM") * 1000, 0);
    }
  }

  function toggleMode() {
    var mode = currentMode();
    pingFields.hidden = mode !== "ping";
    boxFields.hidden = mode === "ping";
    convertBoxValues(lastMode, mode);
    applyDimensionUnit(mode);
    if (mode === "ping" && (lastMode === "mm" || lastMode === "box")) {
      roomTypeSelect.value = "living";
      document.getElementById("people").value = "4";
      syncAchFromRoom(true);
    } else if (mode !== "ping" && lastMode === "ping") {
      roomTypeSelect.value = "growbox";
      document.getElementById("people").value = "0";
      syncAchFromRoom(true);
    }
    lastMode = mode;
    render();
  }

  function toggleMethod() {
    var method = currentMethod();
    ductFields.hidden = method === "ach";
    velocityField.hidden = method !== "duct";
    boothFields.hidden = method !== "booth";
    achFields.hidden = method !== "ach";
    applyDimensionUnit(currentMode());
    if (method === "duct") {
      document.getElementById("margin").value = "0";
    } else if (method === "booth" || method === "ach") {
      document.getElementById("margin").value = "20";
    }
    lastMethod = method;
    render();
  }

  function numberValue(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var raw = el.value;
    if (raw === "" || raw == null) return NaN;
    return Number(raw);
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function render() {
    var mode = currentMode();
    var method = currentMethod();
    var input = {
      mode: mode,
      unit: mode === "mm" ? "mm" : "m",
      ping: numberValue("ping"),
      lengthM: numberValue("lengthM"),
      widthM: numberValue("widthM"),
      heightM: mode === "ping" ? numberValue("pingHeight") : numberValue("heightM"),
      roomTypeId: roomTypeSelect.value,
      ach: numberValue("ach"),
      people: numberValue("people"),
      margin: numberValue("margin") / 100,
      diameterMm: numberValue("diameterMm"),
      velocityMs: numberValue("velocityMs"),
      facePresetId: facePresetSelect.value,
      faceVelocityMs: numberValue("faceVelocityMs"),
      transportMs: numberValue("transportMs"),
    };

    var result;
    if (method === "booth") result = calc.tippingStationFlow(input);
    else if (method === "duct") result = calc.dustCollectorFlow(input);
    else result = calc.calculate(input);

    if (!result.ok) {
      results.hidden = true;
      errorBox.hidden = false;
      errorBox.textContent = result.error;
      if (ductWarning) ductWarning.hidden = true;
      return;
    }

    errorBox.hidden = true;
    results.hidden = false;

    setText("out-design-cfm", result.designCfm.toLocaleString("zh-TW"));
    setText("out-design-cmh", result.designCmh.toLocaleString("zh-TW"));
    setText("out-required-cmh", result.requiredCmh.toLocaleString("zh-TW"));
    setText("out-design-cmm", result.designCmm.toLocaleString("zh-TW"));

    if (method === "booth") {
      if (ductWarning) {
        ductWarning.hidden = !result.ductTooSmall;
        ductWarning.textContent = result.ductTooSmall
          ? "現有 Ø" +
            numberValue("diameterMm") +
            " mm 管在 " +
            result.transportMs +
            " m/s 只能送 " +
            result.currentDuctCfm.toLocaleString("zh-TW") +
            " CMF，低於需求 " +
            result.requiredCfm.toLocaleString("zh-TW") +
            " CMF。輸送風管請改約 Ø" +
            result.requiredDuctMm +
            " mm。"
          : "";
      }
      setText("out-hero-label", "投料站建議選型風量");
      setText(
        "out-hero-sub",
        "開口面風速 " +
          result.faceVelocityMs +
          " m/s · 最低需求 " +
          result.requiredCfm.toLocaleString("zh-TW") +
          " CMF"
      );
      setText(
        "out-area-line",
        result.faceAreaM2.toLocaleString("zh-TW") + " m²（開口）"
      );
      setText("out-volume", "—");
      setText("out-volume-l", "—");
      setText("out-ach", String(result.faceVelocityFpm) + " fpm");
      setText("out-duct-area", "建議風管 Ø" + result.requiredDuctMm + " mm");
      setText("out-room", result.preset.name);
      setText("out-by-ach", result.requiredCmh.toLocaleString("zh-TW") + " CMH");
      setText(
        "out-by-people",
        "25 kg 袋投入產生粉塵雲，靠面風速把塵拉回箱內"
      );
      setText(
        "out-enclosure-ach",
        result.faceVelocityMs + " m/s 向內"
      );
      setText(
        "out-exchange",
        result.ductTooSmall
          ? "現管 " + result.currentDuctCfm + " CMF，不足"
          : "現管足夠"
      );
      setText("out-driver", "由投料開口面積 × 面風速決定（不是管徑 × 15 m/s）");
    } else if (method === "duct") {
      if (ductWarning) ductWarning.hidden = true;
      setText("out-hero-label", "集塵機總風量");
      setText(
        "out-hero-sub",
        result.margin > 0
          ? "計算 " +
              result.requiredCfm.toLocaleString("zh-TW") +
              " CMF，含餘裕選型"
          : "Q = 管截面積 × 吸引風速"
      );
      setText(
        "out-area-line",
        result.areaCm2.toLocaleString("zh-TW") + " cm²（管）"
      );
      setText("out-volume", result.volumeM3 != null ? String(result.volumeM3) : "—");
      setText("out-volume-l", result.volumeL != null ? String(result.volumeL) : "—");
      setText("out-ach", result.enclosureAch != null ? String(result.enclosureAch) : "—");
      setText("out-duct-area", result.areaCm2.toLocaleString("zh-TW") + " cm²");
      setText("out-room", "Ø" + result.diameterMm + " mm · " + result.velocityMs + " m/s");
      setText("out-by-ach", "—");
      setText("out-by-people", "不適用（風管算法）");
      setText(
        "out-enclosure-ach",
        result.enclosureAch != null
          ? result.enclosureAch.toLocaleString("zh-TW") + " 次／時"
          : "—"
      );
      setText(
        "out-exchange",
        result.exchangeSeconds != null ? result.exchangeSeconds + " 秒／次" : "—"
      );
      setText("out-driver", "由風管斷面與吸引風速決定");
    } else {
      if (ductWarning) ductWarning.hidden = true;
      setText("out-hero-label", "建議選型風量（含餘裕）");
      setText(
        "out-hero-sub",
        "最低需求 " + result.requiredCfm.toLocaleString("zh-TW") + " CFM"
      );
      setText(
        "out-area-line",
        result.ping.toLocaleString("zh-TW") +
          " 坪 · " +
          result.areaM2.toLocaleString("zh-TW") +
          " m²"
      );
      setText("out-volume", result.volumeM3.toLocaleString("zh-TW"));
      setText("out-volume-l", result.volumeL.toLocaleString("zh-TW"));
      setText("out-ach", String(result.ach));
      setText("out-duct-area", "—");
      setText("out-room", result.room.name);
      setText("out-by-ach", result.byAchCmh.toLocaleString("zh-TW") + " CMH");
      setText(
        "out-by-people",
        result.occupancyApplies
          ? result.byPeopleCmh.toLocaleString("zh-TW") + " CMH"
          : "箱體小於 1 m³，不計人數"
      );
      setText("out-enclosure-ach", String(result.ach) + " 次／時");
      setText("out-exchange", "—");
      setText(
        "out-driver",
        result.driver === "people"
          ? "由人數新鮮空氣量決定"
          : "由空間換氣次數決定"
      );
    }
  }

  function fillQuickReference() {
    tableBody.innerHTML = calc.QUICK_REFERENCE.map(function (row) {
      return (
        "<tr>" +
        "<th scope='row'>" +
        row.name +
        "</th>" +
        "<td>" +
        row.ach +
        "</td>" +
        "<td>" +
        row.requiredCfm.toLocaleString("zh-TW") +
        "</td>" +
        "<td>" +
        row.designCfm.toLocaleString("zh-TW") +
        "</td>" +
        "<td>" +
        row.requiredCmh.toLocaleString("zh-TW") +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  fillRoomTypes();
  fillFacePresets();
  syncFacePreset(true);
  syncAchFromRoom(true);
  fillQuickReference();
  applyDimensionUnit("mm");
  toggleMethod();
  toggleMode();

  modeInputs.forEach(function (input) {
    input.addEventListener("change", toggleMode);
  });
  methodInputs.forEach(function (input) {
    input.addEventListener("change", toggleMethod);
  });
  facePresetSelect.addEventListener("change", function () {
    syncFacePreset(true);
    render();
  });
  roomTypeSelect.addEventListener("change", function () {
    syncAchFromRoom(true);
    render();
  });
  form.addEventListener("input", render);
  form.addEventListener("change", render);
})();
