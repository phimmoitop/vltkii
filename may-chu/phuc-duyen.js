// Phúc duyên (anh 31/10 khuya lần 2: "làm luôn hệ thống phúc duyên, và các loại phúc duyên lộ, đưa phúc duyên lộ tiểu trung đại vào game"). Theo client:
// script\global\fuyuan.lua (điểm phúc duyên, tích lũy thời gian online, đổi điểm FuYuan_Gain), 路人_武林盟传人.lua (Võ Lâm Minh Truyền Nhân: Nhận điểm
// phúc duyên / Thời gian tích lũy đổi điểm phúc duyên / Liên quan đến phúc duyên), 路人_神秘商人柳乙.lua (Thần bí Thương Nhân Liễu Ất: Sale(93, 2) —
// mua bằng phúc duyên), item\fuyuanlu_*.lua (Phúc Duyên Lộ +10 / +20 / +50 — may-chu/do.js "phucDuyen"). S1: Ba Lăng không có 2 NPC này -> Nhận
// thưởng → Phúc duyên; không cần nạp thẻ, không có giai đoạn mệt mỏi, không nhận giúp cả đội; thời gian online đếm chung nhịp với Online nhận thưởng
// (may-chu/online.js — ủy thác không tính). Số: cau-hinh.json phucDuyen.
//   - Lần đầu: "Các hạ mới ra giang hồ, ta có chút lễ vật, xin nhận lấy!" -> mở công năng + batDau điểm (FuYuan_Start + FuYuan_Add(2)).
//   - Đổi: thời gian hợp lệ ≥ toiThieu (2 giờ); hợp lệ = tổng nếu ≤ suyGiam (4 giờ), quá thì mỗi 2 giờ chỉ tính 1 giờ; điểm = giờ hợp lệ (moiDiem
//     giây = 1 điểm), lần đổi thứ 2 trong ngày + lan2Them, mỗi lần tối đa toiDaMoiLan; phần lẻ dưới 1 giờ giữ lại.
// h.pd = { bat, diem, tich (giây online từ lần đổi trước), ngay (ngày VN lần đổi gần nhất), lan (số lần đổi trong ngày đó) }
"use strict";
const DO = require("./do.js"), ONL = require("./online.js");

// cấu hình đọc LÚC DÙNG (soát 14/11 — như thuong-cap.js: trước chép 7 số lúc khởi động, F10 → Cấu hình sửa phải khởi động lại mới ăn)
const N = DO.NOI, C = () => N.CFG.phucDuyen || {};
const so = () => { const c = C(); return { BAT: c.bat !== false, BAT_DAU: c.batDau ?? 2, MOI: c.moiDiem || 3600, TOI_THIEU: c.toiThieu ?? 7200, SUY: c.suyGiam ?? 14400, LAN2: c.lan2Them ?? 2, TOI_DA: c.toiDaMoiLan ?? 100 }; };
const Y = (t) => `<color=yellow>${t}<color>`;
const say = (text, opts) => ({ say: { text, opts } });
const gioPhutGiay = (s) => { s = Math.floor(s); return `${Math.floor(s / 3600)} giờ ${Math.floor(s / 60) % 60} phút ${s % 60} giây`; }; // timeToString của client
// FuYuan_GetDepositTime: thời gian hợp lệ (tới suyGiam tính đủ, sau đó mỗi 2 × moiDiem giây chỉ tính moiDiem giây)
const hopLe = (tong) => { const { MOI, SUY } = so(); return tong <= SUY ? tong : (Math.floor(tong / MOI) - Math.floor((tong - SUY) / (2 * MOI))) * MOI + (tong % MOI); };
const tomTat = (h) => (h.pd && h.pd.bat ? { diem: h.pd.diem | 0 } : null);
const MENU = [["Nhận điểm phúc duyên của bạn", "nhan"], ["Thời gian tích lũy đổi điểm phúc duyên", "xem"], ["Giao dịch (Thần bí Thương Nhân Liễu Ất)", "shop"],
  ["Liên quan đến phúc duyên", "about"], ["Hủy bỏ", null]];
const ABOUT = ["Số điểm phúc duyên: Thông qua tích lũy thời gian Online sẽ đổi lấy một số điểm ảo, có thể dùng để đổi các loại vật phẩm đặc biệt ở Thần bí Thương Nhân Liễu Ất (Nhận thưởng → Phúc duyên → Giao dịch).",
  "Đổi phúc duyên: Sau khi online > 2 giờ, đến Võ Lâm Truyền Nhân (Nhận thưởng → Phúc duyên) để đổi. Nếu 1 ngày đổi phúc duyên thành công 2 lần, sẽ nhận được phần thưởng. Nếu Online < 4 giờ, mỗi giờ đổi được 1 điểm. Sau đó, mỗi 2 giờ đổi được 1 điểm.",
  "Điều kiện hạn chế: ủy thác (không vào game) sẽ không được tính tích lũy thời gian online. Phúc Duyên Lộ tiểu / trung / đại: +10 / +20 / +50 điểm phúc duyên."];

