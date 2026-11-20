// Tra cứu (khung "Tra cứu" trong game — anh 05/11): rương / hộp quà mở ra gì và tỉ lệ, quái rơi gì, thưởng từng hoạt động, mỗi món có từ đâu.
// Dựng từ cấu hình ĐANG CHẠY: N.CFG (cau-hinh.json) + CF sống của từng module hoạt động (GM đổi lịch lúc chạy thì chữ đổi theo) + dữ liệu
// assets/data (ky-tran-cac, roi-dac-biet, sat-thu, vuot-ai, ruong-tb, phong-hoa, boss-tg, da-tau…). Mọi tỉ lệ tính từ trọng số / xác suất của cấu hình.
//   lay()    -> { json, v } — bản đệm; lần đầu thì dựng; CF lịch của hoạt động theo giờ đổi thì tự dựng lại. v = md5 ngắn của nội dung (ETag)
//   lamMoi() -> dựng lại ngay (GM vừa sửa lịch)
// Dữ liệu: { v, luc, nhom: [{ id, ten, muc: [Muc] }] } — nhóm ruong / roi / hd / thuong / vat. Muc = { id, ten, tom (1 dòng ngắn), ic?, tim? (chữ tìm
// thêm), noi: [Khoi], lich? + ct? (nhóm hd: [[nhãn, chữ]] cho khung bên 193 px) }. Khoi = { h } | { p } | { ds: [chữ] } | { bang: [[cột…], …], can? }.
// Chữ chỉ dùng 3 thẻ <y> (vàng) <g> (xanh lá) <c> (cam) — trình duyệt thoát mọi thứ khác. Không bao giờ ném lỗi ra ngoài: mục nào lỗi thì
// console.error rồi bỏ mục đó, mục / nhóm khác vẫn còn. Module máy chủ require lúc dựng (tránh vòng require với do.js).
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const NHOM = [["ruong", "Rương & hộp quà"], ["roi", "Rơi đồ từ quái"], ["hd", "Hoạt động"], ["chiso", "Chỉ số & thuộc tính"], ["thuong", "Phần thưởng"], ["vat", "Vật phẩm"]];
// hoạt động theo giờ: [tệp, mục cau-hinh.json] — CF sống của các tệp này đổi thì lay() tự dựng lại
const LICH = [["./phong-hoa.js", "phongHoa"], ["./boss-tg.js", "bossTheGioi"], ["./phong-lang-do.js", "phongLangDo"], ["./san-nhim.js", "sanNhim"],
  ["./ruong-tb.js", "ruongThanBi"], ["./phu-quy.js", "phuQuy"], ["./tong-kim.js", "tongKim"], ["./bau-cua.js", "bauCua"],
  ["./bang-hoi.js", "bangHoi"], ["./khu-bang.js", "khuBang"], ["./dua-ngua.js", "duaNgua"]]; // duaNgua: đua ngựa (anh 16/11 — CF = phần lịch; số thưởng đọc dua-ngua.js cf()) // bang hội (anh 14/11): CF = số đang dùng của máy này (chung + theoMay) — F10 sửa thì mục Tra cứu "Bang hội" đổi theo; khuBang: lộ phí Xa phu khu (đợt 4)
let BAN = null, DAU = null, C = null;
const T0 = {};

const loiGhi = (ai, e) => console.error(`Tra cứu — ${ai}:`, (e && (e.stack || e.message)) || e);
function docJson(f) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")); } catch (e) { loiGhi(`không đọc được ${f}`, e); return null; }
}
// tài sản tĩnh (assets) — đọc 1 lần
const tinh = (k, f) => (k in T0 ? T0[k] : (T0[k] = docJson(f)));
function nap(f) {
  try { return require(f); } catch (e) { loiGhi(`không nạp được ${f}`, e); return null; }
}
// giá trị mặc định của CF từng module (chỉ dùng khi module chưa xuất CF / nạp lỗi) — chép từ đầu các tệp đó
const MD = {
  phongHoa: { bat: true, gio: "19:00", baoTruoc: 5, baoDanh: 5, danh: 20, chuSoai: 14, cap: 90, phi: 1000000, diem: 10,
    thuong: { duoi: 500000, tren: 1000000, toiDa: 10000000, nhan: 2, ruongXanh: 3 },
    roi: { loai: ["dt", "tp", "ct", "cs", "xe", "tb"], ds: [[0.005, ["qk:238", "qk:239", "qk:240", "qk:353"]], [0.01, ["ms:23"]]], xu: [0.001, 1, 2] },
    bua: { bat: true, heSo: 2, tiLe: [0.0005, 0.001, 0.002, 0.01, 0.02], lan: [1, 2, 3, 4, 5], manh: {} },
    giaiDoan: [{ tu: 0, ten: "Tiền quân" }, { tu: 5, ten: "Trung quân" }, { tu: 10, ten: "Đại quân" }], xe: [[2, 2], [6, 3], [10, 3], [14, 4], [17, 4]] },
  bossTheGioi: { bat: true, gio: ["12:30", "20:30"], song: 120, mau: 50000000, kn: 30000000, knIt: 2000000, nguong: 1, danhMa: 3, thamGia: 2, so: 1, mauNguoi: 1000000, stNguoi: 3, xuTl: 3,
    hiem: [["qk:238", 1, 20], ["qk:239", 1, 20], ["qk:240", 1, 20], ["qk:353", 1, 20], ["ms:26", 1, 5], ["ms:22", 1, 5], ["biKip", 1, 3], ["ms:23", 1, 30]],
    hang: [{ den: 1, mon: [["ms:1181", 1]], hiem: 1 }, { den: 2, mon: [["ms:71", 3]], mot: [["ms:73", 1], ["ms:125", 1]], hiem: 1 }], kich: { kn: 5000000, hiem: 1, ma: 1 } },
  phongLangDo: { gio: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22], baoDanh: 10, dauLinh: [25, 30, 35], capBo: 39, toiDa: 100, thuyTac: 30, dotThuyTac: [10],
    bacKinhNghiem: 1.2, thuongDauLinh: 150000, veNamGia: 200, lenhBai: "qk:489", matDo: "ms:196", matDoCan: 200 },
  sanNhim: { bat: true, gio: ["09:40", "13:40", "15:40", "19:40", "23:40"], phut: 20, baoTruoc: 5, so: { 53: 10, 37: 15 }, ten: "Nhím béo phì", kn: 1500000, ngay: 10, phatKn: 500000, phatXu: 50, thamKn: 250000, thamXu: 10,
    hiemTl: 10, mon: [["ms:71", 1], ["ms:73", 1], ["ms:125", 1], ["ms:6", 1], ["ms:3", 1], ["ms:122", 1]], hiem: [["qk:238", 1], ["qk:239", 1], ["qk:240", 1], ["qk:353", 1]] },
  ruongThanBi: { bat: true, gio: "20:10", so: 3, capMo: 120, song: 120, vuaCap: true,
    thuong: [["kn", 10000000, 20], ["kn", 15000000, 15], ["kn", 20000000, 10], ["kn", 30000000, 5], ["mon", "ms:11", 10], ["mon", "ms:20", 10], ["mon", "ms:15", 3],
      ["mon", ["ms:122", "ms:123", "ms:124"], 10], ["mon", "ms:71", 7], ["mon", "ms:125", 7], ["xu", 10, 2.5], ["xu", 25, 0.5]] },
  phuQuy: { bat: true, mon: "ms:2402", gia: 1, cap: 60, toiDa: 10, kn: 200000, quay: "22:10", hetNhan: "17:10", baiNpc: "Biện Kinh 220/190",
    thuong: { kn: 10000000, mon: [["ms:71", 1]], toiDa: 10 }, dacBiet: { kn: 30000000, mon: [["ms:1181", 1]], toiDa: 1 } },
  bauCua: { bat: true, gio: "19:25", dai: 30, toiDa: 100, bao: 100, bai: [53, 37] },
  vuotAi: { luot: 4, gian: [1, 2, 4, 8], tien: [500000, 1000000, 2000000, 4000000], doiTruong: 1.2, caoCap: 2, kinhNghiem: 1, chuanBi: 60,
    thuoc: { k: "potion:15", n: 1, tiLe: 0.08 }, leBao: { k: "ms:1392", roi: 0.38 }, ruongXanh: 2 },
  satThu: { moiNgay: 8, gop: 5, luot: 8, toiThieuGiay: 5, hoiSinh: 120, boChung: 60 },
  minhChu: { bat: true, cap: 120, ruongXanh: 1, giet: { can: 500, duoi: 50, kn: 20000000 }, thu: { kn: 15000000, mon: "ms:2571" }, hai: { can: 3, kn: 15000000, giay: 3 } },
  tuLam: { daTau: { xu: 10 }, satThu: { xu: 5 } },
  tayTuy: { capToiThieu: 50, mienPhi: 1, bt: 6 },
  choTroi: { thue: 20, cap: 10, qc: 16 },
  tongKim: { bat: true, gio: ["10:50", "12:50", "16:50", "22:00"], baoTruoc: 5, baoDanh: 5, danh: 30, soai1: 15, soai2: 20, vaoMuon: 15, vaoTuDo: true, cap: 100, phi: 3000, hoiSinh: 8,
    pk: 75, lienTram: [3, 150], chuc: [1000, 3000, 6000, 10000], chucMau: [0, 20, 30, 40, 50], chucThu: [0, 0, 5, 10, 15], diemBinh: [5, 30, 150, 250, 500, 1000],
    thuong: { diemMin: 100, thang: 1200, thua: 600, ht: [2, 0], htMoc: 3000, htThem: 1, htSoai: 2, htMon: "qk:507", knHs: 1.4, knToiDa: 20000000, hcMon: "ms:1773",
      hcDiem: 1000, hcNgay: 2, hcKn: [[2000000, 30], [3000000, 40], [5000000, 30]] }, thienTu: { thu: [2, 4, 6], heSo: 2 }, duc: { can: 100, mon: "qk:195" },
    quanNhu: [["qk:507", 5000], ["ms:156", 3000], ["ms:157", 2000], ["ms:215", 400], ["ms:216", 200], ["ms:217", 100], ["ms:186", 300], ["ms:187", 300],
      ["ms:191", 400], ["ms:178", 600], ["ms:181", 600], ["ms:190", 600],
    ["ms:179", 600], ["ms:180", 600], ["ms:9101", 600], ["ms:9102", 600], ["ms:182", 600], ["ms:183", 600], ["ms:184", 600], ["ms:185", 600]] },
};
// CF sống của module (đã xuất) — không có thì mục cau-hinh.json đè lên mặc định
function cf(f, sec) {
  const m = nap(f);
  return m && m.CF && typeof m.CF === "object" ? m.CF : { ...(MD[sec] || {}), ...((C.CFG || {})[sec] || {}) };
}

// ---------- định dạng chữ ----------
const so = (n) => (Number(n) || 0).toLocaleString("vi-VN");
// xác suất 0–1 -> "0,5 %", "70 %", "≈ 1,11 %" (từ 1 %: 2 chữ số thập phân; dưới 1 %: 2 chữ số có nghĩa)
function pt(p) {
  const x = Number(p) * 100;
  if (!Number.isFinite(x) || x <= 0) return "0 %";
  const s = x.toFixed(x >= 1 ? 2 : Math.min(8, 1 - Math.floor(Math.log10(x))));
  return `${Math.abs(+s - x) > 1e-9 * Math.max(1, x) ? "≈ " : ""}${s.replace(/\.?0+$/, "").replace(".", ",")} %`;
}
function knChu(n) {
  n = Math.round(Number(n) || 0);
  if (n >= 1e9 && n % 1e6 === 0) return `${so(n / 1e9)} tỉ`;
  if (n >= 1e6 && n % 1e4 === 0) return `${so(n / 1e6)} triệu`;
  return so(n);
}
const kn = (n) => `${knChu(n)} kinh nghiệm`;
// anh 18/11 — Cuồng nộ liên kích + boss cuối nổi giận (src/game/cuongno.js, cau-hinh.json cuongNo): 2 dòng Tra cứu cho Vượt Ải / Viêm Đế; tenBoss = boss cuối của hoạt động
const cuongNoDong = (CN, tenBoss) => { const X = { quai: 5, bossNho: 30, bossCuoi: 5, moiBac: 100, toiDa: 3, st: 20, toc: 20, giu: 8, ...(CN || {}) }, H = { r: 450, giay: 3, moc: [[50, 1.3, 2], [25, 1.6, 3]], ...((CN || {}).hung || {}) };
  if (CN && CN.bat === false) return [];
  const moc = (Array.isArray(H.moc) ? H.moc : []).filter(Array.isArray).slice().sort((a, b) => b[0] - a[0]).map(([p, t, v]) => `máu ≤ ${p}%: tốc đánh ×${String(t).replace(".", ",")}, vòng ×${v}`).join("; ");
  return [["Cuồng nộ liên kích", `Tính riêng từng người: hạ con quái mình đánh trúng +${X.quai}% liên sát (boss nhỏ +${X.bossNho}%), đánh ${tenBoss} mỗi 1% máu +${X.bossCuoi}%. Mỗi ${X.moiBac}% lên 1 bậc Cuồng nộ (tối đa ${X.toiDa}): +${X.st}% sát thương, +${X.toc} tốc đánh ngoại công và nội công. ${X.giu} giây không đánh trúng con nào thì thanh tụt dần.`],
    ["Boss cuối", `${tenBoss} ra chiêu 90 của 1 phái và có vòng sát thương lan quanh mình mỗi ${String(H.giay).replace(".", ",")} giây (không né được, trừ kháng theo hệ boss)${moc ? `; nổi giận khi máu thấp — ${moc}` : ""}.`]]; };
const luong = (n) => { n = Math.round(Number(n) || 0); return n >= 1e4 && n % 1e4 === 0 ? `${so(n / 1e4)} vạn lượng` : `${so(n)} lượng`; };
const xuChu = (n) => `${so(n)} Xu`;
const phut = (m) => { m = Number(m) || 0; return m >= 60 && m % 60 === 0 ? `${m / 60} giờ` : `${so(m)} phút`; };
const giay = (s) => { s = Number(s) || 0; return s >= 3600 && s % 3600 === 0 ? `${s / 3600} giờ` : s >= 60 && s % 60 === 0 ? `${s / 60} phút` : `${so(s)} giây`; };
const hhmm = (g) => (typeof g === "number" ? `${String(g).padStart(2, "0")}:00` : String(g == null ? "" : g).trim());
const dsGio = (g) => (Array.isArray(g) ? g : g == null || g === "" ? [] : [g]).map(hhmm).filter(Boolean).sort();
// tên ngày như khung Lịch hoạt động (may-chu/lich-hd.js)
const THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
// CF.thu (0 = Chủ nhật … 6 = Thứ bảy; không có = mọi ngày)
function ngayChu(thu) {
  if (!Array.isArray(thu)) return "mỗi ngày";
  const s = new Set(thu.map(Number).filter((d) => d >= 0 && d <= 6));
  if (s.size >= 7) return "mỗi ngày";
  if (!s.size) return "chưa xếp ngày";
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => s.has(d)).map((d) => THU[d]).join(", ");
}
// chữ client (intro / goiY): <enter> -> hết câu, <Tên chiêu> -> “Tên chiêu”, bỏ thẻ màu
const chuClient = (s) => String(s == null ? "" : s).replace(/<color(=[^>]*)?>/gi, "")
  .replace(/\s*<enter>\s*/gi, (m, i, all) => (/[.!?:;,]$/.test(all.slice(0, i).trimEnd()) || !all.slice(0, i).trim() ? " " : ". "))
  .replace(/<([^<>]*)>/g, (m, a) => (a.trim() ? ` “${a.trim()}” ` : " ")).replace(/[<>]/g, "").replace(/\s+/g, " ").replace(/ ([.,;:!?)])/g, "$1").trim();
const boThe = (s) => String(s || "").replace(/<\/?[ygc]>/g, "");
const ngan = (s, n = 60) => { s = String(s || ""); if (s.length <= n) return s; const c = s.slice(0, n - 1); const i = c.lastIndexOf(" "); return `${(i > n / 2 ? c.slice(0, i) : c).replace(/[,;:—–-]\s*$/, "")}…`; };
const duoiChung = (g) => { let c = 0; while (g.every((a) => a.length > c && a[a.length - 1 - c] === g[0][g[0].length - 1 - c])) c++; return c; };
// gộp tên: "Lam Thủy Tinh", "Tử Thủy Tinh" -> "Lam / Tử Thủy Tinh"; "Phúc Duyên Lộ (Tiểu)"… -> "Phúc Duyên Lộ (Tiểu / Trung / Đại)"; đuôi 1 chữ chỉ
// gộp khi là chữ thường ("… hoàn"). gom = xếp các tên cùng đuôi cạnh nhau trước (danh sách không cần giữ thứ tự)
function gopTen(ds, gom = false) {
  ds = ds.filter(Boolean);
  if (ds.length < 2) return ds[0] || "";
  if (gom) { const duoi = (s) => s.split(" ").slice(-1)[0]; ds = ds.map((s, i) => [s, i]).sort((a, b) => duoi(a[0]).localeCompare(duoi(b[0]), "vi") || a[1] - b[1]).map((r) => r[0]); }
  const w = ds.map((s) => s.split(" "));
  let pre = 0;
  while (w.every((a) => a.length > pre + 1 && a[pre] === w[0][pre])) pre++;
  if (pre >= 2) {
    const giua = w.map((a) => a.slice(pre).join(" ")), ngoac = giua.every((s) => /^\(.*\)$/.test(s));
    return `${w[0].slice(0, pre).join(" ")} ${ngoac ? `(${giua.map((s) => s.slice(1, -1)).join(" / ")})` : giua.join(" / ")}`;
  }
  const nhom = [];
  for (const a of w) {
    const g = nhom[nhom.length - 1], thu = g ? [...g, a] : null, c = thu ? duoiChung(thu) : 0;
    if (g && c >= 1 && thu.every((x) => x.length > c)) g.push(a); else nhom.push([a]);
  }
  return nhom.map((g) => {
    const c = duoiChung(g), dau = c ? g[0][g[0].length - c] : "";
    return g.length > 1 && (c >= 2 || (g.length >= 3 && /^\p{Ll}/u.test(dau))) ? `${g.map((a) => a.slice(0, a.length - c).join(" ")).join(" / ")} ${g[0].slice(g[0].length - c).join(" ")}` : g.map((a) => a.join(" ")).join(" / ");
  }).join(" / ");
}
// khoảng phần trăm "≈ 97,27 – 99,44 %"
function khoangPt(a, b) {
  if (Math.abs(a - b) < 1e-12) return pt(a);
  const x = pt(Math.min(a, b)), y = pt(Math.max(a, b)), xap = x.startsWith("≈") || y.startsWith("≈") ? "≈ " : "", bo = (s) => s.replace("≈ ", "").replace(" %", "");
  return `${xap}${bo(x)} – ${bo(y)} %`;
}
// số lượng món "3 cái" / "30 bình"
const slChu = (k, n) => `${so(n || 1)} ${(BY(k) || {}).thuoc ? "bình" : "cái"}`;
// gom mốc [nhãn, số] -> "30 (1), 40 (2)…" (1 mốc: "30 — 1 cái")
const gomMoc = (k, L) => (L.length === 1 ? `${L[0][0]} — ${slChu(k, L[0][1])}` : L.map(([a, n]) => `${a} (${so(n)})`).join(", "));

// ---------- món ----------
const BY = (k) => (C.N.BY && C.N.BY.get(k)) || ((C.KTC || {}).items || {})[k] || null;
const ten = (k) => (k === "biKip" ? "Sách võ công 90 (1 cuốn bất kỳ)" : k === "xu" ? "Xu" : String(C.DO.tenMon({ k }) || k).replace(/\s+/g, " ").trim());
const icCua = (k) => { const x = BY(k); return x && x.ic ? x.ic : undefined; };
const monSl = (k, n) => `${(n | 0) > 1 ? `${so(n)} ` : ""}${ten(k)}`;
const dsMon = (L, noi = ", ") => (Array.isArray(L) ? L : []).map((r) => monSl(r[0], r[1])).join(noi);
const tenBai = (z) => { const Z = C.N.ZONES && C.N.ZONES.get(+z); return Z && Z.n ? String(Z.n).trim() : ""; };
const laSach = (x) => !!(x && x.dung && x.dung.loai === "sach");
// Tống Kim (may-chu/tong-kim.js vatTk): món chỉ dùng trong chiến trường -> { loai, buff | k | v, giay } | null; Huân công bài: kinh nghiệm bốc; trạng thái phe
const tkVat = (k, D) => { const m = nap("./tong-kim.js"); try { return m && m.vatTk ? m.vatTk(k, D) : null; } catch { return null; } };
const hcChu = (D) => {
  const L = (D && Array.isArray(D.kn) && D.kn.length ? D.kn : ((C.F.tk || {}).thuong || {}).hcKn || []).filter((r) => Array.isArray(r) && Number(r[1]) > 0), t = tong(L.map((r) => r[1])) || 1;
  return L.length ? `${L.map(([v, p]) => `${knChu(v)} (${pt(Number(p) / t)})`).join(" / ")} kinh nghiệm` : "kinh nghiệm";
};
const DOI_CHU = { tkChienCo: "sinh lực tối đa +30 %, kháng tất cả +30 %", tkLenhBai: "tốc độ chạy +30 %, tốc độ đánh +50" };
const doiChu = (k) => { const T = (C.KTC.buff || {})[k]; return (T && T.d) || DOI_CHU[k] || "tăng sức"; };
// gói quà { kn, knCap, tien, xu, do }
function goi(g) {
  const p = [];
  if (g.kn > 0) p.push(kn(g.kn));
  if (g.knCap > 0) p.push(`${pt(g.knCap)} kinh nghiệm lên cấp`);
  if (g.tien > 0) p.push(luong(g.tien));
  if (g.xu > 0) p.push(xuChu(g.xu));
  for (const [k, n] of g.do || []) p.push(monSl(k, n));
  return p.join(" + ") || "—";
}
// nguồn có món (nhóm Vật phẩm "Có từ") / công dụng thêm từ hoạt động / chỗ mua riêng
function nguon(k, s, t) {
  if (!k || !s) return;
  if (k === "biKip") s += ` (ra 1 cuốn bất kỳ trong ${Rc().BI_KIP.length} sách)`;
  const L = C.NG.get(k) || [];
  if (!L.some((o) => o.s === s)) L.push({ s, t: t || "" });
  C.NG.set(k, L);
}
const themVao = (M, k, s) => { if (!k || !s) return; const L = M.get(k) || []; if (!L.includes(s)) L.push(s); M.set(k, L); };
const dungThem = (k, s) => themVao(C.CD, k, s);
const muaThem = (k, s) => themVao(C.MUA, k, s);
const tenHd = (k) => [...new Set((C.NG.get(k) || []).map((o) => o.t).filter(Boolean))];
// giá Kỳ Trân Các: khóa -> [thẻ, Xu]; cửa hàng phúc duyên: khóa -> điểm
function giaKtc() {
  if (C.gK) return C.gK;
  C.gK = new Map();
  // dòng hàng sự kiện (o.sk — anh 16/11, Báo Đáp Ân Sư "bdas"): chỉ tính giá khi sự kiện đang mở bán (giai đoạn thu thập — dauLich đổi theo ngày nên dựng lại)
  const skMo = (sk) => sk !== "bdas" || phaBdas(cfBdasCua(C.N)) === "thu";
  for (const t of C.KTC.the || []) for (const o of t.hang || []) if (o.k && !C.gK.has(o.k) && (!o.sk || skMo(o.sk))) C.gK.set(o.k, [t.n, o.gia]);
  return C.gK;
}
const giaPd = () => C.gP || (C.gP = new Map((C.KTC.phucDuyen || []).filter((o) => o.k).map((o) => [o.k, o.gia])));
const giaKtcChu = (k) => { const g = giaKtc().get(k); return g ? `Kỳ Trân Các ${xuChu(g[1])}` : ""; };
const tong = (a) => a.reduce((t, x) => t + (Number(x) || 0), 0);
const chuan = (a) => { const s = tong(a || []) || 1; return (a || []).map((v) => (Number(v) || 0) / s); };

// mục: lỗi thì ghi rồi bỏ
function moi(ds, id, fn) {
  try { const m = fn(); if (m) ds.push(m); } catch (e) { loiGhi(`mục ${id}`, e); }
}

