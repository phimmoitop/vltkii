// Đảo Tẩy Tủy (anh 28/10: "3 viên thủy tinh tẩy kĩ năng, 6 viên thbt tẩy tiềm năng, lần đầu mỗi nhân vật miễn phí — làm cái map đảo tẩy tủy,
// npc này kia, tham khảo client"). Luật theo kịch bản client (chỉ đọc):
//   - script\missions\clearskill\head.lua + clearhole.lua: Xa phu -> "Đi đảo Tẩy Tủy" (station.lua GotoClearSkillMap): cấp ≥ 50 (CSP_NEEDLEVEL),
//     đã vào phái; miễn phí CSP_MAXClearTime = 1 lần / nhân vật (tẩy cả kỹ năng lẫn tiềm năng); hết miễn phí thì 3 viên Thủy Tinh (Lam / Tử / Lục
//     — 238/239/240) = chỉ tẩy kỹ năng, 6 Tinh Hồng Bảo Thạch (353) = chỉ tẩy tiềm năng, cả hai = tẩy cả hai. Vào đảo bản đồ 242 (梦境) ở
//     (1615, 3200); trên đảo không dùng Thổ Địa Phù. Câu chữ = câu client.
//   - script\global\特殊用地\梦境\npc\路人_叛僧.lua (Thích Minh): chưa rời đảo thì tẩy bao nhiêu lần cũng được (đúng loại đã trả); tẩy kỹ năng =
//     RollbackSkill trả hết điểm kỹ năng; tẩy tiềm năng = Sức mạnh / Thân pháp / Ngoại công / Nội công về số gốc theo hệ; "Về việc Tẩy Tủy"; rời
//     đảo (hỏi 2 lần) -> về thành đã đi.
// Bản mình: đi từ Xa phu Ba Lăng (client chỉ Xa phu 7 thành lớn), về lại Ba Lăng cạnh Xa phu. Lần miễn phí tính lúc vào đảo (client tính lúc
// rời — bản mình không cho thoát game giữa chừng để vào miễn phí lần nữa). Thủy Tinh: client bắt mang đúng 3 viên loại nào cũng được (mang
// nhiều hơn thì từ chối vì "không tiện quyết định giùm") — anh chốt 28/10: 1 bộ Lam + Tử + Lục, mỗi loại 1 viên (mang dư không sao). Đã trả /
// đã dùng lượt mà chưa tới đảo (trình duyệt lỗi) thì gặp lại Xa phu là được đưa đi tiếp. Không làm Bạch Ngọc / Tử Ngọc (game chưa có) và sơn
// động đấu thử (chưa có PK).
// Tẩy kỹ năng giữ cấp sách võ công / Đại Thành đã học (skMin) — điểm tự cộng trả lại hết. Số trong cau-hinh.json tayTuy.
// h.tayTuy (máy chủ giữ): { mienPhi (số lần miễn phí đã dùng), lan (số lần vào bằng đá quý), dang: null | { loai: 1 kỹ năng / 2 tiềm năng /
// 3 cả hai, luc } (đang ở trên đảo) }
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");

const N = DO.NOI, loi = N.loi;
const TT = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/tay-tuy.json"), "utf8")); } catch { return null; } })();
const CF = { capToiThieu: 50, mienPhi: 1, bt: 6, ...(N.CFG.tayTuy || {}) };
const THUY_TINH = ["qk:238", "qk:239", "qk:240"], BT = "qk:353";
const KY_NANG = 1, TIEM_NANG = 2, CA_HAI = 3;
const B = (t) => `<color=blue>${t}<color>`, R = (t) => `<color=red>${t}<color>`;
const say = (text, opts) => ({ say: { text, opts } }); // opts: [[nhãn, việc]]
const dong = (t) => [t, null];

