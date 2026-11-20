// Tổ đội (anh 28/10 lần 4: Trợ Thủ "tự pt tổ đội, gửi lời mời cho người chơi xung quanh, luôn làm đội trưởng, tự vào nhóm, theo sau, đánh
// cùng mục tiêu với đội trưởng" + khung Lập nhóm của client 队伍管理.ini — src/game/windows.js _team; lần 5 "làm đầy đủ theo client": luật
// engine KPlayerTeam / KPlayer + chia kinh nghiệm — may-chu/do.js chiaDoi). Chỉ giữ trong bộ nhớ như the-gioi.js: tắt máy chủ là mất. Theo tài
// khoản (mỗi tài khoản chơi 1 nhân vật mỗi lúc), tên hiện = tên nhân vật đang chơi (the-gioi.js). Luật engine:
//   - số đội viên (chưa tính đội trưởng) tối đa = sức thống soái của đội trưởng (KTeam::CalcCaptainPower — cấp thống soái -> level_lead_exp.txt
//     cột 3: cấp 1–5 dẫn 3, 6–11: 4, 12–18: 5, 19–26: 6, 27+: 7; MAX_TEAM_MEMBER 7 -> đội tối đa 8 người); cấp thống soái lên khi đội chia
//     kinh nghiệm (do.js)
//   - đội trưởng rời đội (rời / rời game) -> đội giải tán (KTeam::DeleteMember); đội viên rời -> đội còn lại
//   - giao quyền: người nhận phải dẫn được số đội viên hiện có (KPlayer::TeamChangeCaptain), đội trưởng đã vào phái không giao cho người chưa vào
//     phái (camp_begin); đội trưởng chưa vào phái không nhận người đã vào phái (KTeam::CheckAddCondition)
//   - câu báo = câu client (lang\vn\stringtable_core.txt MSG_TEAM_*); câu dịch sai (MSG_TEAM_SELF_ADD …) viết lại theo nghĩa câu gốc
//   - đội "mở" (còn nhận người — KTeam::SetTeamOpen / SetTeamClose, anh 28/10 lần 6 "icon cờ pt đội trưởng"): lập đội thì mở; đủ người thì đóng;
//     đội viên rời / bị khai trừ thì mở lại (chưa đủ); đội trưởng bấm ô "Lập nhóm" để mở / đóng. Đội mở: đội trưởng có cờ trên đầu (menustate01 —
//     the-gioi.js gửi "co" cho người cùng bãi, World vẽ)
//   lam(tk, b)  b.viec: "lap" lập nhóm | "moi" (b.ten — tên nhân vật đang trong game) | "nhan" (b.id lời mời) | "tuChoi" (b.id) | "roi" |
//               "duoi" (b.ten) | "giao" (b.ten) | "giai" | "mo" (b.on: 1 mở / 0 đóng — đội trưởng) -> { doi: cua(tk), msg }
//   cua(tk)     -> { truong: tên, mo: 0 | 1, toiDa: số người tối đa (gồm đội trưởng), tv: [{ ten, lvl, fac, zone, c? (1: bản quái chung của bãi —
//               đi Xa phu vào cùng bản với đội trưởng), on, hp?, mp? (% — bảng đội ngũ) }], moi: [{ id, tu, het: giây còn lại }], bao: [câu] } | null
//               — gửi kèm nhịp (api.js nhip); bao = tin cho riêng người này, gửi 1 lần
//   idCua(tk) -> mã đội | null (kênh đội ngũ — the-gioi.js);  thanhVien(tk) -> { truong, tv: [tài khoản] } | null (chia kinh nghiệm — do.js)
//   coMo(tk) -> true khi tk là đội trưởng của đội đang mở (cờ trên đầu — the-gioi.js)
// Lời mời giữ MOI_GIAY giây. Anh 06/11 "nếu người đã có pt rồi, tổ đội khác pt thì vẫn hiện lời mời dưới dạng icon": mời được cả người đang có
// đội; người đó nhận thì kiểm tra hết điều kiện của đội mới trước, đủ mới rời đội cũ (đội trưởng rời -> giải tán như luật engine) rồi vào đội mới.
// Anh 06/11 chiều "nếu như em đang có pt thì người khác auto mời vẫn sẽ hiện chứ không phải chặn, nó sẽ hiện ở dạng cái icon thôi": Trợ Thủ tự
// mời (b.tu) cũng tới người đang có đội như mời tay (máy họ chỉ hiện biểu tượng — hud.js moiDoi).
// Rời game (không gửi nhịp) quá VANG_GIAY giây thì tự rời đội (tải lại trang / mất mạng ngắn vẫn giữ chỗ).
"use strict";

