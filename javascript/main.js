// javascript/main.js

const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#ffffff' }, textColor: '#000' },
  grid: { vertLines: { visible: false }, horzLines: { visible: false } },
  timeScale: {
    timeVisible: true,
    secondsVisible: true,
    tickMarkFormatter: (time) => {
      const date = new Date(time * 1000);
      return date.toLocaleTimeString('vi-VN', { hour12: false });
    }
  }
});

const candleSeries = chart.addCandlestickSeries();

const candles1s = {}, candles1m = {}, candles5m = {};
let data1s = [], data1m = [], data5m = [];
let currentFrame = '1s';

function convertTimeServerToUnix(timeStr) {
  const [h, m, s] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(h, m, s, 0);
  return Math.floor(now.getTime() / 1000);
}

function updateCandle(candleMap, dataArr, tick, t) {
  if (!candleMap[t]) {
    candleMap[t] = {
      time: t,
      open: tick.lastPrice,
      high: tick.lastPrice,
      low: tick.lastPrice,
      close: tick.lastPrice
    };
    dataArr.push(candleMap[t]);
  } else {
    candleMap[t].high = Math.max(candleMap[t].high, tick.lastPrice);
    candleMap[t].low = Math.min(candleMap[t].low, tick.lastPrice);
    candleMap[t].close = tick.lastPrice;
  }
}

function findPeaksAndTroughs(data) {
  const peaks = [];
  const troughs = [];
  for (let i = 2; i < data.length - 2; i++) {
    const prev2 = data[i - 2], prev1 = data[i - 1];
    const curr = data[i];
    const next1 = data[i + 1], next2 = data[i + 2];

    if (curr.high > prev2.high && curr.high > prev1.high &&
      curr.high > next1.high && curr.high > next2.high) {
      peaks.push({ time: curr.time, value: curr.high });
    }

    if (curr.low < prev2.low && curr.low < prev1.low &&
      curr.low < next1.low && curr.low < next2.low) {
      troughs.push({ time: curr.time, value: curr.low });
    }
  }
  return { peaks, troughs };
}

function saveToStorage() {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`chart-1s-${today}`, JSON.stringify(data1s));
  localStorage.setItem(`chart-1m-${today}`, JSON.stringify(data1m));
  localStorage.setItem(`chart-5m-${today}`, JSON.stringify(data5m));
}

function updateDisplayedChart() {
  if (currentFrame === '1s') {
    candleSeries.setData(data1s);
  } else if (currentFrame === '1m') {
    candleSeries.setData(data1m);
  } else if (currentFrame === '5m') {
    candleSeries.setData(data5m);
  }
}

function loadFromStorage() {
  const today = new Date().toISOString().split('T')[0];
  data1s = JSON.parse(localStorage.getItem(`chart-1s-${today}`)) || [];
  data1m = JSON.parse(localStorage.getItem(`chart-1m-${today}`)) || [];
  data5m = JSON.parse(localStorage.getItem(`chart-5m-${today}`)) || [];
  data1s.forEach(c => candles1s[c.time] = c);
  data1m.forEach(c => candles1m[c.time] = c);
  data5m.forEach(c => candles5m[c.time] = c);
  updateDisplayedChart();
  if (typeof drawDetectedWaves === 'function') drawDetectedWaves();
}

function processTick(tick) {
  if (!tick.timeServer || typeof tick.timeServer !== "string") return;
  const now = convertTimeServerToUnix(tick.timeServer);
  const t1s = now;
  const t1m = Math.floor(now / 60) * 60;
  const t5m = Math.floor(now / 300) * 300;

  updateCandle(candles1s, data1s, tick, t1s);
  updateCandle(candles1m, data1m, tick, t1m);
  updateCandle(candles5m, data5m, tick, t5m);

  saveToStorage();
  updateDisplayedChart();
  // chèn
  if (typeof drawDetectedWaves === 'function') drawDetectedWaves();
}

document.getElementById('timeframe').addEventListener('change', (e) => {
  currentFrame = e.target.value;
  updateDisplayedChart();
  if (typeof drawDetectedWaves === 'function') drawDetectedWaves();
});