const tt = (h) => (h.tayTuy = h.tayTuy || { mienPhi: 0, lan: 0, dang: null });
const conMienPhi = (h) => (tt(h).mienPhi | 0) < CF.mienPhi;
const dem = (h, k) => (h.bag || []).filter((o) => o.k === k).reduce((t, o) => t + (o.n || 1), 0);
// bớt n món k trong hành trang (chồng nào trước bớt trước; chồng khóa bảo hiểm — thưởng thăng cấp, anh 05/11 — bớt trước, món giao dịch được giữ lại)
function bot(h, k, n) {
  for (const o of (h.bag || []).filter((x) => x.k === k).sort((a, b) => (b.kbh | 0) - (a.kbh | 0))) {
    if (n <= 0) break;
    const lay = Math.min(n, o.n || 1);
    o.n = (o.n || 1) - lay; n -= lay;
    if (o.n <= 0) h.bag.splice(h.bag.indexOf(o), 1);
  }
}
// tẩy kỹ năng = 1 bộ Thủy Tinh: Lam + Tử + Lục mỗi loại 1 viên (anh 28/10 "lam lục thủy"; client đếm tổng 3 viên loại nào cũng được)
const duBoTT = (h) => THUY_TINH.every((k) => dem(h, k) >= 1);
const diaDiem = () => (TT ? { z: TT.bai, at: TT.vao } : null);

// ---------- Xa phu: "Đi đảo Tẩy Tủy" (clearhole.lua CSP_EnterClearMap) ----------
function xaPhu(h) {
  if (!TT) return { talk: ["Xa phu: Đảo Tẩy Tủy chưa mở."] };
  if ((h.lvl || 1) < CF.capToiThieu) return { talk: [`Tráng sĩ chưa đạt cấp ${CF.capToiThieu}, chưa thể vào đảo Tẩy Tủy`] };
  if (h.fac == null) return { talk: ["Ngươi không có kỹ năng nào, vậy mà cũng muốn đi tẩy tủy ư? "] };
  // đã vào đảo (đã trả / đã dùng lượt miễn phí) mà còn gặp Xa phu Ba Lăng = chưa tới đảo (anh 28/10: bấm đi mà không di chuyển — trình duyệt
  // dùng bản đồ cũ) -> đưa đi lại, không tính thêm
  if (tt(h).dang) return { tin: ["Xa phu: Ngươi đã trả phí đi đảo Tẩy Tủy rồi, ta đưa ngươi đi tiếp."], di: diaDiem() };
  if (conMienPhi(h)) return say(`Cơ hội vào đảo tẩy Tủy miễn phí chỉ có ${CF.mienPhi} lần. Tráng sĩ đã suy nghĩ kỹ chưa?`, [["Đi đảo Tẩy Tủy", "vaoMienPhi"], dong("Để nghỉ thêm một chút ")]);
  return say(`Xa phu: Lần dùng miễn phí đã dùng hết, nhưng các hạ có thể sử dụng ${B("thủy tinh")} hoặc ${B("tinh hồng bảo thạch")} để có thể đi vào đảo tẩy tủy. Ngươi có đồng ý như vậy không?`, [
    ["Chỉ tẩy điểm kỹ năng [3 viên Thủy Tinh: Lam + Tử + Lục]", "vaoKyNang"],
    [`Chỉ tẩy điểm tiềm năng [${CF.bt} viên Tinh Hồng Bảo Thạch]`, "vaoTiemNang"],
    [`Tẩy cả điểm tiềm năng và kỹ năng [Lam + Tử + Lục Thủy Tinh + ${CF.bt} viên Tinh Hồng Bảo Thạch]`, "vaoCaHai"],
    dong("Để ra nghĩ lại"),
  ]);
}
function vao(h, loai, mienPhi) {
  const S = tt(h);
  if (!TT) loi("Đảo Tẩy Tủy chưa mở");
  if ((h.lvl || 1) < CF.capToiThieu || h.fac == null || S.dang) return xaPhu(h);
  if (mienPhi) {
    if (!conMienPhi(h)) return xaPhu(h);
    S.mienPhi = (S.mienPhi | 0) + 1;
  } else {
    const canTT = loai & KY_NANG, canBT = loai & TIEM_NANG ? CF.bt : 0;
    if (canBT && dem(h, BT) < canBT) return { talk: [`Ngươi không mang ${R(`${CF.bt} viên Tinh Hồng Bảo Thạch`)}. Đừng nóng ruột, tìm đủ rồi hãy quay lại. `] };
    if (canTT && !duBoTT(h)) return { talk: [`Ngươi không mang ${B("3 viên Thủy Tinh")} (Lam, Tử, Lục Thủy Tinh mỗi loại 1 viên). Đừng nóng ruột tìm đủ rồi hãy quay lại. `] };
    if (canTT) for (const k of THUY_TINH) bot(h, k, 1);
    if (canBT) bot(h, BT, canBT);
    S.lan = (S.lan | 0) + 1;
  }
  S.dang = { loai, luc: Date.now() };
  return { tin: ["Tiến vào đảo Tẩy tủy, bạn có thể có vô số lần tẩy điểm kỹ năng. "], di: diaDiem() };
}

