// Lưới an toàn của tiến trình (anh 12/11 "Sửa luôn" — S2 sập 11:22:59 vì 1 lỗi kết nối không ai bắt ở may-chu/tep.js): lỗi lọt ra ngoài mà là lỗi
// MẠNG / LUỒNG của một kết nối (người chơi điện thoại rớt mạng giữa chừng: ECONNRESET, EPIPE, ghi vào kết nối đã đóng…) thì chỉ ghi nhật ký, máy chủ
// chạy tiếp — trước đây cả game tắt, systemd 3 giây sau mới bật lại, mất hết trạng thái trong bộ nhớ (boss thế giới, phòng Tống Kim, giao dịch…) và ~100
// người bị ngắt. Mọi lỗi KHÁC (lỗi mã game) vẫn thoát như cũ (mã 1 — systemd bật lại): không chạy tiếp với trạng thái game có thể đã hỏng.
"use strict";
const LOI_KET_NOI = new Set(["ECONNRESET", "EPIPE", "ECONNABORTED", "ETIMEDOUT", "ERR_STREAM_DESTROYED", "ERR_STREAM_WRITE_AFTER_END",
  "ERR_STREAM_PREMATURE_CLOSE", "ERR_STREAM_UNABLE_TO_PIPE", "ERR_HTTP_HEADERS_SENT"]);
const laLoiKetNoi = (e) => !!(e && LOI_KET_NOI.has(e.code));
let dem = 0, mocDem = 0; // ghi tối đa 20 dòng / phút (lỗi lặp không làm ngập nhật ký)
function ghi(loai, e) {
  const t = Date.now(); if (t - mocDem > 60000) { mocDem = t; dem = 0; }
  if (++dem <= 20) console.error(`[lưới an toàn] ${loai} — lỗi kết nối, máy chủ chạy tiếp: ${(e && e.code) || ""} ${(e && e.stack) || e}`);
}
function cai() {
  process.on("uncaughtException", (e) => {
    if (laLoiKetNoi(e)) return ghi("uncaughtException", e);
    console.error(e); if (process.env.VL_MANAGED_SHUTDOWN === "1") process.emit("SIGTERM"); else process.exit(1); // Render: flush snapshot trước khi thoát
  });
  process.on("unhandledRejection", (e) => {
    if (laLoiKetNoi(e)) return ghi("unhandledRejection", e);
    console.error(e); if (process.env.VL_MANAGED_SHUTDOWN === "1") process.emit("SIGTERM"); else process.exit(1);
  });
}
module.exports = { cai, laLoiKetNoi };