const TG = require("./the-gioi");
const TS = (() => { try { return require("../assets/data/thong-soai.json"); } catch { return { soNguoi: [], toiDa: 7 }; } })(); // cong-cu/dung-thong-soai.js

const MOI_GIAY = 60, VANG_GIAY = 60, BAO_GIU = 10;
// Lôi Đài (anh 15/11 — may-chu/loi-dai.js): trong sân không lập / mời / nhận tổ đội (vai trước, bãi sau); 716 cùng bên sân coi như cùng phe — nạp lúc dùng (tệp đó nạp tệp này)
let LD_ = null; const LD = () => LD_ || (LD_ = require("./loi-dai.js"));
const oSan = (tk) => LD().chan(tk, (TG.dangChoi(tk) || {}).zone);

const doi = new Map();    // id đội -> { id, truong: tài khoản, tv: [tài khoản] (đội trưởng đầu), mo: còn nhận người }
const cuaTk = new Map();  // tài khoản -> id đội
const loiMoi = new Map(); // tài khoản được mời -> [{ id, tu: tài khoản mời, luc }]
const thay = new Map();   // tài khoản -> lúc gửi nhịp cuối
const baoTk = new Map();  // tài khoản -> [câu]
let soId = 0;

const loi = (t) => { throw Object.assign(new Error(t), { code: 400 }); };
// tên hiện của tài khoản: nhân vật đang chơi; rời game rồi (quá VANG_GIAY tự ra đội…) thì tên nhân vật lần cuối thấy (anh 31/10: "rời pt nó hiện
// tên tài khoản, lỗi — lẽ ra nên hiện tên nhân vật")
const tenNv = new Map(); // tài khoản -> tên nhân vật lần cuối
const tenCua = (tk) => { const o = TG.dangChoi(tk); if (o && o.name) { tenNv.set(tk, o.name); return o.name; } return tenNv.get(tk) || tk; };
const doiCua = (tk) => doi.get(cuaTk.get(tk)) || null;
// số đội viên đội trưởng tk dẫn được (chưa tính đội trưởng) — theo cấp thống soái của nhân vật đang chơi
const sucDan = (tk) => Math.min(TS.toiDa || 7, TS.soNguoi[((TG.dangChoi(tk) || {}).lead || 1) - 1] || 3);
const vaoPhai = (tk) => (TG.dangChoi(tk) || {}).fac != null; // chưa vào phái = camp_begin của engine
function bao(tk, t) { const L = baoTk.get(tk) || []; L.push(t); if (L.length > BAO_GIU) L.shift(); baoTk.set(tk, L); }
const baoCa = (d, t, tru) => { for (const x of d.tv) if (x !== tru) bao(x, t); };

// đủ số đội viên theo sức thống soái của đội trưởng (KTeam::CheckFull)
const dayDoi = (d) => d.tv.length - 1 >= sucDan(d.truong);
function lapDoi(tk) {
  const d = { id: ++soId, truong: tk, tv: [tk], mo: true };
  doi.set(d.id, d); cuaTk.set(tk, d.id);
  return d;
}
function giaiDoi(d, cau, tru) {
  for (const x of d.tv) { cuaTk.delete(x); if (cau && x !== tru) bao(x, cau); }
  doi.delete(d.id);
}
// tk ra khỏi đội đang ở: đội trưởng ra -> giải tán (engine); đội viên ra -> báo cả đội (cauDoi)
function raDoi(tk, cauDoi) {
  const d = doiCua(tk); if (!d) return;
  if (d.truong === tk) return giaiDoi(d, `${tenCua(tk)} giải tán nhóm!`, tk);
  cuaTk.delete(tk); d.tv = d.tv.filter((x) => x !== tk);
  if (!dayDoi(d)) d.mo = true; // engine KTeam::DeleteMember: chưa đủ người thì mở lại
  if (cauDoi) baoCa(d, cauDoi);
}
// dọn: lời mời quá hạn, người rời game quá VANG_GIAY giây
function don(t) {
  for (const [tk, L] of loiMoi) { const con = L.filter((m) => t - m.luc < MOI_GIAY * 1000); if (con.length) loiMoi.set(tk, con); else loiMoi.delete(tk); }
  for (const tk of [...cuaTk.keys()]) if (cuaTk.has(tk) && t - (thay.get(tk) || 0) > VANG_GIAY * 1000) raDoi(tk, `${tenCua(tk)} rời khỏi nhóm.`);
}

