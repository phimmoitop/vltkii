// Giao dịch giữa 2 người chơi (anh 30/10: "làm cơ chế giao dịch, tham khảo client") — theo engine KPlayer::Trade* (TradeApplyOpen / TradeApplyStart /
// TradeMoveMoney / TradeDecision) + khung client 玩家间交易.ini (src/game/windows.js _giaoDich). Chỉ giữ trong bộ nhớ như the-gioi.js / to-doi.js:
// tắt máy chủ giữa chừng thì phiên mất, đồ vẫn nằm ở túi (chỉ đổi lúc giao xong). Theo tài khoản (mỗi tài khoản chơi 1 nhân vật mỗi lúc). Luật:
//   - "mở giao dịch" (nút Đóng mở giao dịch thanh dưới / phím T, O — engine PLAYER_MENU_STATE_TRADEOPEN): người khác mới xin giao dịch với mình
//     được; cờ trên đầu (menustate02 — the-gioi.js gửi gd 1); đang giao dịch: menustate03 (gd 2). Giao dịch xong vẫn còn mở (engine RestoreBackupState)
//   - xin (menu người chơi — Ctrl + chuột phải / điện thoại: chạm giữ người đó): người kia đang mở giao dịch, cùng bãi, trong GAN (engine
//     FindAroundPlayer), cả 2 chưa giao dịch -> người kia được hỏi (giữ MOI_GIAY giây); đồng ý thì khung giao dịch mở ở cả 2 bên
//   - trong phiên: mỗi bên đặt món của túi vào lưới 8 × 4 (món vẫn nằm ở túi tới lúc giao) + số tiền; khóa (engine decision 2) rồi thì không đổi
//     được nữa; bỏ khóa (3) thì bỏ khóa + xác nhận của CẢ 2 bên; cả 2 khóa rồi mới xác nhận (1): bên đầu chờ ("Chờ đợi"), bên sau xác nhận là giao
//   - anh 14/11 ("bỏ tiền vạn vào không cập nhật theo thời gian thực, dễ bị lừa — A bỏ tiền vào, B thấy, mới đồng ý, sau ok rồi mới xác nhận"):
//     · bên chưa khóa đổi tiền / món (doiPhan) -> bỏ khóa (Đồng ý) + xác nhận của CẢ 2 bên, phần của bên đó lên phiên bản mới (ver); người kia đang
//       Đồng ý thì có thêm câu báo phải Đồng ý lại. Trước chỉ bỏ xác nhận: đổi tiền sau lúc người kia đã Đồng ý, người kia vẫn khóa
//     · Đồng ý / Xác nhận gửi kèm phiên bản phần đối phương mình đang thấy (b.v): đối phương vừa đổi (thư chưa tới) -> không nhận, báo xem lại
//     · đổi gì là đẩy ngay trạng thái cho người kia qua kênh tức thời (ws.js — day), không chờ nhịp 0,45 giây; trạng thái mang dấu thứ tự s (dau):
//       trình duyệt bỏ bản tới sau mà cũ hơn (main.js gdApply). Lúc giao vẫn chỉ dùng tiền / món máy chủ đang giữ (không nhận số trình duyệt gửi kèm)
//   - giao: do.js doiDo (món còn y nguyên, đủ tiền, tiền sau giao ≤ 2 tỉ, túi đủ chỗ, thuốc mang tối đa) -> ghi cả 2 tài khoản liền nhau (không có
//     await giữa đọc và ghi), nhật ký "gd". Túi đầy / quá thuốc: chỉ bỏ xác nhận của 2 bên, phiên còn (engine đặt lại TradeState); món / tiền sai: hủy
//   - rời game / đổi bãi / đóng khung: hủy phiên. Món có hạn dùng (ngựa từ Kỳ Trân Các — it.het) không giao dịch được (MSG_TRADE_TASK_ITEM)
// Câu báo = câu client (lang\vn\stringtable_core.txt MSG_TRADE_*, stringtable_client.txt G_STR_OPP_* / G_STR_WAIT_TRADING / G_SysMsgCentre_3); câu dịch
// sai (MSG_TRADE_SEND_APPLY "Bạn gặp %s xin phép giao dịch!") viết lại theo nghĩa câu gốc như to-doi.js.
//   lam(tk, h, b)   tk = tài khoản đang gọi (api.js), h = nhân vật đang chơi; b.viec: "mo" (b.on) | "xin" (b.ten) | "nhan" | "tuChoi" (b.id) |
//                   "dat" (b.ds [{ u, x, y }] — cả lưới) | "tien" (b.n) | "khoa" (b.on, b.v?) | "xn" (b.on, b.v?) | "huy" -> { gd: cua(tk), msg?, doi?
//                   (vừa giao xong — túi / tiền của mình đã đổi) }; b.v = phiên bản phần đối phương trình duyệt đang thấy (p.doi.v)
//   cua(tk)         -> { mo, xin?: [{ id, tu }], p?: phiên (khung giao dịch — phienGui), bao?: [câu], s } — gửi kèm nhịp (bao gửi 1 lần); s: dấu thứ tự
//                   (luôn có, kể cả khi không giao dịch — trình duyệt so thứ tự với tin đẩy "gd" { g } qua kênh tức thời: trangThai, không mang bao)
//   co(tk)          -> 2 đang giao dịch | 1 đang mở giao dịch | 0 (cờ trên đầu — the-gioi.js)
//   capNhat(tk)     -> true (1 lần) khi túi / tiền của tài khoản vừa đổi do người kia bấm xác nhận sau cùng -> nhịp gửi kèm túi + tiền
//   roi(tk)         đăng nhập / rời game / đăng xuất (api.js): thôi mở giao dịch, hủy phiên + lời xin của tài khoản đó (vào game là chưa mở như client)
"use strict";

