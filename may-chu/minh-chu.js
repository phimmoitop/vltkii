// Nhiệm vụ Võ Lâm Minh Chủ hằng ngày (anh 03/11 — bài "Tính năng - Nhiệm Vụ Võ Lâm Minh Chủ Hằng Ngày": NPC Hắc Bạch Sứ Giả, mỗi ngày 3 nhiệm vụ —
// Tiêu Diệt Ác Bá 20 triệu, Giao Thư Tuyệt Mật 15 triệu, Thu Thập Nguyên Liệu 15 triệu kinh nghiệm; xong về sứ giả trả nhiệm vụ). Luật + câu theo
// script máy chủ 8.1 Vinh (ổ ảo, chỉ đọc) script\activitysys\config\32\ (config.lua, daily.lua, killdailytask.lua, talkdailytask.lua,
// gatherdailytask.lua, gatherobj.lua) + settings\task\dailytask\*.txt:
//   - cấp 120 trở lên (CheckTotalLevel 120); mỗi loại mỗi ngày hoàn thành 1 lần (bit theo ngày); nhiệm vụ đang làm giữ qua ngày; nhận lại khi
//     đang có thì nhắc tiến độ; xong rồi thì "ngày mai gặp lại"
//   - giết quái: hạ đúng quái ở đúng bãi mới tính, cả tổ đội (OnKillMonster: mọi thành viên) — bản mình: đồng đội cùng bãi, cùng bản, trong tầm
//     chia kinh nghiệm (do.js chiaDoi), cộng ở nhịp của họ (nhanDoi)
//   - đối thoại: nhận "Thư của Long Nhi" (6,1,2571); tới người nhận "Ta đến trao thư cho ngươi" -> mất thư, xong; làm mất thư thì xin lại
//   - thu thập: hái ở cây cùng tên (thanh "Đang thu thập" 3 giây — progressconfig.txt dòng 1), mỗi lần 1 cây; đủ 3 cây nộp (mất 3 cây)
// Anh 03/11: giết 500 con, bãi có cấp vào bằng cấp nhân vật hoặc thấp hơn tối đa 50 cấp (bãi train S1: cấp thấp nhất trong [cấp − 50, cấp], vào
// được — capVao); 1 loại quái thường của bãi (như killmonster.txt); sứ giả ở cả Biện Kinh và Ba Lăng; cây ở Ba Lăng (Kiếm Tâm Hải Đường, Hiệp Hương
// Thảo) + Biện Kinh (Tình Nghĩa Kim Lan, Duyên Trường Thanh Liên); người nhận thư Tiểu Chiêu (thuyền Phong Lăng Độ) / Phụng Phụng (ải Vượt Ải) —
// Tống Kim / Thiên Bảo Khố S1 chưa có. Chỗ đứng: assets/data/minh-chu.json (cong-cu/dung-minh-chu.mjs). Số trong cau-hinh.json minhChu.
// Lời NPC: phông khung lời client thiếu chữ hoa có dấu (Á, Ả, Ở…) — tên động (quái "Ảnh Côn"…) đổi chữ đó thành chữ thường (thuong).
// Thưởng thêm (anh 04/11 lượt 24 — "cho cái nv minh chủ thêm 1 rương quà mỗi nv"): mỗi nhiệm vụ trả xong thêm CF.ruongXanh Bảo rương đồ xanh (do.js
// choRuongXanh — nhịp sau vào túi, túi đầy thì chờ).
// h.mc (máy chủ giữ — api.js GIU): { ngay (ngày Việt Nam của xong), xong: { giet, thu, hai }, giet?: { bai, tenBai, quai, ten, n, can },
//   thu?: { ai, noi, da (0 | 1 đã trao) }, hai?: { loai, ten, bai, tenBai, can }, bat?: { cay, luc } (đang hái), cd?: { mã cây: lúc hái lại được } }
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const TG = () => require("./the-gioi.js");
const TDOI = () => require("./to-doi.js");
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến khi trả nhiệm vụ (giết 20 / đối thoại 15 / thu thập 15) — nạp lúc dùng
const WS = require("./ws.js");

