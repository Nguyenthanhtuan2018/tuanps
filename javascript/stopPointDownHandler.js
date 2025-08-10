// stopPointDownHandler.js

// Biến trạng thái Stop Point cho DOWN
let isStopPointDownMode = false;
let stopPointDownMarker = null;

document.getElementById('btnStopPointDown').addEventListener('click', () => {
    if (window.downSelection.length < 3) {
        alert("Vui lòng chọn đủ 3 điểm A, B, C cho DOWN trước khi tìm Stop Point!");
        return;
    }
    isStopPointDownMode = true;
    alert("Chế độ Stop Point DOWN: hãy click 1 lần vào nến để chọn điểm stop point.");

    // Khi ở chế độ Stop Point DOWN, chờ click chọn stop point
    const onClick = (param) => {
        if (!isStopPointDownMode) return;
        if (!param.time || !param.seriesData) return;

        // Lấy dữ liệu giá nến tại thời điểm click
        const priceData = param.seriesData.get(candleSeries);
        if (!priceData) return;

        // Lấy dữ liệu nến theo khung thời gian hiện tại
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

        // Tìm index điểm C trong dữ liệu
        const C = window.downSelection[2];
        const indexC = dataArray.findIndex(c => c.time === C.time);
        if (indexC === -1) {
            alert("Không tìm thấy điểm C trong dữ liệu!");
            isStopPointDownMode = false;
            chart.unsubscribeClick(onClick);
            return;
        }

        // Tìm index điểm stopPoint trong dữ liệu
        const indexStopPoint = dataArray.findIndex(c => c.time === param.time);
        if (indexStopPoint === -1 || indexStopPoint <= indexC) {
            alert("Điểm Stop Point phải nằm sau điểm C!");
            return; // không thoát mode, chờ chọn lại
        }

        // Quét từ C đến stop point để tìm nến có low thấp nhất làm điểm D
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

        // Lưu điểm D
        window.selectedPointDDown = {
            label: 'D',
            time: pointD.time,
            high: pointD.high,
            low: pointD.low
        };

        // Tạo marker điểm D (màu xanh lá, dưới nến)
        stopPointDownMarker = {
            time: pointD.time,
            position: 'belowBar',
            color: 'green',
            shape: 'arrowDown',
            text: 'D'
        };

        // Cập nhật marker mới, giữ marker UP, DOWN và D
        candleSeries.setMarkers([...upMarkers, ...downMarkers, stopPointMarker, stopPointDownMarker].filter(Boolean));

        alert(`Đã chọn điểm D (Stop Point DOWN) với Low = ${pointD.low} tại thời gian ${new Date(pointD.time * 1000).toLocaleTimeString()}`);

        // Hủy chế độ Stop Point DOWN, huỷ sự kiện click này
        isStopPointDownMode = false;
        chart.unsubscribeClick(onClick);
    };

    // Đăng ký lắng nghe click chart cho Stop Point DOWN
    chart.subscribeClick(onClick);
});
