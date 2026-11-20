// Phát file game cho trình duyệt: chỉ game.html, src/, assets/ — không lộ du-lieu/ (mật khẩu đã băm, nhân vật), may-chu/, tài liệu.
// File đã tải thì trình duyệt hỏi lại kèm If-Modified-Since -> 304 không gửi lại (người chơi vào qua Internet đỡ tải lại hình).
// Đỡ lag qua đường hầm (25/10): hình / tiếng / font (tên file ít khi đổi) cho trình duyệt — và Cloudflare nếu nó lưu đệm — giữ 1 ngày,
// khỏi hỏi lại máy anh mỗi lần vào bãi (đổi hình mà giữ tên thì người chơi Ctrl + F5); code + bảng dữ liệu (.js, .json…) vẫn hỏi lại
// mỗi lần như cũ, gửi nén gzip (nhỏ ~5–10 lần, nhớ bản nén tới khi file đổi).
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { pipeline } = require("stream");

const ROOT = path.join(__dirname, "..");
// bản phát hành (anh 10/11 — chống sao chép: cong-cu/dung-ban-phat-hanh.mjs nén mã, bỏ ghi chú): VPS chép thẳng bản nén vào game.html + src/;
// máy thử chạy bản nén thì đặt VL_PHAT = thư mục bản nén (ban-dung) — game.html + src/ lấy ở đó, assets/ vẫn ở thư mục game
const PHAT = process.env.VL_PHAT ? path.resolve(process.env.VL_PHAT) : ROOT;
const ALLOW = /^(game\.html$|src\/|assets\/)/;
// trang game: không cho trang khác nhúng vào khung (bản sao nhúng game của mình — chống sao chép, anh 10/11)
const DAU_TRANG = { "X-Frame-Options": "DENY", "Content-Security-Policy": "frame-ancestors 'none'", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin" };
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
};
const NEN = new Set([".html", ".js", ".css", ".json", ".svg"]);
const GIU = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".mp3", ".wav", ".ogg", ".woff", ".woff2", ".ttf"]);
const gz = new Map(); // file -> { t: mtimeMs, buf: bản gzip }

function het(res, code) { res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" }); res.end(String(code)); }
function banNen(file, st, cb) {
  const c = gz.get(file);
  if (c && c.t === st.mtimeMs) return cb(null, c.buf);
  fs.readFile(file, (err, b) => {
    if (err) return cb(err);
    zlib.gzip(b, { level: 6 }, (e, buf) => { if (!e) gz.set(file, { t: st.mtimeMs, buf }); cb(e, buf); });
  });
}

// p = đường dẫn đã giải mã (/assets/…)
function phatTep(req, res, p) {
  if (p === "/") p = "/game.html";
  if (p.includes("\0")) return het(res, 400); // ký tự NUL: fs.stat ném lỗi đồng bộ (rà soát lượt 61 — trước làm sập máy chủ)
  const goc = path.join(ROOT, path.normalize(p));
  const rel = path.relative(ROOT, goc).split(path.sep).join("/"); // so SAU khi chuẩn hóa: /assets/../du-lieu/… bị chặn
  if (rel.startsWith("..") || !ALLOW.test(rel)) return het(res, 404);
  const file = PHAT !== ROOT && !rel.startsWith("assets/") ? path.join(PHAT, rel) : goc; // bản phát hành (VL_PHAT): game.html + src/
  fs.stat(file, (err, st) => {
    // người xem đã đóng trang / hủy tải trong lúc chờ fs.stat (anh 12/11 — S2 sập 11:22:59: pipeline vào res đã hủy ném ERR_STREAM_UNABLE_TO_PIPE ngay
    // trong callback này, không ai bắt -> thoát tiến trình): thôi, không gửi gì nữa
    if (res.destroyed) return;
    if (err || !st.isFile()) return het(res, 404);
    const ext = path.extname(file).toLowerCase(), lm = st.mtime.toUTCString(), ims = Date.parse(req.headers["if-modified-since"] || "");
    // private: tài nguyên chỉ cho người đã đăng nhập (lượt 61) — không để bộ đệm dùng chung nào giữ hộ
    const head = { "Cache-Control": GIU.has(ext) ? "private, max-age=86400" : "no-cache", "Last-Modified": lm, ...(NEN.has(ext) ? { Vary: "Accept-Encoding" } : {}),
      ...(rel === "src/sw.js" ? { "Service-Worker-Allowed": "/" } : {}), ...(rel === "game.html" ? DAU_TRANG : {}) }; // service worker nằm ở src/ mà lo cả trang (phạm vi "/")
    if (ims && Math.floor(st.mtimeMs / 1000) <= Math.floor(ims / 1000)) { res.writeHead(304, head); return res.end(); }
    head["Content-Type"] = MIME[ext] || "application/octet-stream";
    if (NEN.has(ext) && st.size > 1024 && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      return banNen(file, st, (e, buf) => {
        if (res.destroyed) return; // người xem ngắt trong lúc nén
        if (e) return het(res, 500);
        res.writeHead(200, { ...head, "Content-Encoding": "gzip", "Content-Length": buf.length });
        res.end(req.method === "HEAD" ? undefined : buf);
      });
    }
    res.writeHead(200, { ...head, "Content-Length": st.size });
    if (req.method === "HEAD") return res.end();
    // lỗi đọc giữa chừng (tệp bị thay lúc đang gửi bản cập nhật…): đóng kết nối, không để lỗi không ai bắt làm sập máy chủ (rà soát lượt 61).
    // Người xem đóng trang / hủy tải giữa chừng: đóng luôn tệp (anh 11/11 — trước pipe() không đóng, máy chủ giữ ~340 tệp hình mở) — pipeline lo cả 2
    // try: res vẫn có thể bị hủy giữa lúc kiểm ở đầu và lúc này (Node ném đồng bộ) — đóng tệp + kết nối, không để lỗi làm sập máy chủ
    const rs = fs.createReadStream(file);
    try { pipeline(rs, res, () => {}); } catch { rs.destroy(); res.destroy(); }
  });
}

module.exports = { phatTep };
