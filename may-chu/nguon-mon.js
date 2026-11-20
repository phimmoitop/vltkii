// Nguồn gốc món (anh 18/11 tối — "sao mà anh làm admin mà ng chơi lấy đồ từ đâu cũng k biết vậy em": soi tài khoản dohoangba có Huyền Thiết Kiếm 6 dòng
// tối đa, nhật ký không có dấu vết). Mỗi trang bị (món có ngũ hành + dòng — nhánh cuối của do.js chuan mon) mang:
//   g  = mã riêng toàn máy (thời điểm tạo cơ số 36 + số thứ tự trong cùng mili giây) — giữ nguyên khi giao dịch / chợ trời / khảm / hoán hình / cất rương
//   ng = [loại nguồn, chi tiết, giờ tạo (ms — 0: món có từ trước khi gắn nguồn), nhân vật có đầu tiên]
//        loại: roi (rơi từ quái — chi tiết "Quái / Trùm cấp N · bãi") · ruong (mở rương) · qua (quà / thưởng — chi tiết = việc đang làm) · mua (cửa hàng NPC)
//        · he (sạp Hệ thống / Dã Tẩu mua hộ) · ngua (mã bài) · dung (dùng vật phẩm ra món) · qt (công cụ thử của quản trị) · cu (có từ trước 18/11 — chưa biết nguồn)
//        · "?" (KHÔNG RÕ NGUỒN: món vào túi mà không qua chỗ tạo món nào đã gắn nguồn — có thể lỗi / gian lận; chi tiết = việc đang làm lúc đó)
//   di = đường đi gần nhất (tối đa DI_MAX): [giờ, kiểu, câu] — gd (giao dịch), cho (chợ trời), dat (vứt ra đất — người khác nhặt), kham (khảm nạm / hoán), qt (quản trị sửa)
// Món cũ: lần chuẩn hóa đầu tiên sau bản này (do.js chuan — h.ngV chưa có) gắn "cu"; sau đó trang bị nào xuất hiện không có g -> "?" + ghi nhật ký (loại "nguon").
// Chỉ quản trị xem (itemtip.js — dòng Nguồn gốc; F10 → Tìm món: may-chu/quan-tri.js timMonCaMay).
"use strict";

const DI_MAX = 10;
let tTruoc = 0, so = 0, CTX = "";
// mã riêng: mili giây cơ số 36 (+ "-n" khi nhiều món cùng mili giây). Một tiến trình máy chủ — khởi động lại mất > 1 giây nên không trùng
function maMoi() {
  const t = Date.now();
  if (t > tTruoc) { tTruoc = t; so = 0; } else so++;
  return tTruoc.toString(36) + (so ? "-" + so.toString(36) : "");
}
const chu = (s, n) => String(s ?? "").slice(0, n);
// việc đang xử lý (api.js đặt đầu mỗi yêu cầu: "POST /api/do mo"…; bộ hẹn giờ / nhịp chạy ngoài yêu cầu: "") — chi tiết mặc định của qua / "?"
const ctx = (s) => { CTX = chu(s, 60); };
const ctxNay = () => CTX;
// gắn nguồn cho món mới (đã có g thì giữ nguyên — món cũ đi qua chỗ tạo không bị ghi đè)
function gan(it, loai, ct, ten) {
  if (!it || it.g) return it;
  it.g = maMoi();
  it.ng = [chu(loai, 8), chu(ct == null || ct === "" ? CTX : ct, 80), Date.now(), chu(ten, 40)];
  return it;
}
// món có từ trước khi gắn nguồn (chuẩn hóa lần đầu; món trên sạp / chờ từ trước bản này)
function cu(it) { if (it && !it.g) { it.g = maMoi(); it.ng = ["cu", "", 0, ""]; } return it; }
// người có đầu tiên (món rơi xuống đất chưa có chủ — điền khi vào túi)
function chuDau(it, ten) { if (it && Array.isArray(it.ng) && !it.ng[3] && ten) it.ng = [it.ng[0], it.ng[1], it.ng[2], chu(ten, 40)]; return it; }
// thêm 1 bước đường đi (mảng mới — bản sao nông của món không dùng chung mảng với món gốc)
function di(it, kieu, cau) {
  if (!it) return it;
  cu(it);
  it.di = [...(Array.isArray(it.di) ? it.di : []), [Date.now(), chu(kieu, 8), chu(cau, 140)]].slice(-DI_MAX);
  return it;
}
// làm sạch 3 trường khi chuẩn hóa (do.js chuan mon) -> { g?, ng?, di? }
function sach(o) {
  const r = {};
  if (typeof o.g === "string" && /^[0-9a-z-]{4,24}$/.test(o.g)) {
    r.g = o.g;
    const n = Array.isArray(o.ng) ? o.ng : null;
    r.ng = n ? [chu(n[0], 8), chu(n[1], 80), Number.isFinite(+n[2]) ? +n[2] : 0, chu(n[3], 40)] : ["cu", "", 0, ""];
    if (Array.isArray(o.di) && o.di.length) r.di = o.di.filter((x) => Array.isArray(x)).slice(-DI_MAX).map((x) => [Number.isFinite(+x[0]) ? +x[0] : 0, chu(x[1], 8), chu(x[2], 140)]);
  }
  return r;
}
// câu ngắn cho nhật ký / F10
const TEN_LOAI = { roi: "Rơi từ", ruong: "Mở", qua: "Quà / thưởng", mua: "Mua ở", he: "Hệ thống", ngua: "Dùng", dung: "Dùng", qt: "Quản trị tạo", cu: "Có từ trước khi gắn nguồn (18/11)", "?": "KHÔNG RÕ NGUỒN" };
function cauNguon(ng) {
  if (!Array.isArray(ng)) return "Chưa gắn nguồn";
  const [l, c] = ng, t = TEN_LOAI[l] || l;
  return l === "cu" ? t : `${t}${c ? (l === "?" ? " — " : ": ") + c : ""}`;
}

module.exports = { maMoi, gan, cu, chuDau, di, sach, ctx, ctxNay, cauNguon, TEN_LOAI, DI_MAX };
