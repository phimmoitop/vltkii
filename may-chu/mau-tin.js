"use strict";
// Màu chữ trong tin hệ thống (anh 13/11: "em giúp anh đừng để thông báo toàn màu đỏ như vậy, tên nv và thưởng em đổi màu cho dễ nhìn"). Như kịch bản client
// (Msg2SubWorld("…<color=yellow>"..GetName().."<color>…")): thẻ <color=tên>…<color> nằm ngay trong chữ của tin; trình duyệt tô màu ở khung chat (src/game/npcdlg.js
// chuMau — tên màu theo bảng màu engine: yellow, green, cyan, orange…), loa thông báo quản trị bỏ thẻ (boMau). Đổi màu cả máy chủ: sửa MAU ở đây.
//   ten(x): tên nhân vật (người chơi / bot Tống Kim)   thuong(x): phần thưởng (kinh nghiệm, Xu, vật phẩm, rương, lượng…)
// Chỉ dùng cho chữ đưa vào thongBao / thongBaoBai / thongBaoTk (the-gioi.js) — KHÔNG dùng cho nhật ký, tin trả về khung hỏi / msg của trình duyệt (không đọc thẻ).
const MAU = { ten: "cyan", thuong: "green" }; // anh chọn mẫu C (13/11): chữ nền vàng nhạt (src/game/hud.js MAU_HE_THONG), tên xanh ngọc, thưởng xanh lá
const boc = (mau, x) => (x == null || x === "" ? "" : `<color=${mau}>${x}<color>`);
module.exports = { MAU, ten: (x) => boc(MAU.ten, x), thuong: (x) => boc(MAU.thuong, x) };
