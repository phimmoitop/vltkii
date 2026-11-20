// Cấu hình máy chủ chỉnh ở bảng quản trị F10 → Cấu hình (anh 11/11 tối: "tất cả cái nào điều chỉnh trong sv đều để cho admin điều chỉnh được là hay
// nhất … chỉ cần 1 lần thì sau này mình rất là nhàn" -> "làm hết 1 lần rồi lên VPS 1 thể"). README lượt 75.
//   - Gốc: cau-hinh.json (đi theo mã — gửi lên VPS ghi đè). Bản quản trị sửa: du-lieu/cau-hinh-qt.json { sua: { <mục>: phần khác gốc }, ls: [lịch sử] }
//     — gửi mã lên VPS KHÔNG ghi đè (như Lịch hoạt động du-lieu/lich-hd.json). Chỉ lưu PHẦN KHÁC gốc: đối tượng đi sâu từng khóa, mảng / số / chữ thay
//     cả -> bản mã sau thêm khóa mới vào cau-hinh.json vẫn có hiệu lực, khóa quản trị đã sửa vẫn giữ.
//   - apDung(CFG): do.js gọi ngay sau khi đọc cau-hinh.json, trước mọi tệp khác -> tệp nào đọc cấu hình lúc khởi động cũng thấy bản đã sửa.
//   - luu: kiểm kiểu như gốc (số / chữ / đúng sai / mảng / đối tượng; khóa lạ không nhận trừ các bảng tra theo mã; [mã món, số] phải có trong kho đồ),
//     ghi tệp + gán luôn vào cấu hình đang chạy (giữ nguyên đối tượng — tệp nào đọc lúc dùng thì đổi ngay). Tệp nào chép số lúc khởi động (bảng
//     LUAT gửi trình duyệt, mốc thưởng…) thì cần "Khởi động lại máy chủ" + "Bắt cả máy chủ F5" — bảng F10 ghi rõ mục nào đã sửa chưa khởi động lại.
//   - khoiDong: không có hoạt động đang diễn ra / sắp bắt đầu trong 10 phút (như kiem-lich của lệnh lên VPS), báo cả máy chủ trước N giây rồi thoát —
//     systemd (Restart=always) bật lại sau ~3 giây, trình duyệt tự nối lại. Chạy bằng Chay_Game.bat (máy anh) thì thoát xong phải bật lại tay.
//   - taiLai: "bắt cả máy chủ F5" — tăng số lần (du-lieu/tai-lai.json); nhịp trả { tl: { v, g, b } }: trang thấy v tăng so với lúc mở -> đếm ngược g
//     giây rồi tự tải lại (main.js — rải thêm ngẫu nhiên tối đa 15 giây cho khỏi dồn), vào lại đúng nhân vật. b = mã bản trình duyệt (băm tên + cỡ +
//     giờ sửa các tệp src/ + game.html, 30 giây tính lại): đổi (vừa lên VPS) -> trang cũ hiện dòng nhắc "có bản mới" (không bắt).
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const D = require("./du-lieu");

