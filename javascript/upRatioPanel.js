// javascript/upRatioPanel.js
// Panel tính & hiển thị tỉ lệ (UP) sau khi đã có A..G và waveSettings.
// Quy tắc so sánh:
// - BC/AB, DE/CD, FG/EF: <= threshold => ĐẠT
// - EF/DE, CD/BC:       >= threshold => ĐẠT
// - Chỉ tính tỉ lệ khi cả hai đoạn có giá trị và mẫu > 0
// - Đoạn giá = |Giá(Y) - Giá(X)| với B,D,F dùng high; A,C,E,G dùng low
// - Lưu kết quả tạm vào window.ratioResults, và kết quả chung vào window.overallResult

(function () {
  // ----- Helpers -----
  const round = (num, digits = 2) =>
    Number.isFinite(num) ? Number(num.toFixed(digits)) : num;

  const textOrDash = (v) =>
    v === null || v === undefined ? "–" : String(v);

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

  // Theo chiều UP: đỉnh = B,D,F (high); đáy = A,C,E,G (low)
  function pointPrice(label, p) {
    if (!p) return null;
    const highs = new Set(["B", "D", "F"]);
    const lows  = new Set(["A", "C", "E", "G"]);
    if (highs.has(label)) return p.high ?? null;
    if (lows.has(label))  return p.low  ?? null;
    return null;
  }

  // Biên độ đoạn tuyệt đối |Y - X|; chỉ tính khi đủ 2 điểm và có giá hợp lệ
  function segmentAbs(X, Y) {
    const pX = getPoint(X);
    const pY = getPoint(Y);
    if (!pX || !pY) return null; // thiếu điểm -> không tính
    const vX = pointPrice(X, pX);
    const vY = pointPrice(Y, pY);
    if (!Number.isFinite(vX) || !Number.isFinite(vY)) return null;
    return Math.abs(vY - vX);
  }

  function getThreshold(key, fallback) {
    const ws = window.waveSettings || {};
    const v = ws[key];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  }

  // Tính tỉ lệ %: chỉ khi cả hai đoạn có và mẫu > 0
  function ratioPct(num, den) {
    if (num === null || den === null) return null;
    if (den <= 0) return null; // theo yêu cầu: đoạn = 0 thì không tính tỉ lệ
    return (num / den) * 100;
  }

  // So sánh với ngưỡng theo mode ('<=' hoặc '>=')
  function compareRatio(valuePct, threshold, mode = '>=') {
    if (valuePct === null) return { value: null, pass: null };
    if (!Number.isFinite(valuePct)) return { value: null, pass: null };
    if (mode === '<=') {
      return { value: valuePct, pass: valuePct <= threshold };
    } else {
      return { value: valuePct, pass: valuePct >= threshold };
    }
  }

  // Tạo container nếu chưa có
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

  function renderTable(ratios, thresholds, compared, overall) {
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
    title.textContent = "Tỉ lệ & So sánh (UP)";
    title.style.fontSize = "16px";
    title.style.fontWeight = "600";

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
    const cols = ["Ratio", "Value (%)", "Threshold", "Pass"]; // <- đã bỏ cột cuối
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

    const rows = [
      ["BC/AB", "BCOverAB", "<="],
      ["DE/CD", "DEOverCD", "<="],
      ["FG/EF", "FGOverEF", "<="],
      ["EF/DE", "EFOverDE", ">="],
      ["CD/BC", "CDOverBC", ">="],
      ["DE/BC", "DEOverBC", ">="],
      ["FG/DE", "FGOverDE", ">="],
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

    rows.forEach(([label, key]) => {
      const tr = document.createElement("tr");

      const tdRatio = document.createElement("td");
      tdRatio.textContent = label;
      tdRatio.style.padding = "8px";
      tdRatio.style.borderBottom = "1px solid #f3f4f6";

      const tdVal = document.createElement("td");
      tdVal.style.textAlign = "center";
      tdVal.style.padding = "8px";
      tdVal.style.borderBottom = "1px solid #f3f4f6";
      tdVal.textContent = textOrDash(ratios[key]);

      const tdThr = document.createElement("td");
      tdThr.style.textAlign = "center";
      tdThr.style.padding = "8px";
      tdThr.style.borderBottom = "1px solid #f3f4f6";
      tdThr.textContent = textOrDash(thresholds[key]);

      const tdPass = document.createElement("td");
      tdPass.style.textAlign = "center";
      tdPass.style.padding = "8px";
      tdPass.style.borderBottom = "1px solid #f3f4f6";
      tdPass.appendChild(passCell((window.ratioResults?.[key] ?? {}).pass ?? null));
  
      tr.appendChild(tdRatio);
      tr.appendChild(tdVal);
      tr.appendChild(tdThr);
      tr.appendChild(tdPass);
      tbody.appendChild(tr);
    });
   
    table.appendChild(thead);
    table.appendChild(tbody);

    wrap.appendChild(header);
    wrap.appendChild(table);
    container.appendChild(wrap);
  }  

  function run() {
    // 1) Tính các đoạn tuyệt đối (thiếu điểm -> null)
    const seg = {
      AB: segmentAbs("A", "B"),
      BC: segmentAbs("C", "B"), // BC = |B.high - C.low|
      CD: segmentAbs("C", "D"),
      DE: segmentAbs("E", "D"),
      EF: segmentAbs("E", "F"),
      FG: segmentAbs("G", "F"),
    };

    // ==== Hiển thị giá trị đoạn ngay trên marker (B,C,D,E,F,G) ====
    try {
      // Map đoạn -> [điểm kết thúc, màu, vị trí marker]
      const segmentDisplayMap = {
        A:  ["A", "#0ea5e9", "belowBar"],   // xanh ngọc - hiển thị Low
        AB: ["B", "#2563eb", "aboveBar"],   // xanh dương
        BC: ["C", "#f59e0b", "belowBar"],   // cam
        CD: ["D", "#16a34a", "aboveBar"],   // xanh lá
        DE: ["E", "#dc2626", "belowBar"],   // đỏ
        EF: ["F", "#7c3aed", "aboveBar"],   // tím
        FG: ["G", "#db2777", "belowBar"],   // hồng đậm
      };      

      // Lấy markers hiện có, loại bỏ marker chữ B..G để thay bằng bản có text đoạn
      let mergedMarkers = [
        ...(Array.isArray(window.upMarkers) ? window.upMarkers.filter(m => !["B","C","D","E","F","G"].includes(m.text)) : []),
        ...(Array.isArray(window.downMarkers) ? window.downMarkers : []),
      ];

      // Tạo marker mới cho từng đoạn có giá trị
      Object.entries(segmentDisplayMap).forEach(([segKey, [pointLabel, color, position]]) => {
        let val;
        if (segKey === "A") {
          const p = getPoint("A");
          if (!p || !Number.isFinite(p.low)) return;
          val = p.low; // giá trị Low của A
        } else {
          val = seg[segKey];
        }
        if (val === null) return;
      
        const point = getPoint(pointLabel);
        if (!point || !point.time) return;
      
        mergedMarkers.push({
          time: point.time,
          position: position,
          color: color,
          shape: "arrowUp",
          text: `${pointLabel}\n${segKey}=${round(val, 2)}`
        });
      });      

      if (window.candleSeries && typeof window.candleSeries.setMarkers === "function") {
        window.candleSeries.setMarkers(mergedMarkers);
      }
    } catch (e) {
      // tránh crash UI nếu thiếu biến global
      console.warn("[upRatioPanel] Cannot set segment markers:", e);
    }
    // ==== Hết phần hiển thị marker ====

    // 2) Tính các tỉ lệ yêu cầu (mẫu > 0)
    const rawRatios = {
      BCOverAB: ratioPct(seg.BC, seg.AB),
      DEOverCD: ratioPct(seg.DE, seg.CD),
      FGOverEF: ratioPct(seg.FG, seg.EF),
      EFOverDE: ratioPct(seg.EF, seg.DE),
      CDOverBC: ratioPct(seg.CD, seg.BC),
      DEOverBC: ratioPct(seg.DE, seg.BC),
      FGOverDE: ratioPct(seg.FG, seg.DE),
    };

    // 3) Làm tròn 2 chữ số
    const ratios = Object.fromEntries(
      Object.entries(rawRatios).map(([k, v]) => [k, v === null ? null : round(v, 2)])
    );

    // 4) Ngưỡng từ settings (có default dự phòng)
    const thresholds = {
      BCOverAB: getThreshold("ratioBCOverAB", 60),
      DEOverCD: getThreshold("ratioDEOverCD", 70),
      FGOverEF: getThreshold("ratioFGOverEF", 70),
      EFOverDE: getThreshold("ratioEFOverDE", 70),
      CDOverBC: getThreshold("ratioCDOverBC", 70),
      DEOverBC: getThreshold("ratioDEOverBC", 60),
      FGOverDE: getThreshold("ratioFGOverDE", 60),
    };

    // 5) So sánh theo mode từng tỉ lệ
    const compared = {
      BCOverAB: compareRatio(ratios.BCOverAB, thresholds.BCOverAB, "<="),
      DEOverCD: compareRatio(ratios.DEOverCD, thresholds.DEOverCD, "<="),
      FGOverEF: compareRatio(ratios.FGOverEF, thresholds.FGOverEF, "<="),
      EFOverDE: compareRatio(ratios.EFOverDE, thresholds.EFOverDE, ">="),
      CDOverBC: compareRatio(ratios.CDOverBC, thresholds.CDOverBC, ">="),
      DEOverBC: compareRatio(ratios.DEOverBC, thresholds.DEOverBC, ">="),
      FGOverDE: compareRatio(ratios.FGOverDE, thresholds.FGOverDE, ">="),
    };

    // Quy tắc bổ sung: FG/DE > cap thì KHÔNG ĐẠT (override)
    const fgdeCapUp = getThreshold("ratioFGOverDECap", 80);
    if (ratios.FGOverDE !== null && Number.isFinite(ratios.FGOverDE) && ratios.FGOverDE > fgdeCapUp) {
      compared.FGOverDE = { value: ratios.FGOverDE, pass: false };
    }

    // Quy tắc bổ sung mới: EF/DE > cap thì KHÔNG ĐẠT (override)
    const efdeCapUp = getThreshold("ratioEFOverDECap", 200); // default 200
    if (ratios.EFOverDE !== null && Number.isFinite(ratios.EFOverDE) && ratios.EFOverDE > efdeCapUp) {
      compared.EFOverDE = { value: ratios.EFOverDE, pass: false };
    }

    // Caps (giới hạn trên) cho UP
    const cdBcCapUp = getThreshold("ratioCDOverBCUpCap", Infinity);
    // Chặn trần CD/BC cho UP: nếu vượt cap => KHÔNG ĐẠT
    if (ratios.CDOverBC !== null && Number.isFinite(ratios.CDOverBC) && ratios.CDOverBC > cdBcCapUp) {
      compared.CDOverBC = { value: ratios.CDOverBC, pass: false };
    }

    // 6) Lưu kết quả tạm vào global
    window.ratioResults = {
      BCOverAB: compared.BCOverAB,
      DEOverCD: compared.DEOverCD,
      FGOverEF: compared.FGOverEF,
      EFOverDE: compared.EFOverDE,
      CDOverBC: compared.CDOverBC,
      DEOverBC: compared.DEOverBC,
      FGOverDE: compared.FGOverDE,
    };

    // 7) Tính "kết quả cuối cùng":
    // - tất cả pass===true => true
    // - nếu có bất kỳ false => false
    // - null bỏ qua
    const passFlags = Object.values(window.ratioResults)
      .map((x) => x.pass)
      .filter((p) => p !== null);

    let overall = null;
    if (passFlags.length > 0) {
      overall = passFlags.every((p) => p === true)
        ? true
        : passFlags.some((p) => p === false)
        ? false
        : null;
    }
    window.overallResult = overall;

    // === Đọc bằng loa khi tất cả ĐẠT và chưa đọc trước đó ===
    // if (overall === true) {
    //   if (!window._lastSpokenUp) {
    //     speakText("Tất cả tiêu chí UP đã đạt");
    //     window._lastSpokenUp = true;
    //   }
    // } else {
    //   window._lastSpokenUp = false;
    // }

    if (overall === true) {
      window.speakText("UP: Tất cả tiêu chí đã đạt");
    } else if (overall === false) {
      window.speakText("UP: Không đạt tiêu chí");
    }

    // 8) Render bảng UI
    renderTable(ratios, thresholds, compared, overall);
  }

  // Public API
  window.upRatioPanel = {
    run, // gọi sau khi click xong Stop Point
    rerender: () => {
      if (window.ratioResults) {
        // Tính lại để đảm bảo đồng bộ marker & bảng khi thay đổi settings
        run();
      }
    },
  };
})();
