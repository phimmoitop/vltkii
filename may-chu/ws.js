// Kênh tức thời WebSocket (anh 31/10 — "quái chung" bước 1: boss thế giới máu chung cần báo máu / chết ngay; nhịp /api/nhip 2 lần / giây
// chậm). RFC 6455 tối giản, không thư viện ngoài (gói không có node_modules): chỉ khung chữ JSON không phân mảnh (≤ 16 KB), ping / pong,
// đóng. Đường: GET /api/ws (Upgrade: websocket) — xác thực bằng cookie phiên như API (api.js tkPhien); Caddy trên VPS chuyển tiếp nâng cấp
// sẵn. Mỗi tài khoản 1 kết nối (mở mới thì đóng cũ). Trình duyệt báo { t: "vao", o, zone, chung? } lúc mở / đổi bãi (chung = đang ở bản quái
// chung của bãi — may-chu/quai-chung.js, anh 03/11: mỗi bãi chính có bản quái riêng + bản quái chung; guiBai chỉ chuyển cho người cùng bản).
//   nhan(loai, fn(kn, tin))  việc cho tin trình duyệt gửi ("mo" = vừa mở kết nối); kn = { ten (tài khoản), o, zone, gui(obj) }. Mỗi loại
//                            nhiều việc (boss thế giới + Vượt Ải tổ đội cùng nghe "mo" / "vao") — chạy lần lượt theo thứ tự nhận
//   guiBai(zone, obj) / guiHet(obj) / guiTk(ten, obj) / moi(fn(kn)) — gửi riêng từng kết nối (vd tin có phần của riêng người đó)
//   cua(ten) -> kết nối đang mở của tài khoản | null;  locBai(fn(tkGui, tkNhan, zone)) — guiBai bỏ người không cùng chỗ (ải tổ đội: chỉ người cùng phòng)
"use strict";
const crypto = require("crypto");
const CSC = require("./chong-sao-chep"); // chống sao chép (anh 10/11): kênh mở từ trang tên miền khác -> từ chối

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const TIN_MAX = 16 * 1024, PING_MS = 25000, CHET_MS = 70000; // ping mỗi 25 giây; 70 giây không nghe gì = mất kết nối
const ds = new Map();     // tài khoản -> kết nối
const viec = new Map();   // loại tin -> [fn(kn, tin)]
function nhan(loai, fn) { viec.set(loai, [...(viec.get(loai) || []), fn]); }
let loc = null;          // fn(tkGui, tkNhan, zone) -> cùng chỗ (guiBai)
function locBai(fn) { loc = fn; }
// bãi có phòng riêng (ải tổ đội, Viêm Đế — vuot-ai.js): fn(zone) -> true thì tin gom "vtb" lọc theo từng người nhận (bãi thường: 1 tin chung cho cả bãi)
let locCan = null;
function locCanBai(fn) { locCan = fn; }