const TEP = path.join(D.ROOT, "cau-hinh-qt.json"), TEP_TL = path.join(D.ROOT, "tai-lai.json");
const LS_MAX = 300;
const NK = () => require("./nhat-ky");
const LHD = () => require("./lich-hd");
const TG = () => require("./the-gioi");
const DO = () => require("./do");
const TC = () => require("./tra-cuu");
// soát 14/11 (anh: đổi quà mốc 150 xong thử vẫn quà cũ): mục đã chuyển sang đọc LÚC DÙNG — lưu là có hiệu lực ngay; mục còn chép số lúc khởi động — phải
// Khởi động lại máy chủ; mục có số chạy trên máy người chơi — Bắt cả máy chủ F5. Mục khác chưa soát: lời nhắc chung (khởi động lại cho chắc)
const SONG = new Set(["thuongCap", "thuongOnline", "dangNhap", "phucDuyen", "bangHoi", "loiDai", "duaNgua", "baoDapAnSu", "khamNam", "tiThi", "baoTriDinhKy", "cuongNo", "nguonSuKien"]); // tiThi: tỉ thí (anh 17/11) — ti-thi.js cf() // khamNam: khảm nạm Thủy tinh (anh 17/11) — kham-nam.js cf() // loiDai: Lôi Đài (anh 15/11) đọc lúc dùng — loi-dai.js cf(); duaNgua: đua ngựa (anh 16/11) — dua-ngua.js cf() (lịch: F10 → Lịch hoạt động); baoDapAnSu: sự kiện Báo Đáp Ân Sư (anh 16/11) — bao-dap-an-su.js cf()
const LDA = () => require("./loi-dai.js"); // Lôi Đài: sân đang dùng chặn khởi động lại an toàn / bắt F5
const CAN_KD = new Set(["ruongXanh", "ruongThanBi", "daTau", "bossTheGioi", "vuotAi"]);
const CAN_F5 = new Set(["tanThu"]);
const lamMoiTc = () => { try { TC().lamMoi(); } catch (e) { console.error("Tra cứu dựng lại sau khi sửa cấu hình:", e.message); } }; // Tra cứu (Phần thưởng…) theo số mới, không cần khởi động lại
// bảng tra theo mã (thêm khóa mới được — giá trị cùng kiểu với các giá trị đang có; bảng trống: số)
const BANG_MO = new Set(["kyNangPhai.phai", "kyNangPhai.chieu", "canBang.bai", "giaBan", "roiDacBiet", "capDong", "soDong", "loaiDo", "daTau.mocNgay", "daTau.mocTong", "khamNam.theoMay"]); // khamNam.theoMay: bật / tắt khảm nạm riêng từng máy (tên máy — anh 17/11)

// bảng chỉ nhận số (% — 1…1000): hệ số kỹ năng phái
const BANG_SO = new Set(["kyNangPhai.phai", "kyNangPhai.chieu"]);
const laDT = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const sao = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const doc = (f, md) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return md; } };
const ghiTep = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const tmp = f + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(o)); fs.renameSync(tmp, f); };
const loi = (m) => { throw Object.assign(new Error(m), { code: 400 }); };

let S = doc(TEP, null); if (!S || !laDT(S.sua)) S = { sua: {}, ls: [] }; if (!Array.isArray(S.ls)) S.ls = [];
let TL = doc(TEP_TL, null); if (!TL || !(TL.v >= 0)) TL = { v: 0, g: 30 };
let GOC = null, CFG = null;          // cấu hình gốc (cau-hinh.json) / cấu hình đang chạy (N.CFG)
const daDoi = new Set();             // mục đã sửa / về mặc định từ lúc máy chủ bật (cần khởi động lại cho chắc)
let hen = null;                      // khởi động lại đang hẹn { luc, ai, t }

