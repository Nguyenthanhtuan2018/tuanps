// downHandler.js
window.downSelection = [];
let isSelectingDown = false;
let downClickCount = 0;
let downMarkers = [];

document.getElementById('btnDown').addEventListener('click', () => {
    isSelectingDown = true;
    downClickCount = 0;
    window.downSelection = [];
    // document.getElementById('labelABBC').textContent = '';
    // alert("Chế độ DOWN: hãy click 3 lần vào nến để chọn A, B, C");
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
        const ratioThreshold = window.waveSettings?.ratioAP ?? 60; // Lấy từ setting hoặc mặc định 60%

        // Tính toán tỉ lệ BC/AB theo DOWN: 
        // AB = |high.A - low.B|
        // BC = |low.B - high.C|
        const A = window.downSelection[0];
        const B = window.downSelection[1];
        const C = window.downSelection[2];

        const AB = Math.abs(A.high - B.low);
        const BC = Math.abs(B.low - C.high);

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

        // alert("Đã chọn đủ A, B, C cho DOWN");
    }
});
