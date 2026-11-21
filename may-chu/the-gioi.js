// Thấy nhau trên bản đồ + chat chung (anh muốn 25/10). Chỉ giữ trong bộ nhớ: tắt máy chủ là mất, không cần lưu.
//   nhip(tk, body)  trình duyệt gửi 2 lần / giây: { o: ô nhân vật, s: { zone, c?, lvl, look, tr, hp, mp, vs?, bl? } | null (rời game), tin: mã tin cuối đã
//                   nhận | null } -> { ai: [người khác cùng bản đồ: { name, sex, series, fac, cp, lvl, look, tr, hp, mp, vs?, bl?, co?, gd? }], cp (phe đang theo của mình —
//                   pheNay), tin: [tin chat mới], tinId }
//                   c = 1: đang ở bản quái chung của bãi (anh 03/11 — may-chu/quai-chung.js): chỉ thấy người cùng bản (bản riêng thấy bản riêng)
//                   co = đội trưởng đội đang mở, gd = 1 đang mở giao dịch / 2 đang giao dịch (cờ trên đầu — may-chu/giao-dich.js, anh 30/10)
//   tr = các mốc [ts, x, y, hướng, động tác, atkN, đòn 1|2|3 (3 = thi pháp của võ công), thế đánh 0|1, (x, y con đang nhắm, mã con đó ở bãi quái
//   chung / Vượt Ải — có thì gửi; Trợ Thủ "đánh cùng mục tiêu với đội trưởng")] trình duyệt ghi 10 lần / giây (anh 02/11 — bản trước 4; ts = đồng
//   hồ máy người gửi, ms).
//   Máy chủ giữ MOC_GIU mốc gần nhất mỗi người và gửi hết cho người xem: nhịp gửi / nhịp hỏi lệch nhau cũng không mất mốc nào.
//   Phân Thân (anh 05/11 — may-chu/phan-than.js, src/game/nhanvatmay.js): s.pt = [{ i: mã phân thân, tr, vs?, bl? }] — mốc của phân thân đang theo (tối
//   đa 2); máy chủ chỉ nhận mã đang ở h.pt.ra, tên / giới / cấp / đồ mặc lấy từ bản chụp lúc thuê (không tin trình duyệt) -> người cùng bãi nhận thêm
//   mục { name: "<người thuê> (<người bị sao chép> Phân Thân)", sex, series, fac, cp (phe người thuê), lvl, look, tr, vs?, bl?, pt: 1, chu: tên người
//   thuê, so: thứ tự phân thân } (trình duyệt giữ riêng — World.ptKhac: không vào danh sách người chơi, không mời đội / giao dịch, không cho vòng sáng)
//   chat(tk, body)  { o, ch, t, u? } -> { id, it?, text? }   kênh đội ngũ CH_TEAM (anh 28/10 lần 5): chỉ người cùng đội (may-chu/to-doi.js) thấy;
//                   u = mã món khoe (anh 12/11 — monKhoe): tin mang it (bản sao món), người nhận thấy it kèm tin
//                   kênh Bang hội CH_TONG (anh 14/11 — may-chu/bang-hoi.js): chỉ thành viên cùng bang gửi / nhận; thongBaoBang(chữ, id bang) = tin hệ thống của bang (vào / rời,
//                   bổ nhiệm, khảo nghiệm…) vào kênh này (ch CH_TONG, name rỗng — màu mẫu C mau-tin.js)
//   Bang hội (anh 14/11): mỗi người trong ai có bh = "Tên bang(Chức)" — dựng 1 lần ở nhịp của người gửi (bang-hoi.js nhan, tra O(1)); người đang trong Tống Kim không có
//   (bot không có bang — không để lộ ai là bot), phân thân không có. Phe đang theo (cp) xét phe bang (bhp — không gửi ra ngoài): Tống Kim -> đội trưởng -> bang -> phái
// Tên / giới / hệ / phái lấy từ nhân vật lưu trên máy chủ (không tin trình duyệt). Vị trí, động tác, đồ mặc, cấp: trình duyệt báo,
// máy chủ chỉ lọc kiểu + khoảng (chỉ để vẽ, chưa ảnh hưởng gì khác). Quái vẫn của riêng từng máy (quái chung: giai đoạn 2).
"use strict";

