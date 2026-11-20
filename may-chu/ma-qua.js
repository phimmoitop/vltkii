// Mã kích hoạt (anh 29/10: "thêm vào Lễ Quan chức năng đổi mã kích hoạt, dùng để kích hoạt các mã code mà game cho, nhận quà tương ứng").
// Quản trị tạo mã ở bảng quản trị (F10 — thẻ Mã quà, src/game/quantri.js): quà như Gửi quà (ngân lượng, Xu, vật phẩm — do.js taoQua), số lần
// dùng tối đa của cả máy chủ (0 = không giới hạn), hạn dùng, lời nhắn. Mỗi tài khoản dùng 1 mã 1 lần (nhân vật nào nhận cũng được). Người chơi
// nhập ở Lễ quan Ba Lăng (main.js — khung nhập chữ của client 输入字串界面2.ini) -> POST /api/ma-qua { o, ma } (api.js).
// du-lieu/ma-qua.json = { ma: { MÃ: { qua: { tien, xu, mon: [{ k, n, dong?, he? }] }, loi, toiDa, het (ms, 0 = không hạn), tat, tao: { boi, luc },
//   dung: [{ tk, nv, luc }] } } } — sao lưu hằng ngày cùng tài khoản (du-lieu.js saoLuu).
//   nhap(tk, h, ma)  -> { ds: [quà đã nhận], loi }   ghi vào nhân vật h (nơi gọi lưu tài khoản); mã không có / tắt / hết hạn / hết lượt /
//                       tài khoản đã dùng -> lỗi. Sai SAI_MAX lần trong SAI_MS thì chờ (chống dò mã)
//   quanTri(qt, b)   b.viec: "ds" -> { ds } | "tao" { ma?, tien?, xu?, mon?, loi?, toiDa?, ngay? } -> { msg, ma } | "tat" / "mo" / "xoa" { ma } -> { msg }
//                    | "lay" { ma } -> dữ liệu đưa vào khung sửa | "sua" { ma, tien?, xu?, mon?, loi?, toiDa?, ngay: "giu" | 0 bỏ hạn | n ngày } -> { msg } (anh 09/11: gia hạn, sửa mã đã tạo —
//                      còn hạn thì n ngày cộng vào hạn đang có, hết hạn thì tính từ bây giờ; người đã dùng mã giữ nguyên, vẫn không dùng lại được)
// Mã khóa (anh 11/11 "anh muốn tạo code nhận ra cũng đồ khóa"): tao / sua có khoa: 1 -> qua.kbh = KBH_VV — món nhận từ mã khóa bảo hiểm vĩnh viễn
//   như Gửi thẳng có ô Khóa vĩnh viễn (quan-tri.js quaTat; do.js taoQua — Mật đồ thần bí luôn không khóa; Ngân lượng, Xu không phải món). Sửa bỏ / thêm
//   khóa chỉ áp cho người nhập mã sau đó
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const D = require("./du-lieu");
const DO = require("./do");
const NK = require("./nhat-ky");

const FILE = path.join(D.ROOT, "ma-qua.json");
const SAI_MAX = 10, SAI_MS = 10 * 60e3, LOI_MAX = 100, DUNG_GUI = 50;
const CHU = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // mã tự sinh: bỏ chữ dễ nhầm (O 0, I 1)
const loi = (msg, code = 400) => { throw Object.assign(new Error(msg), { code }); };
const sach = (s, n) => String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
// mã không phân biệt hoa / thường, bỏ khoảng trắng; chữ không dấu, số, - _ (4–32 ký tự)
const chuanMa = (s) => { const k = String(s || "").replace(/\s+/g, "").toUpperCase(); return /^[A-Z0-9_-]{4,32}$/.test(k) ? k : null; };
const sinhMa = () => Array.from({ length: 10 }, () => CHU[crypto.randomInt(CHU.length)]).join("");
const sai = new Map(); // tài khoản -> { n, den }

function doc() {
  try { const j = JSON.parse(fs.readFileSync(FILE, "utf8")); if (j && j.ma && typeof j.ma === "object") return j; } catch {}
  return { ma: {} };
}
function ghi(all) {
  const tmp = FILE + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(all));
  fs.renameSync(tmp, FILE);
}
const tinhTrang = (m, t = Date.now()) => (m.tat ? "tat" : m.het && t > m.het ? "het" : m.toiDa && m.dung.length >= m.toiDa ? "day" : "mo");