// ---------- bảng chung của đồ rơi ----------
// tên loại món của Kỳ Trân Các (daTau.boThuong)
const BO_TEN = { sach: "sách võ công 90", sach120: "sách kỹ năng 120", daiThanh: "Đại Thành Bí Kíp", matTich: "Võ Lâm Mật Tịch", tayTuy: "Tẩy Tủy Kinh" };
const LOAI = { 0: "Vũ khí cận chiến", 1: "Ám khí (tầm xa)", 2: "Áo", 3: "Nhẫn", 4: "Dây chuyền", 5: "Giày", 6: "Đai lưng", 7: "Mũ", 8: "Hộ uyển", 9: "Ngọc bội" };
const JEWEL = [3, 4, 9];
const TEN_QUAN = { th: "Tiểu hiệu", dt: "Đội trưởng", tp: "Tiên phong", ct: "Chủ tướng", cs: "Chủ soái", xe: "Công Thành Chiến Xa", tb: "Thần binh" };
const HANG_QUAN = ["th", "dt", "tp", "ct", "cs"];
// Mã bài danh mã (quà kích sát Boss Hoàng Kim — boss-tg.js DANH_MA)
const DANH_MA = ["ms:2328", "ms:2329", "ms:2330", "ms:2331", "ms:2332"];
function roiCo() {
  const CFG = C.CFG;
  const wL = CFG.loaiDo || {}, sumW = tong(Object.values(wL)) || 1, pJ = JEWEL.reduce((t, k) => t + (Number(wL[k]) || 0), 0) / sumW;
  // nhẫn, dây chuyền, ngọc bội không rơi trắng: quay 0 dòng thành 1 dòng (do.js taoDo)
  const that = (d) => d.map((v, i) => (i === 0 ? v * (1 - pJ) : i === 1 ? v + d[0] * pJ : v));
  const SD = CFG.soDong || {}, DN = that(chuan(SD.quaiThuong)), DT = that(chuan(SD.trum));
  const RDC = { boKhoiBangClient: [], thuLinh: {}, satThu: {}, satThuTangMoiBac: 0, ...(CFG.roiDacBiet || {}) };
  const BI_KIP = [...C.N.BY.values()].filter(laSach).map((x) => x.k);
  const BO = new Set((RDC.boKhoiBangClient || []).flatMap((k) => (k === "biKip" ? BI_KIP : [k])));
  return {
    wL, sumW, pJ, DN, DT, RDC, BI_KIP, BO,
    tren: (D, n) => tong(D.slice(n)),
    loc: (b) => Object.entries(b || {}).filter(([k, p]) => !BO.has(k) && Number(p) > 0),
    heSoBac: (cap) => 1 + (Number(RDC.satThuTangMoiBac) || 0) * Math.max(0, ((cap | 0) - 20) / 10),
    QD: { tinhAnhMoi: 50, thuLinhMoi: 250, tinhAnhRoiDo: 0.1, ...(CFG.quaiDacBiet || {}) },
    roiDo: { quaiThuong: 0.01, trum: 0.2, ...(CFG.roiDo || {}) },
    RDB: (tinh("rdb", "assets/data/roi-dac-biet.json") || {}).bai || {},
    mm: Number(CFG.mayManToiDa ?? 60) || 0,
    capDo: { chiaDuoi: 20, chiaTren: 10, ...(CFG.capDo || {}) },
  };
}
const Rc = () => C.R || (C.R = roiCo());
const dongBang = (D) => D.map((p, n) => [n ? `${n} dòng` : "Trắng", pt(p)]).filter((r, n) => D[n] > 0);
const loaiBang = () => { const R = Rc(); return Object.entries(R.wL).filter(([, w]) => Number(w) > 0).map(([t, w]) => [LOAI[t] || `Loại ${t}`, pt(Number(w) / R.sumW)]); };
const capDoRoi = (L, boss) => { const R = Rc(), hi = Math.max(1, Math.min(10, Math.floor(L / R.capDo.chiaTren))), lo = Math.max(1, Math.min(hi, Math.floor(L / R.capDo.chiaDuoi))); return boss ? [hi, hi] : [lo, hi]; };
const satThuDl = () => { const m = nap("./sat-thu.js"); return (m && m.ST) || tinh("st", "assets/data/sat-thu.json") || { bac: [], roi: {} }; };
const vuotAiDl = () => { const m = nap("./vuot-ai.js"); return (m && m.VA) || tinh("va", "assets/data/vuot-ai.json") || { cap: [], han: 1800 }; };
const vaDem = (t) => { let boss = 0, quai = 0, k = 0; for (const d of t.dot || []) { k += Number(d.kn) || 0; for (const g of d.ds || []) { if (g.boss) boss += g.n | 0; else quai += g.n | 0; } } return { boss, quai, kn: k }; };

// =====================================================================================================================
// HOẠT ĐỘNG
// =====================================================================================================================
function nhomHd(ds) {
  for (const [id, fn] of [["phongHoa", hdPhongHoa], ["tongKim", hdTongKim], ["bossTg", hdBossTg], ["pld", hdPld], ["sanNhim", hdSanNhim], ["ruongTb", hdRuongTb], ["phuQuy", hdPhuQuy],
    ["vuotAi", hdVuotAi], ["satThu", hdSatThu], ["daTau", hdDaTau], ["minhChu", hdMinhChu], ["tuLam", hdTuLam], ["quaiChung", hdQuaiChung], ["tayTuy", hdTayTuy],
    ["uyThac", hdUyThac], ["choTroi", hdChoTroi]]) moi(ds, id, fn);
}

// ---------- Báo Đáp Ân Sư (anh 16/11 — may-chu/bao-dap-an-su.js; sự kiện tháng 11 client activity 22 "Báo Đáp Ân Sư – Đỗ Khang Tửu") ----------
// Sự kiện theo NGÀY giờ Việt Nam: tu ≤ hôm nay < den thu thập / mời rượu / làm / dâng / mua hàng sự kiện; mở hương bao tới trước moHet. Số đọc cf() của module (mặc
// định + cau-hinh.json baoDapAnSu — F10 sửa sống); module chưa nạp được thì cau-hinh.json. Mục Tra cứu chỉ có khi sự kiện bật và chưa quá moHet; giai đoạn ngày
// (phaBdas) nằm trong dấu dauLich -> sang giai đoạn mới thì lay() tự dựng lại
const BD_MON = { ruou: "ms:2572", tra: "ms:2573", to: "ms:2574", chi: "ms:2575", duoc: "ms:2576", tt: "ms:2577", ns: "ms:2578", td: "ms:2579", leBao: "ms:2580", nen: "ms:1817" };
const laNgayBd = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const homVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const truocNgay = (s) => new Date(Date.parse(s + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);
const ddmm = (s) => `${String(s).slice(8, 10)}/${String(s).slice(5, 7)}`;
function cfBdasCua(N) {
  let m = null;
  try { m = require("./bao-dap-an-su.js"); } catch { m = null; } // chưa có module: im (dùng cau-hinh.json)
  try { if (m && typeof m.cf === "function") { const F = m.cf(); if (F) return F; } } catch (e) { loiGhi("Báo Đáp Ân Sư cf()", e); }
  return (N && N.CFG && N.CFG.baoDapAnSu) || null;
}
// "tat" (tắt / thiếu ngày) | "truoc" (chưa tới tu) | "thu" (thu thập — tới hết den) | "hb" (chỉ còn mở hương bao — tới hết moHet) | "het"
const phaBdas = (F, hom = homVN()) => (!F || F.bat === false || !laNgayBd(F.tu) || !laNgayBd(F.den) ? "tat" : hom < F.tu ? "truoc" : hom < F.den ? "thu"
  : hom < (laNgayBd(F.moHet) ? F.moHet : F.den) ? "hb" : "het");


function hdPhongHoa() {
  const F = C.F.ph, PJ = tinh("ph", "assets/data/phong-hoa.json") || {}, gio = dsGio(F.gio), ngay = ngayChu(F.thu), tat = F.bat === false || !gio.length;
  const T = { duoi: 500000, tren: 1000000, toiDa: 10000000, nhan: 2, ruongXanh: 3, ...(F.thuong || {}) }, rx = Number(T.ruongXanh) || 0, RX = ten("ms:1884");
  const tq = (PJ.tuongQuan || []).length || 3, cs = (((PJ.mau || {}).chuSoai || {}).tpl || []).length || 10;
  const thang = T.toiDa * T.nhan, thap = Math.floor(T.duoi / 100000) * 1000000 * T.nhan, cao = Math.floor((T.tren - 1) / 100000) * 1000000 * T.nhan;
  const gd = (F.giaiDoan || []).map((g) => `${g.ten} (phút ${so(g.tu)})`).join(", ");
  const xe = (Array.isArray(F.xe) ? F.xe : []).filter((r) => Array.isArray(r) && r[1] > 0).map((r) => so(r[0])).join(", ");
  const lich = `${gio.join(", ")} ${ngay}`;
  if (rx) nguon("ms:1884", `Phong Hỏa Liên Thành: thắng trận, kinh nghiệm trong trận từ ${so(T.tren)} — ${slChu("ms:1884", rx)}`, "Phong Hỏa Liên Thành");
  return {
    id: "phongHoa", ten: "Phong Hỏa Liên Thành", lich: "phongHoa",
    tom: tat ? "Đang tạm dừng" : `${lich} — báo danh ${phut(F.baoDanh)}, đánh ${phut(F.danh)}`,
    tim: "phong hoa thủ thành vệ binh thành môn biện kinh quân tống chủ soái chiến xa tướng quân bùa phe kim",
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : `${lich}. Báo danh ${phut(F.baoDanh)}, đánh ${phut(F.danh)}.`],
      ["NPC", "Vệ binh thành môn (Biện Kinh)."],
      ["Điều kiện", `Cấp ${so(F.cap)} trở lên. Phí ${luong(F.phi)} mỗi trận.`],
      ["Cách chơi", `Giữ thành trước các đợt quân Tống, chiến xa và ${cs} Chủ soái (phút ${so(F.chuSoai)}). Hết giờ thành còn là thắng.`],
      ["Phần thưởng", `Kinh nghiệm hạ quân. Thắng: tới ${kn(thang)}${rx ? ` + ${rx} ${RX}` : ""}.`],
    ],
    noi: [
      { p: `Phe Kim giữ thành trước quân Tống. Báo danh ở <y>Vệ binh thành môn</y> (Biện Kinh): cấp <y>${so(F.cap)}</y> trở lên, phí <y>${luong(F.phi)}</y> mỗi trận.` },
      { h: "Lịch trận" },
      { ds: [
        tat ? "<c>Đang tạm dừng.</c>" : `<y>${lich}</y>: mở báo danh ${phut(F.baoDanh)}${F.baoTruoc > 0 ? ` (báo trước ${phut(F.baoTruoc)})` : ""}.`,
        `Đánh ${phut(F.danh)}${gd ? `; quân Tống chia đợt: ${gd}` : ""}.`,
        xe ? `Công Thành Chiến Xa ra ở phút ${xe}; mỗi chiếc tới cổng thành trừ 1 điểm thủ thành (có ${so(F.diem)} điểm).` : "",
        `Phút ${so(F.chuSoai)}: ${cs} Chủ soái xuất trận, đóng báo danh.`,
      ].filter(Boolean) },
      { h: "Thắng / thua" },
      { ds: [`Thắng: giữ thành tới hết giờ, hoặc hạ đủ ${cs} Chủ soái.`, `Thua: ${tq} Tướng quân thủ thành đều tử trận, hoặc điểm thủ thành về 0.`] },
      { h: "Phần thưởng" },
      { p: "Hạ quân Tống được kinh nghiệm: người đánh nhiều nhất nhận trọn, người cùng đánh nhận theo phần sát thương. Không rơi tiền, trang bị thường." },
      { bang: [["Kinh nghiệm trong trận", "Thưởng khi thắng"], [`Từ ${so(T.tren)}`, `${kn(thang)}${rx ? ` + ${rx} ${RX}` : ""}`],
        [`${so(T.duoi)} – ${so(T.tren - 1)}`, `${knChu(thap)} – ${kn(cao)}`], [`Dưới ${so(T.duoi)}`, "Không có"]] },
      { p: `Kinh nghiệm trong trận là kinh nghiệm gốc kiếm được trong trận; mỗi ${so(100000)} tính ${knChu(1000000 * T.nhan)}. Chỉ người còn trong trận lúc kết thúc mới nhận; thua thì không có thưởng thêm.` },
      { p: "Quân Tống còn rơi bùa, Thủy Tinh, Thiết La Hán, Xu — xem Rơi đồ từ quái → Quân Phong Hỏa." },
    ],
  };
}

// Tống Kim (anh 06/11 — may-chu/tong-kim.js): 4 trận mỗi ngày, Mộ binh quan / Quân Nhu quan Biện Kinh; ghi nguồn Hồn Thạch, Huân công bài, Nhạc Vương Kiếm,
// giá Quân Nhu quan
function hdTongKim() {
  const F = C.F.tk, MDK = MD.tongKim, gio = dsGio(F.gio), ngay = ngayChu(F.thu), tat = F.bat === false || !gio.length;
  const T = { ...MDK.thuong, ...(F.thuong || {}) }, TT = { ...MDK.thienTu, ...(F.thienTu || {}) }, DU = { ...MDK.duc, ...(F.duc || {}) };
  const DB = Array.isArray(F.diemBinh) ? F.diemBinh : MDK.diemBinh, CH = Array.isArray(F.chuc) ? F.chuc : MDK.chuc;
  const CM = Array.isArray(F.chucMau) ? F.chucMau : MDK.chucMau, CT = Array.isArray(F.chucThu) ? F.chucThu : MDK.chucThu, htL = Array.isArray(T.ht) ? T.ht : [2, 0];
  const ht = ten(T.htMon), hc = ten(T.hcMon), kiem = ten(DU.mon), lich = `${gio.join(", ")} ${ngay}`;
  const ttNgay = (Array.isArray(TT.thu) ? TT.thu : []).map((d) => THU[d]).filter(Boolean).join(", ");
  const knDiem = (lv) => Math.floor((700 + Math.floor((lv - 40) / 5) * 100) * (Number(T.knHs) || 0) + 1e-6);
  const QN = (Array.isArray(F.quanNhu) ? F.quanNhu : []).filter((r) => Array.isArray(r) && Number(r[1]) > 0);
  nguon(T.htMon, `Tống Kim: thưởng cuối trận — thắng ${so(htL[0])} / thua ${so(htL[1])} viên, +${so(T.htThem)} nếu từ ${so(T.htMoc)} điểm trận, +${so(T.htSoai)} cho người đánh Nguyên Soái địch nhiều nhất`, "Tống Kim");
  nguon(T.hcMon, `Tống Kim: phe thắng, từ ${so(T.hcDiem)} điểm trận — tối đa ${so(T.hcNgay)} cái mỗi ngày`, "Tống Kim");
  nguon(DU.mon, `Quân Nhu quan (Điểm báo danh Tống Kim): đúc từ ${so(DU.can)} ${ht}`, "Tống Kim");
  dungThem(T.htMon, `${so(DU.can)} viên đúc 1 ${kiem} ở Quân Nhu quan (Điểm báo danh Tống Kim) — không tốn tiền; không đúc khi trận đang đánh.`);
  for (const [k, g] of QN) muaThem(String(k), `Quân Nhu quan (Điểm báo danh Tống Kim): ${so(g)} điểm Tống Kim`);
  const chuc = ["Hiệu úy", "Thống lĩnh", "Phó tướng", "Đại tướng"].map((n, i) => `${n} ${so(CH[i])} (sinh lực +${so(CM[i + 1])} %${Number(CT[i + 1]) > 0 ? `, phòng thủ +${so(CT[i + 1])} %` : ""})`).join("; ");
  return {
    id: "tongKim", ten: "Tống Kim", lich: "tongKim",
    tom: tat ? "Đang tạm dừng" : `${gio.length} trận ${ngay} — báo danh ${phut(F.baoDanh)}, đánh ${phut(F.danh)}`,
    tim: "tống kim chiến trường mộ binh quan quân nhu quan nguyên soái pk bot biện kinh nhạc vương hồn thạch huân công bài điểm tống kim",
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : `${lich}. Báo danh ${phut(F.baoDanh)}, đánh ${phut(F.danh)}.`],
      ["NPC", "Mộ binh quan, Quân Nhu quan mỗi phe ở Điểm báo danh Tống Kim (Xa phu các thành đưa tới)."],
      ["Điều kiện", `Cấp ${so(F.cap)} trở lên. Ủng hộ ${luong(F.phi)} mỗi trận; ${F.vaoTuDo !== false ? "vào lúc nào cũng được khi trận chưa kết thúc" : `vào muộn tới phút ${so(F.vaoMuon)}`}.`],
      ["Cách chơi", `PK hai phe cùng bot và quân 6 bậc. Nguyên Soái ra phút ${so(F.soai1)} / ${so(F.soai2)}; hạ Nguyên Soái địch trước là thắng.`],
      ["Phần thưởng", `Điểm Tống Kim, ${ht}, kinh nghiệm, ${hc}. Trận Thiên Tử ×${so(TT.heSo)}.`],
    ],
    noi: [
      { p: `Hai phe Tống – Kim đánh nhau ở chiến trường (mở PK). Báo danh ở <y>Mộ binh quan</y> phe mình tại Điểm báo danh Tống Kim (Xa phu các thành đưa tới): cấp <y>${so(F.cap)}</y> trở lên, ủng hộ <y>${luong(F.phi)}</y> mỗi trận — rớt mạng / rời trận thì vào lại đúng phe cũ, không mất phí, điểm và chức giữ nguyên. Quân số hai phe hơn kém nhau tối đa 1 người; vào trận thì rời tổ đội.` },
      { h: "Lịch trận" },
      { ds: [
        tat ? "<c>Đang tạm dừng.</c>" : `<y>${lich}</y>: báo danh ${phut(F.baoDanh)}${F.baoTruoc > 0 ? ` (báo trước ${phut(F.baoTruoc)})` : ""}, đánh ${phut(F.danh)}.`,
        F.vaoTuDo !== false ? "Trận đã khai chiến vẫn báo danh / vào được bất cứ lúc nào, tới khi trận kết thúc." : `Vào muộn được tới phút ${so(F.vaoMuon)} của trận.`,
        ttNgay ? `Trận Thiên Tử (Đêm Huy Hoàng): trận cuối ngày ${ttNgay} — điểm Tống Kim và kinh nghiệm thưởng ×${so(TT.heSo)}.` : "",
      ].filter(Boolean) },
      { h: "Thắng / thua" },
      { ds: [`Phút ${so(F.soai1)}: Nguyên Soái phe ít điểm xuất hiện ở đại doanh (bằng điểm: cả 2); phút ${so(F.soai2)}: phe kia.`,
        "Phe hạ Nguyên Soái địch trước thắng — trận kết thúc ngay. Không ai hạ được: hết giờ phe nhiều điểm trận hơn thắng; bằng điểm thì phe Tống thắng."] },
      { h: "Điểm trận" },
      { bang: [["Hạ", "Điểm"], ["Người chơi / tướng sĩ phe địch", `${so(F.pk)} × hệ số chức`], ["Liên trảm (mỗi 3 mạng)", `+${so((F.lienTram || [])[1])}`],
        ["Tống binh / Kim binh", so(DB[0])], ["Hiệu úy", so(DB[1])], ["Thống lĩnh", so(DB[2])], ["Phó tướng", so(DB[3])], ["Đại tướng", so(DB[4])], ["Nguyên Soái", so(DB[5])]] },
      { p: `Chức theo điểm trận: ${chuc}. Bị hạ không mất gì, ${so(F.hoiSinh)} giây sau trở lại hậu doanh.` },
      { h: "Phần thưởng cuối trận" },
      { p: `Người đã báo danh, còn trong chiến trường lúc kết thúc (rời chưa quá 2 phút), từ <y>${so(T.diemMin)}</y> điểm trận:` },
      { ds: [
        `Điểm Tống Kim = điểm trận + ${so(T.thang)} (thắng) / ${so(T.thua)} (thua).`,
        `${ht}: thắng ${so(htL[0])} / thua ${so(htL[1])} viên; +${so(T.htThem)} nếu từ ${so(T.htMoc)} điểm trận; +${so(T.htSoai)} cho người đánh Nguyên Soái địch nhiều nhất.`,
        `Kinh nghiệm = điểm trận × (700 + 100 mỗi 5 cấp trên cấp 40) × ${String(T.knHs).replace(".", ",")}, tối đa ${kn(T.knToiDa)} (cấp 100: ${so(knDiem(100))} mỗi điểm; cấp 150: ${so(knDiem(150))} mỗi điểm).`,
        `${hc}: phe thắng, từ ${so(T.hcDiem)} điểm trận, tối đa ${so(T.hcNgay)} cái mỗi ngày; dùng trước 24:00 ngày hôm sau.`,
      ] },
      { h: "Quân Nhu quan" },
      { p: `Bán bằng điểm Tống Kim (không bán khi trận đang đánh). Đúc ${so(DU.can)} ${ht} thành 1 ${kiem}. Thuốc hoàn, Chiến cổ, Lệnh Bài, Càn Khôn Tạo Hóa Đan chỉ dùng trong chiến trường.` },
      ...(QN.length ? [{ bang: [["Vật phẩm", "Điểm Tống Kim"], ...QN.map(([k, g]) => [ten(String(k)), so(g)])] }] : []),
    ],
  };
}

function hdBossTg() {
  const F = C.F.btg, BT = tinh("btg", "assets/data/boss-tg.json") || {}, gio = dsGio(F.gio), ngay = ngayChu(F.thu), tat = F.bat === false || !gio.length;
  const cho = (Array.isArray(F.cho) && F.cho.length ? F.cho : BT.cho || []).map((o) => tenBai(o && o.bai)).filter(Boolean);
  const noiRa = [...new Set(cho)].join(" / ") || "bãi luyện công", tenBoss = (BT.ds || []).map((b) => b.ten).filter(Boolean);
  const hang = (F.hang || []).slice().sort((a, b) => a.den - b.den), top = hang.length ? hang[hang.length - 1].den : 0, lich = `${gio.join(", ")} ${ngay}`;
  return {
    id: "bossTg", ten: "Boss Hoàng Kim", lich: "bossTg",
    tom: tat ? "Đang tạm dừng" : `${lich} — boss sống tối đa ${phut(F.song)}`,
    tim: `boss thế giới hoàng kim ${noiRa} ${tenBoss.join(" ")}`,
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : `${lich}. Boss sống tối đa ${phut(F.song)}.`],
      ["Địa điểm", `Ngoài cổng ${noiRa} — báo cả máy chủ khi xuất hiện.`],
      ["Điều kiện", "Mọi cấp. Phải đứng trong bản đồ có boss mới tính sát thương."],
      ["Cách chơi", `Mỗi khung giờ ${so(Math.max(1, F.so | 0 || 1))} boss, mỗi con ${knChu(F.mau)} máu${+F.mauNguoi > 0 ? ` + ${knChu(F.mauNguoi)} mỗi người tham gia` : ""}; boss mạnh thêm ${so(+F.stNguoi || 0)} % mỗi người, dùng võ công 90 của phái mình, có sát thương vùng chủ độc, miễn choáng.`],
      ["Phần thưởng", `${kn(F.kn)} chia theo % sát thương.${(F.thamGia | 0) > 0 ? ` Ai đánh boss cũng được ${so(F.thamGia | 0)} ${ten("ms:1884")}${+F.xuTl > 0 ? ` (${so(+F.xuTl)} % được 1 Xu)` : ""}.` : ""} Top ${top} có quà, người kết liễu có quà kích sát.`],
    ],
    noi: [
      { p: `Mỗi lần 1 trong ${tenBoss.length || "các"} Boss Hoàng Kim${BT.lv ? ` cấp ${BT.lv}` : ""} xuất hiện ngoài cổng ${noiRa} (<y>${tat ? "đang tạm dừng" : lich}</y>). Không ai hạ được sau ${phut(F.song)} thì boss rời đi; đang có boss thì không ra boss mới.` },
      { ds: [
        `Kinh nghiệm: ${kn(F.kn)} chia theo phần trăm sát thương. Đạt từ ${pt(F.nguong / 100)} tổng sát thương: ít nhất ${kn(F.knIt)} + quà xếp hạng nếu vào top; dưới mức đó vẫn có kinh nghiệm theo phần trăm.`,
        ...((F.thamGia | 0) > 0 ? [`Quà tham gia: ai có sát thương cũng được ${so(F.thamGia | 0)} ${ten("ms:1884")} — vào hành trang khi có chỗ (túi đầy thì chờ, dọn túi là vào).${+F.xuTl > 0 ? ` Mỗi người tham gia còn ${so(+F.xuTl)} % may mắn được 1 Xu.` : ""}`] : []),
        `Máu boss ${knChu(F.mau)}${+F.mauNguoi > 0 ? `, mỗi người tham gia đánh thêm ${knChu(F.mauNguoi)}` : ""}; sát thương của boss tăng ${so(+F.stNguoi || 0)} % mỗi người tham gia. Boss dùng võ công 90 (nội và ngoại) của đúng phái mình, miễn choáng; sát thương vùng chủ độc: đứng gần boss trúng độc mỗi 3 giây (boss dưới 50 % máu: 2 giây, dưới 25 %: 1 giây, dưới 10 %: nửa giây) — đứng xa ra để tránh.`,
        "Tin hệ thống báo ai phát hiện boss (đánh trúng đầu tiên), ai kích sát và người tham gia nào may mắn được Xu.",
        `Quà xếp hạng top ${top} và quà kích sát (người ra đòn kết liễu): xem Rương & hộp quà → Quà Boss Hoàng Kim.`,
        "Sát thương chỉ tính khi đứng trong bản đồ của boss; Trợ Thủ có thể tự đi tới chỗ boss.",
      ] },
    ],
  };
}

