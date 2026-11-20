// Tống Kim (anh 05/11 — THIET-KE-TONG-KIM.md). 1 phòng trong bộ nhớ (D), 2 phe: 0 Tống, 1 Kim. Hai loại phòng (D.loai):
//   "thu"  — bãi thử (đợt 1: "bot + PK ở bãi thử chỉ quản trị thấy", anh xem bot đã giống người chưa rồi mới dựng trận): quản trị mở ở bãi đang đứng
//            (công cụ Thử Tống Kim — /api/tong-kim-qt "mo"); không lịch, không thưởng; không theo CF.bat (F10 bật / tắt chỉ cho trận theo lịch); đang có
//            trận theo lịch thì không mở được
//   "tran" — trận theo lịch (đợt 2 — anh 06/11): mỗi ngày CF.gio (giờ Việt Nam; GM đổi ở F10 → Lịch hoạt động — lich-hd.js), chiến trường 380
//            Xung phong — anh 06/11 chọn (bai của assets/data/tong-kim.json — cong-cu: hậu doanh, bẫy, đại doanh, tiền tuyến, chỗ Nguyên Soái; đọc lúc mở trận). Đến giờ thì bãi thử đang mở
//            (nếu có) đóng. Báo danh CF.baoDanh phút ở Mộ binh quan Biện Kinh (lam): cấp ≥ cap, phí phi lượng 1 lần mỗi trận mỗi nhân vật (D.dk —
//            "tài khoản|ô"; mỗi tài khoản 1 nhân vật mỗi trận), 2 phe lệch tối đa 1 người thật (bằng nhau chọn tự do, lệch thì người vào sau vào phe ít —
//            anh chốt), vào muộn tới phút vaoMuon của trận; vào lại (rớt mạng / rời trận) giữ phe, điểm, chức, không thu phí; vào trận thì rời tổ đội.
//            Đánh CF.danh phút: khai chiến thì bot (soBot mỗi phe — hậu doanh) + quân NPC 6 bậc của client (Tống 631–636, Kim 637–642 — máu / sát thương
//            như quân Phong Hỏa: quái thường bãi chính cùng cấp × binh.mauHs / stHs): binh.so Tống binh / Kim binh mỗi phe ngoài tiền tuyến (chết binh.hoi
//            giây sau ra lại), Hiệu úy … Đại tướng binh.dot con mỗi phe ra dần từ phút dotTu tới dotDen (không ra lại), Nguyên Soái phút soai1 phe ít điểm
//            (bằng điểm: cả 2), phút soai2 phe kia (không ra lại; máu = máu boss thế giới — anh 06/11). Phe hạ Nguyên Soái địch trước thắng — trận kết thúc
//            ngay (anh 06/11 "nếu mở đánh chính thức thì sau khi kill nguyên soái, có thể kết thúc luôn"), không ai hạ được thì hết giờ phe nhiều điểm trận
//            hơn thắng, bằng điểm thì Tống (client). Hết giờ / hạ Nguyên Soái (ketThuc): thưởng ghi thẳng tệp tài khoản — điểm Tống Kim h.diemTk, Nhạc Vương Hồn
//            Thạch, kinh nghiệm, Huân công bài (Thiên Tử ×2), câu báo h.tkTin (nhịp gửi — api.js); bảng kết quả giuKq giây, raSau giây sau trình duyệt tự
//            đưa người về Biện Kinh. Quân Nhu quan (lam "qn" / "shop" / "duc" + do.js muaTk): bán bằng điểm Tống Kim (không bán khi đang đánh), đúc Nhạc
//            Vương Kiếm. Món chỉ dùng trong chiến trường: vatTk / trongTran (do.js dungVat); trạng thái tk* ra khỏi trận thì nhịp bỏ (boBuffTk)
//   - người thật vào phòng: trình duyệt nhận "tkMo" thì gửi "tkVao"; tên + bản chụp nhân vật (phan-than.js chup) lấy từ tệp máy chủ. Bãi thử chia phe
//     (anh chốt: người thật 2 phe lệch tối đa 1): lần đầu vào — 2 phe đang bằng người thì Tống, không thì phe ít hơn; vào lại giữ phe cũ; quản trị tự
//     đổi phe mình được (thử). Trận: phe theo báo danh; chưa báo danh trận này thì "tkMo" kèm khong (trình duyệt đưa về Biện Kinh)
//   - mỗi phe soBot bot: máy chủ cấp danh tính — phái (10 phái chia đều, phe nào cũng đủ), giới (Thiếu Lâm nam, Nga My / Thúy Yên nữ), cấp (cấp cao
//     nhất máy chủ ± lechCap), hạt giống, tên (kho anh gửi assets/data/ten-bot.json — không đánh dấu là bot, bỏ tên trùng nhân vật thật); mọi trình
//     duyệt dựng cùng 1 thân bot từ [phái, giới, cấp, hạt giống]
//   - máu bot / quân giữ ở máy chủ như boss thế giới: ai phe kia cũng đánh được (sát thương tối đa stGiay / stBot / stBinh mỗi giây, dồn 3 giây), đòn
//     kết liễu được điểm; bot bị hạ thì hoiSinh giây sau ra trận lại. Máu tối đa bot: trình duyệt dựng thân bot rồi báo (tkMau), máy chủ nhân chức
//     (chucMau); máu / sát thương / chính xác / né tránh của quân: máy chủ tính (chiSoBinh)
//   - 1 máy "chủ trận" (người trong phòng: máy tính tab hiện > tab hiện > bất kỳ — như chủ bãi quái chung) chạy não mọi bot + quân: báo vị trí, chiêu,
//     sát thương bot / quân đánh bot / quân, hồi máu bot (thuốc, Nga My), sinh lực tối đa bot
//   - máu NGƯỜI THẬT do máy người bị đánh tự trừ (máy chủ chỉ chuyển chiêu "tkc" + đòn thường trúng "tkn") — máy chủ không giữ máu người chơi
//   - điểm như client (battlehead.lua): hạ người / bot = pk × RANK_PKBONUS[chức kẻ hạ][chức bị hạ]; liên trảm (TAB_SERIESKILL) cứ lienTram[0] mạng
//     thêm lienTram[1] điểm; hạ quân bậc b được diemBinh[b] (Nguyên Soái 1000); chức theo mốc chuc (Binh sĩ, Hiệu úy, Thống lĩnh, Phó tướng, Đại tướng
//     — sinh lực + chucMau %, phòng thủ + chucThu %: trình duyệt cộng cho người, máy chủ nhân máu bot). Trận: kẻ hạ mà người bị hạ báo (tkChet) chỉ
//     được điểm khi kẻ đó vừa đánh / nhắm người đó trong GAN_MS (ganDanh — chặn 2 người báo nhau cày điểm ăn thưởng)
//   - hệ số sát thương PK hs của phòng (heSoSt — thử 05/11: bot chết sau 1–2 đòn, trận hết trong ~5 giây; quản trị đổi được trong HS — anh 06/11 thêm
//     mức 0,01): trình duyệt nhân mọi đòn người / bot đánh người / bot — máy chủ chỉ giữ + gửi kèm trạng thái
// Kênh tức thời (ws.js): trình duyệt -> "tkVao" { o, dt } · "tkAn" { an } (2 giây / lần) · "tkh" { ts, q: [[mã, x, y, hướng, động tác, số đòn, đòn,
//   thế đánh, mục tiêu, ngựa]] } · "tkc" { c: [[nguồn, chiêu, cấp, x, y, px, py, mục tiêu]] } · "tkd" { d: [[mã, sát thương, nguồn]], st?: [[mã, choáng
//   ms, chậm ms]] } · "tkHoi" { h: [[mã, máu]] } · "tkn" { ai, v, crit, st, src } · "tkChet" { tu } · "tkMau" { m: [[mã, máu tối đa]] } · "tkBuff" { k,
//   giay } (vừa dùng Chiến cổ / Lệnh Bài — do.js dungVat tkDoi) (tkh / tkHoi / tkMau: chủ trận; mã = bot (< 100000) | quân (≥ 100000); nguồn "#mã" chỉ
//   chủ trận gửi); máy chủ -> "tkMo" { bai, mo, moi, chung, loai?, pha?, khong? } · "tk" { p } (trạng thái — phat) · "tkh" · "tkc" · "tkst" (choáng /
//   chậm bot / quân — gửi chủ trận) · "tkt" (đòn thường trúng mình) · "tkk" (tin hạ địch) · "tkhn" (bot hồi máu mình) · "tkBuff" { k, giay, tu } (người
//   cùng phe — máy nhận tự xem khoảng cách)
// HTTP: /api/tong-kim { o, viec, x? } (lam — Mộ binh quan / Quân Nhu quan) · /api/tong-kim-qt (quanTri — quản trị: bãi thử + moTran / ketTran / huyTran)
// Người trong phòng = kênh tức thời ở bãi phòng, đã tkVao phòng này, có tin tk* trong SONG_MS. pheCua(tk, zone?) -> phe trận (the-gioi.js pheNay).
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const WS = require("./ws.js");
const ND = require("./nghi-dame.js"); // nghi hack sát thương (anh 16/11 — chỉ ghi)
const D2 = require("./du-lieu");
const XH = require("./xep-hang.js");
const GV = require("./gio-vn.js"); // giờ Việt Nam + ngày trong tuần của lịch (GM chỉnh ở F10 — lich-hd.js)
const PTH = require("./phan-than.js"); // chup: bản chụp nhân vật — người trong phòng tính chỉ số / chiêu của người khác như người đó
const MT = require("./mau-tin.js"); // tô màu tên nhân vật / phần thưởng trong tin hệ thống (anh 13/11)
const TG = () => require("./the-gioi.js");
const NK = () => require("./nhat-ky.js");
const TD = () => require("./to-doi.js");
const BTG = () => require("./boss-tg.js"); // máu Nguyên Soái = máu boss thế giới (anh 06/11 — boss-tg.js CF.mau, cau-hinh bossTheGioi.mau)
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến cuối trận (điểm trận × 0,03, trận từ 100 điểm, ≤ 150) — nạp lúc dùng
// anh 16/11 — Báo Đáp Ân Sư (may-chu/bao-dap-an-su.js, nạp lúc dùng): món sự kiện cuối trận theo điểm trận (thuongNguon "tk" — mốc nguon.tkDiem) vào cùng gói món
// của traoThuong. Module thiếu / ném lỗi -> [] (thưởng Tống Kim như cũ); món chưa có trong kho đồ thì bỏ
const BD = () => require("./bao-dap-an-su");
// anh 18/11 — nguồn sự kiện (nguon-su-kien.js tongKim — sườn dùng lại): ở trong trận ≥ phut phút -> n; vào từ đầu (trễ ≤ tre phút) + còn trong trận lúc kết thúc -> n + du.
// Giây trong trận: m.tg (vong — mỗi 100 ms, chỉ lúc đang khai chiến và người đó đang ở trong trận), m.dau = lúc đầu tiên có mặt sau khai chiến (D.bdLuc)
function nskTk(giay, du) {
  try { return (require("./nguon-su-kien.js").tongKim(giay, du) || []).filter((r) => Array.isArray(r) && N.BY.has(String(r[0])) && (r[1] | 0) > 0).map(([k, n]) => ({ k: String(k), n: n | 0 })); }
  catch (e) { if (!e || e.code !== "MODULE_NOT_FOUND") console.error("Nguồn sự kiện — Tống Kim:", e && e.message); return []; }
}
function bdMon(nguon, x) {
  try { return (BD().thuongNguon(nguon, x) || []).filter((r) => Array.isArray(r) && N.BY.has(String(r[0])) && (r[1] | 0) > 0).map(([k, n]) => ({ k: String(k), n: n | 0 })); }
  catch (e) { if (!e || e.code !== "MODULE_NOT_FOUND") console.error("Báo Đáp Ân Sư —", nguon, e && e.message); return []; }
}

const N = DO.NOI, MS = DO.mobStats;
const CFT = N.CFG.tongKim || {};
// bãi thử (đợt 1) + trận theo lịch (đợt 2 — dac-ta-dot2 §0; số của S1 ở cau-hinh.json tongKim, giải thích _tongKim)
const CF = { bat: true, soBot: 20, soBotMax: 60, tri: 3, lechCap: 10, hoiSinh: 8, hoanGiay: 180, stGiay: 600000, stBot: 300000, stBinh: 2000000, hoiGiay: 0.35, R: 220, pk: 75,
  lienTram: [3, 150], chuc: [1000, 3000, 6000, 10000], heSoSt: 0.4, giaThuoc: 0.5, giaThuocCo: 1, vaoTuDo: true, mauSoai: 20000000,
  gio: ["10:50", "12:50", "16:50", "22:00"], baoTruoc: 5, baoDanh: 5, danh: 30, soai1: 15, soai2: 20, vaoMuon: 15, cap: 100, phi: 3000, giuKq: 120, raSau: 30,
  diemBinh: [5, 30, 150, 250, 500, 1000], chucMau: [0, 20, 30, 40, 50], chucThu: [0, 0, 5, 10, 15],
  quanNhu: [["qk:507", 5000], ["ms:156", 3000], ["ms:157", 2000], ["ms:215", 400], ["ms:216", 200], ["ms:217", 100], ["ms:186", 300], ["ms:187", 300],
    ["ms:191", 400], ["ms:178", 600], ["ms:181", 600], ["ms:190", 600],
    ["ms:179", 600], ["ms:180", 600], ["ms:9101", 600], ["ms:9102", 600], ["ms:182", 600], ["ms:183", 600], ["ms:184", 600], ["ms:185", 600]],
  ...CFT };
// mục con: cau-hinh.json chỉ cần ghi khóa muốn đổi, còn lại theo mặc định ở đây
CF.binh = { so: 20, hoi: 120, dot: [6, 4, 3, 2], dotTu: 1, dotDen: 20, capGoc: 95, lech: -5, capMin: 95, capMax: 200, mauHs: [1, 2, 6, 10, 20, 80],
  stHs: [1, 1.3, 1.8, 2.5, 3.5, 6], khang: [0, 5, 10, 15, 30, 243], khangMax: 50, ...(CFT.binh || {}) };
CF.thuong = { diemMin: 100, thang: 1200, thua: 600, ht: [2, 0], htMoc: 3000, htThem: 1, htSoai: 2, htTop: [1, 1, 1], htMon: "qk:507", khoa: 0, knHs: 1.4, knToiDa: 20000000,
  hcMon: "ms:1773", hcDiem: 1000, hcNgay: 2, hcKn: [[2000000, 30], [3000000, 40], [5000000, 30]], roiGiu: 120, ...(CFT.thuong || {}) };