function nhap(tk, h, ma0) {
  const t = Date.now(), s = sai.get(tk.ten);
  if (s && s.n >= SAI_MAX && t < s.den) loi(`Nhập sai quá nhiều lần — thử lại sau ${Math.ceil((s.den - t) / 60000)} phút`, 429);
  const k = chuanMa(ma0), all = doc(), m = k && all.ma[k];
  if (!m) { sai.set(tk.ten, { n: s && t < s.den ? s.n + 1 : 1, den: t + SAI_MS }); loi("Mã kích hoạt không đúng"); }
  const tt = tinhTrang(m, t);
  if (tt === "tat") loi("Mã kích hoạt này đã ngừng sử dụng");
  if (tt === "het") loi("Mã kích hoạt này đã hết hạn");
  if (tt === "day") loi("Mã kích hoạt này đã hết lượt sử dụng");
  if (m.dung.some((d) => d.tk === tk.ten)) loi("Tài khoản của bạn đã dùng mã kích hoạt này rồi");
  const ds = DO.taoQua(h, m.qua); // túi không đủ chỗ -> lỗi, túi giữ nguyên
  m.dung.push({ tk: tk.ten, nv: h.name, luc: t });
  ghi(all);
  sai.delete(tk.ten);
  // báo / ghi khóa chỉ khi có món thật sự khóa (soát 11/11: quà chỉ có Mật đồ thần bí + tiền mà tích khóa thì không món nào khóa); có Mật đồ thì ghi "trừ …"
  const kh = monKhoa(m.qua), tru = kh ? truKhoa(m.qua) : "";
  NK.ghi("ma", tk.ten, h.name, `Nhập mã kích hoạt ${k}: ${ds.join(", ")}${kh ? ` (món khóa vĩnh viễn${tru ? `, trừ ${tru}` : ""})` : ""}`);
  return { ds, loi: m.loi || "", ...(kh ? { khoa: 1, ...(tru ? { khoaTru: tru } : {}) } : {}) };
}
const laKhoa = (m) => !!(m.qua && m.qua.kbh); // mã đặt khóa (ô tích ở F10)
const khongKhoa = (x) => DO.NOI.KHONG_KHOA.has(String(x && x.k)); // Mật đồ thần bí: taoQua không bao giờ khóa
const monKhoa = (q) => !!(q && q.kbh) && (q.mon || []).some((x) => !khongKhoa(x));
const truKhoa = (q) => (q.mon || []).filter(khongKhoa).map((x) => DO.tenMon({ k: x.k }).trim()).join(", ");

