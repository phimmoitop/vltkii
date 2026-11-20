// Phân Thân (anh 05/11 — "tạo 1 cơ chế thuê bản sao của người chơi khác trong server, bản sao sở hữu 100% thuộc tính của nhân vật được sao chép,
// sẽ đi theo và hỗ trợ người thuê … phí thuê 120 mật đồ thần bí cho 12 tiếng, mỗi ngày giới hạn 12 tiếng"; anh chốt 05/11: KHÔNG phải hệ Đồng
// hành của client — cái đó làm sau theo client). Luật (cau-hinh.json phanThan — anh duyệt 05/11):
//   - danh sách: bảng xếp hạng (may-chu/xep-hang.js — không tài khoản quản trị), trừ nhân vật cùng tài khoản; cấp ≤ cấp mình + capHon (30)
//   - phí: phi (120) món mon (ms:196 Mật đồ thần bí) mỗi lần thuê; người bị sao chép nhận chia (10 % = 12) — Mật đồ THƯỜNG,
//     không khóa (anh 05/11: Mật đồ "1 là không khóa hết, 2 là khóa hết" — chọn không khóa: khóa / không khóa không gộp chồng, tốn ô túi) vào
//     h.ptCho, nhịp kế của họ đưa vào túi (đầy túi thì chờ) + câu báo h.ptTin
//   - giờ (anh 10/11 "tính theo thời gian thuê, kể cả offline, 12h reset ngày không reset thuê"): mỗi phân thân dùng được gioThue (12) giờ tính từ lúc thuê, cả lúc
//     thoát game; 0 giờ chỉ đếm lại lượt thuê trong ngày, không mất phân thân đang thuê (bản 05/11: 12 giờ / ngày dùng chung, chỉ trừ lúc đang theo ở bãi, hết ngày mất)
//   - cùng lúc tối đa toiDa (2) phân thân, mỗi ngày tối đa toiDa lượt thuê (bản 10/11 — bỏ 12/11, xem dưới)
//   - anh 18/11 "cho phép thuê nhiều phân thân khác, nhưng ra trận tối đa 2 con … riêng admin cho phép thuê và xuất trận k giới hạn để test": thuê cùng lúc tối đa
//     thueToiDa (10) phân thân khác nhau, toiDa (2) nay là số phân thân RA TRẬN (đang theo) cùng lúc; tài khoản quản trị không giới hạn cả 2. Gọi ra / cất đi: chờ
//     goiCach giây tính RIÊNG từng phân thân (P.goiL) — trước tính chung nên gọi con thứ 2 ngay sau con đầu bị chặn 10 giây (anh: "phải bấm nhiều lần, đợi 1 lát mới dc")
//   - gói thuê (anh 12/11 "cho điều chỉnh thuê phân thân k giới hạn, tính từ lần thuê, giá: 120 mật đồ 12 tiếng, 360 mật đồ cả ngày"): goi = [[giờ, phí] …]
//     (12 giờ 120, 24 giờ 360) — không giới hạn lượt thuê trong ngày; thuê lại phân thân đang thuê = gia hạn (cộng thêm giờ của gói vào giờ còn lại, bản chụp
//     làm mới); cùng lúc vẫn tối đa toiDa phân thân khác nhau
//   - gọi ra (goi) / cất đi (cat): gọi chỉ ở bãi train, còn giờ; 2 lần gọi / cất cách nhau ≥ goiCach giây
//   - bản chụp (snap) lúc thuê từ file tài khoản của người đó: 100 % chỉ số (trang bị, kỹ năng, tiềm năng, ngoại hình, ô chiêu, cài đặt chiêu của
//     Trợ Thủ) — trình duyệt người thuê tự tính chỉ số + cho phân thân đánh / hỗ trợ (src/game/phanthan.js)
//   - quái phân thân giết: do.js gietQuai cờ r[7] = 1 -> kinh nghiệm, không tiền / đồ; bản quái chung: quai-chung.js tách sát thương phân thân (dp)
//   - ủy thác: lúc có phân thân đang theo thì không đo tốc độ (do.js uyThacDo — dangTheo)
// h.pt = { ngay, thue (lượt thuê trong ngày), v (số phiên bản — đổi khi thuê / gọi / cất / sang ngày / hết hạn), ds: [{ id, ten, lvl, fac, snap, luc, het (lúc hết hạn, ms) }],
//          ra: [id …] (đang theo), goiL: { id: lúc gọi / cất cuối } }
//   lam(tk, h, b)       b.viec: "mo" | "thue" (b.id) | "goi" (b.id) | "cat" (b.id | "tat") -> { pt: trạng thái + bản chụp, ds?: ứng viên, msg? }
//   nhip(h, key, s, ghiSap) -> { pt: trạng thái gọn, tin?: [câu], ghi: bool, tui: bool }
//   dangTheo(h)         có phân thân đang theo hôm nay (ủy thác không đo tốc độ)
"use strict";
const crypto = require("crypto");
const D = require("./du-lieu");
const DO = require("./do.js");
const XH = require("./xep-hang.js");
const NK = require("./nhat-ky.js");

