// Săn Nhím Béo Phì (anh 03/11 — "tham khảo hoạt động này và triển khai vào sever của mình", ảnh hoạt động Săn nhím béo phì anh gửi). Mỗi ngày
// các đợt theo giờ Việt Nam (CF.gio — anh chọn 09:40, 13:40, 15:40, 19:40, 23:40), mỗi đợt CF.phut phút: CF.so con Nhím béo phì mỗi thôn / thành
// (Ba Lăng huyện 5, Biện Kinh 5 — hình Nhím của client, mẫu quái CF.tpl) ở chỗ ngẫu nhiên ngoài khu an toàn (assets/data/san-nhim.json —
// cong-cu/dung-san-nhim.mjs), không báo tọa độ. Nhím đứng yên, không đánh trả, cấp nào cũng đánh được. Máu chung ở máy chủ như boss thế giới
// (may-chu/boss-tg.js): mỗi máy tự vẽ nhím, sát thương gửi lên trừ vào máu chung; người ra đòn kết liễu (máy chủ trừ máu về 0) nhận CF.kn kinh
// nghiệm cố định (không chia đội, không nhân Tiên Thảo Lộ) + 1 món ngẫu nhiên: CF.hiemTl % bốc trong CF.hiem (anh: Thủy Tinh + Tinh Hồng Bảo
// Thạch), còn lại bốc trong CF.mon (Tiên Thảo Lộ, Bách Quả Lộ, Quế Hoa Tửu, Phi Tốc hoàn, Đại Lực hoàn, Phúc Duyên Lộ). Mỗi nhân vật bắt tối
// đa CF.ngay con / ngày (giờ Việt Nam): đủ rồi thì đánh không trừ máu (trình duyệt báo). Sát thương chỉ tính khi người đánh cùng bãi, đứng cách
// nhím ≤ CF.gan (mốc vị trí gần nhất — the-gioi.js) và trong hạn mức CF.stGiay / giây (chặn trình duyệt gửi số láo; dư 3 giây dồn). Tin hệ
// thống: trước CF.baoTruoc phút, lúc nhím ra (giữa màn hình), mỗi con bị bắt, lúc hết đợt.
// Trình duyệt (src/game/sannhim.js): kênh WebSocket nhận { t: "snh", s } mỗi khi máu / số con đổi (≤ 4 lần / giây), gửi { t: "nst", u, d }
// (d = phần mới); kênh chưa mở thì đi kèm nhịp (/api/nhip b.nst = [[u, d]], trả snh). Thưởng chờ nhịp sau của nhân vật đó (nhanThuong — túi
// đầy: giữ phần đồ 30 phút). Số con bắt trong ngày lưu ở nhân vật (h.sanNhim = { d: ngày, n }).
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const WS = require("./ws.js");
const GV = require("./gio-vn.js"); // giờ Việt Nam + ngày trong tuần của lịch (GM chỉnh ở F10 — lich-hd.js)
const MT = require("./mau-tin.js"); // tin hệ thống: tô màu tên nhân vật / phần thưởng (anh 13/11)
const TG = () => require("./the-gioi.js");
const NK = () => require("./nhat-ky.js");
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến người kết liễu (5 / con, ≤ 10 / ngày) — nạp lúc dùng

const N = DO.NOI;
const CHO = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/san-nhim.json"), "utf8")).cho || {}; } catch { return {}; } })();
// Anh 13/11 (lượt 86): "Nhím béo phì tăng gấp đôi … ba lăng 10 con, biện kinh 15 con, xuất hiện rải rác, thời gian tồn tại 20 phút", máu 5 triệu 1 con (stGiay lên
// 300000 / giây / người như boss thế giới — 8000 cũ thì 1 người đánh 5 triệu mất hơn 10 phút); tên đánh số (Nhím béo phì 1, 2 …); người đánh trúng đầu tiên (phát hiện)
// + phatKn kinh nghiệm, phatXu % được 1 Xu; mọi người tham gia (có sát thương được tính) lúc nhím bị bắt + thamKn kinh nghiệm, thamXu % được 1 Xu; tin hệ thống mỗi con:
// bị phát hiện bởi ai, do ai kích sát, người tham gia nào may mắn được Xu. Chỗ ra: các con cùng bãi cách nhau ≥ cach (thiếu chỗ thì nới dần — rải rác, khó tìm)
const CF = {
  bat: true, gio: ["09:40", "13:40", "15:40", "19:40", "23:40"], phut: 20, baoTruoc: 5, so: { 53: 10, 37: 15 }, tpl: 12, ten: "Nhím béo phì", lv: 10,
  mau: 5000000, stGiay: 300000, gan: 1200, cach: 1500, kn: 1500000, ngay: 10, hiemTl: 10, phatKn: 500000, phatXu: 50, thamKn: 250000, thamXu: 10,
  mon: [["ms:71", 1], ["ms:73", 1], ["ms:125", 1], ["ms:6", 1], ["ms:3", 1], ["ms:122", 1]],
  hiem: [["qk:238", 1], ["qk:239", 1], ["qk:240", 1], ["qk:353", 1]], ...(N.CFG.sanNhim || {}),
};
const XONG_GIU = 15000, THUONG_GIU = 30 * 60000; // đợt vừa hết: còn báo 15 giây; thưởng chờ tối đa 30 phút

