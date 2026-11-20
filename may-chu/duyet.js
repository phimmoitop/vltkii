// Duyệt người chơi vào game (anh 11/11 khuya: "anh sẽ nhập id người chơi vào, anh đồng ý cho vào game để giới hạn người chơi … không chỉ là bảo
// trì, anh sẽ tự giới hạn, anh muốn mỗi người 1 acc thôi"). Bật chế độ duyệt: chỉ tài khoản quản trị + tài khoản đã duyệt đăng nhập / chơi được —
// tài khoản khác đăng nhập bị báo "chưa được duyệt", đang chơi thì yêu cầu kế bị đưa về màn đăng nhập (api.js, như bảo trì). Tắt: mọi tài khoản
// như cũ. Bảo trì vẫn riêng (đang bảo trì: chỉ quản trị, kể cả tài khoản đã duyệt).
// Mỗi người 1 tài khoản: kiểm ở F10 lúc duyệt (may-chu/quan-tri.js "duyet") — tài khoản ghi người chơi (tk.chu) mà người đó đã có tài khoản khác được
// duyệt thì không duyệt; trùng IP gần đây với tài khoản đã duyệt thì vẫn duyệt nhưng báo (cùng wifi / quán net — anh tự xem).
// du-lieu/duyet.json = { bat, ds: { tên tài khoản: { luc, boi } }, luc, boi }
//   bat() · co(ten) (có trong danh sách) · duoc(ten) (chế độ tắt: mọi người) · cau() · tomTat() -> { bat, n } · ds() -> [{ ten, luc, boi }]
//   dat(qt, bat) · them(qt, ten) -> đã thêm · bo(qt, ten) -> đã bỏ
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu");
const NK = require("./nhat-ky");

const TEP = path.join(D.ROOT, "duyet.json");
let S = (() => {
  try { const j = JSON.parse(fs.readFileSync(TEP, "utf8")); return { bat: !!j.bat, ds: j.ds && typeof j.ds === "object" ? j.ds : {}, luc: j.luc || 0, boi: j.boi || null }; }
  catch { return { bat: false, ds: {} }; }
})();
function ghi() {
  try { fs.mkdirSync(D.ROOT, { recursive: true }); const tam = TEP + "." + process.pid + ".tmp"; fs.writeFileSync(tam, JSON.stringify(S)); fs.renameSync(tam, TEP); }
  catch (e) { console.error("Ghi danh sách duyệt lỗi: " + e.message); }
}
const bat = () => !!S.bat;
const co = (ten) => Object.prototype.hasOwnProperty.call(S.ds, D.tenTk(ten));
const duoc = (ten) => !S.bat || co(ten);
const cau = () => "Tài khoản chưa được quản trị duyệt vào máy chủ — liên hệ quản trị (nhóm Zalo) để được duyệt.";
const tomTat = () => ({ bat: !!S.bat, n: Object.keys(S.ds).length });
const ds = () => Object.entries(S.ds).map(([ten, v]) => ({ ten, luc: (v && v.luc) || 0, boi: (v && v.boi) || null }));
function dat(qt, on) {
  S.bat = !!on; S.luc = Date.now(); S.boi = qt.ten; ghi();
  NK.ghi("qt", qt.ten, null, on ? `Bật chế độ duyệt — chỉ quản trị + ${Object.keys(S.ds).length} tài khoản đã duyệt vào game` : "Tắt chế độ duyệt — mọi tài khoản vào game");
  return tomTat();
}
function them(qt, ten) {
  ten = D.tenTk(ten); if (!ten || co(ten)) return false;
  S.ds[ten] = { luc: Date.now(), boi: qt.ten }; ghi();
  NK.ghi("qt", qt.ten, null, `Duyệt tài khoản ${ten} vào game`);
  return true;
}
function bo(qt, ten) {
  ten = D.tenTk(ten); if (!co(ten)) return false;
  delete S.ds[ten]; ghi();
  NK.ghi("qt", qt.ten, null, `Bỏ duyệt tài khoản ${ten}`);
  return true;
}

module.exports = { bat, co, duoc, cau, tomTat, ds, dat, them, bo };
