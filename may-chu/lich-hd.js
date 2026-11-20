// Lịch hoạt động (anh 05/11: "làm 1 giao diện hiển thị các hoạt động và khung giờ cũng như yêu cầu cho người chơi biết … thêm vào trong quản
// lý server để anh tuỳ ý chỉnh thời gian của các hoạt động, GM chỉnh xong thì theo lịch đó").
//   - 7 hoạt động theo giờ: Phong Hỏa Liên Thành, Boss Hoàng Kim, Săn Nhím Béo Phì, Rương Thần Bí, Phong Lăng Độ, Phú Quý Cẩm Hạp, Tống Kim (anh 06/11
//     — 4 trận / ngày, may-chu/tong-kim.js). Bộ hẹn giờ của
//     từng tệp đọc CF của tệp đó mỗi nhịp -> đổi CF là lịch đổi ngay (không khởi động lại). Hoạt động đang diễn ra giữ giờ kết thúc đã tính lúc mở.
//   - GM chỉnh ở F10 → Lịch hoạt động (quan-tri.js "lich-hd"): bật / tắt, giờ, thời lượng, ngày trong tuần (CF.thu). Lưu du-lieu/lich-hd.json (gửi
//     mã lên VPS không ghi đè). Phú Quý: đổi giờ quay / hạn nhận áp dụng từ ngày mai (đổi giữa ngày làm số đã chọn lệch đợt).
//   - chung()     -> lịch + trạng thái mọi hoạt động (công khai: khung Hướng dẫn hoạt động, lệnh khởi động lại máy chủ kiểm tra có hoạt động không)
//   - cuaToi(h,tk)-> số lần đã làm hôm nay của nhân vật (Vượt Ải, Sát thủ, Dã Tẩu, Minh Chủ, nhím, Online, Thiết La Hán, Ủy thác, Đăng nhập)
//   - quanTri(qt, b) b = { viec: "xem" | "luu" (id, bat, gio, thu, các số) | "macDinh" (id) }
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu");
const GV = require("./gio-vn.js");

