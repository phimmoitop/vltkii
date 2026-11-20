// Online nhận thưởng — tích lũy thời gian online trong ngày (anh 31/10 khuya: "huyền thiên chùy có thể kiếm từ thưởng online ngày nhỉ, mỗi ngày onl
// theo mốc 1 2 3 tiếng, mốc 3 tiếng được 1 cái chùy, mốc 1 được kinh nghiệm, mốc 2 được Tiên thảo lộ 1 giờ + 20 vạn"). Khung + câu theo client
// script\bonus_onlinetime\func_onlineaward.lua (bản VNG đã tắt): Say "Nhận phần thưởng thời gian Online / Kiểm tra thời gian Online / Kết thúc",
// "Đại hiệp chưa đủ 1 giờ trên mạng!", "Không đủ 1 ô trống trong hành trang của đại hiệp!", Talk "Online Nhận Thưởng".
//   - Mốc: cau-hinh.json thuongOnline.moc = [{ gio, kn?, knCap? (phần kinh nghiệm của cấp đang có), tien?, xu?, do?: [[mã, số]] }] — mỗi mốc nhận
//     1 lần / ngày (giờ Việt Nam), mỗi nhân vật riêng (như script client — biến nhiệm vụ của nhân vật).
//   - Đếm: mỗi nhịp lúc đang trong game cộng khoảng cách từ nhịp trước (> 90 giây = đã rời mạng, không tính — ủy thác không tính); tab ẩn nhịp
//     thưa vẫn tính. Phần chưa ghi giữ trong bộ nhớ (DEM), ghi vào h.onl khi nhịp đó ghi file / đủ 60 giây / vừa qua mốc — tắt máy chủ mất tối
//     đa 1 phút.
// h.onl = { ngay, giay (đã ghi), nhan: [giờ của mốc đã nhận], bao: [giờ của mốc đã báo] }
// Anh 05/11: món thưởng online khóa bảo hiểm vĩnh viễn (it.kbh = KBH_VV — may-chu/do.js), không giao dịch được; kinh nghiệm / tiền như cũ
"use strict";
const DO = require("./do.js");

// cấu hình đọc LÚC DÙNG (soát 14/11 — như thuong-cap.js: trước chép BAT / MOC lúc khởi động, F10 → Cấu hình sửa phải khởi động lại mới ăn). Mỗi hàm lấy
// BAT / MOC tại chỗ (mốc ~3 dòng — rẻ cả ở nhịp)
const N = DO.NOI, cf = () => N.CFG.thuongOnline || {};
const bat = () => cf().bat !== false;
// anh 16/11 — Báo Đáp Ân Sư (may-chu/bao-dap-an-su.js, nạp lúc dùng): sự kiện mở thì mốc 1 giờ (không có mốc 1 giờ: mốc đầu) có thêm món sự kiện (thuongNguon
// "online") trong m.do — cùng đường với món mốc: chữ khung / câu báo đủ mốc (tenMoc), vào túi khóa bảo hiểm vĩnh viễn như luật online, chụp túi — thiếu chỗ thì trả
// lại cả mốc, mỗi mốc 1 lần / ngày (O.nhan). Đã nhận mốc 1 giờ trước giờ mở sự kiện thì hôm đó không có. Module thiếu / ném lỗi -> mốc như cũ. moc() chạy mỗi nhịp
// -> đệm 1 giây; lỗi chỉ ghi khi đổi câu (không đầy nhật ký)
const BD = () => require("./bao-dap-an-su");
let EV = { t: 0, v: [], loi: "" };
function evOnline(t = Date.now()) {
  if (t - EV.t < 1000) return EV.v;
  let v = [], loi = "";
  try { v = (BD().thuongNguon("online") || []).filter((r) => Array.isArray(r) && N.BY.has(String(r[0])) && (r[1] | 0) > 0).map(([k, n]) => [String(k), n | 0]); }
  catch (e) { if (!e || e.code !== "MODULE_NOT_FOUND") { loi = String((e && e.message) || e); if (loi !== EV.loi) console.error("Báo Đáp Ân Sư — online:", loi); } }
  EV = { t, v, loi }; return v;
}
// anh 18/11 — nguồn sự kiện (nguon-su-kien.js online — sườn dùng lại): mốc gio giờ thêm món (mốc 3 giờ: 3 Sợi chỉ màu + 1 Trung Dược) — cùng đường món mốc, đệm 1 giây
let NSKO = { t: 0, f: null };
function nskOnline(gio, t = Date.now()) {
  if (t - NSKO.t >= 1000) { let f = null; try { const M = require("./nguon-su-kien.js"); f = (g) => M.online(g); } catch (e) { if (!e || e.code !== "MODULE_NOT_FOUND") console.error("Nguồn sự kiện — online:", e && e.message); } NSKO = { t, f, c: new Map() }; }
  if (!NSKO.f) return [];
  if (!NSKO.c.has(gio)) { let v = []; try { v = (NSKO.f(gio) || []).filter((r) => Array.isArray(r) && N.BY.has(String(r[0])) && (r[1] | 0) > 0).map(([k, n]) => [String(k), n | 0]); } catch (e) { console.error("Nguồn sự kiện — online:", e && e.message); } NSKO.c.set(gio, v); }
  return NSKO.c.get(gio);
}
const moc = () => {
  let L = (cf().moc || []).filter((m) => m && m.gio > 0).sort((a, b) => a.gio - b.gio);
  const ev = evOnline();
  if (ev.length && L.length) {
    const i = Math.max(0, L.findIndex((m) => m.gio === 1));
    L[i] = { ...L[i], do: [...(Array.isArray(L[i].do) ? L[i].do : []), ...ev.map((r) => r.slice())] }; // bản sao — không đụng cau-hinh
  }
  L = L.map((m) => { const x = nskOnline(m.gio); return x.length ? { ...m, do: [...(Array.isArray(m.do) ? m.do : []), ...x.map((r) => r.slice())] } : m; });
  return L;
};
const KHE = 90, GHI_MOI = 60; // giây
const DEM = new Map(); // "tài khoản|ô" -> { luc, them }
const Y = (t) => `<color=yellow>${t}<color>`;
const KHOA_CAU = "<color=green>Vật phẩm thưởng được khóa bảo hiểm vĩnh viễn.<color>"; // màu khóa của client (G_ITEM_BIND_STATE2); vừa 1 dòng khung Say (~50 chữ)
const gioPhut = (s) => { s = Math.floor(s); const g = Math.floor(s / 3600), p = Math.floor((s % 3600) / 60); return g ? `${g} giờ${p ? ` ${p} phút` : ""}` : `${p} phút`; };

