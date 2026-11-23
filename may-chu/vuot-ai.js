// Vượt Ải — "Thách thức thời gian" (Nhiếp Thí Trần → Thử luyện sát thủ → Tham gia khiêu chiến). Anh 28/10: "làm vượt ải, nhớ thêm vào dev
// tool, mỗi ngày đi 4 lần, lần sau chi phí x2 lần trước: 1 2 4 8 sát thủ giản + tiền vạn" (trước đó anh chốt 1 Sát Thủ Giản + 50 vạn lượng,
// mỗi người 1 ải riêng — tổ đội + quái chung làm sau). Luật theo kịch bản máy chủ 8.1 Vinh (ổ ảo, chỉ đọc — script\missions\challengeoftime\):
//   - npc\dragonboat_main.lua: bậc theo cấp — Sơ cấp 50–89 cần Sát Thủ Giản ngũ hành bất kỳ cấp 20–80, Cao cấp 90 trở lên cần Sát Thủ Giản
//     cấp 90 (ConsumeEquiproomItem — chỉ đếm trong hành trang; sơ cấp tiêu giản cấp thấp trước).
//   - npc.lua + npc_death.lua: 28 đám quái lần lượt, hạ hết đám này mới ra đám sau (assets/data/vuot-ai.json — cong-cu/dung-vuot-ai.mjs).
//     Quái của ải không rơi đồ / tiền, không cho kinh nghiệm riêng (npcs.txt Treasure 0, Exp 0) — thưởng theo đám (award.lua award_batch):
//     kinh nghiệm của đám × đội trưởng 1,2 × cao cấp 2, rơi số món của đám ở chỗ con cuối; hết 28 đám (award_success) + kinh nghiệm theo
//     thời gian đã dùng.
//   - include.lua LIMIT_FINISH: 30 phút (timer_close.lua: hết giờ thì thất bại, đưa ra ngoài); player_death.lua: tử vong trong ải thì rời ải
//     (không mất kinh nghiệm — ải tắt phạt).
// Anh 28/10 (sau lần thử đầu): vào ải có chuanBi giây chuẩn bị rồi mới ra quái (client báo danh 10 phút rồi mới bắt đầu — 30 phút tính từ lúc
// ra quái); KHÔNG rơi trang bị trắng / xanh — thay bằng mỗi con quái ải hạ được có tỉ lệ thuoc.tiLe rơi thuoc.n bình Ngũ Hoa Ngọc Lộ Hoàn
// (anh 28/10 lần 2: "1 bình, tỉ lệ vừa khi kill quái ải để mọi người nhặt tiếp tế" — bản trước 10 bình mỗi đám); hạ boss của ải
// (tiểu boss, Nhiếp Thí Trần, 8 con đám cuối — 17 con / lần) có tỉ lệ leBao.roi rơi 1 Hộp lễ vật vượt ải (mở: do.js dungVat leBaoVa).
// Bản mình: mỗi người 1 ải riêng (quái trình duyệt tự sinh theo đám — main.js vaTick), máy chủ đếm từng con theo nhóm của đám đang đánh và
// phát thưởng; phí + số lần trong ngày theo cau-hinh.json vuotAi (lần thứ i: gian[i] giản + tien[i] lượng). Hết ải / hết giờ / tử vong thì về
// Ba Lăng chỗ Nhiếp Thí Trần.
// h.vuotAi (máy chủ giữ): { ngay (ngày Việt Nam), luot (đã vào hôm nay), dang?: { cap 1 | 2, bd (lúc vào, ms), dot (đám đang đánh 1–28),
//   giet [số con đã hạ của từng nhóm], luc, ket?: { xong 1 | thua 1, giay }, phong?, tk? } } — bd = lúc RA QUÁI (vào + chuanBi giây); phong =
//   mã phòng tổ đội (dưới đây), tk = tài khoản của nhân vật (xét còn trong phòng)
//
// ---------- Tổ đội + quái chung (anh 31/10: "Vượt Ải theo tổ đội + quái chung — ưu tiên làm cái này, quái chung cho tổ đội như chúng ta thảo
// luận" = bước 2 của "quái chung": máy đội trưởng làm "chủ bãi") ----------
// Client (npc\dragonboat_main.lua COT_CheckTeamRequirement / COT_TeamJoin / COT_TeamMemberJoin): chỉ đội trưởng báo danh; mọi thành viên cùng
// bậc (cùng dưới / cùng từ cấp 90), còn lượt, có Sát Thủ Giản — ai thiếu thì báo tên người đó, không ai vào; đủ thì cả đội vào 1 ải (tiêu giản
// của từng người, kéo cả người đang ở bản đồ khác). Thưởng đám / xong ải cho TỪNG người còn trong ải (award.lua GetMatchPlayerList — đội trưởng
// × 1,2). S1: mỗi thành viên nộp phí lần của mình (gian / tien theo số lần trong ngày của người đó); đội 1 người (chưa lập nhóm) đi như cũ.
// Phòng (chỉ trong bộ nhớ — tắt máy chủ giữa chừng thì lượt đó hỏng như ải client mất khi máy chủ tắt): máy chủ giữ đám, máu từng con, sống /
// chết, thưởng; máy "chủ bãi" (đội trưởng — vắng / tab ẩn thì người kế còn trong ải) chọn mục tiêu cho từng con + báo vị trí; mọi máy tự chạy
// quái (đuổi mục tiêu chung, chỉ máy của người bị đánh trừ máu người đó — như boss thế giới), sát thương gửi qua kênh tức thời (may-chu/ws.js)
// trừ vào máu chung, máy chủ báo chết. Đồ rơi mỗi con (Ngũ Hoa, Hộp lễ vật) mỗi người tự gieo, ai người nấy thấy (như quái thường của S1).
// Ở bãi ải chỉ thấy người cùng phòng (the-gioi.js, ws.js locBai — client mỗi đội 1 bản đồ riêng).
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const DL = require("./du-lieu.js");
const WS = require("./ws.js");
const TG = () => require("./the-gioi.js");
const TDOI = () => require("./to-doi.js");
let KB_ = null; const KB = () => KB_ || (KB_ = require("./khu-bang.js")); // khu vực bang (bang hội đợt 4) — nạp lúc dùng, đệm (cungCho chạy nhiều mỗi giây)
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến mỗi đám (tổ đội — xongDotP; 1 người — do.js gietQuai qua r.bhDam) — nạp lúc dùng
const MT = require("./mau-tin.js"); // màu chữ tin hệ thống: tên nhân vật, phần thưởng (anh 13/11)

const N = DO.NOI, loi = N.loi;
// anh 16/11 — Báo Đáp Ân Sư (may-chu/bao-dap-an-su.js, nạp lúc dùng): xong trọn ải -> món sự kiện (thuongNguon "vuotAi") cho người đi 1 mình (nhanGiet) / mỗi người
// còn trong ải (tổ đội: xongDotP ghi r.ev vào CHO, nhanPhong trao). Module thiếu / ném lỗi -> [] (thưởng ải như cũ); món chưa có trong kho đồ thì bỏ
const BD = () => require("./bao-dap-an-su");
function bdMon(nguon, x) {
  try { return (BD().thuongNguon(nguon, x) || []).filter((r) => Array.isArray(r) && N.BY.has(String(r[0])) && (r[1] | 0) > 0).map(([k, n]) => ({ k: String(k), n: n | 0 })); }
  catch (e) { if (!e || e.code !== "MODULE_NOT_FOUND") console.error("Báo Đáp Ân Sư —", nguon, e && e.message); return []; }
}
const BD_LOI = "Hoạt động báo đáp ân sư — thưởng Vượt Ải (hành trang đầy lúc nhận)";
// trao món sự kiện vào túi (DO.taoQua — cả gói hoặc không, không khóa); túi đầy -> hàng chờ quà h.quaCho (nhịp api.js tự nhận khi có chỗ). -> câu báo
function bdGiao(h, mon) {
  try { const ds = DO.taoQua(h, { mon: mon.map((x) => ({ ...x })) }); return `Hoạt động báo đáp ân sư: nhận được ${ds.join(", ")}.`; }
  catch {
    h.quaCho = [...(Array.isArray(h.quaCho) ? h.quaCho : []), { mon: mon.map((x) => ({ ...x })), luc: Date.now(), he: 1, loi: BD_LOI }]; // he: quà hệ thống
    return "Hoạt động báo đáp ân sư: hành trang không đủ chỗ — phần thưởng đang chờ, sắp xếp hành trang là tự nhận.";
  }
}
const VA = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/vuot-ai.json"), "utf8")); } catch { return null; } })();
// nhin: tầm nhìn quái ải (0 = VisionRadius của client — anh 31/10 "quái trong phạm vi thấy chủ động tấn công"; bản 28/10: 160), keo: kéo con đứng
// trong chừng này quanh con vừa lao vào. Tổ đội: nghi = giây nghỉ giữa 2 đám (bản 1 người: main.js VA_NGHI), stGiay = sát thương tối đa nhận / giây / người (dư 3 giây dồn — chặn số
// láo như boss thế giới), mauThem = máu quái thêm mỗi thành viên ngoài người đầu (0: như client — ải làm cho đội), vangGiay = rời bãi ải quá
// chừng này thì ra khỏi phòng
const CF = { luot: 4, gian: [1, 2, 4, 8], tien: [500000, 1000000, 2000000, 4000000], doiTruong: 1.2, caoCap: 2, kinhNghiem: 1, treGiay: 60, mau: { 1: 1, 2: 1 },
  chuanBi: 60, nhin: 0, keo: 180, thuoc: { k: "potion:15", n: 1, tiLe: 0.08 }, leBao: { k: "ms:1392", roi: 0.38 },
  nghi: 5, stGiay: 2000000, mauThem: 0, vangGiay: 45, ruongXanh: 2, toiThieu: 3, heSo: { goc: 2, them: 0.5 }, xuDoi: 0.05, xuSo: 3, ...(N.CFG.vuotAi || {}) };
