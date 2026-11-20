// Boss thế giới máu chung (anh 31/10 — "quái chung" bước 1: kênh tức thời + boss thế giới máu chung, thử rồi tính tiếp) = Boss Hoàng Kim của
// máy chủ 8.1 Vinh (cong-cu/dung-boss-tg.mjs -> assets/data/boss-tg.json: 16 boss cấp 95, chỗ đứng ở bãi cấp 95). Gốc (script\missions\boss\
// bossdeath.lua, global\gm\functions_boss.lua): xuất hiện báo cả máy chủ, sống 120 phút; chết: người / đội hạ 10 triệu kinh nghiệm, người
// đứng quanh 8 triệu, đồ rơi (bảng tbDropAward) cho người đánh nhiều nhất. S1: máu chung ở máy chủ — mỗi máy tự vẽ boss, sát thương gửi lên trừ
// vào máu chung, máy chủ báo chết; thưởng theo % sát thương (THIET-KE mục 7, giai đoạn 2). Mục tiêu chung (anh 31/10 "boss đánh không cùng 1 mục
// tiêu"): máy chủ chọn người boss đuổi đánh (chonMuc — b.muc), mọi máy cho boss đuổi người đó, chỉ máy của người đó trừ máu. Số liệu TẠM
// (chỉnh sau khi thử) ở cau-hinh.json bossTheGioi: gio (giờ Việt Nam), song (phút sống), mau, stGiay (sát thương nhận tối đa / giây / người —
// chặn trình duyệt gửi số láo; dư 3 giây dồn), kn (kinh nghiệm chia theo % sát thương), knIt (ít nhất, cho người đạt nguong %), hang (quà xếp
// hạng theo bậc — anh 31/10 tối: [{ den: hạng tối đa, mon: [[món, số]] chắc chắn có, mot: [[món, số]] bốc 1 món, hiem: 1 xét từng món đồ hiếm }],
// bậc đầu tiên có hạng ≤ den), kich (quà kích sát cho người ra đòn kết liễu: kn, mon / mot / hiem như trên, ma 1 = xét Mã bài danh mã), hiem (đồ
// hiếm [món, số, tỉ lệ %] — xét riêng từng món; "biKip" = 1 sách võ công 90 ngẫu nhiên mọi phái), danhMa (% Mã bài danh mã — trong quà kích sát),
// nhin / duoi / vung (đơn vị tọa độ bãi như trình duyệt — chonMuc: chưa ai đánh thì nhắm người đứng gần nhất trong nhin quanh chỗ boss; duoi =
// tầm boss đuổi tới; người ra ngoài vung thì boss bỏ), cho (anh 02/11 — chỗ đứng ngoài cổng Ba Lăng / Biện Kinh thay 3 chỗ Sa Mạc 1 của
// boss-tg.json: [{ bai, x, y, X, Y, noi }] — bốc bản đồ trước rồi 1 chỗ của bản đồ đó; noi thêm vào câu báo, vd "ngoài Cổng Nam").
// Trình duyệt: kênh WebSocket (may-chu/ws.js) nhận { t: "btg", b } mỗi khi máu / bảng đổi (≤ 4 lần / giây), gửi sát thương { t: "bst", u, d }
// (d = phần mới); kênh chưa mở thì đi kèm nhịp (/api/nhip b.bst = [[u, d]], trả btg). Thưởng giữ chờ nhịp sau của người đó (nhanThuong).
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const DL = require("./du-lieu.js"); // ghi thẳng thưởng người vắng lúc boss chết (ghiVang — như tong-kim.js traoThuong)
const WS = require("./ws.js");
const ND = require("./nghi-dame.js"); // nghi hack sát thương (anh 16/11 — chỉ ghi)
const GV = require("./gio-vn.js"); // giờ Việt Nam + ngày trong tuần của lịch (GM chỉnh ở F10 — lich-hd.js)
const MT = require("./mau-tin.js"); // tin hệ thống: tô màu tên nhân vật / phần thưởng (anh 13/11)
const TG = () => require("./the-gioi.js");
const NK = () => require("./nhat-ky.js");
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến mỗi khung giờ boss (tham gia 30 / ≥ 1 % 50 / top 3 100) — nạp lúc dùng

