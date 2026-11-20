// Trợ Thủ tự làm nhiệm vụ hằng ngày (anh 03/11: "thiết kế tiện ích tự hoàn thành dã tẩu trong ngày, tự săn sát thủ, phí mỗi lần hoàn thành 40 nv là
// 10 xu, hoàn thành sát thủ toàn bộ 5 xu, mở khóa xong là dc dùng trong ngày, ngắt quãng cũng k sao … auto tự làm tự mua các item cần thiết và hoàn
// thành nhiệm vụ, boss sát thủ thì chọn loại bằng cấp nhân vật" — Trợ Thủ → Tiện ích → Nhiệm vụ ngày). Mở khóa theo ngày Việt Nam (như giới hạn ngày
// của Dã Tẩu / Nhiếp Thí Trần): trả Xu 1 lần, cả ngày dùng — tắt bật, thoát game, đứt mạng giữa chừng vẫn còn. Trình duyệt (src/game/tulam.js) đi lại,
// đánh quái như người chơi; đứng trước NPC thì gọi 1 bước ở đây (da-tau.js / sat-thu.js buocTu — cùng luật hội thoại); máy chủ chỉ làm bước khi hôm nay
// đã mở khóa. Số Xu: cau-hinh.json tuLam.
// h.tuLam (máy chủ giữ — api.js GIU): { ngay (ngày Việt Nam), dt: 0 | 1 (Dã Tẩu đã mở khóa), st: 0 | 1 (Sát thủ) }
"use strict";
const DO = require("./do.js");
const DTAU = require("./da-tau.js");
const SAT = require("./sat-thu.js");
const NK = require("./nhat-ky.js");

const N = DO.NOI, loi = N.loi;
const CF = { daTau: { xu: 10 }, satThu: { xu: 5 }, ...(N.CFG.tuLam || {}) };
const TEN = { dt: "tự làm Dã Tẩu", st: "tự săn Boss Sát thủ" };
const gia = (k) => Math.max(0, (k === "st" ? CF.satThu.xu : CF.daTau.xu) | 0);
// trạng thái hôm nay (sang ngày mới: khóa lại)
function tt(h) {
  const T = h.tuLam && typeof h.tuLam === "object" ? h.tuLam : (h.tuLam = {}), hom = N.ngayVN(Date.now());
  if (T.ngay !== hom) { T.ngay = hom; T.dt = 0; T.st = 0; }
  return T;
}
// gửi kèm nhân vật (api.js nvCua -> hero.tl): đã mở khóa hôm nay + giá
const tomTat = (h) => { const T = h.tuLam || {}, hn = T.ngay === N.ngayVN(Date.now()); return { ngay: N.ngayVN(Date.now()), dt: hn ? T.dt | 0 : 0, st: hn ? T.st | 0 : 0, gia: { dt: gia("dt"), st: gia("st") } }; };

// b.viec: "mo" (+ loai "dt" | "st": trả Xu mở khóa hôm nay) | "dt" (1 bước Dã Tẩu — b.thuong, b.giuHuy, b.gian, b.huy: da-tau.js buocTu) | "st" (1 bước
// Sát thủ); tk = tên tài khoản (nhật ký)
function lam(h, b, tk) {
  const viec = String(b.viec || "");
  if (viec === "mo") {
    const k = b.loai === "st" ? "st" : "dt", T = tt(h), g = gia(k);
    if (T[k]) return { msg: `Hôm nay đã mở khóa ${TEN[k]}`, tl: tomTat(h) };
    if ((h.xu | 0) < g) loi(`Cần ${g} Xu để mở khóa ${TEN[k]} hôm nay (trên người có ${h.xu | 0} Xu)`);
    h.xu = (h.xu | 0) - g; T[k] = 1;
    NK.ghi("xu", tk, h.name, `Trợ Thủ: mở khóa ${TEN[k]} hôm nay (${g} Xu)`);
    return { msg: `Đã mở khóa ${TEN[k]} cả hôm nay — trừ ${g} Xu`, tl: tomTat(h) };
  }
  if (viec === "dt" || viec === "st") {
    if (!tt(h)[viec]) loi(`Chưa mở khóa ${TEN[viec]} hôm nay (Trợ Thủ → Tiện ích → Nhiệm vụ ngày)`);
    const r = viec === "dt"
      ? DTAU.buocTu(h, { thuong: ["kn", "vat", "tien"].includes(b.thuong) ? b.thuong : "kn", giuHuy: Math.max(0, Math.min(10, b.giuHuy | 0)), gian: b.gian ? 1 : 0, huy: b.huy === "lai" ? "lai" : "dung" })
      : SAT.buocTu(h);
    if (r.mua) NK.ghi("cho", tk, h.name, `Trợ Thủ mua ${r.mua.ten} (Dã Tẩu: ${r.mua.yc}) — ${r.mua.noi} — ${N.tien(r.mua.gia)}`);
    return { ...r, tl: tomTat(h) };
  }
  loi("Việc không rõ");
}

module.exports = { lam, tomTat, CF };