const N = DO.NOI, loi = N.loi;
const doc = (f) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", f), "utf8")); } catch { return null; } };
const MC = doc("assets/data/minh-chu.json") || { suGia: [], cay: [], loaiCay: [], nguoiNhan: [] };
const MONS = (doc("assets/data/monsters.json") || {}).mons || {};
const CF = {
  bat: true, cap: 120, ruongXanh: 1,
  giet: { can: 500, duoi: 50, kn: 20000000, bao: 50 },
  thu: { kn: 15000000, mon: "ms:2571" },
  hai: { can: 3, kn: 15000000, giay: 3, hoi: 60, gan: 250 },
  ve: { ten: "Hộ Vệ Hoa Viên", tpl: 700, lv: 100, mau: 1000000, hoi: 300, hoiCum: true, thay: 280, stGiay: 150000, gan: 1200 },
  ...(N.CFG.minhChu || {}),
};
const XA = N.CHIA_XA || 576; // tầm tính chung cho đồng đội (như chia kinh nghiệm)
const LOAI = new Map(MC.loaiCay.map((o) => [o.loai, o])), CAY = new Map(MC.cay.map((o) => [o.id, o]));
const tenBai = (z) => (N.ZONES.get(+z) || {}).n || `bãi ${z}`;
const so = (n) => Math.round(n).toLocaleString("vi-VN");
const Y = (t) => `<color=yellow>${thuong(t)}<color>`, G = (t) => `<color=green>${thuong(t)}<color>`, R = (t) => `<color=red>${thuong(t)}<color>`; // chữ màu trong lời NPC: tên động qua thuong
const say = (text, opts) => ({ say: { text, opts } });
const talk = (...t) => ({ talk: t });
const HOA = "ÁÀẢÃẠẤẦẨẪẬẮẰẲẴẶÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ";
const thuong = (s) => String(s).replace(new RegExp(`[${HOA}]`, "g"), (c) => c.toLowerCase()); // chữ hoa có dấu -> chữ thường (phông khung lời)
const xung = (h) => (h.sex === "f" ? "Chị" : "Ca Ca"); // GetSex() == 1 and "Chị " or "Ca Ca"
const vi = (h) => (h.sex === "f" ? "Vị Tỷ Tỷ này" : "Vị Ca Ca"); // config.lua 11: Tû Tû nµy / Ca Ca
const dem = (L, k) => (Array.isArray(L) ? L : []).reduce((t, o) => t + (o && o.k === k ? o.n || 1 : 0), 0);
// bớt n món k trong túi (đủ mới bớt) -> true / false
function tru(h, k, n) {
  if (dem(h.bag, k) < n) return false;
  for (const o of [...h.bag]) {
    if (n <= 0) break;
    if (o.k !== k) continue;
    const c = o.n || 1;
    if (c <= n) { h.bag.splice(h.bag.indexOf(o), 1); n -= c; } else { o.n = c - n; n = 0; }
  }
  return true;
}
// trạng thái nhân vật (sang ngày mới: bỏ dấu đã xong)
function tt(h) {
  const P = h.mc && typeof h.mc === "object" ? h.mc : (h.mc = {}), hom = N.ngayVN(Date.now());
  if (P.ngay !== hom) { P.ngay = hom; P.xong = {}; }
  P.xong = P.xong || {};
  return P;
}
const duCap = (h) => (h.lvl || 1) >= CF.cap;
const chuaDuCap = () => talk(`Những đại hiệp cấp ${CF.cap} trở lên mới có thể nhận nhiệm vụ Võ Lâm Minh Chủ.`);

