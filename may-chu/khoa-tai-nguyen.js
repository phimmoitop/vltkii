// Khóa tài nguyên sau đăng nhập (anh 10/11 lượt 61 — chống sao chép: "nchung em làm sao ngta k còn copy của anh là dc … đấy gọi là phòng vệ"):
// assets/ (hình, tiếng, bảng dữ liệu) chỉ phát cho người ĐÃ ĐĂNG NHẬP. Phiếu = cookie vl_tn "<tài khoản>.<hạn ms>.<chữ ký HMAC>" (HAN 24 giờ) cấp lúc
// đăng nhập, làm mới khi trình duyệt gọi API có phiên (mở trang, nhịp, tải trước…) lúc phiếu còn dưới LAM_MOI — kiểm phiếu chỉ là 1 phép băm, không
// đọc tệp tài khoản (CPU máy chủ). Khóa ký: du-lieu/khoa-tai-nguyen.txt (tự tạo lần đầu, giữ qua khởi động lại — phiếu đang dùng vẫn đúng). Chừa công
// khai thứ màn đăng nhập cần (CONG_KHAI: assets/server.json, ảnh nền đăng nhập, phông chữ, ảnh màn chờ).
// Thu hồi (rà soát lượt 61): quản trị khóa / xóa / đặt lại mật khẩu tài khoản -> phiếu của tài khoản đó hết dùng ngay (THU_HOI; khóa có hạn tự hết; lúc
// bật máy chủ quét tài khoản đang khóa); đăng nhập lại được thì gỡ.
// Đếm theo tài khoản -> nhật ký "sao" (F10 nhóm Chống sao chép) — biết tài khoản nào đang chép để khóa (người chơi thật lần đầu vào game ~1200 tệp):
// quá NGUONG tệp khác nhau trong 2 khung CUA_SO liền nhau, hoặc quá NGUONG_NGAY lần lấy tệp trong 1 ngày (tải chậm cả kho)
//   can(p) -> đường dẫn phải có phiếu?   doc(req) -> tên tài khoản | null   cap(req, ten) / xoa(req) -> chuỗi Set-Cookie
//   canLamMoi(req, ten) -> phiếu thiếu / của tài khoản khác / sắp hết hạn    dem(ten, p, req)    thuHoi(ten, den) / traLai(ten)
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const D = require("./du-lieu");
const NK = require("./nhat-ky");

const TEN = "vl_tn", HAN = 24 * 3600e3, LAM_MOI = 12 * 3600e3;
const CUA_SO = 30 * 60e3, NGUONG = +process.env.VL_TN_NGUONG || 6000, NGUONG_NGAY = +process.env.VL_TN_NGAY || 12000, GIO = 3600e3;
// ảnh màn chờ (ui/loading — src/game/loading.js tải sẵn 1 ảnh ngay lúc mở trang, trước khi có phiếu) cũng công khai: chỉ là tranh nền
const CONG_KHAI = /^\/assets\/(server\.json$|ui\/dang-nhap\/|ui\/fonts\/|ui\/loading\/)/;

const KHOA = (() => {
  const f = path.join(D.ROOT, "khoa-tai-nguyen.txt");
  try { const k = fs.readFileSync(f, "utf8").trim(); if (/^[0-9a-f]{64}$/.test(k)) return k; } catch {}
  const k = crypto.randomBytes(32).toString("hex");
  try { fs.mkdirSync(D.ROOT, { recursive: true }); fs.writeFileSync(f, k, { mode: 0o600 }); } catch (e) { console.error("Không ghi được khóa tài nguyên: " + e.message); }
  return k;
})();
// tài khoản -> hết thu hồi lúc (ms; 0 = tới khi đăng nhập lại / quản trị gỡ)
const THU_HOI = new Map();
try { const t = Date.now(); for (const tk of D.dsTk()) { const k = tk.khoaTk; if (k && (!k.den || k.den > t)) THU_HOI.set(tk.ten, k.den || 0); } } catch {}
const thuHoi = (ten, den = 0) => THU_HOI.set(ten, den || 0);
const traLai = (ten) => THU_HOI.delete(ten);
function biThuHoi(ten) {
  if (!THU_HOI.has(ten)) return false;
  const den = THU_HOI.get(ten);
  if (den && den <= Date.now()) { THU_HOI.delete(ten); return false; }
  return true;
}