const N = DO.NOI;
const CF = Object.assign({ bat: true, phi: 120, mon: "ms:196", chia: 0.1, toiDa: 2, thueToiDa: 10, gioThue: 12, capHon: 30, goiCach: 10 }, N.CFG.phanThan || {});
const BAT = CF.bat !== false;
const GIAY_THUE = Math.max(0, CF.gioThue * 3600);
// gói thuê [[giờ, phí]] (anh 12/11): cau-hinh.json phanThan.goi; không có thì 1 gói gioThue / phi như trước
const GOI = (Array.isArray(CF.goi) ? CF.goi : []).filter((g) => Array.isArray(g) && +g[0] > 0 && +g[1] > 0).map((g) => [+g[0], Math.round(+g[1])]);
if (!GOI.length) GOI.push([CF.gioThue, CF.phi]);
const tenGio = (g) => (g % 24 === 0 ? (g === 24 ? "cả ngày (24 giờ)" : `${g / 24} ngày (${g} giờ)`) : `${g} giờ`);
const BI_MAT = crypto.randomBytes(16).toString("hex"); // mã ứng viên mờ (không lộ tài khoản / ô) — đổi mỗi lần bật máy chủ
const maCua = (key) => crypto.createHmac("sha1", BI_MAT).update(String(key)).digest("hex").slice(0, 16);
const DEM = new Map(); // "tài khoản|ô" -> { ra (lúc cuối còn phân thân theo — ủy thác) }
const RA_DU = 15000; // cất / hết giờ / sang ngày rồi mà nhịp kế còn mang quái giết lúc phân thân theo: ủy thác vẫn không đo trong chừng này (ms)
const loi = (t) => N.loi(t);
const tenMon = () => String((N.BY.get(CF.mon) || {}).n || "Mật đồ thần bí").trim();
const laBai = (zone) => { const Z = N.ZONES.get(zone | 0); return !!Z && N.FARM.has(Z.kind); };

// chuẩn hóa h.pt; sang ngày (giờ Việt Nam) chỉ đếm lại lượt thuê, phân thân đang thuê giữ tới hết hạn. Dữ liệu trước 10/11 (thuê theo ngày, h.pt.dung): hạn = lúc thuê + gioThue
function ngay(h) {
  const d = N.ngayVN(Date.now());
  if (!h.pt) h.pt = { ngay: d, thue: 0, v: 1, ds: [], ra: [] };
  const P = h.pt;
  if (!Array.isArray(P.ds)) P.ds = [];
  if (!Array.isArray(P.ra)) P.ra = [];
  if (P.thue === undefined) P.thue = P.ngay === d ? P.ds.length : 0;
  delete P.dung; delete P.goiLuc; // goiLuc: chờ gọi / cất tính chung (trước 18/11) -> goiL từng phân thân
  if (!P.goiL || typeof P.goiL !== "object") P.goiL = {};
  for (const x of P.ds) if (!(x.het > 0)) x.het = (x.luc || 0) + GIAY_THUE * 1000;
  if (P.ngay !== d) { P.ngay = d; P.thue = 0; P.v = (P.v | 0) + 1; }
  return P;
}
// bỏ phân thân đã hết hạn thuê -> tên các phân thân vừa hết
function boHet(P, t) {
  const het = P.ds.filter((x) => x.het <= t); if (!het.length) return [];
  P.ds = P.ds.filter((x) => x.het > t);
  P.ra = P.ra.filter((id) => P.ds.some((x) => x.id === id));
  if (P.goiL) for (const id of Object.keys(P.goiL)) if (!P.ds.some((x) => x.id === id)) delete P.goiL[id];
  P.v = (P.v | 0) + 1;
  return het.map((x) => x.ten);
}
// có phân thân đang theo còn hạn, hoặc vừa còn trong RA_DU (key — nhịp sau khi cất / hết hạn còn mang quái giết lúc phân thân theo)
const dangTheo = (h, key) => { const t = Date.now(), P = h && h.pt; return !!(P && Array.isArray(P.ra) && Array.isArray(P.ds) && P.ra.some((id) => P.ds.some((x) => x.id === id && !(x.het <= t)))) || (!!key && t - ((DEM.get(key) || {}).ra || 0) < RA_DU); };

