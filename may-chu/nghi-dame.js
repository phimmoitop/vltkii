"use strict";
// Nghi hack sát thương (anh 16/11 — "Cảnh báo đòn đánh quá mạnh", CHỈ GHI: không cắt, không khóa; anh xem bằng chứng ở F10 rồi tự quyết).
// Máy chủ không có công thức sát thương (chỉ ở trình duyệt — src/game/rules.js, vocong.js; máy chủ không nạp ES module) -> "trần" lấy theo NGƯỜI CÙNG PHÁI,
// CÙNG MỐC 10 CẤP đang chơi trên máy này: mỗi nhân vật giữ số cao nhất của mình theo từng loại (giữ GIU_NGAY ngày, chỉ trong bộ nhớ — khởi động lại thì dựng lại):
//   pk   đòn đơn cao nhất lên người — Tống Kim "tkn", Lôi đài "ldn" (số trình duyệt gửi, đã nhân hệ số PK)
//   boss sát thương mỗi 10 giây lên boss thế giới ("bst" — số gửi lên, TRƯỚC khi cắt theo stGiay)
//   qc   sát thương mỗi 10 giây lên quái chung bãi train ("qcd" — chỉ phần của chính người đó, không tính phân thân)
// Nghi khi số mới > heSo × mốc nhóm: mốc = phân vị 75 của số cao nhất của NHỮNG NGƯỜI KHÁC cùng phái + cùng mốc cấp (≥ itNhat người). Thiếu người cùng phái thì
// đòn lên người (pk) so cả mốc cấp (mọi phái) với heSo × 2; quái chung / boss không so mọi phái (phái đánh lan); vẫn thiếu thì không xét. khoiDong phút đầu sau khi
// máy chủ chạy chỉ gom số, chưa gắn cờ (số bị nghi không vào mốc nhóm — số trong lúc gom thì có). Cờ tk.nghiDame = { lan, luc, nv, x (lần vượt lớn nhất), bang: [dòng bằng chứng] } — bảng F10 tô
// đỏ, quản trị xóa cờ (quan-tri.js bo-dame); nhật ký loại "hack". Ghi tệp tài khoản ≤ 1 lần / GHI_MS mỗi người (đọc lại tệp như nghi-tool.js — không giữ bản cũ).
// cau-hinh.json nghiDame { bat, heSo, itNhat, khoiDong } nếu có (không có: bật, ×3, 3 người, 20 phút). Không có ở F10 — sửa tệp rồi khởi động lại.
//   pk(ten, v, crit, noi, hs) — mỗi đòn lên người (tong-kim.js tkn: noi "Tống Kim", hs = D.hs; loi-dai.js ldn: noi "Lôi đài", hs = R.hs; bỏ phản đòn st.ph)
//   cong(ten, loai, d)     — sát thương dồn (boss-tg.js danh: "boss"; quai-chung.js danh: "qc")
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu");
const NK = require("./nhat-ky");
const TG = () => require("./the-gioi");
const DO = () => require("./do");

const CUA_MS = 10000, GIU_NGAY = 7, GHI_MS = 60 * 1000, BANG_GIU = 8, MOC_MS = 30 * 1000;
const TEN_LOAI = { pk: "đòn lên người", boss: "sát thương / 10 giây lên boss thế giới", qc: "sát thương / 10 giây lên quái chung" };
const CHR = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/char.json"), "utf8")); } catch { return {}; } })();
const TEN_PHAI = new Map((CHR.factions || []).map((f) => [f.id, String(f.n || "").replace(/ phái$/, "")]));
// khoiDong: số phút đầu sau khi máy chủ chạy chỉ gom số, chưa gắn cờ (S2 16/11 16:31 — 1 phút sau khi lên đã báo nhầm: mốc nhóm vừa dựng từ 1–2 phút đầu còn thấp)
const cf = () => { const C = (DO().NOI.CFG || {}).nghiDame || {}; return { bat: C.bat !== false, heSo: +C.heSo > 1 ? +C.heSo : 3, itNhat: +C.itNhat >= 2 ? +C.itNhat | 0 : 3, khoiDong: C.khoiDong != null && +C.khoiDong >= 0 ? +C.khoiDong : 20 }; };
const BAT_DAU = Date.now();
// so mọi phái chỉ cho đòn lên người (pk): đánh quái chung / boss thì phái đánh lan (Đường Môn, Thiên Nhẫn…) tự nhiên gấp nhiều lần phái đánh đơn — chỉ so cùng phái
const MOI_PHAI = new Set(["pk"]);

