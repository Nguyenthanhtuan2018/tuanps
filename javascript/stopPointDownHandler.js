// stopPointDownHandler.js

// Biến trạng thái Stop Point cho DOWN
let isStopPointDownMode = false;
let stopPointDownMarker = null;     // D
let stopPointDownMarkerE = null;    // E
let stopPointDownFMarker = null;    // F
let stopPointDownGMarker = null;    // G

// Xây danh sách "nền" từ startIdx -> stopIdx cho CHIỀU DOWN
// Quy tắc: giữ D = low thấp nhất hiện hành; E = high cao nhất sau D;
// Khi có low < D.low => chốt nền (nếu đã có E), mở nền mới với D = nến hiện tại.
function buildBasesDown(dataArray, startIdx, stopIdx) {
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

    // low mới thấp hơn D hiện tại -> chốt nền cũ (nếu có E), mở nền mới
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

    // Không có low mới: cập nhật E nếu high cao hơn
    if (!currentE || c.high > dataArray[currentE.idx].high) {
      currentE = { idx: i };
    }
  }

  // Chốt nền cuối nếu đã có E
  if (currentD && currentE) {
    bases.push({
      D: { idx: currentD.idx },
      E: { idx: currentE.idx },
      amplitude: dataArray[currentE.idx].high - dataArray[currentD.idx].low
    });
  }

  return bases;
}

