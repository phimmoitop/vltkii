// Phong Hỏa Liên Thành (anh 04/11 — "tham khảo tính năng phong hỏa liên thành, xem trong client mình có không, điều chỉnh hợp lý với sv mình").
// Luật theo kịch bản máy chủ 8.1 Vinh (script\missions\newcitydefence — bản client giống hệt; lịch ở relay citydefence_1300 / 1430.lua):
//   - báo danh rồi khai chiến, quân Tống từ 3 doanh trại đi theo 3 đường về thành (smalltimer.lua cd_callnpc mỗi phút: Tiểu hiệu / Đội trưởng /
//     Tiên phong tỉ lệ 90 / 20 / 10 phần 120; mỗi 10 phút Chủ tướng — lúc khai chiến gấp đôi; mỗi 5 phút 3 Công Thành Chiến Xa; gần cuối 10 Chủ
//     soái, thôi lính thường, đóng báo danh); 12 Thần binh đứng canh 3 doanh trại địch; phe mình 30 Vệ binh + 3 Tướng quân thủ thành ở cổng thành.
//   - thua: 3 Tướng quân thủ thành tử trận (shouchengnpcdeath.lua), hoặc điểm thủ thành 24 về 0 — mỗi chiến xa tới cổng trừ 1 (trap_onroad.lua);
//     thắng: hết giờ mà thành còn (totaltimer.lua), hoặc hạ đủ 10 Chủ soái (npcdeath.lua).
//   - thưởng: kinh nghiệm giết quái (không tiền / đồ); thắng thì người còn trong trận thêm 2 × (10 triệu nếu kinh nghiệm kiếm trong trận ≥ 1 triệu;
//     floor(tổng / 100 nghìn) triệu nếu 500 nghìn – 1 triệu) — head.lua cd_awardall (kinh nghiệm gốc client: chưa nhân cau-hinh kinhNghiem);
//     chết không mất gì, hồi sinh ở đại doanh.
//   - bùa (anh 04/11 lượt 24 — npcdeath.lua dropItem): quân bị hạ rơi 18 loại bùa (Chiến Hồn / Hộ giáp / Lợi Nhận × 5 hệ, Hành quân đơn, Tiểu
//     hoàn đơn, Ngũ Hoa Lộ) — nhặt là dùng ngay, trạng thái 30 giây – 1 phút (do.js nhatBua; bảng ky-tran-cac.json bua). Bốc: CF.bua (boc).
//   - trận 20 phút (anh 04/11 lượt 25 — "thời gian đánh 1 tiếng lâu quá, em cho báo danh 5 phút, đánh 20 phút thôi … căn sao cho hợp lý, tốc độ
//     di chuyển của từng đợt"; "4-6 ng vào đánh test mà chơi chán, k có cao trào"): báo danh CF.baoDanh, đánh CF.danh phút; 3 đợt quân CF.giaiDoan
//     (Tiền quân / Trung quân / Đại quân — mỗi đợt thêm lính sống, nhiều Đội trưởng / Tiên phong hơn, hành quân nhanh hơn, thêm Chủ tướng; báo cả máy
//     chủ), chiến xa theo lịch CF.xe [phút, số xe, tốc độ] — càng về cuối càng đông, càng nhanh (điểm thủ thành CF.diem), Chủ soái ra ở phút CF.chuSoai
//     (hành quân CF.tocSoai × tốc độ chạy) — cao trào 6 phút cuối; báo còn 3 / 1 phút. Mốc phút tính theo tỉ lệ thời gian trận (D.tl — trận quản
//     trị thử ngắn hơn thì lịch co lại). Tốc độ hành quân gửi trong dòng quân (trình duyệt: phonghoa.js — lính đi = tốc độ chạy × toc).
//   - quân hạng cao ra chiêu (anh 04/11 lượt 25 — "mấy con quái cấp cao hay chủ tướng gì đó, em thiết kế skill 30-90 các phái cho nó đánh người
//     chơi"): chieuCua — Tiên phong 1 chiêu 3x / 4x, Chủ tướng 2 chiêu 5x – 7x của 2 phái cùng hệ ngũ hành với con đó, Chủ soái / Thần binh chiêu 9x
//     của mẫu client (CHIEU); sát thương mỗi chiêu = đòn thường × CHIEU.st (trình duyệt vocong.js ganChieuDs / misHitHero — chỉ máy người bị đánh trừ
//     máu); Tiểu hiệu / Đội trưởng / chiến xa / phe mình đánh thường như cũ.
// Anh chốt cho S1 (04/11): mở hằng ngày CF.gio (19:00 — anh đổi từ 18:00) — báo danh CF.baoDanh phút, đánh CF.danh phút, Chủ soái ra ở phút CF.chuSoai; cấp ≥ CF.cap
// (90), phí CF.phi (100 vạn — 1 lần mỗi trận); vào bằng Vệ binh thành môn Biện Kinh (người chơi tự đi — Trợ Thủ không tự đi); phe Kim giữ thành;
// vệ binh / tướng quân đánh trả như gốc; cấp quân = cấp trung bình người trong trận — mẫu client (makeboss.lua) chỉ số cố định tính cho trận vài trăm
// người (máu 80 nghìn – 20 triệu, kháng 80–95 %, lính không có sát thương riêng) -> máu / sát thương = quái thường bãi chính cùng cấp × CF.manh[loại]
// (do.js quaiCap, như Boss Sát thủ bậc cao), chính xác / né tránh mẫu client × hệ số cấp, kháng tối đa CF.khangMax, kinh nghiệm giữ tỉ lệ kinh nghiệm
// / máu của mẫu client; số lính sống / Chủ tướng theo số người trong trận.
// Quái chung như bãi quái chung (may-chu/quai-chung.js): máy chủ giữ danh sách + máu + chết + thưởng; máy "chủ bãi" (1 người trong trận, tab hiện
// trước) chạy quân 2 phe: lính đi theo đường (assets/data/phong-hoa.json — cong-cu/dung-phong-hoa.mjs), chọn mục tiêu (người chơi / NPC phe mình),
// đánh nhau giữa NPC 2 phe (báo sát thương "phn"), báo vị trí 10 lần / giây ("phh"), báo chiến xa tới cổng ("phx"). Sát thương người chơi "phd"
// (như qcd). Không ai trong trận thì quân đứng yên (thời gian vẫn chạy).
// Kênh tức thời: trình duyệt -> "phVao" { s } · "phAn" { an } · "phd" { s, d: [[mã, st]], st } · (chủ bãi) "phn" { d: [[mã, st]] } · "phh" { ts, q: [[mã,
//   x, y, mục tiêu (tên người | "#mã" NPC | ""), số đòn, chặng]] } · "phx" { u }; máy chủ -> "ph" { p } (trạng thái — đủ: q + vt) · "phh" · "pht".
// HTTP: /api/phong-hoa { o, viec: "mo" | "vao" } (Vệ binh thành môn) · /api/phong-hoa-qt (quản trị thử: "mo" | "huy" | "ket" | "xem").
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const WS = require("./ws.js");
const GV = require("./gio-vn.js"); // giờ Việt Nam + ngày trong tuần của lịch (GM chỉnh ở F10 — lich-hd.js)
const TG = () => require("./the-gioi.js");
const NK = () => require("./nhat-ky.js");
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến cuối trận (thắng 100 / có đánh 50) — nạp lúc dùng

