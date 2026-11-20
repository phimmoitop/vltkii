// Chợ trời — bày bán kiểu client (anh 02/11: "hệ thống treo bán, chợ trời — chuyên nghiệp, chỉnh chu, treo bán có thuế, dùng style game"; chọn
// sạp Rao bán kiểu client + bảng Chợ Trời, thuế 20 %, NPC trông sạp 3 hình ngẫu nhiên, sạp = khung RAO BÁN 6 × 10 ô). Theo engine KPlayerStall
// (stringtable_core L_PLAYERSTALL_* / MSG_STALL_* / G_CORESHELL_STALL_*) + client settings\taxrates.ini (thuế bày bán, cấp tối thiểu 10) và
// stallscript_permit.ini (beginoffline / begin_onlinecommission — bày bán khi vắng mặt):
//   - Định giá (nút MarkPriceBtn của Hành trang): món trong túi + giá niêm yết = THU NHẬP của người bán -> món chuyển sang sạp (h.sap.ds, lưới
//     6 × 10 như 摆摊物品.ini — máy chủ giữ, không chiếm túi lúc đi luyện công); định giá lại món trên sạp = đổi giá; Không bán = về túi
//   - Lời rao (MakeAdvBtn): 1 – CF.qc chữ (MSG_CANT_STALL_NO_ADV) — chữ trên bảng hiệu
//   - Rao bán (MakeStallBtn): mở sạp ở chỗ đang đứng — trong khu an toàn của thôn / thành (MSG_CANT_STALL_OUT_TOWN), cấp ≥ CF.cap, có món đã
//     định giá, có lời rao, không đang giao dịch; tắt = đóng sạp (món vẫn nằm trên sạp). Đi luyện công / thoát game: sạp vẫn mở (ủy thác) —
//     trình duyệt vẽ NPC trông sạp (h.sap.hinh: 1 trong 3 hình, bốc lúc mở) thay chỗ người bán; người bán ngồi đúng chỗ sạp thì vẽ chính họ
//   - Mua: người mua trả "Giá bán (gồm thuế)" = niêm yết + CF.thue % (G_CORESHELL_STALL_1 — quan phủ thu thuế, MSG_STALL_TAX_RATE2); người bán
//     nhận đúng giá niêm yết [anh 18/11 "thuế này do cả ng mua và ng bán cùng chịu": thuế CF.thue chia 2 — người mua trả niêm yết + THUE_MUA %, người bán
//     nhận niêm yết − THUE_BAN %, mặc định mỗi bên một nửa (choTroi.thueMua / thueBan ghi đè)], tiền vào túi ngay (ghi tài khoản người bán liền sau người mua, không có await giữa đọc và ghi — như giao-dich.js);
//     người bán biết ở nhịp kế tiếp (MSG_STALL_TRADE_SUCCESS, túi / tiền mới). Bán hết thì sạp tự đóng (MSG_STALL_ALL_SOLD_OUT)
// Chỉ mục SAP (bộ nhớ): các sạp đang mở — dựng lại khi máy chủ chạy (quét tài khoản), đổi mỗi lần sạp đổi; ver tăng mỗi lần đổi (nhịp gửi danh
// sách sạp của bãi khi trình duyệt có ver cũ).
//   lam(tk, h, o, b)   b.viec: "toi" | "loiRao" (qc) | "dinhGia" (u, gia) | "thuHoi" (u) | "mo" (on, bai, x, y) | "xem" (k) | "mua" (k, u, gia) | "ds"
//                      -> { sap? (sạp của mình), xem? (sạp đang xem), ds? (bảng Chợ Trời), msg?, bao? [câu], doi? (túi / tiền của mình đã đổi) }
//   nhip(bai, chv)     -> { v, ds: [{ k, ten, qc, x, y, hinh }] } (sạp đang mở ở bãi) khi trình duyệt có ver khác | null
//   capNhat(tk)        -> true 1 lần khi túi / tiền / sạp của tài khoản vừa đổi do người khác mua
//   h.choTin           câu báo cho người bán (có người mua) — api.js nhịp gửi choTin rồi xóa
//   xoa(tk, o)         nhân vật bị xóa: bỏ khỏi chỉ mục
// Sạp Hệ thống (anh 02/11 khuya — món Dã Tẩu hay đòi, 5–8 vạn; hàng + giá: may-chu/da-tau.js choHt): "ds" gửi kèm hàng của Hệ thống cho người xem
// ({ k: HT, ht: 1, yc: chữ yêu cầu, loai, can: món nhiệm vụ đang làm }) — trình duyệt chỉ bày ở thẻ Dã Tẩu; "mua" k = HT: món mới đúng mẫu, trả
// đúng giá (không thuế), hàng không bao giờ hết
"use strict";
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const D = require("./du-lieu");
const DO = require("./do");
const NK = require("./nhat-ky");
const DTAU = require("./da-tau");
const TG = () => require("./the-gioi");
const GD = () => require("./giao-dich");

