// Phong Lăng Độ — đi thuyền sang bờ Bắc (anh 27/10: "bản đồ full như client, chia 2 bờ chỉ sang được bằng thuyền pld, quái 2 bờ cấp giống
// nhau, đánh quái bờ kia thêm 20 % kinh nghiệm; vé như client + bán ở KTC"). Luật theo kịch bản máy chủ 8.1 Vinh (ổ ảo, chỉ đọc):
//   - missions\fengling_ferry\fld_head.lua: lên thuyền phải có môn phái; vé = 1 Lệnh bài Phong Lăng Độ (4,489) hoặc ĐÚNG 200 cuốn Mật đồ thần bí
//     (6,1,196) đặt vào khung Giao vật phẩm; mỗi thuyền tối đa 100 người; trên thuyền không dùng Thổ Địa Phù, thoát game thì về thành.
//   - fldmap_boat1.lua + mission.lua + fld_smalltimer.lua: mỗi giờ chẵn (giờ Việt Nam) mở báo danh 10 phút ở 3 bến (thuyền 337 / 338 / 339);
//     phút 10 thuyền chạy (30 Thủy tặc — bản mình nhiều đợt: cau-hinh dotThuyTac), phút 25 / 30 / 35 mỗi lần 1 Thủy tặc đầu lĩnh, phút 39 cập bờ Bắc (bản đồ 336, chỗ northMAP_POS của
//     bến). Báo "còn N phút rời bến" mỗi 3 phút, "còn N phút sẽ đến bờ Bắc" mỗi 5 phút (+ phút 38).
//   - bossdeath.lua: người hạ đầu lĩnh +150000 kinh nghiệm (thuongDauLinh). fld_death.lua: chết trên thuyền -> lên bờ Bắc luôn.
//   - 中原北区\风陵渡\npc\south_boatman_head.lua (Thuyền phu bờ Nam: báo danh / đã chạy / chưa tới giờ), north_boatman_head.lua (bờ Bắc về
//     bờ Nam 200 lượng — mở lại Thổ Địa Phù).
// Bản mình: quái từng người tự sinh (như bãi luyện công — chung quái để giai đoạn sau), nên trên thuyền mỗi người đánh 30 Thủy tặc + 3 đầu
// lĩnh của mình; máy chủ chỉ nhận ≤ thuyTac con thường + số đầu lĩnh đã xuất hiện, trong lúc thuyền chạy. Bờ Bắc (bãi 3360) chỉ vào được khi
// máy chủ ghi đã cập bờ; kinh nghiệm × bacKinhNghiem (do.js motCon). Số trong cau-hinh.json phongLangDo; tọa độ assets/data/phong-lang-do.json
// (cong-cu/dung-phong-lang-do.mjs).
// h.pld (máy chủ giữ): trên thuyền { chuyen (lúc mở báo danh, ms), ben 1–3, giet, dl (đầu lĩnh đã hạ), luc } · bờ Bắc { bac: 1, ben, luc }
"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do.js");
const GV = require("./gio-vn.js"); // ngày trong tuần của lịch (GM chỉnh ở F10 — lich-hd.js)
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến mỗi chuyến cập bờ Bắc — nạp lúc dùng

const N = DO.NOI, loi = N.loi;
const PL = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/data/phong-lang-do.json"), "utf8")); } catch { return null; } })();
const CF = { gio: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22], baoDanh: 10, dauLinh: [25, 30, 35], capBo: 39, toiDa: 100, thuyTac: 30, dotThuyTac: [10], songToiDa: 45,
  bacKinhNghiem: 1.2, thuongDauLinh: 150000, veNamGia: 200, lenhBai: "qk:489", matDo: "ms:196", matDoCan: 200, ...(N.CFG.phongLangDo || {}) };
const NAM = PL ? PL.nam : 336, BAC = PL ? PL.bac : 3360, THUYEN = PL ? PL.thuyenBai : [337, 338, 339];
const TEN = ["Thuyền phu Giáp", "Thuyền phu Ất", "Thuyền phu Bính"];
const H = 3600e3, VN = 7 * H;
// CHỈ ĐỂ THỬ: VL_PLD_LECH = số phút dời đồng hồ của lịch thuyền (máy chủ thử chạy tới giờ báo danh / giờ cập bờ không cần chờ giờ chẵn)
const LECH = (+process.env.VL_PLD_LECH || 0) * 60000, bayGio = () => Date.now() + LECH;