const BEN_MS = 6000;          // quá 6 giây không gửi nhịp = đã rời (đóng trang, mất mạng)
const TIN_GIU = 200, TIN_DAU = 20, TIN_MAX = 100, TIN_CACH = 800; // giữ 200 tin; vào game thấy 20 tin gần nhất; 100 ký tự; cách 0,8 giây
const KENH = { CH_WORLD: "all", CH_NEARBY: "zone", CH_CITY: "zone", CH_TEAM: "doi", PRIVATE: "mat", CH_TONG: "bang" }; // PRIVATE: tin mật — chỉ đúng 1 người (chi — anh 13/11); CH_TONG: kênh Bang hội — chỉ thành viên cùng bang (anh 14/11) // kênh có máy chủ: thế giới (mọi người), phụ cận / thành thị (cùng bản đồ), đội ngũ (cùng đội)
const TD = () => require("./to-doi"); // nạp lúc dùng: to-doi.js cũng nạp file này
const BH = () => require("./bang-hoi"); // bang hội (anh 14/11): nhãn bang trên đầu, phe bang, kênh bang — bang-hoi.js cũng nạp file này
const DO = () => require("./do"); // tên món khoe đồ (do.js cũng nạp file này)
const GD = () => require("./giao-dich"); // như trên: giao-dich.js nạp file này
const VAI = () => require("./vuot-ai"); // Vượt Ải: ở bãi ải chỉ thấy người cùng phòng (tổ đội — anh 31/10), mỗi đội 1 ải riêng như client
const ACTS = new Set(["stand", "run", "attack", "hurt", "die", "sit", "jump"]); // jump: khinh công (anh 10/11) — mốc jump mang số vòng nhảy ở ô atkN
const MOC_GUI = 12, MOC_GIU = 12; // nhận tối đa 12 mốc / lần gửi; giữ 12 mốc gần nhất (1,2 giây — mốc 10 lần / giây)
const VT_CACH = 40;              // kênh tức thời: tối đa 1 tin vị trí / 40 ms / người (trình duyệt gửi tới 20 lần / giây khi đang chạy — độ mượt bước 1, 13/11 tối)
const LOOKS = ["helm", "armor", "weapon", "horse", "mantle"];
const VS_MAX = 6; // vòng sáng: vòng chính + tối đa 5 vòng ghép (Nga My 120 Bế Nguyệt Phất Trần)
const BL_MAX = 8; // bùa lợi đang có (của mình + đồng đội dùng lên — Côn Lôn 3 bùa…)
// lệnh bí mật chỉ máy chủ bản gốc có (anh 11/11 — chống bản nhái, README lượt 73): KHÔNG nằm trong mã trình duyệt, KHÔNG ghi tin cập nhật. Gõ đúng
// chuỗi này vào ô chat -> chỉ người gõ thấy dòng xác nhận bản gốc, không phát cho ai. Server nhái gõ mà cũng hiện = họ đang có mã máy chủ của anh
const GOC_LENH = "#goc-hbee67", GOC_BAT = Date.now();
const gocCau = () => { const d = new Date(GOC_BAT + 7 * 3600e3).toISOString(); return `Võ Lâm Idle · S2 Đồ Xanh — bản gốc của Heo Búy · s343clgt.duckdns.org · DX·S2·5630e77e · máy chủ bật ${d.slice(11, 16)} ${d.slice(8, 10)}/${d.slice(5, 7)}`; };
const PT_MAX = 8; // phân thân đang theo gửi cho người cùng bãi: người chơi tối đa phanThan.toiDa (2 — phan-than.js chặn lúc gọi), quản trị không giới hạn (anh 18/11) — gửi tối đa 8

const ben = new Map(); // tên tài khoản -> người đang trong game
// chỗ đứng gần nhất theo NHÂN VẬT (từ nhịp — biết đúng ô nhân vật b.o): tài khoản + "\u0001" + tên -> { zone, x, y, at }. may-chu/npc-gan.js (đứng gần NPC) dùng
// khi bản ben không phải nhân vật đó (2 thẻ cùng tài khoản: ben lật qua lại giữa 2 nhân vật) hoặc lỡ nhịp quá 6 giây (soát 13/11). Dọn mục quá VT_NV_GIU
const VT_NV = new Map(), VT_NV_GIU = 60 * 1000;
const tin = [];        // { id, ch, name, text, zone, tk }
let tinId = 0;
const guiCuoi = new Map(); // tên tài khoản -> lúc gửi tin cuối

const so = (v, a, b, d = a) => (Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d);
const nguyen = (v, a, b, d = a) => Math.round(so(v, a, b, d));

const moc = (a) => [nguyen(a[0], 0, 1e13), so(a[1], -1e5, 1e5, 0), so(a[2], -1e5, 1e5, 0), nguyen(a[3], 0, 7),
  ACTS.has(a[4]) ? a[4] : "stand", nguyen(a[5], 0, 1e9), a[6] === 2 || a[6] === 3 ? a[6] : 1, a[7] ? 1 : 0,
  ...(a[7] && Number.isFinite(+a[8]) && Number.isFinite(+a[9]) ? [nguyen(a[8], -1e5, 1e5, 0), nguyen(a[9], -1e5, 1e5, 0), ...(a[10] > 0 ? [nguyen(a[10], 1, 1e9)] : [])] : [])];