// ---------- giết quái ----------
// bãi train vào được, cấp thấp nhất trong [cấp − duoi, cấp] (anh 03/11); không có thì bãi vào được cấp cao nhất
function chonBai(h) {
  const lv = h.lvl || 1, ds = [...N.ZONES.values()].filter((Z) => N.FARM.has(Z.kind) && !Z.goc && !Z.chiThuyen && Array.isArray(Z.m) && Z.m.length && N.capVao(Z) <= lv);
  const hop = ds.filter((Z) => (Z.lo | 0) >= lv - CF.giet.duoi);
  const L = hop.length ? hop : ds.sort((a, b) => b.lo - a.lo).slice(0, 1);
  return L.length ? L[Math.floor(Math.random() * L.length)] : null;
}
const nhacGiet = (h, G0) => `Vị này ${xung(h)}, ít nhất ngươi cũng giúp ta đuổi cái lũ người đó đi ${G(G0.can)} cái ${Y(thuong(G0.ten))} mới hoàn thành nhiệm vụ, ngươi nhanh chóng đi ${R(thuong(G0.tenBai))} tiếp tục đánh bại họ đi. (đã đánh đuổi ${G0.n}/${G0.can})`;
function nhanGiet(h) {
  if (!duCap(h)) return chuaDuCap();
  const P = tt(h);
  if (P.xong.giet) return talk(`Cái đám người xấu đó hôm nay sẽ không dám đến nữa đâu, ngày mai tiếp tục nhờ ${xung(h)} ngươi giúp đỡ nhé.`);
  if (P.giet) return talk(nhacGiet(h, P.giet));
  const Z = chonBai(h); if (!Z) loi("Chưa có bãi luyện công hợp cấp");
  const quai = Z.m[Math.floor(Math.random() * Z.m.length)], ten = String((MONS[quai] || {}).n || `quái ${quai}`).trim();
  P.giet = { bai: Z.id, tenBai: Z.n, quai, ten, n: 0, can: CF.giet.can };
  return { ...talk(`Nghe Thúc Thúc và Thẩm Thẩm nói rằng ${R(thuong(ten))} ở ${Y(thuong(Z.n))} rất hung dữ, vị này ${xung(h)}, ngươi có thể giúp ta đánh đuổi cái đám người xấu đó ${G(CF.giet.can)} cái ${R(thuong(ten))} được không?`),
    tin: [`Nhận nhiệm vụ Sát quái: hạ ${CF.giet.can} ${ten} ở ${Z.n} (đồng đội cùng bãi hạ cũng tính)`] };
}
// cộng n con vào nhiệm vụ giết quái -> câu báo (con đầu, mỗi bao con, lúc đủ) | null
function cong(G0, n) {
  if (!G0 || G0.n >= G0.can) return null;
  const truoc = G0.n; G0.n = Math.min(G0.can, G0.n + n);
  if (G0.n >= G0.can) return `Nhiệm vụ Sát quái: ${G0.ten} ${G0.n}/${G0.can} — đã đủ, về gặp Hắc Bạch Sứ Giả nhận thưởng`;
  const b = Math.max(1, CF.giet.bao | 0);
  return truoc === 0 || Math.floor(G0.n / b) > Math.floor(truoc / b) ? `Nhiệm vụ Sát quái: ${G0.ten} ${G0.n}/${G0.can}` : null;
}
// do.js gietQuai: 1 con id hạ ở bãi Z (đã nhận) -> câu báo cho người giết | null; đồng đội cùng bãi / bản trong tầm -> xếp hàng chờ (nhanDoi)
const CHO = new Map(); // tài khoản đồng đội -> [{ z, q, n, luc }]
function giet(h, ctx, Z, id) {
  if (!Z || !CF.bat) return null;
  const G0 = h.mc && h.mc.giet, tin = G0 && G0.bai === Z.id && G0.quai === id ? cong(G0, 1) : null;
  const D = TDOI().thanhVien(ctx.ten);
  if (D && D.tv.length > 1) {
    const toi = TG().dangChoi(ctx.ten);
    if (toi) for (const tk of D.tv) {
      if (tk === ctx.ten) continue;
      const o = TG().dangChoi(tk);
      if (!o || o.zone !== Z.id || !o.chung !== !toi.chung || Math.hypot(o.x - toi.x, (o.y - toi.y) * 2) > XA) continue;
      const L = CHO.get(tk) || [], r = L.find((v) => v.z === Z.id && v.q === id);
      if (r) { r.n++; r.luc = Date.now(); } else if (L.length < 20) L.push({ z: Z.id, q: id, n: 1, luc: Date.now() });
      CHO.set(tk, L);
    }
  }
  return tin ? [tin] : null;
}
// nhịp của đồng đội (api.js): cộng các con đồng đội hạ giúp -> { tin, doi } | null
function nhanDoi(h, tk) {
  const L = CHO.get(tk); if (!L) return null;
  CHO.delete(tk);
  const G0 = h.mc && h.mc.giet; if (!G0) return null;
  const t = Date.now(); let n = 0;
  for (const v of L) if (t - v.luc < 10 * 60e3 && v.z === G0.bai && v.q === G0.quai) n += v.n;
  if (!n) return null;
  const m = cong(G0, n);
  return { tin: m ? [`${m} (tổ đội)`] : [], doi: 1 };
}
setInterval(() => { const t = Date.now(); for (const [k, L] of CHO) if (L.every((v) => t - v.luc > 10 * 60e3)) CHO.delete(k); }, 60e3).unref();