const N = DO.NOI;
const NG = require("./nguon-mon"); // nguồn gốc món (anh 18/11 tối)
const CF = { thue: 20, cap: 10, qc: 16, cach: 40, gan: 300, ...(N.CFG.choTroi || {}) };
const W = 6, H = 10, HINH = 3; // lưới sạp 摆摊物品.ini ItemBox 6 × 10; số hình NPC trông sạp (src/game/main.js SAP_HINH)
// câu client (lang\vn\stringtable_core.txt); %d / %s thay lúc dùng
const CAU = {
  chuaGia: "Bạn vẫn chưa định giá cho bất cứ vật phẩm nào!", chuaQc: "Xin thiết kế quảng cáo, độ dài khoảng 1-%d chữ",
  ngoaiThanh: "Bạn chỉ có thể tiến hành sắp đặt trong thành!", ngua: "Trong lúc cỡi ngựa hoặc đang giao dịch với tổ đội không thể sắp đặt!",
  mo: "Bạn bắt đầu sắp đặt.", dong: "Bạn quyết định không sắp đặt nữa.", chuCat: "Người sắp xếp đã cất nó rồi.", daBan: "Vật phẩm này đã bán ra.",
  tangGia: "Người sắp xếp đã nâng giá niêm yết của vật phẩm này.", giamGia: "Người sắp xếp giảm giá niêm yết vật phẩm này.",
  thieuTien: "Bạn chưa đủ tiền.", heCho: "Bạn không có chỗ trống để xếp vật phẩm.", hetHang: "Những vật Bạn cần đã mua đủ, có thể thu xếp rồi!",
  thue1: "Thuế suất ở khu vực này là %d%%", thue2: "Quan phủ sau mỗi lần Bạn giao dịch thành công sẽ tự đến thu thuế.", thue3: "Người mua chịu %d%%, người bán chịu %d%% (trừ vào tiền nhận).",
  cap: "Thông báo: %d dân chúng dưới cấp...cấm không được sắp đặt!!", banDuoc: "<%s> đã mua những thứ Bạn bày ra <%s>.",
  khongBay: "Bày bán thất bại, xin kiểm tra: Có phải đã đặt giá cho [vật phẩm không thể bày bán] không?",
};
const cau = (k, ...v) => v.reduce((s, x) => s.replace(/%[ds]/, x), CAU[k]).replace(/%%/g, "%");
// thuế chia người mua / người bán (anh 18/11) — mặc định mỗi bên CF.thue / 2 %
const THUE_BAN = Number.isFinite(+CF.thueBan) ? +CF.thueBan : CF.thue / 2, THUE_MUA = Number.isFinite(+CF.thueMua) ? +CF.thueMua : CF.thue - THUE_BAN;
const giaMua = (gia) => gia + Math.floor((gia * THUE_MUA) / 100);
const nhanBan = (gia) => gia - Math.floor((gia * THUE_BAN) / 100);
const THUE_GUI = { thue: CF.thue, thueMua: THUE_MUA, thueBan: THUE_BAN }; // trình duyệt (chotroi.js tMua / tBan)

