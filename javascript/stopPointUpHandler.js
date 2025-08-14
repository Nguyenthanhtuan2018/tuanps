// stopPointUpHandler.js

// Biến trạng thái Stop Point cho UP
let isStopPointMode = false;
let stopPointMarker = null;    // marker D
let stopPointMarkerE = null;   // marker E
let stopPointFMarker = null;   // marker F
let stopPointGMarker = null;   // marker G

// === AUTO: timer cho Stop Point UP ===
let stopPointUpAutoTimer = null;

// Trả về mảng dữ liệu theo currentFrame
function getActiveDataArray() {
  if (currentFrame === '1s') return data1s;
  if (currentFrame === '1m') return data1m;
  if (currentFrame === '5m') return data5m;
  return null;
}

// Xây danh sách "nền" từ startIdx -> stopIdx cho CHIỀU UP
// Quy tắc: giữ D = đỉnh cao nhất hiện hành; E = đáy thấp nhất sau D;
// Khi xuất hiện high > D.high => chốt nền (nếu có E), mở nền mới với D = nến hiện tại.
function buildBasesUp(dataArray, startIdx, stopIdx) {
  const bases = [];
  let currentD = null; // { idx }
  let currentE = null; // { idx }

  for (let i = startIdx + 1; i <= stopIdx; i++) {
    const c = dataArray[i];

    if (!currentD) {
      currentD = { idx: i };
      currentE = null;
      continue;
    }

    // gặp đỉnh mới cao hơn D hiện tại -> chốt nền cũ (nếu có E), mở nền mới
    if (c.high > dataArray[currentD.idx].high) {
      if (currentE) {
        bases.push({
          D: { idx: currentD.idx },
          E: { idx: currentE.idx },
          amplitude: dataArray[currentD.idx].high - dataArray[currentE.idx].low
        });
      }
      currentD = { idx: i };
      currentE = null;
      continue;
    }

    // không có đỉnh mới: cập nhật E nếu low thấp hơn
    if (!currentE || c.low < dataArray[currentE.idx].low) {
      currentE = { idx: i };
    }
  }

  // chốt nền cuối nếu đã có E
  if (currentD && currentE) {
    bases.push({
      D: { idx: currentD.idx },
      E: { idx: currentE.idx },
      amplitude: dataArray[currentD.idx].high - dataArray[currentE.idx].low
    });
  }

  return bases;
}