function hdPld() {
  const F = C.F.pld, M = nap("./phong-lang-do.js") || {}, H = (Array.isArray(F.gio) ? F.gio : []).map(Number).filter((h) => h >= 0 && h < 24).sort((a, b) => a - b);
  const chan = H.length === 12 && H.every((h, i) => h === i * 2), ngay = ngayChu(F.thu), tat = F.bat === false || !H.length;
  const lich = chan ? `Mỗi giờ chẵn${ngay === "mỗi ngày" ? "" : ` (${ngay})`}` : `${H.map(hhmm).join(", ")} ${ngay}`;
  const Z = C.N.ZONES.get(+(M.NAM || 336)), cap = Z ? `${Z.lo}–${Z.hi}` : "", dot = F.dotThuyTac || [], dl = F.dauLinh || [];
  dungThem(F.lenhBai, "Phong Lăng Độ: 1 lệnh bài = 1 lần lên thuyền sang bờ Bắc.");
  dungThem(F.matDo, `Phong Lăng Độ: nộp đúng ${so(F.matDoCan)} cuốn cho Thuyền phu = 1 lần lên thuyền.`);
  return {
    id: "pld", ten: "Phong Lăng Độ", lich: "pld",
    tom: tat ? "Đang tạm dừng" : `${lich} — báo danh ${phut(F.baoDanh)}, cập bờ Bắc phút ${so(F.capBo)}`,
    tim: `thuyền bến thuyền phu thủy tặc đầu lĩnh bờ bắc bờ nam ${ten(F.lenhBai)} ${ten(F.matDo)}`,
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : `${lich}: báo danh ${phut(F.baoDanh)} rồi thuyền chạy; phút ${so(F.capBo)} cập bờ Bắc.`],
      ["NPC", "Thuyền phu Giáp / Ất / Bính (bến Nam Phong Lăng Độ)."],
      ["Điều kiện", `Đã vào môn phái. Vé: 1 ${ten(F.lenhBai)} hoặc ${so(F.matDoCan)} ${ten(F.matDo)}. Tối đa ${so(F.toiDa)} người mỗi thuyền.`],
      ["Cách chơi", `Trên thuyền hạ ${dot.length} đợt Thủy tặc (${so(F.thuyTac)} con mỗi đợt) và ${dl.length} đầu lĩnh (phút ${dl.join(", ")}).`],
      ["Phần thưởng", `Hạ đầu lĩnh +${so(F.thuongDauLinh)} kinh nghiệm. Bờ Bắc: kinh nghiệm quái × ${so(F.bacKinhNghiem)}.`],
    ],
    noi: [
      { p: `Đi thuyền từ bến Nam sang bờ Bắc Phong Lăng Độ${cap ? ` (quái 2 bờ cấp ${cap})` : ""}. Lịch: <y>${tat ? "đang tạm dừng" : lich}</y>.` },
      { ds: [
        `Báo danh ${phut(F.baoDanh)} ở ${(M.THUYEN || []).length || 3} bến; hết giờ báo danh thuyền rời bến.`,
        `Thủy tặc lên thuyền ở phút ${dot.join(", ")} (mỗi đợt ${so(F.thuyTac)} con); đầu lĩnh ở phút ${dl.join(", ")}.`,
        `Phút ${so(F.capBo)} thuyền cập bờ Bắc. Quái bờ Bắc cho kinh nghiệm × ${so(F.bacKinhNghiem)}.`,
        `Về bờ Nam: gặp Thuyền phu bờ Bắc, ${luong(F.veNamGia)}. Trên thuyền và ở bờ Bắc không dùng được Thổ Địa Phù.`,
      ] },
      { p: `Vé: ${ten(F.lenhBai)}${giaKtcChu(F.lenhBai) ? ` (${giaKtcChu(F.lenhBai)})` : ""} hoặc đúng ${so(F.matDoCan)} ${ten(F.matDo)} (rơi từ quái các bãi).` },
    ],
  };
}

function hdSanNhim() {
  const F = C.F.sn, gio = dsGio(F.gio), ngay = ngayChu(F.thu), tat = F.bat === false || !gio.length;
  const cho = Object.entries(F.so || {}).map(([z, n]) => `${so(n)} con quanh ${tenBai(z) || `bãi ${z}`}`).join(", ");
  const lich = `${gio.join(", ")}${ngay === "mỗi ngày" ? "" : ` (${ngay})`}`, hiem = gopTen((F.hiem || []).map((r) => ten(r[0])));
  let tom = `${lich} — mỗi đợt ${phut(F.phut)}`;
  if (tom.length > 60) tom = `${gio.length} đợt ${ngay} — mỗi đợt ${phut(F.phut)}`;
  return {
    id: "sanNhim", ten: "Săn Nhím Béo Phì", lich: "sanNhim",
    tom: tat ? "Đang tạm dừng" : tom,
    tim: `săn nhím ${F.ten || ""} ba lăng biện kinh`,
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : `${gio.join(", ")} ${ngay}. Mỗi đợt ${phut(F.phut)}.`],
      ["Địa điểm", `${cho} (không báo tọa độ).`],
      ["Điều kiện", `Mọi cấp, đứng gần nhím. Mỗi nhân vật bắt tối đa ${so(F.ngay)} con mỗi ngày.`],
      ["Cách chơi", `${F.ten || "Nhím"} đứng yên, không đánh trả; ai ra đòn kết liễu thì bắt được. Mỗi con có số (${F.ten || "Nhím"} 1, 2…).`],
      ["Phần thưởng", `Người kết liễu: ${kn(F.kn)} + 1 món${hiem ? ` (${pt((Number(F.hiemTl) || 0) / 100)} ra ${hiem})` : ""}.${+F.phatKn > 0 ? ` Người phát hiện (đánh trúng đầu tiên): +${kn(F.phatKn)}, ${so(+F.phatXu || 0)} % được 1 Xu.` : ""}${+F.thamKn > 0 ? ` Mọi người tham gia: +${kn(F.thamKn)}, ${so(+F.thamXu || 0)} % được 1 Xu.` : ""}`],
    ],
    noi: [
      { p: `Mỗi đợt ${cho}, đứng ở chỗ ngẫu nhiên ngoài khu an toàn. Hết ${phut(F.phut)} hoặc bắt hết thì kết thúc${F.baoTruoc > 0 ? `; báo trước ${phut(F.baoTruoc)}` : ""}.` },
      { p: `Lịch: <y>${tat ? "đang tạm dừng" : `${gio.join(", ")} ${ngay}`}</y>.` },
      { p: "Quà mỗi con: xem Rương & hộp quà → Quà Săn Nhím. Tin hệ thống báo từng con bị ai phát hiện, ai kích sát, người tham gia nào may mắn được Xu." },
    ],
  };
}

function hdRuongTb() {
  const F = C.F.rtb, RJ = tinh("rtb", "assets/data/ruong-tb.json") || {}, gio = dsGio(F.gio), ngay = ngayChu(F.thu), tat = F.bat === false || !gio.length;
  const caps = Object.keys(RJ.cho || {}).map((z) => C.N.ZONES.get(+z)).filter(Boolean).map((Z) => Number(Z.lo) || 0), capMin = caps.length ? Math.min(...caps) : 90;
  const L = (F.thuong || []).filter((r) => Number(r[2]) > 0), knL = L.filter((r) => r[0] === "kn").map((r) => Number(r[1])), xuL = L.filter((r) => r[0] === "xu").map((r) => Number(r[1]));
  const monL = [...new Set(L.filter((r) => r[0] === "mon").map((r) => (Array.isArray(r[1]) ? gopTen(r[1].map(ten)) : ten(r[1]))))];
  const khoang = (a, f) => (a.length ? (Math.min(...a) === Math.max(...a) ? f(a[0]) : `${f === kn ? knChu(Math.min(...a)) : so(Math.min(...a))} – ${f(Math.max(...a))}`) : "");
  const qua = [khoang(knL, kn), ...monL, khoang(xuL, xuChu)].filter(Boolean), lich = `${gio.join(", ")} ${ngay}`;
  return {
    id: "ruongTb", ten: "Rương Thần Bí", lich: "ruongTb",
    tom: tat ? "Đang tạm dừng" : `${lich} — ${so(F.so)} rương ở bãi cấp ${capMin} trở lên`,
    tim: "rương thần bí bãi cấp 90",
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : `${lich}. Rương mất sau ${phut(F.song)} nếu không ai mở.`],
      ["Địa điểm", `${so(F.so)} bãi ngẫu nhiên từ cấp ${capMin} (báo tên bãi, không báo tọa độ).`],
      ["Điều kiện", `Cấp ${so(F.capMo)} trở lên, đứng gần rương.`],
      ["Cách chơi", "Tìm rương trong bãi; ai mở trước được 1 phần thưởng, rương biến mất."],
      ["Phần thưởng", `1 trong: ${qua.join(", ")}.`],
    ],
    noi: [
      { p: `<y>${tat ? "Đang tạm dừng" : lich}</y>: ${so(F.so)} Rương Thần Bí xuất hiện ở các bãi khác nhau từ cấp ${capMin}${F.vuaCap ? " (chỉ bãi mà người cấp cao nhất đang online vào được)" : ""}. Báo cả máy chủ tên bãi, không báo tọa độ.` },
      { ds: [`Mở: cấp ${so(F.capMo)} trở lên, đứng gần rương. Ai mở trước được 1 phần thưởng; túi đầy (phần thưởng là món) thì rương còn nguyên.`, `Không ai mở sau ${phut(F.song)} thì rương biến mất.`] },
      { p: "Bảng thưởng: xem Rương & hộp quà → Rương Thần Bí." },
    ],
  };
}

function hdPhuQuy() {
  const F = C.F.pq, ngay = ngayChu(F.thu), tat = F.bat === false, T = F.thuong || {}, D = F.dacBiet || {};
  return {
    id: "phuQuy", ten: "Phú Quý Cẩm Hạp", lich: "phuQuy", ...(icCua(F.mon) ? { ic: icCua(F.mon) } : {}),
    tom: tat ? "Đang tạm dừng" : `Quay số ${hhmm(F.quay)} ${ngay} — hộp ${xuChu(F.gia)}, cấp ${so(F.cap)}`,
    tim: `phú quý cẩm hạp thần tài quay số xổ số ${ten(F.mon)}`,
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : `Quay số ${hhmm(F.quay)} ${ngay}. Nhận thưởng tới ${hhmm(F.hetNhan)} hôm sau.`],
      ["NPC", `Thần Tài (${F.baiNpc || "Biện Kinh"}) bán hộp ${xuChu(F.gia)}.`],
      ["Điều kiện", `Cấp ${so(F.cap)}, đứng trong thôn / thành. Tối đa ${so(F.toiDa)} hộp mỗi đợt.`],
      ["Cách chơi", `Dùng hộp chọn 1 số 10–99 (+${so(F.kn)} kinh nghiệm). ${hhmm(F.quay)} quay 9 số thường + 1 số đặc biệt.`],
      ["Phần thưởng", `Số thường (${pt(9 / 90)} mỗi lần chọn): ${kn(T.kn)} + ${dsMon(T.mon)}. Số đặc biệt (${pt(1 / 90)}): ${kn(D.kn)} + ${dsMon(D.mon)}.`],
    ],
    noi: [
      { p: `Mua ${ten(F.mon)} ở Thần Tài (${F.baiNpc || "Biện Kinh"}), ${xuChu(F.gia)} mỗi hộp. Cấp ${so(F.cap)} trở lên, đứng trong thôn / thành bấm chuột phải vào hộp, nhập 1 số từ 10 đến 99: nhận ngay ${kn(F.kn)}.` },
      { ds: [
        tat ? "<c>Đang tạm dừng.</c>" : `<y>${hhmm(F.quay)}</y> ${ngay} quay 10 số khác nhau từ 10–99: 9 số thường + 1 số đặc biệt. Chọn trước ${hhmm(F.quay)} tính cho đợt hôm nay, sau đó tính cho đợt ngày mai.`,
        `Mỗi nhân vật dùng tối đa ${so(F.toiDa)} hộp mỗi đợt; chọn trùng số được.`,
        `Nhận thưởng ở Thần Tài từ ${hhmm(F.quay)} tới ${hhmm(F.hetNhan)} hôm sau; quá hạn thì mất.`,
      ] },
      { p: "Tỉ lệ và phần thưởng: xem Rương & hộp quà → Phú Quý Cẩm Hạp." },
    ],
  };
}


function hdVuotAi() {
  const F = C.F.va, VA = vuotAiDl(), tiers = (VA.cap || []).slice().sort((a, b) => a.cap - b.cap), L = Math.max(1, F.luot | 0), gianL = [], tienL = [];
  for (let i = 0; i < L; i++) { gianL.push((F.gian || [])[Math.min(i, (F.gian || []).length - 1)] | 0); tienL.push((F.tien || [])[Math.min(i, (F.tien || []).length - 1)] | 0); }
  const tienChu = tienL.every((t) => t % 10000 === 0) ? `${tienL.map((t) => so(t / 10000)).join(" / ")} vạn lượng` : tienL.map(luong).join(" / ");
  const tenBac = (t) => (t.cap === 2 ? "Cao cấp" : "Sơ cấp"), soDot = tiers.length ? (tiers[0].dot || []).length : 0, han = Number(VA.han) || 1800;
  const hs = (t) => (Number(F.doiTruong) || 1) * (t.cap === 2 ? Number(F.caoCap) || 1 : 1) * (Number(F.kinhNghiem) || 1);
  const motMinh = Math.max(1, F.toiThieu | 0) <= 1; // anh 16/11: tổ đội tối thiểu toiThieu người — chỉ nói "đi một mình" khi cấu hình còn cho
  const xong = (t, ph) => { const X = t.xong || {}; return Math.round((ph >= X.m ? X.c : Math.floor(X.a * (1 - ph / X.m)) + X.b) * 1000 * hs(t)); };
  const m = tiers.length && tiers[0].xong ? tiers[0].xong.m : 25, dem = tiers.map(vaDem), rx = F.ruongXanh | 0;
  const bangXong = [["Xong ải lúc", ...tiers.map(tenBac)], ...[10, 15, 20].filter((p) => p < m).map((p) => [`${p} phút`, ...tiers.map((t) => so(xong(t, p)))]), [`Từ ${m} phút`, ...tiers.map((t) => so(xong(t, m)))]];
  if (rx) nguon("ms:1884", `Vượt Ải: xong trọn ải — ${slChu("ms:1884", rx)} mỗi người còn trong ải`, "Vượt Ải");
  dungThem("ms:400", `Phí Vượt Ải: lần 1–${L} trong ngày nộp ${gianL.join(" / ")} giản (sơ cấp dùng giản cấp 20–80, cao cấp dùng giản từ cấp 90) + ${tienChu}.`);
  return {
    id: "vuotAi", ten: "Vượt Ải", tom: `${L} lần mỗi ngày — ${soDot} đám quái trong ${giay(han)}`,
    tim: "vượt ải thách thức thời gian nhiếp thí trần thử luyện sát thủ sát thủ giản hộp lễ vật",
    ct: [
      ["Thời gian", `Bất kỳ lúc nào, ${L} lần mỗi ngày (qua 0:00 đếm lại). Mỗi lượt ${giay(han)}.`],
      ["NPC", "Nhiếp Thí Trần (Ba Lăng huyện) → Thử luyện sát thủ."],
      ["Điều kiện", `${tiers.map((t) => `${tenBac(t)} (cấp ${t.lo}–${t.hi})`).join(", ")}. Phí lần 1–${L}: ${gianL.join(" / ")} Sát Thủ Giản + ${tienChu}.`],
      ["Cách chơi", `Tổ đội tối thiểu ${F.toiThieu || 3} người (đội trưởng báo danh). Hạ hết ${soDot} đám quái trước khi hết giờ. Đội 3 người: quái và boss mạnh ×${String((F.heSo || {}).goc || 2).replace(".", ",")} (máu, sát thương), mỗi người thêm / bớt ${String((F.heSo || {}).them ?? 0.5).replace(".", ",")} lần (tối thiểu ×0,5).`],
      ...cuongNoDong(C.CFG.cuongNo, "Nhiếp Thí Trần (đám cuối)"),
      ["Phần thưởng", `Kinh nghiệm mỗi đám + thưởng xong ải theo thời gian${rx ? `, ${rx} ${ten("ms:1884")}` : ""}. Boss rơi ${ten((F.leBao || {}).k || "ms:1392")}. Xong trọn ải: cả đội có ${Math.round((+F.xuDoi || 0) * 100)}% × (số người − 1) cơ hội mỗi người nhận ${F.xuSo | 0} Xu.`],
    ],
    noi: [
      { p: `Thách thức thời gian ở Nhiếp Thí Trần (Ba Lăng huyện). ${soDot} đám quái lần lượt, hạ hết đám này mới ra đám sau; ${giay(F.chuanBi)} chuẩn bị rồi mới tính giờ (${giay(han)}). Tử trận hoặc hết giờ thì rời ải.` },
      { bang: [["Lần trong ngày", "Sát Thủ Giản", "Ngân lượng"], ...gianL.map((g, i) => [`Lần ${i + 1}`, so(g), luong(tienL[i])])] },
      { ds: tiers.map((t, i) => `${tenBac(t)}: cấp ${t.lo}–${t.hi}, ${(t.dot || []).length} đám, ${so(dem[i].quai + dem[i].boss)} quái (${dem[i].boss} boss).`).concat(["Sơ cấp nộp Sát Thủ Giản cấp 20–80, cao cấp nộp giản từ cấp 90 (cấp thấp dùng trước)."]) },
      { h: "Kinh nghiệm" },
      { ds: [
        `Hạ hết mỗi đám: kinh nghiệm của đám — tổng cả ải ${tiers.map((t, i) => `${tenBac(t).toLowerCase()} ${so(Math.round(dem[i].kn * hs(t)))}`).join(", ")} (đội trưởng${motMinh ? " / đi một mình" : ""}).`,
        `Hệ số: đội trưởng${motMinh ? " (hoặc đi một mình)" : ""} × ${so(F.doiTruong)}, cao cấp × ${so(F.caoCap)}${Number(F.kinhNghiem) !== 1 ? `, × ${so(F.kinhNghiem)}` : ""}.`,
      ] },
      { p: `Thưởng xong ải theo thời gian — tính cho đội trưởng${motMinh ? " / người đi một mình" : ""}; thành viên khác nhận ÷ ${so(F.doiTruong)}:` },
      { bang: bangXong },
      { h: "Phần thưởng thêm" },
      { ds: [
        rx ? `Xong trọn ải: mỗi người còn trong ải <g>${rx} ${ten("ms:1884")}</g>.` : "",
        F.thuoc ? `Mỗi quái: ${pt(F.thuoc.tiLe)} rơi ${[].concat(F.thuoc.n).join("–")} ${ten(F.thuoc.k)}.` : "",
        F.leBao ? `Mỗi boss (${dem.length ? dem[0].boss : 0} con mỗi lượt): ${pt(F.leBao.roi)} rơi ${ten(F.leBao.k)} cho mỗi người còn trong ải.` : "",
        "Quái trong ải không rơi tiền, trang bị.",
      ].filter(Boolean) },
    ],
  };
}

function hdSatThu() {
  const F = C.F.st, ST = satThuDl(), bac = (ST.bac || []).slice().sort((a, b) => a.cap - b.cap), nhom = [];
  for (const b of bac) { const g = nhom[nhom.length - 1]; if (g && g.kn === (b.kn | 0)) { g.b = b.cap; g.hi = b.hi; } else nhom.push({ a: b.cap, b: b.cap, lo: b.lo, hi: b.hi, kn: b.kn | 0 }); }
  const dau = bac[0] || { cap: 20, lo: 20 }, cuoi = bac[bac.length - 1] || { cap: 90 };
  nguon("ms:399", "Boss Sát thủ: mỗi boss 1 lệnh (mọi cấp boss chung 1 loại lệnh)", "Nhiệm vụ Sát thủ");
  nguon("ms:400", `Hợp thành ở Nhiếp Thí Trần: ${so(F.gop)} Sát Thủ lệnh = 1 giản theo cấp nhân vật`, "Nhiệm vụ Sát thủ");
  return {
    id: "satThu", ten: "Nhiệm vụ Sát thủ", tom: `${so(F.moiNgay)} boss mỗi ngày — bậc ${dau.cap}–${cuoi.cap} theo cấp`,
    tim: "boss sát thủ nhiếp thí trần sát thủ lệnh sát thủ giản",
    ct: [
      ["Thời gian", `Bất kỳ lúc nào, tối đa ${so(F.moiNgay)} boss mỗi ngày (qua 0:00 đếm lại).`],
      ["NPC", "Nhiếp Thí Trần (Ba Lăng huyện)."],
      ["Điều kiện", `Cấp ${dau.lo} trở lên — nhận đúng bậc theo cấp (${bac.slice(0, 3).map((b) => b.cap).join(", ")}, … ${cuoi.cap}).`],
      ["Cách chơi", `Chọn 1 trong ${(dau.ids || []).length || 20} boss của bậc, tới bản quái chung của bãi có boss mà hạ.`],
      ["Phần thưởng", `1 Sát Thủ lệnh, kinh nghiệm (từ bậc 60), ${so(F.luot)} lượt trang bị như trùm. ${so(F.gop)} lệnh cùng cấp đổi 1 Sát Thủ Giản.`],
    ],
    noi: [
      { p: `Nhận ở Nhiếp Thí Trần (Ba Lăng huyện): mỗi bậc chọn 1 trong ${(dau.ids || []).length || 20} boss; mỗi ngày hạ tối đa <y>${so(F.moiNgay)}</y> boss.` },
      { bang: [["Bậc", "Cấp nhân vật", "Kinh nghiệm"], ...nhom.map((g) => [g.a === g.b ? String(g.a) : `${g.a}–${g.b}`, g.hi >= 200 ? `${g.lo} trở lên` : g.lo === g.hi ? String(g.lo) : `${g.lo}–${g.hi}`, g.kn ? knChu(g.kn) : "—"])] },
      { ds: [
        `Hạ boss: 1 Sát Thủ lệnh (cấp của bậc, hệ của boss) + kinh nghiệm của bậc + ${so(F.luot)} lượt trang bị như trùm (xem Rơi đồ từ quái → Boss Sát thủ).`,
        `${so(F.gop)} Sát Thủ lệnh cùng cấp hợp thành 1 Sát Thủ Giản (Nhiếp Thí Trần) — dùng làm phí Vượt Ải.`,
        `Boss chỉ ra ở bản quái chung của bãi khi có người đang nhận đúng boss đó; bị hạ thì ${giay(F.hoiSinh)} sau mới ra lại. Chỉ người đang nhận nhiệm vụ boss đó mới được tính.`,
        `Máy chủ chỉ tính boss hạ sau ${giay(F.toiThieuGiay)} kể từ lúc nhận nhiệm vụ.`,
      ] },
    ],
  };
}

function hdDaTau() {
  const D = C.CFG.daTau || {}, GH = D.gioiHan || 40, mocN = D.mocNgay || {}, R = D.ruong || {}, KI = (C.KTC || {}).items || {};
  const moiR = R.moi ?? 10, chuy = R.chuy ?? 6, coDinh = (D.oVatCoDinh || []).filter(([k, p]) => BY(k) && Number(p) > 0);
  const DT = tinh("dt", "assets/data/da-tau.json") || {}, bo = new Set(D.boThuong || ["sach", "sach120", "daiThanh", "matTich", "tayTuy"]);
  const pool = [...new Set((DT.thuongVat || []).filter((o) => !bo.has(((KI[o.k] || {}).dung || {}).loai) && BY(o.k)).map((o) => o.k))];
  const HT = { bac: [50000, 300000, 1000000], gia: [50000, 60000, 70000, 80000], ...(D.choHt || {}) };
  const ngayK = Object.keys(mocN).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  for (const n of ngayK) for (const [k, sl] of mocN[n].do || []) nguon(k, `Dã Tẩu: xong ${n} nhiệm vụ trong ngày — ${slChu(k, sl)}`, "Nhiệm vụ Dã Tẩu");
  for (const [k, p] of coDinh) nguon(k, `Dã Tẩu: ô Vật phẩm — ${pt(Number(p) / 100)} mỗi lần`, "Nhiệm vụ Dã Tẩu");
  for (const k of pool) nguon(k, "Dã Tẩu: ô Vật phẩm / Thử vận (theo giá trị nhiệm vụ)", "Nhiệm vụ Dã Tẩu");
  if (moiR > 0) nguon("ms:2374", `Dã Tẩu: mỗi ${so(moiR)} nhiệm vụ trong chuỗi (chuỗi bị xóa hoặc qua 8.000 thì đếm lại)`, "Nhiệm vụ Dã Tẩu");
  return {
    id: "daTau", ten: "Nhiệm vụ Dã Tẩu", tom: `${GH} nhiệm vụ mỗi ngày — mốc ${ngayK.join(" / ")}`,
    tim: "dã tẩu nhiệm vụ chuỗi bảo rương thần bí huyền thiên chùy",
    ct: [
      ["Thời gian", `Bất kỳ lúc nào, tối đa ${GH} nhiệm vụ mỗi ngày (qua 0:00 đếm lại).`],
      ["NPC", "Dã Tẩu (Biện Kinh, Ba Lăng huyện)."],
      ["Điều kiện", `Cấp ${so(D.capNhan ?? 20)} trở lên.`],
      ["Cách chơi", "Tìm vật phẩm, giết quái, thu thập địa đồ… Xong mỗi nhiệm vụ chọn 1 trong 3 phần thưởng."],
      ["Phần thưởng", `Kinh nghiệm, tiền hoặc vật phẩm. Mốc ngày ${ngayK.join(" / ")}${moiR > 0 ? `; mỗi ${so(moiR)} nhiệm vụ 1 ${ten("ms:2374")}` : ""}.`],
    ],
    noi: [
      { p: "Xong mỗi nhiệm vụ có 3 ô thưởng không trùng loại, chọn 1: Tiền · Kinh nghiệm · Vật phẩm · Thử vận · 1 cơ hội hủy." },
      { ds: [
        `Ô Kinh nghiệm × ${so(D.heSoKn ?? 1)}, ô Tiền × ${so(D.heSoTien ?? 1)}.`,
        coDinh.length ? `Ô Vật phẩm: ${coDinh.map(([k, p]) => `${ten(k)} ${pt(Number(p) / 100)}`).join(", ")}; trượt thì 1 món theo giá trị nhiệm vụ (${gopTen(pool.filter((k) => !coDinh.some(([c]) => c === k)).map(ten), true)}).` : "",
        bo.size ? `Không có ${[...bo].map((l) => BO_TEN[l] || l).join(", ")} trong bảng thưởng.` : "",
        "Hủy nhiệm vụ: dùng 1 cơ hội hủy, hết thì làm lại từ đầu chuỗi. Hủy 3 lần liền ở nhiệm vụ đầu chuỗi: Dã Tẩu không giao trong 10 phút.",
      ].filter(Boolean) },
      { h: "Mốc trong ngày" },
      { bang: [["Nhiệm vụ", "Phần thưởng"], ...ngayK.map((n) => [String(n), goi(mocN[n])])] },
      { h: "Bậc và rương" },
      { ds: [
        `Mỗi ${so(D.moiBac || 500)} nhiệm vụ (tổng từ trước tới nay) lên 1 bậc, tối đa ${so(D.bacToiDa ?? 20)}: thưởng mỗi nhiệm vụ +${pt(D.thuongBac ?? 0.05)} mỗi bậc; cứ ${so(D.khoBac ?? 4)} bậc nhiệm vụ khó hơn 1 mức.`,
        moiR > 0 ? `Mỗi ${so(moiR)} nhiệm vụ nhận 1 ${ten("ms:2374")} (mở cần ${so(chuy)} ${ten("ms:2348")}). Túi đầy thì Dã Tẩu giữ giúp.` : "",
        "Quà mốc theo tổng nhiệm vụ: xem Phần thưởng → Mốc Dã Tẩu.",
        `Món nhiệm vụ hay đòi có ở sạp Hệ thống của Chợ trời: ${HT.gia.map((g) => so(g / 10000)).join(" / ")} vạn lượng theo giá trị món.`,
      ].filter(Boolean) },
    ],
  };
}

