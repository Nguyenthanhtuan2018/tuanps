// uiRuleProfile.js (fixed bar, no overflow)
(function () {
    function applySafeLayout(bar) {
      // 1) Bỏ margin mặc định của body để tránh lệch layout
      document.body.style.margin = "0";
  
      // 2) Tính chiều cao thanh và đẩy nội dung xuống tương ứng
      const h = bar.offsetHeight || 0;
      document.body.style.paddingTop = h + "px";
  
      // 3) Nếu chart đang đặt height=100vh thì đổi sang calc(100vh - h)
      const chartEl = document.getElementById("chart");
      if (chartEl) {
        const currH = getComputedStyle(chartEl).height; // giá trị thực tế (px)
        const declaredH = chartEl.style.height || "";   // inline style (nếu có)
        const cssH = getComputedStyle(chartEl).getPropertyValue("height");
  
        // Heuristic: nếu CSS gốc của bạn dùng 100vh (thường thấy),
        // hãy ưu tiên set lại bằng calc(100vh - barHeight)
        const usesViewport =
          declaredH.includes("vh") ||
          cssH.includes("vh") ||
          /100vh/i.test(declaredH);
  
        if (usesViewport) {
          chartEl.style.height = `calc(100vh - ${h}px)`;
        }
        // Nếu bạn đã set height bằng px cố định, giữ nguyên (vì đã có padding-top bù).
      }
    }
  
    function ensureProfileSelector() {
      if (document.getElementById("wave-profile-select")) return;
      if (document.getElementById("wave-profile-bar")) return;
  
      const bar = document.createElement("div");
      bar.id = "wave-profile-bar";
      bar.style.position = "fixed";
      bar.style.top = "0";
      bar.style.left = "0";
      bar.style.right = "0";
      bar.style.zIndex = "9999";
      bar.style.display = "flex";
      bar.style.gap = "8px";
      bar.style.alignItems = "center";
      bar.style.padding = "6px 10px";
      bar.style.fontFamily = "Inter, system-ui, Arial, sans-serif";
      bar.style.background = "#ffffff";
      bar.style.borderBottom = "1px solid #e5e7eb";
      bar.style.boxSizing = "border-box";
  
      const label = document.createElement("span");
      label.textContent = "Rule set:";
      label.style.fontSize = "13px";
      label.style.color = "#374151";
  
      const sel = document.createElement("select");
      sel.id = "wave-profile-select";
      sel.style.fontSize = "13px";
      sel.style.padding = "4px 6px";
      sel.style.border = "1px solid #e5e7eb";
      sel.style.borderRadius = "6px";
      sel.innerHTML = `
        <option value="tiep_dien">Tiếp diễn</option>
        <option value="kathy">Kathy</option>
        <option value="sideway">Sideway</option>
      `;
      sel.value = window.waveActiveProfile || "tiep_dien";
  
      sel.addEventListener("change", () => {
        // nếu bạn có logic giữ marker, có thể thêm ở đây
        window.setWaveProfile?.(sel.value);
      });
  
      bar.appendChild(label);
      bar.appendChild(sel);
  
      (document.body || document.documentElement).prepend(bar);
  
      // Áp dụng bố cục an toàn ngay sau khi gắn
      // cần delay 1 tick để offsetHeight chính xác
      requestAnimationFrame(() => {
        applySafeLayout(bar);
      });
  
      // Cập nhật khi resize (đề phòng chữ/phông làm thay đổi chiều cao)
      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => applySafeLayout(bar), 50);
      });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ensureProfileSelector);
    } else {
      ensureProfileSelector();
    }
  })();
  