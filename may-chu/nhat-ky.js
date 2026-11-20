// Nhật ký hoạt động (anh 28/10 — bảng quản trị "nhật ký hoạt động"): mỗi việc 1 dòng JSON ở du-lieu/nhat-ky/<YYYY-MM-DD giờ Việt Nam>.jsonl
// { t (ms), l (loại), tk (tài khoản), nv? (nhân vật), m (câu), ip? }. Giữ GIU_NGAY ngày (sang ngày mới thì xóa tệp cũ hơn). Ghi đồng bộ từng
// dòng (ít người chơi — vài nghìn dòng / ngày); quản trị xem thì đọc cả tệp của ngày đó (may-chu/quan-tri.js). Lỗi ghi không làm hỏng việc chính.
//   ghi(loai, tk, nv, m, them)   loai: vao · sai-mk · choi · roi · thoat (vào / ra) · nv (tạo / xóa nhân vật) · cap (lên cấp) · hiem (đồ hiếm)
//                                · ktc · xu (Kỳ Trân Các, đổi Xu) · qt (việc của quản trị) · tb (thông báo của quản trị) · ma (nhập mã kích hoạt)
//                                · gd (giao dịch giữa 2 người chơi — may-chu/giao-dich.js, mỗi bên 1 dòng)
//                                · cho (chợ trời — may-chu/cho-troi.js: người mua / người bán mỗi bên 1 dòng)
//                                · huy (Lễ quan → Hủy vật phẩm — api.js /api/do act huy, anh 05/11)
//                                · pt (thuê phân thân — may-chu/phan-than.js, anh 05/11: ai thuê ai, phí, tiền công)
//                                · bc (Bầu Cua — may-chu/bau-cua.js, anh 10/11: mỗi lần đặt cửa, kết quả + tiền nhận của mỗi người mỗi ván)
//                                · mk (khóa an toàn — may-chu/bao-mat.js, anh 10/11: đặt / đổi mật khẩu cấp 2, tự đổi mật khẩu đăng nhập, nhập sai,
//                                  khóa nhập, quản trị xóa / đặt lại — kèm IP)
//                                · hd (hoạt động — câu bắt đầu bằng tên hoạt động, xếp nhóm con theo HD_NHOM: Tống Kim, Lôi đài, Vượt Ải, Viêm Đế…; anh 18/11
//                                  thêm Vượt Ải / Viêm Đế / Phong Lăng Độ / Boss Sát thủ / Dã Tẩu / Săn Nhím / Boss Hoàng Kim / Báo Đáp Ân Sư — api.js ghiHd)
//                                · kham (khảm nạm, Hoán Hình Phù / Hoán Tính Lệnh — may-chu/kham-nam.js, anh 18/11: trước chỉ ở sổ riêng)
//                                · nguon (món không rõ nguồn — may-chu/do.js khongRo, anh 18/11 tối: trang bị vào túi / rương không qua chỗ tạo món nào đã gắn nguồn)
//                                them: { ip?, mon?: [mon(món)] } — món kèm dòng: nhặt đồ hiếm, chợ trời, giao dịch, hủy vật phẩm (bảng quản trị trỏ vào tên món xem đủ dòng)
//   mon(món)                      -> bản chụp món cho them.mon
//   doc({ ngay, tk, loai, q, n }) -> { ngay, tong (số dòng khớp), ds: [mới trước, tối đa n] }
//   ngays()                       -> [ngày có nhật ký, mới trước]
// Sổ hoạt động từng tài khoản (anh 11/11 tối: "bảng admin theo dõi thông tin của 1 người chơi, thì phải xem được hết hoạt động của họ, mua gì, nhặt
// gì, lấy gì" — README lượt 75): mọi dòng có tài khoản ghi THÊM vào du-lieu/nhat-ky-tk/<ngày>/<tài khoản>.jsonl; loại mới chỉ vào sổ riêng (không làm
// đầy nhật ký chung): mua · ban (cửa hàng NPC) · nhat (nhặt — gộp mỗi phút 1 dòng: số món theo tên + ngân lượng) · nhan (nhận quà / thưởng / mở
// rương — do.js taoQua). Ghi GỘP (đệm, 1,5 giây ghi 1 lần — đọc / thoát / SIGTERM thì ghi ngay) thay vì ghi từng dòng.
//   ctx(tk, nv)                   tài khoản / nhân vật của yêu cầu đang xử lý (api.js đặt đầu mỗi yêu cầu, bỏ khi xong) — hd / nhatGop dùng
//   hd(loai, m, them)             1 dòng sổ riêng của tài khoản đang xử lý (không có tài khoản: bỏ qua)
//   nhatGop(ten, so, tien)        cộng dồn món nhặt / ngân lượng nhặt của tài khoản đang xử lý — 60 giây ghi 1 dòng "Nhặt: …"
//   hoatDong({ tk, ngay, loai, q, n }) -> { tk, ngay, ngays, tong, ds }   sổ riêng 1 ngày của tài khoản (mới trước)
//   xa()                          ghi ngay phần đang đệm
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu");