const vsSach = (L) => (Array.isArray(L) ? L : []).slice(0, VS_MAX).filter((v) => Array.isArray(v) && v[0] > 0 && v[1] > 0).map((v) => [nguyen(v[0], 1, 99999), nguyen(v[1], 1, 40)]);
// bùa hại đang dính (Tống Kim — anh 12/11 "bùa của ngũ độc k có tác dụng"): [[mã chiêu, cấp, ms còn lại]] — máy người khác gắn lên bản chọn mục tiêu (tongkim.js dongBo)
const bcSach = (L) => (Array.isArray(L) ? L : []).slice(0, 6).filter((v) => Array.isArray(v) && v[0] >= 1 && v[0] <= 99999).map((v) => [nguyen(v[0], 1, 99999), nguyen(v[1], 1, 99, 1), nguyen(v[2], 1, 600000, 1)]);
// kháng / né đang có thật (Tống Kim — anh 13/11 lượt 86 "các chiêu vòng sáng hỗ trợ như nga mi thiếu lâm, có tác dụng cho đồng đội trong tống kim"): [kháng gốc × 5 (vật lý, băng,
// hỏa, lôi, độc — đã gồm vòng sáng / bùa lợi / chức, chưa trừ bùa hại), trần kháng × 5, né tránh] — máy người đánh tính sát thương theo số này thay bản chụp lúc vào trận
// (tongkim.js dongBo). Không thêm chỗ hở mới: máu người bị đánh vốn do chính máy họ tự trừ
const kdSach = (L) => (Array.isArray(L) && L.length === 11 && L.every((v) => Number.isFinite(+v)) ? L.map((v, i) => (i < 5 ? nguyen(v, -999, 999, 0) : i < 10 ? nguyen(v, 0, 95, 75) : nguyen(v, 0, 1e7, 0))) : null);
const blSach = (L) => (Array.isArray(L) ? L : []).slice(0, BL_MAX).filter((v) => v > 0).map((v) => nguyen(v, 1, 99999));
// nối mốc mới vào mốc đang giữ (cùng bản đồ; trang tải lại thì đồng hồ chạy lại từ 0 -> bỏ mốc cũ)
function noiMoc(tr, moi) { for (const m of moi) { const z = tr[tr.length - 1]; if (z && m[0] < z[0] - 10000) tr.length = 0; if (!tr.length || m[0] > tr[tr.length - 1][0]) tr.push(m); } return tr.slice(-MOC_GIU); }
// phân thân người thuê h đang theo (s.pt đã lọc): chỉ mã ở h.pt.ra (phan-than.js — nhịp đã sang ngày trước khi tới đây), tên / ngoại hình từ bản
// chụp lúc thuê; cu = các phân thân đang giữ (cùng bãi) để nối mốc
function ptCua(h, ds, cu) {
  const P = h.pt, ra = P && Array.isArray(P.ra) ? P.ra : [];
  return ds.filter((c) => ra.includes(c.i)).map((c) => {
    const d = (P.ds || []).find((x) => x.id === c.i), S = d && d.snap; if (!S) return null;
    const o = cu.find((x) => x.i === c.i), tr = noiMoc(o ? o.tr : [], c.tr); if (!tr.length) return null;
    const look = {}; for (const k of LOOKS) { const v = k === "horse" ? 0 : nguyen(S.looks && S.looks[k], 0, 9999); if (v) look[k] = v; } // không cưỡi ngựa (nhanvatmay.js)
    return { i: c.i, so: ra.indexOf(c.i), name: `${h.name} (${S.name} Phân Thân)`, sex: S.sex === "f" ? "f" : "m", series: S.series | 0, fac: S.fac ?? null, lvl: nguyen(S.lvl, 1, 200, 1), look, tr,
      ...(c.vs.length ? { vs: c.vs } : {}), ...(c.bl.length ? { bl: c.bl } : {}) };
  }).filter(Boolean);
}
function sach(s) {
  if (!s || typeof s !== "object" || !Array.isArray(s.tr)) return null;
  const look = {};
  for (const k of LOOKS) { const v = nguyen(s.look && s.look[k], 0, 9999); if (v) look[k] = v; }
  const tr = s.tr.slice(-MOC_GUI).filter(Array.isArray).map(moc).sort((a, b) => a[0] - b[0]);
  // hp / mp = % sinh lực / nội lực (bảng đội ngũ); vs = vòng sáng hỗ trợ đang bật [[mã chiêu, cấp chạy]] (vòng chính + vòng ghép — đồng đội
  // đứng trong tầm được hưởng, anh 29/10: src/game/world.js vongDoi)
  const vs = vsSach(s.vs);
  // bl = mã các bùa lợi đang có (anh 03/11 "buff côn lôn cho đồng đội chưa hiển thị đều như nga mi") — người khác vẽ hình trạng thái của bùa
  const bl = blSach(s.bl), bc = bcSach(s.bc), kd = kdSach(s.kd);
  const v0 = s.view, view = v0 && [v0.x, v0.y, v0.w, v0.h].every((n) => Number.isFinite(+n)) && +v0.w >= 100 && +v0.h >= 100
    ? { x: Math.max(-1e6, Math.min(1e6, +v0.x)), y: Math.max(-1e6, Math.min(1e6, +v0.y)), w: Math.min(10000, +v0.w), h: Math.min(10000, +v0.h) } : null;
  // phân thân đang theo (anh 05/11): mã + mốc + vòng sáng / bùa — nhip kiểm mã với h.pt.ra
  const pt = (Array.isArray(s.pt) ? s.pt : []).slice(0, PT_MAX).filter((c) => c && typeof c.i === "string" && Array.isArray(c.tr))
    .map((c) => ({ i: c.i.slice(0, 80), tr: c.tr.slice(-MOC_GUI).filter(Array.isArray).map(moc).sort((a, b) => a[0] - b[0]), vs: vsSach(c.vs), bl: blSach(c.bl) }));
  return tr.length ? { zone: nguyen(s.zone, 0, 1e6, -1), ...(s.c ? { chung: 1 } : {}), lvl: nguyen(s.lvl, 1, 200, 1), look, tr, ...(view ? { view } : {}), hp: nguyen(s.hp, 0, 100, 100), mp: nguyen(s.mp, 0, 100, 100), ...(vs.length ? { vs } : {}), ...(bc.length ? { bc } : {}), ...(kd ? { kd } : {}), ...(bl.length ? { bl } : {}), ...(pt.length ? { pt } : {}) } : null;
}