// anh 16/11: tổ đội tối thiểu toiThieu người; quái + boss (máu và sát thương) × hsDoi(n) = heSo.goc ở toiThieu người + heSo.them mỗi người thêm (thay mauThem);
// xong trọn ải: cả đội 1 lần quay xuDoi × (n − 1) — trúng thì mỗi người còn trong ải nhận xuSo Xu (n = số người lúc vào ải)
// anh 17/11 tối ("điều chỉnh số người tham gia tối thiểu … s1 đang yêu cầu cho đi viêm đế và VA solo"): toiThieu CHỈ chặn vào (F10 sửa ăn ngay — đọc thẳng cấu hình đang
// chạy); độ mạnh quái / thưởng thêm tính theo mốc đội MOC_DOI = 3 người như anh chốt 16/11: đội 3 người ×goc như cũ, mỗi người thêm +them, ít hơn thì bớt them (1 người ×1, 2 người
// ×1,5 với goc 2 / them 0,5), tối thiểu ×0,5. Trước: mốc = toiThieu -> hạ toiThieu xuống 1 thì đi 1 mình ×2, đội 3 người lại ×3
const MOC_DOI = 3;
const toiThieu = () => Math.max(1, ((N.CFG.vuotAi || {}).toiThieu ?? CF.toiThieu) | 0);
const hsDoi = (n) => { const H = CF.heSo || {}; return Math.max(0.5, (+H.goc || 2) + (+H.them || 0) * (n - MOC_DOI)); };
// ruongXanh (anh 04/11): xong trọn ải -> mỗi người còn trong ải chừng này Bảo rương đồ xanh (do.js choRuongXanh — nhịp sau tự vào túi)
// cấp Sát Thủ Giản nhận ở từng bậc (dragonboat_main.lua); anh 28/10 lần 7: Boss Sát thủ tới cấp 200 -> Cao cấp nhận cả giản cấp 100–200
const GIAN = { 1: [20, 30, 40, 50, 60, 70, 80], 2: [90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200] };
const TEN = "Nhiếp Thí Trần";
const say = (text, opts) => ({ say: { text, opts } });
const dong = ["Đóng", null];
const R = (t) => `<color=red>${t}<color>`, Y = (t) => `<color=yellow>${t}<color>`;
const van = (n) => (n % 10000 ? `${n.toLocaleString("vi-VN")} lượng` : `${n / 10000} vạn lượng`);

const capCua = (cap) => (VA ? VA.cap.find((c) => c.cap === cap) : null);
const bacCua = (h) => (VA ? VA.cap.find((c) => (h.lvl | 0) >= c.lo && (h.lvl | 0) <= c.hi) : null);
const tenBac = (cap) => (cap === 2 ? "cao cấp" : "sơ cấp");
// trạng thái trong ngày: sang ngày mới (giờ Việt Nam — TSK_JOIN_DATE) thì đếm lại số lần
function tt(h) {
  const S = (h.vuotAi = h.vuotAi || { luot: 0 }), ngay = N.ngayVN(Date.now());
  if (S.ngay !== ngay) { S.ngay = ngay; S.luot = 0; }
  return S;
}
const phiLan = (k) => ({ gian: CF.gian[Math.min(k, CF.gian.length - 1)] | 0, tien: CF.tien[Math.min(k, CF.tien.length - 1)] | 0 });
// Sát Thủ Giản trong hành trang đủ cấp của bậc, cấp thấp trước (chồng — anh 02/11 khuya: giản xếp chồng, không còn hệ); soGian = tổng số giản,
// tieuGian = trừ n giản từ các chồng đó (cấp thấp trước, chồng hết thì bỏ ô)
const gianCo = (h, cap) => (h.bag || []).filter((o) => { const x = N.BY.get(o.k) || {}; return x.satThu === "gian" && GIAN[cap].includes(x.cap); })
  .sort((a, b) => (N.BY.get(a.k).cap - N.BY.get(b.k).cap));
const soGian = (ds) => ds.reduce((t, o) => t + (o.n || 1), 0);
function tieuGian(h, ds, n) {
  for (const o of ds) {
    if (n <= 0) break;
    const m = Math.min(n, o.n || 1); n -= m; o.n = (o.n || 1) - m;
    if (o.n <= 0) h.bag.splice(h.bag.indexOf(o), 1);
  }
}
const heSo = (D) => CF.doiTruong * (D.cap === 2 ? CF.caoCap : 1) * CF.kinhNghiem; // người vào 1 mình = đội trưởng
// thưởng thêm mỗi ải (anh 17/11 "Vượt Ải dân tình chê lên chê xuống do thưởng cùi … mỗi lần clear 1 ải nhỏ nhận thêm exp 500.000 … qua 1 ải nhỏ exp cộng thêm 100k …
// clear ải cuối nhận 10tr exp … điều chỉnh exp tương ứng với số người"; anh duyệt đề xuất): đám dot (1–tong) -> kinh nghiệm thêm mỗi người TRƯỚC hệ số đội trưởng:
// ải nhỏ goc + them × (dot − 1), ải cuối cuoi; sơ cấp × soCap; tổ đội n người (lúc vào) × (1 + moiNguoi × số người quá toiThieu). Không × caoCap (số anh đặt là số
// thật của cao cấp). cau-hinh.json vuotAi.thuongAi — 0 / thiếu = tắt
const TA = { goc: 500000, them: 100000, cuoi: 10000000, soCap: 0.1, moiNguoi: 0.1, ...(CF.thuongAi || {}) };
const hsNguoi = (n) => 1 + Math.max(0, +TA.moiNguoi || 0) * Math.max(0, (n | 0) - MOC_DOI); // +moiNguoi mỗi người quá 3 (mốc đội — không theo toiThieu)
function thuongAi(cap, dot, tong, n) {
  const g = dot >= tong ? +TA.cuoi || 0 : (+TA.goc || 0) + (+TA.them || 0) * Math.max(0, dot - 1);
  return Math.max(0, Math.round(g * (cap === 2 ? 1 : +TA.soCap || 0) * hsNguoi(n)));
}
const soVn = (n) => Math.round(n).toLocaleString("vi-VN");
const soHs = (x) => String(Math.round(x * 100) / 100).replace(".", ",");
// dòng thưởng ở kênh Khác (trình duyệt: tinVa — vadoi / main.js applyServer vaKq): "[Vượt Ải] Qua ải 12/28 — thưởng +1.600.000 kinh nghiệm (đội 5 người ×1,2 · đội trưởng ×1,2)"
function cauThuong(dot, tong, kn, n, truong) {
  const k = hsNguoi(n), ph = [n > 1 ? `đội ${n} người${k > 1 ? ` ×${soHs(k)}` : ""}` : "", truong ? `đội trưởng ×${soHs(CF.doiTruong)}` : ""].filter(Boolean).join(" · ");
  return `[Vượt Ải] ${dot >= tong ? "Qua ải cuối" : `Qua ải ${dot}/${tong}`} — thưởng +${soVn(kn)} kinh nghiệm${ph ? ` (${ph})` : ""}`;
}
const conGiay = (D) => Math.max(0, VA.han - Math.floor((Date.now() - D.bd) / 1000));

