// Phú Quý Cẩm Hạp (anh 03/11 — "tham khảo và làm event Phú quý cẩm hạp vào sever của chúng ta", ảnh bài giới thiệu tính năng). Luật + câu theo script
// máy chủ 8.1 Vinh (ổ ảo, chỉ đọc) event\expansion\201006\fuguijinhe\fuguijinhe.lua (tbBetInfo — AnhHH chỉnh 19/09/2011) + fuguijinhe_item.lua:
//   - Thần Tài (mẫu NPC 455, Biện Kinh 1762 × 32, 3049 × 32 = 220/190 — assets/data/npc-them.json) bán Phú quý cẩm hạp (magicscript 2402) giá CF.gia Xu.
//   - Chuột phải hộp ở thôn / thành (script gốc: thành thị phi chiến đấu), cấp ≥ CF.cap: g_AskClientNumberEx(10, 99, "Nhập số 10-99") -> Bet: ghi
//     số vào đợt, CF.kn kinh nghiệm; mỗi nhân vật mỗi đợt tối đa CF.toiDa hộp ("Mỗi nhân vật mỗi đợt hoạt động chỉ được sử dụng %d lần.").
//   - Đợt (tbBetInfo:IsActive / Init): chọn số trước CF.quay (22:10 giờ Việt Nam) thuộc đợt hôm nay, từ CF.quay thuộc đợt ngày mai. CF.quay mỗi ngày
//     máy chủ bốc 10 số khác nhau 10–99: 9 số thường + 1 số đặc biệt (máy chủ tắt lúc đó thì bốc ngay khi chạy lại, còn trong hạn nhận).
//   - Nhận ở Thần Tài (GetAward_dlg) từ lúc quay tới CF.hetNhan (17:10) hôm sau: mỗi lần chọn trúng số thường 1 phần thưởng thường (tối đa
//     CF.thuong.toiDa / đợt), trúng số đặc biệt 1 phần thưởng đặc biệt (tối đa CF.dacBiet.toiDa / đợt); chọn trùng số thì mỗi lần trúng tính 1.
//   Số theo bài anh gửi (script gốc: cấp 50, 20 hộp, 6 triệu / hộp, số thường 20 triệu, số đặc biệt 200 triệu + Túi May Mắn): cau-hinh.json phuQuy.
// Lưu: du-lieu/phu-quy.json { dot: { "YYYY-MM-DD": { thuong: [9 số], db: số, luc } }, tong: { "YYYY-MM-DD": số lần chọn cả máy chủ } } (giữ GIU đợt).
// Nhân vật (h.pq — máy chủ giữ, api.js GIU): { dot (đợt đang chọn), so: [số đã chọn], cu?: { dot (đợt vừa quay), so, nt (đã nhận thường), nd (đã nhận
// đặc biệt), bao (đã nhắc trúng) } } — sang đợt mới: đợt đang chọn vừa quay thì thành cu (như tbJinhe_tsk:ResetTaskForDay).
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const D = require("./du-lieu.js");
const TG = () => require("./the-gioi.js");
const NK = () => require("./nhat-ky.js");

const N = DO.NOI, loi = N.loi;
const CF = {
  bat: true, mon: "ms:2402", gia: 1, cap: 60, toiDa: 10, kn: 200000, quay: "22:10", hetNhan: "17:10", baiNpc: "Biện Kinh 220/190",
  thuong: { kn: 10000000, mon: [["ms:71", 1]], toiDa: 10 }, dacBiet: { kn: 30000000, mon: [["ms:1181", 1]], toiDa: 1 }, ...(N.CFG.phuQuy || {}),
};
const TEP = path.join(D.ROOT, "phu-quy.json"), GIU = 7;
const Y = (t) => `<color=yellow>${t}<color>`, G = (t) => `<color=green>${t}<color>`;
const say = (text, opts) => ({ say: { text, opts } });
const so = (n) => Math.round(n).toLocaleString("vi-VN");
const tenMon = (L) => L.map(([k, n]) => `${(n | 0) > 1 ? n + " " : ""}${String((N.BY.get(k) || {}).n || k).trim()}`).join(" + ");

