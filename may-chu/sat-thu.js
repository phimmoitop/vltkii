// Boss Sát thủ — nhiệm vụ của Nhiếp Thí Trần (anh 27/10: "Boss Sát thủ như client, tên cam BOSS Sát thủ - tên"; Vượt Ải sau cần Sát Thủ
// Giản). Luật theo kịch bản máy chủ 8.1 Vinh (ổ ảo, chỉ đọc — script\task\tollgate\killer\):
//   - nieshichen.lua: 8 bậc nhiệm vụ cấp 20 / 30 / … / 90 (nhận khi cấp nhân vật trong bậc: 20–29 … 80–89, 90 trở lên), mỗi bậc chọn 1 trong
//     20 boss (2 trang 10 tên); đang có nhiệm vụ thì không nhận thêm; mỗi ngày hạ tối đa KILLER_MAXCOUNT = 8 boss (đếm lúc hạ, xét lúc nhận);
//     hủy nhiệm vụ; hợp thành: đúng 5 Sát Thủ lệnh (6,1,399) cùng cấp -> 1 Sát thủ giản (6,1,400) cùng cấp, hệ = hệ của 1 trong 5 lệnh (ngẫu
//     nhiên). Câu chữ = ContentList của script.
//   - kill_level.lua + lib_killlevel.lua: hạ đúng boss của nhiệm vụ -> 1 Sát Thủ lệnh cấp bậc, hệ của boss + kinh nghiệm thưởng (bậc 60–90)
//     + 8 lượt bảng rơi bosstask_lev<bậc>.ini; xong nhiệm vụ ("Sát thủ đã bị tiêu diệt, hoàn thành nhiệm vụ.").
// Bản mình: boss của từng người (như quái bãi luyện công) — có nhiệm vụ thì vào bãi của boss là boss đứng ở chỗ của nó (assets/data/
// sat-thu.json — cong-cu/dung-sat-thu.mjs); máy chủ nhận giết khi đúng boss / bãi / cấp / hệ đang nhận (do.js gietQuai loại 3). Hệ boss máy
// chủ bốc lúc nhận nhiệm vụ. "Thử luyện sát thủ" -> Vượt Ải (may-chu/vuot-ai.js — 28/10). Số trong cau-hinh.json satThu. Anh 02/11 khuya ("hủy
// ngũ hành của sát thủ giản, cho sát thủ giản, sát thủ lệnh cộng dồn như cái mật đồ"): giản không còn hệ (ms:400:<cấp>), lệnh / giản xếp chồng
// tới 9999 — hợp thành nhận cả chồng lệnh.
// h.satThu (máy chủ giữ): { nv (số hiệu boss 1–160, 0 = chưa nhận), he (hệ boss), luc (lúc nhận), ngay (ngày Việt Nam), dem (đã hạ trong ngày) }
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const VAI = () => require("./vuot-ai.js"); // Vượt Ải (Thử luyện sát thủ -> Tham gia khiêu chiến)
const QC = () => require("./quai-chung.js"); // bản quái chung: boss chung (anh 03/11)
const DL = require("./du-lieu.js"); // đội trưởng nhận nhiệm vụ cho cả đội (anh 18/11): ghi thẳng tài khoản đồng đội như Vượt Ải tổ đội
const TG = () => require("./the-gioi.js");
const TDOI = () => require("./to-doi.js");

const N = DO.NOI, loi = N.loi;
const ST = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/sat-thu.json"), "utf8")); } catch { return { bac: [], boss: {}, roi: {} }; } })();
const CF = { moiNgay: 8, gop: 5, luot: 8, toiThieuGiay: 5, hoiSinh: 120, boChung: 60, ...(N.CFG.satThu || {}) };
const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const TEN = "Nhiếp Thí Trần";
const bai = (z) => N.ZONES.get(z | 0) || null;
// Sát Thủ lệnh 1 loại duy nhất (anh 09/11 "nên bỏ cấp độ đi, chỉ cần đánh chết là ra sát thủ lệnh, dù là cấp nào sau đó đều ghép dc sát thủ giản" — khóa cũ ms:399:<cấp>:<hệ> có doi -> do.js chuan đổi + dồn chồng)
const LENH = "ms:399", gian = (cap) => `ms:400:${cap}`;
const Y = (t) => `<color=yellow>${t}<color>`;
const say = (text, opts) => ({ say: { text, opts } }); // opts: [[nhãn, việc, tham số]]
const dong = ["Đóng", null];

