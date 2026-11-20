// Kho dữ liệu máy chủ: thư mục du-lieu/ (không phát ra ngoài — may-chu/tep.js chỉ phát game.html, src/, assets/).
//   du-lieu/tai-khoan/<tên>.json  1 tài khoản: { v, ten, bam, admin, phien, nv: [nhân vật | null ×3], tao, vao }
//   du-lieu/da-xoa/               nhân vật đã xóa (giữ lại để cứu nếu xóa nhầm)
//   du-lieu/sao-luu/<ngày>/       bản sao tai-khoan/ (+ ma-qua.json, bang-hoi.json — anh 14/11) mỗi ngày, giữ SAO_LUU_GIU bản mới nhất
// Đọc / ghi đồng bộ, mỗi lần 1 file nhỏ: 10 người chơi thì đủ, không phải giữ bộ nhớ đệm (quan-tri.js sửa file lúc máy chủ đang
// chạy vẫn đúng). Ghi an toàn: ghi file tạm rồi đổi tên — tắt máy giữa chừng không hỏng file cũ.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.env.VL_DU_LIEU || path.join(__dirname, "..", "du-lieu"); // VL_DU_LIEU: thư mục khác (chạy thử không đụng dữ liệu thật)
const TK = path.join(ROOT, "tai-khoan");
const SLOT_N = 3, SAO_LUU_GIU = 7;
const TEN_RE = /^[a-z0-9_]{3,20}$/; // tên tài khoản: chữ thường không dấu, số, _
const TAI_KHOAN = new Map(); // tài khoản đang chơi: giữ trong RAM; Render snapshot xuống Sheets mỗi 5 phút
try { for (const f of fs.readdirSync(TK).filter((x) => x.endsWith(".json"))) { try { const tk = JSON.parse(fs.readFileSync(path.join(TK, f), "utf8")); if (tk && TEN_RE.test(tk.ten)) TAI_KHOAN.set(tk.ten, tk); } catch {} } } catch {}

const tenTk = (s) => String(s || "").trim().toLowerCase();
const fileTk = (ten) => path.join(TK, ten + ".json");

function ghi(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, file);
}

function docTk(ten) {
  ten = tenTk(ten);
  if (!TEN_RE.test(ten)) return null;
  return TAI_KHOAN.get(ten) || null;
}
const ghiTk = (tk) => { TAI_KHOAN.set(tk.ten, tk); return tk; };
const coTk = (ten) => { ten = tenTk(ten); return TEN_RE.test(ten) && TAI_KHOAN.has(ten); };
function dsTk() { return [...TAI_KHOAN.values()]; }