// đồng hồ: máy thử đặt VL_PQ_THU=1 thì quản trị dời được giờ của sự kiện (lech — thử nhận thưởng không phải chờ tới 22:10); máy thật luôn giờ thật
let LECH = 0;
const bay = () => Date.now() + LECH;
const phutCua = (hm) => { const [a, b] = String(hm).split(":").map(Number); return a * 60 + (b | 0); };
const vn = (t) => { const s = new Date(t + 7 * 3600e3).toISOString(); return { ngay: s.slice(0, 10), phut: +s.slice(11, 13) * 60 + +s.slice(14, 16) }; };
const sangNgay = (ngay, d) => new Date(Date.parse(ngay + "T00:00:00Z") + d * 86400e3).toISOString().slice(0, 10);
const lucCua = (ngay, hm) => Date.parse(ngay + "T00:00:00Z") - 7 * 3600e3 + phutCua(hm) * 60000; // ms của giờ hm ngày Việt Nam ngay
// đợt đang chọn số / đợt quay gần nhất / còn hạn nhận thưởng đợt R
const dotNay = (t = bay()) => { const v = vn(t); return v.phut >= phutCua(CF.quay) ? sangNgay(v.ngay, 1) : v.ngay; };
const dotCu = (t = bay()) => { const v = vn(t); return v.phut >= phutCua(CF.quay) ? v.ngay : sangNgay(v.ngay, -1); };
// hạn nhận của đợt R: ghi lúc quay (S.dot[R].het — anh 05/11: GM đổi hạn nhận ở F10 thì đợt đã quay giữ hạn đã báo); đợt cũ chưa ghi: hạn hiện tại
const hetCua = (R) => (S && S.dot && S.dot[R] && S.dot[R].het) || CF.hetNhan;
const conHan = (R, t = bay()) => t >= lucCua(R, CF.quay) && t < lucCua(sangNgay(R, 1), hetCua(R));
const ngayThang = (R) => `${R.slice(8, 10)}/${R.slice(5, 7)}`;

let S = (() => { try { return JSON.parse(fs.readFileSync(TEP, "utf8")); } catch { return {}; } })();
S.dot = S.dot || {}; S.tong = S.tong || {};
function luu() {
  for (const k of ["dot", "tong"]) { const ks = Object.keys(S[k]).sort(); for (const x of ks.slice(0, Math.max(0, ks.length - GIU))) delete S[k][x]; }
  try { fs.mkdirSync(path.dirname(TEP), { recursive: true }); const tmp = TEP + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(S)); fs.renameSync(tmp, TEP); }
  catch (e) { console.error("Phú Quý Cẩm Hạp: không ghi được", e.message); }
}

// trạng thái của nhân vật h theo đợt hiện tại (sang đợt mới: đợt đang chọn vừa quay -> cu; cu chỉ giữ cho đợt quay gần nhất)
function tt(h, t = bay()) {
  const cur = dotNay(t), cu = dotCu(t), P = (h.pq = h.pq || { dot: cur, so: [] });
  if (P.dot !== cur) {
    P.cu = P.dot === cu ? { dot: P.dot, so: P.so || [], nt: 0, nd: 0 } : P.cu && P.cu.dot === cu ? P.cu : null;
    P.dot = cur; P.so = [];
  }
  if (P.cu && P.cu.dot !== cu) P.cu = null;
  if (!P.cu) delete P.cu;
  return P;
}
// số lần trúng của các số đã chọn ở đợt cu: [thường, đặc biệt]
function trung(P) {
  const K = P.cu && S.dot[P.cu.dot]; if (!K) return [0, 0];
  let a = 0, b = 0;
  for (const x of P.cu.so) { if (x === K.db) b++; else if (K.thuong.includes(x)) a++; }
  return [a, b];
}

