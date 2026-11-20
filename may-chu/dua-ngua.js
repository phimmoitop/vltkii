// Truy Phong Đại Loạn Đấu — đua ngựa — không có trong bản chia sẻ Võ Lâm Idle - HuyHuyy (chức năng làm sau Tống Kim, đã gỡ). Tệp này chỉ còn vỏ để các tệp khác gọi không lỗi.
"use strict";
const khong = () => { const e = new Error("Chức năng này không có trong bản Võ Lâm Idle - HuyHuyy"); e.code = 400; throw e; };
const rong = () => null, sai = () => false, mang = () => [];
module.exports = { lam: khong, quanTri: khong, thu: khong, nhip: rong, trangThai: rong, lich: rong, CF: { bat: false }, cf: () => ({ bat: false }),
  MAP: 863, KIND: "đua ngựa", BL: 53, BL_VE: [7380, 4120], dangCo: sai, laDuong: sai, moBaoDanh: khong, batDau: khong, ketThuc: khong };