// ---------- đối thoại (giao thư) ----------
const NGUOI = new Map(MC.nguoiNhan.map((o) => [o.ten, o]));
// cấp cần để tới chỗ người nhận thư (anh 13/11: "nhiệm vụ này đang bắt phải giao thư cho NPC ở Phong Lăng Độ, mà PLD anh để 160 mới mở — khi nào đủ cấp người chơi mới
// cho nhận"): bãi train -> cấp vào bãi (capVao — cau-hinh.json vaoBai); thuyền Phong Lăng Độ (chỉ lên từ bãi Phong Lăng Độ — bãi gốc Z.goc 336) -> cấp vào bãi gốc;
// chỗ khác (bản đồ Vượt Ải) không chặn. Người nhận đứng nhiều chỗ: lấy chỗ dễ vào nhất
function capNhan(o) {
  const cap = (o.bai || []).map((id) => { const Z = N.ZONES.get(id), G = Z && Z.goc ? N.ZONES.get(Z.goc) : null; return Z ? Math.max(N.FARM.has(Z.kind) ? N.capVao(Z) : 1, G ? N.capVao(G) : 1) : 1; });
  return cap.length ? Math.min(...cap) : 1;
}
const toiDuoc = (h, o) => capNhan(o) <= (h.lvl || 1);
// thư đang mang mà người nhận ở chỗ chưa đủ cấp tới (nhận trước luật trên — vd Tiểu Chiêu trên thuyền Phong Lăng Độ khi chưa cấp 160): đổi sang người nhận tới được,
// thư giữ nguyên (cùng 1 món Thư của Long Nhi). Trả tên người nhận cũ nếu có đổi
function suaThu(h, P) {
  if (!P.thu || P.thu.da) return null;
  const o = NGUOI.get(P.thu.ai); if (!o || toiDuoc(h, o)) return null;
  const ds = MC.nguoiNhan.filter((x) => toiDuoc(h, x)); if (!ds.length) return null;
  const m = ds[Math.floor(Math.random() * ds.length)], cu = P.thu.ai;
  P.thu = { ai: m.ten, noi: m.noi, da: 0 };
  return cu;
}
const doiThu = (h, P, cu) => talk(`${Y(cu)} ở nơi ${xung(h)} ngươi chưa đủ sức tới. Ngươi hãy mang thư này cho ${Y(P.thu.ai)} ở ${R(P.thu.noi)} thay ta, bức thư này rất gấp.`);
function nhanThu(h) {
  if (!duCap(h)) return chuaDuCap();
  const P = tt(h);
  if (P.xong.thu) return talk(`Người đó đã nhận được thư của ta rồi, đa tạ ${xung(h)} ngươi giúp đỡ.`);
  if (P.thu) {
    if (P.thu.da) return talk(`${vi(h)} ngươi đã giúp ta đưa thư đến nơi rồi, thật là cảm tạ. Hãy chọn "Ta đến nhận thưởng nhiệm vụ" để nhận phần thưởng.`);
    const cu = suaThu(h, P); if (cu) return doiThu(h, P, cu);
    return talk(`Vị này ${xung(h)}, ngươi giúp ta mang thư gửi cho ${Y(P.thu.ai)} chưa? Ngươi nhanh chóng đi ${R(P.thu.noi)} tìm cô ấy đi, bức thư này của ta rất gấp đấy.`);
  }
  if (!MC.nguoiNhan.length) loi("Chưa có người nhận thư");
  const ds = MC.nguoiNhan.filter((x) => toiDuoc(h, x)); // chỉ người nhận ở chỗ đủ cấp tới (anh 13/11 — Phong Lăng Độ cấp 160)
  if (!ds.length) return talk(`Hiện chưa có ai cần ${xung(h)} ngươi đưa thư. Khi nào ${xung(h)} ngươi mạnh hơn hãy quay lại tìm ta.`);
  const o = ds[Math.floor(Math.random() * ds.length)];
  try { DO.taoQua(h, { mon: [{ k: CF.thu.mon, n: 1 }] }); } catch { return talk("Hành trang không đủ chỗ"); }
  P.thu = { ai: o.ten, noi: o.noi, da: 0 };
  return { ...talk(`Vị này ${xung(h)}, ngươi có quen ${Y(o.ten)} ở ${R(o.noi)} không? Đã lâu lắm rồi ta chưa gặp cô ấy, ngươi có thể giúp ta mang thư đi không? Cô ấy đang ở ${R(o.noi)}.`),
    tin: [`Nhận nhiệm vụ đối thoại: mang Thư của Long Nhi cho ${o.ten} (${o.noi})`, "Nhận được 1 Thư của Long Nhi"] };
}
// làm mất thư (config.lua 11): đang có nhiệm vụ, chưa trao, trong túi / rương không còn thư -> viết lại
function matThu(h) {
  const P = tt(h);
  if (!P.thu) return talk(`${vi(h)} ta vẫn chưa cần ngươi giúp ta đưa thư.`);
  if (P.thu.da) return talk(`${vi(h)} ngươi đã giúp ta đưa thư đến nơi rồi, thật là cảm tạ.`);
  const co = dem(h.bag, CF.thu.mon) + dem(h.ruong, CF.thu.mon) + (Array.isArray(h.ruongPhu) ? h.ruongPhu.reduce((t, L) => t + dem(L, CF.thu.mon), 0) : 0);
  if (co > 0) return talk(`${vi(h)} trong người ngươi hoặc trong rương chứa đồ của ngươi đã có thư của ta rồi, ngươi tìm kỹ lại xem.`);
  try { DO.taoQua(h, { mon: [{ k: CF.thu.mon, n: 1 }] }); } catch { return talk("Hành trang không đủ chỗ"); }
  return { ...talk("Được rồi, vậy để ta viết lại cho ngươi, cũng như là luyện chữ thôi mà."), tin: ["Nhận lại thư của Long Nhi"] };
}
// đứng gần người nhận (bãi có người đó, cách ≤ 300 — mốc vị trí the-gioi.js)
function ganNguoi(tk, o) {
  const p = TG().dangChoi(tk);
  return !!p && o.bai.includes(p.zone) && Math.hypot(p.x - o.x, p.y - o.y) <= 300;
}
function nguoi(h, tk, ai) {
  const o = NGUOI.get(ai); if (!o) loi("Không có người này");
  return say("Đại hiệp tìm ta có việc gì không?", [["Ta đến trao thư cho ngươi", "traoThu"], ["Kết thúc đối thoại", null]]);
}
// TalkToNpc: đúng người nhận, chưa trao, còn thư trong túi -> mất thư, xong phần trao
function traoThu(h, tk, ai) {
  const o = NGUOI.get(ai); if (!o) loi("Không có người này");
  if (!ganNguoi(tk, o)) loi("Các hạ đứng quá xa, hãy lại gần hơn");
  const P = tt(h);
  if (!P.thu || P.thu.ai !== ai || P.thu.da) return talk("Đại hiệp ngươi có nhầm người không.");
  if (!tru(h, CF.thu.mon, 1)) return talk("Đại hiệp thư của ngươi đâu?");
  P.thu.da = 1;
  return { ...talk("Đa tạ đại hiệp."), tin: [`Đã trao thư cho ${ai} — về gặp Hắc Bạch Sứ Giả nhận thưởng`] };
}