function hdMinhChu() {
  const F = C.F.mc, MC = tinh("mc", "assets/data/minh-chu.json") || {}, G = F.giet || {}, T = F.thu || {}, H = F.hai || {}, rx = F.ruongXanh | 0, tat = F.bat === false;
  const suGia = (MC.suGia || []).map((s) => `${tenBai(s.bai)}${Array.isArray(s.XY) ? ` ${s.XY.join("/")}` : ""}`).filter((s) => s.trim()).join(", ") || "Biện Kinh, Ba Lăng huyện";
  const nhan = (MC.nguoiNhan || []).map((o) => `${o.ten} (${o.noi})`).join(" hoặc ") || "người nhận";
  const cayBai = {};
  for (const o of MC.loaiCay || []) (cayBai[o.bai] = cayBai[o.bai] || []).push(o);
  const cay = Object.entries(cayBai).map(([z, L]) => `${tenBai(z)}: ${L.map((o) => o.ten).join(", ")}`).join("; ");
  if (rx) nguon("ms:1884", `Võ Lâm Minh Chủ: mỗi nhiệm vụ trả xong — ${slChu("ms:1884", rx)}`, "Võ Lâm Minh Chủ");
  if (T.mon) { nguon(T.mon, "Võ Lâm Minh Chủ: nhận khi làm Giao Thư Tuyệt Mật", "Võ Lâm Minh Chủ"); dungThem(T.mon, `Giao Thư Tuyệt Mật: trao cho ${nhan}.`); }
  for (const o of MC.loaiCay || []) if (o.mon) { nguon(o.mon, `Võ Lâm Minh Chủ: hái ngoài thành ${tenBai(o.bai)} (Thu Thập Nguyên Liệu)`, "Võ Lâm Minh Chủ"); dungThem(o.mon, `Thu Thập Nguyên Liệu: hái đủ ${so(H.can)} cây cùng loại rồi về gặp Hắc Bạch Sứ Giả.`); }
  return {
    id: "minhChu", ten: "Võ Lâm Minh Chủ", tom: tat ? "Đang tạm dừng" : `3 nhiệm vụ mỗi ngày — cấp ${so(F.cap)} trở lên`,
    tim: "minh chủ hắc bạch sứ giả tiêu diệt ác bá giao thư tuyệt mật thu thập nguyên liệu",
    ct: [
      ["Thời gian", tat ? "Đang tạm dừng." : "Mỗi loại 1 lần mỗi ngày (qua 0:00 nhận lại)."],
      ["NPC", `Hắc Bạch Sứ Giả (${suGia}).`],
      ["Điều kiện", `Cấp ${so(F.cap)} trở lên.`],
      ["Cách chơi", `Tiêu Diệt Ác Bá (${so(G.can)} con), Giao Thư Tuyệt Mật, Thu Thập Nguyên Liệu (${so(H.can)} cây).`],
      ["Phần thưởng", `${knChu(G.kn)} / ${knChu(T.kn)} / ${kn(H.kn)}${rx ? `; mỗi nhiệm vụ thêm ${rx} ${ten("ms:1884")}` : ""}.`],
    ],
    noi: [
      { p: `Nhận ở Hắc Bạch Sứ Giả (${suGia}), cấp <y>${so(F.cap)}</y> trở lên. Mỗi loại 1 lần mỗi ngày; nhiệm vụ chưa xong được giữ sang ngày sau.${tat ? " <c>Đang tạm dừng.</c>" : ""}` },
      { bang: [["Nhiệm vụ", "Thưởng"], ["Tiêu Diệt Ác Bá", kn(G.kn)], ["Giao Thư Tuyệt Mật", kn(T.kn)], ["Thu Thập Nguyên Liệu", kn(H.kn)]], can: ["l", "r"] },
      rx ? { p: `Mỗi nhiệm vụ trả xong thêm <g>${rx} ${ten("ms:1884")}</g>.` } : null,
      { ds: [
        `<y>Tiêu Diệt Ác Bá</y>: hạ ${so(G.can)} con 1 loại quái ở bãi luyện công thấp nhất trong khoảng (cấp mình − ${so(G.duoi)}) tới cấp mình; đồng đội cùng bãi hạ cũng tính.`,
        `<y>Giao Thư Tuyệt Mật</y>: mang ${ten(T.mon)} tới ${nhan}, rồi về gặp Hắc Bạch Sứ Giả.`,
        `<y>Thu Thập Nguyên Liệu</y>: hái ${so(H.can)} cây cùng loại (${giay(H.giay)} mỗi lần, đi / bị đánh là hỏng) — ${cay}. Hộ Vệ Hoa Viên canh vườn.`,
      ] },
    ].filter(Boolean),
  };
}

function hdTuLam() {
  const F = C.F.tl, dt = ((F.daTau || {}).xu) | 0, st = ((F.satThu || {}).xu) | 0;
  return {
    id: "tuLam", ten: "Nhiệm vụ ngày (Trợ Thủ tự làm)", tom: `Trợ Thủ tự làm Dã Tẩu (${xuChu(dt)}) / Sát thủ (${xuChu(st)})`,
    tim: "tự làm trợ thủ tiện ích nhiệm vụ ngày auto dã tẩu sát thủ",
    ct: [
      ["Thời gian", "Mở khóa theo ngày; qua 0:00 thì khóa lại."],
      ["NPC", "Trợ Thủ → Tiện ích → Nhiệm vụ ngày."],
      ["Điều kiện", `Trả ${xuChu(dt)} (Dã Tẩu) / ${xuChu(st)} (Sát thủ) mỗi ngày.`],
      ["Cách chơi", "Trợ Thủ tự đi, tự đánh, tự mua món cần và trả nhiệm vụ. Tắt bật, thoát game giữa chừng vẫn giữ."],
      ["Phần thưởng", "Như tự làm: thưởng Dã Tẩu / Sát thủ bình thường."],
    ],
    noi: [
      { p: "Trợ Thủ → Tiện ích → Nhiệm vụ ngày: trả Xu 1 lần, dùng cả ngày (tới 0:00)." },
      { bang: [["Việc", "Giá mỗi ngày"], ["Tự làm Dã Tẩu", xuChu(dt)], ["Tự săn Boss Sát thủ", xuChu(st)]] },
      { p: "Trợ Thủ đi lại, đánh quái như người chơi, đứng trước NPC thì tự nhận / trả nhiệm vụ. Phần thưởng giống hệt tự làm." },
    ],
  };
}

function hdQuaiChung() {
  const Q = C.CFG.quaiChung || {}, TI = C.CFG.tangIchDoi || null, M = Q.manh || {}, sq = Q.soQuai || [];
  const bai = (Q.bai || []).map((z) => C.N.ZONES.get(+z)).filter(Boolean).sort((a, b) => a.lo - b.lo), th = Number(Q.thuong) || 1;
  const moc = ((TI && TI.moc) || []).map(Number).sort((a, b) => a - b), toiDa = moc.length ? moc[moc.length - 1] : 8;
  const hang = [];
  if (TI) for (let n = 2; n <= toiDa; n++) hang.push([`${n} người`, `+${so(moc.filter((m) => n >= m).length * (Number(TI.kn) || 0))} %`, `+${so(n * (Number(TI.toc) || 0))} % · +${so(n * (Number(TI.hoi) || 0))} / giây`]);
  return {
    id: "quaiChung", ten: "Quái chung & tăng ích tổ đội", tom: `Bãi chung +${so(Math.round((th - 1) * 100))} % kinh nghiệm, tiền — đội cùng bãi mạnh hơn`,
    tim: `quái chung bản chung tăng ích tổ đội ${bai.map((Z) => Z.n).join(" ")}`,
    ct: [
      ["Thời gian", "Luôn mở."],
      ["Địa điểm", `${bai.length} bãi chính (mỗi dải cấp 1 bãi) — chọn bản quái chung khi đi Xa phu / Trợ Thủ.`],
      ["Điều kiện", "Đủ cấp vào bãi. Đội viên theo bản của đội trưởng."],
      ["Cách chơi", "Mọi người thấy và đánh chung 1 đàn quái; người gây nhiều sát thương nhất nhận trọn con quái."],
      ["Phần thưởng", `Kinh nghiệm, tiền × ${so(th)}.${TI ? ` Đội cùng bãi: thêm kinh nghiệm, tốc độ, hồi phục.` : ""}`],
    ],
    noi: [
      { p: `Bãi chính của mỗi dải cấp có 2 bản trên cùng bản đồ: quái riêng như mọi bãi và <y>quái chung</y>. Ở bản chung, kinh nghiệm và tiền × <y>${so(th)}</y> (ủy thác không có).` },
      { ds: [
        "Người gây nhiều sát thương nhất nhận trọn con quái (kinh nghiệm, tiền, đồ — chia đội như thường); người cùng đánh nhận kinh nghiệm theo phần sát thương.",
        `Quái bản chung mạnh hơn: máu × ${so(M.mau || 1)}, sát thương × ${so(M.satThuong || 1)}, tốc đánh × ${so(M.tocDanh || 1)}.`,
        sq.length >= 2 ? `Số quái: mỗi người thêm ${so(sq[0])} con, thêm tối đa ${so(sq[1])}.` : "",
        "Boss Sát thủ chỉ ra ở bản quái chung (khi có người đang nhận nhiệm vụ boss đó).",
      ].filter(Boolean) },
      TI ? { h: "Tăng ích tổ đội" } : null,
      TI ? { p: "Đếm người trong đội đang online cùng bãi, cùng bản quái chung (tính cả mình). Kinh nghiệm thêm, tốc độ di chuyển + tốc đánh và hồi sinh lực / nội lực chỉ có ở bản quái chung. Ở bãi luyện công, vòng sáng, bùa lợi, hồi máu của người khác cũng chỉ nhận được ở bản quái chung. Ủy thác không tính." } : null,
      TI ? { bang: [["Cùng bãi", "Kinh nghiệm", "Tốc độ · hồi phục"], ...hang] } : null,
      { h: "Các bãi có quái chung" },
      { p: bai.map((Z) => `${Z.n} (${Z.lo}–${Z.hi})`).join(", ") || "—" },
    ].filter(Boolean),
  };
}


function hdTayTuy() {
  const F = C.F.tt, TT = ["qk:238", "qk:239", "qk:240"], BT = "qk:353";
  for (const k of TT) dungThem(k, "Tẩy tủy: bộ Lam + Tử + Lục Thủy Tinh = tẩy điểm kỹ năng.");
  dungThem(BT, `Tẩy tủy: ${so(F.bt)} viên = tẩy điểm tiềm năng.`);
  return {
    id: "tayTuy", ten: "Tẩy tủy", tom: "Đảo Tẩy Tủy — tẩy lại điểm kỹ năng / tiềm năng",
    tim: `tẩy tủy tẩy điểm xa phu thích minh đảo ${gopTen(TT.map(ten))} ${ten(BT)}`,
    ct: [
      ["Thời gian", "Bất kỳ lúc nào."],
      ["NPC", "Xa phu Ba Lăng huyện → Đi đảo Tẩy Tủy; trên đảo gặp Thích Minh."],
      ["Điều kiện", `Cấp ${so(F.capToiThieu)}, đã vào môn phái. ${so(F.mienPhi)} lần đầu miễn phí.`],
      ["Cách chơi", `Sau lần miễn phí: 1 bộ Lam + Tử + Lục Thủy Tinh tẩy kỹ năng, ${so(F.bt)} ${ten(BT)} tẩy tiềm năng, nộp cả hai tẩy cả hai.`],
      ["Phần thưởng", "Trên đảo tẩy bao nhiêu lần cũng được (đúng loại đã trả) tới khi rời đảo."],
    ],
    noi: [
      { p: `Xa phu Ba Lăng huyện → Đi đảo Tẩy Tủy: cấp <y>${so(F.capToiThieu)}</y> trở lên, đã vào môn phái. Mỗi nhân vật <y>${so(F.mienPhi)}</y> lần miễn phí (tẩy cả kỹ năng lẫn tiềm năng).` },
      { bang: [["Nộp", "Tẩy"], [`${gopTen(TT.map(ten))} (mỗi loại 1 viên)`, "Điểm kỹ năng"], [`${so(F.bt)} ${ten(BT)}`, "Điểm tiềm năng"], ["Cả hai", "Cả hai"]] },
      { ds: ["Trên đảo nói chuyện Thích Minh tẩy bao nhiêu lần cũng được, rời đảo thì về Ba Lăng huyện.", "Tẩy kỹ năng vẫn giữ cấp của sách võ công / Đại Thành đã học.", "Đảo có Cọc gỗ, Bao cát, Mộc nhân để thử chiêu; không dùng Thổ Địa Phù."] },
    ],
  };
}

function hdUyThac() {
  const U = { tiLe: 0.7, gioNgay: 12, mucDinh: 300, vangGiay: 90, ...(C.CFG.uyThac || {}) };
  const bch = [...C.N.BY.values()].find((x) => x.dung && x.dung.loai === "bch"), bk = bch ? bch.k : "ms:1157", bg = bch ? bch.dung.gio : 8;
  return {
    id: "uyThac", ten: "Ủy thác", tom: `Thoát game lúc tự đánh — máy chủ cày thay ${pt(U.tiLe)} tốc độ`,
    tim: `ủy thác treo máy offline ${ten(bk)}`,
    ct: [
      ["Thời gian", `Tối đa ${so(U.gioNgay)} giờ mỗi ngày.`],
      ["NPC", `Không cần. ${ten(bk)}: +${so(bg)} giờ ủy thác mỗi viên${giaKtcChu(bk) ? ` (${giaKtcChu(bk)})` : ""}.`],
      ["Điều kiện", `Đang tự đánh ở bãi luyện công rồi thoát game (vắng quá ${giay(U.vangGiay)}). Cần còn giờ ${ten(bk)}.`],
      ["Cách chơi", `Vào lại game nhận bảng tổng kết: cày theo tốc độ giết 30 phút gần nhất ở bãi đó × ${pt(U.tiLe)}.`],
      ["Phần thưởng", "Kinh nghiệm, tiền, đồ như đánh thật; đồ qua bộ lọc nhặt / bán của Trợ Thủ."],
    ],
    noi: [
      { p: `Đang tự đánh mà máy chủ không nhận được nhịp quá <y>${giay(U.vangGiay)}</y> (đóng trang, tắt máy…) thì lúc vào lại, máy chủ cày thay khoảng vắng đó ở bãi đang đánh.` },
      { ds: [
        `Tốc độ = tốc độ giết đo trong 30 phút chơi gần nhất ở bãi (chưa đo được thì ${so(U.mucDinh)} con / giờ) × ${pt(U.tiLe)}.`,
        `Tối đa ${so(U.gioNgay)} giờ mỗi ngày, và chỉ trong số giờ ${ten(bk)} còn lại (+${so(bg)} giờ mỗi viên).`,
        "Không tốn thuốc, không chết, đồ không hao. Kinh nghiệm, tiền, đồ tính như đánh thật; đồ qua bộ lọc nhặt / bán của Trợ Thủ, túi đầy thì bán.",
        "Ủy thác không có thưởng bản quái chung, không tính tăng ích tổ đội, không tính giờ online.",
      ] },
    ],
  };
}

// thuế chợ trời chia người mua / người bán (anh 18/11 — may-chu/cho-troi.js): mặc định mỗi bên một nửa
const tBanCt = (F) => (Number.isFinite(+F.thueBan) ? +F.thueBan : (+F.thue || 0) / 2), tMuaCt = (F) => (Number.isFinite(+F.thueMua) ? +F.thueMua : (+F.thue || 0) - tBanCt(F));
function hdChoTroi() {
  const F = C.F.ch, HT = { gia: [50000, 60000, 70000, 80000], ...(((C.CFG.daTau || {}).choHt) || {}) };
  return {
    id: "choTroi", ten: "Chợ trời", tom: `Bày bán ở thôn / thành — thuế ${so(F.thue)} %`,
    tim: "chợ trời bày bán sạp rao bán chủ chợ trời mua bán",
    ct: [
      ["Thời gian", "Luôn mở; sạp vẫn mở khi đi luyện công hoặc thoát game."],
      ["NPC", "Chủ Chợ Trời (Ba Lăng huyện, Biện Kinh) — bảng Chợ Trời."],
      ["Điều kiện", `Cấp ${so(F.cap)} trở lên mới được bày bán; mua thì cấp nào cũng được.`],
      ["Cách chơi", `Định giá món trong túi, viết lời rao (tối đa ${so(F.qc)} chữ), mở sạp trong khu an toàn của thôn / thành.`],
      ["Phần thưởng", `Thuế ${so(F.thue)} % chia 2 bên: người mua trả giá niêm yết + ${so(tMuaCt(F))} %, người bán nhận giá niêm yết − ${so(tBanCt(F))} %.`],
    ],
    noi: [
      { ds: [
        "Định giá món trong túi: món chuyển sang sạp (không chiếm túi), định giá lại để đổi giá, \"Không bán\" để lấy về.",
        `Lời rao 1–${so(F.qc)} chữ; mở sạp ở chỗ đang đứng trong khu an toàn. Đi luyện công / thoát game sạp vẫn mở (có người trông sạp).`,
        `Người mua trả niêm yết + ${so(tMuaCt(F))} % thuế, người bán nhận niêm yết − ${so(tBanCt(F))} % (thuế do cả 2 bên cùng chịu); tiền vào túi người bán ngay. Bán hết thì sạp tự đóng.`,
        `Thẻ Dã Tẩu có sạp Hệ thống bán món Dã Tẩu hay đòi: ${HT.gia.map((g) => so(g / 10000)).join(" / ")} vạn lượng theo giá trị món, không thuế, không bao giờ hết.`,
      ] },
    ],
  };
}

