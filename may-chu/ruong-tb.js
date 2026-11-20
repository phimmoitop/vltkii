// Rương Thần Bí (anh 03/11 — bài "Tính Năng Rương Thần Bí": "vật phẩm của các danh gia vọng tộc làm rơi, bên trong chứa rất nhiều vật phẩm giá trị";
// 20h10 mỗi ngày 3 rương ở các bản đồ cấp 90, báo "Chú ý Rương Thần Bí đã xuất hiện tại bản đồ (…) hãy mau đi tìm"; bài yêu cầu người trong bang hội).
// Anh chọn: mọi bãi từ cấp 90 trở lên (assets/data/ruong-tb.json — cong-cu/dung-ruong-tb.mjs: chỗ ngẫu nhiên, không báo tọa độ); game chưa có bang hội
// nên tạm yêu cầu cấp ≥ CF.capMo (120) — có bang hội thì bắt buộc phải vào bang; tỉ lệ thưởng em đặt tạm (CF.thuong: [loại, giá trị, trọng số] — "kn"
// kinh nghiệm, "mon" món (danh sách = bốc 1), "xu"; 50 / 100 tiền đồng của bài = 10 / 25 Xu theo anh). Số trong cau-hinh.json ruongThanBi.
// Rương ai trong bãi đó cũng thấy (cả bản quái riêng / chung); người đủ điều kiện đứng gần (≤ CF.gan — mốc vị trí gần nhất của the-gioi.js) bấm mở
// trước thì được 1 phần thưởng; túi đầy (phần thưởng là món) thì rương còn nguyên. Mở xong rương biến mất, báo cả máy chủ (câu script VNG
// vng_event\…\mysticchest.lua MysticChestAnnounce "Chúc mừng … đã nhận được … khi sử dụng Rương Thần Bí"). Không ai mở sau CF.song phút thì biến mất.
// Trình duyệt (src/game/main.js ruongNhan): kênh tức thời { t: "rtb", ds: [[mã, bãi, x, y]] } mỗi khi danh sách đổi + kèm nhịp (api.js rtb).
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const WS = require("./ws.js");
const GV = require("./gio-vn.js"); // giờ Việt Nam + ngày trong tuần của lịch (GM chỉnh ở F10 — lich-hd.js)
const MT = require("./mau-tin.js"); // tin hệ thống: tô màu tên nhân vật / phần thưởng (anh 13/11)
const TG = () => require("./the-gioi.js");
const NK = () => require("./nhat-ky.js");

const N = DO.NOI, loi = N.loi;
const CHO = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/ruong-tb.json"), "utf8")).cho || {}; } catch { return {}; } })();
const CF = {
  bat: true, gio: "20:10", so: 3, capMo: 120, song: 120, gan: 300, vuaCap: true,
  thuong: [["kn", 10000000, 20], ["kn", 15000000, 15], ["kn", 20000000, 10], ["kn", 30000000, 5], ["mon", "ms:11", 10], ["mon", "ms:20", 10], ["mon", "ms:15", 3],
    ["mon", ["ms:122", "ms:123", "ms:124"], 10], ["mon", "ms:71", 7], ["mon", "ms:125", 7], ["xu", 10, 2.5], ["xu", 25, 0.5]],
  ...(N.CFG.ruongThanBi || {}),
};
let ds = [], seq = 0;          // rương đang có: { id, bai, x, y, X, Y, luc }
const daGoi = new Set();       // ngày đã ra rương theo lịch
const tenBai = (z) => (N.ZONES.get(+z) || {}).n || `bãi ${z}`;
const so = (n) => Math.round(n).toLocaleString("vi-VN");
const dong = () => ds.map((r) => [r.id, r.bai, r.x, r.y]);
function phat() { WS.moi((kn) => kn.gui({ t: "rtb", ds: dong() })); }