const N = DO.NOI;
// anh 16/11 — Báo Đáp Ân Sư (may-chu/bao-dap-an-su.js, nạp lúc dùng): người đạt nguong % sát thương thêm món "bossPhan" (r.mon), người kích sát thêm "bossKich"
// (kich.mon) — trao cùng quà xếp hạng ở nhanThuong; người vắng: ghiVang ghi hàng chờ quà h.quaCho. Module thiếu / ném lỗi -> [] (thưởng boss như cũ)
const BD = () => require("./bao-dap-an-su");
function bdMon(nguon, x) {
  try { return (BD().thuongNguon(nguon, x) || []).filter((r) => Array.isArray(r) && N.BY.has(String(r[0])) && (r[1] | 0) > 0).map(([k, n]) => ({ k: String(k), n: n | 0 })); }
  catch (e) { if (!e || e.code !== "MODULE_NOT_FOUND") console.error("Báo Đáp Ân Sư —", nguon, e && e.message); return []; }
}
const BTG = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/boss-tg.json"), "utf8")); } catch { return { lv: 95, ds: [], cho: [] }; } })();
// Anh 13/11 (lượt 86 — "boss thế giới thêm cơ chế mới"): mau 50 triệu gốc, mỗi người tham gia đánh (lần đầu có sát thương được tính) máu tối đa + còn lại cùng tăng mauNguoi
// (1 triệu); sát thương boss + stNguoi % (3) mỗi người tham gia (trình duyệt nhân — stK); so = số boss mỗi khung giờ (cài đặt máy chủ — F10 Cấu hình / Lịch hoạt động);
// sát thương vùng chủ độc (vong — trình duyệt bosstg.js): người đứng trong r quanh boss trúng độc mỗi nhịp theo % máu boss còn ([[≤ %, giây]] — 100 %: 3 giây, ≤ 50 %: 2,
// ≤ 25 %: 1, ≤ 10 %: 0,5), sát thương = đòn thường của boss × hs, trừ kháng độc (không vẽ vòng — anh: "vòng xanh lá xấu, có thể bỏ, còn sát thương"); đòn chủ động của
// boss là võ công 90 nội / ngoại của phái nó (anh 13/11 — phái theo Skill1–4 mẫu client, bosstg.js BOSS_PHAI); boss miễn choáng. Thưởng tham gia thamGia (2) Bảo rương đồ xanh + xuTl % (3) được 1 Xu. Tin hệ
// thống như Săn Nhím: boss bị phát hiện bởi người đánh đầu tiên, ai kích sát, người tham gia nào may mắn nhận 1 Xu
const CF = {
  bat: true, gio: ["12:30", "20:30"], song: 120, mau: 50000000, stGiay: 50000, kn: 30000000, knIt: 2000000, nguong: 1,
  hiem: [["qk:238", 1, 20], ["qk:239", 1, 20], ["qk:240", 1, 20], ["qk:353", 1, 20], ["ms:26", 1, 5], ["ms:22", 1, 5], ["biKip", 1, 3], ["ms:23", 1, 30]],
  danhMa: 3, hang: [{ den: 1, mon: [["ms:1181", 1]], hiem: 1 }, { den: 2, mon: [["ms:71", 3]], mot: [["ms:73", 1], ["ms:125", 1]], hiem: 1 }],
  kich: { kn: 5000000, hiem: 1, ma: 1 }, nhin: 450, duoi: 600, vung: 900,
  // quà tham gia (anh 11/11: "chỉ cần tham gia đánh là có được quà 1 hộp đồ xanh, trừ quà top không đụng, xong không vào top vẫn có exp"): mọi người
  // có sát thương được tính nhận thamGia Bảo rương đồ xanh (do.js choRuongXanh — chờ ở h.rxCho, túi đầy không mất); quà xếp hạng / kích sát giữ nguyên
  thamGia: 2, xuTl: 3, so: 1, mauNguoi: 1000000, stNguoi: 3,
  // r: anh 13/11 lượt 87 ("size sát thương của boss nhỏ quá, nhiều ng né dc, nâng phạm vi lên") 260 -> 500 — chiêu xa nhất của các phái ~384, đứng đánh boss là dính
  vong: { r: 500, hs: 0.5, nhip: [[10, 0.5], [25, 1], [50, 2], [100, 3]] }, ...(N.CFG.bossTheGioi || {}),
};
const NUA = 6000; // nhiệt (sát thương gần đây của mỗi người — chọn mục tiêu) giảm một nửa sau 6 giây
// Mã bài danh mã của Kỳ Trân Các (ngựa 30 ngày): Xích Thố, Đích Lô, Tuyệt Ảnh, Ô Vân Đạp Tuyết, Chiếu Dạ Ngọc Sư Tử
const DANH_MA = ["ms:2328", "ms:2329", "ms:2330", "ms:2331", "ms:2332"];
const XONG_GIU = 15000, THUONG_GIU = 30 * 60000; // boss vừa chết / rời: báo 15 giây; thưởng chờ tối đa 30 phút

// nhiều boss cùng lúc (lượt 86 — CF.so mỗi khung giờ): BS = boss đang sống, XONG = boss vừa chết / rời (còn báo XONG_GIU)
let BS = [], XONG = [], ver = 0, doi = false, guiLuc = 0;
const cho = new Map();      // tài khoản -> [thưởng chờ nhịp sau]
const daGoi = new Set();    // "ngày giờ" đã gọi theo lịch
const tenBai = (z) => (N.ZONES.get(z) || {}).n || `bãi ${z}`;
const tenMonL = (L) => L.map((m) => `${m.n} ${String(DO.tenMon({ k: m.k })).trim()}`).join(", "); // nhật ký quản trị: tên món (anh 31/10 "bảng admin không xem rõ được drop gì")