// gốc + phần sửa: đối tượng trộn từng khóa (đi sâu), còn lại thay cả
function tron(goc, sua) {
  if (laDT(goc) && laDT(sua)) { const r = { ...goc }; for (const k of Object.keys(sua)) r[k] = tron(goc[k], sua[k]); return r; }
  return sao(sua);
}
// phần khác gốc (undefined: như gốc). Khóa "_…" (lời giải thích) không tính
function khac(goc, moi) {
  if (laDT(goc) && laDT(moi)) {
    const d = {};
    for (const k of Object.keys(moi)) { if (k[0] === "_") continue; const x = k in goc ? khac(goc[k], moi[k]) : sao(moi[k]); if (x !== undefined) d[k] = x; }
    return Object.keys(d).length ? d : undefined;
  }
  return JSON.stringify(goc) === JSON.stringify(moi) ? undefined : sao(moi);
}
// gán vào đối tượng đang chạy, giữ nguyên đối tượng (tệp giữ tham chiếu thấy giá trị mới)
function ganVao(dich, moi) {
  if (laDT(dich) && laDT(moi)) {
    for (const k of Object.keys(dich)) if (!(k in moi) && k[0] !== "_") delete dich[k];
    for (const k of Object.keys(moi)) { if (laDT(dich[k]) && laDT(moi[k])) ganVao(dich[k], moi[k]); else if (Array.isArray(dich[k]) && Array.isArray(moi[k])) dich[k].splice(0, dich[k].length, ...sao(moi[k])); else dich[k] = sao(moi[k]); }
    return dich;
  }
  return sao(moi);
}
const kieu = (v) => (v === null ? "null" : Array.isArray(v) ? "mang" : typeof v === "object" ? "dt" : typeof v);
const maMon = (v) => Array.isArray(v) && v.length >= 1 && v.length <= 3 && typeof v[0] === "string" && /^[a-z]+:[\w:.-]+$/i.test(v[0]) && (v.length < 2 || typeof v[1] === "number");
// dòng ngân lượng trong bảng quà ["tien", số lượng, tỉ lệ?] (anh 16/11 — Báo Đáp Ân Sư: bảng quà hương bao trộn dòng món ["ms:…", số, %] với dòng tiền) — không
// phải mã món nhưng hợp lệ cạnh các dòng [mã món, số]
// soát chéo 17/11: cả ["biKip", số, %] (bossTheGioi.hiem — 1 sách võ công 90 ngẫu nhiên): trước bị từ chối "phải là [mã món, số]" nên trang Boss thế giới không lưu được gì
const laTien = (v) => Array.isArray(v) && v.length >= 2 && v.length <= 3 && (v[0] === "tien" || v[0] === "biKip") && v.slice(1).every((z) => typeof z === "number" && Number.isFinite(z));
// kiểm giá trị mới theo gốc (đường dẫn d để báo lỗi)
function kiem(goc, moi, d) {
  const kg = kieu(goc), km = kieu(moi);
  if (kg === "null" || goc === undefined) { if (["mang", "dt"].includes(km)) return kiemTuDo(moi, d); return; }
  if (kg === "number") { if (km !== "number" || !Number.isFinite(moi)) loi(`${d}: phải là số`); return; }
  if (kg === "boolean") { if (km !== "boolean") loi(`${d}: phải là bật / tắt`); return; }
  if (kg === "string") { if (km !== "string") loi(`${d}: phải là chữ`); if (moi.length > 4000) loi(`${d}: chữ quá dài`); return; }
  if (kg === "mang") {
    if (km !== "mang") loi(`${d}: phải là danh sách`);
    if (moi.length > 2000) loi(`${d}: danh sách quá dài`);
    const mau = goc.find((x) => x != null);
    moi.forEach((x, i) => {
      const dd = `${d}[${i + 1}]`;
      if (laTien(x) && (maMon(mau) || laTien(mau))) { if (x[1] < 0 || (x.length > 2 && x[2] < 0)) loi(`${dd}: số phải từ 0 trở lên`); return; } // ["tien", số, %] cạnh dòng món (anh 16/11)
      if (maMon(x)) { if (!DO().NOI.BY.has(x[0])) loi(`${dd}: không có món mã "${x[0]}" trong kho đồ`); return; }
      if (mau === undefined) return kiemTuDo(x, dd);
      if (laDT(mau) && laDT(x)) { const hop = Object.assign({}, ...goc.filter(laDT)); for (const k of Object.keys(x)) { if (k[0] === "_") continue; if (k in hop) kiem(hop[k], x[k], `${dd}.${k}`); else kiemTuDo(x[k], `${dd}.${k}`); } return; }
      if (maMon(mau) && !maMon(x)) loi(`${dd}: phải là [mã món, số]`);
      if (kieu(mau) !== kieu(x) && !(x === null)) loi(`${dd}: phải cùng kiểu với các dòng khác (${kieu(mau) === "number" ? "số" : kieu(mau) === "string" ? "chữ" : kieu(mau)})`);
      // ô trong dòng: số / chữ / đúng sai, hoặc danh sách mã món "1 trong các món" (Rương Thần Bí ["mon", [mã, mã, mã], tỉ lệ] — soát 14/11: trước bị từ chối, cả mục không lưu được)
      const la = (z) => typeof z === "number" || typeof z === "string" || typeof z === "boolean";
      if (Array.isArray(mau) && Array.isArray(x)) x.forEach((y, j) => { if (Array.isArray(y) ? !y.length || !y.every(la) : !la(y)) loi(`${dd}[${j + 1}]: phải là số / chữ (hoặc danh sách mã món)`); if (Array.isArray(y)) for (const k of y) if (typeof k === "string" && /^[a-z]+:/i.test(k) && !DO().NOI.BY.has(k)) loi(`${dd}[${j + 1}]: không có món mã "${k}" trong kho đồ`); });
    });
    return;
  }
  if (kg === "dt") {
    if (km !== "dt") loi(`${d}: phải là nhóm thông số`);
    const mo = BANG_MO.has(d) || !Object.keys(goc).filter((k) => k[0] !== "_").length || Object.keys(goc).filter((k) => k[0] !== "_").every((k) => /^\d+$/.test(k));
    const mau = Object.values(goc).find((v, i) => Object.keys(goc)[i][0] !== "_" && v != null);
    for (const k of Object.keys(moi)) {
      if (k[0] === "_") continue;
      if (BANG_SO.has(d)) { const v = moi[k]; if (typeof v !== "number" || !(v >= 1 && v <= 1000)) loi(`${d}.${k}: phải là số % từ 1 tới 1000`); continue; }
      if (k in goc) kiem(goc[k], moi[k], `${d}.${k}`);
      else if (mo) { if (mau !== undefined) kiem(mau, moi[k], `${d}.${k}`); else kiemTuDo(moi[k], `${d}.${k}`); }
      else loi(`${d}: không có thông số "${k}" (gõ nhầm tên?)`);
    }
  }
}
// kiểm thêm theo mục (sau kiem kiểu) — anh 16/11, Báo Đáp Ân Sư (baoDapAnSu): ngày "YYYY-MM-DD" giờ Việt Nam, tu < den (den: ngày đã đóng thu thập / làm / dâng),
// moHet (hạn mở hương bao) không trước den
function kiemThem(id, v) {
  if (id !== "baoDapAnSu" || !laDT(v)) return;
  const ngay = (k) => {
    const s = v[k]; if (s === undefined) return null;
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s + "T00:00:00Z"))) loi(`${id}.${k}: ngày phải dạng YYYY-MM-DD, ví dụ 2026-11-18`);
    return s;
  };
  const tu = ngay("tu"), den = ngay("den"), het = ngay("moHet");
  if (tu && den && !(tu < den)) loi(`${id}: ngày bắt đầu (tu) phải trước ngày kết thúc (den — từ ngày đó đã đóng)`);
  if (den && het && het < den) loi(`${id}: hạn mở hương bao (moHet) không được trước ngày kết thúc (den)`);
}
// giá trị không có gốc để so: chỉ cho số / chữ / đúng sai / mảng / nhóm lồng nhau, mã món phải có thật
function kiemTuDo(v, d, sau = 0) {
  if (sau > 8) loi(`${d}: lồng quá sâu`);
  const k = kieu(v);
  if (k === "number" && !Number.isFinite(v)) loi(`${d}: số không hợp lệ`);
  if (k === "string" && v.length > 4000) loi(`${d}: chữ quá dài`);
  if (k === "mang") { if (maMon(v)) { if (!DO().NOI.BY.has(v[0])) loi(`${d}: không có món mã "${v[0]}"`); return; } v.forEach((x, i) => kiemTuDo(x, `${d}[${i + 1}]`, sau + 1)); }
  if (k === "dt") for (const [kk, x] of Object.entries(v)) kiemTuDo(x, `${d}.${kk}`, sau + 1);
}

