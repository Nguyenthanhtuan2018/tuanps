// stopPointDownHandler.js

// Trạng thái Stop Point cho DOWN
let isStopPointDownMode = false;
let stopPointDownMarker = null;     // D
let stopPointDownMarkerE = null;    // E
let stopPointDownFMarker = null;    // F
let stopPointDownGMarker = null;    // G

// === AUTO: timer cho Stop Point DOWN ===
let stopPointDownAutoTimer = null;

// Dataset theo khung
function getActiveDataArray() {
  if (currentFrame === '1s') return data1s;
  if (currentFrame === '1m') return data1m;
  if (currentFrame === '5m') return data5m;
  return null;
}

// Nền DOWN: D=low thấp nhất tiến trình; E=high cao nhất sau D; low mới < D.low => chốt nền (nếu có E)
function buildBasesDown(dataArray, startIdx, stopIdx) {
  const bases = [];
  let currentD = null;
  let currentE = null;

  for (let i = startIdx + 1; i <= stopIdx; i++) {
    const c = dataArray[i];
    if (!currentD) { currentD = { idx: i }; currentE = null; continue; }

    if (c.low < dataArray[currentD.idx].low) {
      if (currentE) {
        bases.push({
          D: { idx: currentD.idx },
          E: { idx: currentE.idx },
          amplitude: dataArray[currentE.idx].high - dataArray[currentD.idx].low
        });
      }
      currentD = { idx: i };
      currentE = null;
      continue;
    }
    if (!currentE || c.high > dataArray[currentE.idx].high) {
      currentE = { idx: i };
    }
  }

  if (currentD && currentE) {
    bases.push({
      D: { idx: currentD.idx },
      E: { idx: currentE.idx },
      amplitude: dataArray[currentE.idx].high - dataArray[currentD.idx].low
    });
  }
  return bases;
}