CF.thienTu = { thu: [2, 4, 6], heSo: 2, ...(CFT.thienTu || {}) };
CF.duc = { can: 100, mon: "qk:195", ...(CFT.duc || {}) };
const HS = [0.01, 2]; // khoảng hệ số sát thương PK (hs) quản trị đặt được (anh 06/11 "hệ số sát thương thêm mức 0.01" — trước 0,05)
const GUI_MS = 100, NHAC_MS = 1000, SONG_MS = 10000; // gửi trạng thái lúc đổi (cách ≥ 100 ms), không thì mỗi giây; quá 10 giây không tin tk* = rời phòng
const KK_GIU = 30, KK_GUI = 5;  // tin hạ địch: giữ 30, gửi kèm trạng thái 5 tin gần nhất
const C_GIAY = 80;              // chiêu (tkc): mỗi người gửi tối đa 80 dòng / giây (dồn 3 giây)
const C_CHU = 600;              // chủ trận gửi cả chiêu bot (40 bot / phe ≈ 80–160 chiêu / giây — thử 05/11): hạn mức riêng
// tkChet: 2 lần chết của 1 người cách ít nhất (hoiSinh − 1) giây — người chết phải chờ hồi sinh mới chết được lần nữa (soát 05/11: 1 giây thì gửi bậy
// "tôi bị X hạ" mỗi giây cày điểm cho X)
const CHET_CACH = () => Math.max(1000, ((+CF.hoiSinh || 8) - 1) * 1000);
const ROI_GIU = 120000;         // chia phe (bãi thử): người rời phòng chưa quá 2 phút vẫn tính vào phe cũ (hay quay lại — rớt mạng, đổi bãi)
const BUA_GOC = { 719: 711, 723: 715 }; // 723 hoảng loạn do Thiên Nhẫn 120 Ma Âm Phệ Phách 715 sinh ra (anh 13/11) // tkn st.bua: chiêu tự phát -> chiêu đã học sinh ra nó (Hấp Tinh Yểm_Quyết Chú do Hấp Tinh Yểm — rà soát 12/11)
// anh 17/11 ("ngũ độc đánh ăn nhau ở sát thương dồn … ăn bùa xong bị câu dame độc 1 thời gian cũng có thể bị đột tử"): độc người lên người kéo dài đủ thời gian của chiêu
// (≤ DOC_MAX khung = 60 giây), không nén vào trần khống chế ST_MAX như choáng / chậm — các lớp độc chồng lên nhau như đánh quái
const DOC_MAX = 1080;
const ST_MAX = 27;              // tkn: choáng / chậm / độc kèm đòn thường tối đa chừng này khung (như quaiVoCong.hieuUngToiDa — trình duyệt cũng chặn)
const GAN_MS = 15000;           // tkChet (trận): kẻ hạ phải vừa đánh / nhắm người bị hạ trong 15 giây (tkn, tkc, tkh — ganDanh)
const DOI_GIU = 30000;          // tkBuff: dùng Chiến cổ / Lệnh Bài xong có 30 giây để chuyển trạng thái cho người cùng phe (choDoi — do.js dungVat)
const TIN_GIU = 12;             // tin trong trận (D.tin — như Phong Hỏa): giữ 12 dòng gần nhất; mỗi người chỉ gửi dòng mới
const BIEN_KINH = 37, BAO_DANH = 325; // Biện Kinh: về sau trận; Điểm báo danh Tống Kim 325: Mộ binh quan, Quân Nhu quan, Xa phu mỗi phe như client (anh 09/11 — Xa phu các thành đưa tới)
const DANH_GOC = Math.max(1, +CF.danh || 30); // phút đánh của cau-hinh.json — mốc đợt quân (binh.dotTu – dotDen) viết cho trận này; GM đổi ở F10 thì co / giãn theo
const PHAI = ["shaolin", "tianwang", "tangmen", "wudu", "emei", "cuiyan", "gaibang", "tianren", "wudang", "kunlun"];
const GIOI = { shaolin: "m", emei: "f", cuiyan: "f" }; // phái chỉ 1 giới (client)
// nhân vật mẫu cho bot (anh 09/11 chọn "Nhân vật mẫu" — F10 nút Làm mẫu bot): mỗi phái tối đa MAU_TOI_DA mẫu; bot phái đó bốc 1 mẫu, mặc đồ + kỹ năng + điểm + chiêu dùng như nhân vật lúc bấm
// (phái chưa có mẫu: bot tự sinh như cũ — do-toc-do.js heroBot). Lưu du-lieu/mau-bot.json; áp dụng từ trận sau (D.mauBot chụp lúc mở trận; tkbot.js tkTaoBot)
const TEP_MAU = path.join(D2.ROOT, "mau-bot.json"), MAU_TOI_DA = 3;
let MAU_BOT = (() => { try { const j = JSON.parse(fs.readFileSync(TEP_MAU, "utf8")); return Array.isArray(j) ? j : []; } catch { return []; } })();
function ghiMauBot() { try { fs.mkdirSync(D2.ROOT, { recursive: true }); const tmp = TEP_MAU + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(MAU_BOT)); fs.renameSync(tmp, TEP_MAU); } catch (e) { console.error("Không ghi được mau-bot.json:", e.message); } }
const mauBotDs = () => MAU_BOT.map((m, i) => ({ i, fk: m.fk, fac: m.fac, series: m.series, ten: m.ten, lvl: m.lvl, luc: m.luc }));
// lưu nhân vật h làm mẫu (trùng tên: cập nhật) -> true khi là cập nhật; lỗi: throw
function mauBotThem(h) {
  const fk = h.fac == null ? null : PHAI[h.fac | 0];
  if (!fk) throw new Error("Nhân vật chưa vào môn phái — không làm mẫu bot được");
  const m = { fk, ten: h.name, lvl: h.lvl | 0 || 1, sex: h.sex === "f" ? "f" : "m", series: h.series | 0, fac: h.fac, facKey: fk, start: h.start, attr: h.attr, skills: h.skills, equip: h.equip, looks: h.looks, oChieu: h.oChieu || {}, danh: (h.auto && h.auto.danh) || null, luc: Date.now() };
  const i = MAU_BOT.findIndex((x) => x.ten === m.ten);
  if (i >= 0) MAU_BOT[i] = m;
  else { if (MAU_BOT.filter((x) => x.fk === fk).length >= MAU_TOI_DA) throw new Error(`Phái này đã đủ ${MAU_TOI_DA} mẫu — xóa bớt ở thẻ Bot mẫu`); MAU_BOT.push(m); }
  ghiMauBot();
  return i >= 0;
}
function mauBotXoa(i) { const [m] = MAU_BOT.splice(i | 0, 1); if (!m) throw new Error("Không có mẫu này"); ghiMauBot(); return m; }
const ACTS = new Set(["stand", "run", "attack", "hurt", "die", "sit"]);
// liên trảm (client TAB_SERIESKILL [chức kẻ hạ][chức bị hạ]): chức cao hạ chức quá thấp không tính
const LIEN = [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 1], [0, 0, 1, 1, 1]];
const TEN_PHE = ["Tống", "Kim"];
// quân NPC 6 bậc (client settings\npcs.txt — tong-kim.json binh đè): bậc 0 Tống binh / Kim binh … 5 Nguyên Soái
const TPL_BINH = [[631, 632, 633, 634, 635, 636], [637, 638, 639, 640, 641, 642]];
const TEN_BINH = [["Tống binh", "Hiệu úy", "Thống lĩnh", "Phó tướng", "Đại tướng", "Nguyên Soái"], ["Kim binh", "Hiệu úy", "Thống lĩnh", "Phó tướng", "Đại tướng", "Nguyên Soái"]];
// món chỉ dùng trong chiến trường (client checkmapid.lua — do.js dungVat): hoan = trạng thái 3 phút của riêng mình (h.buff — trình duyệt cộng khi đang
// ở trận, ra khỏi trận thì nhịp bỏ); doi = Chiến cổ / Lệnh Bài: trình duyệt cộng trạng thái cho mình + chuyển (tkBuff) người cùng phe quanh mình; hoi =
// Càn Khôn Tạo Hóa Đan: trình duyệt hồi v sinh lực + nội lực mỗi 0,5 giây trong 3 giây. dung của món (ky-tran-cac.json) đè buff / giay / v nếu có
const VAT_TK = {
  "ms:186": { loai: "hoan", buff: "tkTruongMenh" }, "ms:187": { loai: "hoan", buff: "tkGiaBao" }, "ms:191": { loai: "hoan", buff: "tkPhoPhong" },
  "ms:178": { loai: "hoan", buff: "tkNgoaiPho" }, "ms:181": { loai: "hoan", buff: "tkNoiPho" }, "ms:190": { loai: "hoan", buff: "tkPhiToc" },
  "ms:156": { loai: "doi", k: "tkChienCo" }, "ms:157": { loai: "doi", k: "tkLenhBai" },
  "ms:215": { loai: "hoi", v: 2000 }, "ms:216": { loai: "hoi", v: 1000 }, "ms:217": { loai: "hoi", v: 500 },
};
const GIAY_VAT = { hoan: 180, doi: 180, hoi: 3 };
const laBuffTk = (k) => /^tk[A-Z]/.test(k); // trạng thái chiến trường (h.buff tk…)

let D = null;      // phòng đang mở
let moCuoi = 0;    // mã lần mở (D.mo) không trùng lần trước — kết nối còn kn.tkVao của phòng cũ không tính là trong phòng mới
let TD_THU = null; // dữ liệu chiến trường đặt sẵn (bài thử — _thu.datTd)
const daGoi = new Set(); // "ngày b|giờ" đã báo / đã mở theo lịch
let lanDau = true; // vòng lịch đầu tiên sau khi máy chủ chạy (đang trong giờ báo danh của 1 trận thì mở luôn)

const loi = (t) => N.loi(t);
const so = (v, a, b, d = a) => (Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d);
const nguyen = (v, a, b, d = a) => Math.round(so(v, a, b, d));
const chon = (a) => a[Math.floor(Math.random() * a.length)];
const tron = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const khoa = (s) => D2.khoaTen(s);
const idCua = (x) => (typeof x === "number" ? x : typeof x === "string" && x.length < 12 ? +x : NaN); // mã bot / quân trong dòng tin
const laBinh = (x) => !!x && x.bac != null; // quân NPC (bot / người không có bac)
// "#mã" -> bot | quân | null
const refCua = (s) => { if (typeof s !== "string" || s[0] !== "#" || s.length >= 12) return null; const id = +s.slice(1); return D.bot.get(id) || D.binh.get(id) || null; };
const botRef = (s) => { const x = refCua(s); return x && !laBinh(x) ? x : null; }; // "#mã" -> bot
const vn = (n) => Math.round(+n || 0).toLocaleString("vi-VN");
const Y = (t) => `<color=yellow>${t}<color>`, Rd = (t) => `<color=red>${t}<color>`;
const say = (text, opts) => ({ say: { text, opts } }); // opts: [[nhãn, việc, x?]] — việc null = đóng khung
const talk = (text) => ({ talk: { text } });
const soNguyen = (v, a, b, ten) => { const n = +v; if (v === "" || v == null || !Number.isInteger(n) || n < a || n > b) loi(`${ten} phải là số nguyên ${a}–${b}`); return n; };
const soHs = (v) => { const n = +v; if (v === "" || v == null || typeof v === "boolean" || !(n >= HS[0] && n <= HS[1])) loi(`Hệ số sát thương phải là số ${HS[0]}–${HS[1]}`); return n; };

// thùng hạn mức (như quai-chung.js danh): mỗi giây thêm r, dồn tối đa k giây
function thung(M, key, r, k, t) {
  let H = M.get(key);
  if (!H) { H = { han: r * k, luc: t }; M.set(key, H); }
  H.han = Math.min(r * k, H.han + (Math.max(0, t - H.luc) / 1000) * r); H.luc = t;
  return H;
}

// ---------- người trong phòng, chủ trận ----------
// người đang trong phòng -> Map(tài khoản -> kết nối). Trận: kết nối phải đang ở đúng ô nhân vật đã báo danh (tài khoản đổi sang nhân vật khác thì ra)
function trong(t = Date.now()) {
  const M = new Map();
  if (D) WS.moi((kn) => {
    if (kn.zone !== D.bai || !!kn.chung !== !!D.chung || kn.tkVao !== D.mo || t - (kn.tkLuc || 0) >= SONG_MS) return;
    const m = D.nguoi.get(kn.ten);
    if (m && (D.loai !== "tran" || m.o === kn.o)) M.set(kn.ten, kn);
  });
  return M;
}
// chủ trận (mỗi 100 ms — như quai-chung.js chonChu): máy tính tab hiện > tab hiện > bất kỳ; giữ chủ cũ nếu còn trong phòng và thuộc hạng tốt nhất
// đang có, không thì người vào phòng sớm nhất của hạng đó
function chonChu(on) {
  const hang = (tk) => (D.nguoi.get(tk).an ? 2 : on.get(tk).tkDt ? 1 : 0);
  const ds = [...D.nguoi.keys()].filter((tk) => on.has(tk)), tot = Math.min(3, ...ds.map(hang));
  const moi = on.has(D.chu) && hang(D.chu) === tot ? D.chu : ds.find((tk) => hang(tk) === tot) || null;
  if (moi !== D.chu) { D.chu = moi; D.doi = true; }
}
const tenChu = () => (D.chu && D.nguoi.has(D.chu) ? D.nguoi.get(D.chu).ten : "");

// ---------- trạng thái gửi trình duyệt ----------
const hpCua = (b) => [b.id, Math.max(0, Math.ceil(b.mau)), b.mauMax, b.chet ? 1 : 0, b.hoi, b.chuc | 0]; // chuc: danh hiệu trên đầu bot (anh 09/11)
const dongB = (b) => [b.id, b.ten, b.phe, b.fac, b.sex, b.lv, b.seed, b.mauMax, b.mb ?? -1];
// quân: [mã, phe, bậc 0–5, mẫu, cấp, máu tối đa, sát thương thấp, cao, chính xác, né tránh, x, y (chỗ ra)]
const dongBi = (e) => [e.id, e.phe, e.bac, e.tpl, e.lv, e.mauMax, e.dmg[0], e.dmg[1], e.ar, e.def, e.x, e.y];
// dòng bảng điểm (top 10 trong trận, bảng kết quả — người + bot): [tên, phe, điểm, giết (người / bot), chết, chức, liên trảm cao nhất, giết NPC]
const dongDiem = (x) => [x.ten, x.phe, x.diem, x.giet, x.tk ? x.chet : x.chetN, x.chuc, x.lienMax | 0, x.binh | 0];
const xepDiem = () => [...D.nguoi.values(), ...D.bot.values()].sort((a, b) => b.diem - a.diem || b.giet - a.giet);
// máu bot / quân vừa đổi: đánh dấu bản (hd — trận chỉ gửi phần đổi)
const doiHp = (e) => { e.hv = ++D.hv; D.doi = true; };
// gửi cả phòng: b + vt khi người đó chưa có bản danh sách bot mới nhất (sv), bi khi chưa có bản danh sách quân mới nhất (bsv), sn khi chưa có bản chụp
// mới nhất (snSv). Máu: bãi thử hp đủ mọi lần; trận hp đủ (bot + quân) tối đa 1 lần / giây, còn lại hd = phần đổi từ lần gửi trước của người đó.
// me = [điểm, giết, chết, chức, giết NPC, liên trảm cao nhất, liên trảm hiện tại]; ng = [tên, phe, điểm, giết, chết, chức, đang trong phòng, giết NPC,
// liên trảm cao nhất, liên trảm hiện tại]; top = 10 dòng dongDiem (người + bot); tin = dòng tin trận mới [[mã, chữ, màu]]; trận đã xong: ket (ketCua) + ra
function phat(on, t = Date.now()) {
  D.guiLuc = t; D.doi = false;
  const tran = D.loai === "tran", kk = D.kk.slice(-KK_GUI), chu = tenChu();
  const ng = [...D.nguoi.values()].map((m) => [m.ten, m.phe, m.diem, m.giet, m.chet, m.chuc, on.has(m.tk) ? 1 : 0, m.binh | 0, m.lienMax | 0, m.lt | 0]);
  const top = xepDiem().slice(0, 10).map(dongDiem);
  const tt = { loai: D.loai, pha: phaCua(t), kc: D.kc || 0, het: D.het || 0, soaiLuc: D.soaiLuc ? D.soaiLuc.slice() : null,
    soaiMoc: tran ? [D.kc + D.s1, D.kc + D.s2] : null, thang: D.thang == null ? null : D.thang, bsv: D.bsv };
  const dsHp = () => [...D.bot.values(), ...D.binh.values()];
  let b = null, vt = null, sn = null, bi = null, hp = null;
  for (const [tk, kn] of on) {
    const m = D.nguoi.get(tk); if (!m) continue;
    const p = { bai: D.bai, trai: D.trai, R: D.R, tri: D.tri, hs: D.hs, hsinh: +CF.hoiSinh || 8, sv: D.sv, chu, phe: m.phe,
      me: [m.diem, m.giet, m.chet, m.chuc, m.binh | 0, m.lienMax | 0, m.lt | 0], diem: D.diem, ng, top, ...tt };
    if (m.daSv !== D.sv) { p.b = b || (b = [...D.bot.values()].map(dongB)); p.vt = vt || (vt = [...D.vt].map(([id, v]) => [id, v[0], v[1]])); p.chucHs = [CF.chucMau, CF.chucThu]; if (D.mauBot.length) p.mb = D.mauBot; m.daSv = D.sv; }
    if (m.daBsv !== D.bsv) { p.bi = bi || (bi = [...D.binh.values()].map(dongBi)); m.daBsv = D.bsv; }
    if (m.daSn !== D.snSv) { p.sn = sn || (sn = Object.fromEntries([...D.nguoi.values()].filter((x) => x.snap).map((x) => [x.ten, x.snap]))); m.daSn = D.snSv; }
    if (!tran || m.daHv == null || t - (m.hpLuc || 0) >= NHAC_MS) { p.hp = hp || (hp = dsHp().map(hpCua)); m.hpLuc = t; }
    else p.hd = dsHp().filter((e) => (e.hv | 0) > m.daHv).map(hpCua);
    m.daHv = D.hv;
    const moi = D.tin.filter((r) => r[0] > (m.daTin | 0));
    if (moi.length) { p.tin = moi; m.daTin = moi[moi.length - 1][0]; }
    if (D.ket) { p.ket = ketCua(m); p.ra = D.raLuc; }
    p.kk = kk; p.gio = t;
    kn.gui({ t: "tk", p });
  }
}
// kết quả gửi 1 người: { thang, lyDo, diem: [Tống, Kim], bang: 30 dòng dongDiem, me: { ten, phe, diem, giet, chet, chuc, lienMax, binh, hang, thang } | null,
// thuong: { tài khoản: { diemTk, ht, kn, hc } } (chỉ phần của người đó — không đủ điều kiện thì {}), soai: [tên người đánh Nguyên Soái Tống nhiều nhất, … Kim],
// x2 (Thiên Tử), ra (lúc trình duyệt đưa về Biện Kinh) }
function ketCua(m) {
  const K = D.ket; if (!K) return null;
  const th = K.thuong[m.tk];
  return { thang: K.thang, lyDo: K.lyDo || "", diem: K.diem, bang: K.bang, me: K.me[m.tk] || null, thuong: th ? { [m.tk]: th } : {}, soai: K.soai, x2: K.x2 ? 1 : 0, ra: D.raLuc };
}

