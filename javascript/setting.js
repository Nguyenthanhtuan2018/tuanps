// setting.js

// Cấu hình spacing cho biểu đồ
if (typeof chart !== 'undefined') {
  chart.applyOptions({
    timeScale: {
      barSpacing: 2,          // Mặc định
      minBarSpacing: 0.1,     // Cho phép thu nhỏ hơn nữa
      maxBarSpacing: 30       // Giới hạn zoom lớn
    }
  });
}

// Các tham số cấu hình cho thuật toán sóng
window.waveSettings = {
  ratioAP: 100,    // Tỉ lệ tối đa A/P (%)
  minValueP: 1    // Biên độ tối thiểu của sóng P (>= 6)
};