const TEP = path.join(D.ROOT, "lich-hd.json");
const NK = () => require("./nhat-ky");
const WS = () => require("./ws.js");
// tệp của từng hoạt động: gọi lúc dùng (các tệp đó require do.js — nạp sau tệp này)
const MOD = {
  phongHoa: () => require("./phong-hoa.js"), bossTg: () => require("./boss-tg.js"), sanNhim: () => require("./san-nhim.js"),
  ruongTb: () => require("./ruong-tb.js"), pld: () => require("./phong-lang-do.js"), phuQuy: () => require("./phu-quy.js"),
  tongKim: () => require("./tong-kim.js"), bauCua: () => require("./bau-cua.js"),
  duaNgua: () => require("./dua-ngua.js"), // Truy Phong Đại Loạn Đấu — đua ngựa (anh 16/11)
};
// kieu: "mot" = 1 giờ "HH:MM" (CF.gio chuỗi) · "ds" = nhiều giờ "HH:MM" · "gio" = giờ chẵn số (Phong Lăng Độ) · "pq" = giờ quay + hạn nhận (Phú Quý)
// so: [khóa, nhãn, nhỏ nhất, lớn nhất] — ô số chỉnh được ở F10
const HD = [
  { id: "phongHoa", ten: "Phong Hỏa Liên Thành", kieu: "mot", so: [["baoTruoc", "Báo trước (phút)", 0, 30], ["baoDanh", "Báo danh (phút)", 1, 30], ["danh", "Đánh (phút)", 5, 120], ["chuSoai", "Chủ soái ra ở phút", 1, 119]] },
  { id: "bossTg", ten: "Boss Hoàng Kim", kieu: "ds", so: [["song", "Boss sống (phút)", 10, 240], ["so", "Số boss mỗi khung giờ", 1, 6]] }, // so: anh 13/11 lượt 86
  { id: "sanNhim", ten: "Săn Nhím Béo Phì", kieu: "ds", so: [["phut", "Mỗi đợt (phút)", 5, 60], ["baoTruoc", "Báo trước (phút)", 0, 30]] },
  { id: "ruongTb", ten: "Rương Thần Bí", kieu: "mot", so: [["song", "Rương còn (phút)", 10, 240]] },
  { id: "pld", ten: "Phong Lăng Độ", kieu: "gio", so: [] },
  { id: "phuQuy", ten: "Phú Quý Cẩm Hạp", kieu: "pq", so: [] },
  { id: "tongKim", ten: "Tống Kim", kieu: "ds", so: [["baoTruoc", "Báo trước (phút)", 0, 30], ["baoDanh", "Báo danh (phút)", 1, 30], ["danh", "Đánh (phút)", 10, 120],
    ["soai1", "Nguyên soái phe ít điểm (phút)", 1, 119], ["soai2", "Nguyên soái phe kia (phút)", 1, 119],
    ["soBot", "Số bot mỗi phe", 1, 60], ["heSoSt", "Hệ số sát thương PK", 0.01, 2, 0.01]] }, // anh 09/11 "bảng admin cho thêm điều chỉnh số lượng bot, số sát thương" — áp dụng từ trận sau; [khóa, chữ, min, max, bước (số lẻ)]
  // đua ngựa (anh 16/11 — may-chu/dua-ngua.js): giờ = lúc mở báo danh (như Tống Kim); báo danh rồi đua tối đa — áp dụng từ lượt sau
];
const BY = new Map(HD.map((x) => [x.id, x]));
const THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const p2 = (n) => String(n).padStart(2, "0");
const sao = (v) => (Array.isArray(v) ? v.slice() : v);
const CFcua = (id) => { try { return MOD[id]().CF || null; } catch (e) { console.error("Lịch hoạt động — không nạp được", id, e.message); return null; } };
// các khóa lịch của 1 hoạt động (để lưu / mặc định / so sánh)
const khoa = (H) => ["bat", ...(H.kieu === "pq" ? ["quay", "hetNhan"] : ["gio"]), ...(H.kieu === "pq" ? [] : ["thu"]), ...H.so.map((s) => s[0])];
const chup = (H, CF) => { const o = {}; for (const k of khoa(H)) if (CF[k] !== undefined) o[k] = sao(CF[k]); if (o.bat === undefined) o.bat = true; return o; };

let S = (() => { try { return JSON.parse(fs.readFileSync(TEP, "utf8")); } catch { return {}; } })();
S.sua = S.sua || {};
const MAC = {}; // lịch gốc (cau-hinh.json + mặc định của tệp) — nút "Về mặc định"
let napXong = false;
function ghi() {
  try { fs.mkdirSync(D.ROOT, { recursive: true }); const tmp = TEP + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(S)); fs.renameSync(tmp, TEP); }
  catch (e) { console.error("Ghi lịch hoạt động lỗi: " + e.message); }
}
// đặt lịch vào CF (mảng: bản sao; thu đủ 7 ngày / rỗng = mọi ngày -> bỏ khóa)
function ap(H, CF, v) {
  for (const k of khoa(H)) {
    if (!(k in v)) continue;
    if (k === "thu") { if (Array.isArray(v.thu) && v.thu.length && v.thu.length < 7) CF.thu = v.thu.slice(); else delete CF.thu; continue; }
    CF[k] = sao(v[k]);
  }
}
function nap() {
  if (napXong) return; napXong = true;
  for (const H of HD) {
    const CF = CFcua(H.id); if (!CF) continue;
    MAC[H.id] = chup(H, CF);
    if (S[H.id]) try { ap(H, CF, S[H.id]); } catch (e) { console.error("Lịch hoạt động — áp lịch đã lưu lỗi", H.id, e.message); }
  }
  doiNgay();
}
// Phú Quý: lịch mới chờ tới ngày áp dụng
function doiNgay() {
  const c = S.cho && S.cho.phuQuy; if (!c) return;
  if (GV.vn().ngay < c.tu) return;
  const H = BY.get("phuQuy"), CF = CFcua("phuQuy"); if (!CF) return;
  S.phuQuy = { ...(S.phuQuy || chup(H, CF)), quay: c.quay, hetNhan: c.hetNhan };
  ap(H, CF, { quay: c.quay, hetNhan: c.hetNhan }); delete S.cho.phuQuy; ghi();
  try { require("./tra-cuu.js").lamMoi(); } catch {}
}
setImmediate(nap);
setInterval(doiNgay, 30000).unref();