const ky = (s) => crypto.createHmac("sha256", KHOA).update(s).digest("base64url").slice(0, 27);
const https = (req) => req.headers["x-forwarded-proto"] === "https" || /https/.test(req.headers["cf-visitor"] || "");
const can = (p) => p.startsWith("/assets/") && !CONG_KHAI.test(p);

function docPhieu(req) {
  const m = /(?:^|;\s*)vl_tn=([A-Za-z0-9_.-]{1,120})/.exec(req.headers.cookie || ""); if (!m) return null;
  const a = m[1].split("."); if (a.length !== 3) return null;
  const [ten, het, sig] = a, t = +het;
  if (!/^[a-z0-9_]{3,20}$/.test(ten) || !/^\d{13}$/.test(het) || t < Date.now()) return null;
  const dung = Buffer.from(ky(`${ten}.${het}`)), co = Buffer.from(sig);
  if (dung.length !== co.length || !crypto.timingSafeEqual(dung, co)) return null;
  return biThuHoi(ten) ? null : { ten, het: t };
}
const doc = (req) => { const o = docPhieu(req); return o ? o.ten : null; };
const canLamMoi = (req, ten) => { const o = docPhieu(req); return !o || o.ten !== ten || o.het - Date.now() < LAM_MOI; };
const duoi = (req) => `; Path=/; HttpOnly; SameSite=Lax${https(req) ? "; Secure" : ""}`;
function cap(req, ten) { const het = Date.now() + HAN, v = `${ten}.${het}`; return `${TEN}=${v}.${ky(v)}; Max-Age=${HAN / 1000}${duoi(req)}`; }
const xoa = (req) => `${TEN}=; Max-Age=0${duoi(req)}`;

const demTk = new Map(), daBao = new Map();
let donLuc = 0;
const ngayVN = (t) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);
function bao(ten, khoa, cau, req) {
  const t = Date.now();
  if (daBao.get(khoa) > t - GIO) return;
  daBao.set(khoa, t);
  const ip = req.headers["cf-connecting-ip"] || (req.socket && req.socket.remoteAddress) || "?";
  console.log(cau);
  try { NK.ghi("sao", ten, null, cau, { ip }); } catch {}
}
function dem(ten, p, req) {
  const t = Date.now(), ngay = ngayVN(t);
  if (t - donLuc > CUA_SO) { // dọn: khung cũ bỏ danh sách tệp (giữ số trong ngày), sang ngày khác thì bỏ hẳn
    donLuc = t;
    for (const [k, v] of demTk) if (t - v.t0 > 2 * CUA_SO) { if (v.ngay !== ngay) demTk.delete(k); else { v.ds = new Set(); v.truoc = 0; } }
    for (const [k, v] of daBao) if (t - v > GIO) daBao.delete(k);
  }
  let o = demTk.get(ten);
  if (!o) { o = { t0: t, ds: new Set(), truoc: 0, ngay, n: 0 }; demTk.set(ten, o); }
  if (t - o.t0 > CUA_SO) { o.truoc = t - o.t0 <= 2 * CUA_SO ? o.ds.size : 0; o.t0 = t; o.ds = new Set(); } // khung trước liền kề: cộng dồn (không lách được ở mép khung)
  if (o.ngay !== ngay) { o.ngay = ngay; o.n = 0; }
  o.n++;
  if (o.n === NGUONG_NGAY + 1) bao(ten, "ngay|" + ten, `Nghi tài khoản ${ten} chép tài nguyên: lấy hơn ${NGUONG_NGAY} tệp trong ngày`, req);
  if (o.ds.size + o.truoc > NGUONG) return;
  o.ds.add(p);
  if (o.ds.size + o.truoc > NGUONG) bao(ten, "khung|" + ten, `Nghi tài khoản ${ten} chép tài nguyên: lấy hơn ${NGUONG} tệp khác nhau trong ${(2 * CUA_SO) / 60e3} phút`, req);
}

module.exports = { can, doc, cap, xoa, canLamMoi, dem, thuHoi, traLai, TEN };
