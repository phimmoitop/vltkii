// Tham khảo cài đặt Nhặt đồ của người khác (anh 09/11: "nhặt rác này em thêm cho a cái tham khảo cài đặt của ng khác, ví dụ acc anh cài xong r, acc khác có thể tham khảo";
// anh chọn mẫu A — thanh xổ trong thẻ Nhặt đồ, chỉ hiện người đã bấm Chia sẻ). Trợ Thủ (src/game/trothu.js _thamKhao) gọi POST /api/nhat-chia-se:
//   { o, viec: "ds" } xem | { o, viec: "chiaSe", nhat } chia sẻ / chia sẻ lại | { o, viec: "go" } gỡ -> { ds: [{ ten, cap, fac, gio, nhat }] người khác, mới nhất trước; toi: lúc mình chia sẻ | null }
// Lưu du-lieu/nhat-chia-se.json: [{ ten, cap, fac (mã phái | null), luc, nhat }], tối đa TOI_DA người (đầy thì bỏ bản cũ nhất). Bản chụp lúc bấm: đổi cài đặt thì bấm Chia sẻ lại.
// nhat từ trình duyệt nên làm sạch ở đây (sach); người áp dụng còn qua auto.js chuanNhat (chỉ giữ các dòng lọc của game).
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu.js");

const TEP = path.join(D.ROOT, "nhat-chia-se.json"), TOI_DA = 60;
const BANG = (() => { try { const j = JSON.parse(fs.readFileSync(TEP, "utf8")); return Array.isArray(j) ? j : []; } catch { return []; } })();
function ghi() {
  try {
    fs.mkdirSync(D.ROOT, { recursive: true });
    const tmp = TEP + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(BANG));
    fs.renameSync(tmp, TEP);
  } catch (e) { console.error("Không ghi được nhat-chia-se.json:", e.message); }
}

const num = (v, a, b, d) => (v !== null && v !== "" && Number.isFinite(+v) ? Math.max(a, Math.min(b, Math.round(+v))) : d);
const bit = (v, d) => (v == null ? d : v ? 1 : 0);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
function sach(n0) {
  const n = obj(n0), lc = obj(n.loc), ds0 = obj(lc.ds), ds = {};
  for (const k of Object.keys(ds0).slice(0, 64)) if (/^[a-z0-9_]{1,40}$/.test(k)) ds[k] = { on: bit(obj(ds0[k]).on, 0), n: num(obj(ds0[k]).n, 0, 9999, 0) };
  return { kieu: ["rac", "train"].includes(n.kieu) ? n.kieu : "tu", on: bit(n.on, 1), r: num(n.r, 50, 3000, 360), tien: bit(n.tien, 1), thuoc: bit(n.thuoc, 1), trang: bit(n.trang, 1), dong: num(n.dong, 1, 6, 1), trangSuc: bit(n.trangSuc, 0),
    loc: { on: bit(lc.on, 0), ds }, boQua: (Array.isArray(n.boQua) ? n.boQua : []).filter((t) => typeof t === "string").map((t) => t.trim().slice(0, 40)).filter(Boolean).slice(0, 30) };
}

const vn = (ms) => new Date(ms + 7 * 3600e3).toISOString();
const gio = (ms) => { const a = vn(ms); return a.slice(0, 10) === vn(Date.now()).slice(0, 10) ? `lúc ${a.slice(11, 16)}` : `ngày ${a.slice(8, 10)}/${a.slice(5, 7)}`; };

function lam(h, b) {
  const viec = obj(b).viec, i = BANG.findIndex((x) => x.ten === h.name);
  if (viec === "chiaSe") {
    if (i >= 0) BANG.splice(i, 1);
    BANG.push({ ten: h.name, cap: h.lvl || 1, fac: h.fac ?? null, luc: Date.now(), nhat: sach(b.nhat) });
    if (BANG.length > TOI_DA) BANG.sort((x, y) => y.luc - x.luc).length = TOI_DA;
    ghi();
  } else if (viec === "go" && i >= 0) { BANG.splice(i, 1); ghi(); }
  const toi = BANG.find((x) => x.ten === h.name);
  return { ds: BANG.filter((x) => x.ten !== h.name).sort((x, y) => y.luc - x.luc).map((x) => ({ ten: x.ten, cap: x.cap, fac: x.fac, gio: gio(x.luc), nhat: x.nhat })), toi: toi ? gio(toi.luc) : null };
}

module.exports = { lam, sach, TOI_DA };
