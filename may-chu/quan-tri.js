// Bảng quản trị trong game (anh 28/10 "làm bảng quản trị trong game cho tài khoản quản trị: người chơi, khóa / đá, gửi quà, thông báo, nhật ký
// hoạt động") — POST /api/quan-tri/<việc>, chỉ tài khoản quản trị (api.js kiểm tra trước). Trình duyệt: src/game/quantri.js (phím F10).
//   ds        {}                               -> { ds: [tài khoản: nhân vật, đang chơi / vắng, khóa, IP], may: tình trạng máy chủ }
//   tk        { ten }                          -> { tk: chi tiết — từng nhân vật: ngân lượng, Xu, đồ mặc, túi, rương }
//   soi       { ten, o }                       -> { nv: đồ đang mặc đủ chi tiết như món thật + chỉ số cho ô xem món } (anh 30/10 "soi đồ")
//   xu-ly     { ten, viec, lyDo?, gio?, mk? }  -> { msg }   viec: da (đá ra khỏi game) | khoa (gio giờ, 0 = vĩnh viễn) | mo-khoa |
//                                                         doi-mk | tao (tạo tài khoản thường) | doi-mk-minh { cu, mk } (mật khẩu của
//                                                         chính tài khoản quản trị đang dùng bảng — anh 29/10)
//   qua       { ten, o, tien?, xu?, mon?: [{ k, n?, dong?, he? }], loi? } -> { msg, ds }   (may-chu/do.js taoQua)
//   mon       { q }                            -> { ds: món tìm được để gửi quà }
//   ma-qua    { viec: ds | tao | tat | mo | xoa | lay | sua, … } -> mã kích hoạt (anh 29/10 — may-chu/ma-qua.js quanTri)
//   thong-bao { t }                            -> { msg }   tin hệ thống tới mọi người đang chơi + dòng chữ giữa trên màn hình
//   ghim { t } | { bo: 1 } | {}                -> { msg?, ghim: { id, t? } }   dòng ghim đầu khung chat của mọi người (anh 03/11 — lưu du-lieu/ghim.json)
//   nhat-ky   { ngay?, tk?, loai?: [..], q?, n? } -> { ngay, ngays, tong, ds }   (may-chu/nhat-ky.js)
//   bao-tri   { bat, den?, loi? }              -> { baoTri }  bảo trì: chỉ tài khoản quản trị vào game, tới giờ den tự mở (may-chu/bao-tri.js — anh 31/10 khuya)
//   lich-hd   { viec: xem | luu | macDinh, id, bat, gio, thu, … } -> { gio, ds }  lịch 7 hoạt động theo giờ (Tống Kim — 06/11), áp dụng ngay (may-chu/lich-hd.js — anh 05/11)
//   qua-tat   { ai: tat | dang, tien?, xu?, mon?, loi?, cao?, khoa? } -> { msg, ds }   quà toàn máy chủ vào thẳng nhân vật (anh 04/11 — quaTat);
//             cao: mỗi tài khoản chỉ nhân vật cấp cao nhất, khoa: món khóa bảo hiểm vĩnh viễn (anh 10/11 "nút tích là được")
//   xu-ly viec giai-ket { ten, o } | cap { ten, o, lv } | phai { ten, o, fac }   giải kẹt về Ba Lăng / tăng cấp / chuyển môn phái (anh 04/11)
//   xu-ly viec gioi { ten, o, sex: "m" | "f" (giới mới), xem? } -> { msg } | xem: { xem: { tu, sang, mon, ra } }   đổi giới tính nhân vật (anh 14/11 — doiGioi)
//   xu-ly viec toi { ten } -> { toi: { z, x, y, chung, ten, bai } }  quản trị dịch chuyển tới chỗ người đang chơi (anh 10/11 "tele lên chỗ ng chơi
//         a chọn" — chỉ thôn / thành / bãi luyện công); nhan { ten, t }  tin riêng của GM (anh 10/11 "gửi tn trực tiếp qua bảng GM" — tk.gmTin,
//         nhịp api.js gửi gmTin: khung báo + dòng kênh Mật; vắng thì lần vào game sau); chu { ten, chu }  gắn người chơi (chủ) của tài khoản
//   tạo tài khoản: chu = người chơi (tên Zalo / số điện thoại); cau-hinh.json taiKhoan.toiDaMoiNguoi > 0 (S2: 2 — anh 10/11 "giới hạn đúng 1 ng 2
//   acc bên sv mới") thì bắt buộc nhập và không tạo quá số đó cho cùng 1 người. Danh sách / chi tiết mang ips (các IP đăng nhập gần đây — api.js
//   dangNhap tk.ips) để bảng gom tài khoản trùng IP
// Nghi tăng tốc trình duyệt (may-chu/chong-hack.js): tk.nghiHack hiện ở danh sách / chi tiết; xu-ly viec "bo-hack" xóa cờ (đã nhắc người chơi);
// "bo-hack-het" { duoi? } xóa hàng loạt cờ CŨ (bộ dò trước 11/11, không có v) hệ số < duoi (mặc định ×2; giữ cờ nặng + cờ bộ dò mới; 0 = xóa hết).
// Nghi dùng công cụ (anh 13/11 — may-chu/nghi-tool.js, npc-gan.js): tk.nghiTool (mã + bằng chứng) — danh sách mang tool = tóm tắt { lan, luc, ma, nv, manh },
// chi tiết mang cả cờ; may.tool = số tài khoản có cờ; xu-ly viec "bo-tool" xóa cờ (làm được cả tài khoản quản trị — cờ do anh tự thử). Không tự khóa ai.
// Khóa: tk.khoaTk = { den (ms, 0 = vĩnh viễn), lyDo, boi, luc } — đăng nhập bị từ chối (api.js dangNhap), hết hạn tự mở. Đá / khóa / đổi mật
// khẩu: thu phiên đang dùng (tk.phien = null), giữ tk.biDa = { phien cũ, lyDo, khoa } để lần hỏi sau của trình duyệt đó nhận đúng câu báo
// (api.js matPhien -> ma "bi-da" / "bi-khoa"; trình duyệt về màn đăng nhập kèm câu báo). Không xử lý tài khoản quản trị (kể cả của mình).
// Quà: ghi thẳng vào nhân vật + h.quaTin (câu báo) — nhịp sau của nhân vật đó (đang chơi, hoặc lần vào sau) nhận túi mới + khung báo quà.
// Bang hội (anh 14/11 — may-chu/bang-hoi.js quanTri): bang-hoi { lam: ds | xem (id) | doiTen (id, ten) | chuyenChu (id, ten nhân vật) | quaKhao (id) | giaiTan (id) |
//   congCao (id, m) | duDieuKien } -> { ds?, bang? (kèm tên tài khoản thành viên — chỉ quản trị thấy), msg }; xóa tài khoản: các nhân vật rời bang, bang chủ tự chuyển cho
//   trưởng lão nhiều cống hiến nhất (bang hết người thì giải tán); chi tiết nhân vật có leadLv (cấp thống soái — điều kiện lập bang D3).
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const D = require("./du-lieu");
const TG = require("./the-gioi");
const DO = require("./do");
const NK = require("./nhat-ky");
const KTN = require("./khoa-tai-nguyen"); // khóa / xóa / đặt lại mật khẩu -> thu hồi phiếu tài nguyên ngay (chống sao chép — lượt 61)
const MQ = require("./ma-qua");
const BT = require("./bao-tri");
const DY = require("./duyet"); // duyệt người chơi vào game (anh 11/11 khuya)
const LHD = () => require("./lich-hd"); // lịch hoạt động — GM chỉnh giờ (anh 05/11)
const BM = require("./bao-mat"); // khóa an toàn: trạng thái mật khẩu, xóa mật khẩu cấp 2, bắt đổi mật khẩu đăng nhập (anh 10/11)
const NT = require("./nghi-tool"); // nghi dùng công cụ (anh 13/11): tóm tắt cờ cho danh sách, bỏ phần đệm khi xóa cờ
const ND = require("./nghi-dame"); // nghi hack sát thương (anh 16/11): bỏ phần chờ ghi khi xóa cờ
const BH = () => require("./bang-hoi"); // bang hội (anh 14/11): thẻ F10 "Bang hội", xóa tài khoản rời bang
const CHR = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/char.json"), "utf8")); // factions (môn phái — hệ, phe), start (chỉ số gốc theo hệ / giới tính)