// ---------- giờ của từng hoạt động ----------
const dsGio = (H, CF) => H.kieu === "mot" ? (GV.hopLe(CF.gio) ? [CF.gio] : []) : H.kieu === "ds" ? (Array.isArray(CF.gio) ? CF.gio.filter(GV.hopLe) : [])
  : H.kieu === "gio" ? (Array.isArray(CF.gio) ? CF.gio.map((g) => p2(g | 0) + ":00") : []) : (GV.hopLe(CF.quay) ? [CF.quay] : []);
// thời lượng 1 lần (phút): cửa sổ "đang diễn ra"
const daiCua = (H, CF) => H.id === "phongHoa" || H.id === "tongKim" ? (+CF.baoDanh || 0) + (+CF.danh || 0) : H.id === "bossTg" ? +CF.song || 0 : H.id === "sanNhim" ? +CF.phut || 0
  : H.id === "ruongTb" ? +CF.song || 0 : H.id === "pld" ? +CF.capBo || 39 : H.id === "bauCua" ? Math.max(1, Math.floor((+CF.dai || 30) / 2)) * 2
  : H.id === "duaNgua" ? (+CF.baoDanh || 1) + (+CF.dua || 14) : 0;
// lần đang diễn ra / lần tới theo lịch (từ hôm qua — lần qua nửa đêm — tới 8 ngày sau, bỏ ngày tắt)
function lanCua(H, CF, now) {
  const L = dsGio(H, CF).slice().sort(), dai = daiCua(H, CF) * 60000, hom = GV.vn(now).ngay;
  let dang = null, toi = null, xongHom = false, coHom = false;
  for (let d = -1; d <= 8 && !toi; d++) {
    const ngay = GV.sangNgay(hom, d);
    for (const hm of L) {
      const tu = GV.lucCua(ngay, hm);
      if (H.kieu !== "pq" && !GV.thuOk(CF, tu)) continue;
      if (ngay === hom) coHom = true;
      if (tu <= now && now < tu + dai) { if (!dang) dang = { tu, den: tu + dai }; continue; }
      if (tu > now) { if (!toi) toi = tu; break; }
      if (ngay === hom) xongHom = true;
    }
  }
  // "đã kết thúc hôm nay": hôm nay có lần đã qua, không còn lần nào nữa trong hôm nay, không đang diễn ra (nhiều giờ một ngày: còn giờ sau -> chưa)
  if (dang || (toi && GV.vn(toi).ngay === hom)) xongHom = false;
  return { dang, toi, xongHom, coHom };
}
const conPhut = (t, now) => { const p = Math.max(0, Math.ceil((t - now) / 60000)); return p >= 60 ? `${Math.floor(p / 60)} giờ${p % 60 ? " " + (p % 60) + " phút" : ""}` : `${p} phút`; };
// trạng thái 1 hoạt động: { id, ten, bat, thu, gio, dang, tu, den, toi, xongHom, nghi, chu }
function trang(H, now) {
  const CF = CFcua(H.id); if (!CF) return null;
  const bat = CF.bat !== false, L = lanCua(H, CF, now), o = { id: H.id, ten: H.ten, bat, thu: H.kieu === "pq" ? null : (Array.isArray(CF.thu) && CF.thu.length < 7 ? CF.thu.slice() : null), gio: dsGio(H, CF),
    dang: false, tu: 0, den: 0, toi: L.toi || 0, xongHom: L.xongHom, nghi: H.kieu !== "pq" && !GV.thuOk(CF, now), chu: "", dai: daiCua(H, CF) };
  try {
    if (H.id === "phongHoa") {
      const p = MOD.phongHoa().lich();
      if (p.pha === "bd" || p.pha === "danh") { o.dang = true; o.tu = p.kc - (+CF.baoDanh || 0) * 60000; o.den = p.het; o.chu = p.pha === "bd" ? `Đang báo danh — khai chiến sau ${conPhut(p.kc, now)}` : `Đang đánh — còn ${conPhut(p.het, now)}`; }
      else if (L.dang) { o.xongHom = true; o.chu = "Trận hôm nay đã kết thúc"; }
    } else if (H.id === "bossTg") {
      // nhiều boss mỗi khung giờ (lượt 86 — boss-tg.js dsTT)
      const M = MOD.bossTg(), ds = M.dangCo() ? (M.dsTT ? M.dsTT("") || [] : [M.trangThai("")]).filter((b) => b && !b.ket) : [];
      if (ds.length) { o.dang = true; o.tu = L.dang ? L.dang.tu : now; o.den = Math.max(...ds.map((b) => b.het)); o.chu = ds.map((b) => `${b.ten} ở ${b.tenBai} — máu ${Math.max(1, Math.round((b.mau * 100) / Math.max(1, b.mauMax)))} %`).join("; "); }
      else if (L.dang) { o.xongHom = true; o.chu = "Boss đã bị hạ"; }
    } else if (H.id === "sanNhim") {
      const M = MOD.sanNhim(), s = M.dangCo() ? M.trangThai("") : null;
      if (s && !s.ket) { o.dang = true; o.tu = L.dang ? L.dang.tu : now; o.den = s.het; o.chu = `Còn ${s.con}/${s.so} con nhím`; }
      else if (L.dang) o.chu = "Đã bắt hết nhím đợt này";
    } else if (H.id === "ruongTb") {
      const ds = MOD.ruongTb().dong() || [];
      if (ds.length) { o.dang = true; o.tu = L.dang ? L.dang.tu : now; o.den = L.dang ? L.dang.den : now; o.chu = `Còn ${ds.length} rương chưa ai mở`; }
      else if (L.dang) { o.xongHom = true; o.chu = "Rương hôm nay đã được mở hết"; }
    } else if (H.id === "pld") {
      const M = MOD.pld(), l = M.lich(now);
      if (!l.nghi && l.t >= 0 && l.t < (+CF.capBo || 39)) {
        o.dang = true; o.tu = l.chuyen; o.den = l.chuyen + (+CF.capBo || 39) * 60000;
        o.chu = l.t < (+CF.baoDanh || 10) ? `Đang báo danh — thuyền chạy sau ${conPhut(l.chuyen + (+CF.baoDanh || 10) * 60000, now)}` : `Thuyền đang chạy — cập bờ Bắc sau ${conPhut(o.den, now)}`;
      }
    } else if (H.id === "tongKim") {
      // nhiều trận một ngày (như Săn Nhím): không ép xongHom; trận đã xong / không ai báo danh thì chỉ ghi chữ cho lần đang trong cửa sổ
      const p = MOD.tongKim().lich(now);
      if (p.pha === "bd" || p.pha === "danh") {
        o.dang = true; o.tu = p.u || (L.dang ? L.dang.tu : now); o.den = p.het;
        o.chu = p.pha === "bd" ? `Đang báo danh — khai chiến sau ${conPhut(p.kc, now)}` : `Đang đánh — Tống ${p.diem[0]} : Kim ${p.diem[1]}, còn ${conPhut(p.het, now)}`;
      } else if (L.dang) o.chu = p.pha === "xong" ? "Trận này đã kết thúc" : "Trận này không có ai báo danh";
      if (p.thienTu) o.chu += `${o.chu ? " · " : ""}Thiên Tử ×2`;
    } else if (H.id === "bauCua") {
      // Bầu Cua (anh 10/11): 1 ván 2 phút — 1 phút đặt cửa, 1 phút xem kết quả
      const v = MOD.bauCua().lich(now);
      if (v.pha !== "nghi") { o.dang = true; o.tu = v.tu; o.den = v.het; o.chu = `Ván ${v.k + 1}/${v.n} — ${v.pha === "dat" ? "đang nhận cược" : "vừa lắc, chờ ván sau"}`; }
      else if (L.dang) o.chu = "Sòng đã đóng";
    } else if (H.id === "duaNgua") {
      // đua ngựa (anh 16/11): mỗi khung 1 lượt — báo danh ở Truy Phong Sứ Giả (Ba Lăng) rồi đua; lượt thử của quản trị không hiện
      const p = MOD.duaNgua().lich();
      if (p.pha === "bd" || p.pha === "dua") {
        o.dang = true; o.tu = p.u || (L.dang ? L.dang.tu : now); o.den = p.pha === "bd" ? p.bat + (+CF.dua || 14) * 60000 : p.het;
        o.chu = p.pha === "bd" ? `Đang báo danh (${p.n} người) — xuất phát sau ${conPhut(p.bat, now)}` : `Đang đua — ${p.ve}/${p.soVe} người về đích, còn ${conPhut(p.het, now)}`;
      } else if (L.dang) o.chu = p.pha === "ket" ? (p.huy === "khong" ? "Lượt này không có ai báo danh" : "Lượt đua này đã kết thúc") : "Lượt đua này đã kết thúc";
    } else if (H.id === "phuQuy") {
      const hom = GV.vn(now).ngay, quay = GV.lucCua(hom, CF.quay);
      o.chu = now < quay ? `Chọn số tới ${CF.quay} hôm nay` : `Đã quay số — nhận thưởng tới ${CF.hetNhan} mai`;
      if (S.cho && S.cho.phuQuy) o.chu += ` · từ ${S.cho.phuQuy.tu.slice(8, 10)}/${S.cho.phuQuy.tu.slice(5, 7)}: quay ${S.cho.phuQuy.quay}`;
    }
  } catch (e) { console.error("Lịch hoạt động — trạng thái", H.id, e.message); }
  if (!o.bat && !o.dang) { o.chu = "Đang tạm dừng"; o.toi = 0; }
  return o;
}
// anh 16/11 — Báo Đáp Ân Sư (may-chu/bao-dap-an-su.js, nạp lúc dùng — map-c phương án A): sự kiện theo NGÀY, không theo giờ, không có trong HD (không ở F10 → Lịch
// hoạt động, không lưu lịch, không chặn khởi động lại — CHAN / kiem-lich chỉ xét id của mình; ngày sửa ở F10 → Cấu hình baoDapAnSu). 1 dòng thêm vào danh sách theo
// giờ (khung Hướng dẫn hoạt động vẽ như các dòng khác, chi tiết lấy mục Tra cứu lich "baoDapAnSu") — CHỈ trong cửa sổ ngày tu ≤ hôm nay < moHet: tới hết den "thu
// thập / làm / dâng", sau đó tới hết moHet chỉ còn mở hương bao. Ngoài cửa sổ / tắt (bat false) / module thiếu: không có dòng
const BD = () => require("./bao-dap-an-su");
const ddmm = (ngay) => `${String(ngay).slice(8, 10)}/${String(ngay).slice(5, 7)}`;
const laNgay = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
function chung() {
  if (!napXong) nap();
  const now = Date.now(), v = GV.vn(now);
  let tcv = "", ld = 0;
  try { tcv = require("./tra-cuu.js").lay().v; } catch {}
  return { t: now, hom: v.ngay, thu: v.thu, ds: HD.map((H) => trang(H, now)).filter(Boolean), tcv, ld: { ban: ld } };
}