const N = DO.NOI, MS = DO.mobStats;
const PD = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/phong-hoa.json"), "utf8")); } catch { return null; } })();
const BAI = PD ? PD.bai : 580;
const CF = {
  bat: true, gio: "19:00", baoTruoc: 5, baoDanh: 5, danh: 20, chuSoai: 14, cap: 90, phi: 1000000, diem: 10,
  dot: 30, song: [40, 8, 120], tiLe: [90, 20, 10], chuTuong: [3, 3], capGoc: 95, capMax: 200,
  stGiay: +((N.CFG.quaiChung || {}).stGiay) || 600000, npcGiay: 5000000, thuong: { duoi: 500000, tren: 1000000, toiDa: 10000000, nhan: 2, ruongXanh: 3 },
  raSau: 30, giuKq: 120, khangMax: 50,
  // [máu, sát thương] × quái thường bãi chính cùng cấp (do.js quaiCap) — giữ thứ bậc máu của mẫu client (Tiểu hiệu 80 nghìn … Thần binh 20 triệu),
  // thu nhỏ cho máy chủ ít người; xe không đánh (VisionRadius 0)
  manh: { th: [3, 1.5], dt: [15, 2.5], tp: [30, 3.5], ct: [80, 5], cs: [150, 6], xe: [40, 0], tb: [300, 6], ve: [3, 1.5], tq: [20, 2.5] },
  // rơi thêm khi hạ quân loại roi.loai (anh 04/11 lượt 19c): mỗi dòng ds [tỉ lệ, [món…]] bốc riêng (trúng thì 1 món ngẫu nhiên trong danh sách), xu [tỉ
  // lệ, ít nhất, nhiều nhất] — người đánh nhiều nhất nhận
  roi: { loai: ["dt", "tp", "ct", "cs", "xe", "tb"], ds: [[0.005, ["qk:238", "qk:239", "qk:240", "qk:353"]], [0.01, ["ms:23"]]], xu: [0.001, 1, 2] },
  // bùa (anh 04/11 lượt 24 — client npcdeath.lua: ITEM_DROPRATE_TABLE / NPC_RANK_DROPRATE_TABLE): hạ quân hạng r (HANG: Tiểu hiệu 1, Đội trưởng 2, Tiên
  // phong 3, Chủ tướng 4, Chủ soái 5; chiến xa / Thần binh không rơi) -> lan[r] lần bốc, mỗi lần trúng (số món bùa × tiLe[r] × heSo) thì người nhận
  // trọn có 1 bùa ngẫu nhiên nằm đất; heSo = hệ số S1 (client tính cho trận vài trăm người); manh[hiệu quả] = nhân trị số (do.js nhatBua)
  bua: { bat: true, heSo: 2, tiLe: [0.0005, 0.001, 0.002, 0.01, 0.02], lan: [1, 2, 3, 4, 5], manh: {} },
  // đợt quân (anh 04/11 lượt 25): từ phút tu của trận — song × số lính sống, tiLe Tiểu hiệu / Đội trưởng / Tiên phong, toc × tốc độ hành quân,
  // tuong = Chủ tướng thêm (đợt Chủ tướng lúc vào đợt: soTuong + tuong)
  giaiDoan: [{ tu: 0, ten: "Tiền quân", song: 1, tiLe: [90, 20, 10], toc: 1, tuong: 0 }, { tu: 5, ten: "Trung quân", song: 1.25, tiLe: [80, 25, 15], toc: 1.1, tuong: 1 },
    { tu: 10, ten: "Đại quân", song: 1.5, tiLe: [70, 30, 20], toc: 1.2, tuong: 2 }],
  // chiến xa: [phút của trận, số xe, tốc độ hành quân]; Chủ soái hành quân tocSoai × tốc độ chạy
  xe: [[2, 2, 0.8], [6, 3, 0.9], [10, 3, 1], [14, 4, 1.1], [17, 4, 1.25]], tocSoai: 0.5,
  ...(N.CFG.phongHoa || {}),
};
const BU = { bat: true, heSo: 2, tiLe: [0.0005, 0.001, 0.002, 0.01, 0.02], lan: [1, 2, 3, 4, 5], ...(CF.bua || {}) };
const HANG = { th: 1, dt: 2, tp: 3, ct: 4, cs: 5 }; // hạng quân của npcdeath_<hạng>.lua (chiến xa không rơi; Thần binh không có kịch bản chết)
// chiêu quân hạng cao (anh 04/11 lượt 25 — chieuCua): tp / ct = [chiêu của hệ 0 … 4] (mã skills.json; 2 phái cùng hệ ngũ hành, bỏ bẫy / lướt / hỗ
// trợ): Tiên phong 3x / 4x (Thiếu Lâm không có chiêu đánh 3x / 4x -> Sư Tử Hống 5x; Cái Bang không có -> chỉ Thiên Nhẫn), Chủ tướng 5x – 7x; mau =
// { mẫu: chiêu 9x của mẫu client } (monsters.json sk — Tống Chủ Soái sl / tw / tm / wu / em / cy / tr / gb / wd / kl, Thần binh tr / wd; bỏ Đoạn Hồn
// Thích lướt, Loạn Hoàn Kích bẫy); so = số chiêu mỗi con (mỗi lần ra bốc 1 chiêu đủ tầm), st = sát thương mỗi chiêu × đòn thường. CF.chieu đè từng khóa
const CHIEU = {
  st: { tp: 1.5, ct: 2, cs: 2.5, tb: 2.5 }, so: { tp: 1, ct: 2 },
  tp: [[20, 37, 35, 31], [50, 54, 47, 68, 384], [385, 82, 105, 113], [141, 138], [164, 158, 172]],
  ct: [[271, 11, 19, 32, 41, 324], [249, 58, 341, 71, 74], [88, 91, 108, 111], [128, 125, 142, 148], [165, 267, 176, 182]],
  mau: { 1080: [318, 20], 1081: [323], 1082: [302, 342], 1083: [353, 355], 1084: [328, 380], 1085: [336, 337], 1086: [361, 362], 1087: [357, 128, 359],
    1088: [368, 365], 1089: [372, 375], 1119: [361, 362], 1120: [368, 365] },
  ...(CF.chieu || {}),
};
const GUI_MS = 100, NHAC_MS = 1000, SONG_MS = 10000, CHU_MS = 5000, XAC_MS = 2500, NK_GIU = 600, TIN_GIU = 12, XE_TOI_R = 420, XE_MIN_MS = 45000;
const VAI = { th: "tieuHieu", dt: "doiTruong", tp: "tienPhong", ct: "chuTuong", cs: "chuSoai", xe: "xe", tb: "thanBinh", ve: "veBinh", tq: "tuongQuan" };
const mau = (v) => (PD ? PD.mau[VAI[v]] : { tpl: [0], ten: "", loai: 0 });
const ldist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, (y2 - y1) * 2);
const chon = (a) => a[Math.floor(Math.random() * a.length)];
const vn = (n) => Math.round(n).toLocaleString("vi-VN");

let D = null;              // trận đang mở / vừa xong
const CHO = new Map();     // tài khoản -> [thưởng giết quái chờ nhịp sau: { u (mã trận), r, he, top, kn }]
const KET = new Map();     // tài khoản -> thưởng thắng trận chờ nhịp sau { kn, goc }
// thời lượng đánh gốc (cau-hinh, 20 phút) — mốc giaiDoan / xe viết cho trận này; GM đổi "Đánh (phút)" ở F10 (lich-hd.js sửa CF.danh sau khi tệp nạp)
const DANH_GOC = Math.max(1, +CF.danh || 20);
const daGoi = new Set();   // "ngày b|giờ" đã báo / đã mở theo lịch
const KC = new Map();      // cấp -> hệ số chỉ số (heSo)