// ---------- dùng hộp (do.js dungVat "phuQuy") ----------
// hoi: kiểm điều kiện trước khi hỏi số (key = "tài khoản|ô" — bãi đang đứng do.js BAI_NAY) -> { con: số lần còn chọn đợt này, dot }
function hoi(h, key) {
  if (!CF.bat) loi("Hoạt động Phú Quý Cẩm Hạp hiện đang tạm dừng");
  if (!N.THANH.has((N.ZONES.get(N.BAI_NAY.get(key)) || {}).kind)) loi("Khu vực thành thị phi chiến đấu mới có thể sử dụng");
  if ((h.lvl || 1) < CF.cap) loi(`Nhân vật cấp ${CF.cap} trở lên mới có thể sử dụng Phú Quý Cẩm Hạp`);
  const P = tt(h);
  if (P.so.length >= CF.toiDa) loi(`Mỗi nhân vật mỗi đợt hoạt động chỉ được sử dụng ${CF.toiDa} lần.`);
  return { con: CF.toiDa - P.so.length, dot: P.dot };
}
// chọn số n (Bet): đã kiểm hoi; trả { msg } — do.js trừ 1 hộp
function chon(h, key, n) {
  hoi(h, key);
  n = Math.floor(+n);
  if (!(n >= 10 && n <= 99)) loi("Chỉ được phép nhập từ số 10 đến 99.");
  const P = tt(h);
  P.so.push(n);
  S.tong[P.dot] = (S.tong[P.dot] | 0) + 1; luu();
  h.exp = (h.exp || 0) + CF.kn; h.lvl = h.lvl || 1; const len = N.lenCap(h);
  return { msg: `Đã chọn ${n} đồng thời nhận được ${so(CF.kn)} kinh nghiệm (đợt ${ngayThang(P.dot)} — lần ${P.so.length}/${CF.toiDa})`, len };
}

// ---------- quay số ----------
function quay(R, ep) {
  const ds = Array.from({ length: 90 }, (_, i) => i + 10);
  for (let i = ds.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ds[i], ds[j]] = [ds[j], ds[i]]; }
  const chon10 = Array.isArray(ep) && ep.length === 10 && new Set(ep).size === 10 && ep.every((x) => x >= 10 && x <= 99) ? ep : ds.slice(0, 10);
  S.dot[R] = { thuong: chon10.slice(0, 9), db: chon10[9], luc: Date.now(), het: CF.hetNhan }; luu();
  TG().thongBao(`Thần Tài: số may mắn Phú Quý Cẩm Hạp đợt ${ngayThang(R)} — số thường ${S.dot[R].thuong.join(" ")}, số đặc biệt ${S.dot[R].db}. Ai chọn trúng mời tới Thần Tài (${CF.baiNpc}) nhận thưởng trước ${CF.hetNhan} ngày mai.`, true);
  return S.dot[R];
}
setInterval(() => {
  if (!CF.bat) return;
  const t = bay(), R = dotCu(t);
  // đúng giờ (trong 10 phút sau CF.quay) thì quay; quay bù lúc máy chủ chạy lại (còn hạn nhận) chỉ khi đợt đó có người chọn — lên máy chủ lần đầu không
  // báo số của đợt chưa ai chơi
  if (!S.dot[R] && conHan(R, t) && ((S.tong[R] | 0) > 0 || t - lucCua(R, CF.quay) < 10 * 60000)) { try { quay(R); } catch (e) { console.error("Phú Quý Cẩm Hạp:", e.message); } }
}, 5000).unref();

