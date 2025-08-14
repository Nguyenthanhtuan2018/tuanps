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
  ratioBCOverAB: 70,  // Ngưỡng so sánh BC/AB (%) <= ratioBCOverAB => ĐẠT
  ratioDEOverCD: 70,  // Ngưỡng so sánh DE/CD (%) <= ratioDEOverCD => ĐẠT
  ratioFGOverEF: 75,  // Ngưỡng so sánh FG/EF (%) <= ratioFGOverEF => ĐẠT
  ratioEFOverDE: 70,  // Ngưỡng so sánh EF/DE (%) >= ratioEFOverDE => ĐẠT
  ratioCDOverBC: 120,  // Ngưỡng so sánh CD/BC (%) >= ratioCDOverBC => ĐẠT
  ratioDEOverBC: 60,  // Ngưỡng so sánh DE/BC (%) >= ratioDEOverBC => ĐẠT
  ratioFGOverDE: 60,  // Ngưỡng so sánh FG/DE (%) >= ratioFGOverDE => ĐẠT
  ratioFGOverDECap: 99,  // Ngưỡng so sánh FG/DE (%) > ratioFGOverDECap => KHÔNG ĐẠT
  ratioEFOverDECap: 270,  // Ngưỡng so sánh EF/DE (%) > ratioEFOverDECap => KHÔNG ĐẠT
  ratioEFOverDECapDown: 200,  // Ngưỡng so sánh EF/DE (%) > ratioEFOverDECapDown => KHÔNG ĐẠT
};
