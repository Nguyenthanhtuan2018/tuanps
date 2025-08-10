// stopPointUpHandler.js

// Biến trạng thái Stop Point cho UP
let isStopPointMode = false;
let stopPointMarker = null;
let stopPointMarkerE = null;
let stopPointFMarker = null; // marker cho điểm F

document.getElementById('btnStopPointUp').addEventListener('click', () => {
    if (!Array.isArray(window.selectedPointsUP) || window.selectedPointsUP.length < 3) {
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

    // Xóa marker D/E/F cũ trong state (render sẽ cập nhật lại)
    stopPointMarker = null;
    stopPointMarkerE = null;
    stopPointFMarker = null;

    alert("Chế độ Stop Point: Vui lòng click 1 nến để chọn điểm Stop Point");

    // Hàm xử lý click chọn điểm Stop Point
    const onStopPointClick = (param) => {
        if (!isStopPointMode) return;
        if (!param?.time || !param?.seriesData) return;

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

        // Marker E (nếu có) và Tìm F (high max từ E → stop point)
        stopPointMarkerE = null;
        stopPointFMarker = null;

        if (pointE) {
            stopPointMarkerE = {
                time: pointE.time,
                position: 'belowBar',
                color: 'orange',
                shape: 'arrowDown',
                text: 'E'
            };

            const indexE = dataArray.findIndex(c => c.time === pointE.time);
            if (indexE !== -1 && stopIndex > indexE) {
                let maxHighF = -Infinity;
                let pointF = null;
                for (let i = indexE + 1; i <= stopIndex; i++) {
                    if (dataArray[i].high > maxHighF) { // chọn F sớm nhất khi bằng nhau
                        maxHighF = dataArray[i].high;
                        pointF   = dataArray[i];
                    }
                }
                if (pointF) {
                    // Lưu & marker F
                    window.selectedPointF = {
                        label: 'F',
                        time: pointF.time,
                        high: pointF.high,
                        low: pointF.low
                    };
                    stopPointFMarker = {
                        time: pointF.time,
                        position: 'aboveBar',
                        color: 'purple',
                        shape: 'circle',
                        text: 'F'
                    };

                    // ===== EF/DE trên #labelDEEF =====
                    // EF = |low.E - high.F|, DE = |high.D - low.E|
                    const EF = Math.abs(pointE.low - pointF.high);
                    const DE = Math.abs(pointD.high - pointE.low);
                    const ratio = DE === 0 ? Infinity : (EF / DE) * 100;

                    const ratioThreshold = (window.waveSettings && typeof window.waveSettings.ratioEFOverDE === 'number')
                        ? window.waveSettings.ratioEFOverDE
                        : 70; // mặc định 70%

                    const label = document.getElementById('labelDEEF');
                    if (label) {
                        const ratioText = Number.isFinite(ratio) ? ratio.toFixed(2) : '∞';
                        if (ratio > ratioThreshold) {
                            label.textContent = `EF/DE: ĐẠT (${ratioText}%)`;
                            label.style.color = 'green';
                        } else {
                            
                            label.textContent = `EF/DE: KHÔNG ĐẠT (${ratioText}%)`;
                            label.style.color = 'red';
                        }
                    }
                } else {
                    window.selectedPointF = undefined;
                    const label = document.getElementById('labelDEEF');
                    if (label) { label.textContent = ''; label.style.color = ''; }
                }
            } else {
                window.selectedPointF = undefined;
                const label = document.getElementById('labelDEEF');
                if (label) { label.textContent = ''; label.style.color = ''; }
            }
        } else {
            // Không có E ⇒ không tính F và không tính EF/DE
            window.selectedPointF = undefined;
            const label = document.getElementById('labelDEEF');
            if (label) { label.textContent = ''; label.style.color = ''; }
        }

        // Gộp markers AN TOÀN (không dựa vào window.upMarkers/downMarkers)
        const baseMarkers = [];
        if (typeof upMarkers !== 'undefined' && Array.isArray(upMarkers)) {
            baseMarkers.push(...upMarkers); // giữ A/B/C
        }
        if (typeof downMarkers !== 'undefined' && Array.isArray(downMarkers)) {
            baseMarkers.push(...downMarkers);
        }
        if (stopPointMarker)  baseMarkers.push(stopPointMarker);
        if (stopPointMarkerE) baseMarkers.push(stopPointMarkerE);
        if (stopPointFMarker) baseMarkers.push(stopPointFMarker);

        candleSeries.setMarkers(baseMarkers);

        // Thông điệp
        let msg = `Đã chọn D (High = ${pointD.high})`;
        if (pointE) msg += `, E (Low = ${pointE.low})`;
        if (window.selectedPointF) msg += `, F (High = ${window.selectedPointF.high})`;
        msg += ` tại ~ ${new Date(pointD.time * 1000).toLocaleTimeString('vi-VN', { hour12: false })}`;
        alert(msg);

        isStopPointMode = false;
        chart.unsubscribeClick(onStopPointClick);
    };

    // Đăng ký sự kiện click mới cho Stop Point
    chart.subscribeClick(onStopPointClick);
});
