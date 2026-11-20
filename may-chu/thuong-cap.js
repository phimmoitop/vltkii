// Thưởng thăng cấp (anh 02/11: "thêm thưởng cấp 10 - 20 - 30 - 40 - 50 - 60 - 80 - 100 - 120 - 150, chủ yếu mỗi 10 cấp nhận thưởng, em cho anh
// phác đồ" — anh duyệt bảng em đề xuất + "thêm huyền thiên chùy số lượng tăng dần từ mốc 60 trở đi"). Nhận thưởng → Thưởng thăng cấp; khung
// Say + câu theo kiểu Online nhận thưởng (may-chu/online.js).
//   - Mốc: cau-hinh.json thuongCap.moc = [{ cap, tien?, xu?, do?: [[mã, số]], chon?: [[mã, số], …] (bốc ngẫu nhiên 1 trong danh sách) }].
//     Mỗi mốc nhận 1 lần mỗi nhân vật; đủ cấp là nhận (nhân vật đã qua mốc nhận bù). Nhận = nhận mọi mốc đủ mà chưa nhận, theo thứ tự; túi
//     không đủ chỗ thì dừng ở mốc đó (để lần sau). Thuốc chỉ phát tới đủ số mang tối đa (luật mang 60 bình).
// h.thuongCap = [cấp của các mốc đã nhận]
// Anh 05/11: "các item nhận thưởng từ level và online thì đều sẽ ở trong trạng thái khóa bảo hiểm vĩnh viễn, không giao dịch được" — mọi món của
// mốc nhận với it.kbh = KBH_VV (may-chu/do.js taoQua kbh); tiền / Xu không phải món nên không khóa
"use strict";
const DO = require("./do.js");

// cấu hình đọc LÚC DÙNG (anh 14/11: đổi quà mốc 150 ở F10 → Cấu hình mà nhận vẫn quà cũ — trước chép MOC lúc khởi động): F10 lưu là có hiệu lực ngay,
// không cần khởi động lại (cau-hinh-qt.js ganVao giữ nguyên đối tượng, thay nội dung). Mốc ~10 dòng — lọc + xếp mỗi lần gọi rẻ
const N = DO.NOI, cf = () => N.CFG.thuongCap || {};
const bat = () => cf().bat !== false;
const mocs = () => (cf().moc || []).filter((m) => m && m.cap > 0).sort((a, b) => a.cap - b.cap);
const Y = (t) => `<color=yellow>${t}<color>`;
const KHOA_CAU = "<color=green>Vật phẩm thưởng được khóa bảo hiểm vĩnh viễn.<color>"; // màu khóa của client (G_ITEM_BIND_STATE2); vừa 1 dòng khung Say (~50 chữ)
const tenMon = ([k, n]) => { const x = N.BY.get(k); return x ? `${(n | 0) > 1 ? n + " " : ""}${x.n.replace(/\s+/g, " ").trim()}` : ""; };
const tenMoc = (m) => [...(m.do || []).map(tenMon), ...(m.chon && m.chon.length ? [`1 trong: ${m.chon.map(tenMon).join(" / ")}`] : []),
  m.tien > 0 ? N.tien(m.tien) : "", m.xu > 0 ? `${m.xu} Xu` : ""].filter(Boolean).join(" + ");
const daNhan = (h) => (Array.isArray(h.thuongCap) ? h.thuongCap : []);
const trangThai = (h, m) => (daNhan(h).includes(m.cap) ? "đã nhận" : (h.lvl || 1) >= m.cap ? "<color=green>có thể nhận<color>" : "chưa đủ cấp");

