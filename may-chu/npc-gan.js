// Đứng gần NPC (anh 13/11 — công cụ "VÕ LÂM S2 PRO AUTO" gọi /api/da-tau, /api/sat-thu… ngay từ bãi train: làm Dã Tẩu "Free 100%" không qua Tự làm trả Xu,
// nhận boss Sát thủ / vào ải không gặp Nhiếp Thí Trần; anh chọn: máy chủ CHẶN khi không ở đúng bản đồ + gần NPC, ghi bằng chứng — may-chu/nghi-tool.js, không
// tự khóa). Bảng chỗ đứng NPC phía máy chủ dựng từ dữ liệu client như trình duyệt (src/game/main.js zoneNpcs): assets/data/mapnpcs.json (NPC bản đồ client) +
// npc-them.json (NPC game thêm) + vat-ban-do.json (Rương chứa đồ); bãi Phong Hỏa (kind "chiến" — main.js phNpcs) / chiến trường Tống Kim (kind "tongkim" —
// tkNpcs) lấy phong-hoa.json / tong-kim.json (đã là px web). Tọa độ logic client -> px web như main.js zoneNpcs xy: x = (X − region[0]·512)·scale, y = ((Y −
// region[1]·1024) / 2)·scale — region của bản đồ client, scale 0,75 (bảng bản đồ do.js đã nạp: NOI.MAPS / NOI.FULL, không nạp lại). Khoảng cách như client:
// ldist = hypot(dx, 2·dy) (src/game/map.js). Chỗ đứng người chơi: the-gioi.js dangChoi (mốc cuối, nhịp ≤ 6 giây, phải đúng nhân vật của yêu cầu); không đúng
// nhân vật (2 thẻ cùng tài khoản) / lỡ nhịp: the-gioi.js viTriNv — chỗ đứng của đúng nhân vật đó từ nhịp ≤ VT_TUOI (20 giây).
// Kiểm chứng: Dã Tẩu Ba Lăng logic (52033, 101523) -> px (7537, 3895); Hắc Bạch Sứ Giả Biện Kinh (56584, 97456) -> (16326, 9282).
//   vai trò (vai): daTau (script seasonnpc.lua — Ba Lăng 53, Biện Kinh 37), satThu (Nhiếp Thí Trần — npc-them s1:sat-thu, 53), suGia (Hắc Bạch Sứ Giả — npc-them
//   mc "su", 37 / 53; KHÔNG dùng minh-chu.json suGia — chỗ cũ, chỉ để hiện chữ), ruong (Rương chứa đồ, Thủ khố đảo), shop (NPC có Sale trong npcdialog.json,
//   Dược phiến đảo, Quân Nhu quan Phong Hỏa, Quân y Tống Kim); thêm leQuan, xaPhu, tienTrang, thanTai, viemDe, bauCua, tayTuy, choTroi (chưa chặn — để anh quyết); voSu (Võ sư Ba
//   Lăng) + cungNu (Chưởng Đăng Cung Nữ) — Báo Đáp Ân Sư (anh 16/11)
//   npcCua(bãi, vai?) -> [{ x, y, ten, vai: [..] }]
//   kiemGan(tài khoản, h, vai, R = 500) -> { ok, ly: null | "chua-vi-tri" | "sai-ban-do" | "xa", kc, zone, x?, y?, nv? }
//   chan(tk, p, m, b) — api.js gọi trước khi làm việc của API (sau khóa an toàn). Sai: ghi cờ rồi ném lỗi 400 ma "xa-npc" (trình duyệt hiện câu báo). Cờ ĐỎ
//   "xa-npc" chỉ khi gọi từ bản đồ khác VÀ 2 nhịp sau lời gọi vẫn ở bản đồ đó (XAC — máy chủ lag: nhịp bản đồ mới chưa tới); cùng bản đồ mà xa "xa-npc-gan", chưa rõ
//   chỗ đứng "npc-vi-tri" — cờ VÀNG (soát 13/11):
//     /api/da-tau   mọi việc TRỪ den / hoanPhu / xongLenh (gọi từ xa hợp lệ: bảng nhiệm vụ "Đưa ta đến", hoàn phù, Lệnh bài trong túi) và chon ngay sau Lệnh bài
//                   (h.daTau.lenhChon — da-tau.js xongNhanh "lenh"; khung chọn thưởng hiện tại chỗ)
//     /api/sat-thu  mọi việc (Nhiếp Thí Trần)
//     /api/minh-chu việc của Hắc Bạch Sứ Giả (mo nhan thuong nhanGiet nhanThu nhanHai matThu xongGiet xongThu xongHai); nguoi / traoThu / haiBat / hai giữ kiểm cũ
//     /api/vuot-ai  chỉ nhận ra | chet | xem (việc trong ải); mo | vao | veAi chỉ đi qua Nhiếp Thí Trần (/api/sat-thu) -> chặn
//     /api/tu-lam   dt | st phải ở bãi có NPC đó (dt: Dã Tẩu 53 / 37, st: Nhiếp Thí Trần 53; sai bãi / chưa rõ chỗ: chặn, cờ VÀNG tu-lam-xa / npc-vi-tri —
//                   tính năng trả Xu, không phải đường lách) — đúng bãi mà xa thì CHO QUA + ghi "xa-npc-log" (tính năng trả Xu,
//                   trình duyệt kẹt 40 giây vẫn gọi tại chỗ — src/game/tulam.js TOI_NPC); "mo" (mở khóa bằng Xu) ở đâu cũng được
//     /api/bang-hoi chỉ việc lap (lập bang) — vai bangHoi: Người hướng dẫn bang hội (npc-them bh: 1, Ba Lăng 53 / Biện Kinh 37 — anh 14/11); việc khác ở khung Bang phái
//     /api/khu-bang chỉ việc xaPhu (lộ phí về thành) — vai xaPhuBang: Xa phu khu vực bang hội (npc-them bhVai "xaPhu", bãi bang 586 / 590 / 593 — bang hội đợt 4); Rương chứa
//                   đồ trong khu có vai ruong (viec "ruong"); câu "hãy tới … gặp …" (noiCo) không chỉ tới khu vực bang (mỗi bang một bản)
//     /api/bao-dap-an-su (Báo Đáp Ân Sư — anh 16/11) moiRuou / dang: Võ sư (voSu); doi / muaTo: Chưởng Đăng Cung Nữ (cungNu); tt miễn. NPC mới thêm vào npc-them.json
//                   -> khởi động lại máy chủ (bảng chỗ đứng đệm lúc dùng đầu — CACHE)
//   Chỉ GHI ("xa-npc-log", chưa chặn — số liệu để anh quyết): /api/do mua / sua / muaLai xa cửa hàng (> R_SHOP), rương chứa đồ kho 0–3 (cat lay datR chuyenR xep
//   gui rut datMk doiMk — không xét túi tử mẫu "tm" / hành trang) xa rương (> R_RUONG), Trợ Thủ việc ở thành (thanh / catDo) khi không ở thành / thôn
"use strict";
const fs = require("fs");
const path = require("path");
const TG = require("./the-gioi");
const DO = require("./do");
const NT = require("./nghi-tool");
const D = require("./du-lieu");

