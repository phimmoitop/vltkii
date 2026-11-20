// Bảo trì máy chủ (anh 31/10 khuya: "cho S1 vào trạng thái bảo trì, mai 13:00 Việt Nam chính thức mở máy chủ — trong quá trình đó chỉ có admin
// được quyền truy cập game"). Đang bảo trì: tài khoản thường không đăng nhập được, phiên đang mở bị trả về màn đăng nhập (api.js: mã "bao-tri"),
// kênh tức thời từ chối; tài khoản quản trị chơi bình thường. Tới giờ den thì tự mở (không cần khởi động lại). Bật / tắt / đổi giờ: bảng quản trị
// F10 (quan-tri.js "bao-tri").
//   con()           -> { den, loi } đang bảo trì | null
//   tomTat()        -> { den, cau } | null  (màn đăng nhập — /api/trang-thai)
//   cau()           -> câu báo cho người chơi
//   dat(qt, b)      b = { bat, den?, loi? } -> trạng thái mới
// du-lieu/bao-tri.json = { bat, den (ms, 0 = tới khi quản trị tắt), loi?, boi, luc }
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu");
const NK = require("./nhat-ky");

const TEP = path.join(D.ROOT, "bao-tri.json");
let S = (() => { try { return JSON.parse(fs.readFileSync(TEP, "utf8")); } catch { return { bat: false }; } })();
const p2 = (n) => String(n).padStart(2, "0");
const gioVN = (t) => { const d = new Date(t + 7 * 3600e3); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} ngày ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}`; };

function ghi() { try { fs.mkdirSync(D.ROOT, { recursive: true }); fs.writeFileSync(TEP, JSON.stringify(S)); } catch (e) { console.error("Ghi bảo trì lỗi: " + e.message); } }
function con() {
  if (!S.bat) return null;
  if (S.den && Date.now() >= S.den) { // hết giờ bảo trì: tự mở
    S = { ...S, bat: false, moLuc: Date.now() }; ghi();
    NK.ghi("qt", S.boi || null, null, "Hết giờ bảo trì — máy chủ tự mở cho mọi người");
    return null;
  }
  return S;
}
const cau = () => { const s = con(); return s ? `Máy chủ đang bảo trì${s.den ? ` — mở lúc ${gioVN(s.den)} (giờ Việt Nam)` : ""}.${s.loi ? ` ${s.loi}${/[.!?]$/.test(s.loi) ? "" : "."}` : ""} Hẹn gặp lại!` : ""; };
const tomTat = () => { const s = con(); return s ? { den: s.den || 0, cau: cau() } : null; };
function dat(qt, b) {
  if (b.bat) {
    const den = Math.max(0, Math.floor(+b.den || 0));
    if (den && den <= Date.now()) throw Object.assign(new Error("Giờ mở đã qua — chọn giờ sau bây giờ"), { code: 400 });
    S = { bat: true, den, loi: String(b.loi || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 120), boi: qt.ten, luc: Date.now() };
    NK.ghi("qt", qt.ten, null, `Bật bảo trì${den ? ` tới ${gioVN(den)}` : " (tới khi tắt)"}`);
  } else {
    S = { bat: false, boi: qt.ten, luc: Date.now() };
    NK.ghi("qt", qt.ten, null, "Tắt bảo trì — mở cho mọi người");
  }
  ghi();
  return tomTat();
}

module.exports = { con, cau, tomTat, dat, gioVN };