// ---------- phòng tổ đội ----------
// P = { id, cap, bai, bd (lúc ra đám 1), luc (lúc báo danh), dot, giet [số con đã hạ của từng nhóm], ket, sinh (lúc ra đám hiện tại), truong:
//   { ten, sex, he } (tên / hình tiểu boss đầu như bản 1 người), tv: [{ tk, ten }] (đội trưởng đầu), trong: Set(tài khoản còn trong ải), chu
//   (tài khoản máy chủ bãi), an: Set(tab ẩn), q: Map(uid -> con quái { uid, gi (nhóm), tpl, lv, he, ten, mau, mauMax, boss, x, y }), vt:
//   Map(uid -> [x, y, mục tiêu]) (chủ bãi báo), dan: Map(uid -> thứ tự người vừa đánh trong tv), ack: Map(tài khoản -> số tin sát thương đã
//   nhận), han: Map(tài khoản -> { han, luc }), vang: Map(tài khoản -> lúc rời bãi), specV (đổi mỗi đám), daSpec: Map(tài khoản -> specV đã gửi) }
const PHONG = new Map();     // mã phòng -> P
const PHONG_TK = new Map();  // tài khoản -> mã phòng
const CHO = new Map();       // tài khoản -> [thưởng chờ nhịp sau: { kn?, mon?, z, x, y, tin?, ket?, phong? }]
const DI = new Map();        // tài khoản -> { tin, di } (thành viên được đội trưởng kéo vào ải — nhịp sau đi)
let soPhong = 0;

const doiCua = (ten) => { const d = ten ? TDOI().thanhVien(ten) : null; return d && d.tv.length > 1 ? d : null; };
const tvSo = (P, tk) => P.tv.findIndex((x) => x.tk === tk);
const tenTv = (P, tk) => { const x = P.tv.find((v) => v.tk === tk); return x ? x.ten : null; };
// hệ số kinh nghiệm của từng người: đội trưởng × 1,2 (award.lua: GetName() == VARS_TEAM_NAME)
const heSoTv = (P, tk) => (P.tv[0].tk === tk ? CF.doiTruong : 1) * (P.cap === 2 ? CF.caoCap : 1) * CF.kinhNghiem;
// máu đặt sẵn (cau-hinh.json vuotAi.mauDat — như main.js sinhDot bản 1 người) × hệ số tổ đội P.hs (anh 16/11 — hsDoi; trước: 1 + mauThem × số người thêm)
function mauDatP(P, g) {
  const MD = (CF.mauDat || {})[P.cap], soDot = capCua(P.cap).dot.length, k = P.hs || hsDoi(P.tv.length);
  if (!MD) return Math.round((P.cap === 2 ? 200000 : 100000) * k);
  const giua = (r, t) => Math.round(r[0] + (r[1] - r[0]) * Math.min(1, Math.max(0, t)));
  const v = !g.boss ? giua(MD.quai, (P.dot - 1) / Math.max(1, soDot - 3)) : g.tenMoiNguoi ? MD.boss[0] : g.tenNguoi ? giua(MD.boss, (P.dot - 4) / Math.max(1, soDot - 5)) : MD.boss[1];
  return Math.max(1, Math.round(v * k));
}
// quái của đám P.dot: đội hình lineup<n> / điểm cố định, tên / hệ / mẫu tiểu boss như main.js sinhDot (theo đội trưởng). uid = đám × 1000 + nhóm × 100 + thứ tự
function sinhDotP(P) {
  const B = capCua(P.cap), d = B.dot[P.dot - 1], du = (i) => VA.tenDu[i % VA.tenDu.length];
  let tb = B.dot.slice(0, P.dot - 1).reduce((a, x) => a + x.ds.filter((g) => g.tenNguoi).length, 0);
  P.q = new Map(); P.vt = new Map(); P.dan = new Map(); P.giet = []; P.specV = (P.specV | 0) + 1;
  for (const [gi, g] of d.ds.entries()) {
    const mau = mauDatP(P, g);
    for (let i = 0; i < g.n; i++) {
      const tpl = g.tpl || (() => { const [a, b] = g.tieuBoss[P.truong.sex === "f" ? 1 : 0]; return a + Math.floor(Math.random() * (b - a + 1)); })();
      const at = g.cho === "xep" ? (VA.xep[g.n] || [])[i] : Array.isArray(g.cho) ? [g.cho[0] + (i % 3 - 1) * 30, g.cho[1] + ((i / 3) | 0) * 15] : null;
      const ten = g.ten || (g.tenNguoi ? (tb ? du(tb - 1) : P.truong.ten) : g.tenMoiNguoi ? (i ? du(i - 1) : P.truong.ten) : null);
      const he = g.he === "nguoi" ? (tb ? Math.floor(Math.random() * 5) : P.truong.he | 0) : g.he >= 0 ? g.he : Math.floor(Math.random() * 5);
      const [x, y] = at || [VA.vao[0] + Math.round((Math.random() - 0.5) * 300), VA.vao[1] + Math.round((Math.random() - 0.5) * 150)];
      const uid = P.dot * 1000 + gi * 100 + i;
      P.q.set(uid, { uid, gi, tpl, lv: g.lv, he, ten: ten || null, mau, mauMax: mau, boss: g.boss ? 1 : 0, x, y });
    }
    if (g.tenNguoi) tb++;
  }
}
// trạng thái gửi thành viên tk (kênh tức thời / nhịp): full = kèm danh sách quái của đám (q) + vị trí chủ bãi báo (vt)
function trangThaiP(P, tk, full, dan) {
  const B = capCua(P.cap);
  return { id: P.id, cap: P.cap, bai: P.bai, bd: P.bd, dot: P.dot, tong: B.dot.length, han: VA.han, sinh: P.sinh, ket: P.ket || null, giet: P.giet, sv: P.specV,
    chu: tenTv(P, P.chu), tv: P.tv.map((x) => [x.ten, P.trong.has(x.tk) ? 1 : 0]), hp: [...P.q.values()].map((m) => [m.uid, Math.max(0, Math.ceil(m.mau))]),
    dan: dan || [], ack: P.ack.get(tk) || 0, gio: Date.now(), hs: P.hs || 1, // hs: hệ số sức quái theo tổ đội (anh 16/11) — trình duyệt nhân sát thương quái (vadoi.js)
    ...(full ? { q: [...P.q.values()].map((m) => [m.uid, m.tpl, m.lv, m.he, m.ten, m.mauMax, m.x, m.y, m.boss]), vt: [...P.vt].map(([u, v]) => [u, ...v]) } : {}) };
}
// gửi trạng thái cho người còn trong ải (mỗi người kèm số tin sát thương của mình máy chủ đã nhận); người chưa có danh sách quái đám này: full
function phatP(P) {
  P.guiLuc = Date.now(); P.doi = false; P.gap = false;
  const dan = [...P.dan]; P.dan.clear();
  for (const tk of P.trong) {
    const kn = WS.cua(tk); if (!kn) continue;
    const full = P.daSpec.get(tk) !== P.specV;
    if (full) P.daSpec.set(tk, P.specV);
    kn.gui({ t: "va", p: trangThaiP(P, tk, full, dan) });
  }
}
function guiKhac(P, tk, obj) { for (const a of P.trong) if (a !== tk) WS.guiTk(a, obj); }
function choThuong(tk, r) { const L = CHO.get(tk) || []; L.push(r); if (L.length > 400) L.shift(); CHO.set(tk, L); }
function xoaPhong(P) { PHONG.delete(P.id); for (const x of P.tv) if (PHONG_TK.get(x.tk) === P.id) PHONG_TK.delete(x.tk); }
// tk ra khỏi ải (tử vong, hết ải, rời bãi quá vangGiay): không nhận thưởng nữa; hết người thì bỏ phòng
function roiPhong(P, tk) {
  if (!P.trong.delete(tk)) return;
  PHONG_TK.delete(tk); P.doi = true;
  if (!P.trong.size) xoaPhong(P);
}
// chủ bãi: đội trưởng nếu đang ở bãi ải (kênh tức thời mở) và tab không ẩn; không thì người kế theo thứ tự đội còn trong ải (tab hiện trước)
function chonChu(P) {
  const ok = P.tv.map((x) => x.tk).filter((a) => { const k = WS.cua(a); return P.trong.has(a) && k && k.zone === P.bai; });
  const moi = ok.find((a) => !P.an.has(a)) || ok[0] || null;
  if (moi !== P.chu) { P.chu = moi; P.doi = true; }
}
// con quái chết (máu chung về 0): đếm nhóm, mỗi người còn trong ải tự gieo đồ rơi (Ngũ Hoa / Hộp lễ vật ở chỗ con chết — vị trí chủ bãi báo),
// hết đám -> thưởng đám
function quaiChetP(P, m) {
  m.mau = 0; P.giet[m.gi] = (P.giet[m.gi] | 0) + 1; P.gap = true;
  const v = P.vt.get(m.uid), x = v ? v[0] : m.x, y = v ? v[1] : m.y, L0 = CF.leBao, T0 = CF.thuoc;
  for (const tk of P.trong) {
    const mon = [];
    if (m.boss && L0 && Math.random() < L0.roi) mon.push({ k: L0.k, n: 1 });
    if (T0 && Math.random() < T0.tiLe) { const [a, b] = Array.isArray(T0.n) ? T0.n : [T0.n, T0.n]; mon.push({ k: T0.k, n: a + Math.floor(Math.random() * (b - a + 1)) }); }
    if (mon.length) choThuong(tk, { mon, z: P.bai, x, y });
  }
  const d = capCua(P.cap).dot[P.dot - 1];
  if (d.ds.every((g, i) => (P.giet[i] | 0) >= g.n)) xongDotP(P);
}
// hết đám: mỗi người còn trong ải nhận kinh nghiệm của đám (× đội trưởng × cao cấp); sang đám sau sau nghi giây; hết 28 đám: kinh nghiệm theo phút
function xongDotP(P) {
  const B = capCua(P.cap), d = B.dot[P.dot - 1], tong = B.dot.length, nVao = P.tv.length, T = thuongAi(P.cap, P.dot, tong, nVao);
  // anh 17/11: ải nhỏ (đám 1 … tong − 1) thưởng thêm ngay ở đây; ải cuối cộng vào phần thưởng hoàn thành bên dưới
  for (const tk of P.trong) {
    const ld = P.tv[0].tk === tk, them = P.dot < tong && T > 0 ? Math.round(T * (ld ? CF.doiTruong : 1)) : 0;
    choThuong(tk, { kn: Math.round(d.kn * heSoTv(P, tk)) + them, tin: [`Đội ngũ đã tiêu diệt toàn bộ ${P.dot} đám quái!`], ...(them ? { tinVa: [cauThuong(P.dot, tong, them, nVao, ld)] } : {}) });
  }
  for (const tk of P.trong) { const ten = tenTv(P, tk); if (ten) try { BHO().cong(tk, null, ten, "vuotAi", null, { dot: P.dot }); } catch {} } // bang hội đợt 2: cống hiến mỗi đám (4 / 8 / 10)
  P.doi = true;
  if (P.dot < B.dot.length) { P.dot++; P.sinh = Date.now() + CF.nghi * 1000; sinhDotP(P); return; }
  const giay = Math.floor((Date.now() - P.bd) / 1000), phut = Math.floor(giay / 60), X = B.xong;
  const e = (phut >= X.m ? X.c : Math.floor(X.a * (1 - phut / X.m)) + X.b) * 1000;
  P.ket = { xong: 1, giay };
  const ev = bdMon("vuotAi"); // anh 16/11 — Báo Đáp Ân Sư: món sự kiện cho mỗi người còn trong ải (nhanPhong trao — taoQua, túi đầy: h.quaCho)
  // anh 16/11: cả đội 1 lần quay xuDoi × (n − 1) (n = số người lúc vào) — trúng thì mỗi người còn trong ải nhận xuSo Xu (nhanPhong cộng)
  const xu = CF.xuSo | 0, trungXu = xu > 0 && Math.random() < Math.max(0, (+CF.xuDoi || 0) * (P.tv.length - 1));
  for (const tk of P.trong) {
    const ld = P.tv[0].tk === tk, cuoi = T > 0 ? Math.round(T * (ld ? CF.doiTruong : 1)) : 0; // anh 17/11: qua ải cuối thưởng thêm (10 triệu × hệ số)
    choThuong(tk, { kn: Math.round(e * heSoTv(P, tk)) + cuoi, ket: P.ket, phong: P.id, rx: CF.ruongXanh | 0, ...(cuoi ? { tinVa: [cauThuong(P.dot, tong, cuoi, nVao, ld)] } : {}), ...(ev.length ? { ev: ev.map((x) => ({ ...x })) } : {}), ...(trungXu ? { xu } : {}) });
  }
  // báo cả máy chủ (kênh hệ thống — trình duyệt hiện ở thẻ Khác / Tất cả): anh 17/11 "ải cuối hiện kênh khác, cả server thấy thì ok" — kèm số kinh nghiệm thưởng thêm
  TG().thongBao(`${MT.ten(P.truong.ten)}: đội ngũ đã thắng lợi hoàn thành nhiệm vụ Thách thức thời gian ${tenBac(P.cap)}, đã dùng ${phut} phút ${giay % 60} giây!${T > 0 ? ` Mỗi người nhận thêm ${MT.thuong(soVn(T) + " kinh nghiệm")}!` : ""}${trungXu ? ` Cả đội may mắn nhận được ${MT.thuong(xu + " Xu")} mỗi người!` : ""}`);
}
// sát thương của tài khoản tk (kênh tức thời "vad" / nhịp b.vad): { s: số tin, d: [[uid, sát thương]], st: [[uid, choáng ms, chậm ms]] }. Chỉ
// tính khi người đó còn trong ải, đứng ở bãi ải, đám đã ra; tổng mỗi người theo hạn mức stGiay. Trạng thái choáng / chậm chuyển cho máy khác
const QT_ = (tk) => { try { return require("./bao-mat.js").qtMo(tk); } catch { return false; } }; // quản trị đã mở khóa an toàn: bỏ hạn mức sát thương / giây (anh 18/11 — "Một đòn chết" của công cụ thử)
function danhP(tk, tin) {
  const P = PHONG.get(PHONG_TK.get(tk)); if (!P || !tin || typeof tin !== "object") return;
  const s = Math.floor(+tin.s || 0); if (s > (P.ack.get(tk) || 0)) { P.ack.set(tk, s); P.doi = true; }
  const t = Date.now(), p = TG().dangChoi(tk);
  if (P.ket || !P.trong.has(tk) || t < P.sinh || !p || p.zone !== P.bai) return;
  const H = P.han.get(tk) || { han: CF.stGiay * 3, luc: t }, so = tvSo(P, tk);
  H.han = Math.min(CF.stGiay * 3, H.han + ((t - H.luc) / 1000) * CF.stGiay); H.luc = t; P.han.set(tk, H);
  if (QT_(tk)) H.han = Infinity;
  for (const r of Array.isArray(tin.d) ? tin.d.slice(0, 120) : []) {
    const m = Array.isArray(r) && P.q.get(r[0] | 0), v = Math.floor(+r[1] || 0);
    if (!m || m.mau <= 0 || !(v > 0)) continue;
    const nhan = Math.min(v, H.han, m.mau); if (!(nhan > 0)) continue;
    H.han -= nhan; m.mau -= nhan; P.dan.set(m.uid, so); P.doi = true;
    if (m.mau <= 0) quaiChetP(P, m);
  }
  const st = (Array.isArray(tin.st) ? tin.st.slice(0, 60) : []).filter((r) => Array.isArray(r) && P.q.has(r[0] | 0))
    .map((r) => [r[0] | 0, Math.max(0, Math.min(30000, r[1] | 0)), Math.max(0, Math.min(30000, r[2] | 0))]);
  if (st.length) guiKhac(P, tk, { t: "vat", st });
}

