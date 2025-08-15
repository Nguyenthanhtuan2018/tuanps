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
  tiep_dien: { // thuật toán sóng tiếp diễn tăng/giảm dần
    ratioBCOverAB: { min: 0,   max: 70 },
    ratioDEOverCD: { min: 0,   max: 70 },
    ratioFGOverEF: { min: 0,   max: 75 },
    ratioEFOverDE: { min: 70,  max: 200 },
    ratioCDOverBC: { min: 120, max: 200 }, // bạn vừa nâng min=120
    ratioDEOverBC: { min: 35,  max: 99 },
    ratioFGOverDE: { min: 50,  max: 99 },
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

  sideway: { // thuật toán sóng tiếp diễn dạng sideway (thoáng hơn)
    ratioBCOverAB: { min: 0,   max: 75 },
    ratioDEOverCD: { min: 0,   max: 75 },
    ratioFGOverEF: { min: 0,   max: 80 },
    ratioEFOverDE: { min: 65,  max: 210 },
    ratioCDOverBC: { min: 110, max: 220 },
    ratioDEOverBC: { min: 35,  max: 100 },
    ratioFGOverDE: { min: 50,  max: 99 },
  },
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
