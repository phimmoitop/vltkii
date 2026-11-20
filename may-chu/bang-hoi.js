// Bang hội — không có trong bản chia sẻ Võ Lâm Idle - HuyHuyy (chức năng làm sau Tống Kim, đã gỡ). Tệp này chỉ còn vỏ để các tệp khác gọi không lỗi.
"use strict";
const khong = () => { const e = new Error("Chức năng này không có trong bản Võ Lâm Idle - HuyHuyy"); e.code = 400; throw e; };
const rong = () => null, sai = () => false, mang = () => [];
module.exports = { lam: khong, nhip: () => ({}), nhan: rong, idCua: rong, cuaNv: rong, datKhu: rong, bangTheoId: rong, xoaNv: rong, xoaTk: mang,
  khoaKho: rong, quanTri: khong, dsXepHang: mang, ganKiemTen: rong, xa: rong, CF: { bat: false }, TEN_CV: {}, TEN_PHE: {}, cong: rong, quai: rong, nhanCho: rong,
  chanRtb: rong, teDanNay: rong, VAN: 10000 };
