// javascript/resetAll.js
document.getElementById('btnResetAll').addEventListener('click', () => {
    // 0) Đảm bảo 2 container tồn tại và giữ nguyên (chỉ làm trống nội dung)
    const ensureDiv = (id) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.padding = '8px';
        (document.body || document.documentElement).appendChild(el);
      }
      el.innerHTML = ''; // GIỮ LẠI div, chỉ xóa nội dung
      return el;
    };
    ensureDiv('ratio-table-container');
    ensureDiv('ratio-table-container-down');
  
    // 1) Xóa markers trên chart
    const series =
      (typeof window !== 'undefined' && window.candleSeries) ||
      (typeof candleSeries !== 'undefined' ? candleSeries : null);
    if (series && typeof series.setMarkers === 'function') {
      series.setMarkers([]);
    }
  
    // 2) Xóa mảng markers nguồn (nếu có)
    try { if (Array.isArray(window.upMarkers)) window.upMarkers = []; } catch (_) {}
    try { if (typeof upMarkers !== 'undefined') upMarkers = []; } catch (_) {}
    try { if (Array.isArray(window.downMarkers)) window.downMarkers = []; } catch (_) {}
    try { if (typeof downMarkers !== 'undefined') downMarkers = []; } catch (_) {}
  
    // 3) Xóa dữ liệu A-B-C (UP & DOWN)
    window.selectedPointsUP = [];
    window.downSelection   = [];
  
    // 4) Xóa dữ liệu D-E-F-G (UP)
    window.selectedPointD = undefined;
    window.selectedPointE = undefined;
    window.selectedPointF = undefined;
    window.selectedPointG = undefined;
  
    // 5) Xóa dữ liệu D-E-F-G (DOWN)
    window.selectedPointDDown = undefined;
    window.selectedPointEDown = undefined;
    window.selectedPointFDown = undefined;
    window.selectedPointGDown = undefined;
  
    // 6) Đưa các biến marker tạm về null (nếu tồn tại)
    [
      'stopPointMarker','stopPointMarkerE','stopPointFMarker','stopPointGMarker',
      'stopPointDownMarker','stopPointDownMarkerE','stopPointDownFMarker','stopPointDownGMarker'
    ].forEach(k => { try { eval(k + ' = null'); } catch (_) {} });
  
    // 7) Xóa kết quả tỉ lệ (UP & DOWN) nhưng GIỮ 2 container
    window.ratioResults = undefined;
    window.overallResult = undefined;
    window._upRatioSnapshot = undefined;
  
    window.ratioResultsDown = undefined;
    window.overallResultDown = undefined;
  
    // 8) Xóa các label hiển thị nếu có
    const labelABBC = document.getElementById('labelABBC');
    if (labelABBC) { labelABBC.textContent = ''; labelABBC.style.color = ''; }
  
    const labelDEEF = document.getElementById('labelDEEF');
    if (labelDEEF) { labelDEEF.textContent = ''; labelDEEF.style.color = ''; }
  
    alert("Đã reset A..G (UP & DOWN), markers và làm trống 2 bảng 'Tỉ lệ & So sánh' (giữ nguyên 2 div).");
  });
  