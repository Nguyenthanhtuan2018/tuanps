// javascript/upRatioPanel.js (MIN–MAX + Presets, giữ marker khi đổi rule set)
// Panel tính & hiển thị tỉ lệ (UP) sau khi đã có A..G.
// - Ưu tiên preset từ window.waveProfiles + window.waveActiveProfile.
// - Fallback sang window.waveSettings.{ratioKey: {min,max}} nếu không có preset.
// - KHÔNG còn override/cap rời rạc; tất cả theo min–max.
// - rerender() -> run(true): chỉ re-validate, GIỮ markers A..G đang có.
//
// Quy tắc & dữ liệu:
// - Chỉ tính tỉ lệ khi cả hai đoạn có giá trị & mẫu > 0
// - Chiều UP: B,D,F dùng HIGH; A,C,E,G dùng LOW
// - Lưu kết quả vào window.ratioResults và window.overallResult

(function () {
  // ===== Helpers =====
  const round = (num, digits = 2) => Number.isFinite(num) ? Number(num.toFixed(digits)) : num;

  // Lấy điểm theo nhãn (đúng với biến UP của bạn)
  function getPoint(label) {
    switch (label) {
      case "A": return Array.isArray(window.selectedPointsUP) ? window.selectedPointsUP[0] : null;
      case "B": return Array.isArray(window.selectedPointsUP) ? window.selectedPointsUP[1] : null;
      case "C": return Array.isArray(window.selectedPointsUP) ? window.selectedPointsUP[2] : null;
      case "D": return window.selectedPointD || null;
      case "E": return window.selectedPointE || null;
      case "F": return window.selectedPointF || null;
      case "G": return window.selectedPointG || null;
      default:  return null;
    }
  }

  // Chiều UP: B,D,F = HIGH; A,C,E,G = LOW
  function pointPrice(label, p) {
    if (!p) return null;
    const highs = new Set(["B", "D", "F"]);
    const lows  = new Set(["A", "C", "E", "G"]);
    if (highs.has(label)) return p.high ?? null;
    if (lows.has(label))  return p.low  ?? null;
    return null;
  }

  // Biên độ đoạn tuyệt đối |Y - X|
  function segmentAbs(X, Y) {
    const pX = getPoint(X);
    const pY = getPoint(Y);
    if (!pX || !pY) return null; // thiếu điểm
    const vX = pointPrice(X, pX);
    const vY = pointPrice(Y, pY);
    if (!Number.isFinite(vX) || !Number.isFinite(vY)) return null;
    return Math.abs(vY - vX);
  }

  // Tỉ lệ %: chỉ khi có và mẫu > 0
  function ratioPct(num, den) {
    if (num === null || den === null) return null;
    if (den <= 0) return null;
    return (num / den) * 100;
  }

  // ===== Preset & Min–Max =====
  function getRangeCfg(nameKey) {
    // 1) Ưu tiên profile: waveProfiles + waveActiveProfile
    const active = window.waveActiveProfile || "tiep_dien";
    if (window.waveProfiles && window.waveProfiles[active]) {
      const cfg = window.waveProfiles[active][nameKey] || {};
      const min = (typeof cfg.min === "number" && Number.isFinite(cfg.min)) ? cfg.min : -Infinity;
      const max = (typeof cfg.max === "number" && Number.isFinite(cfg.max)) ? cfg.max : Infinity;
      return { min, max, source: "profile", active };
    }
    // 2) Fallback sang waveSettings.{nameKey:{min,max}}
    const ws = window.waveSettings || {};
    const cfg = ws[nameKey] || {};
    const min = (typeof cfg.min === "number" && Number.isFinite(cfg.min)) ? cfg.min : -Infinity;
    const max = (typeof cfg.max === "number" && Number.isFinite(cfg.max)) ? cfg.max : Infinity;
    return { min, max, source: "settings", active };
  }

  // So sánh theo min–max (kèm reason để debug nhanh)
  function checkMinMax(nameKey, valuePct) {
    if (valuePct === null || !Number.isFinite(valuePct)) {
      return { value: null, pass: null, reason: "–" };
    }
    const { min, max } = getRangeCfg(nameKey);
    if (valuePct < min) return { value: valuePct, pass: false, reason: `value < min(${min})` };
    if (valuePct > max) return { value: valuePct, pass: false, reason: `value > max(${max})` };
    return { value: valuePct, pass: true, reason: "OK" };
  }

  // Hiển thị min–max gọn cho UI
  function formatRange(nameKey) {
    const { min, max } = getRangeCfg(nameKey);
    const minTxt = Number.isFinite(min) && min !== -Infinity ? `≥${min}` : "";
    const maxTxt = Number.isFinite(max) && max !==  Infinity ? `≤${max}` : "";
    return (minTxt && maxTxt) ? `${minTxt} & ${maxTxt}` : (minTxt || maxTxt || "–");
  }

  // ===== UI Table =====
  function ensureContainer() {
    let container = document.getElementById("ratio-table-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "ratio-table-container";
      container.style.padding = "8px";
      (document.body || document.documentElement).appendChild(container);
    }
    return container;
  }

  function renderTable(ratios, compared, overall) {
    const container = ensureContainer();
    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.style.maxWidth = "800px";
    wrap.style.fontFamily = "Inter, system-ui, Arial, sans-serif";

    // Header + overall
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.margin = "8px 0 12px 0";

    const title = document.createElement("div");
    title.style.display = "flex";
    title.style.alignItems = "center";
    title.style.gap = "12px";

    const titleText = document.createElement("span");
    titleText.textContent = "Tỉ lệ & So sánh (UP)";
    titleText.style.fontSize = "16px";
    titleText.style.fontWeight = "600";

    const profileHint = document.createElement("span");
    const active = window.waveActiveProfile || "tiep_dien";
    profileHint.textContent = `Preset: ${active}`;
    profileHint.style.fontSize = "12px";
    profileHint.style.color = "#6b7280";

    title.appendChild(titleText);
    title.appendChild(profileHint);

    const overallBadge = document.createElement("span");
    overallBadge.textContent =
      overall === true
        ? "Kết quả cuối: ĐẠT"
        : overall === false
        ? "Kết quả cuối: KHÔNG ĐẠT"
        : "Kết quả cuối: –";
    overallBadge.style.padding = "4px 8px";
    overallBadge.style.borderRadius = "999px";
    overallBadge.style.fontSize = "12px";
    overallBadge.style.fontWeight = "600";
    overallBadge.style.color = "#fff";
    overallBadge.style.background =
      overall === true ? "#16a34a" : overall === false ? "#dc2626" : "#6b7280";

    header.appendChild(title);
    header.appendChild(overallBadge);

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "13px";

    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    const cols = ["Ratio", "Value (%)", "Min–Max", "Pass"];
    cols.forEach((c, i) => {
      const th = document.createElement("th");
      th.textContent = c;
      th.style.textAlign = i === 0 ? "left" : "center";
      th.style.borderBottom = "1px solid #e5e7eb";
      th.style.padding = "8px";
      th.style.position = "sticky";
      th.style.top = "0";
      th.style.background = "#fafafa";
      th.style.zIndex = "1";
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    const tbody = document.createElement("tbody");

    // [Nhãn hiển thị, ratioKey nội bộ, nameKey trong settings/preset]
    const rows = [
      ["BC/AB", "BCOverAB", "ratioBCOverAB"],
      ["DE/CD", "DEOverCD", "ratioDEOverCD"],
      ["FG/EF", "FGOverEF", "ratioFGOverEF"],
      ["EF/DE", "EFOverDE", "ratioEFOverDE"],
      ["CD/BC", "CDOverBC", "ratioCDOverBC"],
      ["DE/BC", "DEOverBC", "ratioDEOverBC"],
      ["FG/DE", "FGOverDE", "ratioFGOverDE"],
    ];

    function passCell(pass) {
      const span = document.createElement("span");
      if (pass === true) {
        span.textContent = "ĐẠT";
        span.style.color = "#16a34a";
        span.style.fontWeight = "600";
      } else if (pass === false) {
        span.textContent = "KHÔNG ĐẠT";
        span.style.color = "#dc2626";
        span.style.fontWeight = "600";
      } else {
        span.textContent = "–";
        span.style.color = "#6b7280";
      }
      return span;
    }

    rows.forEach(([label, ratioKey, nameKey]) => {
      const tr = document.createElement("tr");

      const tdRatio = document.createElement("td");
      tdRatio.textContent = label;
      tdRatio.style.padding = "8px";
      tdRatio.style.borderBottom = "1px solid #f3f4f6";

      const tdVal = document.createElement("td");
      tdVal.style.textAlign = "center";
      tdVal.style.padding = "8px";
      tdVal.style.borderBottom = "1px solid #f3f4f6";
      const v = ratios[ratioKey];
      tdVal.textContent = (v === null || !Number.isFinite(v)) ? "–" : `${round(v, 2)}%`;

      const tdRange = document.createElement("td");
      tdRange.style.textAlign = "center";
      tdRange.style.padding = "8px";
      tdRange.style.borderBottom = "1px solid #f3f4f6";
      tdRange.textContent = formatRange(nameKey);

      const tdPass = document.createElement("td");
      tdPass.style.textAlign = "center";
      tdPass.style.padding = "8px";
      tdPass.style.borderBottom = "1px solid #f3f4f6";
      tdPass.appendChild(passCell((window.ratioResults?.[ratioKey] ?? {}).pass ?? null));
      tdPass.title = (window.ratioResults?.[ratioKey]?.reason) || "";

      tr.appendChild(tdRatio);
      tr.appendChild(tdVal);
      tr.appendChild(tdRange);
      tr.appendChild(tdPass);
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    wrap.appendChild(header);
    wrap.appendChild(table);
    container.appendChild(wrap);
  }

  // preserveMarkers = true  -> chỉ validate + cập nhật bảng, KHÔNG setMarkers
  // preserveMarkers = false -> validate + vẽ lại markers (dùng khi chọn/chỉnh điểm)
  function run(preserveMarkers = false) {
    // 1) Tính các đoạn tuyệt đối (thiếu điểm -> null)
    const seg = {
      AB: segmentAbs("A", "B"),
      BC: segmentAbs("C", "B"), // BC = |B.high - C.low| theo chiều UP
      CD: segmentAbs("C", "D"),
      DE: segmentAbs("E", "D"),
      EF: segmentAbs("E", "F"),
      FG: segmentAbs("G", "F"),
    };

    // ==== VẼ MARKERS (chỉ khi KHÔNG preserveMarkers) ====
    if (!preserveMarkers) {
      try {
        // Map đoạn/điểm -> [điểm hiển thị, màu, vị trí]
        const segmentDisplayMap = {
          A:  ["A", "#0ea5e9", "belowBar"],   // Low của A (UP)
          AB: ["B", "#2563eb", "aboveBar"],   // tăng
          BC: ["C", "#f59e0b", "belowBar"],   // hồi
          CD: ["D", "#16a34a", "aboveBar"],   // tăng
          DE: ["E", "#dc2626", "belowBar"],   // hồi
          EF: ["F", "#7c3aed", "aboveBar"],   // tăng
          FG: ["G", "#db2777", "belowBar"],   // hồi
        };

        // Lấy markers hiện có, bỏ marker chữ A..G để thay bằng bản có text đoạn
        const getArr = (name) => (Array.isArray(window[name]) ? window[name] : []);
        const baseUp   = getArr("upMarkers").filter(m => !["A","B","C","D","E","F","G"].includes(m.text));
        const baseDown = getArr("downMarkers").filter(m => !["A","B","C","D","E","F","G"].includes(m.text));
        let mergedMarkers = [...baseUp, ...baseDown];

        // Tạo marker mới (chỉ thêm marker đoạn khi có giá trị)
        Object.entries(segmentDisplayMap).forEach(([segKey, [pointLabel, color, position]]) => {
          let val = null;

          if (segKey === "A") {
            const p = getPoint("A");
            if (p && Number.isFinite(p.low)) val = p.low; // A hiển thị Low (UP)
          } else {
            val = seg[segKey];
          }

          if (val === null) return;

          const point = getPoint(pointLabel);
          if (!point || !point.time) return;

          mergedMarkers.push({
            time: point.time,
            position,
            color,
            shape: "arrowUp",
            text: `${pointLabel}\n${segKey}=${round(val, 2)}`
          });
        });

        // Set markers lên series
        const series =
          (typeof window !== "undefined" && window.candleSeries) ||
          (typeof candleSeries !== "undefined" ? candleSeries : null);
        if (series && typeof series.setMarkers === "function") {
          series.setMarkers(mergedMarkers);
        } else {
          console.warn("[upRatioPanel] Không tìm thấy candleSeries để setMarkers");
        }
      } catch (e) {
        console.warn("[upRatioPanel] Cannot set segment markers:", e);
      }
    }
    // ==== Hết phần hiển thị marker ====

    // 2) Tính tỉ lệ (mẫu > 0)
    const rawRatios = {
      BCOverAB: ratioPct(seg.BC, seg.AB),
      DEOverCD: ratioPct(seg.DE, seg.CD),
      FGOverEF: ratioPct(seg.FG, seg.EF),
      EFOverDE: ratioPct(seg.EF, seg.DE),
      CDOverBC: ratioPct(seg.CD, seg.BC),
      DEOverBC: ratioPct(seg.DE, seg.BC),
      FGOverDE: ratioPct(seg.FG, seg.DE),
    };

    // 3) Làm tròn hiển thị
    const ratios = Object.fromEntries(
      Object.entries(rawRatios).map(([k, v]) => [k, v === null ? null : round(v, 2)])
    );

    // 4) So sánh theo Min–Max (không còn override)
    const compared = {
      BCOverAB: checkMinMax("ratioBCOverAB", ratios.BCOverAB),
      DEOverCD: checkMinMax("ratioDEOverCD", ratios.DEOverCD),
      FGOverEF: checkMinMax("ratioFGOverEF", ratios.FGOverEF),
      EFOverDE: checkMinMax("ratioEFOverDE", ratios.EFOverDE),
      CDOverBC: checkMinMax("ratioCDOverBC", ratios.CDOverBC),
      DEOverBC: checkMinMax("ratioDEOverBC", ratios.DEOverBC),
      FGOverDE: checkMinMax("ratioFGOverDE", ratios.FGOverDE),
    };

    // 5) Lưu kết quả tạm (UP)
    window.ratioResults = compared;

    // 6) Kết quả cuối cùng (UP): tất cả true ⇒ true; có false ⇒ false; null bỏ qua
    const passFlags = Object.values(window.ratioResults)
      .map(x => x.pass)
      .filter(p => p !== null);

    let overall = null;
    if (passFlags.length > 0) {
      overall = passFlags.every(p => p === true)
        ? true
        : passFlags.some(p => p === false)
        ? false
        : null;
    }
    window.overallResult = overall;

    // 7) Voice (tuỳ chọn)
    if (overall === true) {
      window.speakText?.("UP: Tất cả tiêu chí đã đạt");
    } else if (overall === false) {
      window.speakText?.("UP: Không đạt tiêu chí");
    }

    // 8) Render
    renderTable(ratios, compared, overall);
  }

  // Public API
  window.upRatioPanel = {
    run,                 // dùng khi chọn/chỉnh điểm -> cập nhật markers + validate
    rerender: () => run(true), // dùng khi đổi rule set -> CHỈ validate, GIỮ markers
  };
})();