// phe đang theo (anh 31/10 "tên nhân vật đúng màu chính tà trung lập theo client … vào pt thì đổi sang màu của chủ pt"): trong đội -> phe theo
// phái của đội trưởng (engine: vào đội lấy m_CurrentCamp của đội trưởng); không đội / đội trưởng không trong game -> phe theo phái mình (chưa vào phái: 0)
// Tống Kim bãi thử (anh 05/11 — may-chu/tong-kim.js): người đã vào phòng Tống Kim, đang ở bãi phòng -> phe trận 10 Tống / 11 Kim (trình duyệt đổi màu
// tên, vòng sáng chỉ chung phe trận), không theo đội
const DOJS = () => require("./do.js");
const TKM = () => require("./tong-kim");
let LD_ = null; const LD = () => LD_ || (LD_ = require("./loi-dai.js")); // Lôi Đài (anh 15/11): phe sân 12 Giáp / 13 Ất, người xem tàng hình — nạp lúc dùng, đệm (đường nóng)
// anh 14/11 (bang hội — THIET-KE-BANG-HOI.md 1.7): Tống Kim -> phe đang theo của đội trưởng (= phe bang nếu đội trưởng có bang, như engine) -> phe bang -> phe phái; bhp = phe
// bang dựng ở nhịp của người đó (ben) — chỉ đọc trường có sẵn, không tra thêm (pheNay chạy người xem × người khác). Đổi phái bằng Tín vật không đổi phe khi đang ở bang.
// tkp: phe trận Tống Kim đã tra (nhịp truyền vào khỏi tra 2 lần)
function pheNay(k, x, tkp = TKM().pheCua(k, x && x.zone)) {
  if (tkp != null) return 10 + tkp;
  const lc = LD().cpCua(k, x && x.zone); if (lc != null) return lc; // Lôi Đài (anh 15/11): tuyển thủ còn sống 12 Giáp / 13 Ất, người xem / người bị hạ 0 (giữ giá trị Tống Kim khi có)
  const d = TD().thanhVien(k), L = d && d.truong !== k ? ben.get(d.truong) : null, ai = L || x;
  return (ai && ai.bhp) || DOJS().NOI.campPhai(ai && ai.fac);
}

// vầng trăng trên đầu (anh 16/11 — Báo Đáp Ân Sư): h.ccKn còn hạn -> bit 1 Nhất Kỷ Càn Khôn Phù (Hồng Nguyệt), bit 2 Càn khôn song tuyệt Bội (Lam Nguyệt);
// người khác vẽ theo cờ cc (src/game/vocong.js TRANG_CC, cùng luật rules.js ccTrang). Chỉ đọc mảng nhỏ của nhân vật — đường nóng của nhịp
function ccDau(h, t) {
  const L = h && h.ccKn; if (!Array.isArray(L) || !L.length) return 0;
  let m = 0; for (const x of L) if (x && +x.het > t && (x.v | 0) > 0) m |= (x.v | 0) >= 2 ? 2 : 1;
  return m;
}

function conLai(t) { for (const [k, b] of ben) if (t - b.at > BEN_MS) ben.delete(k); }

