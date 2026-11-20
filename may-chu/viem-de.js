// Viêm Đế Bảo Tàng — không có trong bản chia sẻ Võ Lâm Idle - HuyHuyy (chức năng làm sau Tống Kim, đã gỡ). Tệp này chỉ còn vỏ để các tệp khác gọi không lỗi.
"use strict";
const khong = () => { const e = new Error("Chức năng này không có trong bản Võ Lâm Idle - HuyHuyy"); e.code = 400; throw e; };
const rong = () => null, sai = () => false, mang = () => [];
module.exports = { lam: khong, dev: khong, nhip: sai, tomTat: rong, nhanPhong: rong, layDi: rong, phongNhip: () => undefined, danhP: rong, cungCho: sai,
  moBiBao: khong, CF: { luot: 0 }, VD: {} };