// hệ số chỉ số / kinh nghiệm của lính cấp L so với mẫu client (cấp CF.capGoc): quái thường bãi chính chứa cấp L ÷ quái bãi chứa cấp capGoc (máu,
// sát thương, chính xác, né tránh — do.js quaiCap); kinh nghiệm theo mức kinh nghiệm quái bãi đó (knBai × canBang kinhNghiem của bãi)
function heSo(L) {
  L = Math.max(1, Math.min(MS.maxLevel, L | 0));
  if (KC.has(L)) return KC.get(L);
  const a = DO.quaiCap(L), b = DO.quaiCap(CF.capGoc), r = (x, y) => (x > 0 && y > 0 ? Math.round((x / y) * 1000) / 1000 : 1);
  const k = a && b ? { mau: r(a.t.mau, b.t.mau), st: r(a.t.satThuong, b.t.satThuong), ar: r(a.t.chinhXac, b.t.chinhXac), def: r(a.t.neTranh, b.t.neTranh), kn: r(a.kn, b.kn) }
    : { mau: 1, st: 1, ar: 1, def: 1, kn: 1 };
  KC.set(L, k);
  return k;
}
const goc = (tpl, he, L, k) => { const M = MS.mobs[tpl]; if (!M) return 0; const S = M.s[he] || M.s[M.series]; return MS.pool[S[k]][Math.max(1, Math.min(MS.maxLevel, L)) - 1] || 0; };

// ---------- danh sách quái (như quai-chung.js: nhật ký đổi để gửi phần đổi) ----------
const dongQ = (e) => [e.uid, e.tpl, e.lv, e.he, e.mauMax, e.x, e.y, e.loai, e.vai, e.duong, e.cs, e.phe, e.st[0], e.st[1], e.ar, e.def, e.chieu || 0, e.stC || 0, e.toc || 1];
const mauCua = (e) => [e.uid, Math.max(0, Math.ceil(e.mau))];
function doiDs(e) { D.sv++; e.sv = D.sv; D.nk.push(e); D.doi = true; if (D.nk.length > NK_GIU) D.nk.splice(0, D.nk.length - NK_GIU); }
// chỉ số 1 con loại vai, mẫu tpl, hệ he, cấp L: máu / sát thương = quái thường bãi chính cấp L × CF.manh[vai]; chính xác / né tránh = mẫu client ×
// hệ số cấp (heSo); kn = máu S1 ÷ máu mẫu client (kinh nghiệm mẫu client × kn — giữ tỉ lệ kinh nghiệm / máu của client)
function chiSo(vai, tpl, he, L) {
  const R = DO.quaiCap(L), k = heSo(L), H = CF.manh[vai] || [1, 1], mg = goc(tpl, he, L, "life");
  const m0 = Math.max(1, Math.round(R ? R.t.mau * H[0] : mg * k.mau));
  return { mau: m0, st: R ? [Math.round(R.t.stThap * H[1]), Math.round(R.t.satThuong * H[1])] : [0, 0],
    ar: Math.max(1, Math.round(goc(tpl, he, L, "ar") * k.ar)), def: Math.max(0, Math.round(goc(tpl, he, L, "def") * k.def)), kn: mg > 0 ? m0 / mg : 1 };
}
function them(vai, tpl, L, he, x, y, extra = {}) {
  const c = chiSo(vai, tpl, he, L), uid = ++D.seq;
  const e = { uid, tpl, lv: L, he, mau: c.mau, mauMax: c.mau, st: c.st, ar: c.ar, def: c.def, kn: c.kn, x: Math.round(x), y: Math.round(y), vai, loai: mau(vai).loai, duong: -1, cs: 0, phe: 0, dmg: new Map(), npc: 0, sinh: Date.now(), ...extra };
  const ch = e.phe ? null : chieuCua(vai, tpl, he); if (ch) { e.chieu = ch; e.stC = +(CHIEU.st || {})[vai] || 1; }
  D.q.set(uid, e); D.vt.set(uid, [e.x, e.y, ""]); doiDs({ them: dongQ(e) }); D.hpDoi.add(uid);
  return e;
}
const bo = (e) => { D.q.delete(e.uid); D.vt.delete(e.uid); doiDs({ bo: e.uid }); };
const song = (f) => [...D.q.values()].filter((e) => e.mau > 0 && f(e));
const linh = (e) => e.vai === "th" || e.vai === "dt" || e.vai === "tp";

// tin trong trận (người trong trận thấy ở khung chat — như Msg2MSAll của kịch bản)
function tin(text, mau = "") { D.tinId++; D.tin.push([D.tinId, text, mau]); if (D.tin.length > TIN_GIU) D.tin.shift(); D.doi = true; }

// cấp lính: trung bình cấp người đang trong trận (chưa ai thì người đã báo danh), trong [cap, capMax]; không ai -> capGoc
function capTran() {
  const ds = [...(D.trong.size ? D.trong.keys() : D.nop.keys())].map((tk) => TG().dangChoi(tk)).filter(Boolean);
  if (!ds.length) return CF.capGoc;
  return Math.max(CF.cap, Math.min(CF.capMax, Math.round(ds.reduce((s, p) => s + (p.lvl | 0), 0) / ds.length)));
}
const soNguoi = () => Math.max(1, D.trong.size);
const GD = () => (CF.giaiDoan || [])[Math.max(0, D.gd)] || { song: 1, tiLe: CF.tiLe, toc: 1, tuong: 0 }; // đợt quân đang tới
const capSong = () => Math.min(CF.song[2], Math.round((CF.song[0] + CF.song[1] * soNguoi()) * (+GD().song || 1)));
const soTuong = () => CF.chuTuong[0] + Math.floor(soNguoi() / Math.max(1, CF.chuTuong[1]));