// ra n rương: bãi ngẫu nhiên (khác nhau khi đủ bãi), chỗ ngẫu nhiên của bãi; tai = [[bãi, x, y]] (quản trị đặt — thử)
function ra(n = CF.so, tai) {
  const t = Date.now(), moi = [];
  if (Array.isArray(tai) && tai.length) for (const [bai, x, y] of tai.slice(0, 10)) moi.push({ bai: +bai, x: Math.round(+x || 0), y: Math.round(+y || 0), X: 0, Y: 0 });
  else {
    // vuaCap: chỉ bãi người đủ cấp mở rương vào được (cấp ≥ cấp vào bãi — do.js capVao; bãi train mở theo cấp) — mốc = cấp cao nhất của người
    // đang chơi, ít nhất CF.capMo: rương không ra ở bãi cấp 190 chưa ai tới được
    const capMax = Math.max(CF.capMo, ...TG().dsDangChoi().map((p) => p.lvl | 0));
    const bais = Object.keys(CHO).filter((b) => CHO[b].length && N.ZONES.get(+b) && (!CF.vuaCap || N.capVao(N.ZONES.get(+b)) <= capMax));
    for (let i = bais.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bais[i], bais[j]] = [bais[j], bais[i]]; }
    for (let i = 0; i < n && bais.length; i++) { const b = bais[i % bais.length], L = CHO[b], c = L[Math.floor(Math.random() * L.length)]; moi.push({ bai: +b, x: c[0], y: c[1], X: c[2], Y: c[3] }); }
  }
  if (!moi.length) loi("Chưa có chỗ ra rương (node cong-cu/dung-ruong-tb.mjs)");
  TG().thongBao(`${moi.length} Rương Thần Bí đã xuất hiện ở các bãi từ cấp 90 trở lên — xem kênh hệ thống và mau đi tìm!`, true);
  for (const r of moi) { r.id = ++seq; r.luc = t; r.het = t + CF.song * 60000; ds.push(r); TG().thongBao(`Chú ý: Rương Thần Bí đã xuất hiện tại bản đồ ${tenBai(r.bai)}, hãy mau đi tìm!`); }
  phat();
  return moi;
}
// 1 phần thưởng bốc theo trọng số -> [loại, giá trị]
function boc() {
  const L = (CF.thuong || []).filter((r) => +r[2] > 0), tong = L.reduce((t, r) => t + +r[2], 0);
  let x = Math.random() * tong;
  for (const r of L) { x -= +r[2]; if (x < 0) return r; }
  return L[L.length - 1];
}
// mở rương id (api.js /api/ruong-tb): tk = tài khoản, h = nhân vật -> { msg, len }
function mo(tk, h, id) {
  if (!CF.bat) loi("Hoạt động Rương Thần Bí hiện đang tạm dừng");
  const r = ds.find((x) => x.id === +id); if (!r) loi("Rương Thần Bí đã bị người khác mở mất rồi!");
  const p = TG().dangChoi(tk);
  if (!p || p.zone !== r.bai || Math.hypot(p.x - r.x, p.y - r.y) > CF.gan) loi("Các hạ đứng quá xa rương, hãy lại gần hơn");
  if ((h.lvl || 1) < CF.capMo) loi(`Cần đạt cấp ${CF.capMo} trở lên mới đủ thực lực mở Rương Thần Bí`);
  // bang hội đợt 2 (cau-hinh.json bangHoi.ruongCanBang — chỉ khi máy đã có ≥ 1 bang qua khảo nghiệm): chỉ thành viên bang mở được; hôm rời bang vẫn mở được
  { let ly = null; try { ly = require("./bang-hoi.js").chanRtb(tk, h); } catch {} if (ly) loi(ly); }
  const [loai, gt] = boc(); let ten;
  if (loai === "kn") { h.exp = (h.exp || 0) + gt; ten = `${so(gt)} điểm kinh nghiệm`; }
  else if (loai === "xu") { h.xu = (h.xu | 0) + gt; ten = `${gt} Xu`; }
  else { const k = Array.isArray(gt) ? gt[Math.floor(Math.random() * gt.length)] : gt; DO.taoQua(h, { mon: [{ k, n: 1 }] }); ten = String((N.BY.get(k) || {}).n || k).trim(); } // túi đầy: lỗi, rương còn nguyên
  ds = ds.filter((x) => x !== r); phat();
  h.lvl = h.lvl || 1; const len = loai === "kn" ? N.lenCap(h) : 0;
  TG().thongBao(`Chúc mừng ${MT.ten(h.name)} đã nhận được ${MT.thuong(ten)} khi mở Rương Thần Bí tại ${tenBai(r.bai)}!`);
  NK().ghi("hiem", tk, h.name, `Rương Thần Bí (${tenBai(r.bai)}): ${ten}`);
  return { msg: `Mở Rương Thần Bí: nhận được ${ten}`, len };
}

// công cụ thử (tài khoản quản trị): { viec: "ra" (so?, tai?: [[bãi, x, y]]) | "huy" | "xem" }
function quanTri(b) {
  if (b.viec === "ra") return { ra: ra(Math.max(1, Math.min(10, +b.so || CF.so)), b.tai), ds: dong() };
  if (b.viec === "huy") { ds = []; phat(); }
  return { ds: ds.map((r) => ({ id: r.id, bai: r.bai, tenBai: tenBai(r.bai), X: r.X, Y: r.Y, phut: Math.round((Date.now() - r.luc) / 60000) })), gio: CF.gio, capMo: CF.capMo, bai: Object.keys(CHO).length };
}

WS.nhan("mo", (kn) => kn.gui({ t: "rtb", ds: dong() }));
WS.nhan("vao", (kn) => kn.gui({ t: "rtb", ds: dong() }));
// lịch (giờ Việt Nam): ra rương đúng CF.gio; rương quá CF.song phút chưa ai mở thì biến mất
setInterval(() => {
  const t = Date.now();
  const het = (r) => r.het || r.luc + CF.song * 60000; // hạn ghi lúc ra (anh 05/11 — GM đổi "Rương còn" chỉ áp dụng rương ra sau)
  if (ds.some((r) => t > het(r))) { ds = ds.filter((r) => t <= het(r)); phat(); }
  if (!CF.bat) return;
  const vn = new Date(t + 7 * 3600e3).toISOString(), ngay = vn.slice(0, 10);
  if (vn.slice(11, 16) === CF.gio && !daGoi.has(`${ngay} ${CF.gio}`) && GV.thuOk(CF, t)) { daGoi.add(`${ngay} ${CF.gio}`); try { ra(CF.so); } catch (e) { console.error("Rương Thần Bí:", e.message); } }
}, 5000).unref();

module.exports = { mo, dong, quanTri, CF };
