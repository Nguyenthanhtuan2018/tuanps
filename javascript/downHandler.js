// downHandler.js
window.downSelection = [];
let isSelectingDown = false;
let downClickCount = 0;
let downMarkers = [];

document.getElementById('btnDown').addEventListener('click', () => {
    isSelectingDown = true;
    downClickCount = 0;
    window.downSelection = [];
    alert("Chế độ DOWN: hãy click 3 lần vào nến để chọn A, B, C");
});

chart.subscribeClick(param => {
    if (!isSelectingDown || !param.time || !param.seriesData) return;
    const priceData = param.seriesData.get(candleSeries);
    if (!priceData) return;

    const point = {
        label: ['A', 'B', 'C'][downClickCount],
        time: param.time,
        high: priceData.high,
        low: priceData.low
    };

    window.downSelection.push(point);
    downClickCount++;

    downMarkers.push({
        time: point.time,
        position: 'belowBar',
        color: 'red',
        shape: 'arrowDown',
        text: point.label
    });
    candleSeries.setMarkers([...upMarkers, ...downMarkers]); // gộp cả upMarkers

    if (downClickCount === 3) {
        isSelectingDown = false;
        alert("Đã chọn đủ A, B, C cho DOWN");
    }
});