// ---------- Thần Tài (npcdailog — tbBetInfo CurBetInfo_dlg / LastBetInfo_dlg / GetAward_dlg) ----------
function cuText(P) {
  const K = P.cu && S.dot[P.cu.dot], R = dotCu();
  if (!S.dot[R]) return "Hiện tại vẫn chưa có số may mắn";
  const [a, b] = trung(P), dn = P.cu ? P.cu : { so: [], nt: 0, nd: 0 };
  const ca = Math.max(0, Math.min(a, CF.thuong.toiDa) - dn.nt), cb = Math.max(0, Math.min(b, CF.dacBiet.toiDa) - dn.nd);
  return [`Số may mắn lần trước (đợt ${ngayThang(R)})`, `Số thường: ${G(S.dot[R].thuong.join(" "))}`, `Số đặc biệt: ${G(S.dot[R].db)}`,
    `Ngươi đã chọn số: ${G(K ? dn.so.join(" ") || "—" : "—")}`, `Đã chọn trúng ${G(a)} số phổ thông, ${G(b)} số đặc biệt`,
    `Có thể nhận ${G(ca)} phần thưởng phổ thông, ${G(cb)} phần thưởng đặc biệt`, `Hạn nhận thưởng: tới ${hetCua(R)} ngày ${ngayThang(sangNgay(R, 1))}`].join("<enter>");
}
const GIOI_THIEU = () => [
  `Phú Quý Cẩm Hạp: mua ở ta, giá ${CF.gia} Xu một hộp. Nhân vật cấp ${CF.cap} trở lên đứng trong thôn hoặc thành, chuột phải vào hộp rồi nhập 1 số từ 10 đến 99 — nhận ngay ${so(CF.kn)} kinh nghiệm. Có thể chọn trùng hoặc khác số.`,
  `Mỗi ngày mỗi nhân vật dùng tối đa ${CF.toiDa} hộp. Chọn trước ${CF.quay} là đợt hôm nay, sau ${CF.quay} tính cho đợt ngày mai.`,
  `Đúng ${CF.quay} mỗi ngày ta chọn ra 10 số khác nhau từ 10 đến 99: 9 số may mắn thường và 1 số may mắn đặc biệt.`,
  `Mỗi lần chọn trúng số thường: ${so(CF.thuong.kn)} kinh nghiệm + ${tenMon(CF.thuong.mon)} (tối đa ${CF.thuong.toiDa} lần một đợt). Trúng số đặc biệt: ${so(CF.dacBiet.kn)} kinh nghiệm + ${tenMon(CF.dacBiet.mon)} (tối đa ${CF.dacBiet.toiDa} lần một đợt).`,
  `Nhận thưởng ở ta từ ${CF.quay} tới ${CF.hetNhan} ngày hôm sau — quá hạn thì không nhận được nữa.`,
];
// nhận phần thưởng loại L ("thuong" | "dacBiet"): mọi phần còn lại một lần (túi đầy thì dừng, phần còn lại nhận sau)
function nhan(h, loai) {
  const P = tt(h), R = dotCu();
  if (!S.dot[R]) return { talk: ["Hiện tại vẫn chưa có số may mắn"] };
  if (!conHan(R)) return { talk: [`Đã quá thời hạn nhận thưởng (tới ${hetCua(R)} ngày hôm sau).`] };
  const T = CF[loai], [a, b] = trung(P), co = loai === "thuong" ? a : b, da = P.cu ? (loai === "thuong" ? P.cu.nt : P.cu.nd) : 0;
  if (da >= T.toiDa) return { talk: [`Mỗi một đợt mỗi nhân vật nhiều nhất chỉ nhận được ${T.toiDa} lần thưởng`] };
  const con = Math.min(co, T.toiDa) - da;
  if (con <= 0) return { talk: ["Ngươi đã hết cơ hội nhận thưởng"] };
  let n = 0, day = false;
  for (let i = 0; i < con; i++) {
    try { DO.taoQua(h, { mon: T.mon.map(([k, sl]) => ({ k, n: sl })) }); } catch { day = true; break; }
    h.exp = (h.exp || 0) + T.kn; n++;
    if (loai === "thuong") P.cu.nt++; else P.cu.nd++;
  }
  h.lvl = h.lvl || 1; const len = n ? N.lenCap(h) : 0;
  const ten = loai === "thuong" ? "phổ thông" : "đặc biệt";
  if (!n) return { talk: ["Hành trang không đủ chỗ"] };
  return { tin: [`Nhận ${n} phần thưởng ${ten}: ${so(n * T.kn)} kinh nghiệm + ${tenMon(T.mon.map(([k, sl]) => [k, sl * n]))}${day ? " — hành trang đầy, dọn chỗ rồi nhận tiếp" : ""}`], len, nhan: [loai, n] };
}
// b.viec: "mo" | "mua" (+ b.n 1 / 5 / 10) | "xem" | "cu" | "thuong" | "nhanThuong" | "nhanDb" | "gioiThieu"
function lam(h, b, tk) {
  if (!CF.bat) return { talk: ["Hoạt động Phú Quý Cẩm Hạp hiện đang tạm dừng."] };
  const P = tt(h);
  switch (b.viec) {
    case "mua": {
      const n = [1, 5, 10].includes(b.n | 0) ? b.n | 0 : 0;
      if (!n) return say(`Phú quý cẩm hạp giá ${Y(CF.gia + " Xu")} một hộp. Các hạ muốn mua bao nhiêu?`, [[`Mua 1 hộp (${CF.gia} Xu)`, "mua", 1], [`Mua 5 hộp (${5 * CF.gia} Xu)`, "mua", 5], [`Mua 10 hộp (${10 * CF.gia} Xu)`, "mua", 10], ["Trở lại", "mo"]]);
      const gia = n * CF.gia, x = N.BY.get(CF.mon); if (!x) loi("Không có món này");
      if ((h.xu | 0) < gia) return { talk: ["Tiền đồng trên người bạn không đủ"] };
      N.themChong(h, x, n); h.xu -= gia;
      NK().ghi("xu", tk, h.name, `Phú Quý Cẩm Hạp: mua ${n} hộp (${gia} Xu)`);
      return { tin: [`Mua được ${n} ${String(x.n).trim()} — trừ ${gia} Xu`], ...say(`Mua được ${Y(n + " " + String(x.n).trim())}. Chúc các hạ phát tài!`, [["Mua thêm", "mua"], ["Trở lại", "mo"]]) };
    }
    case "xem":
      return say(`Đợt thi này (${ngayThang(P.dot)}) có ${G(S.tong[P.dot] | 0)} lần chọn, các hạ đã chọn ${G(P.so.length)} lần số<enter>${G(P.so.join(" ") || "—")}`, [["Ta đã biết rồi.", "mo"]]);
    case "cu": return say(cuText(P), [["Ta đã biết rồi.", "mo"]]);
    case "thuong": return say(cuText(P), [["Nhận phần thưởng phổ thông", "nhanThuong"], ["Nhận phần thưởng đặc biệt", "nhanDb"], ["Để ta suy nghĩ lại", null]]);
    case "nhanThuong": case "nhanDb": {
      const r = nhan(h, b.viec === "nhanThuong" ? "thuong" : "dacBiet");
      if (r.nhan) NK().ghi("hiem", tk, h.name, `Phú Quý Cẩm Hạp: ${r.tin[0]}`);
      return r.talk ? r : { ...r, ...say(cuText(tt(h)), [["Nhận phần thưởng phổ thông", "nhanThuong"], ["Nhận phần thưởng đặc biệt", "nhanDb"], ["Để ta suy nghĩ lại", null]]) };
    }
    case "gioiThieu": return { talk: GIOI_THIEU() };
    default: {
      const R = dotCu(), K = S.dot[R];
      return say(`Thần Tài: Phú quý tại thiên, cát tường như ý! Mỗi ngày chọn số bằng ${Y("Phú quý cẩm hạp")}, đúng ${Y(CF.quay)} ta công bố 9 số may mắn thường và 1 số đặc biệt.${K ? `<enter>Đợt ${ngayThang(R)}: số thường ${G(K.thuong.join(" "))}, đặc biệt ${G(K.db)}` : ""}`,
        [["Mua Phú quý cẩm hạp", "mua"], ["Xem số đã chọn đợt này", "xem"], ["Số may mắn lần trước", "cu"], ["Nhận phần thưởng", "thuong"], ["Giới thiệu hoạt động", "gioiThieu"], ["Kết thúc", null]]);
    }
  }
}