// trạng thái trong ngày (ngày Việt Nam — script GetLocalDate("%y%m%d")): sang ngày mới thì đếm lại
function tt(h) {
  const S = (h.satThu = h.satThu || { nv: 0, dem: 0 }), ngay = N.ngayVN(Date.now());
  if (S.ngay !== ngay) { S.ngay = ngay; S.dem = 0; }
  return S;
}
const bacCua = (cap) => ST.bac.find((b) => b.cap === (cap | 0)) || null;
const tenBai = (b) => (bai(b.bai) || {}).n || "bãi " + b.bai;
// boss ở bãi có bản quái chung (anh 03/11 — "đưa boss sát thủ lên bãi chung hết"): chỉ xuất hiện ở bản quái chung (may-chu/quai-chung.js)
const cho = (id) => { const b = ST.boss[id]; return b ? `${b.ten} trong ${tenBai(b)}${QC().bat(b.bai) ? " — bản quái chung" : ""} (${b.X},${b.Y}) . Ta không tin ngươi thắng được hắn!` : ""; };

// ---------- hội thoại (nieshichen.lua) ----------
// anh 28/10 lần 7: Boss Sát thủ tới cấp 200 (19 bậc) -> danh sách chỉ hiện bậc đúng cấp nhân vật (client liệt kê đủ 8 bậc, bậc sai cấp thì từ chối)
const bacTheoCap = (h) => ST.bac.find((b) => (h.lvl | 0) >= b.lo && (h.lvl | 0) <= b.hi) || ST.bac[0];
function mo(h) {
  return say(`Nếu ai có đủ 160 sát thủ giản trong tay thì giấc mộng trở thành đệ nhất sát thủ đã xem như hoàn thành. Mỗi ngày chỉ cần hoàn thành ${Y(CF.moiNgay + " nhiệm vụ")} là được. <enter>Hãy tiếp nhận nhiệm vụ thách thức thời gian để thể nghiệm sức mạnh đồng đội và khả năng sát thủ của mình.`,
    [["Thử luyện sát thủ", "thuLuyen"], ["Hợp thành sát thủ giản", "gop"], ...[bacTheoCap(h)].filter(Boolean).map((b) => [`Nhiệm vụ sát thủ cấp ${b.cap}`, "bac", b.cap]),
      ["Ta đánh không muốn giết người đâu, hủy bỏ nhiệm vụ.", "huy"], dong]);
}
// killerCoundTakedTask: đang có nhiệm vụ / sai cấp / đủ số trong ngày -> câu từ chối; được thì danh sách 20 boss (trang 1 / 2)
function chonBac(h, cap, trang) {
  const B = bacCua(cap); if (!B) loi("Bậc nhiệm vụ không có");
  const S = tt(h);
  if (S.nv) return say("Người lần trước ta nói ngươi đi hạ thủ vẫn còn sống, hãy chứng minh thực lực của mình trước đi đã.", [dong]);
  if ((h.lvl | 0) < B.lo || (h.lvl | 0) > B.hi) return say("Đẳng cấp của ngươi không phù hợp, phải giao đấu cùng với người có đẳng cấp tương ứng mới được.", [dong]);
  if ((S.dem | 0) >= CF.moiNgay) return say(`Sát thủ có một tố chất rất quan trọng gọi là khinh kẻ bại trận.  Hôm nay ngươi đã bị hạ ${CF.moiNgay} người rồi, ngày mai hãy quay lại.`, [dong]);
  const t = trang ? 1 : 0, ds = B.ids.slice(t * 10, t * 10 + 10);
  return say("Đẳng cấp như thế có 20 sát thủ, tay mỗi người đều nhuốm đầy máu, ngươi muốn đánh với người nào?",
    [...ds.map((id) => [ST.boss[id].ten, "nhan", id]), t ? ["Trang trước", "bac", cap] : ["Trang kế", "trang", cap], dong]);
}
// givetask: ghi nhiệm vụ (hệ boss bốc ngẫu nhiên), báo chỗ boss. tk: tài khoản (đội trưởng có tổ đội -> nhanDoi)
function nhan(h, id, tk) {
  const b = ST.boss[id | 0]; if (!b) loi("Không có sát thủ này");
  const r = chonBac(h, b.cap); if (r.say && !r.say.opts.some((o) => o[1] === "nhan")) return r; // điều kiện như lúc mở danh sách
  const T = tk && tk.ten ? TDOI().thanhVien(tk.ten) : null;
  if (T && T.tv.length > 1 && T.truong === tk.ten) return nhanDoi(h, id, tk, T);
  const S = tt(h);
  Object.assign(S, { nv: id | 0, he: Math.floor(Math.random() * 5), luc: Date.now() });
  return say(cho(id), [dong]);
}
// anh 18/11: "đội trưởng pt xong nhận nv cho cả tổ đội … Đội viên phải còn lượt tương ứng, và k bị kẹt nv khác, nếu full nv rồi, đội trưởng nhận nv sẽ k thành
// công, báo lên kênh khác hoặc kênh đội ai đã hết lượt hay k đủ điều kiện". Mỗi đồng đội: đang trong game, chưa có nhiệm vụ sát thủ, còn lượt trong ngày (không xét
// bậc cấp — cùng boss của đội trưởng). Có người không đủ -> không ai nhận, báo kênh đội + khung. Đủ -> cả đội cùng boss, cùng hệ; đồng đội ghi thẳng tài khoản
// (không có await giữa đọc và ghi), nhịp sau của họ nhận nhiệm vụ mới + câu báo (layDoi)
const DOI_TIN = new Map(); // tài khoản đồng đội -> [câu] chờ nhịp sau (api.js nhip)
function nhanDoi(h, id, tk, T) {
  const b = ST.boss[id | 0], ds = [], thieu = [];
  for (const a of T.tv) {
    if (a === tk.ten) continue;
    const p = TG().dangChoi(a), tkA = DL.docTk(a), hA = p && tkA && Array.isArray(tkA.nv) ? tkA.nv.find((x) => x && x.name === p.name) || null : null;
    const ten = (p && p.name) || a;
    if (!p || !hA) { thieu.push(`${ten} (không ở trong game)`); continue; }
    const S = tt(hA);
    if (S.nv) { thieu.push(`${ten} (đang có nhiệm vụ sát thủ khác)`); continue; }
    if ((S.dem | 0) >= CF.moiNgay) { thieu.push(`${ten} (hết lượt hôm nay ${S.dem | 0}/${CF.moiNgay})`); continue; }
    ds.push({ a, tkA, hA, ten, S });
  }
  const doiId = TDOI().idCua(tk.ten);
  if (thieu.length) {
    try { TG().thongBaoDoi(`Đội trưởng ${h.name} nhận nhiệm vụ sát thủ cho cả đội không thành công — chưa đủ điều kiện: ${thieu.join(", ")}.`, doiId); } catch (e) { console.error("Sát thủ — kênh đội:", e.message); }
    return say(`Tổ đội của ngươi có người chưa đủ điều kiện nhận nhiệm vụ sát thủ: ${Y(thieu.join(", "))}. Mỗi người phải còn lượt trong ngày và không đang làm nhiệm vụ sát thủ khác.`, [dong]);
  }
  const he = Math.floor(Math.random() * 5), t = Date.now();
  Object.assign(tt(h), { nv: id | 0, he, luc: t });
  for (const x of ds) {
    Object.assign(x.S, { nv: id | 0, he, luc: t });
    DO.chuan(x.hA); DL.ghiTk(x.tkA);
    DOI_TIN.set(x.a, [`Đội trưởng ${h.name} đã nhận nhiệm vụ sát thủ cấp ${b.cap} cho cả đội: hạ ${b.ten} ở ${tenBai(b)}${QC().bat(b.bai) ? " (bản quái chung)" : ""} (${b.X}/${b.Y}).`]);
  }
  try { TG().thongBaoDoi(`Đội trưởng ${h.name} đã nhận nhiệm vụ sát thủ cho cả đội (${ds.length + 1} người): hạ ${b.ten} ở ${tenBai(b)}.`, doiId); } catch (e) { console.error("Sát thủ — kênh đội:", e.message); }
  return say(`${cho(id)}<enter>Cả đội ${Y(ds.length + 1 + " người")} cùng nhận boss này.`, [dong]);
}
// api.js nhip: câu báo nhiệm vụ đội trưởng vừa nhận giùm (lấy 1 lần) | null
function layDoi(tk) { const L = DOI_TIN.get(tk); if (!L) return null; DOI_TIN.delete(tk); return L; }
function huy(h) {
  const S = tt(h);
  if (!S.nv) return { talk: ["Ngươi chưa nhận nhiệm vụ, không thể hủy bỏ!"] };
  S.nv = 0;
  return say("Ngươi đã hủy bỏ nhiệm vụ. Làm sát thủ trước tiên phải có thủ pháp siêu phàm, hai là hạ thủ vô tình, xem ra ngươi không thích hợp, không đi cũng không sao.", [dong]);
}
// compose + exchange_token: khung Giao vật phẩm -> Sát Thủ lệnh cùng cấp, khác hệ vẫn hợp được (anh 28/10). Lệnh / giản xếp chồng, giản không hệ
// (anh 02/11 khuya): bỏ vào bao nhiêu lệnh (cả chồng) thì mỗi CF.gop lệnh hợp 1 giản cùng cấp, lệnh thừa giữ lại; ít hơn CF.gop: câu client
const thuLai = [["Hợp lại một lần nữa", "gop"], dong];
function gop(h, u) {
  if (!Array.isArray(u)) return { giao: { tieuDe: "Giao diện hợp thành sát thủ giản", loi: `${CF.gop} sát thủ lệnh sẽ hợp thành 1 sát thủ giản theo đẳng cấp của bạn. Bỏ vào cả chồng sát thủ lệnh thì cứ ${CF.gop} lệnh hợp thành 1 giản, lệnh thừa giữ lại.`, viec: "gop" } };
  const ds = [...new Set(u.map((x) => x | 0))].map((x) => h.bag.find((o) => o.u === x)).filter(Boolean), X = (o) => N.BY.get(o.k) || {};
  if (ds.some((o) => X(o).satThu !== "lenh")) return say("Sát thủ giản bạn để không đúng, việc quan sát và cặp mắt tinh tường là rất quan trọng.", thuLai);
  const co = ds.reduce((t, o) => t + (o.n || 1), 0), bo = Math.floor(co / CF.gop);
  if (!bo) return say("Sát thủ lệnh bạn để quá ít, sát thủ cũng phải có nghệ thuật của nó, không thể nào mà ngay cả sinh mệnh của bản thân mình cũng không biết.", thuLai);
  // giản theo đẳng cấp nhân vật (bậc 20–90 như nhiệm vụ của client; từ cấp 90 trở lên là giản cấp 90 — Vượt Ải cao cấp, Dã Tẩu đều nhận)
  const cap = Math.max(20, Math.min(90, Math.floor((h.lvl | 0) / 10) * 10)), bag0 = h.bag.map((o) => ({ ...o }));
  let can = bo * CF.gop;
  for (const o of ds) {
    const m = Math.min(can, o.n || 1); can -= m; o.n = (o.n || 1) - m;
    if (o.n <= 0) h.bag.splice(h.bag.indexOf(o), 1);
    if (!can) break;
  }
  try { N.themChong(h, N.BY.get(gian(cap)), bo); } catch { h.bag = bag0; return { talk: ["Hành trang không đủ chỗ"] }; } // giản 1 × 2 ô
  const du = co - bo * CF.gop;
  return say(`Bạn đã hợp thành ${Y(bo + " sát thủ giản cấp " + cap)}${du ? `, còn lại ${Y(du)} sát thủ lệnh` : ""}. Sát thủ giản dùng để tham gia khiêu chiến (Thử luyện sát thủ), sát thủ giản là một sát thủ phi phàm.`, [dong]);
}
// annealofkiller: "Thử luyện sát thủ" -> thách thức thời gian (Vượt Ải — may-chu/vuot-ai.js)
const thuLuyen = () => say("Sát thủ luyện thức trước tiên phải bắt đầu từ việc tham gia khiêu chiến, ngươi dám tiếp nhận nhiệm vụ chứ?",
  [["Tham gia khiêu chiến", "khieuChien"], ["Máu chảy đầu rơi, tốt nhất là ta nên tránh xa", null]]);