const D = require("./du-lieu");
const TG = require("./the-gioi");
const DO = require("./do");
const NK = require("./nhat-ky");
const WS = () => require("./ws"); // kênh tức thời — đẩy trạng thái cho người kia ngay (anh 14/11)
const KB = () => require("./khu-bang.js"); // khu vực bang (bang hội đợt 4): mỗi bang 1 bản — chỉ giao dịch người cùng bản
// Lôi Đài (anh 15/11 — may-chu/loi-dai.js): trong sân không giao dịch (vai trước, bãi sau) — nạp lúc dùng, đệm (don chạy mỗi nhịp). soát 16/11: xét theo nhân vật — ô mình b.o,
// ô người kia TG.dangChoi(…).o (nhân vật khác cùng tài khoản với người đang có vai vẫn giao dịch được)
let LD_ = null; const LD = () => LD_ || (LD_ = require("./loi-dai.js"));
const CAU_LD = "Đang ở lôi đài — không giao dịch được";

const GAN = 800;            // px bản đồ web (trục dọc × 2 như World) — xin giao dịch phải đứng gần chừng này
const MOI_GIAY = 30, BAO_GIU = 10;
const O_W = 8, O_H = 4;     // lưới món đưa mỗi bên (玩家间交易.ini SelfItemsBox / OtherItemsBox 8 × 4)
const TIEN_O = 999999999;   // ô tiền 9 chữ số (ini SelfMoney MaxLen 9)
const CAU = {
  mo: "Bạn hiện giờ có thể giao dịch.", dong: "Bạn hiện giờ không thể giao dịch.",
  xin: "Bạn đã xin giao dịch với %s!", tuChoi: "%s cự tuyệt giao dịch với Bạn!", chuaMo: "%s chưa mở giao dịch.",
  dat: "Đối phương mới đặt lên một vật phẩm.", lay: "Đối phương lấy đi một vật phẩm.", doi: "Đối phương đổi một món vật phẩm.",
  tien: "Đối phương đổi số lượng tiền, hiện giờ là %s.", khoa: "Đối phương đặt mã khóa giao dịch.", boKhoa: "Đối phương bỏ khóa giao dịch.",
  xn: "Đối phương đã xác nhận giao dịch.", cho: "Chờ đợi",
  xong: "Bạn cùng với %s giao dịch thành công.", hong: "Bạn cùng với %s giao dịch thất bại.", huy: "Giao dịch bị hủy bỏ.",
  tran: "Giao dịch bị hủy bỏ, xin hãy kiểm tra tổng số tiền trong hành trang và tiền nhận được khi giao dịch có phải vượt giới hạn!",
  choMinh: "Khoảng trống trong túi của Bạn không đủ!", choHo: "%s khoảng trống trong túi không đủ!", khongGd: "Vật phẩm này không thể giao dịch!",
  // anh 14/11: đổi tiền / món sau lúc đã Đồng ý (doiPhan) — G_STR_OTHER_NOT_OK cho bên vừa đổi; 2 câu sau không có trong client, viết mới
  choKhoa: "Chờ đối phương đặt mã khóa", boDongY: "Đối phương vừa đổi tiền / vật phẩm — Bạn kiểm tra lại rồi bấm Đồng ý.",
  xemLai: "Đối phương vừa đổi tiền / vật phẩm — xem lại khung giao dịch rồi bấm lần nữa",
};

