// Sự kiện Báo Đáp Ân Sư — không có trong bản chia sẻ Võ Lâm Idle - HuyHuyy (chức năng làm sau Tống Kim, đã gỡ). Tệp này chỉ còn vỏ để các tệp khác gọi không lỗi.
"use strict";
const khong = () => { const e = new Error("Chức năng này không có trong bản Võ Lâm Idle - HuyHuyy"); e.code = 400; throw e; };
const rong = () => null, sai = () => false, mang = () => [];
const LUAT = { dang: false };
module.exports = { khoa72: rong, k72Bao: rong, cf: () => ({ kyNang: { toiDa: 0 } }), dang: sai, moHb: khong, luat: () => LUAT, thuongNguon: mang, ruouDauLinh: rong,
  roiChi: rong, lam: khong, moHuongBao: khong, nenDoi: rong, nhanNen: rong, heSoNen: () => 1, ccCon: mang, huongDan: rong, MD: {},
  RUOU: "ms:2572", TRA: "ms:2573", TO: "ms:2574", CHI: "ms:2575", TDUOC: "ms:2576", NEN: "ms:1817", HB: {} };
