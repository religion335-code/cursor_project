(function () {
  "use strict";

  var calc = window.CfmCalc;
  var form = document.getElementById("cfm-form");
  var modeInputs = form.querySelectorAll('input[name="mode"]');
  var pingFields = document.getElementById("ping-fields");
  var boxFields = document.getElementById("box-fields");
  var roomTypeSelect = document.getElementById("roomTypeId");
  var achInput = document.getElementById("ach");
  var achHint = document.getElementById("ach-hint");
  var results = document.getElementById("results");
  var errorBox = document.getElementById("error");
  var tableBody = document.getElementById("quick-ref-body");
  var lastMode = "mm";

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

  function setNumber(id, value, digits) {
    var n = Number(value);
    document.getElementById(id).value = String(
      calc.round(n, digits == null ? 3 : digits)
    );
  }

  function applyDimensionUnit(mode) {
    var isMm = mode === "mm";
    var unit = isMm ? "mm" : "m";
    document.getElementById("length-label").textContent = "長度（" + unit + "）";
    document.getElementById("width-label").textContent = "寬度（" + unit + "）";
    document.getElementById("height-label").textContent = "高度（" + unit + "）";

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

  function numberValue(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var raw = el.value;
    if (raw === "" || raw == null) return NaN;
    return Number(raw);
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function render() {
    var mode = currentMode();
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
    };

    var result = calc.calculate(input);
    if (!result.ok) {
      results.hidden = true;
      errorBox.hidden = false;
      errorBox.textContent = result.error;
      return;
    }

    errorBox.hidden = true;
    results.hidden = false;

    setText("out-design-cfm", result.designCfm.toLocaleString("zh-TW"));
    setText("out-required-cfm", result.requiredCfm.toLocaleString("zh-TW"));
    setText("out-design-cmh", result.designCmh.toLocaleString("zh-TW"));
    setText("out-required-cmh", result.requiredCmh.toLocaleString("zh-TW"));
    setText("out-design-cmm", result.designCmm.toLocaleString("zh-TW"));
    setText("out-ping", result.ping.toLocaleString("zh-TW"));
    setText("out-area", result.areaM2.toLocaleString("zh-TW"));
    setText("out-volume", result.volumeM3.toLocaleString("zh-TW"));
    setText("out-volume-l", result.volumeL.toLocaleString("zh-TW"));
    setText("out-ach", String(result.ach));
    setText("out-by-ach", result.byAchCmh.toLocaleString("zh-TW") + " CMH");
    setText(
      "out-by-people",
      result.occupancyApplies
        ? result.byPeopleCmh.toLocaleString("zh-TW") + " CMH"
        : "箱體小於 1 m³，不計人數"
    );
    setText(
      "out-driver",
      result.driver === "people"
        ? "由人數新鮮空氣量決定"
        : "由空間換氣次數決定"
    );
    setText("out-room", result.room.name);
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
  syncAchFromRoom(true);
  fillQuickReference();
  applyDimensionUnit("mm");
  toggleMode();

  modeInputs.forEach(function (input) {
    input.addEventListener("change", toggleMode);
  });
  roomTypeSelect.addEventListener("change", function () {
    syncAchFromRoom(true);
    render();
  });
  form.addEventListener("input", render);
  form.addEventListener("change", render);
})();