// khu an toàn của thôn / thành (assets/web/map/full/index.json jmo.an — cong-cu/dung-khu-an-toan.mjs)
const FULL = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/web/map/full/index.json"), "utf8")); } catch { return null; } })();
const AN = new Map();
function trongThanh(bai, x, y) {
  const Z = N.ZONES.get(bai | 0), J = Z && N.THANH.has(Z.kind) && !Z.bang && FULL && FULL.jmo && FULL.jmo[Z.jmo]; // khu vực bang: không bày bán (sạp theo mã bãi — chung mọi bản)
  if (!J || !J.an) return false;
  let a = AN.get(Z.jmo);
  if (!a) AN.set(Z.jmo, (a = { b: Buffer.from(J.an, "base64"), gw: J.gw, gh: J.gh, cw: J.cw, ch: J.ch }));
  const cx = Math.floor(x / a.cw), cy = Math.floor(y / a.ch);
  if (!(cx >= 0 && cy >= 0 && cx < a.gw && cy < a.gh)) return false;
  const i = cy * a.gw + cx;
  return ((a.b[i >> 3] >> (i & 7)) & 1) === 1;
}

// lưới sạp 6 × 10: món giữ đúng ô của nó như túi
function choTrong(L, it, x, y) {
  const [w, h] = DO.coMon(it);
  if (x < 0 || y < 0 || x + w > W || y + h > H) return false;
  return L.every((o) => o === it || o.x + DO.coMon(o)[0] <= x || x + w <= o.x || o.y + DO.coMon(o)[1] <= y || y + h <= o.y);
}
function choDau(L, it) {
  for (let c = 0; c < W * H; c++) { const x = c % W, y = (c / W) | 0; if (choTrong(L, it, x, y)) return [x, y]; }
  return null;
}