document.getElementById('btnStopPointDown').addEventListener('click', () => {
  if (!Array.isArray(window.downSelection) || window.downSelection.length < 3) {
    alert("Vui lòng chọn đủ 3 điểm A, B, C cho DOWN trước khi tìm Stop Point!");
    return;
  }
  isStopPointDownMode = true;
  alert("Chế độ Stop Point DOWN: hãy click 1 lần vào nến để chọn điểm stop point.");

  // Gỡ handler cũ nếu có (tránh chồng)
  if (typeof window.stopPointDownClickHandler === 'function') {
    chart.unsubscribeClick(window.stopPointDownClickHandler);
    window.stopPointDownClickHandler = null;
  }

  const onClick = (param) => {
    if (!isStopPointDownMode) return;
    if (!param?.time || !param?.seriesData) return;

    // Dataset theo khung hiện tại
    let dataArray;
    if (currentFrame === '1s') dataArray = data1s;
    else if (currentFrame === '1m') dataArray = data1m;
    else if (currentFrame === '5m') dataArray = data5m;
    else {
      alert("Khung thời gian không hợp lệ!");
      isStopPointDownMode = false;
      chart.unsubscribeClick(onClick);
      return;
    }

    const C = window.downSelection[2];
    const indexC = dataArray.findIndex(c => c.time === C.time);
    if (indexC === -1) {
      alert("Không tìm thấy điểm C trong dữ liệu!");
      isStopPointDownMode = false;
      chart.unsubscribeClick(onClick);
      return;
    }

    const indexStopPoint = dataArray.findIndex(c => c.time === param.time);
    if (indexStopPoint === -1 || indexStopPoint <= indexC) {
      alert("Điểm Stop Point phải nằm sau điểm C!");
      return; // giữ mode để chọn lại
    }

    // ===== 1) DE theo thuật toán nền từ C -> stop =====
    const basesDE = buildBasesDown(dataArray, indexC, indexStopPoint)
      .filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0);

    if (!basesDE.length) {
      alert("Không tìm được nền điều chỉnh (DE) hợp lệ trong khoảng đã chọn!");
      isStopPointDownMode = false;
      chart.unsubscribeClick(onClick);
      return;
    }

    // Chọn nền DE có amplitude lớn nhất (hòa -> nền xuất hiện sớm hơn)
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

    // Markers D/E
    stopPointDownMarker = {
      time: pointD.time,
      position: 'belowBar',
      color: 'green',
      shape: 'arrowDown',
      text: 'D'
    };
    stopPointDownMarkerE = {
      time: pointE.time,
      position: 'aboveBar',
      color: 'green',
      shape: 'arrowUp',
      text: 'E'
    };

    // ===== 2) FG theo thuật toán nền từ E -> stop =====
    stopPointDownFMarker = null;
    stopPointDownGMarker = null;
    window.selectedPointFDown = undefined;
    window.selectedPointGDown = undefined;

    const indexE = bestDE.E.idx;

    const basesFG = (indexE < indexStopPoint)
      ? buildBasesDown(dataArray, indexE, indexStopPoint)
          .filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0)
      : [];

    let pointF = null;
    let pointG = null;

    if (basesFG.length) {
      // Chọn nền FG có amplitude lớn nhất (hòa -> nền sớm hơn)
      let bestFG = basesFG[0];
      for (let i = 1; i < basesFG.length; i++) {
        const b = basesFG[i];
        if (b.amplitude > bestFG.amplitude) bestFG = b;
        else if (b.amplitude === bestFG.amplitude &&
                 dataArray[b.D.idx].time < dataArray[bestFG.D.idx].time) bestFG = b;
      }
      pointF = dataArray[bestFG.D.idx]; // F = low
      pointG = dataArray[bestFG.E.idx]; // G = high

      window.selectedPointFDown = { label: 'F', time: pointF.time, high: pointF.high, low: pointF.low };
      window.selectedPointGDown = { label: 'G', time: pointG.time, high: pointG.high, low: pointG.low };

      // Markers F/G
      stopPointDownFMarker = {
        time: pointF.time,
        position: 'belowBar',
        color: 'purple',
        shape: 'circle',
        text: 'F'
      };
      stopPointDownGMarker = {
        time: pointG.time,
        position: 'aboveBar',
        color: 'magenta',
        shape: 'arrowUp',
        text: 'G'
      };
    } else {
      // Fallback: không hình thành nền sau E -> F = low min từ E -> stop, không có G
      let minLowF = Infinity;
      for (let i = indexE + 1; i <= indexStopPoint; i++) {
        if (dataArray[i].low < minLowF) {
          minLowF = dataArray[i].low;
          pointF  = dataArray[i];
        }
      }
      if (pointF) {
        window.selectedPointFDown = { label: 'F', time: pointF.time, high: pointF.high, low: pointF.low };
        stopPointDownFMarker = {
          time: pointF.time,
          position: 'belowBar',
          color: 'purple',
          shape: 'circle',
          text: 'F'
        };
      }
    }

    // ===== 3) EF/DE và hiển thị lên #labelDEEF (theo yêu cầu DOWN) =====
    // EF = |high.E - low.F|, DE = |low.D - high.E|
    if (pointF) {
      const EF = Math.abs(pointE.high - pointF.low);
      const DE = Math.abs(pointD.low  - pointE.high);
      const ratio = DE === 0 ? Infinity : (EF / DE) * 100;

      const ratioThreshold = (window.waveSettings && typeof window.waveSettings.ratioEFOverDE === 'number')
        ? window.waveSettings.ratioEFOverDE
        : 70;

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

    // ===== 4) Vẽ markers (giữ A/B/C và cả marker UP nếu có) =====
    const markers = [
      ...(typeof upMarkers   !== 'undefined' && Array.isArray(upMarkers)   ? upMarkers   : []),
      ...(typeof downMarkers !== 'undefined' && Array.isArray(downMarkers) ? downMarkers : []),
      // D/E của chiều UP (nếu có):
      ...(typeof stopPointMarker  !== 'undefined' && stopPointMarker  ? [stopPointMarker]  : []),
      ...(typeof stopPointMarkerE !== 'undefined' && stopPointMarkerE ? [stopPointMarkerE] : []),
      // D/E/F/G của chiều DOWN:
      ...(stopPointDownMarker   ? [stopPointDownMarker]   : []),
      ...(stopPointDownMarkerE  ? [stopPointDownMarkerE]  : []),
      ...(stopPointDownFMarker  ? [stopPointDownFMarker]  : []),
      ...(stopPointDownGMarker  ? [stopPointDownGMarker]  : [])
    ];

    candleSeries.setMarkers(markers);

    // ===== 5) Thông báo =====
    let msg = `DOWN: D (Low=${pointD.low}), E (High=${pointE.high})`;
    if (pointF) msg += `, F (Low=${pointF.low})`;
    if (pointG) msg += `, G (High=${pointG.high})`;
    msg += ` | Biên độ DE chọn=${(pointE.high - pointD.low).toFixed(2)}`;
    if (pointF && pointG) msg += ` | Biên độ FG chọn=${(pointG.high - pointF.low).toFixed(2)}`;
    alert(msg);

    if (window.downRatioPanel && typeof window.downRatioPanel.run === 'function') {
      window.downRatioPanel.run();
    }    

    isStopPointDownMode = false;
    chart.unsubscribeClick(onClick);
    window.stopPointDownClickHandler = null;
  };

  chart.subscribeClick(onClick);
  window.stopPointDownClickHandler = onClick; // lưu để reset/unsubscribe sau này
});