// ---------- lịch ----------
// chuyến gần nhất: giờ chẵn (giờ Việt Nam) trong CF.gio đã qua -> { chuyen (ms), t (phút từ lúc mở báo danh) }
function lich(now = bayGio()) {
  const v = now + VN, ngay = v - (v % (24 * H)), gioNay = Math.floor((v - ngay) / H);
  const g = [...CF.gio].reverse().find((x) => x <= gioNay);
  const chuyen = g != null ? ngay + g * H - VN : ngay - 24 * H + Math.max(...CF.gio) * H - VN;
  // GM tạm dừng (CF.bat false) / chuyến rơi vào ngày tắt (CF.thu): coi như chuyến đã qua lâu — không báo danh, thuyền không chạy (người đang trên
  // thuyền giữ chuyến riêng h.pld.chuyen nên đi nốt)
  if (CF.bat === false || !GV.thuOk(CF, chuyen)) return { chuyen: now - 24 * H, t: 24 * 60, nghi: true };
  return { chuyen, t: (now - chuyen) / 60000 };
}
const daRa = (t) => CF.dauLinh.filter((m) => t >= m).length; // số đầu lĩnh đã xuất hiện
const dotRa = (t) => CF.dotThuyTac.filter((m) => t >= m).length; // số đợt Thủy tặc đã lên thuyền (anh 27/10: nhiều đợt — client 1 đợt)
const trongThuyen = new Map(); // "chuyến|bến" -> Set(khóa nhân vật) — đếm 100 người / thuyền (bộ nhớ)
const soNguoi = (c, ben) => (trongThuyen.get(c + "|" + ben) || new Set()).size;
const bai = (z) => N.ZONES.get(z | 0) || null;
const diemThuyen = () => (PL && PL.thuyen.length ? PL.thuyen[Math.floor(Math.random() * PL.thuyen.length)] : null);

// ---------- dùng ở do.js ----------
// giết quái: bờ Bắc chỉ khi đã cập bờ; thuyền: đúng bến, thuyền đang chạy, ≤ thuyTac × số đợt đã ra con thường, đầu lĩnh ≤ số đã xuất hiện
function nhanGiet(h, Z, boss) {
  if (!Z) return true;
  const P = h.pld;
  if (Z.bo === "bac") return !!(P && P.bac);
  if (Z.kind !== "thuyền") return true;
  if (!P || !P.chuyen || P.ben !== Z.ben) return false;
  const t = (bayGio() - P.chuyen) / 60000;
  if (t < CF.baoDanh || t > CF.capBo + 1) return false;
  if (boss) { if ((P.dl | 0) >= daRa(t)) return false; P.dl = (P.dl | 0) + 1; return true; }
  if ((P.giet | 0) >= CF.thuyTac * dotRa(t)) return false;
  P.giet = (P.giet | 0) + 1; return true;
}
const heSoKn = (Z) => (Z && Z.bo === "bac" ? CF.bacKinhNghiem : 1);
const camPhu = (h) => !!(h.pld && (h.pld.bac || h.pld.chuyen)); // DisabledUseTownP: trên thuyền + bờ Bắc
// nhịp (s.zone = bãi đang đứng): rời bờ Bắc / thuyền bằng đường khác (trọng thương về thành…) -> bỏ trạng thái. Chờ 20 giây sau lúc đặt
// (trình duyệt còn đang chuyển bản đồ). Trả true nếu đổi
function nhip(h, z) {
  const P = h.pld; if (!P || z == null || Date.now() - (P.luc || 0) < 20000) return false;
  const Z = bai(z), dung = P.bac ? z === BAC : !!Z && Z.kind === "thuyền" && Z.ben === P.ben;
  if (dung) return false;
  if (P.chuyen) for (const [k, s] of trongThuyen) if (k.startsWith(P.chuyen + "|")) s.delete(h.name);
  delete h.pld; return true;
}