const DIR = path.join(D.ROOT, "nhat-ky"), DIR_TK = path.join(D.ROOT, "nhat-ky-tk");
const GIU_NGAY = 60, DOC_MAX = 500, DOC_MAC_DINH = 300;
const ngayVN = (t) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10); // như may-chu/do.js
const TEP = /^\d{4}-\d\d-\d\d\.jsonl$/;
// tìm không dấu: "nhat thuy" khớp "Nhặt Thủy Tinh"
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
// "Nhặt Thần bí đồ chí / Thần Bí Lộ Chí" (đồ hiếm — api.js nhặt món đặc biệt): anh 30/10 "bỏ khỏi báo cáo" — từ 30/10 không ghi (ghi), dòng
// đã ghi trước đó không hiện, không tính vào số dòng khớp (doc). Anh 01/11: "mật đồ thần bí bỏ khỏi lịch sử nhật ký" — "Nhặt 1 Mật đồ thần bí" cũng vậy
const CHI = /^nhat (\d+ )?(than bi (do|lo) chi|mat do than bi)$/;
const boQua = (loai, m) => loai === "hiem" && CHI.test(fold(m));
// nhóm con của "hd" (anh 18/11: "chia ra cái hoạt động … để biết được người chơi làm những gì"): theo tên hoạt động đứng đầu câu — dòng cũ cũng vào đúng
// nhóm. Lọc "hd:<mã>" (bảng quản trị Nhật ký / sổ hoạt động từng tài khoản); "hd" = mọi hoạt động
const HD_NHOM = [["tk", /^Tống Kim/], ["ph", /^Phong Hỏa/], ["ld", /^(Lôi đài|Tỉ thí)/], ["dn", /^(Truy Phong|Đua ngựa)/], ["va", /^Vượt Ải/], ["vd", /^Viêm Đế/],
  ["pld", /^Phong Lăng Độ/], ["st", /^Boss Sát thủ/], ["dt", /^Dã Tẩu/], ["nhim", /^Săn Nhím/], ["btg", /^Boss Hoàng Kim/], ["bd", /^Báo Đáp Ân Sư/]];
const nhomHd = (m) => { const s = String(m || ""); for (const [k, re] of HD_NHOM) if (re.test(s)) return k; return ""; };
const khop = (loai, o) => !loai || loai.has(o.l) || (o.l === "hd" && loai.has("hd:" + nhomHd(o.m)));
let ngayCuoi = null;

