// Giữ phòng Vượt Ải / Viêm Đế qua khởi động lại máy chủ (anh 18/11: "update lên thì họ bị văng ra, mất lượt — làm cho họ lúc update vào lại thì vẫn tiếp tục,
// chỉ thoát ra bằng nút thoát như Tống Kim … làm đơn giản nhưng hiệu quả"). Trước: phòng tổ đội chỉ ở bộ nhớ — khởi động lại là mất, coi như thua.
//   - Mỗi 15 giây (chỉ ghi khi đổi) và lúc tắt (process "exit" — systemctl restart / bảo trì 08:00 / lên bản mới gửi SIGTERM -> nhat-ky.js process.exit) ghi các phòng
//     đang chạy (chưa kết thúc) vào du-lieu/phong-giu.json — mỗi tệp hoạt động gói phòng của mình (boc) thành dữ liệu thuần.
//   - Lúc nạp tệp hoạt động (vuot-ai.js / viem-de.js — ngay khi máy chủ chạy): dung(o, lech) dựng lại từng phòng: đám / đợt đang đánh ra lại quái từ đầu, giờ ải lùi
//     đúng bằng lúc máy chủ tắt (+ HOI_CHO giây chờ người vào lại), HOI_PHUT phút ân hạn không đưa ai ra vì vắng mặt (máy chủ khởi động lại / VPS khởi động lại).
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu.js");

const TEP = path.join(D.ROOT, "phong-giu.json");
const HOI_CHO = 20, HOI_PHUT = 5; // giây chờ trước khi ra lại quái; phút ân hạn vắng mặt sau khi dựng lại
const NGUON = new Map(); // tên hoạt động -> { PHONG, boc }
let CU = null, cuoi = "";
try { CU = JSON.parse(fs.readFileSync(TEP, "utf8")); } catch { CU = null; }

function luu() {
  try {
    const o = { luc: Date.now() };
    for (const [ten, { PHONG, boc }] of NGUON) o[ten] = [...PHONG.values()].map((P) => { try { return P.ket ? null : boc(P); } catch { return null; } }).filter(Boolean);
    const s = JSON.stringify(o), so = s.replace(/"luc":\d+/, "");
    if (so === cuoi) return;
    cuoi = so; fs.writeFileSync(TEP + ".tmp", s); fs.renameSync(TEP + ".tmp", TEP);
  } catch (e) { console.error("Giữ phòng — ghi:", e && e.message); }
}
setInterval(luu, 15000).unref();
process.on("exit", luu);

// ten: "va" | "vd"; PHONG: Map phòng của hoạt động; boc(P) -> dữ liệu thuần | null; dung(o, { t, lech, cho, hoi }) -> P (đã dựng, chưa đưa vào PHONG) | null.
// Trả số phòng đã dựng lại
function giu(ten, PHONG, boc, dung) {
  NGUON.set(ten, { PHONG, boc });
  const ds = CU && Array.isArray(CU[ten]) ? CU[ten] : [];
  if (!ds.length) return [];
  const t = Date.now(), lech = Math.max(0, t - (+CU.luc || t)), ra = [];
  for (const o of ds) {
    try { const P = dung(o, { t, lech, cho: HOI_CHO * 1000, hoi: t + HOI_PHUT * 60000 }); if (P) ra.push(P); } catch (e) { console.error(`Giữ phòng ${ten} — dựng lại:`, e && e.message); }
  }
  if (ra.length) console.log(`Giữ phòng ${ten}: dựng lại ${ra.length} phòng (máy chủ tắt ${Math.round(lech / 1000)} giây)`);
  return ra;
}

module.exports = { giu, luu, HOI_CHO, HOI_PHUT };