// Lõi tính toán DE/FG cho DOWN và vẽ marker
function computeAndRenderStopPointDown(stopIndex, options = { silent: true }) {
  if (!Array.isArray(window.downSelection) || window.downSelection.length < 3) {
    if (!options.silent) alert("Vui lòng chọn đủ 3 điểm A, B, C cho DOWN trước khi tìm Stop Point!");
    return false;
  }

  const C = window.downSelection[2];
  const dataArray = getActiveDataArray();
  if (!dataArray || !dataArray.length) {
    if (!options.silent) alert("Không có dữ liệu cho khung thời gian hiện tại!");
    return false;
  }

  const indexC = dataArray.findIndex(c => c.time === C.time);
  if (indexC === -1) {
    if (!options.silent) alert("Không tìm thấy điểm C trong dữ liệu!");
    return false;
  }
  if (typeof stopIndex !== 'number' || stopIndex <= indexC || stopIndex >= dataArray.length) {
    return false; // chưa có nến sau C hoặc stopIndex không hợp lệ
  }

  // Reset markers cũ
  stopPointDownMarker = null;
  stopPointDownMarkerE = null;
  stopPointDownFMarker = null;
  stopPointDownGMarker = null;

  // 1) DE: chọn nền có amplitude lớn nhất (và sớm hơn nếu hòa)
  const basesDE = buildBasesDown(dataArray, indexC, stopIndex)
    .filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0);

  if (!basesDE.length) {
    if (!options.silent) alert("Không tìm được nền điều chỉnh (DE) hợp lệ!");
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

  window.selectedPointDDown = { label: 'D', time: pointD.time, high: pointD.high, low: pointD.low };
  window.selectedPointEDown = { label: 'E', time: pointE.time, high: pointE.high, low: pointE.low };

  stopPointDownMarker = { time: pointD.time, position: 'belowBar', color: 'green', shape: 'arrowDown', text: 'D' };
  stopPointDownMarkerE = { time: pointE.time, position: 'aboveBar', color: 'green', shape: 'arrowUp', text: 'E' };

  // 2) FG từ E -> stop (fallback: F=low min)
  stopPointDownFMarker = null;
  stopPointDownGMarker = null;
  window.selectedPointFDown = undefined;
  window.selectedPointGDown = undefined;

  const indexE = bestDE.E.idx;
  const basesFG = (indexE < stopIndex)
    ? buildBasesDown(dataArray, indexE, stopIndex).filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0)
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

    window.selectedPointFDown = { label: 'F', time: pointF.time, high: pointF.high, low: pointF.low };
    window.selectedPointGDown = { label: 'G', time: pointG.time, high: pointG.high, low: pointG.low };

    stopPointDownFMarker = { time: pointF.time, position: 'belowBar', color: 'purple', shape: 'circle', text: 'F' };
    stopPointDownGMarker = { time: pointG.time, position: 'aboveBar', color: 'magenta', shape: 'arrowUp', text: 'G' };
  } else {
    let minLowF = Infinity;
    for (let i = indexE + 1; i <= stopIndex; i++) {
      if (dataArray[i].low < minLowF) { minLowF = dataArray[i].low; pointF = dataArray[i]; }
    }
    if (pointF) {
      window.selectedPointFDown = { label: 'F', time: pointF.time, high: pointF.high, low: pointF.low };
      stopPointDownFMarker = { time: pointF.time, position: 'belowBar', color: 'purple', shape: 'circle', text: 'F' };
    }
  }

  // 3) EF/DE (DOWN): EF = |high.E - low.F|, DE = |low.D - high.E|
  const label = document.getElementById('labelDEEF');
  if (pointF) {
    const EF = Math.abs(pointE.high - pointF.low);
    const DE = Math.abs(pointD.low  - pointE.high);
    const ratio = DE === 0 ? Infinity : (EF / DE) * 100;
    const ratioThreshold =
      (window.waveSettings && typeof window.waveSettings.ratioEFOverDE === 'number')
      ? window.waveSettings.ratioEFOverDE : 70;
    if (label) {
      const ratioText = Number.isFinite(ratio) ? ratio.toFixed(2) : '∞';
      if (ratio > ratioThreshold) { label.textContent = `EF/DE: ĐẠT (${ratioText}%)`; label.style.color = 'green'; }
      else { label.textContent = `EF/DE: KHÔNG ĐẠT (${ratioText}%)`; label.style.color = 'red'; }
    }
  } else if (label) {
    label.textContent = ''; label.style.color = '';
  }

  // 4) Vẽ markers (giữ cả UP)
  const markers = [
    ...(Array.isArray(window.upMarkers) ? window.upMarkers : []),
    ...(Array.isArray(window.downMarkers) ? window.downMarkers : []),
    ...(stopPointMarker       ? [stopPointMarker]       : []), // UP D
    ...(stopPointMarkerE      ? [stopPointMarkerE]      : []), // UP E
    ...(stopPointDownMarker   ? [stopPointDownMarker]   : []),
    ...(stopPointDownMarkerE  ? [stopPointDownMarkerE]  : []),
    ...(stopPointDownFMarker  ? [stopPointDownFMarker]  : []),
    ...(stopPointDownGMarker  ? [stopPointDownGMarker]  : []),
  ];
  candleSeries.setMarkers(markers);

  // 5) Panel tỉ lệ
  if (window.downRatioPanel && typeof window.downRatioPanel.run === 'function') {
    window.downRatioPanel.run();
  }

  return true;
}

// Bắt đầu auto mỗi 5s với nến cuối
function startStopPointDownAuto() {
  console.log('[AutoDOWN] Bắt đầu Auto Stop Point DOWN');
  stopStopPointDownAuto();
  stopPointDownAutoTimer = setInterval(() => {
    const arr = getActiveDataArray();
    if (!arr || arr.length === 0) return;
    const stopIndex = arr.length - 1;
    computeAndRenderStopPointDown(stopIndex, { silent: true });
  }, 5000);
}

