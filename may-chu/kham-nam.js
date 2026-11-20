// Khảm nạm Thủy tinh — không có trong bản chia sẻ Võ Lâm Idle - HuyHuyy (chức năng làm sau Tống Kim, đã gỡ). Tệp này chỉ còn vỏ để các tệp khác gọi không lỗi.
"use strict";
const khong = () => { const e = new Error("Chức năng này không có trong bản Võ Lâm Idle - HuyHuyy"); e.code = 400; throw e; };
const rong = () => null, sai = () => false, mang = () => [];
module.exports = { lam: khong, luat: () => ({ bat: false }), cf: () => ({ bat: false, da: {}, kep: {}, luc: {}, hoanLinh: {}, hoanHinh: {}, hoanTinh: {}, tu: [] }),
  quanTri: khong, TEN_MAY: "", kham: khong, muaHl: khong, muaDb: khong, hoanHinh: khong, hoanTinh: khong, vuKhiCung: mang, doiGioi: rong, capKe: rong, gieo: () => ({ d: [], meta: [] }),
  kep: rong, VAI_TRO: {} };