// ---------- sinh quân ----------
// n con chia đều 3 đường (đường 2 nhận phần dư — như cd_addsomenpc), mỗi con ở 1 điểm ngẫu nhiên của chỗ sinh đường đó
function sinhDuong(n, vai, tplF, extra = () => ({})) {
  const L = D.lv = capTran();
  for (let r = 0; r < 3; r++) {
    const m = r === 1 ? n - 2 * Math.floor(n / 3) : Math.floor(n / 3);
    for (let i = 0; i < m; i++) { const [x, y] = chon(PD.sinh[r]); them(vai, tplF(), L, Math.floor(Math.random() * 5), x, y, { duong: r, cs: 0, ...extra() }); }
  }
}
// chiêu của con quân (anh 04/11 lượt 25): [mã chiêu…] | null — Tiên phong / Chủ tướng: CHIEU.so[vai] chiêu khác nhau bốc trong danh sách hệ he;
// Chủ soái / Thần binh: chiêu mẫu client; loại không có CHIEU.st (Tiểu hiệu, Đội trưởng, xe) -> null (đánh thường)
function chieuCua(vai, tpl, he) {
  if (!(+(CHIEU.st || {})[vai] > 0)) return null;
  if (vai === "cs" || vai === "tb") { const ds = (CHIEU.mau || {})[tpl]; return Array.isArray(ds) && ds.length ? ds.slice(0, 4) : null; }
  const ds = [...(((CHIEU[vai] || [])[he | 0]) || [])], n = Math.max(1, ((CHIEU.so || {})[vai] | 0) || 1), out = [];
  while (ds.length && out.length < n) out.push(ds.splice(Math.floor(Math.random() * ds.length), 1)[0]);
  return out.length ? out : null;
}
// đợt lính (mỗi CF.dot giây tới Chủ soái): bù tới capSong theo tỉ lệ + tốc độ hành quân của đợt quân đang tới
function dotLinh() {
  const thieu = capSong() - song(linh).length; if (thieu <= 0) return;
  const G = GD(), TL = Array.isArray(G.tiLe) && G.tiLe.length === 3 ? G.tiLe : CF.tiLe, tong = TL.reduce((a, b) => a + b, 0) || 1, n = Math.min(thieu, 60), x = () => ({ toc: +G.toc || 1 });
  const a = Math.round((n * TL[1]) / tong), b = Math.round((n * TL[2]) / tong), c = Math.max(0, n - a - b);
  sinhDuong(c, "th", () => mau("th").tpl[0], x); sinhDuong(a, "dt", () => mau("dt").tpl[0], x); sinhDuong(b, "tp", () => mau("tp").tpl[0], x);
}
// đợt Chủ tướng (lúc vào mỗi đợt quân): soTuong + G.tuong con, sống tối đa soTuong × 3, ít nhất 3 (mỗi đường 1) -> số con ra
function dotTuong(G) {
  const n = soTuong() + (G.tuong | 0), cap = soTuong() * 3, co = song((e) => e.vai === "ct").length, k = Math.min(n, Math.max(0, cap - co));
  if (k <= 0) return 0;
  sinhDuong(Math.max(3, k), "ct", () => chon(mau("ct").tpl), () => ({ toc: +G.toc || 1 }));
  return Math.max(3, k);
}
// vào đợt quân i: báo trong trận + cả máy chủ (từ đợt 2), đợt Chủ tướng
function vaoDot(i) {
  D.gd = i; const G = GD(), n = (CF.giaiDoan || []).length, ten = G.ten || "Viện binh";
  if (i > 0) {
    tin(`Chiến báo: ${ten} quân Tống đã tới (đợt ${i + 1}/${n}) — quân đông hơn, hành quân nhanh hơn!`, "#ffb74d");
    TG().thongBao(`Phong Hỏa Liên Thành: ${ten} quân Tống (đợt ${i + 1}/${n}) đang tiến về thành!`);
  }
  const nt = dotTuong(G); if (nt) tin(`Quân Tống thêm ${nt} Chủ tướng tiến về thành!`, "#ffb74d");
}
// đợt chiến xa (lịch CF.xe): so xe chia lần lượt 3 đường, tốc độ hành quân toc
function dotXe(so, toc) {
  for (let i = 0; i < so; i++) { const r = (D.xeDem + i) % 3, [x, y] = chon(PD.sinh[r]); them("xe", mau("xe").tpl[0], D.lv || capTran(), 2, x, y, { duong: r, cs: 0, toc: +toc || 1 }); }
  D.xeDem += so;
  tin(`Công Thành Chiến Xa của đối phương đang tiến công vào đây, mọi người hãy ra sức chống đỡ!!! (${so} chiếc)`, "#ffeb3b");
}
// 10 Chủ soái (call_boss_zhushuai): chỗ đứng xáo trộn, chỗ 1–3 đi đường 1, 4–7 đường 2, còn lại đường 3; mẫu 1080 + i, hệ floor(i / 2)
function raSoai() {
  const L = capTran() + 0, idx = PD.chuSoai.map((_, i) => i).sort(() => Math.random() - 0.5), tp = mau("cs").tpl;
  for (let i = 0; i < tp.length; i++) { const j = idx[i % idx.length], [x, y] = PD.chuSoai[j]; them("cs", tp[i], L, Math.floor(i / 2), x, y, { duong: j < 3 ? 0 : j < 7 ? 1 : 2, cs: 0, toc: +CF.tocSoai || 1 }); }
  D.soaiRa = true; D.soaiTong = tp.length;
  tin("Chiến báo thủ thành: Quân Tống Chủ soái tự mình xuất trận! Các binh sĩ hãy cẩn thận phòng thủ!!", "#ff8a80");
  TG().thongBao(`Phong Hỏa Liên Thành: Quân Tống Chủ soái đã tự mình xuất trận! Viện binh không thể vào chiến trường nữa — các tướng sĩ hãy giữ vững thành trì.`);
}
// khai chiến: phe mình (vệ binh + tướng quân — cấp trung bình người trong trận), Thần binh canh doanh trại địch, đợt quân 1 (Chủ tướng) + đợt lính đầu;
// chiến xa theo lịch CF.xe (vòng 100 ms)
function batDau(t) {
  D.batDau = true; D.lv = capTran();
  for (const [x, y] of PD.veBinh) them("ve", mau("ve").tpl[0], D.lv, 2, x, y, { phe: 1, nha: [x, y] });
  for (const [x, y] of PD.tuongQuan) them("tq", mau("tq").tpl[0], D.lv, 2, x, y, { phe: 1, nha: [x, y] });
  for (const [x, y, tpl] of PD.thanBinh) them("tb", tpl, D.lv + 5, (MS.mobs[tpl] || {}).series | 0, x, y, { nha: [x, y] });
  D.tqTong = PD.tuongQuan.length;
  vaoDot(0); dotLinh();
  D.dotLuc = t;
  tin("Quân địch đã bắt đầu công thành, vì để bảo vệ thành chúng ta các tướng sĩ hãy xông lên!", "#ffeb3b");
  TG().thongBao(`Phong Hỏa Liên Thành đã khai chiến! Quân Tống đang tiến về thành — ai đẳng cấp từ ${CF.cap} trở lên vẫn có thể đến Vệ binh thành môn Biện Kinh tiếp viện.`);
}

