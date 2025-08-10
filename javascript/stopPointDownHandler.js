// stopPointDownHandler.js

// Biến trạng thái Stop Point cho DOWN
let isStopPointDownMode = false;
let stopPointDownMarker = null;     // marker D
let stopPointDownMarkerE = null;    // marker E
let stopPointDownFMarker = null;    // marker F

document.getElementById('btnStopPointDown').addEventListener('click', () => {
    if (!Array.isArray(window.downSelection) || window.downSelection.length < 3) {
        alert("Vui lòng chọn đủ 3 điểm A, B, C cho DOWN trước khi tìm Stop Point!");
        return;
    }
    isStopPointDownMode = true;
    alert("Chế độ Stop Point DOWN: hãy click 1 lần vào nến để chọn điểm stop point.");

    const onClick = (param) => {
        if (!isStopPointDownMode) return;
        if (!param?.time || !param?.seriesData) return;

        const priceData = param.seriesData.get(candleSeries);
        if (!priceData) return;

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
            return; // giữ mode, chờ chọn lại
        }

        // D: low thấp nhất từ C -> stop
        let minLowD = Infinity;
        let pointD = null;
        for (let i = indexC + 1; i <= indexStopPoint; i++) {
            if (dataArray[i].low < minLowD) {
                minLowD = dataArray[i].low;
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

        // E: high cao nhất từ D -> stop
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

        // NEW: F = low thấp nhất từ E -> stop point
        stopPointDownFMarker = null;
        window.selectedPointFDown = undefined;

        const indexE = dataArray.findIndex(c => c.time === pointE.time);
        if (indexE !== -1 && indexStopPoint > indexE) {
            let minLowF = Infinity;
            let pointF = null;
            for (let i = indexE + 1; i <= indexStopPoint; i++) {
                if (dataArray[i].low < minLowF) { // chọn F sớm nhất khi bằng nhau
                    minLowF = dataArray[i].low;
                    pointF   = dataArray[i];
                }
            }
            if (pointF) {
                window.selectedPointFDown = {
                    label: 'F',
                    time: pointF.time,
                    high: pointF.high,
                    low: pointF.low
                };
                // Marker F: dưới nến, màu tím
                stopPointDownFMarker = {
                    time: pointF.time,
                    position: 'belowBar',
                    color: 'purple',
                    shape: 'circle',
                    text: 'F'
                };
            }
        }

        // Giữ A/B/C và các marker hiện có (UP/DOWN) + D/E/F
        const markers = [
            ...(typeof upMarkers   !== 'undefined' && Array.isArray(upMarkers)   ? upMarkers   : []),
            ...(typeof downMarkers !== 'undefined' && Array.isArray(downMarkers) ? downMarkers : []),
            stopPointMarker,            // D/E của chiều UP (nếu có)
            stopPointDownMarker,        // D (DOWN)
            stopPointDownMarkerE,       // E (DOWN)
            stopPointDownFMarker        // F (DOWN)
        ].filter(Boolean);

        candleSeries.setMarkers(markers);

        // Thông báo
        let msg = `DOWN: D (Low = ${pointD.low}), E (High = ${pointE.high})`;
        if (window.selectedPointFDown) {
            msg += `, F (Low = ${window.selectedPointFDown.low})`;
        }
        msg += ` tại ~ ${new Date(pointD.time * 1000).toLocaleTimeString('vi-VN', { hour12: false })}`;
        alert(msg);

        isStopPointDownMode = false;
        chart.unsubscribeClick(onClick);
    };

    chart.subscribeClick(onClick);
});