// do.js: ngay sau khi đọc cau-hinh.json
function apDung(cfg) {
  CFG = cfg; GOC = sao(cfg);
  for (const id of Object.keys(S.sua)) {
    if (!(id in GOC)) continue; // mục đã bỏ khỏi cau-hinh.json
    try { cfg[id] = tron(GOC[id], S.sua[id]); } catch (e) { console.error("Cấu hình quản trị — mục " + id + " lỗi, dùng gốc: " + e.message); }
  }
  return cfg;
}
const muc = () => Object.keys(GOC || {}).filter((k) => k[0] !== "_");
const ghiChu = (id) => (typeof GOC["_" + id] === "string" ? GOC["_" + id] : laDT(GOC[id]) && typeof GOC[id]._ghi_chu === "string" ? GOC[id]._ghi_chu : "");
// các đường dẫn lá khác nhau (tóm tắt nhật ký)
function cacDuong(a, b, d, ra) {
  if (laDT(a) && laDT(b)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (k[0] !== "_") cacDuong(a[k], b[k], d ? `${d}.${k}` : k, ra); return ra; }
  if (JSON.stringify(a) !== JSON.stringify(b)) ra.push(`${d}: ${ngan(a)} -> ${ngan(b)}`);
  return ra;
}
const ngan = (v) => { const s = v === undefined ? "—" : JSON.stringify(v); return s.length > 60 ? s.slice(0, 57) + "…" : s; };