// ---------- mở / kết thúc ----------
// opt (quản trị thử): baoDanh, danh, chuSoai (phút)
function mo(opt = {}) {
  if (!PD) N.loi("Chưa có dữ liệu trận (node cong-cu/dung-phong-hoa.mjs)");
  if (D && !D.ket) N.loi("Đang có trận Phong Hỏa Liên Thành");
  const t = Date.now(), so = (v, d) => (Number.isFinite(+v) && +v >= 0 ? +v : d);
  // tl: hệ số giãn / co mốc đợt quân + chiến xa (trận dài / ngắn hơn trận gốc — GM đổi ở F10, trận thử quản trị); phút Chủ soái của GM là phút thật của
  // trận CF.danh — trận thử ngắn hơn thì co theo dn / CF.danh
  const bd = so(opt.baoDanh, CF.baoDanh), dn = Math.max(1, so(opt.danh, CF.danh)), tl = dn / DANH_GOC, cs = Math.min(dn, so(opt.chuSoai, CF.chuSoai * (dn / Math.max(1, CF.danh))));
  for (const tk of CHO.keys()) if (!(CHO.get(tk) || []).length) CHO.delete(tk);
  D = {
    u: t, kc: t + bd * 60000, csLuc: t + (bd + cs) * 60000, het: t + (bd + dn) * 60000, diem: CF.diem, ket: null, lyDo: "", ketLuc: 0, raLuc: 0,
    nop: new Map(), vao: new Map(), trong: new Map(), song: new Map(), an: new Set(), chu: null,
    q: new Map(), vt: new Map(), seq: 0, sv: 0, nk: [], doi: true, guiLuc: 0, hpLuc: 0, hpDoi: new Set(), daSpec: new Map(), ack: new Map(), han: new Map(),
    dan: new Map(), npcHan: { han: CF.npcGiay * 3, luc: t }, tin: [], tinId: 0, lv: CF.capGoc, batDau: false, soaiRa: false, soaiTong: 0, tqTong: 0,
    dotLuc: 0, gd: -1, xeI: 0, xeDem: 0, tl, bao3: false, bao1: false, dem: { giet: 0, xeToi: 0, xeHa: 0, soaiHa: 0, tqChet: 0, veChet: 0 }, baoLuc: t, ttLuc: t,
  };
  TG().thongBao(`Vệ quốc Phong Hỏa Liên Thành đã bắt đầu nhận báo danh! Đẳng cấp từ ${CF.cap} trở lên hãy đến Vệ binh thành môn Biện Kinh tham gia thủ thành phe Kim (lệ phí ${N.tien(CF.phi)}). Còn ${Math.round(bd)} phút nữa khai chiến.`, true);
  return lich(); // lịch (gio = giờ mở theo cấu hình) — trạng thái đủ gửi qua kênh tức thời
}
// trận kết thúc: thưởng thắng trận cho người còn trong trận (đang ở bản đồ trận), bảng kết quả; raSau giây sau trình duyệt đưa người ra Biện Kinh
function ketThuc(thang, lyDo) {
  if (!D || D.ket) return null;
  const t = Date.now(), T = CF.thuong;
  D.ket = thang ? "thang" : "thua"; D.lyDo = lyDo; D.ketLuc = t; D.raLuc = t + CF.raSau * 1000; D.doi = true;
  for (const e of D.q.values()) if (e.mau > 0 && !e.phe) bo(e); // quân địch rút
  for (const [tk, v] of D.vao) {
    let x = 0, rx = 0;
    // anh 04/11: thắng trận + đạt mức thưởng cao nhất (kinh nghiệm trong trận >= tren) -> thêm thuong.ruongXanh Bảo rương đồ xanh
    if (thang && D.trong.has(tk)) { const s = v.knGoc; x = s >= T.tren ? T.toiDa : s >= T.duoi ? Math.floor(s / 100000) * 1000000 : 0; x *= T.nhan; if (s >= T.tren) rx = T.ruongXanh ?? 3; }
    v.thuong = x;
    // bang hội đợt 2 (Q7 — không cộng dồn): có đánh (kinh nghiệm trận > 0) + thắng + còn trong trận lúc kết thúc: 100; có đánh mà thua / rời sớm: 50; vào mà không đánh: 0
    { const kieu = v.knGoc > 0 ? (thang && D.trong.has(tk) ? "thang" : "thamGia") : null; if (kieu) try { BHO().cong(tk, null, v.ten, "phongHoa", null, { kieu }); } catch {} }
    if (x > 0) KET.set(tk, { kn: x, goc: Math.round(v.knGoc), rx });
  }
  ghiKet(thang ? "thắng" : "thua", lyDo);
  // báo cả máy chủ ở khung chat (không hiện giữa màn — người trong trận có bảng kết quả)
  if (thang) { tin(`Trải qua chiến đấu quyết liệt, phe Kim bảo vệ thành công thành trì! (${lyDo})`, "#7cff7c"); TG().thongBao(`Phong Hỏa Liên Thành: trải qua chiến đấu quyết liệt, phe Kim đã bảo vệ thành công thành trì! ${lyDo}`); }
  else { tin(`Trải qua cuộc chiến kịch liệt, dù đã cố gắng nhưng phe ta chống không lại địch, thủ thành thất bại. (${lyDo})`, "#ff8a80"); TG().thongBao(`Phong Hỏa Liên Thành: thủ thành thất bại — ${lyDo}.`); }
  return true;
}
function huy() { if (!D) return false; const t = Date.now(); if (!D.ket) { D.ket = "huy"; D.lyDo = "Quản trị hủy trận"; D.ketLuc = t; D.raLuc = t + 5000; D.doi = true; ghiKet("bị hủy", D.lyDo); TG().thongBao("Trận Phong Hỏa Liên Thành đã bị hủy."); } return true; }
// nhật ký "Hoạt động" lúc trận kết thúc (anh 14/11: "phong hỏa khi kết thúc không thấy trong lịch sử hoạt động server") — trước chỉ có dòng báo danh và dòng nhận thưởng
// khi thắng (nhịp sau), trận thua / thắng mà không đủ mức thưởng thì không có gì. Nay như Tống Kim (tong-kim.js ~804): 1 dòng chung (F10 → Nhật ký → Hoạt động) + 1 dòng mỗi
// người đã vào trận (sổ hoạt động từng tài khoản — F10 → Người chơi → Xem hoạt động). kq: "thắng" | "thua" | "bị hủy"
function ghiKet(kq, lyDo) {
  const gio = new Date(D.u + 7 * 3600e3).toISOString().slice(11, 16), d = D.dem;
  try { NK().ghi("hd", null, null, `Phong Hỏa Liên Thành ${gio} kết thúc: ${kq} — ${lyDo} · ${D.vao.size} người vào trận · hạ ${d.giet} quân (Chủ soái ${d.soaiHa}/${D.soaiTong}, chiến xa ${d.xeHa}) · điểm thủ thành còn ${D.diem}`); } catch {}
  for (const [tk, v] of D.vao) {
    try { NK().ghi("hd", tk, v.ten, `Phong Hỏa Liên Thành ${gio} kết thúc (${kq}${kq !== "bị hủy" && !D.trong.has(tk) ? ", đã rời trận trước khi kết thúc" : ""}): kinh nghiệm trong trận ${Math.round(v.knGoc || 0)}${v.thuong > 0 ? `, thưởng thắng trận ${v.thuong} kinh nghiệm (nhận ở nhịp sau)` : ""}`); } catch {}
  }
}

// ---------- chết / thưởng ----------
function chet(e) {
  const t = Date.now(); e.mau = 0; e.chet = t; D.doi = true;
  if (e.phe) {
    if (e.vai === "tq") {
      D.dem.tqChet++; tin("Thủ thành chiến báo: 1 tên Tướng quân thủ thành bên ta tử trận.", "#ff8a80");
      if (D.dem.tqChet >= D.tqTong) { tin("Thủ thành chiến báo: Tướng sĩ thủ thành của ta đều tử trận.", "#ff8a80"); ketThuc(false, "3 Tướng quân thủ thành đều tử trận"); }
    } else D.dem.veChet++;
    return;
  }
  D.dem.giet++;
  if (e.vai === "xe") { D.dem.xeHa++; tin("Công Thành Chiến Xa của đối phương đã bị phá hủy!!!", "#ffeb3b"); }
  if (e.vai === "cs") { D.dem.soaiHa++; tin(`Đã hạ ${D.dem.soaiHa} / ${D.soaiTong} Chủ soái quân Tống!`, "#ffb74d"); }
  // thưởng: người gây nhiều sát thương nhất nhận trọn, người khác kinh nghiệm × phần sát thương (như quai-chung.js; cùng đội người nhận trọn: phần
  // chia đội) — NPC phe mình đánh không có phần; kinh nghiệm gốc client (thưởng thắng trận) cộng ngay để kịp lúc kết thúc
  const v = D.vt.get(e.uid), x = v ? v[0] : e.x, y = v ? v[1] : e.y;
  let tong = 0, top = null, max = -1;
  for (const [tk, d] of e.dmg) { tong += d; if (d > max) { max = d; top = tk; } }
  const r = [BAI, e.tpl, e.lv, 0, e.he, Math.round(x), Math.round(y)], knG = goc(e.tpl, e.he, e.lv, "exp") * e.kn;
  const doiTop = top ? (require("./to-doi.js").thanhVien(top) || { tv: [] }).tv : [];
  for (const [tk, d] of e.dmg) {
    if (!(d > 0) || (tk !== top && doiTop.includes(tk))) continue;
    const he = tk === top ? 1 : d / tong, L = CHO.get(tk) || [];
    L.push({ u: D.u, r, he, top: tk === top, kn: e.kn, ...(tk === top ? boc(e) : {}) }); if (L.length > 600) L.shift(); CHO.set(tk, L);
    const w = D.vao.get(tk); if (w) { w.knGoc += knG * he; if (tk === top) w.giet++; }
  }
  if (e.vai === "cs" && D.dem.soaiHa >= D.soaiTong) { tin("Chủ soái quân địch đã bị tiêu diệt!!!", "#7cff7c"); ketThuc(true, `Hạ đủ ${D.soaiTong} Chủ soái quân Tống`); }
}
// rơi thêm của con e cho người nhận trọn (CF.roi, bùa CF.bua): { bua?: [khóa món], mon?: [{ k, n }], xu? }
function boc(e) {
  const Rr = CF.roi || {}, o = {}, r = HANG[e.vai], BM = DO.BUA_MON || [];
  if (BU.bat && r && BM.length) {
    const p = Math.min(1, BM.length * (+(BU.tiLe || [])[r - 1] || 0) * (+BU.heSo || 0)), bua = [];
    for (let i = 0; i < ((BU.lan || [])[r - 1] | 0); i++) if (Math.random() < p) bua.push(chon(BM));
    if (bua.length) o.bua = bua;
  }
  if (!(Rr.loai || []).includes(e.vai)) return o;
  const mon = [];
  for (const [p, ds] of Rr.ds || []) if (Array.isArray(ds) && ds.length && Math.random() < +p) mon.push({ k: chon(ds), n: 1 });
  if (mon.length) o.mon = mon;
  const X = Rr.xu; if (Array.isArray(X) && Math.random() < +X[0]) o.xu = Math.max(1, (X[1] | 0) + Math.floor(Math.random() * ((X[2] | 0) - (X[1] | 0) + 1)));
  return o;
}
// thưởng các con mình có đánh đã chết + thưởng thắng trận (api.js nhịp): kinh nghiệm (do.js gietQuai ctx.ph — không tiền / đồ rơi thường, × hệ số
// cấp) + rơi thêm (boc — món nằm đất chỗ con chết, riêng mình nhặt; Xu vào thẳng)
function nhanThuong(h, tk, key, admin) {
  const L = CHO.get(tk), K = KET.get(tk);
  if (!h || (!(L && L.length) && !K)) return null;
  CHO.delete(tk); KET.delete(tk);
  const out = { kn: 0, len: 0, n: 0, tin: [], nhan: [] };
  for (const o of L || []) {
    const kq = DO.gietQuai(h, [o.r], { ten: tk, admin, key, chung: true, ph: true, knPh: o.kn, heSoKn: o.he, khongRoi: true, khongChia: !o.top });
    out.kn += kq.kn; out.len += kq.len; if (o.top) out.n += kq.n;
    if (kq.tin) out.tin.push(...kq.tin);
    const [z, , , , , x, y] = o.r;
    for (const it of o.mon || []) {
      out.nhan.push({ ...DO.roiMon(h, key, { z, x, y }, { ...it }, null), x, y, z });
      NK().ghi("hiem", tk, h.name, `Phong Hỏa Liên Thành: rơi ${DO.tenMon(it)}`);
    }
    for (const k of o.bua || []) out.nhan.push({ ...DO.roiMon(h, key, { z, x, y }, { k }, null), x, y, z }); // bùa: nằm đất chỗ con chết, riêng mình nhặt (do.js nhatBua)
    if (o.xu > 0) {
      h.xu = (h.xu | 0) + o.xu; out.xu = (out.xu | 0) + o.xu;
      out.tin.push(`Bạn nhận được ${o.xu} Xu.`);
      NK().ghi("hd", tk, h.name, `Phong Hỏa Liên Thành: +${o.xu} Xu`);
    }
  }
  if (K) {
    h.exp = (h.exp || 0) + K.kn; h.lvl = h.lvl || 1; out.len += N.lenCap(h); out.kn += K.kn; out.thang = K.kn;
    out.tin.push(`Phe Kim giành được thắng lợi cuối cùng, nhận được ${vn(K.kn)} điểm kinh nghiệm.`);
    NK().ghi("hd", tk, h.name, `Phong Hỏa Liên Thành thắng: +${K.kn} kinh nghiệm (kinh nghiệm trong trận ${K.goc})`);
    if (K.rx > 0) { const t = DO.choRuongXanh(h, K.rx); out.tin.push(`Thắng trận, đạt mức thưởng cao nhất: thêm ${t}`); NK().ghi("hd", tk, h.name, `Phong Hỏa Liên Thành thắng (mức cao nhất): +${t}`); }
  }
  return out.kn || out.tin.length || out.nhan.length ? out : null;
}