function cua(tk) {
  const t = Date.now(); thay.set(tk, t); don(t);
  const d = doiCua(tk), moi = (loiMoi.get(tk) || []).map((m) => ({ id: m.id, tu: tenCua(m.tu), het: Math.max(0, Math.ceil((MOI_GIAY * 1000 - (t - m.luc)) / 1000)) })), b = baoTk.get(tk);
  baoTk.delete(tk);
  if (!d && !moi.length && !b) return null;
  return {
    ...(d ? { truong: tenCua(d.truong), mo: d.mo && !dayDoi(d) ? 1 : 0, toiDa: 1 + sucDan(d.truong), tv: d.tv.map((x) => { const o = TG.dangChoi(x); return { ten: tenCua(x), lvl: o ? o.lvl : 0, fac: o ? o.fac : null, zone: o ? o.zone : -1, ...(o && o.chung ? { c: 1 } : {}), on: o ? 1 : 0, ...(o ? { hp: o.hp, mp: o.mp } : {}) }; }) } : {}),
    moi, ...(b ? { bao: b } : {}),
  };
}

function lam(tk, b) {
  const t = Date.now(); thay.set(tk, t); don(t);
  if (!TG.dangChoi(tk)) loi("Chưa vào game");
  const d = doiCua(tk), toi = tenCua(tk);
  const nguoi = (ten) => { const x = TG.timTen(String(ten || "").trim()); if (!x) loi(`Không tìm thấy người chơi ${ten || ""} đang trong game`); return x; };
  const laTruong = () => { if (!d) loi("Bạn chưa có đội ngũ"); if (d.truong !== tk) loi("Chỉ nhóm trưởng mới làm được"); };
  let msg = "";
  switch (b.viec) {
    case "lap":
      if (d) loi("Bạn đã có đội ngũ");
      if (oSan(tk)) loi("Đang ở lôi đài — không lập nhóm được");
      lapDoi(tk); msg = "Bạn sáng lập nên một nhóm mới";
      break;
    case "moi": {
      const x = nguoi(b.ten);
      if (x === tk) loi("Không thể mời chính mình");
      if (oSan(tk)) loi("Đang ở lôi đài — không mời người vào nhóm được");
      if (oSan(x)) loi(`${tenCua(x)} đang ở lôi đài — không mời vào nhóm được`);
      if (d && d.truong !== tk) loi("Chỉ nhóm trưởng mới mời được người vào nhóm");
      if (d && dayDoi(d)) loi(`Nhóm đã đủ người — sức thống soái của Bạn dẫn được ${sucDan(tk)} đội viên`);
      if (!vaoPhai(tk) && vaoPhai(x)) loi("Người mới chơi không thể mời được người của tổ đội khác"); // CheckAddCondition: đội trưởng chưa vào phái
      if (d && d.tv.includes(x)) loi(`${tenCua(x)} đã ở trong nhóm của Bạn`);
      // Trợ Thủ tự mời (b.tu — main.js mỗi 3 giây mời người quanh mình) cũng tới người đã có đội như mời tay (anh 06/11 chiều "người khác auto mời
      // vẫn sẽ hiện chứ không phải chặn, nó sẽ hiện ở dạng cái icon thôi" — trước bỏ qua người có đội ≥ 2 người)
      const L = (loiMoi.get(x) || []).filter((m) => m.tu !== tk);
      L.push({ id: ++soId, tu: tk, luc: t }); loiMoi.set(x, L);
      if (!d) { lapDoi(tk); bao(tk, "Bạn sáng lập nên một nhóm mới"); }
      msg = `Đã gửi lời mời tới ${tenCua(x)}`;
      break;
    }
    case "nhan": {
      const L = loiMoi.get(tk) || [], m = L.find((v) => v.id === (b.id | 0));
      loiMoi.set(tk, L.filter((v) => v !== m));
      if (!m) loi("Lời mời đã hết hạn");
      if (oSan(tk)) loi("Đang ở lôi đài — không vào nhóm được");
      if (oSan(m.tu)) loi(`${tenCua(m.tu)} đang ở lôi đài — không vào nhóm được`);
      // anh 06/11: kiểm tra hết điều kiện của đội mới TRƯỚC — không đủ thì giữ nguyên đội cũ
      if (!TG.dangChoi(m.tu)) loi(`${tenCua(m.tu)} đã rời game`);
      let dm = doiCua(m.tu);
      if (dm && dm.truong !== m.tu) loi(`${tenCua(m.tu)} không còn là nhóm trưởng`);
      if (dm && dm === d) loi("Bạn đã ở trong nhóm này");
      if (dm && dayDoi(dm)) loi("Nhóm đã đủ người");
      if (!vaoPhai(m.tu) && vaoPhai(tk)) loi("Người mới chơi không thể mời được người của tổ đội khác");
      // đủ điều kiện: rời đội đang ở (nhóm 1 người: bỏ; đội trưởng: giải tán — raDoi; đội viên: cả đội nghe "<tên> rời khỏi nhóm.")
      if (d) raDoi(tk, d.tv.length > 1 ? `${toi} rời khỏi nhóm.` : "");
      if (!dm) dm = lapDoi(m.tu);
      baoCa(dm, `${toi} trở thành bằng hữu của nhóm Bạn.`);
      dm.tv.push(tk); cuaTk.set(tk, dm.id); loiMoi.delete(tk);
      if (dayDoi(dm)) dm.mo = false; // đủ người: đóng (KTeam::SetTeamClose — hết cờ)
      msg = `Bạn gia nhập nhóm của ${tenCua(dm.truong)}.`;
      break;
    }
    case "tuChoi": {
      const L = loiMoi.get(tk) || [], m = L.find((v) => v.id === (b.id | 0));
      loiMoi.set(tk, L.filter((v) => v !== m));
      if (m) bao(m.tu, `${toi} cự tuyệt lời mời của nhóm Bạn!`);
      break;
    }
    case "roi":
      if (!d) loi("Bạn chưa có đội ngũ");
      msg = d.truong === tk ? "Bạn đã giải tán nhóm của mình" : "Bạn đã rời khỏi nhóm.";
      raDoi(tk, `${toi} rời khỏi nhóm.`);
      break;
    case "duoi": {
      laTruong();
      const x = nguoi(b.ten);
      if (x === tk || !d.tv.includes(x)) loi("Người này không ở trong nhóm");
      raDoi(x); bao(x, "Bạn bị khai trừ khỏi nhóm"); baoCa(d, `${tenCua(x)} bị khai trừ khỏi nhóm`, tk);
      msg = `${tenCua(x)} bị khai trừ khỏi nhóm`;
      break;
    }
    case "giao": {
      laTruong();
      const x = nguoi(b.ten);
      if (x === tk || !d.tv.includes(x)) loi("Người này không ở trong nhóm");
      if (vaoPhai(tk) && !vaoPhai(x)) loi("nhóm của Bạn không thể chuyển giao cho người mới");
      if (d.tv.length - 1 > sucDan(x)) loi(`${tenCua(x)} không đủ sức thống soái!`);
      d.truong = x; d.tv = [x, ...d.tv.filter((v) => v !== x)];
      bao(x, `Bạn được ${toi} đảm nhận là nhóm trưởng!`);
      for (const v of d.tv) if (v !== x && v !== tk) bao(v, `${tenCua(x)} được đảm nhận là nhóm trưởng`);
      msg = `${tenCua(x)} được đảm nhận là nhóm trưởng`;
      break;
    }
    case "mo": // ô "Lập nhóm" của đội trưởng: mở / đóng nhận người (câu client MSG_TEAM_OPEN / CLOSE — bản dịch 2 câu như nhau, câu mở viết lại)
      laTruong();
      if (b.on && dayDoi(d)) loi("Nhóm đã đủ người");
      d.mo = !!b.on;
      msg = d.mo ? "Nhóm của Bạn hiện giờ được phép tiếp nhận thêm hội viên mới" : "Nhóm của Bạn hiện giờ không được phép tiếp nhận thêm hội viên mới";
      break;
    case "giai":
      laTruong();
      giaiDoi(d, `${toi} giải tán nhóm!`, tk); msg = "Bạn đã giải tán nhóm của mình";
      break;
    default: loi("Việc này chưa có");
  }
  return { doi: cua(tk), msg };
}