// Bang hội đợt 2 (HOP-DONG-DOT-2 — may-chu/bang-hoi.js): khối Tra cứu cho cống hiến, quỹ, cấp bang, Lễ Vật, Tế Đàn / mục tiêu tuần / Hộ Bang / rủ bạn — số đang dùng của máy
// (BH.CF: chung + theoMay). Lỗi -> null (mục Bang hội vẫn có phần đợt 1)
function bangHoiDot2(F) {
  try {
    if (!F || !F.chia || !F.nguon || !F.capBang) return null;
    const ch = F.chia, Ng = F.nguon, CB = F.capBang, BT = F.baoTri || {}, TP = F.tacPhuong || {}, HB = F.hongBao || {}, LP = F.lePham || {}, TD = F.teDan || {}, MTi = F.mucTieu || {};
    const sl = (x) => String(Math.round((Number(x) || 0) * 1000) / 1000).replace(".", ","), van = (x) => `${sl(x)} vạn`, ngay = (n) => `${sl(n)} ngày`;
    const bat = (k) => Ng[k] && Ng[k].bat, lan = (k) => (Ng[k] && Ng[k].ngayLan > 0 ? `${so(Ng[k].ngayLan)} lần / ngày` : "—");
    const loaiBat = Object.entries(TP.loai || {}).filter(([, x]) => x && x.bat).map(([k]) => k), soLoai = Math.max(0, Number(F.soLoaiTp ?? loaiBat.length) || 0);
    const nguon = [["Việc làm", "Giá trị", "Giới hạn"]];
    if (bat("vuotAi")) { const D = Ng.vuotAi.dam || []; nguon.push(["Vượt Ải (mỗi đám)", D.map((d, i) => `${sl(d[1])} (đám ${i ? D[i - 1][0] + 1 : 1}–${d[0]})`).join(", "), "theo lượt Vượt Ải"]); }
    if (bat("pld")) nguon.push(["Phong Lăng Độ (cập bờ Bắc)", sl(Ng.pld.gt), lan("pld")]);
    if (bat("satThu")) nguon.push(["Boss Sát thủ (xong nhiệm vụ)", sl(Ng.satThu.gt), "theo nhiệm vụ trong ngày"]);
    if (bat("phongHoa")) nguon.push(["Phong Hỏa Liên Thành", `thắng (có đánh, còn trong trận) ${sl(Ng.phongHoa.thang)} · có đánh ${sl(Ng.phongHoa.thamGia)}`, lan("phongHoa")]);
    if (bat("bossHk")) nguon.push(["Boss Hoàng Kim", `tham gia ${sl(Ng.bossHk.thamGia)} · từ ${sl(Ng.bossHk.nguong)} % sát thương ${sl(Ng.bossHk.datNguong)} · top ${so(Ng.bossHk.top)} ${sl(Ng.bossHk.topGt)}`, "mỗi khung giờ 1 lần"]);
    if (bat("minhChu")) nguon.push(["Võ Lâm Minh Chủ", `giết quái ${sl(Ng.minhChu.giet)} · đối thoại ${sl(Ng.minhChu.thu)} · thu thập ${sl(Ng.minhChu.hai)}`, "theo nhiệm vụ trong ngày"]);
    if (bat("sanNhim")) nguon.push(["Săn Nhím (con mình kết liễu)", sl(Ng.sanNhim.gt), lan("sanNhim")]);
    if (bat("tongKim")) nguon.push(["Tống Kim", `điểm trận × ${sl(Ng.tongKim.heSo)} (trận từ ${so(Ng.tongKim.diemMin)} điểm)`, `tối đa ${sl(Ng.tongKim.toiDa)} / trận`]);
    if (bat("viemDe")) nguon.push(["Viêm Đế Bảo Tàng (hoàn thành)", sl(Ng.viemDe.gt), lan("viemDe")]);
    if (bat("quai")) nguon.push(["Giết quái + ủy thác", `${sl(Ng.quai.gt)} mỗi ${so(Ng.quai.moi)} con`, `${sl(Ng.quai.tranNgay)} cống hiến cá nhân / ngày (quái phân thân không tính)`]);
    const thuong = (Array.isArray(HB.thuong) ? HB.thuong : []).map((r) => (Array.isArray(r) ? (r[0] === "tien" ? { loai: "tien", gt: r[1], w: +r[2] || 0 } : { loai: "mon", k: r[1], w: +r[2] || 0, n: r[3] || 1 }) : r)).filter((r) => r && r.w > 0);
    const tongW = thuong.reduce((s, r) => s + r.w, 0) || 1;
    const capRows = [["Cấp bang", "Kiến thiết cần (vạn)", "Tác phường cần", "Thành viên"]];
    for (let L = 0; L < Math.min(5, Number(CB.capMax) || 5); L++) {
      const [s1, c1, s2, c2] = (CB.tp || [])[L] || [0, 0, 0, 0], a = Math.min(s1, soLoai), b = Math.min(s2, soLoai);
      const tpChu = !a && !b ? "—" : b && c2 >= c1 && b >= a ? `${b} cái từ cấp ${c2}` : `${a} cái từ cấp ${c1}${b && c2 > c1 ? `, trong đó ${b} cái từ cấp ${c2}` : ""}`;
      capRows.push([`${L} → ${L + 1}`, so((CB.kt || [])[L]), tpChu, so((F.tvMax || [])[L + 1])]);
    }
    const lpRows = [["Lễ phẩm", "Cống hiến", "Khu Lễ vật", "Mỗi tuần"]];
    for (const x of (LP.ds || []).filter((z) => z && z.bat)) lpRows.push([ten(x.k), so(x.gia), `cấp ${so(x.cap)}`, x.tuan > 0 ? `${so(x.tuan)} cái` : "không giới hạn"]);
    return [
      { h: "Cống hiến" },
      { p: `Mỗi 1 giá trị việc làm: cá nhân <y>${sl(ch.caNhan)}</y> điểm cống hiến, dự trữ bang ${sl(ch.duTru)}, bang thêm <g>${van(ch.kt)}</g> ngân sách kiến thiết + <g>${van(ch.cb)}</g> ngân sách chiến bị. Cống hiến cá nhân tối đa <y>${so(F.congTuanMax)}</y> mỗi tuần (việc làm + được phát + quyên góp; thứ Hai 0 giờ tính lại) — đủ trần thì bang vẫn nhận phần quỹ. Ẩn sỹ không nhận; phân thân không phải thành viên.` },
      { bang: nguon, can: ["l", "l", "l"] },
      { ds: [
        bat("daTau") ? "Dã Tẩu: sẽ tính khi gắn xong (đợt sau)." : "",
        TD.cong ? `Tế Đàn: điểm danh mỗi ngày <y>${so(TD.cong)}</y> cống hiến (không tính trần tuần) — bang cấp ${so(TD.capMin)} trở lên, vào bang trên ${ngay(TD.vaoNgay)}.` : "",
        `Quyên góp: 1 vạn lượng = 1 vạn ngân sách kiến thiết + ${sl(F.quyenCong)} cống hiến; bang nhận tối đa ${(F.quyenTuan || []).map((x) => so(x)).join(" → ")} vạn / tuần (cấp bang 0 → 5), mỗi người tối đa ${Math.round((Number(F.quyenNguoi) || 0) * 100)} % phần đó.`,
      ].filter(Boolean) },
      { h: "Quỹ & cấp bang" },
      { ds: [
        "Ngân quỹ (lượng): thành viên nạp; bang chủ / trưởng lão được giao quyền phát theo 3 bậc (Trưởng Lão / Đội trưởng / Đệ tử — người vào bang đủ ngày, khác người phát, có trần tuần), chuyển sang kiến thiết, đổi phe. Không rút ngân quỹ.",
        `Ngân sách kiến thiết: lên cấp bang, xây / nâng tác phường; chuyển sang chiến bị 1 : 1 (không chiều ngược). Ngân sách chiến bị: phí bảo trì mỗi ngày từ cấp 1 = <y>${van(BT.tv)}</y> × số người vào game trong ${ngay(BT.hoatDong)} (không đếm ẩn sỹ, nhiều tài khoản của 1 người tính 1) + phí tác phường (đóng cửa: ${Math.round((Number(TP.dong) || 0) * 100)} % phí).`,
        `Chiến bị dưới ${ngay(BT.dung)} phí: bang tạm dừng (tác phường, Tế Đàn ngưng) — tự hết khi đủ lại. Tự bù (bật sẵn): dưới ${ngay(BT.tuBu)} phí thì lấy kiến thiết bù sang; kênh bang báo trước ${ngay(BT.baoTruoc)}.`,
        `Lên cấp: đủ kiến thiết + tác phường, cách lần trước ${ngay(CB.cachNgay)}, chiến bị đủ ${ngay(CB.cbNgay)} phí ở cấp mới.`,
      ] },
      { bang: capRows, can: ["l", "r", "l", "r"] },
      { h: "Khu Lễ vật" },
      { ds: [
        `Hồng bao thần bí: ${(HB.gia || []).map((g, i) => `cấp ${i + 1}: ${so(g)}`).join(" · ")} cống hiến; mỗi ngày bang có ${(HB.heSo || []).length ? "max(1 + cấp/3, hệ số × số người)" : "một số"} hồng bao, mỗi nhân vật nhận tối đa ${so(HB.ngayNv)} (kể cả tặng), tặng thành viên khác tối đa ${so(HB.tangTuan)} / tuần. Mở ra ngay.`,
        `Bảo rương đồ xanh: mỗi tuần tối đa ${so(LP.rxTuan)} cái từ Lễ phẩm + hồng bao (đủ rồi thì hồng bao trúng Bảo rương đổi thành 30 vạn lượng).${HB.kbh === 2 || LP.kbh === 2 ? " Đồ đổi bằng cống hiến bị khóa bảo hiểm." : ""}`,
      ] },
      { bang: [["Hồng bao — phần thưởng", "Tỉ lệ"], ...thuong.map((r) => [r.loai === "tien" ? luong(r.gt) : `${so(r.n)} ${ten(r.k)}`, pt(r.w / tongW)])], can: ["l", "r"] },
      ...(lpRows.length > 1 ? [{ bang: lpRows, can: ["l", "r", "l", "l"] }] : []),
      { h: "Tế Đàn, mục tiêu tuần, Hộ Bang" },
      { ds: [
        "Tế Đàn: Người hướng dẫn bang hội → Tế Đàn bang hội, hoặc khung Bang phái → Ký lục → Mục tiêu tuần. Mỗi nhân vật 1 lần / ngày; bang thêm chiến bị mỗi người 1 lần / ngày.",
        MTi.bat ? `Mục tiêu tuần: mỗi thứ Hai bang nhận 1 việc (${(MTi.ds || []).map((k) => (MTi.loai && MTi.loai[k] ? MTi.loai[k].ten : k)).join(" / ")}); cả bang đạt khi tổng cống hiến việc đó ≥ ${Math.round((Number(MTi.phanBang) || 0) * 100)} % × số người × mức mỗi người. Tuần sau lĩnh: người làm đủ phần mình được cống hiến + kinh nghiệm theo cấp; bang được chiến bị. Độ khó (1 / 2) bang chủ đặt cho tuần sau.` : "",
        F.hoBang && F.hoBang.bat ? `Hộ Bang: ${so(F.hoBang.so)} người cống hiến việc làm nhiều nhất tuần (từ ${so(F.hoBang.congMin)}) nhận ${so(F.hoBang.cong)} cống hiến + danh hiệu "(Hộ Bang)" ${ngay(F.hoBang.ngay)}.` : "",
        F.ruBan && F.ruBan.bat ? `Rủ bạn: người được mời vào bang ở đủ ${ngay(F.ruBan.ngay)} (trong ${ngay(F.ruBan.hetNgay)}) và có ${so(F.ruBan.congCan)} cống hiến việc làm -> người mời ${so(F.ruBan.cong)}, người mới ${so(F.ruBan.congMoi)} cống hiến, bang ${so(F.ruBan.kt)} vạn kiến thiết (mỗi tài khoản / chủ tài khoản 1 lần).` : "",
      ].filter(Boolean) },
    ];
  } catch (e) { loiGhi("Bang hội đợt 2", e); return null; }
}

// =====================================================================================================================
// PHẦN THƯỞNG
// =====================================================================================================================
function nhomThuong(ds) {
  for (const [id, fn] of [["dangNhap", thDangNhap], ["online", thOnline], ["thangCap", thThangCap], ["phucDuyen", thPhucDuyen], ["mocDaTau", thMocDaTau],
    ["laHan", thLaHan], ["kyTranCac", thKtc]]) moi(ds, id, fn);
}

function thDangNhap() {
  const D = { gio: 5, phiTiep: 5, xu: [], ...(C.CFG.dangNhap || {}) }, xu = (D.xu || []).map((v) => Number(v) || 0), hang = [];
  for (let i = 0; i < xu.length; i += 7) {
    const tuan = xu.slice(i, i + 7), thap = Math.min(...tuan);
    hang.push([`${i + 1}–${i + tuan.length}`, tuan.map((v) => (v > 2 * thap ? `<y>${v}</y>` : String(v))).join(" · ")]);
  }
  return {
    id: "dangNhap", ten: "Đăng nhập nhận thưởng", tom: `Đăng nhập liên tục ${xu.length} ngày — tới ${so(Math.max(0, ...xu))} Xu một ngày`,
    tim: "đăng nhập điểm danh xu hằng ngày",
    noi: [
      { p: `Mỗi nhân vật đếm số ngày đăng nhập liên tục; bỏ 1 ngày thì về ngày 1. Ngày mới tính từ <y>${D.gio}:00</y> sáng. Mỗi tài khoản nhận <y>1 lần</y> mỗi ngày (nhân vật khác vẫn vào game để giữ chuỗi).` },
      { bang: [["Ngày", "Xu mỗi ngày"], ...hang] },
      { p: `Đủ ${xu.length} ngày: tổng ${xuChu(tong(xu))}. Qua ngày ${xu.length}: trả <y>${xuChu(D.phiTiep)}</y> để nhận tiếp thưởng ngày ${xu.length}, hoặc nhận lại từ ngày 1.` },
    ],
  };
}

function thOnline() {
  const O = C.CFG.thuongOnline || {}, m = nap("./online.js"), tat = O.bat === false;
  const moc = ((m && m.MOC) || (O.moc || []).filter((x) => x && x.gio > 0).sort((a, b) => a.gio - b.gio));
  for (const x of moc) for (const [k, n] of x.do || []) nguon(k, `Online nhận thưởng: online đủ ${x.gio} giờ trong ngày — ${slChu(k, n)}`, "Online nhận thưởng");
  return {
    id: "online", ten: "Online nhận thưởng", tom: tat ? "Đang tạm dừng" : `Online đủ ${moc.map((x) => x.gio).join(" / ")} giờ mỗi ngày`,
    tim: "online nhận thưởng thời gian online huyền thiên chùy",
    noi: [
      tat ? { p: "<c>Đang tạm dừng.</c>" } : null,
      { bang: [["Online", "Phần thưởng"], ...moc.map((x) => [`${x.gio} giờ`, goi(x)])] },
      { p: "Nhận thưởng → Online nhận thưởng. Mỗi mốc nhận 1 lần mỗi ngày, mỗi nhân vật. Chỉ tính lúc đang trong game: ủy thác không tính, mất nhịp quá 90 giây không tính." },
      { p: "Kinh nghiệm lên cấp = kinh nghiệm cần để lên cấp kế tiếp ở cấp đang có." },
    ].filter(Boolean),
  };
}

function thThangCap() {
  const T = C.CFG.thuongCap || {}, m = nap("./thuong-cap.js"), tat = T.bat === false, mang = (C.CFG.thuoc || {}).mangToiDa || 60;
  const moc = ((m && m.MOC) || (T.moc || []).filter((x) => x && x.cap > 0).sort((a, b) => a.cap - b.cap));
  const gom = new Map();
  for (const x of moc) for (const [k, n] of x.do || []) gom.set(k, [...(gom.get(k) || []), [x.cap, n | 0 || 1]]);
  for (const [k, L] of gom) nguon(k, `Thưởng thăng cấp: mốc cấp ${gomMoc(k, L)}`, "Thưởng thăng cấp");
  for (const x of moc) for (const [k] of x.chon || []) nguon(k, `Thưởng thăng cấp: mốc cấp ${x.cap} — ${pt(1 / x.chon.length)} (1 trong ${x.chon.length})`, "Thưởng thăng cấp");
  return {
    id: "thangCap", ten: "Thưởng thăng cấp", tom: tat ? "Đang tạm dừng" : `Quà các mốc cấp ${moc.map((x) => x.cap).join(", ")}`,
    tim: "thưởng thăng cấp lên cấp mốc cấp",
    noi: [
      tat ? { p: "<c>Đang tạm dừng.</c>" } : null,
      { bang: [["Cấp", "Tiền, Xu", "Món"], ...moc.map((x) => [String(x.cap), [x.tien > 0 ? luong(x.tien) : "", x.xu > 0 ? xuChu(x.xu) : ""].filter(Boolean).join(" + ") || "—",
        [dsMon(x.do), x.chon && x.chon.length ? `1 trong ${gopTen(x.chon.map((r) => monSl(r[0], r[1])))}` : ""].filter(Boolean).join(", ") || "—"])] },
      { p: `Nhận thưởng → Thưởng thăng cấp. Mỗi mốc nhận 1 lần mỗi nhân vật; đã qua mốc vẫn nhận bù. Thuốc chỉ phát tới đủ ${so(mang)} bình mang theo. Món “1 trong” bốc ngẫu nhiên, mỗi món như nhau.` },
    ].filter(Boolean),
  };
}

function thPhucDuyen() {
  const P = { bat: true, batDau: 2, moiDiem: 3600, toiThieu: 7200, suyGiam: 14400, lan2Them: 2, toiDaMoiLan: 100, ...(C.CFG.phucDuyen || {}) }, tat = P.bat === false;
  const lo = [...C.N.BY.values()].filter((x) => x.dung && x.dung.loai === "phucDuyen").sort((a, b) => a.dung.diem - b.dung.diem);
  const shop = (C.KTC.phucDuyen || []).filter((o) => o.k);
  return {
    id: "phucDuyen", ten: "Phúc duyên", tom: tat ? "Đang tạm dừng" : "Online đổi điểm phúc duyên — mua đồ ở cửa hàng phúc duyên",
    ...(lo.length && lo[0].ic ? { ic: lo[0].ic } : {}),
    tim: "phúc duyên võ lâm minh truyền nhân thần bí thương nhân liễu ất cửa hàng phúc duyên điểm",
    noi: [
      tat ? { p: "<c>Đang tạm dừng.</c>" } : null,
      { ds: [
        `Lần đầu mở công năng (Nhận thưởng → Phúc duyên): +${so(P.batDau)} điểm.`,
        `Đổi giờ online thành điểm: cần tích lũy từ ${giay(P.toiThieu)}; tới ${giay(P.suyGiam)} mỗi ${giay(P.moiDiem)} = 1 điểm, sau đó mỗi ${giay(2 * P.moiDiem)} = 1 điểm.`,
        `Lần đổi thứ 2 trong ngày: +${so(P.lan2Them)} điểm. Mỗi lần đổi tối đa ${so(P.toiDaMoiLan)} điểm. Ủy thác không tính giờ online.`,
        lo.length ? `${gopTen(lo.map((x) => ten(x.k)))}: +${lo.map((x) => so(x.dung.diem)).join(" / +")} điểm.` : "",
      ].filter(Boolean) },
      { h: "Cửa hàng phúc duyên (Thần bí Thương Nhân Liễu Ất)" },
      { bang: [["Món", "Điểm"], ...shop.map((o) => [ten(o.k), so(o.gia)])], can: ["l", "r"] },
    ].filter(Boolean),
  };
}

function thMocDaTau() {
  const D = C.CFG.daTau || {}, mocN = D.mocNgay || {}, chuoi = Array.isArray(D.mocChuoi) ? D.mocChuoi : [], mocT = D.mocTong || {};
  const ngayK = Object.keys(mocN).map(Number).filter((n) => n > 0).sort((a, b) => a - b), tongK = Object.keys(mocT).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  const nhan = (r) => (r.moc ? so(r.moc) : `Mỗi ${so(r.moi)}`);
  const gc = new Map();
  for (const r of chuoi) for (const [k, n] of r.do || []) gc.set(k, [...(gc.get(k) || []), [r.moc ? so(r.moc) : `mỗi ${so(r.moi)}`, n | 0 || 1]]);
  for (const [k, L] of gc) nguon(k, `Dã Tẩu: mốc chuỗi ${gomMoc(k, L)}`, "Nhiệm vụ Dã Tẩu");
  const gom = new Map();
  for (const n of tongK) for (const [k, sl] of mocT[n].do || []) gom.set(k, [...(gom.get(k) || []), [so(n), sl | 0 || 1]]);
  for (const [k, L] of gom) {
    const sl = L.map((r) => r[1]), a = Math.min(...sl), b = Math.max(...sl);
    nguon(k, `Dã Tẩu: quà mốc tổng ${L.length <= 5 ? gomMoc(k, L) : `${L[0][0]} … ${L[L.length - 1][0]} (${L.length} mốc, ${a === b ? so(a) : `${a}–${b}`} mỗi mốc)`}`, "Nhiệm vụ Dã Tẩu");
  }
  return {
    id: "mocDaTau", ten: "Mốc Dã Tẩu", tom: "Quà mốc ngày, mốc chuỗi và mốc tổng của Dã Tẩu",
    tim: "dã tẩu mốc nhiệm vụ quà mốc hoàng kim bảo hạp vé số",
    noi: [
      { h: "Mốc trong ngày" },
      { bang: [["Nhiệm vụ", "Phần thưởng"], ...ngayK.map((n) => [String(n), goi(mocN[n])])] },
      chuoi.length ? { h: "Mốc chuỗi" } : null,
      chuoi.length ? { p: "Theo số nhiệm vụ của chuỗi (đếm lại sau 8.000). Mỗi mốc 1 gói: đúng mốc riêng thì nhận gói đó, không thì gói “mỗi N” lớn nhất chia hết." } : null,
      chuoi.length ? { bang: [["Mốc", "Phần thưởng"], ...chuoi.map((r) => [nhan(r), goi(r)])] } : null,
      tongK.length ? { h: "Mốc tổng (từ trước tới nay)" } : null,
      tongK.length ? { bang: [["Tổng", "Kinh nghiệm", "Thêm"], ...tongK.map((n) => [so(n), mocT[n].kn > 0 ? knChu(mocT[n].kn) : "—", [mocT[n].tien > 0 ? luong(mocT[n].tien) : "", mocT[n].xu > 0 ? xuChu(mocT[n].xu) : "", dsMon(mocT[n].do)].filter(Boolean).join(", ") || "—"])] } : null,
      { p: `Mỗi ${so(D.moiBac || 500)} nhiệm vụ lên 1 bậc (tối đa ${so(D.bacToiDa ?? 20)}): thưởng mỗi nhiệm vụ +${pt(D.thuongBac ?? 0.05)} mỗi bậc.` },
    ].filter(Boolean),
  };
}

function thLaHan() {
  const k = [...C.N.BY.values()].filter((x) => x.dung && x.dung.loai === "laHan").map((x) => x.k)[0] || "ms:23", x = BY(k) || {}, D = x.dung || {};
  const L = Array.isArray(D.kn) ? D.kn : [];
  return {
    id: "laHan", ten: ten(k), ...(x.ic ? { ic: x.ic } : {}), tom: `Tối đa ${so(D.lanNgay)} quyển, ${knChu(D.knNgay)} kinh nghiệm mỗi ngày`,
    tim: "thiết la hán kinh nghiệm thực chiến lễ bao",
    noi: [
      { p: `Mỗi ngày dùng tối đa <y>${so(D.lanNgay)}</y> quyển, nhận tối đa <y>${kn(D.knNgay)}</y>; trên cấp ${so(D.capToiDa)} vô hiệu (không mất quyển).` },
      { p: "Mỗi quyển quay 1–100: không quá tỉ lệ ăn đủ của nhóm cấp thì được đủ kinh nghiệm gốc, quá thì kinh nghiệm gốc × số quay ÷ 200." },
      { bang: [["Cấp", "Kinh nghiệm gốc", "Tỉ lệ ăn đủ"], ...L.map((r, i) => [i === L.length - 1 ? `${i * 10 + 1} trở lên` : `${i * 10 + 1}–${(i + 1) * 10}`, so(r[0]), pt(r[1] / 100)])], can: ["l", "r", "r"] },
      { p: `Có từ: ${ten("ms:1665")}, Boss Hoàng Kim, Phong Hỏa, Dã Tẩu… — xem Vật phẩm → ${ten(k)}.` },
    ],
  };
}

function thKtc() {
  const the = (C.KTC.the || []).filter((t) => (t.hang || []).some((o) => o.k)), noi = [];
  const ltx = (C.CFG.tienTrang || {}).luongMotXu || 1000000, lbx = (C.CFG.tienTrang || {}).luongBanXu ?? 250000, nbx = (C.CFG.tienTrang || {}).banXuNgay ?? 10;
  noi.push({ p: `Mua bằng Xu, chỉ mua được ở thôn / thành (ở bãi luyện công chỉ xem). Đổi Xu ở Tiền trang: 1 Xu = ${luong(ltx)}.${lbx > 0 && lbx < ltx ? ` Tiền trang cũng thu lại Xu: 1 Xu = ${luong(lbx)}, mỗi tài khoản tối đa ${nbx} Xu mỗi ngày.` : ""}` });
  for (const t of the) {
    noi.push({ h: `Thẻ ${t.n}` });
    noi.push({ bang: [["Món", "Giá"], ...t.hang.filter((o) => o.k).map((o) => [ten(o.k), xuChu(o.gia)])], can: ["l", "r"] });
  }
  return { id: "kyTranCac", ten: "Kỳ Trân Các", tom: `Cửa hàng Xu: ${the.map((t) => t.n).join(", ")}`, tim: "kỳ trân các cửa hàng xu mua xu tiền trang đổi xu ra ngân lượng bán xu", noi };
}

// =====================================================================================================================
// RƠI ĐỒ TỪ QUÁI
// =====================================================================================================================
function nhomRoi(ds) {
  for (const [id, fn] of [["cachTinh", roiCachTinh], ["quaiThuong", roiQuaiThuong], ["tinhAnh", roiTinhAnh], ["thuLinh", roiThuLinh], ["satThu", roiSatThu],
    ["quaiChung", roiQuaiChung], ["phongHoa", roiPhongHoa], ["vuotAi", roiVuotAi], ["dacBiet", roiDacBietBai]]) moi(ds, id, fn);
}
// số lượt tinh anh theo bãi (thuyền không có tinh anh)
function luotTinhAnh() {
  const R = Rc(), M = new Map();
  for (const [z, B] of Object.entries(R.RDB)) {
    const Z = C.N.ZONES.get(+z);
    if (!Z || Z.kind === "thuyền" || !B.ta) continue;
    const L = M.get(B.ta.luot) || []; L.push(Z); M.set(B.ta.luot, L);
  }
  return [...M.entries()].sort((a, b) => a[0] - b[0]);
}
const tenBaiDs = (L) => L.slice().sort((a, b) => a.lo - b.lo || a.id - b.id).map((Z) => Z.n).join(", ");

function roiCachTinh() {
  const R = Rc(), L = R.roiDo, QD = R.QD, ST = satThuDl(), SF = C.F.st, tien = { thapNhat: 0.5, trum: 50, moc: [], ...(C.CFG.tien || {}) };
  const trang = Object.values(ST.roi || {}).map((r) => Number(r.trang) || 0).filter((p) => p > 0), lt = luotTinhAnh().map(([n]) => n);
  const buff = Object.entries(C.KTC.buff || {}).filter(([, b]) => b.mayMan > 0);
  const muaMm = buff.map(([bk, b]) => { const x = [...C.N.BY.values()].find((y) => y.dung && y.dung.buff === bk && y.ktc); return x ? `${ten(x.k)} +${b.mayMan}` : ""; }).filter(Boolean);
  const mu = Number((C.CFG.dongXanh || {}).muGiaTri ?? 2.7), mg = Number((C.CFG.dongXanh || {}).mayManGiaTri ?? 0.5);
  const tb0 = Math.round(100 / (1 + mu)) / 100, tb60 = Math.round(100 / (1 + mu / (1 + (R.mm / 100) * mg))) / 100;
  const moc = tien.moc || [], cb = Object.values(((C.CFG.canBang || {}).bai) || {}).map((b) => Number(b.tien)).filter((v) => v > 0);
  const vd = capDoRoi(95, false), cong = (C.CFG.capDong || {}).cong ?? 3, qc = Number((C.CFG.quaiChung || {}).thuong) || 1;
  return {
    id: "cachTinh", ten: "Cách tính đồ rơi", tom: "Tỉ lệ rơi, số dòng, cấp món, loại món, ngân lượng",
    tim: "đồ rơi may mắn số dòng cấp món loại món tiền ngân lượng dòng xanh",
    noi: [
      { h: "Tỉ lệ ra trang bị" },
      { bang: [["Quái", "Mỗi lượt", "Lượt"], ["Quái thường", pt(L.quaiThuong), "1"],
        ["Tinh anh (tên xanh)", pt(QD.tinhAnhRoiDo), lt.length ? (lt.length > 1 ? `${lt[0]}–${lt[lt.length - 1]}` : String(lt[0])) : "—"],
        ["Thủ lĩnh (tên cam)", pt(L.trum), "1"],
        ["Boss Sát thủ", trang.length ? khoangPt(Math.min(...trang), Math.max(...trang)) : "—", so(SF.luot)]], can: ["l", "r", "r"] },
      { p: `May mắn tăng tỉ lệ ra đồ: × (1 + may mắn ÷ 100), tính tối đa <y>${so(R.mm)}</y> may mắn (× ${so(1 + R.mm / 100)}). May mắn có từ dòng may mắn trên trang bị đang mặc${muaMm.length ? `, ${muaMm.join(", ")}` : ""}. Boss Sát thủ: món đặc biệt (bảo thạch, thủy tinh, các loại lộ, mật tịch, bí kíp…) cũng nhân theo may mắn.` },
      { h: "Số dòng" },
      { bang: [["Số dòng", "Quái thường", "Trùm"], ...R.DN.map((p, n) => [n ? `${n} dòng` : "Trắng", pt(p), pt(R.DT[n] || 0)])], can: ["l", "r", "r"] },
      { p: `Trùm = thủ lĩnh, tinh anh, Boss Sát thủ. Nhẫn, dây chuyền, ngọc bội (${pt(R.pJ)} số món) không bao giờ trắng: quay ra 0 dòng thành 1 dòng — bảng đã tính luật này.` },
      { h: "Cấp món" },
      { ds: [`Quái thường: ngẫu nhiên từ cấp quái ÷ ${R.capDo.chiaDuoi} tới cấp quái ÷ ${R.capDo.chiaTren} (làm tròn xuống, trong khoảng 1–10).`, `Trùm: luôn cấp quái ÷ ${R.capDo.chiaTren}.`,
        "Loại món không có cấp đó thì lấy cấp gần nhất bên dưới.", `Ví dụ quái cấp 95: quái thường ra món cấp ${vd[0]}–${vd[1]}, trùm ra món cấp ${vd[1]}.`] },
      { h: "Dòng thuộc tính" },
      { ds: [`Cấp dòng tối đa = cấp món + ${so(cong)} (tối đa 10): đồ cấp thấp không ra được dòng mạnh nhất.`, "Cấp dòng thường quanh cấp món, càng cao càng hiếm.",
        `Giá trị mỗi dòng lệch về phía thấp: trung bình ≈ ${pt(tb0)} khoảng của dòng; ${so(R.mm)} may mắn nâng lên ≈ ${pt(tb60)}.`,
        "Dòng 1, 3, 5 có tác dụng ngay; dòng 2, 4, 6 là dòng ẩn theo ngũ hành của món, phải kích (ngũ hành nhân vật + 2 ô trang bị liên kết) mới có tác dụng."] },
      { h: "Loại món" },
      { bang: [["Loại", "Tỉ lệ"], ...loaiBang()], can: ["l", "r"] },
      { h: "Ngân lượng" },
      { bang: [["Cấp quái", "Mỗi con", "1 đống tối đa"], ...moc.map((m, i) => [`${i ? moc[i - 1].den + 1 : 1}–${m.den}`, pt(m.tiLe), luong(m.toiDa)])], can: ["l", "r", "r"] },
      { ds: [`Quái thường: 1 đống = tối đa × cấp quái ÷ cấp cuối mốc × ${pt(tien.thapNhat)} – 100 %.`,
        `Thủ lĩnh, tinh anh: luôn rơi cấp quái × ${so(tien.trum)} lượng × hệ số tiền của bãi${cb.length ? ` (${so(Math.min(...cb))} – ${so(Math.max(...cb))})` : ""}.`,
        `Bản quái chung: tiền × ${so(qc)}.`] },
      { p: `Món từ <y>${so(C.CFG.thongBaoTuDong)} dòng</y> trở lên: báo cả máy chủ lúc nhặt (cả lúc ủy thác giữ món, lúc mở ${ten("ms:1884")}).` },
    ],
  };
}