// ---------- trạng thái gửi trình duyệt ----------
function lich() {
  if (!D) return { pha: "", gio: CF.gio, cap: CF.cap, phi: CF.phi };
  const t = Date.now();
  return { u: D.u, pha: D.ket ? "xong" : t < D.kc ? "bd" : "danh", kc: D.kc, cs: D.csLuc, het: D.het, gio: CF.gio, cap: CF.cap, phi: CF.phi, mo: !D.ket && t < D.csLuc, ket: D.ket };
}
function trangThai(tk, full, dan, hd, qd) {
  if (!D) return null;
  const v = D.vao.get(tk), tq = song((e) => e.vai === "tq").length;
  const p = { ...lich(), gio: Date.now(), diem: D.diem, diemMax: CF.diem, tq, tqTong: D.tqTong, soaiRa: D.soaiRa, soai: song((e) => e.vai === "cs").length, soaiTong: D.soaiTong,
    dich: song((e) => !e.phe && e.vai !== "tb").length, xe: song((e) => e.vai === "xe").length, nguoi: D.trong.size, lv: D.lv,
    chu: D.trong.get(D.chu) || null, sv: D.sv, ack: D.ack.get(tk) || 0, tin: D.tin, me: v ? { giet: v.giet, kn: Math.round(v.knGoc), daNop: true } : null,
    khang: CF.khangMax,
    ...(D.ket ? { ket: D.ket, lyDo: D.lyDo, ra: D.raLuc, bang: [...D.vao.values()].sort((a, b) => b.giet - a.giet || b.knGoc - a.knGoc).slice(0, 30).map((w) => [w.ten, w.giet, Math.round(w.knGoc), w.thuong | 0]) } : {}),
    ...(hd ? { hd } : { hp: [...D.q.values()].map(mauCua) }), dan: dan || [], ...(qd ? { qd } : {}),
    ...(full ? { q: [...D.q.values()].map(dongQ), vt: [...D.vt].map(([u, w]) => [u, ...w]) } : {}) };
  return p;
}
// gửi cả trận: người có bản danh sách mà nhật ký còn đủ -> phần đổi (qd); người mới / bản quá cũ -> đủ
function phat() {
  const t = Date.now(); D.guiLuc = t; D.doi = false;
  const dan = [...D.dan]; D.dan.clear();
  const du = t - D.hpLuc >= NHAC_MS; if (du) D.hpLuc = t;
  const hd = du ? null : [...D.hpDoi].map((u) => D.q.get(u)).filter(Boolean).map(mauCua);
  D.hpDoi.clear();
  for (const tk of D.trong.keys()) {
    const kn = WS.cua(tk); if (!kn) continue;
    const s0 = D.daSpec.get(tk);
    let full = false, qd = null, hdc = hd;
    if (s0 !== D.sv) {
      if (s0 != null && D.nk.length && D.nk[0].sv <= s0 + 1) {
        const a = new Map(), x = [];
        for (const e of D.nk) if (e.sv > s0) { if (e.them) a.set(e.them[0], e.them); else if (a.has(e.bo)) a.delete(e.bo); else x.push(e.bo); }
        qd = { tu: s0, a: [...a.values()], x };
        if (hd) hdc = [...hd, ...qd.a.filter((r) => D.q.has(r[0])).map((r) => mauCua(D.q.get(r[0])))];
      } else full = true;
      D.daSpec.set(tk, D.sv);
    }
    kn.gui({ t: "ph", p: trangThai(tk, full, dan, full ? null : hdc, qd) });
  }
}