const idCua = (tk) => cuaTk.get(tk) || null;
function thanhVien(tk) { const d = doiCua(tk); return d ? { truong: d.truong, tv: [...d.tv] } : null; }
function coMo(tk) { const d = doiCua(tk); return !!d && d.truong === tk && d.mo && !dayDoi(d); }

// Bùa lợi dùng lên đồng đội (anh 02/11 "thêm tùy chọn buff bùa lợi cho đồng đội trong pt" — Trợ Thủ, src/game/world.js buaDoi): kênh tức thời
// { t: "buaDoi", ten: tên đồng đội, id, lv } -> người đó { t: "buaDoi", tu, id, lv } (máy họ cộng bùa — world.js buaTuDoi). Chỉ cùng đội, cùng
// bãi; chỉ các bùa client cho dùng lên người khác (skills.json target.ally: Côn Lôn 171 Thanh Phong phù, 173 Thiên Thanh Địa Trọc, 178 Nhất Khí
// Tam Thanh; Thiếu Lâm 15 Bất Động Minh Vương; Nga My 93 Từ Hàng Phổ Độ); tối đa 1 tin / BUA_CACH ms mỗi người
// Anh 13/11 lượt 88: + 716 Võ Đang Xuất Ứ Bất Nhiễm — tác dụng vùng lên đồng đội quanh người dùng (trình duyệt vocong.js buaVungDoi): tin mang ds = [tên đồng đội] (≤ 8) thay
// ten; trong Tống Kim (vào trận là rời đội) đồng đội = người cùng phe trận (tong-kim.js pheCua)
const BUA_DOI = new Set([15, 93, 171, 173, 178, 716]), BUA_VUNG = new Set([716]), BUA_CACH = 250;
// anh 18/11: ở bãi Vượt Ải ("ải") / Viêm Đế ("viêm đế") bùa lợi Côn Lôn 171 / 173 / 178 + Thiếu Lâm 15 Bất Động Minh Vương tự dùng thì đồng đội quanh người dùng cũng nhận
// (trình duyệt vocong.js BUA_VUNG_AI — tin mang ds như 716)
const BUA_VUNG_AI = new Set([15, 171, 173, 178]), BAI_VUNG_AI = new Set(["ải", "viêm đế"]);
const WS = require("./ws");
WS.nhan("buaDoi", (kn, m) => {
  const t = Date.now(), id = m.id | 0, lv = m.lv | 0;
  const Zv = require("./do.js").NOI.ZONES.get(kn.zone), vung = BUA_VUNG.has(id) || (BUA_VUNG_AI.has(id) && !!Zv && BAI_VUNG_AI.has(Zv.kind));
  const ds = vung && Array.isArray(m.ds) ? m.ds.filter((x) => typeof x === "string").slice(0, 8) : typeof m.ten === "string" ? [m.ten] : [];
  if (!BUA_DOI.has(id) || !(lv >= 1 && lv <= 40) || !ds.length || t - (kn.buaLuc || 0) < BUA_CACH) return;
  const d = doiCua(kn.ten), toi = TG.dangChoi(kn.ten); if (!toi) return;
  // bãi luyện công: bùa / hồi máu lên đồng đội chỉ ở bản quái chung (anh 06/11 "buff chỉ có thể cộng ở bãi quái chung" — trình duyệt World.chiaBuff)
  const N = require("./do.js").NOI, Z = N.ZONES.get(kn.zone); if (Z && N.FARM.has(Z.kind) && !kn.chung) return;
  const TKM = require("./tong-kim.js"), pheMinh = TKM.pheCua(kn.ten, kn.zone), ldMinh = LD().cpCua(kn.ten, kn.zone); // ldMinh: bên lôi đài 12 / 13 (người xem / bị hạ 0)
  kn.buaLuc = t;
  for (const ten of ds) {
    const den = TG.timTen(ten.slice(0, 32)), kn2 = den && WS.cua(den);
    if (!den || den === kn.ten || !kn2 || kn2.zone !== kn.zone || !kn2.chung !== !kn.chung || !require("./khu-bang.js").cungBan(kn.ten, den, kn.zone)) continue; // khác bản (riêng / quái chung) của bãi: không thấy nhau; khu vực bang: chỉ cùng bản (đợt 4)
    const cungDoi = !!d && d.tv.includes(den), cungPhe = (pheMinh != null && TKM.pheCua(den, kn.zone) === pheMinh) || (ldMinh >= 12 && LD().cpCua(den, kn.zone) === ldMinh); // Lôi Đài: cùng bên sân như cùng phe
    if (!cungDoi && !cungPhe) continue;
    kn2.gui({ t: "buaDoi", tu: toi.name, id, lv });
  }
});

// raDoi(tk, câu) — ra khỏi đội như "roi" (đội trưởng ra: giải tán); Tống Kim (may-chu/tong-kim.js): vào trận thì rời tổ đội
module.exports = { lam, cua, idCua, thanhVien, coMo, raDoi };