// ---------- hội thoại (sat-thu.js "Tham gia khiêu chiến" -> mo; "vaoAi" -> vao) ----------
// ải đang đánh của nhân vật (tổ đội: đám / kết quả của phòng; phòng mất — tắt máy chủ — hoặc đã bị đưa ra khỏi phòng: coi như thua)
function dangCua(h) {
  const D = h.vuotAi && h.vuotAi.dang; if (!D || !D.phong) return D || null;
  const P = PHONG.get(D.phong), trong = !!P && P.trong.has(D.tk);
  return { ...D, P: trong ? P : null, bd: P ? P.bd : D.bd, dot: trong ? P.dot : D.dot, giet: trong ? P.giet : D.giet, ket: trong ? P.ket : D.ket || { thua: 1 } };
}
function mo(h, tk) {
  if (!VA) return { talk: ["Thách thức thời gian chưa mở."] };
  const S = tt(h), B = bacCua(h), D = dangCua(h);
  if (!B) return say(`Thách thức thời gian cần đạt ${R("cấp " + VA.cap[0].lo)} trở lên mới được tham gia.`, [dong]);
  if (D && !D.ket) return say("Ngươi đang làm nhiệm vụ Thách thức thời gian, hãy quay lại ải.", [["Trở lại ải", "veAi"], dong]);
  if (S.luot >= CF.luot) return say(`Nhiệm vụ Thách thức thời gian mỗi ngày chỉ được tham gia ${CF.luot} lần. Số lần tham gia của ngươi đã đủ! Ngày mai trở lại nhé!`, [dong]);
  const T = doiCua(tk && tk.ten);
  if (T && T.truong !== tk.ten) return say(`Xin lỗi! Cần phải là ${R("đội trưởng")} mới có tư cách báo danh tham gia 'Nhiệm vụ Thách thức thời gian'`, [dong]);
  // anh 16/11: tổ đội tối thiểu toiThieu người (vao gọi lại mo — chặn luôn đường 1 người và đội vừa có người rời)
  const toi = toiThieu(), n = T ? T.tv.length : 1;
  if (n < toi) return say(`Xin lỗi! 'Nhiệm vụ Thách thức thời gian' cần tổ đội tối thiểu ${R(toi + " người")}${n > 1 ? ` (đội đang có ${Y(n + " người")})` : ""} — hãy lập tổ đội rồi để đội trưởng báo danh.`, [dong]);
  const p = phiLan(S.luot), xuTl = Math.round(Math.max(0, (+CF.xuDoi || 0) * (n - 1)) * 100);
  const doi = T ? ` Tổ đội ${Y(n + " người")} cùng vào 1 ải, đánh chung quái — mỗi thành viên nộp phí theo số lần đã tham gia hôm nay của mình, cùng bậc ${tenBac(B.cap)}. Quái và boss mạnh ${R("×" + String(hsDoi(n)).replace(".", ","))} (máu, sát thương)${xuTl > 0 && CF.xuSo > 0 ? `; xong ải cả đội có ${Y(xuTl + "%")} cơ hội nhận ${Y((CF.xuSo | 0) + " Xu")} mỗi người` : ""}.` : "";
  return say(`${B.ten}: khiêu chiến ${R("28 đám quái")} trong ${R(VA.han / 60 + " phút")}. Hôm nay ngươi đã tham gia ${Y(S.luot + "/" + CF.luot)} lần. Lần thứ ${S.luot + 1} cần nộp ${R(p.gian + " Sát Thủ Giản")} ${B.cap === 2 ? "cấp 90" : "cấp 20–80"} và ${R(van(p.tien))}.${doi} Ngươi muốn tham gia không?`,
    [["Phải! Ta muốn tham gia.", "vaoAi"], ["Không cần", null]]);
}
// dragon_join + COT_TeamMemberJoin: đủ điều kiện -> nộp phí, vào ải đám 1 (có tổ đội 2 người trở lên: vaoDoi)
function vao(h, tk) {
  const r = mo(h, tk); if (!r.say || !r.say.opts.some((o) => o[1] === "vaoAi")) return r;
  const T = doiCua(tk && tk.ten);
  if (T) return vaoDoi(h, tk, T);
  const S = tt(h), B = bacCua(h), p = phiLan(S.luot), ds = gianCo(h, B.cap);
  if ((h.gold || 0) < p.tien) return say(`Tham gia nhiệm vụ Thách thức thời gian lần thứ ${S.luot + 1} cần ${R(van(p.tien))}. Chuẩn bị đủ tiền rồi hãy quay lại!`, [dong]);
  if (soGian(ds) < p.gian) return say(`${TEN}: Xin lượng thứ, tham gia nhiệm vụ khiêu chiến thời gian ${tenBac(B.cap)} lần thứ ${S.luot + 1} cần có ${R(p.gian)} Sát Thủ Giản ${B.cap === 2 ? "cấp 90" : "cấp 20–80"} trong hành trang (đang có ${soGian(ds)}), xin hãy chuẩn bị rồi hãy đến đây gặp ta`, [dong]);
  tieuGian(h, ds, p.gian);
  h.gold -= p.tien; S.luot++;
  S.dang = { cap: B.cap, bd: Date.now() + CF.chuanBi * 1000, dot: 1, giet: [], luc: Date.now() };
  return { tin: [`Đã nộp ${p.gian} Sát Thủ Giản + ${van(p.tien)} (lần ${S.luot}/${CF.luot} hôm nay).`, `Còn ${CF.chuanBi} giây nữa quái sẽ xuất hiện, hãy chuẩn bị!`], di: { z: B.bai, at: VA.vao } };
}
// đội trưởng báo danh cả đội (COT_CheckTeamRequirement -> COT_TeamJoin): xét từng thành viên (đang trong game, cùng bậc, còn lượt, không đang
// trong ải, đủ tiền + giản của lần mình) — ai thiếu thì báo tên, không ai vào; đủ thì mỗi người nộp phí, cả đội vào 1 phòng. Thành viên khác:
// ghi thẳng vào tài khoản của họ (như giao dịch — không có await giữa đọc và ghi), nhịp sau của họ nhận túi mới + lệnh đi vào ải (layDi)
function vaoDoi(h, tk, T) {
  if (T.truong !== tk.ten) return say(`Xin lỗi! Cần phải là ${R("đội trưởng")} mới có tư cách báo danh tham gia 'Nhiệm vụ Thách thức thời gian'`, [dong]);
  const B = bacCua(h), ds = [];
  for (const a of T.tv) {
    const p = TG().dangChoi(a), tkA = a === tk.ten ? tk : DL.docTk(a);
    const hA = a === tk.ten ? h : p && tkA ? tkA.nv.find((x) => x && x.name === p.name) || null : null;
    const ten = (p && p.name) || (hA && hA.name) || a;
    if (!p || !hA) return say(`Xin lỗi! Trong đội bạn có thành viên ${Y(ten)} không ở trong game, xin kiểm tra lại rồi báo danh!`, [dong]);
    const S = tt(hA), BA = bacCua(hA), D = dangCua(hA);
    if (!BA) return say(`Xin lỗi! Trong đội bạn có thành viên ${Y(ten)} chưa đạt ${R("cấp " + VA.cap[0].lo)}, xin kiểm tra lại rồi báo danh!`, [dong]);
    if (BA.cap !== B.cap) return say(B.cap === 1 ? `Xin lỗi! Trong đội bạn có thành viên vượt ${R("cấp 90")} (${Y(ten)}), xin kiểm tra lại rồi báo danh!` : `Xin lỗi! Trong đội bạn có thành viên chưa đạt ${R("cấp 90")} (${Y(ten)}), xin kiểm tra lại rồi báo danh!`, [dong]);
    if (D && !D.ket) return say(`Xin lỗi! Thành viên ${Y(ten)} đang làm nhiệm vụ Thách thức thời gian.`, [dong]);
    if (S.luot >= CF.luot) return say(`Nhiệm vụ Thách thức thời gian mỗi ngày chỉ được tham gia ${CF.luot} lần. Số lần tham gia của ${Y(ten)} đã đủ! Ngày mai trở lại nhé!`, [dong]);
    const f = phiLan(S.luot), gs = gianCo(hA, B.cap);
    if ((hA.gold || 0) < f.tien) return say(`Xin lỗi! Thành viên ${Y(ten)} tham gia lần thứ ${S.luot + 1} cần ${R(van(f.tien))} — chưa đủ tiền.`, [dong]);
    if (soGian(gs) < f.gian) return say(`${TEN}: Xin lượng thứ, trong tổ đội của ngươi có người không có đủ Sát Thủ Giản ${B.cap === 2 ? "cấp 90" : "cấp 20–80"}: ${Y(ten)} lần thứ ${S.luot + 1} cần ${R(f.gian)} (đang có ${soGian(gs)}), xin kiểm tra lại rồi hãy báo danh tham gia!`, [dong]);
    ds.push({ a, tkA, hA, ten, f, gs, S });
  }
  const t = Date.now(), bd = t + CF.chuanBi * 1000;
  const P = { id: ++soPhong, cap: B.cap, bai: B.bai, bd, luc: t, dot: 1, giet: [], ket: null, sinh: bd, truong: { ten: h.name, sex: h.sex, he: h.series | 0 },
    hs: hsDoi(ds.length), // anh 16/11: hệ số sức quái theo số người lúc vào (máu — mauDatP; sát thương — trình duyệt nhân theo trangThaiP.hs)
    tv: ds.map((x) => ({ tk: x.a, ten: x.ten })), trong: new Set(ds.map((x) => x.a)), chu: null, an: new Set(), q: new Map(), vt: new Map(), dan: new Map(),
    ack: new Map(), han: new Map(), vang: new Map(), specV: 0, daSpec: new Map(), doi: true, gap: false, guiLuc: 0 };
  sinhDotP(P);
  PHONG.set(P.id, P);
  const tenDoi = ds.map((x) => x.ten).join(", ");
  for (const x of ds) {
    tieuGian(x.hA, x.gs, x.f.gian);
    x.hA.gold -= x.f.tien; x.S.luot++;
    x.S.dang = { cap: B.cap, bd, dot: 1, giet: [], luc: t, phong: P.id, tk: x.a };
    PHONG_TK.set(x.a, P.id);
    // soát lượt 89 (04/11): Bảo rương đồ xanh thưởng xong ải lượt trước còn chờ trong CHO (nhịp của người đó chưa tới) -> chuyển vào h.rxCho trước khi
    // xóa (được lưu cùng tài khoản ngay dưới / api.js với đội trưởng), nhịp sau tự vào túi — không mất
    const rxCu = (CHO.get(x.a) || []).reduce((s, r) => s + (r.rx | 0), 0);
    if (rxCu > 0) DO.choRuongXanh(x.hA, rxCu);
    // anh 16/11 — Báo Đáp Ân Sư: món sự kiện xong ải lượt trước còn chờ trong CHO (r.ev) -> hàng chờ quà h.quaCho (lưu cùng tài khoản như rương trên) — không mất
    const evCu = (CHO.get(x.a) || []).flatMap((r) => (Array.isArray(r.ev) ? r.ev : []));
    if (evCu.length) x.hA.quaCho = [...(Array.isArray(x.hA.quaCho) ? x.hA.quaCho : []), { mon: evCu.slice(0, 20).map((m) => ({ ...m })), luc: t, he: 1, loi: BD_LOI }];
    const xuCu = (CHO.get(x.a) || []).reduce((s, r) => s + (r.xu | 0), 0); // anh 16/11: Xu may mắn xong ải lượt trước còn chờ — cộng thẳng, không mất
    if (xuCu > 0) { x.hA.xu = (x.hA.xu | 0) + xuCu; try { require("./nhat-ky.js").ghi("hiem", x.a, x.hA.name, `Vượt Ải tổ đội: + ${xuCu} Xu (may mắn cả đội — lượt trước)`); } catch {} }
    CHO.delete(x.a);
    if (x.a === tk.ten) continue; // đội trưởng: api.js ghi tài khoản + trả lệnh đi
    DO.chuan(x.hA); DL.ghiTk(x.tkA);
    DI.set(x.a, { tin: [`Đội trưởng ${h.name} đã báo danh Thách thức thời gian ${tenBac(B.cap)} — cả đội vào ải.`, `Đã nộp ${x.f.gian} Sát Thủ Giản + ${van(x.f.tien)} (lần ${x.S.luot}/${CF.luot} hôm nay).`, `Còn ${CF.chuanBi} giây nữa quái sẽ xuất hiện, hãy chuẩn bị!`], di: { z: B.bai, at: VA.vao } });
  }
  const minh = ds[0];
  return { tin: [`Đã báo danh cho tổ đội ${ds.length} người: ${tenDoi}.`, `Đã nộp ${minh.f.gian} Sát Thủ Giản + ${van(minh.f.tien)} (lần ${minh.S.luot}/${CF.luot} hôm nay).`, `Còn ${CF.chuanBi} giây nữa quái sẽ xuất hiện, hãy chuẩn bị!`], di: { z: B.bai, at: VA.vao } };
}
// ra ải: xong / hết giờ (timer_close) / tử vong (player_death) -> về Ba Lăng chỗ Nhiếp Thí Trần. Còn giờ mà chưa xong thì không ra được
// (client: chỉ ra khi hết ải, hết giờ, tử vong). Tổ đội: ra khỏi phòng (không nhận thưởng nữa)
function ra(h, chet) {
  const S = tt(h), D = dangCua(h), ve = { z: VA.ve.z, at: VA.ve.at };
  if (!D) return { di: ve };
  const tin = [];
  if (chet) tin.push("Không may tại trận tử vong!");
  else if (!D.ket && conGiay(D) > 0) return { talk: ["Nhiệm vụ chưa kết thúc — hạ hết 28 đám quái hoặc chờ hết giờ."] };
  else if (!D.ket || D.ket.thua) tin.push("Thời gian làm nhiệm vụ đã kết thúc, khiêu chiến thất bại.");
  if (D.P) roiPhong(D.P, D.tk);
  delete S.dang;
  return { tin, di: chet ? { ...ve, hoiSinh: 1 } : ve };
}