// 5 người đánh nhiều nhất: [[tên nhân vật, % máu boss]]
// hạng sát thương của 1 người (anh 17/11 — bảng boss mẫu C: "hạng của mình" khi ngoài top 5): 1 + số người đánh nhiều hơn
const hangCua = (b, d) => { let n = 1; for (const x of b.dmg.values()) if (x.d > d.d) n++; return n; };
const top = (b) => [...b.dmg.values()].sort((a, c) => c.d - a.d).slice(0, 5).map((x) => [x.ten, Math.round((x.d * 1000) / b.mauMax) / 10]);
// trạng thái 1 boss gửi tài khoản ten (cua: sát thương của người đó, hg: hạng sát thương của người đó, nhan: máy chủ đã nhận); stK: % sát thương boss cộng thêm (stNguoi × số người tham gia);
// vg: vòng sáng chủ độc { r, hs, nhip } (trình duyệt — bosstg.js vong); phat: người phát hiện (đánh đầu tiên)
function tt(b, ten) {
  const d = b.dmg.get(ten), V = CF.vong || {};
  return { u: b.u, v: ver, tpl: b.tpl, ten: b.ten, he: b.he, lv: b.lv, bai: b.bai, tenBai: tenBai(b.bai), x: b.x, y: b.y, X: b.X, Y: b.Y, ...(b.noi ? { noi: b.noi } : {}),
    mau: Math.max(0, Math.ceil(b.mau)), mauMax: b.mauMax, het: b.het, top: top(b), cua: d ? Math.floor(d.d) : 0, hg: d ? hangCua(b, d) : 0, nhan: b.nhan.get(ten) || 0, so: b.dmg.size,
    stK: Math.max(0, +CF.stNguoi || 0) * b.dmg.size, vg: { r: +V.r || 0, hs: +V.hs || 0, nhip: Array.isArray(V.nhip) ? V.nhip : [] }, ...(b.phat ? { phat: b.phat } : {}),
    ...(b.ket ? { ket: b.ket } : b.mucTen ? { muc: b.mucTen } : {}),
    // siêu boss (anh 18/11): hình, sát thương × hsSt, bùa hại định kỳ, miễn chậm — trình duyệt bosstg.js
  }; // vd: vòng Vô Hình Độc (đọc cấu hình sống — F10 sửa là có ngay)
}
// mọi boss (đang sống trước, rồi vừa xong) của tài khoản ten | null
function dsTT(ten) { const L = [...BS, ...XONG].map((b) => tt(b, ten)); return L.length ? L : null; }
// bản 1 boss (trang chưa tải lại sau khi lên bản nhiều boss, lịch hoạt động, công cụ cũ): boss đang sống đầu tiên, không có thì boss vừa xong
function trangThai(ten) { const L = dsTT(ten); return L ? L.find((x) => !x.ket) || L[0] : null; }
// nhiệt của một người (sát thương đã tính gần đây, giảm một nửa mỗi NUA ms)
const nong = (x, t) => (x && x.nong ? x.nong * Math.pow(0.5, (t - x.nongLuc) / NUA) : 0);
// mục tiêu chung của boss B (mỗi 250 ms): người cùng bãi, còn sống, cách chỗ boss đứng ≤ vung (tọa độ nhịp gần nhất — the-gioi.js). Người có nhiệt cao
// nhất — đang nhắm ai thì giữ tới khi người khác hơn 30 %; ai đứng ngoài tầm boss đuổi tới (duoi — như ActiveRadius + tầm đánh của trình duyệt)
// mà 3 giây không đánh thì không tính nhiệt (boss không đứng chờ người đã chạy xa). Không ai có nhiệt: giữ người đang nhắm nếu còn trong tầm đuổi,
// không thì người đứng gần nhất trong nhin; không còn ai: boss về chỗ
// người được xét (cũng là danh sách "xem" của công cụ thử): [{ tk, ten, d: cách chỗ boss, n: nhiệt được tính }]
function ungVien(B, t) {
  const ds = [];
  for (const p of TG().dsDangChoi()) {
    if (p.zone !== B.bai || !(p.hp > 0)) continue;
    const d = Math.hypot(p.x - B.x, p.y - B.y), x = B.dmg.get(p.tk);
    if (d > CF.vung) continue;
    if (B.sk && !x) continue; // siêu boss (anh 18/11): chỉ đuổi / đánh người đã đánh nó — người đứng xem, treo máy, bày sạp không bị gì
    ds.push({ tk: p.tk, ten: p.name, d, n: d <= CF.duoi || (x && t - x.nongLuc < 3000) ? nong(x, t) : 0 });
  }
  return ds;
}
function chonMuc(B) {
  const ds = ungVien(B, Date.now());
  const cu = ds.find((x) => x.tk === B.muc) || null, nhat = ds.reduce((a, x) => (!a || x.n > a.n ? x : a), null);
  let moi = nhat && nhat.n > 0 && (!cu || nhat.n > cu.n * 1.3 + 1) ? nhat : cu;
  if (!moi || (!moi.n && moi.d > CF.duoi)) moi = ds.filter((x) => x.d <= CF.nhin).sort((a, c) => a.d - c.d)[0] || null;
  const tk = moi ? moi.tk : null;
  if (tk !== B.muc || (moi && moi.ten !== B.mucTen)) { B.muc = tk; B.mucTen = moi ? moi.ten : null; doi = true; }
}
// tin trạng thái cho 1 kết nối: b = bản 1 boss (trang chưa tải lại), ds = mọi boss
const tinBtg = (ten) => { const L = dsTT(ten); return { t: "btg", b: L ? L.find((x) => !x.ket) || L[0] : null, ds: L }; };
// gửi trạng thái cho mọi kết nối (mỗi người kèm phần sát thương của mình)
function phat() { WS.moi((kn) => kn.gui(tinBtg(kn.ten))); }
const tron = (L) => { const a = L.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// gọi boss: opt.so (số boss — mặc định CF.so mỗi khung giờ), opt.tpl (mẫu), opt.tai { bai, x, y, X, Y } (quản trị gọi 1 boss ở chỗ mình — thử), opt.mau.
// Nhiều boss: mỗi con 1 chỗ khác nhau (xoay vòng qua các bản đồ — Ba Lăng / Biện Kinh — rồi bốc chỗ chưa dùng), mẫu khác nhau nếu đủ
function goi(opt = {}) {
  if (BS.some((b) => !b.sk)) N.loi(`Đang có boss thế giới: ${BS.filter((b) => !b.sk).map((b) => b.ten).join(", ")}`);
  const L = Array.isArray(CF.cho) && CF.cho.length ? CF.cho : BTG.cho;
  if (!BTG.ds.length || !L.length) N.loi("Chưa dựng assets/data/boss-tg.json (node cong-cu/dung-boss-tg.mjs)");
  const n = opt.tai ? 1 : Math.max(1, Math.min(10, Math.round(+(opt.so ?? CF.so) || 1)));
  const mau = Math.max(1, Math.round(+opt.mau || CF.mau)), t = Date.now();
  const chon = opt.tpl ? BTG.ds.find((x) => x.tpl === +opt.tpl) : null, mauDs = chon ? [chon] : tron(BTG.ds);
  // chỗ: bốc bản đồ trước (mỗi bản đồ như nhau), lần lượt qua các bản đồ, mỗi lần 1 chỗ chưa dùng của bản đồ đó
  const bais = tron([...new Set(L.map((x) => x.bai | 0))]), con = new Map(bais.map((z) => [z, tron(L.filter((x) => (x.bai | 0) === z))]));
  const choDs = [];
  if (opt.tai) choDs.push(opt.tai);
  else for (let k = 0; choDs.length < n && k < (n + 1) * bais.length; k++) { const z = bais[k % bais.length], c = con.get(z).shift(); if (c) choDs.push(c); }
  const moi = [];
  choDs.forEach((c, i) => {
    const Z = N.ZONES.get(c.bai | 0); if (!Z) return;
    const b = mauDs[i % mauDs.length];
    moi.push({ u: t + i, tpl: b.tpl, ten: b.ten, he: b.he, lv: BTG.lv || 95, bai: Z.id, x: Math.round(+c.x || 0), y: Math.round(+c.y || 0), X: c.X | 0, Y: c.Y | 0,
      noi: opt.tai ? "" : String(c.noi || ""), mau, mauMax: mau, het: t + CF.song * 60000, dmg: new Map(), nhan: new Map(), phat: null,
      dot: t, ...(opt.tai ? { thu: 1 } : {}) }); // bang hội đợt 2: dot = khung giờ (mỗi khung chỉ tính 1 lần); thu = quản trị gọi tại chỗ để thử — không tính cống hiến
  });
  if (!moi.length) N.loi("Không có chỗ đứng cho boss (bossTheGioi.cho)");
  BS = [...BS.filter((b) => b.sk), ...moi]; XONG = XONG.filter((b) => b.sk); doi = true; // siêu boss (anh 18/11) giữ nguyên
  // câu của client (functions_boss.lua PickBoss): "<tên> đã xuất hiện tại <bản đồ> (x,y)" — hiện giữa màn hình như thông báo quản trị; + chỗ
  // (ngoài cổng nào — người chơi chưa quen bản đồ thôn / thành)
  const cau = (b) => `${b.ten} tại ${tenBai(b.bai)} (${b.X}/${b.Y})${b.noi ? ` — ${b.noi}` : ""}`;
  TG().thongBao(moi.length > 1 ? `${moi.length} Boss Hoàng Kim đã xuất hiện: ${moi.map(cau).join("; ")}!` : `${moi[0].ten} đã xuất hiện tại ${tenBai(moi[0].bai)} (${moi[0].X}/${moi[0].Y})${moi[0].noi ? ` — ${moi[0].noi}` : ""}!`, true);
  return trangThai("");
}
// gọi siêu boss (anh 18/11): opt.tai { bai, x, y, X, Y } (quản trị gọi ở chỗ mình — thử), opt.song (giây — thử), opt.mau, opt.mauNguoi (thử)
function goiSk() { N.loi("Không có trong bản này"); 
}
// boss b rời đi khi hết giờ / quản trị hủy (không thưởng)
function roi(b, huy) {
  const i = BS.indexOf(b); if (i < 0) return null;
  BS.splice(i, 1); b.ket = "roi"; b.luc = Date.now(); XONG.push(b); doi = true;
  TG().thongBao(huy ? `${b.ten} đã bị gọi về.` : `${b.ten} đã rời khỏi ${tenBai(b.bai)}.`);
  return true;
}
// sách võ công 90 của Kỳ Trân Các (mọi phái — như bảng rơi client: quyển nào cũng được, người chơi đổi / giao dịch)
const sach90 = () => [...N.BY.values()].filter((x) => x.dung && x.dung.loai === "sach").map((x) => x.k);
// quà của 1 bậc t = { mon, mot, hiem, ma }: món chắc chắn + bốc 1 món của mot + xét từng món đồ hiếm (CF.hiem) + xét Mã bài danh mã; cùng món gộp số
function quaBac(t) {
  const ra = [], them = (k, n) => {
    if (k === "biKip") { const L = sach90(); if (!L.length) return; k = L[Math.floor(Math.random() * L.length)]; }
    const o = ra.find((x) => x.k === k); if (o) o.n += n; else ra.push({ k, n });
  };
  for (const [k, n] of t.mon || []) them(k, n);
  if ((t.mot || []).length) { const [k, n] = t.mot[Math.floor(Math.random() * t.mot.length)]; them(k, n); }
  if (t.hiem) for (const [k, n, tl] of CF.hiem || []) if (Math.random() * 100 < tl) them(k, n);
  if (t.ma && Math.random() * 100 < CF.danhMa) them(DANH_MA[Math.floor(Math.random() * DANH_MA.length)], 1);
  return ra;
}
// quà xếp hạng của hạng h (anh 31/10 "chia quà cho top 10"; tối 31/10: "top 1 là 1 TTL 8h, top 2 thì 3 bình TTL thường, thêm Bách Quả Lộ hay Quế
// Hoa Tửu đều ok") — bậc đầu tiên trong CF.hang có h ≤ den; ngoài các bậc: không có món (vẫn có kinh nghiệm theo % sát thương)
const quaHang = (h) => { const t = (CF.hang || []).find((x) => h <= (x.den | 0)); return t ? quaBac(t) : []; };
// Người vắng lúc boss chết (đã đóng game / về màn chọn nhân vật / đang chơi nhân vật khác cùng tài khoản — rà soát 11/11): kinh nghiệm + quà tham
// gia + Xu may mắn (lượt 86) ghi thẳng vào nhân vật đã đánh (ghiVang — `cho` chỉ ở bộ nhớ: máy chủ khởi động lại trước khi người đó vào lại thì mất); đồ
// xếp hạng vẫn chờ nhịp. -> 1 | 0 (không đọc / ghi được, không thấy nhân vật: để nhịp lo như cũ). Người kết liễu luôn đang chơi đúng nhân vật (danh) nên
// không qua đây — nhịp của người đó có thể đang giữ tệp tài khoản (api.js ghi sau)
// anh 16/11 — Báo Đáp Ân Sư (vá theo map-b mục 6): đồ xếp hạng / kích sát (cả món sự kiện) của người vắng trước chỉ chờ trong bộ nhớ `cho` (mất khi máy chủ khởi
// động lại / quá THUONG_GIU) -> ghi luôn vào hàng chờ quà h.quaCho của nhân vật (nhịp api.js: vừa túi thì nhận, khung báo quà kèm lý do — tenBoss); ghi xong thì
// r.mon / r.kich.mon dời sang monGhi (chỉ để hiện khung tổng kết + nhật ký — nhanThuong không trao lần 2). Mỗi gói ≤ 20 món (DO.taoQua chỉ lấy 20)
function ghiVang(ten, tenNv, r, tenBoss) {
  try {
    const acc = DL.docTk(ten), h = acc && Array.isArray(acc.nv) ? acc.nv.find((n) => n && n.name === tenNv) : null;
    if (!h) return 0;
    const kn = (r.kn || 0) + ((r.kich && r.kich.kn) || 0);
    if (kn) { h.exp = (h.exp || 0) + kn; h.lvl = h.lvl || 1; N.lenCap(h); }
    if ((r.tg | 0) > 0) DO.choRuongXanh(h, r.tg | 0);
    if ((r.xu | 0) > 0) h.xu = (h.xu | 0) + (r.xu | 0);
    const goi = [r.mon || [], (r.kich && r.kich.mon) || []].flatMap((L) => { const ra = []; for (let i = 0; i < L.length; i += 20) ra.push(L.slice(i, i + 20).map((m) => ({ k: m.k, n: m.n }))); return ra; });
    if (goi.length) h.quaCho = [...(Array.isArray(h.quaCho) ? h.quaCho : []), ...goi.map((mon) => ({ mon, luc: Date.now(), he: 1, loi: `${r.sk ? "Siêu boss" : "Boss Hoàng Kim"}${tenBoss ? ` ${tenBoss}` : ""}: phần thưởng lúc đại hiệp vắng mặt` }))]; // he: quà hệ thống (không phải quản trị gửi — khung báo khác)
    DL.ghiTk(acc);
    if (goi.length) { r.monGhi = r.mon || []; r.mon = []; if (r.kich) r.kich = { ...r.kich, monGhi: r.kich.mon || [], mon: [] }; }
    return 1;
  } catch (e) { console.error("Boss thế giới: ghi thưởng người vắng lỗi:", e.message); return 0; }
}
// số liệu soát của 1 người lúc boss chết (danh — anh 15/11): sát thương được tính / máy gửi lúc đứng ở bãi boss (chặn = phần vượt giới hạn mỗi giây), cao nhất trong
// 1 giây, số giây từ đòn đầu tới đòn cuối — nhìn nhật ký là biết máy nào gửi số bất thường
const soVN = (n) => Math.round(+n || 0).toLocaleString("vi-VN");
function soLieu(x) {
  const gui = x.gui || 0, dinh = Math.max(x.dinh || 0, x.g1 || 0), chan = Math.max(0, gui - x.d);
  const giay = Math.max(1, Math.round(((x.luc || 0) - (x.dau || x.luc || 0)) / 1000));
  return ` · tính ${soVN(x.d)} / máy gửi ${soVN(gui)}${chan > 1000 && chan > gui * 0.05 ? ` (chặn ${soVN(chan)} — vượt ${soVN(stGiay())}/giây)` : ""}, cao nhất ${soVN(dinh)}/giây, đánh ${giay} giây`;
}
// boss b chết (keKich = tài khoản ra đòn kết liễu). Ai đánh boss / đứng trong bãi boss lúc chết đều có khung tổng kết (anh 31/10 "boss đánh xong
// thì nhân vật đều nên hiển thị bảng tổng kết"): đủ nguong % sát thương -> kinh nghiệm theo % + quà xếp hạng (quaHang — top 10); người kết liễu
// thêm quà kích sát (CF.kich: kinh nghiệm + lượt bảng thường + xét đồ hiếm + Mã bài danh mã); chưa đủ % (anh 11/11): kinh nghiệm theo %, không quà
// xếp hạng; ai có sát thương cũng có quà tham gia (CF.thamGia Bảo rương đồ xanh — r.tg) + xuTl % được 1 Xu (r.xu — lượt 86); chỉ đứng xem: khung, không thưởng
// siêu boss (anh 18/11) hạ được (nua false) / hết giờ (nua true — mọi phần thưởng × nua): kinh nghiệm kn chia đều người tham gia (ai có sát thương được tính), quà theo
// hạng (bậc đầu tiên có hạng ≤ den) + quà tham gia, cùng món gộp số; người vắng: ghiVang như Boss Hoàng Kim; khung tổng kết + nhật ký như chet
function thuongSk(b) { const i = BS.indexOf(b); if (i >= 0) BS.splice(i, 1); 
}
function chet(b, keKich) {
  if (b.sk) return thuongSk(b, keKich, false); // siêu boss (anh 18/11)
  const i = BS.indexOf(b); if (i >= 0) BS.splice(i, 1);
  b.mau = 0; b.ket = "chet"; b.luc = Date.now(); XONG.push(b); doi = true;
  const xep = [...b.dmg.entries()].sort((a, c) => c[1].d - a[1].d), tong = xep.reduce((s, [, x]) => s + x.d, 0) || 1, luc = Date.now();
  // % sát thương để hiện (1 số lẻ): chưa đủ ngưỡng thì làm tròn xuống — 0,97 % không hiện thành "1 %" cạnh câu "chưa đủ 1 %" (rà soát 11/11)
  const hien = (d) => { const p = (d * 100) / tong; return p < CF.nguong ? Math.floor(p * 10) / 10 : Math.round(p * 10) / 10; };
  // bảng xếp hạng lúc boss chết (khung kết quả — src/game/windows.js ketQuaBoss): 10 người đầu [tên, % sát thương]
  const bang = xep.slice(0, 10).map(([, x]) => [x.ten, hien(x.d)]);
  const K = CF.kich || {}, kich = keKich && b.dmg.has(keKich) ? { tenNv: b.dmg.get(keKich).ten, kn: K.kn | 0, mon: [...quaBac(K), ...bdMon("bossKich")] } : null; // + món sự kiện kích sát (Báo Đáp Ân Sư — anh 16/11)
  const day = (ten, r) => { if (!cho.has(ten)) cho.set(ten, []); cho.get(ten).push({ ten: b.ten, luc, bang, so: xep.length, ...r }); };
  const tg = Math.max(0, CF.thamGia | 0), tenRx = String(DO.tenMon({ k: "ms:1884" })).trim(), xuTl = Math.max(0, +CF.xuTl || 0), mayMan = [];
  xep.forEach(([ten, x], i) => {
    const pct = (x.d * 100) / tong, du = pct >= CF.nguong, hang = i + 1, xu = xuTl > 0 && Math.random() * 100 < xuTl ? 1 : 0;
    if (xu) mayMan.push(x.ten);
    // kinh nghiệm: đạt nguong % -> theo % (ít nhất knIt) + quà xếp hạng như trước; dưới nguong (anh 11/11 "không vào top vẫn có exp") -> theo % sát thương,
    // không có mức ít nhất (đánh 1 đòn không lấy được knIt), không quà xếp hạng. Mọi người có sát thương: quà tham gia tg Bảo rương đồ xanh (+ Xu may mắn)
    // anh 16/11 — Báo Đáp Ân Sư: đạt nguong % (1 %) thêm món sự kiện "bossPhan" vào quà xếp hạng
    const r = { hang, pct: hien(x.d), tenNv: x.ten, kn: du ? Math.max(CF.knIt, Math.round((CF.kn * x.d) / tong)) : Math.round((CF.kn * x.d) / tong), mon: du ? [...quaHang(hang), ...bdMon("bossPhan")] : [],
      ...(tg ? { tg } : {}), ...(xu ? { xu } : {}), ...(du ? {} : { khongDu: CF.nguong }), ...(kich && ten === keKich ? { kich: { kn: kich.kn, mon: kich.mon } } : {}) };
    if (!b.thu) try { BHO().cong(ten, null, x.ten, "bossHk", null, { hang, pct, dot: b.dot }); } catch {} // bang hội đợt 2: mỗi khung giờ 1 lần (30 / 50 / 100 — giá trị lớn nhất)
    const p = TG().dangChoi(ten); // vắng / đang chơi nhân vật khác: kinh nghiệm + rương + Xu ghi thẳng (r.ghi — nhanThuong không cộng lần 2, vẫn hiện khung)
    if ((!p || p.name !== x.ten) && ghiVang(ten, x.ten, r, b.ten)) r.ghi = 1;
    day(ten, r);
    const mL = r.monGhi || r.mon, kL = r.kich ? r.kich.monGhi || r.kich.mon : []; // người vắng: đồ đã ghi vào h.quaCho (ghiVang — monGhi)
    NK().ghi("hiem", ten, x.ten, `Boss thế giới ${b.ten}: hạng ${hang}, ${r.pct}% sát thương, ${r.kn} kinh nghiệm${mL.length ? " + " + tenMonL(mL) : ""}${tg ? ` + ${tg} ${tenRx} (tham gia)` : ""}${xu ? " + 1 Xu (may mắn)" : ""}${r.kich ? ` · kích sát ${r.kich.kn} kinh nghiệm${kL.length ? " + " + tenMonL(kL) : ""}` : ""}${r.ghi ? ` (vắng lúc boss chết — đã ghi vào nhân vật${r.monGhi ? ", đồ vào hàng chờ quà" : ""})` : ""}${soLieu(x)}`);
  });
  // đứng trong bãi boss mà không đánh: khung tổng kết để xem
  for (const p of TG().dsDangChoi()) if (p.zone === b.bai && !b.dmg.has(p.tk)) day(p.tk, { hang: 0, pct: 0, tenNv: p.name, kn: 0, mon: [], chiXem: 1 });
  // tin hệ thống như Săn Nhím (anh 13/11 lượt 86 "thông báo tương tự nhím béo phì"): ai phát hiện (đánh đầu tiên), ai kích sát, người tham gia may mắn nhận 1 Xu
  const nhat = xep[0] && xep[0][1].ten;
  TG().thongBao(nhat ? `${b.ten} tại ${tenBai(b.bai)}${b.phat ? ` (phát hiện bởi ${MT.ten(b.phat)})` : ""} đã bị tiêu diệt${kich ? ` do ${MT.ten(kich.tenNv)} kích sát` : ""} — ${xep.length} người tham gia, ${MT.ten(nhat)} gây sát thương nhiều nhất!${mayMan.length ? ` Người tham gia ${mayMan.map(MT.ten).join(", ")} may mắn nhận được ${MT.thuong("1 Xu")}.` : ""}` : `${b.ten} đã bị tiêu diệt!`);
}

// sát thương người chơi (tài khoản ten) gây cho boss u: phần mới d. Chỉ tính khi người đó đang ở bãi của boss (nhịp gần nhất) và trong hạn mức;
// tổng đã nhận (cả phần không tính — nhan) báo lại để trình duyệt chỉ đoán phần còn trên đường (src/game/bosstg.js doan)
// Người tham gia mới (lần đầu có sát thương được tính — lượt 86): máu tối đa + máu còn của boss cùng tăng CF.mauNguoi; người đầu tiên = người phát hiện (tin hệ thống)
// giới hạn sát thương được tính / giây / người — đọc LÚC DÙNG (anh 15/11 "giới hạn dame boss thế giới xuống": 300.000 -> 50.000, gấp ~2,5 lần mức đánh thật cao
// nhất đo được trên boss kháng 95 % — Cái Bang Phi Long ~20.000 / giây cấp 150 không đồ; F10 Cấu hình bossTheGioi.stGiay lưu là có hiệu lực ngay, không cần khởi động lại)
const stGiay = () => { const v = +((N.CFG.bossTheGioi || {}).stGiay); return v >= 1000 ? v : CF.stGiay; };
const QT_ = (tk) => { try { return require("./bao-mat.js").qtMo(tk); } catch { return false; } }; // quản trị đã mở khóa an toàn: bỏ hạn mức sát thương / giây (anh 18/11 — "Một đòn chết" của công cụ thử)
// quản trị gửi sát thương ≥ cả máu boss ("Một đòn chết") mà trang chưa mở khóa an toàn (bao-mat.js qtMo): máy chủ vẫn cắt theo giây -> báo riêng người đó + ghi
// nhật ký máy, mỗi boss 1 lần (anh 18/11 "one hit rồi mà k kill dc" — trước không báo gì nên tưởng lỗi)
function canhQt(B, ten, d) {
  if ((B.canhQt || (B.canhQt = new Set())).has(ten)) return;
  let qt = false; try { const a = DL.docTk(ten); qt = !!(a && a.admin); } catch {}
  if (!qt) return;
  B.canhQt.add(ten);
  console.log(`[một đòn chết] ${ten} gửi ${Math.round(d)} lên ${B.ten} nhưng khóa an toàn chưa mở -> máy chủ cắt theo giây`);
  try { TG().thongBaoTk(`Một đòn chết chưa có tác dụng với ${B.ten}: cần mở khóa an toàn (biểu tượng ổ khóa cạnh bản đồ nhỏ) rồi đánh lại.`, ten, true); } catch {}
}
function danh(ten, u, d) {
  const B = BS.find((x) => x.u === +u); if (!B || B.mau <= 0) return false;
  d = Math.floor(+d || 0); if (!(d > 0)) return false;
  B.nhan.set(ten, (B.nhan.get(ten) || 0) + d); doi = true;
  const p = TG().dangChoi(ten); if (!p || p.zone !== B.bai) return false;
  const qt = QT_(ten);
  if (!qt && d >= B.mauMax) canhQt(B, ten, d);
  if (!qt) ND.cong(ten, "boss", d); // nghi hack sát thương (anh 16/11 — may-chu/nghi-dame.js, chỉ ghi): số gửi lên, trước khi cắt theo stGiay
  const ST = stGiay(), t = Date.now(), moi = !B.dmg.has(ten), x = B.dmg.get(ten) || { ten: p.name, d: 0, han: ST * 3, luc: t, dau: t, gui: 0, dinh: 0, g1: 0, g1t: t };
  if (moi) {
    const them = B.sk ? B.mauNguoi | 0 : Math.max(0, Math.round(+CF.mauNguoi || 0)); B.mauMax += them; B.mau += them; // siêu boss: × hsMau (anh 18/11 — goiSk b.mauNguoi)
    if (!B.phat) { B.phat = p.name; TG().thongBao(`${B.ten} tại ${tenBai(B.bai)} (${B.X}/${B.Y}) đã bị phát hiện bởi ${MT.ten(p.name)}!`); }
  }
  // số liệu soát (anh 15/11 — Thiên Nhẫn Kích 45 % sát thương, nghi lỗi): phần trình duyệt gửi lúc đứng ở bãi boss (gui), cao nhất trong 1 giây (dinh — ô 1 giây
  // từ tin đầu của ô), lúc đánh đầu (dau) / cuối (luc) — chet() ghi vào nhật ký Đổ hiếm cạnh % sát thương
  x.gui = (x.gui || 0) + d;
  if (t - (x.g1t || t) >= 1000) { x.dinh = Math.max(x.dinh || 0, x.g1 || 0); x.g1 = 0; x.g1t = t; }
  x.g1 = (x.g1 || 0) + d;
  x.han = Math.min(ST * 3, x.han + ((t - x.luc) / 1000) * ST); x.luc = t; x.ten = p.name;
  if (qt) x.han = Infinity;
  const nhan = Math.min(d, x.han, B.mau);
  x.han -= nhan; x.d += nhan; x.nong = nong(x, t) + nhan; x.nongLuc = t; B.dmg.set(ten, x); B.mau -= nhan; doi = true;
  if (B.mau <= 0) chet(B, ten);
  return true;
}

// nhịp của người chơi: thưởng đang chờ -> cộng kinh nghiệm + đồ (túi đầy: giữ phần đồ chờ nhịp sau, tối đa 30 phút) -> [{ ten, hang (0: chỉ
// đứng xem), pct, kn, len, mon: [{ k, n }] (quà xếp hạng đã vào túi), kich?: { kn, mon } (quà kích sát), day (túi đầy — đồ còn chờ: cho), bang:
// [[tên, %]] (10 người đầu), so (số người đánh), tenNv, khongDu? (chưa đủ % này — không thưởng), chiXem?, lai (phần đồ chờ nay mới vào túi), xu? (Xu may mắn) }] | null
// Kết quả của nhân vật khác cùng tài khoản (đánh boss rồi đổi nhân vật — rà soát 11/11): giữ chờ nhân vật đó vào game, không trao nhầm. r.ghi: kinh
// nghiệm + quà tham gia + Xu đã ghi thẳng lúc boss chết (ghiVang) — chỉ trao đồ + hiện khung
function nhanThuong(h, ten) {
  const L = cho.get(ten); if (!h || !L || !L.length) return null;
  const ra = [], con = [], t = Date.now();
  for (const r of L) {
    if (r.tenNv && h.name && r.tenNv !== h.name) { con.push(r); continue; }
    let len = 0, day = false;
    const kn = r.ghi ? 0 : (r.kn || 0) + ((r.kich && r.kich.kn) || 0), tatCa = [...r.mon, ...((r.kich && r.kich.mon) || [])];
    if (kn) { h.exp = (h.exp || 0) + kn; h.lvl = h.lvl || 1; len = N.lenCap(h); }
    // quà tham gia (anh 11/11): Bảo rương đồ xanh vào hàng chờ của nhân vật (do.js choRuongXanh — nhịp tự vào túi khi có chỗ, không hết hạn); 1 lần
    if ((r.tg | 0) > 0 && !r.lai && !r.ghi) DO.choRuongXanh(h, r.tg | 0);
    if ((r.xu | 0) > 0 && !r.lai && !r.ghi) h.xu = (h.xu | 0) + (r.xu | 0); // Xu may mắn (lượt 86)
    if (tatCa.length) {
      try { DO.taoQua(h, { mon: tatCa }); } catch { day = true; if (t - r.luc < THUONG_GIU) con.push({ ...r, kn: 0, tg: 0, xu: 0, ...(r.kich ? { kich: { ...r.kich, kn: 0 } } : {}), lai: true }); }
    }
    if (r.lai && day) continue; // nhận lại phần đồ chờ mà túi vẫn đầy: im (lần đầu đã báo), khỏi báo mỗi nhịp
    // r.monGhi / r.kich.monGhi: đồ của người vắng đã vào hàng chờ quà (ghiVang — anh 16/11) — chỉ hiện trong khung tổng kết
    ra.push({ ten: r.ten, hang: r.hang, pct: r.pct, kn: r.kn, len, mon: day ? [] : r.monGhi || r.mon, ...(r.kich ? { kich: { kn: r.kich.kn, mon: day ? [] : r.kich.monGhi || r.kich.mon } } : {}), day,
      ...((r.tg | 0) > 0 && !r.lai ? { tg: r.tg | 0 } : {}), ...((r.xu | 0) > 0 && !r.lai ? { xu: r.xu | 0 } : {}),
      bang: r.bang, so: r.so, tenNv: r.tenNv, ...(day ? { cho: tatCa } : {}), ...(r.khongDu ? { khongDu: r.khongDu } : {}), ...(r.chiXem ? { chiXem: 1 } : {}), ...(r.lai ? { lai: true } : {}) });
  }
  if (con.length) cho.set(ten, con); else cho.delete(ten);
  return ra.length ? ra : null;
}

// bảng quản trị / công cụ thử: { viec: "goi" (so?, tpl?, tai?, mau?) | "huy" (mọi boss đang sống) | "xem" }
function quanTri(b) {
  if (b.viec === "goi") return { b: goi({ so: b.so, tpl: b.tpl, tai: b.tai, mau: b.mau }), dsBoss: dsTT("") };
  if (b.viec === "huy") { if (!BS.length) N.loi("Không có boss thế giới"); for (const x of [...BS]) roi(x, true); return { b: null, dsBoss: dsTT("") }; }
  const B0 = BS[0], xet = B0 ? ungVien(B0, Date.now()).map((x) => ({ ten: x.ten, cach: Math.round(x.d), nhiet: Math.round(x.n) })) : [];
  return { b: trangThai(""), ds: BTG.ds.map((x) => [x.tpl, x.ten]), dsBoss: dsTT(""), lich: CF.gio, bat: !!CF.bat, so: CF.so, xet,
    choi: BS.length ? TG().dsDangChoi().map((p) => ({ ten: p.name, bai: p.zone, x: p.x, y: p.y, hp: p.hp })) : [] };
}

WS.nhan("mo", (kn) => kn.gui(tinBtg(kn.ten)));
WS.nhan("vao", (kn) => kn.gui(tinBtg(kn.ten)));
WS.nhan("bst", (kn, tin) => { danh(kn.ten, tin.u, tin.d); });

// lịch (giờ Việt Nam), hết giờ sống, gửi trạng thái tối đa 4 lần / giây
setInterval(() => {
  const t = Date.now();
  for (const b of [...BS]) if (t >= b.het) { if (b.sk) thuongSk(b, null, true); else roi(b, false); } // siêu boss hết giờ: ½ quà (anh 18/11)
  for (const b of BS) chonMuc(b);
  if (XONG.some((b) => t - b.luc > XONG_GIU)) { XONG = XONG.filter((b) => t - b.luc <= XONG_GIU); doi = true; }
  if (!BS.some((b) => !b.sk) && CF.bat && Array.isArray(CF.gio)) {
    const vn = new Date(t + 7 * 3600000).toISOString(), hm = vn.slice(11, 16), k = vn.slice(0, 10) + " " + hm;
    if (CF.gio.includes(hm) && !daGoi.has(k) && GV.thuOk(CF, t)) { daGoi.add(k); try { goi({}); } catch (e) { console.error("Boss thế giới:", e.message); } }
  }
  // siêu boss sự kiện (anh 18/11): đúng giây gio (giờ Việt Nam), mỗi ngày 1 lần, trong 60 giây đầu (máy chủ chạy lại muộn hơn thì thôi hôm đó)
  if (doi && t - guiLuc >= 250) { doi = false; guiLuc = t; ver++; phat(); }
}, 250).unref();

// roi(huy): mọi boss đang sống rời / bị gọi về (lịch hoạt động, công cụ cũ)
module.exports = { goi, roi: (huy) => { const L = [...BS]; for (const b of L) roi(b, huy); return L.length ? true : null; }, danh, trangThai, dsTT, nhanThuong, quanTri, CF, dangCo: () => BS.length > 0 };