// ---------- thu thập ----------
function nhanHai(h) {
  if (!duCap(h)) return chuaDuCap();
  const P = tt(h);
  if (P.xong.hai) return talk(`Ta đã tặng hoa cho sư bá rồi, cám ơn ${xung(h)} ngươi đã giúp đỡ.`);
  if (P.hai) return talk(`Vị này ${xung(h)}, ngươi giúp ta thu thập đủ ${G(P.hai.can)} cây ${Y(P.hai.ten)} rồi chưa? Ngươi nhanh chân đi ${R(P.hai.tenBai)} thu thập đi, ngày sinh nhật của sư phụ ta sắp đến rồi. (đang có ${dem(h.bag, LOAI.get(P.hai.loai).mon)}/${P.hai.can})`);
  const ds = MC.loaiCay; if (!ds.length) loi("Chưa có cây thu thập");
  const T = ds[Math.floor(Math.random() * ds.length)];
  P.hai = { loai: T.loai, ten: T.ten, mon: T.mon, bai: T.bai, tenBai: tenBai(T.bai), can: CF.hai.can };
  return { ...talk(`Vị này ${xung(h)}, sư phụ của ta nói rằng ${Y(T.ten)} là một loài hoa rất thần kỳ, ta muốn lấy loài hoa này tặng cho sư phụ làm lễ vật, ngươi có thể giúp ta đến ${R(tenBai(T.bai))} giúp ta hái ${G(CF.hai.can)} cây được không? Cây mọc ngoài thành, có ${Y(CF.ve.ten)} canh giữ, phải hạ hết bọn chúng mới hái được.`),
    tin: [`Nhận nhiệm vụ thu thập: hái ${CF.hai.can} ${T.ten} ngoài thành ${tenBai(T.bai)} — hạ 2 ${CF.ve.ten} canh giữ trước`] };
}
// kiểm trước khi hái cây id (bắt đầu / xong): đúng loại đang nhận, chưa đủ, đứng gần, cây đã mọc lại
function kiemCay(h, tk, id) {
  if (!CF.bat) loi("Hoạt động Võ Lâm Minh Chủ hiện đang tạm dừng");
  const C = CAY.get(+id); if (!C) loi("Không có cây này");
  const P = tt(h), T = LOAI.get(C.loai);
  if (!P.hai || P.hai.loai !== C.loai) loi(`Chưa nhận nhiệm vụ thu thập ${T.ten} của Hắc Bạch Sứ Giả`);
  if (dem(h.bag, T.mon) >= P.hai.can) loi("Ngươi đã thu thập đủ đạo cụ cần thiết!");
  const p = TG().dangChoi(tk);
  if (!p || p.zone !== C.bai || Math.hypot(p.x - C.x, p.y - C.y) > CF.hai.gan) loi("Các hạ đứng quá xa, hãy lại gần hơn");
  if (P.cd && P.cd[C.id] > Date.now()) loi(`${T.ten} vừa bị hái, chờ ${Math.ceil((P.cd[C.id] - Date.now()) / 1000)} giây nữa mới mọc lại`);
  const con = [...VE.values()].filter((g) => g.cum === C.cum && !g.chet).length; // quái canh của cụm còn sống: chưa hái được (anh 03/11 lượt 2)
  if (con) loi(`Phải hạ hết ${CF.ve.ten} canh giữ ${T.ten} mới hái được (còn ${con} con)`);
  return { C, T, P };
}
function haiBat(h, tk, id) {
  const { C, P } = kiemCay(h, tk, id);
  P.bat = { cay: C.id, luc: Date.now() };
  return { haiGiay: CF.hai.giay, cay: C.id };
}
function hai(h, tk, id) {
  const { C, T, P } = kiemCay(h, tk, id), t = Date.now();
  if (!P.bat || P.bat.cay !== C.id || t - P.bat.luc < CF.hai.giay * 1000 - 400 || t - P.bat.luc > CF.hai.giay * 1000 + 20000) loi("Thu thập bị gián đoạn, hãy thử lại");
  delete P.bat;
  try { DO.taoQua(h, { mon: [{ k: T.mon, n: 1 }] }); } catch { loi("Hành trang không đủ chỗ"); }
  P.cd = Object.fromEntries(Object.entries(P.cd || {}).filter(([, v]) => v > t)); P.cd[C.id] = t + CF.hai.hoi * 1000;
  const co = dem(h.bag, T.mon);
  return { msg: `Thu thập được 1 ${T.ten} (${co}/${P.hai.can})${co >= P.hai.can ? " — đã đủ, về gặp Hắc Bạch Sứ Giả nhận thưởng" : ""}`, cd: CF.hai.hoi, cay: C.id };
}