const say = (text, opts) => ({ say: { text, opts } });
function khung(h) {
  const MOC = mocs();
  const du = MOC.filter((m) => (h.lvl || 1) >= m.cap && !daNhan(h).includes(m.cap)), ke = MOC.find((m) => (h.lvl || 1) < m.cap);
  const dong = [`Mỗi mốc cấp nhận 1 lần. Đại hiệp đang ở cấp ${Y(h.lvl || 1)}.`, KHOA_CAU,
    du.length ? `Có thể nhận: ${Y(du.map((m) => "cấp " + m.cap).join(", "))}.` : "Chưa có mốc nào để nhận.",
    ...(ke ? [`Mốc kế: cấp ${Y(ke.cap)} — ${tenMoc(ke)}.`] : ["Đại hiệp đã qua mọi mốc thưởng thăng cấp."])];
  return say(dong.join("<enter>"), [...(du.length ? [["Nhận phần thưởng thăng cấp", "nhan"]] : []), ["Xem phần thưởng các mốc", "xem"], ["Kết thúc", null]]);
}
// b.viec: "mo" | "xem" (các trang 2 mốc / trang) | "nhan"
function lam(h, b) {
  const MOC = mocs();
  if (!bat() || !MOC.length) N.loi("Hiện chưa có thưởng thăng cấp");
  if (b.viec === "xem") {
    const trang = [];
    for (let i = 0; i < MOC.length; i += 2) trang.push(MOC.slice(i, i + 2).map((m) => `Cấp ${Y(m.cap)} (${trangThai(h, m)}): ${tenMoc(m)}`).join("<enter>"));
    return { talk: trang };
  }
  if (b.viec !== "nhan") return khung(h);
  const du = MOC.filter((m) => (h.lvl || 1) >= m.cap && !daNhan(h).includes(m.cap));
  if (!du.length) return say("Đại hiệp chưa có mốc thưởng thăng cấp nào để nhận!", [["Xem phần thưởng các mốc", "xem"], ["Kết thúc", null]]);
  const tin = [];
  for (const m of du) {
    let conThuoc = Math.max(0, N.mang() - N.soThuoc(h)); // thuốc: tới đủ số mang tối đa (cộng dồn các loại thuốc của mốc)
    const mon = [...(m.do || []), ...(m.chon && m.chon.length ? [m.chon[Math.floor(Math.random() * m.chon.length)]] : [])].map(([k, n]) => {
      const x = N.BY.get(k), so = Math.min(n | 0 || 1, x && x.thuoc ? conThuoc : Infinity);
      if (x && x.thuoc) conThuoc -= so;
      return { k, n: so };
    }).filter((o) => o.n > 0);
    let ds;
    try { ds = DO.taoQua(h, { mon, tien: m.tien, xu: m.xu, kbh: N.KBH_VV }); } // túi không đủ chỗ -> lỗi, túi giữ nguyên; món khóa bảo hiểm vĩnh viễn (anh 05/11)
    catch { tin.push(`Hành trang không đủ chỗ nhận thưởng cấp ${m.cap} — dọn túi rồi nhận lại.`); break; }
    h.thuongCap = [...daNhan(h), m.cap];
    tin.push(`Thưởng thăng cấp ${m.cap}: nhận được ${ds.join(", ")}`);
  }
  return { tin, ...khung(h) };
}
// công cụ thử (tài khoản quản trị — api.js /api/quan-tri/hoat-dong hd "cap"): b.viec "datLai" (xóa các mốc đã nhận)
function dev(h, b) {
  if (b.viec === "datLai") delete h.thuongCap;
  return { tin: [`Thưởng thăng cấp (thử): đã nhận ${daNhan(h).join(", ") || "chưa mốc nào"}`] };
}

// còn mốc đủ cấp mà chưa nhận (anh 03/11 — số đỏ trên nút Nhận thưởng: api.js nhip ntc)
const coNhan = (h) => bat() && mocs().some((m) => (h.lvl || 1) >= m.cap && !daNhan(h).includes(m.cap));

module.exports = { lam, dev, coNhan, get MOC() { return mocs(); } }; // MOC: tra-cuu.js nguồn món (đọc lúc dùng)
