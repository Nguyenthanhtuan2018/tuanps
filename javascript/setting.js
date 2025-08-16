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

// settings.js

// === 3 bộ rule dạng MIN–MAX cho cùng một schema ===
// Bạn có thể chỉnh số cho hợp dữ liệu thực tế
window.waveProfiles = {
  tiep_dien: { // thuật toán sóng tiếp diễn xanh lá
    ratioBCOverAB: { min: 35,   max: 70 },
    ratioDEOverCD: { min: 25.00,   max: 85.92 },
    ratioFGOverEF: { min: 35,   max: 80.39 },
    ratioEFOverDE: { min: 70.00,   max: 170 },
    ratioCDOverBC: { min: 110,   max: 170 },
    ratioDEOverBC: { min: 38,   max: 91 },
    ratioFGOverDE: { min: 32.00,   max: 95.56 },
  },

  kathy: { // thuật toán sóng kathy (ví dụ chặt hơn ở hồi/thu hẹp)
    ratioBCOverAB: { min: 0,   max: 65 },
    ratioDEOverCD: { min: 0,   max: 65 },
    ratioFGOverEF: { min: 0,   max: 70 },
    ratioEFOverDE: { min: 75,  max: 190 },
    ratioCDOverBC: { min: 125, max: 200 },
    ratioDEOverBC: { min: 50,  max: 90 },
    ratioFGOverDE: { min: 70,  max: 95 },
  },

  sideway: { // thuật toán sóng tiếp diễn 3 nền
    ratioBCOverAB: { min: 35,   max: 72 },
    ratioDEOverCD: { min: 25.00,   max: 85.92 },
    ratioFGOverEF: { min: 30,   max: 80.39 },
    ratioEFOverDE: { min: 70.00,   max: 263.83 },
    ratioCDOverBC: { min: 110,   max: 170 },
    ratioDEOverBC: { min: 38,   max: 91 },
    ratioFGOverDE: { min: 32.00,   max: 95.56 },
  },
  con_meo: { // thuật toán sóng tiếp diễn con mèo
    ratioBCOverAB: { min: 29,   max: 70 },   
    ratioDEOverCD: { min: 25,   max: 160 },  
    ratioFGOverEF: { min: 30,   max: 90 },   
    ratioEFOverDE: { min: 50,   max: 170 }, 
    ratioCDOverBC: { min: 60,   max: 170 },   
    ratioDEOverBC: { min: 38,   max: 100 },   
    ratioFGOverDE: { min: 32,   max: 100 },
  }
};

// === preset đang chọn (mặc định) ===
window.waveActiveProfile = "tiep_dien";

// === API đổi preset (có thể gọi từ UI) ===
window.setWaveProfile = function(name) {
  if (!window.waveProfiles?.[name]) return false;
  window.waveActiveProfile = name;
  // gọi rerender nếu panel đã load
  window.upRatioPanel?.rerender?.();
  window.downRatioPanel?.rerender?.();
  return true;
};