// ---------- trả nhiệm vụ ----------
const camOn = (h) => `${xung(h)}, ngươi quả là một vị đại hiệp. Đây là món quà nhỏ ta tặng cho ngươi, mong hãy nhận lấy. Ngày mai gặp lại nhé.`;
function traThuong(h, loai, kn, tenNv, tk) {
  const P = tt(h);
  P.xong[loai] = 1; delete P[loai];
  if (tk) try { BHO().cong(tk, null, h.name, "minhChu", null, { kieu: loai }); } catch {} // bang hội đợt 2: 20 / 15 / 15 (tk = tài khoản — api.js MC.lam)
  h.exp = (h.exp || 0) + kn; h.lvl = h.lvl || 1;
  const len = N.lenCap(h), rx = DO.choRuongXanh(h, CF.ruongXanh | 0);
  return { ...talk(camOn(h)), tin: [`Hoàn thành nhiệm vụ Võ Lâm Minh Chủ (${tenNv}): nhận được ${so(kn)} điểm kinh nghiệm${rx ? ` và ${rx}` : ""}`], len };
}
const timGi = (h) => talk(`Vị này ${xung(h)}, tìm ta có chuyện gì không?`);
function xongGiet(h, tk) {
  const P = tt(h);
  if (!P.giet) return timGi(h);
  if (P.giet.n < P.giet.can) return talk(nhacGiet(h, P.giet));
  return traThuong(h, "giet", CF.giet.kn, "Sát quái", tk);
}
function xongThu(h, tk) {
  const P = tt(h);
  if (!P.thu) return timGi(h);
  if (!P.thu.da) { const cu = suaThu(h, P); if (cu) return doiThu(h, P, cu); }
  if (!P.thu.da) return talk(`Vị này ${xung(h)}, ngươi vẫn chưa giúp ta mang thư cho ${Y(P.thu.ai)}. Ngươi nhanh nhanh đi ${R(P.thu.noi)} tìm cô ấy đi, bức thư này của ta rất gấp.`);
  return traThuong(h, "thu", CF.thu.kn, "Đối thoại", tk);
}
function xongHai(h, tk) {
  const P = tt(h);
  if (!P.hai) return timGi(h);
  const T = LOAI.get(P.hai.loai);
  if (!tru(h, T.mon, P.hai.can)) return talk(`Vị này ${xung(h)}, ngươi vẫn chưa giúp ta hái đủ ${G(P.hai.can)} cây ${Y(P.hai.ten)}, ngươi nhanh đi ${R(P.hai.tenBai)} giúp ta thu thập, sinh nhật của sư phụ ta sắp đến rồi đó.`);
  return traThuong(h, "hai", CF.hai.kn, "Thu thập", tk);
}

// ---------- hội thoại ----------
const LOI_MO = "'Hiệp Chi Đại Giả, Vì Nước Vì Dân'. Lần này ta phụng mệnh sư phụ, đến đây để tìm các chư vị anh hùng hào kiệt. Sư phụ ta nói rằng chỉ cần chúng ta đồng tâm hiệp lực, ắt sẽ có 1 ngày sẽ đánh đuổi được Thát Tử. Nhà ngươi có phải là người mà ta muốn tìm không?";
const LOI_NHAN = () => `Những đại hiệp cấp ${CF.cap} trở lên mỗi ngày có thể đến chỗ của ta đây nhận nhiệm vụ Võ Lâm Minh Chủ, mỗi loại nhiệm vụ mỗi ngày có thể hoàn thành 1 lần, sau khi hoàn thành nhiệm vụ ta sẽ cho ngươi phần thưởng xứng đáng!`;
// b.viec: "mo" | "nhan" | "thuong" | "nhanGiet" | "nhanThu" | "nhanHai" | "matThu" | "xongGiet" | "xongThu" | "xongHai" | "nguoi" (b.ai) | "traoThu"
// (b.ai) | "haiBat" (b.cay) | "hai" (b.cay)
function lam(h, b, tk) {
  if (!CF.bat && !/^(hai|haiBat)$/.test(b.viec)) return talk("Hoạt động Võ Lâm Minh Chủ hiện đang tạm dừng.");
  switch (b.viec) {
    case "mo": return say(LOI_MO, [["Ta đến nhận nhiệm vụ Võ Lâm Minh Chủ", "nhan"], ["Ta đến nhận thưởng nhiệm vụ", "thuong"], ["Kết thúc đối thoại", null]]);
    case "nhan": return say(LOI_NHAN(), [["Nhận nhiệm vụ giết quái", "nhanGiet"], ["Nhận nhiệm vụ đối thoại", "nhanThu"], ["Nhận nhiệm vụ thu thập", "nhanHai"], ["Ta không cẩn thận lầm mất thư của ngươi rồi", "matThu"], ["Trở lại", "mo"]]);
    case "thuong": return say(LOI_NHAN(), [["Nhận phần thưởng nhiệm vụ giết quái", "xongGiet"], ["Nhận phần thưởng nhiệm vụ đối thoại", "xongThu"], ["Nhận phần thưởng nhiệm vụ thu thập", "xongHai"], ["Trở lại", "mo"]]);
    case "nhanGiet": return nhanGiet(h);
    case "nhanThu": return nhanThu(h);
    case "nhanHai": return nhanHai(h);
    case "matThu": return matThu(h);
    case "xongGiet": return xongGiet(h, tk);
    case "xongThu": return xongThu(h, tk);
    case "xongHai": return xongHai(h, tk);
    case "nguoi": return nguoi(h, tk, String(b.ai || ""));
    case "traoThu": return traoThu(h, tk, String(b.ai || ""));
    case "haiBat": return haiBat(h, tk, b.cay);
    case "hai": return hai(h, tk, b.cay);
  }
  loi("Việc không rõ");
}