// sạp đang mở: "tk|ô" -> { k, tk, o, ten, qc, bai, x, y, hinh, ds }; k = mã sạp gửi trình duyệt (h.sap.id ngẫu nhiên — không lộ tên tài khoản), MA: k -> "tk|ô"
const SAP = new Map(), MA = new Map();
const maMoi = () => crypto.randomBytes(5).toString("hex");
const timSap = (k) => { const key = MA.get(String(k || "")); return key ? SAP.get(key) : null; };
const doiTk = new Set();
let ver = 1;
const sapCua = (h) => { const s = (h.sap = h.sap && typeof h.sap === "object" ? h.sap : { qc: "", mo: 0, ds: [] }); if (!s.id) s.id = maMoi(); return s; };
// món gửi trình duyệt: giá niêm yết (gia) + giá người mua trả (mua)
const monGui = (it) => ({ ...it, mua: giaMua(it.gia) });
const sapGui = (h) => { const s = sapCua(h); return { v: s.v | 0, qc: s.qc || "", mo: s.mo ? 1 : 0, bai: s.bai, x: s.x, y: s.y, ...THUE_GUI, ds: (s.ds || []).map(monGui) }; };
// chiMuc: sạp của nhân vật vừa đổi -> s.v tăng (trình duyệt bỏ bản sạp cũ về muộn) + cập nhật chỉ mục
function chiMuc(tk, o, h) {
  const key = tk + "|" + o, s = h && h.sap, cu = SAP.get(key);
  if (s) s.v = (s.v | 0) + 1;
  if (cu) MA.delete(cu.k);
  if (s && s.mo && (s.ds || []).length) {
    if (!s.id) s.id = maMoi();
    SAP.set(key, { k: s.id, tk, o, ten: h.name, qc: s.qc || "", bai: s.bai | 0, x: s.x, y: s.y, hinh: s.hinh | 0, ds: s.ds.map((it) => ({ ...it })) });
    MA.set(s.id, key);
  } else SAP.delete(key);
  ver++;
}
// Dọn chợ trời (anh 18/11 tối — CHỈ S1: "dọn hết các sạp hàng đang treo bán ở s1, tất cả trả về tiền vạn cho người chơi còn tài khoản, mỗi món 1 lượng, ng nào
// bị a xóa tk rồi thì coi như clear luôn"): chạy 1 lần lúc máy chủ khởi động, chỉ máy tên S1 (VL_TEN_MAY). Cờ du-lieu/don-sap-<ma>.json: có "xong" thì bỏ qua.
// Ghi bản chụp mọi món trên sạp vào cờ TRƯỚC khi sửa (khôi phục được nếu cần) -> mỗi nhân vật còn tài khoản có món trên sạp (mở hay đóng): + gia lượng × số ô
// món (chồng nhiều cái tính 1 món), sạp trống + đóng, câu báo ở nhịp (choTin), nhật ký "cho". Tài khoản đã xóa: tệp không còn — không có gì để trả.
const DON = { ma: "1811", gia: 1 };
(function donSap() {
  const TEN = String(process.env.VL_TEN_MAY || require("../assets/server.json").name || "").trim();
  if (!/^S1\b/.test(TEN)) return;
  const C = path.join(D.ROOT, `don-sap-${DON.ma}.json`);
  let cu = null; try { cu = JSON.parse(fs.readFileSync(C, "utf8")); } catch { /* chưa dọn */ }
  if (cu && cu.xong) return;
  const t = Date.now(), DS = [];
  for (const tk of D.dsTk()) (tk.nv || []).forEach((h, o) => { const L = h && h.sap && Array.isArray(h.sap.ds) ? h.sap.ds : []; if (L.length) DS.push({ tk: tk.ten, o, nv: h.name, n: L.length, mon: L }); });
  const ghiCo = (xong, them = {}) => fs.writeFileSync(C, JSON.stringify({ t, may: TEN, gia: DON.gia, xong, soNv: DS.length, soMon: DS.reduce((a, x) => a + x.n, 0), ...them, ds: [...((cu && cu.ds) || []), ...DS] }));
  try { fs.mkdirSync(D.ROOT, { recursive: true }); ghiCo(false); } catch (e) { console.error("Dọn chợ trời — không ghi được bản chụp, bỏ qua:", e.message); return; }
  let tien = 0;
  for (const x of DS) {
    const tk = D.docTk(x.tk), h = tk && tk.nv && tk.nv[x.o];
    if (!h || !h.sap || h.name !== x.nv) continue;
    const L = Array.isArray(h.sap.ds) ? h.sap.ds : [], n = L.length, them = n * DON.gia;
    if (!n) continue;
    h.gold = Math.min(N.TIEN_MAX, (h.gold || 0) + them);
    h.sap.ds = []; h.sap.mo = 0; h.sap.v = (h.sap.v | 0) + 1;
    h.choTin = [...(h.choTin || []), `Chợ trời đã được dọn: ${n} món trên sạp của bạn được quy đổi thành ${N.tien(them)}.`].slice(-20);
    D.ghiTk(tk); tien += them;
    try { NK.ghi("cho", x.tk, h.name, `Dọn chợ trời (quản trị): ${n} món trên sạp quy đổi ${N.tien(them)}`, { mon: L.slice(0, 20).map((m) => NK.mon(m)) }); } catch { /* nhật ký không làm hỏng việc */ }
  }
  ghiCo(true, { tien });
  console.log(`[dọn chợ trời] ${DS.length} nhân vật, ${DS.reduce((a, x) => a + x.n, 0)} món — trả ${tien} lượng; bản chụp du-lieu/${path.basename(C)}`);
})();
// máy chủ chạy: dựng chỉ mục từ tài khoản
for (const tk of D.dsTk()) {
  let moi = false;
  (tk.nv || []).forEach((h, o) => { if (h && h.sap && h.sap.mo) { if (!h.sap.id) { h.sap.id = maMoi(); moi = true; } chiMuc(tk.ten, o, h); } });
  if (moi) D.ghiTk(tk); // sạp mở từ bản trước chưa có mã: lưu mã để lần chạy sau giữ nguyên
}

