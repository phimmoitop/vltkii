// Khóa an toàn — mật khẩu cấp 2 + người chơi tự đổi mật khẩu đăng nhập (anh 10/11: "Họ có thể tự đổi mk cấp 1 và tạo thêm mk cấp 2 ingame. Hệ thống
// vẫn sẽ ghi nhận dc"; đề xuất đầy đủ "Duyệt hết a"). Client gốc có ổ khóa Security Lock (script\ui\security_lock_ui.lua: khóa / mở bằng mật khẩu /
// bật tắt / đổi mật khẩu; hình spr\Ui3\securitylock\locked.spr, unlocked.spr) nhưng không có luật phía máy chủ — luật ở đây là của S1:
//   - Mật khẩu cấp 2: đúng 6 chữ số (bàn phím số trên màn hình), 1 cho cả tài khoản, lưu băm scrypt (tk.mk2) như mật khẩu đăng nhập — quản trị
//     không xem được, chỉ xóa (F10). Đặt lần đầu phải nhập lại mật khẩu đăng nhập; không trùng mật khẩu đăng nhập.
//   - Hỏi khi đồ / tiền rời tài khoản (api.js gọi chan() trước mọi việc): giao dịch, chợ trời định giá bày bán / mua, vứt đồ ra đất, Lễ quan hủy vật
//     phẩm, xóa nhân vật, đổi mật khẩu, bang hội chuyển vị / giải tán / trục xuất (anh 14/11); tài khoản quản trị: mọi API quản trị (F10 + công cụ thử). Chưa có mật khẩu cấp 2 thì việc đầu tiên đó bắt
//     đặt (lựa chọn 1a). Rương chứa đồ giữ mật mã rương riêng như client (2a). Quên: chỉ quản trị xóa (3a).
//   - Mở 1 lần cho đúng 1 lần tải trang: trình duyệt gửi mã trang ngẫu nhiên (đầu x-trang) kèm mọi yêu cầu; mở khóa gắn với mã trang + phiên đăng nhập
//     -> thoát game (nhịp s = null — khoaTrang) / tải lại trang / đóng trang / đăng xuất / đăng nhập nơi khác / máy chủ khởi động lại là khóa lại (quán
//     net: người sau mở lại trang vẫn khóa). Đặt / đổi mật khẩu cấp 2: chỉ trang đó còn mở (moRieng).
//   - Nhập sai (mật khẩu cấp 2 hoặc mật khẩu đăng nhập trong khung khóa an toàn) SAI_MAX lần -> khóa nhập SAI_KHOA, ghi nhật ký kèm IP; chủ tài khoản được
//     báo ở phiên khác (tk.mk2Bao — api.js nhịp baoSai: giữ tới khi trang đã mở khóa thấy). Mật khẩu cấp 2 dễ đoán (111111, 123456…) không nhận.
//   - Mật khẩu đăng nhập: tài khoản quản trị tạo / đặt lại ở F10 mang tk.batDoiMk -> đăng nhập xong phải đổi mới vào game (máy chủ chặn mọi API khác,
//     lựa chọn 4a: tài khoản có sẵn không bị bắt) — vẫn phải nhập mật khẩu quản trị cấp. Tự đổi trong game: mật khẩu cũ + mới (đã có mật khẩu cấp 2 thì
//     phải mở khóa trước). Đổi xong cấp phiên mới (cookie mới cho trang đang dùng — mọi nơi khác giữ phiên cũ bị đăng xuất).
// Trường tài khoản: mk2 (băm), mk2Luc (lúc đặt / đổi), mkLuc (lúc người chơi tự đổi mật khẩu đăng nhập), batDoiMk (1 = phải đổi), mk2Bao (báo chủ tài
// khoản: { luc, ip, n }), mk2SaiCuoi ({ luc, ip, n } — F10). Nhật ký loại "mk".
"use strict";
const crypto = require("crypto");
const D = require("./du-lieu");
const NK = require("./nhat-ky");