let D = null, xong = null, ver = 0, doi = false, guiLuc = 0;
const cho = new Map();      // tên nhân vật -> [thưởng chờ nhịp sau]
const dem = new Map();      // tên nhân vật -> { d: ngày Việt Nam, n: số con đã bắt } (đồng bộ với h.sanNhim mỗi nhịp — nhanThuong)
const daGoi = new Set();    // "ngày giờ" đã báo / đã mở theo lịch
const tenBai = (z) => (N.ZONES.get(+z) || {}).n || `bãi ${z}`;
const demCua = (ten) => { const d = N.ngayVN(Date.now()); let c = dem.get(ten); if (!c || c.d !== d) dem.set(ten, (c = { d, n: 0 })); return c; };
const tenMon = (L) => L.map((m) => `${m.n > 1 ? `${m.n} ` : ""}${String(DO.tenMon({ k: m.k })).trim()}`).join(", ");

// trạng thái gửi trình duyệt của tài khoản tk: { u (mã đợt), v, het, so, con, ket?: "het", dem (con nhân vật đang chơi đã bắt hôm nay), toiDa,
// lv, ten, ds: [[u, bãi, x, y, hệ, máu, máu tối đa, nhận (sát thương của mình máy chủ đã nhận — cả phần không tính), người bắt?]] } | null
function trangThai(tk) {
  const d = D || xong; if (!d) return null;
  const p = tk ? TG().dangChoi(tk) : null;
  return { u: d.u, v: ver, het: d.het, so: d.ds.length, con: d.ds.filter((n) => !n.ai).length, ...(d.ket ? { ket: d.ket } : {}),
    dem: p ? demCua(p.name).n : 0, toiDa: d.ngay, lv: CF.lv, tpl: CF.tpl, ten: CF.ten,
    ds: d.ds.map((n) => [n.u, n.bai, n.x, n.y, n.he, Math.max(0, Math.ceil(n.mau)), n.mauMax, n.nhan.get(tk) || 0, n.ai || 0, n.so]) }; // [9] số thứ tự (Nhím béo phì N — lượt 86)
}
function phat() { WS.moi((kn) => kn.gui({ t: "snh", s: trangThai(kn.ten) })); }

