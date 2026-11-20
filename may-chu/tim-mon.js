// F10 → Tìm món (anh 18/11 tối — "sao mà anh làm admin mà ng chơi lấy đồ từ đâu cũng k biết"): quét trang bị của MỌI tài khoản trên máy này (mặc, túi, rương,
// rương mở rộng, túi tử mẫu, sạp chợ trời) — chỉ đọc, không sửa gì.
//   tim({ q, loc, nguon, n }) -> { quet, tong, ds: [{ tk, nv, noi, it, nd, nMax, n90 }], trung: [{ g, so, ds: [{ tk, nv, noi, n }] }], cat? }
//     q: tên món (không dấu, chứa) hoặc đúng mã món (g — may-chu/nguon-mon.js) · loc: "" | "cao" (≥ 4 dòng ≥ 90 % mức cao nhất) | "max" (mọi dòng ở mức
//     cao nhất, ≥ 3 dòng) · nguon: "" | "?" (không rõ nguồn) | "qt" (quản trị tạo) | "cu" (có từ trước khi gắn nguồn) | "moi" (đã gắn nguồn từ bản này)
//     · trung: mã món có ở ≥ 2 chỗ (đồ bị nhân bản — chỉ thấy với món mang mã; đồ cũ mỗi bản được gắn mã riêng lúc chuẩn hóa)
// Mức cao nhất của 1 dòng = số lớn nhất của thuộc tính đó trên loại món ấy trong bảng dòng xanh client (dong-xanh.json — mọi cấp dòng, mọi hệ).
"use strict";
const D = require("./du-lieu");
const DO = require("./do");

const N = DO.NOI, TRAN = 300, TRUNG_TRAN = 50;
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const MAX = new Map(); // "loại|khóa dòng" -> số lớn nhất
function maxDong(t, k) {
  const key = t + "|" + k;
  if (!MAX.has(key)) { let m = 0; for (const r of N.ROWS[t] || []) if (r.k === k && r.p[0][1] > m) m = r.p[0][1]; MAX.set(key, m || null); }
  return MAX.get(key);
}
// số dòng / dòng ở mức cao nhất / dòng ≥ 90 %
function soDong(it) {
  const x = N.BY.get(it.k) || {}, d = Array.isArray(it.d) ? it.d : [];
  let nMax = 0, n90 = 0;
  for (const [k, v] of d) { const m = maxDong(x.t, k); if (!m) continue; if (v >= m) nMax++; if (v >= 0.9 * m) n90++; }
  return { nd: d.length, nMax, n90 };
}
// mọi chỗ chứa đồ của 1 nhân vật -> [[nơi, [món]]]
function choCua(h) {
  const L = [["mặc", Object.values(h.equip || {})], ["túi", h.bag || []], ["rương", h.ruong || []]];
  (h.ruongPhu || []).forEach((r, i) => L.push([`rương mở rộng ${i + 1}`, r || []]));
  if (Array.isArray(h.tuiTM)) L.push(["túi tử mẫu", h.tuiTM]);
  if (h.sap && Array.isArray(h.sap.ds)) L.push(["sạp chợ trời", h.sap.ds]);
  return L;
}

function tim(b = {}) {
  const q = String(b.q || "").trim().slice(0, 60), fq = fold(q), loc = String(b.loc || ""), nguon = String(b.nguon || "");
  const tran = Math.max(1, Math.min(TRAN, b.n | 0 || TRAN)), coLoc = !!(fq || loc || nguon);
  const ds = [], theoMa = new Map();
  let quet = 0, tong = 0;
  for (const tk of D.dsTk()) {
    quet++;
    for (const h of tk.nv || []) {
      if (!h) continue;
      for (const [noi, L] of choCua(h)) for (const it of L) {
        if (!it || !it.k || !N.laTB(it)) continue;
        if (it.g) { const c = theoMa.get(it.g) || []; c.push({ tk: tk.ten, nv: h.name, noi, n: DO.tenMon(it).trim() }); theoMa.set(it.g, c); }
        if (!coLoc) continue;
        if (fq && !(it.g === q || fold(DO.tenMon(it)).includes(fq))) continue;
        const l0 = Array.isArray(it.ng) ? it.ng[0] : "";
        if (nguon === "?" && l0 !== "?") continue;
        if (nguon === "qt" && l0 !== "qt") continue;
        if (nguon === "cu" && l0 !== "cu" && it.g) continue;
        if (nguon === "moi" && (!it.g || l0 === "cu")) continue;
        const sd = soDong(it);
        if (loc === "cao" && sd.n90 < 4) continue;
        if (loc === "max" && !(sd.nd >= 3 && sd.nMax === sd.nd)) continue;
        tong++;
        if (ds.length < tran) { const { x, y, ...m } = it; ds.push({ tk: tk.ten, nv: h.name, noi, it: m, ...sd }); }
      }
    }
  }
  const trung = [...theoMa].filter(([, c]) => c.length > 1).slice(0, TRUNG_TRAN).map(([g, c]) => ({ g, so: c.length, ds: c.slice(0, 10) }));
  // món nhiều dòng tối đa lên trước
  ds.sort((a, c) => c.nMax - a.nMax || c.n90 - a.n90 || c.nd - a.nd);
  return { quet, tong, ds, trung, ...(tong > ds.length ? { cat: tong - ds.length } : {}) };
}

module.exports = { tim, soDong, maxDong };