// b.viec: "mo" | "bac" / "trang" (+ b.cap) | "nhan" (+ b.id) | "huy" | "gop" (+ b.u) | "thuLuyen" | "khieuChien" | "vaoAi" | "veAi" (Vượt Ải);
// tk = tài khoản (api.js — Vượt Ải tổ đội: đội trưởng báo danh cả đội)
function lam(h, b, tk) {
  switch (b.viec) {
    case "mo": return mo(h);
    case "bac": return chonBac(h, b.cap, false);
    case "trang": return chonBac(h, b.cap, true);
    case "nhan": return nhan(h, b.id, tk);
    case "huy": return huy(h);
    case "gop": return gop(h, b.u);
    case "thuLuyen": return thuLuyen();
    case "khieuChien": return VAI().lam(h, { viec: "mo" }, tk);
    case "vaoAi": return VAI().lam(h, { viec: "vao" }, tk);
    case "veAi": return VAI().lam(h, { viec: "veAi" }, tk);
    default: loi("Việc không rõ");
  }
}

// ---------- dùng ở do.js gietQuai (loại 3) ----------
// hạ boss mẫu id cấp L hệ se ở bãi Z (boss chung: mọi người có nhiệm vụ đúng boss đó, có đánh lúc boss chết, đều xong — quai-chung.js chet): đúng boss của nhiệm vụ (mẫu, bãi, cấp, hệ, nhận ≥ toiThieuGiay) -> xong nhiệm vụ, +1 lần trong ngày;
// trả { cap, ten, kn, luot, roi, lenh } (thưởng — do.js phát) | null
// chung: boss chung ở bản quái chung (may-chu/quai-chung.js — anh 03/11): hệ máy chủ bốc lúc sinh boss, không xét hệ của nhiệm vụ
function nhanGiet(h, Z, id, L, se, chung) {
  const S = h.satThu, b = S && S.nv ? ST.boss[S.nv] : null;
  if (!b || !Z || b.tpl !== id || b.bai !== Z.id || b.lv !== L || (!chung && S.he !== se) || Date.now() - (S.luc || 0) < CF.toiThieuGiay * 1000) return null;
  tt(h); S.nv = 0; S.dem = (S.dem | 0) + 1;
  const B = bacCua(b.cap) || {};
  return { cap: b.cap, ten: b.ten, kn: B.kn | 0, luot: CF.luot, roi: ST.roi[b.cap] || { trang: 0, mon: {} }, lenh: LENH }; // ten: nhật ký chung (anh 18/11)
}
// Trợ Thủ tự săn Boss Sát thủ (anh 03/11 — mở khóa trong ngày bằng Xu: may-chu/tu-lam.js; trình duyệt src/game/tulam.js): đứng trước Nhiếp Thí
// Trần gọi 1 bước — đang có nhiệm vụ: chỗ boss; chưa có: nhận như hội thoại (bậc đúng cấp nhân vật — "chọn loại bằng cấp nhân vật"; boss ngẫu nhiên
// trong 20 boss của bậc mà bãi vào được); hạ đủ moiNgay boss trong ngày: het
// -> { tiep: "danh", boss: { id, ten, cap, bai, x, y, X, Y } } | { tiep: "het" } | { tiep: "dung", ly }; tin: [câu]
function buocTu(h) {
  const S = tt(h), cua = (id) => { const b = ST.boss[id]; return { id, ten: b.ten, cap: b.cap, bai: b.bai, x: b.x, y: b.y, X: b.X, Y: b.Y }; };
  if (S.nv && ST.boss[S.nv]) return { tiep: "danh", boss: cua(S.nv), tin: [] };
  if ((S.dem | 0) >= CF.moiNgay) return { tiep: "het", tin: [] };
  const B = bacTheoCap(h), lv = h.lvl | 0;
  if (!B || lv < B.lo || lv > B.hi) return { tiep: "dung", ly: "Cấp nhân vật chưa có nhiệm vụ sát thủ (từ cấp 20)", tin: [] };
  const ds = B.ids.filter((id) => { const Z = bai(ST.boss[id].bai); return Z && N.capVao(Z) <= lv; });
  if (!ds.length) return { tiep: "dung", ly: `Chưa vào được bãi nào có sát thủ cấp ${B.cap}`, tin: [] };
  const id = ds[Math.floor(Math.random() * ds.length)], b = ST.boss[id];
  Object.assign(S, { nv: id, he: Math.floor(Math.random() * 5), luc: Date.now() });
  return { tiep: "danh", boss: cua(id), tin: [`Nhận nhiệm vụ sát thủ cấp ${B.cap}: hạ ${b.ten} ở ${tenBai(b)}${QC().bat(b.bai) ? " (bản quái chung)" : ""} (${b.X}/${b.Y})`] };
}