// ---------- Thích Minh (梦境 路人_叛僧.lua) ----------
function mo(h) {
  const D = tt(h).dang, roi = ["Rời khỏi đảo Tẩy Tủy ", "roi"], hd = ["Về việc Tẩy Tủy ", "huongDan"], khong = dong("Không tẩy ");
  if (!D) return say("Thích Minh: Ngươi không có cơ hội tẩy tủy ở đây.", [hd, roi, dong("Đóng")]);
  if ((h.lvl || 1) < CF.capToiThieu) return { talk: [`Cấp của ngươi vẫn chưa đạt ${CF.capToiThieu}. Chưa thể rời khỏi đảo Tẩy Tủy. `] };
  if (D.loai === KY_NANG) return say(`Ngươi chỉ có thể tẩy ${B(" điểm kỹ năng")}. Có đồng ý tẩy không? `, [["Tẩy điểm kỹ năng ", "kyNang"], khong, hd, roi]);
  if (D.loai === TIEM_NANG) return say(`Ngươi chỉ có thể tẩy ${B(" điểm tiềm năng")}. Có đồng ý tẩy không? `, [["Tẩy điểm tiềm năng", "tiemNang"], khong, hd, roi]);
  return say("Ngươi có đồng ý tẩy tủy không? ", [["Tẩy điểm kỹ năng ", "kyNang"], ["Tẩy điểm tiềm năng", "tiemNang"], khong, hd, roi]);
}
const HUONG_DAN = [
  "Sau khi Tẩy Tủy, ngươi có thể đi ra ngoài để đánh với mộc nhân, sau đó rời khỏi đảo mới được xem là đã hoàn thành. ",
  "Chỉ cần ngươi không rời khỏi đảo, ta sẽ giúp ngươi tẩy tủy vừa ý!",
  "Ngoài kia có Cọc gỗ (3000 Sinh lực) ;  Bao cát (10000 Sinh lực) ; Mộc nhân (30000 Sinh lực) để cho ngươi thử nghiệm hiệu quả tẩy tủy!",
  "Cuối cùng, khi nào ngươi cảm thấy điểm kỹ năng đã đủ hãy đến tìm ta, ta sẽ đưa ngươi trở về chỗ cũ ",
];
const tongKn = (sk) => Object.values(sk || {}).reduce((t, v) => t + (v | 0), 0);
// tẩy kỹ năng: về cấp sách / Đại Thành (skMin), điểm tự cộng trả hết; chiêu luyện giữ nguyên
function tayKyNang(h) {
  const D = tt(h).dang;
  if (!D || !(D.loai & KY_NANG)) return mo(h);
  // chiêu luyện (sách 90 / 120 có cờ luyện — do.js laLuyen, anh 29/10) giữ cấp đã luyện: không dùng điểm nên không có gì để trả
  const cu = tongKn(h.skills), moi = Object.fromEntries([...Object.entries(h.skMin || {}).filter(([, v]) => (v | 0) > 0).map(([k, v]) => [k, v | 0]),
    ...Object.entries(h.skills || {}).filter(([id, v]) => DO.laLuyen(id) && (v | 0) > 0)]);
  h.skills = moi;
  const tra = Math.max(0, cu - tongKn(moi)), cau = `Tẩy Tủy thành công! ngươi đã có thể phân phối điểm ${tra} điểm kỹ năng có thể phân phối lại. `;
  return { tay: { skills: h.skills }, tin: [cau], talk: [cau] };
}
// tẩy tiềm năng: Sức mạnh / Thân pháp / Ngoại công / Nội công về số gốc theo hệ (điểm đã cộng trả hết)
function tayTiemNang(h) {
  const D = tt(h).dang;
  if (!D || !(D.loai & TIEM_NANG)) return mo(h);
  const a = h.attr || {}, tra = ["str", "dex", "vit", "eng"].reduce((t, k) => t + (a[k] | 0), 0);
  h.attr = { str: 0, dex: 0, vit: 0, eng: 0 };
  const cau = `Tẩy Tủy thành công! ngươi có ${tra} điểm tiềm năng có thể phân phối lại. `;
  return { tay: { attr: h.attr }, tin: [cau], talk: [cau] };
}
function roiDao(h) {
  tt(h).dang = null;
  return { tin: ["Đã rời khỏi đảo Tẩy Tủy."], di: TT ? { z: TT.ve.z, at: TT.ve.at } : null };
}