// ---------- mỗi 100 ms: lịch, người trong trận, chủ bãi, các đợt, kết thúc, gửi trạng thái ----------
const lui = (hm, p) => { const [h, m] = hm.split(":").map(Number), t = (((h * 60 + m - p) % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
function chonChu(t) {
  const tot = (a) => D.trong.has(a) && !D.an.has(a) && t - (D.song.get(a) || 0) < CHU_MS;
  const ds = [...D.trong.keys()], moi = tot(D.chu) ? D.chu : ds.find(tot) || ds.find((a) => t - (D.song.get(a) || 0) < CHU_MS) || ds[0] || null;
  if (moi !== D.chu) { D.chu = moi; D.doi = true; }
}
setInterval(() => {
  const t = Date.now();
  if (CF.bat && PD && CF.gio) {
    const s = new Date(t + 7 * 3600000).toISOString(), hm = s.slice(11, 16), ngay = s.slice(0, 10);
    // khóa có giờ (anh 05/11 — GM dời giờ muộn hơn trong ngày vẫn mở trận); ngày tắt trong tuần (CF.thu) thì không báo / không mở
    if (CF.baoTruoc > 0 && hm === lui(CF.gio, CF.baoTruoc) && !daGoi.has(`${ngay} b${CF.gio}`) && GV.thuOk(CF, t + CF.baoTruoc * 60000)) { daGoi.add(`${ngay} b${CF.gio}`); if (!D) TG().thongBao(`${CF.baoTruoc} phút nữa Phong Hỏa Liên Thành sẽ mở báo danh ở Vệ binh thành môn Biện Kinh (đẳng cấp ${CF.cap} trở lên).`); }
    if (hm === CF.gio && !daGoi.has(`${ngay} ${CF.gio}`) && GV.thuOk(CF, t)) { daGoi.add(`${ngay} ${CF.gio}`); if (!D || D.ket) try { D = null; mo({}); } catch (e) { console.error("Phong Hỏa:", e.message); } }
  }
  if (!D) return;
  // người trong trận: kênh tức thời ở bản đồ trận, đã báo danh trận này, còn báo sống
  const co = new Map();
  WS.moi((kn) => { if (kn.zone === BAI && kn.ph === BAI && D.nop.has(kn.ten) && t - (kn.phLuc || 0) < SONG_MS) co.set(kn.ten, kn); });
  for (const [tk, kn] of co) { D.song.set(tk, kn.phLuc); if (!D.trong.has(tk)) { const p = TG().dangChoi(tk); if (p) { D.trong.set(tk, p.name); D.doi = true; const v = D.vao.get(tk); if (v) v.vao = t; } } }
  for (const tk of [...D.trong.keys()]) if (!co.has(tk)) { D.trong.delete(tk); D.an.delete(tk); D.daSpec.delete(tk); D.song.delete(tk); D.doi = true; }
  chonChu(t);
  for (const [, e] of D.q) if (e.mau <= 0 && t - e.chet > XAC_MS) bo(e);
  if (D.ket) {
    if (t - D.ketLuc > CF.giuKq * 1000 && !D.trong.size) D = null;
    else if ((D.doi && t - D.guiLuc >= GUI_MS) || t - D.guiLuc >= NHAC_MS) phat();
    return;
  }
  if (!D.batDau && t >= D.kc) batDau(t);
  if (D.batDau) {
    // phút của trận theo lịch cấu hình (trận quản trị thử ngắn hơn: co theo D.tl); đợt quân thôi khi Chủ soái đã ra
    const ph = (t - D.kc) / 60000 / (D.tl || 1), GL = CF.giaiDoan || [], XE = Array.isArray(CF.xe) ? CF.xe : [];
    if (!D.soaiRa) { let i = D.gd; while (i + 1 < GL.length && ph >= (+GL[i + 1].tu || 0)) i++; if (i > D.gd) vaoDot(i); }
    if (!D.soaiRa && t - D.dotLuc >= CF.dot * 1000) { D.dotLuc = t; dotLinh(); }
    while (D.xeI < XE.length && ph >= (+(XE[D.xeI] || [])[0] || 0)) { const r = XE[D.xeI++] || []; if (r[1] > 0) dotXe(r[1] | 0, r[2]); }
    if (!D.soaiRa && t >= D.csLuc) raSoai();
    // còn 3 / 1 phút (trận đủ dài)
    if (!D.bao3 && D.het - t <= 180000 && D.het - D.kc > 360000) { D.bao3 = true; tin("Chiến báo: còn 3 phút nữa — giữ vững thành trì, hạ Chủ soái quân Tống!", "#ffeb3b"); }
    if (!D.bao1 && D.het - t <= 60000 && D.het - D.kc > 120000) { D.bao1 = true; tin("Chiến báo: còn 1 phút cuối cùng — tử thủ!", "#ffeb3b"); }
    // mỗi 3 phút báo binh lực địch + thành (cd_sendmsg2msall)
    if (t - D.baoLuc >= 180000) { D.baoLuc = t; tin(`Thủ thành chiến báo: viện binh ${D.trong.size} người, tướng sĩ thủ thành ${song((e) => e.phe).length} người, điểm thủ thành ${D.diem} điểm; binh lực đối phương ${song((e) => !e.phe && e.vai !== "tb").length} người.`); }
    if (t >= D.het) ketThuc(true, "Giữ vững thành trì tới hết giờ");
  } else if (t - D.baoLuc >= 180000) { D.baoLuc = t; const p = Math.ceil((D.kc - t) / 60000); if (p > 0) TG().thongBao(`Phong Hỏa Liên Thành đang nhận báo danh ở Vệ binh thành môn Biện Kinh — còn ${p} phút nữa khai chiến.`); }
  if (D && ((D.doi && t - D.guiLuc >= GUI_MS) || t - D.guiLuc >= NHAC_MS)) phat();
}, 100).unref();

// ---------- sát thương ----------
const QT_ = (tk) => { try { return require("./bao-mat.js").qtMo(tk); } catch { return false; } }; // quản trị đã mở khóa an toàn: bỏ hạn mức sát thương / giây (anh 18/11 — "Một đòn chết" của công cụ thử)
// người chơi (kênh "phd" / nhịp b.phd): chỉ quân địch, người đã báo danh đang trong trận, hạn mức stGiay / giây (dư 3 giây dồn)
function danh(tk, bai, tin_) {
  if (!D || D.ket || +bai !== BAI || !D.trong.has(tk) || !tin_ || typeof tin_ !== "object") return;
  const s = Math.floor(+tin_.s || 0); if (s > (D.ack.get(tk) || 0)) { D.ack.set(tk, s); D.doi = true; }
  const t = Date.now(), H = D.han.get(tk) || { han: CF.stGiay * 3, luc: t };
  H.han = Math.min(CF.stGiay * 3, H.han + ((t - H.luc) / 1000) * CF.stGiay); H.luc = t; D.han.set(tk, H);
  if (QT_(tk)) H.han = Infinity;
  let coChet = false;
  for (const r of Array.isArray(tin_.d) ? tin_.d.slice(0, 150) : []) {
    const e = Array.isArray(r) && D.q.get(r[0] | 0), v = Math.floor(+r[1] || 0);
    if (!e || e.phe || e.mau <= 0 || !(v > 0)) continue;
    const an = Math.min(v, H.han, e.mau); if (!(an > 0)) continue;
    H.han -= an; e.mau -= an; e.dmg.set(tk, (e.dmg.get(tk) || 0) + an); D.dan.set(e.uid, D.trong.get(tk)); D.hpDoi.add(e.uid); D.doi = true;
    if (e.mau <= 0) { chet(e); coChet = true; if (!D || D.ket) break; }
  }
  if (coChet && D) phat();
  const st = (Array.isArray(tin_.st) ? tin_.st.slice(0, 60) : []).filter((r) => Array.isArray(r) && D && D.q.has(r[0] | 0))
    .map((r) => [r[0] | 0, Math.max(0, Math.min(30000, r[1] | 0)), Math.max(0, Math.min(30000, r[2] | 0))]);
  if (st.length && D) for (const a of D.trong.keys()) if (a !== tk) WS.guiTk(a, { t: "pht", st });
}
// chủ bãi: sát thương giữa NPC 2 phe (lính đánh vệ binh / tướng quân, vệ binh / tướng quân đánh lính) — hạn mức npcGiay / giây cả trận
function danhNpc(tk, tin_) {
  if (!D || D.ket || D.chu !== tk || !tin_ || !Array.isArray(tin_.d)) return;
  const t = Date.now(), H = D.npcHan; H.han = Math.min(CF.npcGiay * 3, H.han + ((t - H.luc) / 1000) * CF.npcGiay); H.luc = t;
  let coChet = false;
  for (const r of tin_.d.slice(0, 200)) {
    const e = Array.isArray(r) && D.q.get(r[0] | 0), v = Math.floor(+r[1] || 0);
    if (!e || e.mau <= 0 || !(v > 0)) continue;
    const an = Math.min(v, H.han, e.mau); if (!(an > 0)) continue;
    H.han -= an; e.mau -= an; if (!e.phe) e.npc += an; D.hpDoi.add(e.uid); D.doi = true;
    if (e.mau <= 0) { chet(e); coChet = true; if (!D || D.ket) break; }
  }
  if (coChet && D) phat();
}
// chủ bãi: chiến xa tới cổng — chỗ báo gần cuối đường của xe đó, đã đi đủ lâu -> trừ 1 điểm thủ thành, xe biến mất
function xeToi(tk, u) {
  if (!D || D.ket || D.chu !== tk) return;
  const e = D.q.get(u | 0); if (!e || e.vai !== "xe" || e.mau <= 0 || Date.now() - e.sinh < XE_MIN_MS) return;
  const v = D.vt.get(e.uid) || [e.x, e.y], dich = PD.duong[e.duong] && PD.duong[e.duong][PD.xeToi[e.duong]];
  if (!dich || !dich.some(([x, y]) => ldist(v[0], v[1], x, y) <= XE_TOI_R)) return;
  bo(e); D.diem = Math.max(0, D.diem - 1); D.dem.xeToi++;
  tin(`Công Thành Chiến Xa quân đối phương đang tấn công, điểm thủ thành giảm 1 điểm, hiện tại còn lại ${D.diem} điểm!!!`, "#ff8a80");
  if (D.diem <= 0) ketThuc(false, "Điểm thủ thành về 0 — chiến xa quân Tống đã phá cổng thành");
}
const songKn = (kn) => { kn.phLuc = Date.now(); };
WS.nhan("vao", (kn) => { kn.ph = kn.zone === BAI ? BAI : -1; if (kn.ph === BAI) { songKn(kn); if (D) D.daSpec.delete(kn.ten); } });
WS.nhan("phVao", (kn, tin_) => {
  if (kn.zone !== BAI) return;
  kn.ph = BAI; songKn(kn);
  if (!D) return kn.gui({ t: "ph", p: null });
  D.daSpec.delete(kn.ten);
  if (Number.isFinite(+tin_.s)) D.ack.set(kn.ten, Math.min(D.ack.get(kn.ten) || 0, Math.max(0, Math.floor(+tin_.s))));
  if (!D.nop.has(kn.ten)) kn.gui({ t: "ph", p: { ...lich(), khong: 1 } }); // chưa báo danh trận này: trình duyệt đưa ra Biện Kinh
});
WS.nhan("phAn", (kn, tin_) => { if (kn.ph !== BAI || !D) return; songKn(kn); if (tin_.an) D.an.add(kn.ten); else D.an.delete(kn.ten); });
WS.nhan("phd", (kn, tin_) => { if (kn.ph === BAI) { songKn(kn); danh(kn.ten, kn.zone, tin_); } });
WS.nhan("phn", (kn, tin_) => { if (kn.ph === BAI) { songKn(kn); danhNpc(kn.ten, tin_); } });
WS.nhan("phx", (kn, tin_) => { if (kn.ph === BAI) { songKn(kn); xeToi(kn.ten, tin_.u); } });
WS.nhan("phh", (kn, tin_) => {
  if (!D || kn.ph !== BAI || D.chu !== kn.ten || !Array.isArray(tin_.q)) return;
  songKn(kn);
  const q = [], ts = Math.round(+tin_.ts || 0);
  for (const r of tin_.q.slice(0, 260)) {
    const e = Array.isArray(r) && D.q.get(r[0] | 0); if (!e) continue;
    const w = [Math.round(+r[1] || 0), Math.round(+r[2] || 0), typeof r[3] === "string" ? r[3].slice(0, 32) : ""];
    D.vt.set(e.uid, w);
    const cs = r[5] | 0; if (e.duong >= 0 && cs > e.cs && cs < (PD.duong[e.duong] || []).length) e.cs = cs;
    q.push([e.uid, ...w, Math.max(0, r[4] | 0), e.cs]);
  }
  if (q.length) for (const a of D.trong.keys()) if (a !== kn.ten) WS.guiTk(a, { t: "phh", q, ...(ts > 0 ? { ts } : {}) });
});
WS.nhan("mo", (kn) => kn.gui({ t: "phLich", l: lich() }));

// ---------- Vệ binh thành môn (HTTP) ----------
// { viec: "mo" } -> lịch + đã báo danh chưa; { viec: "vao" } -> kiểm cấp, phí (1 lần mỗi trận), chỗ vào đại doanh
function lam(h, b, tk) {
  if (!h) N.loi("Chưa chọn nhân vật");
  const l = lich(), daNop = !!(D && D.nop.has(tk));
  if (b.viec === "mo") return { l, daNop, vang: h.gold | 0, soNguoi: D ? D.nop.size : 0, phiTxt: N.tien(CF.phi) };
  if (b.viec !== "vao") N.loi("Việc không hợp lệ");
  if (!D || !l.mo) N.loi(D && D.soaiRa && !D.ket ? "Quân viện trợ của ta đã bị địch quân chia cắt, không thể đến đây được!" : "Hoạt động thủ thành vẫn chưa bắt đầu.");
  if ((h.lvl | 0) < CF.cap) N.loi(`Đẳng cấp lớn hơn ${CF.cap} cấp mới có thể tham gia chiến tranh vệ quốc.`);
  if (!daNop) {
    if ((h.gold | 0) < CF.phi) N.loi(`Sao thế, ngươi không mang theo ${N.tien(CF.phi)}, ta không thể cho ngươi vào. Hãy chuẩn bị tiền rồi hãy đến tìm ta!`);
    h.gold -= CF.phi;
    D.nop.set(tk, { ten: h.name, luc: Date.now() });
    D.vao.set(tk, { ten: h.name, giet: 0, knGoc: 0, thuong: 0, vao: 0 });
    NK().ghi("hd", tk, h.name, `Phong Hỏa Liên Thành: báo danh, nộp ${CF.phi} lượng`);
  } else { const v = D.vao.get(tk); if (v) v.ten = h.name; }
  return { l: lich(), daNop: true, vao: { zone: BAI, at: chon(PD.hoiSinh) }, msg: daNop ? "Ngươi chuẩn bị vào trong đó đi!" : `Đã nộp ${N.tien(CF.phi)} lệ phí báo danh — vào đại doanh thủ thành phe Kim.` };
}
// quản trị thử: { viec: "mo" (baoDanh?, danh?, chuSoai? phút) | "huy" | "ket" (thang) | "xem" }
function quanTri(b) {
  if (b.viec === "mo") { if (D && D.ket) D = null; return { s: mo({ baoDanh: b.baoDanh, danh: b.danh, chuSoai: b.chuSoai }) }; }
  if (b.viec === "huy") { if (!huy()) N.loi("Không có trận"); return { s: lich() }; }
  if (b.viec === "ket") { if (!D || D.ket) N.loi("Không có trận đang đánh"); ketThuc(!!b.thang, "Quản trị kết thúc trận"); return { s: lich() }; }
  return { s: lich(), cf: { gio: CF.gio, baoDanh: CF.baoDanh, danh: CF.danh, chuSoai: CF.chuSoai, cap: CF.cap, phi: CF.phi }, co: !!PD,
    tran: D ? { diem: D.diem, quan: D.q.size, nguoi: [...D.trong.values()], nop: D.nop.size, lv: D.lv, dem: D.dem, chu: D.trong.get(D.chu) || null } : null };
}
// đang có trận ở giai đoạn nào (khoi-dong-s1.sh / bảng quản trị: không khởi động lại máy chủ giữa trận)
const dangTran = () => !!(D && !D.ket);

module.exports = { BAI, CF, mo, ketThuc, danh, nhanThuong, lam, quanTri, lich, dangTran, heSo };