function ngay(h, t = Date.now()) {
  const d = N.ngayVN(t);
  if (!h.onl || h.onl.ngay !== d) h.onl = { ngay: d, giay: 0, nhan: [], bao: [] };
  return h.onl;
}
const giayCo = (h, key) => (h.onl ? h.onl.giay : 0) + ((DEM.get(key) || {}).them || 0);
const knMoc = (h, m) => (m.kn || 0) + (m.knCap > 0 && isFinite(N.need(h.lvl || 1)) ? Math.floor(N.need(h.lvl || 1) * m.knCap) : 0);
const tenMoc = (h, m) => [knMoc(h, m) > 0 ? `${knMoc(h, m).toLocaleString("vi-VN")} kinh nghiệm` : "", ...(m.do || []).map(([k, n]) => { const x = N.BY.get(k); return x ? `${(n | 0) > 1 ? n + " " : ""}${x.n.trim()}` : ""; }),
  m.tien > 0 ? N.tien(m.tien) : "", m.xu > 0 ? `${m.xu} Xu` : ""].filter(Boolean).join(" + ");

// phần đếm ghi vào h.onl.giay và h.pd.tich (phúc duyên — may-chu/phuc-duyen.js: thời gian online tích lũy từ lần đổi điểm trước)
const pdBat = () => (N.CFG.phucDuyen || {}).bat !== false;
function ghiVao(h, O, them) {
  O.giay = Math.round((O.giay + them) * 100) / 100; // giữ phần lẻ: nhịp 0,25–0,5 giây mà làm tròn cả giây thì đồng hồ đứng yên
  if (pdBat() && h.pd && h.pd.bat) h.pd.tich = Math.round(((h.pd.tich || 0) + them) * 100) / 100;
}
// đổ phần chưa ghi của nhịp gần nhất (phúc duyên đổi điểm / xem thời gian cần số đủ)
function xa(h, key) { const m = DEM.get(key); if (m && m.them > 0) { ghiVao(h, ngay(h), m.them); m.them = 0; } }

// mỗi nhịp đang trong game (api.js nhip). ghiSap: nhịp này sẽ ghi file. Trả { ghi, bao: [câu] } — bao: vừa đủ mốc
function dem(h, key, ghiSap, t = Date.now()) {
  const BAT = bat(), MOC = moc(), PD_BAT = pdBat();
  if ((!BAT || !MOC.length) && !PD_BAT) return { ghi: false, bao: [] };
  const O0 = h.onl && h.onl.ngay, O = ngay(h, t), m = DEM.get(key) || { luc: t, them: 0 };
  if (O0 !== O.ngay) m.them = 0; // sang ngày mới: phần chưa ghi của hôm qua bỏ
  const kc = (t - m.luc) / 1000;
  if (kc > 0 && kc <= KHE) m.them += kc;
  m.luc = t; DEM.set(key, m);
  const co = O.giay + m.them, bao = [];
  if (BAT) for (const mc of MOC) if (co >= mc.gio * 3600 && !O.bao.includes(mc.gio) && !O.nhan.includes(mc.gio)) {
    O.bao.push(mc.gio);
    bao.push(`Hôm nay đại hiệp đã online đủ ${mc.gio} giờ — mở Nhận thưởng → Online nhận thưởng để nhận: ${tenMoc(h, mc)}`);
  }
  const ghi = ghiSap || m.them >= GHI_MOI || bao.length > 0 || O0 !== O.ngay;
  if (ghi) { ghiVao(h, O, m.them); m.them = 0; }
  return { ghi, bao };
}