// sạp Hệ thống: mã sạp HT (mã sạp người chơi 10 chữ hex — không trùng)
const HT = "ht", HT_TEN = "Hệ thống";
const htGui = (h) => DTAU.choHt(h).map((o) => ({ k: HT, ten: HT_TEN, ht: 1, yc: o.yc, loai: o.loai, ...(o.can ? { can: 1 } : {}), it: { ...o.it, u: o.u, gia: o.gia, mua: o.gia } }));
function muaHt(tk, h, b) {
  const o = DTAU.muaHt(h, +b.u);
  if (!o) N.loi("Hệ thống không còn bày món này — mở lại bảng Chợ Trời");
  const tinh = Math.floor(+b.gia);
  if (tinh !== o.gia) N.loi(cau(o.gia > tinh ? "tangGia" : "giamGia"));
  if ((h.gold || 0) < o.gia) N.loi(cau("thieuTien"));
  const m = { ...o.it, u: (h.uN = (h.uN | 0) + 1) };
  delete m.g; delete m.ng; delete m.di; NG.gan(m, "he", "Chợ trời · sạp Hệ thống", h.name); // nguồn gốc món (anh 18/11 tối)
  if (!N.vaoTui(h, m)) N.loi(cau("heCho"));
  h.gold -= o.gia;
  DO.chuan(h);
  D.ghiTk(tk);
  const ten = DO.tenMon(m).trim();
  NK.ghi("cho", tk.ten, h.name, `Chợ trời: mua ${ten} (Dã Tẩu: ${o.yc}) của ${HT_TEN} — ${N.tien(o.gia)}`, { mon: [NK.mon(m)] });
  return { doi: 1, msg: `Mua ${ten} của ${HT_TEN} — ${N.tien(o.gia)}` };
}