const LY_DO_MAX = 100, TB_MAX = 200, LOI_MAX = 100;
// giải kẹt: bãi Ba Lăng huyện (trình duyệt START_ZONE — chỗ đứng mặc định của bản đồ); phái chỉ nhận 1 giới (như src/game/main.js SEX_ONLY);
// phe theo phái (char.json factions[].camp -> số như script SetCamp: 1 chính, 2 tà, 3 trung lập)
const BA_LANG = 53, SEX_ONLY = {} /* anh 16/11 mở luật giới tính phái (client: { shaolin: "m", emei: "f", cuiyan: "f" }) — src/game/main.js SEX_ONLY */, PHE ={ C_JUSTICE: 1, C_EVIL: 2, C_BALANCE: 3 };
const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const loi = (msg, code = 400) => { throw Object.assign(new Error(msg), { code }); };
const sach = (s, n) => String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const tkCua = (ten) => D.docTk(ten) || loi(`Không có tài khoản ${D.tenTk(ten)}`, 404);
// "21:05 28/10" giờ Việt Nam (UTC+7, không đổi giờ mùa)
const p2 = (n) => String(n).padStart(2, "0");
const gioVN = (t) => { const d = new Date(t + 7 * 3600e3); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}`; };

// khóa còn hiệu lực -> tk.khoaTk | null (hết hạn thì mở luôn)
function khoaCon(tk) {
  const k = tk.khoaTk; if (!k) return null;
  if (k.den && Date.now() >= k.den) { delete tk.khoaTk; D.ghiTk(tk); return null; }
  return k;
}
const cauKhoa = (k) => `Tài khoản đã bị khóa ${k.den ? `tới ${gioVN(k.den)}` : "vĩnh viễn"}${k.lyDo ? `. Lý do: ${k.lyDo}` : ""}`;
const cauDa = (lyDo) => `Bạn đã bị quản trị đưa ra khỏi game${lyDo ? `. Lý do: ${lyDo}` : ""}`;
// thu phiên đang dùng của tk (chưa ghi file)
function thuPhien(tk, lyDo, khoa) {
  if (tk.phien) tk.biDa = { phien: tk.phien, lyDo, khoa: khoa ? 1 : 0, luc: Date.now() };
  tk.phien = null;
}

// hack: số tài khoản bị nghi hack — ds() đếm luôn từ danh sách vừa đọc (anh 11/11: trước đọc lại toàn bộ tệp tài khoản lần 2 chỉ để đếm, mỗi 10 giây
// lúc bảng F10 mở — cả máy chủ đứng)
function may(dang, soTk, hack, tool) {
  let saoLuu = null;
  try { saoLuu = fs.readdirSync(path.join(D.ROOT, "sao-luu")).filter((d) => /^\d{4}-\d\d-\d\d$/.test(d)).sort().pop() || null; } catch {}
  return { dang, tk: soTk, chay: Math.round(process.uptime()), ram: process.memoryUsage().rss, ramMay: os.totalmem(), ramTrong: os.freemem(), tai: os.loadavg()[0], saoLuu,
    baoTri: BT.tomTat(), duyet: DY.tomTat(), hack: hack ?? D.dsTk().filter((tk) => tk.nghiHack).length, tool: tool ?? D.dsTk().filter((tk) => tk.nghiTool).length }; // tool: số tài khoản nghi dùng công cụ (anh 13/11)
}
const nvGon = (h, o) => ({ o, name: h.name, lvl: h.lvl || 1, fac: h.fac ?? null, series: h.series | 0, sex: h.sex === "f" ? "f" : "m", gold: h.gold || 0, xu: h.xu | 0, last: h.last || null });
// các IP đăng nhập gần đây của tài khoản (mới trước; tài khoản cũ chỉ có tk.ip — lần cuối)
const ipsCua = (tk) => [...new Set([...(Array.isArray(tk.ips) ? tk.ips : []), ...(tk.ip ? [tk.ip] : [])])].slice(0, 10);
// người chơi (chủ) của tài khoản: so không dấu, bỏ khoảng trắng / chấm / gạch ("0912 345 678" = "0912345678")
const khoaChu = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[\s.\-_+]+/g, "");
const toiDaMoiNguoi = () => Math.max(0, Math.floor(+((DO.NOI.CFG.taiKhoan || {}).toiDaMoiNguoi) || 0));
function kiemChu(chu, boQua) {
  const n = toiDaMoiNguoi(); if (!n) return;
  const k = khoaChu(chu), co = D.dsTk().filter((t) => t.ten !== boQua && t.chu && khoaChu(t.chu) === k).map((t) => t.ten);
  if (co.length >= n) loi(`Người chơi “${chu}” đã có ${co.length} tài khoản (${co.join(", ")}) — máy chủ này tối đa ${n} tài khoản mỗi người`);
}

function ds(ctx) {
  const dang = new Map(TG.dsDangChoi().map((x) => [x.tk, x]));
  const L = D.dsTk().map((tk) => {
    const d = dang.get(tk.ten), k = khoaCon(tk);
    return { ten: tk.ten, admin: !!tk.admin, tao: tk.tao || null, vao: tk.vao || null, ip: tk.ip || null, ips: ipsCua(tk), ...(tk.chu ? { chu: tk.chu } : {}), mo: ctx.online(tk.ten),
      ...(DY.co(tk.ten) ? { duyet: 1 } : {}), // đã duyệt vào game (may-chu/duyet.js)
      mk: { b: tk.batDoiMk ? 1 : 0, c2: tk.mk2 ? 1 : 0 }, // khóa an toàn: còn mật khẩu quản trị cấp (chưa đổi) / đã có mật khẩu cấp 2
      ...(k ? { khoa: { den: k.den || 0, lyDo: k.lyDo || "" } } : {}), ...(tk.nghiHack ? { hack: tk.nghiHack } : {}),
      ...(tk.nghiTool ? { tool: NT.tomTat(tk.nghiTool) } : {}), // nghi dùng công cụ (anh 13/11 — danh sách chỉ mang tóm tắt, bằng chứng ở chi tiết)
      ...(tk.nghiDame ? { dame: { lan: tk.nghiDame.lan | 0, luc: tk.nghiDame.luc || 0, nv: tk.nghiDame.nv || "", x: +tk.nghiDame.x || 0 } } : {}), // nghi hack sát thương (anh 16/11 — may-chu/nghi-dame.js)
      ...(d ? { dang: { name: d.name, lvl: d.lvl, bai: DO.tenBai(d.zone) || `bản đồ ${d.zone}` } } : {}),
      nv: tk.nv.map((h, o) => h && nvGon(h, o)).filter(Boolean) };
  });
  // đang chơi trước, rồi mới vào gần đây trước
  L.sort((a, b) => !!b.dang - !!a.dang || (b.vao || 0) - (a.vao || 0));
  const M = may(dang.size, L.length, L.filter((x) => x.hack).length, L.filter((x) => x.tool && x.tool.manh).length); // tool: chỉ tín hiệu mạnh (anh 13/11 tối)
  M.dame = L.filter((x) => x.dame).length; // nghi hack sát thương (anh 16/11)
  return { ds: L, may: M };
}

function chiTiet(ten) {
  const tk = tkCua(ten), k = khoaCon(tk), d = TG.dangChoi(tk.ten);
  return { tk: { ten: tk.ten, admin: !!tk.admin, tao: tk.tao || null, vao: tk.vao || null, ip: tk.ip || null, ips: ipsCua(tk), ...(tk.chu ? { chu: tk.chu } : {}), mk: BM.tomTat(tk),
    ...(DY.co(tk.ten) ? { duyet: 1 } : {}),
    ...(k ? { khoa: { den: k.den || 0, lyDo: k.lyDo || "", boi: k.boi || "", luc: k.luc || null } } : {}), ...(tk.nghiHack ? { hack: tk.nghiHack } : {}),
    ...(tk.nghiTool ? { tool: { ...tk.nghiTool, manh: (NT.tomTat(tk.nghiTool) || {}).manh || 0 } } : {}), // nghi dùng công cụ: mã + bằng chứng (anh 13/11)
    ...(tk.nghiDame ? { dame: tk.nghiDame } : {}), // nghi hack sát thương: số lần, lần vượt lớn nhất, bằng chứng (anh 16/11 — may-chu/nghi-dame.js)
    ...(d ? { dang: { name: d.name, lvl: d.lvl, bai: DO.tenBai(d.zone) || `bản đồ ${d.zone}` } } : {}),
    nv: tk.nv.map((h, o) => h && { ...nvGon(h, o), exp: h.exp || 0, leadLv: h.leadLv || 1, tienRuong: h.tienRuong || 0, bai: DO.tenBai(h.zone), tao: h.created || null, // leadLv: cấp thống soái (anh 14/11 — điều kiện lập bang)
      mac: Object.entries(h.equip || {}).filter(([, it]) => it && it.k).map(([slot, it]) => ({ slot, ...DO.monTin(it) })),
      tui: (h.bag || []).map(DO.monTin), ruong: [...(h.ruong || []), ...(h.ruongPhu || []).flat()].filter((it) => it && it.k).map(DO.monTin),
      quaCho: (h.quaTin || []).length + (h.quaCho || []).length }).filter(Boolean) } };
}

// soi đồ nhân vật o của tài khoản ten (anh 30/10 "soi đồ của nhân vật đang mang — muốn kiểm tra người nào đó"): món đang mặc nguyên như
// lưu (ngũ hành, dòng xanh, độ bền, hạn…) + cấp / giới tính / hệ / phái / điểm gốc + điểm cộng — trình duyệt tính yêu cầu đủ / thiếu và
// dòng ẩn được kích theo chính nhân vật đó (src/game/windows.js soiDo)
function soi(ten, o) {
  const tk = tkCua(ten), h = tk.nv[o | 0];
  if (!h) loi("Không có nhân vật này", 404);
  return { nv: { ten: tk.ten, o: o | 0, name: h.name, lvl: h.lvl || 1, sex: h.sex === "f" ? "f" : "m", series: h.series | 0, fac: h.fac ?? null,
    start: h.start || {}, attr: h.attr || {}, equip: Object.fromEntries(Object.entries(h.equip || {}).filter(([, it]) => it && it.k).map(([s, it]) => [s, { ...it }])) } };
}

// đổi giới tính nhân vật (anh 14/11 "Tạo thêm tính năng đổi giới tính cho admin"): xu-ly viec "gioi" { ten, o, sex: giới MỚI (bấm 2 lần không đổi ngược), xem? }.
// Luật như lúc tạo nhân vật / chuyển phái: phái chỉ nhận 1 giới (SEX_ONLY — Thiếu Lâm nam, Nga My / Thúy Yên nữ) thì chặn; chưa vào phái (không chờ đổi phái) mà hệ
// không có phái nào nhận giới mới (hệ Thủy nam — src/game/main.js createScreen; Tiếp dẫn chỉ nhận phái cùng hệ) thì chặn. Đồ đang mặc chỉ hợp giới cũ (do-goc.json
// sex = requiresex của client, như do.js yeuCau "Chỉ nam / nữ mặc được": áo — Phi Phong it.pp đi theo áo, mũ, giày, dây chuyền, hộ uyển, ngọc bội) cất vào hành trang,
// ô trống đầu tiên (món to trước); thiếu chỗ thì chặn, không ghi gì — không mất đồ. Hình nhân vật = giới + kiểu dáng đồ còn mặc (mũ = đầu + tóc — DO.chuan tính lại
// looks), chỉ số gốc start theo hệ + giới mới (char.json — như chuyển phái). Giới do trình duyệt lưu (api.js luuNv) -> tài khoản đang đăng nhập thì thu phiên trước
// (về màn đăng nhập kèm câu báo — như chuyển phái), vào lại là giới mới. xem: chỉ kiểm + trả { xem: { tu, sang, mon, ra } } cho khung hỏi của F10, không ghi
const GIOI = { m: "nam", f: "nữ" };
// đọc lần đầu đổi giới tính: GOC = assets/data/do-goc.json items (yêu cầu giới của món); PHAI_VAO = mã các phái vào được — skills.json factions như P.factions của trình duyệt
// (Tiếp dẫn / tạo nhân vật: 10 phái; char.json còn Hoa Sơn đã bỏ 24/10 — không tính)
let GOC = null, PHAI_VAO = null;
function doiGioi(qt, tk, b, ctx) {
  const o = b.o | 0, h = o >= 0 && o < D.SLOT_N && tk.nv[o];
  if (!h) loi("Ô này không có nhân vật", 404);
  const cu = h.sex === "f" ? "f" : "m", moi = b.sex === "f" || b.sex === "m" ? b.sex : null;
  if (!moi) loi("Chọn giới tính mới");
  if (moi === cu) loi(`${h.name} đã là nhân vật ${GIOI[cu]}`);
  const F = CHR.factions || [], f = h.fac != null ? F.find((x) => x.id === h.fac) : null, sx = f && SEX_ONLY[f.key];
  if (sx && sx !== moi) loi(`${h.name} đang ở ${f.n} — phái chỉ nhận đệ tử ${GIOI[sx]}, không đổi sang ${GIOI[moi]} được (chuyển phái khác trước)`);
  if (!PHAI_VAO) PHAI_VAO = new Set((JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/web/skill/skills.json"), "utf8")).factions || []).filter((x) => !x.nhap).map((x) => x.id));
  if (h.fac == null && !h.doiPhai && !F.some((x) => PHAI_VAO.has(x.id) && x.series === (h.series | 0) && (!SEX_ONLY[x.key] || SEX_ONLY[x.key] === moi)))
    loi(`Hệ ${HE[h.series | 0]} không có môn phái nhận đệ tử ${GIOI[moi]} — ${h.name} chưa vào phái, đổi sang ${GIOI[moi]} thì không bái nhập được phái nào`);
  if (!GOC) GOC = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/do-goc.json"), "utf8")).items || {};
  const dt = (it) => { const [w, c] = DO.coMon(it); return w * c; };
  const cat = Object.entries(h.equip || {}).filter(([, it]) => it && it.k && (GOC[it.k] || {}).sex && GOC[it.k].sex !== moi).sort((x, y) => dt(y[1]) - dt(x[1]));
  const ten = cat.map(([, it]) => DO.tenMon(it).trim());
  for (const [, it] of cat) if (!DO.NOI.vaoTui(h, it)) loi(`Hành trang của ${h.name} không đủ chỗ cất ${cat.length} món chỉ ${GIOI[cu]} mặc được (${ten.join(", ")}) — nhắn người chơi dọn hành trang rồi đổi lại`);
  const ra = !!(tk.phien || TG.dangChoi(tk.ten));
  if (b.xem) return { xem: { tu: cu, sang: moi, mon: ten, ra: ra ? 1 : 0 } }; // tk đọc mới từ tệp mỗi lần hỏi: món vừa thử cất ở trên không ghi
  for (const [s] of cat) delete h.equip[s];
  h.sex = moi;
  const st = (CHR.start || []).find((x) => x.series === (h.series | 0) && x.sex === (moi === "f" ? 1 : 0)); if (st) h.start = { ...st };
  DO.chuan(h); // kiểu dáng (looks) theo đồ còn mặc
  if (ra) { thuPhien(tk, `quản trị vừa đổi giới tính nhân vật ${h.name} — đăng nhập lại để vào game`, false); TG.roi(tk.ten); ctx.roi(tk.ten); }
  D.ghiTk(tk);
  NK.ghi("qt", qt.ten, null, `Đổi giới tính ${h.name} (${tk.ten}): ${GIOI[cu]} -> ${GIOI[moi]}${cat.length ? ` — cất ${cat.length} món vào hành trang: ${ten.join(", ")}` : ""}`, cat.length ? { mon: cat.map(([, it]) => NK.mon(it)) } : {});
  NK.ghi("nv", tk.ten, h.name, `Đổi giới tính ${GIOI[cu]} -> ${GIOI[moi]} (quản trị ${qt.ten})${cat.length ? ` — cất ${cat.length} món chỉ ${GIOI[cu]} mặc được vào hành trang: ${ten.join(", ")}` : ""}`);
  return { msg: `Đã đổi ${h.name} sang ${GIOI[moi]}${cat.length ? ` — cất ${cat.length} món chỉ ${GIOI[cu]} mặc được vào hành trang` : ""}${ra ? " — đã đưa người đó ra màn đăng nhập" : ""}` };
}

function xuLy(qt, b, ctx) {
  const viec = String(b.viec || ""), lyDo = sach(b.lyDo, LY_DO_MAX);
  if (viec === "tao") {
    const chu = sach(b.chu, 40), n = toiDaMoiNguoi();
    if (n && !chu) loi(`Nhập người chơi (tên Zalo / số điện thoại) — máy chủ này tối đa ${n} tài khoản mỗi người`);
    if (chu) kiemChu(chu, null);
    let tk; try { tk = D.taoTk(b.ten, b.mk, false); } catch (e) { loi(e.message); }
    if (chu) tk.chu = chu;
    tk.batDoiMk = 1; D.ghiTk(tk); // khóa an toàn (anh 10/11): mật khẩu quản trị cấp -> đăng nhập lần đầu phải tự đổi mới vào game (may-chu/bao-mat.js)
    NK.ghi("qt", qt.ten, null, `Tạo tài khoản ${tk.ten}${chu ? ` — người chơi ${chu}` : ""}`);
    return { msg: `Đã tạo tài khoản ${tk.ten}${chu ? ` (người chơi ${chu})` : ""} — lần đăng nhập đầu người chơi phải tự đổi mật khẩu` };
  }
  // đổi mật khẩu của chính mình (anh 29/10 "quản lý sever thêm cái đổi mk" — các việc dưới không làm với tài khoản quản trị): phải đúng mật
  // khẩu hiện tại; giữ phiên đang dùng (D.doiMk xóa phiên — mỗi tài khoản 1 phiên, nơi khác đã bị đăng xuất khi đăng nhập ở đây)
  // từ 10/11 (khóa an toàn — rà soát): đổi mật khẩu của mình đi qua /api/bao-mat doiMk1 (luật chung: ≥ 6 ký tự, khác tên, khác mật khẩu cấp 2, nhập
  // sai tính vào khóa nhập, nhật ký "mk") — bảng F10 mở khung Đổi mật khẩu đăng nhập; đường cũ này không dùng nữa
  if (viec === "doi-mk-minh") loi("Đổi mật khẩu của bạn: bấm ổ khóa an toàn → Đổi mật khẩu đăng nhập");
  // nhân vật mẫu cho bot Tống Kim (anh 09/11 — làm được cả nhân vật của tài khoản quản trị): may-chu/tong-kim.js MAU_BOT
  if (viec === "ds-mau-bot" || viec === "mau-bot" || viec === "bo-mau-bot") {
    const TK = require("./tong-kim.js");
    if (viec === "mau-bot") {
      const t = tkCua(b.ten), o = b.o | 0, h = o >= 0 && o < D.SLOT_N && t.nv[o];
      if (!h) loi("Ô này không có nhân vật", 404);
      let capNhat; try { capNhat = TK.mauBotThem(h); } catch (e) { loi(e.message); }
      NK.ghi("qt", qt.ten, null, `${capNhat ? "Cập nhật" : "Thêm"} mẫu bot Tống Kim: ${h.name} (cấp ${h.lvl || 1})`);
      return { msg: `${capNhat ? "Đã cập nhật" : "Đã thêm"} mẫu bot từ ${h.name} — áp dụng từ trận sau`, ds: TK.mauBotDs() };
    }
    if (viec === "bo-mau-bot") {
      let m; try { m = TK.mauBotXoa(b.i); } catch (e) { loi(e.message); }
      NK.ghi("qt", qt.ten, null, `Xóa mẫu bot Tống Kim: ${m.ten}`);
      return { msg: `Đã xóa mẫu bot ${m.ten}`, ds: TK.mauBotDs() };
    }
    return { ds: TK.mauBotDs() };
  }
  // xóa cờ nghi tăng tốc HÀNG LOẠT (anh 11/11 "cho anh cái xóa cờ hàng loạt" — 94 cờ ×1,25–×1,38 báo nhầm lúc máy cũ bị ghìm CPU, chong-hack.js
  // đã sửa): chỉ xóa cờ CŨ của bộ dò trước (không có nghiHack.v) có hệ số đồng hồ < duoi (mặc định ×2). Giữ lại: cờ ×duoi trở lên + mọi cờ của bộ
  // dò mới (v = CH.BAN — bộ dò mới không báo nhầm khi máy chủ / mạng kẹt, cờ mới là nghi thật: rà soát 11/11) để quản trị xem từng người;
  // duoi 0 = xóa hết. Lưu như "bo-hack" (D.ghiTk từng tệp); nhật ký "hack" cũ vẫn giữ, tên tài khoản đã xóa cờ ở trường ds của dòng nhật ký
  if (viec === "bo-hack-het") {
    const het = b.duoi === 0, duoi = +b.duoi > 1 ? +b.duoi : 2, d = String(duoi).replace(".", ",");
    const co = D.dsTk().filter((t) => t.nghiHack), xoa = co.filter((t) => het || (!t.nghiHack.v && !(+t.nghiHack.x >= duoi))), giu = co.length - xoa.length;
    if (!xoa.length) loi(giu ? `Còn ${giu} cờ cần xem từng người (×${d} trở lên hoặc do bộ dò mới bắt)` : "Không có tài khoản nào đang có cờ nghi tăng tốc");
    for (const t of xoa) { delete t.nghiHack; D.ghiTk(t); }
    NK.ghi("qt", qt.ten, null, `Xóa cờ nghi tăng tốc hàng loạt${het ? "" : ` (cờ cũ dưới ×${d})`}: ${xoa.length} tài khoản${giu ? `, giữ ${giu} cờ` : ""}${lyDo ? ` — ${lyDo}` : ""}`, { ds: xoa.map((t) => t.ten) });
    return { msg: `Đã xóa cờ nghi tăng tốc của ${xoa.length} tài khoản${giu ? ` — giữ lại ${giu} cờ (×${d} trở lên hoặc do bộ dò mới bắt) để xem từng người` : ""}` };
  }
  const tk = tkCua(b.ten);
  // xóa cờ nghi dùng công cụ (anh 13/11 — may-chu/nghi-tool.js): đã xem bằng chứng / đã nhắc; nhật ký "tool" vẫn giữ. Làm được cả tài khoản quản trị (cờ do anh thử)
  // xóa cờ nghi hack sát thương (anh 16/11 — may-chu/nghi-dame.js): đã xem bằng chứng / đã nhắc; nhật ký "hack" vẫn giữ
  if (viec === "bo-dame") {
    if (!tk.nghiDame) loi(`${tk.ten} không có cờ nghi hack sát thương`);
    const C = tk.nghiDame; delete tk.nghiDame; D.ghiTk(tk); ND.xoa(tk.ten);
    NK.ghi("qt", qt.ten, null, `Xóa cờ nghi hack sát thương của ${tk.ten} (${C.lan | 0} lần, lớn nhất ×${String(+C.x || 0).replace(".", ",")})${lyDo ? ` — ${lyDo}` : ""}`);
    return { msg: `Đã xóa cờ nghi hack sát thương của ${tk.ten}` };
  }
  if (viec === "bo-tool") {
    if (!tk.nghiTool) loi(`${tk.ten} không có cờ nghi dùng công cụ`);
    const C = tk.nghiTool; delete tk.nghiTool; D.ghiTk(tk); NT.xoa(tk.ten);
    NK.ghi("qt", qt.ten, null, `Xóa cờ nghi dùng công cụ của ${tk.ten} (${C.lan | 0} lần: ${(Array.isArray(C.ma) ? C.ma : []).join(", ")})${lyDo ? ` — ${lyDo}` : ""}`);
    return { msg: `Đã xóa cờ nghi dùng công cụ của ${tk.ten}` };
  }
  if (tk.admin) loi("Không xử lý tài khoản quản trị từ bảng này");
  if (viec === "toi") { // dịch chuyển tới chỗ nhân vật đang chơi (mốc vị trí mới nhất — the-gioi.js dangChoi); khu đặc biệt (thuyền, ải, Tống Kim…) thì không
    const d = TG.dangChoi(tk.ten); if (!d) loi(`${tk.ten} không đang chơi`);
    const Z = DO.NOI.ZONES.get(d.zone);
    if (Z && Z.bang) loi(`${d.name} đang ở ${Z.n} — khu vực bang hội mỗi bang một bản riêng, không dịch chuyển tới được`); // đợt 4
    if (!Z || !(DO.NOI.FARM.has(Z.kind) || DO.NOI.THANH.has(Z.kind))) loi(`${d.name} đang ở ${Z ? Z.n : "khu đặc biệt"} — chỉ dịch chuyển tới được thôn, thành, bãi luyện công`);
    NK.ghi("qt", qt.ten, null, `Dịch chuyển tới ${d.name} (${tk.ten}) ở ${Z.n}`);
    return { toi: { z: d.zone, x: d.x, y: d.y, chung: d.chung ? 1 : 0, ten: d.name, bai: Z.n }, msg: `Dịch chuyển tới ${d.name} ở ${Z.n}${d.chung ? " (bản quái chung)" : ""}` };
  }
  if (viec === "nhan") { // tin riêng của GM: nhịp sau của tài khoản đó (đang chơi: ngay; vắng: lần vào game sau)
    const t = sach(b.t, TB_MAX); if (!t) loi("Tin nhắn trống");
    tk.gmTin = [...(Array.isArray(tk.gmTin) ? tk.gmTin : []), { t, luc: Date.now() }].slice(-20); D.ghiTk(tk);
    const dang = TG.dangChoi(tk.ten);
    NK.ghi("tb", qt.ten, null, `Nhắn riêng ${tk.ten}${dang ? ` (${dang.name})` : ""}: ${t}`);
    return { msg: `Đã gửi tin cho ${tk.ten}${dang ? ` — ${dang.name} đang chơi, nhận ngay` : " — đang vắng, lần vào game sau sẽ nhận"}` };
  }
  if (viec === "chu") { // gắn / đổi / bỏ người chơi (chủ) của tài khoản
    const chu = sach(b.chu, 40);
    if (chu) kiemChu(chu, tk.ten);
    const cu = tk.chu || "";
    if (chu) tk.chu = chu; else delete tk.chu;
    D.ghiTk(tk);
    NK.ghi("qt", qt.ten, null, `Người chơi của ${tk.ten}: ${cu || "—"} -> ${chu || "—"}`);
    return { msg: chu ? `Đã gắn ${tk.ten} cho người chơi ${chu}` : `Đã bỏ người chơi của ${tk.ten}` };
  }
  if (viec === "da") {
    if (!tk.phien && !TG.dangChoi(tk.ten)) loi(`${tk.ten} không đăng nhập`);
    thuPhien(tk, lyDo, false); D.ghiTk(tk); TG.roi(tk.ten); ctx.roi(tk.ten);
    NK.ghi("qt", qt.ten, null, `Đá ${tk.ten} ra khỏi game${lyDo ? ` — ${lyDo}` : ""}`);
    return { msg: `Đã đưa ${tk.ten} ra khỏi game` };
  }
  if (viec === "xoa-tk") { // anh 09/11 "cho admin quyền xóa tài khoản": đưa ra khỏi game rồi chuyển tệp sang da-xoa/ (D.xoaTk — xóa nhầm vẫn cứu được)
    // kho bang hội đang khóa (tệp đọc lỗi / hỏng — soát 14/11): phần bang hội của lần xóa sẽ bị bỏ qua -> mở khóa xong tài khoản đã xóa vẫn là bang chủ: chặn trước khi đá / xóa
    { const kh = BH().khoaKho(); if (kh) loi(`Kho bang hội đang khóa (${kh}) — xử lý ở F10 → Bang hội rồi mới xóa tài khoản (cần chặn gấp thì Khóa tài khoản)`); }
    const nv = tk.nv.filter(Boolean).map((h) => `${h.name} (cấp ${h.lvl || 1})`).join(", ") || "chưa có nhân vật";
    thuPhien(tk, lyDo || "Tài khoản đã bị xóa", true); D.ghiTk(tk); TG.roi(tk.ten); ctx.roi(tk.ten);
    // bang hội (anh 14/11): nhân vật rời bang; bang chủ tự chuyển cho trưởng lão nhiều cống hiến nhất (rồi cấp cao nhất), bang hết người thì giải tán — trước khi chuyển tệp
    let bh = []; try { bh = BH().xoaTk(tk.ten, qt.ten); } catch (e) { console.error("Xóa tài khoản — bang hội:", e.message); }
    D.xoaTk(tk.ten); KTN.thuHoi(tk.ten);
    NK.ghi("qt", qt.ten, null, `Xóa tài khoản ${tk.ten} — ${nv}${bh.length ? ` — bang hội: ${bh.join("; ")}` : ""}${lyDo ? ` — ${lyDo}` : ""}`);
    return { msg: `Đã xóa tài khoản ${tk.ten} (${nv})${bh.length ? ` — bang hội: ${bh.join("; ")}` : ""}` };
  }
  if (viec === "khoa") {
    const gio = Math.max(0, Math.min(24 * 3650, +b.gio || 0)), t = Date.now();
    tk.khoaTk = { den: gio ? t + gio * 3600e3 : 0, lyDo, boi: qt.ten, luc: t };
    thuPhien(tk, lyDo, true); D.ghiTk(tk); TG.roi(tk.ten); ctx.roi(tk.ten); KTN.thuHoi(tk.ten, tk.khoaTk.den);
    const han = gio ? `tới ${gioVN(tk.khoaTk.den)}` : "vĩnh viễn";
    NK.ghi("qt", qt.ten, null, `Khóa ${tk.ten} ${han}${lyDo ? ` — ${lyDo}` : ""}`);
    return { msg: `Đã khóa ${tk.ten} ${han}` };
  }
  if (viec === "mo-khoa") {
    if (!khoaCon(tk)) loi(`${tk.ten} không bị khóa`);
    delete tk.khoaTk; D.ghiTk(tk); KTN.traLai(tk.ten);
    NK.ghi("qt", qt.ten, null, `Mở khóa ${tk.ten}`);
    return { msg: `Đã mở khóa ${tk.ten}` };
  }
  if (viec === "bo-hack") { // xóa cờ nghi tăng tốc (đã nhắc / xem lại thấy không phải) — nhật ký vẫn giữ các lần đã ghi
    if (!tk.nghiHack) loi(`${tk.ten} không có cờ nghi tăng tốc`);
    delete tk.nghiHack; D.ghiTk(tk);
    NK.ghi("qt", qt.ten, null, `Xóa cờ nghi tăng tốc của ${tk.ten}${lyDo ? ` — ${lyDo}` : ""}`);
    return { msg: `Đã xóa cờ nghi tăng tốc của ${tk.ten}` };
  }
  if (viec === "gioi") return doiGioi(qt, tk, b, ctx); // đổi giới tính (anh 14/11)
  // ---- quản lý nhân vật (anh 04/11 "giải kẹt, đưa người chơi về Ba Lăng nếu bị kẹt; tăng cấp độ; chuyển môn phái thông qua bảng điều khiển admin")
  if (viec === "giai-ket" || viec === "cap" || viec === "phai") {
    const o = b.o | 0, h = o >= 0 && o < D.SLOT_N && tk.nv[o];
    if (!h) loi("Ô này không có nhân vật", 404);
    const d = TG.dangChoi(tk.ten), dang = !!d && d.name === h.name;
    // giải kẹt: chỗ lưu = Ba Lăng (chỗ đứng mặc định — lần vào sau ở đó) + luôn đặt lệnh h.qtDi (GIU — bản trình duyệt lưu không xóa được): nhịp
    // đầu tiên của nhân vật này (đang chơi: ngay; tab còn mở nhưng vừa rớt mạng: khi chạy lại — bản đó có thể đã ghi đè viTri) chuyển về Ba Lăng
    // (api.js qtDi — soát lượt 90). Rời ải / thuyền / trận bằng đường này thì các hoạt động tự bỏ trạng thái như khi đổi bãi
    if (viec === "giai-ket") {
      h.viTri = { z: BA_LANG }; delete h.tuDanh;
      h.qtDi = { z: BA_LANG, tin: "Quản trị đã đưa bạn về Ba Lăng huyện (giải kẹt)" };
      D.ghiTk(tk);
      NK.ghi("qt", qt.ten, null, `Giải kẹt ${h.name} (${tk.ten}) — về Ba Lăng${dang ? " (đang chơi)" : ""}`);
      return { msg: dang ? `Đã đưa ${h.name} về Ba Lăng — đang chơi, chuyển ngay` : `Đã đặt ${h.name} về Ba Lăng — lần vào game sau (hoặc khi game của người đó chạy lại) đứng ở Ba Lăng` };
    }
    // tăng cấp: chỉ lên (hạ cấp làm điểm kỹ năng đã cộng vượt số điểm -> máy chủ xóa võ công); kinh nghiệm của cấp về 0. Đang chơi: nhịp sau
    // trình duyệt nhận cấp mới (nv) như lên cấp thường + câu báo (h.qtTin)
    if (viec === "cap") {
      const cu = h.lvl || 1, lv = Math.floor(+b.lv || 0);
      if (!(lv > cu)) loi(`Cấp mới phải lớn hơn cấp hiện tại (${cu})`);
      if (lv > DO.MAX_LEVEL) loi(`Cấp tối đa là ${DO.MAX_LEVEL}`);
      h.lvl = lv; h.exp = 0;
      h.qtTin = [...(h.qtTin || []), `Quản trị đã nâng nhân vật lên cấp ${lv}`].slice(-10);
      D.ghiTk(tk);
      NK.ghi("qt", qt.ten, null, `Tăng cấp ${h.name} (${tk.ten}): ${cu} -> ${lv}`); NK.ghi("cap", tk.ten, h.name, `Lên cấp ${lv} (quản trị ${qt.ten})`);
      return { msg: `Đã nâng ${h.name} từ cấp ${cu} lên cấp ${lv}` };
    }
    // chuyển môn phái (tín vật môn phái vẫn chưa dùng — anh 04/11): như công cụ thử đổi phái (src/game/devtool.js setFaction) + hệ theo phái
    // mới (mỗi phái 1 hệ — chỉ số gốc start theo hệ / giới tính như lúc tạo nhân vật), phái 1 giới như lúc tạo nhân vật; võ công, sách 90 / 120,
    // cấp tối thiểu từ sách bỏ — điểm kỹ năng trả lại, người chơi cộng lại. Phái / võ công do trình duyệt giữ (bản đang mở sẽ ghi đè) -> đang
    // đăng nhập thì thu phiên trước (về màn đăng nhập kèm câu báo), vào lại là phái mới
    const f = (CHR.factions || []).find((x) => x.id === +b.fac && !x.nhap);
    if (!f || b.fac === "" || b.fac == null) loi("Chọn môn phái cần chuyển");
    if (h.fac === f.id) loi(`${h.name} đang ở ${f.n}`);
    if ((h.lvl || 1) < 10) loi("Nhân vật dưới cấp 10 chưa vào phái được (như Tiếp dẫn đệ tử của client)");
    const sx = SEX_ONLY[f.key], gioi = h.sex === "f" ? "f" : "m";
    if (sx && sx !== gioi) loi(`${f.n} chỉ nhận đệ tử ${sx === "f" ? "nữ" : "nam"}`);
    const cu = h.fac, heCu = h.series | 0;
    const ra = !!(tk.phien || d);
    if (ra) { thuPhien(tk, `quản trị vừa chuyển nhân vật ${h.name} sang ${f.n} — đăng nhập lại để vào game`, false); TG.roi(tk.ten); ctx.roi(tk.ten); }
    h.fac = f.id; h.facKey = f.key; h.camp = PHE[f.camp] || 0; delete h.rank;
    if (heCu !== f.series) { h.series = f.series; const st = (CHR.start || []).find((s) => s.series === f.series && s.sex === (gioi === "f" ? 1 : 0)); if (st) h.start = { ...st }; }
    h.skills = {}; h.books = []; h.skMin = {}; delete h.skPts;
    // đang chờ bái nhập sau khi dùng Tín vật môn phái (may-chu/doi-phai.js — soát 11/11): bỏ chờ, không thì api.js luuNv giữ Vô Môn Phái; dpV: bản lưu cũ không ghi đè
    delete h.doiPhai; h.dpV = (h.dpV | 0) + 1;
    D.ghiTk(tk);
    const tenCu = cu == null ? "Vô Môn Phái" : ((CHR.factions || []).find((x) => x.id === cu) || {}).n || `phái ${cu}`;
    NK.ghi("qt", qt.ten, null, `Chuyển ${h.name} (${tk.ten}) từ ${tenCu} sang ${f.n}${heCu !== f.series ? ` (hệ ${HE[heCu]} -> ${HE[f.series]})` : ""}`);
    return { msg: `Đã chuyển ${h.name} sang ${f.n}${heCu !== f.series ? ` (hệ ${HE[f.series]})` : ""}${ra ? " — đã đưa người đó ra màn đăng nhập" : ""}` };
  }
  if (viec === "doi-mk") {
    const cu = tk.phien;
    try { D.doiMk(tk.ten, b.mk); } catch (e) { loi(e.message); } // đăng xuất mọi nơi
    KTN.thuHoi(tk.ten); // + phiếu tài nguyên hết dùng tới khi đăng nhập lại bằng mật khẩu mới (lượt 61)
    // mật khẩu quản trị đặt lại -> đăng nhập lần tới phải tự đổi (khóa an toàn — anh 10/11); mật khẩu cấp 2 giữ nguyên (quên thì Xóa mk cấp 2)
    const t2 = D.docTk(tk.ten); t2.batDoiMk = 1;
    if (cu) t2.biDa = { phien: cu, lyDo: "quản trị vừa đổi mật khẩu tài khoản này", khoa: 0, luc: Date.now() };
    D.ghiTk(t2); BM.khoaLai(tk.ten); BM.xoaSai(tk.ten); // quản trị đã xác minh chủ tài khoản: gỡ khóa nhập do nhập sai trước đó (rà soát 10/11)
    TG.roi(tk.ten); ctx.roi(tk.ten);
    NK.ghi("qt", qt.ten, null, `Đổi mật khẩu ${tk.ten}`);
    NK.ghi("mk", tk.ten, null, `Quản trị ${qt.ten} đặt lại mật khẩu đăng nhập — lần đăng nhập tới phải tự đổi`);
    return { msg: `Đã đổi mật khẩu ${tk.ten} — tài khoản đó bị đăng xuất, lần đăng nhập tới phải tự đổi mật khẩu` };
  }
  if (viec === "xoa-mk2") { // người chơi quên mật khẩu cấp 2 (lựa chọn 3a: chỉ quản trị xóa, sau khi xác minh)
    if (!BM.xoaMk2(tk, qt.ten)) loi(`${tk.ten} chưa có mật khẩu cấp 2`);
    D.ghiTk(tk);
    NK.ghi("qt", qt.ten, null, `Xóa mật khẩu cấp 2 của ${tk.ten}`, { ip: ctx.ip });
    return { msg: `Đã xóa mật khẩu cấp 2 của ${tk.ten} — lần tới cần giao dịch / bày bán / vứt / hủy đồ, người chơi sẽ được hỏi đặt mật khẩu mới` };
  }
  loi("Việc không rõ");
}

function qua(qt, b) {
  const tk = tkCua(b.ten), o = b.o | 0, h = o >= 0 && o < D.SLOT_N && tk.nv[o];
  if (!h) loi("Ô này không có nhân vật", 404);
  const loiNhan = sach(b.loi, LOI_MAX), ds = DO.taoQua(h, b);
  h.quaTin = [...(h.quaTin || []), { luc: Date.now(), ds, ...(loiNhan ? { loi: loiNhan } : {}) }].slice(-20);
  D.ghiTk(tk);
  NK.ghi("qt", qt.ten, null, `Gửi quà cho ${h.name} (${tk.ten}): ${ds.join(", ")}${loiNhan ? ` — "${loiNhan}"` : ""}`);
  return { msg: `Đã gửi quà cho ${h.name}`, ds };
}

// quà toàn máy chủ (anh 04/11 "thêm chức năng gửi quà cho toàn server, gửi trực tiếp tới người chơi luôn"): b.ai = "tat" mọi nhân vật của mọi
// tài khoản thường (cả người đang vắng) | "dang" chỉ nhân vật đang chơi; không gửi tài khoản quản trị. Mỗi nhân vật nhận như Gửi quà (do.js taoQua —
// trang bị gieo dòng riêng từng người, khung báo quà ở nhịp sau); túi không đủ chỗ: quà vào h.quaCho, mỗi nhịp thử lại (api.js), báo 1 câu
// nhân vật cấp cao nhất của tài khoản (bằng cấp: nhiều kinh nghiệm hơn, rồi vào game gần nhất) — quà toàn máy chủ "chỉ cấp cao nhất"
const caoNhat = (nv) => nv.filter(Boolean).reduce((a, h) => (!a || (h.lvl | 0) > (a.lvl | 0) || ((h.lvl | 0) === (a.lvl | 0) && ((+h.exp || 0) > (+a.exp || 0)
  || ((+h.exp || 0) === (+a.exp || 0) && (+h.last || 0) > (+a.last || 0)))) ? h : a), null);
// anh 10/11: "cho anh lựa chọn phát quà toàn sv, chỉ phát acc cấp cao nhất của mỗi tài khoản, có lựa chọn vật phẩm khoá vĩnh viễn và k khoá, nút
// tích là dc" — b.cao: mỗi tài khoản chỉ nhân vật cấp cao nhất (gửi "chỉ người đang chơi" thì vốn mỗi tài khoản 1 nhân vật — bỏ qua); b.khoa: món
// khóa bảo hiểm vĩnh viễn (kbh 2 — như thưởng thăng cấp / online; Mật đồ thần bí luôn không khóa — do.js taoQua). Tiền, Xu không phải món
function quaTat(qt, b) {
  const loiNhan = sach(b.loi, LOI_MAX), dang = b.ai === "dang", cao = !!b.cao && !dang, khoa = !!b.khoa;
  const q = { tien: b.tien, xu: b.xu, mon: b.mon, ...(khoa ? { kbh: DO.NOI.KBH_VV } : {}) };
  const ds = DO.taoQua({ bag: [], uN: 0, gold: 0, xu: 0 }, q); // kiểm quà trên nhân vật trống: món không có / chưa chọn quà -> báo, không gửi ai
  const t = Date.now(), them = loiNhan ? { loi: loiNhan } : {};
  let so = 0, cho = 0;
  for (const tk of D.dsTk()) {
    if (tk.admin) continue;
    const d = dang ? TG.dangChoi(tk.ten) : null;
    if (dang && !d) continue;
    let doi = false;
    const chon = cao ? caoNhat(tk.nv) : null;
    for (const h of tk.nv) {
      if (!h || (dang && h.name !== d.name) || (chon && h !== chon)) continue;
      try { const ds1 = DO.taoQua(h, q); h.quaTin = [...(h.quaTin || []), { luc: t, ds: ds1, ...them }].slice(-20); so++; }
      catch { h.quaCho = [...(h.quaCho || []), { ...q, ...them, luc: t }]; h.qtTin = [...(h.qtTin || []), "Quản trị gửi quà nhưng hành trang không đủ chỗ — dọn túi là tự nhận"].slice(-10); cho++; }
      doi = true;
    }
    if (doi) D.ghiTk(tk);
  }
  if (!so && !cho) loi(dang ? "Không có ai đang chơi" : "Chưa có nhân vật nào để gửi");
  NK.ghi("qt", qt.ten, null, `Gửi quà toàn máy chủ (${dang ? "người đang chơi" : cao ? "nhân vật cấp cao nhất mỗi tài khoản" : "mọi nhân vật"}${khoa ? ", món khóa vĩnh viễn" : ""}): ${ds.join(", ")} — ${so} nhân vật nhận${cho ? `, ${cho} chờ (túi đầy)` : ""}${loiNhan ? ` — "${loiNhan}"` : ""}`);
  return { msg: `Đã gửi quà cho ${so + cho} nhân vật${cho ? ` (${cho} nhân vật túi đầy — quà chờ, dọn túi là nhận)` : ""}`, ds };
}

function thongBao(qt, b) {
  const t = sach(b.t, TB_MAX); if (!t) loi("Thông báo trống");
  TG.thongBao(`Thông báo: ${t}`, true);
  NK.ghi("tb", qt.ten, null, t);
  return { msg: "Đã gửi thông báo tới mọi người đang chơi" };
}

// ghim ở khung chat (anh 03/11 "làm 1 cái ghim cho admin, để gửi thông báo code hay gì mới" — chọn kiểu 1: dòng [Ghim] đầu khung chat, người
// chơi bấm × ẩn trên máy mình tới khi có ghim mới): du-lieu/ghim.json = { id, t?, boi, luc }; trình duyệt nhận qua nhịp (api.js nhip gh — chỉ khi
// mã ghim khác mã nó đang có). b = { t } ghim (thay ghim cũ) | { bo: 1 } bỏ ghim | {} xem
const TEP_GHIM = path.join(D.ROOT, "ghim.json");
let GHIM = (() => { try { const g = JSON.parse(fs.readFileSync(TEP_GHIM, "utf8")); return g && g.t ? g : { id: 0 }; } catch { return { id: 0 }; } })();
const ghimNay = () => (GHIM.t ? { id: GHIM.id, t: GHIM.t } : { id: 0 });
function ghim(qt, b) {
  if (!b.bo && b.t == null) return { ghim: ghimNay() };
  const t = b.bo ? "" : sach(b.t, TB_MAX); if (!b.bo && !t) loi("Nội dung ghim trống");
  GHIM = t ? { id: Math.max(Date.now(), (GHIM.id || 0) + 1), t, boi: qt.ten, luc: Date.now() } : { id: 0, boi: qt.ten, luc: Date.now() };
  try { fs.mkdirSync(D.ROOT, { recursive: true }); fs.writeFileSync(TEP_GHIM, JSON.stringify(GHIM)); } catch (e) { console.error("Ghi ghim lỗi: " + e.message); }
  NK.ghi("tb", qt.ten, null, t ? `Ghim: ${t}` : "Bỏ ghim");
  return { msg: t ? "Đã ghim lên khung chat của mọi người" : "Đã bỏ ghim", ghim: ghimNay() };
}

// duyệt người chơi vào game (anh 11/11 khuya — may-chu/duyet.js): viec "xem" | "bat" | "tat" | "them" (ds: tài khoản hoặc tên nhân vật, nhiều cái cách
// nhau dấu phẩy / chấm phẩy / xuống dòng) | "bo" (ten). Mỗi người 1 tài khoản: tài khoản ghi người chơi (tk.chu) mà người đó đã có tài khoản khác được
// duyệt -> không duyệt; trùng IP đăng nhập gần đây với tài khoản đã duyệt -> duyệt nhưng báo (cùng wifi nhà / quán net cũng trùng — anh tự xem)
const IP_NOI = /^(::1|127\.|::ffff:127\.)/;
function duyetXem(msg) {
  const L = DY.ds().map(({ ten, luc, boi }) => {
    const tk = D.docTk(ten);
    return { ten, luc, boi, co: !!tk, ...(tk && tk.chu ? { chu: tk.chu } : {}), ip: (tk && tk.ip) || null, nv: tk ? tk.nv.map((h, o) => h && nvGon(h, o)).filter(Boolean) : [] };
  }).sort((a, b) => b.luc - a.luc);
  return { ...(msg ? { msg } : {}), duyet: { ...DY.tomTat(), ds: L } };
}
function duyet(qt, b) {
  const v = String(b.viec || "xem");
  if (v === "bat" || v === "tat") { DY.dat(qt, v === "bat"); return duyetXem(v === "bat" ? `Đã BẬT duyệt — chỉ quản trị + ${DY.tomTat().n} tài khoản đã duyệt vào game` : "Đã TẮT duyệt — mọi tài khoản vào game như thường"); }
  if (v === "bo") {
    const ten = D.tenTk(b.ten);
    if (!DY.bo(qt, ten)) loi(`${ten || "?"} chưa có trong danh sách duyệt`);
    return duyetXem(`Đã bỏ duyệt ${ten}${DY.bat() ? " — tài khoản này không vào game được nữa" : ""}`);
  }
  if (v === "them") {
    const tu = [...new Set(String(b.ds || "").split(/[,;\n]+/).map((s) => s.normalize("NFC").trim()).filter(Boolean))].slice(0, 50);
    if (!tu.length) loi("Nhập ID tài khoản hoặc tên nhân vật");
    const all = D.dsTk(), theoTen = new Map(all.map((t) => [t.ten, t])), ket = [];
    const daDuyet = () => all.filter((t) => DY.co(t.ten));
    for (const s of tu) {
      let tk = theoTen.get(D.tenTk(s));
      if (!tk) { // không phải tên tài khoản: tìm theo tên nhân vật (không phân biệt hoa thường)
        const k = s.toLowerCase(), L = all.filter((t) => (t.nv || []).some((h) => h && String(h.name || "").normalize("NFC").toLowerCase() === k));
        if (L.length > 1) { ket.push({ s, ok: 0, ly: `nhiều tài khoản có nhân vật tên này (${L.map((t) => t.ten).join(", ")}) — nhập ID tài khoản` }); continue; }
        tk = L[0];
      }
      if (!tk) { ket.push({ s, ok: 0, ly: "không thấy tài khoản / nhân vật này" }); continue; }
      if (tk.admin) { ket.push({ s, ten: tk.ten, ok: 0, ly: "tài khoản quản trị — luôn vào được, không cần duyệt" }); continue; }
      if (DY.co(tk.ten)) { ket.push({ s, ten: tk.ten, ok: 0, ly: "đã duyệt rồi" }); continue; }
      if (tk.chu) { // mỗi người 1 tài khoản
        const trung = daDuyet().find((t) => t.ten !== tk.ten && t.chu && khoaChu(t.chu) === khoaChu(tk.chu));
        if (trung) { ket.push({ s, ten: tk.ten, ok: 0, ly: `người chơi “${tk.chu}” đã có tài khoản được duyệt: ${trung.ten} — mỗi người 1 tài khoản (muốn đổi thì bỏ duyệt ${trung.ten} trước)` }); continue; }
      }
      const ipTa = new Set(ipsCua(tk).filter((ip) => ip && !IP_NOI.test(ip)));
      const trungIp = daDuyet().filter((t) => t.ten !== tk.ten && ipsCua(t).some((ip) => ipTa.has(ip))).map((t) => t.ten);
      DY.them(qt, tk.ten);
      ket.push({ s, ten: tk.ten, ok: 1, ...(trungIp.length ? { canh: `trùng IP với tài khoản đã duyệt: ${trungIp.join(", ")} — xem có phải cùng 1 người không` } : {}) });
    }
    const n = ket.filter((x) => x.ok).length;
    return { ...duyetXem(`Đã duyệt ${n} / ${ket.length}`), ket };
  }
  return duyetXem();
}

// thao tác hàng loạt (anh 17/11 "lọc ra các tài khoản chưa có nv, chưa online trong 1 thời gian nào đó, xong cho chọn tất cả rồi thao tác hàng loạt như duyệt,
// xóa tài khoản"): { viec: "duyet" | "boDuyet" | "xoa", ds: [tên tài khoản] (≤ LOAT_MAX), lyDo? } -> { msg, ket: [{ ten, ok, ly? }] }. Tài khoản quản trị bỏ qua.
// Duyệt đi đúng đường Duyệt vào game (mỗi người 1 tài khoản, cảnh báo trùng IP). Xóa giống xóa lẻ (xu-ly xoa-tk: rời bang, tệp sang da-xoa/ — cứu được) nhưng
// BỎ QUA tài khoản đang chơi / đang đăng nhập (muốn xóa thì đá ra rồi xóa ở chi tiết)
const LOAT_MAX = 1000;
function loat(qt, b, ctx) {
  const v = String(b.viec || ""), lyDo = sach(b.lyDo, LY_DO_MAX);
  const ds = [...new Set((Array.isArray(b.ds) ? b.ds : []).map((s) => D.tenTk(String(s || ""))).filter(Boolean))];
  if (!ds.length) loi("Chưa chọn tài khoản nào");
  if (ds.length > LOAT_MAX) loi(`Mỗi lần tối đa ${LOAT_MAX} tài khoản`);
  const ket = [], tom = (lam) => { const ok = ket.filter((x) => x.ok).length, bo = ket.filter((x) => !x.ok);
    return `${lam} ${ok} / ${ket.length} tài khoản${bo.length ? ` — bỏ qua ${bo.length}: ${bo.slice(0, 6).map((x) => `${x.ten} (${x.ly})`).join(", ")}${bo.length > 6 ? "…" : ""}` : ""}`; };
  if (v === "duyet") {
    for (let i = 0; i < ds.length; i += 50) { const r = duyet(qt, { viec: "them", ds: ds.slice(i, i + 50).join(",") }); for (const k of r.ket || []) ket.push({ ten: k.ten || k.s, ok: k.ok ? 1 : 0, ...(k.ly ? { ly: k.ly } : {}), ...(k.canh ? { canh: k.canh } : {}) }); }
    NK.ghi("qt", qt.ten, null, `Duyệt hàng loạt: ${ket.filter((x) => x.ok).length} / ${ket.length} tài khoản`, { ds: ket.filter((x) => x.ok).map((x) => x.ten) });
    return { msg: tom("Đã duyệt"), ket, duyet: duyetXem().duyet };
  }
  if (v === "boDuyet") {
    for (const ten of ds) { if (DY.bo(qt, ten)) ket.push({ ten, ok: 1 }); else ket.push({ ten, ok: 0, ly: "chưa duyệt" }); }
    NK.ghi("qt", qt.ten, null, `Bỏ duyệt hàng loạt: ${ket.filter((x) => x.ok).length} / ${ket.length} tài khoản`, { ds: ket.filter((x) => x.ok).map((x) => x.ten) });
    return { msg: tom("Đã bỏ duyệt"), ket, duyet: duyetXem().duyet };
  }
  if (v === "xoa") {
    { const kh = BH().khoaKho(); if (kh) loi(`Kho bang hội đang khóa (${kh}) — xử lý ở F10 → Bang hội rồi mới xóa tài khoản`); }
    for (const ten of ds) {
      const tk = D.docTk(ten);
      if (!tk) { ket.push({ ten, ok: 0, ly: "không còn / đọc lỗi" }); continue; }
      if (tk.admin) { ket.push({ ten, ok: 0, ly: "quản trị" }); continue; }
      if (TG.dangChoi(tk.ten) || ctx.online(tk.ten)) { ket.push({ ten, ok: 0, ly: "đang chơi" }); continue; }
      const nv = tk.nv.filter(Boolean).map((h) => `${h.name} (cấp ${h.lvl || 1})`).join(", ") || "chưa có nhân vật";
      try {
        thuPhien(tk, lyDo || "Tài khoản đã bị xóa", true); D.ghiTk(tk); TG.roi(tk.ten); ctx.roi(tk.ten);
        let bh = []; try { bh = BH().xoaTk(tk.ten, qt.ten); } catch (e) { console.error("Xóa tài khoản hàng loạt — bang hội:", e.message); }
        D.xoaTk(tk.ten); KTN.thuHoi(tk.ten);
        NK.ghi("qt", qt.ten, null, `Xóa tài khoản ${tk.ten} (hàng loạt) — ${nv}${bh.length ? ` — bang hội: ${bh.join("; ")}` : ""}${lyDo ? ` — ${lyDo}` : ""}`);
        ket.push({ ten, ok: 1 });
      } catch (e) { ket.push({ ten, ok: 0, ly: String(e.message || e).slice(0, 80) }); }
    }
    return { msg: tom("Đã xóa"), ket };
  }
  loi("Không có thao tác hàng loạt này");
}

// viec = phần sau /api/quan-tri/; qt = tài khoản quản trị đang làm; ctx = { online(ten) -> lần cuối hỏi máy chủ (0 = vắng), roi(ten) }
function lam(viec, qt, b, ctx) {
  switch (viec) {
    case "ds": return ds(ctx);
    case "tk": return chiTiet(b.ten);
    case "soi": return soi(b.ten, b.o);
    case "xu-ly": return xuLy(qt, b, ctx);
    case "qua": return qua(qt, b);
    case "qua-tat": return quaTat(qt, b);
    case "mon": return { ds: DO.timMon(String(b.q || "")) };
    case "tim-mon": return require("./tim-mon").tim(b); // F10 → Tìm món (anh 18/11 tối): quét trang bị mọi tài khoản + nguồn gốc + món trùng mã
    case "ma-qua": return MQ.quanTri(qt, b);
    case "thong-bao": return thongBao(qt, b);
    case "ghim": return ghim(qt, b);
    case "nhat-ky": return { ...NK.doc(b), ngays: NK.ngays() };
    case "bao-tri": return { baoTri: BT.dat(qt, b) };
    case "duyet": return duyet(qt, b); // duyệt người chơi vào game (anh 11/11 khuya)
    case "loat": return loat(qt, b, ctx); // thao tác hàng loạt trên tài khoản đã chọn (anh 17/11): duyệt / bỏ duyệt / xóa
    case "lich-hd": return LHD().quanTri(qt, b);
    case "cau-hinh": return require("./cau-hinh-qt").quanTri(qt, b); // F10 → Cấu hình: sửa thông số, khởi động lại an toàn, bắt F5 (anh 11/11)
    case "ung-ho": return require("./ung-ho").quanTri(qt, b); // F10 → Ủng hộ: danh sách người ủng hộ tác giả (anh 12/11 — may-chu/ung-ho.js)
    case "so-hoat-dong": return NK.hoatDong(b); // F10 → Người chơi → Xem hoạt động: sổ riêng từng tài khoản (anh 11/11 — "hoat-dong" đã là công cụ thử hoạt động của api.js)
    case "bang-hoi": return BH().quanTri(qt, b); // F10 → Bang hội (anh 14/11 — may-chu/bang-hoi.js): danh sách bang, thành viên, đổi tên, chuyển bang chủ, qua khảo nghiệm, giải tán, công cáo
    case "khu-bang": return require("./khu-bang.js").quanTri(qt, b); // F10 → Bang hội: khu vực bang (đợt 4 — xem / đổi lãnh địa)
    case "loi-dai": return require("./loi-dai.js").quanTri(qt, b); // F10 → Lôi đài (anh 15/11 — may-chu/loi-dai.js): { lam: "ds" } sân đang dùng | { lam: "huy", so, ly? } hủy sân + hoàn phí
    case "kham-nam": return require("./kham-nam.js").quanTri(qt, b); // F10 → Khảm nạm (anh 17/11): { lam: "xem" | "bat" | "tat" } — bật / tắt riêng máy này (theoMay)
    case "dua-ngua": return require("./dua-ngua.js").quanTri(qt, b); // F10 → Đua ngựa (anh 16/11 — may-chu/dua-ngua.js): { lam: "xem" | "mo" | "batDau" | "ket" | "huy", u? }
  }
  loi("Không có việc quản trị này", 404);
}

module.exports = { lam, khoaCon, cauKhoa, cauDa, ghimNay, VIEC: /^\/api\/quan-tri\/(ds|tk|soi|xu-ly|qua|qua-tat|mon|tim-mon|ma-qua|thong-bao|ghim|nhat-ky|bao-tri|duyet|loat|lich-hd|cau-hinh|so-hoat-dong|ung-ho|bang-hoi|khu-bang|loi-dai|dua-ngua|kham-nam)$/ };
