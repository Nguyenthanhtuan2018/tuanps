// javascript/downRatioPanel.js
// Panel tính & hiển thị tỉ lệ (DOWN) sau khi đã có A..G và waveSettings.
// Quy tắc so sánh:
// - BC/AB, DE/CD, FG/EF: <= threshold => ĐẠT
// - EF/DE, CD/BC:       >= threshold => ĐẠT
// - Chỉ tính khi hai đoạn có giá trị và mẫu > 0
// - Đoạn giá = |Giá(Y) - Giá(X)| với B,D,F dùng low; A,C,E,G dùng high
// - Lưu vào window.ratioResultsDown và window.overallResultDown

(function () {
    // ----- Helpers -----
    const round = (num, digits = 2) =>
      Number.isFinite(num) ? Number(num.toFixed(digits)) : num;
  
    const formatPct = (v) =>
      (v === null || !Number.isFinite(v)) ? "–" : `${v.toFixed(2)}%`;
  
    function getThreshold(key, fallback) {
      const ws = window.waveSettings || {};
      const v = ws[key];
      return typeof v === "number" && Number.isFinite(v) ? v : fallback;
    }
  
    // Lấy điểm theo nhãn, KHỚP đúng tên biến DOWN của bạn
    function getPoint(label) {
      const A = window.downSelection?.[0] ?? null;
      const B = window.downSelection?.[1] ?? null;
      const C = window.downSelection?.[2] ?? null;
  
      const D = window.selectedPointDDown ?? null;
      const E = window.selectedPointEDown ?? null;
      const F = window.selectedPointFDown ?? null;
      const G = window.selectedPointGDown ?? null;
  
      switch (label) {
        case "A": return A;
        case "B": return B;
        case "C": return C;
        case "D": return D;
        case "E": return E;
        case "F": return F;
        case "G": return G;
        default:  return null;
      }
    }
  
    // Chiều DOWN: A,C,E,G = high; B,D,F = low
    function pointPrice(label, p) {
      if (!p) return null;
      const highs = new Set(["A", "C", "E", "G"]);
      const lows  = new Set(["B", "D", "F"]);
      if (highs.has(label)) return p.high ?? null;
      if (lows.has(label))  return p.low  ?? null;
      return null;
    }
  
    // Biên độ đoạn tuyệt đối |Y - X|; đủ 2 điểm & giá hợp lệ mới tính
    function segmentAbs(X, Y) {
      const pX = getPoint(X);
      const pY = getPoint(Y);
      if (!pX || !pY) return null;
      const vX = pointPrice(X, pX);
      const vY = pointPrice(Y, pY);
      if (!Number.isFinite(vX) || !Number.isFinite(vY)) return null;
      return Math.abs(vY - vX);
    }
  
    // Tỉ lệ %: chỉ khi hai đoạn có và mẫu > 0
    function ratioPct(num, den) {
      if (num === null || den === null) return null;
      if (den <= 0) return null;
      return (num / den) * 100;
    }
  
    // So sánh với ngưỡng theo mode ('<=' hoặc '>=')
    function compareRatio(valuePct, threshold, mode = '>=') {
      if (valuePct === null) return { value: null, pass: null };
      if (!Number.isFinite(valuePct)) return { value: null, pass: null };
      return (mode === '<=')
        ? { value: valuePct, pass: valuePct <= threshold }
        : { value: valuePct, pass: valuePct >= threshold };
    }
  
    // Tạo container nếu chưa có
    function ensureContainer() {
      let container = document.getElementById("ratio-table-container-down");
      if (!container) {
        container = document.createElement("div");
        container.id = "ratio-table-container-down";
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
      title.textContent = "Tỉ lệ & So sánh (DOWN)";
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
      const cols = ["Ratio", "Value (%)", "Threshold", "Pass", "Kết quả cuối cùng"];
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
        tdVal.textContent = formatPct(ratios[key]);
  
        const tdThr = document.createElement("td");
        tdThr.style.textAlign = "center";
        tdThr.style.padding = "8px";
        tdThr.style.borderBottom = "1px solid #f3f4f6";
        tdThr.textContent = String(thresholds[key]);
  
        const tdPass = document.createElement("td");
        tdPass.style.textAlign = "center";
        tdPass.style.padding = "8px";
        tdPass.style.borderBottom = "1px solid #f3f4f6";
        tdPass.appendChild(passCell((window.ratioResultsDown?.[key] ?? {}).pass ?? null));
  
        const tdOverall = document.createElement("td");
        tdOverall.style.textAlign = "center";
        tdOverall.style.padding = "8px";
        tdOverall.style.borderBottom = "1px solid #f3f4f6";
        tdOverall.appendChild(passCell(overall));
  
        tr.appendChild(tdRatio);
        tr.appendChild(tdVal);
        tr.appendChild(tdThr);
        tr.appendChild(tdPass);
        tr.appendChild(tdOverall);
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
        BC: segmentAbs("C", "B"), // BC = |B.low - C.high|
        CD: segmentAbs("C", "D"),
        DE: segmentAbs("E", "D"),
        EF: segmentAbs("E", "F"),
        FG: segmentAbs("G", "F"),
      };
  
      // 2) Tính tỉ lệ (mẫu > 0)
      const rawRatios = {
        BCOverAB: ratioPct(seg.BC, seg.AB),
        DEOverCD: ratioPct(seg.DE, seg.CD),
        FGOverEF: ratioPct(seg.FG, seg.EF),
        EFOverDE: ratioPct(seg.EF, seg.DE),
        CDOverBC: ratioPct(seg.CD, seg.BC),
      };
  
      // 3) Làm tròn 2 chữ số
      const ratios = Object.fromEntries(
        Object.entries(rawRatios).map(([k, v]) => [k, v === null ? null : round(v, 2)])
      );
  
      // 4) Ngưỡng
      const thresholds = {
        BCOverAB: getThreshold("ratioBCOverAB", 70),
        DEOverCD: getThreshold("ratioDEOverCD", 60),
        FGOverEF: getThreshold("ratioFGOverEF", 50),
        EFOverDE: getThreshold("ratioEFOverDE", 70),
        CDOverBC: getThreshold("ratioCDOverBC", 65),
      };
  
      // 5) So sánh theo mode
      const compared = {
        BCOverAB: compareRatio(ratios.BCOverAB, thresholds.BCOverAB, "<="),
        DEOverCD: compareRatio(ratios.DEOverCD, thresholds.DEOverCD, "<="),
        FGOverEF: compareRatio(ratios.FGOverEF, thresholds.FGOverEF, "<="),
        EFOverDE: compareRatio(ratios.EFOverDE, thresholds.EFOverDE, ">="),
        CDOverBC: compareRatio(ratios.CDOverBC, thresholds.CDOverBC, ">="),
      };
  
      // 6) Lưu kết quả tạm (DOWN)
      window.ratioResultsDown = { ...compared };
  
      // 7) Kết quả cuối cùng (DOWN): tất cả true ⇒ true; có false ⇒ false; null bỏ qua
      const passFlags = Object.values(window.ratioResultsDown)
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
      window.overallResultDown = overall;
  
      // 8) Render
      renderTable(ratios, thresholds, compared, overall);
    }
  
    // Public API
    window.downRatioPanel = {
      run,
      rerender: () => {
        if (window.ratioResultsDown) {
          const ratios = {
            BCOverAB: window.ratioResultsDown.BCOverAB?.value ?? null,
            DEOverCD: window.ratioResultsDown.DEOverCD?.value ?? null,
            FGOverEF: window.ratioResultsDown.FGOverEF?.value ?? null,
            EFOverDE: window.ratioResultsDown.EFOverDE?.value ?? null,
            CDOverBC: window.ratioResultsDown.CDOverBC?.value ?? null,
          };
          const thresholds = {
            BCOverAB: getThreshold("ratioBCOverAB", 70),
            DEOverCD: getThreshold("ratioDEOverCD", 60),
            FGOverEF: getThreshold("ratioFGOverEF", 50),
            EFOverDE: getThreshold("ratioEFOverDE", 70),
            CDOverBC: getThreshold("ratioCDOverBC", 65),
          };
          const overall = window.overallResultDown ?? null;
          renderTable(ratios, thresholds, window.ratioResultsDown, overall);
        }
      },
    };
  })();
  