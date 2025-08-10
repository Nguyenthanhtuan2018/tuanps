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
    if (typeof stopPointMarker !== 'undefined')  stopPointMarker = null;   // D (UP)
    if (typeof stopPointMarkerE !== 'undefined') stopPointMarkerE = null; // E (UP)

    // Xóa dữ liệu D-E (DOWN)
    window.selectedPointDDown = undefined;
    window.selectedPointEDown = undefined;
    if (typeof stopPointDownMarker !== 'undefined')  stopPointDownMarker = null;   // D (DOWN)
    if (typeof stopPointDownMarkerE !== 'undefined') stopPointDownMarkerE = null;  // E (DOWN)

    // *** MỚI: Xóa dữ liệu F ***
    // UP
    window.selectedPointF = undefined;
    if (typeof stopPointFMarker !== 'undefined') stopPointFMarker = null;
    // DOWN
    window.selectedPointFDown = undefined;
    if (typeof stopPointDownFMarker !== 'undefined') stopPointDownFMarker = null;

    // UP
    window.selectedPointG = undefined;
    if (typeof stopPointGMarker !== 'undefined') stopPointGMarker = null;

    // DOWN
    window.selectedPointGDown = undefined; 
    if (typeof stopPointDownGMarker !== 'undefined') stopPointDownGMarker = null;


    // Reset trạng thái
    isUpMode = false;
    isSelectingDown = false;
    upClickCount = 0;
    downClickCount = 0;

    // Reset label kết quả BC/AB
    const label = document.getElementById('labelABBC');
    if (label) {
        label.textContent = '';
        label.style.color = '';
    }
    // Reset label EF/DE
    const labelDEEF = document.getElementById('labelDEEF');
    if (labelDEEF) {
    labelDEEF.textContent = '';
    labelDEEF.style.color = '';
    }

    alert("Đã reset A, B, C, D, E, F (UP & DOWN)");
});
