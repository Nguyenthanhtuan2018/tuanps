// javascript/resetAll.js
document.getElementById('btnResetAll').addEventListener('click', () => {
    // Xóa markers
    upMarkers = [];
    downMarkers = [];
    candleSeries.setMarkers([]);
    
    // Xóa dữ liệu global
    window.selectedPointsUP = [];
    window.downSelection = [];
    
    // Reset trạng thái
    isUpMode = false;
    isSelectingDown = false;
    upClickCount = 0;
    downClickCount = 0;

    // Reset label kết quả BC/AB
    const label = document.getElementById('labelABBC');
    if (label) label.textContent = '';

    alert("Đã reset toàn bộ điểm UP và DOWN");
});