function roiQuaiThuong() {
  const R = Rc(), p = R.roiDo.quaiThuong, so1k = (n) => so(Math.round(1000 * p * R.tren(R.DN, n) * 100) / 100);
  nguon("trangBi", `Quái thường: ${pt(p)} mỗi con`, "Quái thường");
  return {
    id: "quaiThuong", ten: "Quái thường", tom: `${pt(p)} mỗi con ra 1 trang bị, thường ít dòng`, tim: "quái thường bãi luyện công trang bị",
    noi: [
      { p: `Mỗi con: <y>${pt(p)}</y> ra 1 trang bị (× may mắn). Cấp món ngẫu nhiên từ cấp quái ÷ ${R.capDo.chiaDuoi} tới cấp quái ÷ ${R.capDo.chiaTren}.` },
      { bang: [["Số dòng", "Tỉ lệ"], ...dongBang(R.DN)], can: ["l", "r"] },
      { p: `Trung bình 1.000 con (chưa tính may mắn): ${so1k(0)} trang bị, ${so1k(3)} món từ 3 dòng, ${so1k(4)} món từ 4 dòng, ${so1k(5)} món từ 5 dòng.` },
      { p: "Tiền theo mốc cấp quái (xem Cách tính đồ rơi). Thêm Mật đồ thần bí, Thần bí đồ chí theo bãi (xem Món đặc biệt theo bãi)." },
    ],
  };
}

function roiTinhAnh() {
  const R = Rc(), QD = R.QD, p = QD.tinhAnhRoiDo, L = luotTinhAnh(), tien = (C.CFG.tien || {}).trum ?? 50;
  const mau = new Map();
  for (const B of Object.values(R.RDB)) if (B.ta) { const s = `${B.ta.mau}|${B.ta.st}|${B.ta.kn}`; mau.set(s, (mau.get(s) || 0) + 1); }
  const [m, st, k] = (([...mau.entries()].sort((a, b) => b[1] - a[1])[0] || ["20|2|10"])[0]).split("|");
  const dt = R.tren(R.DT, 4), dt5 = R.tren(R.DT, 5), DK = C.CFG.doKho || {};
  nguon("trangBi", `Tinh anh: ${L.map(([n]) => n).join(" / ")} lượt × ${pt(p)} mỗi con`, "Tinh anh");
  return {
    id: "tinhAnh", ten: "Tinh anh (tên xanh)", tom: `Mỗi ${so(QD.tinhAnhMoi)} con ra 1 tinh anh — ${L.map(([n]) => n).join(" / ")} lượt rơi`, tim: "tinh anh tên xanh quái hoàng kim",
    noi: [
      { p: `Ra sau mỗi <y>${so(QD.tinhAnhMoi)}</y> con quái thường trong bãi (máy chủ nhận từ con thứ ${so(Math.floor(QD.tinhAnhMoi * 0.8))}). Máu × ${m}, sát thương × ${st}, kinh nghiệm × ${k} so với quái thường${DK.tuCap ? ` (bãi từ cấp ${DK.tuCap}: máu đặt riêng, từ ${so(DK.tinhAnh)})` : ""}. Thuyền Phong Lăng Độ không có tinh anh.` },
      { ds: [
        `Mỗi lượt: <y>${pt(p)}</y> ra 1 trang bị theo bảng số dòng của trùm (không ra trắng), cấp món = cấp quái ÷ ${R.capDo.chiaTren}.`,
        ...L.map(([n, Zs]) => `${n} lượt (${Zs.length} bãi${Zs.length <= 4 ? `: ${tenBaiDs(Zs)}` : ""}) — trung bình ${so(Math.round(n * p * 100) / 100)} trang bị mỗi con.`),
        `Trang bị ra được: từ 4 dòng ${pt(dt)}, từ 5 dòng ${pt(dt5)}.`,
        `Tiền: cấp quái × ${so(tien)} lượng × hệ số tiền của bãi.`,
      ] },
      { bang: [["Số dòng", "Tỉ lệ"], ...dongBang(R.DT)], can: ["l", "r"] },
      { p: "Thêm Thần Bí Lộ Chí… theo bãi: xem Món đặc biệt theo bãi." },
    ],
  };
}

function roiThuLinh() {
  const R = Rc(), QD = R.QD, p = R.roiDo.trum, TR = ((C.CFG.canBang || {}).trum) || {}, DK = C.CFG.doKho || {}, bang = Object.entries(R.RDC.thuLinh || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of bang) nguon(k, `Thủ lĩnh (tên cam): ${pt(v)} mỗi con`, "Thủ lĩnh");
  nguon("trangBi", `Thủ lĩnh: ${pt(p)} mỗi con`, "Thủ lĩnh");
  return {
    id: "thuLinh", ten: "Thủ lĩnh (tên cam)", tom: `Mỗi ${so(QD.thuLinhMoi)} con ra 1 thủ lĩnh — ${pt(p)} ra trang bị`, tim: "thủ lĩnh trùm bãi tên cam boss bãi",
    noi: [
      { p: `Ra sau mỗi <y>${so(QD.thuLinhMoi)}</y> con quái trong bãi (máy chủ nhận từ con thứ ${so(Math.floor(QD.thuLinhMoi * 0.8))}).${TR.mau ? ` Máu × ${so(TR.mau)}, sát thương × ${so(TR.satThuong || 1)}, kinh nghiệm × ${so(TR.kinhNghiem || 1)} so với quái thường của bãi${DK.tuCap ? ` (bãi từ cấp ${DK.tuCap}: máu đặt riêng, từ ${so(DK.thuLinh)})` : ""}.` : ""} Mỗi con <y>${pt(p)}</y> ra 1 trang bị theo bảng trùm, cấp món = cấp quái ÷ ${R.capDo.chiaTren}.` },
      { bang: [["Số dòng", "Tỉ lệ"], ...dongBang(R.DT)], can: ["l", "r"] },
      { h: "Món đặc biệt mỗi con" },
      { p: "Mỗi món xét riêng (có thể ra nhiều món cùng lúc)." },
      { bang: [["Món", "Tỉ lệ riêng"], ...bang.map(([k, v]) => [ten(k), pt(v)])], can: ["l", "r"] },
      { p: `Tiền: cấp quái × ${so((C.CFG.tien || {}).trum ?? 50)} lượng × hệ số tiền của bãi. Thêm Mật đồ thần bí, Thần bí đồ chí theo bãi (xem Món đặc biệt theo bãi).` },
    ],
  };
}

function roiSatThu() {
  const R = Rc(), F = C.F.st, ST = satThuDl(), bac = (ST.bac || []).slice().sort((a, b) => a.cap - b.cap), nhom = [];
  for (const b of bac) {
    const tr = Number(((ST.roi || {})[b.cap] || {}).trang) || 0, g = nhom[nhom.length - 1];
    if (g && g.tr === tr && g.kn === (b.kn | 0)) g.b = b.cap; else nhom.push({ a: b.cap, b: b.cap, tr, kn: b.kn | 0 });
  }
  const cuoi = bac.length ? bac[bac.length - 1].cap : 90, hMax = R.heSoBac(cuoi), bang = Object.entries(R.RDC.satThu || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]);
  const conLai = new Map();
  for (const b of bac) for (const [k, q] of R.loc(((ST.roi || {})[b.cap] || {}).mon)) conLai.set(k, Math.max(conLai.get(k) || 0, Number(q)));
  for (const [k, v] of bang) nguon(k, `Boss Sát thủ: ${pt(v)} mỗi boss (bậc 20) – ${pt(v * hMax)} (bậc ${cuoi})`, "Nhiệm vụ Sát thủ");
  const trs = nhom.map((g) => g.tr).filter((v) => v > 0);
  nguon("trangBi", `Boss Sát thủ: ${so(F.luot)} lượt, ${trs.length ? khoangPt(Math.min(...trs), Math.max(...trs)) : "—"} mỗi lượt`, "Nhiệm vụ Sát thủ");
  return {
    id: "satThu", ten: "Boss Sát thủ", tom: `${so(F.luot)} lượt trang bị mỗi boss + món đặc biệt theo bậc`, tim: "boss sát thủ nhiếp thí trần trang bị bảo thạch thủy tinh",
    noi: [
      { p: `Mỗi boss ${so(F.luot)} lượt; mỗi lượt trúng thì ra 1 trang bị theo bảng trùm (cấp món = cấp boss ÷ ${R.capDo.chiaTren}). May mắn không đổi tỉ lệ này (chỉ nâng giá trị dòng).` },
      { bang: [["Bậc", "Trang bị mỗi lượt", "Kinh nghiệm"], ...nhom.map((g) => [g.a === g.b ? String(g.a) : `${g.a}–${g.b}`, pt(g.tr), g.kn ? knChu(g.kn) : "—"])], can: ["l", "r", "r"] },
      conLai.size ? { p: `Lượt không ra trang bị còn có thể ra: ${[...conLai].map(([k, q]) => `${ten(k)} ${pt(q)}`).join(", ")}.` } : { p: "Lượt không ra trang bị thì không ra gì." },
      { h: "Món đặc biệt mỗi boss" },
      { p: `Mỗi món xét riêng; bậc càng cao càng dễ ra: × (1 + ${so(R.RDC.satThuTangMoiBac)} × (bậc − 20) ÷ 10) — bậc 90 × ${so(R.heSoBac(90))}, bậc ${cuoi} × ${so(hMax)}.` },
      { bang: [["Món", "Bậc 20", `Bậc ${cuoi}`], ...bang.map(([k, v]) => [ten(k), pt(v), pt(v * hMax)])], can: ["l", "r", "r"] },
      { p: `Thêm mỗi boss: 1 Sát Thủ lệnh (cấp của bậc). ${so(F.gop)} lệnh cùng cấp hợp thành 1 Sát Thủ Giản.` },
    ],
  };
}

function roiQuaiChung() {
  const Q = C.CFG.quaiChung || {}, M = Q.manh || {}, th = Number(Q.thuong) || 1;
  const bai = (Q.bai || []).map((z) => C.N.ZONES.get(+z)).filter(Boolean).sort((a, b) => a.lo - b.lo);
  return {
    id: "quaiChung", ten: "Quái chung (bãi chung)", tom: `Như quái riêng — người đánh nhiều nhất nhận đồ, × ${so(th)}`, tim: "quái chung bản chung bãi chung",
    noi: [
      { p: `Bản quái chung ở ${bai.length} bãi chính: mọi người thấy và đánh chung 1 đàn quái.` },
      { ds: [
        "Đồ rơi như quái riêng (cùng tỉ lệ, cùng bảng), nhưng chỉ người gây nhiều sát thương nhất nhận tiền và đồ; người cùng đánh nhận kinh nghiệm theo phần sát thương.",
        `Kinh nghiệm và tiền × ${so(th)}; ủy thác không có thưởng này.`,
        `Quái mạnh hơn: máu × ${so(M.mau || 1)}, sát thương × ${so(M.satThuong || 1)}, tốc đánh × ${so(M.tocDanh || 1)}.`,
        "Boss Sát thủ chỉ ra ở bản quái chung: chỉ người đang nhận đúng boss đó được tính nhiệm vụ và nhận thưởng.",
      ] },
      { p: `Các bãi: ${bai.map((Z) => `${Z.n} (${Z.lo}–${Z.hi})`).join(", ") || "—"}.` },
    ],
  };
}

function roiPhongHoa() {
  const F = C.F.ph, Rr = F.roi || {}, BU = { bat: true, heSo: 2, tiLe: [0.0005, 0.001, 0.002, 0.01, 0.02], lan: [1, 2, 3, 4, 5], ...(F.bua || {}) };
  const BM = (C.DO.BUA_MON && C.DO.BUA_MON.length ? C.DO.BUA_MON : Object.keys(((C.KTC.bua || {}).mon) || {})), loai = (Rr.loai || []).map((v) => TEN_QUAN[v] || v);
  // tên ngắn cho dòng nguồn: đủ Đội trưởng … Chủ soái thì "quân từ Đội trưởng trở lên"
  const cao = HANG_QUAN.slice(1), du = cao.every((v) => (Rr.loai || []).includes(v));
  const loaiNgan = [...(du ? ["quân từ Đội trưởng trở lên"] : []), ...(Rr.loai || []).filter((v) => !(du && cao.includes(v))).map((v) => (v === "xe" ? "chiến xa" : TEN_QUAN[v] || v))].join(", ");
  const rows = [], X = Rr.xu;
  for (const [p, L] of Rr.ds || []) {
    if (!Array.isArray(L) || !L.length || !(Number(p) > 0)) continue;
    rows.push([L.length > 1 ? `1 trong ${gopTen(L.map(ten))}` : ten(L[0]), pt(p), "1"]);
    for (const k of L) nguon(k, `Phong Hỏa Liên Thành (${loaiNgan}): ${pt(Number(p) / L.length)} mỗi con${L.length > 1 ? ` (1 trong ${L.length})` : ""}`, "Phong Hỏa Liên Thành");
  }
  if (Array.isArray(X) && Number(X[0]) > 0) rows.push(["Xu", pt(X[0]), X[1] === X[2] ? so(X[1]) : `${so(X[1])}–${so(X[2])}`]);
  const nhomBua = gopTen([...new Set(BM.map((k) => { const n = ten(k); return n.replace(/^(Kim|Mộc|Thủy|Hỏa|Thổ) Chi /, ""); }))]);
  if (BU.bat) for (const k of BM) nguon(k, `Phong Hỏa Liên Thành: quân Tống rơi (1 trong ${BM.length} bùa, nhặt là dùng)`, "Phong Hỏa Liên Thành");
  const buaRows = HANG_QUAN.map((v, i) => [TEN_QUAN[v], so((BU.lan || [])[i] | 0), pt(Math.min(1, BM.length * (Number((BU.tiLe || [])[i]) || 0) * (Number(BU.heSo) || 0)))]).filter((r) => r[1] !== "0");
  return {
    id: "phongHoa", ten: "Quân Phong Hỏa", tom: "Quân Tống rơi bùa, Thủy Tinh, Thiết La Hán, Xu", tim: `phong hỏa liên thành quân tống bùa ${nhomBua}`,
    noi: [
      { p: "Quân Tống không rơi tiền, trang bị thường. Người gây nhiều sát thương nhất lên con quân nhận phần rơi thêm (nằm đất, riêng mình nhặt; Xu vào thẳng)." },
      { h: "Rơi thêm" },
      { p: `Chỉ quân ${loai.join(", ")}. Mỗi dòng xét riêng.` },
      { bang: [["Món", "Tỉ lệ riêng", "SL"], ...rows], can: ["l", "r", "r"] },
      BU.bat ? { h: "Bùa" } : null,
      BU.bat ? { p: `${BM.length} loại bùa (${nhomBua} — đủ 5 hệ) nhặt là dùng ngay, hiệu quả 30 giây – 1 phút. Mỗi lượt trúng ra 1 bùa ngẫu nhiên; chiến xa, Thần binh không rơi bùa.` } : null,
      BU.bat ? { bang: [["Quân", "Lượt", "Mỗi lượt"], ...buaRows], can: ["l", "r", "r"] } : null,
    ].filter(Boolean),
  };
}

function roiVuotAi() {
  const F = C.F.va, VA = vuotAiDl(), dem = (VA.cap || []).map(vaDem), T = F.thuoc, LB = F.leBao;
  const quai = dem.length ? dem[0].quai : 0, boss = dem.length ? dem[0].boss : 0, rows = [];
  // Ngũ Hoa: mỗi con giết được đều xét, cả boss (vuot-ai.js — lượt bốc không chặn boss) -> quái + boss con mỗi lượt
  if (T && T.k) { rows.push([`Mỗi quái, cả boss (${so(quai + boss)} con mỗi lượt)`, `${[].concat(T.n).join("–")} ${ten(T.k)}`, pt(T.tiLe)]); nguon(T.k, `Vượt Ải: mỗi quái (cả boss) ${pt(T.tiLe)} rơi ${[].concat(T.n).join("–")} bình`, "Vượt Ải"); }
  if (LB && LB.k) { rows.push([`Mỗi boss (${so(boss)} con mỗi lượt)`, ten(LB.k), pt(LB.roi)]); nguon(LB.k, `Vượt Ải: mỗi boss ${pt(LB.roi)} (${boss} boss mỗi lượt)`, "Vượt Ải"); }
  return {
    id: "vuotAi", ten: "Quái Vượt Ải", tom: "Không trang bị — Ngũ Hoa Ngọc Lộ Hoàn, Hộp lễ vật", tim: "vượt ải quái ải hộp lễ vật ngũ hoa",
    noi: [
      { p: "Quái trong ải không cho kinh nghiệm, tiền, trang bị riêng — kinh nghiệm tính theo đám (xem Hoạt động → Vượt Ải)." },
      { bang: [["Quái", "Rơi", "Tỉ lệ riêng"], ...rows], can: ["l", "l", "r"] },
      { p: "Mỗi người còn trong ải tự gieo phần rơi của mình (ai người nấy thấy)." },
    ],
  };
}

function roiDacBietBai() {
  const R = Rc(), monChu = (b) => R.loc(b).sort((a, c) => c[1] - a[1]).map(([k, p]) => `${ten(k)} ${pt(p)}`).join(", ");
  const zs = Object.entries(R.RDB).map(([z, B]) => [C.N.ZONES.get(+z), B]).filter(([Z]) => Z).sort((a, b) => a[0].lo - b[0].lo || a[0].id - b[0].id);
  const gQ = new Map(), gTL = new Map(), gTA = new Map(), them = (M, k, Z) => { const L = M.get(k) || []; L.push(Z); M.set(k, L); }, thong = new Map();
  const ghi = (k, ai, p, l, Z) => { const t = `${k}|${ai}`, o = thong.get(t) || { k, ai, p: [], l: [], z: new Set() }; o.p.push(p); o.l.push(l); o.z.add(Z.id); thong.set(t, o); };
  for (const [Z, B] of zs) {
    const q = B.q || {}, sig = (t) => (t ? `${t[0]}|${JSON.stringify(R.loc(t[1]))}` : "0|[]");
    const ma = (Z.m || []).map((id) => q[id]).filter(Boolean), tq = ma[0] || null, sQ = sig(tq);
    if (tq) { them(gQ, sQ, Z); for (const [k, p] of R.loc(tq[1])) ghi(k, "Quái thường", Number(p), tq[0], Z); }
    if (Z.boss != null && Z.kind !== "thuyền") {
      const tb = q[Z.boss] || null, sB = sig(tb);
      if (sB !== sQ) them(gTL, sB, Z);
      if (tb) for (const [k, p] of R.loc(tb[1])) ghi(k, "Thủ lĩnh", Number(p), tb[0], Z);
    }
    if (B.ta && Z.kind !== "thuyền") { them(gTA, `${B.ta.luot}|${JSON.stringify(R.loc(B.ta.bang))}`, Z); for (const [k, p] of R.loc(B.ta.bang)) ghi(k, "Tinh anh", Number(p), B.ta.luot, Z); }
  }
  const dong = (s, Zs) => {
    const [l, js] = [s.slice(0, s.indexOf("|")), s.slice(s.indexOf("|") + 1)], b = Object.fromEntries(JSON.parse(js));
    return `${Object.keys(b).length ? `<y>${l} lượt</y>: ${monChu(b)}` : "<c>không có món</c>"} — ${tenBaiDs(Zs)}.`;
  };
  for (const o of thong.values()) {
    const a = Math.min(...o.p), b = Math.max(...o.p), la = Math.min(...o.l), lb = Math.max(...o.l);
    nguon(o.k, `${o.ai} ở ${o.z.size} bãi: ${khoangPt(a, b)} mỗi lượt, ${la === lb ? la : `${la}–${lb}`} lượt mỗi con`, o.ai);
  }
  const boKhoi = [...new Set((R.RDC.boKhoiBangClient || []).map((k) => (k === "biKip" ? "sách võ công 90" : ten(k))))];
  const lb = C.F.pld || {};
  return {
    id: "dacBiet", ten: "Món đặc biệt theo bãi", tom: "Mật đồ thần bí, Thần bí đồ chí, Thần Bí Lộ Chí theo từng bãi",
    tim: `${zs.map(([Z]) => Z.n).join(" ")} mật đồ đồ chí lộ chí sơn hà xã tắc`,
    noi: [
      { p: `Bảng rơi riêng của từng bãi theo client. Mỗi lượt bốc 1 lần, ra tối đa 1 món. Đã bỏ khỏi bảng client: ${boKhoi.join(", ")} (các món này rơi theo bảng riêng của thủ lĩnh, Boss Sát thủ).` },
      { h: "Quái thường" },
      { ds: [...gQ].map(([s, Zs]) => dong(s, Zs)) },
      gTL.size ? { h: "Thủ lĩnh" } : null,
      gTL.size ? { p: "Như quái thường của bãi, trừ:" } : null,
      gTL.size ? { ds: [...gTL].map(([s, Zs]) => dong(s, Zs)) } : null,
      { h: "Tinh anh" },
      { ds: [...gTA].map(([s, Zs]) => dong(s, Zs)) },
      { p: `${ten(lb.matDo || "ms:196")}: gom đúng ${so(lb.matDoCan || 200)} cuốn đổi 1 lần lên thuyền Phong Lăng Độ. Thần bí đồ chí / Thần Bí Lộ Chí: nhặt là ghi ngay — đang làm Dã Tẩu “thu thập địa đồ” đúng bãi thì thành Địa đồ chí, không thì thành mảnh Sơn Hà Xã Tắc.` },
    ].filter(Boolean),
  };
}

// =====================================================================================================================
// RƯƠNG & HỘP QUÀ
// =====================================================================================================================
function nhomRuong(ds) {
  for (const [id, fn] of [["ruongXanh", rgXanh], ["ruongDaTau", rgDaTau], ["leBaoVa", rgLeBaoVa], ["ruongTb", rgThanBi], ["phuQuy", rgPhuQuy], ["bossTg", rgBossTg],
    ["sanNhim", rgSanNhim], ["laHanLeBao", rgLaHanLeBao], ["hoiThienLeBao", rgHoiThien], ["nhacVuongLeBao", rgNhacVuong], ["hoangKim", rgHoangKim]]) moi(ds, id, fn);
}
// khối "Có từ" điền sau khi mọi nhóm đã ghi nguồn
function khoiNguon(k, them = []) {
  const K = { ds: ["—"] };
  C.sau.push(() => { const L = [...(C.NG.get(k) || []).map((o) => o.s), ...them.filter(Boolean)]; K.ds = L.length ? L : ["—"]; });
  return K;
}
const chuMua = (k) => { const a = giaKtc().get(k), b = giaPd().get(k); return [a ? `Kỳ Trân Các (thẻ ${a[0]}): ${xuChu(a[1])}` : "", b != null ? `Cửa hàng phúc duyên: ${so(b)} điểm` : ""].filter(Boolean); };


