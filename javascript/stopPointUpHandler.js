// stopPointUpHandler.js

// Biến trạng thái Stop Point cho UP
let isStopPointMode = false;
let stopPointMarker = null;
let stopPointMarkerE = null;

document.getElementById('btnStopPointUp').addEventListener('click', () => {
    if (window.selectedPointsUP.length < 3) {
        alert("Vui lòng chọn đủ 3 điểm A, B, C trước khi tìm Stop Point!");
        return;
    }
    isStopPointMode = true;

    const C = window.selectedPointsUP[2];

    // Lấy dữ liệu nến hiện tại theo khung thời gian
    let dataArray;
    if (currentFrame === '1s') dataArray = data1s;
    else if (currentFrame === '1m') dataArray = data1m;
    else if (currentFrame === '5m') dataArray = data5m;
    else {
        alert("Khung thời gian không hợp lệ!");
        isStopPointMode = false;
        return;
    }

    // Tìm index của điểm C trong dữ liệu
    const indexC = dataArray.findIndex(c => c.time === C.time);
    if (indexC === -1) {
        alert("Không tìm thấy điểm C trong dữ liệu!");
        isStopPointMode = false;
        return;
    }

    // Nếu đã có điểm D hoặc E trước đó thì xóa marker cũ
    stopPointMarker = null;
    stopPointMarkerE = null;

    alert("Chế độ Stop Point: Vui lòng click 1 nến để chọn điểm Stop Point");

    // Hàm xử lý click chọn điểm Stop Point
    const onStopPointClick = (param) => {
        if (!isStopPointMode) return;
        if (!param.time || !param.seriesData) return;

        const candle = param.seriesData.get(candleSeries);
        if (!candle) return;

        const stopIndex = dataArray.findIndex(c => c.time === param.time);
        if (stopIndex === -1 || stopIndex <= indexC) {
            alert("Vui lòng chọn nến sau điểm C!");
            return;
        }

        // Tìm điểm D (High max từ C đến stop point)
        let maxHigh = -Infinity;
        let pointD = null;
        for (let i = indexC + 1; i <= stopIndex; i++) {
            if (dataArray[i].high > maxHigh) {
                maxHigh = dataArray[i].high;
                pointD = dataArray[i];
            }
        }

        if (!pointD) {
            alert("Không tìm thấy điểm D hợp lệ!");
            return;
        }

        // Tìm điểm E (Low min từ D đến stop point)
        const indexD = dataArray.findIndex(c => c.time === pointD.time);
        let minLow = Infinity;
        let pointE = null;
        for (let i = indexD + 1; i <= stopIndex; i++) {
            if (dataArray[i].low < minLow) {
                minLow = dataArray[i].low;
                pointE = dataArray[i];
            }
        }

        // Lưu điểm D và E
        window.selectedPointD = {
            label: 'D',
            time: pointD.time,
            high: pointD.high,
            low: pointD.low
        };
        window.selectedPointE = pointE ? {
            label: 'E',
            time: pointE.time,
            high: pointE.high,
            low: pointE.low
        } : null;

        // Marker D
        stopPointMarker = {
            time: pointD.time,
            position: 'aboveBar',
            color: 'green',
            shape: 'arrowUp',
            text: 'D'
        };

        // Marker E
        if (pointE) {
            stopPointMarkerE = {
                time: pointE.time,
                position: 'belowBar',
                color: 'orange',
                shape: 'arrowDown',
                text: 'E'
            };
        } else {
            stopPointMarkerE = null;
        }

        // Cập nhật markers lên chart (gộp upMarkers, downMarkers, D, E)
        if (stopPointMarkerE) {
            candleSeries.setMarkers([...upMarkers, ...downMarkers, stopPointMarker, stopPointMarkerE]);
        } else {
            candleSeries.setMarkers([...upMarkers, ...downMarkers, stopPointMarker]);
        }

        let msg = `Đã chọn điểm D (High = ${pointD.high})`;
        if (pointE) {
            msg += ` và điểm E (Low = ${pointE.low})`;
        }
        msg += ` tại thời gian ${new Date(pointD.time * 1000).toLocaleTimeString()}`;
        alert(msg);

        isStopPointMode = false;
        chart.unsubscribeClick(onStopPointClick);
    };

    // Đăng ký sự kiện click mới cho Stop Point
    chart.subscribeClick(onStopPointClick);
});