// ---------- số lần đã làm hôm nay của 1 nhân vật ----------
function cuaToi(h, tk) {
  const hom = GV.vn().ngay, o = {};
  const thu = (f) => { try { return f(); } catch { return null; } };
  o.vuotAi = thu(() => { const VA = require("./vuot-ai.js"), S2 = h.vuotAi || {}; return [S2.ngay === hom ? S2.luot | 0 : 0, +VA.CF.luot || 4]; });
  o.satThu = thu(() => { const ST = require("./sat-thu.js"), S2 = h.satThu || {}; return [S2.ngay === hom ? S2.dem | 0 : 0, +ST.CF.moiNgay || 8]; });
  o.daTau = thu(() => { const DT = h.daTau || {}, gh = +((require("./do.js").NOI.CFG.daTau || {}).gioiHan) || 40; return [DT.ngay === hom ? DT.soNgay | 0 : 0, gh]; });
  o.minhChu = thu(() => { const MC = require("./minh-chu.js"); if ((h.lvl || 1) < (+MC.CF.cap || 120)) return null; const P = h.mc && typeof h.mc === "object" ? h.mc : {}, x = P.ngay === hom ? P.xong || {} : {}; return [["giet", "thu", "hai"].filter((k) => x[k]).length, 3]; });
  o.sanNhim = thu(() => { const SN = require("./san-nhim.js"); return [SN.demNgay ? SN.demNgay(h.name) : 0, +SN.CF.ngay || 10]; });
  o.online = thu(() => { const ON = require("./online.js"), O = h.onl || {}; return [O.ngay === hom ? (O.nhan || []).length : 0, (ON.MOC || []).length || 3]; });
  o.laHan = thu(() => { const d = require("./do.js").NOI.BY.get("ms:23"), T = h.tlh || {}; return [T.ngay === hom ? T.n | 0 : 0, (d && d.dung && d.dung.lanNgay) || 10]; });
  o.uyThac = thu(() => { const U = h.uyThac || {}, gh = +((require("./do.js").NOI.CFG.uyThac || {}).gioNgay) || 12; return [U.ngay === hom ? Math.floor((U.dung || 0) / 3600) : 0, gh]; });
  o.dangNhap = thu(() => (tk ? !require("./do.js").dnCho(tk) : null));
  // Huân công bài Tống Kim nhận hôm nay / tối đa (may-chu/tong-kim.js traoThuong — h.tkNgay)
  o.tkHc = thu(() => { const T = h.tkNgay || {}; return [T.ngay === hom ? T.hc | 0 : 0, +((MOD.tongKim().CF.thuong || {}).hcNgay) || 2]; });
  // Tế Đàn bang hội (bang hội đợt 2 — may-chu/bang-hoi.js teDanNay): [đã điểm danh 0|1, 1] khi là thành viên bang cấp ≥ 1 (không ẩn sỹ); còn lại null
  // Báo Đáp Ân Sư (anh 16/11 — bao-dap-an-su.js h.bdas): [Ngũ Sắc Hương Bao đã dâng Võ Sư hôm nay, tối đa dang.lanNgay] khi sự kiện đang thu thập / làm / dâng; ngoài: null
  // (khung Hướng dẫn chỉ đọc khi có dòng NGAY "baoDapAnSu" — chưa có thì bỏ qua)
  return o;
}