const moGd = new Set();     // tài khoản đang mở giao dịch
const xin = new Map();      // id -> { id, tu, den (tài khoản), luc }
const phien = new Map();    // id -> { id, ben: [bên xin, bên nhận] } — bên = { tk, ten, ds: [{ u, x, y, ban, it }], tien, khoa, xn, ver (phiên bản phần
                            // tiền + món — doiPhan), tin: { t, k } }
const cuaTk = new Map();    // tài khoản -> id phiên
const baoTk = new Map();    // tài khoản -> [câu]
const doiTk = new Set();    // tài khoản vừa đổi túi / tiền (capNhat)
let soId = 0;

const loi = (t) => { throw Object.assign(new Error(t), { code: 400 }); };
const tenCua = (tk) => (TG.dangChoi(tk) || {}).name || tk;
const xa = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2);
function bao(tk, t) { const L = baoTk.get(tk) || []; L.push(t); if (L.length > BAO_GIU) L.shift(); baoTk.set(tk, L); }
const phienCua = (tk) => phien.get(cuaTk.get(tk)) || null;
const benCua = (P, tk) => (P.ben[0].tk === tk ? [P.ben[0], P.ben[1]] : [P.ben[1], P.ben[0]]);
// dòng chữ InfoText của khung (k: "doi" màu chờ của client, "khoa" màu khóa — chữ vàng viền đỏ, "bo" màu bỏ khóa — xám)
const tinCho = (S, t, k) => { S.tin = { t, k, n: ((S.tin && S.tin.n) | 0) + 1 }; };
const moiBen = (tk, ten) => ({ tk, ten, ds: [], tien: 0, khoa: 0, xn: 0, ver: 0, tin: { t: "", k: "", n: 0 } });
// dấu thứ tự trạng thái gửi trình duyệt (cua / trangThai): theo đồng hồ, luôn tăng (khởi động lại máy chủ vẫn lớn hơn dấu cũ)
let dauCuoi = 0;
const dau = () => (dauCuoi = Math.max(Date.now(), dauCuoi + 1));
// bên S (đang không khóa — khóa thì không đổi được) vừa đổi tiền / món: bỏ Đồng ý + Xác nhận của CẢ 2 bên, phần của S lên phiên bản mới; câu InfoText cho
// người kia (cau — câu client G_STR_OPP_*); người kia đang Đồng ý thì thêm câu báo phải Đồng ý lại, bên S thấy "Chờ đối phương đặt mã khóa"
function doiPhan(S, O, cau) {
  S.ver++;
  if (O.khoa) { bao(O.tk, CAU.boDongY); tinCho(S, CAU.choKhoa, "bo"); }
  S.khoa = O.khoa = 0; S.xn = O.xn = 0;
  tinCho(O, cau, "doi");
}

function ketThuc(P, cau) {
  for (const S of P.ben) { cuaTk.delete(S.tk); if (cau) bao(S.tk, typeof cau === "function" ? cau(S) : cau); }
  phien.delete(P.id);
}
// lời xin quá hạn; phiên có người rời game / đổi bãi: hủy; tài khoản rời game thì thôi mở giao dịch (vào lại bấm mở lại)
function don() {
  const t = Date.now();
  for (const [id, x] of xin) if (t - x.luc > MOI_GIAY * 1000 || !TG.dangChoi(x.tu) || !TG.dangChoi(x.den)) xin.delete(id);
  for (const P of [...phien.values()]) {
    const a = TG.dangChoi(P.ben[0].tk), b = TG.dangChoi(P.ben[1].tk);
    if (!a || !b || a.zone !== b.zone || !KB().cungBan(P.ben[0].tk, P.ben[1].tk, a.zone) || LD().chan(P.ben[0].tk, a.zone, a.o) || LD().chan(P.ben[1].tk, b.zone, b.o)) ketThuc(P, CAU.huy); // khu vực bang: khác bản (bị đuổi / rời bang) thì hủy; Lôi Đài: 1 bên vào sân thì hủy
  }
  for (const tk of moGd) if (!TG.dangChoi(tk)) moGd.delete(tk);
}