function xem() {
  return {
    muc: muc().map((id) => ({ id, ghi: ghiChu(id), gia: CFG[id], goc: GOC[id], sua: S.sua[id] !== undefined, doi: daDoi.has(id), ...(SONG.has(id) ? { song: 1 } : CAN_KD.has(id) ? { kd: 1 } : CAN_F5.has(id) ? { f5: 1 } : {}) })),
    ls: S.ls.slice(-60).reverse(), hen: hen ? { luc: hen.luc, ai: hen.ai } : null, tl: { v: TL.v, g: TL.g }, ban: BAN,
  };
}
function luu(qt, b) {
  const id = String(b.id || "");
  if (!muc().includes(id)) loi("Không có mục cấu hình này");
  kiem(GOC[id], b.gia, id); kiemThem(id, b.gia);
  const truoc = sao(CFG[id]), d = khac(GOC[id], b.gia);
  if (d === undefined) delete S.sua[id]; else S.sua[id] = d;
  const moi = d === undefined ? sao(GOC[id]) : tron(GOC[id], d);
  CFG[id] = ganVao(CFG[id], moi); daDoi.add(id); lamMoiTc();
  const ds = cacDuong(truoc, moi, id, []);
  S.ls.push({ ai: qt.ten, luc: Date.now(), id, ds: ds.slice(0, 20) }); if (S.ls.length > LS_MAX) S.ls.splice(0, S.ls.length - LS_MAX);
  ghiTep(TEP, S);
  NK().ghi("qt", qt.ten, null, `Cấu hình — ${id}: ${ds.length ? ds.slice(0, 6).join("; ") + (ds.length > 6 ? ` (+${ds.length - 6} chỗ)` : "") : "không đổi"}`);
  const nhac = SONG.has(id) ? "Đã có hiệu lực ngay — không cần khởi động lại." : CAN_F5.has(id) ? `Bấm "Bắt cả máy chủ F5" để người chơi nhận số mới.`
    : `Bấm "Khởi động lại máy chủ" để mọi phần chắc chắn theo số mới, rồi "Bắt cả máy chủ F5" nếu phần hiện trong game đổi.`;
  return { msg: ds.length ? `Đã lưu ${id} (${ds.length} chỗ đổi). ${nhac}` : `${id}: không có gì đổi`, ...xem() };
}
function macDinh(qt, b) {
  const id = String(b.id || "");
  if (!muc().includes(id)) loi("Không có mục cấu hình này");
  const truoc = sao(CFG[id]); delete S.sua[id];
  CFG[id] = ganVao(CFG[id], sao(GOC[id])); daDoi.add(id); lamMoiTc();
  const ds = cacDuong(truoc, GOC[id], id, []);
  S.ls.push({ ai: qt.ten, luc: Date.now(), id, mac: 1, ds: ds.slice(0, 20) }); ghiTep(TEP, S);
  NK().ghi("qt", qt.ten, null, `Cấu hình — ${id}: về mặc định (${ds.length} chỗ)`);
  return { msg: `${id}: đã về mặc định (cau-hinh.json)`, ...xem() };
}
// hoạt động đang diễn ra / sắp bắt đầu trong 10 phút (như kiem-lich.sh của lệnh lên VPS)
const CHAN = new Set(["bossTg", "phongHoa", "sanNhim", "ruongTb", "tongKim", "bauCua", "duaNgua"]); // duaNgua: đua ngựa (anh 16/11)
function dangBan() {
  const ds = [];
  try { const t = Date.now(); ds.push(...LHD().chung().ds.filter((x) => CHAN.has(x.id) && (x.dang || (x.bat && x.toi && x.toi - t < 10 * 60000))).map((x) => `${x.ten}${x.dang ? " (đang diễn ra)" : " (sắp bắt đầu)"}`)); }
  catch {}
  // Lôi Đài (anh 15/11): không theo lịch — sân đang chuẩn bị / đấu / hiện kết quả, hoặc sổ phí còn dòng chưa chốt
  try { const n = LDA().soSanBan(); if (n) ds.push(`Lôi đài (${n} sân đang dùng)`); } catch {}
  return ds;
}
function khoiDong(qt, b) {
  if (b.huy) { if (!hen) loi("Không có lần khởi động lại nào đang hẹn"); clearTimeout(hen.t); hen = null; TG().thongBao("Đã hủy khởi động lại máy chủ.", true); NK().ghi("qt", qt.ten, null, "Hủy khởi động lại máy chủ"); return { msg: "Đã hủy", ...xem() }; }
  if (hen) loi("Đã hẹn khởi động lại rồi");
  const ban = dangBan(); if (ban.length && !b.ep) loi(`Đang có hoạt động: ${ban.join(", ")} — chờ xong rồi khởi động lại`);
  const giay = Math.max(10, Math.min(300, b.giay | 0 || 60));
  TG().thongBao(`Máy chủ sẽ khởi động lại để cập nhật sau ${giay} giây — chỉ mất vài giây, các hạ chờ chút rồi chơi tiếp.`, true);
  const t = setTimeout(() => { try { TG().thongBao("Máy chủ đang khởi động lại…", true); } catch {} setTimeout(() => { try { NK().xa(); } catch {} console.log("Khởi động lại theo lệnh quản trị", qt.ten); if (process.env.VL_MANAGED_SHUTDOWN === "1") process.emit("SIGTERM"); else process.exit(0); }, 1500); }, giay * 1000);
  hen = { luc: Date.now() + giay * 1000, ai: qt.ten, t };
  NK().ghi("qt", qt.ten, null, `Hẹn khởi động lại máy chủ sau ${giay} giây`);
  return { msg: `Máy chủ khởi động lại sau ${giay} giây (đã báo cả máy chủ). Chạy bằng Chay_Game.bat thì thoát xong phải bật lại tay.`, ...xem() };
}
function taiLai(qt, b) {
  // Lôi Đài (anh 15/11): bắt F5 giữa trận = mọi tuyển thủ thoát game (bị loại) -> từ chối như khởi động lại an toàn
  let ld = 0; try { ld = LDA().soSanBan(); } catch {}
  if (ld && !b.ep) loi(`Đang có hoạt động: Lôi đài (${ld} sân đang dùng) — bắt F5 lúc này tuyển thủ bị loại, chờ xong rồi làm`);
  // đua ngựa (anh 16/11): bắt F5 giữa lượt = mọi người đua tải lại trang giữa đường — chờ xong
  let dn = false; try { dn = require("./dua-ngua.js").dangCo(); } catch {}
  if (dn && !b.ep) loi("Đang có hoạt động: Truy Phong Đại Loạn Đấu (đua ngựa) — chờ lượt đua xong rồi làm");
  TL = { v: (TL.v | 0) + 1, g: Math.max(10, Math.min(120, b.giay | 0 || 30)), luc: Date.now(), ai: qt.ten };
  ghiTep(TEP_TL, TL);
  NK().ghi("qt", qt.ten, null, `Bắt cả máy chủ tải lại trang (F5) — sau ${TL.g} giây`);
  return { msg: `Đã gửi lệnh tải lại: mọi người đang chơi thấy đếm ngược ${TL.g} giây rồi tự F5, vào lại đúng nhân vật.`, ...xem() };
}