// Lõi tính toán DE/FG và vẽ marker, tái sử dụng cho click & auto
function computeAndRenderStopPointUp(stopIndex, options = { silent: true }) {
  if (!Array.isArray(window.selectedPointsUP) || window.selectedPointsUP.length < 3) {
    if (!options.silent) alert("Vui lòng chọn đủ 3 điểm A, B, C trước khi tìm Stop Point!");
    return false;
  }

  const C = window.selectedPointsUP[2];
  const dataArray = getActiveDataArray();
  if (!dataArray || !dataArray.length) {
    if (!options.silent) alert("Không có dữ liệu cho khung thời gian hiện tại!");
    return false;
  }

  const indexC = dataArray.findIndex(c => c.time === C.time);
  if (indexC === -1) {
    if (!options.silent) alert("Không tìm thấy điểm C trong dữ liệu (khác khung?)");
    return false;
  }

  if (typeof stopIndex !== 'number' || stopIndex <= indexC || stopIndex >= dataArray.length) {
    // stopIndex không hợp lệ hoặc chưa có nến mới sau C
    return false;
  }

  // Reset marker cũ
  stopPointMarker = null;
  stopPointMarkerE = null;
  stopPointFMarker = null;
  stopPointGMarker = null;

  // ===== 1) Tìm DE với biên độ lớn nhất =====
  const basesDE = buildBasesUp(dataArray, indexC, stopIndex)
    .filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0);

  if (!basesDE.length) {
    if (!options.silent) alert("Không tìm được nền DE hợp lệ!");
    return false;
  }

  let bestDE = basesDE[0];
  for (let i = 1; i < basesDE.length; i++) {
    const b = basesDE[i];
    if (b.amplitude > bestDE.amplitude) bestDE = b;
    else if (b.amplitude === bestDE.amplitude &&
             dataArray[b.D.idx].time < dataArray[bestDE.D.idx].time) bestDE = b;
  }

  const pointD = dataArray[bestDE.D.idx];
  const pointE = dataArray[bestDE.E.idx];

  window.selectedPointD = { label: 'D', time: pointD.time, high: pointD.high, low: pointD.low };
  window.selectedPointE = { label: 'E', time: pointE.time, high: pointE.high, low: pointE.low };

  stopPointMarker = {
    time: pointD.time, position: 'aboveBar', color: 'green', shape: 'arrowUp', text: 'D'
  };
  stopPointMarkerE = {
    time: pointE.time, position: 'belowBar', color: 'orange', shape: 'arrowDown', text: 'E'
  };

  // ===== 2) Tìm FG (cùng thuật toán), fallback F=max high =====
  stopPointFMarker = null;
  stopPointGMarker = null;
  window.selectedPointF = undefined;
  window.selectedPointG = undefined;

  const indexE = bestDE.E.idx;
  const basesFG = (indexE < stopIndex)
    ? buildBasesUp(dataArray, indexE, stopIndex).filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0)
    : [];

  let pointF = null, pointG = null;

  if (basesFG.length) {
    let bestFG = basesFG[0];
    for (let i = 1; i < basesFG.length; i++) {
      const b = basesFG[i];
      if (b.amplitude > bestFG.amplitude) bestFG = b;
      else if (b.amplitude === bestFG.amplitude &&
               dataArray[b.D.idx].time < dataArray[bestFG.D.idx].time) bestFG = b;
    }
    pointF = dataArray[bestFG.D.idx];
    pointG = dataArray[bestFG.E.idx];

    window.selectedPointF = { label: 'F', time: pointF.time, high: pointF.high, low: pointF.low };
    window.selectedPointG = { label: 'G', time: pointG.time, high: pointG.high, low: pointG.low };

    stopPointFMarker = { time: pointF.time, position: 'aboveBar', color: 'purple', shape: 'circle', text: 'F' };
    stopPointGMarker = { time: pointG.time, position: 'belowBar', color: 'magenta', shape: 'arrowDown', text: 'G' };
  } else {
    let maxHighF = -Infinity;
    for (let i = indexE + 1; i <= stopIndex; i++) {
      if (dataArray[i].high > maxHighF) {
        maxHighF = dataArray[i].high;
        pointF   = dataArray[i];
      }
    }
    if (pointF) {
      window.selectedPointF = { label: 'F', time: pointF.time, high: pointF.high, low: pointF.low };
      stopPointFMarker = { time: pointF.time, position: 'aboveBar', color: 'purple', shape: 'circle', text: 'F' };
    }
  }

  // ===== 3) EF/DE & label =====
  if (pointF) {
    const EF = Math.abs(pointE.low  - pointF.high);
    const DE = Math.abs(pointD.high - pointE.low);
    const ratio = DE === 0 ? Infinity : (EF / DE) * 100;
    const ratioThreshold =
      (window.waveSettings && typeof window.waveSettings.ratioEFOverDE === 'number')
      ? window.waveSettings.ratioEFOverDE : 70;

    const label = document.getElementById('labelDEEF');
    if (label) {
      const ratioText = Number.isFinite(ratio) ? ratio.toFixed(2) : '∞';
      if (ratio > ratioThreshold) {
        label.textContent = `EF/DE: ĐẠT (${ratioText}%)`;
        label.style.color = 'green';
      } else {
        label.textContent = `EF/DE: KHÔNG ĐẠT (${ratioText}%)`;
        label.style.color = 'red';
      }
    }
  } else {
    const label = document.getElementById('labelDEEF');
    if (label) { label.textContent = ''; label.style.color = ''; }
  }

  // ===== 4) Vẽ markers (giữ A/B/C và marker DOWN nếu có) =====
  const markers = [
    ...(typeof upMarkers   !== 'undefined' && Array.isArray(upMarkers)   ? upMarkers   : []),
    ...(typeof downMarkers !== 'undefined' && Array.isArray(downMarkers) ? downMarkers : []),
    stopPointMarker, stopPointMarkerE, stopPointFMarker, stopPointGMarker
  ].filter(Boolean);

  candleSeries.setMarkers(markers);

  // ===== 5) Panel tỉ lệ =====
  if (window.upRatioPanel && typeof window.upRatioPanel.run === 'function') {
    window.upRatioPanel.run();
  }

  return true;
}