// ---------- điểm ----------
const chucCua = (d) => { let k = 0; for (const m of Array.isArray(CF.chuc) ? CF.chuc : []) if (d >= m) k++; return Math.min(4, k); };
// điểm hạ 1 mạng: pk × RANK_PKBONUS[k][v] (client battlehead.lua — k chức kẻ hạ, v chức bị hạ), bảng nguyên văn × 5 cho khỏi lệch số thực (soát 05/11:
// công thức 1 + (v − k) / 5 lệch đúng 1 ô — Binh sĩ hạ Đại tướng client ×2, không phải ×1,8)
const PKB = [[5, 6, 7, 8, 10], [4, 5, 6, 7, 8], [3, 4, 5, 6, 7], [2, 3, 4, 5, 6], [1, 2, 3, 4, 5]];
const diemGiet = (k, v) => Math.max(0, Math.floor((CF.pk * PKB[k][v]) / 5 + 1e-9));
// chức (client skill 661 "trạng thái trong chiến trường Tống Kim"): sinh lực + chucMau[c] % — bot: máy chủ nhân máu tối đa (máu gốc trình duyệt báo
// — tkMau), người: trình duyệt tự cộng (kèm phòng thủ + chucThu %)
const hsMau = (c) => 1 + (+(Array.isArray(CF.chucMau) ? CF.chucMau : [])[c | 0] || 0) / 100;
function mauChuc(b) {
  if (!(b.mauGoc > 0)) return;
  const mx = Math.max(1, Math.round(b.mauGoc * hsMau(b.chuc)));
  if (mx === b.mauMax) return;
  b.mau = b.chet ? 0 : b.mauMax > 0 ? Math.min(mx, Math.max(1, Math.round((b.mau * mx) / b.mauMax))) : mx; // giữ tỉ lệ máu đang còn
  b.mauMax = mx; doiHp(b);
}
function datChuc(A) { const c = chucCua(A.diem); if (c === A.chuc) return; A.chuc = c; if (!A.tk && !laBinh(A)) mauChuc(A); }
// A hạ V (mỗi bên là người trong phòng hoặc bot): điểm + liên trảm cho A, điểm phe A, tin hạ địch cho cả phòng ngay
function cong(A, V) {
  const ka = chucCua(A.diem), kv = chucCua(V.diem), LT = Array.isArray(CF.lienTram) ? CF.lienTram : [];
  let d = diemGiet(ka, kv);
  if (LIEN[ka][kv]) { A.lt = (A.lt | 0) + 1; if (LT[0] > 0 && A.lt % LT[0] === 0) d += +LT[1] || 0; if (A.lt > (A.lienMax | 0)) A.lienMax = A.lt; }
  A.diem += d; A.giet++; datChuc(A); D.diem[A.phe] += d;
  V.lt = 0; if (V.tk) V.chet++; else V.chetN++;
  D.kk.push([Date.now(), A.ten, V.ten, A.phe, d]); if (D.kk.length > KK_GIU) D.kk.splice(0, D.kk.length - KK_GIU);
  const tin = { t: "tkk", k: [A.ten, V.ten, A.phe, d] };
  for (const kn of trong().values()) kn.gui(tin);
  D.doi = true;
  return d;
}
// bot hết máu: kẻ hạ (người / bot) được điểm — quân hạ thì không ai được; hoiSinh giây sau ra trận lại (vòng 100 ms)
function chetBot(b, A) { b.mau = 0; b.chet = Date.now(); doiHp(b); if (A && !laBinh(A)) cong(A, b); else { b.lt = 0; b.chetN++; } }
// quân hết máu: kẻ hạ (người / bot phe kia) được diemBinh[bậc]; Nguyên Soái: phe kẻ hạ thắng nếu chưa phe nào hạ Nguyên Soái địch — trận kết thúc ngay
// (anh 06/11 "nếu mở đánh chính thức thì sau khi kill nguyên soái, có thể kết thúc luôn" — trước: trận vẫn đánh tới hết giờ): ketThuc như hết giờ (thưởng,
// bảng kết quả, raSau giây sau về Biện Kinh), điểm của đòn kết liễu đã cộng ở trên; tin trận + báo cả máy chủ phe thắng ở ketThuc. Chỉ trận theo lịch có
// quân (bãi thử không có — như cũ). Tống binh / Kim binh binh.hoi giây sau ra lại (vongTran), bậc khác nằm lại danh sách (đã chết)
function chetBinh(e, A) {
  e.mau = 0; e.chet = Date.now(); doiHp(e);
  if (A && !laBinh(A)) {
    const d = Math.max(0, Math.round(+(Array.isArray(CF.diemBinh) ? CF.diemBinh : [])[e.bac] || 0));
    A.diem += d; A.binh = (A.binh | 0) + 1; D.diem[A.phe] += d; datChuc(A);
  }
  if (e.bac !== 5) return;
  const ai = A && !laBinh(A) ? A.ten : "";
  tin(`Nguyên Soái phe ${TEN_PHE[e.phe]} đã bị ${ai || "quân địch"} hạ!`, "#ffb74d");
  if (D.thang != null) return;
  D.thang = 1 - e.phe;
  TG().thongBao(`Tống Kim: ${ai ? `${MT.ten(ai)} đã hạ` : "Đã hạ"} Nguyên Soái phe ${TEN_PHE[e.phe]}!`);
  ketThuc(Date.now());
}