// b.viec: "xaPhu" | "vaoMienPhi" | "vaoKyNang" | "vaoTiemNang" | "vaoCaHai" | "mo" | "kyNang" / "kyNangOk" | "tiemNang" / "tiemNangOk" |
// "huongDan" | "roi" / "roi2" / "roiOk"
function lam(h, b) {
  switch (b.viec) {
    case "xaPhu": return xaPhu(h);
    case "vaoMienPhi": return vao(h, CA_HAI, true);
    case "vaoKyNang": return vao(h, KY_NANG, false);
    case "vaoTiemNang": return vao(h, TIEM_NANG, false);
    case "vaoCaHai": return vao(h, CA_HAI, false);
    case "mo": return mo(h);
    case "kyNang": return say("Ngươi đồng ý Tẩy điểm kỹ năng không? ", [["Tẩy điểm kỹ năng ", "kyNangOk"], dong("Không tẩy ")]);
    case "kyNangOk": return tayKyNang(h);
    case "tiemNang": return say("Ngươi đồng ý tẩy điểm tiềm năng không? ", [["Tẩy điểm tiềm năng", "tiemNangOk"], dong("Không tẩy ")]);
    case "tiemNangOk": return tayTiemNang(h);
    case "huongDan": return { talk: HUONG_DAN };
    case "roi": return say("ngươi cho rằng đã Tẩy Tủy xong rồi ư? Có muốn rời khỏi không? ", [["Muốn rời khỏi ", "roi2"], dong("Để ta suy nghĩ kỹ lại xem")]);
    case "roi2": return say("Rời khỏi đảo Tẩy Tủy, nếu muốn trở lại sẽ rất khó. ngươi vẫn kiên quyết rời khỏi chứ? ", [["ta thật sự muốn rời khỏi nơi ma quái này ", "roiOk"], dong("ta vẫn muốn ở lại ")]);
    case "roiOk": return roiDao(h);
    default: loi("Việc không hợp lệ");
  }
}
// gửi trình duyệt kèm nhân vật: còn miễn phí không, đang ở đảo (loại tẩy)
const tomTat = (h) => { const S = h.tayTuy || {}; return { mienPhi: Math.max(0, CF.mienPhi - (S.mienPhi | 0)), dang: S.dang ? S.dang.loai : 0 }; };
// công cụ thử (tài khoản quản trị): trả lần miễn phí / ra khỏi đảo
function dev(h, b) {
  const S = tt(h);
  if (b.viec === "mienPhi") S.mienPhi = 0;
  else if (b.viec === "boDao") S.dang = null;
  return { tayTuy: tomTat(h) };
}

module.exports = { lam, tomTat, dev, CF, TT };
