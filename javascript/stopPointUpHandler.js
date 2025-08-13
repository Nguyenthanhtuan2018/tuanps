// stopPointUpHandler.js

// Biến trạng thái Stop Point cho UP
let isStopPointMode = false;
let stopPointMarker = null;    // marker D
let stopPointMarkerE = null;   // marker E
let stopPointFMarker = null;   // marker F
let stopPointGMarker = null;   // marker G (mới)

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

document.getElementById('btnStopPointUp').addEventListener('click', () => {
  if (!Array.isArray(window.selectedPointsUP) || window.selectedPointsUP.length < 3) {
    alert("Vui lòng chọn đủ 3 điểm A, B, C trước khi tìm Stop Point!");
    return;
  }
  isStopPointMode = true;

  const C = window.selectedPointsUP[2];

  // Dataset theo khung hiện tại
  let dataArray;
  if (currentFrame === '1s') dataArray = data1s;
  else if (currentFrame === '1m') dataArray = data1m;
  else if (currentFrame === '5m') dataArray = data5m;
  else {
    alert("Khung thời gian không hợp lệ!");
    isStopPointMode = false;
    return;
  }

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

  // alert("Chế độ Stop Point: Vui lòng click 1 nến để chọn điểm Stop Point");

  const onStopPointClick = (param) => {

    // ==== NEW: chặn khi crosshair chưa hiển thị ====
    if (!isCrosshairActive()) return;
    // ==== END NEW ====

    if (!isStopPointMode) return;
    if (!param?.time || !param?.seriesData) return;

    const stopIndex = dataArray.findIndex(c => c.time === param.time);
    if (stopIndex === -1 || stopIndex <= indexC) {
      alert("Vui lòng chọn nến sau điểm C!");
      return; // giữ mode để chọn lại
    }

    // ===== 1) Tạo DANH SÁCH NỀN từ C -> stop, chọn nền có biên độ lớn nhất -> D/E =====
    const basesDE = buildBasesUp(dataArray, indexC, stopIndex)
      .filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0);

    if (!basesDE.length) {
      alert("Không tìm được nền điều chỉnh (DE) hợp lệ trong khoảng đã chọn!");
      isStopPointMode = false;
      chart.unsubscribeClick(onStopPointClick);
      return;
    }

    // chọn nền DE có amplitude lớn nhất (hòa -> nền sớm hơn)
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

    // Markers D/E
    stopPointMarker = {
      time: pointD.time,
      position: 'aboveBar',
      color: 'green',
      shape: 'arrowUp',
      text: 'D'
    };
    stopPointMarkerE = {
      time: pointE.time,
      position: 'belowBar',
      color: 'orange',
      shape: 'arrowDown',
      text: 'E'
    };

    // ===== 2) Áp dụng CÙNG THUẬT TOÁN NỀN để tìm F/G từ E -> stop =====
    stopPointFMarker = null;
    stopPointGMarker = null;
    window.selectedPointF = undefined;
    window.selectedPointG = undefined;

    const indexE = bestDE.E.idx;

    const basesFG = (indexE < stopIndex)
      ? buildBasesUp(dataArray, indexE, stopIndex)
          .filter(b => Number.isFinite(b.amplitude) && b.amplitude >= 0)
      : [];

    let pointF = null;
    let pointG = null;

    if (basesFG.length) {
      // chọn nền FG có amplitude lớn nhất (hòa -> nền sớm hơn)
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

      stopPointFMarker = {
        time: pointF.time,
        position: 'aboveBar',
        color: 'purple',
        shape: 'circle',
        text: 'F'
      };
      stopPointGMarker = {
        time: pointG.time,
        position: 'belowBar',
        color: 'magenta', // màu khác E để dễ phân biệt
        shape: 'arrowDown',
        text: 'G'
      };
    } else {
      // Fallback: nếu sau E không hình thành được “nền”, vẫn lấy F = high max (không có G)
      let maxHighF = -Infinity;
      for (let i = indexE + 1; i <= stopIndex; i++) {
        if (dataArray[i].high > maxHighF) {
          maxHighF = dataArray[i].high;
          pointF   = dataArray[i];
        }
      }
      if (pointF) {
        window.selectedPointF = { label: 'F', time: pointF.time, high: pointF.high, low: pointF.low };
        stopPointFMarker = {
          time: pointF.time,
          position: 'aboveBar',
          color: 'purple',
          shape: 'circle',
          text: 'F'
        };
      }
    }

    // ===== 3) Tính EF/DE và hiển thị (giữ như trước) =====
    if (pointF) {
      const EF = Math.abs(pointE.low  - pointF.high);
      const DE = Math.abs(pointD.high - pointE.low);
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

    // ===== 4) Vẽ markers (giữ A/B/C) =====
    const markers = [
      ...(typeof upMarkers   !== 'undefined' && Array.isArray(upMarkers)   ? upMarkers   : []),
      ...(typeof downMarkers !== 'undefined' && Array.isArray(downMarkers) ? downMarkers : []),
      stopPointMarker,
      stopPointMarkerE,
      stopPointFMarker,
      stopPointGMarker
    ].filter(Boolean);

    candleSeries.setMarkers(markers);

    // ===== 5) Thông điệp =====
    let msg = `UP: D (High=${pointD.high}), E (Low=${pointE.low})`;
    if (pointF) msg += `, F (High=${pointF.high})`;
    if (pointG) msg += `, G (Low=${pointG.low})`;
    msg += ` | Biên độ DE chọn=${(dataArray[bestDE.D.idx].high - dataArray[bestDE.E.idx].low).toFixed(2)}`;
    if (pointF && pointG) {
      msg += ` | Biên độ FG chọn=${(pointF.high - pointG.low).toFixed(2)}`;
    }
    // alert(msg);

    // >>> Gọi tính toán & hiển thị bảng tỉ lệ sau khi có đủ A..G
    if (window.upRatioPanel && typeof window.upRatioPanel.run === 'function') {
      window.upRatioPanel.run();
    }

    isStopPointMode = false;
    chart.unsubscribeClick(onStopPointClick);
  };

  chart.subscribeClick(onStopPointClick);
});