// xóa tệp cũ hơn GIU_NGAY ngày
function don() {
  const moc = ngayVN(Date.now() - GIU_NGAY * 86400e3);
  for (const f of ngays()) if (f < moc) try { fs.unlinkSync(path.join(DIR, f + ".jsonl")); } catch {}
  try { for (const d of fs.readdirSync(DIR_TK)) if (/^\d{4}-\d\d-\d\d$/.test(d) && d < moc) fs.rmSync(path.join(DIR_TK, d), { recursive: true, force: true }); } catch {}
}
// đệm ghi: tệp -> [dòng]; 1,5 giây ghi 1 lần (thoát / SIGTERM / đọc: ghi ngay)
const DEM = new Map(); let henXa = null;
function xa() {
  clearTimeout(henXa); henXa = null;
  for (const [tep, L] of DEM) { try { fs.mkdirSync(path.dirname(tep), { recursive: true }); fs.appendFileSync(tep, L.join("")); } catch (e) { console.error("Nhật ký lỗi: " + e.message); } }
  DEM.clear();
}
function dem(tep, o) {
  const L = DEM.get(tep), s = JSON.stringify(o) + "\n";
  if (L) L.push(s); else DEM.set(tep, [s]);
  if (!henXa) { henXa = setTimeout(xa, 1500); if (henXa.unref) henXa.unref(); }
}
const tepTk = (ngay, tk) => path.join(DIR_TK, ngay, D.tenTk(tk) + ".jsonl");
for (const sg of ["SIGTERM", "SIGINT"]) process.on(sg, () => { try { xaNhat(true); xa(); } catch {} if (process.env.VL_MANAGED_SHUTDOWN !== "1") process.exit(0); });

function ghi(loai, tk, nv, m, them = {}) {
  if (boQua(loai, m)) return;
  try {
    const t = Date.now(), ngay = ngayVN(t);
    if (ngay !== ngayCuoi) { fs.mkdirSync(DIR, { recursive: true }); don(); ngayCuoi = ngay; }
    const o = { t, l: loai, tk: tk || null, ...(nv ? { nv } : {}), m: String(m).slice(0, loai === "kham" || loai === "hd" ? 400 : 300), ...them }; // khảm / hoạt động: câu kèm dòng đồ, thưởng
    dem(path.join(DIR, ngay + ".jsonl"), o);
    if (tk && D.tenTk(tk)) dem(tepTk(ngay, tk), o); // sổ riêng của tài khoản (F10 → Người chơi → Hoạt động)
  } catch (e) { console.error("Nhật ký lỗi: " + e.message); }
}

// bản chụp món kèm dòng nhật ký (anh 04/11: "người chơi rớt đồ xịn thì acc GM cũng xem được đó là món gì dòng nào" — src/game/quantri.js monChu):
// bỏ chỗ trong túi / mã món / giá sạp
function mon(it) { const { x, y, u, gia, mua, ...r } = it || {}; return r; }

function doc(b = {}) {
  xa();
  const ngay = /^\d{4}-\d\d-\d\d$/.test(b.ngay || "") ? b.ngay : ngayVN(Date.now());
  let txt = ""; try { txt = fs.readFileSync(path.join(DIR, ngay + ".jsonl"), "utf8"); } catch {}
  const loai = Array.isArray(b.loai) && b.loai.length ? new Set(b.loai.map(String)) : null, tk = D.tenTk(b.tk), q = fold(b.q).trim();
  const ds = [];
  for (const dong of txt.split("\n")) {
    if (!dong) continue;
    let o; try { o = JSON.parse(dong); } catch { continue; }
    if (!khop(loai, o)) continue;
    if (boQua(o.l, o.m)) continue;
    if (tk && o.tk !== tk) continue;
    if (q && !fold(`${o.tk || ""} ${o.nv || ""} ${o.m} ${o.ip || ""}`).includes(q)) continue;
    if (o.l === "hd") o.hn = nhomHd(o.m); // bảng quản trị ghi tên hoạt động thay chữ "Hoạt động"
    ds.push(o);
  }
  const n = Math.max(1, Math.min(DOC_MAX, b.n | 0 || DOC_MAC_DINH));
  return { ngay, tong: ds.length, ds: ds.slice(-n).reverse() };
}

function ngays() {
  try { return fs.readdirSync(DIR).filter((f) => TEP.test(f)).map((f) => f.slice(0, 10)).sort().reverse(); } catch { return []; }
}