// ---------- hội thoại ----------
const say = (text, opts) => ({ say: { text, opts } }); // opts: [[nhãn, việc, bến?]]
const Y = (t) => `<color=yellow>${t}<color>`;
// thông tin lịch cho trình duyệt (đếm giờ trên thuyền): lúc mở báo danh + giờ máy chủ
// chuyến của người đang trên thuyền = h.pld.chuyen (công cụ thử cho chuyến riêng — bình thường bằng chuyến chung)
const lichTin = (h) => { const L = lich(), c = h && h.pld && h.pld.chuyen ? h.pld.chuyen : L.chuyen; return { chuyen: c, t: (bayGio() - c) / 60000, gio: bayGio(), baoDanh: CF.baoDanh, dauLinh: CF.dauLinh, capBo: CF.capBo, thuyTac: CF.thuyTac, dotThuyTac: CF.dotThuyTac, songToiDa: CF.songToiDa }; };

function nam(h, ben) { // south_boatman_main
  const ten = TEN[ben - 1], { t, nghi } = lich();
  if (nghi) return say(`${ten}: Hôm nay bến thuyền tạm nghỉ, đại hiệp hãy xem Hướng dẫn hoạt động để biết ngày thuyền chạy.`, []);
  if (t < CF.baoDanh) {
    const con = CF.baoDanh - Math.floor(t);
    return say(`${ten}: Lên thuyền thích thật đó! Còn ${con} là thuyền bắt đầu chạy rồi.`, [["Lên thuyền", "len", ben], ["Lát nữa sẽ quay lại", null]]);
  }
  if (t < CF.capBo) return say(`${ten}: Thật không may, thuyền đã xuất phát rồi, ngồi đợi chuyến sau vậy nhé.`, []);
  return say(`${ten}: Thời gian đợt thuyền này vẫn chưa đến, hãy đợi thêm tí nữa hoặc đi bến khác thử xem.`, []);
}
const day = (ben) => say(ben === 1 ? "Ngươi đến trễ rồi! Thuyền đã đầy rồi, hãy chờ chuyến sau đi!" : "Ngươi đã đến trễ! Thuyền đã đầy rồi, hãy chờ chuyến sau đi!", []);
function len(h, ben) { // fld_wanttakeboat
  if (h.fac == null) return { talk: ["Đại hiệp chưa gia nhập môn phái không thể lên thuyền"] };
  const { chuyen } = lich();
  if (soNguoi(chuyen, ben) >= CF.toiDa) return day(ben);
  return say(` Muốn đón thuyền đến bờ Bắc Phong Lăng Độ phải có Phong Lăng Độ lệnh bài hoặc ngươi đưa ta ${"<color=red>" + CF.matDoCan + "<color>"} cuốn Mật đồ thần bí, ta sẽ cho ngươi lên thuyền!`,
    [["Ta có lệnh bài Phong Lăng Độ", "lenhBai", ben], [`Ta đã thu thập đủ ${CF.matDoCan} cuốn Mật đồ thần bí`, "matDo", ben], ["Để ta suy nghĩ lại!", null]]);
}
// fld_TakeBoat: còn giờ báo danh, còn chỗ -> ghi lên thuyền; trả null nếu không lên được (người gọi báo câu client)
function lenThuyen(h, ben) {
  const { chuyen, t } = lich(), con = CF.baoDanh - Math.floor(t);
  if (con <= 0 || t < 0) return null;
  if (soNguoi(chuyen, ben) >= CF.toiDa) return day(ben);
  const k = chuyen + "|" + ben; if (!trongThuyen.has(k)) trongThuyen.set(k, new Set());
  for (const kk of [...trongThuyen.keys()]) if (+kk.split("|")[0] < chuyen) trongThuyen.delete(kk); // chuyến cũ
  trongThuyen.get(k).add(h.name);
  h.pld = { chuyen, ben, giet: 0, dl: 0, luc: Date.now() };
  return { tin: [`còn ${con} phút thuyền rời bến, đến bờ Bắc Phong Lăng Độ`], di: { z: THUYEN[ben - 1], at: diemThuyen() }, lich: lichTin(h) };
}
const thuLai = (viec, ben) => [["à! Thì ra đặt nhầm để ta thử lại.", viec, ben], ["Để ta kiểm tra xem sao", null]];
const tre = () => say("Thời gian không đợi ai cả! Thuyền đã đi rồi, lần sau ngươi hãy quay lại!", []);
function lenhBai(h, ben, u) { // use_lingpai + exchange_lingpai
  const tenVe = (N.BY.get(CF.lenhBai) || {}).n || "Lệnh bài Phong Lăng Độ";
  if (!Array.isArray(u)) return { giao: { tieuDe: `Giao diện giao phí ${tenVe}`, loi: `Dùng 1 cái ${tenVe} đặt vào ô trống phía dưới. Nếu ngươi lấy những thứ rác rưởi khác đặt vào, ta sẽ không thèm nhận`, viec: "lenhBai", ben } };
  const ds = u.map((x) => h.bag.find((o) => o.u === (x | 0))).filter(Boolean);
  if (!ds.length) return say("Hừ! Không có lệnh bài mà muốn ngồi thuyền?", []);
  if (ds.length > 1) return say("Không phải ta bảo ngươi đừng đặt lung tung hay sao?", []);
  const it = ds[0];
  if ((it.n || 1) > 1) return say("Thuyền Phu Bờ Nam:  Ta chỉ cần một cái Lệnh Bài, những thứ khác ta không cần", []); // chồng > 1 (kiểm trước loại món như client)
  if (it.k !== CF.lenhBai) return say("Thuyền Phu Bờ Nam:  Ta chỉ cần một cái Lệnh Bài, những thứ khác ta không cần", thuLai("lenhBai", ben));
  const r = lenThuyen(h, ben); if (!r) return tre(); if (r.say) return r;
  h.bag.splice(h.bag.indexOf(it), 1);
  return r;
}
function matDo(h, ben, u) { // use_juanzhou + exchange_juanzhou
  if (!Array.isArray(u)) return { giao: { tieuDe: "Giao Mật đồ thần bí ", loi: `Đặt ${CF.matDoCan} cuốn Mật đồ thần bí vào ô phía dưới, bạn phải chú ý, nếu Mật đồ thần bí trong ô ít hơn hoặc nhiều hơn ${CF.matDoCan} cuốn ta sẽ không nhận.`, viec: "matDo", ben } };
  const ds = [...new Set(u.map((x) => x | 0))].map((x) => h.bag.find((o) => o.u === x)).filter(Boolean);
  if (ds.some((o) => o.k !== CF.matDo)) return say("Mật đồ thần bí hình như không đúng! Hãy kiểm tra lại xem.", thuLai("matDo", ben));
  const n = ds.reduce((a, o) => a + (o.n || 1), 0);
  if (n > CF.matDoCan) return say(`Ta chỉ cần ${CF.matDoCan} cuốn Mật đồ thần bí, còn lại ngươi đem về đi!`, thuLai("matDo", ben));
  if (n < CF.matDoCan) return say("Mật đồ thần bí chưa đủ! Hãy thử lại xem!", thuLai("matDo", ben));
  const r = lenThuyen(h, ben); if (!r) return tre(); if (r.say) return r;
  for (const o of ds) h.bag.splice(h.bag.indexOf(o), 1);
  return r;
}
// thuyền tới giờ cập bờ (Landing) / chết trên thuyền (fld_death) -> bờ Bắc, chỗ cập bờ của bến. tk / o (api.js): cống hiến bang hội đợt 2 (chuyến thử của công cụ
// — P.thu — và chết trên thuyền không tính)
function capBo(h, chet, tk, o) {
  const P = h.pld;
  if (!P || !P.chuyen) return P && P.bac ? { di: { z: BAC } } : say("Ngươi không ở trên thuyền.", []);
  if (!chet && (bayGio() - P.chuyen) / 60000 < CF.capBo) return { lich: lichTin(h) };
  const ben = P.ben, s = trongThuyen.get(P.chuyen + "|" + ben); if (s) s.delete(h.name);
  h.pld = { bac: 1, ben, luc: Date.now() };
  if (!chet && !P.thu && tk) try { BHO().cong(tk, o, h.name, "pld"); } catch {} // bang hội đợt 2: 1 chuyến cập bờ Bắc (≤ 4 / ngày)
  // anh 18/11 — nguồn sự kiện (nguon-su-kien.js thuyen): đi thuyền cập bờ Bắc (không tính chết trên thuyền / chuyến thử) -> món, tối đa pldThuyen.ngay lần / ngày; túi đầy: hàng chờ quà
  const tinNsk = [];
  if (!chet && !P.thu) {
    try {
      const L = require("./nguon-su-kien.js").thuyen(h).filter(([k]) => N.BY.has(k)).map(([k, n]) => ({ k, n }));
      if (L.length) {
        const chu = L.map((x) => `${x.n} ${String(DO.tenMon({ k: x.k })).trim()}`).join(", ");
        try { DO.taoQua(h, { mon: L }); tinNsk.push(`Qua được bờ kia: nhận ${chu}.`); }
        catch { h.quaCho = [...(Array.isArray(h.quaCho) ? h.quaCho : []), { mon: L, luc: Date.now() }]; tinNsk.push(`Qua được bờ kia: nhận ${chu} — hành trang không đủ chỗ, dọn túi là tự nhận.`); }
      }
    } catch (e) { console.error("Nguồn sự kiện — thuyền:", e && e.message); }
  }
  return { tin: [chet ? "Bạn không may tử vong trong lúc đi thuyền." : "đã đến bờ Bắc Phong Lăng Độ.", ...tinNsk], di: { z: BAC, at: PL ? PL.doBo[ben - 1] : null, ...(chet ? { hoiSinh: 1 } : {}) } };
}
function bac(h, ben) { // north_boatman_main
  return say(`${TEN[ben - 1]}: Ngươi muốn ngồi thuyền đến bờ nam Phong Lăng Độ? Đưa ta ${CF.veNamGia} lạng bạc là được.`, [["Được thôi! Đi nào!", "veNam", ben], ["Tạm thời chưa đi!", null]]);
}
function veNam(h, ben) { // tosouth
  if ((h.gold || 0) < CF.veNamGia) return { talk: [`${TEN[ben - 1]}: Không có tiền sao ngồi thuyền được nhỉ?`] };
  h.gold -= CF.veNamGia; delete h.pld;
  return { di: { z: NAM, at: PL ? PL.veNam[ben - 1] : null } };
}