function nhip(tk, b) {
  const t = Date.now(), oNv = nguyen(b.o, 0, tk.nv.length - 1), h = tk.nv[oNv];
  const s = h && sach(b.s);
  // Lôi Đài (soát 16/11): vùng sân không có bản quái chung — bỏ c (báo c = 1 thì người khác c 0 không thấy mình trong ai: vô hình mà vẫn đánh người được)
  if (s && s.chung && LD().laSan(s.zone)) delete s.chung;
  if (s) {
    // nối mốc mới vào mốc cũ (cùng bản đồ + CÙNG NHÂN VẬT — 2 thẻ cùng tài khoản không trộn mốc 2 nhân vật, soát 13/11; người đó tải lại trang thì đồng hồ chạy
    // lại từ 0 -> bỏ mốc cũ)
    const cu = ben.get(tk.ten), cung = cu && cu.zone === s.zone && cu.name === h.name, tr = noiMoc(cung ? cu.tr : [], s.tr);
    // Phân Thân không vào chiến trường Tống Kim (anh chốt — THIET-KE-TONG-KIM.md §3): bãi kind "tongkim" thì không nhận phân thân đi theo; Lôi Đài (anh 15/11) cũng không
    const kz = (DOJS().NOI.ZONES.get(s.zone) || {}).kind, pt = s.pt && kz !== "tongkim" && kz !== "lôi đài" && kz !== "đua ngựa" ? ptCua(h, s.pt, cung ? cu.pt || [] : []) : []; // đua ngựa (anh 16/11): đường đua 863 không có phân thân
    // bang hội (anh 14/11): nhãn "Tên bang(Chức)" + phe bang dựng 1 lần ở nhịp của chính người này (bang-hoi.js nhan — tra O(1)); lỗi bang không làm hỏng nhịp
    let bx = null; try { bx = BH().nhan(tk.ten, oNv, h); } catch (e) { console.error("Nhãn bang hội:", e.message); }
    const cc = ccDau(h, t); // vầng trăng Nhất Kỷ / Càn khôn (anh 16/11)
    ben.set(tk.ten, { ...s, tr, pt, name: h.name, sex: h.sex === "f" ? "f" : "m", series: h.series, fac: h.fac, lvl: h.lvl || s.lvl, lead: h.leadLv || 1, at: t, oNv, ...(tk.admin ? { qt: 1 } : {}), ...(cc ? { cc } : {}), ...(bx ? { bh: bx.bh, bhp: bx.bhp, bid: bx.id, bhc: bx.cv } : {}) }); // qt: tài khoản quản trị (tên vàng kim + vòng sáng — world.js QT_MAU / QT_VONG); bid: mã bang — khu vực bang chỉ thấy người cùng bang (khu-bang.js cungBan)
    // chỗ đứng theo nhân vật (viTriNv): mốc MỚI NHẤT của chính nhịp này; n tăng mỗi nhịp — npc-gan.js đếm nhịp sau lời gọi để xác nhận cờ đỏ (soát 13/11)
    { const kv = tk.ten + "\u0001" + h.name, cv = VT_NV.get(kv), z = s.tr[s.tr.length - 1] || (cung ? tr[tr.length - 1] : null);
      if (z) VT_NV.set(kv, { zone: s.zone, x: z[1], y: z[2], at: t, n: ((cv && cv.n) | 0) + 1 }); }
  } else ben.delete(tk.ten);
  conLai(t);
  const toi = ben.get(tk.ten);
  // co: đội trưởng của đội đang mở -> cờ trên đầu (to-doi.js coMo — engine menu state 队伍开放状态)
  // + phân thân đang theo của họ (pt: 1 — cùng phe người thuê, không qt / cờ)
  // bh: nhãn bang của người đó (đã dựng ở nhịp của họ) — người đang trong Tống Kim không gửi (bot không có bang, anh chốt C4); bhp (phe bang) chỉ để tính cp, không gửi
  const inView = (x, y) => require("./ws").trongTam({ view: toi && toi.view }, x, y);
  const ai = toi ? [...ben].filter(([k, x]) => { const m = x.tr[x.tr.length - 1]; return k !== tk.ten && x.zone === toi.zone && !x.chung === !toi.chung && m && inView(m[1], m[2]) && VAI().cungCho(k, tk.ten, x.zone); }).flatMap(([k, x]) => {
    const { at, zone, lead, chung, pt, oNv: _o, bh, bhp: _bp, bid: _bi, bhc, ...r } = x, g = GD().co(k), tkp = TKM().pheCua(k, x.zone), cp = pheNay(k, x, tkp);
    // bhc: mã chức của người đó (màu chức vụ ở dòng bang — mẫu 4, anh 14/11)
    return [{ ...r, cp, ...(bh && tkp == null ? { bh, ...(bhc ? { bhc } : {}) } : {}), ...(TD().coMo(k) ? { co: 1 } : {}), ...(g ? { gd: g } : {}) }, ...(pt || []).filter((c) => { const m = c.tr[c.tr.length - 1]; return m && inView(m[1], m[2]); }).map(({ i, ...c }) => ({ ...c, cp, hp: 100, mp: 100, pt: 1, chu: x.name }))];
  }) : [];
  // tin chat: mới hơn mã đã nhận (lần đầu, hoặc máy chủ vừa bật lại nên mã đã nhận > mã mới nhất: TIN_DAU tin gần nhất); không gửi
  // lại tin của chính mình; phụ cận / thành thị chỉ cùng bản đồ; kênh Bang hội chỉ cùng bang (mã bang của nhân vật đang chơi — tra O(1))
  const doi = TD().idCua(tk.ten);
  let bang = null; try { bang = h ? BH().idCua(tk.ten, oNv, h.name) : null; } catch (e) { console.error("Kênh bang hội:", e.message); }
  const thay = (m) => m.tk !== tk.ten && (!m.chi || m.chi === tk.ten) && ((m.ch === "CH_SYSTEM" && (!m.zs || (!!toi && m.zs.includes(toi.zone)))) || KENH[m.ch] === "all" || KENH[m.ch] === "mat" || (KENH[m.ch] === "doi" ? !!doi && m.doi === doi : KENH[m.ch] === "bang" ? bang != null && m.bang === bang : !!toi && m.zone === toi.zone && (m.kb == null || m.kb === bang))); // kb: tin phụ cận / thành thị gửi ở khu vực bang — chỉ cùng bang (đợt 4)
  const moi = b.tin == null || b.tin > tinId ? tin.filter(thay).slice(-TIN_DAU) : tin.filter((m) => m.id > b.tin && thay(m));
  return { ai, cp: toi ? pheNay(tk.ten, toi) : 0, tin: moi.map(({ id, ch, name, text, qt, it }) => ({ id, ch, name, text, ...(qt ? { qt } : {}), ...(it ? { it } : {}) })), tinId };
}