// Dừng auto
function stopStopPointDownAuto() {
  if (stopPointDownAutoTimer) {
    clearInterval(stopPointDownAutoTimer);
    stopPointDownAutoTimer = null;
    console.log('[AutoDOWN] Dừng Auto Stop Point DOWN');
  }
}

// UI: Start/Stop buttons
(function wireAutoDownButtons() {
  const startBtn = document.getElementById('btnStartAutoDown');
  const stopBtn  = document.getElementById('btnStopAutoDown');
  if (!startBtn || !stopBtn) return;

  const setRunningUI = (isRunning) => {
    if (isRunning) { startBtn.disabled = true; stopBtn.disabled = false; startBtn.textContent = 'Auto DOWN: Running…'; }
    else { startBtn.disabled = false; stopBtn.disabled = true; startBtn.textContent = 'Start Auto DOWN'; }
  };
  const isAutoRunning = () => !!stopPointDownAutoTimer;

  startBtn.addEventListener('click', () => {
    if (!Array.isArray(window.downSelection) || window.downSelection.length < 3) {
      alert('Cần chọn đủ A, B, C cho DOWN trước khi bật Auto.');
      return;
    }
    if (isAutoRunning()) return;

    const arr = getActiveDataArray();
    if (!arr || !arr.length) { alert('Chưa có dữ liệu để chạy Auto.'); return; }

    // Chạy ngay 1 lần với nến cuối rồi lặp 5s
    computeAndRenderStopPointDown(arr.length - 1, { silent: true });
    startStopPointDownAuto();
    setRunningUI(true);
  });

  stopBtn.addEventListener('click', () => {
    if (!isAutoRunning()) return;
    stopStopPointDownAuto();
    setRunningUI(false);
  });

  // Cho phép nơi khác đồng bộ UI khi dừng Auto
  window.addEventListener('stop-auto-down', () => setRunningUI(false));
})();

// Click thủ công Stop Point DOWN (KHÔNG tự bật auto)
document.getElementById('btnStopPointDown').addEventListener('click', () => {
  if (!Array.isArray(window.downSelection) || window.downSelection.length < 3) {
    alert("Vui lòng chọn đủ 3 điểm A, B, C cho DOWN trước khi tìm Stop Point!");
    return;
  }
  isStopPointDownMode = true;

  // Tháo handler cũ nếu có
  if (typeof window.stopPointDownClickHandler === 'function') {
    chart.unsubscribeClick(window.stopPointDownClickHandler);
    window.stopPointDownClickHandler = null;
  }

  const onClick = (param) => {
    // Chặn click khi crosshair không active (như UP)
    if (!isCrosshairActive()) return;
    if (!isStopPointDownMode) return;
    if (!param?.time || !param?.seriesData) return;

    const dataArray = getActiveDataArray();
    if (!dataArray) { alert("Khung thời gian không hợp lệ!"); isStopPointDownMode = false; chart.unsubscribeClick(onClick); return; }

    const C = window.downSelection[2];
    const indexC = dataArray.findIndex(c => c.time === C.time);
    if (indexC === -1) { alert("Không tìm thấy điểm C trong dữ liệu!"); isStopPointDownMode = false; chart.unsubscribeClick(onClick); return; }

    const indexStopPoint = dataArray.findIndex(c => c.time === param.time);
    if (indexStopPoint === -1 || indexStopPoint <= indexC) {
      alert("Điểm Stop Point phải nằm sau điểm C!"); return;
    }

    computeAndRenderStopPointDown(indexStopPoint, { silent: false });

    isStopPointDownMode = false;
    chart.unsubscribeClick(onClick);
    window.stopPointDownClickHandler = null;

    // KHÔNG tự bật auto — Auto chỉ khi bấm Start Auto DOWN
  };

  chart.subscribeClick(onClick);
  window.stopPointDownClickHandler = onClick;
});