const MK2_RE = /^\d{6}$/;
const SAI_MAX = 5, SAI_KHOA = Math.max(1000, +process.env.VL_BM_KHOA_MS || 15 * 60000); // VL_BM_KHOA_MS: chỉ máy thử (khóa ngắn để thử tự động)
const MK1_MIN = 6, MK1_MAX = 64;
const MO = new Map(); // tên tài khoản -> { phien, ds: Set(mã trang), luc }: các trang đã mở khóa của phiên đó (2 thẻ cùng trình duyệt không khóa nhau)
const MO_TOI_DA = 4; // giữ tối đa 4 trang mở khóa mỗi tài khoản (mới nhất)
const SAI = new Map(); // tên tài khoản -> { n, den }: số lần nhập sai liền nhau, hết hạn lúc den (mỗi lần sai dời tới bây giờ + SAI_KHOA)

const loiMa = (msg, ma, code = 403) => Object.assign(new Error(msg), { code, ma });
const loi = (msg) => { throw Object.assign(new Error(msg), { code: 400 }); };
const phut = (ms) => Math.max(1, Math.ceil(ms / 60000));

// băm như du-lieu.js bam / dungMk ("scrypt$muối$băm"), so bằng timingSafeEqual
function bam(mk) {
  const muoi = crypto.randomBytes(16);
  return "scrypt$" + muoi.toString("hex") + "$" + crypto.scryptSync(String(mk), muoi, 64).toString("hex");
}
function dung(chuoi, mk) {
  const [kieu, muoi, h] = String(chuoi || "").split("$");
  if (kieu !== "scrypt" || !muoi || !h) return false;
  const a = crypto.scryptSync(String(mk), Buffer.from(muoi, "hex"), 64), b = Buffer.from(h, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// mã trang trình duyệt gửi (src/game/net.js TRANG): 16–64 ký tự chữ / số / - _
const trangCua = (req) => { const t = String((req && req.headers && req.headers["x-trang"]) || ""); return /^[A-Za-z0-9_-]{16,64}$/.test(t) ? t : ""; };
const daMo = (tk, trang) => { const m = MO.get(tk.ten); return !!(tk.mk2 && trang && m && m.phien && m.phien === tk.phien && m.ds.has(trang)); };
function moCho(tk, trang) {
  if (!trang || !tk.phien) return;
  const m0 = MO.get(tk.ten), m = m0 && m0.phien === tk.phien ? m0 : { phien: tk.phien, ds: new Set() };
  m.ds.delete(trang); m.ds.add(trang); m.luc = Date.now(); m.admin = !!tk.admin; // qtMo (anh 18/11)
  while (m.ds.size > MO_TOI_DA) m.ds.delete(m.ds.values().next().value);
  MO.set(tk.ten, m);
}
const khoaLai = (ten) => MO.delete(ten);
// tài khoản quản trị đang có trang đã mở khóa an toàn trong phiên này (anh 18/11 — quản trị "Một đòn chết": các kênh sát thương quái máu chung bỏ hạn mức / giây)
const qtMo = (ten) => { const m = MO.get(ten); return !!(m && m.admin && m.ds.size > 0); };
// thoát game (nhịp s = null — Esc → Thoát game / Alt+X về màn chọn nhân vật, rà soát 10/11): khóa lại trang đó (thẻ khác giữ nguyên) — như câu "mở tới khi
// thoát game"
const khoaTrang = (ten, trang) => { const m = MO.get(ten); if (m && trang) m.ds.delete(trang); };
// chỉ còn trang này mở (vừa đặt / đổi mật khẩu: các trang mở trước đó — thẻ khác, cookie bị chép — khóa lại)
const moRieng = (tk, trang) => { MO.delete(tk.ten); moCho(tk, trang); };
const trangThai = (tk, trang) => ({ co: tk.mk2 ? 1 : 0, mo: daMo(tk, trang) ? 1 : 0 });

function dangKhoaNhap(tk) {
  const s = SAI.get(tk.ten), t = Date.now();
  if (!s) return 0;
  if (t >= s.den) { SAI.delete(tk.ten); return 0; }
  return s.n >= SAI_MAX ? s.den - t : 0;
}
// lỗi nhập sai / đang khóa nhập: 400 kèm ma ("sai-mk" | "khoa-nhap") để khung bàn phím biết còn cho nhập lại hay đóng
const loiNhap = (msg, ma) => { throw Object.assign(new Error(msg), { code: 400, ma }); };
function chanKhoaNhap(tk) { const con = dangKhoaNhap(tk); if (con) loiNhap(`Nhập sai quá ${SAI_MAX} lần — thử lại sau ${phut(con)} phút`, "khoa-nhap"); }
// 1 lần nhập sai (loai: "mật khẩu cấp 2" | "mật khẩu đăng nhập"): đếm, nhật ký, đủ SAI_MAX thì khóa nhập + báo chủ tài khoản lần vào tới
function ghiSai(tk, ip, loai) {
  const t = Date.now(), s0 = SAI.get(tk.ten), s = s0 && t < s0.den ? s0 : { n: 0, den: 0 };
  s.n++; s.den = t + SAI_KHOA; SAI.set(tk.ten, s);
  tk.mk2SaiCuoi = { luc: t, ip: ip || "", n: s.n };
  // báo chủ tài khoản ở phiên sau (baoSai): cộng dồn mọi lần sai tới lúc báo — kẻ gian thử ít lần rồi chờ hết hạn đếm vẫn bị báo
  tk.mk2Bao = { luc: t, ip: ip || "", n: ((tk.mk2Bao && tk.mk2Bao.n) | 0) + 1, phien: tk.phien || "" };
  NK.ghi("mk", tk.ten, null, `Nhập sai ${loai} (lần ${s.n}/${SAI_MAX})`, { ip });
  if (s.n >= SAI_MAX) NK.ghi("mk", tk.ten, null, `Khóa nhập mật khẩu ${phut(SAI_KHOA)} phút sau ${SAI_MAX} lần sai`, { ip });
  D.ghiTk(tk);
  const Loai = loai[0].toUpperCase() + loai.slice(1);
  if (s.n >= SAI_MAX) loiNhap(`${Loai} không đúng — đã sai ${SAI_MAX} lần, khóa nhập ${phut(SAI_KHOA)} phút`, "khoa-nhap");
  loiNhap(`${Loai} không đúng (còn ${SAI_MAX - s.n} lần thử)`, "sai-mk");
}
const hetSai = (tk) => SAI.delete(tk.ten);
const xoaSai = (ten) => SAI.delete(ten); // quản trị đặt lại mật khẩu (đã xác minh chủ tài khoản): gỡ khóa nhập
// mật khẩu cấp 2 dễ đoán (rà soát 10/11): 6 số giống nhau, dãy tăng / giảm liền, lặp cặp / bộ ba (121212, 123123)
const DAY = "01234567890", DAY_NGUOC = "09876543210";
const deDoan = (s) => /^(\d)\1{5}$/.test(s) || DAY.includes(s) || DAY_NGUOC.includes(s) || /^(\d\d)\1\1$/.test(s) || /^(\d{3})\1$/.test(s);

// mật khẩu đăng nhập mới hợp lệ không (người chơi tự đặt)
function kiemMk1(tk, moi) {
  const s = String(moi ?? "");
  if (s.length < MK1_MIN || s.length > MK1_MAX) loi(`Mật khẩu mới ${MK1_MIN}–${MK1_MAX} ký tự`);
  if (s.trim() !== s) loi("Mật khẩu không được có khoảng trắng ở đầu hoặc cuối");
  if (s.toLowerCase() === String(tk.ten).toLowerCase()) loi("Mật khẩu không được trùng tên tài khoản");
  if (D.dungMk(tk, s)) loi("Mật khẩu mới phải khác mật khẩu đang dùng");
  if (tk.mk2 && dung(tk.mk2, s)) loi("Mật khẩu đăng nhập không được trùng mật khẩu cấp 2");
  return s;
}
function kiemMk2(tk, moi) {
  const s = String(moi ?? "");
  if (!MK2_RE.test(s)) loi("Mật khẩu cấp 2 gồm đúng 6 chữ số");
  if (deDoan(s)) loi("Mật khẩu cấp 2 quá dễ đoán (như 111111, 123456, 121212) — chọn dãy số khác");
  if (D.dungMk(tk, s)) loi("Mật khẩu cấp 2 không được trùng mật khẩu đăng nhập");
  return s;
}

// POST /api/bao-mat { viec, … } (api.js — đã đọc tài khoản tk mới nhất; trả { ...trangThai, msg? }; api.js ghi tài khoản sau khi gọi)
//   xem                    -> trạng thái + batDoiMk + khoaNhap (ms còn khóa nhập)
//   dat { mk1, moi }       -> đặt mật khẩu cấp 2 lần đầu (nhập lại mật khẩu đăng nhập) + mở khóa trang này
//   mo { mk }              -> mở khóa trang này
//   khoa                   -> khóa lại
//   doi { cu, moi }        -> đổi mật khẩu cấp 2
//   doiMk1 { cu, moi }     -> đổi mật khẩu đăng nhập: luôn cần mật khẩu đang dùng (bị bắt đổi: mật khẩu quản trị cấp — rà soát 10/11: trước không
//                             hỏi, cookie còn sót ở máy quán net là đổi được mật khẩu, chiếm tài khoản); đổi xong cấp phiên mới (api.js gửi cookie mới —
//                             nơi khác đang giữ phiên cũ, kể cả cookie bị chép, bị đăng xuất)
function lam(tk, b, ctx) {
  const trang = ctx.trang, ip = ctx.ip || "", viec = String(b.viec || "");
  const ra = (them = {}) => ({ ...trangThai(tk, trang), batDoiMk: tk.batDoiMk ? 1 : 0, ...them });
  if (viec === "xem") return ra({ khoaNhap: dangKhoaNhap(tk) });
  if (viec === "khoa") { khoaLai(tk.ten); return ra({ msg: "Đã khóa an toàn" }); }
  if (tk.batDoiMk && viec !== "doiMk1") throw loiMa("Tài khoản cần đổi mật khẩu đăng nhập trước", "bat-doi-mk");
  if (viec === "dat") {
    if (tk.mk2) loi("Tài khoản đã có mật khẩu cấp 2 — dùng Đổi mật khẩu cấp 2");
    chanKhoaNhap(tk);
    if (!D.dungMk(tk, b.mk1)) loi(ghiSai(tk, ip, "mật khẩu đăng nhập"));
    const s = kiemMk2(tk, b.moi);
    hetSai(tk); tk.mk2 = bam(s); tk.mk2Luc = Date.now(); moRieng(tk, trang);
    NK.ghi("mk", tk.ten, null, "Đặt mật khẩu cấp 2", { ip });
    return ra({ msg: "Đã đặt mật khẩu cấp 2 — khóa an toàn đang mở cho tới khi thoát game hoặc tải lại trang" });
  }
  if (viec === "mo") {
    if (!tk.mk2) throw loiMa("Tài khoản chưa có mật khẩu cấp 2 — đặt trước", "can-dat-mk2");
    chanKhoaNhap(tk);
    if (!dung(tk.mk2, b.mk)) loi(ghiSai(tk, ip, "mật khẩu cấp 2"));
    hetSai(tk); moCho(tk, trang);
    return ra({ msg: "Đã mở khóa an toàn" });
  }
  if (viec === "doi") {
    if (!tk.mk2) throw loiMa("Tài khoản chưa có mật khẩu cấp 2 — đặt trước", "can-dat-mk2");
    chanKhoaNhap(tk);
    if (!dung(tk.mk2, b.cu)) loi(ghiSai(tk, ip, "mật khẩu cấp 2"));
    const s = kiemMk2(tk, b.moi);
    if (s === String(b.cu)) loi("Mật khẩu cấp 2 mới phải khác mật khẩu cũ");
    hetSai(tk); tk.mk2 = bam(s); tk.mk2Luc = Date.now(); moRieng(tk, trang);
    NK.ghi("mk", tk.ten, null, "Đổi mật khẩu cấp 2", { ip });
    return ra({ msg: "Đã đổi mật khẩu cấp 2" });
  }
  if (viec === "doiMk1") {
    const bat = !!tk.batDoiMk;
    // tự đổi (không bị bắt): như mọi việc được bảo vệ — chưa có mật khẩu cấp 2 thì bắt đặt trước (lựa chọn 1a), có rồi thì phải mở khóa
    if (!bat && !daMo(tk, trang)) throw tk.mk2 ? loiMa("Cần mở khóa an toàn (mật khẩu cấp 2) trước khi đổi mật khẩu đăng nhập", "can-mk2")
      : loiMa("Cần đặt mật khẩu cấp 2 trước khi đổi mật khẩu đăng nhập", "can-dat-mk2");
    chanKhoaNhap(tk);
    if (!D.dungMk(tk, b.cu)) loi(ghiSai(tk, ip, bat ? "mật khẩu quản trị cấp" : "mật khẩu đăng nhập"));
    const s = kiemMk1(tk, b.moi), mo0 = daMo(tk, trang);
    hetSai(tk); tk.bam = bam(s); tk.mkLuc = Date.now(); delete tk.batDoiMk;
    tk.phien = crypto.randomBytes(24).toString("base64url"); MO.delete(tk.ten); if (mo0) moCho(tk, trang); // phiên mới (api.js gửi cookie), trang này giữ trạng thái mở
    NK.ghi("mk", tk.ten, null, bat ? "Đổi mật khẩu đăng nhập lần đầu (mật khẩu quản trị cấp)" : "Đổi mật khẩu đăng nhập", { ip });
    return ra({ msg: "Đã đổi mật khẩu đăng nhập" });
  }
  loi("Việc không rõ");
}

// ---- chặn trước mọi API (api.js xuLyApi, sau khi đọc tài khoản): null = cho qua, { msg, ma } = trả 403 kèm mã để trình duyệt hỏi rồi gửi lại
// việc đồ / tiền rời tài khoản (lựa chọn 1a: chưa có mật khẩu cấp 2 thì bắt đặt ngay lúc đó)
// giao-dich.js (viec: mo | xin | nhan | tuChoi | huy | dat | tien | khoa | xn): hỏi sớm nhất lúc mở nhận giao dịch / xin / nhận lời (trước khi
// lời xin 30 giây bị dùng — nhập lần đầu không làm hết hạn lời xin của người kia); bày món / tiền / khóa / xác nhận cũng chặn (phòng khi vừa Khóa lại giữa
// chừng). Không bao giờ chặn hủy, từ chối, tắt mở, bỏ khóa, bỏ xác nhận — thoát ra luôn được
const GD_LUON = new Set(["xin", "nhan", "dat", "tien"]), GD_KHI_BAT = new Set(["mo", "khoa", "xn"]);
// cho-troi.js: định giá (bày mới + đổi giá món đang bày — đổi giá xuống 1 lượng rồi mua bằng tài khoản khác cũng là đường đem đồ đi) và mua của sạp
// người chơi (k "ht" = sạp hệ thống của Dã Tẩu, như cửa hàng NPC — không hỏi)
const ACT_DO = new Set(["vut", "huy"]); // do.js: vứt ra đất, Lễ quan hủy vật phẩm (Trợ Thủ thanh / catDo / loc, bán NPC… không hỏi)
// bang hội (anh 14/11 — THIET-KE-BANG-HOI.md 1.7, may-chu/bang-hoi.js): chuyển vị bang chủ, giải tán, trục xuất; đợt 2 (HOP-DONG-DOT-2 mục 6): quyên tiền, nạp ngân quỹ,
// phát ngân quỹ, chuyển ngân quỹ -> kiến thiết, kiến thiết -> chiến bị, phát cống hiến dự trữ, đổi phe, hủy tác phường, tặng hồng bao (không có rút ngân quỹ — Q3)
const BH_MK2 = new Set(["chuyenVi", "giaiTan", "duoi", "quyenTien", "napQuy", "phatQuy", "chuyenNq", "chuyenKt", "phatCong", "doiPhe", "tpHuy", "tangHb"]);
// API chỉ tài khoản quản trị (F10 + công cụ thử)
const QT_RE = /^\/api\/(quan-tri\/|boss-tg$|san-nhim$|[a-z-]+-qt$)/;
// bị bắt đổi mật khẩu: chỉ cho các API này (api.js trả trước khi gọi chan: dang-nhap, anh-cho, trang-thai, lich-hd GET, bao-mat)
const CHO_KHI_BAT_DOI = new Set(["/api/toi", "/api/dang-xuat"]);
function canMo(tk, p, m, b) {
  if (tk.admin && QT_RE.test(p)) return true;
  if (m === "POST" && p === "/api/giao-dich") { const v = String(b.viec || ""); return GD_LUON.has(v) || (GD_KHI_BAT.has(v) && !!b.on); }
  if (m === "POST" && p === "/api/cho") { const v = String(b.viec || ""); return v === "dinhGia" || (v === "mua" && String(b.k || "") !== "ht"); }
  if (m === "POST" && p === "/api/do") return ACT_DO.has(String(b.act || ""));
  if (m === "POST" && p === "/api/bang-hoi") return BH_MK2.has(String(b.viec || ""));
  if (m === "DELETE" && /^\/api\/nv\/\d$/.test(p)) return true;
  return false;
}
function chan(tk, trang, p, m, b) {
  if (tk.batDoiMk) return CHO_KHI_BAT_DOI.has(p) ? null : { msg: "Tài khoản cần đổi mật khẩu đăng nhập trước khi vào game", ma: "bat-doi-mk" };
  if (!canMo(tk, p, m, b || {}) || daMo(tk, trang)) return null;
  return tk.mk2 ? { msg: "Cần mở khóa an toàn — nhập mật khẩu cấp 2", ma: "can-mk2" } : { msg: "Cần đặt mật khẩu cấp 2 trước (khóa an toàn)", ma: "can-dat-mk2" };
}

// quản trị xóa mật khẩu cấp 2 (F10 — người chơi quên, quản trị đã xác minh)
function xoaMk2(tk, qt) {
  if (!tk.mk2) return false;
  delete tk.mk2; delete tk.mk2Luc; delete tk.mk2Bao; khoaLai(tk.ten); SAI.delete(tk.ten);
  NK.ghi("mk", tk.ten, null, `Quản trị ${qt} xóa mật khẩu cấp 2`);
  return true;
}

// tóm tắt cho F10 (không bao giờ gửi băm)
const tomTat = (tk) => ({ batDoiMk: tk.batDoiMk ? 1 : 0, mkLuc: tk.mkLuc || 0, mk2: tk.mk2 ? 1 : 0, mk2Luc: tk.mk2Luc || 0, mk2SaiCuoi: tk.mk2SaiCuoi || null, khoaNhap: dangKhoaNhap(tk) });

// câu báo chủ tài khoản (nhịp — api.js): có người nhập sai mật khẩu ở phiên khác. Rà soát 10/11: chỉ trang đã mở bằng mật khẩu cấp 2 (chủ thật) mới xóa
// câu báo — kẻ gian đăng nhập lại không "nhận hộ" rồi xóa mất; mỗi phiên hiện tối đa 1 lần (b.daBao), tới khi chủ tài khoản mở khóa
function baoSai(tk, trang) {
  const b = tk.mk2Bao; if (!b || b.phien === tk.phien) return null;
  if (daMo(tk, trang)) delete tk.mk2Bao;
  if (b.daBao === tk.phien) return null;
  b.daBao = tk.phien;
  return { luc: b.luc, ip: b.ip, n: b.n };
}

module.exports = { qtMo, lam, chan, trangCua, daMo, trangThai, khoaLai, khoaTrang, xoaSai, xoaMk2, tomTat, baoSai, loiMa, MK2_RE, SAI_MAX, SAI_KHOA, MK1_MIN };