// ứng viên: bảng xếp hạng (có khóa "tài khoản|ô") trừ cùng tài khoản, cấp ≤ cấp mình + capHon
function ungVien(tk, h) {
  // đã thuê: theo mã hoặc tên (mã đổi mỗi lần bật máy chủ — soát 05/11)
  const max = (h.lvl | 0) + CF.capHon, P = ngay(h), da = new Set(P.ds.map((x) => x.id)), daTen = new Set(P.ds.map((x) => x.ten));
  return XH.dsKhoa().filter((r) => r.key.split("|")[0] !== tk.ten && r.lvl >= 1 && r.lvl <= max)
    .map((r) => ({ id: maCua(r.key), ten: r.n, lvl: r.lvl, fac: r.fac, ...(da.has(maCua(r.key)) || daTen.has(r.n) ? { da: 1 } : {}) }));
}
// bản chụp 100 % của nhân vật: những gì trình duyệt cần để tính chỉ số + ra chiêu như người đó
function chup(h) {
  const a = h.auto && h.auto.danh ? h.auto.danh : {};
  return JSON.parse(JSON.stringify({
    name: h.name, lvl: h.lvl | 0, sex: h.sex, series: h.series, fac: h.fac ?? null, start: h.start || null, attr: h.attr || {}, equip: h.equip || {},
    skills: h.skills || {}, looks: h.looks || {}, oChieu: h.oChieu || {},
    danh: { chieu: a.chieu | 0, bua: a.bua || [], vong: a.vong | 0, xoay: a.xoay || [], hoi: a.hoi || null, hoiDoi: a.hoiDoi || null },
  }));
}
// trạng thái gửi trình duyệt (snap: kèm bản chụp — chỉ khi mở khung / thuê / gọi, nhịp chỉ gửi phần gọn)
// toiDa: số phân thân ra trận cùng lúc, thueToiDa: số phân thân thuê cùng lúc (0 = không giới hạn), admin: quản trị không giới hạn cả 2 (anh 18/11)
function trangThai(h, key, snap, ad) {
  const P = ngay(h), t = Date.now();
  return { v: P.v | 0, gioThue: GOI[0][0], phi: GOI[0][1], goi: GOI, toiDa: CF.toiDa, thueToiDa: CF.thueToiDa | 0, ...(ad ? { admin: 1 } : {}), thue: P.thue | 0, capToi: (h.lvl | 0) + CF.capHon, ra: P.ra.slice(),
    ds: P.ds.map((x) => ({ id: x.id, ten: x.ten, lvl: x.lvl, fac: x.fac, con: Math.max(0, Math.round((x.het - t) / 1000)), ...(snap ? { snap: x.snap } : {}) })) };
}
const soMon = (h) => (h.bag || []).reduce((t, o) => t + (o.k === CF.mon ? o.n || 1 : 0), 0);
// trừ n món phí (chồng khóa bảo hiểm trước — như tay-tuy.js) -> { khoa: số món khóa đã trừ, kbh: mức khóa cao nhất đã trừ }
function truMon(h, n) {
  let khoa = 0, kbh = 0;
  for (const o of (h.bag || []).filter((x) => x.k === CF.mon).sort((a, b) => (b.kbh | 0) - (a.kbh | 0))) {
    if (n <= 0) break;
    const lay = Math.min(n, o.n || 1); o.n = (o.n || 1) - lay; n -= lay;
    if ((o.kbh | 0) > 0) { khoa += lay; kbh = Math.max(kbh, o.kbh | 0); }
    if (o.n <= 0) h.bag.splice(h.bag.indexOf(o), 1);
  }
  return { khoa, kbh };
}

