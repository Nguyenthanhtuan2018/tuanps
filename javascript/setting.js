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
  ratioBCOverAB: 70,  // BC/AB (%) <= ratioBCOverAB => ĐẠT
  ratioDEOverCD: 70,  // DE/CD (%) <= ratioDEOverCD => ĐẠT
  ratioFGOverEF: 75,  // FG/EF (%) <= ratioFGOverEF => ĐẠT
  ratioEFOverDE: 70,  // EF/DE (%) >= ratioEFOverDE => ĐẠT
  ratioCDOverBC: 110, // CD/BC (%) >= ratioCDOverBC => ĐẠT
  ratioDEOverBC: 35,  // DE/BC (%) >= ratioDEOverBC => ĐẠT 
  ratioFGOverDE: 50,  // FG/DE (%) >= ratioFGOverDE => ĐẠT
  ratioFGOverDECap: 99,  // FG/DE (%) > ratioFGOverDECap => KHÔNG ĐẠT
  ratioEFOverDECap: 270,  // EF/DE (%) > ratioEFOverDECap => KHÔNG ĐẠT
  ratioEFOverDECapDown: 200,  // EF/DE (%) > ratioEFOverDECapDown => KHÔNG ĐẠT
  ratioCDOverBCUpCap: 200,     // CD/BC >= ratioCDOverBCUpCap => KHÔNG ĐẠT
  ratioCDOverBCDownCap: 200,   // CD/BC >= ratioCDOverBCDownCap => KHÔNG ĐẠT
};