// trình duyệt (api.js nvCua — bảng nhiệm vụ góc trái main.js nhiemVuHud): nhiệm vụ hôm nay, không đổi h.mc (trừ suaThu — người nhận thư chưa tới được). Nhân vật dưới cấp chưa có gì -> null
function tomTat(h) {
  const P = h.mc && typeof h.mc === "object" ? h.mc : null, hom = N.ngayVN(Date.now());
  if (!P && (h.lvl || 1) < CF.cap) return null;
  if (P && P.thu && !P.thu.da) suaThu(h, P); // thư cho người ở chỗ chưa đủ cấp tới (Phong Lăng Độ 160 — anh 13/11): bảng nhiệm vụ đổi ngay sang người nhận tới được
  const xong = P && P.ngay === hom ? P.xong || {} : {};
  return { cap: CF.cap, ngay: hom, xong: { giet: xong.giet ? 1 : 0, thu: xong.thu ? 1 : 0, hai: xong.hai ? 1 : 0 },
    giet: (P && P.giet) || null, thu: (P && P.thu) || null, hai: P && P.hai ? { ...P.hai, co: dem(h.bag, P.hai.mon) } : null };
}

// ---------- quái canh cây (anh 03/11 lượt 2: "cho thêm vào mỗi bãi 1 2 con quái đứng canh, mỗi con máu 1 triệu, k rơi đồ, đơn thuần chỉ là người bảo vệ
// chỗ này thôi. tên với thanh máu đầy đủ … người nhận nv sẽ kill 2 con quái đó xong mới nhặt dc nguyên liệu … quái hồi sinh sau 5p khi bị giết") ----------
// Mỗi cụm cây 2 con (assets/data/minh-chu.json ve — cong-cu/dung-minh-chu.mjs). Máu chung ở máy chủ như nhím Săn Nhím (may-chu/san-nhim.js): mỗi máy
// tự vẽ + tự đánh (quái mẫu CF.ve.tpl cấp CF.ve.lv, tên CF.ve.ten — đánh trả, thấy người lại gần ≤ CF.ve.thay), sát thương gửi lên trừ máu chung (cùng
// bãi, cách ≤ gan, còn sống, hạn mức stGiay / giây — dư 3 giây dồn); hết máu: chết, CF.ve.hoi giây sau sống lại đủ máu (lan + 1) — hoiCum (mặc định):
// tính từ lúc con CUỐI của cụm chết, cả cụm sống lại cùng lúc (1 con 1 triệu máu đánh vài phút: sống lại từng con thì 1 người đánh con thứ 2 chưa
// xong con thứ 1 đã sống lại — không bao giờ hái được); con chết trước nằm chờ. Không kinh nghiệm,
// không rơi đồ. Hái cây của cụm: phải hạ hết quái canh của cụm (kiemCay). Trình duyệt: src/game/quaicanh.js — kênh tức thời { t: "mcv", s } khi
// đổi (≤ 4 lần / giây) + kèm nhịp (api.js mcv); gửi { t: "mcv", u, d } (kênh chưa mở: nhịp b.mcv = [[u, d]])
const VE = new Map((MC.ve || []).map((o) => [o.u, { ...o, mau: CF.ve.mau, mauMax: CF.ve.mau, chet: 0, lan: 1, nhan: new Map(), han: new Map() }]));
let veV = 0, veDoi = false, veGui = 0;
// trạng thái gửi trình duyệt của tài khoản tk: { v, ten, tpl, lv, thay, ds: [[u, bãi, x, y, máu, máu tối đa, nhận (sát thương của mình máy chủ đã nhận lần
// sống này), hồi (giây tới lúc sống lại — 0: đang sống), lần sống]] }
function veTT(tk, bai, view) {
  const t = Date.now();
  return { v: veV, ten: CF.ve.ten, tpl: CF.ve.tpl, lv: CF.ve.lv, thay: CF.ve.thay,
    ds: [...VE.values()].filter((g) => (bai == null || g.bai === bai) && WS.trongTam({ view }, g.x, g.y)).map((g) => [g.u, g.bai, g.x, g.y, Math.max(0, Math.ceil(g.mau)), g.mauMax, g.nhan.get(tk) || 0, g.chet ? Math.max(1, Math.ceil((lucChet(g) + CF.ve.hoi * 1000 - t) / 1000)) : 0, g.lan]) };
}
// mốc tính giờ sống lại của con đã chết g: hoiCum -> lúc con cuối của cụm chết (cụm còn con sống: chưa bắt đầu tính — trả bây giờ); không thì lúc g chết
function lucChet(g) {
  if (!CF.ve.hoiCum) return g.chet;
  const L = [...VE.values()].filter((o) => o.cum === g.cum);
  return L.every((o) => o.chet) ? Math.max(...L.map((o) => o.chet)) : Date.now();
}
// sát thương tài khoản tk gây cho quái canh u: phần mới d -> true nếu máy chủ nhận
const QT_ = (tk) => { try { return require("./bao-mat.js").qtMo(tk); } catch { return false; } }; // quản trị đã mở khóa an toàn: bỏ hạn mức sát thương / giây (anh 18/11 — "Một đòn chết" của công cụ thử)
function danhVe(tk, u, d) {
  const g = VE.get(+u); if (!g || g.chet || g.mau <= 0) return false;
  d = Math.floor(+d || 0); if (!(d > 0)) return false;
  g.nhan.set(tk, (g.nhan.get(tk) || 0) + d); veDoi = true;
  const p = TG().dangChoi(tk);
  if (!p || p.zone !== g.bai || !(p.hp > 0) || Math.hypot(p.x - g.x, p.y - g.y) > CF.ve.gan) return false;
  const t = Date.now(), x = g.han.get(tk) || { han: CF.ve.stGiay * 3, luc: t };
  x.han = Math.min(CF.ve.stGiay * 3, x.han + ((t - x.luc) / 1000) * CF.ve.stGiay); x.luc = t;
  if (QT_(tk)) x.han = Infinity;
  const an = Math.min(d, x.han, g.mau);
  x.han -= an; g.han.set(tk, x); g.mau -= an;
  if (g.mau <= 0) { g.mau = 0; g.chet = t; g.ai = p.name; }
  return true;
}
WS.nhan("mo", (kn) => kn.gui({ t: "mcv", s: veTT(kn.ten, kn.zone, kn.view) }));
WS.nhan("vao", (kn) => kn.gui({ t: "mcv", s: veTT(kn.ten, kn.zone, kn.view) }));
WS.nhan("view", (kn) => kn.gui({ t: "mcv", s: veTT(kn.ten, kn.zone, kn.view) }));
WS.nhan("mcv", (kn, tin) => { danhVe(kn.ten, tin.u, tin.d); });
// sống lại sau CF.ve.hoi giây; gửi trạng thái tối đa 4 lần / giây
setInterval(() => {
  const t = Date.now();
  const song = [...VE.values()].filter((g) => g.chet && t - lucChet(g) >= CF.ve.hoi * 1000); // tính hết trước rồi mới cho sống (cùng cụm cùng lúc)
  for (const g of song) { g.chet = 0; g.mau = g.mauMax; g.lan++; g.nhan.clear(); g.han.clear(); delete g.ai; veDoi = true; }
  if (veDoi && t - veGui >= 250) { veDoi = false; veGui = t; veV++; WS.moi((kn) => kn.gui({ t: "mcv", s: veTT(kn.ten, kn.zone, kn.view) })); }
}, 250).unref();