// ---------- dùng ở do.js gietQuai (loại 4) ----------
// hạ quái mẫu id cấp L ở bãi ải Z: đúng nhóm còn thiếu của đám đang đánh (trong giờ + treGiay) -> đếm; hết đám -> thưởng đám, sang đám sau;
// hết 28 đám -> thưởng xong ải. Trả { kn, mon: [{ k, n }] (rơi ở chỗ con này), tin, loa } | null (không nhận). Tổ đội: quái chết ở máy chủ
// (danhP) — báo giết loại 4 không nhận
function nhanGiet(h, Z, id, L) {
  const S = h.vuotAi, D = S && S.dang;
  if (!VA || !D || D.ket || D.phong || !Z || Z.kind !== "ải" || Z.cap !== D.cap) return null;
  if (Date.now() < D.bd || Date.now() - D.bd > (VA.han + CF.treGiay) * 1000) return null;
  const B = capCua(D.cap), d = B && B.dot[D.dot - 1]; if (!d) return null;
  const gi = d.ds.findIndex((g, i) => (D.giet[i] | 0) < g.n && g.lv === L && (g.tpl ? g.tpl === id : g.tieuBoss.some(([a, b]) => id >= a && id <= b)));
  if (gi < 0) return null;
  D.giet[gi] = (D.giet[gi] | 0) + 1;
  const r = { kn: 0, mon: [], tin: [], loa: [] }, L0 = CF.leBao, T0 = CF.thuoc;
  if (d.ds[gi].boss && L0 && Math.random() < L0.roi) r.mon.push({ k: L0.k, n: 1 }); // hạ boss: hộp lễ vật vượt ải
  // mỗi con: Ngũ Hoa Ngọc Lộ Hoàn tiếp tế — anh 28/10 lần 7: n = [ít, nhiều] -> ngẫu nhiên 1–3 bình
  if (T0 && Math.random() < T0.tiLe) { const [a, b] = Array.isArray(T0.n) ? T0.n : [T0.n, T0.n]; r.mon.push({ k: T0.k, n: a + Math.floor(Math.random() * (b - a + 1)) }); }
  if (!d.ds.every((g, i) => (D.giet[i] | 0) >= g.n)) return r;
  r.kn += Math.round(d.kn * heSo(D)); // số món rơi của đám (d.roi — trang bị client) bỏ: anh 28/10 không rơi trang bị trắng / xanh
  r.bhDam = D.dot; // bang hội đợt 2: đám vừa xong -> do.js gietQuai cộng cống hiến (BH.cong "vuotAi")
  r.tin.push(`Đội ngũ đã tiêu diệt toàn bộ ${D.dot} đám quái!`);
  // anh 17/11: thưởng thêm mỗi ải như tổ đội (đi 1 mình = đội trưởng, 1 người — chỉ khi toiThieu cho phép)
  const T1 = Math.round(thuongAi(D.cap, D.dot, B.dot.length, 1) * CF.doiTruong);
  if (T1 > 0) { r.kn += T1; r.tin.push(cauThuong(D.dot, B.dot.length, T1, 1, true)); }
  if (D.dot < B.dot.length) { D.dot++; D.giet = []; return r; }
  // Mission_Complete: kinh nghiệm theo phút đã dùng
  const giay = Math.floor((Date.now() - D.bd) / 1000), phut = Math.floor(giay / 60), X = B.xong;
  const e = (phut >= X.m ? X.c : Math.floor(X.a * (1 - phut / X.m)) + X.b) * 1000;
  r.kn += Math.round(e * heSo(D));
  D.ket = { xong: 1, giay };
  const rx = DO.choRuongXanh(h, CF.ruongXanh | 0);
  if (rx) r.tin.push(`Thưởng hoàn thành ải: ${rx}`);
  const ev = bdMon("vuotAi"); if (ev.length) r.tin.push(bdGiao(h, ev)); // anh 16/11 — Báo Đáp Ân Sư: món sự kiện xong ải (đi 1 mình)
  r.loa.push(`${MT.ten(h.name)}: đội ngũ đã thắng lợi hoàn thành nhiệm vụ Thách thức thời gian ${tenBac(D.cap)}, đã dùng ${phut} phút ${giay % 60} giây!`);
  return r;
}
// nhịp (z = bãi đang đứng — trong lúc đổi bản đồ trình duyệt báo bãi đang tới): rời ải bằng đường khác (thoát game, đổi bãi) quá 45 giây
// sau lúc vào -> bỏ ải (phí đã nộp không trả — như client SetLogoutRV / kickout). 45 giây (bản đầu 20): tải bản đồ qua đường hầm chậm không bị
// coi là rời ải (anh 28/10 "tránh lỗi dẫn đến không đồng bộ game"). Trả true nếu đổi
function nhip(h, z) {
  const S = h.vuotAi, D = S && S.dang; if (!D || z == null || Date.now() - (D.luc || 0) < 45000) return false;
  const B = capCua(D.cap);
  if (B && z === B.bai) return false; // còn trong ải (cả lúc đã xong / hết giờ: trình duyệt tự hỏi "ra")
  const P = D.phong ? PHONG.get(D.phong) : null;
  if (P && P.hoi > Date.now()) return false; // phòng vừa dựng lại sau khởi động lại máy chủ (giu-phong.js): chờ người vào lại (Nhiếp Thí Trần "Trở lại ải")
  if (P) roiPhong(P, D.tk);
  delete S.dang; return true;
}
// gửi kèm nhân vật (hero.va): ngày, số lần, phí lần kế, ải đang đánh + giờ máy chủ (đếm giờ); tổ đội: phong = mã phòng (trình duyệt dùng
// trạng thái phòng — src/game/vadoi.js)
function tomTat(h) {
  if (!VA) return null;
  const S = h.vuotAi || {}, hn = S.ngay === N.ngayVN(Date.now()), luot = hn ? S.luot | 0 : 0, D = dangCua(h);
  return { luot, toiDa: CF.luot, phi: luot < CF.luot ? phiLan(luot) : null, lo: VA.cap[0].lo, mau: CF.mau, mauDat: CF.mauDat || null, nhin: CF.nhin, keo: CF.keo,
    dang: D ? { cap: D.cap, bd: D.bd, dot: D.dot, giet: D.giet, tong: (capCua(D.cap) || { dot: [] }).dot.length, han: VA.han, ket: D.ket || null, ...(D.phong ? { phong: D.phong } : {}) } : null, gio: Date.now() };
}