// mở đợt: opt.tai = [[bãi, x, y]…] (quản trị đặt ở chỗ mình — thử), opt.mau, opt.ngay (giới hạn / ngày riêng đợt này — thử), opt.phut
function mo(opt = {}) {
  if (D) N.loi("Đang có đợt săn nhím");
  const t = Date.now(), mau = Math.max(1, Math.round(+opt.mau || CF.mau)), ds = [];
  const them = (bai, x, y, X, Y) => ds.push({ u: t + ds.length, so: ds.length + 1, bai: +bai, x: Math.round(x), y: Math.round(y), X: X | 0, Y: Y | 0, he: Math.floor(Math.random() * 5),
    mau, mauMax: mau, nhan: new Map(), han: new Map(), tham: new Map(), phat: null });
  if (Array.isArray(opt.tai) && opt.tai.length) for (const [bai, x, y] of opt.tai.slice(0, 20)) them(bai, x, y, 0, 0);
  else for (const [bai, so] of Object.entries(CF.so || {})) {
    // bốc ngẫu nhiên, các con cùng bãi cách nhau ≥ CF.cach; chưa đủ số con thì nới khoảng cách dần (× 0,75 — tới 150) rồi bốc tiếp (lượt 86: rải rác khắp thôn / thành)
    const L = (CHO[bai] || []).slice();
    for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
    let k = 0;
    for (let cach = Math.max(0, +CF.cach || 0); k < so; cach = cach * 0.75) {
      for (const [x, y, X, Y] of L) {
        if (k >= so) break;
        if (ds.some((n) => n.bai === +bai && Math.hypot(n.x - x, n.y - y) < Math.max(cach, 1))) continue;
        them(bai, x, y, X, Y); k++;
      }
      if (cach < 150) break;
    }
  }
  if (!ds.length) N.loi("Chưa có chỗ ra nhím (node cong-cu/dung-san-nhim.mjs)");
  D = { u: t, het: t + Math.max(1, +opt.phut || CF.phut) * 60000, ngay: Math.max(1, +opt.ngay || CF.ngay), ds, ...(Array.isArray(opt.tai) && opt.tai.length ? { thu: 1 } : {}) }; // thu: quản trị đặt tại chỗ để thử — không tính cống hiến bang hội
  xong = null; doi = true;
  const bais = [...new Set(ds.map((n) => n.bai))].map(tenBai).join(" và ");
  // lượt 86: + thưởng người phát hiện / người tham gia
  const tl = (x) => `${+x || 0}%`;
  TG().thongBao(`${ds.length} con ${CF.ten} đã xuất hiện rải rác quanh ${bais}! Ai ra đòn cuối cùng bắt được nhím sẽ nhận ${MT.thuong(`${CF.kn.toLocaleString("vi-VN")} kinh nghiệm`)} và ${MT.thuong("1 phần quà")} (mỗi ngày tối đa ${D.ngay} con)`
    + `${+CF.phatKn > 0 ? `; người phát hiện đầu tiên ${MT.thuong(`+${(+CF.phatKn).toLocaleString("vi-VN")} kinh nghiệm`)} (${tl(CF.phatXu)} được ${MT.thuong("1 Xu")})` : ""}${+CF.thamKn > 0 ? `; mọi người tham gia ${MT.thuong(`+${(+CF.thamKn).toLocaleString("vi-VN")} kinh nghiệm`)} (${tl(CF.thamXu)} được ${MT.thuong("1 Xu")})` : ""}.`, true);
  return trangThai("");
}
// hết giờ / quản trị hủy / bắt hết
function ketThuc(huy) {
  const d = D; if (!d) return null;
  D = null; d.ket = "het"; d.luc = Date.now(); xong = d; doi = true;
  const con = d.ds.filter((n) => !n.ai).length;
  TG().thongBao(huy ? `Đợt Săn Nhím Béo Phì đã bị hủy.` : con ? `Đợt Săn Nhím Béo Phì đã kết thúc — ${con} con ${CF.ten} đã chạy thoát.` : `Cả ${d.ds.length} con ${CF.ten} đợt này đã bị bắt hết!`);
  return true;
}
// 1 món ngẫu nhiên: CF.hiemTl % trong CF.hiem, còn lại trong CF.mon
function boc() {
  const L = Math.random() * 100 < CF.hiemTl && (CF.hiem || []).length ? CF.hiem : CF.mon || [];
  if (!L.length) return [];
  const [k, n] = L[Math.floor(Math.random() * L.length)];
  return [{ k, n: Math.max(1, n | 0) }];
}
const tenCon = (n) => `${CF.ten} ${n.so}`; // Nhím béo phì N (lượt 86)
const vn = (x) => Math.round(x).toLocaleString("vi-VN");
const traoCho = (ten, r) => { if (!cho.has(ten)) cho.set(ten, []); cho.get(ten).push({ luc: Date.now(), mon: [], ...r }); };
// người đánh trúng đầu tiên (có sát thương được tính) — phát hiện nhím n (lượt 86): + phatKn kinh nghiệm, phatXu % được 1 Xu (nhịp sau — nhanThuong), tin hệ thống
function phatHien(n, tk, ten) {
  n.phat = ten;
  const xu = Math.random() * 100 < (+CF.phatXu || 0) ? 1 : 0, kn = Math.max(0, Math.round(+CF.phatKn || 0));
  if (kn || xu) traoCho(ten, { loai: "phat", kn, xu, so: n.so, bai: n.bai });
  TG().thongBao(`${tenCon(n)} ở ${tenBai(n.bai)} đã bị phát hiện bởi ${MT.ten(ten)}${kn ? ` (${MT.thuong(`+${vn(kn)} kinh nghiệm`)})` : ""}${xu ? ` — may mắn nhận được ${MT.thuong("1 Xu")}` : ""}!`);
  NK().ghi("hiem", tk, ten, `Săn nhím: phát hiện ${tenCon(n)} (${tenBai(n.bai)}) — ${kn} kinh nghiệm${xu ? " + 1 Xu" : ""}`);
}
// nhím n bị bắt: tài khoản tk, nhân vật ten ra đòn kết liễu — người kết liễu: CF.kn kinh nghiệm + 1 món (như trước); mọi người tham gia (lượt 86): + thamKn kinh nghiệm,
// thamXu % được 1 Xu
function bat(n, tk, ten) {
  n.mau = 0; n.ai = ten; doi = true;
  const c = demCua(ten); c.n++;
  if (!D.thu) try { BHO().cong(tk, null, ten, "sanNhim"); } catch {} // bang hội đợt 2: chỉ người kết liễu — 5 / con, ≤ 10 / ngày
  const mon = boc(), luc = Date.now();
  if (!cho.has(ten)) cho.set(ten, []);
  cho.get(ten).push({ luc, ngay: c.d, kn: CF.kn, mon, bai: n.bai, dem: c.n, toiDa: D.ngay, bat: 1, so: n.so });
  const tkn = Math.max(0, Math.round(+CF.thamKn || 0)), may = [];
  for (const [tkx, tenx] of n.tham) {
    const xu = Math.random() * 100 < (+CF.thamXu || 0) ? 1 : 0; if (xu) may.push(tenx);
    if (tkn || xu) traoCho(tenx, { loai: "tham", kn: tkn, xu, so: n.so, bai: n.bai });
    NK().ghi("hiem", tkx, tenx, `Săn nhím: tham gia bắt ${tenCon(n)} (${tenBai(n.bai)}) — ${tkn} kinh nghiệm${xu ? " + 1 Xu" : ""}`);
  }
  const con = D.ds.filter((x) => !x.ai).length;
  TG().thongBao(`${tenCon(n)} ở ${tenBai(n.bai)}${n.phat ? ` (phát hiện bởi ${MT.ten(n.phat)})` : ""} đã bị ${MT.ten(ten)} kích sát — ${MT.ten(ten)} nhận ${MT.thuong(`${vn(CF.kn)} kinh nghiệm`)}${mon.length ? ` và ${MT.thuong(tenMon(mon))}` : ""}${n.tham.size ? `; ${n.tham.size} người tham gia mỗi người ${MT.thuong(`+${vn(tkn)} kinh nghiệm`)}` : ""}.${may.length ? ` Người tham gia ${may.map(MT.ten).join(", ")} may mắn nhận được ${MT.thuong("1 Xu")}.` : ""}${con ? ` Còn ${con} con.` : ""}`);
  NK().ghi("hiem", tk, ten, `Săn nhím (${tenBai(n.bai)}): ${CF.kn} kinh nghiệm${mon.length ? " + " + tenMon(mon) : ""} — con thứ ${c.n} hôm nay`);
  if (!con) ketThuc(false);
}

