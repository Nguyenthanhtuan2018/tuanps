// upHandler.js
window.selectedPointsUP = [];
let isUpMode = false;
let upClickCount = 0;
let upMarkers = [];

document.getElementById('btnUp').addEventListener('click', () => {
    isUpMode = true;
    upClickCount = 0;
    window.selectedPointsUP = [];
    // document.getElementById('labelABBC').textContent = '';
    // alert("Chế độ UP: hãy click 3 lần vào nến để chọn A, B, C");
});

chart.subscribeClick(param => {
    // ==== NEW: chặn khi crosshair chưa hiển thị ====
    if (!isCrosshairActive()) return;
    // ==== END NEW ====

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
        const ratioThreshold = window.waveSettings?.ratioAP ?? 60; // 60%
        // Tính toán tỉ lệ BC/AB
        const A = window.selectedPointsUP[0];
        const B = window.selectedPointsUP[1];
        const C = window.selectedPointsUP[2];

        const AB = Math.abs(A.low - B.high);
        const BC = Math.abs(B.high - C.low);

        const ratio = AB === 0 ? 0 : (BC / AB) * 100;
        const ratioFixed = ratio.toFixed(2);

        // const label = document.getElementById('labelABBC');
        // if (ratio < ratioThreshold) {
        //     label.textContent = `BC/AB: ĐẠT (${ratioFixed}%)`;
        //     label.style.color = 'green';
        // } else {
        //     label.textContent = `BC/AB: KHÔNG ĐẠT (${ratioFixed}%)`;
        //     label.style.color = 'red';
        // }

        // alert("Đã chọn đủ A, B, C cho UP");
    }
});