function lam(tk, h, o, b) {
  const viec = String(b.viec || ""), s = sapCua(h);
  if (viec === "toi") return { sap: sapGui(h) };
  if (viec === "ds") return { ds: [...htGui(h), ...[...SAP.values()].flatMap((S) => S.ds.map((it) => ({ k: S.k, ten: S.ten, bai: S.bai, tenBai: DO.tenBai(S.bai), it: monGui(it) })))] };
  if (viec === "xem") {
    const S = timSap(b.k);
    if (!S) N.loi(cau("chuCat"));
    return { xem: { k: S.k, ten: S.ten, qc: S.qc, ...THUE_GUI, minh: S.tk === tk.ten && S.o === o, ds: S.ds.map(monGui) } };
  }
  if (viec === "loiRao") {
    const qc = String(b.qc || "").normalize("NFC").replace(/[<>\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim();
    if (!qc || [...qc].length > CF.qc) N.loi(cau("chuaQc", CF.qc));
    s.qc = qc; chiMuc(tk.ten, o, h);
    D.ghiTk(tk);
    return { sap: sapGui(h), msg: `Lời rao: ${qc}` };
  }
  if (viec === "dinhGia") {
    if ((h.lvl || 1) < CF.cap) N.loi(cau("cap", CF.cap));
    const gia = Math.floor(+b.gia), u = +b.u;
    if (!(gia >= 1 && giaMua(gia) <= DO.NOI.TIEN_MAX)) N.loi(`Giá niêm yết từ 1 lượng tới ${N.tien(Math.floor(DO.NOI.TIEN_MAX / (1 + THUE_MUA / 100)))}`);
    const tren = s.ds.find((v) => v.u === u);
    if (tren) { tren.gia = gia; chiMuc(tk.ten, o, h); D.ghiTk(tk); return { sap: sapGui(h), msg: `${DO.tenMon(tren)}: giá niêm yết ${N.tien(gia)}` }; }
    const it = (h.bag || []).find((v) => v.u === u);
    if (!it) N.loi("Không tìm thấy vật phẩm trong hành trang");
    if (it.het) N.loi(cau("khongBay")); // ngựa có hạn của Kỳ Trân Các — như giao dịch (MSG_TRADE_TASK_ITEM)
    if (it.kbh) N.loi(N.CAU_KBH.dat); // khóa bảo hiểm (anh 05/11): engine để giá bày bán 0 — không bày bán được
    if (it.tk) N.loi(N.CAU_TK); // thuốc Tống Kim (anh 12/11): không mang ra ngoài trận
    if (GD().co(tk.ten) === 2) N.loi("Đang giao dịch — xong giao dịch rồi hãy định giá");
    const m = { ...it, gia }; delete m.x; delete m.y;
    const at = choDau(s.ds, m);
    if (!at) N.loi("Sạp đã đầy (6 × 10 ô) — thu bớt món về hành trang rồi định giá tiếp");
    [m.x, m.y] = at;
    h.bag = h.bag.filter((v) => v !== it); s.ds.push(m);
    chiMuc(tk.ten, o, h);
    D.ghiTk(tk);
    return { sap: sapGui(h), doi: 1, msg: `${DO.tenMon(it)} lên sạp — giá niêm yết ${N.tien(gia)}: bán được nhận ${N.tien(nhanBan(gia))} (trừ thuế ${THUE_BAN}%), người mua trả ${N.tien(giaMua(gia))} (gồm thuế ${THUE_MUA}%)` };
  }
  if (viec === "thuHoi") {
    const it = s.ds.find((v) => v.u === +b.u);
    if (!it) N.loi("Món này không còn trên sạp");
    const m = { ...it }; delete m.x; delete m.y; delete m.gia;
    if (N.laTB(m)) NG.cu(m); // nguồn gốc món: bày từ trước khi gắn nguồn -> đồ cũ
    if (N.laThuoc(m) && N.soThuoc(h) + (m.n || 0) > N.mang()) N.loi(`Chỉ mang tối đa ${N.mang()} bình thuốc (mọi loại) — không nhận thêm được`);
    if (!N.vaoTui(h, m)) N.loi("Hành trang không đủ chỗ");
    if (N.xepChong(m)) N.donChong(h, m.k);
    s.ds = s.ds.filter((v) => v !== it);
    const het = s.mo && !s.ds.length;
    if (het) s.mo = 0;
    chiMuc(tk.ten, o, h);
    D.ghiTk(tk);
    return { sap: sapGui(h), doi: 1, msg: `${DO.tenMon(it)} về hành trang` + (het ? ` — sạp hết hàng. ${cau("dong")}` : "") };
  }
  if (viec === "mo") {
    if (!b.on) { if (s.mo) { s.mo = 0; chiMuc(tk.ten, o, h); D.ghiTk(tk); } return { sap: sapGui(h), msg: cau("dong") }; }
    if ((h.lvl || 1) < CF.cap) N.loi(cau("cap", CF.cap));
    if (!s.ds.length) N.loi(cau("chuaGia"));
    if (!s.qc) N.loi(cau("chuaQc", CF.qc));
    if (GD().co(tk.ten) === 2) N.loi(cau("ngua"));
    const bai = b.bai | 0, x = Math.round(+b.x), y = Math.round(+b.y), p = TG().dangChoi(tk.ten);
    // chỗ mở sạp = chỗ đang đứng (nhịp gần nhất của máy chủ — không mở sạp từ xa)
    if (!p || p.zone !== bai || Math.hypot(p.x - x, (p.y - y) * 2) > CF.gan) N.loi("Đứng ở chỗ muốn bày bán rồi hãy bấm Rao bán");
    if ((N.ZONES.get(bai) || {}).bang) N.loi("Khu vực bang hội không được bày bán — hãy tới thôn / thành"); // đợt 4
    if (!trongThanh(bai, x, y)) N.loi(cau("ngoaiThanh"));
    const sat = [...SAP.values()].find((S) => S.bai === bai && !(S.tk === tk.ten && S.o === o) && Math.hypot(S.x - x, (S.y - y) * 2) < CF.cach * 2);
    if (sat) N.loi(`Chỗ này sát sạp của ${sat.ten} — đứng xa thêm một chút rồi Rao bán`);
    Object.assign(s, { mo: 1, bai, x, y, hinh: Math.floor(Math.random() * HINH), luc: Date.now() });
    chiMuc(tk.ten, o, h);
    D.ghiTk(tk);
    return { sap: sapGui(h), msg: cau("mo"), bao: [cau("thue1", CF.thue), cau("thue3", THUE_MUA, THUE_BAN), cau("thue2")] };
  }
  if (viec === "mua") {
    if (String(b.k || "") === HT) return muaHt(tk, h, b);
    const k = String(b.k || ""), S0 = timSap(k);
    if (!S0) N.loi(cau("chuCat"));
    const tkS = S0.tk, oS = S0.o;
    if (tkS === tk.ten) N.loi("Không mua được hàng trên sạp của chính tài khoản mình");
    const tkO = D.docTk(tkS), hS = tkO && tkO.nv[oS], S = hS && hS.sap;
    if (!S || !S.mo || S.id !== k) N.loi(cau("chuCat"));
    const it = (S.ds || []).find((v) => v.u === +b.u);
    if (!it) N.loi(cau("daBan"));
    const tra = giaMua(it.gia), tinh = Math.floor(+b.gia);
    if (tinh !== tra) { chiMuc(tkS, oS, hS); N.loi(cau(tra > tinh ? "tangGia" : "giamGia")); }
    if ((h.gold || 0) < tra) N.loi(cau("thieuTien"));
    const nhan = nhanBan(it.gia); // người bán nhận niêm yết − thuế phần người bán (anh 18/11)
    if ((hS.gold || 0) + nhan > DO.NOI.TIEN_MAX) N.loi(`Ngân lượng của ${hS.name} đã tới mức tối đa — chưa bán được`);
    const m = { ...it, u: ++h.uN }; delete m.x; delete m.y; delete m.gia;
    if (N.laTB(m)) NG.di(m, "cho", `Chợ trời: ${hS.name} → ${h.name} (${N.tien(tra)})`); // nguồn gốc món — đường đi
    if (N.laThuoc(m) && N.soThuoc(h) + (m.n || 0) > N.mang()) N.loi(`Chỉ mang tối đa ${N.mang()} bình thuốc (mọi loại) — không mua thêm được`);
    if (!N.vaoTui(h, m)) N.loi(cau("heCho"));
    if (N.xepChong(m)) N.donChong(h, m.k);
    h.gold = (h.gold || 0) - tra; hS.gold = (hS.gold || 0) + nhan;
    S.ds = S.ds.filter((v) => v !== it);
    const het = !S.ds.length;
    if (het) S.mo = 0;
    const ten = DO.tenMon(it) + (it.n > 1 ? ` ×${it.n}` : "");
    // câu báo người bán: lưu trong nhân vật (như quà quản trị quaTin) — vắng mặt / máy chủ khởi động lại vẫn nhận ở nhịp đầu tiên
    hS.choTin = [...(hS.choTin || []), cau("banDuoc", h.name, ten) + ` Nhận ${N.tien(nhan)}${nhan < it.gia ? ` (niêm yết ${N.tien(it.gia)}, trừ thuế ${THUE_BAN}%)` : ""}.`, ...(het ? [cau("hetHang")] : [])].slice(-20);
    DO.chuan(h); DO.chuan(hS);
    chiMuc(tkS, oS, hS); // trước khi ghi: số bản sạp mới của người bán lưu cùng
    D.ghiTk(tk); D.ghiTk(tkO);
    NK.ghi("cho", tk.ten, h.name, `Chợ trời: mua ${ten} của ${hS.name} — trả ${N.tien(tra)} (niêm yết ${N.tien(it.gia)}, thuế người mua ${N.tien(tra - it.gia)})`, { mon: [NK.mon(it)] });
    NK.ghi("cho", tkS, hS.name, `Chợ trời: ${h.name} mua ${ten} — nhận ${N.tien(nhan)} (niêm yết ${N.tien(it.gia)}, thuế người bán ${N.tien(it.gia - nhan)})`, { mon: [NK.mon(it)] });
    doiTk.add(tkS);
    return { doi: 1, msg: `Mua ${ten} của ${hS.name} — ${N.tien(tra)} (gồm thuế ${THUE_MUA}%)`, xem: timSap(k) ? lam(tk, h, o, { viec: "xem", k }).xem : null };
  }
  N.loi("Việc chợ trời không đúng");
}

// danh sách sạp đang mở ở bãi (nhịp) — chỉ gửi khi trình duyệt có ver khác
function nhip(bai, chv) {
  if (+chv === ver) return null;
  return { v: ver, ds: [...SAP.values()].filter((S) => S.bai === (bai | 0)).map((S) => ({ k: S.k, ten: S.ten, qc: S.qc, x: S.x, y: S.y, hinh: S.hinh })) };
}
const capNhat = (tk) => doiTk.delete(tk);
function xoa(tk, o) { const key = tk + "|" + o, cu = SAP.get(key); if (cu) { MA.delete(cu.k); SAP.delete(key); ver++; } }

module.exports = { lam, nhip, capNhat, xoa, sapGui, CF };