function lam(tk, h, b) {
  if (!BAT) loi("Phân thân hiện chưa mở");
  const key = tk.ten + "|" + (b.o | 0), P = ngay(h), viec = String(b.viec || "mo"), t = Date.now(), ad = !!tk.admin;
  boHet(P, t);
  if (viec === "mo") return { pt: trangThai(h, key, true, ad), ds: ungVien(tk, h) };
  if (viec === "thue") {
    const id = String(b.id || ""), gi = b.goi == null ? 0 : b.goi | 0, G = GOI[gi];
    if (!G || gi < 0) loi("Gói thuê không hợp lệ — bấm Làm mới");
    const [gioG, phiG] = G;
    const r = XH.dsKhoa().find((x) => maCua(x.key) === id);
    if (!r) loi("Không còn người này trong bảng xếp hạng — bấm Làm mới");
    const [ten, o] = r.key.split("|");
    if (ten === tk.ten) loi("Không thuê được phân thân của nhân vật cùng tài khoản");
    if (r.lvl > (h.lvl | 0) + CF.capHon) loi(`Chỉ thuê được phân thân không quá cấp ${(h.lvl | 0) + CF.capHon}`);
    if (soMon(h) < phiG) loi(`Cần ${phiG} ${tenMon()} — hành trang chỉ có ${soMon(h)}`);
    // đang thuê người này (theo mã, hoặc tên — mã đổi sau khi bật lại máy chủ, soát 05/11) -> gia hạn; chưa thuê thì cần còn chỗ (toiDa)
    const cu = P.ds.find((x) => x.id === id || x.ten === r.n);
    if (!cu && !ad && CF.thueToiDa > 0 && P.ds.length >= CF.thueToiDa) loi(`Đang thuê đủ ${CF.thueToiDa} phân thân cùng lúc — chờ 1 phân thân hết giờ (thuê lại người đang thuê để gia hạn)`);
    const tkS = D.docTk(ten), hS = tkS && tkS.nv && tkS.nv[o | 0];
    if (!hS || hS.name !== r.n) loi("Không còn người này trong bảng xếp hạng — bấm Làm mới");
    // cấp thật lúc thuê (anh 11/11: bảng xếp hạng nay làm mới 5 phút 1 lần — r.lvl có thể cũ, người kia vừa lên cấp vượt mức +30)
    if ((hS.lvl | 0) > (h.lvl | 0) + CF.capHon) loi(`Chỉ thuê được phân thân không quá cấp ${(h.lvl | 0) + CF.capHon} (${hS.name} nay cấp ${hS.lvl | 0})`);
    // trừ phí người thuê TRƯỚC, ghi file người bị sao chép SAU CÙNG (soát 05/11: lỗi giữa chừng thì không có chuyện họ nhận mà mình không trừ)
    truMon(h, phiG); const cong = Math.floor(phiG * CF.chia), them = gioG * 3600 * 1000;
    if (cu && cu.id !== id) P.ra = P.ra.map((r) => (r === cu.id ? id : r)); // mã ứng viên đổi sau khi bật lại máy chủ: phân thân đang theo giữ nguyên (soát 12/11)
    if (cu) Object.assign(cu, { id, lvl: hS.lvl | 0, fac: hS.fac ?? null, snap: chup(hS), het: Math.max(cu.het || 0, t) + them }); // gia hạn: cộng giờ, bản chụp mới
    else P.ds.push({ id, ten: hS.name, lvl: hS.lvl | 0, fac: hS.fac ?? null, snap: chup(hS), luc: t, het: t + them });
    P.thue = (P.thue | 0) + 1;
    P.v = (P.v | 0) + 1;
    NK.ghi("pt", tk.ten, h.name, `${cu ? "Gia hạn" : "Thuê"} phân thân ${hS.name} (cấp ${hS.lvl | 0}) ${tenGio(gioG)} — ${phiG} ${tenMon()}, ${hS.name} nhận ${cong}`);
    // tiền công người bị sao chép (đọc + ghi file của họ liền nhau, không await — như giao dịch): Mật đồ THƯỜNG, không khóa (anh 05/11: Mật đồ hoặc
    // không khóa hết hoặc khóa hết — chọn không khóa). Game không có nguồn phát Mật đồ khóa (chỉ quái rơi); nếu sau này có thì xem lại chỗ này (trả
    // phí bằng Mật đồ khóa rồi người kia nhận Mật đồ thường = rửa khóa — soát 05/11)
    if (cong > 0) {
      hS.ptCho = (hS.ptCho | 0) + cong;
      hS.ptTin = [...(Array.isArray(hS.ptTin) ? hS.ptTin : []), `${h.name} vừa thuê phân thân của đại hiệp — nhận ${cong} ${tenMon()} tiền công`].slice(-10);
      try { D.ghiTk(tkS); } catch (e) { console.error("phân thân: ghi tiền công", ten, e && e.message); }
    }
    const con = Math.round(((cu ? cu.het : t + them) - t) / 60000);
    return { pt: trangThai(h, key, true, ad), ds: ungVien(tk, h), msg: cu ? `Đã gia hạn phân thân ${hS.name} thêm ${tenGio(gioG)} — còn ${Math.floor(con / 60)} giờ ${con % 60} phút (tính cả lúc thoát game)` : `Đã thuê phân thân ${hS.name} — dùng được ${tenGio(gioG)}, tính cả lúc thoát game. Bấm Gọi ra ở bãi train để phân thân đi theo`, tui: 1 };
  }
  if (viec === "goi" || viec === "cat") {
    // chờ goiCach giây tính riêng từng phân thân (anh 18/11 — gọi con thứ 2 ngay sau con đầu được luôn)
    const cho = (id) => { const c = CF.goiCach * 1000 - (t - ((P.goiL || {})[id] || 0)); if (c > 0) loi(`Phân thân này vừa gọi ra / cất đi — đợi ${Math.ceil(c / 1000)} giây nữa`); };
    if (viec === "cat") {
      const bo = b.id === "tat" ? P.ra.slice() : P.ra.filter((id) => id === String(b.id || ""));
      if (b.id !== "tat") for (const id of bo) cho(id);
      if (P.ra.length) { const m = DEM.get(key) || {}; m.ra = t; DEM.set(key, m); } // ủy thác: nhịp kế còn quái giết lúc phân thân theo
      P.ra = P.ra.filter((id) => !bo.includes(id));
      for (const id of bo) P.goiL[id] = t;
      P.v = (P.v | 0) + 1;
      return { pt: trangThai(h, key, true, ad), msg: "Đã cất phân thân" };
    }
    const x = P.ds.find((y) => y.id === String(b.id || ""));
    if (!x) loi("Chưa thuê phân thân này hoặc đã hết giờ thuê");
    if (P.ra.includes(x.id)) loi("Phân thân này đang theo đại hiệp rồi");
    if (!ad && P.ra.length >= CF.toiDa) loi(`Đang có ${CF.toiDa} phân thân ra trận — cất bớt 1 phân thân rồi gọi`);
    cho(x.id);
    if (!laBai(N.BAI_NAY.get(key))) loi("Không thể gọi phân thân tại đây! Chỉ gọi được ở bãi train.");
    P.ra.push(x.id); P.goiL[x.id] = t; P.v = (P.v | 0) + 1;
    return { pt: trangThai(h, key, true, ad), msg: `Phân thân ${x.ten} đã ra theo đại hiệp` };
  }
  loi("Việc phân thân không đúng");
}

