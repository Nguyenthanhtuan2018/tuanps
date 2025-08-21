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
    ratioEFOverDE: { min: 70.00,   max: 180 },
    ratioCDOverBC: { min: 110,   max: 170 },
    ratioDEOverBC: { min: 38,   max: 91 },
    ratioFGOverDE: { min: 32.00,   max: 97 },
  },

  kathy: { // thuật toán sóng kathy (ví dụ chặt hơn ở hồi/thu hẹp)
    ratioBCOverAB: { min: 75,   max: 120 },
    ratioDEOverCD: { min: 0,   max: 999 },
    ratioFGOverEF: { min: 0,   max: 999 },
    ratioEFOverDE: { min: 0,  max: 999 },
    ratioCDOverBC: { min: 75, max: 120 },
    ratioDEOverBC: { min: 0,  max: 999 },
    ratioFGOverDE: { min: 0,  max: 999 },
  },

  sideway: { // thuật toán sóng tiếp diễn 3 nền
    ratioBCOverAB: { min: 35,   max: 87 },
    ratioDEOverCD: { min: 25.00,   max: 85.92 },
    ratioFGOverEF: { min: 30,   max: 80.39 },
    ratioEFOverDE: { min: 70.00,   max: 263.83 },
    ratioCDOverBC: { min: 110,   max: 170 },
    ratioDEOverBC: { min: 38,   max: 91 },
    ratioFGOverDE: { min: 32.00,   max: 97 },
  },
  con_meo: { // thuật toán sóng tiếp diễn con mèo
    ratioBCOverAB: { min: 29,   max: 70 },   
    ratioDEOverCD: { min: 25,   max: 160 },  
    ratioFGOverEF: { min: 30,   max: 90 },   
    ratioEFOverDE: { min: 50,   max: 170 }, 
    ratioCDOverBC: { min: 60,   max: 170 },   
    ratioDEOverBC: { min: 66,   max: 100 },   
    ratioFGOverDE: { min: 32,   max: 100 },
  },
  xanh_duong: {
  ratioBCOverAB: { min: 29,   max: 60 },
  ratioDEOverCD: { min: 55,   max: 97 },
  ratioFGOverEF: { min: 38,   max: 86 },
  ratioEFOverDE: { min: 54, max: 200 },
  ratioCDOverBC: { min: 54.5, max: 101 },
  ratioDEOverBC: { min: 32,   max: 100 },
  ratioFGOverDE: { min: 44,   max: 100 },
  },
  rule_10: {
  ratioBCOverAB: { min: 56,   max: 75 }, 
  ratioDEOverCD: { min: 38,   max: 71 }, 
  ratioFGOverEF: { min: 40,   max: 89 }, 
  ratioEFOverDE: { min: 80,   max: 87 }, 
  ratioCDOverBC: { min: 131,  max: 169 }, 
  ratioDEOverBC: { min: 65,   max: 98 }, 
  ratioFGOverDE: { min: 34,   max: 76 }, 
  },
  rule_11: { // Rule 11 cho xanh lá (dự kiến cho 3 nền nếu được)
    ratioBCOverAB: { min: 35,   max: 57 },
    ratioDEOverCD: { min: 32,   max: 68 },
    ratioFGOverEF: { min: 35,   max: 75 },
    ratioEFOverDE: { min: 117,   max: 158 },
    ratioCDOverBC: { min: 111,   max: 162 },
    ratioDEOverBC: { min: 38,   max: 91 },
    ratioFGOverDE: { min: 50,   max: 87 },
  },
  rule_11_3nen: { // rule 11 cho TH 3 nền
    ratioBCOverAB: { min: 48,   max: 72 },
    ratioDEOverCD: { min: 39,   max: 73 },
    ratioFGOverEF: { min: 32,   max: 52 },
    ratioEFOverDE: { min: 186,  max: 264 },
    ratioCDOverBC: { min: 113,  max: 167 },
    ratioDEOverBC: { min: 56,   max: 90 },
    ratioFGOverDE: { min: 62,   max: 96 },
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