// ---------- nhịp của thành viên phòng (api.js) ----------
// thưởng đang chờ (kinh nghiệm đám / xong ải, đồ rơi của con chết) -> cộng vào nhân vật, đồ nằm đất của riêng người đó (DO.roiMon) ->
// { kn, len, nhan: [{ …món, x, y, z }], tin, luyen? } | null
function nhanPhong(h, tk, key) {
  const L = CHO.get(tk); if (!h || !L || !L.length) return null;
  CHO.delete(tk);
  const kq = { kn: 0, len: 0, nhan: [], tin: [] };
  h.lvl = h.lvl || 1; h.exp = h.exp || 0;
  for (const r of L) {
    if (r.kn > 0) { h.exp += r.kn; kq.kn += r.kn; kq.len += N.lenCap(h); }
    for (const it of r.mon || []) kq.nhan.push({ ...DO.roiMon(h, key, { z: r.z, x: Math.round(r.x), y: Math.round(r.y) }, { ...it }), x: Math.round(r.x), y: Math.round(r.y), z: r.z });
    if (r.tin) kq.tin.push(...r.tin);
    if (r.tinVa) (kq.tinVa = kq.tinVa || []).push(...r.tinVa); // anh 17/11: dòng thưởng mỗi ải — trình duyệt hiện ở kênh Khác
    if (r.rx > 0) kq.tin.push(`Thưởng hoàn thành ải: ${DO.choRuongXanh(h, r.rx)}`);
    if (Array.isArray(r.ev) && r.ev.length) kq.tin.push(bdGiao(h, r.ev)); // anh 16/11 — Báo Đáp Ân Sư: món sự kiện xong ải (tổ đội)
    if (r.xu > 0) { h.xu = (h.xu | 0) + r.xu; kq.tin.push(`Cả đội may mắn: bạn nhận được ${r.xu} Xu`); try { require("./nhat-ky.js").ghi("hiem", tk, h.name, `Vượt Ải tổ đội: + ${r.xu} Xu (may mắn cả đội)`); } catch {} } // anh 16/11 — chữ thường: khung tin Vượt Ải không đọc thẻ màu (soát)
    if (r.ket) { const D = h.vuotAi && h.vuotAi.dang; if (D && D.phong === r.phong) D.ket = r.ket; }
  }
  const lk = DO.luyenKn(h, kq.kn); if (lk.length) kq.luyen = lk;
  return kq;
}
// thành viên vừa được đội trưởng kéo vào ải: { tin, di } (1 lần)
function layDi(tk) { const x = DI.get(tk); if (x) DI.delete(tk); return x || null; }
// trạng thái phòng kèm nhịp khi kênh tức thời chưa mở (đủ danh sách quái); kênh mở thì phòng gửi qua kênh (undefined: không gửi). Nhân vật còn
// ghi đang ở phòng mà phòng mất (tắt máy chủ) / đã bị đưa ra: null -> trình duyệt hỏi "ra"
function phongNhip(tk, h) {
  const P = PHONG.get(PHONG_TK.get(tk)), D = h && h.vuotAi && h.vuotAi.dang;
  if (!P || !P.trong.has(tk)) return D && D.phong ? null : undefined;
  return WS.cua(tk) ? undefined : trangThaiP(P, tk, true, []);
}
// ở bãi ải chỉ thấy / nghe người cùng phòng (the-gioi.js nhip, ws.js guiBai): bãi khác như cũ
let LD_ = null; const LD = () => LD_ || (LD_ = require("./loi-dai.js")); // Lôi Đài (anh 15/11) — nạp lúc dùng, đệm (cungCho chạy nhiều mỗi giây)
function cungCho(a, b, zone) {
  const Z = N.ZONES.get(zone | 0);
  if (Z && Z.kind === "lôi đài") return LD().cungCho(a, b, zone); // Lôi Đài: a (người được thấy / người gửi) hiện khi là tuyển thủ CÒN SỐNG của đúng sân — người xem / người bị hạ tàng hình với mọi người
  if (Z && Z.bang) return KB().cungBan(a, b, zone); // khu vực bang (đợt 4): mỗi bang 1 bản — chỉ người cùng bang (mã bang the-gioi.js ben.bid)
  if (Z && Z.kind === "viêm đế") return require("./viem-de.js").cungCho(a, b); // Viêm Đế Bảo Tàng (anh 04/11): mỗi tổ đội 1 bản riêng — ws.js chỉ có 1 bộ lọc nên đặt ở đây
  if (!Z || Z.kind !== "ải") return true;
  const pa = PHONG_TK.get(a); return pa != null && pa === PHONG_TK.get(b);
}