// Bắt đầu auto chạy mỗi 5s với nến mới nhất
function startStopPointUpAuto() {
  console.log('[AutoUP] Bắt đầu Auto Stop Point UP');
  stopStopPointUpAuto(); // clear cũ nếu có
  stopPointUpAutoTimer = setInterval(() => {
    const arr = getActiveDataArray();
    if (!arr || arr.length === 0) return;
    const stopIndex = arr.length - 1; // nến cuối cùng
    computeAndRenderStopPointUp(stopIndex, { silent: true });
  }, 5000);
}

// Dừng auto
function stopStopPointUpAuto() {
  if (stopPointUpAutoTimer) {
    clearInterval(stopPointUpAutoTimer);
    stopPointUpAutoTimer = null;
    console.log('[AutoUP] Dừng Auto Stop Point UP');
  }
}

// === UI: nút Start/Stop Auto cho Stop Point UP ===
(function wireAutoUpButtons() {
  const startBtn = document.getElementById('btnStartAutoUp');
  const stopBtn  = document.getElementById('btnStopAutoUp');
  if (!startBtn || !stopBtn) return;

  function setRunningUI(isRunning) {
    if (isRunning) {
      startBtn.disabled = true;
      stopBtn.disabled  = false;
      startBtn.textContent = 'Auto UP: Running…';
    } else {
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      startBtn.textContent = 'Start Auto UP';
    }
  }

  function isAutoRunning() {
    return !!(typeof stopPointUpAutoTimer !== 'undefined' && stopPointUpAutoTimer);
  }

  // Start: cần A/B/C, chạy ngay 1 lần với nến cuối rồi lặp 5s
  startBtn.addEventListener('click', () => {
    if (!Array.isArray(window.selectedPointsUP) || window.selectedPointsUP.length < 3) {
      alert('Cần chọn đủ A, B, C trước khi bật Auto.');
      return;
    }
    if (isAutoRunning()) return;

    const arr = getActiveDataArray();
    if (!arr || !arr.length) {
      alert('Chưa có dữ liệu để chạy Auto.');
      return;
    }
    computeAndRenderStopPointUp(arr.length - 1, { silent: true });
    startStopPointUpAuto();
    setRunningUI(true);
  });

  // Stop
  stopBtn.addEventListener('click', () => {
    if (!isAutoRunning()) return;
    stopStopPointUpAuto();
    setRunningUI(false);
  });

  // Cho phép nơi khác đồng bộ UI khi dừng Auto
  window.addEventListener('stop-auto-up', () => setRunningUI(false));
})();

// === Handler click thủ công Stop Point UP ===
document.getElementById('btnStopPointUp').addEventListener('click', () => {
  if (!Array.isArray(window.selectedPointsUP) || window.selectedPointsUP.length < 3) {
    alert("Vui lòng chọn đủ 3 điểm A, B, C trước khi tìm Stop Point!");
    return;
  }
  isStopPointMode = true;

  const dataArray = getActiveDataArray();
  if (!dataArray) {
    alert("Khung thời gian không hợp lệ!");
    isStopPointMode = false;
    return;
  }

  const C = window.selectedPointsUP[2];
  const indexC = dataArray.findIndex(c => c.time === C.time);
  if (indexC === -1) {
    alert("Không tìm thấy điểm C trong dữ liệu (có thể khác khung)!");
    isStopPointMode = false;
    return;
  }

  // Reset marker cũ
  stopPointMarker = null;
  stopPointMarkerE = null;
  stopPointFMarker = null;
  stopPointGMarker = null;

  const onStopPointClick = (param) => {
    // Giữ chặn khi crosshair chưa hiển thị cho thao tác thủ công
    if (!isCrosshairActive()) return;
    if (!isStopPointMode) return;
    if (!param?.time || !param?.seriesData) return;

    const stopIndex = dataArray.findIndex(c => c.time === param.time);
    if (stopIndex === -1 || stopIndex <= indexC) {
      alert("Vui lòng chọn nến sau điểm C!");
      return; // giữ mode để chọn lại
    }

    const ok = computeAndRenderStopPointUp(stopIndex, { silent: false });

    isStopPointMode = false;
    chart.unsubscribeClick(onStopPointClick);

    // Sau lần click đầu tiên thành công → bật auto mỗi 5 giây
    // if (ok) startStopPointUpAuto();
  };

  chart.subscribeClick(onStopPointClick);
});
