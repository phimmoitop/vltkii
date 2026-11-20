// Nghi dùng công cụ tự động (anh 13/11 — công cụ "VÕ LÂM S2 PRO AUTO": gọi thẳng /api/da-tau … ngay từ bãi train để làm Dã Tẩu "Free 100%" khỏi trả Xu
// Tự làm, tự săn boss, "chống đóng băng chạy ngầm 24/7"; anh chọn: máy chủ chặn + ghi bằng chứng, danh sách "Nghi dùng công cụ" ở bảng F10, KHÔNG BAO GIỜ tự
// khóa — anh xem rồi tự quyết). Theo khuôn may-chu/chong-hack.js (nghi tăng tốc): cờ trên tài khoản tk.nghiTool = { lan (tổng số lần), luc (lần gần nhất),
// ma: [mã tín hiệu], dem: { mã: số lần }, bang: [~8 dòng bằng chứng "13/11 17:40:05 · mã · …"], nv (nhân vật gần nhất) } + nhật ký loại "tool" (F10 →
// Nhật ký → Nghi dùng công cụ). Mã:
//   xa-npc      việc của NPC gọi từ BẢN ĐỒ KHÁC và 2 nhịp sau lời gọi vẫn ở bản đồ đó (công cụ làm Dã Tẩu từ bãi train — npc-gan.js xetXac) / việc NPC gọi
//               thẳng (/api/vuot-ai vào ải) — đã CHẶN (may-chu/npc-gan.js)
//   xa-npc-log  việc xa NPC chỉ GHI, chưa chặn (cửa hàng, rương chứa đồ, Trợ Thủ việc ở thành ngoài thành / thôn, Tự làm kẹt 40 giây) — số liệu để anh quyết sau
//   x-trang     API NPC thiếu / sai dạng mã trang (đầu x-trang — trang game luôn gửi: src/game/net.js), hoặc mang mã trang không bao giờ gửi nhịp trong khi trang
//               khác của tài khoản đang chơi (lời gọi từ ngoài trang game). Chỉ ghi
//   sec-fetch   POST /api/* có Sec-Fetch-Site khác same-origin (GM_xmlhttpRequest của userscript, trang khác). Chỉ ghi
//   dct:<mã>    trình duyệt tự dò (src/game/do-cong-cu.js gửi kèm nhịp dct = { ma, bc }): chu (chữ bảng công cụ trên trang), an (giả ẩn / hiện trang), fetch /
//               xhr / ws (hàm mạng bị móc — tiện ích hợp lệ như dịch trang, chặn quảng cáo cũng có thể làm: tín hiệu YẾU), wd (webdriver). Chỉ ghi
//   xa-npc-gan  cùng bản đồ mà đứng xa NPC lúc làm việc của NPC — đã chặn nhưng là tín hiệu yếu (khung thoại để mở rồi đi xa)
//   npc-vi-tri  việc của NPC khi chưa rõ chỗ đứng (không có nhịp ~20 giây: máy chủ vừa khởi động lại, điện thoại vừa mở màn hình…) — đã chặn, tín hiệu yếu
//   tu-lam-xa   Tự làm (tính năng trả Xu) gọi khi không ở bản đồ của NPC (vừa tới nơi, nhịp chưa báo bản đồ mới) — đã chặn, tín hiệu yếu
// Mã YEU (xa-npc-log, xa-npc-gan, npc-vi-tri, tu-lam-xa, dct:an / fetch / xhr / ws) bảng F10 tô vàng; còn lại tô đỏ. "Treo 24/7" (nhịp liên tục nhiều giờ) là nhãn riêng — chưa làm.
// Ghi tệp tài khoản có hạn: mã chưa có trên cờ -> ghi ngay; còn lại gộp, mỗi tài khoản tối đa 1 lần / GHI_MS (bộ hẹn giờ ghi phần còn đệm). Nhật ký: mỗi mã mỗi
// tài khoản tối đa 1 dòng / NK_MS (dòng sau ghi kèm số lần đã bỏ qua) — công cụ gọi dồn dập không làm đầy nhật ký / đĩa.
//   ghi(tk, h, ma, bc, { luu = true, ip }) -> true khi tk.nghiTool vừa đổi (luu: đã ghi tệp; luu false: người gọi tự ghi — api.js nhip)
//   yeuCau(tk, req, p, m, b, trang)  api.js gọi mỗi yêu cầu đã đăng nhập: Sec-Fetch-Site; /api/nhip: nhớ mã trang đang chơi; API NPC: mã trang thiếu / lạ
//   nhip(tk, h, b) -> true khi tk.nghiTool đổi (b.dct — trình duyệt tự dò; người gọi ghi tệp)
//   xoa(ten)    bỏ phần đệm của tài khoản (quản trị vừa xóa cờ — quan-tri.js bo-tool)
//   sachDct(x) -> { ma: [≤ 8 mã đã biết — TEN_DCT], bc: ≤ 80 ký tự } | null;  tomTat(cờ) -> { lan, luc, ma, nv, manh } (danh sách F10)
"use strict";
const D = require("./du-lieu");
const NK = require("./nhat-ky");