// phiên gửi trình duyệt của bên tk: món + tiền của mình (u, ô), của đối phương (món đủ thông tin để vẽ + xem), khóa / xác nhận, dòng InfoText,
// phiên bản phần của mình (v) / của đối phương (doi.v — trình duyệt gửi lại kèm Đồng ý / Xác nhận)
function phienGui(P, tk) {
  const [S, O] = benCua(P, tk);
  return { id: P.id, ten: O.ten, ds: S.ds.map(({ u, x, y }) => ({ u, x, y })), tien: S.tien, khoa: S.khoa, xn: S.xn, tin: S.tin, v: S.ver,
    doi: { ds: O.ds.map(({ x, y, it }) => ({ x, y, it })), tien: O.tien, khoa: O.khoa, xn: O.xn, v: O.ver } };
}
// trạng thái của tài khoản tk, không kèm câu báo (câu báo chỉ đi theo nhịp / trả lời bấm — cua — mỗi câu 1 lần)
function trangThai(tk) {
  const P = phienCua(tk), xd = [...xin.values()].filter((x) => x.den === tk).map((x) => ({ id: x.id, tu: tenCua(x.tu) }));
  return { mo: moGd.has(tk) ? 1 : 0, ...(xd.length ? { xin: xd } : {}), ...(P ? { p: phienGui(P, tk) } : {}), s: dau() };
}
function cua(tk) {
  don();
  const r = trangThai(tk), b = baoTk.get(tk);
  if (b) { baoTk.delete(tk); r.bao = b; }
  return r;
}
// đẩy ngay trạng thái mới cho tài khoản tk qua kênh tức thời (anh 14/11 "A bỏ tiền vào thì B thấy ngay"); chưa có kênh / kênh vừa rớt: nhịp mang tới
function day(tk) {
  try { const kn = WS().cua(tk); if (kn) kn.gui({ t: "gd", g: trangThai(tk) }); } catch (e) { console.error("giao dịch — đẩy trạng thái: " + e.message); }
}
const co = (tk) => (cuaTk.has(tk) ? 2 : moGd.has(tk) ? 1 : 0);
const capNhat = (tk) => doiTk.delete(tk);
function roi(tk) {
  moGd.delete(tk);
  const P = phienCua(tk); if (P) { ketThuc(P, CAU.huy); day(benCua(P, tk)[1].tk); }
  for (const [id, x] of xin) if (x.tu === tk || x.den === tk) xin.delete(id);
}

// cả 2 bên đã khóa, bên kia đã xác nhận, bên này xác nhận -> giao (do.js doiDo). tk / h: bên vừa bấm (tài khoản api.js đang giữ)
function giao(P, tk, h, S, O) {
  const tkO = D.docTk(O.tk), hO = tkO && tkO.nv.find((x) => x && x.name === O.ten);
  if (!hO) { ketThuc(P, (B) => CAU.hong.replace("%s", B === S ? O.ten : S.ten)); return {}; }
  const r = DO.doiDo({ h, ds: S.ds, tien: S.tien }, { h: hO, ds: O.ds, tien: O.tien });
  if (r.loi === "cho" || r.loi === "thuoc") {
    const thieu = r.ben === 0 ? S : O, kia = r.ben === 0 ? O : S, mang = (DO.LUAT && DO.LUAT.mang) || 60;
    S.xn = O.xn = 0;
    const minh = r.loi === "cho" ? CAU.choMinh : `Bạn chỉ mang tối đa ${mang} bình thuốc (mọi loại) — không nhận thêm được`;
    const ho = r.loi === "cho" ? CAU.choHo.replace("%s", thieu.ten) : `${thieu.ten} chỉ mang tối đa ${mang} bình thuốc (mọi loại) — không nhận thêm được`;
    bao(thieu.tk, minh); bao(kia.tk, ho); tinCho(thieu, minh, "khoa"); tinCho(kia, ho, "khoa");
    return {};
  }
  if (r.loi) { ketThuc(P, r.loi === "tran" ? CAU.tran : (B) => CAU.hong.replace("%s", B === S ? O.ten : S.ten)); return {}; }
  DO.chuan(h); DO.chuan(hO);
  D.ghiTk(tk); D.ghiTk(tkO);
  const ds = (L) => (L.length ? L.join(", ") : "không có món"), tien = (n) => (n ? DO.tien(n) : "0 lượng");
  // món đưa rồi món nhận — cùng thứ tự tên trong câu (bảng quản trị trỏ vào tên món xem đủ dòng — nhat-ky.js mon)
  const mon = (A, B) => ({ mon: [...A.ds, ...B.ds].map((m) => NK.mon(m.it)) });
  NK.ghi("gd", S.tk, S.ten, `Giao dịch với ${O.ten}: đưa ${ds(r.b)} + ${tien(S.tien)}; nhận ${ds(r.a)} + ${tien(O.tien)}`, mon(S, O));
  NK.ghi("gd", O.tk, O.ten, `Giao dịch với ${S.ten}: đưa ${ds(r.a)} + ${tien(O.tien)}; nhận ${ds(r.b)} + ${tien(S.tien)}`, mon(O, S));
  doiTk.add(O.tk);
  ketThuc(P, (B) => CAU.xong.replace("%s", B === S ? O.ten : S.ten));
  return { doi: 1 };
}