// sát thương tài khoản tk gây cho nhím u: phần mới d. Tổng đã nhận (cả phần không tính) báo lại để trình duyệt chỉ đoán phần còn trên đường
// k: số đòn trúng trong phần này (anh 18/11 — nguồn sự kiện nhim; trình duyệt cũ không gửi = 1) — cắt ≤ NSK_DON_GIAY đòn mỗi giây
const NSK_DON_GIAY = 4, NSK_DEM = new Map(); // tên nhân vật -> { d: ngày, n: số món nguồn sự kiện đã ra hôm nay, han, luc }
const QT_ = (tk) => { try { return require("./bao-mat.js").qtMo(tk); } catch { return false; } }; // quản trị đã mở khóa an toàn: bỏ hạn mức sát thương / giây (anh 18/11 — "Một đòn chết" của công cụ thử)
function danh(tk, u, d, k = 1) {
  if (!D) return false;
  const n = D.ds.find((x) => x.u === +u); if (!n || n.ai || n.mau <= 0) return false;
  d = Math.floor(+d || 0); if (!(d > 0)) return false;
  n.nhan.set(tk, (n.nhan.get(tk) || 0) + d); doi = true;
  const p = TG().dangChoi(tk);
  if (!p || p.zone !== n.bai || !(p.hp > 0) || Math.hypot(p.x - n.x, p.y - n.y) > CF.gan) return false;
  if (demCua(p.name).n >= D.ngay) return false; // đủ số con trong ngày: đánh không trừ máu (trình duyệt báo)
  const t = Date.now(), x = n.han.get(tk) || { han: CF.stGiay * 3, luc: t };
  x.han = Math.min(CF.stGiay * 3, x.han + ((t - x.luc) / 1000) * CF.stGiay); x.luc = t;
  if (QT_(tk)) x.han = Infinity;
  const an = Math.min(d, x.han, n.mau);
  x.han -= an; n.han.set(tk, x); n.mau -= an;
  if (an > 0) { n.tham.set(tk, p.name); if (!n.phat) phatHien(n, tk, p.name); } // người tham gia / phát hiện (lượt 86)
  if (an > 0) nskDon(p.name, k, t);
  if (n.mau <= 0) bat(n, tk, p.name);
  return true;
}