// ---------- quản trị (F10 → Lịch hoạt động) ----------
const loi = (msg) => { throw Object.assign(new Error(msg), { code: 400 }); };
const chuoiGio = (H, CF) => H.kieu === "mot" ? CF.gio || "" : H.kieu === "ds" ? (CF.gio || []).join(", ") : H.kieu === "gio" ? (CF.gio || []).join(", ") : "";
function xem() {
  if (!napXong) nap();
  const now = Date.now();
  return {
    gio: now, ds: HD.map((H) => {
      const CF = CFcua(H.id); if (!CF) return null;
      const t = trang(H, now), M = MAC[H.id] || {};
      return { id: H.id, ten: H.ten, kieu: H.kieu, bat: CF.bat !== false, gio: chuoiGio(H, CF), quay: CF.quay, hetNhan: CF.hetNhan,
        thu: H.kieu === "pq" ? null : Array.isArray(CF.thu) && CF.thu.length < 7 ? CF.thu.slice() : [0, 1, 2, 3, 4, 5, 6],
        so: H.so.map(([k, n, a, b, buoc]) => [k, n, a, b, +CF[k] || 0, buoc || 1]), mac: { gio: chuoiGio(H, M), quay: M.quay, hetNhan: M.hetNhan, so: H.so.map(([k]) => M[k]) },
        daSua: !!S[H.id], sua: S.sua[H.id] || null, cho: H.id === "phuQuy" && S.cho && S.cho.phuQuy ? S.cho.phuQuy : null, tt: t };
    }).filter(Boolean),
  };
}
// đọc + kiểm b thành giá trị lịch của H (ném lỗi 400 nếu sai)
function docB(H, CF, b) {
  const v = { bat: b.bat !== false && b.bat !== 0 && b.bat !== "0" };
  if (H.kieu === "mot") { const g = String(b.gio || "").trim(); if (!GV.hopLe(g)) loi(`${H.ten}: giờ phải dạng HH:MM, ví dụ 19:00`); v.gio = g; }
  if (H.kieu === "ds") {
    const L = [...new Set(String(b.gio || "").split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean))];
    if (!L.length || L.length > 24) loi(`${H.ten}: nhập 1–24 giờ dạng HH:MM, cách nhau dấu phẩy`);
    for (const g of L) if (!GV.hopLe(g)) loi(`${H.ten}: "${g}" không phải giờ HH:MM`);
    v.gio = L.sort();
  }
  if (H.kieu === "gio") {
    const L = [...new Set(String(b.gio || "").split(/[,;\s]+/).filter(Boolean).map((x) => x.trim()))];
    if (!L.length || L.length > 24) loi(`${H.ten}: nhập 1–24 giờ (số 0–23), cách nhau dấu phẩy`);
    const so = L.map((x) => { if (!/^\d{1,2}$/.test(x) || +x > 23) loi(`${H.ten}: "${x}" không phải giờ 0–23`); return +x; });
    v.gio = so.sort((a, c) => a - c);
  }
  if (H.kieu === "pq") {
    for (const k of ["quay", "hetNhan"]) { const g = String(b[k] || "").trim(); if (!GV.hopLe(g)) loi(`${H.ten}: giờ phải dạng HH:MM`); v[k] = g; }
  } else {
    const T = Array.isArray(b.thu) ? [...new Set(b.thu.map((x) => x | 0).filter((x) => x >= 0 && x <= 6))].sort() : [0, 1, 2, 3, 4, 5, 6];
    if (!T.length) loi(`${H.ten}: chọn ít nhất 1 ngày trong tuần (muốn ngừng hẳn thì bỏ ô Bật)`);
    v.thu = T;
  }
  for (const [k, n, a, c, buoc] of H.so) {
    const b0 = b[k] == null ? CF[k] : b[k], x = buoc ? +(Math.round(+b0 / buoc) * buoc).toFixed(2) : Math.round(+b0); // thiếu ô (trang cũ chưa có ô mới): giữ số đang chạy
    if (!Number.isFinite(x) || x < a || x > c) loi(`${H.ten}: ${n.toLowerCase()} phải từ ${a} tới ${c}`);
    v[k] = x;
  }
  if (H.id === "phongHoa" && v.chuSoai >= v.danh) loi(`${H.ten}: Chủ soái phải ra trước khi hết giờ đánh (nhỏ hơn ${v.danh} phút)`);
  if (H.id === "tongKim") {
    // Nguyên soái: phe ít điểm ≤ phe kia < giờ đánh; 2 trận liền nhau (cả qua nửa đêm) cách ít nhất báo danh + đánh + giữ bảng kết quả — không thì giờ
    // trận sau tới khi trận trước chưa xong (tong-kim.js bỏ qua giờ đó)
    if (!(v.soai1 <= v.soai2 && v.soai2 < v.danh)) loi(`${H.ten}: phút Nguyên soái phải thỏa phe ít điểm ≤ phe kia < giờ đánh (${v.danh} phút)`);
    const can = v.baoDanh + v.danh + Math.ceil((+CF.giuKq || 120) / 60), P = v.gio.map(GV.phutCua).sort((a, c) => a - c);
    for (let i = 0; i < P.length; i++) { const sau = i + 1 < P.length ? P[i + 1] : P[0] + 1440; if (sau - P[i] < can) loi(`${H.ten}: 2 trận phải cách nhau ít nhất ${can} phút (báo danh + đánh + giữ bảng kết quả)`); }
  }
  if (H.id === "duaNgua") {
    // đua ngựa: 2 lượt liền nhau (cả qua nửa đêm) cách ít nhất báo danh + đua + 1 phút giữ kết quả — không thì giờ lượt sau tới khi lượt trước chưa xong (dua-ngua.js bỏ khung đó)
    const can = Math.ceil(v.baoDanh + v.dua + 1), P = v.gio.map(GV.phutCua).sort((a, c) => a - c);
    for (let i = 0; i < P.length; i++) { const sau = i + 1 < P.length ? P[i + 1] : P[0] + 1440; if (sau - P[i] < can) loi(`${H.ten}: 2 lượt phải cách nhau ít nhất ${can} phút (báo danh + đua + giữ kết quả)`); }
  }
  return v;
}
const moTa = (H, v) => [v.bat ? "bật" : "TẮT", H.kieu === "pq" ? `quay ${v.quay}, nhận tới ${v.hetNhan}` : `giờ ${Array.isArray(v.gio) ? v.gio.join(", ") : v.gio}`,
  v.thu && v.thu.length < 7 ? v.thu.map((d) => THU[d]).join(", ") : "", ...H.so.map(([k, n]) => `${n.toLowerCase()} ${v[k]}`)].filter(Boolean).join(" · ");