// gửi kèm nhân vật (hero.satThu của trình duyệt): nhiệm vụ đang nhận -> trình duyệt dựng boss khi vào bãi của nó
// gửi kèm nhân vật (khung Nhiệm vụ, bảng nhiệm vụ góc trái): dem = số boss đã hạ hôm nay, toiDa = giới hạn ngày
const tomTat = (h) => { const S = h.satThu || {}, hn = S.ngay === N.ngayVN(Date.now()); return { nv: S.nv | 0, he: S.he | 0, dem: hn ? S.dem | 0 : 0, ngay: S.ngay || "", toiDa: CF.moiNgay }; };

// ---------- công cụ thử (tài khoản quản trị — dev tool thẻ "Sát thủ") ----------
// b.viec: "xem" | "nhan" (b.id — bỏ qua điều kiện cấp / ngày; hoặc b.cap: boss ngẫu nhiên của bậc) | "di" (tới chỗ boss đang nhận) | "lenh"
// (+5 Sát Thủ lệnh bậc b.cap, hệ ngẫu nhiên) | "datLai" (đếm trong ngày về 0) | "huy"
function dev(h, b) {
  const S = tt(h); let r = {};
  switch (b.viec) {
    case "xem": break;
    case "nhan": {
      const B = bacCua(b.cap), id = b.id ? b.id | 0 : B ? B.ids[Math.floor(Math.random() * B.ids.length)] : 0;
      if (!ST.boss[id]) loi("Không có sát thủ " + id);
      Object.assign(S, { nv: id, he: Math.floor(Math.random() * 5), luc: Date.now() - CF.toiThieuGiay * 1000 });
      r = { tin: [`Sát thủ (thử): nhận ${ST.boss[id].ten} (số ${id}, hệ ${HE[S.he]})`] }; break;
    }
    case "di": {
      const x = ST.boss[S.nv];
      if (!x) { r = { tin: ["Sát thủ (thử): chưa nhận nhiệm vụ"] }; break; }
      r = { di: { z: x.bai, at: [x.x + 120, x.y + 60], ...(QC().bat(x.bai) ? { chung: 1 } : {}) } }; break; // bãi có bản quái chung: boss chỉ ở bản chung
    }
    case "lenh": {
      let n = 0;
      for (let i = 0; i < CF.gop; i++) try { N.themChong(h, N.BY.get(LENH), 1); n++; } catch { /* túi đầy */ }
      r = { tin: [`Sát thủ (thử): +${n} Sát Thủ lệnh`] }; break;
    }
    case "datLai": S.dem = 0; r = { tin: ["Sát thủ (thử): số boss hạ hôm nay về 0"] }; break;
    case "huy": S.nv = 0; r = { tin: ["Sát thủ (thử): bỏ nhiệm vụ"] }; break;
    default: loi("Việc không rõ");
  }
  return { ...r, dev: { st: tomTat(h), boss: S.nv ? { ...ST.boss[S.nv], tenBai: tenBai(ST.boss[S.nv]) } : null } };
}

module.exports = { lam, dev, nhanGiet, tomTat, buocTu, layDoi, CF, ST };
