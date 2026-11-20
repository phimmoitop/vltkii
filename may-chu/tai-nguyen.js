// Tài nguyên giữ ở trình duyệt (anh 28/10: "lần đầu vào game tự tải trước 1 phần tài nguyên — giao diện cơ bản, kĩ năng, shop thuốc —
// chỉ lần đầu, sau đó trình duyệt tự lưu để lần sau không phải tải lại"):
//   GET /api/tai-nguyen -> { thu: { "assets/ui/win/img": "Xk3…", … } }  phiên bản từng thư mục trong assets/ (băm tên + cỡ + giờ sửa các
//       file nằm ngay trong thư mục đó). Service worker (src/sw.js) giữ file trong Cache Storage kèm phiên bản thư mục: còn khớp thì lấy
//       luôn, không hỏi máy chủ; thư mục có file đổi (dựng lại hình, sửa bảng) thì file của thư mục đó tải lại khi cần.
//   GET /api/tai-truoc  -> { khoa, ds: [[đường dẫn, cỡ, phiên bản thư mục], …] }  gói tải trước lần đầu vào game (src/game/tai-truoc.js): giao diện (assets/ui trừ màn
//       tạo nhân vật), icon đồ + võ công, bảng dữ liệu, tiếng cơ bản, hiệu ứng trúng đòn / đồ rơi, các bảng chỉ mục; hình + tiếng võ công
//       (assets/web/vocong/spr, snd) gửi cả, trình duyệt chỉ lấy của phái mình (theo vocong.json). khoa = băm phiên bản cả gói: trình duyệt
//       nhớ khoa đã tải đủ -> lần sau khớp thì bỏ qua ngay.
// Quét assets/ 1 lần lúc bật (không chặn máy chủ); file đổi lúc đang chạy -> fs.watch đánh dấu thư mục, lần hỏi sau quét lại thư mục đó.
"use strict";
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

// thư mục -> { v: phiên bản, f: [[tên, cỡ]] }
const THU = new Map();
let quet = null; // lần quét đầu (Promise)
const ban = new Set(); // thư mục cần quét lại

async function quetThu(dir) { // chỉ file nằm ngay trong dir; trả các thư mục con
  let ds;
  try { ds = await fsp.readdir(dir, { withFileTypes: true }); } catch { THU.delete(rel(dir)); return []; }
  const f = [], con = [];
  for (const d of ds) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) con.push(p);
    else if (d.isFile()) { try { const st = await fsp.stat(p); f.push([d.name, st.size, Math.floor(st.mtimeMs)]); } catch {} }
  }
  f.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (f.length) THU.set(rel(dir), { v: crypto.createHash("sha1").update(JSON.stringify(f)).digest("base64url").slice(0, 10), f: f.map(([n, s]) => [n, s]) });
  else THU.delete(rel(dir));
  return con;
}
async function quetCay(dir) { for (const c of await quetThu(dir)) await quetCay(c); }
function batDau() {
  if (quet) return quet;
  quet = quetCay(ASSETS).catch(() => {});
  const quetMoiPhut = () => setInterval(() => ban.add("*"), 60000).unref(); // không theo dõi được: 1 phút quét lại cả cây 1 lần khi có người hỏi
  try { // Windows / macOS: theo dõi cả cây
    const w = fs.watch(ASSETS, { recursive: true }, (ev, f) => { if (f) ban.add(path.dirname(path.join(ASSETS, String(f)))); });
    // lỗi giữa chừng (rà soát 12/11: Linux theo dõi từng tệp — assets ~18.800 tệp + thư mục mà máy S1 / S2 chỉ cho ~15.200 suất inotify -> lần chép tệp
    // vào assets/ sau đó Node báo 'error' ENOSPC, trước không ai bắt = SẬP máy chủ): thôi theo dõi, quét lại mỗi phút
    let hong = false;
    w.on("error", (e) => { if (hong) return; hong = true; console.error("Theo dõi assets/ lỗi (" + ((e && e.code) || e) + ") — chuyển sang quét lại mỗi phút"); try { w.close(); } catch {} ban.add("*"); quetMoiPhut(); });
  } catch { quetMoiPhut(); }
  return quet;
}
let quetLai = null; // đang quét lại cả cây: ai hỏi trong lúc đó chờ quét xong (khỏi trả bảng dở — THU vừa xóa)
async function moiNhat() {
  await batDau();
  if (ban.has("*") && !quetLai) { ban.clear(); THU.clear(); quetLai = quetCay(ASSETS).catch(() => {}).finally(() => { quetLai = null; }); }
  if (quetLai) await quetLai;
  for (const d of [...ban]) { // quét lại thư mục có file đổi; thư mục con mới thì quét cả nhánh
    ban.delete(d); if (!d.startsWith(ASSETS)) continue;
    for (const c of await quetThu(d)) if (!THU.has(rel(c))) await quetCay(c);
  }
  return THU;
}

// gói tải trước: thư mục (cả nhánh con) + file lẻ
const GOI = ["assets/ui/", "assets/web/icon/", "assets/data/", "assets/web/fx/", "assets/web/roi/", "assets/web/item/", "assets/web/skill/",
  "assets/web/sound/snd/", "assets/web/vocong/"];
const BO = ["assets/ui/tao_nv/"]; // màn tạo nhân vật: đã qua rồi mới vào game
const LE = ["assets/server.json", "assets/web/sound/sound.json", "assets/web/map/map.json", "assets/web/map/full/index.json",
  "assets/web/jxchar/jxchar.json", "assets/web/npc/npc.json"];
function goi(T) {
  const ds = [];
  for (const [d, o] of T) {
    const k = d + "/";
    const trong = GOI.some((g) => k.startsWith(g)) && !BO.some((b) => k.startsWith(b));
    for (const [n, s] of o.f) { const p = k + n; if ((trong && n !== "README.md") || LE.includes(p)) ds.push([p, s, o.v]); }
  }
  return ds.sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

function gui(req, res, obj) {
  const b = Buffer.from(JSON.stringify(obj)), nen = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  const out = nen ? zlib.gzipSync(b, { level: 6 }) : b;
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": out.length, ...(nen ? { "Content-Encoding": "gzip" } : {}) });
  res.end(out);
}
// trả true nếu đã xử lý
async function xuLy(req, res, p) {
  if (req.method !== "GET") return false;
  if (p === "/api/tai-nguyen") { const T = await moiNhat(); gui(req, res, { thu: Object.fromEntries([...T].map(([d, o]) => [d, o.v])) }); return true; }
  if (p === "/api/tai-truoc") {
    const ds = goi(await moiNhat());
    gui(req, res, { khoa: crypto.createHash("sha1").update(JSON.stringify(ds.map(([p, , v]) => [p, v]))).digest("base64url").slice(0, 12), ds });
    return true;
  }
  return false;
}

module.exports = { xuLy, batDau };
