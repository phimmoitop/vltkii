// Bảng xếp hạng (bước 7 của THIET-KE-S1.md mục 7 — anh 27/10): mọi nhân vật của máy chủ, đọc lại file tài khoản
// nhiều nhất 5 phút 1 lần (LAM_MOI). Trình duyệt tự chia mục như khung client 排名.ini (Cấp độ cả máy chủ · Tài phú · từng phái —
// src/game/windows.js _xephang); ô "Hạng" dải trên = thứ tự cấp của nhân vật trong cả máy chủ (nhịp trả `hang`).
//   ds()            -> [{ n, lvl, exp, fac, tien }]  tien = ngân lượng mang theo + ngân lượng trong rương
//   hang(tk, o)     -> thứ tự cấp (1 = cao nhất) | null
//   bangDs()        -> [{ ten, chu, cap, n, tongCap }]  xếp hạng bang hội (anh 14/11 — THIET-KE-BANG-HOI.md 1.7): tổng cấp thành viên cộng NGAY trong vòng quét này
//                      (may-chu/bang-hoi.js idCua — tra O(1), không đọc thêm đĩa); cấp bang giảm dần, rồi tổng cấp, nhân số, tên
// Xếp cấp: cấp giảm dần, cùng cấp thì kinh nghiệm nhiều hơn đứng trên, rồi tên.
"use strict";
const D = require("./du-lieu");
const BH = () => require("./bang-hoi"); // nạp lúc dùng (bang-hoi.js nạp do.js… — không vòng lúc khởi động)

// anh 11/11 (máy chủ lag lúc ~130 người, ~530 tài khoản): mỗi lần làm mới đọc lại TOÀN BỘ tệp tài khoản, cả máy chủ đứng 0,1–0,6 giây — nhịp
// nào cũng hỏi hạng nên trước 30 giây đứng 1 lần -> 5 phút
const LAM_MOI = 5 * 60 * 1000;
let bang = null, luc = 0, bangHoi = [];

function lamMoi() {
  if (bang && Date.now() - luc < LAM_MOI) return bang;
  const L = [], tong = new Map(); // tong: mã bang -> tổng cấp thành viên (cả nhân vật của tài khoản quản trị — như nhân số của bang)
  let bh = null; try { bh = BH(); } catch (e) { console.error("Xếp hạng bang hội:", e.message); }
  for (const tk of D.dsTk()) (tk.nv || []).forEach((h, o) => {
    if (!h || !h.name) return;
    if (bh) { const id = bh.idCua(tk.ten, o, h.name); if (id != null) tong.set(id, (tong.get(id) || 0) + (h.lvl | 0)); }
    if (tk.admin) return; // tài khoản quản trị không lên bảng (anh 31/10 khuya)
    L.push({ n: h.name, lvl: h.lvl | 0, exp: Math.max(0, +h.exp || 0), fac: h.fac ?? null, tien: (+h.gold || 0) + (+h.tienRuong || 0), key: tk.ten + "|" + o });
  });
  L.sort((a, b) => b.lvl - a.lvl || b.exp - a.exp || a.n.localeCompare(b.n));
  try { bangHoi = bh ? bh.dsXepHang(tong) : []; } catch (e) { console.error("Xếp hạng bang hội:", e.message); bangHoi = []; }
  bang = L; luc = Date.now();
  return L;
}

const ds = () => lamMoi().map(({ key, ...r }) => r);
function hang(tk, o) { const i = lamMoi().findIndex((r) => r.key === tk.ten + "|" + o); return i < 0 ? null : i + 1; }
// có khóa "tài khoản|ô" — chỉ dùng trong máy chủ (Phân Thân — may-chu/phan-than.js chọn người để chụp; không gửi khóa ra trình duyệt)
const dsKhoa = () => lamMoi();
const bangDs = () => { lamMoi(); return bangHoi; };

module.exports = { ds, hang, dsKhoa, bangDs };
