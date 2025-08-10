// javascript/resetAll.js
document.getElementById('btnResetAll').addEventListener('click', () => {
    // Xóa markers
    upMarkers = [];
    downMarkers = [];
    candleSeries.setMarkers([]);
    
    // Xóa dữ liệu global A-B-C
    window.selectedPointsUP = [];
    window.downSelection = [];

    // Xóa dữ liệu D-E (UP)
    window.selectedPointD = undefined;
    window.selectedPointE = undefined;
    if (typeof stopPointMarker !== 'undefined') stopPointMarker = null;
    if (typeof stopPointMarkerE !== 'undefined') stopPointMarkerE = null;

    // Xóa dữ liệu D-E (DOWN)
    window.selectedPointDDown = undefined;
    window.selectedPointEDown = undefined;
    if (typeof stopPointDownMarker !== 'undefined') stopPointDownMarker = null;
    if (typeof stopPointDownMarkerE !== 'undefined') stopPointDownMarkerE = null;

    // Reset trạng thái
    isUpMode = false;
    isSelectingDown = false;
    upClickCount = 0;
    downClickCount = 0;

    // Reset label kết quả BC/AB
    const label = document.getElementById('labelABBC');
    if (label) label.textContent = '';

    alert("Đã reset toàn bộ điểm UP, DOWN, D và E");
});