const GHI_MS = 60 * 1000, NK_MS = 60 * 1000, HEN_MS = 20 * 1000;
const BANG_GIU = 8, MOI_MA = 3, MA_GIU = 24, CHO_DONG = 50; // bằng chứng giữ 8 dòng (mỗi mã ≤ 3 dòng); tối đa 24 mã; đệm ≤ 50 dòng mỗi tài khoản
// mã trang (x-trang): nhớ mã đã gửi nhịp TRANG_GIU; API NPC mang mã chưa thấy -> chờ TRANG_CHO (trang vừa F5 gọi trước nhịp đầu: Tống Kim vào lại lúc đăng nhập…)
const TRANG_GIU = 10 * 60 * 1000, TRANG_CHO = 90 * 1000, CHO_MAX = 2000;
// API NPC / thưởng — trang game gọi qua Net.call (luôn kèm x-trang) lúc đang trong game (+ /api/bang-hoi — bang hội đợt 2: Tế Đàn, hồng bao, Lễ phẩm, quỹ; chỉ ghi cờ x-trang)
const API_NPC = new Set(["/api/da-tau", "/api/sat-thu", "/api/tu-lam", "/api/minh-chu", "/api/vuot-ai", "/api/phan-than", "/api/pld", "/api/tay-tuy", "/api/phong-hoa",
  "/api/tong-kim", "/api/phu-quy", "/api/viem-de", "/api/doi-phai", "/api/ma-qua", "/api/bau-cua", "/api/ruong-tb", "/api/thuong-online", "/api/thuong-cap", "/api/phuc-duyen",
  "/api/thuong-dn", "/api/do", "/api/cho", "/api/bang-hoi", "/api/khu-bang", "/api/loi-dai", "/api/dua-ngua", "/api/bao-dap-an-su", "/api/ti-thi"]); // + /api/ti-thi — tỉ thí (anh 17/11) // + /api/bao-dap-an-su — Báo Đáp Ân Sư (anh 16/11: Võ sư / Chưởng Đăng Cung Nữ) // + /api/dua-ngua — đua ngựa (anh 16/11) // + /api/khu-bang — khu vực bang (bang hội đợt 4: vào khu, Xa phu khu, dangNhap trước nhịp đầu như Tống Kim); + /api/loi-dai — Lôi Đài (anh 15/11)
// dct:an YẾU (anh 13/11 tối): tiện ích giữ tab luôn mở / chống ngủ tab (cài cho trang khác, chạy trên mọi trang) cũng ghi đè document.hidden — nhiều người chơi thật
const YEU = new Set(["xa-npc-log", "xa-npc-gan", "npc-vi-tri", "tu-lam-xa", "dct:an", "dct:fetch", "dct:xhr", "dct:ws"]); // tín hiệu yếu (bảng F10 tô vàng)
const TEN_DCT = { chu: "chữ bảng công cụ trên trang", an: "giả trạng thái ẩn / hiện trang (tiện ích giữ tab luôn mở cũng gây ra)", fetch: "window.fetch bị thay", xhr: "XMLHttpRequest bị thay", ws: "WebSocket.send bị thay", wd: "trình duyệt điều khiển tự động (webdriver)" };
// dct: chỉ mã đã biết (TEN_DCT) — trình duyệt bị sửa gửi mã ngẫu nhiên mỗi nhịp thì mỗi mã là "mã mới" (ghi tệp ngay + nhật ký) -> phình tệp tài khoản (soát 13/11)
const MA_RE = new RegExp(`^(xa-npc|xa-npc-log|xa-npc-gan|npc-vi-tri|tu-lam-xa|x-trang|sec-fetch|dct:(?:${Object.keys(TEN_DCT).join("|")}))$`);