// ---------- bot ----------
// kho tên bot (đọc lại mỗi lần mở phòng — anh thêm tên vào tệp không cần khởi động lại máy chủ)
function docTen() {
  let j = {};
  try { j = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets", "data", "ten-bot.json"), "utf8")) || {}; } catch (e) { console.error("Tống Kim: đọc ten-bot.json", e && e.message); }
  const ds = (a) => [...new Set((Array.isArray(a) ? a : []).filter((s) => typeof s === "string").map((s) => s.trim().slice(0, 40)).filter(Boolean))];
  return { nam: ds(j.nam), nu: ds(j.nu), chung: ds(j.chung) };
}
// tên mọi nhân vật thật (cả tài khoản quản trị — du-lieu.js khoaTen) — 1 lần mỗi lần mở phòng
function tenThat() {
  const S = new Set();
  try { for (const T of D2.dsTk()) for (const h of Array.isArray(T.nv) ? T.nv : []) if (h && h.name) S.add(khoa(h.name)); } catch (e) { console.error("Tống Kim: đọc tên nhân vật", e && e.message); }
  return S;
}
// tên bot giới sex: nam chỉ bot nam, nu chỉ bot nữ, chung bot nào cũng được; không trùng trong phòng, bỏ tên trùng nhân vật thật; hết kho thì tên kho +
// " 2", " 3"…
function tenBot(sex) {
  const K = D.ten, kho = [...(sex === "f" ? K.nu : K.nam), ...K.chung].filter((s) => !D.thatTen.has(khoa(s)));
  const dung = new Set([...D.bot.values()].map((b) => khoa(b.ten))), con = kho.filter((s) => !dung.has(khoa(s)));
  if (con.length) return chon(con);
  const goc = kho.length ? kho : ["Vô Danh"];
  for (let n = 2; n < 10000; n++) { const c = goc.map((s) => `${s} ${n}`).filter((s) => !dung.has(khoa(s)) && !D.thatTen.has(khoa(s))); if (c.length) return chon(c); }
  return `Vô Danh ${D.seq + 1}`;
}
// thêm 1 bot cho phe: phái thứ i của phe xoay vòng danh sách phái đã xáo của phe đó (20 bot -> mỗi phái 2)
function themBot(phe) {
  const i = [...D.bot.values()].filter((b) => b.phe === phe).length, fac = D.phai[phe][i % PHAI.length], L = Math.max(0, CF.lechCap | 0);
  const co = D.mauBot.map((m, j) => (m.fk === fac ? j : -1)).filter((j) => j >= 0), mb = co.length ? co[Math.floor(Math.random() * co.length)] : -1, M = mb >= 0 ? D.mauBot[mb] : null; // bốc nhân vật mẫu của phái (anh 09/11)
  const sex = M ? M.sex : GIOI[fac] || (Math.random() < 0.5 ? "m" : "f"), ten = tenBot(sex);
  const b = { id: ++D.seq, ten, phe, fac, sex, mb, lv: M ? M.lvl : Math.max(1, Math.min(200, D.cap - L + Math.floor(Math.random() * (2 * L + 1)))), seed: Math.floor(Math.random() * 4294967296),
    mau: 0, mauMax: 0, mauGoc: 0, chet: 0, hoi: 0, diem: 0, giet: 0, chetN: 0, lt: 0, lienMax: 0, binh: 0, chuc: 0, dan: "", hv: 0 };
  D.bot.set(b.id, b);
  return b;
}
// đổi số bot mỗi phe: thiếu thì thêm, thừa thì bỏ bot thêm sau cùng (sống hay chết). Trận chưa khai chiến: chỉ ghi số (bot ra lúc khai chiến)
function datSoBot(n) {
  if (D.loai === "tran" && (!D.batDau || D.ket)) { D.soBot = n; D.doi = true; return; }
  for (const phe of [0, 1]) {
    const ds = [...D.bot.values()].filter((b) => b.phe === phe);
    for (let i = ds.length; i < n; i++) themBot(phe);
    for (const b of ds.slice(n)) { D.bot.delete(b.id); D.vt.delete(b.id); D.han.delete("#" + b.id); D.hanHoi.delete(b.id); }
  }
  D.soBot = n; D.sv++; D.doi = true;
}

// ---------- dữ liệu chiến trường (assets/data/tong-kim.json — cong-cu; tọa độ = điểm ảnh bản đồ web c<bai>, bai 380) ----------
// đọc lúc mở trận (tệp đổi không cần khởi động lại); thiếu / hỏng thì trận theo lịch không mở được (báo lỗi máy chủ), bãi thử vẫn chạy
function docTd() {
  if (TD_THU) return TD_THU;
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets", "data", "tong-kim.json"), "utf8")); }
  catch (e) { console.error("Tống Kim: đọc tong-kim.json", e && e.message); return null; }
}
const pheTd = (p) => (D && D.td && Array.isArray(D.td.phe) ? D.td.phe[p] || {} : {});
const ds2 = (a) => (Array.isArray(a) ? a.filter((v) => Array.isArray(v) && Number.isFinite(+v[0]) && Number.isFinite(+v[1])) : []);
// 1 điểm ngẫu nhiên của danh sách đầu tiên có điểm -> [x, y]
const diemTrong = (...L) => { for (const a of L) { const d = ds2(a); if (d.length) { const v = chon(d); return [Math.round(+v[0]), Math.round(+v[1])]; } } return [0, 0]; };
const diemHau = (p) => { const T = pheTd(p); return diemTrong((T.hau || {}).diem, (T.dai || {}).diem, T.dong); }; // chỗ ra ở hậu doanh
const diemDong = (p) => { const T = pheTd(p); return diemTrong(T.dong, (T.dai || {}).diem, (T.hau || {}).diem); }; // tiền tuyến (npcpos2)
const diemDai = (p) => { const T = pheTd(p); return diemTrong([...ds2((T.dai || {}).diem), ...ds2(T.dong)], (T.hau || {}).diem); }; // đại doanh + tiền tuyến
const viTriSoai = (p) => { const T = pheTd(p), s = Array.isArray(T.soai) ? T.soai : (T.dai || {}).tam; return Array.isArray(s) && Number.isFinite(+s[0]) && Number.isFinite(+s[1]) ? [Math.round(+s[0]), Math.round(+s[1])] : diemDai(p); };
const binhTd = (k, p, bac, md) => { const B = D && D.td && D.td.binh, L = B && Array.isArray(B[k]) ? B[k][p] : null; const v = Array.isArray(L) ? L[bac] : null; return v != null && v !== "" ? v : md; };
const tplBinh = (p, bac) => +binhTd("tpl", p, bac, TPL_BINH[p][bac]) || TPL_BINH[p][bac];
const tenBinh = (p, bac) => String(binhTd("ten", p, bac, TEN_BINH[p][bac]));

// ---------- quân NPC (trận) ----------
// hệ số chỉ số của quân cấp L so với cấp binh.capGoc (mẫu client bậc cao 95–100 — như phong-hoa.js heSo): quái thường bãi chính chứa cấp L ÷ cấp capGoc
const KC = new Map();
function heSo(L) {
  L = Math.max(1, Math.min(MS.maxLevel, L | 0));
  if (KC.has(L)) return KC.get(L);
  const a = DO.quaiCap(L), b = DO.quaiCap(+CF.binh.capGoc || 95), r = (x, y) => (x > 0 && y > 0 ? Math.round((x / y) * 1000) / 1000 : 1);
  const k = a && b ? { mau: r(a.t.mau, b.t.mau), ar: r(a.t.chinhXac, b.t.chinhXac), def: r(a.t.neTranh, b.t.neTranh) } : { mau: 1, ar: 1, def: 1 };
  KC.set(L, k);
  return k;
}
// chỉ số mẫu client (mobstats.json) cấp L: k = "life" | "ar" | "def" — mẫu chưa có thì 0
const gocMau = (tpl, L, k) => { const M = MS.mobs[tpl]; if (!M || !Array.isArray(M.s)) return 0; const S = M.s[M.series | 0] || M.s[0], P = S && MS.pool[S[k]]; return (P && P[Math.max(1, Math.min(MS.maxLevel, L | 0)) - 1]) || 0; };
// máu boss thế giới (Boss Hoàng Kim — boss-tg.js CF.mau = cau-hinh bossTheGioi.mau, số boss-tg.js goi dùng) | 0 khi không đọc được
// anh 13/11 (lượt 86): boss thế giới lên 50 triệu máu + tăng theo người đánh -> Nguyên Soái có máu riêng CF.mauSoai (20 triệu — máu boss thế giới cũ); 0 = theo boss thế giới
const mauBtg = () => { if (+CF.mauSoai > 0) return Math.round(+CF.mauSoai); try { return Math.max(0, Math.round(+BTG().CF.mau || 0)); } catch (e) { console.error("Tống Kim: máu boss thế giới", e && e.message); return 0; } };
// chỉ số 1 con quân bậc bac, mẫu tpl, cấp L (dac-ta §0 — như Phong Hỏa chiSo): máu / sát thương = quái thường bãi chính cùng cấp (do.js quaiCap) ×
// binh.mauHs / stHs[bậc]; chính xác / né tránh = mẫu client × heSo (mẫu chưa có: quái thường cùng cấp); kháng vật lý mẫu client (binh.khang, tối đa khangMax).
// Nguyên Soái (bậc 5): máu = máu boss thế giới (anh 06/11 "máu nguyên soái để = máu boss thế giới" — không theo cấp / mauHs[5]; không đọc được thì như cũ)
function chiSoBinh(tpl, L, bac) {
  const B = CF.binh, R = DO.quaiCap(L), k = heSo(L), hm = +(B.mauHs || [])[bac] || 1, hs = +(B.stHs || [])[bac] || 1;
  const ar0 = gocMau(tpl, L, "ar"), def0 = gocMau(tpl, L, "def"), soai = bac === 5 ? mauBtg() : 0;
  return {
    mau: soai > 0 ? soai : Math.max(1, Math.round(R ? R.t.mau * hm : (gocMau(tpl, L, "life") || 1000) * k.mau)),
    st: R ? [Math.round(R.t.stThap * hs), Math.round(R.t.satThuong * hs)] : [0, 0],
    ar: Math.max(1, Math.round(ar0 ? ar0 * k.ar : R ? R.t.chinhXac : 1)),
    def: Math.max(0, Math.round(def0 ? def0 * k.def : R ? R.t.neTranh : 0)),
    res: Math.min(+B.khangMax || 50, Math.max(0, +(B.khang || [])[bac] || 0)),
  };
}
// cấp quân bậc bac: cấp bot của trận (cấp cao nhất máy chủ lúc khai chiến) + binh.lech + bậc, trong [capMin, capMax]
const capBinh = (bac) => Math.max(+CF.binh.capMin || 1, Math.min(+CF.binh.capMax || 200, (D.cap | 0) + (+CF.binh.lech || 0) + bac));
// thêm 1 con quân (mã từ 100000 — khác dải mã bot): bản danh sách quân đổi (bsv) -> mọi người nhận lại bi
function themBinh(phe, bac, x, y) {
  const tpl = tplBinh(phe, bac), lv = capBinh(bac), c = chiSoBinh(tpl, lv, bac), id = ++D.bseq;
  const e = { id, phe, bac, tpl, lv, mau: c.mau, mauMax: c.mau, dmg: c.st, ar: c.ar, def: c.def, res: c.res, x: Math.round(x), y: Math.round(y), chet: 0, hoi: 0, hv: 0 };
  D.binh.set(id, e); doiHp(e); D.bsv++;
  return e;
}
// lịch đợt Hiệu úy … Đại tướng (client sf_callfightnpc: rải đều trong khoảng phút của trận, chỗ ngẫu nhiên đại doanh / tiền tuyến, không ra lại): mỗi bậc
// binh.dot[i] con mỗi phe, chia đều phút dotTu – dotDen (× tl khi trận dài / ngắn hơn trận gốc) -> [{ luc, phe, bac }] theo giờ
function lichDot() {
  const B = CF.binh, tu = Math.max(0, +B.dotTu || 0) * D.tl, den = Math.max(tu, (+B.dotDen || 20) * D.tl), ds = [];
  for (const phe of [0, 1]) (Array.isArray(B.dot) ? B.dot : []).forEach((n, i) => {
    n = Math.max(0, n | 0);
    for (let j = 0; j < n; j++) ds.push({ luc: D.kc + Math.round((tu + ((den - tu) * (j + 0.5)) / n) * 60000), phe, bac: Math.min(4, i + 1) });
  });
  return ds.sort((a, b) => a.luc - b.luc || a.phe - b.phe || a.bac - b.bac);
}
// Nguyên Soái ra ở chỗ generalpos của phe (không ra lại)
function raSoai(phe) {
  const [x, y] = viTriSoai(phe), e = themBinh(phe, 5, x, y);
  D.soaiRa[phe] = e.id;
  tin(`Nguyên Soái phe ${TEN_PHE[phe]} đã xuất hiện ở đại doanh! Phe nào hạ Nguyên Soái địch trước sẽ giành thắng lợi — trận kết thúc ngay.`, "#ff8a80");
  TG().thongBao(`Tống Kim: Nguyên Soái phe ${TEN_PHE[phe]} đã xuất hiện ở đại doanh!`);
}
// tin trong trận (người trong trận thấy ở khung tin — như Msg2MSAll của kịch bản; trình duyệt chỉ nhận dòng mới)
function tin(text, mau = "") { D.tinId++; D.tin.push([D.tinId, String(text).slice(0, 220), mau]); if (D.tin.length > TIN_GIU) D.tin.shift(); D.doi = true; }

// ---------- tin trình duyệt ----------
// kẻ đánh của 1 dòng: nguồn "#mã" = bot / quân (chỉ chủ trận gửi, con đó chưa chết), còn lại = người gửi -> { ref, k (khóa thùng sát thương), x (người /
// bot / quân) } | null
function keDanh(kn, m, src) {
  if (typeof src === "string" && src[0] === "#") { const b = D.chu === kn.ten ? refCua(src) : null; return b && !b.chet ? { ref: "#" + b.id, k: "#" + b.id, x: b } : null; }
  return { ref: m.ten, k: "@" + m.tk, x: m };
}
const QT_ = (tk) => { try { return require("./bao-mat.js").qtMo(tk); } catch { return false; } }; // quản trị đã mở khóa an toàn: bỏ hạn mức sát thương / giây (anh 18/11 — "Một đòn chết" của công cụ thử)
const hanCua = (A, t) => thung(D.han, A.k, A.x.tk ? +CF.stGiay || 0 : laBinh(A.x) ? +CF.stBinh || 0 : +CF.stBot || 0, 3, t);
// trận: người tên tenV vừa bị ref (tên người | "#mã" bot / quân) đánh / nhắm lúc t (tkn, tkc mục tiêu, tkh mục tiêu) — tkChet chỉ nhận kẻ hạ có ở đây
// trong GAN_MS
function ganDanh(tenV, ref, t) {
  if (D.loai !== "tran" || typeof tenV !== "string" || !tenV || !ref) return;
  const V = D.tenNg.get(tenV); if (!V) return;
  const G = V.gan || (V.gan = new Map());
  G.set(ref, t);
  if (G.size > 64) for (const [k, v] of G) if (t - v > GAN_MS) G.delete(k);
}
// vào trận thì rời tổ đội (anh chốt — đội trưởng rời thì giải tán như engine: to-doi.js raDoi)
function roiDoi(tk, ten) {
  try { const T = TD(); if (T.thanhVien(tk) && T.raDoi) T.raDoi(tk, `${ten} rời khỏi nhóm.`); } catch (e) { console.error("Tống Kim: rời tổ đội", e && e.message); }
}
// hiệu ứng đòn thường lên người (tkn st): chỉ { cg: khung choáng, cm: khung chậm, doc: [sát thương độc, số khung, khung / lần] } — số nguyên trong khoảng
function stCua(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  const o = {}, cg = nguyen(s.cg, 0, ST_MAX, 0), cm = nguyen(s.cm, 0, ST_MAX, 0);
  if (cg) o.cg = cg;
  if (cm) o.cm = cm;
  if (s.ph) o.ph = 1;
  if (s.k != null) { const k = nguyen(s.k, 0, 3, -1); if (k >= 0) o.k = k; } // loại đòn cho phản đòn (bit 1 ngoại công, bit 2 cận chiến — rà soát 12/11)
  // bùa hại của người lên người (anh 12/11 — máy người đánh quyết trúng, tkbot.js tkTrungNguoi): [mã chiêu, cấp] — máy người bị đánh tự lấy chỉ số bùa theo dữ liệu chiêu
  if (Array.isArray(s.bua)) { const id = nguyen(s.bua[0], 0, 99999, 0); if (id > 0) o.bua = [id, nguyen(s.bua[1], 1, 99, 1)]; } // đòn phản đòn / bùa bật lại (anh 10/11): máy nhận không phản tiếp — như cờ bReturn của engine KNpc::CalcDamage
  if (Array.isArray(s.doc)) { const v = nguyen(s.doc[0], 0, 5e6, 0), fr = nguyen(s.doc[1], 1, DOC_MAX, ST_MAX); if (v > 0) o.doc = [v, fr, Math.min(fr, nguyen(s.doc[2], 1, 60, 9))]; } // nhịp ≤ thời gian (ít nhất 1 lần)
  return Object.keys(o).length ? o : null;
}
// trạng thái phòng gửi trình duyệt ("tkMo"): mở (bãi, cho người thường vào không, bản quái chung / riêng) | đã đóng (soát 05/11: kết nối mới / tin tk*
// lạc bãi phải biết phòng đã mất — máy chủ khởi động lại, đóng lúc điện thoại mất mạng — không thì trình duyệt giữ "phòng ma": bãi không quái)
const moTin = () => (D ? { t: "tkMo", bai: D.bai, mo: 1, moi: D.moi ? 1 : 0, chung: D.chung ? 1 : 0, ...(D.loai === "tran" ? { loai: "tran", pha: phaCua() } : {}) }
  : { t: "tkMo", mo: 0 });

// mỗi loại tin: (kết nối, tin, người trong phòng — tkVao: có thể chưa có)
const VIEC = {
  // vào / vào lại phòng: nhân vật ô o từ tệp máy chủ (tên, bản chụp — không tin trình duyệt); bãi thử: lần đầu thì chia phe; trận: chỉ nhân vật đã báo
  // danh trận này (đúng ô, đúng tên — phe theo báo danh; trận đã xong thì chỉ người đã vào trước đó, xem bảng kết quả), không thì "tkMo" kèm khong
  // (trình duyệt đưa về Biện Kinh); vừa vào trận thì rời tổ đội
  tkVao(kn, tin) {
    const t = Date.now(), m0 = D.nguoi.get(kn.ten), o = tin.o | 0, tran = D.loai === "tran";
    // đã trong phòng mà gửi lại liên tục (trình duyệt thật cách ≥ 2 giây): bỏ — mỗi lần đọc tệp tài khoản + chụp nhân vật (soát 05/11: 800 lần / giây
    // làm kẹt cả máy chủ)
    if (m0 && kn.tkVao === D.mo && o === m0.o && t - (m0.luc || 0) < 2000) return; // đổi ô nhân vật thì nhận ngay
    if (!!kn.chung !== !!D.chung) return; // khác bản quái (riêng / chung) với người mở phòng: 2 bản không thấy nhau (the-gioi.js) -> không vào
    if (t - (kn.tkKhong || 0) < 1000) return; // vừa bị từ chối: chờ 1 giây (không đọc tệp tài khoản liên tục)
    const T = D2.docTk(kn.ten), h = T && Array.isArray(T.nv) ? T.nv[o] : null;
    if (!T) return;
    const coTen = !!h && typeof h === "object" && typeof h.name === "string" && !!h.name;
    if (tran) {
      const dk = D.dk.get(kn.ten + "|" + o);
      if (!dk || !coTen || h.name !== dk.ten || (m0 && m0.o !== o) || (D.ket && !m0)) { kn.tkVao = 0; kn.tkKhong = t; kn.gui({ ...moTin(), khong: 1 }); return; }
    } else if (!D.moi && !T.admin) return; // bãi thử chỉ tài khoản quản trị, trừ khi quản trị mở cho mọi người (moi — soát 05/11)
    if (!coTen) return;
    let m = m0;
    if (!m) {
      let phe = 0;
      if (tran) phe = D.dk.get(kn.ten + "|" + o).phe;
      else {
        // chia phe: người đang ở + người vừa rời ≤ ROI_GIU (vào lại giữ phe cũ — soát 05/11: chỉ đếm người đang ở thì vào / ra / vào lại thành 3–0; đếm
        // cả người đã rời hẳn thì người đang ở có thể lệch 0–2)
        const dem = [0, 0], on = trong(t);
        for (const x of D.nguoi.values()) if (x.tk !== kn.ten && (on.has(x.tk) || t - Math.max(x.offLuc || 0, x.luc || 0) < ROI_GIU)) dem[x.phe]++; // luc: lúc vào gần nhất (vòng 100 ms chưa kịp ghi lúc rời)
        phe = dem[0] <= dem[1] ? 0 : 1;
      }
      m = { tk: kn.ten, ten: h.name, o, phe, snap: null, diem: 0, giet: 0, chet: 0, lt: 0, lienMax: 0, binh: 0, chuc: 0, dt: 0, an: false, luc: t, daSv: -1, daSn: -1, daBsv: -1, gan: new Map() };
      D.nguoi.set(kn.ten, m);
    }
    const vaoMoi = kn.tkVao !== D.mo;
    let snap = null;
    try { snap = PTH.chup(h); } catch (e) { console.error("Tống Kim: chụp nhân vật", kn.ten, e && e.message); }
    const doiSnap = JSON.stringify(snap) !== JSON.stringify(m.snap);
    if (m.ten !== h.name) D.tenNg.delete(m.ten);
    Object.assign(m, { ten: h.name, o, snap, dt: tin.dt ? 1 : 0, an: !!tin.an, luc: t, daSv: -1, daSn: -1, daBsv: -1, daHv: null, daTin: 0 }); // lần gửi tới kèm đủ b + bi + sn + hp
    D.tenNg.set(m.ten, m);
    kn.tkVao = D.mo; kn.tkDt = m.dt;
    if (tran && vaoMoi) roiDoi(kn.ten, m.ten);
    if (doiSnap) D.snSv++; // bản chụp đổi mới gửi lại cả phòng
    D.doi = true;
  },
  tkAn(kn, tin, m) { m.an = !!tin.an; },
  // chủ trận báo vị trí bot / quân (10 lần / giây) -> giữ (người vào sau nhận trong vt) + chuyển ngay người khác trong phòng; mục tiêu là người -> ganDanh
  tkh(kn, tin, m) {
    if (D.chu !== kn.ten || !Array.isArray(tin.q)) return;
    const q = [], t = Date.now();
    for (const r of tin.q.slice(0, D.loai === "tran" ? 400 : 160)) {
      const id = Array.isArray(r) ? idCua(r[0]) : NaN, b = D.bot.get(id) || D.binh.get(id); if (!b) continue;
      const x = nguyen(r[1], -1e5, 1e5, 0), y = nguyen(r[2], -1e5, 1e5, 0), tgt = typeof r[8] === "string" ? r[8].slice(0, 40) : "";
      D.vt.set(b.id, [x, y]);
      if (tgt && !b.chet) ganDanh(tgt, "#" + b.id, t);
      q.push([b.id, x, y, nguyen(r[3], 0, 7, 0), ACTS.has(r[4]) ? r[4] : "stand", nguyen(r[5], 0, 1e9, 0), r[6] === 2 || r[6] === 3 ? r[6] : 1, r[7] ? 1 : 0, tgt, r[9] ? 1 : 0]); // [9] bot đang cưỡi ngựa (anh 06/11)
    }
    if (!q.length) return;
    const ra = { t: "tkh", ts: nguyen(tin.ts, 0, 1e13, 0), q, ...(tin.d ? { d: 1 } : {}) }; // d: tin báo đòn (chỉ con vừa vung — máy khác không lấy làm mốc nhịp)
    for (const [tk, k] of trong()) if (tk !== kn.ten) k.gui(ra);
  },
  // chiêu (người + bot / quân của chủ trận) -> người khác trong phòng vẽ / máy người bị đánh tự tính sát thương; nguồn "" = chiêu của chính người gửi;
  // mục tiêu là người -> ganDanh
  tkc(kn, tin, m) {
    if (!Array.isArray(tin.c)) return;
    const t = Date.now(), H = thung(D.hanC, kn.ten, D.chu === kn.ten ? C_CHU : C_GIAY, 3, t), c = [];
    for (const r of tin.c.slice(0, 60)) {
      if (H.han < 1) break;
      if (!Array.isArray(r)) continue;
      let src = m.ten;
      if (r[0] !== "" && r[0] != null) { const b = D.chu === kn.ten ? refCua(r[0]) : null; if (!b || b.chet) continue; src = "#" + b.id; }
      const sk = Math.floor(+r[1]); if (!(sk >= 1 && sk <= 99999)) continue;
      H.han--;
      const tgt = typeof r[7] === "string" ? r[7].slice(0, 40) : "";
      if (tgt) ganDanh(tgt, src, t);
      // pv: chiêu của chính người gửi, máy họ tự tính trúng người (tkn) -> máy nhận chỉ vẽ (anh 12/11; bản cũ không có cờ -> máy nhận tính như trước)
      c.push([src, sk, nguyen(r[2], 1, 99, 1), nguyen(r[3], -1e6, 1e6, 0), nguyen(r[4], -1e6, 1e6, 0), nguyen(r[5], -1e6, 1e6, 0), nguyen(r[6], -1e6, 1e6, 0), tgt, src === m.ten && r[8] === 1 ? 1 : 0]);
    }
    if (!c.length) return;
    const ra = { t: "tkc", c };
    for (const [tk, k] of trong()) if (tk !== kn.ten) k.gui(ra);
  },
  // sát thương lên bot / quân (người đánh / bot, quân đánh nhau do chủ trận báo): chỉ phe kia, hạn mức theo kẻ đánh; hết máu -> kẻ đánh được điểm, báo cả
  // phòng ngay; sát thương người thật lên Nguyên Soái cộng vào soaiSt (thưởng Hồn Thạch người đánh nhiều nhất)
  tkd(kn, tin, m) {
    const t = Date.now();
    let coChet = false;
    for (const r of Array.isArray(tin.d) ? tin.d.slice(0, 120) : []) {
      if (!Array.isArray(r)) continue;
      const id = idCua(r[0]), b = D.bot.get(id) || D.binh.get(id), v = Math.floor(+r[1] || 0);
      if (!b || b.chet || !(b.mau > 0) || !(v > 0)) continue;
      const A = keDanh(kn, m, r[2]); if (!A || A.x.phe === b.phe) continue;
      const H = hanCua(A, t), qt = A.x.tk && QT_(A.x.tk), nhan = Math.floor(Math.min(v, qt ? Infinity : H.han, b.mau)); if (!(nhan > 0)) continue; // qt: quản trị một đòn chết (anh 18/11)
      if (!qt) H.han -= nhan; b.mau -= nhan; b.dan = A.ref; doiHp(b);
      if (laBinh(b)) {
        if (b.bac === 5 && A.x.tk) { const S = D.soaiSt[b.phe]; S.set(A.ref, (S.get(A.ref) || 0) + nhan); }
        if (b.mau <= 0) { chetBinh(b, A.x); coChet = true; }
      } else if (b.mau <= 0) { chetBot(b, A.x); coChet = true; }
    }
    if (coChet) phat(trong());
    // choáng / chậm người chơi gây cho bot / quân phe kia -> chủ trận (máy chạy não)
    const st = [];
    for (const r of Array.isArray(tin.st) ? tin.st.slice(0, 60) : []) {
      const id = Array.isArray(r) ? idCua(r[0]) : NaN, b = D.bot.get(id) || D.binh.get(id); if (!b || b.chet || b.phe === m.phe) continue;
      const a = nguyen(r[1], 0, 30000, 0), c = nguyen(r[2], 0, 30000, 0), h = nguyen(r[3], 0, 8000, 0); if (a || c || h) st.push(h ? [b.id, a, c, h] : [b.id, a, c]); // h: hoảng loạn (Thiên Nhẫn 120)
    }
    if (st.length && D.chu && D.chu !== kn.ten) { const k = trong().get(D.chu); if (k) k.gui({ t: "tkst", st }); }
  },
  // chủ trận: bot hồi máu (thuốc, Nga My) — mỗi con mỗi giây tối đa hoiGiay × máu tối đa, chỉ con còn sống (quân không hồi)
  tkHoi(kn, tin) {
    if (D.chu !== kn.ten || !Array.isArray(tin.h)) return;
    const t = Date.now();
    for (const r of tin.h.slice(0, 160)) {
      const b = Array.isArray(r) ? D.bot.get(idCua(r[0])) : null, v = Array.isArray(r) ? Math.floor(+r[1] || 0) : 0;
      if (!b || b.chet || !(b.mau > 0) || !(b.mauMax > 0) || !(v > 0)) continue;
      const H = thung(D.hanHoi, b.id, (+CF.hoiGiay || 0) * b.mauMax, 1, t), them = Math.floor(Math.min(v, H.han, b.mauMax - b.mau));
      if (!(them > 0)) continue;
      H.han -= them; b.mau += them; doiHp(b);
    }
  },
  // đòn thường trúng người thật (người / bot / quân của chủ trận) -> chỉ máy người bị đánh (tự trừ máu); chung hạn mức sát thương của kẻ đánh. Trận: chỉ lúc
  // đang đánh (báo danh / đã xong: không đánh người)
  tkn(kn, tin, m) {
    if (D.loai === "tran" && phaCua() !== "danh") return;
    const A = keDanh(kn, m, tin.src); if (!A || typeof tin.ai !== "string" || !tin.ai) return;
    let V = null, vk = null;
    for (const [tk, k] of trong()) { const x = D.nguoi.get(tk); if (x.ten === tin.ai) { V = x; vk = k; break; } }
    if (!V || V.phe === A.x.phe) return;
    const t = Date.now();
    ganDanh(V.ten, A.ref, t);
    // đòn phải có sát thương hoặc độc (soát 05/11: đòn 0 kèm choáng / độc không tốn hạn mức); độc tính vào hạn mức như sát thương
    const v = Math.floor(so(tin.v, 0, 5e6, 0)), st = stCua(tin.st), dv = st && st.doc ? st.doc[0] : 0;
    if (A.k[0] === "@" && v > 0 && !(tin.st && tin.st.ph)) ND.pk(kn.ten, v, tin.crit, "Tống Kim", D.hs); // nghi hack sát thương (anh 16/11 — may-chu/nghi-dame.js, chỉ ghi): đòn của chính người gửi, không phải bot; D.hs: hệ số PK của phòng (số đã nhân)
    // bùa hại chỉ nhận khi người đánh (người — không phải bot / quân) đã học chiêu đó (bản chụp lúc vào phòng); Hấp Tinh Yểm_Quyết Chú 719 do Hấp Tinh Yểm 711 tự phát;
    // cấp tối đa = cấp đã học + 5 (đồ cộng cấp chiêu) — rà soát 12/11: trước nhận mã / cấp bất kỳ
    if (st && st.bua) {
      const sk = A.x.tk && A.x.snap && A.x.snap.skills, goc = BUA_GOC[st.bua[0]] || st.bua[0], L = sk ? +sk[goc] | 0 : 0;
      // 723 cấp 41–60 = hoảng loạn lúc Thiên Nhẫn chết (715 autodeathskill: cấp 40 + cấp 715 — soát 13/11): giữ bậc đó, không ép về cấp đã học + 5 (sai thời gian)
      const chet = st.bua[0] === 723 && st.bua[1] > 40;
      if (L < 1) { delete st.bua; if (!Object.keys(st).length) return; } else st.bua[1] = Math.min(st.bua[1], chet ? Math.min(60, 40 + L + 5) : L + 5);
      // hoảng loạn Thiên Nhẫn 120 (723 — anh 13/11): mỗi người đánh -> mỗi người bị đánh tối đa 1 lần / 14 giây (hồi chiêu 715 là 15 giây) — máy sửa đổi không khóa người khác
      // liên tục; nhiều đạn cùng trúng 1 người trong 1 lần ra chiêu chỉ tính 1 (D.hlLuc theo phòng — trận mới là phòng mới)
      if (st.bua && st.bua[0] === 723) {
        const HL = D.hlLuc || (D.hlLuc = new Map()), kh = A.ref + "\u0001" + V.ten + (chet ? "\u0001c" : ""); // lúc chết: hạn riêng (không bị lần ra chiêu trước nuốt mất)
        if (t - (HL.get(kh) || 0) < 14000) { delete st.bua; if (!Object.keys(st).length) return; } else HL.set(kh, t);
      }
    }
    // chỉ bùa / choáng / chậm (không sát thương, không độc): giới hạn riêng 6 / giây mỗi người đánh (không tốn hạn mức sát thương — khóa riêng không trùng tên tài khoản)
    if (!(v > 0) && !(dv > 0)) { if (!(st && (st.bua || st.cg || st.cm))) return; const HB = thung(D.hanC, "\u0001b" + kn.ten, 6, 3, t); if (HB.han < 1) return; HB.han--; }
    const H = hanCua(A, t), nhan = Math.floor(Math.min(v, H.han)); H.han -= nhan;
    if (dv > 0) { const dn = Math.floor(Math.min(dv, H.han)); H.han -= dn; if (dn > 0) st.doc[0] = dn; else delete st.doc; }
    if (!(nhan > 0) && !(st && (st.doc || st.bua || st.cg || st.cm))) return; // hết hạn mức
    vk.gui({ t: "tkt", tu: laBinh(A.x) ? tenBinh(A.x.phe, A.x.bac) : A.x.ten, ref: A.ref, v: nhan, crit: tin.crit ? 1 : 0, ...(st && Object.keys(st).length ? { st } : {}) });
  },
  // người gửi chết: tu = "#mã" bot / quân | tên nhân vật | "" — kẻ hạ (người / bot) phe kia thì được điểm; quân hạ: chỉ đếm chết. Trận: kẻ hạ phải vừa
  // đánh / nhắm người này trong GAN_MS (ganDanh), chưa khai chiến / đã xong thì không tính
  tkChet(kn, tin, m) {
    const t = Date.now(), tran = D.loai === "tran";
    m.hoanMat = t; // trọng thương: mất hết hiệu quả hoàn (hoanTran — anh 17/11), kể cả lúc chưa khai chiến
    if (tran && phaCua(t) !== "danh") return;
    if (t - (m.chetLuc || 0) < CHET_CACH()) return;
    m.chetLuc = t;
    const tu = typeof tin.tu === "string" ? tin.tu.slice(0, 40) : "";
    let A = tu ? refCua(tu) : null;
    if (A && (A.chet || laBinh(A))) A = null;
    // kẻ hạ là người: phải đang trong phòng (soát 05/11: tên bất kỳ cũng được cộng — nhờ người ngoài phòng cày điểm)
    if (!A && tu && tu[0] !== "#") for (const [tk2] of trong(t)) { const x = D.nguoi.get(tk2); if (x && x.ten === tu) { A = x; break; } }
    if (A && tran && !(m.gan && t - (m.gan.get(A.tk ? A.ten : "#" + A.id) || -1e15) <= GAN_MS)) A = null;
    if (A && A.phe !== m.phe) cong(A, m); else { m.chet++; m.lt = 0; D.doi = true; }
  },
  // chủ trận: bot (Nga My…) hồi máu người thật CÙNG PHE ở máy khác -> máy người đó dùng chiêu hồi máu lên mình (trình duyệt chỉ nhận chiêu hồi máu)
  tkHoiNg(kn, tin) {
    if (D.chu !== kn.ten || typeof tin.ai !== "string") return;
    const b = botRef(tin.b); if (!b || b.chet) return;
    let vk = null; for (const [tk, k] of trong()) { const x = D.nguoi.get(tk); if (x.ten === tin.ai && x.phe === b.phe) { vk = k; break; } }
    if (!vk) return;
    const t = Date.now(); if (t - (vk.tkHoiLuc || 0) < 1000) return; vk.tkHoiLuc = t;
    vk.gui({ t: "tkhn", id: nguyen(tin.id, 1, 99999, 1), lv: nguyen(tin.lv, 1, 40, 1) });
  },
  // sinh lực tối đa của bot (trình duyệt dựng thân bot rồi tính — máu gốc, máy chủ nhân chức): chủ trận báo — chưa có chủ trận thì ai trong phòng báo
  // cũng được
  tkMau(kn, tin) {
    if ((D.chu && D.chu !== kn.ten) || !Array.isArray(tin.m)) return;
    for (const r of tin.m.slice(0, 160)) {
      const b = Array.isArray(r) ? D.bot.get(idCua(r[0])) : null, v = Array.isArray(r) ? Math.floor(+r[1]) : NaN;
      if (!b || !Number.isFinite(v)) continue;
      const goc = Math.max(1, Math.min(5e6, v)); if (goc === b.mauGoc && b.mauMax > 0) continue;
      const cu = b.mauMax, mx = Math.max(1, Math.round(goc * hsMau(b.chuc)));
      b.mauGoc = goc; b.mauMax = mx; b.mau = !cu && !b.chet ? mx : Math.min(b.mau, mx); doiHp(b);
    }
  },
  // vừa dùng Chiến cổ / Lệnh Bài (do.js dungVat trả tkDoi — choDoi ghi quyền chuyển): chuyển trạng thái cho mọi người KHÁC cùng phe trong phòng (máy nhận
  // tự xem khoảng cách — bán kính chiêu client 400, tongkim.js BUFF_R); không có quyền (chưa dùng món) thì bỏ
  tkBuff(kn, tin, m) {
    const k = typeof tin.k === "string" ? tin.k : "", t = Date.now(), L = D.doiCho.get(m.tk) || [], i = L.findIndex((x) => x.k === k && t - x.luc < DOI_GIU);
    if (i < 0) return;
    const x = L.splice(i, 1)[0], ra = { t: "tkBuff", k, giay: nguyen(tin.giay, 1, x.giay, x.giay), tu: m.ten };
    for (const [tk, k2] of trong(t)) { const y = D.nguoi.get(tk); if (tk !== kn.ten && y && y.phe === m.phe) k2.gui(ra); }
  },
};
// tin tk* chỉ nhận ở bãi phòng; mọi tin làm mới lúc báo sống; ngoài tkVao chỉ nhận từ người đã vào phòng này. Lỗi bất kỳ không ra ngoài
for (const [loai, fn] of Object.entries(VIEC)) WS.nhan(loai, (kn, tin) => {
  if (!D || kn.zone !== D.bai) { if (loai === "tkVao") kn.gui(moTin()); return; } // phòng đã mất / khác bãi: báo lại trạng thái (trình duyệt bỏ "phòng ma")
  kn.tkLuc = Date.now();
  const m = kn.tkVao === D.mo && !!kn.chung === !!D.chung ? D.nguoi.get(kn.ten) || null : null;
  if (!m && loai !== "tkVao") return;
  try { fn(kn, tin && typeof tin === "object" ? tin : {}, m); } catch (e) { console.error(`Tống Kim ${loai}:`, e && e.message); }
});
// vào bãi phòng (ws.js "vao"): báo phòng đang mở -> trình duyệt gửi tkVao; sang bãi khác thì ra khỏi phòng ngay. Vừa mở kết nối: báo nếu có phòng
// (trình duyệt tự xem có đang ở bãi đó không)
// Người đã ở trong phòng nối lại kênh / quay lại bãi phòng: vào lại ngay (soát 05/11: kết nối mới không có tkVao -> rơi khỏi phòng, trình duyệt
// tưởng vẫn trong trận)
WS.nhan("vao", (kn) => {
  if (!D || kn.zone !== D.bai) { kn.tkVao = 0; if (!D) kn.gui(moTin()); return; }
  kn.gui(moTin());
  const m = D.nguoi.get(kn.ten);
  if (m && m.o === kn.o && !!kn.chung === !!D.chung) {
    kn.tkVao = D.mo; kn.tkDt = m.dt; kn.tkLuc = Date.now(); m.daSv = -1; m.daSn = -1; m.daBsv = -1; m.daHv = null; m.daTin = 0; D.doi = true;
    if (D.loai === "tran") roiDoi(kn.ten, m.ten);
  } else kn.tkVao = 0; // khác ô nhân vật / khác bản quái: ra khỏi phòng tới khi tkVao lại (soát 05/11 lần 2: trước giữ kn.tkVao cũ — nửa trong nửa ngoài)
});
WS.nhan("mo", (kn) => kn.gui(moTin()));

// ---------- trận theo lịch: giai đoạn, mở / khai chiến / kết thúc, thưởng ----------
// giai đoạn: "" không có trận | "bd" báo danh (chưa khai chiến) | "danh" đang đánh | "xong" đã xong (bảng kết quả); bãi thử luôn "danh"
const phaCua = (t = Date.now()) => (!D ? "" : D.loai !== "tran" ? "danh" : D.ket ? "xong" : t < D.kc ? "bd" : "danh");
// lịch gửi lich-hd.js / Mộ binh quan: { pha, u (mở báo danh), kc (khai chiến), het, gio (giờ của trận | danh sách giờ khi không có trận), diem, thienTu }
function lich(now = Date.now()) {
  if (!D || D.loai !== "tran") return { pha: "", gio: CF.gio, cap: CF.cap, phi: CF.phi, thienTu: false };
  return { pha: phaCua(now), u: D.u, kc: D.kc, het: D.het, gio: D.gio, diem: D.diem.slice(), thienTu: !!D.x2, cap: CF.cap, phi: CF.phi, soNguoi: D.dk.size,
    thang: D.thang == null ? null : D.thang };
}
// đang có trận chưa xong (khoi-dong-s1.sh — không khởi động lại máy chủ giữa trận; lịch đến giờ mà trận trước chưa xong thì không mở)
const dangTran = () => !!(D && D.loai === "tran" && !D.ket);
// đang đánh (Quân Nhu quan không bán / không đúc — client song_shop.lua)
const dangDanh = (t = Date.now()) => !!(D && D.loai === "tran" && !D.ket && t >= D.kc);
// trận Thiên Tử (client "Đêm Huy Hoàng" — anh chốt: trận tối thứ 3, 5, 7 nhân đôi điểm thưởng + kinh nghiệm): trận giờ muộn nhất trong ngày của lịch (GM
// dời giờ vẫn đúng), ngày trong tuần theo lúc mở báo danh (trận qua nửa đêm vẫn tính ngày bắt đầu)
function laThienTu(gio, u) {
  const L = (Array.isArray(CF.gio) ? CF.gio : []).filter(GV.hopLe).sort(), thu = Array.isArray(CF.thienTu.thu) ? CF.thienTu.thu.map(Number) : [];
  return !!gio && L.length > 0 && gio === L[L.length - 1] && thu.includes(GV.vn(u).thu) && (+CF.thienTu.heSo || 1) > 1;
}
const soPhe = () => { const c = [0, 0]; if (D && D.dk) for (const x of D.dk.values()) c[x.phe]++; return c; };
const vnPhut = (ms) => String(Math.round((ms / 60000) * 10) / 10).replace(".", ",");
// mở trận (lịch / quản trị thử): { gio?, u? (lúc mở báo danh — máy chủ vừa chạy lại giữa giờ báo danh), baoDanh?, danh?, soai1?, soai2?, vaoMuon? (phút —
// quản trị thử: số lẻ được; trận ngắn hơn thì phút Nguyên Soái / vào muộn co theo), soBot?, thienTu? } — bãi thử / trận cũ đã xong đang mở thì đóng
function moTran(opt = {}) {
  if (D && D.loai === "tran" && !D.ket) loi("Đang có trận Tống Kim");
  const td = docTd();
  if (!td || !Array.isArray(td.phe) || td.phe.length < 2) loi("Chưa có dữ liệu chiến trường Tống Kim (assets/data/tong-kim.json)");
  const t = Date.now(), soP = (v, d) => (v !== "" && v != null && typeof v !== "boolean" && Number.isFinite(+v) && +v >= 0 ? +v : d);
  const bd = soP(opt.baoDanh, +CF.baoDanh || 0), dn = Math.max(0.1, soP(opt.danh, +CF.danh || DANH_GOC)), ty = dn / Math.max(1, +CF.danh || DANH_GOC);
  const s1 = Math.min(dn, soP(opt.soai1, (+CF.soai1 || 0) * ty)), s2 = Math.min(dn, Math.max(s1, soP(opt.soai2, (+CF.soai2 || 0) * ty)));
  // anh 13/11 (lượt 86 — "k giới hạn thời gian vào tống kim, trận mở rồi vào lúc nào cũng dc"): CF.vaoTuDo -> báo danh / vào suốt trận (tới lúc hết giờ); tắt thì như cũ tới phút vaoMuon
  const vm = CF.vaoTuDo !== false && opt.vaoMuon == null ? dn : Math.min(dn, soP(opt.vaoMuon, (+CF.vaoMuon || 0) * ty));
  const soBot = opt.soBot == null ? Math.max(1, Math.min(CF.soBotMax | 0, CF.soBot | 0)) : soNguyen(opt.soBot, 1, CF.soBotMax | 0, "Số bot mỗi phe");
  const u = Number.isFinite(opt.u) && opt.u <= t ? opt.u : t, kc = u + Math.round(bd * 60000), het = kc + Math.round(dn * 60000);
  if (D) { D = null; WS.guiHet(moTin()); } // bãi thử / trận cũ đã xong: đóng
  moCuoi = Math.max(t, moCuoi + 1);
  const gio = typeof opt.gio === "string" && GV.hopLe(opt.gio) ? opt.gio : null, x2 = laThienTu(gio, u) || !!opt.thienTu;
  const bai = Number.isInteger(+td.bai) && +td.bai > 0 ? +td.bai : 380; // chiến trường 380 Xung phong — anh 06/11 chọn
  const hau = (p) => { const L = ds2((((td.phe[p] || {}).hau) || {}).diem); return L.length ? [Math.round(+L[0][0]), Math.round(+L[0][1])] : [0, 0]; };
  D = { mauBot: MAU_BOT.slice(), loai: "tran", bai, mo: moCuoi, td, gio, u, kc, het, s1: Math.round(s1 * 60000), s2: Math.round(s2 * 60000), vm: Math.round(vm * 60000), tl: dn / DANH_GOC, x2,
    trai: [hau(0), hau(1)], R: CF.R, tri: Math.max(1, Math.min(3, CF.tri | 0)), hs: Math.max(HS[0], Math.min(HS[1], +CF.heSoSt || 1)), soBot, cap: 0, moi: 1, chung: 0,
    sv: 1, snSv: 1, bsv: 1, hv: 0, nguoi: new Map(), tenNg: new Map(), bot: new Map(), vt: new Map(), binh: new Map(), dk: new Map(), chu: null, diem: [0, 0],
    kk: [], doi: true, guiLuc: 0, han: new Map(), hanHoi: new Map(), hanC: new Map(), seq: 0, bseq: 99999, phai: [tron(PHAI), tron(PHAI)],
    ten: { nam: [], nu: [], chung: [] }, thatTen: new Set(), batDau: false, ket: null, ketLuc: 0, raLuc: 0, thang: null, soaiLuc: null, soaiRa: [0, 0],
    soaiSt: [new Map(), new Map()], dot: [], tin: [], tinId: 0, baoLuc: t, bao3: false, bao1: false, doiCho: new Map() };
  WS.guiHet(moTin());
  const con = Math.max(0, Math.round((kc - t) / 60000));
  TG().thongBao(`Tống Kim đại chiến đã bắt đầu báo danh! Đẳng cấp từ ${CF.cap} trở lên hãy nhờ Xa phu đưa đến Điểm báo danh Tống Kim (ủng hộ ${N.tien(CF.phi)}). ${con > 0 ? `Còn ${con} phút nữa khai chiến.` : "Sắp khai chiến."}${x2 ? ` Chiến dịch lần này là Đêm Huy Hoàng — ${MT.thuong("phần thưởng gấp đôi")}!` : ""}`, true);
  return lich();
}
// khai chiến: không ai báo danh thì thôi trận; bot (cấp theo cấp cao nhất máy chủ lúc này) + Tống binh / Kim binh ra trận, lịch đợt quân bậc cao
function batDau(t) {
  if (!D.dk.size) {
    const g = D.gio; D = null; WS.guiHet(moTin());
    TG().thongBao(`Trận Tống Kim${g ? ` ${g}` : ""} không có ai báo danh — trận không mở.`);
    return;
  }
  D.batDau = true; D.cap = capCao() || +CF.cap || 100; D.ten = docTen(); D.thatTen = tenThat(); D.baoLuc = t; D.bdLuc = t; D.tgLuc = t;
  for (const phe of [0, 1]) for (let i = 0; i < D.soBot; i++) themBot(phe);
  D.sv++;
  for (const phe of [0, 1]) for (let i = 0; i < Math.max(0, CF.binh.so | 0); i++) { const [x, y] = diemDong(phe); themBinh(phe, 0, x, y); }
  D.dot = lichDot();
  const c = soPhe();
  tin(`Khai chiến! Quân hai phe đã xuất doanh. Nguyên Soái phe ít điểm xuất hiện ở phút ${vnPhut(D.s1)}, phe kia phút ${vnPhut(D.s2)} — hạ Nguyên Soái địch trước là thắng, trận kết thúc ngay.`, "#ffeb3b");
  TG().thongBao(`Tống Kim đã khai chiến (Tống ${c[0]} – Kim ${c[1]} người)!${D.vm > 0 ? ` Đẳng cấp ${CF.cap} trở lên vẫn có thể báo danh ở Điểm báo danh Tống Kim ${vaoHet(D) ? "bất cứ lúc nào trước khi trận kết thúc" : `tới phút ${vnPhut(D.vm)} của trận`}.` : ""}`);
  D.doi = true;
}
// hết giờ / hạ Nguyên Soái địch (chetBinh — anh 06/11) / quản trị kết thúc: phe thắng (hạ Nguyên Soái trước ?? nhiều điểm hơn ?? Tống), bảng kết quả,
// thưởng người đủ điều kiện (đã báo danh, còn trong trận hoặc rời chưa quá thuong.roiGiu giây, điểm trận ≥ diemMin), bỏ bot + quân; raSau giây sau trình
// duyệt tự đưa về Biện Kinh, giuKq giây sau đóng phòng
function ketThuc(t = Date.now()) {
  if (!D || D.loai !== "tran" || D.ket) return null;
  const [a, b] = D.diem, doSoai = D.thang != null, thang = doSoai ? D.thang : b > a ? 1 : 0, on = trong(t), T = CF.thuong, x2 = !!D.x2, hs2 = x2 ? Math.max(1, +CF.thienTu.heSo || 2) : 1;
  const lyDo = doSoai ? "hạ Nguyên Soái địch trước" : a === b ? "bằng điểm — phe Tống thắng" : "nhiều điểm trận hơn";
  D.thang = thang;
  const ds = xepDiem(), bang = ds.slice(0, 30).map(dongDiem);
  // người thật đánh Nguyên Soái phe p nhiều nhất (+htSoai Hồn Thạch — mỗi Nguyên Soái 1 người)
  const soai = [0, 1].map((p) => { let top = null, max = 0; for (const [ref, v] of D.soaiSt[p]) if (v > max) { max = v; top = ref; } return top; });
  const me = {}, thuong = {}, nguoiXep = ds.filter((x) => D.nguoi.get(x.tk) === x); // hạng trong số người thật (htTop — bot không tính)
  for (const m of D.nguoi.values()) {
    me[m.tk] = { ten: m.ten, phe: m.phe, diem: m.diem, giet: m.giet, chet: m.chet, chuc: m.chuc, lienMax: m.lienMax | 0, binh: m.binh | 0, hang: ds.indexOf(m) + 1, thang: m.phe === thang ? 1 : 0 };
    const coMat = on.has(m.tk) || (m.offLuc > 0 && t - m.offLuc < (+T.roiGiu || 120) * 1000);
    if (!D.dk.has(m.tk + "|" + m.o)) continue;
    // anh 18/11 — nguồn sự kiện: Trung Dược theo thời gian trong trận (nskTk); không đủ điều kiện quà Tống Kim (rời trận / ít điểm) vẫn nhận phần này (traoNsk)
    let tre = 5; try { tre = +require("./nguon-su-kien.js").cf().tongKim.tre; } catch {}
    const nsk = nskTk((m.tg || 0) / 1000, coMat && m.dau != null && m.dau - (D.bdLuc || m.dau) <= tre * 60000);
    if (!coMat || m.diem < (+T.diemMin || 0)) { if (nsk.length) try { traoNsk(m, nsk, t); } catch (e) { console.error("Tống Kim: nguồn sự kiện", m.tk, e && e.message); } continue; }
    try { const r = traoThuong(m, thang, soai, hs2, me[m.tk].hang, t, nguoiXep.indexOf(m) + 1, nsk); if (r) thuong[m.tk] = r; } catch (e) { console.error("Tống Kim: thưởng", m.tk, e && e.message); }
  }
  D.ket = { thang, diem: D.diem.slice(), bang, me, thuong, soai, x2 };
  D.ketLuc = t; D.raLuc = t + Math.max(0, +CF.raSau || 0) * 1000; D.dot = [];
  D.bot.clear(); D.binh.clear(); D.vt.clear(); D.sv++; D.bsv++; // bot + quân rút
  D.ket.lyDo = lyDo;
  tin(`Trận Tống Kim kết thúc: phe ${TEN_PHE[thang]} giành thắng lợi (${lyDo})! Tống ${vn(a)} điểm — Kim ${vn(b)} điểm.`, "#7cff7c");
  TG().thongBao(`Tống Kim${D.gio ? ` ${D.gio}` : ""} kết thúc: phe ${TEN_PHE[thang]} giành thắng lợi — ${lyDo} (Tống ${vn(a)} : Kim ${vn(b)} điểm).`);
  D.doi = true;
  return D.ket;
}
// thưởng 1 người (ghi thẳng tệp tài khoản — dac-ta-dot2 §0, doc-4 cách B; yêu cầu không có await giữa đọc và ghi tệp nên không đè nhau): điểm Tống Kim =
// (điểm trận + thang / thua) × Thiên Tử; Hồn Thạch ht[thắng / thua] + htThem (từ htMoc điểm) + htSoai (đánh Nguyên Soái địch nhiều nhất) — không khóa (khoa
// 0, anh 06/11); kinh nghiệm = min(knToiDa, điểm × (700 + ⌊(cấp − 40) / 5⌋ × 100) × knHs) × Thiên Tử (cộng thẳng, không nhân kinhNghiem — như thưởng
// thắng Phong Hỏa); Huân công bài (thắng, từ hcDiem điểm, tối đa hcNgay cái mỗi ngày Việt Nam — h.tkNgay; hết hạn 24:00 ngày hôm sau). Túi đầy: món vào
// h.quaCho (nhịp thử lại — api.js). Câu báo h.tkTin -> { diemTk, ht, kn, hc }
// hangNg: hạng trong số người thật — top 1 / 2 / 3 thêm htTop[0 / 1 / 2] Hồn Thạch (anh 12/11 "điều chỉnh top 1 2 3 tống kim dc 1 viên nhạc vương hồn thạch")
function traoThuong(m, thang, soai, hs2, hang, t, hangNg = 0, nsk = []) {
  const T = CF.thuong, acc = D2.docTk(m.tk), h = acc && Array.isArray(acc.nv) ? acc.nv[m.o] : null;
  if (!h || h.name !== m.ten) return null;
  const win = m.phe === thang, htL = Array.isArray(T.ht) ? T.ht : [2, 0];
  const diemTk = Math.max(0, Math.round((m.diem + (win ? +T.thang || 0 : +T.thua || 0)) * hs2));
  const htTop = hangNg >= 1 && Array.isArray(T.htTop) ? Math.max(0, +T.htTop[hangNg - 1] || 0) : 0;
  let ht = Math.max(0, (+htL[win ? 0 : 1] || 0) + (m.diem >= (+T.htMoc || Infinity) ? +T.htThem || 0 : 0) + (soai[1 - m.phe] === m.ten ? +T.htSoai || 0 : 0) + htTop);
  const lv = h.lvl || 1, hsCap = 700 + Math.floor((lv - 40) / 5) * 100;
  const kn = Math.max(0, Math.min(+T.knToiDa || 0, Math.floor(m.diem * hsCap * (+T.knHs || 0) + 1e-6))) * hs2;
  const hom = GV.vn(t).ngay;
  if (!h.tkNgay || h.tkNgay.ngay !== hom) h.tkNgay = { ngay: hom, hc: 0, tran: 0 };
  h.tkNgay.tran = (h.tkNgay.tran | 0) + 1;
  let hc = 0;
  if (win && m.diem >= (+T.hcDiem || 0) && (h.tkNgay.hc | 0) < (+T.hcNgay || 0)) { hc = 1; h.tkNgay.hc = (h.tkNgay.hc | 0) + 1; }
  // món (dữ liệu chưa có món thì bỏ — báo lỗi máy chủ, không kẹt hàng chờ)
  const mon = [];
  if (ht > 0) { if (N.BY.has(T.htMon)) mon.push({ k: T.htMon, n: ht }); else { console.error("Tống Kim: chưa có món", T.htMon); ht = 0; } }
  if (hc) { if (N.BY.has(T.hcMon)) mon.push({ k: T.hcMon, n: 1, het: GV.lucCua(GV.sangNgay(hom, 2), "00:00") }); else { console.error("Tống Kim: chưa có món", T.hcMon); hc = 0; h.tkNgay.hc--; } }
  // anh 16/11 — Báo Đáp Ân Sư: Đỗ Khang Tửu theo điểm trận (cả thắng lẫn thua — như client finishsongjin), không nhân Thiên Tử; cùng gói: túi đầy thì chờ ở h.quaCho
  const ev = [...bdMon("tk", m.diem), ...nsk], evChu = ev.map((x) => `${x.n} ${String(DO.tenMon({ k: x.k })).trim()}`).join(", ");
  mon.push(...ev);
  let cho = false;
  if (mon.length) {
    const q = { mon, kbh: T.khoa ? N.KBH_VV : 0 };
    try { DO.taoQua(h, q); } catch { h.quaCho = [...(h.quaCho || []), { ...q, luc: t, tk: 1 }]; cho = true; }
  }
  h.exp = (h.exp || 0) + kn; h.lvl = h.lvl || 1; const len = N.lenCap(h);
  h.diemTk = (h.diemTk | 0) + diemTk;
  const tenHt = String(DO.tenMon({ k: T.htMon })).trim();
  const L = [`Tống Kim${D.gio ? ` ${D.gio}` : ""}: phe ${TEN_PHE[thang]} thắng — phe ta ${win ? "thắng" : "thua"}; ${vn(m.diem)} điểm trận, hạng ${hang}.`,
    ...(htTop ? [`Top ${hangNg} người chơi trận này: thưởng thêm ${htTop} ${String(DO.tenMon({ k: T.htMon })).trim()}.`] : []),
    `Nhận ${vn(diemTk)} điểm Tống Kim${hs2 > 1 ? ` (Thiên Tử ×${hs2})` : ""}, ${vn(kn)} kinh nghiệm${len ? ` (lên ${len} cấp)` : ""}${ht ? `, ${ht} ${tenHt}` : ""}${hc ? `, 1 ${String(DO.tenMon({ k: T.hcMon })).trim()} (hết hạn 24:00 ngày mai)` : ""}.`,
    ...(evChu ? [`Hoạt động báo đáp ân sư: nhận thêm ${evChu}.`] : [])];
  if (cho) L.push("Hành trang không đủ chỗ — vật phẩm thưởng đang chờ, dọn túi là tự nhận.");
  h.tkTin = [...(Array.isArray(h.tkTin) ? h.tkTin : []), ...L].slice(-20);
  D2.ghiTk(acc);
  try { BHO().cong(m.tk, m.o, m.ten, "tongKim", null, { diem: m.diem }); } catch {} // bang hội đợt 2: điểm trận × 0,03 (từ 100 điểm, ≤ 150) — không nhân Thiên Tử
  NK().ghi("hd", m.tk, h.name, `Tống Kim${D.gio ? ` ${D.gio}` : ""} (${win ? "thắng" : "thua"}, ${m.diem} điểm trận): +${diemTk} điểm Tống Kim, +${kn} kinh nghiệm${ht ? `, +${ht} ${tenHt}` : ""}${hc ? ", +1 Huân công bài" : ""}${evChu ? `, +${evChu} (báo đáp ân sư)` : ""}${cho ? " (túi đầy — chờ nhận)" : ""}`);
  return { diemTk, ht, kn, hc };
}
// anh 18/11 — nguồn sự kiện cho người không nhận quà Tống Kim (rời trận trước khi kết thúc / dưới diemMin) mà ở trong trận đủ lâu: ghi thẳng tài khoản như traoThuong
function traoNsk(m, mon, t) {
  const T = CF.thuong, acc = D2.docTk(m.tk), h = acc && Array.isArray(acc.nv) ? acc.nv[m.o] : null;
  if (!h || h.name !== m.ten) return;
  const q = { mon, kbh: T.khoa ? N.KBH_VV : 0 };
  let cho = false;
  try { DO.taoQua(h, q); } catch { h.quaCho = [...(h.quaCho || []), { ...q, luc: t, tk: 1 }]; cho = true; }
  const chu = mon.map((x) => `${x.n} ${String(DO.tenMon({ k: x.k })).trim()}`).join(", ");
  h.tkTin = [...(Array.isArray(h.tkTin) ? h.tkTin : []), `Tống Kim${D.gio ? ` ${D.gio}` : ""}: ở trong trận ${Math.floor((m.tg || 0) / 60000)} phút — nhận ${chu}.${cho ? " Hành trang không đủ chỗ — vật phẩm đang chờ, dọn túi là tự nhận." : ""}`].slice(-20);
  D2.ghiTk(acc);
}
// quản trị hủy trận: đóng ngay (không thưởng)
function huyTran() {
  if (!D || D.loai !== "tran") return false;
  const dang = !D.ket; D = null; WS.guiHet(moTin());
  if (dang) TG().thongBao("Trận Tống Kim đã bị hủy.");
  return true;
}
// trong trận mỗi 100 ms: khai chiến, quân ra lại / đợt quân / Nguyên Soái, báo còn 3 / 1 phút, chiến báo, hết giờ; đã xong: giữ bảng kết quả giuKq giây
function vongTran(t) {
  if (D.ket) { if (t - D.ketLuc > Math.max(0, +CF.giuKq || 0) * 1000) { D = null; WS.guiHet(moTin()); } return; }
  if (!D.batDau) {
    if (t >= D.kc) { batDau(t); return; }
    if (t - D.baoLuc >= 180000) { D.baoLuc = t; const p = Math.ceil((D.kc - t) / 60000); if (p > 0) TG().thongBao(`Tống Kim đang nhận báo danh ở Điểm báo danh Tống Kim (nhờ Xa phu đưa tới) (đẳng cấp ${CF.cap} trở lên, ủng hộ ${N.tien(CF.phi)}) — còn ${p} phút nữa khai chiến.`); }
    return;
  }
  // Tống binh / Kim binh ra lại (cùng mã) ở 1 chỗ tiền tuyến ngẫu nhiên của phe mình
  const hoi = Math.max(0, +CF.binh.hoi || 0) * 1000;
  for (const e of D.binh.values()) if (e.bac === 0 && e.chet && t - e.chet >= hoi) {
    const [x, y] = diemDong(e.phe); e.x = x; e.y = y; e.mau = e.mauMax; e.chet = 0; e.hoi++; D.vt.delete(e.id); doiHp(e); D.bsv++;
  }
  // đợt Hiệu úy … Đại tướng
  while (D.dot.length && D.dot[0].luc <= t) {
    const d = D.dot.shift(), [x, y] = diemDai(d.phe); themBinh(d.phe, d.bac, x, y);
    if (d.bac >= 4) tin(`${tenBinh(d.phe, d.bac)} phe ${TEN_PHE[d.phe]} đã xuất trận!`, "#ffb74d");
  }
  // Nguyên Soái: phút soai1 phe ít điểm (bằng điểm: cả 2), phút soai2 phe kia
  if (!D.soaiLuc && t >= D.kc + D.s1) { const [a, b] = D.diem, m1 = D.kc + D.s1, m2 = D.kc + D.s2; D.soaiLuc = a < b ? [m1, m2] : b < a ? [m2, m1] : [m1, m1]; D.doi = true; }
  if (D.soaiLuc) for (const p of [0, 1]) if (!D.soaiRa[p] && t >= D.soaiLuc[p]) raSoai(p);
  if (!D.bao3 && D.het - t <= 180000 && D.het - D.kc > 360000) { D.bao3 = true; tin("Chiến báo: còn 3 phút nữa trận Tống Kim kết thúc!", "#ffeb3b"); }
  if (!D.bao1 && D.het - t <= 60000 && D.het - D.kc > 120000) { D.bao1 = true; tin("Chiến báo: còn 1 phút cuối cùng!", "#ffeb3b"); }
  if (t - D.baoLuc >= 300000) { D.baoLuc = t; tin(`Chiến báo: Tống ${vn(D.diem[0])} điểm — Kim ${vn(D.diem[1])} điểm.`); }
  if (t >= D.het) ketThuc(t);
}

// ---------- lịch (giờ Việt Nam — như phong-hoa.js / san-nhim.js): báo trước, mở báo danh ----------
const lui = (hm, p) => { const [h, m] = hm.split(":").map(Number), t = (((h * 60 + m - p) % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
function lichVong(t) {
  if (CF.bat === false || !Array.isArray(CF.gio)) { lanDau = false; return; }
  const v = GV.vn(t), L = CF.gio.filter(GV.hopLe);
  if (lanDau) {
    lanDau = false;
    // máy chủ vừa chạy lại giữa giờ báo danh của 1 trận: mở luôn (báo danh còn lại) — trận đang đánh thì đã mất (phòng chỉ ở bộ nhớ)
    for (const g of L) {
      const u = GV.lucCua(v.ngay, g);
      if (u <= t && t < u + (+CF.baoDanh || 0) * 60000 && GV.thuOk(CF, u) && !dangTran()) { daGoi.add(`${v.ngay} ${g}`); try { moTran({ gio: g, u }); } catch (e) { console.error("Tống Kim:", e.message); } }
    }
  }
  for (const g of L) {
    // khóa có giờ (GM dời giờ muộn hơn trong ngày vẫn mở trận); ngày tắt trong tuần (CF.thu) thì không báo / không mở
    if (CF.baoTruoc > 0 && v.hm === lui(g, CF.baoTruoc) && !daGoi.has(`${v.ngay} b${g}`) && GV.thuOk(CF, t + CF.baoTruoc * 60000)) {
      daGoi.add(`${v.ngay} b${g}`);
      if (!dangTran()) TG().thongBao(`${CF.baoTruoc} phút nữa Tống Kim đại chiến sẽ bắt đầu báo danh ở Điểm báo danh Tống Kim (đẳng cấp ${CF.cap} trở lên).`);
    }
    if (v.hm === g && !daGoi.has(`${v.ngay} ${g}`) && GV.thuOk(CF, t)) {
      daGoi.add(`${v.ngay} ${g}`);
      if (!dangTran()) try { moTran({ gio: g }); } catch (e) { console.error("Tống Kim:", e.message); }
    }
  }
}

// ---------- mỗi 100 ms: lịch, người vào / ra, chủ trận, trận, bot ra trận lại, gửi trạng thái ----------
function vong(t = Date.now()) {
  try { lichVong(t); } catch (e) { console.error("Tống Kim — lịch:", e && e.message); }
  if (!D) return;
  const on = trong(t);
  for (const m of D.nguoi.values()) { const o = on.has(m.tk); if (o !== !!m.onl) { m.onl = o; if (!o) m.offLuc = t; D.doi = true; } }
  // anh 18/11 — giây ở trong trận (nguồn sự kiện Tống Kim — nskTk)
  if (D.loai === "tran" && D.batDau && !D.ket) {
    const dt = Math.max(0, Math.min(5000, t - (D.tgLuc || t))); D.tgLuc = t;
    for (const m of D.nguoi.values()) if (m.onl) { m.tg = (m.tg || 0) + dt; if (m.dau == null) m.dau = t; }
  }
  chonChu(on);
  if (D.loai === "tran") { vongTran(t); if (!D) return; }
  if (!D.ket) {
    const hs = (+CF.hoiSinh || 0) * 1000;
    for (const b of D.bot.values()) if (b.chet && t - b.chet >= hs) { b.chet = 0; b.mau = b.mauMax; b.hoi++; D.vt.delete(b.id); doiHp(b); }
  }
  if ((D.doi && t - D.guiLuc >= GUI_MS) || t - D.guiLuc >= NHAC_MS) phat(on, t);
}
setInterval(() => { try { vong(); } catch (e) { console.error("Tống Kim:", e && e.message); } }, 100).unref();

// ---------- quản trị (/api/tong-kim-qt) ----------
function tomTat() {
  const on = trong();
  const s = { bai: D.bai, soBot: D.soBot, tri: D.tri, hs: D.hs, cap: D.cap, moi: D.moi ? 1 : 0, chung: D.chung ? 1 : 0, diem: D.diem.slice(), chu: tenChu(),
    nguoi: [...D.nguoi.values()].map((m) => [m.ten, m.phe, m.diem, m.giet, m.chet, on.has(m.tk) ? 1 : 0]),
    song: [0, 1].map((p) => [...D.bot.values()].filter((b) => b.phe === p && !b.chet).length) };
  // trận theo lịch: thêm giai đoạn, giờ, số người báo danh mỗi phe, quân còn sống mỗi phe, Nguyên Soái đã ra (mã)
  if (D.loai === "tran") Object.assign(s, { loai: "tran", pha: phaCua(), gio: D.gio, kc: D.kc, het: D.het, dk: soPhe(), thang: D.thang == null ? null : D.thang,
    x2: D.x2 ? 1 : 0, binh: [0, 1].map((p) => [...D.binh.values()].filter((e) => e.phe === p && !e.chet).length), soai: D.soaiRa.slice() });
  return s;
}
// cấp cao nhất máy chủ (bảng xếp hạng — không tài khoản quản trị); 0 = chưa có ai
function capCao() { try { const r = XH.ds()[0]; return r && r.lvl > 0 ? Math.min(200, r.lvl | 0) : 0; } catch { return 0; } }
// mở bãi thử: { bai, trai: [[x, y] Tống, [x, y] Kim], soBot?, tri?, cap?, hs?, moi? (cho cả người thường vào) } — bãi thử đang mở (nếu có) đóng trước; đang có
// trận theo lịch thì không mở. Bản quái (riêng / chung) theo người mở (tk — kênh tức thời đang mở của người đó). Không theo CF.bat (F10 chỉ bật / tắt lịch)
function mo(b, tk) {
  if (D && D.loai === "tran") loi("Đang có trận Tống Kim theo lịch — bãi thử mở lại được sau khi trận xong (hoặc Hủy trận)");
  const bai = +b.bai, laSo = (v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e6;
  if (b.bai === "" || b.bai == null || !Number.isInteger(bai) || bai < 0 || bai > 1e6) loi("Bãi không hợp lệ");
  if (!Array.isArray(b.trai) || b.trai.length !== 2 || !b.trai.every((p) => Array.isArray(p) && laSo(p[0]) && laSo(p[1]))) loi("Doanh trại 2 phe: [[x, y] Tống, [x, y] Kim]");
  const soBot = b.soBot == null ? Math.max(1, Math.min(CF.soBotMax | 0, CF.soBot | 0)) : soNguyen(b.soBot, 1, CF.soBotMax | 0, "Số bot mỗi phe");
  const tri = b.tri == null ? Math.max(1, Math.min(3, CF.tri | 0)) : soNguyen(b.tri, 1, 3, "Mức thông minh");
  const cap = +b.cap > 0 ? Math.max(1, Math.min(200, Math.round(+b.cap))) : capCao() || 100;
  const hs = b.hs == null ? Math.max(HS[0], Math.min(HS[1], +CF.heSoSt || 1)) : soHs(b.hs);
  if (D) { D = null; WS.guiHet(moTin()); }
  const kq = tk && WS.cua(tk.ten), chung = kq && kq.zone === bai && kq.chung ? 1 : 0, moi = b.moi === 1 || b.moi === true || b.moi === "1" ? 1 : 0; // bản quái của người mở chỉ khi đứng đúng bãi
  moCuoi = Math.max(Date.now(), moCuoi + 1);
  D = { mauBot: MAU_BOT.slice(), loai: "thu", bai, mo: moCuoi, trai: b.trai.map((p) => [Math.round(p[0]), Math.round(p[1])]), R: CF.R, tri, hs, soBot, cap, moi, chung, sv: 1, snSv: 1,
    bsv: 1, hv: 0, nguoi: new Map(), tenNg: new Map(), bot: new Map(), vt: new Map(), binh: new Map(), dk: new Map(), chu: null, diem: [0, 0], kk: [], doi: true,
    guiLuc: 0, han: new Map(), hanHoi: new Map(), hanC: new Map(), seq: 0, bseq: 99999, phai: [tron(PHAI), tron(PHAI)], ten: docTen(), thatTen: tenThat(),
    kc: 0, het: 0, s1: 0, s2: 0, thang: null, soaiLuc: null, soaiRa: [0, 0], soaiSt: [new Map(), new Map()], ket: null, tin: [], tinId: 0, doiCho: new Map() };
  for (const phe of [0, 1]) for (let i = 0; i < soBot; i++) themBot(phe);
  WS.guiHet(moTin());
  return { ok: 1, s: tomTat() };
}
// { viec: "mo" | "huy" | "xem" | "phe" (phe 0 | 1 — đổi phe chính quản trị) | "soBot" (soBot) | "tri" (tri 1–3) | "hs" (hs 0,01–2 — hệ số sát thương PK) } —
// bãi thử; trận theo lịch (thử nhanh): "moTran" (baoDanh, danh, soai1, soai2, vaoMuon? — phút, số lẻ được; soBot?, thienTu?) | "ketTran" (kết thúc
// ngay — có thưởng) | "huyTran" (đóng ngay — không thưởng)
function quanTri(b, tk) {
  b = b && typeof b === "object" ? b : {};
  const viec = b.viec == null ? "xem" : String(b.viec);
  if (viec === "xem") return { s: D ? tomTat() : null };
  if (viec === "mo") return mo(b, tk);
  if (viec === "moTran") {
    const l = moTran({ baoDanh: b.baoDanh, danh: b.danh, soai1: b.soai1, soai2: b.soai2, vaoMuon: b.vaoMuon, soBot: b.soBot, thienTu: b.thienTu === 1 || b.thienTu === true || b.thienTu === "1" });
    return { ok: 1, l, s: tomTat() };
  }
  if (viec === "ketTran") { if (!D || D.loai !== "tran" || D.ket) loi("Không có trận Tống Kim đang diễn ra"); ketThuc(Date.now()); return { ok: 1, l: lich(), s: tomTat() }; }
  if (viec === "huyTran") { if (!huyTran()) loi("Không có trận Tống Kim"); return { ok: 1, l: lich() }; }
  if (viec === "huy") { if (D && D.loai === "tran") loi("Đang có trận Tống Kim theo lịch — dùng Hủy trận"); if (D) { D = null; WS.guiHet(moTin()); } return { ok: 1 }; }
  if (!D) loi("Chưa mở bãi Tống Kim");
  if (viec === "phe") {
    if (D.loai === "tran") loi("Trận theo lịch: phe theo báo danh ở Mộ binh quan");
    const m = tk && D.nguoi.get(tk.ten); if (!m) loi("Đại hiệp chưa vào bãi Tống Kim — tới bãi đó trước");
    const p = b.phe === 0 || b.phe === "0" ? 0 : b.phe === 1 || b.phe === "1" ? 1 : -1; if (p < 0) loi("Phe: 0 Tống, 1 Kim");
    m.phe = p; D.doi = true;
    return { ok: 1, s: tomTat() };
  }
  if (viec === "soBot") { datSoBot(soNguyen(b.soBot, 1, CF.soBotMax | 0, "Số bot mỗi phe")); return { ok: 1, s: tomTat() }; }
  if (viec === "tri") { D.tri = soNguyen(b.tri, 1, 3, "Mức thông minh"); D.doi = true; return { ok: 1, s: tomTat() }; }
  if (viec === "hs") { D.hs = soHs(b.hs); D.doi = true; return { ok: 1, s: tomTat() }; }
  loi("Việc Tống Kim không đúng");
}

// phe trận của tài khoản tk (đã vào phòng đang mở) -> 0 | 1 | null; zone (nếu đưa): chỉ khi đang ở bãi phòng (the-gioi.js pheNay — màu tên / vòng sáng)
function pheCua(tk, zone) {
  if (!D || (zone !== undefined && zone !== D.bai)) return null;
  const m = D.nguoi.get(tk);
  return m ? m.phe : null;
}

// ---------- món chiến trường (do.js dungVat, api.js nhịp) ----------
// món chỉ dùng trong chiến trường -> { loai: "hoan", buff, giay } | { loai: "doi", k, giay } | { loai: "hoi", v, giay } | null (d = dung của món)
function vatTk(k, d) {
  const V = VAT_TK[k], dd = d && typeof d === "object" ? d : {}, buffTk = typeof dd.buff === "string" && laBuffTk(dd.buff);
  if (!V && !buffTk) return null;
  const loai = V ? V.loai : "hoan", giay = Math.max(1, Math.round(+dd.giay || GIAY_VAT[loai]));
  if (loai === "hoan") { const buff = buffTk ? dd.buff : V.buff; return buff ? { loai, buff, giay } : null; }
  if (loai === "doi") return { loai, k: buffTk ? dd.buff : V.k, giay };
  return { loai, v: Math.max(1, Math.round(+dd.v || V.v)), giay };
}
// khóa "tài khoản|ô" đang trong phòng: đúng nhân vật đã vào phòng, đang đứng ở bãi phòng (do.js BAI_NAY — nhịp báo), trận đang báo danh / đánh (bãi thử: lúc
// nào cũng được) — dùng món chiến trường, giữ trạng thái tk*
function trongTran(key) {
  if (!D || typeof key !== "string") return false;
  const i = key.lastIndexOf("|"), m = D.nguoi.get(key.slice(0, i));
  if (!m || m.o !== +key.slice(i + 1) || N.BAI_NAY.get(key) !== D.bai) return false;
  const p = phaCua();
  return p === "bd" || p === "danh";
}
// nhịp (api.js): trạng thái chiến trường (h.buff tk…) của người không còn trong trận -> bỏ; true = đã đổi (cần ghi)
function boBuffTk(h, key) {
  if (!h || !h.buff || typeof h.buff !== "object") return false;
  const ds = Object.keys(h.buff).filter(laBuffTk);
  if (!ds.length || trongTran(key)) return false;
  for (const k of ds) delete h.buff[k];
  if (!Object.keys(h.buff).length) delete h.buff;
  return true;
}
// hoàn trong trận (anh 17/11 "các loại hoàn tk tác dụng 3p, kể cả phi tốc, lệnh bài k thay đổi. Khi chết thì mất hết tác dụng, phải sử dụng lại mới có hiệu
// quả"): trạng thái vật phẩm có chỉ số chiến đấu (do.js laHoan — hoàn Tống Kim + hoàn Kỳ Trân Các: Phi Tốc, Đại Lực, Nội … hoàn, Kích Công Trợ Lực, Âm Dương…)
// đang trong trận thì còn tối đa CF.hoanGiay giây (dùng trong trận — do.js dungVat — hay dùng từ trước khi vào); trọng thương (tkChet đặt m.hoanMat) thì mất
// hết — xử lý ở nhịp kế tiếp hoặc ngay trước lần dùng hoàn kế tiếp (dùng lại sau khi chết không bị xóa nhầm). Chiến cổ / Lệnh Bài (trình duyệt — tkBuff),
// Tiên Thảo Lộ / may mắn / Nến (không chỉ số chiến đấu) giữ nguyên. true = h.buff đã đổi (cần ghi)
const hoanGiay = () => Math.max(1, Math.round(+CF.hoanGiay || 180));
function hoanTran(h, key) {
  if (!D || !h || typeof key !== "string") return false;
  const i = key.lastIndexOf("|"), m = D.nguoi.get(key.slice(0, i));
  const chet = !!(m && m.hoanMat && m.o === +key.slice(i + 1));
  if (!chet && !trongTran(key)) return false;
  if (chet) m.hoanMat = 0;
  if (!h.buff || typeof h.buff !== "object") return false;
  const con = DO.buffCon(h, key), mx = hoanGiay();
  const ds = Object.keys(con).filter((k) => DO.laHoan(k) && (chet || con[k] > mx));
  if (!ds.length) return false;
  DO.buffDem(h, key, true); // trừ hẳn phần đã trôi rồi mới xóa / cắt
  if (!h.buff) return true;
  for (const k of ds) { if (chet) delete h.buff[k]; else if (h.buff[k] > mx) h.buff[k] = mx; }
  if (!Object.keys(h.buff).length) delete h.buff;
  return true;
}
// thuốc Tống Kim (anh 12/11 — do.js CAU_TK): giá 1 bình mua trong trận = giá ngoài × giaThuoc (0,5). Anh 13/11 (lượt 86 — "máu tống kim giờ mua đồng giá 1 đồng"):
// giaThuocCo > 0 -> mọi loại thuốc trong trận cùng 1 giá (1 lượng / bình); 0 -> theo giaThuoc như trước
const giaThuocTk = (gia) => (+CF.giaThuocCo > 0 ? Math.max(1, Math.round(+CF.giaThuocCo)) : Math.max(1, Math.ceil((+gia || 0) * Math.max(0, Math.min(1, +CF.giaThuoc || 0.5)))));
// trận cho vào suốt trận (vaoTuDo — vm = cả thời gian đánh)
const vaoHet = (R) => !!R && R.vm >= R.het - R.kc;
// nhịp (api.js, có trạng thái bãi): thuốc Tống Kim (it.tk) của người không còn trong trận (rời trận, sang bãi khác, hết trận) -> bỏ; trả số bình đã bỏ
function boThuocTk(h, key) {
  if (!h || !Array.isArray(h.bag) || !h.bag.some((o) => o && o.tk) || trongTran(key)) return 0;
  let so = 0; h.bag = h.bag.filter((o) => { if (!o || !o.tk) return true; so += o.n | 0; return false; });
  return so;
}
// vừa dùng Chiến cổ / Lệnh Bài (do.js): tài khoản được chuyển trạng thái k cho người cùng phe 1 lần trong DOI_GIU (tkBuff)
function choDoi(key, k, giay) {
  if (!D || typeof key !== "string") return;
  const tk = key.slice(0, key.lastIndexOf("|")), t = Date.now(), L = (D.doiCho.get(tk) || []).filter((x) => t - x.luc < DOI_GIU);
  L.push({ k, giay: Math.max(1, giay | 0), luc: t }); D.doiCho.set(tk, L.slice(-5));
}
// Quân Nhu quan: [[khóa, giá điểm Tống Kim]] (cau-hinh.json quanNhu — món chưa có trong dữ liệu thì bỏ)
const hangTk = () => (Array.isArray(CF.quanNhu) ? CF.quanNhu : []).filter((r) => Array.isArray(r) && N.BY.has(String(r[0])) && +r[1] > 0).map((r) => [String(r[0]), Math.round(+r[1])]);
const giaTk = () => new Map(hangTk());

// ---------- Mộ binh quan / Quân Nhu quan (HTTP /api/tong-kim — câu theo client: battlejoin.lua, battleinfo.lua, song_shop.lua) ----------
const QN_DANH = "Quân Nhu quan: Chiến tranh đang diễn ra ác liệt phía trước, các vị nên tạm lánh một chút!";
const LOI_PHE = ["Chúc mừng bạn đã chính thức trở thành tướng sĩ của đại Tống! Hãy chứng tỏ bản lĩnh của mình đi!", "Chúc mừng bạn đã chính thức trở thành tướng sĩ của đại Kim! Hãy chứng tỏ bản lĩnh của mình đi!"];
// trận kế tiếp theo lịch: "12:50 hôm nay" | "10:50 ngày mai" | "…" ("" = lịch đang tắt)
function tranToi(t = Date.now()) {
  if (CF.bat === false) return "";
  const L = (Array.isArray(CF.gio) ? CF.gio : []).filter(GV.hopLe).sort(), hom = GV.vn(t).ngay;
  for (let d = 0; d <= 7; d++) {
    const ngay = GV.sangNgay(hom, d);
    for (const g of L) { const u = GV.lucCua(ngay, g); if (u > t && GV.thuOk(CF, u)) return d === 0 ? `${g} hôm nay` : d === 1 ? `${g} ngày mai` : `${g} ngày ${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`; }
  }
  return "";
}
// luật (battleinfo.lua strmarshalhelp + số của S1)
function luatChu() {
  const T = CF.thuong, B = CF.diemBinh || [];
  return `Phương thức bảo vệ Nguyên Soái: khai chiến ${CF.soai1} phút, tại Doanh trại phe ít điểm tích lũy nhất sẽ xuất hiện Nguyên Soái, phút ${CF.soai2} Nguyên Soái phe kia cũng sẽ xuất hiện. Nếu điểm tích lũy bằng nhau thì 2 Nguyên Soái sẽ cùng xuất hiện. Phe hạ Nguyên Soái địch trước giành thắng lợi, trận kết thúc ngay; không ai hạ được thì căn cứ điểm tích lũy của 2 bên phân thắng bại, bằng điểm thì phe Tống thắng.`
    + `<enter>Điểm tích lũy: hạ người chơi / tướng sĩ phe địch ${CF.pk} điểm × hệ số chức, liên trảm 3 mạng thêm ${(CF.lienTram || [])[1] || 0}; hạ Tống binh / Kim binh ${B[0]}, Hiệu úy ${B[1]}, Thống lĩnh ${B[2]}, Phó tướng ${B[3]}, Đại tướng ${B[4]}, Nguyên Soái ${B[5]}. 1000 điểm = Hiệu úy; 3000 điểm = Thống Lĩnh; 6000 điểm = Phó tướng; 10 000 điểm = Đại Tướng.`
    + `<enter>Thưởng cuối trận (từ ${T.diemMin} điểm, còn trong chiến trường): điểm Tống Kim = điểm trận + ${T.thang} (thắng) / ${T.thua} (thua), Nhạc Vương Hồn Thạch, kinh nghiệm theo điểm và đẳng cấp, Huân công bài (thắng, từ ${T.hcDiem} điểm, tối đa ${T.hcNgay} mỗi ngày). Trận cuối ngày thứ ba, năm, bảy là Đêm Huy Hoàng — điểm và kinh nghiệm gấp đôi.`
    + `<enter>Chú ý: sau khi báo danh sẽ được đưa vào hậu doanh; trước khi khai chiến không được rời khỏi đại doanh. Bị trọng thương không mất gì, ${CF.hoiSinh} giây sau trở lại hậu doanh.`;
}
const xemThienTu = (R) => (R && R.x2 ? "<enter>Chiến dịch lần này là <color=yellow>Đêm Huy Hoàng<color>, phần thưởng gấp đôi so với bình thường! Cơ hội không nên bỏ qua!" : "");
// khung đầu Mộ binh quan
// chiPhe: Mộ binh quan của 1 phe ở Điểm báo danh (song_signup / jin_signup — anh 09/11 "có tống và kim như client"): chỉ nhận phe đó
function moBinh(h, R, pha, dk, t, chiPhe) {
  const toi = tranToi(t), L = [["Tìm hiểu quy tắc Tống Kim", "luat"], ["Để ta suy nghĩ lại!", null]];
  const ke = toi ? `<enter>Trận kế tiếp: ${Y(toi)} — báo danh ${CF.baoDanh} phút, đẳng cấp ${CF.cap} trở lên.` : "";
  if (!R || pha === "xong") return say(`${pha === "xong" ? "Xin lỗi! Đại chiến đã kết thúc! Lần sau quay lại nhé!" : "Đại quân của ta vẫn chưa xuất phát! Hãy tạm thời nghỉ ngơi đợi tin nhé!"}${ke}`, L);
  const c = soPhe(), qs = `Hiện thời quân số 2 bên là: ${c[0]} --- ${c[1]}`;
  if (dk) return say(`${LOI_PHE[dk.phe]}<enter>${qs}${xemThienTu(R)}`, [["Hãy cho ta tham gia", "vao"], ["Để ta suy nghĩ lại!", null]]);
  if ((h.lvl | 0) < CF.cap) return say(`Chiến trường chỉ dành cho người từ cấp ${CF.cap} trở lên, ngươi chưa đủ điều kiện. Cố gắng tập luyện thêm đi!`, [["Được!", null], ["Ta muốn tìm hiểu thông tin chiến dịch.", "luat"]]);
  if (pha === "danh" && t >= R.kc + R.vm) return say(`Trống trận đã rền vang! Trận đã đánh quá ${vnPhut(R.vm)} phút, Mộ binh quan không nhận thêm người — lần sau quay lại nhé!${ke}`, L);
  const luc = pha === "bd" ? `còn ${Math.max(1, Math.ceil((R.kc - t) / 60000))} phút nữa khai chiến` : vaoHet(R) ? "đang khai chiến — vẫn nhận thêm người tới khi hết trận" : `đang khai chiến — nhận thêm người tới phút ${vnPhut(R.vm)}`;
  return say(`Trống trận đã rền vang! Sao ngươi chưa tham gia chiến?<enter>${qs} (${luc}).<enter>Đẳng cấp ${CF.cap} trở lên, ủng hộ ${Y(N.tien(CF.phi))} mỗi trận; quân số hai phe hơn kém nhau tối đa 1 người.${xemThienTu(R)}`,
    [...(chiPhe === 1 ? [] : [["Gia nhập phe Tống", "phe", 0]]), ...(chiPhe === 0 ? [] : [["Gia nhập phe Kim", "phe", 1]]), ...L]);
}
// vào (lại) hậu doanh phe mình: rời tổ đội, chỗ ra ngẫu nhiên ở hậu doanh
function vaoTran(R, dk, h, tk, moi) {
  roiDoi(tk, h.name);
  return { vao: { zone: R.bai, at: diemHau(dk.phe) }, phe: dk.phe, tin: moi ? [LOI_PHE[dk.phe], `Đã ủng hộ ${N.tien(dk.nop)} — vào hậu doanh phe ${TEN_PHE[dk.phe]}.`] : [`Trở lại hậu doanh phe ${TEN_PHE[dk.phe]}.`] };
}
// đúc Nhạc Vương Kiếm (song_shop.lua yuewang_sure: đủ duc.can viên thì trừ viên, thêm kiếm; không tốn tiền): viên khóa bảo hiểm trừ trước, có viên khóa thì kiếm
// khóa; không đủ chỗ thì trả lại như cũ
function ducKiem(h, tk) {
  const k = CF.thuong.htMon, can = Math.max(1, CF.duc.can | 0), x = N.BY.get(CF.duc.mon), c = N.coMon({ k: CF.duc.mon });
  if (!x) loi("Chưa có Nhạc Vương Kiếm trong dữ liệu vật phẩm");
  const co = (h.bag || []).reduce((s, o) => s + (o.k === k ? o.n || 1 : 0), 0);
  if (co < can) return talk("Quân Nhu quan: Ngươi không có nhiều Nhạc Vương Hồn Thạch, hãy kiểm tra lại đi! Thanh Nhạc Vương Kiếm không phải người nào cũng có được đâu.");
  const bag0 = h.bag.map((o) => ({ ...o })), uN0 = h.uN | 0;
  let con = can, kbh = 0;
  for (const o of h.bag.filter((v) => v.k === k).sort((a, b) => (b.kbh | 0) - (a.kbh | 0))) {
    if (con <= 0) break;
    const lay = Math.min(con, o.n || 1); o.n = (o.n || 1) - lay; con -= lay; kbh = Math.max(kbh, o.kbh | 0);
    if (o.n <= 0) h.bag.splice(h.bag.indexOf(o), 1);
  }
  try {
    if (N.xepChong(x)) N.themChong(h, x, 1, kbh);
    else if (!N.vaoTui(h, { k: x.k, n: 1, ...(kbh ? { kbh } : {}), u: ++h.uN })) loi("Hành trang không đủ chỗ");
  } catch {
    h.bag = bag0; h.uN = uN0;
    return talk(`Quân Nhu quan: Nhạc Vương Kiếm chiếm không gian trong hành trang là ${Y(`${c[0] * c[1]} (${c[0]} X ${c[1]})`)}ô — ngươi hãy xếp gọn hành trang rồi quay lại.`);
  }
  NK().ghi("hd", tk, h.name, `Tống Kim — Quân Nhu quan: đúc Nhạc Vương Kiếm (${can} Nhạc Vương Hồn Thạch${kbh ? "; có viên khóa bảo hiểm — kiếm khóa" : ""})`);
  return { ...talk("Quân Nhu quan: Thanh Nhạc Vương Kiếm này rất quý báu, ngươi phải biết tận dụng tốt đấy!"), tin: ["Bạn nhận được Nhạc Vương Kiếm"] };
}
// { o, viec, x? } -> { say?: { text, opts: [[nhãn, việc, x?]] }, talk?: { text }, vao?: { zone, at: [x, y] }, shop?: { hang: [[khóa, giá]], diem }, tin?: [câu],
// phe? } — Mộ binh quan: "mo" (khung đầu) | "phe" (x = 0 Tống | 1 Kim — báo danh, nộp phí, vào) | "vao" (vào lại, không phí) | "luat"; Quân Nhu quan: "qn" |
// "shop" | "duc" (x = 1: bước 2 — cảnh báo chỗ) | "ducOk". Câu từ chối theo client trả bằng talk / say (lỗi khác: 400)
function lam(h, b, tk) {
  if (!h) loi("Chưa chọn nhân vật");
  b = b && typeof b === "object" ? b : {};
  const o = b.o | 0, key = tk + "|" + o, viec = String(b.viec || "mo"), t = Date.now(), z = N.BAI_NAY.get(key);
  const R = D && D.loai === "tran" ? D : null, pha = R ? phaCua(t) : "", dk = R ? R.dk.get(key) || null : null;
  // nhịp báo đang ở bãi khác Biện Kinh (gọi API không qua NPC): không cho báo danh / mua / đúc. Chưa có nhịp nào (không rõ bãi) cũng coi là không ở đó (anh 13/11 —
  // soát công cụ gọi API từ xa: bản trước "z != null && …" cho qua khi chưa có nhịp; vào lại trận lúc đăng nhập vẫn được vì báo danh trận này thì đã có bãi)
  const xa = z == null || (z !== BIEN_KINH && z !== BAO_DANH);
  switch (viec) {
    case "mo": return moBinh(h, R, pha, dk, t, b.phe);
    // luật: khung Say như client (battleinfo.lua info_marshal — Say(strmarshalhelp, …, "Ta hiểu rồi!/cancel")); anh 06/11 "chỗ giới thiệu của NPC đang lỗi bố
    // cục" (bản trước trả talk — 1 câu dài tràn khung Talk): lời dài máy khách tự chia trang "Trang kế" như client (src/game/npcdlg.js chiaTrang)
    case "luat": return say(luatChu(), [["Ta hiểu rồi!", null]]);
    case "phe": case "vao": {
      // đăng nhập lại khi chỗ lưu ở chiến trường (main.js tkDangNhap — nhịp cuối của nhân vật báo bãi chiến trường): người đã báo danh trận này vào lại được
      // (soát đầu-cuối 06/11: trước coi như "đứng ở bãi khác" -> thoát game giữa trận vào lại thì bị đưa về Biện Kinh). Đang ở trong phòng (trang đang chơi
      // ở chiến trường) thì không — gọi API thẳng không thành chỗ dịch chuyển về hậu doanh
      if (xa && !(dk && z === R.bai && !trong(t).has(tk))) return talk("Mộ binh quan: Muốn tham gia chiến trường Tống Kim hãy nhờ Xa phu đưa đến Điểm báo danh Tống Kim.");
      if (!R || pha === "xong") return moBinh(h, R, pha, dk, t);
      if (dk) return vaoTran(R, dk, h, tk, false); // đã báo danh trận này: vào lại phe cũ, không thu phí (anh chốt)
      const x = b.x === 1 || b.x === "1" ? 1 : b.x === 0 || b.x === "0" ? 0 : -1;
      if (viec === "vao" || x < 0 || (h.lvl | 0) < CF.cap || (pha === "danh" && t >= R.kc + R.vm)) return moBinh(h, R, pha, dk, t);
      const khac = [...R.dk.values()].find((v) => v.tk === tk);
      if (khac) return talk(`Mộ binh quan: Nhân vật ${khac.ten} của tài khoản này đã báo danh trận này — mỗi tài khoản 1 nhân vật mỗi trận.`);
      const c = soPhe();
      if (c[x] > c[1 - x]) return say(`Hiện tại binh lực phe ta là ${Y(`${c[x]} người`)}, địch phương là ${Y(`${c[1 - x]} người`)}, cách biệt ${Rd(`${c[x] - c[1 - x]} người`)}. Quân lực của ta hiện giờ đã dư sức tiêu diệt ${x ? "Tống quân" : "Kim binh"}. Tráng sĩ hãy sang trợ lực phe ${TEN_PHE[1 - x]}!`,
        [[`Gia nhập phe ${TEN_PHE[1 - x]}`, "phe", 1 - x], ["Để ta suy nghĩ lại!", null]]);
      if ((h.gold || 0) < CF.phi) return talk(`Muốn tham gia chiến trường Tống Kim hãy ủng hộ ${N.tien(CF.phi)}`);
      h.gold -= CF.phi;
      const moi = { tk, o, ten: h.name, phe: x, lv: h.lvl | 0, nop: CF.phi, luc: t };
      R.dk.set(key, moi); R.doi = true;
      NK().ghi("hd", tk, h.name, `Tống Kim${R.gio ? ` ${R.gio}` : ""}: báo danh phe ${TEN_PHE[x]}, ủng hộ ${CF.phi} lượng`);
      return vaoTran(R, moi, h, tk, true);
    }
    case "qn":
      if (dangDanh(t)) return talk(QN_DANH);
      return say(`Quân Nhu Quan: Hiện tại ngươi có ${Y(vn(h.diemTk | 0))} điểm tích lũy, có muốn mua gì không?`,
        [["Ta muốn mua đạo cụ", "shop"], ["Sử dụng Nhạc Vương Hồn Thạch để đúc luyện Nhạc Vương Kiếm", "duc"], ["Không cần đâu! Cảm ơn!", null]]);
    case "shop":
      if (dangDanh(t)) return talk(QN_DANH);
      return { shop: { hang: hangTk(), diem: h.diemTk | 0 } };
    case "duc": {
      if (dangDanh(t)) return talk(QN_DANH);
      const c = N.coMon({ k: CF.duc.mon });
      if (b.x === 1 || b.x === "1") return say(`Quân Nhu quan: Nhạc Vương Kiếm chiếm không gian trong hành trang là ${Y(`${c[0] * c[1]} (${c[0]} X ${c[1]})`)}ô, ngươi xác định còn chỗ trống trong hành trang chưa?`, [["Muốn", "ducOk"], ["Để ta xếp gọn hành trang đã", null]]);
      return say(`Quân Nhu quan: Từ những tinh hoa có được trong Nhạc Vương Hồn Thạch ta chế tạo ra Nhạc Vương Kiếm, cần phải tốn ${Y(CF.duc.can)} Viên Nhạc Vương Hồn Thạch này xác định đổi phải không?`, [["Muốn", "duc", 1], ["Để ta xem lại", null]]);
    }
    case "ducOk":
      if (dangDanh(t)) return talk(QN_DANH);
      if (xa) return talk("Quân Nhu quan: Muốn đúc Nhạc Vương Kiếm hãy đến gặp ta ở Điểm báo danh Tống Kim.");
      return ducKiem(h, tk);
    default: loi("Việc Tống Kim không đúng");
  }
}

module.exports = { CF, quanTri, pheCua, lam, lich, dangTran, dangDanh, trongTran, boBuffTk, hoanTran, hoanGiay, giaThuocTk, boThuocTk, vatTk, choDoi, giaTk, BIEN_KINH, BAO_DANH, mauBotDs, mauBotThem, mauBotXoa,
  pvp: { stCua, thung, BUA_GOC, ST_MAX, HS }, // Lôi Đài (anh 15/11 — may-chu/loi-dai.js ldn): dùng chung kiểm đòn PvP, không đổi gì của Tống Kim
  _thu: { get D() { return D; }, vong, trong, chonChu, phat, cong, chetBot, chucCua, diemGiet, LIEN, PHAI, tenBot, themBot, datSoBot, tomTat, stCua, viec: VIEC,
    moTran, batDau, ketThuc, huyTran, lichVong, vongTran, themBinh, chiSoBinh, chetBinh, raSoai, lichDot, laThienTu, traoThuong, ketCua, phaCua, daGoi,
    datTd(x) { TD_THU = x; }, datLanDau(v) { lanDau = !!v; } } };
