// Chống sao chép (anh 10/11: "nãy có thằng kia nó copy game y chang của anh … giờ làm sao để anh tự vệ trước bọn này"):
//   chan(req, p)  trang của tên miền khác (bản sao) dùng hình / mã / dữ liệu / API của máy chủ này qua trình duyệt người chơi, hoặc nhúng game vào
//                 khung (iframe) -> { ngoai } (chay-game.js trả 403); mở trang game bằng liên kết từ nơi khác (Zalo, Facebook…) vẫn cho. Dấu hiệu:
//                 Sec-Fetch-Site cross-site / same-site (trình duyệt tự gắn, trang không giả được), không có thì Origin / Referer khác tên miền mình.
//                 Ghi nhật ký loại "sao" mỗi tên miền ngoài 1 lần / giờ -> F10 nhật ký biết bản sao nằm ở đâu
//   wsNgoai(req)  kênh tức thời (/api/ws) mở từ trang tên miền khác -> tên miền đó | null (ws.js từ chối)
//   demTai(req, p) tệp tĩnh (src/, assets/) lấy khi CHƯA đăng nhập: 1 địa chỉ quá NGUONG tệp khác nhau trong CUA_SO -> ghi nhật ký 1 lần / giờ
//                 (công cụ chép trang tải cả kho; người chơi mới mở trang chỉ tải màn đăng nhập + bảng dữ liệu — gói tải trước lúc vào game
//                 đã có phiên nên không tính). Chỉ ghi, không chặn
"use strict";
const NK = require("./nhat-ky");

const GIO = 3600e3, CUA_SO = 10 * 60e3, NGUONG = +process.env.VL_SAO_NGUONG || 800;
const daBao = new Map(); // khóa -> lúc ghi nhật ký gần nhất
const tai = new Map();   // địa chỉ -> { t0, ds: Set<đường dẫn> }

const diaChi = (req) => req.headers["cf-connecting-ip"] || (req.socket && req.socket.remoteAddress) || "?";
const hostCua = (u) => { try { return new URL(u).host.toLowerCase(); } catch { return null; } };
function bao1Lan(khoa, cau, them) {
  const t = Date.now(), c = daBao.get(khoa);
  if (c && t - c < GIO) return;
  daBao.set(khoa, t);
  if (daBao.size > 5000) for (const [k, v] of daBao) if (t - v >= GIO) daBao.delete(k);
  console.log(cau);
  try { NK.ghi("sao", null, null, cau, them); } catch {}
}

// tên miền của chính mình theo yêu cầu: Host (Caddy chuyển nguyên) + X-Forwarded-Host nếu có
const minhCua = (h) => new Set([h.host, h["x-forwarded-host"]].filter(Boolean).map((s) => String(s).split(",")[0].trim().toLowerCase()));
// tên miền ngoài đang dùng tài nguyên của mình qua yêu cầu này | null
function ngoaiCua(req) {
  const h = req.headers, minh = minhCua(h);
  const site = String(h["sec-fetch-site"] || "").toLowerCase();
  const goc = h.origin ? (h.origin === "null" ? "(origin null)" : hostCua(h.origin)) : null;
  const ref = h.referer ? hostCua(h.referer) : null;
  if (site === "cross-site" || site === "same-site") return ref || goc || "(không rõ)";
  if (goc && !minh.has(goc)) return goc;
  if (ref && !minh.has(ref)) return ref;
  return null;
}

function chan(req, p) {
  const h = req.headers, mode = String(h["sec-fetch-mode"] || "").toLowerCase(), dest = String(h["sec-fetch-dest"] || "").toLowerCase();
  // mở trang game (cả tab mới) bằng liên kết từ trang khác: cho; vào bằng khung nhúng (iframe / embed / object) thì không
  if ((p === "/" || p === "/game.html") && (mode === "navigate" || mode === "") && (dest === "document" || dest === "")) return null;
  const ngoai = ngoaiCua(req);
  if (!ngoai) return null;
  bao1Lan("ngoai|" + ngoai, `Chặn trang ngoài dùng tài nguyên / máy chủ: ${ngoai} (${p.slice(0, 80)})`, { ip: diaChi(req) });
  return { ngoai };
}

function wsNgoai(req) {
  const goc = req.headers.origin;
  if (!goc) return null; // trình duyệt luôn gắn Origin cho kênh tức thời; không có = công cụ ngoài trình duyệt (vẫn phải có phiên)
  const g = goc === "null" ? "(origin null)" : hostCua(goc);
  const choPhep = String(process.env.VL_WS_ORIGIN_ALLOW || "").split(",").map((x) => hostCua(x.trim()) || x.trim().toLowerCase()).filter(Boolean);
  if (g && choPhep.includes(g)) return null;
  if (g && minhCua(req.headers).has(g)) return null;
  bao1Lan("ngoai|" + g, `Chặn trang ngoài mở kênh tức thời: ${g}`, { ip: diaChi(req) });
  return g;
}

let donLuc = 0;
function demTai(req, p) {
  const t = Date.now(), ip = diaChi(req);
  if (t - donLuc > CUA_SO) { donLuc = t; for (const [k, v] of tai) if (t - v.t0 > CUA_SO) tai.delete(k); }
  let o = tai.get(ip);
  if (!o || t - o.t0 > CUA_SO) { o = { t0: t, ds: new Set() }; tai.set(ip, o); }
  if (o.ds.size > NGUONG) return;
  o.ds.add(p);
  if (o.ds.size > NGUONG) bao1Lan("tai|" + ip, `Nghi tải trộm tài nguyên: ${ip} lấy hơn ${NGUONG} tệp trong ${CUA_SO / 60e3} phút khi chưa đăng nhập`, { ip });
}

module.exports = { chan, wsNgoai, demTai, ngoaiCua };
