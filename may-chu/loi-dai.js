// Lôi Đài Công Bình Tử — không có trong bản chia sẻ Võ Lâm Idle - HuyHuyy (chức năng làm sau Tống Kim, đã gỡ). Tệp này chỉ còn vỏ để các tệp khác gọi không lỗi.
"use strict";
const khong = () => { const e = new Error("Chức năng này không có trong bản Võ Lâm Idle - HuyHuyy"); e.code = 400; throw e; };
const rong = () => null, sai = () => false, mang = () => [];
module.exports = { lam: khong, quanTri: khong, nhip: rong, cungCho: sai, cpCua: rong, trongSan: sai, chan: sai, roiGame: rong, soSanBan: () => 0,
  cf: () => ({ bat: false }), laSan: sai, KIND: "lôi đài", boNop: rong, thu: khong, sanTrong: () => 0, banTk: rong, moTiThi: khong, ttChoVao: rong, huyTiThi: rong };
