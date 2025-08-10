// upHandler.js
window.selectedPointsUP = [];
let isUpMode = false;
let upClickCount = 0;
let upMarkers = [];

document.getElementById('btnUp').addEventListener('click', () => {
    isUpMode = true;
    upClickCount = 0;
    window.selectedPointsUP = [];
    alert("Chế độ UP: hãy click 3 lần vào nến để chọn A, B, C");
});

chart.subscribeClick(param => {
    if (!isUpMode || !param.time || !param.seriesData) return;
    const priceData = param.seriesData.get(candleSeries);
    if (!priceData) return;

    const point = {
        label: ['A', 'B', 'C'][upClickCount],
        time: param.time,
        high: priceData.high,
        low: priceData.low
    };

    window.selectedPointsUP.push(point);
    upClickCount++;

    upMarkers.push({
        time: point.time,
        position: 'aboveBar',
        color: 'blue',
        shape: 'arrowUp',
        text: point.label
    });
    candleSeries.setMarkers([...upMarkers, ...downMarkers]); // gộp cả downMarkers

    if (upClickCount === 3) {
        isUpMode = false;
        alert("Đã chọn đủ A, B, C cho UP");
    }
});