document.getElementById('exportBtn').addEventListener('click', async () => {
  try {
    const res = await fetch("https://spwapidatafeed.vps.com.vn/getpschartintraday/VN30F1M");
    const ticks = await res.json();

    const tmp1s = {}, tmp1m = {}, tmp5m = {};
    const d1s = [], d1m = [], d5m = [];

    for (const tick of ticks) {
      if (!tick.timeServer || typeof tick.timeServer !== "string") continue;
      const tUnix = convertTimeServerToUnix(tick.timeServer);
      const t1s = tUnix;
      const t1m = Math.floor(tUnix / 60) * 60;
      const t5m = Math.floor(tUnix / 300) * 300;

      updateCandle(tmp1s, d1s, tick, t1s);
      updateCandle(tmp1m, d1m, tick, t1m);
      updateCandle(tmp5m, d5m, tick, t5m);
    }

    const today = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify({
      date: today,
      data1s: d1s,
      data1m: d1m,
      data5m: d5m
    }, null, 2)], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart-data-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Lỗi khi tải dữ liệu từ API!");
    console.error(e);
  }
});

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const files = e.target.files;
  if (!files.length) return;

  let merged1s = [...data1s], merged1m = [...data1m], merged5m = [...data5m];
  const readerPromises = [];

  for (const file of files) {
    const reader = new FileReader();
    const promise = new Promise((resolve, reject) => {
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          if (json.data1s) merged1s = merged1s.concat(json.data1s);
          if (json.data1m) merged1m = merged1m.concat(json.data1m);
          if (json.data5m) merged5m = merged5m.concat(json.data5m);
          resolve();
        } catch (err) {
          reject("File không hợp lệ: " + file.name);
        }
      };
    });
    reader.readAsText(file);
    readerPromises.push(promise);
  }

  Promise.allSettled(readerPromises).then(results => {
    const failed = results.filter(r => r.status === "rejected");
    if (failed.length > 0) {
      alert(failed.map(f => f.reason).join("\n"));
      return;
    }

    const uniqByTime = (arr) => Object.values(Object.fromEntries(arr.map(c => [c.time, c])));

    data1s = uniqByTime(merged1s).sort((a, b) => a.time - b.time);
    data1m = uniqByTime(merged1m).sort((a, b) => a.time - b.time);
    data5m = uniqByTime(merged5m).sort((a, b) => a.time - b.time);

    Object.assign(candles1s, Object.fromEntries(data1s.map(c => [c.time, c])));
    Object.assign(candles1m, Object.fromEntries(data1m.map(c => [c.time, c])));
    Object.assign(candles5m, Object.fromEntries(data5m.map(c => [c.time, c])));

    updateDisplayedChart();
    if (typeof drawDetectedWaves === 'function') drawDetectedWaves();
    alert("Import thành công!");
  });
});

const socket = io("https://bgdatafeed.vps.com.vn", {
  path: "/socket.io",
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Kết nối thành công!");
  socket.emit("regs", JSON.stringify({
    action: "join",
    list: "41I1F8000"
  }));
});

socket.on("stockps", (msg) => {
  if (msg && msg.data && msg.data.id === 3220) {
    processTick(msg.data);
  }
});

socket.on("connect_error", (err) => console.error("Lỗi kết nối: " + err.message));

const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.background = 'rgba(255, 255, 255, 0.9)';
tooltip.style.border = '1px solid #ccc';
tooltip.style.padding = '8px';
tooltip.style.borderRadius = '4px';
tooltip.style.pointerEvents = 'none';
tooltip.style.zIndex = '10';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

chart.subscribeCrosshairMove(param => {
  if (!param || !param.time || !param.seriesData) {
    tooltip.style.display = 'none';
    return;
  }

  const priceData = param.seriesData.get(candleSeries);
  if (!priceData) {
    tooltip.style.display = 'none';
    return;
  }

  const time = param.time;
  const date = new Date(time * 1000);
  const timeStr = date.toLocaleTimeString('vi-VN', { hour12: false });

  tooltip.innerHTML = `
    <strong>${timeStr}</strong><br>
    O: ${priceData.open}<br>
    H: ${priceData.high}<br>
    L: ${priceData.low}<br>
    C: ${priceData.close}
  `;

  const chartRect = document.getElementById('chart').getBoundingClientRect();
  tooltip.style.left = chartRect.left + param.point.x + 20 + 'px';
  tooltip.style.top = chartRect.top + param.point.y + 20 + 'px';
  tooltip.style.display = 'block';
});

window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
});