// Phong Lăng Truyền Tống Lệnh (anh 16/11 — Báo Đáp Ân Sư: ms:1448 đổi tên, "Sử dụng sẽ trực tiếp được đưa đến bờ Bắc Phong Lăng Độ"; do.js dungVat pldBac): đi thẳng sang
// bờ Bắc như công cụ thử "bac" — có môn phái (như lên thuyền), đang ở thành / thôn hoặc bờ Nam (z = bãi đang đứng; không trên thuyền / bờ Bắc), bến không nghỉ (lịch).
// Đặt h.pld.bac (không có thì nhanGiet bờ Bắc không nhận, nhip bỏ trạng thái); bến cập bờ ngẫu nhiên; không cộng cống hiến bang (chỉ chuyến thuyền thật).
// Không đi được thì lỗi (do.js chưa trừ món) -> { tin, di: { z: BAC, at } }
function truyenTong(h, z) {
  if (h.fac == null) loi("Đại hiệp chưa gia nhập môn phái không thể đến bờ Bắc Phong Lăng Độ");
  if (h.pld && h.pld.chuyen) loi("Đại hiệp đang ở trên thuyền Phong Lăng Độ");
  if (h.pld && h.pld.bac) loi("Đại hiệp đang ở bờ Bắc Phong Lăng Độ rồi");
  const Z = bai(z);
  if (!Z || !(N.THANH.has(Z.kind) || Z.id === NAM)) loi("Chỉ sử dụng được ở thành thị, thôn trấn hoặc bờ Nam Phong Lăng Độ");
  if (lich().nghi) loi("Hôm nay bến Phong Lăng Độ tạm nghỉ, không thể truyền tống sang bờ Bắc");
  const ben = 1 + Math.floor(Math.random() * 3);
  h.pld = { bac: 1, ben, luc: Date.now() };
  return { tin: ["đã đến bờ Bắc Phong Lăng Độ."], di: { z: BAC, at: PL ? PL.doBo[ben - 1] : null } };
}

