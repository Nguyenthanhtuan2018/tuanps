// setting.js

// Cấu hình spacing cho biểu đồ
if (typeof chart !== 'undefined') {
  chart.applyOptions({
    timeScale: {
      barSpacing: 2,          // Mặc định
      minBarSpacing: 0.01,     // Cho phép thu nhỏ hơn nữa
      maxBarSpacing: 30       // Giới hạn zoom lớn
    }
  });
}

// Các tham số cấu hình cho thuật toán sóng
window.waveSettings = {
  ratioBCOverAB: 60,  // Ngưỡng so sánh BC/AB (%)
  ratioDEOverCD: 70,  // Ngưỡng so sánh DE/CD (%)
  ratioFGOverEF: 70,  // Ngưỡng so sánh FG/EF (%)
  ratioEFOverDE: 70,  // Ngưỡng so sánh EF/DE (%)
  ratioCDOverBC: 70   // Ngưỡng so sánh CD/BC (%)
};