function rgXanh() {
  const RX = { k: "ms:1884", soDong: [0, 0, 0, 70, 22, 7, 1], oTrong: 6, ...(C.CFG.ruongXanh || {}) }, k = RX.k, sd = chuan(RX.soDong), R = Rc();
  const co = sd.map((p, n) => (p > 0 ? n : -1)).filter((n) => n >= 0), lo = co.length ? co[0] : 0, hi = co.length ? co[co.length - 1] : 0;
  nguon("trangBi", `${ten(k)}: mở ra 1 món ${lo}–${hi} dòng`, ten(k));
  return {
    id: "ruongXanh", ten: ten(k), ...(icCua(k) ? { ic: icCua(k) } : {}), tom: `Mở ra 1 trang bị xanh ${lo}–${hi} dòng`, tim: "rương xanh đồ xanh trang bị bảo rương",
    noi: [
      { p: `Bấm chuột phải để mở: nhận <g>1 trang bị xanh</g>. Cần ít nhất <y>${so(RX.oTrong)} ô trống</y> trong hành trang.` },
      { h: "Số dòng" },
      { bang: [["Số dòng", "Tỉ lệ"], ...dongBang(sd)], can: ["l", "r"] },
      { p: `Món từ <y>${so(C.CFG.thongBaoTuDong)} dòng</y> trở lên được báo cả máy chủ.` },
      { h: "Loại món" },
      { bang: [["Loại", "Tỉ lệ"], ...loaiBang()], can: ["l", "r"] },
      { h: "Cấp món và dòng" },
      { ds: [`Cấp món = cấp nhân vật lúc mở ÷ ${R.capDo.chiaTren} (1–10) — như thủ lĩnh cùng cấp rơi.`, "Ngũ hành ngẫu nhiên. Dòng thuộc tính gieo như đồ rơi, có tính may mắn của người mở.",
        "Món mở ra không vừa túi thì chờ, dọn túi là tự vào — không mất."] },
      { h: "Có từ" },
      khoiNguon(k, chuMua(k)),
    ],
  };
}

function rgDaTau() {
  const D = C.CFG.daTau || {}, R = D.ruong || {}, chuy = R.chuy ?? 6, bang = (R.bang || []).filter((r) => Array.isArray(r) && Number(r[2]) > 0), T = tong(bang.map((r) => r[2])) || 1;
  const k = "ms:2374", x = BY(k) || {}, chuyK = (x.dung || {}).chuy || "ms:2348", tl = new Map(), ghiChu = [];
  const rows = bang.map((r) => {
    const p = Number(r[2]) / T, sl = r[1] | 0 || 1;
    if (Array.isArray(r[0])) {
      const ds = r[0].filter((m) => BY(m)), hoan = ds.length && ds.every((m) => / hoàn$/i.test(ten(m)));
      for (const m of ds) tl.set(m, (tl.get(m) || 0) + p / ds.length);
      ghiChu.push(`${hoan ? "Hoàn ngẫu nhiên" : `1 trong ${ds.length} món`}: ${gopTen(ds.map(ten))} — mỗi loại ${pt(p / (ds.length || 1))}.`);
      return [hoan ? `1 hoàn bất kỳ (${ds.length} loại)` : `1 trong ${ds.length} món`, pt(p), so(sl)];
    }
    if (r[0] !== "xu") tl.set(r[0], (tl.get(r[0]) || 0) + p);
    return [r[0] === "xu" ? "Xu" : ten(r[0]), pt(p), so(sl)];
  });
  const kep = [...tl].filter(([m]) => bang.some((r) => r[0] === m) && bang.some((r) => Array.isArray(r[0]) && r[0].includes(m)));
  if (kep.length) ghiChu.push(`${kep.map(([m]) => ten(m)).join(", ")} còn nằm trong phần hoàn ngẫu nhiên, nên tỉ lệ thật cao hơn: ${kep.map(([m, p]) => `${ten(m)} ${pt(p)}`).join(", ")}.`);
  for (const [m, p] of tl) nguon(m, `${ten(k)}: ${pt(p)} mỗi lần mở`, "Nhiệm vụ Dã Tẩu");
  const pChuy = { p: "" };
  C.sau.push(() => { const t = tenHd(chuyK); pChuy.p = `Mở cần <y>${so(chuy)} ${ten(chuyK)}</y>${t.length ? ` (có từ ${t.join(", ")})` : ""}. Hành trang phải đủ chỗ cho món mở ra, nếu không thì không mất gì.`; });
  dungThem(chuyK, `Mở ${ten(k)}: ${so(chuy)} cái mỗi rương.`);
  return {
    id: "ruongDaTau", ten: ten(k), ...(icCua(k) ? { ic: icCua(k) } : {}), tom: `Mở bằng ${so(chuy)} ${ten(chuyK)} — ${bang.length} loại phần thưởng`,
    tim: `dã tẩu bảo rương thần bí ${ten(chuyK)}`,
    noi: [
      { p: `Dã Tẩu tặng 1 rương sau mỗi <y>${so(R.moi ?? 10)}</y> nhiệm vụ liên tiếp trong chuỗi (chuỗi bị xóa hoặc qua 8.000 thì đếm lại).` },
      pChuy,
      { bang: [["Món", "Tỉ lệ", "SL"], ...rows], can: ["l", "r", "r"] },
      ghiChu.length ? { ds: ghiChu } : null,
    ].filter(Boolean),
  };
}

function rgLeBaoVa() {
  const LB = { k: "ms:1392", kn: 5000000, xu: { 1: 1 }, tiLeXu: 0, ttl: "ms:71", tiLeTtl: 0, ...(((C.CFG.vuotAi || {}).leBao) || {}) }, F = C.F.va;
  const w = LB.xu && typeof LB.xu === "object" ? LB.xu : { [LB.xu || 1]: 1 }, sw = tong(Object.values(w)) || 1, tx = Number(LB.tiLeXu) || 0, tt = Number(LB.tiLeTtl) || 0;
  const boss = ((vuotAiDl().cap || []).map(vaDem)[0] || {}).boss || 0, k = LB.k;
  if (tt > 0) nguon(LB.ttl, `${ten(k)}: ${pt(tt)} mỗi lần mở`, "Vượt Ải");
  return {
    id: "leBaoVa", ten: ten(k), ...(icCua(k) ? { ic: icCua(k) } : {}), tom: `Mở ra Xu, ${ten(LB.ttl)} hoặc ${kn(LB.kn)}`, tim: "vượt ải hộp lễ vật boss ải",
    noi: [
      { p: `Rơi từ boss trong Vượt Ải: mỗi boss (${boss} con mỗi lượt) <y>${pt(((F.leBao || {}).roi) ?? 0)}</y> rơi cho mỗi người còn trong ải. Bấm chuột phải để mở, bốc 1 kết quả:` },
      { bang: [["Kết quả", "Tỉ lệ"], ...Object.entries(w).filter(([, v]) => Number(v) > 0).map(([n, v]) => [xuChu(n), pt((tx * Number(v)) / sw)]),
        ...(tt > 0 ? [[`1 ${ten(LB.ttl)}`, pt(tt)]] : []), [kn(LB.kn), pt(Math.max(0, 1 - tx - tt))]], can: ["l", "r"] },
    ],
  };
}

function rgThanBi() {
  const F = C.F.rtb, L = (F.thuong || []).filter((r) => Array.isArray(r) && Number(r[2]) > 0), T = tong(L.map((r) => r[2])) || 1, gio = dsGio(F.gio);
  const rows = L.map((r) => {
    const p = Number(r[2]) / T;
    if (r[0] === "kn") return [kn(r[1]), pt(p)];
    if (r[0] === "xu") return [xuChu(r[1]), pt(p)];
    const ds = [].concat(r[1]).filter((m) => BY(m));
    for (const m of ds) nguon(m, `Rương Thần Bí: ${pt(p / (ds.length || 1))} mỗi rương`, "Rương Thần Bí");
    return [ds.length > 1 ? `1 ${gopTen(ds.map(ten))}` : ten(ds[0] || ""), pt(p)];
  });
  return {
    id: "ruongTb", ten: "Rương Thần Bí", tom: `Ai mở trước được 1 phần thưởng — ${rows.length} loại`, tim: "rương thần bí sự kiện",
    noi: [
      { p: `${F.bat === false ? "<c>Đang tạm dừng.</c> " : ""}${gio.length ? `<y>${gio.join(", ")}</y> ${ngayChu(F.thu)}` : "Theo lịch"} ra ${so(F.so)} rương ở các bãi cấp cao (xem Hoạt động → Rương Thần Bí). Cấp ${so(F.capMo)} trở lên đứng gần rương mở được; ai mở trước được 1 phần thưởng:` },
      { bang: [["Phần thưởng", "Tỉ lệ"], ...rows], can: ["l", "r"] },
      { p: "Phần thưởng là món mà túi đầy thì rương còn nguyên." },
    ],
  };
}

function rgPhuQuy() {
  const F = C.F.pq, T = F.thuong || {}, D = F.dacBiet || {}, k = F.mon;
  for (const [m, n] of T.mon || []) nguon(m, `Phú Quý Cẩm Hạp: trúng số thường (${pt(9 / 90)} mỗi lần chọn) — ${slChu(m, n)}`, "Phú Quý Cẩm Hạp");
  for (const [m, n] of D.mon || []) nguon(m, `Phú Quý Cẩm Hạp: trúng số đặc biệt (${pt(1 / 90)} mỗi lần chọn) — ${slChu(m, n)}`, "Phú Quý Cẩm Hạp");
  muaThem(k, `Thần Tài (${F.baiNpc || "Biện Kinh"}): ${xuChu(F.gia)}`);
  return {
    id: "phuQuy", ten: ten(k), ...(icCua(k) ? { ic: icCua(k) } : {}), tom: `Chọn số dự thưởng — trúng số thường ${pt(9 / 90)}, đặc biệt ${pt(1 / 90)}`, tim: "phú quý cẩm hạp thần tài quay số",
    noi: [
      { p: `Mua ở Thần Tài (${F.baiNpc || "Biện Kinh"}), ${xuChu(F.gia)} mỗi hộp. Cấp ${so(F.cap)} trở lên đứng trong thôn / thành bấm chuột phải, chọn 1 số 10–99: nhận ngay <g>${kn(F.kn)}</g>. Tối đa ${so(F.toiDa)} hộp mỗi đợt.${F.bat === false ? " <c>Đang tạm dừng.</c>" : ""}` },
      { p: `<y>${hhmm(F.quay)}</y> ${ngayChu(F.thu)} quay 10 số khác nhau trong 90 số (10–99): 9 số thường + 1 số đặc biệt. Mỗi lần chọn:` },
      { bang: [["Kết quả mỗi lần chọn", "Tỉ lệ"], ["Trúng số thường", pt(9 / 90)], ["Trúng số đặc biệt", pt(1 / 90)], ["Không trúng", pt(80 / 90)]], can: ["l", "r"] },
      { ds: [`Mỗi lần trúng số thường: <g>${kn(T.kn)} + ${dsMon(T.mon)}</g> (tối đa ${so(T.toiDa)} lần mỗi đợt).`, `Trúng số đặc biệt: <g>${kn(D.kn)} + ${dsMon(D.mon)}</g> (tối đa ${so(D.toiDa)} lần mỗi đợt).`,
        `Nhận ở Thần Tài trước ${hhmm(F.hetNhan)} hôm sau; quá hạn thì mất. Chọn trùng số thì mỗi lần trúng tính 1.`] },
    ],
  };
}

function rgBossTg() {
  const F = C.F.btg, hang = (F.hang || []).slice().sort((a, b) => a.den - b.den), K = F.kich || {}, hiem = (F.hiem || []).filter((r) => Number(r[2]) > 0);
  const ma = DANH_MA.filter((m) => BY(m)), dm = (Number(F.danhMa) || 0) / 100, ngua = ((BY(ma[0] || "") || {}).dung || {}).ngay;
  // nguồn gom theo (món, loại, số): "hạng 1–3 — 2 cái", "hạng 3–10, kích sát — 25 % (1 trong 4)"
  const gop = new Map();
  const ghiG = (m, loai, gt, nhan) => { const key = `${m}|${loai}|${gt}`, g = gop.get(key) || { m, loai, gt, nhan: [] }; g.nhan.push(nhan); gop.set(key, g); };
  const qua = (t, nhan) => {
    const p = [];
    for (const [m, n] of t.mon || []) { p.push(monSl(m, n)); ghiG(m, "mon", n | 0 || 1, nhan); }
    if ((t.mot || []).length) {
      p.push(`1 trong ${gopTen(t.mot.map((r) => monSl(r[0], r[1])))} (${pt(1 / t.mot.length)} mỗi món)`);
      for (const [m] of t.mot) ghiG(m, "mot", t.mot.length, nhan);
    }
    if (t.hiem) p.push("xét bảng đồ hiếm");
    return p.join(" + ") || "—";
  };
  let truoc = 0;
  const rows = hang.map((t) => { const a = truoc + 1, b = t.den | 0; truoc = b; return [a === b ? `Hạng ${a}` : `Hạng ${a}–${b}`, qua(t, [a, b])]; });
  const kich = [K.kn > 0 ? `+${kn(K.kn)}` : "", qua({ mon: K.mon, mot: K.mot }, "kích sát"), K.hiem ? "xét bảng đồ hiếm" : "", K.ma && ma.length && dm > 0 ? `${pt(dm)} 1 Mã bài (${gopTen(ma.map(ten))}${ngua ? `, ngựa ${ngua} ngày` : ""})` : ""].filter((s) => s && s !== "—");
  for (const g of gop.values()) {
    const kh = [];
    for (const [a, b] of g.nhan.filter(Array.isArray).sort((x, y) => x[0] - y[0])) { const l = kh[kh.length - 1]; if (l && l[1] + 1 === a) l[1] = b; else kh.push([a, b]); }
    const chu = [...kh.map(([a, b]) => (a === b ? `hạng ${a}` : `hạng ${a}–${b}`)), ...g.nhan.filter((x) => !Array.isArray(x))].join(", ");
    nguon(g.m, `Boss Hoàng Kim: ${chu} — ${g.loai === "mon" ? slChu(g.m, g.gt) : `${pt(1 / g.gt)} (1 trong ${g.gt})`}`, "Boss Hoàng Kim");
  }
  if (K.ma && ma.length && dm > 0) for (const m of ma) nguon(m, `Boss Hoàng Kim: kích sát — ${pt(dm / ma.length)} (${pt(dm)} ra 1 trong ${ma.length} Mã bài)`, "Boss Hoàng Kim");
  for (const [m, n, tl] of hiem) nguon(m, `Boss Hoàng Kim: bảng đồ hiếm — xét riêng ${pt(Number(tl) / 100)}${(n | 0) > 1 ? ` (${so(n)} cái)` : ""}`, "Boss Hoàng Kim");
  const tg = F.thamGia | 0; // quà tham gia (anh 11/11 — boss-tg.js CF.thamGia): ai có sát thương cũng có
  if (tg > 0) nguon("ms:1884", `Boss Hoàng Kim: tham gia đánh (ai có sát thương) — ${slChu("ms:1884", tg)}`, "Boss Hoàng Kim");
  const coHiem = rows.filter((r, i) => hang[i].hiem).map((r) => r[0].replace("Hạng ", "")).join(", ");
  return {
    id: "bossTg", ten: "Quà Boss Hoàng Kim", tom: `Quà top ${truoc}, quà kích sát, bảng đồ hiếm xét riêng`, tim: "boss hoàng kim boss thế giới quà xếp hạng kích sát đồ hiếm mã bài",
    noi: [
      { p: `Kinh nghiệm: ${kn(F.kn)} chia theo % sát thương; đạt từ ${pt((Number(F.nguong) || 0) / 100)} tổng sát thương được ít nhất ${kn(F.knIt)} và xét quà xếp hạng, dưới mức đó vẫn có kinh nghiệm theo %.` },
      ...(tg > 0 ? [{ h: "Quà tham gia" }, { p: `Ai có sát thương lên boss (kể cả không vào top) được ${so(tg)} ${ten("ms:1884")} — vào hành trang khi có chỗ.` }] : []),
      { h: "Quà xếp hạng" },
      { bang: [["Hạng", "Quà"], ...rows], can: ["l", "l"] },
      { h: "Quà kích sát" },
      { p: `Người ra đòn kết liễu thêm: ${kich.join(" + ")}.` },
      { h: "Bảng đồ hiếm" },
      { p: `Mỗi món xét riêng — có thể ra nhiều món cùng lúc. Xét cho hạng ${coHiem || "—"} và người kích sát.` },
      { bang: [["Món", "Tỉ lệ riêng", "SL"], ...hiem.map(([m, n, tl]) => [ten(m), pt(Number(tl) / 100), so(n || 1)])], can: ["l", "r", "r"] },
    ],
  };
}

function rgSanNhim() {
  const F = C.F.sn, hiem = F.hiem || [], mon = F.mon || [], tl = hiem.length ? (Number(F.hiemTl) || 0) / 100 : 0, rows = [];
  for (const [m, n] of hiem) { const p = tl / hiem.length; rows.push([monSl(m, n), pt(p)]); nguon(m, `Săn Nhím Béo Phì: ${pt(p)} mỗi con bắt được`, "Săn Nhím Béo Phì"); }
  for (const [m, n] of mon) { const p = (1 - tl) / mon.length; rows.push([monSl(m, n), pt(p)]); nguon(m, `Săn Nhím Béo Phì: ${pt(p)} mỗi con bắt được`, "Săn Nhím Béo Phì"); }
  return {
    id: "sanNhim", ten: "Quà Săn Nhím", tom: `${kn(F.kn)} + 1 món mỗi con bắt được`, tim: `săn nhím ${F.ten || ""}`,
    noi: [
      { p: `Người ra đòn kết liễu 1 con ${F.ten || "Nhím béo phì"} nhận <g>${kn(F.kn)}</g> (cố định, không chia đội, không nhân Tiên Thảo Lộ) + 1 món:` },
      { bang: [["Món", "Tỉ lệ"], ...rows], can: ["l", "r"] },
      { p: `Mỗi nhân vật bắt tối đa ${so(F.ngay)} con mỗi ngày.` },
    ],
  };
}

function rgLeBaoMot(id, loai, fn) {
  const x = [...C.N.BY.values()].find((y) => y.ktc && y.dung && y.dung.loai === loai);
  if (!x) return null;
  const k = x.k, D = x.dung, r = fn(k, D);
  return { id, ten: ten(k), ...(x.ic ? { ic: x.ic } : {}), tom: r.tom, tim: r.tim, noi: [...r.noi, { h: "Có từ" }, khoiNguon(k, chuMua(k))] };
}
function rgLaHanLeBao() {
  return rgLeBaoMot("laHanLeBao", "leBaoNhieu", (k, D) => {
    nguon(D.mon, `${ten(k)}: mở ra ${so(D.so)} quyển`, ten(k));
    return { tom: `Mở ra ${so(D.so)} ${ten(D.mon)}`, tim: ten(D.mon), noi: [{ p: `Bấm chuột phải: nhận <g>${so(D.so)} ${ten(D.mon)}</g> (cần đủ chỗ trong túi). Cách dùng ${ten(D.mon)}: xem Phần thưởng → ${ten(D.mon)}.` }] };
  });
}
function rgHoiThien() {
  return rgLeBaoMot("hoiThienLeBao", "leBao", (k, D) => {
    const th = BY(D.thuoc) || {}, mang = (C.CFG.thuoc || {}).mangToiDa || 60;
    nguon(D.thuoc, `${ten(k)}: ${so(D.so)} viên mỗi bao`, ten(k));
    return { tom: `Chứa ${so(D.so)} viên ${ten(D.thuoc)}`, tim: ten(D.thuoc), noi: [{ p: `Chứa <g>${so(D.so)} viên ${ten(D.thuoc)}</g>${th.intro ? ` — ${chuClient(th.intro)}` : ""}` }, { p: `Bấm chuột phải để rút số viên muốn lấy; mang tối đa ${so(mang)} bình thuốc mọi loại, bao còn viên thì giữ lại.` }] };
  });
}
function rgNhacVuong() {
  return rgLeBaoMot("nhacVuongLeBao", "leBaoMon", (k, D) => {
    const m = BY(D.mon) || {}, c = m.c || [1, 1];
    nguon(D.mon, `${ten(k)}: mở ra`, ten(k));
    return { tom: `Mở ra ${ten(D.mon)}`, tim: ten(D.mon), noi: [{ p: `Bấm chuột phải: nhận <g>${ten(D.mon)}</g> (cần ${c[0]} × ${c[1]} ô trống).` }, m.goiY ? { p: chuClient(m.goiY) } : { p: chuClient(m.intro) }] };
  });
}
function rgHoangKim() {
  const ds = [...C.N.BY.values()].filter((x) => x.ktc && x.dung && x.dung.loai === "choHoangKim");
  if (!ds.length) return null;
  const noi = [{ p: "<c>Chưa mở được</c> — game chưa có trang bị Hoàng Kim; cứ giữ lại, khi game cập nhật sẽ dùng được." }];
  for (const x of ds) noi.push({ h: ten(x.k) }, { p: chuClient(x.goiY || x.intro) || "—" }, khoiNguon(x.k, chuMua(x.k)));
  return { id: "hoangKim", ten: gopTen(ds.map((x) => ten(x.k))), ...(ds[0].ic ? { ic: ds[0].ic } : {}), tom: "Chưa mở được — chờ trang bị Hoàng Kim", tim: "hoàng kim bảo hạp vé số an bang định quốc", noi };
}