// mã bản trình duyệt: băm tên + cỡ + giờ sửa các tệp trang (src/ + game.html) — tính lại mỗi 30 giây (lên VPS không khởi động lại vẫn thấy)
const TRANG = process.env.VL_PHAT || path.join(__dirname, "..");
let BAN = "";
function tinhBan() {
  try {
    const h = crypto.createHash("md5"), di = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, c) => (a.name < c.name ? -1 : 1))) { const p = path.join(d, e.name); if (e.isDirectory()) di(p); else { const s = fs.statSync(p); h.update(`${p}|${s.size}|${Math.floor(s.mtimeMs)}\n`); } } };
    di(path.join(TRANG, "src")); const g = fs.statSync(path.join(TRANG, "game.html")); h.update(`game.html|${g.size}|${Math.floor(g.mtimeMs)}`);
    BAN = h.digest("hex").slice(0, 12);
  } catch { /* giữ mã cũ */ }
}
tinhBan(); setInterval(tinhBan, 30000).unref();
const tlNay = () => ({ v: TL.v | 0, g: TL.g | 0, b: BAN });

// POST /api/quan-tri/cau-hinh { viec: xem | luu (id, gia) | macDinh (id) | khoiDong (giay, ep?, huy?) | taiLai (giay) }
function quanTri(qt, b) {
  switch (b.viec) {
    case "luu": return luu(qt, b);
    case "macDinh": return macDinh(qt, b);
    case "khoiDong": return khoiDong(qt, b);
    case "taiLai": return taiLai(qt, b);
    default: return xem();
  }
}

module.exports = { apDung, quanTri, tlNay, _thu: { tron, khac, kiem, ganVao } };