// nhịp (api.js): đợt vừa quay mà nhân vật có số trúng chưa nhận -> 1 câu nhắc (mỗi đợt 1 lần)
function bao(h) {
  if (!CF.bat || !h || !h.pq) return null;
  const P = tt(h), R = dotCu(); if (!P.cu || P.cu.bao || !S.dot[R] || !conHan(R)) return null;
  const [a, b] = trung(P); if (!a && !b) return null;
  P.cu.bao = 1;
  return `Phú Quý Cẩm Hạp đợt ${ngayThang(R)}: các hạ chọn trúng ${a} số thường${b ? `, ${b} số đặc biệt` : ""} — tới Thần Tài (${CF.baiNpc}) nhận thưởng trước ${hetCua(R)} ngày ${ngayThang(sangNgay(R, 1))}`;
}

// công cụ thử (tài khoản quản trị): { viec: "xem" | "quay" (so?: 10 số — 9 thường + 1 đặc biệt; dot?) | "lech" (phut — chỉ máy thử VL_PQ_THU=1) }
function quanTri(b) {
  if (b.viec === "quay") { const R = b.dot || dotCu(); return { quay: quay(R, b.so), dot: R }; }
  if (b.viec === "lech") {
    if (process.env.VL_PQ_THU !== "1") loi("Chỉ máy thử (VL_PQ_THU=1) mới dời giờ được");
    LECH = Math.round((+b.phut || 0) * 60000);
  }
  return { bay: new Date(bay() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " "), dotNay: dotNay(), dotCu: dotCu(), lech: LECH / 60000, cf: { cap: CF.cap, toiDa: CF.toiDa, quay: CF.quay, hetNhan: CF.hetNhan }, dot: S.dot, tong: S.tong };
}

module.exports = { hoi, chon, lam, bao, quanTri, tt, CF };