function lam(tk, h, b) {
  don();
  const t = tk.ten, viec = String(b.viec || "");
  if (viec === "mo") {
    if (b.on && LD().chan(t, (TG.dangChoi(t) || {}).zone, b.o | 0)) loi(CAU_LD);
    if (b.on) moGd.add(t); else moGd.delete(t);
    return { gd: cua(t), msg: b.on ? CAU.mo : CAU.dong };
  }
  if (viec === "xin") {
    const den = TG.timTen(String(b.ten || "")), a = TG.dangChoi(t), d = den && TG.dangChoi(den);
    if (!a) loi("Chưa vào game");
    if (!d || den === t) loi("Người này không còn trong game");
    if (LD().chan(t, a.zone, b.o | 0) || LD().chan(den, d.zone, d.o)) loi(CAU_LD);
    if (phienCua(t)) loi("Bạn đang giao dịch");
    if (!moGd.has(den)) loi(CAU.chuaMo.replace("%s", d.name));
    if (phienCua(den)) loi(`${d.name} đang giao dịch với người khác`);
    if (a.zone !== d.zone || xa(a, d) > GAN || !KB().cungBan(t, den, a.zone)) loi(`${d.name} ở xa quá — lại gần rồi xin giao dịch`); // khu vực bang: chỉ cùng bản
    for (const [id, x] of xin) if (x.tu === t && x.den === den) xin.delete(id); // xin lại: thay lời cũ
    const id = ++soId; xin.set(id, { id, tu: t, den, luc: Date.now() });
    day(den); // người kia được hỏi ngay
    return { gd: cua(t), msg: CAU.xin.replace("%s", d.name) };
  }
  if (viec === "nhan" || viec === "tuChoi") {
    const x = xin.get(b.id | 0);
    if (!x || x.den !== t) loi("Lời xin giao dịch đã hết hạn");
    xin.delete(x.id);
    if (viec === "tuChoi") { bao(x.tu, CAU.tuChoi.replace("%s", tenCua(t))); return { gd: cua(t) }; }
    const a = TG.dangChoi(x.tu), d = TG.dangChoi(t);
    if (!a) loi("Người xin giao dịch đã rời game");
    if (LD().chan(x.tu, a.zone, a.o) || LD().chan(t, d && d.zone, b.o | 0)) loi(CAU_LD);
    if (phienCua(x.tu) || phienCua(t)) loi(`${a.name} đang giao dịch với người khác`);
    if (!d || a.zone !== d.zone || xa(a, d) > GAN || !KB().cungBan(x.tu, t, a.zone)) loi(`${a.name} ở xa quá — lại gần rồi giao dịch`); // khu vực bang: chỉ cùng bản
    const P = { id: ++soId, ben: [moiBen(x.tu, a.name), moiBen(t, d.name)] };
    phien.set(P.id, P); cuaTk.set(x.tu, P.id); cuaTk.set(t, P.id);
    for (const [id, y] of xin) if ([x.tu, t].includes(y.tu) || [x.tu, t].includes(y.den)) xin.delete(id);
    day(x.tu); // khung giao dịch mở ngay ở bên xin
    return { gd: cua(t) };
  }
  const P = phienCua(t);
  if (!P) loi("Không còn giao dịch");
  const [S, O] = benCua(P, t);
  if (viec === "huy") { ketThuc(P, CAU.huy); day(O.tk); return { gd: cua(t) }; }
  // món / tiền / khóa / xác nhận chỉ của đúng nhân vật đang giao dịch (ô o khác cùng tài khoản: không tính)
  if (!h || h.name !== S.ten) loi("Nhân vật này không ở trong giao dịch");
  if (viec === "dat" || viec === "tien") {
    if (S.khoa) loi("Đã khóa giao dịch — bỏ khóa rồi mới đổi được món / tiền");
    if (viec === "tien") {
      const n = Math.max(0, Math.min(Math.floor(+b.n) || 0, h.gold || 0, TIEN_O));
      if (n !== S.tien) { S.tien = n; doiPhan(S, O, CAU.tien.replace("%s", DO.tien(n))); day(O.tk); }
      return { gd: cua(t) };
    }
    const ds = Array.isArray(b.ds) ? b.ds.slice(0, O_W * O_H) : [], moi = [], o = new Set();
    for (const v of ds) {
      const u = v.u | 0, x = v.x | 0, y = v.y | 0, it = (h.bag || []).find((m) => m.u === u);
      if (!it || moi.some((m) => m.u === u)) loi("Không có món này trong túi");
      if (it.het) loi(CAU.khongGd);
      if (it.kbh) loi(DO.NOI.CAU_KBH.dat); // khóa bảo hiểm (anh 05/11 — thưởng thăng cấp / online): không giao dịch được
      if (it.tk) loi(DO.NOI.CAU_TK); // thuốc Tống Kim (anh 12/11): không mang ra ngoài trận
      const [w, hh] = DO.coMon(it);
      if (x < 0 || y < 0 || x + w > O_W || y + hh > O_H) loi("Món nằm ra ngoài khung giao dịch");
      for (let j = y; j < y + hh; j++) for (let i = x; i < x + w; i++) { const c = j * O_W + i; if (o.has(c)) loi("Món chồng lên món khác"); o.add(c); }
      const ban = DO.banMon(it);
      moi.push({ u, x, y, ban, it: JSON.parse(ban) });
    }
    // khác thật (thêm / bớt món, cùng mã mà món đã khác — vd chồng bớt số lượng) mới bỏ Đồng ý của 2 bên; chỉ dời ô trong lưới: người kia thấy chỗ mới
    const cu = new Map(S.ds.map((m) => [m.u, m])), them = moi.some((m) => !cu.has(m.u)), bot = S.ds.some((m) => !moi.some((n) => n.u === m.u));
    const khac = them || bot || moi.some((m) => cu.get(m.u).ban !== m.ban), dich = !khac && moi.some((m) => { const c = cu.get(m.u); return c.x !== m.x || c.y !== m.y; });
    S.ds = moi;
    if (khac) doiPhan(S, O, them && bot ? CAU.doi : them ? CAU.dat : bot ? CAU.lay : CAU.doi);
    if (khac || dich) day(O.tk);
    return { gd: cua(t) };
  }
  // b.v: phiên bản phần đối phương trình duyệt đang thấy — đối phương vừa đổi mà trình duyệt chưa nhận: không Đồng ý / Xác nhận theo phần chưa thấy
  const xemLai = () => { if (b.v != null && (b.v | 0) !== O.ver) loi(CAU.xemLai); };
  if (viec === "khoa") {
    if (b.on && !S.khoa) { xemLai(); S.khoa = 1; S.xn = O.xn = 0; tinCho(O, CAU.khoa, "khoa"); day(O.tk); }
    else if (!b.on && S.khoa) { S.khoa = O.khoa = 0; S.xn = O.xn = 0; tinCho(O, CAU.boKhoa, "bo"); tinCho(S, "", ""); day(O.tk); }
    return { gd: cua(t) };
  }
  if (viec === "xn") {
    if (!b.on) { if (S.xn) { S.xn = 0; tinCho(S, "", ""); day(O.tk); } return { gd: cua(t) }; }
    if (!S.khoa || !O.khoa) loi("Hai bên đều bấm Đồng ý rồi mới Xác nhận được");
    xemLai();
    if (!O.xn) { S.xn = 1; tinCho(S, CAU.cho, "doi"); tinCho(O, CAU.xn, "khoa"); day(O.tk); return { gd: cua(t) }; }
    // bên sau xác nhận: giao bằng tiền / món máy chủ đang giữ (S / O), không nhận số nào trình duyệt gửi kèm. Giao xong: nhịp kế của bên kia mang túi +
    // tiền mới cùng lúc đóng khung (không đẩy trước); chưa giao được (túi đầy / quá thuốc — bỏ xác nhận 2 bên) hay hủy: đẩy ngay
    const r = giao(P, tk, h, S, O);
    if (!r.doi) day(O.tk);
    return { gd: cua(t), ...r };
  }
  loi("Không rõ việc");
}

module.exports = { lam, cua, co, capNhat, roi };