// b.viec: "mo" (+ b.bo "nam" | "bac", b.ben) | "len" | "lenhBai" / "matDo" (+ b.u) | "cap" | "chet" | "veNam" | "lich". tk / o: tài khoản + ô (cống hiến bang hội khi cập bờ)
function lam(h, b, tk, o) {
  const ben = Math.min(3, Math.max(1, b.ben | 0));
  switch (b.viec) {
    case "mo": return b.bo === "bac" ? bac(h, ben) : nam(h, ben);
    case "len": return len(h, ben);
    case "lenhBai": return lenhBai(h, ben, b.u);
    case "matDo": return matDo(h, ben, b.u);
    case "cap": return capBo(h, false, tk, o);
    case "chet": return capBo(h, true);
    case "veNam": return veNam(h, ben);
    case "lich": return { lich: lichTin(h) };
    default: loi("Việc không rõ");
  }
}
// trạng thái gửi kèm nhân vật (hero.pld của trình duyệt — cùng dạng máy chủ giữ): trên thuyền { chuyen, ben, giet, dl } | bờ Bắc { bac, ben } | null
const tomTat = (h) => h.pld || null;

// ---------- công cụ thử (anh 27/10 "thêm cài đặt phong lăng độ vào dev tool để test: mở nhanh, ra quái…" — tài khoản quản trị) ----------
// b.viec: "xem" | "len" (b.ben, b.phut: lên thuyền ngay, chuyến RIÊNG của nhân vật đang ở phút b.phut — không cần vé / giờ chẵn) | "tua" (b.phut:
// tua chuyến đang đi tới phút đó — đầu lĩnh / cập bờ theo đó) | "bac" (b.ben: sang bờ Bắc ngay) | "nam" (về bờ Nam ngay) | "ve" (+1 Lệnh bài,
// +200 Mật đồ thần bí vào túi)
function dev(h, b) {
  const ben = Math.min(3, Math.max(1, b.ben | 0)), phut = Math.max(0, Math.min(CF.capBo + 1, +b.phut || 0));
  let r = {};
  switch (b.viec) {
    case "xem": break;
    case "len":
      h.pld = { chuyen: bayGio() - phut * 60000, ben, giet: 0, dl: 0, luc: Date.now(), thu: 1 };
      r = { tin: [`Phong Lăng Độ (thử): lên thuyền bến ${ben} ở phút ${phut}`], di: { z: THUYEN[ben - 1], at: diemThuyen() } }; break;
    case "tua":
      if (!h.pld || !h.pld.chuyen) { r = { tin: ["Phong Lăng Độ (thử): đang không ở trên thuyền"] }; break; }
      h.pld.chuyen = bayGio() - phut * 60000; r = { tin: [`Phong Lăng Độ (thử): tua chuyến tới phút ${phut}`] }; break;
    case "bac": h.pld = { bac: 1, ben, luc: Date.now() }; r = { di: { z: BAC, at: PL ? PL.doBo[ben - 1] : null } }; break;
    case "nam": delete h.pld; r = { di: { z: NAM, at: PL ? PL.vao : null } }; break;
    case "ve": {
      const lb = N.BY.get(CF.lenhBai), md = N.BY.get(CF.matDo);
      if (lb) N.themChong(h, lb, 1); if (md) N.themChong(h, md, CF.matDoCan);
      r = { tin: [`Phong Lăng Độ (thử): +1 ${lb ? lb.n : CF.lenhBai}, +${CF.matDoCan} ${md ? md.n : CF.matDo}`] }; break;
    }
    default: loi("Việc không rõ");
  }
  const L = lich();
  return { ...r, lich: lichTin(h), dev: { chung: { gio: new Date(L.chuyen + VN).toISOString().slice(11, 16), t: L.t }, pld: h.pld || null } };
}

module.exports = { lam, dev, nhanGiet, heSoKn, camPhu, nhip, tomTat, lich, truyenTong, CF, BAC, NAM, THUYEN }; // truyenTong: anh 16/11 — Báo Đáp Ân Sư