// công cụ thử (tài khoản quản trị): { viec: "xem" } | { viec: "dat", giet?: n (số con đã hạ), xong?: true (bỏ dấu đã xong hôm nay) } | { viec: "ve",
// ha?: mã cụm (hạ hết quái canh cụm đó), mau?: n (đặt máu mọi con đang sống), song?: true (cho mọi con sống lại ngay) }
function quanTri(h, b) {
  const P = tt(h);
  if (b.viec === "dat") {
    if (P.giet && b.giet != null) P.giet.n = Math.max(0, Math.min(P.giet.can, b.giet | 0));
    if (b.xong) P.xong = {};
  }
  if (b.viec === "ve") {
    const t = Date.now();
    for (const g of VE.values()) {
      if (b.ha != null && g.cum === +b.ha && !g.chet) { g.mau = 0; g.chet = t; g.ai = "quản trị"; }
      if (b.mau != null && !g.chet) g.mau = Math.max(1, Math.min(g.mauMax, +b.mau | 0));
      if (b.song && g.chet) g.chet = t - CF.ve.hoi * 1000;
    }
    veDoi = true;
  }
  return { mc: P, cf: { cap: CF.cap, giet: CF.giet, thu: CF.thu, hai: CF.hai, ve: CF.ve }, cay: MC.cay.length, nguoi: MC.nguoiNhan.map((o) => o.ten), ve: veTT("") };
}

module.exports = { lam, giet, nhanDoi, quanTri, tomTat, veTT, danhVe, tt, CF };