function batDau(h) { // FuYuan_Start + FuYuan_Add(BAT_DAU)
  const { BAT_DAU } = so();
  h.pd = { bat: 1, diem: (h.pd && h.pd.diem) | 0, tich: 0, ngay: 0, lan: 0 };
  h.pd.diem += BAT_DAU;
  return { tin: [`Bạn nhận được ${BAT_DAU} điểm phúc duyên`], ...say("Các hạ mới ra giang hồ, ta có chút lễ vật, xin nhận lấy!", [["Trở lại", "mo"]]) };
}
// b.viec: "mo" (menu Võ Lâm Minh Truyền Nhân) | "nhan" (OnGain_Self) | "xem" (OnQueryTime) | "about" | "shop" (trình duyệt mở cửa hàng Sale 93)
function lam(h, key, b) {
  const { BAT, MOI, TOI_THIEU, LAN2, TOI_DA } = so();
  if (!BAT) N.loi("Hiện chưa có công năng phúc duyên");
  const P = h.pd;
  if (b.viec === "about") return { talk: ABOUT };
  if (b.viec === "mo" || !b.viec) return say(`Võ Lâm Minh Truyền Nhân: Thời thế loạn lạc, chư vị nên giữ đạo chính phái, tạo phúc chúng sinh. Có thế mới hi vọng trở thành một đại hiệp được mọi người ngưỡng mộ.<enter>Điểm phúc duyên hiện có: ${Y(P && P.bat ? P.diem | 0 : 0)}`, MENU);
  if (b.viec === "shop") { if (!P || !P.bat) return batDau(h); return { shop: 93, diem: P.diem | 0 }; }
  if (!P || !P.bat) return batDau(h);
  ONL.xa(h, key); // phần đếm chưa ghi của nhịp gần nhất vào h.pd.tich
  if (b.viec === "xem") return say(`Từ điểm phúc duyên lần trước nhận được, tổng cộng bạn tích lũy được ${Y(gioPhutGiay(P.tich || 0))} thời gian Online`, [["Trở lại", "mo"]]);
  if (b.viec !== "nhan") N.loi("Không rõ việc");
  // FuYuan_Gain
  const hl = hopLe(P.tich || 0);
  if (hl < TOI_THIEU) return say("Ngươi phiêu bạt giang hồ còn chưa đủ, học hỏi nhiều thêm rồi đến tìm ta!", [["Trở lại", "mo"]]);
  const nay = N.ngayVN(Date.now());
  let diem = Math.floor(hl / MOI);
  if (P.ngay === nay) { P.lan = (P.lan | 0) + 1; if (P.lan === 2) diem += LAN2; } else { P.ngay = nay; P.lan = 1; }
  diem = Math.min(TOI_DA, diem);
  P.tich = hl % MOI; P.diem = (P.diem | 0) + diem;
  return { tin: [`Bạn nhận được ${diem} điểm phúc duyên`], ...say(`Ngươi phiêu bạt giang hồ đã lâu, công lao đã nhiều, đây là phần thưởng ngươi đáng được nhận! Đừng bỏ lỡ!<enter>Điểm phúc duyên hiện có: ${Y(P.diem)}`, [["Trở lại", "mo"]]) };
}
// công cụ thử (tài khoản quản trị — api.js /api/quan-tri/hoat-dong hd "pd"): b.viec "tich" (b.n giây tích lũy) | "diem" (+ b.n điểm) | "datLai"
function dev(h, key, b) {
  if (b.viec === "datLai") delete h.pd;
  else {
    if (!h.pd || !h.pd.bat) h.pd = { bat: 1, diem: 0, tich: 0, ngay: 0, lan: 0 };
    ONL.xa(h, key);
    if (b.viec === "tich") h.pd.tich = Math.max(0, b.n | 0);
    else if (b.viec === "diem") h.pd.diem = Math.max(0, (h.pd.diem | 0) + (b.n | 0));
  }
  const P = h.pd;
  return { tin: [P ? `Phúc duyên (thử): ${P.diem} điểm · tích lũy ${gioPhutGiay(P.tich || 0)} · hôm nay đã đổi ${P.ngay === N.ngayVN(Date.now()) ? P.lan : 0} lần` : "Phúc duyên (thử): đã xóa — chưa mở công năng"],
    dev: P ? { diem: P.diem, tich: Math.floor(P.tich || 0) } : null };
}

// còn quà chờ nhận: lần đầu (quà mở công năng) hoặc thời gian hợp lệ đủ đổi điểm (anh 03/11 — số đỏ trên nút Nhận thưởng: api.js nhip ntc)
const coNhan = (h, key) => { const { BAT, TOI_THIEU } = so(); return BAT && (!h.pd || !h.pd.bat || hopLe((h.pd.tich || 0) + ONL.them(key)) >= TOI_THIEU); };

module.exports = { lam, dev, tomTat, hopLe, coNhan };