// ---------- sổ hoạt động từng tài khoản ----------
let CTX = null;
function ctx(tk, nv) { CTX = tk ? { tk: D.tenTk(tk), nv: nv || null } : null; }
function hd(loai, m, them = {}) {
  if (!CTX || !CTX.tk) return;
  try {
    const t = Date.now(), ngay = ngayVN(t);
    if (ngay !== ngayCuoi) { fs.mkdirSync(DIR, { recursive: true }); don(); ngayCuoi = ngay; }
    dem(tepTk(ngay, CTX.tk), { t, l: loai, tk: CTX.tk, ...(CTX.nv ? { nv: CTX.nv } : {}), m: String(m).slice(0, 400), ...them });
  } catch (e) { console.error("Nhật ký lỗi: " + e.message); }
}
// như hd nhưng chỉ khi nhân vật nv đúng là nhân vật của yêu cầu đang xử lý (quà quản trị gửi người khác, thưởng ghi thẳng cho người vắng… không ghi nhầm sổ)
function hdNv(nv, loai, m, them) { if (CTX && CTX.tk && CTX.nv && CTX.nv === nv) hd(loai, m, them); } // yêu cầu không có nhân vật (quà toàn máy chủ của quản trị…): không ghi (rà soát lượt 75)
// nhặt gộp: "tk|nv" -> { tk, nv, t0, mon: Map(tên -> số), tien }
const NHAT = new Map();
function nhatGop(ten, so, tien, nv) {
  if (!CTX || !CTX.tk || (nv && nv !== CTX.nv)) return;
  const k = CTX.tk + "|" + (CTX.nv || ""); let g = NHAT.get(k);
  if (!g) { g = { tk: CTX.tk, nv: CTX.nv, t0: Date.now(), mon: new Map(), tien: 0 }; NHAT.set(k, g); }
  if (ten) g.mon.set(ten, (g.mon.get(ten) || 0) + (so || 1));
  if (tien > 0) g.tien += tien;
}
function xaNhat(tatCa) {
  const t = Date.now();
  for (const [k, g] of NHAT) {
    if (!tatCa && t - g.t0 < 60000) continue;
    NHAT.delete(k);
    const ds = [...g.mon].map(([n, so]) => (so > 1 ? `${so} ${n}` : n));
    if (g.tien > 0) ds.push(`${g.tien.toLocaleString("vi-VN")} lượng`);
    if (!ds.length) continue;
    const giu = CTX; CTX = { tk: g.tk, nv: g.nv }; hd("nhat", "Nhặt: " + ds.join(", ")); CTX = giu;
  }
}
setInterval(() => xaNhat(false), 15000).unref();
process.on("exit", () => { try { xaNhat(true); xa(); } catch {} });

const NGAY_RE = /^\d{4}-\d\d-\d\d$/;
function hoatDong(b = {}) {
  xaNhat(true); xa();
  const tk = D.tenTk(b.tk); if (!tk) return { tk: "", ngay: "", ngays: [], tong: 0, ds: [] };
  let cac = []; try { cac = fs.readdirSync(DIR_TK).filter((d) => NGAY_RE.test(d) && fs.existsSync(tepTk(d, tk))).sort().reverse(); } catch {}
  const ngay = NGAY_RE.test(b.ngay || "") ? b.ngay : cac[0] || ngayVN(Date.now());
  let txt = ""; try { txt = fs.readFileSync(tepTk(ngay, tk), "utf8"); } catch {}
  const loai = Array.isArray(b.loai) && b.loai.length ? new Set(b.loai.map(String)) : null, q = fold(b.q).trim(), ds = [];
  for (const dong of txt.split("\n")) {
    if (!dong) continue; let o; try { o = JSON.parse(dong); } catch { continue; }
    if (!khop(loai, o)) continue;
    if (q && !fold(`${o.nv || ""} ${o.m}`).includes(q)) continue;
    if (o.l === "hd") o.hn = nhomHd(o.m);
    ds.push(o);
  }
  const n = Math.max(1, Math.min(2000, b.n | 0 || 500));
  return { tk, ngay, ngays: cac, tong: ds.length, ds: ds.slice(-n).reverse() };
}

module.exports = { ghi, doc, ngays, ngayVN, mon, ctx, hd, hdNv, nhatGop, hoatDong, xa };