const N = DO.NOI, ROOT = path.join(__dirname, "..");
// ldist px web: hội thoại mở ≤ 70 + trễ mốc + NPC đứng trên ô vật cản (dừng cách ≤ 6 ô); rương tự đóng > 220. R_NPC 500 (soát 13/11; trước 250): kênh tức thời
// đứt thì mốc chỉ qua nhịp (0,45 giây + mạng) — chạy nhanh (ngựa, giày) lệch hơn 250; chặn công cụ là nhờ kiểm BẢN ĐỒ, bán kính rộng không mất gì
const R_NPC = 500, R_RUONG = 300, R_SHOP = 400;
const VT_TUOI = 20 * 1000; // chỗ đứng theo nhân vật từ nhịp còn dùng được (the-gioi.js viTriNv)
const ldist = (dx, dy) => Math.hypot(dx, 2 * dy);
const docJson = (f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")); } catch (e) { console.error(`npc-gan: không đọc được ${f}: ${e.message}`); return null; } };
let DL_ = null;
const DL = () => DL_ || (DL_ = { mapNpcs: docJson("assets/data/mapnpcs.json") || { maps: {} }, npcThem: docJson("assets/data/npc-them.json") || { maps: {} },
  vatBanDo: docJson("assets/data/vat-ban-do.json") || { maps: {} }, ph: docJson("assets/data/phong-hoa.json"), tk: docJson("assets/data/tong-kim.json") });
// script có cửa hàng (hội thoại có lệnh Sale — npcdialog.json, như main.js banThuoc): nạp lúc cần
let SALE = null;
function coSale(script) {
  if (!SALE) { const d = docJson("assets/data/npcdialog.json"); SALE = new Set(Object.entries((d && d.scripts) || {}).filter(([, s]) => Object.values((s && s.nodes) || {}).some((nd) => (nd.acts || []).some((a) => Array.isArray(a) && a[0] === "Sale"))).map(([k]) => k)); }
  return SALE.has(script);
}
const TEN_VAI = { daTau: "Dã Tẩu", satThu: "Nhiếp Thí Trần", suGia: "Hắc Bạch Sứ Giả", ruong: "Rương chứa đồ", shop: "NPC cửa hàng", leQuan: "Lễ quan", xaPhu: "Xa phu",
  tienTrang: "Chủ tiền trang", thanTai: "Thần Tài", viemDe: "Bình Bình cô nương", bauCua: "Chủ sòng bạc", tayTuy: "Thích Minh", choTroi: "Chủ Chợ Trời", bangHoi: "Người hướng dẫn bang hội", xaPhuBang: "Xa phu khu vực bang hội",
  loiDai: "Công Bình Tử", duaNgua: "Truy Phong Sứ Giả", voSu: "Võ sư", cungNu: "Chưởng Đăng Cung Nữ", thoRen: "Thợ rèn", thuongNhan: "Thương nhân thần bí" }; // loiDai: Lôi Đài (anh 15/11 — npc-them.json s1:loi-dai, Ba Lăng 53 / Biện Kinh 37); duaNgua: đua ngựa (anh 16/11 — s1:dua-ngua, Ba Lăng 53)
// voSu / cungNu: Báo Đáp Ân Sư (anh 16/11) — Võ sư Ba Lăng (NPC client mapnpcs.json, script 巴陵县武师.lua) / Chưởng Đăng Cung Nữ (npc-them.json s1:chuong-dang, Ba Lăng 53)
// NPC bản đồ client (mapnpcs.json talk) theo script
function vaiTalk(n) {
  const s = String(n.script || ""), L = [];
  if (/seasonnpc\.lua$/i.test(s)) L.push("daTau");
  if (/巴陵县武师\.lua$/.test(s)) L.push("voSu"); // Võ sư Ba Lăng — Báo Đáp Ân Sư (anh 16/11): mời Đỗ Khang Tửu / dâng Ngũ Sắc Hương Bao
  if (/路人_礼官\.lua$/.test(s)) L.push("leQuan");
  if (/(巴陵县_铁匠对话|汴京_铁匠[12]对话)\.lua$/.test(s)) L.push("thoRen"); // Thợ rèn Ba Lăng / Biện Kinh — khảm nạm Thủy tinh (anh 17/11)
  if (/驿站车夫对话\.lua$/.test(s)) L.push("xaPhu");
  if (/赌场老板对话\.lua$/.test(s)) L.push("bauCua");
  if (s && coSale(s)) L.push("shop");
  return L;
}
// NPC game thêm (npc-them.json) theo cờ / script
const vaiThem = (n) => [n.sat && "satThu", n.mc === "su" && "suGia", n.pq && "thanTai", n.vd && "viemDe", n.bc && "bauCua", n.tay && "tayTuy", n.viec === "ruong" && "ruong",
  n.script === "s1:tien-trang" && "tienTrang", n.script === "s1:cho-troi" && "choTroi", n.script === "s1:duoc-dao" && "shop", n.bh && "bangHoi", n.bhVai === "xaPhu" && "xaPhuBang",
  n.script === "s1:loi-dai" && "loiDai", n.script === "s1:dua-ngua" && "duaNgua", n.script === "s1:chuong-dang" && "cungNu", n.script === "s1:thuong-nhan" && "thuongNhan"].filter(Boolean); // s1:thuong-nhan: Thương nhân thần bí (khảm nạm — anh 17/11) // s1:chuong-dang: Chưởng Đăng Cung Nữ (Báo Đáp Ân Sư — anh 16/11) // bh: Người hướng dẫn bang hội (anh 14/11); bhVai xaPhu: Xa phu khu vực bang (đợt 4); s1:loi-dai: Công Bình Tử (Lôi Đài — anh 15/11)

const CACHE = new Map(); // mã bãi -> [{ x, y, ten, vai }]
function dung(z) {
  const Z = N.ZONES.get(z); if (!Z) return [];
  if (Z.kind === "chiến") { // Phong Hỏa Liên Thành — đại doanh (main.js laPh / phNpcs)
    const P = DL().ph; if (!P) return [];
    return [...(P.quanNhu || []).map(([x, y]) => ({ x, y, ten: "Quân Nhu quan", vai: ["shop"] })), ...(P.ruong || []).map(([x, y]) => ({ x, y, ten: "Rương chứa đồ", vai: ["ruong"] })),
      ...(Array.isArray(P.xaPhu) ? [{ x: P.xaPhu[0], y: P.xaPhu[1], ten: "Xa phu", vai: ["xaPhu"] }] : [])];
  }
  if (Z.kind === "tongkim") { // chiến trường Tống Kim — 2 hậu doanh (main.js laTk / tkNpcs)
    const T = DL().tk; if (!T || !Array.isArray(T.phe)) return [];
    return T.phe.flatMap((P0) => { const H = (P0 && P0.hau) || {}; return [...(H.quanY ? [{ x: H.quanY[0], y: H.quanY[1], ten: "Quân y", vai: ["shop"] }] : []), ...(H.ruong ? [{ x: H.ruong[0], y: H.ruong[1], ten: "Rương chứa đồ", vai: ["ruong"] }] : [])]; });
  }
  const M = (N.FULL && N.FULL.maps && N.FULL.maps[Z.map]) || (N.MAPS && N.MAPS.maps && N.MAPS.maps[Z.map]), c = M && M.client;
  if (!c || !Array.isArray(c.region)) return [];
  const s = +(N.MAPS && N.MAPS.scale) || 0.75, id = String(c.id), A = DL();
  const xy = (n) => ({ x: Math.round((n.x - c.region[0] * 512) * s), y: Math.round(((n.y - c.region[1] * 1024) / 2) * s) });
  const talk = ((A.mapNpcs.maps || {})[id] || {}).talk || [], them = (A.npcThem.maps || {})[id] || [], vat = (A.vatBanDo.maps || {})[id] || [];
  return [...talk.map((n) => ({ ...xy(n), ten: n.name, vai: vaiTalk(n) })), ...them.map((n) => ({ ...xy(n), ten: n.name, vai: vaiThem(n) })),
    ...vat.map((o) => ({ ...xy(o), ten: o.ten, vai: o.viec === "ruong" ? ["ruong"] : [] }))].filter((n) => Number.isFinite(n.x) && Number.isFinite(n.y));
}
function npcCua(zone, vai) {
  const z = zone | 0;
  if (!N.ZONES.has(z)) return []; // bãi không có thật (nhịp gửi số bãi tùy ý): không giữ bảng cho nó (soát 13/11)
  let L = CACHE.get(z); if (!L) CACHE.set(z, (L = dung(z)));
  return vai ? L.filter((n) => n.vai.includes(vai)) : L;
}
// thôn / thành có NPC vai trò này (câu báo "sai bản đồ")
const NOI_CO = new Map();
function noiCo(vai) {
  if (!NOI_CO.has(vai)) NOI_CO.set(vai, [...N.ZONES.values()].filter((Z) => N.THANH.has(Z.kind) && !Z.bang && npcCua(Z.id, vai).length) // khu vực bang (đợt 4): không chỉ người ngoài tới khu bang
    .sort((a, b) => (a.kind === "thôn" ? 0 : 1) - (b.kind === "thôn" ? 0 : 1)).map((Z) => Z.n).join(" / ")); // thôn (Ba Lăng — chỗ vào game) trước
  return NOI_CO.get(vai) || "";
}

function kiemGan(ten, h, vai, R = R_NPC) {
  const d0 = TG.dangChoi(ten);
  // bản đang chơi của tài khoản (mốc qua kênh tức thời) phải đúng nhân vật; không thì chỗ đứng của đúng nhân vật này từ nhịp ≤ VT_TUOI (2 thẻ cùng tài khoản: bản
  // đang chơi lật qua lại giữa 2 nhân vật; lỡ nhịp vài giây — soát 13/11)
  const d = d0 && h && d0.name === h.name ? d0 : h && typeof TG.viTriNv === "function" ? TG.viTriNv(ten, h.name, VT_TUOI) : null;
  if (!d || !h) return { ok: false, ly: "chua-vi-tri", kc: null, zone: d0 ? d0.zone : null, ...(d0 && h && d0.name !== h.name ? { nv: d0.name } : {}) };
  const L = npcCua(d.zone, vai), x = Math.round(d.x), y = Math.round(d.y);
  if (!L.length) return { ok: false, ly: "sai-ban-do", kc: null, zone: d.zone, x, y };
  const kc = Math.round(Math.min(...L.map((n) => ldist(d.x - n.x, d.y - n.y))));
  return kc <= R ? { ok: true, ly: null, kc, zone: d.zone, x, y } : { ok: false, ly: "xa", kc, zone: d.zone, x, y };
}

const tenBai = (z) => (z == null ? "?" : `${DO.tenBai(z) || "bản đồ"} (${z | 0})`);
// bằng chứng (dòng cờ / nhật ký)
function moTa(k, vai, R) {
  const ten = TEN_VAI[vai] || vai;
  if (k.ly === "xa") return `cách ${ten} ${k.kc} (giới hạn ${R}) ở ${tenBai(k.zone)}, đứng (${k.x}, ${k.y})`;
  if (k.ly === "sai-ban-do") return `đang ở ${tenBai(k.zone)} — không có ${ten}`;
  return k.nv ? `chỗ đứng là của nhân vật khác (${k.nv}) đang chơi` : "chưa có vị trí (không có nhịp ~20 giây — máy chủ vừa khởi động lại / không mở game?)";
}
const loiXa = (msg) => Object.assign(new Error(msg), { code: 400, ma: "xa-npc" });
function cau(k, vai) {
  const ten = TEN_VAI[vai] || vai, noi = noiCo(vai);
  if (k.ly === "xa") return `Hãy lại gần ${ten} rồi nói chuyện`;
  if (k.ly === "sai-ban-do") return `${ten} không ở bản đồ này${noi ? ` — hãy tới ${noi} gặp ${ten}` : ""}`;
  return `Chưa rõ chỗ đang đứng — hãy lại gần ${ten} rồi nói chuyện lại`;
}
// phải đứng gần: không thì 400 + cờ — khác bản đồ: "xa-npc" (mạnh — công cụ gọi từ bãi train); cùng bản đồ mà xa: "xa-npc-gan" (yếu — người thật để khung
// thoại mở rồi đi xa); chưa rõ chỗ đứng: "npc-vi-tri" (yếu — máy chủ vừa khởi động lại, lỡ nhịp)
const MA_LY = { "sai-ban-do": "xa-npc", xa: "xa-npc-gan", "chua-vi-tri": "npc-vi-tri" };
function phaiGan(tk, h, vai, viec, R = R_NPC) {
  const k = kiemGan(tk.ten, h, vai, R);
  if (k.ok) return k;
  if (k.ly === "sai-ban-do") choXac(tk, h, k, vai, viec, R); // cờ đỏ chờ 2 nhịp sau xác nhận
  else NT.ghi(tk, h, MA_LY[k.ly] || "npc-vi-tri", `${viec}: ${moTa(k, vai, R)} — đã chặn`);
  throw loiXa(cau(k, vai));
}
// chỉ ghi: xa / sai bản đồ -> cờ "xa-npc-log", vẫn cho làm
function ghiXa(tk, h, vai, viec, R) {
  const k = kiemGan(tk.ten, h, vai, R);
  if (!k.ok) NT.ghi(tk, h, "xa-npc-log", `${viec}: ${moTa(k, vai, R)} — chỉ ghi, chưa chặn`);
  return k;
}

const DT_MIEN = new Set(["den", "hoanPhu", "xongLenh"]); // Dã Tẩu gọi từ xa hợp lệ (main.js denDaTau / hoanPhu / dungVat Lệnh bài)
const SU_GIA = new Set(["mo", "nhan", "thuong", "nhanGiet", "nhanThu", "nhanHai", "matThu", "xongGiet", "xongThu", "xongHai"]);
const VA_CAM = new Set(["mo", "vao", "veAi"]); // /api/vuot-ai: việc của Nhiếp Thí Trần (vào ải) — trang game đi qua /api/sat-thu khieuChien / vaoAi / veAi
const ACT_SHOP = new Set(["mua", "sua", "muaLai"]);
const ACT_RUONG = new Set(["cat", "lay", "datR", "chuyenR", "xep", "gui", "rut", "datMk", "doiMk"]);
// kho 0–3 (rương chính / mở rộng — do.js ruongSo: thiếu = rương chính); "tm" túi tử mẫu, "tui" hành trang: ở đâu cũng được
const laKho = (r) => r == null || r === "" || (r !== "tm" && r !== "tui" && Number.isFinite(+r));
function dungRuong(b) {
  switch (b.act) {
    case "cat": case "lay": case "datR": return laKho(b.r);
    case "chuyenR": return laKho(b.tu) || laKho(b.den);
    case "xep": return b.kho != null && laKho(b.kho);
    default: return true; // gui / rut / datMk / doiMk: khung rương chứa đồ
  }
}
// Trợ Thủ việc ở thành (thanh / catDo): chỉ ghi khi không ở thành / thôn. Phong Hỏa (kind "chiến"): Trợ Thủ "ở lại trận" mua thuốc ở Quân Nhu quan bằng thanh
// không bán (main.js phMuaTick) — hợp lệ
function ghiThanh(tk, h, act, b) {
  // chỗ đứng như kiemGan: bản đang chơi đúng nhân vật, không thì chỗ đứng theo nhân vật từ nhịp (2 thẻ cùng tài khoản — soát 13/11)
  const d0 = TG.dangChoi(tk.ten), d = d0 && d0.name === h.name ? d0 : typeof TG.viTriNv === "function" ? TG.viTriNv(tk.ten, h.name, VT_TUOI) : null;
  if (!d) return NT.ghi(tk, h, "xa-npc-log", `do ${act}: Trợ Thủ việc ở thành — ${moTa({ ly: "chua-vi-tri", ...(d0 && d0.name !== h.name ? { nv: d0.name } : {}) })} — chỉ ghi, chưa chặn`);
  const Z = N.ZONES.get(d.zone), kind = Z ? Z.kind : "";
  if (N.THANH.has(kind) || (act === "thanh" && kind === "chiến" && !b.ban)) return;
  NT.ghi(tk, h, "xa-npc-log", `do ${act}: Trợ Thủ việc ở thành mà đang ở ${tenBai(d.zone)} (không phải thành / thôn) — chỉ ghi, chưa chặn`);
}

const CHAN_P = new Set(["/api/da-tau", "/api/sat-thu", "/api/minh-chu", "/api/vuot-ai", "/api/tu-lam", "/api/do", "/api/bang-hoi", "/api/khu-bang", "/api/loi-dai", "/api/dua-ngua", "/api/bao-dap-an-su", "/api/kham-nam"]); // chan chạy mỗi yêu cầu: đường khác thoát ngay
// /api/bao-dap-an-su (Báo Đáp Ân Sư — anh 16/11): việc -> vai NPC phải đứng gần — mời rượu / dâng hương bao ở Võ sư, đổi hương bao / mua Tơ Tằm ở Chưởng Đăng Cung
// Nữ; "tt" (xem trạng thái) và việc khác (bao-dap-an-su.js tự báo lỗi) miễn
const BDAS_NPC = { moiRuou: "voSu", dang: "voSu", doi: "cungNu", muaTo: "cungNu", nvLe: "voSu", nvNhan: "voSu", nvTra: "voSu" }; // nvLe / nvNhan / nvTra: nhiệm vụ ngày lễ (anh 18/11)
// /api/dua-ngua (đua ngựa — anh 16/11): chỉ việc hội thoại Truy Phong Sứ Giả (Ba Lăng) phải đứng gần; hop / dung / dich / roi / xem (trên đường đua — dua-ngua.js tự kiểm
// khoảng cách tới hộp / Ông chủ đường đua) miễn
const DN_NPC = new Set(["mo", "gioiThieu", "baoDanh", "nhan"]);
// /api/loi-dai (Lôi Đài — anh 15/11): chỉ việc hội thoại Công Bình Tử phải đứng gần (viec có thể kèm ":đối số" — bd:4, xem:2); roi / dangNhap / trangThai (trong sân, lúc vào game) miễn
const LD_NPC = new Set(["mo", "luat", "bd", "so", "vao", "xem"]);
function chan(tk, p, m, b) {
  if (m !== "POST" || !CHAN_P.has(p) || !tk || !Array.isArray(tk.nv) || !b || typeof b !== "object") return;
  const o = b.o | 0, h = o >= 0 && o < tk.nv.length ? tk.nv[o] : null;
  if (!h) return; // ô không có nhân vật: API tự báo
  const viec = String(b.viec ?? ""), ten = `${p.slice(5)} ${viec || "?"}`;
  switch (p) {
    case "/api/da-tau": {
      if (DT_MIEN.has(viec)) return;
      const D = h.daTau || {};
      if (viec === "chon" && D.lenhChon && D.buoc === 2) return; // chọn thưởng ngay sau khi dùng Lệnh bài (khung chọn thưởng hiện tại chỗ)
      return void phaiGan(tk, h, "daTau", ten);
    }
    case "/api/sat-thu": return void phaiGan(tk, h, "satThu", ten);
    case "/api/minh-chu": if (SU_GIA.has(viec)) phaiGan(tk, h, "suGia", ten); return;
    // bang hội (anh 14/11 — THIET-KE-BANG-HOI.md 1.1): chỉ lập bang phải đứng gần Người hướng dẫn bang hội (Ba Lăng / Biện Kinh); việc khác làm ở khung Bang phái, không chặn
    case "/api/bang-hoi": if (viec === "lap") phaiGan(tk, h, "bangHoi", ten); return;
    case "/api/khu-bang": if (viec === "xaPhu") phaiGan(tk, h, "xaPhuBang", ten); return; // khu vực bang (đợt 4): Xa phu khu (lộ phí về thành) phải đứng gần
    case "/api/loi-dai": if (LD_NPC.has((viec || "mo").split(":")[0])) phaiGan(tk, h, "loiDai", ten); return; // Lôi Đài: hội thoại Công Bình Tử
    case "/api/dua-ngua": if (DN_NPC.has(viec || "mo")) phaiGan(tk, h, "duaNgua", ten); return; // đua ngựa: hội thoại Truy Phong Sứ Giả
    case "/api/bao-dap-an-su": if (Object.prototype.hasOwnProperty.call(BDAS_NPC, viec)) phaiGan(tk, h, BDAS_NPC[viec], ten); return; // Báo Đáp Ân Sư: Võ sư / Chưởng Đăng Cung Nữ
    case "/api/kham-nam": if (viec === "kham" || viec === "hoanHinh" || viec === "hoanTinh") phaiGan(tk, h, "thoRen", ten); else if (viec === "muaHl" || viec === "muaDb") phaiGan(tk, h, "thuongNhan", ten); return; // khảm nạm (anh 17/11): Thợ rèn Ba Lăng / Biện Kinh, Hoán Linh Thạch ở Thương nhân thần bí; tt miễn
    case "/api/vuot-ai":
      if (VA_CAM.has(viec)) {
        NT.ghi(tk, h, "xa-npc", `${ten}: gọi thẳng /api/vuot-ai (vào ải chỉ qua hội thoại Nhiếp Thí Trần — /api/sat-thu) — đã chặn`);
        throw loiXa(`Vào ải Vượt Ải: hãy nói chuyện với Nhiếp Thí Trần${noiCo("satThu") ? ` (${noiCo("satThu")})` : ""}`);
      }
      return;
    case "/api/tu-lam": {
      if (viec !== "dt" && viec !== "st") return;
      const vai = viec === "st" ? "satThu" : "daTau", k = kiemGan(tk.ten, h, vai);
      if (k.ok) return;
      if (k.ly === "xa") return void NT.ghi(tk, h, "xa-npc-log", `${ten}: ${moTa(k, vai, R_NPC)} — đúng bản đồ nên cho qua (Tự làm kẹt 40 giây vẫn gọi tại chỗ)`);
      // Tự làm là tính năng trả Xu (không phải đường lách): chặn nhưng cờ VÀNG (vừa tới nơi nhịp chưa báo bản đồ mới — trình duyệt thử lại sau 4 giây)
      NT.ghi(tk, h, k.ly === "sai-ban-do" ? "tu-lam-xa" : "npc-vi-tri", `${ten}: ${moTa(k, vai, R_NPC)} — đã chặn`);
      throw loiXa(`Tự làm: ${cau(k, vai)}`);
    }
    case "/api/do": {
      const act = String(b.act || ""), t2 = `do ${act}`;
      if (ACT_SHOP.has(act)) return void ghiXa(tk, h, "shop", t2, R_SHOP);
      if (ACT_RUONG.has(act) && dungRuong(b)) return void ghiXa(tk, h, "ruong", t2, R_RUONG);
      if (act === "thanh" || act === "catDo") return void ghiThanh(tk, h, act, b);
      return;
    }
  }
}

// Gọi việc của NPC từ BẢN ĐỒ KHÁC: cờ đỏ chưa ghi ngay — chờ 2 nhịp sau lời gọi của đúng nhân vật (the-gioi.js viTriNv: n tăng mỗi nhịp; trang chỉ gửi 1 nhịp một
// lúc nên nhịp thứ 2 kể từ lúc máy chủ xét lời gọi chắc chắn được dựng SAU lời gọi). Vẫn ở bản đồ không có NPC đó -> "xa-npc" (đỏ — công cụ gọi từ bãi train, trang
// vẫn báo bãi train); đã ở bản đồ có NPC -> không ghi (vừa đổi bản đồ, nhịp bản đồ mới chưa tới — máy chủ lag); không có nhịp sau trong XAC_MS -> "npc-vi-tri" (vàng).
// Soát 13/11: về Ba Lăng bằng Xa phu / dưỡng sức (đổi bản đồ ở trình duyệt) rồi bấm ngay Dã Tẩu cách 130 lúc máy chủ chậm thì trước bị đỏ oan.
const XAC = new Map(), XAC_MS = 10 * 1000, XAC_MAX = 5000; // tài khoản + \u0001 + tên nhân vật -> { ten, nv, vai, bc, n0, t }
function choXac(tk, h, k, vai, viec, R) {
  const key = tk.ten + "\u0001" + h.name;
  if (XAC.has(key)) return; // đang chờ xác nhận: lời gọi sau từ cùng bản đồ sai gộp vào
  if (XAC.size >= XAC_MAX) return void NT.ghi(tk, h, "npc-vi-tri", `${viec}: ${moTa(k, vai, R)} — đã chặn (chưa xác nhận được bản đồ)`);
  const v = typeof TG.viTriNv === "function" ? TG.viTriNv(tk.ten, h.name, 60 * 1000) : null;
  XAC.set(key, { ten: tk.ten, nv: h.name, vai, bc: `${viec}: ${moTa(k, vai, R)} — đã chặn`, n0: v ? v.n | 0 : 0, t: Date.now() });
}
function xetXac(t = Date.now()) {
  for (const [key, c] of XAC) {
    const v = typeof TG.viTriNv === "function" ? TG.viTriNv(c.ten, c.nv, 60 * 1000) : null;
    if (v && (v.n | 0) >= c.n0 + 2) {
      XAC.delete(key);
      if (npcCua(v.zone, c.vai).length) continue; // nhịp sau đã ở bản đồ có NPC: vừa đổi bản đồ (nhịp bản đồ mới tới chậm) — không ghi
      const tk = D.docTk(c.ten); if (tk) NT.ghi(tk, { name: c.nv }, "xa-npc", `${c.bc} · 2 nhịp sau vẫn ở ${tenBai(v.zone)}`);
    } else if (t - c.t > XAC_MS) {
      XAC.delete(key);
      const tk = D.docTk(c.ten); if (tk) NT.ghi(tk, { name: c.nv }, "npc-vi-tri", `${c.bc} · không có nhịp sau để xác nhận bản đồ`);
    }
  }
}
setInterval(() => { try { xetXac(); } catch (e) { console.error("npc-gan xetXac: " + e.message); } }, 1000).unref();

module.exports = { npcCua, kiemGan, chan, ldist, noiCo, R_NPC, R_RUONG, R_SHOP, TEN_VAI, _thu: { XAC, xetXac } };