const BEST = { pk: new Map(), boss: new Map(), qc: new Map() }; // "tài khoản\u0001tên nhân vật" -> { fac, moc, v, luc }
const CUA = new Map();  // "loai\u0001tài khoản" -> { t0, sum, noi }
const MOC = new Map();  // "loai|fac|moc" -> { luc, a: mốc cùng phái | null, na, b: mốc cả mốc cấp | null, nb } (tính lại ≤ 1 lần / MOC_MS)
const CHO = new Map();  // tài khoản -> { nv, dong: [], lan, x, luc, ghiLuc } — phần chưa ghi tệp
const p2 = (n) => String(n).padStart(2, "0");
const gioVN = (t) => { const d = new Date(t + 7 * 3600e3); return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`; };
const so = (n) => Math.round(n).toLocaleString("vi-VN");
const x1 = (x) => x.toFixed(1).replace(".", ",");

// phân vị 75 (số đã sắp tăng dần)
const pv75 = (L) => L[Math.min(L.length - 1, Math.floor(L.length * 0.75))];
function mocCua(loai, fac, moc, boKhoa, t) {
  const k = `${loai}|${fac}|${moc}`; let m = MOC.get(k);
  if (!m || t - m.luc > MOC_MS) {
    const han = t - GIU_NGAY * 86400e3, cung = [], ca = [];
    for (const [kk, v] of BEST[loai]) { if (v.luc < han) { BEST[loai].delete(kk); continue; } if (v.moc !== moc) continue; ca.push([kk, v.v]); if (v.fac === fac) cung.push([kk, v.v]); }
    m = { luc: t, cung, ca }; MOC.set(k, m);
  }
  // bỏ chính mình (người đang xét)
  const loc = (L) => L.filter(([kk]) => kk !== boKhoa).map(([, v]) => v).sort((a, b) => a - b);
  const a = loc(m.cung), b = loc(m.ca);
  return { a: a.length ? pv75(a) : 0, na: a.length, b: b.length ? pv75(b) : 0, nb: b.length };
}

function xet(ten, loai, v, them = {}) {
  if (!(v > 0)) return;
  const C = cf(); if (!C.bat) return;
  const p = TG().dangChoi(ten); if (!p || p.fac == null || !p.name) return;
  const t = Date.now(), moc = Math.floor((p.lvl | 0) / 10), kh = ten + "\u0001" + p.name, M = BEST[loai];
  const g = mocCua(loai, p.fac, moc, kh, t);
  let nghi = null;
  const day = t - BAT_DAU >= C.khoiDong * 60e3; // hết thời gian gom số đầu
  if (day && g.na >= C.itNhat && g.a > 0 && v > g.a * C.heSo) nghi = { gia: g.a, n: g.na, cung: 1, k: C.heSo };
  else if (day && MOI_PHAI.has(loai) && g.na < C.itNhat && g.nb >= C.itNhat && g.b > 0 && v > g.b * C.heSo * 2) nghi = { gia: g.b, n: g.nb, cung: 0, k: C.heSo * 2 };
  // số bị nghi KHÔNG vào mốc nhóm (soát 16/11: nhóm 3–4 người thì phân vị 75 = số lớn nhất — 1 số láo che mất người khác suốt 7 ngày)
  if (nghi) return ghiNghi(ten, p, loai, v, nghi, them, t);
  const cu = M.get(kh);
  if (!cu || v > cu.v || cu.luc < t - GIU_NGAY * 86400e3) M.set(kh, { fac: p.fac, moc, v, luc: t });
}

function ghiNghi(ten, p, loai, v, n, them, t) {
  const x = v / n.gia, phai = TEN_PHAI.get(p.fac) || `phái ${p.fac}`, bai = (DO().tenBai && DO().tenBai(p.zone)) || `bản đồ ${p.zone}`;
  const soTho = them.hs ? `${so(them.tho)} (hệ số PK ${String(them.hs).replace(".", ",")} — quy về ×1: ${so(v)})` : so(v); // đòn lên người: số gửi lên + số đã quy về hệ số 1
  const dong = `${gioVN(t)} · ${them.noi || bai} · ${TEN_LOAI[loai]} ${soTho}${them.crit ? " (chí mạng)" : ""} · ${n.n} người ${n.cung ? `cùng ${phai}` : "mọi phái"} cấp ${p.lvl - (p.lvl % 10)}–${p.lvl - (p.lvl % 10) + 9}: ${so(n.gia)} · ×${x1(x)} (ngưỡng ×${x1(n.k)}) · ${p.name} ${phai} cấp ${p.lvl}`;
  let s = CHO.get(ten);
  if (!s) CHO.set(ten, (s = { nv: p.name, dong: [], lan: 0, x: 0, luc: 0, ghiLuc: 0, nkLuc: 0 }));
  s.nv = p.name; s.lan++; s.x = Math.max(s.x, x); s.luc = t; s.dong.push(dong); if (s.dong.length > BANG_GIU) s.dong.splice(0, s.dong.length - BANG_GIU);
  if (t - s.nkLuc >= GHI_MS) { s.nkLuc = t; NK.ghi("hack", ten, p.name, `Nghi hack sát thương: ${dong}`); console.warn(`[nghi sát thương] ${ten} (${p.name}): ${dong}`); }
  // ghi tệp SAU khi việc đang chạy xong (soát 16/11: sát thương đi kèm /api/nhip — api.js đang giữ tk và ghi lại sau, ghi ngay ở đây thì bị bản đó đè mất)
  if (t - s.ghiLuc >= GHI_MS && !s.hen) { s.hen = 1; setImmediate(() => { s.hen = 0; try { if (CHO.get(ten) === s && s.lan &&Date.now() - s.ghiLuc >= GHI_MS) ghiTk(ten, s, Date.now()); } catch (e) { console.error("nghi-dame: " + e.message); } }); }
}
function ghiTk(ten, s, t) {
  if (!s.dong.length && !s.lan) return;
  const tk = D.docTk(ten); if (!tk) { CHO.delete(ten); return; }
  const C = tk.nghiDame && typeof tk.nghiDame === "object" ? tk.nghiDame : {};
  const bang = [...(Array.isArray(C.bang) ? C.bang : []), ...s.dong].slice(-BANG_GIU);
  tk.nghiDame = { lan: (C.lan | 0) + s.lan, luc: s.luc || t, nv: s.nv || C.nv || "", x: Math.round(Math.max(+C.x || 0, s.x) * 10) / 10, bang };
  D.ghiTk(tk);
  s.dong = []; s.lan = 0; s.x = 0; s.ghiLuc = t;
}

// hs: hệ số PK của phòng / trận (số trình duyệt gửi đã nhân) — quy về hệ số 1 trước khi so / lưu: đổi heSoSt ở F10 hay mở phòng thử hệ số khác không làm lệch mốc nhóm
// (soát 16/11)
function pk(ten, v, crit, noi, hs) {
  try { const k = +hs > 0 ? +hs : 1, tho = +v || 0; xet(ten, "pk", tho / k, { crit: !!crit, noi, ...(k !== 1 ? { hs: k, tho } : {}) }); } catch (e) { console.error("nghi-dame: " + e.message); }
}
function cong(ten, loai, d) {
  try {
    d = +d || 0; if (!(d > 0) || !BEST[loai]) return;
    const t = Date.now(), k = loai + "\u0001" + ten; let c = CUA.get(k);
    if (!c) { CUA.set(k, { t0: t, sum: d }); return; }
    if (t - c.t0 < CUA_MS) { c.sum += d; return; }
    // đủ 10 giây: sát thương quy về mỗi 10 giây (cửa sổ dài hơn — có lúc đứng yên — thì chia theo độ dài thật), mở cửa sổ mới bằng phần vừa tới
    const v = (c.sum * CUA_MS) / Math.max(CUA_MS, t - c.t0); c.t0 = t; c.sum = d;
    xet(ten, loai, v);
  } catch (e) { console.error("nghi-dame: " + e.message); }
}

// quản trị vừa xóa cờ: bỏ phần chưa ghi (không dựng lại cờ từ lần nghi trước khi xóa)
function xoa(ten) { CHO.delete(ten); }

// bộ hẹn giờ: ghi phần chờ đã quá GHI_MS, dọn cửa sổ cũ
setInterval(() => {
  try {
    const t = Date.now();
    for (const [ten, s] of CHO) { if (s.lan && t - s.ghiLuc >= GHI_MS) ghiTk(ten, s, t); else if (!s.lan && t - s.luc > 30 * 60e3) CHO.delete(ten); }
    for (const [k, c] of CUA) if (t - c.t0 > 5 * 60e3) CUA.delete(k);
    for (const [k, m] of MOC) if (t - m.luc > 10 * 60e3) MOC.delete(k);
  } catch (e) { console.error("nghi-dame: " + e.message); }
}, 20 * 1000).unref();

module.exports = { pk, cong, xoa, cf, _thu: { BEST, CUA, MOC, CHO, xet, ghiTk } };