function sauKhiDoi() {
  try { require("./tra-cuu.js").lamMoi(); } catch {}
  try { WS().guiHet({ t: "lichHd" }); } catch {}
  try { WS().guiHet({ t: "phLich", l: MOD.phongHoa().lich() }); } catch {}
}
function luu(qt, b) {
  if (!napXong) nap();
  const H = BY.get(String(b.id || "")); if (!H) loi("Không có hoạt động này");
  const CF = CFcua(H.id); if (!CF) loi("Hoạt động chưa nạp được");
  const v = docB(H, CF, b);
  if (H.kieu === "pq") {
    // Phú Quý: bật / tắt ngay; giờ quay / hạn nhận đổi -> áp dụng từ ngày mai
    S.cho = S.cho || {};
    const doiGio = v.quay !== CF.quay || v.hetNhan !== CF.hetNhan;
    if (doiGio) S.cho.phuQuy = { quay: v.quay, hetNhan: v.hetNhan, tu: GV.sangNgay(GV.vn().ngay, 1) }; else delete S.cho.phuQuy;
    S.phuQuy = { ...(S.phuQuy || chup(H, CF)), bat: v.bat };
    ap(H, CF, { bat: v.bat });
  } else {
    S[H.id] = v; ap(H, CF, v);
  }
  S.sua[H.id] = { ai: qt.ten, luc: Date.now() }; ghi();
  NK().ghi("qt", qt.ten, null, `Lịch hoạt động — ${H.ten}: ${moTa(H, { ...v, thu: v.thu })}${H.kieu === "pq" && S.cho && S.cho.phuQuy ? " (giờ mới áp dụng từ ngày mai)" : ""}`);
  sauKhiDoi();
  return xem();
}
function macDinh(qt, b) {
  if (!napXong) nap();
  const H = BY.get(String(b.id || "")); if (!H) loi("Không có hoạt động này");
  const CF = CFcua(H.id), M = MAC[H.id]; if (!CF || !M) loi("Hoạt động chưa nạp được");
  if (H.kieu === "pq") {
    // Phú Quý: bật lại ngay; giờ quay / hạn nhận về mặc định từ ngày mai (như Lưu — đổi giữa ngày làm số đã chọn lệch đợt)
    S.cho = S.cho || {};
    if (M.quay !== CF.quay || M.hetNhan !== CF.hetNhan) S.cho.phuQuy = { quay: M.quay, hetNhan: M.hetNhan, tu: GV.sangNgay(GV.vn().ngay, 1) }; else delete S.cho.phuQuy;
    ap(H, CF, { bat: M.bat !== false });
    if (S.cho.phuQuy) S.phuQuy = { ...(S.phuQuy || chup(H, CF)), bat: M.bat !== false }; else delete S.phuQuy;
  } else {
    delete S[H.id]; if (S.cho) delete S.cho[H.id];
    ap(H, CF, { ...M, thu: M.thu || [0, 1, 2, 3, 4, 5, 6] });
  }
  S.sua[H.id] = { ai: qt.ten, luc: Date.now(), mac: 1 }; ghi();
  NK().ghi("qt", qt.ten, null, `Lịch hoạt động — ${H.ten}: về mặc định (${moTa(H, { ...M, thu: M.thu || [0, 1, 2, 3, 4, 5, 6] })})`);
  sauKhiDoi();
  return xem();
}
function quanTri(qt, b) {
  const viec = String(b.viec || "xem");
  if (viec === "xem") return xem();
  if (viec === "luu") return luu(qt, b);
  if (viec === "macDinh") return macDinh(qt, b);
  loi("Việc không hợp lệ");
}

module.exports = { chung, cuaToi, quanTri, nap, HD };