// anh 18/11 — nguồn sự kiện (nguon-su-kien.js nhim): mỗi đòn trúng nhím có tỉ lệ ra món (Trung Dược), tối đa nhim.ngay / ngày — số đòn cắt theo thời gian
// (≤ NSK_DON_GIAY / giây, dồn ≤ 3 giây) -> thưởng chờ nhịp sau (loai "nsk")
function nskDon(ten, k, t) {
  try {
    const M = require("./nguon-su-kien.js"), ngay = GV.vn(t).ngay;
    let c = NSK_DEM.get(ten); if (!c || c.d !== ngay) { c = { d: ngay, n: 0, han: NSK_DON_GIAY * 3, luc: t }; NSK_DEM.set(ten, c); }
    c.han = Math.min(NSK_DON_GIAY * 3, c.han + ((t - c.luc) / 1000) * NSK_DON_GIAY); c.luc = t;
    const so = Math.min(Math.max(1, k | 0), Math.floor(c.han)); if (!(so > 0)) return;
    c.han -= so;
    const L = M.nhim(c.n, so).filter(([kk]) => N.BY.has(kk)).map(([kk, nn]) => ({ k: kk, n: nn }));
    if (!L.length) return;
    c.n++;
    traoCho(ten, { loai: "nsk", kn: 0, xu: 0, mon: L, ngay });
  } catch (e) { console.error("Nguồn sự kiện — săn nhím:", e && e.message); }
}
// nhịp của nhân vật h: đồng bộ số con đã bắt hôm nay (máy chủ vừa chạy lại: lấy từ h.sanNhim) + thưởng đang chờ -> cộng kinh nghiệm + đồ (túi
// đầy: giữ phần đồ chờ nhịp sau, tối đa 30 phút) -> [{ kn, len, mon: [{ k, n }] (đã vào túi), day (túi đầy — đồ còn chờ: cho), bai, dem, toiDa,
// lai (phần đồ chờ nay mới vào túi) }] | null
function nhanThuong(h) {
  if (!h || !h.name) return null;
  const c = demCua(h.name), S = h.sanNhim;
  if (S && S.d === c.d) c.n = Math.max(c.n, S.n | 0);
  // nguồn sự kiện: số món đã ra hôm nay (h.nsk.nhim — máy chủ vừa chạy lại thì lấy lại từ nhân vật)
  try { const K = require("./nguon-su-kien.js").ngay(h), x = NSK_DEM.get(h.name), nay = GV.vn(Date.now()).ngay; if (x && x.d === nay) x.n = Math.max(x.n, K.nhim | 0); else NSK_DEM.set(h.name, { d: nay, n: K.nhim | 0, han: NSK_DON_GIAY * 3, luc: Date.now() }); } catch {}
  const L = cho.get(h.name); if (!L || !L.length) return null;
  const ra = [], con = [], t = Date.now();
  for (const r of L) {
    let len = 0, day = false;
    if (r.kn) { h.exp = (h.exp || 0) + r.kn; h.lvl = h.lvl || 1; len = N.lenCap(h); }
    if (r.xu > 0 && !r.lai) h.xu = (h.xu | 0) + (r.xu | 0); // Xu may mắn (phát hiện / tham gia — lượt 86)
    // đếm con bắt trong ngày: chỉ phần thưởng kết liễu (r.bat — phần phát hiện / tham gia không tính; thưởng cũ trước lượt 86 không có loai)
    if (r.kn && !r.lai && (r.bat || !r.loai)) {
      if (!h.sanNhim || h.sanNhim.d !== r.ngay) h.sanNhim = { d: r.ngay, n: 0 };
      h.sanNhim.n = (h.sanNhim.n | 0) + 1;
    }
    if (r.loai === "nsk" && !r.lai) try { const K = require("./nguon-su-kien.js").ngay(h); K.nhim = (K.nhim | 0) + 1; } catch {} // nguồn sự kiện: đếm vào nhân vật
    if (r.mon.length) {
      try { DO.taoQua(h, { mon: r.mon }); } catch { day = true; if (t - r.luc < THUONG_GIU) con.push({ ...r, kn: 0, lai: true }); }
    }
    if (r.lai && day) continue; // nhận lại phần đồ chờ mà túi vẫn đầy: im (lần đầu đã báo)
    ra.push({ kn: r.kn, len, mon: day ? [] : r.mon, day, bai: r.bai, tenBai: tenBai(r.bai), dem: r.dem, toiDa: r.toiDa, ...(day ? { cho: r.mon } : {}), ...(r.lai ? { lai: true } : {}),
      ...(r.loai ? { loai: r.loai } : {}), ...(r.xu > 0 ? { xu: r.xu | 0 } : {}), ...(r.so ? { so: r.so } : {}) });
  }
  if (con.length) cho.set(h.name, con); else cho.delete(h.name);
  return ra.length ? ra : null;
}