// khung máy chủ gửi (không mặt nạ): FIN + mã, độ dài 7 / 16 / 64 bit
function khung(op, data) {
  const n = data.length;
  let dau;
  if (n < 126) dau = Buffer.from([0x80 | op, n]);
  else if (n < 65536) dau = Buffer.from([0x80 | op, 126, n >> 8, n & 255]);
  else { dau = Buffer.alloc(10); dau[0] = 0x80 | op; dau[1] = 127; dau.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([dau, data]);
}
// hàng chờ gửi của mỗi kết nối (anh 11/11 — máy chủ lag, RAM game ~5 GB: 1 kết nối kẹt 2,2 MB mà máy chủ vẫn dồn tin vào RAM, không giới
// hạn): quá CAT thì cắt hẳn (trình duyệt tự nối lại — src/game/net.js wsMo); quá BO thì bỏ tin vị trí / chiêu (roi — nhịp 0,45 giây vẫn
// đồng bộ lại vị trí); hàng chờ còn quá LUI qua 2 lần ping (25–50 giây) = kẹt thật (người kia vẫn gửi lên mà không nhận về) -> cắt. BO thấp hơn
// LUI nhiều (soát 11/11): máy mạng yếu ở bãi đông chỉ bị bớt tin vị trí, hàng chờ quanh BO — không bị cắt đi cắt lại
const BO = 64 * 1024, LUI = 1024 * 1024, CAT = 4 * 1024 * 1024;
function huyKn(kn) {
  kn.dong = true;
  if (ds.get(kn.ten) === kn) ds.delete(kn.ten);
  try { kn.sock.destroy(); } catch {}
}
function ghi(kn, k, roi) {
  const s = kn.sock; if (s.destroyed) return;
  const L = s.writableLength;
  if (L > CAT) return huyKn(kn);
  if (roi && L > BO) return;
  try { s.write(k); } catch {}
}
// đóng: khung đóng + end(). end() chờ gửi hết hàng chờ — người kia không nhận thì kết nối + hàng chờ nằm mãi trong RAM (anh 11/11) -> hàng chờ
// đang nhiều thì cắt luôn, còn lại 3 giây sau vẫn chưa đóng xong thì cắt
function dongKn(kn, ma) {
  if (kn.dong) return;
  kn.dong = true;
  if (ds.get(kn.ten) === kn) ds.delete(kn.ten);
  const s = kn.sock;
  if (s.writableLength > BO) { try { s.destroy(); } catch {} return; }
  try { const b = Buffer.alloc(2); b.writeUInt16BE(ma); s.end(khung(8, b)); } catch {}
  setTimeout(() => { try { if (!s.destroyed) s.destroy(); } catch {} }, 3000).unref();
}
function chay(kn, tin) {
  for (const fn of viec.get(tin.t) || []) try { fn(kn, tin); } catch (e) { kn.gui({ t: "loi", msg: e.message }); }
}

// gắn vào máy chủ http (chay-game.js): xacThuc(req) -> tài khoản | null (cookie phiên)
function gan(server, xacThuc, tuyChon = {}) {
  server.on("upgrade", (req, sock) => {
    // Node gỡ bộ bắt lỗi của kết nối trước khi báo "upgrade": kết nối bị từ chối (400 / 401 / 403 / 500 bên dưới) mà đầu kia ngắt đột ngột (ECONNRESET)
    // thì lỗi không ai bắt -> SẬP máy chủ (rà soát 12/11 sau lần S2 sập 11:22 — đã tái hiện). Kết nối nhận (101) gắn thêm xong() như cũ
    sock.on("error", () => {});
    let p;
    try { p = new URL(req.url, "http://x").pathname; } catch { return sock.destroy(); }
    const key = req.headers["sec-websocket-key"];
    if (p !== "/api/ws" || String(req.headers.upgrade || "").toLowerCase() !== "websocket" || !key) return void sock.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    // lỗi bất ngờ lúc kiểm (cookie / tệp tài khoản hỏng…) không được làm sập cả máy chủ (rà soát lượt 60)
    let tk;
    try {
      if (CSC.wsNgoai(req)) return void sock.end("HTTP/1.1 403 Forbidden\r\n\r\n"); // trang tên miền khác (bản sao) mở kênh — may-chu/chong-sao-chep.js
      tk = xacThuc(req);
    } catch (e) { console.error(e); return void sock.end("HTTP/1.1 500 Internal Server Error\r\n\r\n"); }
    if (!tk && !tuyChon.khach) return void sock.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
    const acc = crypto.createHash("sha1").update(key + GUID).digest("base64");
    sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acc}\r\n\r\n`);
    sock.setNoDelay(true);
    const kn = { ten: tk ? tk.ten : "guest-" + crypto.randomBytes(12).toString("hex"), daXacThuc: !!tk, rpcCookie: req.headers.cookie || "", reqHeaders: req.headers, remoteAddress: sock.remoteAddress, o: -1, zone: -1, sock, luc: Date.now(), dong: false, ket: 0 }; // guest được dùng RPC đăng ký / đăng nhập; ket: ping thấy hàng chờ quá LUI
    kn.gui = (obj) => { if (!kn.dong) ghi(kn, khung(1, Buffer.from(JSON.stringify(obj))), false); };
    if (tk) { const cu = ds.get(tk.ten); if (cu) dongKn(cu, 4000); ds.set(tk.ten, kn); }
    let buf = Buffer.alloc(0);
    sock.on("data", (d) => {
      buf = buf.length ? Buffer.concat([buf, d]) : d;
      while (buf.length >= 2) {
        const fin = buf[0] & 0x80, op = buf[0] & 0x0f, mat = buf[1] & 0x80;
        let n = buf[1] & 0x7f, o = 2;
        if (n === 126) { if (buf.length < 4) return; n = buf.readUInt16BE(2); o = 4; }
        else if (n === 127) { if (buf.length < 10) return; n = Number(buf.readBigUInt64BE(2)); o = 10; }
        if (!mat || !fin || n > TIN_MAX) return dongKn(kn, 1002); // trình duyệt luôn che mặt nạ; tin phân mảnh / quá lớn: không nhận
        if (buf.length < o + 4 + n) return;
        const m = buf.subarray(o, o + 4), data = Buffer.from(buf.subarray(o + 4, o + 4 + n));
        for (let i = 0; i < n; i++) data[i] ^= m[i & 3];
        buf = buf.subarray(o + 4 + n);
        kn.luc = Date.now();
        if (op === 8) return dongKn(kn, 1000);
        if (op === 9) { ghi(kn, khung(10, data), false); continue; }
        if (op !== 1) continue;
        let tin;
        try { tin = JSON.parse(data.toString("utf8")); } catch { continue; }
        if (!tin || typeof tin.t !== "string") continue;
        if (tin.t === "vao") { kn.vtb = tin.b === 1 ? 1 : 0; kn.o = tin.o | 0; kn.zone = tin.zone | 0; kn.chung = tin.chung ? 1 : 0; kn.moi = "chung" in tin; kn.bdv = tin.bdv | 0; } // moi: trang từ 03/11 (luôn gửi chung); bdv: phiên bản bản đồ bãi của trang (quai-chung.js — anh 11/11)
        chay(kn, tin);
      }
    });
    const xong = () => { kn.dong = true; if (ds.get(kn.ten) === kn) ds.delete(kn.ten); };
    sock.on("close", xong);
    sock.on("error", xong);
    chay(kn, { t: "mo" });
  });
}
setInterval(() => {
  const t = Date.now();
  for (const kn of [...ds.values()]) {
    if (t - kn.luc > CHET_MS) { dongKn(kn, 1001); continue; }
    if (kn.sock.writableLength > LUI) { if (++kn.ket >= 2) { huyKn(kn); continue; } } else kn.ket = 0; // hàng chờ kẹt 2 lần ping liền -> cắt
    ghi(kn, khung(9, Buffer.alloc(0)), false);
  }
}, PING_MS).unref();

// roi = tin bỏ được khi hàng chờ người nhận quá BO (vị trí "vt", chiêu "chieu" — ghi)
// chon(kn) (tùy chọn): chỉ gửi người nhận thỏa (vd chỉ trang cũ chưa nhận tin gom); khung dựng khi gặp người nhận đầu tiên
function guiBai(zone, obj, tru, roi, chon) {
  let k = null;
  for (const kn of ds.values()) if (kn.zone === zone && kn !== tru && !kn.dong && (!tru || !kn.chung === !tru.chung) && (!chon || chon(kn)) && (!loc || !tru || loc(tru.ten, kn.ten, zone))) ghi(kn, k || (k = khung(1, Buffer.from(JSON.stringify(obj)))), roi);
}
// Vị trí gom theo bãi (anh 13/11 tối — độ mượt bước 1): trang mới ("vao" b: 1 -> kn.vtb) không nhận từng mốc "vt" (mỗi mốc × mỗi người cùng bãi: 100 người
// cùng bãi ~33 000 tin / giây, máy chủ quá tải, trả lời chậm 0,3–0,65 giây) mà mỗi GOM_MS 1 tin "vtb" { ds: [[tên nhân vật, [mốc…]], …] } cho cả bãi — dựng 1 lần,
// ghi cho từng người nhận (mục của chính mình người nhận tự bỏ — World.themMoc chỉ nhận người khác). Bãi có phòng riêng (locCan): lọc theo từng người nhận.
// soCu: số trang cũ đang trong bãi (đếm lại mỗi giây) — không còn trang cũ thì bỏ hẳn đường gửi từng mốc
// GUI_LUC: lần gửi tin gom gần nhất của từng bãi — bãi chưa gửi trong GOM_MS mà có mốc mới (người vừa bắt đầu chạy ở bãi vắng) thì gửi ngay, không chờ lượt
const GOM_MS = 50, GOM = new Map(), GUI_LUC = new Map(); // "bãi|chung" -> Map(kn gửi -> [tên nhân vật, mốc]) / -> lúc gửi
let soCu = 0;
function gomVt(kn, ten, tr) {
  if (kn.zone == null || kn.zone < 0 || !Array.isArray(tr) || !tr.length) return;
  const k = kn.zone + "|" + (kn.chung ? 1 : 0); let g = GOM.get(k); if (!g) GOM.set(k, (g = new Map()));
  const cu = g.get(kn); if (cu && cu[0] === ten) cu[1].push(...tr); else g.set(kn, [ten, tr.slice()]);
  if (Date.now() - (GUI_LUC.get(k) || 0) >= GOM_MS) xaGom(k);
}
function xaGom(chi) {
  if (!GOM.size) return;
  const L = chi != null ? (GOM.has(chi) ? [[chi, GOM.get(chi)]] : []) : [...GOM];
  if (chi != null) GOM.delete(chi); else GOM.clear();
  const t = Date.now();
  for (const [k, g] of L) {
    GUI_LUC.set(k, t);
    const i = k.indexOf("|"), zone = +k.slice(0, i), chung = k.slice(i + 1) === "1";
    const gui = [...g.keys()], muc = [...g.values()], phong = !!(loc && locCan && locCan(zone));
    let kc = null;
    for (const nh of ds.values()) {
      if (nh.zone !== zone || nh.dong || !nh.vtb || !nh.chung !== !chung) continue;
      if (!phong) { if (gui.length === 1 && gui[0] === nh) continue; ghi(nh, kc || (kc = khung(1, Buffer.from(JSON.stringify({ t: "vtb", ds: muc })))), true); continue; }
      const r = muc.filter((_, j) => gui[j] !== nh && loc(gui[j].ten, nh.ten, zone));
      if (r.length) ghi(nh, khung(1, Buffer.from(JSON.stringify({ t: "vtb", ds: r }))), true);
    }
  }
}
setInterval(() => { try { xaGom(); } catch (e) { console.error("ws gom vị trí: " + e.message); } }, GOM_MS).unref();
setInterval(() => { let n = 0; for (const kn of ds.values()) if (!kn.dong && !kn.vtb && kn.zone >= 0) n++; soCu = n; const t = Date.now(); for (const [k, l] of GUI_LUC) if (t - l > 60000) GUI_LUC.delete(k); }, 1000).unref();
const coCu = () => soCu > 0;
// hiệu ứng chiêu (anh 31/10 "cho người khác thấy hiệu ứng của người chơi khác khi đánh boss"): { t: "chieu", id, lv, x, y, px, py } -> người khác cùng
// bãi nhận { t: "chieu", ten (tên nhân vật), id, lv, x, y, px, py } để vẽ lại (src/game/vocong.js chieuAo — không sát thương); tối đa 1 tin / 60 ms / người.
// pt = 0 | 1: chiêu của phân thân thứ mấy của người đó (Phân Thân — anh 05/11: người xem vẽ từ phân thân đó — World.ptKhac chu / so)
nhan("chieu", (kn, m) => {
  const t = Date.now(), lk = m.pt === 0 || m.pt === 1 ? "chieuLuc" + m.pt : "chieuLuc"; // phân thân: lượt riêng (soát 05/11)
  if (kn.zone == null || t - (kn[lk] || 0) < 60) return; kn[lk] = t;
  const p = require("./the-gioi.js").dangChoi(kn.ten); if (!p) return;
  const so = (v) => Math.max(0, Math.min(1e6, Math.round(+v || 0)));
  guiBai(kn.zone, { t: "chieu", ten: p.name, id: so(m.id), lv: Math.min(99, so(m.lv)), x: so(m.x), y: so(m.y), px: so(m.px), py: so(m.py), ...(m.pt === 0 || m.pt === 1 ? { pt: m.pt } : {}) }, kn, true);
});
function guiHet(obj) { const k = khung(1, Buffer.from(JSON.stringify(obj))); for (const kn of [...ds.values()]) if (!kn.dong) ghi(kn, k, false); }
function guiTk(ten, obj) { const kn = ds.get(ten); if (kn) kn.gui(obj); }
function cua(ten) { const kn = ds.get(ten); return kn && !kn.dong ? kn : null; }
function ganTaiKhoan(kn, ten) {
  const cu = ds.get(ten);
  if (cu && cu !== kn) dongKn(cu, 4000);
  if (ds.get(kn.ten) === kn) ds.delete(kn.ten);
  kn.ten = ten; kn.daXacThuc = true; ds.set(ten, kn);
}
function dongHet() { for (const kn of [...ds.values()]) dongKn(kn, 1001); }
function moi(fn) { for (const kn of ds.values()) if (!kn.dong) fn(kn); }

module.exports = { gan, nhan, guiBai, guiHet, guiTk, moi, cua, ganTaiKhoan, dongHet, locBai, locCanBai, gomVt, coCu, soKetNoi: () => ds.size, _thu: { xaGom, GOM, ds, GUI_LUC } };