// mật khẩu: scrypt + muối ngẫu nhiên; so bằng timingSafeEqual
function bam(mk) {
  const muoi = crypto.randomBytes(16);
  return "scrypt$" + muoi.toString("hex") + "$" + crypto.scryptSync(String(mk), muoi, 64).toString("hex");
}
function dungMk(tk, mk) {
  const [kieu, muoi, h] = String(tk.bam || "").split("$");
  if (kieu !== "scrypt" || !muoi || !h) return false;
  const a = crypto.scryptSync(String(mk), Buffer.from(muoi, "hex"), 64), b = Buffer.from(h, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Tạo tài khoản; tài khoản mới không tự được cấp quyền quản trị.
function taoTk(ten, mk, admin = false) {
  ten = tenTk(ten);
  if (!TEN_RE.test(ten)) throw new Error("Tên tài khoản 3–20 ký tự: chữ thường không dấu, số, dấu _");
  if (String(mk || "").length < 4) throw new Error("Mật khẩu cần ít nhất 4 ký tự");
  if (docTk(ten)) throw new Error(`Tài khoản ${ten} đã có`);
  const tk = { v: 1, ten, bam: bam(mk), admin: !!admin, phien: null, nv: Array(SLOT_N).fill(null), tao: Date.now(), vao: null };
  ghiTk(tk);
  return tk;
}
function doiMk(ten, mk) {
  const tk = docTk(ten); if (!tk) throw new Error(`Không có tài khoản ${tenTk(ten)}`);
  if (String(mk || "").length < 4) throw new Error("Mật khẩu cần ít nhất 4 ký tự");
  tk.bam = bam(mk); tk.phien = null; ghiTk(tk); // đổi mật khẩu thì đăng xuất mọi nơi
  return tk;
}

// tên nhân vật dùng chung cả máy chủ: so không phân biệt hoa thường, gộp khoảng trắng
const khoaTen = (s) => String(s || "").normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
function tenDaCo(ten) {
  const k = khoaTen(ten);
  return dsTk().some((tk) => tk.nv.some((h) => h && khoaTen(h.name) === k));
}

function catXoa(tk, o) {
  const h = tk.nv[o]; if (!h) return;
  ghi(path.join(ROOT, "da-xoa", `${tk.ten}-${o}-${Date.now()}.json`), h);
}

// xóa tài khoản (bảng quản trị — anh 09/11): chuyển tệp sang da-xoa/ — xóa nhầm thì chép ngược về tai-khoan/ là có lại
function xoaTk(ten) {
  ten = tenTk(ten);
  const dich = path.join(ROOT, "da-xoa", `tk-${ten}-${Date.now()}.json`);
  const tk = TAI_KHOAN.get(ten);
  if (!tk) throw new Error(`Không có tài khoản ${ten}`);
  ghi(dich, tk);
  TAI_KHOAN.delete(ten);
}

function ghiTaiKhoanRaDia() {
  fs.mkdirSync(TK, { recursive: true });
  const keep = new Set();
  for (const tk of TAI_KHOAN.values()) { const f = fileTk(tk.ten); keep.add(path.basename(f)); ghi(f, tk); }
  for (const f of fs.readdirSync(TK)) if (f.endsWith(".json") && !keep.has(f)) fs.rmSync(path.join(TK, f), { force: true });
}

// sao lưu tai-khoan/ vào sao-luu/<YYYY-MM-DD>/ (mỗi ngày 1 bản, giữ SAO_LUU_GIU bản mới nhất)
function saoLuu() {
  ghiTaiKhoanRaDia();
  const ngay = new Date().toISOString().slice(0, 10), dir = path.join(ROOT, "sao-luu", ngay);
  let l = []; try { l = fs.readdirSync(TK).filter((f) => f.endsWith(".json")); } catch {}
  if (!l.length) return null;
  fs.mkdirSync(dir, { recursive: true });
  for (const f of l) fs.copyFileSync(path.join(TK, f), path.join(dir, f));
  // mã kích hoạt (may-chu/ma-qua.js — tên có dấu "-" nên không trùng tên tài khoản)
  try { fs.copyFileSync(path.join(ROOT, "ma-qua.json"), path.join(dir, "ma-qua.json")); } catch {}
  // bang hội (anh 14/11 — may-chu/bang-hoi.js: nguồn duy nhất của thành viên / chức vụ / khảo nghiệm; tệp ghi gộp ~2 giây nên bản chép trễ tối đa chừng đó)
  try { fs.copyFileSync(path.join(ROOT, "bang-hoi.json"), path.join(dir, "bang-hoi.json")); } catch {}
  const cu = fs.readdirSync(path.join(ROOT, "sao-luu")).filter((d) => /^\d{4}-\d\d-\d\d$/.test(d)).sort().slice(0, -SAO_LUU_GIU);
  for (const d of cu) fs.rmSync(path.join(ROOT, "sao-luu", d), { recursive: true, force: true });
  return dir;
}

module.exports = { ROOT, SLOT_N, tenTk, docTk, ghiTk, coTk, dsTk, taoTk, doiMk, dungMk, bam, khoaTen, tenDaCo, catXoa, xoaTk, saoLuu, ghiTaiKhoanRaDia };