// quà của mã: thử trên 1 nhân vật trống (món có thật, vừa 1 hành trang) -> { qua đã lọc, ds: chữ quà }
function kiemQua(b) {
  const qua = { tien: Math.max(0, Math.floor(+b.tien || 0)), xu: Math.max(0, Math.floor(+b.xu || 0)),
    mon: (Array.isArray(b.mon) ? b.mon : []).slice(0, 20).map((m) => ({ k: String(m && m.k), n: Math.max(1, m.n | 0), ...(m.dong != null ? { dong: m.dong | 0, he: m.he == null ? -1 : m.he | 0 } : {}) })),
    ...(b.khoa ? { kbh: DO.NOI.KBH_VV } : {}) };
  const ds = DO.taoQua({ bag: [], uN: 0, gold: 0, xu: 0 }, qua);
  return { qua, ds };
}
function tomTat(m) {
  const q = m.qua || {}, ds = (q.mon || []).map((x) => `${x.n} ${DO.tenMon({ k: x.k }).trim()}${x.dong != null ? ` (${x.dong ? x.dong + " dòng" : "trắng"})` : ""}`);
  if (q.tien) ds.push(DO.NOI.tien(q.tien)); if (q.xu) ds.push(`${q.xu} Xu`);
  return ds.join(", ");
}
const chuKhoa = (m) => (laKhoa(m) ? " · món khóa vĩnh viễn" : ""); // nhật ký quản trị
function quanTri(qt, b) {
  const all = doc(), t = Date.now();
  if (b.viec === "ds") {
    return { ds: Object.entries(all.ma).map(([ma, m]) => ({ ma, qua: tomTat(m), ...(laKhoa(m) ? { khoa: 1 } : {}), loi: m.loi || "", toiDa: m.toiDa | 0, daDung: m.dung.length, ai: m.dung.slice(-DUNG_GUI).reverse(),
      het: m.het || 0, tt: tinhTrang(m, t), tao: m.tao })).sort((a, c) => (c.tao.luc || 0) - (a.tao.luc || 0)) };
  }
  if (b.viec === "tao") {
    let k = chuanMa(b.ma);
    if (String(b.ma || "").trim() && !k) loi("Mã chỉ gồm chữ không dấu, số, dấu - và _ (4–32 ký tự)");
    if (!k) do k = sinhMa(); while (all.ma[k]);
    if (all.ma[k]) loi(`Mã ${k} đã có`);
    const { qua } = kiemQua(b), ngay = Math.max(0, Math.min(3650, +b.ngay || 0));
    all.ma[k] = { qua, loi: sach(b.loi, LOI_MAX), toiDa: Math.max(0, Math.min(1e6, b.toiDa | 0)), het: ngay ? t + ngay * 86400e3 : 0, tao: { boi: qt.ten, luc: t }, dung: [] };
    ghi(all);
    NK.ghi("qt", qt.ten, null, `Tạo mã kích hoạt ${k}: ${tomTat(all.ma[k])}${chuKhoa(all.ma[k])}${all.ma[k].toiDa ? ` · ${all.ma[k].toiDa} lượt` : ""}${ngay ? ` · hạn ${ngay} ngày` : ""}`);
    return { msg: `Đã tạo mã ${k}`, ma: k };
  }
  const k = chuanMa(b.ma), m = k && all.ma[k];
  if (!m) loi("Không có mã này", 404);
  if (b.viec === "tat" || b.viec === "mo") {
    m.tat = b.viec === "tat"; if (!m.tat) delete m.tat;
    ghi(all); NK.ghi("qt", qt.ten, null, `${b.viec === "tat" ? "Tắt" : "Mở lại"} mã kích hoạt ${k}`);
    return { msg: `${b.viec === "tat" ? "Đã tắt" : "Đã mở lại"} mã ${k}` };
  }
  if (b.viec === "lay") {
    const q = m.qua || {};
    const mon = (q.mon || []).map((x) => {
      const r = DO.timMon(x.k, 1e9).find((y) => y.k === x.k) || { k: x.k, n: x.k, loai: x.dong != null ? "do" : "chong" }; // món không còn trong game: vẫn hiện để bỏ đi
      return { ...r, so: x.n, ...(r.loai === "do" ? { dong: x.dong == null ? 3 : x.dong, he: x.he == null ? -1 : x.he } : {}) };
    });
    return { ma: k, tien: q.tien || 0, xu: q.xu || 0, mon, khoa: laKhoa(m) ? 1 : 0, loi: m.loi || "", toiDa: m.toiDa | 0, daDung: m.dung.length, het: m.het || 0 };
  }
  if (b.viec === "sua") {
    // trang quản trị cũ (chưa tải lại — không gửi khoa) bấm Lưu: giữ khóa đang có, không lặng lẽ bỏ khóa
    const { qua } = kiemQua({ ...b, khoa: b.khoa == null ? laKhoa(m) : b.khoa });
    let han = "giữ hạn";
    if (b.ngay !== "giu") {
      const ngay = Math.max(0, Math.min(3650, +b.ngay || 0));
      m.het = ngay ? Math.max(m.het || 0, t) + ngay * 86400e3 : 0;
      han = ngay ? `gia hạn ${ngay} ngày` : "bỏ hạn";
    }
    m.qua = qua; m.loi = sach(b.loi, LOI_MAX); m.toiDa = Math.max(0, Math.min(1e6, b.toiDa | 0));
    ghi(all); NK.ghi("qt", qt.ten, null, `Sửa mã kích hoạt ${k}: ${tomTat(m)}${chuKhoa(m)}${m.toiDa ? ` · ${m.toiDa} lượt` : ""} · ${han}`);
    return { msg: `Đã lưu mã ${k}` };
  }
  if (b.viec === "xoa") {
    delete all.ma[k];
    ghi(all); NK.ghi("qt", qt.ten, null, `Xóa mã kích hoạt ${k} (${m.dung.length} lượt đã dùng)`);
    return { msg: `Đã xóa mã ${k}` };
  }
  loi("Việc không rõ");
}

module.exports = { nhap, quanTri, FILE };