const S = new Map(); // tài khoản -> { nv, cho: [{ ma, s }], dem, them: Map(mã -> số), luc, ghiLuc, nkLuc: Map(mã -> lúc), nkBo: Map(mã -> số lần bỏ) }
const TRANG = new Map(); // tài khoản -> Map(mã trang -> lúc gửi nhịp gần nhất)
let CHO = []; // [{ ten, nv, trang, viec, t }] API NPC mang mã trang chưa thấy gửi nhịp — xét lại sau TRANG_CHO
// mỗi tài khoản + mã trang chỉ chờ 1 lần, mỗi tài khoản ≤ CHO_TK mã đang chờ (soát 13/11: mã trang ngẫu nhiên dồn dập -> 2000 mục, mỗi mục đọc tệp tài khoản)
const CHO_KHOA = new Set(), CHO_DEM = new Map(), CHO_TK = 5;
const p2 = (n) => String(n).padStart(2, "0");
const gioVN = (t) => { const d = new Date(t + 7 * 3600e3); return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`; };
const sach = (s, n) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const ipCua = (req) => (req && req.headers && (req.headers["cf-connecting-ip"] || (req.socket && req.socket.remoteAddress))) || "";

function tt(ten) {
  let s = S.get(ten);
  if (!s) S.set(ten, (s = { nv: "", cho: [], dem: 0, them: new Map(), luc: 0, ghiLuc: 0, nkLuc: new Map(), nkBo: new Map() }));
  return s;
}
// bằng chứng: xét từ mới nhất, mỗi mã tối đa MOI_MA dòng (cờ "xa-npc" dồn dập không đẩy mất dòng của mã khác), giữ BANG_GIU dòng — trả theo thứ tự cũ -> mới
const maCua = (s) => (/^\S+ \S+ · (\S+) · /.exec(String(s)) || [])[1] || "";
function gopBang(cu, moi) {
  const L = [...cu, ...moi], dem = new Map(), giu = [];
  for (let i = L.length - 1; i >= 0 && giu.length < BANG_GIU; i--) {
    const k = maCua(L[i]), n = dem.get(k) | 0;
    if (n >= MOI_MA) continue;
    dem.set(k, n + 1); giu.push(String(L[i]));
  }
  return giu.reverse();
}
// dồn phần đệm vào tk.nghiTool (tk vừa đọc từ tệp — chưa ghi)
function apVao(tk, s, t) {
  const C = tk.nghiTool && typeof tk.nghiTool === "object" ? tk.nghiTool : {};
  const ma = [...new Set([...(Array.isArray(C.ma) ? C.ma : []), ...s.cho.map((e) => e.ma)])].slice(-MA_GIU);
  // số lần theo mã: chỉ giữ mã còn trên cờ (ma ≤ MA_GIU) — dem không lớn mãi (soát 13/11)
  const cuDem = C.dem && typeof C.dem === "object" ? C.dem : {}, dem = {};
  for (const k of ma) { const n = (cuDem[k] | 0) + (s.them.get(k) | 0); if (n) dem[k] = n; }
  tk.nghiTool = { lan: (C.lan | 0) + s.dem, luc: s.luc || t, ma, dem, bang: gopBang(Array.isArray(C.bang) ? C.bang : [], s.cho.map((e) => e.s)), nv: s.nv || C.nv || "" };
  s.cho = []; s.dem = 0; s.them.clear(); s.ghiLuc = t;
}

// 1 lần nghi: đệm + nhật ký (có hạn) + cờ tài khoản (mã mới: ngay; còn lại ≤ 1 lần / GHI_MS)
function ghi(tk, h, ma, bc, o = {}) {
  if (!tk || !tk.ten || !MA_RE.test(String(ma))) return false;
  const t = Date.now(), s = tt(tk.ten), dong = sach(bc, 160) || "—";
  if (h && h.name) s.nv = String(h.name);
  s.cho.push({ ma, s: `${gioVN(t)} · ${ma} · ${dong}` }); if (s.cho.length > CHO_DONG) s.cho.splice(0, s.cho.length - CHO_DONG);
  s.dem++; s.them.set(ma, (s.them.get(ma) | 0) + 1); s.luc = t;
  if (t - (s.nkLuc.get(ma) || 0) >= NK_MS) {
    const bo = s.nkBo.get(ma) | 0; s.nkLuc.set(ma, t); s.nkBo.set(ma, 0);
    NK.ghi("tool", tk.ten, (h && h.name) || s.nv || null, `Nghi dùng công cụ (${ma}): ${dong}${bo ? ` (+${bo} lần trong ${NK_MS / 1000} giây trước, chưa ghi)` : ""}`, o.ip ? { ip: o.ip } : {});
    console.warn(`[nghi công cụ] ${tk.ten}${h && h.name ? ` (${h.name})` : ""} ${ma}: ${dong}`);
  } else s.nkBo.set(ma, (s.nkBo.get(ma) | 0) + 1);
  const co = tk.nghiTool && Array.isArray(tk.nghiTool.ma) && tk.nghiTool.ma.includes(ma);
  if (co && t - s.ghiLuc < GHI_MS) return false; // đã có mã này trên cờ, vừa ghi: để bộ hẹn giờ gộp
  apVao(tk, s, t);
  if (o.luu !== false) D.ghiTk(tk);
  return true;
}

// ---- mã trang (x-trang) ----
function nhoTrang(ten, trang) {
  if (!trang) return;
  let m = TRANG.get(ten); if (!m) TRANG.set(ten, (m = new Map()));
  m.delete(trang); m.set(trang, Date.now());
  while (m.size > 6) m.delete(m.keys().next().value);
}
const trangCo = (ten, trang, t) => { const m = TRANG.get(ten), at = m && m.get(trang); return !!at && t - at <= TRANG_GIU; };
// trang KHÁC của tài khoản vừa gửi nhịp (đang chơi) — có thì mã trang lạ chắc chắn không phải trang game đó
function trangKhac(ten, trang, t) { const m = TRANG.get(ten); if (m) for (const [k, at] of m) if (k !== trang && t - at <= TRANG_CHO) return true; return false; }

// api.js (mọi yêu cầu đã đăng nhập, trước khi làm việc): Sec-Fetch-Site; nhịp: nhớ mã trang; API NPC: mã trang thiếu -> ghi ngay, lạ -> chờ xét
function yeuCau(tk, req, p, m, b, trang) {
  if (!tk || !tk.ten || m !== "POST") return;
  const H = (req && req.headers) || {}, sf = sach(H["sec-fetch-site"], 24).toLowerCase();
  const o = b && typeof b === "object" && b.o != null ? b.o | 0 : -1, h = o >= 0 && Array.isArray(tk.nv) ? tk.nv[o] || null : null;
  if (sf && sf !== "same-origin") ghi(tk, h, "sec-fetch", `${p} — Sec-Fetch-Site: ${sf} (trang game luôn same-origin: GM_xmlhttpRequest / trang khác)`, { ip: ipCua(req) });
  if (p === "/api/nhip") return nhoTrang(tk.ten, trang);
  if (!API_NPC.has(p)) return;
  const viec = `${p.slice(5)} ${sach(b && typeof b === "object" ? b.viec ?? b.act ?? "" : "", 20)}`.trim();
  if (!trang) return void ghi(tk, h, "x-trang", `${viec}: thiếu / sai dạng mã trang x-trang (trang game luôn gửi — lời gọi không qua trang game)`, { ip: ipCua(req) });
  const t = Date.now();
  if (trangCo(tk.ten, trang, t)) return;
  const kc = tk.ten + "\u0001" + trang;
  if (CHO_KHOA.has(kc) || (CHO_DEM.get(tk.ten) | 0) >= CHO_TK || CHO.length >= CHO_MAX) return;
  CHO_KHOA.add(kc); CHO_DEM.set(tk.ten, (CHO_DEM.get(tk.ten) | 0) + 1);
  CHO.push({ ten: tk.ten, nv: h ? String(h.name || "") : "", trang, viec, t });
}
// API NPC mang mã trang lạ đã chờ đủ TRANG_CHO: trang đó vẫn không gửi nhịp mà trang khác của tài khoản đang chơi -> ghi; trang đó đã gửi nhịp (vừa F5) / không
// trang nào đang chơi (không đủ căn cứ) -> bỏ
function xetCho(t) {
  const doc = new Map(); // tài khoản -> tk đã đọc trong lượt này (đọc tệp 1 lần / tài khoản)
  while (CHO.length && t - CHO[0].t >= TRANG_CHO) {
    const c = CHO.shift(), n = (CHO_DEM.get(c.ten) | 0) - 1;
    CHO_KHOA.delete(c.ten + "\u0001" + c.trang); if (n > 0) CHO_DEM.set(c.ten, n); else CHO_DEM.delete(c.ten);
    if (trangCo(c.ten, c.trang, t) || !trangKhac(c.ten, c.trang, t)) continue;
    if (!doc.has(c.ten)) doc.set(c.ten, D.docTk(c.ten) || null);
    const tk = doc.get(c.ten); if (!tk) continue;
    ghi(tk, c.nv ? { name: c.nv } : null, "x-trang", `${c.viec}: mã trang lạ — trang này không gửi nhịp trong khi trang khác của tài khoản đang chơi (lời gọi từ ngoài trang game)`);
  }
}

// ---- trình duyệt tự dò (src/game/do-cong-cu.js — nhịp mang dct) ----
function sachDct(x) {
  if (!x || typeof x !== "object" || !Array.isArray(x.ma)) return null;
  const ma = [...new Set(x.ma.slice(0, 32).filter((m) => typeof m === "string" && Object.prototype.hasOwnProperty.call(TEN_DCT, m)))].slice(0, 8); // chỉ mã đã biết
  return ma.length ? { ma, bc: sach(x.bc, 80) } : null;
}
function nhip(tk, h, b) {
  const d = sachDct(b && b.dct); if (!d) return false;
  let doi = false;
  for (const m of d.ma) if (ghi(tk, h, "dct:" + m, `trình duyệt tự dò: ${TEN_DCT[m] || m}${d.bc ? ` — ${d.bc}` : ""}`, { luu: false })) doi = true;
  return doi;
}

// bộ hẹn giờ: ghi phần đệm đã quá GHI_MS (đọc lại tài khoản từ tệp — không giữ bản cũ), xét mã trang chờ, dọn trạng thái cũ
function xaHet(t = Date.now()) {
  for (const [ten, s] of S) {
    if (s.dem && t - s.ghiLuc >= GHI_MS) {
      const tk = D.docTk(ten);
      if (tk) { apVao(tk, s, t); D.ghiTk(tk); } else { s.cho = []; s.dem = 0; s.them.clear(); }
    }
    if (!s.dem && t - s.luc > 30 * 60e3) S.delete(ten);
  }
  for (const [ten, m] of TRANG) { for (const [k, at] of m) if (t - at > TRANG_GIU) m.delete(k); if (!m.size) TRANG.delete(ten); }
  xetCho(t);
}
setInterval(() => { try { xaHet(); } catch (e) { console.error("nghi-tool: " + e.message); } }, HEN_MS).unref();

// quản trị vừa xóa cờ: bỏ phần đệm + mã trang chờ (không dựng lại cờ từ lần nghi trước khi xóa)
function xoa(ten) { S.delete(ten); CHO = CHO.filter((c) => c.ten !== ten); for (const k of [...CHO_KHOA]) if (k.startsWith(ten + "\u0001")) CHO_KHOA.delete(k); CHO_DEM.delete(ten); }

const tomTat = (C) => (C && typeof C === "object" ? { lan: C.lan | 0, luc: C.luc || 0, ma: Array.isArray(C.ma) ? C.ma : [], nv: C.nv || "", manh: (Array.isArray(C.ma) ? C.ma : []).some((m) => !YEU.has(m)) ? 1 : 0 } : null);

module.exports = { ghi, yeuCau, nhip, xoa, sachDct, tomTat, xaHet, API_NPC, YEU, TEN_DCT, _thu: { S, TRANG, CHO_KHOA, CHO_DEM, get CHO() { return CHO; } } };
