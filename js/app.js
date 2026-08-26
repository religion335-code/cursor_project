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
    roomTypeSelect.value = "living";
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
    return checked ? checked.value : "ping";
  }

  function toggleMode() {
    var mode = currentMode();
    pingFields.hidden = mode !== "ping";
    boxFields.hidden = mode !== "box";
    render();
  }

  function numberValue(id) {
    var raw = document.getElementById(id).value;
    if (raw === "" || raw == null) return NaN;
    return Number(raw);
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function render() {
    var input = {
      mode: currentMode(),
      ping: numberValue("ping"),
      lengthM: numberValue("lengthM"),
      widthM: numberValue("widthM"),
      heightM: numberValue("heightM"),
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
    setText("out-ach", String(result.ach));
    setText("out-by-ach", result.byAchCmh.toLocaleString("zh-TW") + " CMH");
    setText(
      "out-by-people",
      result.byPeopleCmh.toLocaleString("zh-TW") + " CMH"
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