// =====================================================================================================================
// VẬT PHẨM
// =====================================================================================================================
const SKILL = () => {
  if ("sk" in T0) return T0.sk;
  const S = docJson("assets/web/skill/skills.json") || {}, phai = {}, chieu = {};
  for (const f of S.factions || []) phai[f.id] = f.n;
  for (const [id, s] of Object.entries(S.skills || {})) if (s && s.n) chieu[id] = s.n;
  return (T0.sk = { phai, chieu });
};
function nhomVat(ds) {
  const keys = new Set([...C.NG.keys(), ...giaKtc().keys(), ...giaPd().keys(), ...C.MUA.keys()]);
  if (keys.has("biKip")) { for (const k of Rc().BI_KIP) keys.add(k); keys.delete("biKip"); }
  keys.delete("xu");
  const TH = tinh("thuoc", "assets/data/thuoc.json") || {}, VP = tinh("vatPham", "assets/data/vat-pham.json") || {};
  C.duoc = new Set(Object.values(TH.shops || {}).flat());
  C.tapHoa = new Map(Object.values(VP.shops || {}).flat().filter((o) => o && o.k).map((o) => [o.k, o.gia]));
  const out = [];
  for (const k of keys) moi(out, `vật ${k}`, () => vatMuc(k));
  out.sort((a, b) => a.ten.localeCompare(b.ten, "vi") || a.id.localeCompare(b.id));
  ds.push(...out);
}
function muaCua(k) {
  const L = [...chuMua(k), ...(C.MUA.get(k) || [])], x = BY(k) || {};
  if (C.duoc && C.duoc.has(k) && x.gia > 0) L.push(`Dược điếm: ${luong(x.gia)} mỗi bình`);
  if (C.tapHoa && C.tapHoa.has(k)) L.push(`Tạp hóa: ${luong(C.tapHoa.get(k))}`);
  return L;
}
function buaChu(k) {
  const B = C.KTC.bua || {}, L = (B.mon || {})[k] || [], manh = ((C.F.ph.bua || {}).manh) || {};
  const hq = L.map(([ma, lo, hi]) => {
    const H = (B.hieu || {})[ma];
    if (!H) return "";
    const m = Number(manh[ma]) || 1, a = Math.max(1, Math.round(lo * H.moi * m)), b = Math.max(1, Math.round(hi * H.moi * m)), gt = `${so(a)}${a !== b ? ` – ${so(b)}` : ""}${H.pt ? " %" : ""}`;
    return H.hoi ? `${H.n} ${gt} điểm ngay` : `${H.n} +${gt} trong ${giay(H.giay)}`;
  }).filter(Boolean);
  return ["Nhặt là dùng ngay (không vào túi); cùng hiệu quả thì thay cái cũ.", hq.length > 1 ? `Bốc 1 trong: ${hq.join("; ")}.` : hq.length ? `${hq[0]}.` : ""].filter(Boolean);
}
function congDung(k, x) {
  const D = x.dung, L = [], RX = { oTrong: 6, soDong: [0, 0, 0, 70, 22, 7, 1], ...(C.CFG.ruongXanh || {}) };
  if (x.bua) L.push(...buaChu(k));
  if (x.chi) L.push("Nhặt lên không vào túi: đang làm Dã Tẩu “thu thập địa đồ” đúng bãi thì thành 1 tấm Địa đồ chí, không thì thành 1 mảnh Sơn Hà Xã Tắc.");
  // Tống Kim (may-chu/tong-kim.js): Huân công bài, món chỉ dùng trong chiến trường (Chiến cổ / Lệnh Bài / Càn Khôn — loại dung riêng, ghi công dụng ở đây)
  const tkv = tkVat(k, D), TK = (C.F.tk || {}).thuong || {};
  if (k === TK.hcMon || (D && D.loai === "huanCong")) L.push(`Dùng nhận ${hcChu(D)}. Hết hạn 24:00 ngày hôm sau (kể từ ngày nhận).`);
  if (tkv && tkv.loai === "doi") L.push(`Tướng sĩ phe ta quanh mình: ${doiChu(tkv.k)} trong ${giay(tkv.giay)}.`);
  if (tkv && tkv.loai === "hoi") L.push(`Hồi ${so(tkv.v)} sinh lực và nội lực mỗi nửa giây trong ${giay(tkv.giay)}.`);
  if (D) {
    switch (D.loai) {
      case "trangThai": {
        const T = (C.KTC.buff || {})[D.buff] || {};
        L.push(`${T.d || T.n || "Trạng thái"} trong ${giay(D.giay)}${D.lamMoi ? "; dùng lại thì tính lại từ đầu" : "; đang có hiệu quả thì dùng thêm vô hiệu"}.`);
        if (D.nhom) L.push("Cùng nhóm các loại Nội … hoàn: ăn loại này thì loại khác đang có hết công hiệu.");
        if (T.mayMan) L.push("May mắn tăng tỉ lệ rơi đồ và giá trị dòng của đồ rơi.");
        break;
      }
      case "ruongXanh": { const sd = chuan(RX.soDong), co = sd.map((p, n) => (p > 0 ? n : -1)).filter((n) => n >= 0); L.push(`Mở ra 1 trang bị xanh ${co[0]}–${co[co.length - 1]} dòng; cần ${so(RX.oTrong)} ô trống (tỉ lệ: Rương & hộp quà → ${ten(k)}).`); break; }
      case "ruongDaTau": {
        const can = ((C.CFG.daTau || {}).ruong || {}).chuy ?? 6, m = String(x.intro || "").match(/(\d+)\s*Huyền Thiên Chùy/i);
        L.push(`Mở bằng ${so(can)} ${ten(D.chuy)}${m && +m[1] !== +can ? ` (ở S1 chỉ cần ${so(can)}, không phải ${m[1]} như lời giới thiệu)` : ""} — bốc 1 phần thưởng (tỉ lệ: Rương & hộp quà → ${ten(k)}).`);
        break;
      }
      case "biBaoVd": L.push(`Dùng Chìa Khóa Như Ý hoặc Chìa khóa vàng để mở, nhận kinh nghiệm theo cấp (Viêm Đế Bảo Tàng).`); break;
      case "leBaoVa": L.push(`Mở ra Xu, ${ten((((C.CFG.vuotAi || {}).leBao) || {}).ttl || "ms:71")} hoặc kinh nghiệm (tỉ lệ: Rương & hộp quà → ${ten(k)}).`); break;
      case "phuQuy": { const F = C.F.pq; L.push(`Cấp ${so(F.cap)}, đứng trong thôn / thành: chọn 1 số 10–99 dự thưởng Phú Quý (+${so(F.kn)} kinh nghiệm), tối đa ${so(F.toiDa)} hộp mỗi đợt.`); break; }
      case "laHan": L.push(`Dùng nhận kinh nghiệm thực chiến theo cấp; tối đa ${so(D.lanNgay)} quyển và ${kn(D.knNgay)} mỗi ngày, trên cấp ${so(D.capToiDa)} vô hiệu (xem Phần thưởng → ${ten(k)}).`); break;
      case "leBaoNhieu": L.push(`Mở ra ${so(D.so)} ${ten(D.mon)}.`); break;
      case "leBao": L.push(`Chứa ${so(D.so)} viên ${ten(D.thuoc)}; rút số viên muốn lấy (mang tối đa ${so((C.CFG.thuoc || {}).mangToiDa || 60)} bình thuốc).`); break;
      case "leBaoMon": L.push(`Mở ra ${ten(D.mon)}.`); break;
      case "ngua": L.push(D.vinhVien || !(D.ngay > 0) ? `Nhận 1 ngựa ${ten(D.ngua)} không hạn sử dụng (không bán được cho cửa hàng).` : `Nhận 1 ngựa ${ten(D.ngua)}, hạn ${so(D.ngay)} ngày từ lúc dùng.`); break;
      // Báo Đáp Ân Sư (anh 16/11 — bao-dap-an-su.js; do.js dungVat): nguyên liệu, hương bao, món thưởng
      case "bdasNl": {
        const M = BD_MON, ra = { [M.to]: M.tt, [M.chi]: M.ns, [M.duoc]: M.td };
        if (k === M.ruou) L.push(`Mang tới Võ sư (Ba Lăng huyện) mời dùng: nhận kinh nghiệm + ${ten(M.tra)} (Hoạt động → Báo Đáp Ân Sư).`);
        else if (k === M.tra) L.push(`Cùng 1 ${ten(M.to)} / ${ten(M.chi)} / ${ten(M.duoc)} đổi 1 hương bao ở Chưởng Đăng Cung Nữ (Ba Lăng huyện).`);
        else if (ra[k]) L.push(`Cùng 1 ${ten(M.tra)} đổi 1 ${ten(ra[k])} ở Chưởng Đăng Cung Nữ (Ba Lăng huyện).`);
        else L.push("Nguyên liệu hoạt động Báo Đáp Ân Sư.");
        break;
      }
      case "huongBao": {
        const F = cfBdasCua(C.N) || {}, H = ((F.hb || {})[D.hb]) || {}, Lk = (Array.isArray(H.kn) ? H.kn : []).filter(Array.isArray), het = laNgayBd(F.moHet) ? F.moHet : F.den;
        const a = Lk.length ? Math.min(...Lk.map((r) => +r[1] || 0)) : 0, b = Lk.length ? Math.max(...Lk.map((r) => +r[1] || 0)) : 0;
        L.push(`Bấm chuột phải mở${laNgayBd(F.tu) && laNgayBd(het) ? ` (từ ${ddmm(F.tu)} tới hết ${ddmm(truocNgay(het))})` : ""}: ${a === b ? knChu(a) : `${knChu(a)} – ${knChu(b)}`} kinh nghiệm${D.hb !== "tt" ? " + đúng 1 phần quà" : Array.isArray(H.mon) && H.mon.length ? " + tỉ lệ nhỏ ra 1 phần quà (luôn khóa bảo hiểm)" : ""} (tỉ lệ: Hoạt động → Báo Đáp Ân Sư).`);
        if (F.knHbToiDa > 0) L.push(`Kinh nghiệm từ mở hương bao cả sự kiện tối đa ${kn(F.knHbToiDa)} mỗi nhân vật.`);
        { const mo = +((F.moToiDa || {})[D.hb]) || 0, bl = ((F.bao || {})[D.hb] || []); if (mo > 0) L.push(`Mỗi nhân vật mở tối đa ${so(mo)} cái cả sự kiện${bl.length ? ` — cái thứ ${so(mo)} chắc chắn ra ${bl.map((x) => ten(x)).join(" hoặc ")} (món chưa có trước)` : ""}.`); } // anh 17/11 tối
        if (D.hb === "ns" && (F.dang || {}).kn > 0) L.push(`Hoặc dâng Võ sư (Ba Lăng huyện): ${kn(F.dang.kn)} mỗi cái, tối đa ${so(F.dang.lanNgay)} lần mỗi ngày.`);
        break;
      }
      case "kinhNghiem": L.push(`Bấm chuột phải nhận ${kn(D.kn)} (cộng thẳng).`); break;
      case "nen": { const F = cfBdasCua(C.N) || {}, NEN = F.nen || {}; L.push(`Kinh nghiệm đánh quái × ${so(NEN.heSo || 2)} trong ${giay(D.giay || NEN.giay || 1800)} cho mình và tổ đội cùng bản đồ (bãi luyện công: cùng bản quái chung); nhân thêm với Tiên Thảo Lộ.`); break; }
      case "kyNang": { const F = cfBdasCua(C.N) || {}; L.push(`+${so(D.cap)} cấp mọi kỹ năng đã học trong ${so(D.ngay)} ngày (tính cả lúc offline)${D.capNv ? `; cần cấp ${so(D.capNv)}` : ""}; cộng dồn tối đa +${so((F.kyNang || {}).toiDa || 3)} cấp.`); break; }
      case "satThuGian": L.push(`Mở ra ${so(D.so)} Sát Thủ Giản theo cấp nhân vật (cùng khóa bảo hiểm với hộp).`); break;
      case "shxt": L.push(`+${so(D.so)} mảnh Sơn Hà Xã Tắc.`); break;
      case "pldBac": L.push("Dùng ở thành / thôn hoặc bờ Nam Phong Lăng Độ: đưa thẳng tới bờ Bắc Phong Lăng Độ (cần có môn phái)."); break;
      case "matTich": L.push(`+1 điểm kỹ năng; cần cấp ${so(D.cap)}, mỗi nhân vật tối đa ${so(D.toiDa)} quyển.`); break;
      case "tayTuy": L.push(`+1 – 5 điểm tiềm năng theo cấp (cấp 80–81: 1 … từ cấp 88: 5); cần cấp ${so(D.cap)}, tối đa ${so(D.toiDa)} quyển.`); break;
      case "sach": { const S = SKILL(); L.push(`Học kỹ năng “${S.chieu[D.chieu] || "võ công 90"}” (${S.phai[D.phai] || "đúng phái"}); cần cấp ${so(D.cap)}.`); break; }
      case "sach120": L.push(`Học kỹ năng 120 của phái đang ở; cần cấp ${so(D.cap || 120)}.`); break;
      case "daiThanh": L.push(`Chọn 1 kỹ năng ${so(D.moc)} đã học (chưa tới cấp 20) lên thẳng cấp 20.`); break;
      case "hieuUng": if (!x.goiY) L.push("Bấm chuột phải: hiệu ứng quanh mình, người đứng gần cũng thấy."); break;
      case "phiPhong": if (!x.goiY) L.push("Kích hoạt Phi Phong cho y phục đang mặc (mỗi y phục 1 lần, đi theo áo)."); break;
      case "phucDuyen": L.push(`+${so(D.diem)} điểm phúc duyên (phải mở công năng Phúc duyên trước).`); break;
      case "choHoangKim": L.push("<c>Chưa mở được</c> — game chưa có trang bị Hoàng Kim, cứ giữ lại."); break;
      case "tuMau": L.push(`+${so(D.ngay)} ngày dùng túi hành trang tử mẫu.`); break;
      case "bch": L.push(`+${so(D.gio)} giờ ủy thác (ủy thác chỉ chạy khi còn giờ).`); break;
      case "kimTe": L.push(`Sửa trang bị đang mặc rồi tới đồ trong túi: mỗi viên ${so(D.ben)} điểm độ bền.`); break;
      case "nop": if (!(C.CD.get(k) || []).length) L.push(`Nộp cho ${D.cho}.`); break;
      default: break;
    }
  }
  if (tkv) L.push("<c>Chỉ dùng trong Chiến trường Tống Kim.</c>");
  if (!x.goiY) L.push(...(C.CD.get(k) || []));
  return L;
}
// tóm tắt 1 dòng theo công dụng của món ("" = không có)
function tomDung(k, x) {
  const D = x.dung;
  if (x.bua) return "Bùa Phong Hỏa — nhặt là dùng ngay";
  if (x.chi) return "Mảnh địa đồ — nhặt là ghi ngay, không vào túi";
  // Tống Kim: Huân công bài, món chỉ dùng trong chiến trường
  const tkv = tkVat(k, D), TK = (C.F.tk || {}).thuong || {};
  if (k === TK.hcMon || (D && D.loai === "huanCong")) return "Kinh nghiệm — hết hạn 24:00 ngày hôm sau";
  if (tkv) {
    const T = tkv.loai === "hoan" ? (C.KTC.buff || {})[tkv.buff] || {} : {};
    return `${tkv.loai === "doi" ? `Phe ta quanh mình: ${doiChu(tkv.k)}` : tkv.loai === "hoi" ? `Hồi ${so(tkv.v)} sinh lực + nội lực mỗi nửa giây` : T.d || "Trạng thái chiến trường"} — chỉ trong Tống Kim`;
  }
  if (!D) return "";
  switch (D.loai) {
    case "trangThai": { const T = (C.KTC.buff || {})[D.buff] || {}; return T.d ? `${T.d} trong ${giay(D.giay)}` : ""; }
    case "ruongXanh": { const sd = chuan(({ soDong: [0, 0, 0, 70, 22, 7, 1], ...(C.CFG.ruongXanh || {}) }).soDong), co = sd.map((p, n) => (p > 0 ? n : -1)).filter((n) => n >= 0); return `Mở ra 1 trang bị xanh ${co[0]}–${co[co.length - 1]} dòng`; }
    case "ruongDaTau": return `Mở bằng ${so(((C.CFG.daTau || {}).ruong || {}).chuy ?? 6)} ${ten(D.chuy)}`;
    case "biBaoVd": return "Mở bằng Chìa Khóa Như Ý / Chìa khóa vàng, ra kinh nghiệm theo cấp";
    case "leBaoVa": return `Mở ra Xu, ${ten((((C.CFG.vuotAi || {}).leBao) || {}).ttl || "ms:71")} hoặc kinh nghiệm`;
    case "phuQuy": return `Chọn số dự thưởng — quay số ${hhmm(C.F.pq.quay)} ${ngayChu(C.F.pq.thu)}`;
    case "laHan": return `Kinh nghiệm thực chiến — tối đa ${so(D.lanNgay)} quyển mỗi ngày`;
    case "leBaoNhieu": return `Mở ra ${so(D.so)} ${ten(D.mon)}`;
    case "leBao": return `Chứa ${so(D.so)} viên ${ten(D.thuoc)}`;
    case "leBaoMon": return `Mở ra ${ten(D.mon)}`;
    case "ngua": return D.vinhVien || !(D.ngay > 0) ? `Ngựa ${ten(D.ngua)} — không hạn sử dụng` : `Ngựa ${ten(D.ngua)} — ${so(D.ngay)} ngày`;
    // Báo Đáp Ân Sư (anh 16/11)
    case "bdasNl": return k === BD_MON.ruou ? "Mời Võ sư (Ba Lăng) — nhận kinh nghiệm + trà" : "Nguyên liệu hương bao — Chưởng Đăng Cung Nữ (Ba Lăng)";
    case "huongBao": return `Mở ra kinh nghiệm${D.hb !== "tt" ? " + 1 phần quà" : " + đôi khi 1 phần quà"} — Báo Đáp Ân Sư`;
    case "kinhNghiem": return `+${kn(D.kn)}`;
    case "nen": return `Kinh nghiệm đánh quái × ${so(((cfBdasCua(C.N) || {}).nen || {}).heSo || 2)} cho cả tổ đội`;
    case "kyNang": return `+${so(D.cap)} cấp mọi kỹ năng đã học — ${so(D.ngay)} ngày`;
    case "satThuGian": return `Mở ra ${so(D.so)} Sát Thủ Giản theo cấp`;
    case "shxt": return `+${so(D.so)} mảnh Sơn Hà Xã Tắc`;
    case "pldBac": return "Đưa thẳng tới bờ Bắc Phong Lăng Độ";
    case "matTich": return `+1 điểm kỹ năng (cấp ${so(D.cap)}, tối đa ${so(D.toiDa)} quyển)`;
    case "tayTuy": return `+1–5 điểm tiềm năng (cấp ${so(D.cap)}, tối đa ${so(D.toiDa)} quyển)`;
    case "sach": { const S = SKILL(); return `Học “${S.chieu[D.chieu] || "kỹ năng 90"}” — ${S.phai[D.phai] || "đúng phái"}`; }
    case "sach120": return `Học kỹ năng 120 của phái (cấp ${so(D.cap || 120)})`;
    case "daiThanh": return `1 kỹ năng ${so(D.moc)} đã học lên thẳng cấp 20`;
    case "hieuUng": return D.chieu === 251 ? "Bắn pháo hoa quanh mình" : D.chieu === 285 ? "Mưa hoa hồng quanh mình" : "Hiệu ứng quanh mình";
    case "phiPhong": return "Kích hoạt Phi Phong cho y phục đang mặc";
    case "phucDuyen": return `+${so(D.diem)} điểm phúc duyên`;
    case "choHoangKim": return "Chưa mở được — chờ trang bị Hoàng Kim";
    case "tuMau": return `+${so(D.ngay)} ngày túi hành trang tử mẫu`;
    case "bch": return `+${so(D.gio)} giờ ủy thác`;
    case "kimTe": return `Sửa trang bị: ${so(D.ben)} điểm độ bền mỗi viên`;
    default: return "";
  }
}
// mục không phải 1 khóa món: trang bị xanh, Sát Thủ lệnh / giản (mỗi cấp, mỗi hệ 1 khóa)
function vatGia(k) {
  const F = C.F.st, ng = (C.NG.get(k) || []).map((o) => o.s), coTu = [{ h: "Có từ" }, { ds: ng.length ? ng : ["—"] }];
  if (k === "trangBi") {
    return { id: k, ten: "Trang bị xanh", tom: "Trang bị có 1–6 dòng thuộc tính xanh", tim: "đồ xanh trang bị dòng xanh vũ khí áo mũ nhẫn",
      noi: [{ p: "Trang bị rơi từ quái hoặc mở từ rương; số dòng, cấp món, giá trị dòng: xem Rơi đồ từ quái → Cách tính đồ rơi." }, ...coTu] };
  }
  const lenh = k === "ms:399", x = BY(lenh ? "ms:399" : "ms:400:20") || {};
  const intro = chuClient(String(x.intro || "").replace(/<enter>\s*Thuộc tính ngũ hành:.*$/i, ""));
  const cd = lenh ? [`${so(F.gop)} lệnh hợp thành 1 Sát Thủ Giản theo đẳng cấp nhân vật (Nhiếp Thí Trần).`, "Chỉ 1 loại, xếp chồng."] : C.CD.get(k) || [];
  return { id: k, ten: lenh ? "Sát Thủ lệnh" : "Sát Thủ Giản", ...(x.ic ? { ic: x.ic } : {}),
    tom: lenh ? `Thưởng hạ Boss Sát thủ — ${so(F.gop)} cái đổi 1 giản` : "Phí Vượt Ải — hợp thành từ Sát Thủ lệnh",
    tim: `sát thủ lệnh sát thủ giản nhiếp thí trần vượt ải ${tenHd(k).join(" ")}`,
    noi: [...(intro ? [{ p: intro }] : []), ...(cd.length ? [{ h: "Công dụng" }, { ds: cd }] : []), ...coTu] };
}
function vatMuc(k) {
  if (k === "trangBi" || k === "ms:399" || k === "ms:400") return vatGia(k);
  const x = BY(k);
  if (!x) return null;
  const noi = [], cd = congDung(k, x), ng = [...(C.NG.get(k) || []), ...(laSach(x) ? C.NG.get("biKip") || [] : [])], mua = muaCua(k), intro = chuClient(x.intro), goiY = chuClient(x.goiY);
  if (intro) noi.push({ p: intro });
  if (goiY) noi.push({ p: goiY });
  if (cd.length) noi.push({ h: "Công dụng" }, { ds: cd });
  if (ng.length) noi.push({ h: "Có từ" }, { ds: ng.map((o) => o.s) });
  if (mua.length) noi.push({ h: "Mua" }, { ds: mua });
  if (!noi.length) noi.push({ p: "—" });
  const hd = [...new Set(ng.map((o) => o.t).filter(Boolean))];
  const tom = tomDung(k, x) || boThe((C.CD.get(k) || [])[0] || "") || goiY || intro || (hd.length ? `Có từ: ${hd.join(", ")}` : mua[0]) || ten(k);
  return { id: k, ten: ten(k), tom: ngan(tom), ...(x.ic ? { ic: x.ic } : {}), ...(hd.length || mua.length ? { tim: [...hd, ...mua.map((s) => s.split(":")[0])].join(" ").toLowerCase() } : {}), noi };
}

// =====================================================================================================================
// DỰNG
// =====================================================================================================================
function dungDuLieu() {
  const DO = require("./do.js"), N = DO.NOI;
  C = { DO, N, CFG: N.CFG || {}, KTC: tinh("ktc", "assets/data/ky-tran-cac.json") || {}, NG: new Map(), CD: new Map(), MUA: new Map(), sau: [] };
  C.F = {
    ph: cf("./phong-hoa.js", "phongHoa"), btg: cf("./boss-tg.js", "bossTheGioi"), pld: cf("./phong-lang-do.js", "phongLangDo"), sn: cf("./san-nhim.js", "sanNhim"),
    rtb: cf("./ruong-tb.js", "ruongThanBi"), pq: cf("./phu-quy.js", "phuQuy"), va: cf("./vuot-ai.js", "vuotAi"), vd: cf("./viem-de.js", "viemDe"), st: cf("./sat-thu.js", "satThu"),
    mc: cf("./minh-chu.js", "minhChu"), tl: cf("./tu-lam.js", "tuLam"), tt: cf("./tay-tuy.js", "tayTuy"), ch: cf("./cho-troi.js", "choTroi"),
    tk: cf("./tong-kim.js", "tongKim"), bc: cf("./bau-cua.js", "bauCua"),
    bh: cf("./bang-hoi.js", "bangHoi"), // bang hội (anh 14/11): CF = số đang dùng của máy này (chung + theoMay)
  };
  const M = { ruong: [], roi: [], hd: [], chiso: [], thuong: [], vat: [] };
  // thứ tự dựng: hoạt động / thưởng / quái / rương ghi nguồn món trước, Vật phẩm dựng sau cùng
  const buoc = (id, fn) => { try { fn(M[id]); } catch (e) { loiGhi(`nhóm ${id}`, e); } };
  buoc("hd", nhomHd);
  buoc("thuong", nhomThuong);
  buoc("roi", nhomRoi);
  buoc("ruong", nhomRuong);
  for (const f of C.sau) { try { f(); } catch (e) { loiGhi("điền nguồn", e); } }
  buoc("vat", nhomVat);
  buoc("chiso", (L) => L.push(...require("./tra-cuu-chi-so.js").nhomChiSo(C))); // Chỉ số & thuộc tính (anh 13/11 — may-chu/tra-cuu-chi-so.js)
  const sachTim = (t) => String(t || "").toLowerCase().replace(/[/()·,;:—–"“”…+=]/g, " ").replace(/\s+/g, " ").trim();
  return NHOM.map(([id, ten2]) => ({ id, ten: ten2, muc: M[id].map((m) => { const o = { ...m, tom: ngan(boThe(m.tom), 64) }; if (o.tim != null) { const t = sachTim(o.tim); if (t) o.tim = t; else delete o.tim; } return o; }) }));
}
// dấu lịch: CF sống của 7 hoạt động theo giờ (GM đổi -> khác dấu -> lay() dựng lại); mỗi CF chuỗi hóa riêng, lỗi thì "?" (không dựng lại mãi)
function dauLich() {
  let N = null;
  try { N = require("./do.js").NOI; } catch (e) { return ""; }
  // + Báo Đáp Ân Sư (anh 16/11): giai đoạn ngày + cấu hình đang dùng — sang ngày mở / đóng / hết hạn hương bao thì dựng lại (mục hoạt động, giá hàng sự kiện)
  let bd = "";
  try { const F = cfBdasCua(N); bd = JSON.stringify([phaBdas(F), F]); } catch (e) { bd = "?"; }
  return LICH.map(([f, sec]) => {
    let m = null;
    try { m = require(f); } catch (e) { m = null; }
    try { return JSON.stringify((m && m.CF) || (N.CFG || {})[sec] || null); } catch (e) { return "?"; }
  }).join("|") + "|bdas:" + bd;
}
const rong = () => NHOM.map(([id, ten2]) => ({ id, ten: ten2, muc: [] }));
let DANG = false;
function lamMoi() {
  // đang dựng (gọi lồng từ module vừa nạp) -> trả bản cũ
  if (DANG) return BAN || { json: JSON.stringify({ v: "", luc: Date.now(), nhom: rong() }), v: "" };
  DANG = true;
  let nhom = null;
  try { nhom = dungDuLieu(); } catch (e) { loiGhi("dựng dữ liệu", e); }
  C = null;
  try {
    if (!Array.isArray(nhom)) nhom = rong();
    let noiDung;
    try { noiDung = JSON.stringify(nhom); } catch (e) { loiGhi("JSON", e); nhom = rong(); noiDung = JSON.stringify(nhom); }
    const v = crypto.createHash("md5").update(noiDung).digest("hex").slice(0, 12);
    BAN = { json: JSON.stringify({ v, luc: Date.now(), nhom }), v };
    DAU = dauLich();
  } catch (e) { loiGhi("đóng gói", e); }
  DANG = false;
  return BAN || { json: JSON.stringify({ v: "", luc: Date.now(), nhom: rong() }), v: "" };
}
function lay() {
  try { if (!BAN || dauLich() !== DAU) lamMoi(); } catch (e) { loiGhi("lay", e); }
  return BAN || { json: JSON.stringify({ v: "", luc: Date.now(), nhom: rong() }), v: "" };
}

module.exports = { lay, lamMoi };
