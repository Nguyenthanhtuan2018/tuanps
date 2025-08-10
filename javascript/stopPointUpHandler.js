// stopPointUpHandler.js

// Biến trạng thái Stop Point cho UP
let isStopPointMode = false;
let stopPointMarker = null;

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

    // Nếu đã có điểm D trước đó thì xóa marker D cũ
    if (stopPointMarker) {
        stopPointMarker = null;
    }

    // Bây giờ chờ user click 1 nến làm điểm stop point
    alert("Chế độ Stop Point: Vui lòng click 1 nến để chọn điểm Stop Point");

    // Tạo hàm xử lý click chọn điểm Stop Point
    const onStopPointClick = (param) => {
        if (!isStopPointMode) return;
        if (!param.time || !param.seriesData) return;

        // Lấy dữ liệu nến được click
        const candle = param.seriesData.get(candleSeries);
        if (!candle) return;

        // Kiểm tra time click có trong đoạn từ C tới stop point không
        // Tìm index stopPoint trong dataArray
        const stopIndex = dataArray.findIndex(c => c.time === param.time);
        if (stopIndex === -1 || stopIndex <= indexC) {
            alert("Vui lòng chọn nến sau điểm C!");
            return;
        }

        // Tìm điểm D (nến có high lớn nhất từ C đến stop point)
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

        // Lưu điểm D
        window.selectedPointD = {
            label: 'D',
            time: pointD.time,
            high: pointD.high,
            low: pointD.low
        };

        // Tạo marker D màu xanh lá trên chart
        stopPointMarker = {
            time: pointD.time,
            position: 'aboveBar',
            color: 'green',
            shape: 'arrowUp',
            text: 'D'
        };

        // Cập nhật marker trên chart (gộp UP, DOWN, D)
        candleSeries.setMarkers([...upMarkers, ...downMarkers, stopPointMarker]);

        alert(`Đã chọn điểm D (Stop Point) với High = ${pointD.high} tại thời gian ${new Date(pointD.time * 1000).toLocaleTimeString()}`);

        // Tắt chế độ Stop Point và huỷ sự kiện click này
        isStopPointMode = false;
        chart.unsubscribeClick(onStopPointClick);
    };

    // Đăng ký sự kiện click mới cho Stop Point
    chart.subscribeClick(onStopPointClick);
});