// mỗi nhịp đang trong game (api.js nhip): phân thân hết hạn thuê (cả lúc thoát game) thì bỏ, báo 1 lần; tiền công người khác thuê mình
function nhip(h, key, s, ghiSap) {
  if (!h) return null;
  const out = { ghi: false, tin: [] }, t = Date.now(), d = N.ngayVN(t);
  if (h.pt && h.pt.ngay !== d) out.ghi = true; // sang ngày mới: đếm lại lượt thuê (phân thân đang thuê giữ nguyên)
  const P = h.pt ? ngay(h) : null, m = DEM.get(key) || {};
  if (P && P.ra.length) m.ra = t; // ủy thác (dangTheo): còn phân thân theo tới lúc này
  DEM.set(key, m);
  if (P) { const het = boHet(P, t); if (het.length) { out.ghi = true; out.tin.push(`Phân thân ${het.join(", ")} đã hết giờ thuê — thuê lại ở khung Phân Thân.`); } }
  // tiền công: người khác thuê phân thân của mình (phan-than.js lam thue ghi h.ptCho / h.ptTin vào file của mình). ptChoK / ptChoKhoa: tiền công khóa
  // của bản lên VPS 05/11 16:09 (trên thực tế không phát sinh — game không có Mật đồ khóa) -> nhận chung như Mật đồ thường (anh 05/11: không khóa)
  if ("ptChoK" in h || "ptChoKhoa" in h) { h.ptCho = (h.ptCho | 0) + (h.ptChoK | 0); delete h.ptChoK; delete h.ptChoKhoa; out.ghi = true; }
  if ((h.ptCho | 0) > 0) {
    const x = N.BY.get(CF.mon);
    try { if (x) N.themChong(h, x, h.ptCho | 0); delete h.ptCho; delete h.ptDay; out.tui = true; out.ghi = true; }
    catch { if (!h.ptDay) { h.ptDay = 1; out.ghi = true; out.tin.push(`Hành trang đầy — ${h.ptCho} ${tenMon()} tiền công phân thân đang chờ, dọn túi là tự vào`); } }
  }
  if (Array.isArray(h.ptTin) && h.ptTin.length) { out.tin.push(...h.ptTin); delete h.ptTin; out.ghi = true; }
  if (P) out.pt = { v: P.v | 0, ra: P.ra.slice() };
  return out;
}

module.exports = { lam, nhip, dangTheo, chup, CF };
