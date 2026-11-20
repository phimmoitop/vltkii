// Phát hiện tăng tốc trình duyệt (anh 31/10 khuya: "chặn các người chơi dùng chức năng tăng tốc trình duyệt để tăng tốc cày game, như cheat
// engine hay coowon — cái này cũng tính là hack; nếu em phát hiện thì báo trong trang quản lý sv, anh sẽ nhắc nhở, cảnh cáo, không thay đổi thì
// khóa tài khoản"). Không tự khóa — quản trị xem rồi xử lý (bảng F10).
// Cách đo: mỗi nhịp trình duyệt gửi đồng hồ của trang (tc = performance.now() — Cheat Engine speedhack / nút tăng tốc của trình duyệt làm đồng
// hồ này chạy nhanh hơn thật) -> so với đồng hồ máy chủ trong cửa sổ CUA; kèm số nhịp mỗi giây (tăng tốc bộ hẹn giờ làm nhịp dày hơn — trang
// gửi tối đa 2 nhịp / giây, tab ẩn 1). Lệch quá ngưỡng LAN_LIEN cửa sổ liền -> ghi nhật ký loại "hack" + đánh dấu tài khoản tk.nghiHack
// = { lan, luc, x, f, nv, v } (bảng quản trị hiện đỏ — quản trị xóa cờ sau khi nhắc; 11/11 thêm nút xóa hàng loạt cờ cũ của bộ dò trước — v
// thiếu). Trang tải lại (đồng hồ lùi) / không có nhịp > 15 giây (tab ngủ, mất mạng, máy chủ đứng) / 2 trang cùng 1 nhân vật (đồng hồ nhảy qua
// lại) -> đo lại; mốc lấy từ nhịp kế tiếp, cửa sổ ngay sau đó dùng ngưỡng NGHI_SAU (11/11 — xem dưới).
// Anh 01/11 ("treo trên máy không làm gì mà nó báo mấy lần" — nhật ký ×1,00 mà 3,9–4 nhịp / giây): trang cũ gửi mỗi lần lấy mốc (4 lần / giây)
// khi tab ẩn / bị cửa sổ khác che — trình duyệt chỉ hãm bộ hẹn giờ khi trang không phát tiếng, game có nhạc nên không bị hãm. Trang mới giữ
// các nhịp cách nhau ≥ 450 ms và gửi nd = 1 -> chỉ đo số nhịp / giây khi có nd; trang cũ (chưa tải lại) chỉ đo đồng hồ.
//   nhip(tk, h, key, tc, nd) -> câu báo (vừa ghi nhật ký + đặt tk.nghiHack — api.js ghi file) | null
"use strict";
const NK = require("./nhat-ky");

// VL_CH_CUA: số giây mỗi lần đo (chỉ máy chủ thử — thử nhanh); thật: 60
// NGHI_SAU: ngưỡng của cửa sổ đo NGAY SAU khoảng ngắt (mốc có thể kẹt tới NGAT = 15 giây -> người chơi thật lệch tối đa ×1 + 15/60 = ×1,25)
const CUA = (+process.env.VL_CH_CUA || 60) * 1000, NGHI_DH = 1.15, NGHI_SAU = 1.27, NGHI_NHIP = 2.8, LAN_LIEN = 2, BAO_LAI = 10 * 60 * 1000, NGAT = 15000;
// BAN: phiên bản bộ dò ghi vào cờ (tk.nghiHack.v) — cờ không có v là của bộ dò cũ (trước 11/11, báo nhầm lúc máy chủ lag): nút xóa hàng loạt chỉ xóa loại đó
const BAN = 2;
const S = new Map(); // "tài khoản|ô" -> { s0, c0, n, tc, t, nghi, bao, sau }
const so = (v, n) => v.toFixed(n).replace(".", ",");

function nhip(tk, h, key, tc, nd, t = Date.now()) {
  if (typeof tc !== "number" || !Number.isFinite(tc) || tc < 0) return null;
  const m = S.get(key);
  // khoảng ngắt (trang tải lại / > NGAT không có nhịp — tab ngủ, mất mạng, máy chủ đứng): đo lại. Nhịp đầu sau khoảng ngắt thường đã kẹt trên
  // đường / trong hàng chờ máy chủ (đồng hồ trang cũ ≥ 15 giây — bản cũ lấy nó làm mốc nên cửa sổ sau ra ×1,25 trở lên dù không tăng tốc: anh 11/11
  // "xóa cờ hàng loạt", 94 tài khoản ×1,25–×1,38 lúc máy cũ bị AWS ghìm CPU) -> mốc là nhịp KẾ TIẾP. Trang gửi nhịp tuần tự nên mốc kẹt tối đa
  // bằng khoảng cách tới nhịp trước (≤ NGAT): 2 cửa sổ LIỀN > ×1,15 cần kẹt ≥ 18 giây (không thể), cửa sổ ngay sau khoảng ngắt (sau) người thật
  // lệch tối đa ×1,25 -> ngưỡng riêng NGHI_SAU. Số lần nghi GIỮ qua khoảng ngắt (rà soát 11/11: xóa đi thì kẻ tăng tốc cố tình ngừng nhịp > 15 giây
  // mỗi ~2 phút lách được) — vẫn không báo nhầm: người thật không bao giờ có 2 cửa sổ nghi liền nhau
  if (!m || tc < m.tc || t - m.t > NGAT) { S.set(key, { s0: 0, c0: 0, n: 0, tc, t, nghi: m ? m.nghi : 0, bao: m ? m.bao : 0, sau: 1 }); return null; }
  m.tc = tc; m.t = t;
  if (!m.s0) { m.s0 = t; m.c0 = tc; return null; }
  m.n++;
  const ds = t - m.s0; if (ds < CUA) return null;
  const x = (tc - m.c0) / ds, f = (m.n * 1000) / ds;
  m.nghi = x > (m.sau ? NGHI_SAU : NGHI_DH) || (nd === 1 && f > NGHI_NHIP) ? m.nghi + 1 : 0;
  Object.assign(m, { s0: t, c0: tc, n: 0, sau: 0 });
  if (m.nghi < LAN_LIEN || t - m.bao < BAO_LAI) return null;
  m.bao = t;
  const cau = `Nghi dùng tăng tốc trình duyệt (Cheat Engine / nút tăng tốc): đồng hồ trang chạy ×${so(x, 2)} so với máy chủ, ${so(f, 1)} nhịp / giây (bình thường ×1,00 và ≤ 2 nhịp / giây), ${LAN_LIEN} lần đo liền ${CUA / 1000} giây`;
  NK.ghi("hack", tk.ten, h.name, cau);
  tk.nghiHack = { lan: ((tk.nghiHack || {}).lan | 0) + 1, luc: t, x: Math.round(x * 100) / 100, f: Math.round(f * 10) / 10, nv: h.name, v: BAN };
  console.warn(`[nghi tăng tốc] ${tk.ten} (${h.name}): ×${so(x, 2)}, ${so(f, 1)} nhịp/giây`);
  return cau;
}

module.exports = { nhip, NGHI_DH, NGHI_NHIP, BAN };
