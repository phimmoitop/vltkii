// Bầu Cua — không có trong bản chia sẻ Võ Lâm Idle - HuyHuyy (chức năng làm sau Tống Kim, đã gỡ). Tệp này chỉ còn vỏ để các tệp khác gọi không lỗi.
"use strict";
const khong = () => { const e = new Error("Chức năng này không có trong bản Võ Lâm Idle - HuyHuyy"); e.code = 400; throw e; };
const rong = () => null, sai = () => false, mang = () => [];
module.exports = { lam: khong, trangThai: rong, capNhat: sai, quanTri: khong, nhipCon: rong, lich: rong, lac: rong, tienThang: () => 0, CF: { bat: false },
  MAT: ["Bầu", "Cua", "Tôm", "Cá", "Gà", "Nai"] };
