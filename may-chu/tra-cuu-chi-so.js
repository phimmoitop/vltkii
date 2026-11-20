"use strict";
// Tra cứu — nhóm "Chỉ số & thuộc tính" (anh 13/11: "tra cứu hiệu quả các loại thuộc tính, mốc tốc đánh, mốc băng sát, mốc thời gian phục hồi, may
// mắn ntn — tất cả chỉ số, nếu có mốc thì phải ghi rõ, còn không có mốc thì ghi tác dụng"). Ghi đúng luật của BẢN MÌNH (đọc từ mã), không phải client gốc.
//   nhomChiSo(C) -> [Muc] (id "cs-…") cho tra-cuu.js (bước "chiso"); C = ngữ cảnh dựng của tra-cuu.js ({ N, CFG, KTC, F, … }).
// Số máy chủ có (cau-hinh.json — F10 đổi được: quaiVoCong, mayManToiDa, dongXanh, roiDo, noiCong, tanThu, tangIchDoi, doBen) đọc từ C.CFG mỗi lần dựng.
// Hằng số chỉ có ở trình duyệt (src/game/*.js — ES module, máy chủ không nạp) hoặc nằm trong module máy chủ mà không xuất ra (may-chu/do.js HAO,
// may-chu/da-tau.js taoThuong) chép thành hằng bên dưới, ghi tệp nguồn: sửa bên đó thì sửa cả đây.
// Tính từ dữ liệu (soát 13/11 lần 2 theo 2 bản soát): số chiêu cấp 1 / 10 / 20 (hồi chiêu, chiêu đánh nhiều nhát, chiêu dùng chính xác, làm choáng,
// sinh lực / nội lực %, kháng, bùa hại lên quái, hộ thân, Lưỡng Nghi Chân Khí, thời gian đóng băng) từ assets/web/skill/skills.json +
// assets/web/vocong/vocong.json (kèm chỉnh riêng SUA_DONG); ô / hệ / khoảng số của dòng xanh từ assets/data/dong-xanh.json; chỉ số ngựa từ
// assets/data/do-goc.json; hệ số nhân vật từ assets/data/char.json; thuốc từ C.KTC (ky-tran-cac.json). Số chiêu còn ghi tay trong chữ (bảng tốc đánh
// võ công…) chép từ skills.json đã qua chỉnh riêng của S1 (src/game/vocong.js SUA — vd Vô Hình Độc, Nộ Lôi Chỉ; Ngũ Độc Kỳ Kinh về số client 17/11). Chữ chỉ dùng thẻ <y> <g> <c>
// (như tra-cuu.js). Mục nào lỗi thì console.error rồi bỏ mục đó, mục khác vẫn còn.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const loiGhi = (ai, e) => console.error(`Tra cứu — ${ai}:`, (e && (e.stack || e.message)) || e);
// tài sản tĩnh — đọc 1 lần
const T0 = {};
function tep(f) {
  if (f in T0) return T0[f];
  let v = null;
  try { v = JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")); } catch (e) { loiGhi(`chỉ số — không đọc được ${f}`, e); }
  return (T0[f] = v);
}

// ---------- hằng số của trình duyệt ----------
const KHUNG = 18;                     // khung mỗi giây (src/game/rules.js TICK = 1 / 18)
const KHUNG_DON = 18;                 // khung gốc 1 đòn / 1 lần thi pháp (src/game/rules.js atkFrames, vocong.js CAST_T — basevalue.ini AttackFrame)
const HIT_AT = 0.55;                  // đòn / chiêu ra ở 55 % động tác (src/game/world.js, vocong.js HIT_AT)
const TOC_AM = -90;                   // atkFrames chặn tốc độ âm (src/game/rules.js)
const TV_SLOW = 1.25;                 // chiêu Thiên Vương đánh nhiều nhát chậm thêm (src/game/vocong.js TV_SLOW)
const DASH_V = 31;                    // Đoạn Hồn Thích lướt mỗi khung (src/game/vocong.js DASH_V; dashN = WaitTime + genData + 2)
const RUN_GOC = 10;                   // tốc độ chạy gốc (src/game/world.js RUN, windows.js ô Chạy)
const KC = { toc: 12, tam: 400, phi: 50 }; // Khinh công: đơn vị / khung, tầm, thể lực (src/game/world.js khinhCong, vocong.js KC_PHI)
const HURT_T = 12;                    // khung giật gốc (src/game/vocong.js HURT_T — basevalue.ini HurtFrame)
const SLOW_K = 0.5, CHAM_MIN = 60;    // làm chậm: còn 50 %, sàn 60 khung khi mình làm chậm quái (src/game/vocong.js SLOW_K, CHAM_MIN)
const SLOW_T = 18;                    // quái có võ công tắt: băng sát làm quái chậm 18 khung × (1 + Thời gian đóng băng %) (src/game/vocong.js SLOW_T, slowMob)
const KHANG_TRAN = 75, KHANG_TOI_DA = 95; // src/game/rules.js PLAYER_RES_MAX, KHANG_TOI_DA (khangThat)
const QUAI_TRAN = 95;                 // trần kháng của quái khi tính chiêu, trước phần bùa trừ trần (src/game/vocong.js mobRes)
const QUAI_TOC = { chia: 200, danhSan: 0.3, chaySan: 0.2 }; // bùa giảm tốc lên quái: tốc đánh ÷ 200, hệ số ≥ 0,3; tốc chạy ≥ 0,2 (src/game/vocong.js mobAtkK, mobSpeedK)
const HIT_MIN = 5, HIT_MAX = 95;      // src/game/rules.js hitPercent
const DIEM_LUC = 5;                   // Sức mạnh / 5 (ám khí: Thân pháp / 5) cộng lực tay (src/game/rules.js STR_PER_DMG, DEX_PER_DMG)
const DIEM_CAP = 5;                   // điểm tiềm năng mỗi cấp (src/game/rules.js PTS_PER_LEVEL)
const NGOI = { sinh: 6, noi: 9 };     // ngồi thiền: % tối đa mỗi giây (src/game/world.js updateHero)
const HO_THAN = { chia: 5, toiDa: 40 }; // Nội lực hộ thân +N điểm: N / 5 mỗi đòn, tối đa 40 % đòn (src/game/world.js hit)
const DOC_DON = { nhip: 10, khung: 60 }; // độc của đồ khi đòn không có độc riêng (src/game/world.js docDon)
const DOC_QUAI = { khung: 60, nhip: 10 }; // chiêu độc của quái (poisondamage_v cột 2 / 3 — vocong.js vcCua mặc định 60 / 10)
const LUONG_NGHI_HP = 25;             // chiêu tự phát khi sinh lực dưới 25 % (src/game/world.js hit — autorescueskill)
// chỉnh riêng của bản mình lên số chiêu mà trang này tính từ skills.json (src/game/vocong.js SUA — chỉ các dòng dùng ở đây): Vô Hình Độc làm chậm
// client −10 → −42 % thu theo tỉ lệ còn −5 → −20 % (VHD)
const VHD = (x) => Math.round((x * 20) / 42);
const SUA_DONG = { 69: { fastwalkrun_p: VHD }, 203: { fastwalkrun_p: VHD } };

// ---------- hằng số máy chủ không xuất ra ----------
// hao mòn: 1 phần N mỗi lần × cau-hinh.json doBen.haoMon (may-chu/do.js HAO): danh = ra đòn / ra chiêu, trung = bị đánh trúng mất máu, di = sang vùng bản đồ khác
const HAO = { danh: { Weapon: 256 }, trung: { Cap: 320, Cloth: 320, Sash: 320, Bangle: 320 }, di: { Shoes: 2560, Horse: 5120 } };
const TEN_O = { Weapon: "Vũ khí", Cap: "Nón", Cloth: "Y phục", Sash: "Thắt lưng", Bangle: "Hộ uyển", Shoes: "Hài", Horse: "Ngựa" };
const VIEC_HAO = { danh: "mỗi lần ra đòn / ra chiêu", trung: "mỗi lần bị đánh trúng mất máu (độc không tính)", di: "mỗi lần đi sang vùng mới của bản đồ" };
// Dã Tẩu: giá trị dùng chọn phần thưởng × (1 + may mắn × hệ số) — may-chu/da-tau.js taoThuong (vật phẩm 0,001; thử vận 0,03; may mắn 0 tính như 1)
const DA_TAU_MM = { vat: 0.001, thuVan: 0.03 };

const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const PHAI = { shaolin: "Thiếu Lâm", tianwang: "Thiên Vương", tangmen: "Đường Môn", wudu: "Ngũ Độc", emei: "Nga My", cuiyan: "Thúy Yên",
  gaibang: "Cái Bang", tianren: "Thiên Nhẫn", wudang: "Võ Đang", kunlun: "Côn Lôn" };

// ---------- định dạng ----------
// số -> "0,44", "3", "12,5" (bỏ số 0 thừa)
const sx = (n, d = 2) => { const s = (Math.round(Number(n) * 10 ** d) / 10 ** d).toFixed(d); return (s.includes(".") ? s.replace(/\.?0+$/, "") : s).replace(".", ","); };
const fx = (n, d) => Number(n).toFixed(d).replace(".", ",");
const so = (n) => (Number(n) || 0).toLocaleString("vi-VN"); // 1172 -> "1.172"
const giay = (k, d = 2) => `${sx(k / KHUNG, d)} giây`;
const thoiGian = (s) => (s >= 3600 && s % 3600 === 0 ? `${s / 3600} giờ` : s >= 60 && s % 60 === 0 ? `${s / 60} phút` : `${s} giây`);
const heChu = (L) => L.map((i) => HE[i] || "?").join(", ");
// số có dấu: âm ghi "−", cong = ghi "+" cho số dương; số nguyên từ 1.000 có dấu chấm ngăn nghìn
const am = (x, cong = false) => { const a = Math.abs(x), t = a >= 1000 && Number.isInteger(a) ? so(a) : sx(a); return x < 0 ? `−${t}` : `${cong && x > 0 ? "+" : ""}${t}`; };
// [a, b, c] (cấp 1 / 10 / 20) -> "a/b/c" + đơn vị (3 số bằng nhau: 1 số); null -> "?"
const baChu = (L, dv = "", cong = false) => (L ? `${new Set(L.map((x) => am(x, cong))).size === 1 ? am(L[0], cong) : L.map((x) => am(x, cong)).join("/")}${dv}` : "?");
// "a, b và c" (noi = "hoặc"…)
const va = (L, noi = "và") => (L.length > 1 ? `${L.slice(0, -1).join(", ")} ${noi} ${L[L.length - 1]}` : L.join(""));
// gộp chiêu cùng số: [{ ten }] + f(x) -> "Tên A (Phái), Tên B (Phái) số; Tên C (Phái) số"
const gop = (L, f) => { const m = new Map(); for (const x of L) { const v = f(x); m.set(v, [...(m.get(v) || []), x.ten]); } return [...m].map(([v, t]) => `${t.join(", ")} ${v}`).join("; "); };
// [nhỏ, lớn] -> "+5 đến +800" / "−10 đến −320" (số nhỏ về độ lớn trước)
const khoang = (a, dv = "") => {
  if (!a) return "?";
  const [x, y] = Math.abs(a[0]) <= Math.abs(a[1]) ? a : [a[1], a[0]], f = (n) => (n < 0 ? `−${so(-n)}` : `+${so(n)}`);
  return x === y ? `${f(x)}${dv}` : `${f(x)}${dv} đến ${f(y)}${dv}`;
};

// ---------- luật đang chạy (C.CFG) ----------
// quái có võ công: mặc định như src/game/vocong.js (C.giat ?? 25, cham ?? 60, hieuUngToiDa ?? 27, tglcToiDa ?? 77, docPct ?? 50); bật như may-chu/do.js LUAT
function quaiVC(C) {
  const Q = ((C && C.CFG) || {}).quaiVoCong || {};
  return {
    bat: process.env.VL_QUAI_VO_CONG === "1" || !!Q.bat,
    giat: Number(Q.giat ?? 25), giatHe: Array.isArray(Q.giatHe) ? Q.giatHe.map(Number) : null,
    cham: Number(Q.cham ?? 60), T: Number(Q.hieuUngToiDa ?? 27), tglc: Number(Q.tglcToiDa ?? 77), docPct: Number(Q.docPct ?? 50),
    choangLoi: Array.isArray(Q.choangLoi) && Q.choangLoi.length >= 2 ? Q.choangLoi.map(Number) : null,
    tanSuat: (Array.isArray(Q.tanSuat) ? Q.tanSuat : []).filter((x) => Array.isArray(x)).map((x) => [Number(x[0]), Number(x[1])]).sort((a, b) => a[0] - b[0]),
  };
}
const tatQVC = (Q) => (Q.bat ? null : { p: "<c>Hiện máy chủ đang tắt quái có võ công</c>: quái chỉ đánh đòn thường vật lý, không gây giật / chậm / choáng / độc." });
// % sát thương chiêu nội công mỗi điểm Nội công (may-chu/do.js LUAT noiCong -> src/game/vocong.js noiK)
const noiCongPt = (C) => +((((C && C.CFG) || {}).noiCong || {}).phanTram) || 0;
const tanThu = (C) => ((C && C.CFG) || {}).tanThu || null;
const tangIch = (C) => ((C && C.CFG) || {}).tangIchDoi || null;

// ---------- dữ liệu chiêu ----------
// { db, sk, ds: [[khóa phái, [mã chiêu]]] } | null
function chieuDl() {
  const S = tep("assets/web/skill/skills.json"), V = tep("assets/web/vocong/vocong.json");
  if (!S || !S.skills) return null;
  return { db: S.skills, sk: (V && V.sk) || {}, ds: (S.factions || []).map((f) => [f.key, (f.skills || []).map(Number)]) };
}
const tenChieu = (s) => String((s && s.n) || "").replace(/\s+/g, " ").trim();
// dòng k của chiêu s ở cấp lv (như src/game/vocong.js lvAttrs)
const dongCap = (s, k, lv) => { const a = s && s.lv && s.lv[k]; if (!Array.isArray(a) || !a.length || lv < 1) return null; return a[Math.min(a.length, lv) - 1] || null; };
// số dòng k (1 khóa hoặc mảng khóa — cộng lại; cột c của [p1, p2, p3]) của chiêu id ở cấp 1 / 10 / 20 -> [a, b, c] | null (đã qua SUA_DONG ở cột 1); f: đổi số
function ba(D, id, k, c = 0, f = (x) => x) {
  const s = D && D.db[id], K = Array.isArray(k) ? k : [k];
  if (!s || !s.lv || !K.some((x) => s.lv[x])) return null;
  return [1, 10, 20].map((lv) => f(K.reduce((t, x) => {
    const v = dongCap(s, x, lv), g = c === 0 && (SUA_DONG[id] || {})[x], n = (v && +v[c]) || 0;
    return t + (g ? g(n) : n);
  }, 0)));
}
// chiêu của các phái có dòng k khác 0: dich = chiêu đánh địch (bùa hại, chiêu tấn công) / lên mình (bị động, bùa, vòng sáng)
// -> [{ ten: "Tên (Phái[, vòng sáng])", L: [a, b, c], s, id, phai }]
function chieuCo(D, k, dich = false, c = 0) {
  const out = [];
  if (D) for (const [key, ids] of D.ds) for (const id of ids) {
    const s = D.db[id]; if (!s || !!(s.target && s.target.enemy) !== dich) continue;
    const L = ba(D, id, k, c); if (L && L.some((x) => x)) out.push({ ten: `${tenChieu(s)} (${PHAI[key] || key}${s.aura ? ", vòng sáng" : ""})`, L, s, id, phai: key });
  }
  return out;
}
// chiêu tự phát khi sinh lực thấp (autorescueskill — Côn Lôn Lưỡng Nghi Chân Khí): [(mã << 8) + cấp, −1, (khung chờ << 8) + tỉ lệ %] (src/game/vocong.js
// trigAuto) + khiên của chiêu được phát (staticmagicshield_p [sát thương đỡ mỗi điểm nội lực × 100, khung] — vocong.js shieldTake)
// -> { ten, phai, req, L: [{ tl, cho, do, khung }] (cấp 1 / 10 / 20) } | null
function luongNghi(D) {
  if (D) for (const [key, ids] of D.ds) for (const id of ids) {
    const s = D.db[id]; if (!s || !s.lv || !s.lv.autorescueskill) continue;
    const L = [1, 10, 20].map((lv) => {
      const v = dongCap(s, "autorescueskill", lv); if (!v || !(v[0] >> 8)) return null;
      const c = D.db[(v[0] >> 8) & 0xffff], sh = c && dongCap(c, "staticmagicshield_p", v[0] & 0xff);
      return sh ? { tl: v[2] & 0xff, cho: v[2] >> 8, do: sh[0] / 100, khung: sh[1] } : null;
    });
    if (L.every(Boolean)) return { ten: tenChieu(s), phai: PHAI[key] || key, req: s.req, L };
  }
  return null;
}

// ---------- dòng xanh của đồ (assets/data/dong-xanh.json — như may-chu/do.js gieoDong: ra ở loại món có trọng số w > 0; hậu tố cần hệ món = se) ----------
const LOAI_MON = ["Vũ khí cận chiến", "Ám khí", "Y phục", "Nhẫn", "Dây chuyền", "Hài", "Thắt lưng", "Nón", "Hộ uyển", "Ngọc bội", "Ngựa"]; // mã loại món 0–10
const oChu = (o) => {
  const thieu = LOAI_MON.map((_, i) => i).filter((i) => !o.includes(i));
  return thieu.length <= 3 ? (thieu.length ? `mọi ô trừ ${va(thieu.map((i) => LOAI_MON[i].toLowerCase()))}` : "mọi ô") : va(o.map((i) => LOAI_MON[i]));
};
// dòng khóa k -> [{ he: [tên hệ], lo, hi, o: [loại món] }] gộp các hệ cùng khoảng số + cùng ô (tiền tố: he rỗng)
function dongDo(k) {
  const X = tep("assets/data/dong-xanh.json"), by = new Map();
  for (const r of (X && X.rows) || []) {
    if (!r || r.k !== k || !Array.isArray(r.w) || !Array.isArray(r.p) || !Array.isArray(r.p[0])) continue;
    const se = r.pre ? -1 : +r.se, x = by.get(se) || { se, lo: Infinity, hi: -Infinity, o: new Set() };
    x.lo = Math.min(x.lo, +r.p[0][0]); x.hi = Math.max(x.hi, +r.p[0][1]);
    r.w.forEach((w, t) => { if (w > 0) x.o.add(t); });
    by.set(se, x);
  }
  const g = new Map();
  for (const x of [...by.values()].sort((a, b) => a.se - b.se)) {
    if (!x.o.size) continue;
    const o = [...x.o].sort((a, b) => a - b), key = `${x.lo}|${x.hi}|${o.join(",")}`, y = g.get(key) || { he: [], lo: x.lo, hi: x.hi, o };
    if (x.se >= 0) y.he.push(HE[x.se] || "?");
    g.set(key, y);
  }
  return [...g.values()];
}
// -> "hệ Kim 2–10% (Y phục, Hài…); hệ Thủy và Thổ 2–15% (mọi ô trừ ngựa)" | null
const dongChu = (k, dv = "") => {
  const L = dongDo(k);
  return L.length ? L.map((y) => `${y.he.length ? `hệ ${va(y.he)} ` : ""}${y.lo === y.hi ? y.lo : `${y.lo}–${y.hi}`}${dv} (${oChu(y.o)})`).join("; ") : null;
};

// ---------- chỉ số ngựa (assets/data/do-goc.json horse:* — move, life (đã gộp lifemax_yan_v), stamina, def như src/game/itemdb.js equipStats) ----------
function ngua() {
  const G = tep("assets/data/do-goc.json"), I = (G && G.items) || {}, r = { move: [], life: [], stamina: [], am: [], duong: [], lvAm: [], lvDuong: [] };
  let ben = false;
  for (const [k, x] of Object.entries(I)) {
    if (!/^horse:/.test(k) || !x) continue;
    for (const f of ["move", "life", "stamina"]) if (+x[f]) r[f].push(+x[f]);
    if (+x.def < 0) { r.am.push(+x.def); r.lvAm.push(+x.lv || 0); } else if (+x.def > 0) { r.duong.push(+x.def); r.lvDuong.push(+x.lv || 0); }
    if ((x.base || []).some((b) => b && b[0] === "durability_v")) ben = true;
  }
  const k = (L) => (L.length ? [Math.min(...L), Math.max(...L)] : null);
  return { move: k(r.move), life: k(r.life), stamina: k(r.stamina), am: k(r.am), duong: k(r.duong), lvAm: k(r.lvAm), lvDuong: k(r.lvDuong), ben };
}
const capChu = (a) => (!a ? "" : a[0] === a[1] ? `cấp ${a[0]}` : `cấp ${a[0]}–${a[1]}`);

// ---------- thuốc Kỳ Trân Các (ngoài Tống Kim) có dòng thỏa loc(trạng thái) -> ["Tên (mô tả, thời gian)"] ----------
function thuoc(C, loc) {
  const K = (C && C.KTC) || {}, B = K.buff || {}, out = [], da = new Set();
  for (const x of Object.values(K.items || {})) {
    const D = x && x.dung, b = D && D.loai === "trangThai" && D.buff, T = b && B[b];
    if (!T || da.has(b) || T.tk || /^tk[A-Z]/.test(b) || !loc(T)) continue;
    da.add(b);
    out.push(`${String(x.n || T.n || b).replace(/\s+/g, " ").trim()} (${String(T.d || "").trim()}${D.giay > 0 ? `, ${thoiGian(D.giay)}` : ""})`);
  }
  return out;
}
const coDong = (...k) => (T) => !!T.attrs && k.some((x) => T.attrs[x]);
const thuocChu = (L) => (L.length ? `Thuốc Kỳ Trân Các: ${L.join("; ")}.` : null);

// =====================================================================================================================
// MỤC
// =====================================================================================================================
function mucCachTinh(C) {
  const Q = quaiVC(C), L = Q.tanSuat;
  const ts = [];
  let tu = 1;
  for (const [cap, pc] of L) { ts.push(`cấp ${tu}–${cap - 1}: ${sx(pc)}% số đòn`); tu = cap; }
  const giatAi = Q.giatHe ? `quái hệ ${heChu(Q.giatHe)}` : "quái";
  const tsChu = L.length ? `Quái thường ra chiêu ở ${ts.join("; ")}; từ cấp ${tu}: mọi đòn. Thủ lĩnh và Boss Sát thủ ra chiêu mọi đòn. Đòn không phải chiêu là đòn thường vật lý: không gây chậm / choáng / độc, nhưng ${giatAi} vẫn có thể làm giật (mục Thời gian phục hồi).`
    : "Quái có võ công ra chiêu ở mọi đòn.";
  // độ bền (may-chu/do.js hao): mỗi lần mòn 1 điểm với xác suất haoMon / N; ô không có độ bền (ngựa) không mòn
  const DB = { haoMon: 1, ...(((C && C.CFG) || {}).doBen || {}) }, k = +DB.haoMon || 0, NG = ngua();
  const tl = (N) => (k >= N ? "mọi lần" : `${sx(k)}/${so(N)}`);
  const mon = [];
  for (const [viec, O] of Object.entries(HAO)) {
    const by = new Map();
    for (const [o, N] of Object.entries(O)) if (o !== "Horse" || NG.ben) by.set(N, [...(by.get(N) || []), TEN_O[o] || o]);
    for (const [N, ten] of by) mon.push(`${va(ten)} ${tl(N)} ${VIEC_HAO[viec]}`);
  }
  const vh = dongDo("indestructible_b").map((y) => oChu(y.o));
  const ben = k > 0
    ? [`Mòn 1 điểm với xác suất: ${mon.join("; ")}. Nhẫn, Dây chuyền, Ngọc bội${NG.ben ? "" : ", Ngựa"} không mòn.`]
    : ["Hiện máy chủ tắt hao mòn: đồ không mất độ bền."];
  ben.push(`Món có dòng “Không thể phá hủy” (tiền tố Vĩnh hằng${vh.length ? ` — ${vh.join("; ")}` : ""}) ở bất kỳ dòng nào, đã kích hay chưa, không bao giờ mòn.`,
    "Độ bền 0: vẫn mặc được nhưng mất hết chỉ số (cả may mắn) tới khi sửa.");
  return {
    id: "cs-cachtinh", ten: "Cách tính chỉ số", tom: "Đọc trước: khung, mốc, dòng ẩn, độ bền, quái có võ công",
    tim: "khung mốc dòng ẩn tiền tố hậu tố cộng dồn vòng sáng độ bền hao mòn sửa đồ không thể phá hủy vĩnh hằng quái võ công tần suất",
    noi: [
      { p: `Mọi số ở nhóm này theo đúng luật đang chạy của máy chủ. <y>1 khung = 1/${KHUNG} giây</y> (${KHUNG} khung = 1 giây).` },
      { ds: [
        `<y>Có mốc</y>: chỉ số chỉ có tác dụng khi chạm mốc, phần lẻ giữa 2 mốc không thêm gì (Tốc độ đánh, kháng vượt trần, số lần mất máu vì độc; lực tay mỗi ${DIEM_LUC} Sức mạnh, Né tránh mỗi 4 Thân pháp). Mục nào có mốc đều có bảng mốc.`,
        "<y>Không có mốc</y>: mỗi điểm đều có tác dụng — mục ghi công thức và ví dụ. Mục nào cũng ghi rõ có mốc hay không.",
        "Chỉ số cùng tên cộng dồn: đồ đang mặc + võ công (bị động, bùa, vòng sáng) + thuốc. Dòng ghi (Dương) cộng chung với dòng thường (trừ vài dòng ở mục Dòng chưa có tác dụng).",
        "Võ công bị động theo vũ khí (kiếm pháp, đao pháp…) chỉ có tác dụng khi cầm đúng loại vũ khí.",
        "Cùng một vòng sáng của mình và của đồng đội không cộng dồn: lấy cấp cao nhất.",
        "Bãi luyện công bản riêng: không nhận vòng sáng / bùa / hồi máu của người khác; bản quái chung, thành, Tống Kim… thì có.",
        "Ngựa chỉ cộng chỉ số khi đang cưỡi.",
      ] },
      { h: "Dòng xanh và dòng ẩn" },
      { ds: [
        "Dòng 1, 3, 5 (tiền tố) luôn có tác dụng.",
        "Dòng 2, 4, 6 (hậu tố) là dòng ẩn, phải được kích: kích 1 mở dòng 2, kích 2 mở dòng 2 và 4, kích 3 mở cả 3 (cách kích: mục Ngũ hành).",
        "Ô xem món: dòng đang có tác dụng màu xanh, dòng chưa kích màu xám.",
      ] },
      { h: "Độ bền" },
      { ds: ben },
      { h: "Quái có võ công" },
      ...(tatQVC(Q) ? [tatQVC(Q)] : []),
      { ds: [
        tsChu,
        `Thường gặp: quái hệ ${Q.giatHe ? heChu(Q.giatHe) : "nào cũng"} làm giật (mục Thời gian phục hồi), hệ Mộc đánh độc, hệ Thủy đánh băng làm chậm, hệ Thổ đánh lôi có thể làm choáng. Mỗi con quái mang 1 hệ.`,
        `Chậm / choáng / độc do quái gây kéo dài tối đa <y>${sx(Q.T)} khung</y> (${giay(Q.T)}) rồi mới trừ phần giảm của mình. Trong Tống Kim, chậm / choáng / độc do người hoặc bot phe kia gây cũng tối đa như vậy. Giật không bị giới hạn này.`,
      ] },
    ],
  };
}

function mucTocDanh(C) {
  const kh = (x) => Math.max(1, Math.floor((KHUNG_DON * 100) / (100 + Math.max(TOC_AM, x)))); // = src/game/rules.js atkFrames
  const moc = (n) => Math.floor((KHUNG_DON * 100) / (n + 1) - 100) + 1; // tốc độ nhỏ nhất để còn ≤ n khung
  const bang = [["Tốc độ %", "Khung", "Giây/đòn", "Đòn/giây"]];
  for (let n = KHUNG_DON; n >= 1; n--) {
    const lo = n === KHUNG_DON ? 0 : moc(n), hi = n > 1 ? moc(n - 1) - 1 : null;
    if (hi != null && hi < lo) continue;
    if (kh(lo) !== n || (hi != null && kh(hi) !== n)) throw new Error(`mốc tốc đánh lệch ở ${n} khung`);
    bang.push([hi == null ? `≥ ${lo}` : lo === hi ? String(lo) : `${lo} – ${hi}`, String(n), fx(n / KHUNG, 3), fx(KHUNG / n, 2)]);
  }
  const noi = [
    { p: "Có 2 chỉ số: <y>Tốc độ đánh - ngoại công</y> cho đòn thường (cả ám khí) và chiêu ngoại công; <y>Tốc độ đánh - nội công</y> cho chiêu nội công và bùa. Ô <y>Công kích</y> trên bảng nhân vật ghi 2 số này: ngoại công/nội công." },
    { p: `Mỗi đòn gốc dài ${KHUNG_DON} khung (1 giây). Số khung = phần nguyên của ${KHUNG_DON} × 100 ÷ (100 + tốc độ), nên tốc độ <y>chỉ có tác dụng khi chạm mốc</y> ở cột đầu — % nằm giữa 2 mốc không nhanh thêm. Đòn trúng ở ${sx(HIT_AT * 100)}% động tác, xong động tác là ra đòn kế ngay. Không có giới hạn trên.` },
    { bang },
    { p: "Ví dụ: vũ khí dòng “Tốc độ” 30% + Tâm Nhãn cấp 20 (79%) = 109% → 8 khung = 0,444 giây/đòn. Muốn xuống 7 khung cần 126% (thêm 17%). 13% và 20% cùng 15 khung nên 7% chênh lệch không có tác dụng." },
    { h: "Nguồn" },
    { ds: [
      "Vũ khí (cận chiến, ám khí) dòng tiền tố: “Tốc độ cao” 10%, “Cấp tốc” 20%, “Tốc độ” 30% (ngoại công); “Tốc độ cao (nội công)” 10%, “Tốc độ (nội công)” 20%.",
      ...[tangIchChu(C, "tốc đánh"), thuocChu(thuoc(C, coDong("attackspeed_v", "castspeed_v"))), "Tống Kim (chỉ trong trận): Phi Tốc hoàn, Lệnh Bài +50 cả 2 loại."].filter(Boolean),
    ] },
    { p: "Võ công, cấp 1 / 10 / 20:" },
    { bang: [["Võ công", "Ngoại công", "Nội công"],
      ["Tâm Nhãn (Đường Môn)", "29/52/79", "—"],
      ["Sương Ngạo Côn Lôn (Côn Lôn)", "25/43/65", "25/37/51"],
      ["Thái Cực Thần Công (Võ Đang)", "21/34/49", "21/34/49"],
      ["Phật Pháp Vô Biên (Nga My)", "12/28/46", "12/28/46"],
      ["Tiêu Diêu Công (Cái Bang)", "6/33/65", "6/33/65"],
      ["Tuyết ảnh (Thúy Yên)", "12/37/65", "12/37/65"],
      ["Như Lai Thiên Diệp (Thiếu Lâm)", "35/44/54", "—"],
      ["Thiên Ma Giải Thể (Thiên Nhẫn)", "2/20/40", "26/43/62"],
      ["Ngũ Độc Kỳ Kinh (Ngũ Độc)", "33/38/44", "33/38/44"]] }, // anh 17/11 tối: 32 (Dương) + tăng theo cấp 1 → 18 cả nội lẫn ngoại — cấp 30 = 50 / 50
  ];
  // chiêu đánh nhiều nhát (SkillStyle 1, MisslesForm 12) và chiêu lướt (MisslesForm 11) — src/game/vocong.js castStart, manyGap, dashN
  const D = chieuDl();
  if (D) {
    const nhieu = [["Chiêu", "Nhát", "Giây"]], luot = [];
    for (const [key, ids] of D.ds) for (const id of ids) {
      const s = D.db[id], k = D.sk[id];
      if (!s || !k || s.style !== 1) continue;
      if (k.form === 12 && k.genData > 0) {
        const nhip = k.genData * (key === "tianwang" ? TV_SLOW : 1), nhat = Math.max(1, k.num || 1);
        nhieu.push([`${tenChieu(s)} (${PHAI[key] || key})`, String(nhat), sx((nhat * nhip) / KHUNG, 2)]);
      } else if (k.form === 11) {
        const n = (k.wait || 0) + (k.gen === 1 ? k.genData || 0 : 0) + 2;
        luot.push(`${tenChieu(s)} (${PHAI[key] || key}): lướt tới mục tiêu ${DASH_V} đơn vị mỗi khung, tối đa ${n} khung (${DASH_V * n} đơn vị), tới nơi đánh ngay không vung tay — cũng không theo tốc độ đánh.`);
      }
    }
    if (nhieu.length > 1 || luot.length) {
      noi.push({ h: "Chiêu không theo tốc độ đánh" });
      if (nhieu.length > 1) {
        noi.push({ p: `Chiêu cận chiến đánh nhiều nhát dài cố định = số nhát × nhịp mỗi nhát; chiêu Thiên Vương chậm thêm ${sx((TV_SLOW - 1) * 100)}% (luật riêng của máy chủ). Tốc độ đánh bao nhiêu cũng không đổi:` });
        noi.push({ bang: nhieu });
      }
      for (const t of luot) noi.push({ p: t });
    }
  }
  noi.push({ p: "Đang bị làm chậm: mọi động tác dài gấp đôi (mục Làm chậm · Băng sát)." });
  return { id: "cs-tocdanh", ten: "Tốc độ đánh (mốc)", tom: "Bảng mốc khung mỗi đòn — tốc đánh ngoại công / nội công",
    tim: "tốc đánh tốc độ xuất chiêu công kích ngoại công nội công mốc khung đòn giây phi tốc tâm nhãn thiên vương", noi };
}
// tăng ích tổ đội (cau-hinh.json tangIchDoi — src/game/world.js tangIchDoi): chỉ ở bản quái chung của bãi luyện công, đội từ 2 người cùng bãi
function tangIchChu(C, cai) {
  const T = tangIch(C); if (!T) return null;
  const toc = +T.toc || 0, hoi = +T.hoi || 0;
  if (cai === "hồi" ? !hoi : !toc) return null;
  const v = cai === "hồi" ? `+${sx(hoi)} sinh lực và +${sx(hoi)} nội lực mỗi giây cho mỗi người cùng bãi (8 người: +${sx(8 * hoi)})` : `+${sx(toc)}% mỗi người cùng bãi (8 người: +${sx(8 * toc)}%), cộng cả tốc độ di chuyển lẫn tốc đánh ngoại công và nội công`;
  return `Tăng ích tổ đội (bản quái chung của bãi luyện công, đội từ 2 người cùng bãi): ${v}.`;
}

function mucHoiChieu() {
  const D = chieuDl(); if (!D) return null;
  const bang = [["Chiêu", "Hồi chiêu"]];
  let an = 0;
  // src/game/vocong.js castPay: skill_mintimepercast_v của cấp, không có thì TimePerCast (vocong.json tpc). Ô xem chiêu chỉ in dòng có trong lv
  // (src/game/skilltip.js) -> chiêu chỉ có tpc là hồi chiêu ẩn
  for (const [key, ids] of D.ds) for (const id of ids) {
    const s = D.db[id], k = D.sk[id] || {};
    if (!s) continue;
    const cd = [1, 10, 20].map((lv) => { const v = dongCap(s, "skill_mintimepercast_v", lv); return (v && v[0]) || k.tpc || 0; });
    if (!cd.some((x) => x > 0)) continue;
    const g = cd.map((x) => sx(x / KHUNG, x >= KHUNG ? 1 : 2)), ghi = !!(s.lv && s.lv.skill_mintimepercast_v);
    if (!ghi) an++;
    bang.push([`${tenChieu(s)} (${PHAI[key] || key})${ghi ? "" : " *"}`, `${new Set(g).size === 1 ? g[0] : g.join(" / ")} giây`]);
  }
  if (bang.length < 2) return null;
  return { id: "cs-hoichieu", ten: "Hồi chiêu", tom: "Hồi chiêu của từng chiêu (cả hồi chiêu ẩn); không có mốc",
    tim: "hồi chiêu thời gian khôi phục chiêu thức cooldown chờ dùng lại hồi chiêu ẩn",
    noi: [
      { p: `Chiêu có hồi chiêu phải chờ đủ thời gian đó mới dùng lại. Hồi chiêu tính từ lúc chiêu phát ra (${sx(HIT_AT * 100)}% động tác; chiêu lướt / di hình tính ngay lúc ra). Hồi chiêu cố định theo chiêu và cấp chiêu, <y>không có mốc</y>; hiện <y>không có chỉ số nào giảm hồi chiêu</y>; cưỡi ngựa hồi chiêu như đi bộ.` },
      { p: `Tốc độ đánh chỉ rút phần động tác (theo mốc ở mục Tốc độ đánh): ra liên tục 1 chiêu mất số khung lớn hơn giữa A và ${sx(HIT_AT)} × A + C, với A = khung động tác, C = khung hồi chiêu.` },
      { p: `Chiêu có hồi chiêu (3 số = cấp 1 / 10 / 20)${an ? ". <y>*</y> = hồi chiêu ẩn: ô xem chiêu không ghi “Thời gian khôi phục chiêu thức” nhưng vẫn phải chờ" : ""}:` },
      { bang },
      { p: "Chiêu không có trong bảng không có hồi chiêu." },
      { p: "Ví dụ: Sư Tử Hống hồi 3 giây (54 khung). 0% tốc độ nội công: 0,55 × 18 + 54 = 63,9 khung ≈ 3,55 giây mỗi lần; 101% (8 khung): 0,55 × 8 + 54 = 58,4 khung ≈ 3,24 giây." },
    ] };
}

function mucCham(C) {
  const Q = quaiVC(C), f0 = Math.min(Q.cham, Q.T), D = chieuDl();
  // khung băng lớn nhất của chiêu (colddamage_v cột 2 — src/game/vocong.js khungCham): không quá sàn 60 thì chiêu nào cũng tính 60 khung
  let bangMax = null;
  if (D) { bangMax = 0; for (const s of Object.values(D.db)) for (const v of (s && s.lv && s.lv.colddamage_v) || []) if (v && +v[1] > bangMax) bangMax = +v[1]; }
  const khungDb = (x) => (Q.bat ? CHAM_MIN + x : SLOW_T * (1 + x / 100)); // mình làm chậm quái: khungCham / slowMob (f == null)
  const db = [["Đóng băng", "Khung", "Giây"]];
  for (const x of [0, 16, 33, 47, 95]) db.push([x ? `+${x}` : "0", sx(khungDb(x), 1), sx(khungDb(x) / KHUNG)]);
  const minh = [["Làm chậm %", "Khung", "Giây"]];
  for (const x of [0, 20, 40, 60]) if (x < Q.tglc) minh.push([`${x}%`, sx((f0 * (100 - x)) / 100, 1), fx((f0 * (100 - x)) / 100 / KHUNG, 2)]);
  minh.push([`≥ ${sx(Q.tglc)}% (tối đa)`, sx((f0 * (100 - Q.tglc)) / 100, 1), fx((f0 * (100 - Q.tglc)) / 100 / KHUNG, 2)]);
  // nguồn Thời gian đóng băng (coldenhance_p) + bùa kéo dài chậm trên quái (freezetimereduce_p âm — slowMob, chỉ khi bật quái có võ công)
  const dbS = chieuCo(D, "coldenhance_p"), dbDo = dongChu("coldenhance_p", "%"), top = dbS.reduce((a, x) => (!a || x.L[2] > a.L[2] ? x : a), null);
  const keo = chieuCo(D, "freezetimereduce_p", true).filter((x) => x.L.some((v) => v < 0));
  const vd = top ? (Q.bat
    ? `Ví dụ: ${tenChieu(top.s)} cấp 20 → mỗi lần làm chậm ${CHAM_MIN} + ${sx(top.L[2])} = ${sx(khungDb(top.L[2]), 1)} khung ≈ ${giay(khungDb(top.L[2]))}.`
    : `Ví dụ: ${tenChieu(top.s)} cấp 20 (${sx(top.L[2])}) → ${SLOW_T} × ${sx(1 + top.L[2] / 100)} = ${sx(khungDb(top.L[2]), 1)} khung ≈ ${giay(khungDb(top.L[2]))}.`) : null;
  const vdT = 80, vdR = Math.min(vdT, Q.tglc), vdF = (f0 * (100 - vdR)) / 100;
  return { id: "cs-cham", ten: "Làm chậm · Băng sát", tom: "Băng sát không có mốc; Thời gian đóng băng; Thời gian làm chậm",
    tim: "băng sát mốc băng sát làm chậm đóng băng thời gian đóng băng thời gian trì hoãn thời gian làm chậm chậm chạy",
    noi: [
      { h: "Mình làm chậm quái" },
      { p: "<y>Băng sát không có mốc</y>: chỉ cần phần băng sát còn lại sau kháng băng của quái lớn hơn 0 (đòn thường: còn ít nhất 1 điểm) là quái bị chậm; băng sát nhiều hay ít không đổi thời gian chậm. Quái kháng băng từ 100% trở lên thì không bị chậm." },
      { p: `Mọi đòn trúng có phần băng sát (chiêu băng, đòn thường hay chiêu có Băng sát của đồ / võ công) làm quái chậm: chạy còn <y>${sx(SLOW_K * 100)}%</y>, khoảng nghỉ giữa 2 đòn của quái dài gấp đôi (động tác ra đòn của quái không chậm). ${Q.bat ? "Quái đang chậm thì trúng thêm <y>không làm mới</y> thời gian." : "Quái đang chậm mà trúng thêm thì kéo dài nếu lần mới hết muộn hơn."}` },
      Q.bat
        ? { p: `Thời gian chậm = số lớn hơn giữa khung băng của chiêu và <y>${CHAM_MIN} khung</y>, cộng <y>Thời gian đóng băng</y>. ${bangMax != null && bangMax <= CHAM_MIN ? `Mọi chiêu hiện có khung băng không quá ${CHAM_MIN} nên phần này luôn là ${CHAM_MIN} khung (${giay(CHAM_MIN)}). ` : ""}Thời gian đóng băng ghi % nhưng <y>mỗi 1 điểm = +1 khung</y> (1/${KHUNG} giây), không có mốc.` }
        : { p: `<c>Hiện máy chủ đang tắt quái có võ công</c>: thời gian chậm = ${SLOW_T} khung × (1 + Thời gian đóng băng % ÷ 100), không có mốc.` },
      { bang: db },
      { ds: [
        `<y>Thời gian đóng băng</y> (tên trong ô xem chiêu; bảng thuộc tính đồ của client gọi là “Thời gian trì hoãn”)${dbS.length ? `, cấp 1 / 10 / 20: ${dbS.map((x) => `${x.ten} ${baChu(x.L)}`).join("; ")}` : ""}. ${dbDo ? `Đồ: ${dbDo}.` : "Đồ không có dòng này."}`,
        ...(Q.bat && keo.length ? [`Quái dính bùa ${gop(keo, (x) => `bị chậm lâu hơn ×${baChu(x.L.map((v) => 1 - v / 100))}`)} ở cấp 1 / 10 / 20.`] : []),
      ] },
      ...(vd ? [{ p: vd }] : []),
      { h: "Quái làm chậm mình" },
      ...(tatQVC(Q) ? [tatQVC(Q)] : []),
      { p: `Quái ra chiêu băng trúng mình: chậm <y>${sx(f0, 1)} khung</y> (${giay(f0)}). Trong lúc chậm mọi động tác (đánh, ra chiêu, giật) dài gấp đôi, chạy còn một nửa. Đang chậm thì trúng thêm không làm mới.` },
      { p: `<y>Thời gian làm chậm</y> rút ngắn theo %, không có mốc, tối đa <y>${sx(Q.tglc)}%</y>:` },
      { bang: minh },
      { ds: [
        "Đồ: dòng hậu tố “Thời gian làm chậm” 20 / 30 / 40% — chỉ ra ở món hệ Hỏa (mọi ô trừ ngựa).",
        "Võ công: Thanh Âm Phạn Xướng (Nga My, vòng sáng) 1/14/30% ở cấp 1 / 10 / 20.",
        "Xuất ứ Bất Nhiễm (Võ Đang 120) xóa và miễn làm chậm trong thời gian bùa.",
      ] },
      { p: `Ví dụ: 2 món hệ Hỏa “Thời gian làm chậm 40%” = ${vdT}%${vdR < vdT ? `, chỉ tính ${sx(Q.tglc)}%` : ""}: mỗi lần chậm còn ${sx(vdF, 1)} khung ≈ ${fx(vdF / KHUNG, 2)} giây thay vì ${fx(f0 / KHUNG, 2)} giây.` },
    ] };
}

function mucPhucHoi(C) {
  const Q = quaiVC(C), bang = [["Phục hồi", "Khung", "Giây"]];
  for (const x of [0, 20, 40, 60, 80]) bang.push([String(x), sx((HURT_T * (100 - x)) / 100, 1), fx((HURT_T * (100 - x)) / 100 / KHUNG, 2)]);
  bang.push(["≥ 100", "0", "Không bị giật"]);
  return { id: "cs-phuchoi", ten: "Thời gian phục hồi", tom: "Rút ngắn lúc bị giật khi trúng đòn; từ 100 là không bị giật",
    tim: "thời gian phục hồi giật thọ thương ngất ngắt chiêu hit recover",
    noi: [
      ...(tatQVC(Q) ? [tatQVC(Q)] : []),
      { p: `${Q.giatHe ? `Chỉ quái <y>hệ ${heChu(Q.giatHe)}</y>` : "Quái có võ công"} làm nhân vật bị giật: mỗi đòn trúng (đòn thường hoặc chiêu, không tính độc) có <y>${sx(Q.giat)}%</y> bị giật (chiêu của quái có tỉ lệ riêng thì theo chiêu). Bị giật: đòn / chiêu đang vung bị hủy (chưa tới lúc ra chiêu thì không tốn nội lực) và đứng im một lúc.` },
      { p: `<y>Thời gian phục hồi</y> rút ngắn thời gian đứng im, <y>không</y> giảm tỉ lệ bị giật. Không có mốc: thời gian = ${HURT_T} khung × (100 − Thời gian phục hồi) ÷ 100. Từ <y>100</y> trở lên không bao giờ bị giật.` },
      { bang },
      { ds: [
        "Y phục dòng tiền tố: “Ngày bình thường” 20, “Ổn định” 30, “Cân đối” 40.",
        "Võ công, cấp 1 / 10 / 20: Thanh Âm Phạn Xướng (Nga My) 1/10/20; Phổ Độ Chúng Sinh (Nga My) 1/5/10; Băng Cốt Tuyết Tâm (Thúy Yên) 1/7/15; Thiên Ma Giải Thể (Thiên Nhẫn) 5/25/49.",
        "Đang bị làm chậm thì thời gian giật cũng dài gấp đôi. Đang Khinh công / lướt, hoặc có Xuất ứ Bất Nhiễm, thì không bị giật.",
      ] },
      { p: "Ví dụ: Y phục “Cân đối” 40 + Thanh Âm Phạn Xướng cấp 20 (+20) = 60 → mỗi lần giật chỉ đứng 0,27 giây thay vì 0,67 giây; tỉ lệ bị giật vẫn như cũ." },
    ] };
}

function mucMayMan(C) {
  const CFG = (C && C.CFG) || {}, mm = Number(CFG.mayManToiDa ?? 60) || 0;
  const DX = { muGiaTri: 2.7, mayManGiaTri: 0.5, ...(CFG.dongXanh || {}) }, RD = { quaiThuong: 0.01, trum: 0.2, ...(CFG.roiDo || {}) };
  // may-chu/do.js soTrongKhoang: thấp + (cao − thấp + 1) × ngẫu nhiên ^ (muGiaTri / (1 + may mắn / 100 × mayManGiaTri)) -> vị trí trung bình 1 / (số mũ + 1)
  const tb = (L) => 1 / (1 + Number(DX.muGiaTri) / (1 + (Math.min(Math.max(0, L), mm) / 100) * Number(DX.mayManGiaTri)));
  const bang = [["May mắn", "Tỉ lệ rơi", "Dòng xanh TB"]];
  const moc = []; for (let L = 0; L < mm; L += 10) moc.push(L); moc.push(mm);
  for (const L of moc) bang.push([String(L), `× ${sx(1 + L / 100, 2)}`, `≈ ${sx(tb(L) * 100, 1)}%`]);
  const pr = (p) => `${sx(p * 100, 2)}%`;
  const mon = thuoc(C, (T) => T.mayMan > 0);
  const vdL = 40;
  return { id: "cs-mayman", ten: "May mắn", tom: `Tăng tỉ lệ rơi trang bị và dòng xanh cao hơn; tính tối đa ${mm}`,
    tim: "may mắn rơi đồ tỉ lệ rơi dòng xanh luck thiên sơn bảo lộ quế hoa tửu dã tẩu thử vận",
    noi: [
      { p: `May mắn = tổng dòng <y>May mắn</y> đang có tác dụng của đồ + thuốc. Chỉ tính tối đa <y>${mm}</y>; vượt ${mm} không thêm gì (trừ nhiệm vụ Dã Tẩu, xem dưới). Không có mốc.` },
      { h: "Tác dụng" },
      { ds: [
        `Tỉ lệ rơi trang bị × (1 + May mắn ÷ 100): quái thường ${pr(RD.quaiThuong)} → ${pr(RD.quaiThuong * (1 + mm / 100))}, thủ lĩnh ${pr(RD.trum)} → ${pr(Math.min(1, RD.trum * (1 + mm / 100)))} ở ${mm} may mắn; tinh anh cũng nhân như vậy.`,
        "Dòng xanh của trang bị rơi từ quái và mở từ Bảo rương đồ xanh vẫn lệch về phía thấp của khoảng dòng, may mắn chỉ làm <y>bớt lệch</y>: vị trí trung bình nhích lên một chút (bảng dưới); mức cao nhất vẫn hiếm. Không thêm số dòng.",
        "Boss Sát thủ: món đặc biệt mỗi lượt và bảng món mỗi boss × (1 + May mắn ÷ 100).",
        `Nhiệm vụ Dã Tẩu: may mắn của đồ đang mặc (không tính thuốc, không giới hạn; 0 thì tính như 1). Giá trị dùng chọn phần thưởng vật phẩm × (1 + May mắn × ${sx(DA_TAU_MM.vat * 100, 1)}%), phần “thử vận” × (1 + May mắn × ${sx(DA_TAU_MM.thuVan * 100)}%) — giá trị cao thì dễ ra món đắt. Ví dụ ${vdL} may mắn: vật phẩm +${sx(vdL * DA_TAU_MM.vat * 100)}%, thử vận +${sx(vdL * DA_TAU_MM.thuVan * 100)}%.`,
        "Ủy thác: chỉ tính may mắn của đồ.",
        "Không ảnh hưởng: tiền rơi, kinh nghiệm, số dòng của món, món đặc biệt của quái thường / thủ lĩnh (bảo thạch, Mật đồ…).",
      ] },
      { p: "Dòng xanh TB = vị trí trung bình trong khoảng của dòng (0% = mức thấp nhất, 100% = mức cao nhất):" },
      { bang },
      { h: "Nguồn" },
      { ds: [
        "Đồ: dòng hậu tố “May mắn” +1 đến +10 (theo cấp dòng) — chỉ ra ở Nhẫn, Dây chuyền, Ngọc bội hệ Mộc; là dòng ẩn nên phải được kích.",
        ...(mon.length ? [`Thuốc: ${mon.join("; ")} — các loại khác nhau cộng dồn.`] : []),
      ] },
      { p: `Ví dụ: 2 Nhẫn + Dây chuyền + Ngọc bội “May mắn +10” (đã kích) = 40, uống thêm thuốc +20 = 60 → quái thường rơi trang bị ${pr(RD.quaiThuong * (1 + Math.min(60, mm) / 100))} thay vì ${pr(RD.quaiThuong)}.` },
    ] };
}

function mucTocChay(C) {
  const bang = [["Tổng %", "Ô Chạy", "Nhanh gấp"]];
  for (const x of [0, 30, 50, 100, 170, 200]) bang.push([String(x), String(Math.round(RUN_GOC * (1 + x / 100))), `× ${sx(1 + x / 100)}`]);
  const TT = tanThu(C), NG = ngua();
  return { id: "cs-tocchay", ten: "Tốc độ di chuyển", tom: "Không có mốc: mỗi 1% đều nhanh thêm; nguồn, khinh công",
    tim: "tốc độ di chuyển tốc chạy ô chạy chạy nhanh ngựa hài giày khinh công tân thủ tăng ích tổ đội gia bào",
    noi: [
      { p: `Tốc độ chạy = ${RUN_GOC} × (1 + Tốc độ di chuyển % ÷ 100) — ô <y>Chạy</y> trên bảng nhân vật (làm tròn). <y>Không có mốc</y>: mỗi 1% nhanh thêm đúng 1%, không có giới hạn trên. Đang bị làm chậm thì còn một nửa.` },
      { bang },
      { h: "Nguồn" },
      { ds: [
        `Ngựa: ${NG.move ? `${khoang(NG.move, "%")} tùy loại` : "tùy loại"} — chỉ tính khi đang cưỡi. Ngựa còn cộng Sinh lực, Thể lực tối đa và Né tránh (mục Sinh lực · Nội lực, Chính xác · Né tránh).`,
        "Hài dòng tiền tố: “Tốc độ cao” 10–15%, “Đừng vội” 15–20%, “Nhanh chóng” 20–25%, “Bay lượn” 25–30%, “Khoa Phụ” 30–40%.",
        "Võ công, cấp 1 / 10 / 20: Kim Chung Tráo (Thiên Vương) 2/20/40%; Thế Vân Tung (Võ Đang) 18/23/30%; Thanh Phong phù (Côn Lôn) 11/20/30%; Hoạt Bất Lưu Thủ (Cái Bang) 5/18/33%; Lưu Thủy (Nga My, vòng sáng) 5/18/33%; Tuyết ảnh (Thúy Yên) 10/19/29%; Ngự Tuyết ẩn (Thúy Yên) 1/14/30%.",
        ...[TT && +TT.tocChay ? `Vòng sáng tân thủ (dưới cấp ${sx(TT.capDuoi)}): +${sx(TT.tocChay)}%.` : null, tangIchChu(C, "tốc chạy"),
          thuocChu(thuoc(C, coDong("fastwalkrun_p"))), "Tống Kim (chỉ trong trận): Gia Bào hoàn +20%, Lệnh Bài +30%."].filter(Boolean),
      ] },
      { p: "Ví dụ: ngựa +100%, Hài “Khoa Phụ” 40%, Thế Vân Tung cấp 20 (30%) = 170% → ô Chạy ghi 27, nhanh gấp 2,7 lần chạy bộ không đồ." },
      { h: "Khinh công" },
      { p: `Nhảy thẳng tới điểm chọn, xa nhất ${KC.tam} đơn vị (như tầm chiêu), tốc độ cố định ${KC.toc} đơn vị mỗi khung — bằng chạy +${sx((KC.toc / RUN_GOC - 1) * 100)}% (≈ ${sx(Math.floor(KC.tam / KC.toc) / KHUNG, 1)} giây cho cả tầm). Tốn ${KC.phi} thể lực mỗi lần. Không theo Tốc độ di chuyển, không dùng được khi cưỡi ngựa.` },
    ] };
}

function mucChoang(C) {
  const Q = quaiVC(C), f = Q.choangLoi ? Math.min(Q.choangLoi[1], Q.T) : Q.T, D = chieuDl();
  const bang = [["Choáng %", "Khung", "Giây"]];
  for (const x of [0, 20, 40, 60, 80]) bang.push([`${x}%`, sx((f * (100 - x)) / 100, 1), fx((f * (100 - x)) / 100 / KHUNG, 2)]);
  bang.push(["≥ 100%", "0", "Miễn choáng"]);
  // chiêu làm choáng quái: stun_p [%, khung] (src/game/vocong.js misHit / curseOn — khung 0 thì 9)
  const lam = [["Chiêu", "Làm choáng", "Khung"]];
  for (const x of chieuCo(D, "stun_p", true)) lam.push([x.ten, baChu(x.L, "%"), baChu(ba(D, x.id, "stun_p", 1, (n) => n || 9))]);
  return { id: "cs-choang", ten: "Choáng · Hoảng loạn", tom: "Thời gian choáng: 100% là miễn; hoảng loạn không giảm được",
    tim: "choáng làm choáng thời gian choáng hoảng loạn ma âm phệ phách xuất ứ bất nhiễm stun",
    noi: [
      { h: "Mình bị choáng" },
      ...(tatQVC(Q) ? [tatQVC(Q)] : []),
      { p: `Bị choáng: đứng im, bỏ chiêu đang ra, đang ngồi thì đứng dậy. Quái ra chiêu có “Làm choáng” thì theo chiêu đó${Q.choangLoi ? `; chiêu lôi không có “Làm choáng” thì <y>${sx(Q.choangLoi[0])}%</y> choáng <y>${sx(Q.choangLoi[1])} khung</y> (${giay(Q.choangLoi[1])})` : ""}. Mỗi lần tối đa ${sx(Q.T)} khung trước khi trừ giảm.` },
      { p: `<y>Thời gian choáng</y> giảm theo %, không có mốc; <y>100%</y> là miễn choáng (cả trong Tống Kim). Bảng cho 1 lần choáng ${sx(f, 1)} khung:` },
      { bang },
      { ds: [
        "Đồ: dòng hậu tố “Thời gian choáng” 20 / 30 / 40% — chỉ ra ở món hệ Thủy (mọi ô trừ ngựa).",
        "Võ công: Thanh Âm Phạn Xướng (Nga My, vòng sáng) 1/14/30% ở cấp 1 / 10 / 20.",
      ] },
      { h: "Mình làm choáng quái" },
      { p: `Chiêu có dòng “Làm choáng: X%” (ô xem chiêu chỉ ghi %, không ghi thời gian): mỗi đòn trúng có X% làm quái đứng im số khung ở bảng dưới (dòng không có khung thì 9 khung). Không có mốc. Quái không có giảm thời gian choáng; đang choáng mà trúng thêm thì chỉ kéo dài nếu lần mới dài hơn phần còn lại. Boss thế giới miễn choáng.${lam.length > 1 ? ` Cấp 1 / 10 / 20 (${KHUNG} khung = 1 giây):` : ""}` },
      ...(lam.length > 1 ? [{ bang: lam }] : []),
      { h: "Hoảng loạn" },
      { p: "Ma Âm Phệ Phách (Thiên Nhẫn 120): mục tiêu đứng im, không đánh / ra chiêu trong 1 giây (cấp 1) đến 4 giây (cấp 20). <c>Không</c> giảm theo Thời gian choáng hay chỉ số nào, không bị giới hạn khống chế. Chỉ Xuất ứ Bất Nhiễm miễn." },
      { h: "Xuất ứ Bất Nhiễm (Võ Đang 120)" },
      { p: "Trong thời gian bùa: xóa độc, chậm, choáng, hoảng loạn, mất nội lực và không bị giật; phần bản thân còn miễn trạng thái mới, kéo dài 1 / 1,9 / 3 giây ở cấp 1 / 10 / 20 (tỉ lệ thất bại 85% / 43% / 0%)." },
    ] };
}

function mucDoc(C) {
  const Q = quaiVC(C);
  // độc lên quái: số lần = số nhịp k (k × nhịp < thời gian + nửa nhịp) — src/game/vocong.js misHit (lớp độc hết hạn dư nửa nhịp), mobTick
  const solan = (p) => { const dur = DOC_QUAI.khung * (1 + p / 100); return Math.ceil((dur + DOC_QUAI.nhip / 2) / DOC_QUAI.nhip - 1e-9) - 1; };
  const phat = [["Độc phát %", "Khung", "Số lần"]];
  for (let p = 0, a = 0; p <= 100 && a <= 41; p++) if (solan(p + 1) !== solan(p)) {
    phat.push([a === p ? `${a}%` : `${a} – ${p}%`, `${sx(DOC_QUAI.khung * (1 + a / 100), 1)} – ${sx(DOC_QUAI.khung * (1 + p / 100), 1)}`, String(solan(p))]);
    a = p + 1;
  }
  // mình trúng độc (PvE): src/game/vocong.js misHitHero + heroDoc + heroTick — tổng = đòn × docPct % × f / 60, f = min(60, T); giảm theo Thời gian trúng
  // độc; mất máu ở khung 10, 20… còn trong hạn (hết hạn xét trước nhịp)
  const f0 = Math.min(DOC_QUAI.khung, Q.T), tong0 = (Q.docPct / 100) * (f0 / DOC_QUAI.khung);
  const lan = (tg) => { const f = (f0 * (100 - tg)) / 100; let n = 0; while ((n + 1) * DOC_QUAI.nhip < f - 1e-9) n++; return n; };
  const tong = (tg) => { const f = (f0 * (100 - tg)) / 100, n = Math.max(1, Math.floor(f / DOC_QUAI.nhip)); return (tong0 * (100 - tg) / 100) * Math.min(1, lan(tg) / n); };
  const trung = [["Trúng độc %", "Mất máu", "Tổng độc"]];
  let mien0 = null; // Thời gian trúng độc nhỏ nhất mà 1 đòn lẻ không còn mất máu
  for (let tg = 0, a = 0; tg <= 99; tg++) if (tg === 99 || lan(tg + 1) !== lan(tg)) {
    const n = lan(tg), t1 = tong(a) * 100, t2 = tong(tg) * 100;
    if (!n && mien0 == null) mien0 = a;
    trung.push([a === tg ? `${a}%` : `${a} – ${tg}%`, n ? `${n} lần` : "0 *", n ? (sx(t1, 1) === sx(t2, 1) ? `${sx(t1, 1)}%` : `${sx(t1, 1)} → ${sx(t2, 1)}%`) : "0"]);
    a = tg + 1;
  }
  trung.push(["≥ 100%", "Miễn độc", "0"]);
  const vd = (tg) => Math.round(1000 * tong(tg));
  return { id: "cs-doc", ten: "Độc sát · Trúng độc", tom: "Mốc số lần mất máu; Thời gian độc phát / trúng độc",
    tim: "độc sát trúng độc thời gian độc phát thời gian trúng độc poison nhịp vạn độc thực tâm",
    noi: [
      { h: "Độc lên quái" },
      { p: "Mỗi đòn độc trúng quái là 1 lớp độc riêng, các lớp cộng dồn; mỗi nhịp quái mất tổng các lớp còn hạn. Độc không chí mạng." },
      { ds: [
        "Chiêu độc: điểm mỗi lần theo dòng Độc sát của chiêu (đã nhân Hỗ trợ từ kỹ năng khác) + Độc sát của đồ, trừ theo kháng độc của quái.",
        `Đòn không có độc riêng: Độc sát - ngoại công của đồ (đòn thường, chiêu ngoại công) hoặc Độc sát - nội công (chiêu nội công) gắn N điểm mỗi ${DOC_DON.nhip} khung trong ${DOC_DON.khung} khung = ${DOC_DON.khung / DOC_DON.nhip} lần.`,
        "<y>Thời gian độc phát</y> kéo dài thời gian độc theo % → thêm lần mất máu. Số lần = làm tròn(thời gian ÷ nhịp), nên có mốc. Bảng cho chiêu độc 60 khung, 10 khung 1 lần:",
      ] },
      { bang: phat },
      { ds: [
        "Thời gian độc phát: Ngũ Độc Kỳ Kinh (Ngũ Độc) 1/10/20% ở cấp 1 / 10 / 20. Đồ không có dòng này. Sát mốc có thể lệch 1%.",
        "Quái dính bùa Vạn Độc Thực Tâm (Ngũ Độc) bị độc lâu hơn ×2,05 (cấp 1) đến ×4 (cấp 20).",
      ] },
      { h: "Mình trúng độc (quái đánh)" },
      ...(tatQVC(Q) ? [tatQVC(Q)] : []),
      { p: `Quái ra chiêu độc trúng mình: tổng độc = ${sx(Q.docPct)}% sát thương đòn đó × ${sx(f0)}/60 = <y>${sx(tong0 * 100, 1)}%</y> đòn, mất dần trong ${sx(f0)} khung, mỗi ${DOC_QUAI.nhip} khung 1 lần.` },
      { p: "<y>Thời gian trúng độc</y> giảm cả tổng độc lẫn thời gian theo cùng %. Vì mất máu theo nhịp 10 khung nên có mốc số lần:" },
      { bang: trung },
      { ds: [
        "* Với 1 đòn lẻ (không có lớp độc khác đang chạy); nếu đang trúng độc sẵn, lớp mới đi theo nhịp cũ nên vẫn có thể mất 1 lần.",
        "Đồ: dòng hậu tố “Thời gian trúng độc” 20 / 30 / 40% — chỉ ra ở món hệ Thổ (mọi ô trừ ngựa).",
        "Võ công: Tạp Nan Dược Kinh (Ngũ Độc) 1/10/20%; Thanh Âm Phạn Xướng (Nga My) 1/14/30% ở cấp 1 / 10 / 20.",
        "Trong Tống Kim, Thời gian trúng độc chỉ tính tối đa 77%.",
      ] },
      { p: `Ví dụ: quái đánh chiêu độc trúng 1.000 máu → 0%: độc ${vd(0)} chia ${lan(0)} lần; 40%: ${vd(40)} trong ${lan(40)} lần${mien0 != null ? `; từ ${mien0}% trở lên: không mất máu vì độc` : ""}.` },
    ] };
}

// loại kháng: [chữ, khóa gốc (…_p, …_yan_p, …max_p), chữ khi nói trần] — src/game/vocong.js addAttrs / mobRes
const KHANG_LOAI = [["Phòng thủ vật lý", "physicsres", "phòng thủ"], ["Kháng băng", "coldres", "băng"], ["Kháng hỏa", "fireres", "hỏa"], ["Kháng lôi", "lightingres", "lôi"],
  ["Kháng độc", "poisonres", "độc"], ["Kháng tất cả", "allres", "mọi hệ"]];
function mucKhang(C) {
  const bang = [["Tổng kháng", "Bảng ghi", "Kháng thật"]];
  bang.push([`Dưới ${KHANG_TRAN}%`, "đúng số", "= tổng"]);
  const kmax = KHANG_TOI_DA - KHANG_TRAN, dong = (k) => [k >= kmax ? `≥ ${KHANG_TRAN + 10 * k}%` : `${KHANG_TRAN + 10 * k} – ${KHANG_TRAN + 10 * k + 9}%`, k ? `${KHANG_TRAN}%+${k}%` : `${KHANG_TRAN}%`, `${KHANG_TRAN + k}%`];
  for (let k = 0; k <= Math.min(10, kmax); k++) bang.push(dong(k));
  if (kmax > 12) bang.push(["mỗi +10%", "+1%", "+1%"]);
  for (let k = Math.max(11, kmax - 1); k <= kmax; k++) bang.push(dong(k));
  const CH = tep("assets/data/char.json"), A = (CH && CH.levelAdd) || null;
  const goc = [["Hệ", "Kháng gốc"]];
  if (A) for (let i = 0; i < 5; i++) {
    const a = A[i] || A[String(i)]; if (!a) continue;
    const L = [["Vật lý", a.physicres], ["Băng", a.coldres], ["Hỏa", a.fireres], ["Lôi", a.lightingres], ["Độc", a.poisonres]].filter(([, v]) => +v).map(([t, v]) => `${t} ${v > 0 ? "+" : "−"}${Math.abs(v)}%`);
    goc.push([HE[i], L.join(", ") || "0"]);
  }
  const mon = thuoc(C, (T) => T.khang > 0 || coDong("coldres_p", "fireres_p", "lightingres_p", "poisonres_p", "physicsres_p", "allres_p")(T));
  // võ công lên mình (kháng, nâng trần) và bùa giảm kháng (trừ kháng, trừ trần) — cấp 1 / 10 / 20 từ skills.json
  const D = chieuDl(), vc = [["Võ công", "Kháng (cấp 1 / 10 / 20)"]], bua = [["Bùa", "Trừ kháng", "Trừ trần"]], tranVc = [];
  if (D) for (const [key, ids] of D.ds) for (const id of ids) {
    const s = D.db[id]; if (!s) continue;
    const dich = !!(s.target && s.target.enemy), a = [], b = [];
    for (const [t, k, t2] of KHANG_LOAI) {
      const x = ba(D, id, [`${k}_p`, `${k}_yan_p`]), y = ba(D, id, `${k}max_p`);
      if (x && x.some((v) => v)) a.push(`${t} ${baChu(x, "%")}`);
      if (y && y.some((v) => v)) b.push(`${t2} ${baChu(y, "%", !dich)}`);
    }
    const ten = `${tenChieu(s)} (${PHAI[key] || key}${s.aura ? ", vòng sáng" : ""})`;
    if (dich) { if (a.length || b.length) bua.push([ten, a.join(", ") || "—", b.join(", ") || "—"]); continue; }
    if (a.length) vc.push([ten, a.join(", ")]);
    if (b.length) tranVc.push(`${ten} trần ${b.join(", ")}`);
  }
  return { id: "cs-khang", ten: "Kháng (mốc 75%)", tom: "Trần 75%, mỗi 10% dư = +1% kháng thật, tối đa 95%",
    tim: "kháng phòng thủ vật lý kháng băng kháng hàn kháng hỏa kháng lôi kháng độc kháng tất cả trần mức kháng tính tối đa giảm kháng bùa giảm kháng",
    noi: [
      { p: "5 loại: <y>Phòng thủ vật lý</y>, Kháng băng, Kháng hỏa, Kháng lôi, Kháng độc — bảng nhân vật ghi là Phòng thủ, Kháng hàn (= Kháng băng), Kháng lôi, Kháng hỏa, Kháng độc. Sát thương nhận = sát thương × (100 − kháng thật)%, ít nhất 1. Đòn thường của quái trừ theo Phòng thủ vật lý (boss thế giới đánh độc thì trừ Kháng độc); chiêu của quái trừ theo kháng hệ của chiêu. Kháng âm làm nhận thêm (−25% → nhận 125%)." },
      { p: `Trần mặc định <y>${KHANG_TRAN}%</y>. Vượt trần vẫn có ích: mỗi <y>10%</y> dư được <y>+1%</y> kháng thật, cao nhất <y>${KHANG_TOI_DA}%</y> (luôn nhận ít nhất ${100 - KHANG_TOI_DA}%). Phần dư lẻ dưới 10% không có tác dụng. Bảng nhân vật ghi “${KHANG_TRAN}%” kèm “+N%” màu xanh lá.` },
      { bang },
      { p: `<y>Mức kháng tính tối đa</y> (tên trong ô xem chiêu — nâng trần): ${tranVc.length ? `${tranVc.join("; ")} ở cấp 1 / 10 / 20` : "Đảo Hư Thiên (Thiên Vương 120) +1 / +2 / +5% trần mọi hệ ở cấp 1 / 10 / 20"}; trần đổi thì mốc dời theo (trần 80: mốc 90, 100, 110…). Đồ không có dòng này.` },
      ...(goc.length > 1 ? [{ h: "Kháng gốc theo hệ nhân vật" }, { bang: goc, can: ["l", "l"] }] : []),
      { h: "Nguồn" },
      { ds: [
        "Đồ, dòng hậu tố (theo hệ món): Kháng độc ở món hệ Kim, Kháng lôi hệ Mộc, Kháng hỏa hệ Thủy, Kháng băng hệ Thổ — mọi ô trừ ngựa, tới +25% (Kháng lôi tới +30%); Phòng thủ vật lý ở món hệ Hỏa (Y phục, Nón, Thắt lưng, Hài, Hộ uyển) tới +25%.",
        "Dây chuyền dòng tiền tố “Kháng tất cả” 1–20%; vài món có sẵn Kháng tất cả ở chỉ số gốc.",
        ...[thuocChu(mon), "Tống Kim (chỉ trong trận): Phổ Phòng hoàn, Chiến cổ, chức trong trận.", vc.length > 1 ? "Võ công lên mình (bị động, bùa, vòng sáng): bảng dưới." : null].filter(Boolean),
      ] },
      ...(vc.length > 1 ? [{ bang: vc, can: ["l", "l"] }] : []),
      { h: "Bùa giảm kháng" },
      ...(bua.length > 1 ? [{ p: "Mỗi bùa trừ thẳng vào kháng và trừ cả trần (ô xem chiêu: “Kháng … tối đa”, “Phòng thủ vật lý tối đa”, “Mức kháng tính tối đa”), cấp 1 / 10 / 20:" }, { bang: bua, can: ["l", "l", "l"] }] : []),
      { ds: [
        `<y>Lên quái</y> (mọi nơi): trừ vào kháng của quái rồi giữ không quá trần ${QUAI_TRAN}% (bùa trừ trần thì trần thấp xuống); quái không có luật +1% mỗi 10% dư. Chỉ tính cho chiêu (cả độc của chiêu); đòn thường vẫn theo kháng gốc của quái. Bùa hại khác: mục Bùa hại lên quái.`,
        "<y>Lên mình</y>: chỉ người / bot phe kia trong Tống Kim mới giảm được kháng của mình (quái không giảm). Trừ xong mới tính luật vượt trần; bảng nhân vật ghi số đã trừ.",
      ] },
      { p: `Ví dụ: Thiếu Lâm (Kim, kháng hỏa gốc −25) + Dây chuyền Kháng tất cả 20 + 4 dòng Kháng hỏa 25 = 95% → bảng ghi ${KHANG_TRAN}%+2%, kháng thật 77%: đòn hỏa 1.000 còn 230.` },
    ] };
}

// bùa hại lên quái: chỉ các dòng máy chủ đọc trên quái (src/game/vocong.js mobMod / mobRes / mobSpeedK / mobAtkK / skDamage / mobTick, world.js guard / updateMob)
function mucBuaHai(C) {
  const D = chieuDl(); if (!D) return null;
  const Q = quaiVC(C), co = (k) => chieuCo(D, k, true).filter((x) => x.L.some((v) => v < 0)), chu = (L, dv, g = (v) => v) => gop(L, (x) => baChu(x.L.map(g), dv));
  const kh = co(KHANG_LOAI.flatMap(([, k]) => [`${k}_p`, `${k}_yan_p`, `${k}max_p`])), st = co("addphysicsdamage_p"), td = co(["attackspeed_v", "castspeed_v", "attackspeed_yan_v"]),
    tc = co("fastwalkrun_p"), cx = co("attackratingenhance_p"), nt = co("adddefense_v"), mau = co("lifereplenish_v"), lc = co("freezetimereduce_p"), dk = co("poisontimereduce_p");
  const L = [];
  if (kh.length) L.push(`<y>Giảm kháng</y> — ${va(kh.map((x) => tenChieu(x.s)))}: số và cách tính ở mục Kháng (Bùa giảm kháng). Chỉ tính cho chiêu, đòn thường của mình vẫn theo kháng gốc của quái.`);
  if (st.length) L.push(`<y>Giảm sát thương quái gây ra</y> — ${chu(st, "%")}: mọi đòn của quái (đòn thường lẫn chiêu) × (1 + %), tính cùng chỗ với “Giảm sát thương đến từ hệ” (mục Giảm sát thương nhận); từ −100% trở xuống quái chỉ còn gây 1 sát thương.`);
  if (td.length) L.push(`<y>Giảm tốc đánh</y> — ${chu(td, "")} (tổng “Tốc độ đánh - nội công” + “Tốc độ đánh - ngoại công”, kể cả dòng ngoại công (Dương); dòng nội công (Dương) không tính): khoảng nghỉ giữa 2 đòn của quái chia cho (1 + tổng ÷ ${QUAI_TOC.chia}) → dài ${td.map((x) => `×${baChu(x.L.map((v) => 1 / (1 + v / QUAI_TOC.chia)))}`).join("; ")}. Đang chậm thì hệ số nhân thêm ${sx(SLOW_K)}; hệ số nhỏ nhất ${sx(QUAI_TOC.danhSan)} (khoảng nghỉ dài nhất ×${sx(1 / QUAI_TOC.danhSan)}).`);
  if (tc.length) L.push(`<y>Giảm tốc chạy</y> — ${chu(tc, "%")}: tốc chạy của quái × (1 + %); đang chậm thì nhân thêm ${sx(SLOW_K)}, chậm nhất còn ${sx(QUAI_TOC.chaySan * 100)}%.`);
  if (cx.length) L.push(`<y>Giảm chính xác</y> — ${chu(cx, "%")}: Chính xác đòn thường của quái × (1 + %); chiêu của quái không bị giảm.`);
  if (nt.length) L.push(`<y>Giảm né tránh</y> — ${chu(nt, "")}: Né tránh của quái cộng số âm này (không dưới 0); chỉ có ích cho chiêu dùng chính xác (mục Chính xác · Né tránh), đòn thường của mình vẫn theo né tránh gốc.`);
  if (mau.length) L.push(`<y>Mất sinh lực mỗi nửa giây</y> — ${chu(mau, "", (v) => -v)}: quái mất số đó mỗi 0,5 giây, không trừ kháng, không chí mạng.`);
  const keo = [Q.bat && lc.length ? gop(lc, (x) => `làm chậm lâu hơn ×${baChu(x.L.map((v) => 1 - v / 100))}`) : null, dk.length ? gop(dk, (x) => `độc lâu hơn ×${baChu(x.L.map((v) => 1 - v / 100))}`) : null].filter(Boolean);
  if (keo.length) L.push(`<y>Kéo dài trạng thái</y> — ${keo.join("; ")} (mục Làm chậm · Băng sát, Độc sát · Trúng độc).`);
  L.push("Dòng khác trên bùa (Thời gian choáng, Thời gian phục hồi, phản đòn, chí mạng, phục hồi nội lực, “Tốc độ đánh - nội công (Dương)”) không có tác dụng lên quái.");
  return { id: "cs-buahai", ten: "Bùa hại lên quái", tom: "Giảm kháng, sát thương, tốc đánh, tốc chạy của quái; không mốc",
    tim: "bùa hại bùa chú giảm kháng giảm sát thương giảm tốc đánh giảm tốc chạy giảm chính xác giảm né tránh lịch ma đoạt hồn nhiếp hồn loạn tâm khi hàn ngạo tuyết ki bán phù vô hình độc ảo ảnh phi hồ phi hồng vô tích bắc minh đáo hải túy tiên tá cốt",
    noi: [
      { p: "Bùa hại của mình (chiêu đánh địch chỉ gây trạng thái, hoặc dòng âm có thời gian của chiêu tấn công) dính lên quái tới hết thời gian bùa; ra lại cùng bùa thì thay lần trước, bùa khác nhau cộng dồn. Có tác dụng ở mọi nơi, không riêng Tống Kim. <y>Không có mốc</y>: mỗi điểm đều có tác dụng. Số ghi theo cấp 1 / 10 / 20:" },
      { ds: L },
    ] };
}

function mucChinhXac(C) {
  const ti = [["Chính xác : Né tránh", "Trúng"]];
  for (const [a, b] of [[1, 19], [1, 4], [1, 3], [1, 2], [1, 1], [3, 2], [2, 1], [3, 1], [4, 1], [9, 1], [19, 1]]) {
    const v = Math.max(HIT_MIN, Math.min(HIT_MAX, (a * 100) / (a + b)));
    ti.push([`${a} : ${b}`, `${sx(v, 1)}%${v <= HIT_MIN ? " (sàn)" : v >= HIT_MAX ? " (trần)" : ""}`]);
  }
  const tp = [["Thân pháp", "Chính xác", "Né tránh"]];
  for (const x of [25, 50, 100, 150, 200, 300, 400]) tp.push([String(x), so(x * 4 - 28), so(Math.floor(x / 4))]);
  const D = chieuDl(), ar = [];
  if (D) {
    const m = new Map();
    for (const [key, ids] of D.ds) for (const id of ids) { const s = D.db[id], k = D.sk[id]; if (s && k && k.useAR && s.target && s.target.enemy) { if (!m.has(key)) m.set(key, new Set()); m.get(key).add(tenChieu(s)); } }
    for (const [key, L] of m) ar.push(`${PHAI[key] || key}: ${[...L].join(", ")}.`);
  }
  const caoTrung = thuoc(C, coDong("attackratingenhance_v")), caoThiem = thuoc(C, coDong("adddefense_v")), NG = ngua();
  return { id: "cs-chinhxac", ten: "Chính xác · Né tránh", tom: `Tỉ lệ trúng = Chính xác ÷ (Chính xác + Né tránh), trong ${HIT_MIN}–${HIT_MAX}%`,
    tim: "chính xác độ chính xác tỉ lệ công kích chính xác né tránh trúng trượt né bỏ qua né tránh thân pháp ngựa",
    noi: [
      { p: `Tỉ lệ trúng = Chính xác × 100 ÷ (Chính xác + Né tránh), giữ trong <y>${HIT_MIN}% – ${HIT_MAX}%</y>. Không có mốc.` },
      { ds: [
        "Áp cho: đòn thường của mình; chiêu của mình chỉ khi chiêu dùng chính xác (danh sách dưới) — chiêu khác luôn trúng; mọi đòn của quái vào mình (đòn thường lẫn chiêu). Trượt hiện chữ “Né”.",
        "<y>Bỏ qua né tránh X%</y>: né tránh của mục tiêu bớt X% trước khi tính. Vũ khí dòng tiền tố “Đâm xuyên” 1%; vài chiêu có sẵn (Long Trảo Hổ Trảo 9/45/85%, Đạt Ma Độ Giang 9/47/90% ở cấp 1 / 10 / 20).",
      ] },
      { bang: ti },
      { h: "Chính xác" },
      { p: "Chính xác = (Thân pháp × 4 − 28) × (1 + Độ chính xác %) + Độ chính xác điểm." },
      { ds: [
        "Vũ khí dòng tiền tố “Độ chính xác” 10–300 điểm; “Độ chính xác %” có ở chỉ số gốc vài vũ khí.",
        "Võ công (bị động, bùa) ghi “Tỉ lệ công kích chính xác: +X%” hoặc “+N điểm” trong ô xem chiêu — cộng chung với Độ chính xác % / điểm của đồ. Chiêu tấn công có dòng “Độ chính xác: X%” riêng thì nhân thêm cho chiêu đó.",
        ...(caoTrung.length ? [`Thuốc: ${caoTrung.join("; ")}.`] : []),
      ] },
      { h: "Né tránh" },
      { p: "Né tránh = Thân pháp ÷ 4 (bỏ lẻ) + Né tránh điểm. Thân pháp cho rất ít; nguồn chính là chỉ số gốc của Y phục / Nón / Hài… và võ công." },
      { ds: [
        "Võ công, cấp 1 / 10 / 20: Bất động Minh Vương (Thiếu Lâm) 15/126/250; La Hán Trận (Thiếu Lâm, vòng sáng) 40/400/800; Hóa Hiểm Vi Di (Cái Bang) 48/404/800; Thất Tinh Trận (Võ Đang, vòng sáng) 97/430/800; Thiên Ma Giải Thể (Thiên Nhẫn) 75/315/582.",
        ...(NG.am || NG.duong ? [`Ngựa (chỉ khi đang cưỡi) cộng Né tránh: ${[NG.am ? `ngựa thường (yêu cầu ${capChu(NG.lvAm)}) ${khoang(NG.am)}` : null, NG.duong ? `ngựa đặc biệt (yêu cầu ${capChu(NG.lvDuong)}) ${khoang(NG.duong)}` : null].filter(Boolean).join("; ")}.`] : []),
        ...(caoThiem.length ? [`Thuốc: ${caoThiem.join("; ")}.`] : []),
        "Trong Tống Kim, bùa Nhiếp Hồn Loạn Tâm / Phi Hồng Vô Tích của phe kia trừ né tránh của mình.",
      ] },
      { bang: tp },
      ...(ar.length ? [{ h: "Chiêu dùng chính xác" }, { ds: ar }] : []),
      { p: "Ví dụ: Thân pháp 200 → Chính xác 772. Đánh quái Né tránh 400: trúng 65,9%. Thêm vũ khí “Độ chính xác +300”: 1.072 → 72,8%." },
    ] };
}

function mucSatThuong(C) {
  const pc = noiCongPt(C);
  const mon = thuoc(C, coDong("addphysicsdamage_v", "addphysicsdamage_p", "addphysicsmagic_v", "addcoldmagic_v", "addfiremagic_v", "addlightingmagic_v", "addpoisonmagic_v"));
  return { id: "cs-satthuong", ten: "Sát thương", tom: "Lực tay, sát thương đòn thường / chiêu ngoại công / nội công",
    tim: "sát thương lực tay ngoại công nội công sát thương vật lý băng sát hỏa sát lôi sát hỗ trợ từ các kỹ năng khác nội công sức mạnh",
    noi: [
      { h: "Lực tay ngoại công (đòn thường)" },
      { p: `Lực tay = (sát thương vũ khí + Sức mạnh ÷ ${DIEM_LUC} + “Sát thương vật lý - ngoại công” điểm) × (1 + “Sát thương vật lý - ngoại công” %). Tay không: vũ khí 1–2. Cầm ám khí: Thân pháp ÷ ${DIEM_LUC} thay Sức mạnh. (÷ ${DIEM_LUC} bỏ lẻ.)` },
      { ds: [
        "Mỗi đòn thường: 1 số ngẫu nhiên trong lực tay × (100 − Phòng thủ vật lý của quái)%.",
        "Cộng thêm Băng / Hỏa / Lôi sát - ngoại công (của đồ và võ công), mỗi phần trừ theo kháng hệ đó của quái. Độc sát - ngoại công mất dần theo nhịp (mục Độc).",
        "Đánh quái hệ X: × (1 + “Tăng sát thương đối với hệ X” %). Chí mạng × 2.",
      ] },
      { h: "Chiêu" },
      { ds: [
        "Phần vật lý: chiêu có dòng “Sát thương vật lý: X%” thì lấy lực tay × (1 + X%); chiêu <y>không có dòng này thì không dùng lực tay</y> (sát thương vũ khí, Sức mạnh không tính). Cộng “Sát thương vật lý: a đến b điểm” của chiêu (nếu có); chiêu nội công cộng thêm “Sát thương vật lý - nội công” của đồ.",
        "Phần băng / hỏa / lôi = số của chiêu + dòng cùng loại của đồ và võ công (chiêu ngoại công lấy dòng ngoại công, chiêu nội công lấy dòng nội công) — có dòng của đồ thì chiêu nào cũng thêm phần đó. “Hỏa sát tối đa +%” nâng mức cao của hỏa sát; “Lôi sát tối thiểu +%” nâng mức thấp của lôi sát (không quá mức cao).",
        "Mỗi phần trừ theo kháng tương ứng của quái rồi cộng lại, × (1 + Hỗ trợ từ các kỹ năng khác) × ngũ hành tương khắc (mục Ngũ hành).",
        "<y>Hỗ trợ từ các kỹ năng khác</y> (ô xem chiêu) = tổng các dòng “Kỹ năng X: +y%” mà những chiêu khác đã học (cấp từ 1) ghi cho chính chiêu X này; nhân cả vào độc của chiêu (độc của đồ thì không).",
        ...(pc > 0 ? [`Chiêu nội công × (1 + Nội công × ${sx(pc)}%) — luật riêng của máy chủ, mỗi ${sx(1 / pc)} điểm Nội công +1%, tính cả độc của chiêu nội công.`] : []),
        "Chí mạng × 2 (mục Chí mạng).",
        "Ô Lực tay trái / phải ở bảng nhân vật = sát thương 1 đòn của chiêu đang đặt ở ô đó, chưa trừ kháng của quái, chưa tính tương khắc và chí mạng.",
      ] },
      { h: "Dòng sát thương của đồ" },
      { ds: [
        "Vũ khí dòng tiền tố: “Sát thương vật lý - ngoại công” +5% đến +100%.",
        "Vũ khí dòng hậu tố ngoại công (theo hệ món): Kim — Sát thương vật lý 1–50 điểm; Mộc — Độc sát 1–50 mỗi lần; Thủy — Băng sát 1–100; Hỏa — Hỏa sát 1–100; Thổ — Lôi sát 1–100.",
        "Vũ khí dòng hậu tố nội công: Kim — Sát thương vật lý - nội công 1–200; Thủy — Băng sát - nội công 1–200; Hỏa — Hỏa sát - nội công 1–200; Thổ — Lôi sát - nội công 1–200; Mộc — Độc sát - nội công 1–50 mỗi lần.",
        ...(mon.length ? [`Thuốc: ${mon.join("; ")}.`] : []),
      ] },
      { p: "Có băng sát (ngoại hay nội công, của chiêu hay của đồ) thì đòn trúng làm quái chậm (mục Làm chậm · Băng sát). Hỏa sát chỉ là sát thương tức thời, không cháy theo thời gian." },
      { p: `<y>Không có mốc</y>: mỗi điểm, mỗi % đều có tác dụng — trừ Sức mạnh (cầm ám khí: Thân pháp): lực tay chỉ +1 khi đủ mỗi ${DIEM_LUC} điểm.` },
    ] };
}

function mucChiMang() {
  return { id: "cs-chimang", ten: "Chí mạng", tom: "× 2 sát thương; xác suất = chiêu + Tăng tấn công chí mạng",
    tim: "chí mạng tấn công chí mạng tăng tấn công chí mạng crit bạo kích",
    noi: [
      { p: "Đòn chí mạng gây <y>× 2</y> sát thương (số màu vàng). Xác suất = “Tấn công chí mạng” của chiêu đang đánh + tổng “Tăng tấn công chí mạng” (bị động, bùa). Đòn thường chỉ có phần “Tăng tấn công chí mạng”. Từ 100% là luôn chí mạng. Độc không chí mạng. Không có mốc." },
      { h: "Tăng tấn công chí mạng — cấp 1 / 10 / 20" },
      { ds: [
        "Bị động theo vũ khí (cầm đúng loại): Thiếu Lâm côn pháp, quyền pháp 6/15/45%; Côn Lôn đao pháp 6/16/50%; Nga Mi kiếm pháp 6/20/36%; Thiên Nhẫn mâu pháp 6/19/35%; Thúy Yên đao pháp 6/13/35%; Ngũ Độc đao pháp 6/15/25%; Võ Đang kiếm pháp 6/10/25%; Cái Bang Bổng pháp 2/7/25%; Thiếu Lâm đao pháp 5/7/15%; Thiên Vương thương / đao / chùy pháp 2/8/15%.",
        "Võ công khác: Thiên Vương Chiến ý 5/22/41%; Nhất Khí Tam Thanh (Côn Lôn) 16/20/35%; Ngũ Độc Kỳ Kinh 4/16/30%; Túy Điệp Cuồng Vũ (Cái Bang) 5/11/30%; Băng Cốt Tuyết Tâm (Thúy Yên) 5/11/29%; Tiêu Diêu Công (Cái Bang) 1/5/20%; Tâm Nhãn (Đường Môn) 8/13/19%; Thái Cực Thần Công (Võ Đang) 5/11/18%; Như Lai Thiên Diệp (Thiếu Lâm) 5/8/11%; Sương Ngạo Côn Lôn 6/6/9%.",
        "Đồ không có dòng chí mạng.",
      ] },
      { p: "Ví dụ: Nga My cầm kiếm, Nga Mi kiếm pháp cấp 20 → đòn thường chí mạng 36%; chiêu có “Tấn công chí mạng 20%” thì 56%." },
    ] };
}

function mucNguHanh() {
  return { id: "cs-nguhanh", ten: "Ngũ hành", tom: "Tương khắc của chiêu, tăng / giảm theo hệ, kích dòng ẩn",
    tim: "ngũ hành tương khắc tương sinh kim mộc thủy hỏa thổ kích dòng ẩn thuộc tính ẩn tăng sát thương đối với hệ giảm sát thương đến từ hệ",
    noi: [
      { h: "Tương khắc" },
      { p: "Kim khắc Mộc · Mộc khắc Thổ · Thổ khắc Thủy · Thủy khắc Hỏa · Hỏa khắc Kim." },
      { p: "Chiêu có dòng “Ngũ Hành tương khắc: X%” (ô xem chiêu): đánh mục tiêu thuộc hệ chiêu khắc → <g>+X%</g>; mục tiêu thuộc hệ khắc chiêu → <c>−X%</c>; hệ khác không đổi. Hệ của chiêu là hệ của phái (chiêu không ghi hệ thì theo hệ nhân vật). Đòn thường không có tương khắc." },
      { ds: [
        "“Tăng sát thương đối với hệ X” cộng vào cùng chỗ với tương khắc (cả độc của chiêu); tổng hệ số không dưới 10%. Đòn thường: × (1 + “Tăng sát thương đối với hệ X” %).",
        "“Giảm sát thương đến từ hệ X”: kẻ thuộc hệ X đánh mình × (1 − %) (mục Giảm sát thương nhận).",
        "Có cả 2 dòng (cùng một hệ, 1/6/13% ở cấp 1 / 10 / 20): Thiên Vương Chiến ý, Như Lai Thiên Diệp (hệ Mộc); Tâm Nhãn, Ngũ Độc Kỳ Kinh (hệ Thổ); Băng Cốt Tuyết Tâm, Phật Pháp Vô Biên (hệ Hỏa); Túy Điệp Cuồng Vũ, Thiên Ma Giải Thể (hệ Kim); Thái Cực Thần Công, Sương Ngạo Côn Lôn (hệ Thủy).",
        "Tương khắc, “Tăng sát thương đối với hệ”, “Giảm sát thương đến từ hệ”: <y>không có mốc</y>, mỗi % đều có tác dụng.",
      ] },
      { p: "Ví dụ: chiêu hệ Kim có “Ngũ Hành tương khắc 30%”: đánh quái Mộc 1.000 → 1.300; đánh quái Hỏa → 700." },
      { h: "Kích dòng ẩn (tương sinh)" },
      { p: "Kim sinh Thủy · Thủy sinh Mộc · Mộc sinh Hỏa · Hỏa sinh Thổ · Thổ sinh Kim. Dòng ẩn của món hệ Y được kích bởi hệ sinh ra Y:" },
      { ds: [
        "+1 nếu hệ nhân vật sinh ra hệ của món.",
        "+1 cho mỗi món ở 2 ô liên kết (bảng dưới) có hệ sinh ra hệ của món.",
        "Kích 1: dòng 2; kích 2: dòng 2 và 4; kích 3: cả 3 dòng ẩn. Ô xem món ghi sẵn “Cần hệ … của … và … để kích thuộc tính ẩn”.",
      ] },
      // src/game/itemdb.js KICH (GIỐNG may-chu/do.js), tên ô = itemtip.js TEN_O
      { bang: [["Món ở ô", "Kích bởi"], ["Nón", "Y phục, Dây chuyền"], ["Y phục", "Nhẫn dưới, Thắt lưng"], ["Thắt lưng", "Ngọc bội, Hộ uyển"], ["Vũ khí", "Dây chuyền, Y phục"],
        ["Hài", "Vũ khí, Nón"], ["Hộ uyển", "Hài, Nhẫn trên"], ["Dây chuyền", "Thắt lưng, Nhẫn dưới"], ["Nhẫn trên", "Vũ khí, Nón"], ["Nhẫn dưới", "Hộ uyển, Ngọc bội"], ["Ngọc bội", "Hài, Nhẫn trên"]], can: ["l", "l"] },
      { p: "Ví dụ: nhân vật hệ Kim mặc Nón hệ Thủy (Kim sinh Thủy → +1); Y phục và Dây chuyền đều hệ Kim → +2: Nón kích đủ 3 dòng ẩn." },
    ] };
}

function mucTiemNang(C) {
  const pc = noiCongPt(C), CH = tep("assets/data/char.json"), S = (CH && CH.start) || [];
  // dòng xanh cộng chỉ số tiềm năng (assets/data/dong-xanh.json — đều là hậu tố)
  const dong = [["Sức mạnh", "strength_v"], ["Thân pháp", "dexterity_v"], ["Sinh khí", "vitality_v"], ["Nội công", "energy_v"]].map(([t, k]) => [t, dongChu(k)]);
  const coDongDo = dong.filter(([, v]) => v).map(([t, v]) => `${t} ${v}`), khongDong = dong.filter(([, v]) => !v).map(([t]) => t);
  const noi = [
    { p: `Mỗi lần lên cấp được <y>${DIEM_CAP}</y> điểm tiềm năng (Tẩy Tủy Kinh cho thêm). Chỉ số = điểm gốc theo hệ + điểm tự cộng + dòng Sức mạnh / Thân pháp / Sinh khí của đồ đang có tác dụng. Dòng của đồ cũng tính vào yêu cầu mặc đồ.` },
    { bang: [["Chỉ số", "Mỗi điểm được"],
      ["Sức mạnh", `Lực tay ngoại công +1 mỗi ${DIEM_LUC} điểm (bỏ lẻ): đòn thường cận chiến, tay không, chiêu có “Sát thương vật lý %”.`],
      ["Thân pháp", `Chính xác +4; Né tránh +1 mỗi 4 điểm. Cầm ám khí: lực tay +1 mỗi ${DIEM_LUC} điểm thay cho Sức mạnh.`],
      ["Sinh khí", "Sinh lực tối đa theo hệ số của hệ (mục Sinh lực · Nội lực). Không cộng thể lực."],
      ["Nội công", `Nội lực tối đa theo hệ số của hệ.${pc > 0 ? ` Chiêu nội công +${sx(pc)}% sát thương mỗi điểm (mỗi ${sx(1 / pc)} điểm +1%) — luật riêng của máy chủ.` : ""}`]], can: ["l", "l"] },
    { ds: [
      `<y>Mốc</y>: lực tay +1 khi đủ mỗi ${DIEM_LUC} Sức mạnh (cầm ám khí: ${DIEM_LUC} Thân pháp); Né tránh +1 khi đủ mỗi 4 Thân pháp — phần lẻ không thêm gì. Chính xác (+4 mỗi Thân pháp), Sinh khí, Nội công: không có mốc.`,
      ...(coDongDo.length ? [`Dòng của đồ (hậu tố — dòng ẩn, phải được kích): ${coDongDo.join("; ")}.${khongDong.length ? ` Đồ không có dòng ${va(khongDong)}.` : ""}`] : []),
    ] },
  ];
  const goc = [["Gốc", ...HE]];
  for (const [k, t] of [["str", "Sức mạnh"], ["dex", "Thân pháp"], ["vit", "Sinh khí"], ["eng", "Nội công"]]) {
    const r = [t]; for (let i = 0; i < 5; i++) { const s = S.find((x) => x && +x.series === i); r.push(s ? String(s[k]) : "—"); } goc.push(r);
  }
  if (S.length) noi.push({ h: "Điểm gốc lúc tạo nhân vật" }, { bang: goc });
  noi.push({ p: "Ví dụ: Sức mạnh 235 → lực tay +47; Thân pháp 200 → Chính xác 772, Né tránh 50." });
  return { id: "cs-tiemnang", ten: "Điểm tiềm năng", tom: "Sức mạnh, Thân pháp, Sinh khí, Nội công — mỗi điểm được gì",
    tim: "tiềm năng sức mạnh thân pháp sinh khí nội công cộng điểm dòng sức mạnh dòng thân pháp", noi };
}

function mucSinhLuc(C) {
  const CH = tep("assets/data/char.json"), A = (CH && CH.levelAdd) || null, F = (CH && CH.factions) || [];
  const he = [];
  if (A) for (let i = 0; i < 5; i++) {
    const a = A[i] || A[String(i)]; if (!a) continue;
    const ph = F.filter((f) => +f.series === i && PHAI[f.key]).map((f) => PHAI[f.key]).join(", ");
    he.push(`<y>${HE[i]}</y>${ph ? ` (${ph})` : ""}: Sinh lực = ${a.LifePerVitality} × Sinh khí + ${a.LifePerLevel} × cấp; Nội lực = ${a.ManaPerEnergy} × Nội công + ${a.ManaPerLevel} × cấp.`);
  }
  const a0 = A && (A[0] || A["0"]);
  const tl = a0 ? `Thể lực tối đa = ${a0.StaminaMaleBase} + (cấp − 1) × ${a0.StaminaMalePerLevel} (nam) hoặc × ${a0.StaminaFemalePerLevel} (nữ)${+a0.StaminaPerVitality ? ` + ${a0.StaminaPerVitality} × Sinh khí` : ""} + Thể lực của đồ.` : null;
  const ttMon = thuoc(C, coDong("lifemax_v", "lifemax_p", "manamax_v", "manamax_p"));
  // võ công lên mình: Sinh lực % (lifemax_p + lifemax_yan_p — vocong.js addAttrs cộng chung), Nội lực % (manamax_p; manamax_yan_p chưa tính)
  const D = chieuDl(), sl = chieuCo(D, ["lifemax_p", "lifemax_yan_p"]), nl = chieuCo(D, "manamax_p"), NG = ngua(), skDo = dongChu("vitality_v");
  return { id: "cs-sinhluc", ten: "Sinh lực · Nội lực", tom: "Công thức sinh lực, nội lực, thể lực; % chỉ nhân phần gốc",
    tim: "sinh lực nội lực thể lực tối đa máu mana sinh khí nội công trường mệnh ngựa",
    noi: [
      { p: "Sinh lực tối đa = (Sinh khí gốc × a + cấp × b) × (1 + Sinh lực tối đa %) + Sinh khí của đồ × a + “Sinh lực tối đa” điểm — a, b theo hệ (dưới). Không có mốc." },
      { ds: [
        "Sinh khí gốc = điểm khởi đầu + điểm tự cộng. Sinh khí của đồ và dòng “Sinh lực tối đa +điểm” cộng sau, <y>không</y> được nhân %.",
        "Nội lực tối đa tính y như vậy với Nội công.",
        "Các nguồn % cộng với nhau (dòng thường và (Dương) như nhau). Khi chỉ số đổi, tỉ lệ máu đang có được giữ nguyên.",
      ] },
      ...(he.length ? [{ h: "Hệ số theo hệ" }, { ds: he }] : []),
      ...(tl ? [{ p: `${tl} Thể lực dùng cho Khinh công (${KC.phi} mỗi lần) và chiêu tốn thể lực; chạy không tốn thể lực. Cách hồi thể lực: mục Hồi phục.` }] : []),
      { h: "Nguồn" },
      { ds: [
        `Đồ: dòng tiền tố “Sinh lực tối đa”, “Nội lực tối đa”, “Thể lực tối đa” 5–200 điểm ở mọi ô trừ ngựa; dòng hậu tố “Sinh khí” ${skDo || "1–20 (món hệ Thủy)"}.`,
        ...(NG.life || NG.stamina ? [`Ngựa (chỉ khi đang cưỡi): Sinh lực tối đa ${khoang(NG.life)}, Thể lực tối đa ${khoang(NG.stamina)} — cộng thẳng, không nhân %.`] : []),
        nl.length ? `Nội lực % (cấp 1 / 10 / 20): ${nl.map((x) => `${x.ten} ${baChu(x.L, "%")}`).join("; ")}.` : "Nội lực %: Thái Cực Thần Công (Võ Đang) 35/100/172%; Giáng Long Chưởng (Cái Bang) 12/30/50%.",
        ...[thuocChu(ttMon), "Tống Kim (chỉ trong trận): Trường Mệnh hoàn, Chiến cổ +30%, chức trong trận."].filter(Boolean),
      ] },
      ...(sl.length ? [{ p: "Sinh lực % từ võ công, cấp 1 / 10 / 20 (dòng thường và (Dương) cộng chung):" }, { bang: [["Võ công", "Sinh lực %"], ...sl.map((x) => [x.ten, baChu(x.L, "%")])] }] : []),
      { p: "Ví dụ: Thiếu Lâm (Kim) cấp 100, Sinh khí 25 gốc + 300 tự cộng: 325 × 8 + 100 × 4 = 3.000; +100% thành 6.000. Đồ +20 Sinh khí thêm 160, 5 dòng “Sinh lực tối đa +200” thêm 1.000 → 7.160." },
    ] };
}

function mucHoiPhuc(C) {
  const TT = tanThu(C);
  return { id: "cs-hoiphuc", ten: "Hồi phục", tom: "Ngồi thiền, phục hồi mỗi nửa giây, thể lực, tân thủ, tổ đội",
    tim: "hồi phục phục hồi sinh lực nội lực thể lực mỗi nửa giây ngồi thiền hồi máu hồi thể lực tân thủ",
    noi: [
      { ds: [
        "Đứng / đánh / chạy: không tự hồi, trừ khi có dòng phục hồi.",
        `Ngồi thiền: mỗi giây hồi <y>${NGOI.sinh}%</y> sinh lực tối đa và <y>${NGOI.noi}%</y> nội lực tối đa (không hồi thể lực). Đi, đánh hay bị đánh thì đứng dậy.`,
        "<y>Phục hồi sinh lực mỗi nửa giây +N</y>: hồi N mỗi 0,5 giây (2N mỗi giây) cả khi đứng, đánh, chạy. “Hồi phục sinh lực +%” (Đảo Hư Thiên, Thiên Vương 120: 1/17/35% ở cấp 1 / 10 / 20) nhân thêm phần này.",
        "<y>Phục hồi nội lực mỗi nửa giây +N</y>: như trên cho nội lực.",
        "<y>Thể lực</y> chỉ hồi theo 3 cách: dòng “Phục hồi thể lực mỗi nửa giây +N” (N mỗi 0,5 giây, chỉ khi không chạy); lên cấp (đầy cả sinh lực, nội lực, thể lực); vào bản đồ khác (thể lực đầy). Không có dòng đó thì thể lực không tự hồi.",
        "Không có mốc. Quái không tự hồi máu.",
      ] },
      { h: "Nguồn" },
      { ds: [
        "Đồ, dòng tiền tố: sinh lực 1–6 (Y phục, Hài, Thắt lưng, Nón, Hộ uyển); nội lực 1–4 (Ngọc bội); thể lực 1–9 (Nhẫn, Dây chuyền).",
        "Võ công (mỗi nửa giây, cấp 1 / 10 / 20): Mộng Điệp và Phổ Độ Chúng Sinh (Nga My, vòng sáng) sinh lực 1/7/15, nội lực 1/5/10; Thái Cực Thần Công (Võ Đang) nội lực 1/4/8.",
        ...[TT && (+TT.hoiSinhLuc || +TT.hoiNoiLuc) ? `Vòng sáng tân thủ (dưới cấp ${sx(TT.capDuoi)}): +${sx(TT.hoiSinhLuc || 0)} sinh lực và +${sx(TT.hoiNoiLuc || 0)} nội lực mỗi giây.` : null, tangIchChu(C, "hồi"),
          "Thuốc hồi theo bình, mỗi nửa giây (xem ô xem món)."].filter(Boolean),
      ] },
      { p: "Ví dụ: 3 món “Phục hồi sinh lực mỗi nửa giây +6” = 36 sinh lực mỗi giây; có Đảo Hư Thiên cấp 20 (+35%) thành 48,6 mỗi giây." },
    ] };
}

function mucHut() {
  const dc = dongChu("damage2addmana_p", "%");
  return { id: "cs-hut", ten: "Hút sinh lực · nội lực", tom: "Hồi theo % sát thương gây ra; dòng của đồ chỉ ở đòn ngoại công",
    tim: "hút sinh lực hút nội lực hút máu chuyển hóa sát thương thành nội lực",
    noi: [
      { p: "Mỗi đòn trúng hồi lại % sát thương đòn đó gây ra (sau kháng của mục tiêu, gồm cả phần băng / hỏa / lôi, không tính độc). Không có trần % và không có mốc; hồi không vượt sinh lực / nội lực tối đa." },
      { ds: [
        "Dòng đồ “Hút sinh lực” / “Hút nội lực” (vũ khí dòng tiền tố: 1–3, 3–5, 5–7, 7–10%): chỉ đòn thường và chiêu <y>ngoại công</y>; chiêu nội công không hưởng.",
        "Chiêu có dòng hút riêng cộng thêm khi đánh bằng chiêu đó (cấp 1 / 10 / 20): Vân Long Kích và Giang Hải Nộ Lan (Thiên Nhẫn) sinh lực 1/8/16%, nội lực 1/8/16%; Thâu Thiên Hoán Nhật (Thiên Nhẫn) sinh lực 1/4/8%, nội lực 1/3/6%; Nhân Kiếm Hợp Nhất, Kiếm Thùy Tinh Hà (Võ Đang) nội lực 1/2/5%.",
        "Tống Kim: tính theo sát thương sau hệ số PK.",
      ] },
      { p: "Ví dụ: vũ khí “Hút sinh lực 10%”, đòn thường gây 800 → hồi 80 sinh lực." },
      { h: "Chuyển hóa sát thương thành nội lực" },
      { p: `Mất bao nhiêu sinh lực vì bị đánh (kể cả độc) thì hồi N% số đó vào nội lực, không vượt nội lực tối đa. Không có mốc. Dòng hậu tố (dòng ẩn, phải được kích)${dc ? `: ${dc}` : ""}.` },
    ] };
}

function mucPhanDon() {
  return { id: "cs-phandon", ten: "Phản đòn", tom: "Phản lại sát thương cho kẻ đánh mình; phản bùa trong Tống Kim",
    tim: "phản đòn cận chiến tầm xa phản độc phản bùa chú dịch cân kinh la hán trận gai nhọn",
    noi: [
      { ds: [
        "<y>Phản đòn cận chiến +N điểm</y> (Y phục dòng tiền tố “Gai nhọn” 1–10, “Đâm ngã” 10–20): mỗi đòn của kẻ đánh gần trúng mình (cả chiêu băng / hỏa / lôi), kẻ đó chịu N điểm.",
        "<y>Phản đòn cận chiến +N%</y>: phản N% sát thương mình nhận từ đòn vật lý cận chiến.",
        "<y>Phản đòn tầm xa +N%</y>: phản N% từ đòn tầm xa và mọi đòn băng / hỏa / lôi.",
        "<y>Phản đòn khi bị trúng độc +N%</y>: mỗi lần mất máu vì độc, kẻ gây độc chịu lại N%.",
        "<y>Xác suất phản đòn bùa chú +N%</y>: chỉ trong Tống Kim — bùa hại của phe kia có N% bật về người ra bùa, mình không dính.",
      ] },
      { p: "Phản tính theo sát thương mình thật sự nhận (sau kháng). Số phản hiện màu cam, không bị phản ngược lại. Không có mốc." },
      { p: "Võ công, cấp 1 / 10 / 20: Dịch Cân kinh (Thiếu Lâm) cận chiến + tầm xa 1/10/20%; La Hán Trận (Thiếu Lâm, vòng sáng) 1/10/20%; Hộ Thể Hàn Băng (Thúy Yên) 5/12/20%; Hóa Hiểm Vi Di (Cái Bang) cận chiến 1/17/36%; Đại Thừa Như Lai Chú (Thiếu Lâm 120): trúng độc 5/27/45%, bùa chú 5/40/80%." },
      { p: "Ví dụ: Dịch Cân kinh cấp 20, quái cận chiến đánh mình mất 500 → quái chịu 100; mặc thêm Y phục “Đâm ngã” 20 → 120." },
    ] };
}

function mucGiamSt() {
  const D = chieuDl();
  // nguồn từng bước (cấp 1 / 10 / 20 từ skills.json): Triệt tiêu sát thương, Nội lực hộ thân %, Lưỡng Nghi Chân Khí, Nội lực hộ thân điểm, bùa giảm sát thương quái
  const sorb = chieuCo(D, "sorbdamage_yan_p"), ms = chieuCo(D, "manashield_p").sort((a, b) => b.L[2] - a.L[2]), dyn = chieuCo(D, "dynamicmagicshield_v"), LN = luongNghi(D);
  const buaSt = chieuCo(D, "addphysicsdamage_p", true).filter((x) => x.L.some((v) => v < 0));
  const nguon = (L, dv) => L.map((x) => `${x.ten} ${baChu(x.L, dv)}`).join("; ");
  const msAm = ms.filter((x) => x.L.some((v) => v < 0) && x.s.style === 3 && x.s.eqt === -2); // bị động không theo vũ khí: luôn trừ vào
  // ví dụ bước 5: phái có dòng % cao nhất, cộng mọi dòng cùng phái ở cấp 20 (hiệu lực ≤ 99 % — src/game/world.js guard)
  const top = ms[0] || null, cung = top ? ms.filter((x) => x.phai === top.phai) : [];
  const X = Math.max(0, Math.min(99, cung.reduce((t, x) => t + x.L[2], 0))); // hiệu lực tối đa 99 % (src/game/world.js guard HO_THAN_MAX — anh 14/11)
  const vd = top && X > 0 ? `Ví dụ: ${PHAI[top.phai] || top.phai} có ${va(cung.map((x) => `${tenChieu(x.s)} cấp 20 (${am(x.L[2])}%)`))} = ${X}%: đòn 1.000 sau kháng → ${so(Math.floor(10 * X))} trừ vào nội lực, ${so(1000 - Math.floor(10 * X))} vào sinh lực (khi còn đủ nội lực).` : null;
  const ln = LN ? `6. ${LN.ten} (${LN.phai}${LN.req ? ` ${LN.req}` : ""}, bị động): khi bị quái đánh trúng (Tống Kim: cả người / bot phe kia; đòn không phải độc) mà sinh lực còn dưới ${LUONG_NGHI_HP}%, có ${baChu(LN.L.map((x) => x.tl), "%")} tự kích phát; 2 lần kích phát cách nhau ít nhất ${baChu(LN.L.map((x) => x.cho))} khung (${baChu(LN.L.map((x) => x.cho / KHUNG))} giây). Trong ${baChu(LN.L.map((x) => x.khung))} khung (${baChu(LN.L.map((x) => Math.round((x.khung / KHUNG) * 10) / 10))} giây) nội lực gánh thay sinh lực: mỗi điểm nội lực đỡ ${baChu(LN.L.map((x) => Math.round(x.do)))} sát thương; hết nội lực thì phần còn lại vào sinh lực.`
    : "6. Lưỡng Nghi Chân Khí (Côn Lôn 120, tự phát khi sinh lực dưới 25%): trong thời gian bùa, nội lực gánh thay sinh lực.";
  return { id: "cs-giamst", ten: "Giảm sát thương nhận", tom: "Thứ tự trừ sát thương: kháng, hệ, triệt tiêu, hộ thân",
    tim: "giảm sát thương nội lực hộ thân triệt tiêu sát thương giảm thiểu sát thương gánh chịu lưỡng nghi chân khí tọa vọng vô ngã võ đang quyền pháp huyền thiên vô cực kim chung tráo",
    noi: [
      { p: "Khi bị đánh trúng, sát thương đi qua lần lượt (cấp 1 / 10 / 20):" },
      { ds: [
        "1. Né theo Chính xác của kẻ đánh và Né tránh của mình (mục Chính xác · Né tránh).",
        "2. × (100 − kháng thật)%, ít nhất 1 (mục Kháng).",
        `3. × (1 − “Giảm sát thương đến từ hệ X” %) khi kẻ đánh thuộc hệ X.${buaSt.length ? ` Quái đang dính bùa ${va(buaSt.map((x) => tenChieu(x.s)), "hoặc")} thì × thêm (1 + tổng % âm của bùa) — mục Bùa hại lên quái.` : ""}`,
        `4. − “Triệt tiêu sát thương +N (Dương)”: trừ thẳng N điểm mỗi đòn, sau kháng và sau phần giảm theo hệ; còn ít nhất 1.${sorb.length ? ` ${nguon(sorb, "")}.` : ""}`,
        `5. “Nội lực hộ thân +X%”: X% phần còn lại trừ vào nội lực thay sinh lực; các nguồn (kỹ năng, bị động, trang bị) cộng chung nhưng hiệu lực tối đa 99% — mỗi đòn luôn trừ ít nhất 1% vào sinh lực (làm tròn lên); nội lực không đủ thì hết nội lực, phần còn lại trừ vào sinh lực.${ms.length ? ` ${ms.map((x) => `${x.ten} ${baChu(x.L, "%")}${msAm.includes(x) ? " (bị động không theo vũ khí — luôn trừ vào)" : ""}`).join("; ")}.` : ""}`,
        ln,
        `7. “Nội lực hộ thân +N điểm” — khác dòng % ở bước 5, không tốn nội lực: mỗi đòn bớt N ÷ ${HO_THAN.chia}, tối đa ${HO_THAN.toiDa}% đòn; không tính độc.${dyn.length ? ` ${nguon(dyn, "")}.` : ""}`,
        "8. Phần còn lại trừ vào sinh lực; “Chuyển hóa sát thương thành nội lực” hồi N% số sinh lực mất (mục Hút sinh lực · nội lực).",
      ] },
      { p: "Các dòng ở mục này <y>không có mốc</y>: mỗi điểm, mỗi % đều có tác dụng." },
      ...(vd ? [{ p: vd }] : []),
    ] };
}

function mucVoHieu() {
  return { id: "cs-vohieu", ten: "Dòng chưa có tác dụng", tom: "Các dòng có chữ trong ô xem chiêu nhưng hiện chưa được tính",
    tim: "không tác dụng chưa có tác dụng vô hiệu dòng lỗi",
    noi: [
      { p: "Những dòng dưới đây có trong ô xem chiêu nhưng máy chủ hiện <c>chưa tính</c> — đừng chọn chiêu / cộng điểm vì chúng. Mọi dòng xanh của đồ đều có tác dụng." },
      { ds: [
        "Sinh lực tối đa +điểm (Dương) — Sương Ngạo Côn Lôn.",
        "Nội lực tối đa +% (Dương) — Thái Cực Thần Công.",
        "Tỉ lệ kháng choáng — Tâm Nhãn, Ngũ Độc Kỳ Kinh.",
        "Kháng đòn chí mạng — Thanh Âm Phạn Xướng.",
        "Kháng phản đòn — Thiên Vương Chiến ý, Túy Điệp Cuồng Vũ, Thiên Ma Giải Thể, Huyền Thiên Vô Cực.",
        "Xác suất bỏ qua bùa giảm kháng — Đảo Hư Thiên.",
        "Bỏ qua độc phòng đối phương (Dương) — Ngũ Độc Kỳ Kinh.",
        "Tỷ lệ tạo thành sát thương — Tĩnh Tâm Quyết, Tâm Nhãn.",
        "Tạo thành sát thương có thời gian hoạt động — Thiên Vương Chiến ý.",
        "Tỷ lệ hóa giải cách đảng (bỏ qua hóa giải sát thương) — Đại Lực Kim Cang Chưởng, Vi Đà Hiến Xử.",
        "Tấn công chí tử — Ma Diệm Thất Sát.",
      ] },
    ] };
}

// =====================================================================================================================
// NHÓM — thứ tự hiện: cách tính, các mốc anh hỏi trước (tốc đánh, băng sát, phục hồi, may mắn), rồi các chỉ số khác
// =====================================================================================================================
function nhomChiSo(C) {
  const ds = [];
  for (const [id, fn] of [["cachTinh", mucCachTinh], ["tocDanh", mucTocDanh], ["hoiChieu", mucHoiChieu], ["cham", mucCham], ["phucHoi", mucPhucHoi],
    ["mayMan", mucMayMan], ["tocChay", mucTocChay], ["choang", mucChoang], ["doc", mucDoc], ["khang", mucKhang], ["buaHai", mucBuaHai], ["chinhXac", mucChinhXac],
    ["satThuong", mucSatThuong], ["chiMang", mucChiMang], ["nguHanh", mucNguHanh], ["tiemNang", mucTiemNang], ["sinhLuc", mucSinhLuc],
    ["hoiPhuc", mucHoiPhuc], ["hut", mucHut], ["phanDon", mucPhanDon], ["giamSt", mucGiamSt], ["voHieu", mucVoHieu]]) {
    try { const m = fn(C || {}); if (m) ds.push(m); } catch (e) { loiGhi(`mục chỉ số ${id}`, e); }
  }
  return ds;
}

module.exports = { nhomChiSo };
