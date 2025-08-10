// stopPointDownHandler.js

// Biến trạng thái Stop Point cho DOWN
let isStopPointDownMode = false;
let stopPointDownMarker = null;
let stopPointDownMarkerE = null; // marker điểm E

document.getElementById('btnStopPointDown').addEventListener('click', () => {
    if (window.downSelection.length < 3) {
        alert("Vui lòng chọn đủ 3 điểm A, B, C cho DOWN trước khi tìm Stop Point!");
        return;
    }
    isStopPointDownMode = true;
    alert("Chế độ Stop Point DOWN: hãy click 1 lần vào nến để chọn điểm stop point.");

    const onClick = (param) => {
        if (!isStopPointDownMode) return;
        if (!param.time || !param.seriesData) return;

        const priceData = param.seriesData.get(candleSeries);
        if (!priceData) return;

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
            return; // không thoát mode, chờ chọn lại
        }

        // Tìm điểm D: low thấp nhất từ C đến stop point
        let minLow = Infinity;
        let pointD = null;
        for (let i = indexC + 1; i <= indexStopPoint; i++) {
            if (dataArray[i].low < minLow) {
                minLow = dataArray[i].low;
                pointD = dataArray[i];
            }
        }

        if (!pointD) {
            alert("Không tìm thấy điểm D hợp lệ!");
            isStopPointDownMode = false;
            chart.unsubscribeClick(onClick);
            return;
        }

        window.selectedPointDDown = {
            label: 'D',
            time: pointD.time,
            high: pointD.high,
            low: pointD.low
        };

        // Tìm điểm E: high cao nhất từ D đến stop point
        const indexD = dataArray.findIndex(c => c.time === pointD.time);
        if (indexD === -1) {
            alert("Không tìm thấy điểm D trong dữ liệu!");
            isStopPointDownMode = false;
            chart.unsubscribeClick(onClick);
            return;
        }

        let maxHighE = -Infinity;
        let pointE = null;
        for (let i = indexD + 1; i <= indexStopPoint; i++) {
            if (dataArray[i].high > maxHighE) {
                maxHighE = dataArray[i].high;
                pointE = dataArray[i];
            }
        }

        if (!pointE) {
            alert("Không tìm thấy điểm E hợp lệ!");
            isStopPointDownMode = false;
            chart.unsubscribeClick(onClick);
            return;
        }

        window.selectedPointEDown = {
            label: 'E',
            time: pointE.time,
            high: pointE.high,
            low: pointE.low
        };

        // Tạo marker điểm D (màu xanh lá, dưới nến)
        stopPointDownMarker = {
            time: pointD.time,
            position: 'belowBar',
            color: 'green',
            shape: 'arrowDown',
            text: 'D'
        };

        // Tạo marker điểm E (màu xanh lá, trên nến)
        stopPointDownMarkerE = {
            time: pointE.time,
            position: 'aboveBar',
            color: 'green',
            shape: 'arrowUp',
            text: 'E'
        };

        // Cập nhật marker mới, giữ marker UP, DOWN, D và E
        candleSeries.setMarkers([...upMarkers, ...downMarkers, stopPointMarker, stopPointDownMarker, stopPointDownMarkerE].filter(Boolean));

        alert(`Đã chọn điểm D (Stop Point DOWN) Low = ${pointD.low} và điểm E High = ${pointE.high} tại thời gian tương ứng.`);

        isStopPointDownMode = false;
        chart.unsubscribeClick(onClick);
    };

    chart.subscribeClick(onClick);
});