function chat(tk, b) {
  const oNv = nguyen(b.o, 0, tk.nv.length - 1), h = tk.nv[oNv];
  if (!h) throw Object.assign(new Error("Chưa vào game"), { code: 400 });
  if (!KENH[b.ch]) throw Object.assign(new Error("Kênh này chưa có trên máy chủ"), { code: 400 });
  const doi = KENH[b.ch] === "doi" ? TD().idCua(tk.ten) : null;
  if (KENH[b.ch] === "doi" && !doi) throw Object.assign(new Error("Bạn chưa có đội ngũ — lập nhóm / vào nhóm rồi mới nói được ở Tần số đội ngũ"), { code: 400 });
  // kênh Bang hội (anh 14/11): chỉ thành viên — tin mang mã bang, chỉ người cùng bang nhận (nhip thay)
  const bang = KENH[b.ch] === "bang" ? BH().idCua(tk.ten, oNv, h.name) : null;
  if (KENH[b.ch] === "bang" && bang == null) throw Object.assign(new Error("Bạn chưa gia nhập bang hội — vào bang rồi mới nói được ở kênh Bang hội"), { code: 400 });
  let text = String(b.t || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, TIN_MAX);
  // khoe đồ (anh 12/11 "thêm chức năng post đồ trên kênh thế giới"): b.u = mã món ở hành trang / trang bị -> lấy đúng món nhân vật đang có (không
  // tin trình duyệt: không khoe được đồ không có), tin mang bản sao món (it — người xem rê / chạm chữ <tên đồ> để xem ô món). Chữ chưa có
  // <tên đồ> (tên đồ của máy chủ) thì đổi chữ <…> đầu tiên / thêm vào cuối
  const it = b.u != null ? monKhoe(h, b.u) : null;
  if (it) {
    const the = `<${String(DO().tenMon(it)).replace(/\s+/g, " ").trim()}>`;
    if (!text.includes(the)) text = /<[^<>]*>/.test(text) ? text.replace(/<[^<>]*>/, the) : `${text.slice(0, Math.max(0, TIN_MAX - the.length - 1))} ${the}`.trim();
  }
  if (!text) throw Object.assign(new Error("Tin trống"), { code: 400 });
  // nhắn tin mật (anh 13/11 "thêm tính năng nhắn tin mật với người chơi"): tới đúng 1 người đang chơi — b.toi = tên nhân vật (Ctrl + bấm tên ở khung chat /
  // menu người chơi "Nhắn tin mật"); chỉ máy người đó nhận (chi), người gửi tự hiện tin ở máy mình
  let chi = null, toi = null;
  if (KENH[b.ch] === "mat") {
    toi = String(b.toi || "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 40);
    if (!toi) throw Object.assign(new Error("Chưa chọn người nhận — Ctrl + bấm tên người đó ở khung chat"), { code: 400 });
    if (toi === h.name) throw Object.assign(new Error("Không nhắn tin mật cho chính mình được"), { code: 400 });
    chi = timTen(toi);
    if (!chi || chi === tk.ten) throw Object.assign(new Error(`${toi} hiện không trực tuyến`), { code: 400 });
  }
  const t = Date.now();
  if (t - (guiCuoi.get(tk.ten) || 0) < TIN_CACH) throw Object.assign(new Error("Gửi quá nhanh"), { code: 429 });
  guiCuoi.set(tk.ten, t);
  if (text.toLowerCase() === GOC_LENH) { thongBaoTk(gocCau(), tk.ten); return { id: tinId }; } // lệnh bí mật bản gốc: chỉ người gõ thấy
  const b0 = ben.get(tk.ten);
  // khu vực bang (bang hội đợt 4): ở bãi bang (mỗi bang 1 bản) tin phụ cận / thành thị mang mã bang của người gửi (kb; không bang: -1) — chỉ người cùng bang thấy (nhip thay)
  const kb = KENH[b.ch] === "zone" && b0 && (DOJS().NOI.ZONES.get(b0.zone) || {}).bang ? (BH().idCua(tk.ten, oNv, h.name) ?? -1) : null;
  tin.push({ id: ++tinId, ch: b.ch, name: h.name, text, zone: b0 ? b0.zone : -1, tk: tk.ten, ...(doi ? { doi } : {}), ...(bang != null ? { bang } : {}), ...(kb != null ? { kb } : {}), ...(it ? { it } : {}), ...(chi ? { chi, toi } : {}) });
  if (tin.length > TIN_GIU) tin.shift();
  return { id: tinId, ...(toi ? { toi } : {}), ...(it ? { it, text } : {}) };
}
// món khoe (chat b.u): món mã u ở hành trang / trang bị của nhân vật -> bản sao bỏ chỗ trong túi; không có -> lỗi (vừa bán / cất / giao dịch)
function monKhoe(h, u) {
  const m = (h.bag || []).find((x) => x && x.u === (u | 0)) || Object.values(h.equip || {}).find((x) => x && x.u === (u | 0));
  if (!m) throw Object.assign(new Error("Không thấy món này trong hành trang / trang bị (vừa bán, cất hay giao dịch?)"), { code: 400 });
  const { x, y, ...r } = m;
  return JSON.parse(JSON.stringify(r));
}

// người đang trong game (tổ đội — may-chu/to-doi.js; chia kinh nghiệm — may-chu/do.js): tài khoản -> { name, lvl, fac, zone, chung (1: bản quái
// chung của bãi), lead (cấp thống soái), x, y (mốc vị trí cuối), o (ô nhân vật — bang hội mời người, anh 14/11) } | null; tìm tài khoản theo tên nhân vật
function dangChoi(tk) {
  const b = ben.get(tk); if (!b || Date.now() - b.at > BEN_MS) return null;
  const m = b.tr[b.tr.length - 1];
  return { name: b.name, lvl: b.lvl, fac: b.fac, zone: b.zone, chung: b.chung ? 1 : 0, lead: b.lead || 1, x: m ? m[1] : 0, y: m ? m[2] : 0, hp: b.hp ?? 100, mp: b.mp ?? 100, o: b.oNv };
}
// Vị trí qua kênh tức thời (anh 01/11 khuya: "mọi người thao tác bị khựng, không tự nhiên như Võ Lâm VNG"): trước mốc của người khác chỉ tới qua
// nhịp — chờ nhịp gửi của họ (0–0,5 giây) rồi chờ nhịp hỏi của mình (0–0,5 giây), tới lúc nhanh lúc chậm -> người khác đứng khựng rồi nhảy. Nay
// trình duyệt gửi mốc vừa ghi { t: "vt", tr } -> nối vào mốc đang giữ như nhịp rồi chuyển ngay cho người cùng bãi { t: "vt", ten, tr } (ws.js
// guiBai — ải Vượt Ải chỉ người cùng phòng). Nhịp vẫn gửi đủ mốc như cũ: kênh tức thời đứt thì vẫn thấy nhau, chỉ trễ hơn
require("./ws").nhan("vt", (kn, m) => {
  if (LD().laSan(kn.zone) && !LD().cungCho(kn.ten, null, kn.zone)) return; // Lôi Đài (anh 15/11): người xem / người bị hạ / người không vai không phát vị trí (tàng hình)
  const t = Date.now(), cu = ben.get(kn.ten);
  // chỉ nối mốc của đúng nhân vật đang giữ bản ben (kn.o — ô nhân vật trang báo lúc "vao"): 2 thẻ cùng tài khoản không nối mốc thẻ này vào nhân vật thẻ kia (soát 13/11)
  if (!cu || cu.zone !== kn.zone || (cu.oNv != null && kn.o !== cu.oNv) || !Array.isArray(m.tr) || t - (kn.vtLuc || 0) < VT_CACH) return;
  kn.vtLuc = t;
  const moi = [];
  for (const a of m.tr.slice(-MOC_GUI).filter(Array.isArray).map(moc).sort((x, y) => x[0] - y[0])) {
    const z = cu.tr[cu.tr.length - 1];
    if (z && a[0] < z[0] - 10000) cu.tr.length = 0; // trang tải lại: đồng hồ chạy lại từ 0
    if (!cu.tr.length || a[0] > cu.tr[cu.tr.length - 1][0]) { cu.tr.push(a); moi.push(a); }
  }
  if (!moi.length) return;
  cu.tr = cu.tr.slice(-MOC_GIU);
  // trang mới (kn.vtb): gom theo bãi, mỗi 50 ms 1 tin "vtb" (ws.js gomVt — anh 13/11 tối, độ mượt bước 1); trang cũ chưa F5: từng mốc như trước (chỉ khi còn trang cũ)
  // true: bỏ được khi hàng chờ người nhận dài (ws.js ghi — anh 11/11)
  const W_ = require("./ws");
  W_.gomVt(kn, cu.name, moi);
  if (W_.coCu()) W_.guiBai(kn.zone, { t: "vt", ten: cu.name, tr: moi }, kn, true, (nh) => !nh.vtb);
});
function timTen(name) { const t = Date.now(); for (const [k, b] of ben) if (b.name === name && t - b.at <= BEN_MS) return k; return null; }
// bảng quản trị (may-chu/quan-tri.js): mọi người đang trong game [{ tk, …dangChoi }]; roi = bỏ khỏi bản đồ ngay (bị đá / khóa — người khác
// thôi thấy, không chờ BEN_MS)
function dsDangChoi() { const t = Date.now(); return [...ben].filter(([, b]) => t - b.at <= BEN_MS).map(([k]) => ({ tk: k, ...dangChoi(k) })); }
function roi(tk) { ben.delete(tk); }

// tin hệ thống tới cả máy chủ (vd nhặt được đồ 5–6 dòng — may-chu/do.js); qt = thông báo của quản trị (trình duyệt hiện thêm dòng chữ giữa
// trên màn hình — src/game/quantri.js loaThongBao)
// tin hệ thống tối đa chừng này ký tự (gồm thẻ màu <color=…> — anh 13/11: 220 cắt mất đuôi tin bắt nhím "Người tham gia … may m")
const TIN_HT_MAX = 1500; // soát 13/11: thẻ màu làm tin dài thêm ~20 ký tự mỗi tên / phần thưởng (bắt nhím nhiều người may mắn)
// cắt tin quá dài không để sót nửa thẻ "<color=cy" (trình duyệt sẽ in ra nguyên chữ)
const catTin = (t) => { t = String(t); return t.length <= TIN_HT_MAX ? t : t.slice(0, TIN_HT_MAX).replace(/<[^<>]*$/, ""); };
function thongBao(text, qt = false) {
  tin.push({ id: ++tinId, ch: "CH_SYSTEM", name: "", text: catTin(text), zone: -1, tk: null, ...(qt ? { qt: 1 } : {}) });
  if (tin.length > TIN_GIU) tin.shift();
}
// tin hệ thống chỉ người đang ở các bãi zs thấy (Msg2SubWorld của client — vd Bầu Cua ở các bãi có Chủ sòng bạc, may-chu/bau-cua.js)
function thongBaoBai(text, zs) {
  const L = (Array.isArray(zs) ? zs : [zs]).map((z) => z | 0);
  tin.push({ id: ++tinId, ch: "CH_SYSTEM", name: "", text: catTin(text), zone: -1, tk: null, zs: L });
  if (tin.length > TIN_GIU) tin.shift();
}

// tin hệ thống chỉ 1 tài khoản thấy (chi — vd may-chu/quai-chung.js: trang chưa tải lại có bản đồ bãi cũ, anh 11/11); qt: hiện cả dòng loa thông báo
function thongBaoTk(text, ten, qt = false) {
  tin.push({ id: ++tinId, ch: "CH_SYSTEM", name: "", text: catTin(text), zone: -1, tk: null, chi: String(ten), ...(qt ? { qt: 1 } : {}) });
  if (tin.length > TIN_GIU) tin.shift();
}
// tin hệ thống của 1 đội (anh 18/11 — sat-thu.js nhanDoi: đội trưởng nhận nhiệm vụ sát thủ cho cả đội): kênh Đội ngũ CH_TEAM, name rỗng, chỉ thành viên đội id nhận (nhip thay)
function thongBaoDoi(text, id) {
  if (id == null) return;
  tin.push({ id: ++tinId, ch: "CH_TEAM", name: "", text: catTin(text), zone: -1, tk: null, doi: id });
  if (tin.length > TIN_GIU) tin.shift();
}
// tin hệ thống của 1 bang (anh 14/11 — may-chu/bang-hoi.js: vào / rời, bổ nhiệm, khảo nghiệm…): kênh Bang hội CH_TONG, name rỗng, chỉ thành viên bang id nhận (nhip thay)
function thongBaoBang(text, id) {
  tin.push({ id: ++tinId, ch: "CH_TONG", name: "", text: catTin(text), zone: -1, tk: null, bang: id });
  if (tin.length > TIN_GIU) tin.shift();
}

// chỗ đứng gần nhất của nhân vật `name` thuộc tài khoản tk (từ nhịp), còn mới trong maxMs -> { name, zone, x, y, at } | null (may-chu/npc-gan.js)
function viTriNv(tk, name, maxMs = BEN_MS) { const v = VT_NV.get(tk + "\u0001" + name); return v && Date.now() - v.at <= maxMs ? { name, ...v } : null; }
setInterval(() => { const t = Date.now(); for (const [k, v] of VT_NV) if (t - v.at > VT_NV_GIU) VT_NV.delete(k); }, 30 * 1000).unref();

// mã bang của nhân vật đang chơi ở tài khoản tk (dựng ở nhịp của chính người đó — BH.nhan) | null — khu vực bang (khu-bang.js cungBan), O(1)
function bangCua(tk) { const b = ben.get(tk); return b && b.bid != null ? b.bid : null; }

module.exports = { nhip, chat, thongBao, thongBaoBai, thongBaoTk, thongBaoBang, thongBaoDoi, dangChoi, viTriNv, timTen, dsDangChoi, roi, bangCua };