// công cụ thử (chỉ tài khoản quản trị): { viec: "mo" (tai?, mau?, ngay?, phut?) | "huy" | "xem" }
function quanTri(b) {
  if (b.viec === "mo") return { s: mo({ tai: b.tai, mau: b.mau, ngay: b.ngay, phut: b.phut }) };
  if (b.viec === "huy") { if (!ketThuc(true)) N.loi("Không có đợt săn nhím"); return { s: null }; }
  return { s: trangThai(""), lich: CF.gio, bat: !!CF.bat, phut: CF.phut, cho: Object.fromEntries(Object.entries(CHO).map(([k, L]) => [k, L.length])),
    ds: D ? D.ds.map((n) => ({ bai: n.bai, X: n.X, Y: n.Y, mau: Math.ceil(n.mau), ai: n.ai || null })) : [] };
}

WS.nhan("mo", (kn) => kn.gui({ t: "snh", s: trangThai(kn.ten) }));
WS.nhan("vao", (kn) => kn.gui({ t: "snh", s: trangThai(kn.ten) }));
WS.nhan("nst", (kn, tin) => { danh(kn.ten, tin.u, tin.d, tin.k); });

// "HH:MM" lùi p phút (qua nửa đêm thì vòng lại)
const lui = (hm, p) => { const [h, m] = hm.split(":").map(Number), t = (((h * 60 + m - p) % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
// lịch (giờ Việt Nam): báo trước, mở đợt, hết giờ; gửi trạng thái tối đa 4 lần / giây
setInterval(() => {
  const t = Date.now();
  if (D && t >= D.het) ketThuc(false);
  if (xong && t - xong.luc > XONG_GIU) { xong = null; doi = true; }
  if (CF.bat && Array.isArray(CF.gio)) {
    const vn = new Date(t + 7 * 3600000).toISOString(), hm = vn.slice(11, 16), ngay = vn.slice(0, 10);
    for (const g of CF.gio) {
      if (CF.baoTruoc > 0 && hm === lui(g, CF.baoTruoc) && !daGoi.has(`${ngay} b${g}`) && GV.thuOk(CF, t + CF.baoTruoc * 60000)) {
        daGoi.add(`${ngay} b${g}`);
        if (!D) TG().thongBao(`${CF.baoTruoc} phút nữa ${CF.ten} sẽ xuất hiện quanh ${Object.keys(CF.so || {}).map(tenBai).join(" và ")} — các vị anh hùng hãy chuẩn bị đi săn!`);
      }
      if (hm === g && !D && !daGoi.has(`${ngay} ${g}`) && GV.thuOk(CF, t)) { daGoi.add(`${ngay} ${g}`); try { mo({}); } catch (e) { console.error("Săn nhím:", e.message); } }
    }
  }
  if (doi && t - guiLuc >= 250) { doi = false; guiLuc = t; ver++; phat(); }
}, 250).unref();

module.exports = { mo, ketThuc, danh, trangThai, nhanThuong, quanTri, CF, dangCo: () => !!D, demNgay: (ten) => demCua(ten).n };