// b.viec: "mo" | "vao" | "ra" | "chet" | "xem" | "veAi"; tk = tài khoản (api.js — tổ đội)
function lam(h, b, tk) {
  switch (b.viec) {
    case "mo": return mo(h, tk);
    case "vao": return vao(h, tk);
    case "ra": return ra(h, false);
    case "chet": return ra(h, true);
    case "veAi": { const D = dangCua(h), B = D && !D.ket && capCua(D.cap); return B ? { di: { z: B.bai, at: VA.vao } } : mo(h, tk); }
    case "xem": return {};
    default: loi("Việc không rõ");
  }
}

// ---------- kênh tức thời (may-chu/ws.js) ----------
// vaVao: trình duyệt vừa vào bãi ải / nối lại kênh -> gửi lại đủ trạng thái; vad: sát thương; vah: chủ bãi báo vị trí + mục tiêu từng con
// [[uid, x, y, thứ tự người trong tv | -1]] -> chuyển cho người khác; vaAn: tab ẩn / hiện (chọn chủ bãi)
function guiDu(kn) {
  const P = PHONG.get(PHONG_TK.get(kn.ten)); if (!P || !P.trong.has(kn.ten)) return void kn.gui({ t: "va", p: null });
  P.daSpec.set(kn.ten, P.specV); kn.gui({ t: "va", p: trangThaiP(P, kn.ten, true, []) });
}
WS.nhan("vaVao", guiDu);
WS.nhan("vao", (kn) => { const P = PHONG.get(PHONG_TK.get(kn.ten)); if (P && P.trong.has(kn.ten) && kn.zone === P.bai) guiDu(kn); });
WS.nhan("vad", (kn, tin) => danhP(kn.ten, tin));
WS.nhan("vah", (kn, tin) => {
  const P = PHONG.get(PHONG_TK.get(kn.ten)); if (!P || P.chu !== kn.ten || !Array.isArray(tin.q)) return;
  const q = [];
  for (const r of tin.q.slice(0, 120)) {
    if (!Array.isArray(r) || !P.q.has(r[0] | 0)) continue;
    const v = [Math.round(+r[1] || 0), Math.round(+r[2] || 0), Math.max(-1, Math.min(P.tv.length - 1, r[3] | 0))];
    P.vt.set(r[0] | 0, v); q.push([r[0] | 0, ...v]);
  }
  if (q.length) guiKhac(P, kn.ten, { t: "vah", q });
});
WS.nhan("vaAn", (kn, tin) => { const P = PHONG.get(PHONG_TK.get(kn.ten)); if (!P) return; if (tin.an) P.an.add(kn.ten); else P.an.delete(kn.ten); });
WS.locBai(cungCho);
// tin gom vị trí "vtb" (ws.js — độ mượt bước 1): bãi có phòng riêng (ải, Viêm Đế, khu vực bang) thì lọc theo từng người nhận như cungCho
if (WS.locCanBai) WS.locCanBai((zone) => { const Z = N.ZONES.get(zone | 0); return !!Z && (Z.kind === "ải" || Z.kind === "viêm đế" || !!Z.bang); });