const say = (text, opts) => ({ say: { text, opts } });
// mỗi mốc 1 dòng ngắn (điện thoại ~50 chữ / dòng — dòng dài bị ngắt giữa số), thời gian còn lại tới mốc kế ở dòng cuối
function khung(h, key) {
  const MOC = moc();
  const O = ngay(h), co = giayCo(h, key), ke = MOC.find((m) => co < m.gio * 3600);
  const dong = MOC.map((m) => `Mốc ${m.gio} giờ: ${Y(tenMoc(h, m))} — ${O.nhan.includes(m.gio) ? "đã nhận" : co >= m.gio * 3600 ? "<color=green>có thể nhận<color>" : "chưa đủ"}`);
  return say([`Hôm nay đại hiệp đã online ${Y(gioPhut(co))}.`, ...dong, KHOA_CAU, ...(ke ? [`Còn ${Y(gioPhut(Math.ceil((ke.gio * 3600 - co) / 60) * 60))} nữa tới mốc ${ke.gio} giờ.`] : [])].join("<enter>"),
    [["Nhận phần thưởng thời gian Online", "nhan"], ["Kiểm tra thời gian Online", "xem"], ["Kết thúc", null]]);
}
// b.viec: "mo" | "xem" | "nhan" (nhận mọi mốc đã đủ, chưa nhận)
function lam(h, key, b) {
  const BAT = bat(), MOC = moc();
  if (!BAT || !MOC.length) N.loi("Hiện chưa có hoạt động Online nhận thưởng");
  const O = ngay(h), co = giayCo(h, key);
  if (b.viec === "xem") {
    const s = Math.floor(co);
    return { talk: [`Thời gian trên mạng của đại hiệp hôm nay là: ${Y(Math.floor(s / 3600))} giờ ${Y(Math.floor((s % 3600) / 60))} phút ${Y(s % 60)} giây.`] };
  }
  if (b.viec !== "nhan") return khung(h, key);
  const du = MOC.filter((m) => co >= m.gio * 3600 && !O.nhan.includes(m.gio));
  if (!du.length) return MOC.every((m) => O.nhan.includes(m.gio)) ? say("Hôm nay đại hiệp đã nhận hết phần thưởng thời gian Online. Ngày mai quay lại nhé!", [])
    : say(`Đại hiệp chưa đủ ${MOC.find((m) => !O.nhan.includes(m.gio)).gio} giờ trên mạng!`, [["Kiểm tra thời gian Online", "xem"], ["Kết thúc", null]]);
  const tin = [];
  for (const m of du) {
    // món vào túi trước (thiếu chỗ thì dừng ở mốc này, mốc sau để lần sau) — rồi kinh nghiệm / tiền
    const truoc = h.bag.map((o) => ({ ...o })), uN = h.uN;
    try { for (const [k, n] of m.do || []) { const x = N.BY.get(k); if (x) N.themChong(h, x, n | 0 || 1, N.KBH_VV); } } // khóa bảo hiểm vĩnh viễn (anh 05/11)
    catch { h.bag = truoc; h.uN = uN; tin.push("Không đủ 1 ô trống trong hành trang của đại hiệp!"); break; }
    O.nhan.push(m.gio);
    const kn = knMoc(h, m);
    if (kn > 0) { h.exp = (h.exp || 0) + kn; N.lenCap(h); }
    if (m.tien > 0) h.gold = (h.gold || 0) + m.tien;
    if (m.xu > 0) h.xu = (h.xu | 0) + m.xu;
    tin.push(`Online nhận thưởng mốc ${m.gio} giờ: nhận được ${tenMoc(h, m)}`);
  }
  return { tin, ...khung(h, key) };
}
// công cụ thử (tài khoản quản trị — api.js /api/quan-tri/hoat-dong hd "onl"): b.viec "giay" (b.n giây online hôm nay) | "datLai" (xóa hôm nay)
function dev(h, key, b) {
  const O = ngay(h);
  if (b.viec === "giay") { O.giay = Math.max(0, b.n | 0); O.bao = O.bao.filter((g) => g * 3600 <= O.giay); DEM.delete(key); }
  else if (b.viec === "datLai") { delete h.onl; DEM.delete(key); }
  return { tin: [`Online (thử): hôm nay ${gioPhut(giayCo(h, key))}`], dev: { giay: Math.floor(giayCo(h, key)), nhan: (h.onl || {}).nhan || [] } };
}

// giây đếm của nhịp gần nhất chưa ghi vào h (phúc duyên — may-chu/phuc-duyen.js coNhan)
const them = (key) => (DEM.get(key) || {}).them || 0;
// hôm nay có mốc đủ giờ mà chưa nhận (anh 03/11 — số đỏ trên nút Nhận thưởng: api.js nhip ntc)
function coNhan(h, key) {
  const O = h.onl; if (!bat() || !O || O.ngay !== N.ngayVN(Date.now())) return false;
  const co = O.giay + them(key);
  return moc().some((m) => co >= m.gio * 3600 && !O.nhan.includes(m.gio));
}

module.exports = { dem, lam, dev, xa, coNhan, them, get MOC() { return moc(); } }; // MOC: lich-hd.js / tra-cuu.js đọc lúc dùng