// phòng: hết giờ (thất bại), người rời bãi ải quá vangGiay ra khỏi phòng, chọn chủ bãi, gửi trạng thái (tối đa ~6 lần / giây; có con chết thì gửi
// ngay), phòng bỏ quá lâu thì xóa
setInterval(() => {
  if (!PHONG.size) return;
  const t = Date.now();
  for (const P of [...PHONG.values()]) {
    if (!P.ket && t > P.bd + VA.han * 1000) { P.ket = { thua: 1, giay: VA.han }; P.doi = true; }
    for (const tk of [...P.trong]) {
      const p = TG().dangChoi(tk);
      if (p && p.zone === P.bai) { P.vang.delete(tk); continue; }
      if (!P.vang.has(tk)) P.vang.set(tk, t);
      if (t - P.vang.get(tk) > CF.vangGiay * 1000 && t - P.luc > CF.vangGiay * 1000 && !(P.hoi > t)) roiPhong(P, tk); // hoi: vừa dựng lại sau khởi động lại — ân hạn (giu-phong.js)
    }
    if (!PHONG.has(P.id)) continue;
    chonChu(P);
    if (P.doi && (P.gap || t - P.guiLuc >= 160)) phatP(P);
    if (t > P.bd + (VA.han + 600) * 1000) xoaPhong(P);
  }
}, 100).unref();

// ---------- giữ phòng qua khởi động lại máy chủ (anh 18/11 — may-chu/giu-phong.js): lưu lúc tắt, dựng lại ở đúng đám đang đánh, giờ máy chủ tắt không tính ----------
for (const P of require("./giu-phong.js").giu("va", PHONG,
  (P) => ({ id: P.id, cap: P.cap, bai: P.bai, bd: P.bd, luc: P.luc, dot: P.dot, sinh: P.sinh, truong: P.truong, tv: P.tv, trong: [...P.trong], hs: P.hs || 1, specV: P.specV | 0 }),
  (o, G) => {
    const B = capCua(o.cap);
    if (!B || !(o.dot >= 1 && o.dot <= B.dot.length) || !Array.isArray(o.tv) || !Array.isArray(o.trong) || !o.trong.length || !o.truong) return null;
    const P = { ...o, bd: o.bd + G.lech + G.cho, luc: G.t, sinh: Math.max(o.sinh + G.lech, G.t) + G.cho, ket: null, giet: [], trong: new Set(o.trong), chu: null, an: new Set(), q: new Map(),
      vt: new Map(), dan: new Map(), ack: new Map(), han: new Map(), vang: new Map(), daSpec: new Map(), doi: true, gap: false, guiLuc: 0, hoi: G.hoi };
    sinhDotP(P);
    return P;
  })) {
  PHONG.set(P.id, P); soPhong = Math.max(soPhong, P.id | 0);
  for (const tk of P.trong) { PHONG_TK.set(tk, P.id); choThuong(tk, { tin: [`Máy chủ vừa khởi động lại — đội ngũ tiếp tục Thách thức thời gian từ đám ${P.dot}, thời gian máy chủ tắt không tính.`] }); }
}

// ---------- công cụ thử (anh 28/10 "nhớ thêm vào dev tool" — tài khoản quản trị, thẻ "Vượt Ải") ----------
// b.viec: "xem" | "vao" (b.cap 1 | 2, b.dot: vào ngay từ đám đó — không phí, không tính lần; vẫn chờ chuanBi giây) | "boCho" (bỏ chờ chuẩn
// bị: ra quái ngay) | "dot" (b.dot: nhảy tới đám đó) | "xong" (hạ hết đám đang đánh) | "datLai" (số lần hôm nay về 0) | "gian" (+8 giản cấp 80
// và 8 giản cấp 90 vào túi + đủ tiền 4 lần) | "hop" (+5 Hộp lễ vật vượt ải) | "ra" (bỏ ải, về Ba Lăng). Đang trong phòng tổ đội: bỏ chờ / nhảy
// đám / hạ hết đám / ra làm trên phòng (cả đội)
function dev(h, b) {
  if (!VA) loi("Chưa dựng assets/data/vuot-ai.json (cong-cu/dung-vuot-ai.mjs)");
  const S = tt(h); let r = {};
  const B = capCua(b.cap === 2 ? 2 : 1), dot = Math.max(1, Math.min(B.dot.length, b.dot | 0 || 1));
  const DP = dangCua(h), P = DP && DP.P;
  switch (b.viec) {
    case "xem": break;
    case "vao":
      if (P) roiPhong(P, DP.tk);
      S.dang = { cap: B.cap, bd: Date.now() + CF.chuanBi * 1000, dot, giet: [], luc: Date.now(), thu: 1 };
      r = { tin: [`Vượt Ải (thử): vào ${B.ten} từ đám ${dot}`], di: { z: B.bai, at: VA.vao } }; break;
    case "dot":
      if (P) { P.dot = Math.max(1, Math.min(capCua(P.cap).dot.length, b.dot | 0 || 1)); P.sinh = Date.now(); P.ket = null; sinhDotP(P); P.doi = true; r = { tin: [`Vượt Ải (thử, tổ đội): nhảy tới đám ${P.dot}`] }; break; }
      if (!S.dang) { r = { tin: ["Vượt Ải (thử): đang không ở trong ải"] }; break; }
      S.dang.dot = Math.max(1, Math.min(capCua(S.dang.cap).dot.length, b.dot | 0 || 1)); S.dang.giet = []; delete S.dang.ket;
      r = { tin: [`Vượt Ải (thử): nhảy tới đám ${S.dang.dot}`] }; break;
    case "xong": {
      if (P) {
        if (P.ket || Date.now() < P.sinh) { r = { tin: ["Vượt Ải (thử, tổ đội): đám chưa ra / ải đã kết thúc"] }; break; }
        const d0 = P.dot; for (const m of [...P.q.values()]) if (m.mau > 0 && P.dot === d0) quaiChetP(P, m);
        P.doi = true; r = { tin: [`Vượt Ải (thử, tổ đội): hạ hết đám ${d0} — thưởng vào nhịp sau`] }; break;
      }
      const D = S.dang; if (!D || D.ket) { r = { tin: ["Vượt Ải (thử): đang không đánh đám nào"] }; break; }
      const d = capCua(D.cap).dot[D.dot - 1], kq = { kn: 0, tin: [] };
      for (const [i, g] of d.ds.entries()) while ((D.giet[i] | 0) < g.n) { const x = nhanGiet(h, N.ZONES.get(capCua(D.cap).bai), g.tpl || g.tieuBoss[0][0], g.lv); if (!x) break; kq.kn += x.kn; kq.tin.push(...x.tin, ...x.loa.map((t) => t.replace(/<color(?:=[^>]*)?>/g, ""))); } // loa có thẻ màu (tin hệ thống) — khung tin thường bỏ thẻ
      if (kq.kn) { h.exp = (h.exp || 0) + kq.kn; N.lenCap(h); }
      r = { tin: [`Vượt Ải (thử): hạ hết đám — +${kq.kn} kinh nghiệm`, ...kq.tin] }; break;
    }
    case "datLai": S.luot = 0; r = { tin: ["Vượt Ải (thử): số lần hôm nay về 0"] }; break;
    case "boCho":
      if (P) { const t = Date.now(); if (P.bd > t) P.bd = t; if (P.sinh > t) P.sinh = t; P.doi = true; }
      else if (S.dang && S.dang.bd > Date.now()) S.dang.bd = Date.now();
      r = { tin: ["Vượt Ải (thử): bỏ chờ — ra quái ngay"] }; break;
    case "hop": { let n = 0; for (let i = 0; i < 5; i++) if (N.vaoTui(h, { k: CF.leBao.k, u: require("./item-id").next() })) n++; r = { tin: [`Vượt Ải (thử): +${n} Hộp lễ vật vượt ải`] }; break; }
    case "gian": {
      let n = 0;
      for (const cap of [80, 90]) try { N.themChong(h, N.BY.get(`ms:400:${cap}`), 8); n += 8; } catch { /* túi đầy */ }
      const can = CF.tien.reduce((a, x) => a + x, 0); if ((h.gold || 0) < can) h.gold = can;
      r = { tin: [`Vượt Ải (thử): +${n} Sát Thủ Giản (cấp 80 + 90), ngân lượng ≥ ${van(can)}`] }; break;
    }
    case "ra": if (P) roiPhong(P, DP.tk); delete S.dang; r = { tin: ["Vượt Ải (thử): rời ải"], di: { z: VA.ve.z, at: VA.ve.at } }; break;
    default: loi("Việc không rõ");
  }
  return { ...r, dev: { va: tomTat(h) } };
}

module.exports = { lam, dev, nhanGiet, nhip, tomTat, nhanPhong, layDi, phongNhip, danhP, cungCho, CF, VA,
  _thu: { PHONG, PHONG_TK, CHO, xongDotP, thuongAi, hsNguoi, TA } }; // _thu: bài thử máy chủ (thưởng mỗi ải — anh 17/11)
