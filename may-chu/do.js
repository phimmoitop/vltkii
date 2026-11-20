// Đồ + kinh nghiệm + ngân lượng do MÁY CHỦ quyết (bước 2–3 của THIET-KE-S1.md, anh chốt 25/10: gộp 2 bước, dòng mạnh theo cấp quái).
//   chuan(h)                 món cũ (chuỗi khóa / { k, n }) -> món { u, k, b, d, m }; tính lại kiểu dáng theo đồ mặc. Trả true nếu đổi.
//   gietQuai(h, ds, ctx)     trình duyệt báo quái đã giết [[bãi, mã quái, cấp, trùm 0|1, hệ, x, y], …] -> kinh nghiệm (× hệ số), lên
//                            cấp; tiền + món (cả đồ trắng) rơi XUỐNG ĐẤT ở (x, y) — anh chốt 25/10: bộ lọc tự bán không đụng tới đồ rơi,
//                            chỉ bán đồ trong túi (làm cùng phần tự động). ctx = { ten (tài khoản),
//                            admin, key ("tài khoản|ô" — vật trên đất của nhân vật) }. Món / tiền rơi kèm i = thứ tự con quái trong ds,
//                            g = mã vật trên đất
//   nhat(h, key, ds)         nhặt vật trên đất (mã g): tiền cộng vào, món vào túi (túi đầy thì để nguyên trên đất)
//   datBai(key, bãi)         vật còn nằm trên đất ở bãi đó (vào lại bãi thì trình duyệt vẽ lại)
//   datChung(bãi, dv)        món người chơi tự vứt ra — chung cả bãi (anh 30/10): bản mới { v, ds } khi khác bản dv trình duyệt đang có
//   doiDo(A, B)              giao dịch (may-chu/giao-dich.js): đổi món + tiền giữa 2 nhân vật, kiểm tra đủ điều kiện rồi mới đổi
//   chet(h)                  trọng thương: phạt như client (pkpunish.txt dòng PK 0)
//   lam(h, body, key)        mặc / tháo / bán / đặt mức tự bán / mua thuốc / vứt món trong túi ra đất / Trợ Thủ ở thành (bán + mua)
//   uong(h, ds)              trình duyệt báo thuốc đã uống [[u, số bình], …] -> trừ bình (hết thì bỏ ô)
//   hao(h, [danh, trung, di]) trình duyệt báo số lần ra đòn / bị đánh trúng mất máu / sang vùng bản đồ khác -> trừ độ bền đồ đang mặc theo
//                            tỉ lệ client (anh 26/10 "sửa đồ")
//   uyThacVe(h)              đầu mỗi nhịp: nhân vật vừa vắng mặt (không nhịp > uyThac.vangGiay) mà lúc đi đang tự đánh -> máy chủ cày
//                            thay khoảng vắng đó, trả bảng tổng kết (ủy thác — anh 27/10)
//   uyThacDo(h, key, s, n, ten)   cuối mỗi nhịp: đo tốc độ giết (n = số quái vừa nhận; lúc có tăng ích tổ đội không đo) 30 phút gần nhất ở bãi đang treo, nhớ lúc nhịp
//   thuUyThac(h, b)          công cụ thử (quản trị): ủy thác b.gio giờ ngay
//   ghiDev(h, nv)            công cụ thử của quản trị: nhận cấp / kinh nghiệm / tiền / túi / đồ mặc từ trình duyệt
// Món: u = mã món trong nhân vật (h.uN đếm), k = khóa kho đồ (items.json), s = ngũ hành của món (0–4, mọi trang bị — client in "Thuộc
// tính Ngũ hành"), d = [[khóa thuộc tính client, số], …] theo đúng vị trí dòng, m = cấp quái đã rơi ra món (giá bán). Số liệu:
// cau-hinh.json (đọc 1 lần lúc bật máy chủ). THEO CLIENT (anh muốn 25/10, kèm ảnh ô xem món game thật):
//   - cấp đồ 1–10 ("[cấp N]") = cột cấp của bảng đồ client (assets/data/do-goc.json cl); món rơi có cấp đồ theo cấp quái như bảng rơi
//     thường của client: ngẫu nhiên trong [⌊cấp quái / 20⌋, ⌊cấp quái / 10⌋] (tối thiểu 1, tối đa 10);
//   - dòng xanh = bảng client settings\item\004\magicattrib.txt (assets/data/dong-xanh.json): dòng 1, 3, 5 tiền tố, 2, 4, 6 hậu tố (đúng
//     ngũ hành của món), chỉ thuộc tính có trọng số > 0 trên loại món đó, theo trọng số client, không trùng loại;
//   - cấp dòng: mỗi dòng gieo riêng trong khoảng [1, cấp đồ + capDong.cong] (tối đa 10) — anh: "đồ cấp thấp không ra được option max,
//     đồ cấp 7 8 9 10 thì được" (TẠM công thức: luật gốc nằm trong chương trình máy chủ đã mã hóa);
//   - dòng 2, 4, 6 là DÒNG ẨN ("thuộc tính âm" — client G_ITEM_21 "Cần %s của %s và %s để kích thuộc tính âm"): chỉ có tác dụng khi được
//     kích (soKich: ngũ hành nhân vật + 2 ô trang bị liên kết sinh ra hệ của món). Yêu cầu mặc = yêu cầu của món nền.
// Thuốc (anh muốn 25/10): món { u, k: "potion:<dòng potion.txt>", n: số bình } — bảng assets/data/thuoc.json (cong-cu/dung-thuoc.js),
// mua ở Dược điếm (shops[39]); 1 ô xếp chồng tối đa thuoc.chongToiDa bình, mỗi lần mua tối đa thuoc.muaToiDa bình (cau-hinh.json).
// Uống: trình duyệt hồi sinh lực / nội lực (src/game/world.js) rồi báo kèm nhịp, máy chủ trừ bình.
// Độ bền (anh 26/10 "sửa đồ"): món có độ bền tối đa (thuộc tính cơ bản durability_v của bảng đồ client — áo, mũ, đai, bao tay, giày; vũ khí
// client 8.1 không có -> bảng doBen.vuKhi của cau-hinh.json; nhẫn, dây chuyền, ngọc bội, ngựa không có -> không bao giờ hao) giữ it.ben =
// độ bền còn lại (không có = đầy). Hao như
// engine (KItemList::Abrade + client settings\item\abraderate.ini): mỗi lần ra đòn vũ khí mất 1 điểm với xác suất 1/256, mỗi lần bị đánh
// trúng mất máu mũ / áo / đai / bao tay mỗi món 1/320, mỗi lần sang vùng bản đồ khác (vùng 512 × 1024 logic) giày 1/2560, ngựa 1/5120;
// × doBen.haoMon (cau-hinh.json, 1 = như client, 0 = tắt). Độ bền 0: món vẫn mặc nhưng không còn tác dụng (client VNG
// G_STR_ITEM_ABRADETOZERO "đã tổn hại, không thể tiếp tục sử dụng") tới khi sửa. Sửa ở cửa hàng NPC (nút Sửa của khung client): giá như
// engine KItem::GetRepairPrice = giá bảng đồ × 50 / 100 × (tối đa − còn) / tối đa × (16 + số dòng xanh) / 16 ([Repair] ItemPriceScale
// 50, MagicPriceScale 16; số dòng = GetTotalMagicLevel của engine), sửa là đầy lại.
// Rương chứa đồ (anh 26/10): h.ruong = món như túi (lưới 6 × 10 của khung client 储物箱.ini, giữ đúng ô), h.tienRuong = ngân lượng gửi
// (trọng thương chỉ mất tiền mang theo người). Mở ở Rương chứa đồ Ba Lăng (vật bản đồ — assets/data/vat-ban-do.json).
// Rương mở rộng (anh 27/10 "mở rộng rương = xu, 50 / 100 / 200, còn lại như client"): mua ở Thẩm Cửu (act moRuong) — h.ruongMo = số rương đã
// mở (0–3), h.ruongPhu[i] = món của rương mở rộng i + 1 (60 ô như rương chính, không cất tiền như client). b.r của cat / lay / datR = rương số
// mấy (0 = rương chính). Mật mã rương (client: mua chức năng mở rộng mới có mật mã): h.mkRuong = "muối:băm" scrypt (1–9 chữ số), h.khoa = 1
// thì không mặc / tháo đồ, không lấy đồ / tiền ra khỏi rương (act datMk / doiMk / khoa / moKhoa). Tiền trang (act doiXu): b.n Xu, mỗi Xu
// tienTrang.luongMotXu lượng ngân lượng mang theo (anh 27/10: 500 vạn = 1 xu).
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const doc = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const PACK = doc("assets/web/item/items.json"), GOC = doc("assets/data/do-goc.json").items, DX = doc("assets/data/dong-xanh.json");
const NKD = () => require("./nhat-ky"); // sổ hoạt động từng tài khoản (nạp lúc dùng)
const NG = require("./nguon-mon"); // nguồn gốc món: mã riêng + nơi sinh ra + đường đi (anh 18/11 tối — may-chu/nguon-mon.js)
const CHR = doc("assets/data/char.json"), MS = doc("assets/data/mobstats.json"), CFG = require("./cau-hinh-qt").apDung(doc("cau-hinh.json")); // + phần quản trị sửa ở F10 → Cấu hình (du-lieu/cau-hinh-qt.json — anh 11/11)
const THUOC = doc("assets/data/thuoc.json"), TC = CFG.thuoc || { chongToiDa: 60, muaToiDa: 60, banLai: 0.5 };
const TD = CFG.trenDat || { giay: 133, toiDa: 100 };
const MAPS = doc("assets/web/map/map.json"), FULL = (() => { try { return doc("assets/web/map/full/index.json"); } catch { return null; } })();

const BY = new Map(PACK.items.map((x) => [x.k, x]));
for (const [k, x] of Object.entries(THUOC.items)) BY.set(k, { ...x, k, thuoc: 1 });
const laThuoc = (it) => !!(it && (BY.get(it.k) || {}).thuoc);
const HANG = new Set(Object.values(THUOC.shops).flat()); // thuốc bày bán ở cửa hàng
// vật phẩm + hàng Tạp hóa (assets/data/vat-pham.json — cong-cu/dung-tap-hoa.js, anh 26/10 "shop tạp hóa giống client"): Thổ Địa Phù (phu —
// xếp chồng như thuốc, không tính vào giới hạn mang thuốc), đồ trắng áo / mũ cấp 1–2. HANG_VP: khóa món -> { gia, s } của cửa hàng
const VP = (() => { try { return doc("assets/data/vat-pham.json"); } catch { return { items: {}, shops: {} }; } })();
for (const [k, x] of Object.entries(VP.items)) BY.set(k, { ...x, k });
const HANG_VP = new Map(Object.values(VP.shops).flat().map((o) => [o.k, o]));
const laPhu = (it) => !!(it && (BY.get(it.k) || {}).phu);
// Kỳ Trân Các (anh 27/10 — assets/data/ky-tran-cac.json, cong-cu/dung-ky-tran-cac.js): món mua bằng Xu (h.xu), xếp chồng như thuốc (trừ lễ
// bao Hồi Thiên: mỗi bao đếm số viên còn — it.con), công dụng (dung) theo script client — act dung. Thuốc Hồi Thiên Tái Tạo Đơn (trong lễ bao)
// là thuốc thường (thuoc 1), không bày ở Dược điếm.
const KTC = (() => { try { return doc("assets/data/ky-tran-cac.json"); } catch { return { items: {}, the: [], buff: {} }; } })();
for (const [k, x] of Object.entries(KTC.items)) BY.set(k, { ...x, k });
const HANG_KTC = new Map(KTC.the.flatMap((t) => t.hang.filter((o) => o.k).map((o) => [o.k, o.gia])));
// "hoàn" = trạng thái vật phẩm có chỉ số chiến đấu (buff.attrs): hoàn Tống Kim + hoàn Kỳ Trân Các (Phi Tốc, Đại Lực, Nội … hoàn, Kích Công Trợ Lực, Âm Dương…) —
// trong trận Tống Kim tối đa 3 phút, trọng thương thì mất (anh 17/11 — tong-kim.js hoanTran). Chiến cổ / Lệnh Bài (đồng đội — trình duyệt) không tính
const laHoan = (k) => typeof k === "string" && k !== "tkChienCo" && k !== "tkLenhBai" && !!(KTC.buff[k] && KTC.buff[k].attrs && Object.keys(KTC.buff[k].attrs).length);
// hàng sự kiện (anh 16/11 — Báo Đáp Ân Sư): dòng mang sk chỉ bán khi sự kiện đó đang mở (muaKtc — skMo); sk lạ thì không bán
const SK_KTC = new Map(KTC.the.flatMap((t) => t.hang.filter((o) => o.k && o.sk).map((o) => [o.k, String(o.sk)])));
const skMo = (sk, qt = false) => (sk === "bdas" ? BD().dang(Date.now(), qt) : false); // qt: quản trị mua thử ngoài ngày (anh 16/11)
// cửa hàng phúc duyên (Thần bí Thương Nhân Liễu Ất — Sale 93 của client, giá bằng điểm phúc duyên h.pd.diem; anh 31/10 khuya lần 2)
const HANG_PD = new Map((KTC.phucDuyen || []).map((o) => [o.k, o.gia]));
const laKtc = (it) => !!(it && (BY.get(it.k) || {}).ktc);
// bùa Phong Hỏa Liên Thành (anh 04/11 lượt 24 — ky-tran-cac.json bua, cong-cu/dung-ky-tran-cac.js): món nằm đất của quân địch bị hạ, nhặt là dùng
// ngay (nhatBua); BUA_MON = các món bùa (may-chu/phong-hoa.js boc bốc ngang nhau)
const BUA = KTC.bua && KTC.bua.mon ? KTC.bua : { hieu: {}, mon: {} }, BUA_MON = Object.keys(BUA.mon);
const laLeBao = (it) => (((it && BY.get(it.k)) || {}).dung || {}).loai === "leBao";
// món đếm theo n, xếp chồng tới thuoc.chongToiDa — trừ món ghi kc (không xếp chồng; Sát Thủ lệnh / giản xếp chồng từ 02/11 khuya)
const xepChong = (it) => laThuoc(it) || laPhu(it) || (laKtc(it) && !laLeBao(it) && !(BY.get(it.k) || {}).kc);
// 1 chồng tối đa bao nhiêu món: thuoc.chongRieng của món đó (anh 02/11: Mật đồ thần bí tới 9999; khuya: Sát Thủ lệnh / giản — khóa kết thúc "*"
// = mọi món có khóa bắt đầu như vậy), không có thì thuoc.chongToiDa
const CHONG_RIENG = TC.chongRieng || {}, CHONG_DAU = Object.entries(CHONG_RIENG).filter(([k]) => k.endsWith("*")).map(([k, v]) => [k.slice(0, -1), +v]);
const chongRieng = (k) => +CHONG_RIENG[k] || (CHONG_DAU.find(([d]) => String(k).startsWith(d)) || [])[1] || 0;
const chongMax = (k) => chongRieng(k) || TC.chongToiDa;
// Khóa bảo hiểm (anh 05/11: "các item nhận thưởng từ level và online thì đều sẽ ở trong trạng thái khóa bảo hiểm vĩnh viễn, không giao dịch
// được"): it.kbh = KBH_VV (2) — khóa bảo hiểm vĩnh viễn (client G_ITEM_BIND_STATE2, engine LOCK_STATE_FOREVER). Như engine: không giao dịch,
// không bày bán (giá bày bán 0), không vứt ra đất (ServerThrowAwayItem); chỉ xếp chồng với món cùng trạng thái khóa (KItemList gộp chồng so
// nState). Món mở ra từ món khóa (lễ bao, mã bài, bảo rương) cũng khóa. Không cần nữa: Lễ quan → Hủy vật phẩm (act huy)
const KBH_VV = 2;
// Khóa có hạn (anh 11/11: "đồ mở từ rương trang bị khóa, chỉ trang bị thôi, là dc tự động mở khóa sau 72 tiếng"; anh chọn chỉ đồ mở từ nay — món mở
// trước giữ khóa vĩnh viễn): it.kbh = KBH_TAM (1) + it.kbhHet (ms, lúc mở khóa) — client G_ITEM_BIND_STATE "Vật phẩm này đã được khóa bảo hiểm" +
// G_ITEM_UNBIND_STATE "Thời gian chờ mở khóa: %d giờ" (engine KItem::LockItem: LOCK_STATE_UNLOCK + giờ mở). Còn hạn: chặn như khóa vĩnh viễn (mọi chỗ
// xét it.kbh); hết hạn: chuan bỏ khóa (chạy mỗi lần đọc tài khoản — api.js tkPhien) + ghi h.kbhMoTin -> nhịp báo + gửi túi mới. Chỉ Bảo rương đồ
// xanh (ruongXanh — khoaRuong) đặt khóa này; RXC.khoaGio giờ
const KBH_TAM = 1;
// thuốc Tống Kim (it.tk = 1 — anh 12/11 "máu tống kim mua = nửa giá máu ở ngoài, sau khi hết tống kim, máu đó tự mất, k dc mang ra tống kim"): mua ở Quân y trong trận
// (act mua — giá × tongKim.giaThuoc), chồng riêng không gộp với thuốc thường; không cất rương / giao dịch / bày bán / bán / vứt; rời trận hoặc hết trận thì mất
// (tong-kim.js boThuocTk — nhịp api.js)
const CAU_TK = "Thuốc Tống Kim chỉ dùng trong chiến trường — không mang ra ngoài được (rời trận / hết trận tự mất)";
const cungKhoa = (a, b) => (a.kbh | 0) === (b.kbh | 0) && !a.tk === !b.tk;
const voiKhoa = (kbh) => (kbh | 0 ? { kbh: kbh | 0 } : {});
// anh 18/11 — khóa có hạn đi theo món (món mở từ hương bao khóa 72 giờ — bao-dap-an-su.js): món mới phân ra / dời / gộp từ món khóa có hạn giữ đúng giờ mở khóa
// (thiếu kbhHet thì chuan không bao giờ mở — kbh 1 không có giờ coi như khóa vĩnh viễn). Gộp chồng: giờ mở khóa muộn nhất (không bản nào mở sớm hơn hạn của nó)
const khoaCua = (it) => (it && (it.kbh | 0) === KBH_TAM ? (+it.kbhHet > 0 ? { kbh: KBH_TAM, kbhHet: +it.kbhHet } : { kbh: KBH_VV }) : voiKhoa(it && it.kbh));
const gopHet = (a, b) => { if ((a.kbh | 0) === KBH_TAM) a.kbhHet = Math.max(+a.kbhHet || 0, +(b && b.kbhHet) || 0); };
const CAU_KBH = {
  vut: "Nhằm bảo vệ tài sản cho bạn! Vật phẩm khóa bảo hiểm không được tùy ý vứt ra ngoài — không cần nữa thì đến Lễ quan (Ba Lăng) hủy vật phẩm.",
  dat: "Không thể đặt vào vật phẩm đã được khóa bảo hiểm!", // G_STR_NO_BINDITEM
  xu: "khóa bảo hiểm vĩnh viễn: không giao dịch, bày bán, vứt hay bán được; không cần nữa thì hủy ở Lễ quan (Ba Lăng)", // món mua bằng Xu ở Kỳ Trân Các (anh 12/11)
};
// mức Tự bán (h.locDo — Trợ Thủ "Bán đồ trong túi"): chỉ xét món không xếp chồng, không phải món Kỳ Trân Các (lễ bao, ngựa mã bài có hạn); dưới
// locDo dòng thì bán (act thanh), đủ dòng thì giữ lại — Trợ Thủ cất vào rương (act catDo). Món Dã Tẩu mua ở sạp Hệ thống (it.dt — may-chu/da-tau.js
// choHt): không bán, không cất — để trong túi chờ nộp / đưa xem
// o.vv: ngựa vĩnh viễn từ mã bài (anh 16/11 — Báo Đáp Ân Sư): không bán cho cửa hàng -> Tự bán / cất của Trợ Thủ bỏ qua
const theoTuBan = (o) => !xepChong(o) && !laKtc(o) && !o.het && !o.dt && !o.vv;
const banTuBan = (h, o) => theoTuBan(o) && (o.d || []).length < h.locDo;
const giuTuBan = (h, o) => theoTuBan(o) && (o.d || []).length >= h.locDo;
// chiêu sách của từng phái (gói võ công: factions[].books { 90, 120, 150 }) — học bằng sách Kỳ Trân Các (anh 27/10: "phải đọc sách như
// client"); nhân vật đã học chiêu 90 / 120 trước đó giữ nguyên (chuan: sachV)
const SK = doc("assets/web/skill/skills.json");
const PHAI_SACH = new Map(SK.factions.map((f) => [f.id, f.books || {}]));
// phe của phái (factions[].camp — 1 chính phái, 2 tà phái, 3 trung lập; chưa vào phái 0): màu tên + vòng sáng (the-gioi.js pheNay)
const PHAI_CAMP = new Map(SK.factions.map((f) => [f.id, f.camp | 0]));
const CHIEU_SACH = new Set(SK.factions.flatMap((f) => Object.values(f.books || {}).flat()));
// ---------- luyện kỹ năng (anh 29/10: "cơ chế luyện kĩ năng 90, mức độ luyện chứ không phải tăng điểm, 90 + 120 đều như nhau") ----------
// Như engine: chiêu sách có cờ IsExpSkill (skills.json exp = 1 — đa số chiêu 90 đánh quái, mọi chiêu 120, 150) không cộng điểm kỹ năng, lên cấp
// bằng độ luyện theo bảng client (assets/data/luyen-ky-nang.json — settings/npc/player/magic_level_exp.txt: độ luyện cần ở mỗi cấp), tới cấp tối
// đa của chiêu (≤ số mục của bảng). Số của S1: cau-hinh.json luyenKyNang.
//   - chiêu đánh quái (KNpc::ReceiveDamage "Luyen ky nang"): mỗi lần trúng quái + moiDon (engine 20); đảo Tẩy Tủy (bản đồ 242) × dao (engine
//     25 / 20). Trình duyệt đếm lần trúng (vocong.js misHit) gửi kèm nhịp "luyen" [[mã, số lần]]; mỗi nhịp tối đa donToiDa lần / chiêu
//   - chiêu không đánh (120: bùa / vòng sáng — KPlayer::AddSkillExp): kinh nghiệm vừa nhận khi giết quái / được đội chia × ty120 % (engine
//     Skill120Rate). Ủy thác không luyện
// h.luyen = { mã: độ luyện đã có ở cấp đang có } (máy chủ giữ — api.js GIU); cấp ở h.skills[mã], máy chủ quyết (api.js luuNv lấy bản máy chủ)
const LK = (() => { try { return doc("assets/data/luyen-ky-nang.json").ky || {}; } catch { return {}; } })();
const LUYEN = new Set([...CHIEU_SACH].filter((id) => (SK.skills[id] || {}).exp === 1 && LK[id]));
const laLuyen = (id) => LUYEN.has(+id);
// chiêu sách (90 / 120 / 150) của từng phái — api.js luuNv bỏ chiêu sách không thuộc phái đang ở (anh 10/11)
const SACH_PHAI = new Map(SK.factions.map((f) => [f.id, new Set(Object.values(f.books || {}).flat().map(Number))]));
const sachPhai = (fac, id) => !!(SACH_PHAI.get(fac) && SACH_PHAI.get(fac).has(+id));
const danhQuai = (id) => { const s = SK.skills[id]; return !!(s && s.target && s.target.enemy); };
const LKC = () => CFG.luyenKyNang || {};
const tranLuyen = (id) => Math.min((SK.skills[id] || {}).max || 20, (LK[id] || []).length); // cấp tối đa luyện được
// cộng n độ luyện vào chiêu id (đã học — cấp ≥ 1): đủ độ luyện của cấp thì lên cấp (dư chuyển sang cấp sau). -> [mã, cấp cũ, cấp mới] | null
function congLuyen(h, id, n) {
  const sk = (h.skills = h.skills || {}), lv = sk[id] | 0, bang = LK[id], tran = tranLuyen(id);
  if (!bang || lv < 1 || lv >= tran || !(n > 0)) return null;
  const L = (h.luyen = h.luyen || {});
  let e = (L[id] || 0) + n, c = lv;
  while (c < tran && e >= bang[c - 1]) { e -= bang[c - 1]; c++; }
  L[id] = c >= tran ? 0 : Math.floor(e);
  if (c === lv) return null;
  sk[id] = c;
  return [+id, lv, c];
}
// đòn trúng của chiêu luyện đánh quái mà trình duyệt báo: ds = [[mã, số lần]], z = bản đồ đang đứng -> [[mã, cấp cũ, cấp mới]] (chiêu vừa lên cấp)
// S1 (đo 29/10 — trận ở đây trúng nhiều hơn game gốc 4–25 nghìn lần / giờ: với 20 / lần chiêu 90 chỉ ~6,6 giờ là đầy, bảng client Truy Tinh Trục
// Nguyệt lớn gấp 5 chiêu khác): mỗi lần trúng = moiDon × (tổng bảng của chiêu / chuan — mọi chiêu cần cùng số lần trúng, đường lên từng cấp giữ
// của client) × heSoChieu[mã] (chiêu chính mỗi phái theo số lần trúng / giờ đo được — cùng ~30 giờ đánh liên tục; chiêu khác 1)
const tongBang = (id) => (LK[id] || []).slice(0, Math.max(0, tranLuyen(id) - 1)).reduce((a, b) => a + b, 0);
// Đứng ở thành / thôn thì không tính (anh 29/10 lần 3: đánh 5 mộc nhân Ba Lăng huyện không luyện; đảo Tẩy Tủy thì được — trình duyệt cũng không đếm)
function luyenDon(h, ds, z) {
  const kz = (ZONES.get(z | 0) || {}).kind;
  if (!Array.isArray(ds) || THANH.has(kz) || kz === "lôi đài") return []; // Lôi Đài (anh 15/11): đánh người trong sân không luyện kỹ năng
  const C = LKC(), moi = +C.moiDon || 20, k = (z | 0) === 242 ? +C.dao || 1.25 : 1, toiDa = C.donToiDa || 150, chuan = +C.chuan || 0, HS = C.heSoChieu || {}, len = [];
  for (const r of ds.slice(0, 8)) {
    if (!Array.isArray(r) || !laLuyen(r[0]) || !danhQuai(r[0])) continue;
    const id = +r[0], bang = chuan > 0 ? tongBang(id) / chuan : 1;
    const x = congLuyen(h, id, Math.min(toiDa, Math.max(0, r[1] | 0)) * moi * k * bang * (+HS[id] || 1));
    if (x) len.push(x);
  }
  return len;
}
// kinh nghiệm vừa nhận -> chiêu luyện không đánh (120) đã học
function luyenKn(h, kn) {
  const ty = +LKC().ty120 || 0, len = [];
  if (!(ty > 0) || !(kn > 0)) return len;
  for (const id of Object.keys(h.skills || {})) if (laLuyen(id) && !danhQuai(id)) { const x = congLuyen(h, +id, (kn * ty) / 100); if (x) len.push(x); }
  return len;
}
// độ luyện + cấp các chiêu luyện đã học (gửi trình duyệt — ô xem chiêu "Độ luyện hiện tại")
const luyenCua = (h) => ({ exp: { ...(h.luyen || {}) }, lv: Object.fromEntries(Object.entries(h.skills || {}).filter(([id]) => laLuyen(id) && sachPhai(h.fac, id))) }); // chỉ chiêu của phái đang ở: nhịp này nâng cấp chiêu trên trình duyệt (anh 10/11 — chiêu luyện của phái cũ quay lại, Đường Môn đánh ra Hấp Tinh Yểm)
// điểm kỹ năng đã dùng: phần trên cấp cho không (skMin — sách / Đại Thành) của chiêu KHÔNG luyện; tổng được = (cấp − 1) + Võ Lâm Mật Tịch (h.mt)
const diemDaDung = (h) => Object.entries(h.skills || {}).reduce((t, [id, v]) => t + (laLuyen(id) ? 0 : Math.max(0, (v | 0) - ((h.skMin || {})[id] | 0))), 0);

// cấp chiêu ≤ cấp nhân vật − cấp yêu cầu + 1 (≤ cấp tối đa; cấp sách / Đại Thành cho không — skMin — giữ) như engine KPlayer::AddSkillPoint
// (anh 29/10; cùng công thức với src/game/rules.js capChieu): cao hơn thì hạ về mức đó — điểm thừa trình duyệt tự trả lại (fixPoints)
// Chiêu phái chưa tới cấp có (cấp nhân vật < MOC) thì 0 — như src/game/rules.js MOC / mocCua (anh 10/11 "lên cấp không có skill đúng như client"):
// nhóm T của skills_table.lua có từ cấp T − 10 (nhóm 10 từ cấp 10) — nhiệm vụ môn phái cấp N của client phát nhóm N + 10
const MOC = new Map(), mocCua = (t) => (+t >= 20 ? +t - 10 : +t);
for (const f of SK.factions || []) for (const [t, ids] of Object.entries(f.tiers || {})) for (const id of ids) MOC.set(+id, mocCua(t));
function hamChieu(h) {
  const sk = h.skills || {}, min = h.skMin || {}, lv = h.lvl || 1;
  for (const [id, c] of Object.entries(sk)) {
    const s = SK.skills[id]; if (!s || laLuyen(id)) continue; // chiêu luyện: cấp theo độ luyện (luyen*), không theo cấp nhân vật
    const cap = Math.max(min[id] | 0, lv < (MOC.get(+id) || 0) ? 0 : Math.min(s.max || 20, lv - (s.req || 0) + 1));
    if ((c | 0) > cap) { if (cap > 0) sk[id] = cap; else delete sk[id]; }
  }
}
const KEYS = new Set(DX.rows.map((r) => r.k)); // khóa thuộc tính có trong bảng dòng xanh
const ROWS = Array.from({ length: 11 }, (_, t) => DX.rows.filter((r) => r.w[t] > 0)); // dòng ra được trên từng loại món
// bãi như trình duyệt (main.js mergeFullMaps): bản đồ dựng nguyên chỉ thêm bãi của bản đồ chưa có
const ZONES = new Map(MAPS.zones.map((z) => [z.id, z]));
if (FULL) for (const z of FULL.zones) if (!MAPS.zones.some((x) => x.map === z.map)) ZONES.set(z.id, z);
const FARM = new Set(["chính", "phụ"]);
// bãi train mở theo cấp (cau-hinh.json vaoBai — anh 25/10): cấp ≥ cấp thấp nhất của bãi − thieuCap. GIỐNG src/game/main.js capVao
const VB = { thieuCap: 0, ...(CFG.vaoBai || {}) };
const capVao = (Z) => (FARM.has(Z.kind) ? Math.max(1, (Z.lo | 0) - (VB.thieuCap | 0)) : 1);
// cân bằng theo bãi (anh 26/10 "cân bằng theo tốc độ giết thật"): canBang.bai[mã bãi] = { mau, satThuong (trình duyệt), kinhNghiem, tien
// (máy chủ), chiSo (cả 2: mã quái lấy chỉ số thay), soQuai (trình duyệt: số quái cùng lúc) }, canBang.soQuai = số quái mặc định mọi bãi,
// canBang.trum = hệ số của trùm bãi so với quái thường cùng bãi. Phần trình duyệt cần gửi trong LUAT
const CAN_BANG = CFG.canBang || {};
// bãi chung số với bãi gốc (Phong Lăng Độ bờ Bắc 3360, thuyền 337–339 — goc 336): chưa khai riêng thì dùng hệ số của bãi gốc (chỉ trong bộ nhớ)
// — bản chép, để độ khó tăng dần (dưới) chỉnh bờ Nam không kéo theo bờ Bắc / thuyền (anh 28/10: bờ Bắc giữ khó như cũ, thuyền giữ khó)
if (CAN_BANG.bai) for (const Z of ZONES.values()) if (Z.goc && !CAN_BANG.bai[Z.id] && CAN_BANG.bai[Z.goc]) CAN_BANG.bai[Z.id] = { ...CAN_BANG.bai[Z.goc] };
const cbBai = (Z) => (Z && CAN_BANG.bai && CAN_BANG.bai[Z.id]) || {};
// ---------- độ khó tăng dần (anh 28/10: "map sau quái mạnh và nhiều máu hơn map trước"; từ cấp doKho.tuCap thủ lĩnh 1,5 triệu, tinh anh 800 nghìn
// máu, Boss Sát thủ trên bậc 90 ít nhất 3 triệu — bãi sau nhiều hơn) — cau-hinh.json doKho. Tính 1 lần lúc bật máy chủ trên bảng client
// (assets/data/mobstats.json như src/game/rules.js mobStats), ghi vào canBang.bai (trình duyệt nhận trong LUAT) + SAT_DAT (Boss Sát thủ):
//   1. bảng client nhảy xuống giữa khoảng cấp của bãi (Sa Mạc 2: cấp 100 còn theo công thức bãi 90–100 — máu gấp 3, chính xác gấp 4) -> capQuai:
//      quái ra từ cấp sau bước nhảy
//   2. bãi xếp theo cấp thấp nhất (bãi chính + phụ, trừ bãi có goc — bờ Bắc, thuyền giữ như cũ): trung bình 1 con quái thường của bãi (máu, sát
//      thương, chính xác, né tránh) phải ≥ con mạnh nhất của nhóm bãi cấp trước × (1 + tang) — thiếu thì nâng hệ số mau / satThuong / chinhXac /
//      neTranh của bãi (chỉ nâng, không hạ)
//   3. bãi từ tuCap: thủ lĩnh / tinh anh máu đặt sẵn (mauThuLinh / mauTinhAnh) = thuLinh / tinhAnh × máu quái thường của bãi ÷ máu quái thường của
//      bãi đầu tiên từ tuCap (bờ Bắc như bờ Nam cùng cấp)
//   4. Boss Sát thủ bậc từ tuCap (bậc S1 thêm — mẫu client không theo cấp): máu = satThu × như trên ở cấp boss; sát thương / chính xác / né tránh =
//      quái thường cùng cấp × satThuHeSo (≈ bậc 90 client so với quái Sa Mạc 1)
const DK = { tang: { mau: 0.1, satThuong: 0.05, chinhXac: 0.05, neTranh: 0.05 }, nhay: 1.3, tuCap: 100, thuLinh: 1500000, tinhAnh: 800000, satThu: 3000000,
  satThuHeSo: { satThuong: 2, chinhXac: 3, neTranh: 1.8 }, ...(CFG.doKho || {}) };
const atL = (i, L) => MS.pool[i][Math.min(Math.max(L | 0, 1), MS.maxLevel) - 1];
// trung bình 1 con quái thường của bãi ở cấp a..b (mọi loại, 5 hệ) × hệ số đang có của bãi
function tbQuai(Z, B, a, b) {
  const cs = B.chiSo && MS.mobs[B.chiSo] ? B.chiSo : null, s = { mau: 0, stThap: 0, satThuong: 0, chinhXac: 0, neTranh: 0 };
  let n = 0;
  for (const id of Z.m || []) {
    const M = MS.mobs[cs || id];
    if (!M) continue;
    for (let L = a; L <= b; L++) for (const m of M.s) {
      let d0 = atL(m.min, L), d1 = atL(m.max, L);
      if (!d0 && !d1 && m.dmg) d0 = d1 = Math.max(...Object.values(m.dmg).map((i) => atL(i, L)));
      s.mau += Math.max(1, atL(m.life, L)); s.stThap += d0; s.satThuong += d1; s.chinhXac += Math.max(1, atL(m.ar, L)); s.neTranh += Math.max(0, atL(m.def, L)); n++;
    }
  }
  if (!n) return null;
  const k = { mau: B.mau ?? 1, stThap: B.satThuong ?? 1, satThuong: B.satThuong ?? 1, chinhXac: B.chinhXac ?? 1, neTranh: B.neTranh ?? 1 };
  return Object.fromEntries(Object.entries(s).map(([x, v]) => [x, (v / n) * k[x]]));
}
const DK_TB = new Map(), SAT_DAT = {};
// quái thường đúng cấp lv ở bãi (trong chuỗi bãi luyện công) chứa cấp đó — bãi mạnh nhất nếu nhiều bãi -> { t: tbQuai, Z, kn: kinh nghiệm quái bãi } | null (Phong Hỏa Liên
// Thành — may-chu/phong-hoa.js heSo: lính mẫu client cấp cố định nhân theo quái bãi cùng cấp, anh 04/11)
let QUAI_CAP = null;
if (CAN_BANG.bai) {
  const chuoi = [...ZONES.values()].filter((Z) => FARM.has(Z.kind) && !Z.goc && Z.m && Z.m.length).sort((a, b) => a.lo - b.lo || a.hi - b.hi);
  for (const Z of chuoi) {
    const B = (CAN_BANG.bai[Z.id] = CAN_BANG.bai[Z.id] || {}), K = { chiSo: B.chiSo };
    let tu = Z.lo;
    for (let L = Z.lo; L < Z.hi; L++) if (tbQuai(Z, K, L, L).mau > DK.nhay * tbQuai(Z, K, L + 1, L + 1).mau) tu = L + 1;
    if (tu > Z.lo) B.capQuai = [tu, Z.hi];
  }
  let truoc = null;
  for (const lo of [...new Set(chuoi.map((Z) => Z.lo))]) {
    const cao = {};
    for (const Z of chuoi.filter((z) => z.lo === lo)) {
      const B = CAN_BANG.bai[Z.id], [a, b] = B.capQuai || [Z.lo, Z.hi];
      const t = tbQuai(Z, B, a, b);
      if (truoc) for (const k of ["mau", "satThuong", "chinhXac", "neTranh"]) {
        const can = truoc[k] * (1 + (DK.tang[k] || 0));
        if (t[k] < can) B[k] = +((B[k] ?? 1) * (can / t[k])).toFixed(3);
      }
      const t2 = tbQuai(Z, B, a, b);
      DK_TB.set(Z.id, t2);
      for (const [k, v] of Object.entries(t2)) cao[k] = Math.max(cao[k] || 0, v);
    }
    truoc = cao;
  }
  QUAI_CAP = (lv) => {
    const Z = chuoi.filter((z) => z.lo <= lv && lv <= z.hi).sort((x, y) => DK_TB.get(y.id).mau - DK_TB.get(x.id).mau)[0] || chuoi[chuoi.length - 1];
    if (!Z) return null;
    const B = CAN_BANG.bai[Z.id], [a, b] = B.capQuai || [Z.lo, Z.hi], L = Math.min(Math.max(lv, a), b);
    return { t: tbQuai(Z, B, L, L), Z, kn: knBai(Z) * (B.kinhNghiem ?? 1) };
  };
  const dau = chuoi.find((Z) => Z.lo >= DK.tuCap), T0 = dau ? DK_TB.get(dau.id).mau : 0;
  if (T0) {
    for (const Z of ZONES.values()) {
      const t = FARM.has(Z.kind) && Z.lo >= DK.tuCap && Z.m && Z.m.length && DK_TB.get(Z.goc || Z.id);
      if (!t) continue;
      const B = (CAN_BANG.bai[Z.id] = CAN_BANG.bai[Z.id] || {});
      B.mauThuLinh = Math.round((DK.thuLinh * t.mau) / T0 / 1000) * 1000;
      B.mauTinhAnh = Math.round((DK.tinhAnh * t.mau) / T0 / 1000) * 1000;
    }
    // quái thường đúng cấp boss, ở bãi (trong chuỗi) chứa cấp đó — bãi mạnh nhất nếu nhiều bãi
    const quaiCap = (lv) => {
      const Z = chuoi.filter((z) => z.lo <= lv && lv <= z.hi).sort((x, y) => DK_TB.get(y.id).mau - DK_TB.get(x.id).mau)[0] || chuoi[chuoi.length - 1];
      const B = CAN_BANG.bai[Z.id], [a, b] = B.capQuai || [Z.lo, Z.hi], L = Math.min(Math.max(lv, a), b);
      return tbQuai(Z, B, L, L);
    };
    const SD = (() => { try { return doc("assets/data/sat-thu.json"); } catch { return { bac: [] }; } })(), H = DK.satThuHeSo;
    const bac0 = SD.bac.filter((b) => b.cap >= DK.tuCap).sort((x, y) => x.cap - y.cap)[0], M0 = bac0 ? quaiCap(bac0.lv).mau : 0;
    for (const b of SD.bac) {
      if (b.cap < DK.tuCap || !M0) continue;
      const t = quaiCap(b.lv);
      SAT_DAT[b.cap] = { mau: Math.round((DK.satThu * t.mau) / M0 / 10000) * 10000, st: [Math.round(t.stThap * H.satThuong), Math.round(t.satThuong * H.satThuong)],
        ar: Math.round(t.chinhXac * H.chinhXac), def: Math.round(t.neTranh * H.neTranh) };
    }
  }
}
// máu Boss Sát thủ b (assets/data/sat-thu.json: mẫu tpl, cấp lv, bậc cap, bãi) hệ se — boss chung ở bản quái chung máy chủ sinh (anh 03/11 — may-chu/
// quai-chung.js). GIỐNG src/game/main.js datBossSat + world.js spawnMob: chỉ số mẫu của chính nó × hệ số máu canBang của bãi × satThu.mau[bậc];
// bậc từ doKho.tuCap: máu đặt sẵn (SAT_DAT)
function mauSat(b, se) {
  const D = SAT_DAT[b.cap]; if (D) return D.mau;
  const M = MS.mobs[b.tpl]; if (!M) return 1;
  const S = M.s[se] || M.s[M.series], L = clamp(b.lv | 0, 1, MS.maxLevel), B = (CAN_BANG.bai && CAN_BANG.bai[b.bai]) || {}, k = ((CFG.satThu || {}).mau || {})[b.cap];
  const hp = Math.max(1, Math.round(Math.max(1, MS.pool[S.life][L - 1]) * (B.mau ?? 1)));
  return k > 0 ? Math.max(1, Math.round(hp * k)) : hp;
}
const PLD = () => require("./phong-lang-do.js"); // Phong Lăng Độ (gọi lúc chạy — tệp đó cũng require tệp này)
const SAT = () => require("./sat-thu.js"); // Boss Sát thủ (như trên)
const PQ = () => require("./phu-quy.js"); // Phú Quý Cẩm Hạp (như trên)
const VAI = () => require("./vuot-ai.js"); // Vượt Ải (như trên)
const VDE = () => require("./viem-de.js"); // Viêm Đế Bảo Tàng — mở Viêm Đế Bí Bảo (anh 04/11)
const DTA = () => require("./da-tau.js"); // Dã Tẩu — hệ ngựa nhiệm vụ đang đòi (mua ở Mã phu — anh 10/11)
const HE_TEN = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const MCH = () => require("./minh-chu.js"); // nhiệm vụ Võ Lâm Minh Chủ — đếm quái nhiệm vụ giết quái (như trên)
const PTH = () => require("./phan-than.js"); // Phân Thân (anh 05/11): có phân thân đang theo thì ủy thác không đo tốc độ (như trên)
const BHO = () => require("./bang-hoi.js"); // bang hội đợt 2: cống hiến (BH.cong) — nạp lúc dùng (bang-hoi.js nạp do.js)
// cống hiến bang hội của nhân vật h (ctx.ten = tài khoản, ctx.key = "tk|o"): Vượt Ải 1 người, Boss Sát thủ — không bao giờ làm hỏng việc giết quái
const congBh = (ctx, h, nguon, gt, opt) => { try { const k = String(ctx.key || ""), i = k.lastIndexOf("|"); BHO().cong(ctx.ten, i >= 0 ? +k.slice(i + 1) : null, h.name, nguon, gt == null ? null : gt, opt || {}); } catch (e) { console.error("Bang hội — cống hiến:", e.message); } };
const TDOI = () => require("./to-doi.js"); // tổ đội — chia kinh nghiệm (như trên)
const TGI = () => require("./the-gioi.js"); // người đang trong game: bãi, vị trí, cấp (chia kinh nghiệm)
const TKM = () => require("./tong-kim.js"); // Tống Kim (anh 06/11): Quân Nhu quan (muaTk), món chỉ dùng trong chiến trường, Huân công bài (như trên)
let LD_ = null; const LDA = () => LD_ || (LD_ = require("./loi-dai.js")); // Lôi Đài (anh 15/11): trong sân không Thổ Địa Phù, không vứt đồ (như trên)
let NSK_ = null; const NSK = () => NSK_ || (NSK_ = require("./nguon-su-kien.js")); // anh 18/11 — nguồn nguyên liệu sự kiện (sườn dùng lại): nhiệm vụ ngày lễ, Boss Sát thủ, đầu lĩnh Phong Lăng Độ
let BD_ = null; const BD = () => BD_ || (BD_ = require("./bao-dap-an-su.js")); // anh 16/11 — Báo Đáp Ân Sư: món sự kiện, Nến × kinh nghiệm, rượu / chỉ rơi, hàng sự kiện Kỳ Trân Các (như trên)
const tkCuaKhoa = (key) => (typeof key === "string" && key.includes("|") ? key.slice(0, key.lastIndexOf("|")) : "");
const oCuaKhoa = (key) => (typeof key === "string" && key.includes("|") ? key.slice(key.lastIndexOf("|") + 1) | 0 : null); // ô nhân vật của key "tk|o" (Lôi Đài chặn theo nhân vật — soát 16/11)
// tổ đội theo client (cong-cu/dung-thong-soai.js): cấp thống soái (exp, soNguoi), LeadExpShare theo hệ (chia), khoảng chia kinh nghiệm (xa)
const TS = (() => { try { return doc("assets/data/thong-soai.json"); } catch { return { exp: [], soNguoi: [], chia: [25, 25, 25, 25, 25], xa: 768 }; } })();
// quái đặc biệt (anh 27/10): TINH ANH (tên xanh — quái hoàng kim của client) ra sau mỗi tinhAnhMoi con, THỦ LĨNH (trùm bãi, tên cam) sau mỗi
// thuLinhMoi con — đếm từ lúc hạ con trước. Chỉ số tinh anh (× so với quái thường) + bảng rơi đặc biệt theo client: assets/data/roi-dac-biet.json
// (cong-cu/dung-roi-dac-biet.js); trang bị tinh anh: mỗi lượt rơi tinhAnhRoiDo (TẠM — bảng client ~90 % mỗi lượt quá nhiều so với đồ rơi của
// game). GIỐNG src/game/world.js kill
const QD = { tinhAnhMoi: 50, thuLinhMoi: 250, tinhAnhRoiDo: 0.1, ...(CFG.quaiDacBiet || {}) };
const RDB = (() => { try { return doc("assets/data/roi-dac-biet.json").bai; } catch { return {}; } })();
const taBai = (Z) => (Z && RDB[Z.id] && RDB[Z.id].ta) || null;
// đồ đặc biệt (anh 28/10 lần 7 — cau-hinh.json roiDacBiet): bảng client (quái thường, thủ lĩnh, tinh anh, Boss Sát thủ) bỏ các món trong
// boKhoiBangClient (biKip = mọi sách võ công 90 — Lệnh bài Phong Lăng Độ không rơi từ quái; bảo thạch, thủy tinh, các loại lộ, Võ Lâm Mật Tịch,
// Tẩy Tủy Kinh, bí kíp chỉ rơi theo bảng mỗi con của thủ lĩnh / Boss Sát thủ — roiMoiCon)
const RDC = { boKhoiBangClient: [], thuLinh: {}, satThu: {}, satThuTangMoiBac: 0, ...(CFG.roiDacBiet || {}) };
const BI_KIP = Object.entries(KTC.items).filter(([, x]) => x.dung && x.dung.loai === "sach").map(([k]) => k);
const BO_ROI = new Set(RDC.boKhoiBangClient.flatMap((k) => (k === "biKip" ? BI_KIP : [k])));
const locBang = (b) => Object.fromEntries(Object.entries(b || {}).filter(([k]) => !BO_ROI.has(k)));
for (const B of Object.values(RDB)) {
  for (const q of Object.values(B.q || {})) q[1] = locBang(q[1]);
  if (B.ta) B.ta.bang = locBang(B.ta.bang);
}
// bảng tỉ lệ MỖI CON { khóa món: tỉ lệ, biKip: tỉ lệ ra 1 cuốn bất kỳ } × heSo -> its (mỗi món bốc riêng)
function roiMoiCon(bang, its, heSo = 1) {
  for (const [k, p] of Object.entries(bang || {})) {
    if (Math.random() >= p * heSo) continue;
    if (k === "biKip") { if (BI_KIP.length) its.push({ k: BI_KIP[Math.floor(Math.random() * BI_KIP.length)], n: 1 }); }
    else if (BY.get(k)) its.push({ k, n: 1 });
  }
}
// Boss Sát thủ bậc càng cao tỉ lệ món đặc biệt càng cao (anh: "boss càng cao tỉ lệ có thể cao hơn, đừng làm đồ mất giá")
const heSoBacSatThu = (cap) => 1 + RDC.satThuTangMoiBac * Math.max(0, ((cap | 0) - 20) / 10);
// máy chủ chấp nhận khi đã giết ≥ 80 % số con (lần báo giết bị bỏ, chết đổi bãi… làm trình duyệt đếm lệch)
const BOSS_GAP = Math.floor(QD.thuLinhMoi * 0.8), TA_GAP = Math.floor(QD.tinhAnhMoi * 0.8);
const SLOT_OF = { 0: "Weapon", 1: "Weapon", 2: "Cloth", 3: "Ring1", 4: "Necklace", 5: "Shoes", 6: "Sash", 7: "Cap", 8: "Bangle", 9: "Pendant", 10: "Horse" };
const JEWEL = new Set([3, 4, 9]); // nhẫn, dây chuyền, ngọc bội: không có chỉ số gốc -> không rơi trắng
const MAX_LEVEL = 200, BAG_W = 6, BAG_H = 10;
const DEATH = { expPermille: 10, expCap: 500000, goldPermille: 50 };
// đồ xanh theo loại -> cấp đồ (chọn món nền)
const BY_TYPE = {};
for (const x of PACK.items) if (x.gr === "xanh") {
  const cl = (GOC[x.k] || {}).cl || 1, T = (BY_TYPE[x.t] = BY_TYPE[x.t] || {});
  (T[cl] = T[cl] || []).push(x);
}
// Dòng ẩn: kích bởi ngũ hành nhân vật + 2 ô liên kết (cặp ô theo bản 2 — SOURCE2/js/stats.js ACTIVATED_BY; client G_ITEM_21 ghi đúng
// "của <ô> và <ô>"). Hệ X kích món hệ Y khi X sinh Y: Kim sinh Thủy, Thủy sinh Mộc, Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim.
// GIỐNG src/game/itemdb.js (trình duyệt) — sửa thì sửa cả 2.
const KICH = { Cap: ["Cloth", "Necklace"], Cloth: ["Ring2", "Sash"], Sash: ["Pendant", "Bangle"], Weapon: ["Necklace", "Cloth"], Shoes: ["Weapon", "Cap"],
  Bangle: ["Shoes", "Ring1"], Necklace: ["Sash", "Ring2"], Ring1: ["Weapon", "Cap"], Ring2: ["Bangle", "Pendant"], Pendant: ["Shoes", "Ring1"] };
const SINH = [2, 3, 1, 4, 0]; // 0 Kim -> 2 Thủy, 1 Mộc -> 3 Hỏa, 2 Thủy -> 1 Mộc, 3 Hỏa -> 4 Thổ, 4 Thổ -> 0 Kim
function soKich(h, slot, it) {
  if (it.s == null) return 0;
  let n = SINH[h.series] === it.s ? 1 : 0;
  for (const o of KICH[slot] || []) { const x = (h.equip || {})[o]; if (x && x.s != null && SINH[x.s] === it.s) n++; }
  return n;
}
// dòng i (0 = dòng 1) có tác dụng: dòng lẻ (1, 3, 5) luôn có; dòng ẩn thứ j (dòng 2, 4, 6) khi j < số lần được kích
const coTacDung = (i, kich) => i % 2 === 0 || (i - 1) / 2 < kich;

// độ bền: [việc] -> { ô trang bị: 1 phần N mỗi lần } (client settings\item\abraderate.ini [Attack] / [Defend] / [Move]; ô engine head =
// Cap, body = Cloth, belt = Sash, cuff = Bangle, foot = Shoes) · giá sửa [Repair] · WarningBaseline 5: còn ≤ 5 thì báo sắp hao mòn
const HAO = { danh: { Weapon: 256 }, trung: { Cap: 320, Cloth: 320, Sash: 320, Bangle: 320 }, di: { Shoes: 2560, Horse: 5120 } };
const SUA = { gia: 50, dong: 16, bao: 5 };
const DB = { haoMon: 1, ...(CFG.doBen || {}) };
// vũ khí (anh 26/10 "vũ khí thêm độ bền, quan trọng nhất"): bảng vũ khí client 8.1 không có độ bền lẫn giá -> doBen.vuKhi = { ben, gia }
// theo cấp đồ 1–10 (cau-hinh.json — TẠM bằng áo cùng cấp đồ). GIỐNG src/game/itemdb.js benMax / giaSua
const VK = DB.vuKhi || null;
const laVuKhi = (k) => { const x = BY.get(k); return !!x && !x.thuoc && (x.t === 0 || x.t === 1); };
const benMax = (k) => {
  if (VK && laVuKhi(k)) return (VK.ben || [])[((GOC[k] || {}).cl || 1) - 1] || 0;
  const b = ((GOC[k] || {}).base || []).find((x) => x[0] === "durability_v"); return b ? b[1] : 0;
};
// rương mở rộng + Tiền trang (cau-hinh.json ruong / tienTrang)
const RG = { moRong: [50, 100, 200], ...(CFG.ruong || {}) }, TT = { luongMotXu: 5000000, luongBanXu: 250000, banXuNgay: 10, ...(CFG.tienTrang || {}) }; // luongBanXu / banXuNgay: đổi Xu ra ngân lượng (anh 14/11)
const KHOA = new Set(["mac", "thao", "lay", "rut", "chuyenR"]); // việc bị chặn khi rương đang khóa (lấy ra từ túi tử mẫu thì không chặn)
const MK_RE = /^[1-9]\d{0,8}$/, saiMk = new Map(); // 1–9 chữ số, số đầu không là 0 (client G_UI_NO_ZERO_HEAD); mở khóa sai: tên nhân vật -> { n, den } (sai 5 lần chờ 10 phút)
const bamMk = (mk) => { const m = crypto.randomBytes(8); return m.toString("hex") + ":" + crypto.scryptSync(mk, m, 24).toString("hex"); };
const dungMk = (h, mk) => {
  const [m, b] = String(h.mkRuong || "").split(":"); if (!m || !b || !/^\d{1,9}$/.test(String(mk))) return false; // mật mã đặt trước luật số đầu ≠ 0 vẫn mở được
  const x = crypto.scryptSync(String(mk), Buffer.from(m, "hex"), 24), y = Buffer.from(b, "hex");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
// Lễ quan → Mở Pass Rương (anh 29/10 lần 3 — client script\vng_feature\resetbox.lua ResetBox): quên mật mã rương thì đăng ký xóa, đúng ngày thứ 7
// sau ngày đăng ký đến xác nhận -> bỏ mật mã + khóa (GMCancleBoxPassword); qua ngày đó chưa xác nhận thì đăng ký bị hủy, phải đăng ký lại.
// h.xoaMk = ngày đăng ký (số yyyymmdd giờ Việt Nam — api.js GIU). Client chỉ hủy đúng ngày thứ 8 (CheckExpiredDate so bằng) nên vắng ngày đó là
// kẹt đăng ký cũ — ở đây quá ngày thứ 7 là hủy
const ngaySo = (t) => +ngayVN(t).replace(/-/g, "");
const sauNgay = (so, n) => { const s = String(so); return +new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) + n * 86400e3).toISOString().slice(0, 10).replace(/-/g, ""); };
// -> { dk: ngày đăng ký | 0, xoa: ngày xác nhận được, xacNhan: hôm nay xác nhận được, coMk, het: vừa quá hạn (đã hủy) }
function xoaMkCua(h) {
  const coMk = h.mkRuong ? 1 : 0;
  if (!h.xoaMk) return { dk: 0, coMk };
  const nay = ngaySo(Date.now()), xoa = sauNgay(h.xoaMk, 7);
  if (nay > xoa) { delete h.xoaMk; return { dk: 0, coMk, het: 1 }; }
  return { dk: h.xoaMk, xoa, xacNhan: nay === xoa ? 1 : 0, coMk };
}
// rương số r (0 = rương chính, 1–3 = rương mở rộng đã mua)
// r = "tm": túi tử mẫu (hành trang phụ — anh 27/10, client 同伴背包 + Tử Mẫu Lệnh ibzimudai.lua): h.tuiTM (lưới 6 × 10), dùng được tới
// h.tmHet (mỗi Tử Mẫu Lệnh +7 ngày); hết hạn thì đồ vẫn nằm đó nhưng không cất / lấy được (client SetPartnerBagLevel(0))
function ruongSo(h, r) {
  if (r === "tm") {
    if (!(h.tmHet > Date.now())) loi(h.tmHet ? "Túi tử mẫu đã hết hạn — dùng Tử Mẫu Lệnh (Kỳ Trân Các) để gia hạn" : "Túi tử mẫu chưa khai mở — dùng Tử Mẫu Lệnh (Kỳ Trân Các) để khai mở");
    return (h.tuiTM = h.tuiTM || []);
  }
  r = r | 0;
  if (!r) return h.ruong;
  if (r < 0 || r > (h.ruongMo | 0)) loi("Chưa mở rương này — mua rương mở rộng ở Thẩm Cửu, Ba Lăng");
  h.ruongPhu = h.ruongPhu || [];
  return (h.ruongPhu[r - 1] = h.ruongPhu[r - 1] || []);
}
const giaGoc = (k) => (VK && laVuKhi(k) ? (VK.gia || [])[((GOC[k] || {}).cl || 1) - 1] || 0 : (GOC[k] || {}).price || 0);
const benCua = (it) => (it.ben == null ? benMax(it.k) : it.ben);
// món có dòng xanh "Không thể phá hủy" (indestructible_b — ở dòng nào cũng được, kích hay chưa): không mòn (anh 30/10 — engine KItem::SetAttrib)
const khongPha = (d) => Array.isArray(d) && d.some((e) => e && e[0] === "indestructible_b");

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const need = (lvl) => CHR.exp[lvl - 1] || Infinity;
function chonTrongSo(w) { // { khóa: trọng số } hoặc [trọng số] -> khóa / chỉ số
  const e = Array.isArray(w) ? w.map((v, i) => [i, v]) : Object.entries(w);
  let r = Math.random() * e.reduce((t, [, v]) => t + v, 0);
  for (const [k, v] of e) { r -= v; if (r < 0) return k; }
  return e[e.length - 1][0];
}

// ---------- món ----------
const capDo = (k) => (GOC[k] || {}).cl || 1;
// Gieo n dòng xanh cho món loại t, cấp đồ cl, ngũ hành s. Mỗi dòng: cấp dòng M trong [1, cl + capDong.cong] (tối đa 10) — capDongNgauNhien;
// mỗi loại thuộc tính lấy dòng client cấp cao nhất ≤ M (khoảng số của cấp đó); chọn loại theo trọng số client của dòng ấy trên loại món t; số
// trong khoảng — soTrongKhoang. Không gieo được dòng ở vị trí nào (vd hệ món không có hậu tố nào) thì dừng — giữ đúng vị trí tiền tố / hậu tố.
// Anh 28/10 lần 7 ("đồ có khoảng min max mà drop dòng max và cận max khá nhiều — chia sao cho đồ ra được có giá trị, vui khi ra món ngon"): bản
// trước cấp dòng đều trên [1, top], số đều trong khoảng -> đồ cấp 7–10 có ~11 % số dòng ≥ 90 % mức cao nhất của thuộc tính. Nay cấp dòng theo
// hình chuông lệch (cau-hinh.json dongXanh: tâm = cấp đồ − tamLech − (cấp đồ − tuCap, nếu dương) × luiCapCao; trên tâm hẹp sigmaTren, dưới rộng
// sigmaDuoi), số lệch về thấp (u^muGiaTri): trung bình gần như cũ, dòng ≥ 90 % còn ~1,5–2 %, chạm mức cao nhất ~1,7 % (mô phỏng 28/10)
const DXC = { tamLech: -0.5, tuCap: 6, luiCapCao: 0.9, sigmaTren: 1.1, sigmaDuoi: 2.5, muGiaTri: 2.7, mayManGiaTri: 0.5, ...(CFG.dongXanh || {}) };
function capDongNgauNhien(cl, top) {
  const mu = clamp(cl - DXC.tamLech - Math.max(0, cl - DXC.tuCap) * DXC.luiCapCao, 1, top), w = [];
  for (let m = 1; m <= top; m++) { const sg = m > mu ? DXC.sigmaTren : DXC.sigmaDuoi; w.push(Math.exp(-((m - mu) ** 2) / (2 * sg * sg))); }
  return 1 + chonTrongSo(w);
}
// may mắn (anh 31/10 "tăng tỉ lệ rơi đồ + chỉ số có thể roll cao hơn mức trung bình 1 tí" — tỉ lệ rơi: taoDo): số mũ chia cho 1 + may mắn (tối đa
// mayManToiDa) / 100 × mayManGiaTri — 60 may mắn: trung bình ~27 % -> ~33 % khoảng của dòng, mức cao nhất vẫn hiếm
const soTrongKhoang = (lo, hi, luck = 0) => lo + Math.min(hi - lo, Math.floor((hi - lo + 1) * Math.random() ** (DXC.muGiaTri / (1 + (Math.min(Math.max(0, luck), CFG.mayManToiDa) / 100) * DXC.mayManGiaTri))));
function gieoDong(t, cl, s, n, luck = 0) {
  const d = [], used = new Set(), top = Math.min(10, cl + CFG.capDong.cong);
  for (let i = 0; i < n; i++) {
    const pre = i % 2 === 0 ? 1 : 0, M = capDongNgauNhien(cl, top), best = new Map();
    for (const r of ROWS[t] || []) {
      if (r.pre !== pre || r.lv > M || used.has(r.a) || (!pre && r.se !== s)) continue;
      const c = best.get(r.a); if (!c || r.lv > c.lv) best.set(r.a, r);
    }
    const cands = [...best.values()]; if (!cands.length) break;
    const r = cands[chonTrongSo(cands.map((x) => x.w[t]))];
    used.add(r.a); d.push([r.k, soTrongKhoang(r.p[0][0], r.p[0][1], luck)]);
  }
  return d;
}
const capYeuCau = (it) => (GOC[it.k] || {}).lv || 1;
// ---------- Mua lại đồ đã bán cho NPC (anh 13/11 lượt 88 — "cho phép mua lại trang bị đã bán vào npc như thợ rèn, hiệu thuốc, tạp hóa … item bán rồi sẽ nằm ở đó
// 5p trước khi mất, giá mua lại *50 lần giá gốc, thêm câu khịa") ----------
// h.muaLai = [{ it: món đúng như lúc bán, gia: giá mua lại, het: ms hết hạn }] (mới nhất trước, tối đa toiDa) — món bán ở cửa hàng (act ban) và Trợ Thủ tự bán ở thành
// (act thanh); bán ở bãi lúc ủy thác (món chưa từng vào túi) thì không. Giá = số tiền đã nhận × heSo. Số ở cau-hinh.json muaLai (F10 Cấu hình)
const MUA_LAI = { phut: 5, heSo: 50, toiDa: 30, ...(CFG.muaLai || {}) };
const CAU_KHIA = "Bán rồi còn đòi lại à? Vậy thì phải trả cái giá tương xứng nhé đại hiệp, hahaha!";
function giuMuaLai(h, it, p) {
  if (!(p > 0) || !it) return;
  const t = Date.now(), moi = { ...it }; delete moi.x; delete moi.y;
  const cu = (Array.isArray(h.muaLai) ? h.muaLai : []).filter((x) => x && x.it && x.het > t);
  h.muaLai = [{ it: moi, gia: Math.max(1, Math.round(p * Math.max(1, +MUA_LAI.heSo || 50))), het: t + Math.max(1, +MUA_LAI.phut || 5) * 60000 }, ...cu].slice(0, Math.max(1, MUA_LAI.toiDa | 0 || 30));
}
// danh sách gửi trình duyệt (api.js tuiCua): [{ it, gia, het }] — còn hạn; giữ nguyên dạng (soát lượt 88: trải phẳng thì het đè hạn sử dụng riêng của món — ô xem món
// hiện "Hạn sử dụng còn 0 giờ"); tuiCua gửi kèm giờ máy chủ mlGio để trình duyệt bù lệch đồng hồ
const muaLaiGui = (h) => { const t = Date.now(); return (Array.isArray(h.muaLai) ? h.muaLai : []).filter((x) => x && x.it && x.het > t).map((x) => ({ it: x.it, gia: x.gia, het: x.het })); };
// tiền như client: "2 vạn 4499 lượng", "1 ức 2345 vạn lượng" (1 vạn = 10.000; 1 ức = 1 trăm triệu — stringtable G_PLAYERTONG_15).
// GIỐNG src/game/money.js (trình duyệt).
function tien(n) {
  const neg = n < 0; n = Math.floor(Math.abs(n));
  const uc = Math.floor(n / 1e8), van = Math.floor((n % 1e8) / 1e4), luong = n % 1e4, p = [];
  if (uc) p.push(uc + " ức"); if (van) p.push(van + " vạn"); if (luong || !p.length) p.push(String(luong));
  return (neg ? "-" : "") + p.join(" ") + " lượng";
}
// bán thuốc lại cho NPC: giá mua × banLai mỗi bình
const giaBan = (it) => laKtc(it) || it.het || it.tk || it.vv ? 0 : xepChong(it) ? Math.floor(BY.get(it.k).gia * TC.banLai) * it.n : Math.round(CFG.giaBan * (it.m || 1) * (1 + 2 * it.d.length));
const tenMon = (it) => (BY.get(it.k) || {}).n || it.k;
// danh sách món cho nhật ký chung (anh 18/11 — hạ Boss Sát thủ / đầu lĩnh Phong Lăng Độ): "2 Trung Dược, Ngọc bội (3 dòng)"
const chuMon = (its) => its.map((it) => `${it.n > 1 ? it.n + " " : ""}${String(tenMon(it)).trim()}${(it.d || []).length ? ` (${it.d.length} dòng)` : ""}`).join(", ");

// cấp đồ của món rơi từ quái cấp L (bảng rơi thường của client: MinItemLevel 1 / MinScale 20, MaxItemLevel 10 / MaxScale 10 —
// game-moi docs/nghien-cuu/quai-roi-do.md mục 7b); trùm bãi lấy mức cao nhất của khoảng
function capDoRoi(L, boss) {
  const hi = clamp(Math.floor(L / CFG.capDo.chiaTren), 1, 10), lo = clamp(Math.floor(L / CFG.capDo.chiaDuoi), 1, hi);
  return boss ? hi : ri(lo, hi);
}
// món mới rơi từ quái cấp L (trùm: bảng trùm; p0: tỉ lệ rơi riêng — tinh anh mỗi lượt); null = không rơi
function taoDo(L, boss, luck, p0) {
  const p = (p0 ?? (boss ? CFG.roiDo.trum : CFG.roiDo.quaiThuong)) * (1 + Math.min(luck, CFG.mayManToiDa) / 100);
  if (Math.random() >= p) return null;
  const t = chonTrongSo(CFG.loaiDo), T = BY_TYPE[t];
  if (!T) return null;
  let cl = capDoRoi(L, boss);
  while (cl > 1 && !T[cl]) cl--; // loại món thiếu cấp đó -> cấp gần nhất bên dưới
  const list = T[cl] || T[Object.keys(T)[0]], x = list[Math.floor(Math.random() * list.length)];
  let n = chonTrongSo(boss ? CFG.soDong.trum : CFG.soDong.quaiThuong);
  if (!n && JEWEL.has(+t)) n = 1;
  const s = ri(0, 4);
  return NG.gan({ k: x.k, s, d: n ? gieoDong(x.t, capDo(x.k), s, n, luck) : [], m: L }, "roi", `${boss ? "Trùm" : "Quái"} cấp ${L}`);
}
// bãi của đồ rơi (nguồn gốc món — "Quái cấp 85" -> "Quái cấp 85 · Tên bãi")
function ngBai(it, z) { const b = tenBai(z); if (b && it && Array.isArray(it.ng) && it.ng[0] === "roi" && !it.ng[1].includes(" · ")) it.ng = [it.ng[0], `${it.ng[1]} · ${b}`.slice(0, 80), it.ng[2], it.ng[3]]; return it; }

// ---------- Bảo rương đồ xanh (anh 04/11: "server chủ yếu là đồ xanh, ngoài đi train ra thì không còn nguồn nào khác để nhận" -> rương đồ xanh:
// "mở ra món ít nhất là 3 dòng, cứ thế giảm tỉ lệ cho đến 6 dòng; dòng thuộc tính theo quy tắc mình làm như trước"; anh chọn cột Vừa: 3 / 4 / 5 /
// 6 dòng = 70 / 22 / 7 / 1 %) — cau-hinh.json ruongXanh. Client VNG không có món này (món các server riêng tự làm): khóa ms:1884 = Lam Bảo Rương
// của client (hình rương xanh 1 ô) đổi tên ở cong-cu/dung-ky-tran-cac.js. Món mở ra: loại món theo trọng số đồ rơi (loaiDo), ngũ hành ngẫu
// nhiên, cấp món = cấp nhân vật / capDo.chiaTren như trùm bãi cùng cấp rơi (capDoRoi), dòng gieo y như đồ rơi (gieoDong — may mắn người mở);
// món nào không đủ chỗ cho số dòng đã quay (vd hệ đó thiếu hậu tố) thì gieo lại món khác ----------
const RXC = { k: "ms:1884", soDong: [0, 0, 0, 70, 22, 7, 1], oTrong: 6, khoaGio: 72, ...(CFG.ruongXanh || {}) };
// rương đang khóa bảo hiểm -> món mở ra khóa có hạn RXC.khoaGio giờ tính từ lúc mở (anh 11/11 — KBH_TAM); rương không khóa -> món không khóa
const khoaRuong = (it) => (it && it.kbh ? { kbh: KBH_TAM, kbhHet: Date.now() + Math.round((+RXC.khoaGio || 72) * 3600e3) } : {});
// số ô trống của túi 6 × 10 (trừ ô các món đang chiếm) — như CalcFreeItemCellCount của script client
const oTrongTui = (h) => BAG_W * BAG_H - (h.bag || []).reduce((t, o) => { const [w, c] = coMon(o); return t + w * c; }, 0);
function monRuongXanh(L, luck = 0) {
  const n = chonTrongSo(RXC.soDong);
  let tot = null;
  for (let lan = 0; lan < 40; lan++) {
    const t = chonTrongSo(CFG.loaiDo), T = BY_TYPE[t];
    if (!T) continue;
    let cl = capDoRoi(L, true);
    while (cl > 1 && !T[cl]) cl--;
    const list = T[cl] || T[Object.keys(T)[0]], x = list[Math.floor(Math.random() * list.length)], s = ri(0, 4);
    const it = NG.gan({ k: x.k, s, d: gieoDong(x.t, capDo(x.k), s, n, luck), m: L }, "ruong", tenRuongXanh());
    if (it.d.length >= n) return it;
    if (!tot || it.d.length > tot.d.length) tot = it;
  }
  return tot;
}
// rương thưởng hoạt động (Vượt Ải xong trọn ải, Phong Hỏa thắng — anh 04/11): cộng vào h.rxCho (máy chủ giữ — api.js GIU), nhịp sau tự vào túi
// (nhanRuongCho); túi đầy thì chờ (báo 1 lần — h.rxDay), dọn túi là vào, không mất. Trả "n Bảo rương đồ xanh" | "". Món mở rương không vừa chỗ
// (dungVat ruongXanh) chờ ở h.rxMon, cũng vào túi ở nhịp khi có chỗ
const tenRuongXanh = () => String((BY.get(RXC.k) || {}).n || "Bảo rương đồ xanh").trim();
function choRuongXanh(h, n) {
  n = Math.max(0, n | 0); if (!n) return "";
  h.rxCho = (h.rxCho | 0) + n;
  return `${n} ${tenRuongXanh()}`;
}
// trả [câu báo] | null — còn món / rương thiếu chỗ thì báo 1 lần (h.rxDay) tới khi nhận hết
function nhanRuongCho(h) {
  const x = BY.get(RXC.k), tin = [];
  let thieu = false;
  if (Array.isArray(h.rxMon) && h.rxMon.length) {
    const con = [];
    for (const it of h.rxMon) {
      const m = { ...it }, at = choDau(h.bag, m);
      if (!at) { con.push(it); continue; }
      [m.x, m.y] = at; m.u = ++h.uN; h.bag.push(m);
      tin.push(`${tenMon(m).trim()} (${(m.d || []).length} dòng) mở từ ${tenRuongXanh()} đã vào túi`);
    }
    if (con.length) { h.rxMon = con; thieu = true; } else delete h.rxMon;
  }
  const n = h.rxCho | 0;
  if (n > 0 && x) {
    try { themChong(h, x, n); delete h.rxCho; tin.push(`Bạn nhận được ${n} ${tenRuongXanh()}`); } catch { thieu = true; }
  }
  if (!thieu) delete h.rxDay;
  else if (!h.rxDay) {
    h.rxDay = 1;
    const ds = [(h.rxCho | 0) > 0 ? `${h.rxCho} ${tenRuongXanh()}` : "", ...(h.rxMon || []).map((m) => tenMon(m).trim())].filter(Boolean).join(", ");
    tin.push(`Hành trang không đủ chỗ — còn ${ds} chờ nhận, dọn túi là tự vào`);
  }
  return tin.length ? tin : null;
}

// Túi 6 × 10 ô: mỗi món GIỮ ĐÚNG VỊ TRÍ của nó (it.x, it.y = ô trên trái) như client — bán / mặc đi thì để trống chỗ đó, không tự xếp
// lại (anh muốn 25/10). Món mới vào ô trống đầu tiên đủ chỗ (từ trên xuống, trái sang).
const coMon = (it) => (BY.get(it.k) || {}).c || [1, 1];
// (x, y) đặt được món it không (bỏ qua các món trong bo — vd chính nó)
function choTrong(bag, it, x, y, bo = []) {
  const [w, h] = coMon(it);
  if (!(Number.isInteger(x) && Number.isInteger(y)) || x < 0 || y < 0 || x + w > BAG_W || y + h > BAG_H) return false;
  return bag.every((o) => bo.includes(o) || o.x == null || o.x + coMon(o)[0] <= x || x + w <= o.x || o.y + coMon(o)[1] <= y || y + h <= o.y);
}
function choDau(bag, it, bo = []) {
  for (let c = 0; c < BAG_W * BAG_H; c++) { const x = c % BAG_W, y = (c / BAG_W) | 0; if (choTrong(bag, it, x, y, bo)) return [x, y]; }
  return null;
}
// cho món vào lưới L (túi / rương — cùng 6 × 10): ở (x, y) nếu được, không thì ô trống đầu tiên; hết chỗ -> false
function vaoO(L, it, x, y) {
  const at = x != null && choTrong(L, it, x, y) ? [x, y] : choDau(L, it);
  if (!at) return false;
  [it.x, it.y] = at; L.push(it);
  return true;
}
const vaoTui = (h, it, x, y) => {
  if (it && laTB(it)) { if (!it.g) { NG.gan(it, "?", "", h.name); khongRo(h, it, "vào túi"); } else NG.chuDau(it, h.name); }
  return vaoO(h.bag, it, x, y);
};
// trang bị (nhánh cuối của chuan mon: không phải thuốc / phù / Kỳ Trân Các) — món mang nguồn gốc (nguon-mon.js)
function laTB(it) { const x = it && BY.get(it.k); return !!x && !x.thuoc && !x.phu && !x.ktc; }
// món không rõ nguồn (anh 18/11 tối): nhật ký loại "nguon" (F10 → Nhật ký) + dòng nhật ký máy — tên món, dòng, việc đang làm
function khongRo(h, it, cho) {
  const ten = tenMon(it).trim(), dong = (it.d || []).map((l) => l.join("=")).join(", "), viec = NG.ctxNay() || "ngoài yêu cầu";
  console.log(`[nguồn món] ${h && h.name}: ${ten} không rõ nguồn (${cho} — ${viec}) [${dong}]`);
  try { const NK = NKD(); NK.ghi("nguon", null, h && h.name, `Món không rõ nguồn: ${ten} (${cho} — ${viec}) [${dong}]`, { mon: [NK.mon(it)] }); } catch { /* nhật ký không làm hỏng việc */ }
}

// Phi Phong theo từng y phục (anh 13/11 lượt 86 — "phi phong bị trùng, tất cả áo mặc định k có phi phong, sau khi ăn item phi phong thì mới có phi phong, mỗi y phục chỉ
// dc ăn 1 lần, giao dịch xong phi phong sẽ đi theo áo"): it.pp = kiểu áo choàng (bộ phận mantle — 1 = 披风01) trên chính món y phục (dungVat "phiPhong"); áo đang mặc
// có pp thì hình có áo choàng. Trước (03/11): h.phiPhong của nhân vật — thay áo nào cũng còn. Nhân vật cũ còn h.phiPhong: chuyển sang y phục đang mặc (chưa có pp) 1 lần;
// chưa mặc y phục thì giữ chờ (không hiện)
const aoMac = (h) => Object.values(h.equip || {}).find((o) => o && (BY.get(o.k) || {}).g === "armor") || null;
// Lễ phục không khoác Phi Phong (anh 15/11 — "nhận áo từ hệ thống nó vẫn có phi phong mặc định … ăn thử phi phong vào thì nó lại ra cái màu xanh nữa,
// thành ra bị đè lên"): kiểu áo 43–46 là hình LIỀN cả bộ của client (躯体 ma_lf_00..03 / fm_lf_00..03 — không vai / tay riêng): Kinh Thiên giáp
// (nam) vẽ sẵn áo choàng đỏ, các bộ còn lại (Phong Trang, Thanh Tuyệt Y, Nhận áo mới, áo mừng tuổi, Phụng quần, Khấp Địa quần, Băng Tinh Quần) là
// áo dài lễ phục -> áo choàng 披风01 chồng lên. Không cho kích hoạt, không vẽ (áo đã lỡ kích hoạt: giữ pp, chỉ không hiện).
// GIỐNG src/char/jx-char.js LE_PHUC — sửa thì sửa cả 2.
const LE_PHUC = new Set([43, 44, 45, 46]);
const laLePhuc = (ao) => !!ao && LE_PHUC.has((BY.get(ao.k) || {}).id);
function kieuDang(h) {
  const L = {};
  for (const it of Object.values(h.equip || {})) { const x = BY.get(it.k); if (x && x.g && x.id != null) L[x.g] = x.id; }
  const ao = aoMac(h);
  if (h.phiPhong && ao && !laLePhuc(ao)) { if (!ao.pp) ao.pp = h.phiPhong | 0 || 1; delete h.phiPhong; }
  if (ao && ao.pp > 0 && !laLePhuc(ao)) L.mantle = ao.pp;
  return L;
}
// may mắn từ đồ đang mặc (chỉ dòng có tác dụng — "May mắn" là hậu tố, phải được kích)
function mayMan(h, key) {
  let n = 0;
  for (const [slot, it] of Object.entries(h.equip || {})) {
    if (it.ben === 0) continue; // độ bền 0: không còn tác dụng
    const kich = soKich(h, slot, it);
    it.d.forEach(([k, v], i) => { if (k === "lucky_v" && coTacDung(i, kich)) n += v; });
  }
  if (key) for (const b of Object.keys(buffCon(h, key))) n += (KTC.buff[b] || {}).mayMan || 0; // Thiên Sơn Bảo Lộ +10, Quế Hoa Tửu +20
  return n;
}

// ---------- trạng thái từ vật phẩm Kỳ Trân Các (anh 27/10): h.buff = { x2 | mm10 | mm20: giây còn } ----------
// x2 = Tiên Thảo Lộ (kinh nghiệm đánh quái × 2 — trạng thái 440 của client), mm10 / mm20 = may mắn (Thiên Sơn Bảo Lộ / Quế Hoa Tửu). Giờ chỉ
// trôi lúc đang chơi (mỗi nhịp trừ tối đa 5 giây — như client: thời gian trạng thái tính theo vòng game lúc online; ủy thác không tính).
// Phần đã trừ chưa ghi giữ trong bộ nhớ (BUFF_TRU) tới lần ghi file kế tiếp (nhịp ghi mỗi phút, khi có trạng thái hết hạn, hoặc khi dùng
// thêm vật phẩm) — tắt máy chủ thì mất tối đa 1 phút đã trôi.
const BUFF_TRU = new Map(); // "tài khoản|ô" -> { luc, tru }
function buffCon(h, key) {
  const m = BUFF_TRU.get(key), tru = m ? m.tru : 0, o = {};
  for (const [k, v] of Object.entries(h.buff || {})) if (v - tru > 0) o[k] = Math.ceil(v - tru);
  return o;
}
// hệ số kinh nghiệm đánh quái của trạng thái đang còn: Tiên Thảo Lộ (x2) × Nến Bát Trân Phúc Nguyệt (nen — anh 16/11 — Báo Đáp Ân Sư, D11: nhân với nhau = × 4)
function knBuff(h, key) {
  const B = buffCon(h, key);
  let k = B.x2 ? (KTC.buff.x2 || {}).kinhNghiem || 2 : 1;
  if (B.nen) { try { k *= +BD().heSoNen() || 1; } catch (e) { console.error("Báo Đáp Ân Sư — Nến:", e.message); } }
  return k;
}
// đang đứng trong sân Lôi Đài Công Bình Tử (bãi nhịp báo — BAI_NAY): trạng thái vật phẩm tạm mất tác dụng (anh 17/11 "các hiệu ứng có trước từ ngoài sẽ không có tác dụng,
// tự động mất hiệu lực — rời khỏi công bình tử sẽ tiếp tục có tác dụng"; trình duyệt world.js bonus không cộng) -> giờ không trôi, rời sân trôi tiếp
const trongSanLd = (key) => { try { return LDA().laSan(BAI_NAY.get(key)); } catch { return false; } };
// mỗi nhịp (ghiSap: nhịp này sẽ ghi file -> trừ hẳn vào h.buff). Trả true khi cần ghi (vừa có trạng thái hết hạn)
function buffDem(h, key, ghiSap) {
  if (!h.buff || !Object.keys(h.buff).length) { BUFF_TRU.delete(key); if (h.buff) delete h.buff; return false; }
  const t = Date.now(), m = BUFF_TRU.get(key) || { luc: t, tru: 0 };
  if (!trongSanLd(key)) m.tru += Math.min(5, Math.max(0, (t - m.luc) / 1000)); // trong sân Công Bình Tử: dừng giờ
  m.luc = t; BUFF_TRU.set(key, m);
  const het = Object.values(h.buff).some((v) => v - m.tru <= 0);
  if (!het && !ghiSap) return false;
  for (const k of Object.keys(h.buff)) { h.buff[k] = Math.round(h.buff[k] - m.tru); if (h.buff[k] <= 0) delete h.buff[k]; }
  m.tru = 0;
  if (!Object.keys(h.buff).length) delete h.buff;
  return true;
}

function chuan(h) {
  if (!h) return false;
  const truoc = JSON.stringify([h.bag, h.equip, h.looks, h.uN, h.ruong, h.tienRuong, h.ruongPhu, h.books, h.sachV, h.tuiTM, h.chongV]);
  h.uN = h.uN | 0;
  const seen = new Set(), t0 = Date.now(), moKhoa = []; // moKhoa: tên món khóa có hạn vừa hết giờ (KBH_TAM)
  // nguồn gốc món (anh 18/11 tối): nhân vật chuẩn hóa lần đầu sau bản này (chưa có ngV) -> trang bị chưa có mã là đồ cũ ("cu"); đã có ngV mà vẫn gặp món
  // chưa có mã -> món vào túi / rương không qua chỗ tạo món nào đã gắn nguồn: "?" + nhật ký (khongRo)
  const ngCu = !h.ngV;
  const mon = (v) => {
    let o = typeof v === "string" ? { k: v } : v && typeof v === "object" ? v : null;
    const cu = o && BY.get(o.k); if (cu && cu.doi) o = { ...o, k: cu.doi }; // món đổi khóa (Sát thủ giản có hệ -> không hệ, 02/11 khuya)
    const x = o && BY.get(o.k);
    if (!x) return null;
    if (o.het && +o.het <= Date.now()) return null; // hết hạn (ngựa từ mã bài — 30 ngày): biến mất
    let u = o.u | 0; if (!u || seen.has(u)) u = ++h.uN; seen.add(u); if (u > h.uN) h.uN = u;
    const at = Number.isInteger(o.x) && Number.isInteger(o.y) ? { x: o.x, y: o.y } : {};
    let kb = voiKhoa(o.kbh); // khóa bảo hiểm (anh 05/11) — giữ cho mọi loại món
    // khóa có hạn (anh 11/11 — KBH_TAM): còn hạn giữ cả giờ mở khóa; hết hạn bỏ khóa + ghi tên để nhịp báo
    if ((o.kbh | 0) === KBH_TAM && +o.kbhHet > 0) { if (+o.kbhHet <= t0) { kb = {}; moKhoa.push(tenMon(o).trim()); } else kb = { kbh: KBH_TAM, kbhHet: +o.kbhHet }; }
    if (x.thuoc || x.phu) { const n = clamp(o.n | 0, 0, chongMax(o.k)); return n ? { u, k: o.k, n, ...kb, ...(o.tk && x.thuoc ? { tk: 1 } : {}), ...at } : null; }
    if (x.ktc) { // Kỳ Trân Các: chồng n món; lễ bao Hồi Thiên: 1 bao, con = số viên còn
      if (laLeBao(o)) { const con = clamp(o.con ?? x.dung.so, 0, x.dung.so); return con ? { u, k: o.k, n: 1, con, ...kb, ...at } : null; }
      // Kim Tê (anh 31/10): con = điểm độ bền còn của viên đang dùng (chưa dùng: đủ dung.ben), các viên khác trong chồng còn đủ
      const kt = x.dung && x.dung.loai === "kimTe" && o.con != null ? { con: clamp(Math.floor(+o.con) || 0, 1, x.dung.ben) } : {};
      // het: món có hạn (Huân công bài Tống Kim — hết hạn 24:00 ngày hôm sau, anh 06/11): giữ hạn, quá hạn thì biến mất (trên)
      return { u, k: o.k, n: clamp((o.n | 0) || 1, 1, chongMax(o.k)), ...kt, ...(o.het ? { het: +o.het } : {}), ...kb, ...at };
    }
    // ngũ hành: mọi trang bị (ngựa: hệ cố định của bảng client); món cũ chưa có -> gieo
    const fixed = (GOC[o.k] || {}).series ?? (x.t === 10 && x.s >= 0 ? x.s : null);
    const s = fixed ?? (Number.isInteger(o.s) && o.s >= 0 && o.s <= 4 ? o.s : ri(0, 4));
    let d = (Array.isArray(o.d) ? o.d : []).filter((e) => Array.isArray(e) && Number.isFinite(+e[1])).map(([k, v]) => [k, +v]);
    // đồ rơi trước khi dòng xanh theo client (25/10: khóa tự đặt "life", "dmgPct"…) -> gieo lại theo bảng client, giữ số dòng
    if (d.some(([k]) => !KEYS.has(k))) d = gieoDong(x.t, capDo(o.k), s, d.length);
    // độ bền còn (đầy: bỏ); món có dòng "Không thể phá hủy" luôn đầy (engine KItem::SetAttrib: SetDurability(-1) — không bao giờ mòn)
    const mx = benMax(o.k), ben = mx && !khongPha(d) && Number.isFinite(+o.ben) && +o.ben < mx ? clamp(Math.floor(+o.ben), 0, mx) : null;
    // pp: Phi Phong đã kích hoạt trên y phục này (lượt 86 — đi theo món khi giao dịch / bày bán / cất rương)
    // vv: ngựa vĩnh viễn từ mã bài (anh 16/11 — Báo Đáp Ân Sư — dungVat ngua vinhVien): không hạn, không bán cho cửa hàng
    // nd: số dòng gốc của món đã qua Lam Thủy Tinh / Hoán Linh Thạch sang hệ ít dòng hơn (anh 17/11 — may-chu/kham-nam.js: đổi về hệ đủ dòng thì Lam gieo lại đủ)
    const ng = NG.sach(o);
    if (!ng.g) { const t = { k: o.k, s, d }; if (ngCu) NG.cu(t); else { NG.gan(t, "?", "", h.name); khongRo(h, t, "chuẩn hóa"); } ng.g = t.g; ng.ng = t.ng; }
    else if (!ng.ng[3] && ng.ng[0] !== "cu" && h.name) ng.ng[3] = String(h.name).slice(0, 40); // người có đầu tiên (món nhặt dưới đất / chờ nhận)
    return { u, k: o.k, s, d, m: o.m || x.lv || 1, ...ng, ...(ben != null ? { ben } : {}), ...(o.het ? { het: +o.het } : {}), ...(o.dt ? { dt: 1 } : {}), ...(o.vv && !o.het ? { vv: 1 } : {}), ...(+o.pp > 0 ? { pp: clamp(o.pp | 0, 1, 99) } : {}), ...((o.nd | 0) > d.length ? { nd: clamp(o.nd | 0, 1, 6) } : {}), ...kb, ...at };
  };
  const eq = {};
  for (const [s, v] of Object.entries(h.equip || {})) { const it = mon(v); if (it && !laThuoc(it)) { delete it.x; delete it.y; eq[s] = it; } }
  h.equip = eq;
  // túi: giữ vị trí đã có (đúng chỗ, không chồng); món chưa có vị trí / chồng lên món khác -> ô trống đầu tiên; hết chỗ thì bỏ
  const list = (Array.isArray(h.bag) ? h.bag : []).map(mon).filter(Boolean);
  h.bag = [];
  for (const it of list.filter((o) => o.x != null)) { const { x, y } = it; delete it.x; delete it.y; vaoTui(h, it, x, y); }
  for (const it of list.filter((o) => o.x == null)) vaoTui(h, it);
  // rương: như túi
  const rl = (Array.isArray(h.ruong) ? h.ruong : []).map(mon).filter((o) => o && !o.tk); // thuốc Tống Kim không ở rương (phòng hờ)
  h.ruong = [];
  for (const it of rl.filter((o) => o.x != null)) { const { x, y } = it; delete it.x; delete it.y; vaoO(h.ruong, it, x, y); }
  for (const it of rl.filter((o) => o.x == null)) vaoO(h.ruong, it);
  h.tienRuong = Math.max(0, Math.floor(+h.tienRuong || 0));
  // mua lại (lượt 88): bỏ món quá hạn / mã món lạ
  if (h.muaLai) { const t1 = Date.now(), L = (Array.isArray(h.muaLai) ? h.muaLai : []).filter((x) => x && x.it && BY.get(x.it.k) && x.het > t1 && x.gia > 0).slice(0, Math.max(1, MUA_LAI.toiDa | 0 || 30)); if (L.length) h.muaLai = L; else delete h.muaLai; }
  // rương mở rộng: như rương chính
  h.ruongMo = clamp(h.ruongMo | 0, 0, RG.moRong.length);
  if (h.ruongMo || h.ruongPhu) h.ruongPhu = Array.from({ length: h.ruongMo }, (_, i) => {
    const L = ((h.ruongPhu || [])[i] || []).map(mon).filter((o) => o && !o.tk), R = [];
    for (const it of L.filter((o) => o.x != null)) { const { x, y } = it; delete it.x; delete it.y; vaoO(R, it, x, y); }
    for (const it of L.filter((o) => o.x == null)) vaoO(R, it);
    return R;
  });
  h.looks = kieuDang(h);
  // sách võ công (anh 27/10): chiêu 90 / 120 / 150 chỉ học bằng sách (h.books — máy chủ giữ). Nhân vật có trước: chiêu sách đã cộng điểm coi
  // như đã đọc sách (1 lần — sachV)
  if (!h.sachV) { const B = new Set(h.books || []); for (const [id, lv] of Object.entries(h.skills || {})) if ((lv | 0) > 0 && CHIEU_SACH.has(+id)) B.add(+id); h.books = [...B]; h.sachV = 1; }
  if (h.tuiTM) { // túi tử mẫu: như rương
    const L = h.tuiTM.map(mon).filter((o) => o && !o.tk), R = []; // thuốc Tống Kim không ở túi tử mẫu (phòng hờ)
    for (const it of L.filter((o) => o.x != null)) { const { x, y } = it; delete it.x; delete it.y; vaoO(R, it, x, y); }
    for (const it of L.filter((o) => o.x == null)) vaoO(R, it);
    h.tuiTM = R;
  }
  // món có chồng riêng (thuoc.chongRieng — anh 02/11: Mật đồ thần bí tới 9999; khuya: Sát Thủ lệnh / giản): dồn các chồng sẵn có 1 lần — túi,
  // rương, rương mở rộng, túi tử mẫu (chongV 2; bản 1 chỉ dồn túi), sau đó tự tách ra vẫn giữ nguyên
  // chongV 3 (anh 09/11 "sát thủ lệnh đang bị phân hóa cấp độ, thành ra rất chật rương"): Sát Thủ lệnh mọi cấp, mọi hệ đã đổi về 1 khóa ms:399 (doi) -> dồn lại 1 lần
  if ((h.chongV | 0) < 3) { for (const L of [h.bag, h.ruong, ...(h.ruongPhu || []), ...(h.tuiTM ? [h.tuiTM] : [])]) for (const k of new Set(L.map((o) => o.k))) if (chongRieng(k)) donChongL(L, k); h.chongV = 3; }
  if (moKhoa.length) h.kbhMoTin = [...(Array.isArray(h.kbhMoTin) ? h.kbhMoTin : []), ...moKhoa].slice(-20); // nhịp (api.js) báo + gửi túi mới rồi xóa
  const ngMoi = !h.ngV; h.ngV = 1; // nguồn gốc món: đã gắn "cu" cho đồ có từ trước
  return ngMoi || JSON.stringify([h.bag, h.equip, h.looks, h.uN, h.ruong, h.tienRuong, h.ruongPhu, h.books, h.sachV, h.tuiTM, h.chongV]) !== truoc;
}

// ---------- vật trên đất (25/10, anh: nhân vật phải đi tới chỗ rơi nhặt mới có — tự đánh thì tự đi nhặt) ----------
// Quái của ai người nấy đánh -> mỗi nhân vật 1 danh sách vật riêng, giữ trong bộ nhớ máy chủ: { g, z (bãi), x, y (px bản đồ web), t (lúc
// rơi), tien | it (món), vut (món tự vứt ra) }. Nằm TD.giay giây (client: LifeTime 2400 vòng ≈ 133 giây) rồi mất, tối đa TD.toiDa vật (cũ
// nhất mất trước). Tắt / bật lại máy chủ thì vật đang nằm trên đất mất hết.
// Món người chơi tự vứt ra (anh 30/10: "người chơi vứt đồ ra sàn mà người khác cùng máy chủ không thấy"): nằm ở danh sách CHUNG của bãi — ai đứng
// cùng bãi cũng thấy, ai nhặt trước người đó được (engine ServerThrowAwayItem: SetItemBelong(-1) — vật không thuộc ai); cùng TD.giay / TD.toiDa.
// verChung tăng mỗi lần có vứt / nhặt / hết hạn -> nhịp gửi lại danh sách chung của bãi (api.js nhip: dv -> dc)
const DAT = new Map(); // "tài khoản|ô" -> [vật]
const CHUNG = new Map(); // mã bãi -> [vật tự vứt ra]
let verChung = 0;
// bãi đang đứng của từng nhân vật đang chơi (nhịp báo — api.js nhip): Kỳ Trân Các chỉ mua ở thành / thôn (anh 28/10 lần 3)
const BAI_NAY = new Map(); // "tài khoản|ô" -> mã bãi
const THANH = new Set(["thành", "thôn"]);
const baiNay = (key, z) => { if (z != null) BAI_NAY.set(key, z | 0); };
let gN = 0;
function datCua(key) { const t = Date.now(), L = (DAT.get(key) || []).filter((v) => t - v.t < TD.giay * 1000); DAT.set(key, L); return L; }
function roiDat(key, v) { const L = datCua(key); v.g = ++gN; v.t = Date.now(); L.push(v); if (L.length > TD.toiDa) L.shift(); return v.g; }
const toaDo = (v) => (Number.isFinite(+v) ? Math.round(+v) : 0);
// vật -> gửi trình duyệt
const datTin = (v) => ({ g: v.g, x: v.x, y: v.y, tuoi: (Date.now() - v.t) / 1000, ...(v.tien ? { tien: v.tien } : { k: v.it.k, n: tenMon(v.it), d: (v.it.d || []).length, ...(v.it.d && v.it.d.length ? { dl: v.it.d } : {}), ...(laKtc(v.it) ? { db: 1 } : {}) }) });
function datBai(key, z) { return datCua(key).filter((v) => v.z === (z | 0)).map(datTin); }
// danh sách chung của bãi z (bỏ vật hết hạn); roiChung: món vừa vứt ra
function chungCua(z) {
  const t = Date.now(), L0 = CHUNG.get(z) || [], L = L0.filter((v) => t - v.t < TD.giay * 1000);
  if (L.length !== L0.length) verChung++;
  if (L.length) CHUNG.set(z, L); else CHUNG.delete(z);
  return L;
}
function roiChung(v) { const L = chungCua(v.z); v.g = ++gN; v.t = Date.now(); L.push(v); if (L.length > TD.toiDa) L.shift(); CHUNG.set(v.z, L); verChung++; return v.g; }
// nhịp (api.js): trình duyệt đang có bản dv của danh sách chung -> bản mới { v, ds: vật chung của bãi z } | null (chưa đổi)
function datChung(z, dv) { const ds = chungCua(z | 0).map(datTin); return dv === verChung ? null : { v: verChung, ds }; }
// nhặt: ds = [g, …] -> { nhan: [{ g, n, d, sl? }], tien, vang: [g] (tiền đã nhặt), day: [g] (túi đầy — vật vẫn nằm đó), mat: [g] (đã mất —
// cả món người khác vừa nhặt trước), bao: [món 5+ dòng] }. Tìm ở vật riêng của nhân vật trước, rồi vật chung của bãi đang đứng
function nhat(h, key, ds) {
  const L = datCua(key), z = BAI_NAY.get(key), C = z != null ? chungCua(z) : [], kq = { nhan: [], tien: 0, vang: [], day: [], du: [], mat: [], bao: [] };
  for (const g of Array.isArray(ds) ? ds.slice(0, 60) : []) {
    let Q = L, j = L.findIndex((v) => v.g === (g | 0));
    if (j < 0) { Q = C; j = C.findIndex((v) => v.g === (g | 0)); }
    if (j < 0) { kq.mat.push(g | 0); continue; }
    const v = Q[j], bo = () => { Q.splice(Q.indexOf(v), 1); if (Q === C) verChung++; };
    if (v.tien) { h.gold = (h.gold || 0) + v.tien; kq.tien += v.tien; kq.vang.push(v.g); bo(); continue; }
    if (BUA.mon[v.it.k]) { bo(); const r = nhatBua(h, key, v.it); kq.nhan.push({ g: v.g, n: tenMon(v.it), d: 0, db: 1, bua: 1, tin: r.tin, ...(r.hoi ? { hoi: r.hoi } : {}) }); continue; } // bùa Phong Hỏa: nhặt là dùng ngay
    if ((BY.get(v.it.k) || {}).chi) { bo(); kq.nhan.push({ g: v.g, n: tenMon(v.it), d: 0, db: 1, tin: nhatChi(h, v.it, v.z) }); continue; } // đồ chí / lộ chí (db: món đặc biệt — trình duyệt tô màu tin)
    if (laKtc(v.it) && xepChong(v.it)) { // mật đồ, Thủy Tinh, Hộp lễ vật vượt ải …: dồn vào chồng cùng loại trong túi
      try { themChong(h, BY.get(v.it.k), v.it.n || 1, v.it.kbh, false, v.it.kbhHet); } catch { kq.day.push(v.g); continue; }
      donChong(h, v.it.k);
      bo(); kq.nhan.push({ g: v.g, n: tenMon(v.it), d: 0, sl: v.it.n || 1, db: 1 }); continue;
    }
    // thuốc: mang tối đa MANG() bình mọi loại — đủ rồi thì nằm lại, nhặt được 1 phần thì phần còn lại nằm lại. Dồn vào chồng cùng loại có sẵn
    // (anh 28/10 "cho cộng dồn, nhặt xong tự động dồn" — bản trước mỗi bình nhặt lên 1 ô mới)
    if (laThuoc(v.it)) {
      const con = MANG() - soThuoc(h), n0 = v.it.n || 1, lay = Math.min(con, n0);
      if (con <= 0) { kq.du.push(v.g); continue; }
      try { themChong(h, BY.get(v.it.k), lay, v.it.kbh, false, v.it.kbhHet); } catch { kq.day.push(v.g); continue; }
      donChong(h, v.it.k);
      if (lay < n0) { v.it.n = n0 - lay; if (Q === C) verChung++; kq.nhan.push({ g: v.g, n: tenMon(v.it), d: 0, sl: lay, con: v.it.n }); kq.du.push(v.g); continue; }
      bo(); kq.nhan.push({ g: v.g, n: tenMon(v.it), d: 0, sl: lay });
      continue;
    }
    if (Q === C) v.it.u = ++h.uN; // món người khác vứt ra: mã món mới theo túi người nhặt
    if (Q === C && v.vut && laTB(v.it) && v.ai !== h.name) NG.di(v.it, "dat", `${v.ai || "?"} vứt ra đất → ${h.name} nhặt`);
    if (!vaoTui(h, v.it)) { kq.day.push(v.g); continue; }
    bo();
    kq.nhan.push({ g: v.g, n: tenMon(v.it), d: (v.it.d || []).length, ...(v.it.n ? { sl: v.it.n } : {}), ...(laKtc(v.it) ? { db: 1 } : {}) }); // sl = số bình (thuốc)
    if ((v.it.d || []).length >= CFG.thongBaoTuDong && !v.vut) kq.bao.push(v.it);
  }
  // sổ hoạt động từng tài khoản (anh 11/11 "mua gì, nhặt gì, lấy gì"): gộp — 60 giây 1 dòng "Nhặt: …" (nhat-ky.js nhatGop)
  for (const x of kq.nhan) NKD().nhatGop(`${x.n}${x.d ? ` (${x.d} dòng)` : ""}`, x.sl || 1, 0, h.name);
  if (kq.tien > 0) NKD().nhatGop(null, 0, kq.tien, h.name);
  return kq;
}

// ---------- giao dịch (anh 30/10 — may-chu/giao-dich.js) ----------
// Đổi đồ + tiền giữa 2 nhân vật như engine KPlayer::TradeDecision: A / B = { h, ds: [{ u, ban }] (món đưa; ban = món lúc đặt vào khung — so lại
// xem còn y nguyên), tien }. Kiểm tra hết trước, thiếu điều kiện thì không đổi gì -> { loi: "mon" (món không còn / đã khác) | "tien" (không đủ
// tiền) | "tran" (tiền sau giao quá TIEN_MAX — câu client G_PLAYER_24) | "cho" | "thuoc" (túi không đủ chỗ / quá số bình thuốc mang được — luật
// mang của S1), ben: 0 = A, 1 = B }; xong -> { a: [tên món A nhận], b: [tên món B nhận] }. Món sang túi bên nhận: mã món mới, ô trống đầu tiên —
// món to xếp trước (engine TradeCheckCanPlace tự xếp chỗ); món xếp chồng dồn vào chồng cùng loại
const TIEN_MAX = 2e9; // engine: tiền mỗi bên sau giao ≤ 2 tỉ
const banMon = (it) => { const { x, y, ...r } = it; return JSON.stringify(r); };
function doiDo(A, B) {
  const ben = [A, B], dua = [];
  for (const S of ben) {
    const L = [];
    for (const o of S.ds) { const it = (S.h.bag || []).find((v) => v.u === o.u); if (!it || banMon(it) !== o.ban || it.kbh || it.tk) return { loi: "mon" }; L.push(it); } // kbh: khóa bảo hiểm (giao-dich.js chặn từ lúc đặt)
    if (!Number.isInteger(S.tien) || S.tien < 0 || S.tien > (S.h.gold || 0)) return { loi: "tien" };
    dua.push(L);
  }
  const vang = [A.h.gold - A.tien + B.tien, B.h.gold - B.tien + A.tien];
  if (vang.some((g) => g > TIEN_MAX)) return { loi: "tran" };
  const con = ben.map((S, i) => S.h.bag.filter((v) => !dua[i].includes(v)));
  const xep = dua.map((L) => [...L].sort((p, q) => coMon(q)[0] * coMon(q)[1] - coMon(p)[0] * coMon(p)[1]));
  const thuoc = (L) => L.reduce((t, o) => t + (laThuoc(o) ? o.n || 0 : 0), 0);
  for (let i = 0; i < 2; i++) {
    const nhan = xep[1 - i];
    if (thuoc(nhan) && thuoc(con[i]) + thuoc(nhan) > MANG()) return { loi: "thuoc", ben: i };
    const thu = con[i].slice();
    for (const it of nhan) { const at = choDau(thu, it); if (!at) return { loi: "cho", ben: i }; thu.push({ ...it, x: at[0], y: at[1] }); }
  }
  for (let i = 0; i < 2; i++) {
    const S = ben[i];
    S.h.bag = con[i]; S.h.gold = vang[i];
    for (const it of xep[1 - i]) { const m = { ...it, u: ++S.h.uN }; delete m.x; delete m.y; if (laTB(m)) NG.di(m, "gd", `Giao dịch: ${ben[1 - i].h.name} → ${S.h.name}`); vaoTui(S.h, m); }
    for (const k of new Set(xep[1 - i].filter(xepChong).map((o) => o.k))) donChong(S.h, k);
  }
  return { a: dua[1].map(tenMon), b: dua[0].map(tenMon) };
}

// ---------- kinh nghiệm / ngân lượng / rơi đồ ----------
const xo = new Map(); // tài khoản -> { n: lượt báo giết còn, at, sinceBoss }
function lenCap(h) {
  let up = 0;
  while (h.lvl < MAX_LEVEL && h.exp >= need(h.lvl)) { h.exp -= need(h.lvl); h.lvl++; up++; }
  if (h.lvl >= MAX_LEVEL) h.exp = Math.min(h.exp, need(h.lvl) - 1);
  return up;
}

// món đặc biệt rơi theo bảng client: luot lượt, mỗi lượt bốc 1 số — rơi vào món nào thì ra món đó (mỗi lượt tối đa 1 món) -> its
function roiDacBiet(luot, bang, its) {
  const e = Object.entries(bang || {});
  if (e.length) for (let i = 0; i < luot; i++) { let r = Math.random(); for (const [k, p] of e) { r -= p; if (r < 0) { its.push({ k, n: 1 }); break; } } }
}
// kinh nghiệm 1 người nhận từ e0 (kinh nghiệm con quái cấp L ở bãi Z — đã nhân hệ số) — phần riêng từng người như engine KPlayer::AddSelfExp:
// bãi train quái thấp hơn ≥ 10 cấp 50 %, cao hơn ≥ 10 cấp 10 % (anh chốt 23/10 — world.js expOf) × kx (Tiên Thảo Lộ × 2)
function knNhan(h, e0, L, Z, kx) {
  const dl = L - (h.lvl || 1), k = Z && FARM.has(Z.kind) ? (dl <= -10 ? 0.5 : dl >= 10 ? 0.1 : 1) : 1;
  return Math.floor(e0 * k * kx);
}
// tiền 1 con quái thường cấp L (anh 28/10 lần 7 — cau-hinh.json tien.moc): mốc đầu tiên có cấp ≤ den -> tỉ lệ tiLe rơi 1 đống toiDa × L / den ×
// ngẫu nhiên [thapNhat, 1] (cấp den mới chạm toiDa: bãi nhỏ rơi ít, bãi to rơi nhiều), không nhân hệ số tiền của bãi
function tienQuai(L) {
  const T = CFG.tien, moc = T.moc || [], M = moc.find((m) => L <= m.den) || moc[moc.length - 1];
  if (!M || Math.random() >= M.tiLe) return 0;
  const lo = T.thapNhat ?? 0.5;
  return Math.max(1, Math.min(M.toiDa, Math.round(M.toiDa * (L / M.den) * (lo + (1 - lo) * Math.random()))));
}
// kinh nghiệm gốc 1 con quái thường ở bãi luyện công (anh 30/10 lần 2: "bãi sau phải nhiều exp hơn bãi trước, không thể cấp 79 đánh quái map 70
// lại nhiều hơn 80 đánh quái 80" — chọn cách giữ nhịp): mọi con của bãi cùng 1 mức, không theo cấp từng con = TB bảng client của bãi trên các cấp
// bãi ra quái (capQuai hoặc lo–hi; 2 đầu nửa phần như cấp Math.round(ngẫu nhiên) của world.js spawnMob), theo bảng exp của đa số quái trong bãi
// (Sa Mạc 3: quái 537 bảng khác chỉ ~30 % — anh: "áp luật mới luôn"). cau-hinh.json canBang.bai[].kinhNghiem chỉnh để mỗi bãi ≥ bãi cao nhất
// của dải 10 cấp ngay dưới × 1,02. null: bãi không có quái
const KN_BAI = new Map();
function knBai(Z) {
  if (KN_BAI.has(Z.id)) return KN_BAI.get(Z.id);
  const B = cbBai(Z), cs = B.chiSo && MS.mobs[B.chiSo] ? B.chiSo : null, dem = new Map();
  for (const id of Z.m || []) { const M = MS.mobs[cs || id]; if (M) { const i = (M.s[M.series] || M.s[0]).exp; dem.set(i, (dem.get(i) || 0) + 1); } }
  let v = null;
  if (dem.size) {
    const i = [...dem].sort((p, q) => q[1] - p[1] || p[0] - q[0])[0][0], [a, b] = B.capQuai || [Z.lo, Z.hi];
    let t = 0, w = 0;
    for (let L = a; L <= b; L++) { const k = a === b ? 1 : L === a || L === b ? 0.5 : 1; t += k * (atL(i, L) || 0); w += k; }
    v = t / w;
  }
  KN_BAI.set(Z.id, v);
  return v;
}
// 1 con quái mã id cấp L (trùm: boss, tinh anh: ta, hệ se) ở bãi Z chết: cộng kinh nghiệm vào h (+ lên cấp); trả { e, len, g (tiền rơi),
// its: [món rơi — trang bị / món đặc biệt { k, n } (đồ chí, mật đồ, Thủy Tinh …)] } — đánh thật (gietQuai) và ủy thác dùng chung. chia(e0, L, Z)
// -> phần của h khi có đội (gietQuai -> chiaDoi)
// sat: Boss Sát thủ — dùng chỉ số của chính nó, không lấy chiSo của bãi (anh 28/10 — như world.js spawnMob)
// hs: thưởng bản quái chung (anh 03/11 — cau-hinh.json quaiChung.thuong, +10 %): × kinh nghiệm con quái (cả phần đội chia) + tiền rơi; hk: hệ
// số kinh nghiệm riêng (bản chung: thuong + tăng ích tổ đội — gietQuai tangIchKn), mặc định = hs
function motCon(h, Z, id, L, boss, se, luck, kx = 1, ta = false, chia = null, sat = false, hs = 1, hk = hs) { // kx: hệ số kinh nghiệm của trạng thái (Tiên Thảo Lộ × 2)
  const M = MS.mobs[id], TA = ta ? taBai(Z) : null;
  // cân bằng theo bãi (canBang): trùm tính như quái thường đầu tiên của bãi cùng cấp × hệ số trùm — GIỐNG src/game/world.js spawnMob
  const CB = cbBai(Z), TR = boss && CAN_BANG.trum && Z && Z.m && Z.m.length ? CAN_BANG.trum : null;
  const M2 = (!sat && CB.chiSo && MS.mobs[CB.chiSo]) || (TR && MS.mobs[Z.m[0]]) || M; // chiSo: bãi lấy chỉ số quái khác (quái client lỗi số)
  // Phong Lăng Độ bờ Bắc: kinh nghiệm theo quái bờ Nam cùng cấp × bacKinhNghiem (anh 28/10: "exp thêm 20 % thôi" — quái bờ Bắc là mẫu Thủy
  // tặc, bảng client nhiều kinh nghiệm hơn quái bờ Nam 20 % nên trước đây thành +44 %)
  const G = Z && Z.bo === "bac" && Z.goc && ZONES.get(Z.goc), ME = (G && G.m && G.m.length && MS.mobs[G.m[0]]) || M2;
  const S = ME.s[se] || ME.s[ME.series], at = (i) => MS.pool[i][L - 1];
  // kinh nghiệm con quái: bảng client (bãi luyện công: mức chung của bãi — knBai, bờ Bắc theo bờ Nam; Boss Sát thủ theo cấp của nó) × hệ số × hệ
  // số của bãi (× hệ số trùm, tinh anh); Phong Lăng Độ bờ Bắc: × phongLangDo.bacKinhNghiem (anh 27/10: +20 %). Phần riêng người nhận (chênh cấp
  // với cấp thật con quái, Tiên Thảo Lộ): knNhan; có đội: chia như engine KPlayer::AddExp (chiaDoi)
  const KB = !sat && Z && FARM.has(Z.kind) ? knBai(G || Z) : null;
  const e0 = (KB ?? (at(S.exp) || 0)) * CFG.kinhNghiem * (CB.kinhNghiem ?? 1) * (TR ? TR.kinhNghiem ?? 1 : 1) * (TA ? TA.kn : 1) * PLD().heSoKn(Z) * hk;
  const e = chia ? chia(e0, L, Z) : knNhan(h, e0, L, Z, kx);
  h.exp += e;
  const len = lenCap(h);
  // ngân lượng: trùm + tinh anh cấp × trum × hệ số tiền của bãi (như cũ); quái thường theo mốc cấp (tienQuai — anh 28/10 lần 7)
  const g = Math.round((boss || TA ? L * CFG.tien.trum * (CB.tien ?? 1) : tienQuai(L)) * hs);
  const its = [];
  if (TA) { // tinh anh: TA.luot lượt — trang bị (số dòng như trùm) + bảng tinh anh của bãi (Thần Bí Lộ Chí … — đã bỏ món của roiDacBiet)
    for (let i = 0; i < TA.luot; i++) { const it = taoDo(L, true, luck, QD.tinhAnhRoiDo); if (it) its.push(it); }
    roiDacBiet(TA.luot, TA.bang, its);
  } else {
    const it = taoDo(L, boss, luck); if (it) its.push(it);
    const q = Z && RDB[Z.id] && RDB[Z.id].q[id]; // quái thường / thủ lĩnh: Treasure lượt của con đó (đồ chí, mật đồ …) — đã bỏ món của roiDacBiet
    if (q) roiDacBiet(q[0], q[1], its);
    if (boss) roiMoiCon(RDC.thuLinh, its); // thủ lĩnh: bảo thạch, thủy tinh, các loại lộ, bí kíp (anh 28/10 lần 7 — tỉ lệ mỗi con)
  }
  return { e, len, g, its };
}

// ---------- tổ đội: chia kinh nghiệm như engine (KPlayer::AddExp — anh 28/10 lần 5 "làm cái chia kinh nghiệm luôn, theo client") ----------
// Người giết có đội: đồng đội cùng bãi trong CHIA_XA quanh người giết (PLAYER_SHARE_EXP_DISTANCE 768 điểm client × 0,75 của bản đồ web; vị trí =
// mốc nhịp cuối — the-gioi.js), kể cả người giết, chia nhau (100 + 15 × số người) % kinh nghiệm con quái theo tỉ lệ cấp: người i được e0 × k ×
// cấp_i / tổng cấp / 100, rồi phần riêng của người đó (knNhan — chênh cấp với quái, Tiên Thảo Lộ). 2 người: mỗi người cùng cấp 65 % (tổng 130 %),
// 8 người: 27,5 % (tổng 220 %). Đội trưởng trong vùng thêm kinh nghiệm thống soái e0 × k × LeadExpShare(hệ người giết, 25) × (tổng cấp − cấp người
// giết) / (tổng cấp × 10000) — lên cấp thống soái thì dẫn được nhiều đội viên hơn (to-doi.js). Chỉ 1 người trong vùng = như không có đội.
// Đồng đội nhận ở nhịp kế của chính họ (CHIA_CHO -> nhanChia: mỗi người tự ghi vào nhân vật mình, không ghi chéo tài khoản; giữ CHIA_GIU)
const CHIA_XA = (TS.xa || 768) * 0.75, CHIA_GIU = 10 * 60e3;
const CHIA_CHO = new Map(); // tài khoản -> [{ ten, e, L, z, lead, luc }]
function choChia(tk, v) { const L = CHIA_CHO.get(tk) || []; L.push({ ...v, luc: Date.now() }); if (L.length > 1000) L.shift(); CHIA_CHO.set(tk, L); }
// -> chia(e0, L, Z, x, y) cho từng con của nhịp (x, y = chỗ con quái chết — người giết chưa có mốc vị trí thì lấy chỗ đó) | null (không có đội)
function chiaDoi(h, ctx, kx) {
  const D = TDOI().thanhVien(ctx.ten); if (!D || D.tv.length < 2) return null;
  const TG = TGI(), toi = TG.dangChoi(ctx.ten), cc = toi && toi.chung ? 1 : 0; // cc: người giết ở bản quái chung — chỉ chia người cùng bản
  return (e0, L, Z, x, y) => {
    const px = toi ? toi.x : x, py = toi ? toi.y : y;
    const ds = D.tv.map((tk) => (tk === ctx.ten ? { tk, name: h.name, lvl: h.lvl || 1, zone: Z && Z.id, chung: cc, x: px, y: py } : { tk, ...(TG.dangChoi(tk) || {}) }))
      .filter((m) => m.lvl > 0 && Z && m.zone === Z.id && (m.chung ? 1 : 0) === cc && Math.hypot(m.x - px, (m.y - py) * 2) <= CHIA_XA);
    if (ds.length < 2) return knNhan(h, e0, L, Z, kx);
    const k = 100 + 15 * ds.length, tong = ds.reduce((t, m) => t + m.lvl, 0);
    let cua = 0;
    for (const m of ds) {
      const e = (e0 * ((k * m.lvl) / tong)) / 100;
      if (m.tk === ctx.ten) cua = knNhan(h, e, L, Z, kx); else choChia(m.tk, { ten: m.name, e, L, z: Z.id });
    }
    const tr = ds.find((m) => m.tk === D.truong), lead = tr ? (e0 * k * (TS.chia[h.series] ?? 25) * (tong - (h.lvl || 1))) / (tong * 10000) : 0;
    if (lead > 0) { if (tr.tk === ctx.ten) ctx.lead = (ctx.lead || 0) + lead; else choChia(tr.tk, { ten: tr.name, e: 0, L, z: Z.id, lead }); }
    return cua;
  };
}
// kinh nghiệm thống soái (đội trưởng — engine KPlayer::AddLeadExp): đủ mốc thì lên cấp (KTeamLeadExp::GetLevel). Trả cấp mới nếu vừa lên, không thì 0
function themThongSoai(h, n) {
  const lv0 = h.leadLv || 1;
  if (lv0 >= 100 || !(n >= 1)) return 0;
  h.leadExp = (h.leadExp || 0) + Math.floor(n);
  let lv = 1; while (lv < 100 && h.leadExp >= (TS.exp[lv - 1] || Infinity)) lv++;
  h.leadLv = Math.max(lv0, lv);
  return h.leadLv > lv0 ? h.leadLv : 0;
}
// đồng đội nhận phần chia ở nhịp của chính họ (api.js nhip): đúng nhân vật đang chơi, chưa quá CHIA_GIU; phần riêng tính theo người nhận (cấp,
// Tiên Thảo Lộ). Trả { kn, len, tin } | null
function nhanChia(h, tk, key) {
  const L = CHIA_CHO.get(tk); if (!L) return null;
  CHIA_CHO.delete(tk);
  const t = Date.now(), kx = knBuff(h, key); // Tiên Thảo Lộ × Nến (anh 16/11 — Báo Đáp Ân Sư)
  let kn = 0, lead = 0;
  for (const v of L) { if (v.ten !== h.name || t - v.luc > CHIA_GIU) continue; if (v.e) kn += knNhan(h, v.e, v.L, ZONES.get(v.z), kx); lead += v.lead || 0; }
  if (!kn && !(lead >= 1)) return null;
  h.lvl = h.lvl || 1; h.exp = (h.exp || 0) + kn;
  const len = lenCap(h), lv = themThongSoai(h, lead), lk = luyenKn(h, kn); // chiêu luyện 120: kinh nghiệm đội chia cũng luyện
  return { kn, len, tin: lv ? [`Đẳng cấp thống soái của Bạn thăng lên đến ${lv}!`] : [], ...(lk.length ? { luyen: lk } : {}) };
}

// món rơi xuống đất của riêng nhân vật (key "tài khoản|ô") ở chỗ cho { z, x, y } -> mô tả gửi trình duyệt (i = thứ tự con trong lần báo giết).
// dl: dòng (Trợ Thủ lọc theo dòng); db: món đặc biệt (đồ chí, mật đồ …) — Trợ Thủ luôn nhặt; sl: số bình (thuốc). Dùng ở gietQuai và Vượt Ải
// tổ đội (vuot-ai.js nhanPhong — quái chung chết ở máy chủ)
function roiMon(h, key, cho, it, i) {
  it.u = ++h.uN; ngBai(it, BAI_NAY.get(key));
  const mo = { u: it.u, n: tenMon(it), d: (it.d || []).length, k: it.k, ...(i != null ? { i } : {}), ...(it.d && it.d.length ? { dl: it.d } : {}), ...(laKtc(it) ? { db: 1 } : {}), ...(it.n > 1 ? { sl: it.n } : {}) };
  mo.g = roiDat(key, { ...cho, it });
  return mo;
}

// bản quái chung của bãi (anh 03/11 "bãi quái chung sẽ tăng thêm 10% ngân lượng và exp"): con máy chủ quái chung xác nhận chết (ctx.chung) — × thuong
const QC_THUONG = Math.max(1, +((CFG.quaiChung || {}).thuong) || 1);
// tăng ích tổ đội (anh 03/11 "tổ đội pt từ 2 4 6 8, mỗi mốc pt thêm 5% exp (tính cho tổ đội và người giết quái) => chỉ trong bãi train quái
// chung"; "chỉ tính đứng cùng bãi, đang online"): số người trong đội của ten đang online, cùng bãi + cùng bản quái chung (tính cả mình) -> % kinh
// nghiệm thêm = số mốc cau-hinh.json tangIchDoi.moc đã đạt × kn. Trình duyệt hiện ở thanh trạng thái (src/game/world.js tangIchDoi)
function tangIchKn(ten) {
  const T = CFG.tangIchDoi, D = T && TDOI().thanhVien(ten); if (!D || D.tv.length < 2) return 0;
  const TG = TGI(), toi = TG.dangChoi(ten); if (!toi || !toi.chung) return 0;
  const n = D.tv.filter((tk) => { const o = tk === ten ? toi : TG.dangChoi(tk); return !!o && o.zone === toi.zone && !!o.chung; }).length;
  return (T.moc || []).filter((m) => n >= m).length * (+T.kn || 0);
}
// đang được tăng ích tổ đội tốc chạy / tốc đánh (src/game/world.js tangIchDoi): ở bãi train, đội có ≥ 2 người online cùng bãi + cùng bản quái chung
// (anh 06/11 "buff chỉ có thể cộng ở bãi quái chung" — bản riêng không còn tăng ích). Ủy thác không tính (anh 03/11 "ủy thác k tính, giữ như cũ"):
// uyThacDo không đo tốc độ giết lúc này — ủy thác giữ tốc lúc đánh một mình
function coTangIch(ten) {
  const D = CFG.tangIchDoi && TDOI().thanhVien(ten); if (!D || D.tv.length < 2) return false;
  const TG = TGI(), toi = TG.dangChoi(ten), Z = toi && ZONES.get(toi.zone); if (!Z || !FARM.has(Z.kind) || !toi.chung) return false;
  return D.tv.filter((tk) => { const o = tk === ten ? toi : TG.dangChoi(tk); return !!o && o.zone === toi.zone && !!o.chung; }).length >= 2;
}
function gietQuai(h, ds, ctx) {
  const t = Date.now(), G = CFG.gietToiDa;
  const B = xo.get(ctx.ten) || { n: G.dau, at: t, sinceBoss: BOSS_GAP, sinceTA: TA_GAP };
  B.n = Math.min(G.dau, B.n + ((t - B.at) / 1000) * G.moiGiay); B.at = t; xo.set(ctx.ten, B);
  const kq = { kn: 0, tien: 0, nhan: [], roi: [], bo: 0, len: 0, n: 0, nBh: 0 }; // roi = [[i, lượng, g], …]; n = số con đã nhận; nBh = số con tính cống hiến bang hội (api.js BH.quai)
  // quái chung ở bãi train (may-chu/quai-chung.js — anh 02/11): ctx.chung = con máy chủ đã xác nhận chết (bỏ kiểm bãi / cấp / hạn mức giết; kinh
  // nghiệm + tiền × QC_THUONG — anh 03/11), heSoKn = phần kinh nghiệm theo sát thương, khongRoi = không tiền / đồ (người đánh phụ), khongChia = không chia đội
  const luck = mayMan(h, ctx.key), kx = knBuff(h, ctx.key) * (ctx.heSoKn > 0 ? ctx.heSoKn : 1); // may mắn + Tiên Thảo Lộ (× 2) × Nến Bát Trân Phúc Nguyệt (× 2 — anh 16/11 — Báo Đáp Ân Sư)
  h.lvl = h.lvl || 1; h.exp = h.exp || 0; h.gold = h.gold || 0;
  const chia = ctx.khongChia ? null : chiaDoi(h, ctx, kx); // có đội: chia kinh nghiệm với đồng đội ở gần
  // bản quái chung: kinh nghiệm × (thuong + tăng ích tổ đội); Phong Hỏa Liên Thành (ctx.ph — may-chu/phong-hoa.js): × hệ số cấp của con (knPh), không
  // thưởng bản chung
  const hk = ctx.ph ? +ctx.knPh || 1 : ctx.chung ? QC_THUONG + tangIchKn(ctx.ten) / 100 : 1;
  for (const [i, r] of (Array.isArray(ds) ? ds.slice(0, 200) : []).entries()) {
    if (!Array.isArray(r)) continue;
    // r[3]: 0 quái thường, 1 thủ lĩnh (trùm bãi), 2 tinh anh, 3 Boss Sát thủ (nhiệm vụ Nhiếp Thí Trần — may-chu/sat-thu.js), 4 quái Vượt Ải
    // (may-chu/vuot-ai.js — đúng nhóm của đám đang đánh)
    const Z = ZONES.get(r[0] | 0), id = r[1] | 0, L = clamp(r[2] | 0, 1, MS.maxLevel), boss = (r[3] | 0) === 1, ta = (r[3] | 0) === 2, sat = (r[3] | 0) === 3, M = MS.mobs[id];
    const va = (r[3] | 0) === 4, se = clamp(r[4] | 0, 0, 4);
    if (!M) { kq.bo++; continue; }
    const thuyen = !!Z && Z.kind === "thuyền"; // thuyền Phong Lăng Độ: 30 Thủy tặc + đầu lĩnh theo giờ (phong-lang-do.js nhanGiet), không tinh anh
    if (va && !ctx.admin && B.n < 1) { kq.bo++; continue; }
    if (!ctx.admin && !va && !ctx.chung) {
      const ok = Z && (sat || (boss ? Z.boss === id : (Z.m || []).includes(id))) && L >= Z.lo && L <= Z.hi && h.lvl >= capVao(Z) && B.n >= 1
        && (thuyen ? !ta && !sat : (!boss || B.sinceBoss >= BOSS_GAP) && (!ta || (taBai(Z) && (B.sinceTA ?? TA_GAP) >= TA_GAP)))
        && PLD().nhanGiet(h, Z, boss);
      if (!ok) { kq.bo++; continue; }
    }
    // Boss Sát thủ: chỉ boss của nhiệm vụ đang nhận (cả tài khoản quản trị — thưởng theo nhiệm vụ); nhận là xong nhiệm vụ
    const ST = sat ? SAT().nhanGiet(h, Z, id, L, se, !!ctx.chung) : null; // ctx.chung: boss chung bản quái chung — hệ boss bốc lúc sinh, không theo nhiệm vụ
    if (sat && !ST) { kq.bo++; continue; }
    const VK = va ? VAI().nhanGiet(h, Z, id, L) : null;
    if (va && !VK) { kq.bo++; continue; }
    if (!ctx.admin && !ctx.chung) {
      B.n -= 1;
      if (!thuyen && !sat && !va) { B.sinceBoss = boss ? 0 : B.sinceBoss + 1; B.sinceTA = ta ? 0 : (B.sinceTA ?? TA_GAP) + 1; }
    }
    const cho = { z: r[0] | 0, x: toaDo(r[5]), y: toaDo(r[6]) }; // chỗ con quái chết: tiền / món rơi ở đó
    // quái Vượt Ải: không kinh nghiệm / tiền / đồ riêng (npcs.txt Exp 0, Treasure 0) — thưởng theo đám (award.lua award_batch)
    const { e, len, g: g0, its } = va ? { e: 0, len: 0, g: 0, its: [] } : motCon(h, Z, id, L, boss, se, luck, kx, ta && !thuyen && !!taBai(Z), chia && ((e0, L2, Z2) => chia(e0, L2, Z2, cho.x, cho.y)), sat, ctx.chung && !ctx.ph ? QC_THUONG : 1, hk);
    // r[7] = 1: phân thân giết (anh 05/11 — may-chu/phan-than.js): người thuê nhận đủ kinh nghiệm, không tiền, không đồ (cả món đặc biệt)
    // Boss Sát thủ phân thân hạ (anh 12/11 "phân thân đánh chết boss sát thủ, đồ rơi ra tính cho ng thuê"): rơi như người thuê tự hạ (tiền + bảng boss bên dưới)
    const ptGiet = (r[7] | 0) === 1 || !!ctx.pt, khongRoi = ctx.khongRoi || (ptGiet && !sat); // ctx.pt: quái chung phân thân giết (quai-chung.js nhanThuong)
    const g = khongRoi ? 0 : g0;
    if (khongRoi) its.length = 0;
    kq.kn += e; kq.len += len; kq.n++;
    if (!va && !sat && !thuyen && !ptGiet && !ctx.ph) kq.nBh++; // bang hội đợt 2: quái tính cống hiến (bỏ quái ải, boss sát thủ, thuyền PLĐ, quái phân thân, quân Phong Hỏa — có nguồn riêng)
    // anh 16/11 — Báo Đáp Ân Sư: Sợi chỉ màu rơi từ quái bãi luyện công cấp ≥ chiCap (tỉ lệ + trần ngày — bao-dap-an-su.js roiChi); người đánh phụ bản chung / phân thân / ủy thác không
    if (!va && !sat && !thuyen && !ptGiet && !ctx.ph && !khongRoi) { try { const ch = BD().roiChi(h, Z); if (ch) its.push(ch); } catch (e) { console.error("Báo Đáp Ân Sư — chỉ màu:", e.message); } }
    // anh 18/11 — nhiệm vụ ngày lễ (nguon-su-kien.js demGiet): quái mình tự hạ ở bãi luyện công — như Sợi chỉ màu
    if (!va && !sat && !thuyen && !ptGiet && !ctx.ph && !khongRoi) { try { const nt = NSK().demGiet(h, 1); if (nt) (kq.tin = kq.tin || []).push(nt); } catch (e) { console.error("Nguồn sự kiện — nhiệm vụ ngày lễ:", e.message); } }
    if (!va && !sat && !thuyen) { const mt = MCH().giet(h, ctx, Z, id); if (mt) (kq.tin = kq.tin || []).push(...mt); } // nhiệm vụ Võ Lâm Minh Chủ: hạ đúng quái ở đúng bãi (cả tổ đội)
    if (VK) {
      if (VK.bhDam) congBh(ctx, h, "vuotAi", null, { dot: VK.bhDam }); // bang hội đợt 2: hết 1 đám Vượt Ải (1 người) — 4 / 8 / 10 theo đám
      if (VK.kn) { h.exp += VK.kn; kq.kn += VK.kn; kq.len += lenCap(h); }
      for (const m of VK.mon) its.push({ ...m }); // Ngũ Hoa Ngọc Lộ Hoàn (hết đám) / Hộp lễ vật vượt ải (boss) — không rơi trang bị (anh 28/10)
      if (VK.tin.length) (kq.tin = kq.tin || []).push(...VK.tin);
      if (VK.loa.length) (kq.loa = kq.loa || []).push(...VK.loa); // báo cả máy chủ (api.js — như client broadcast)
      if (VK.tin.length) try { NKD().ghi("hd", ctx.ten, h.name, `Vượt Ải: ${VK.tin.join(" ")}`); } catch { /* nhật ký chung theo hoạt động (anh 18/11) */ }
    }
    if (thuyen && boss) { const T = PLD().CF.thuongDauLinh | 0; h.exp += T; kq.kn += T; kq.len += lenCap(h); } // bossdeath.lua AddOwnExp(150000)
    // anh 16/11 — Báo Đáp Ân Sư (client config.lua [12] CheckBoatBoss): người hạ đầu lĩnh — Đỗ Khang Tửu rơi xuống đất riêng (pldDauLinh, tối đa pldNgay / ngày); chuyến thử
    // của công cụ (pld.thu) trước không tính — anh 18/11 thử chuyến của công cụ thấy không rơi: nay chuyến thử cũng rơi (công cụ chỉ quản trị dùng, vẫn tính trần ngày)
    if (thuyen && boss && !khongRoi) { try { const ru = BD().ruouDauLinh(h); if (ru) its.push(ru); } catch (e) { console.error("Báo Đáp Ân Sư — đầu lĩnh:", e.message); } }
    // anh 18/11 — nguồn sự kiện: hạ đầu lĩnh rơi pldDauLinh món (Trung Dược) xuống đất riêng như rượu, không giới hạn
    if (thuyen && boss && !khongRoi) { try { for (const [k, n] of NSK().dauLinh()) its.push({ k, n }); } catch (e) { console.error("Nguồn sự kiện — đầu lĩnh:", e.message); } }
    // nhật ký chung theo hoạt động (anh 18/11 — F10 → Nhật ký → Phong Lăng Độ): hạ đầu lĩnh thuyền — kinh nghiệm + món rơi
    if (thuyen && boss) try { NKD().ghi("hd", ctx.ten, h.name, `Phong Lăng Độ: hạ đầu lĩnh${h.pld && h.pld.thu ? " (chuyến thử của công cụ)" : ""}${ptGiet ? " (phân thân hạ)" : khongRoi ? " (đánh phụ)" : ""} — +${PLD().CF.thuongDauLinh | 0} kinh nghiệm${its.length ? `; rơi: ${chuMon(its)}` : ""}`); } catch { /* sổ không làm hỏng việc */ }
    // Boss Sát thủ (kill_level.lua): 8 lượt bảng rơi bosstask_lev<bậc>.ini thay rơi thường — trang bị như trùm hoặc món đặc biệt; kinh nghiệm
    // thưởng của bậc; 1 Sát Thủ lệnh cấp bậc, hệ boss vào túi (túi đầy: nằm đất cùng đồ rơi)
    if (ST) {
      congBh(ctx, h, "satThu"); // bang hội đợt 2: xong nhiệm vụ Boss Sát thủ (phân thân hạ vẫn tính — nhiệm vụ người thuê xong)
      its.length = 0;
      // phân thân ra đòn kết liễu: bản 05/11 không rơi bảng boss; anh 12/11 — rơi cho người thuê như tự hạ (nhiệm vụ xong như cũ). Quái chung: phần
      // không phải người hạ chính (ctx.khongRoi) vẫn như trước (khối này không xét khongRoi)
      {
        const monCL = locBang(ST.roi.mon); // món đặc biệt client còn lại sau roiDacBiet.boKhoiBangClient (anh 28/10 lần 7)
        // may mắn (anh 13/11 lượt 87 "cho boss st có tác dụng"): món đặc biệt mỗi lượt + bảng món mỗi con × (1 + may mắn ÷ 100), tính tối đa mayManToiDa — như tỉ lệ ra đồ
        // của quái; phần trang bị của lượt bớt đi tương ứng (trang bị vốn đã tính may mắn ở giá trị dòng — taoDo)
        const kL = 1 + Math.min(Math.max(0, luck || 0), CFG.mayManToiDa) / 100, trangL = Math.max(0, 1 - (1 - ST.roi.trang) * kL);
        for (let k = 0; k < ST.luot; k++) {
          let p = Math.random();
          if (p < trangL) { const it = taoDo(L, true, luck, 1); if (it) its.push(it); continue; }
          p -= trangL;
          for (const [mk, q] of Object.entries(monCL)) { p -= q * kL; if (p < 0) { its.push({ k: mk, n: 1 }); break; } }
        }
        roiMoiCon(RDC.satThu, its, heSoBacSatThu(ST.cap) * kL); // món đặc biệt mỗi boss: bảo thạch, thủy tinh, các loại lộ, mật tịch, tẩy tủy, bí kíp
      }
      if (ST.kn) { h.exp += ST.kn; kq.kn += ST.kn; kq.len += lenCap(h); }
      let vao = true; // lệnh xếp chồng (02/11 khuya): dồn vào chồng cùng loại; túi đầy thì nằm dưới đất
      try { themChong(h, BY.get(ST.lenh), 1); } catch { vao = false; }
      if (vao) kq.tui = 1; else its.push({ k: ST.lenh, n: 1 });
      (kq.tin = kq.tin || []).push("Sát thủ đã bị tiêu diệt, hoàn thành nhiệm vụ.", `Bạn nhận được 1 sát thủ lệnh${vao ? "" : " (hành trang đầy — nằm dưới đất)"}`);
      // anh 16/11 — Báo Đáp Ân Sư (client config.lua [15] CheckKillerdBoss): nhiệm vụ bậc ≥ satThuCap -> Đỗ Khang Tửu vào túi (không khóa), túi đầy thì nằm đất như lệnh
      let ruou = [];
      try { ruou = BD().thuongNguon("satThu", ST.cap); } catch (e) { console.error("Báo Đáp Ân Sư — sát thủ:", e.message); }
      // anh 18/11 — nguồn sự kiện: mỗi boss 1 Trung Dược; tổ đội từ 4 người cùng hạ 2, đủ 8 người 3 (ctx.doiSat = số đồng đội có nhiệm vụ đúng boss và có đánh — quai-chung.js chet)
      try { ruou = [...ruou, ...NSK().satThu(Math.max(1, ctx.doiSat | 0))]; } catch (e) { console.error("Nguồn sự kiện — sát thủ:", e.message); }
      for (const [rk, rn] of ruou) {
        const m = BY.get(rk); if (!m) continue;
        let vr = true; try { themChong(h, m, rn); } catch { vr = false; }
        if (vr) kq.tui = 1; else its.push({ k: rk, n: rn });
        kq.tin.push(`Bạn nhận được ${rn} ${m.n.trim()}${vr ? "" : " (hành trang đầy — nằm dưới đất)"}`);
      }
      if (ptGiet) kq.tin.push("Phân thân hạ sát thủ — vật phẩm rơi ra thuộc về đại hiệp.");
      // nhật ký chung theo hoạt động (anh 18/11 — F10 → Nhật ký → Boss Sát thủ): hạ boss nhiệm vụ — thưởng + món rơi (lệnh / rượu túi đầy cũng nằm trong its)
      try { NKD().ghi("hd", ctx.ten, h.name, `Boss Sát thủ: hạ ${ST.ten || "sát thủ"} cấp ${ST.cap}${Z ? ` ở ${Z.n}` : ""}${(ctx.doiSat | 0) > 1 ? ` (tổ đội ${ctx.doiSat | 0} người)` : ""}${ptGiet ? " (phân thân hạ)" : ""} — +${ST.kn | 0} kinh nghiệm, 1 Sát Thủ lệnh${ruou.map(([rk, rn]) => `, ${rn} ${String(tenMon({ k: rk })).trim()}`).join("")}${its.length ? `; rơi: ${chuMon(its)}` : ""}`); } catch { /* sổ không làm hỏng việc */ }
    }
    if (g) { kq.tien += g; kq.roi.push([i, g, roiDat(ctx.key, { ...cho, tien: g })]); }
    for (const it of its) kq.nhan.push(roiMon(h, ctx.key, cho, it, i));
  }
  // đội trưởng tự giết: kinh nghiệm thống soái của cả nhịp (chiaDoi)
  const lv = ctx.lead ? themThongSoai(h, ctx.lead) : 0;
  if (lv) (kq.tin = kq.tin || []).push(`Đẳng cấp thống soái của Bạn thăng lên đến ${lv}!`);
  if (chia) kq.doi = 1;
  const lk = luyenKn(h, kq.kn); if (lk.length) kq.luyen = lk; // chiêu luyện 120: kinh nghiệm vừa nhận
  return kq;
}

// Thần bí đồ chí / Thần Bí Lộ Chí (client tasklink_goods[_secret].lua PickUp — nhặt lên không vào túi): đang làm nhiệm vụ Dã Tẩu "Thu thập
// địa đồ" (h.daTau.loai 4) đúng bãi, đúng loại địa đồ (1 đồ chí / 2 lộ chí) -> +1 tấm Địa đồ chí; còn lại +1 mảnh Sơn Hà Xã Tắc (h.shxt).
// Trả câu thông báo (câu client)
function nhatChi(h, it, z) {
  const loai = (BY.get(it.k) || {}).chi, D = h.daTau, Z = ZONES.get(z | 0);
  if (D && D.buoc === 1 && D.loai === 4 && D.bai === (z | 0) && D.chi === loai) {
    D.co = (D.co | 0) + 1;
    return `Bạn nhận được một tấm ${Z ? Z.n + " " : ""}Địa Đồ chí! Hiện tại bạn có tổng cộng ${D.co} tấm.`;
  }
  h.shxt = (h.shxt | 0) + 1;
  return `Bạn nhận được một mảnh bản đồ Sơn Hà Xã Tắc! Hiện tại bạn có tổng cộng ${h.shxt} mảnh bản đồ Sơn Hà Xã Tắc.`;
}
// Bùa Phong Hỏa Liên Thành (anh 04/11 lượt 24 — client script\item\newcitydefence\*.lua PickUp: nhặt lên không vào túi, bốc 1 dòng của món, cấp
// ngẫu nhiên): trạng thái -> h.buff["ph:<hiệu quả>:<trị số>"] = giây (cùng hiệu quả thì thay cái cũ — AddSkillState cùng trạng thái); hồi ngay (hoi)
// -> trình duyệt cộng sinh lực / nội lực. Trị số = cấp × moi × cau-hinh.json phongHoa.bua.manh[hiệu quả] (mặc định 1). -> { tin, hoi? }
function nhatBua(h, key, it) {
  const ds = BUA.mon[it.k] || [], ten = tenMon(it).trim(), [ma, lo, hi] = ds[ri(0, ds.length - 1)] || [], H = BUA.hieu[ma];
  if (!H) return { tin: `${ten} đã mất tác dụng` };
  const manh = +((((CFG.phongHoa || {}).bua || {}).manh || {})[ma]) || 1, v = Math.max(1, Math.round(ri(lo, hi) * H.moi * manh)), so = v.toLocaleString("vi-VN");
  if (H.hoi) return { tin: `${ten}: ${H.n} ${so} điểm`, hoi: Object.fromEntries(H.hoi.map((k) => [k, v])) };
  buffDem(h, key, true); // trừ hẳn phần thời gian đã trôi trước khi ghi trạng thái mới (như dùng vật phẩm trạng thái)
  const B = (h.buff = h.buff || {});
  for (const k of Object.keys(B)) if (k.startsWith(`ph:${ma}:`)) delete B[k];
  B[`ph:${ma}:${v}`] = H.giay;
  return { tin: `${ten}: ${H.n} +${so}${H.pt ? "%" : ""} trong ${H.giay % 60 ? `${H.giay} giây` : `${H.giay / 60} phút`}` };
}

// ---------- ủy thác: cày khi tắt máy (THIET-KE-S1.md mục 5 — anh 27/10 "ok làm ủy thác") ----------
// Nhân vật đang TỰ ĐÁNH ở bãi luyện công (hoặc đang ở thành trong chuyến về thành của Trợ Thủ) mà máy chủ không nhận nhịp quá vangGiay
// (đóng trang, tắt máy, mất mạng, đổi sang nhân vật khác — tab ẩn vẫn gửi nhịp ≥ 1 lần / phút nên vẫn là "đang chơi") -> lần nhịp kế tiếp
// máy chủ cày thay cả khoảng vắng ở bãi đó:
//   - tốc độ = tốc độ giết máy chủ đo được 30 phút chơi gần nhất ở bãi đó (đã gồm lúc chết, về thành) × tiLe (70 %); đo chưa đủ 5 phút ->
//     số đo cũ của bãi đó, chưa có thì mucDinh (300 quái / giờ);
//   - tối đa gioNgay (12) giờ mỗi ngày (ngày giờ Việt Nam, tính lại lúc 0 giờ);
//   - không tốn thuốc, không chết, đồ không hao độ bền (TẠM); trùm bãi 1 con mỗi 40 con như trong trận;
//   - kinh nghiệm / tiền / đồ đúng luật đánh thật (motCon); tiền + đồ qua bộ lọc nhặt của Trợ Thủ (hero.auto.nhat), đồ nhặt dưới mức bán
//     (Trợ Thủ "Bán đồ trong túi" + h.locDo) bán luôn, còn lại vào túi — túi đầy thì bán.
// h.uyThac = { bai, on (lúc nhịp cuối đang tự đánh), toc (quái / giờ), lan (ms nhịp cuối), ngay, dung (giây đã ủy thác trong ngày) }
const UT = { tiLe: 0.7, gioNgay: 12, mucDinh: 300, vangGiay: 90, ...(CFG.uyThac || {}) };
const DO_TOC = new Map(); // "tài khoản|ô" -> { bai, at, b: [[phút, giây, quái], …] } (bộ nhớ — tắt máy chủ thì đo lại)
const ngayVN = (t) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);
const nuaDemSau = (t) => Date.parse(ngayVN(t) + "T00:00:00Z") - 7 * 3600e3 + 86400e3; // 0 giờ ngày sau (giờ Việt Nam)
// số giây được ủy thác trong [t0, t1] (mỗi ngày tối đa gioNgay giờ, cả khoảng tối đa toiDa giây — giờ Bạch Câu Hoàn còn); ghi luôn số đã
// dùng vào U
function choPhep(U, t0, t1, toiDa = Infinity) {
  let s = 0, t = t0;
  while (t < t1 && s < toiDa) {
    const d = ngayVN(t), het = Math.min(t1, nuaDemSau(t)), dung = U.ngay === d ? U.dung || 0 : 0;
    const cho = Math.max(0, Math.min((het - t) / 1000, UT.gioNgay * 3600 - dung, toiDa - s));
    s += cho;
    if (!U.ngay || d >= U.ngay) { U.ngay = d; U.dung = Math.round(dung + cho); } // ngày cũ hơn ngày đã ghi (chỉ khi thử lùi giờ): không ghi đè
    t = het;
  }
  return Math.floor(s);
}
// cày thay khoảng [t0, t1] -> bảng tổng kết (null: không ủy thác — bãi không còn / chưa đủ cấp / hết giờ trong ngày)
function uyThac(h, t0, t1) {
  const U = h.uyThac, Z = ZONES.get(U.bai | 0);
  if (!Z || !FARM.has(Z.kind) || !(Z.m && Z.m.length) || (h.lvl || 1) < capVao(Z)) return null;
  // anh 27/10 "ủy thác cần Bạch Câu Hoàn chứ không free": chỉ cày trong số giờ Bạch Câu Hoàn còn (h.bch giây — Bạch Câu Hoàn Đặc Biệt của
  // Kỳ Trân Các +8 giờ mỗi viên), vẫn tối đa gioNgay giờ / ngày
  const bch0 = Math.max(0, h.bch | 0), vang = Math.round((t1 - t0) / 1000), giay = choPhep(U, t0, t1, bch0);
  h.bch = bch0 - giay; if (h.bch <= 0) delete h.bch;
  const kq = { vang, giay, conGiay: Math.max(0, UT.gioNgay * 3600 - (U.dung || 0)), bch: h.bch | 0, thieuBch: giay < Math.min(vang, UT.gioNgay * 3600) && bch0 - giay <= 0 ? 1 : 0,
    bai: Z.n, toc: U.toc || UT.mucDinh, tiLe: UT.tiLe, quai: 0, trum: 0, ta: 0, kn: 0, len: 0, tien: 0, giu: [], giuN: 0, giuD: {}, ban: 0, day: 0, banTien: 0, bo: 0, bao: [], dacBiet: {} };
  if (giay < 60) return vang >= 300 ? kq : null; // vắng ≥ 5 phút mà hết giờ trong ngày / hết Bạch Câu Hoàn: vẫn báo (bảng ghi lý do)
  h.lvl = h.lvl || 1; h.exp = h.exp || 0; h.gold = h.gold || 0;
  const A = h.auto || {}, N = { on: 1, tien: 1, trang: 1, dong: 1, ...(A.nhat || {}) }, banO = !!(A.treo || {}).ban && h.locDo > 0;
  const n = Math.round((kq.toc * UT.tiLe * giay) / 3600), luck = mayMan(h), lv0 = h.lvl;
  for (let i = 1; i <= n; i++) {
    // thủ lĩnh mỗi thuLinhMoi con, tinh anh mỗi tinhAnhMoi con như trong trận
    const boss = Z.boss != null && MS.mobs[Z.boss] && i % QD.thuLinhMoi === 0, ta = !boss && i % QD.tinhAnhMoi === 0 && !!taBai(Z);
    const id = boss ? Z.boss : Z.m[ri(0, Z.m.length - 1)];
    if (!MS.mobs[id]) continue;
    const r = motCon(h, Z, id, clamp(ri(Z.lo, Z.hi), 1, MS.maxLevel), boss, ri(0, 4), luck, 1, ta);
    kq.quai++; if (boss) kq.trum++; if (ta) kq.ta++; kq.kn += r.e;
    if (r.g && N.on && N.tien) { h.gold += r.g; kq.tien += r.g; }
    for (const it of r.its) uyThacMon(h, Z, it, kq, N, banO);
  }
  kq.len = h.lvl - lv0;
  return kq;
}
// bộ lọc nhặt của Trợ Thủ y như trong trận (src/game/auto.js nhatMon / hopLoc — thẻ Nhặt đồ, anh 28/10 lần 4): danh sách không nhặt (tên chứa
// chữ), chỉ trang sức (nhẫn / dây chuyền / ngọc bội — mã loại món client 3 / 4 / 9), đồ trắng, đồ xanh từ N.dong dòng, lọc dòng (bật + có dòng
// đã tích -> phải có ít nhất 1 dòng đã tích đạt mức)
const TRANG_SUC = new Set([3, 4, 9]);
const boQuaMon = (N, it) => { const ten = tenMon(it).normalize("NFC").toLowerCase(); return (N.boQua || []).some((t) => ten.includes(String(t).normalize("NFC").toLowerCase())); };
function nhatDuoc(N, it) {
  if (boQuaMon(N, it)) return false;
  if (N.trangSuc && !TRANG_SUC.has((BY.get(it.k) || {}).t)) return false;
  const d = it.d || [];
  if (!d.length) return !!N.trang;
  if (d.length < N.dong) return false;
  const L = N.loc;
  if (!L || !L.on || !Object.values(L.ds || {}).some((v) => v && v.on)) return true;
  return d.some(([k, v]) => { const c = L.ds[k]; return !!c && !!c.on && v >= c.n; });
}
// 1 món rơi lúc ủy thác: đồ chí / lộ chí -> như nhặt; món đặc biệt (mật đồ, Thủy Tinh …) -> túi (dồn chồng, hết chỗ thì mất); trang bị theo bộ
// lọc nhặt / bán của Trợ Thủ
function uyThacMon(h, Z, it, kq, N, banO) {
  const x = BY.get(it.k) || {};
  if ((x.chi || x.ktc) && boQuaMon(N, it)) { kq.bo++; return; } // có trong danh sách không nhặt
  if (x.chi || x.ktc) {
    if (x.chi) nhatChi(h, it, Z.id);
    else { try { themChong(h, x, it.n || 1); } catch { kq.day++; return; } }
    kq.dacBiet[x.n] = (kq.dacBiet[x.n] || 0) + (it.n || 1);
    return;
  }
  const dong = it.d.length; ngBai(it, Z && Z.id);
  if (!N.on || !nhatDuoc(N, it)) { kq.bo++; return; } // Trợ Thủ không nhặt
  if (banO && dong < h.locDo) { const p = giaBan(it); h.gold += p; kq.ban++; kq.banTien += p; return; }
  it.u = ++h.uN;
  if (!vaoTui(h, it)) { const p = giaBan(it); h.gold += p; kq.day++; kq.banTien += p; return; }
  kq.giuN++; kq.giuD[dong] = (kq.giuD[dong] || 0) + 1; // giuD: số món giữ lại theo số dòng (bảng tổng kết gọn — anh 27/10)
  if (kq.giu.length < 30) kq.giu.push({ n: tenMon(it), d: dong });
  if (dong >= CFG.thongBaoTuDong) kq.bao.push(it);
}
// đầu nhịp: vắng mặt quá vangGiay mà lúc đi đang tự đánh -> ủy thác khoảng vắng
function uyThacVe(h) {
  const U = h.uyThac, t = Date.now();
  if (!U || !U.on || !U.lan || t - U.lan <= UT.vangGiay * 1000) return null;
  const kq = uyThac(h, U.lan, t);
  U.lan = t;
  return kq;
}
// cuối nhịp: đo tốc độ giết + nhớ trạng thái. s = { zone, auto } của trình duyệt (null: rời game / chưa vào), n = số quái máy chủ vừa nhận.
// ten = tài khoản: đang được tăng ích tổ đội (coTangIch — anh 03/11 "ủy thác k tính") thì nhịp này không tính vào đo (cả giờ lẫn quái).
// Trả true khi nên ghi file (mỗi phút 1 lần — lúc nhịp cuối luôn gần đúng nếu máy chủ tắt bật lại)
function uyThacDo(h, key, s, n, ten) {
  const t = Date.now(), U = (h.uyThac = h.uyThac || {}), Z = s ? ZONES.get(s.zone) : null;
  const farm = !!Z && FARM.has(Z.kind), town = !!Z && !FARM.has(Z.kind);
  let M = DO_TOC.get(key);
  if (s && s.auto && farm && (!M || M.bai !== Z.id)) { M = { bai: Z.id, at: t, b: [] }; DO_TOC.set(key, M); }
  if (M && s && s.auto && (farm ? Z.id === M.bai : town)) { // ở bãi đang đo / về thành giữa chừng: tính thời gian + quái
    const phut = Math.floor(t / 60000), giay = Math.min(5, (t - M.at) / 1000), c = M.b[M.b.length - 1];
    const bo = (ten && coTangIch(ten)) || PTH().dangTheo(h, key); // tăng ích tổ đội / có phân thân đang theo (anh 05/11): nhịp này không cộng giờ / quái — bãi vẫn nhận như cũ
    if (!bo) { if (c && c[0] === phut) { c[1] += giay; c[2] += n; } else M.b.push([phut, giay, n]); }
    M.b = M.b.filter((x) => x[0] > phut - 30);
    const tg = M.b.reduce((a, x) => a + x[1], 0), q = M.b.reduce((a, x) => a + x[2], 0);
    if (tg >= 300) { U.toc = Math.round((q * 3600) / tg); U.bai = M.bai; }
    else if (U.bai !== M.bai) { U.bai = M.bai; U.toc = 0; } // bãi mới, chưa đủ 5 phút: mucDinh
  }
  if (M) M.at = t;
  if (s) U.on = s.auto && U.bai != null && (farm ? Z.id === U.bai : town) ? 1 : 0; // rời game (s null): giữ trạng thái lúc nhịp trước
  U.lan = t;
  if (t - (U.luu || 0) < 60000) return false;
  U.luu = t;
  return true;
}
// công cụ thử (quản trị): ủy thác b.gio giờ ngay (b.bai: bãi — không có thì bãi đang đo; b.boCap: bỏ giới hạn giờ trong ngày)
function thuUyThac(h, b) {
  const U = (h.uyThac = h.uyThac || {}), t = Date.now();
  if (b.xem) return { trangThai: uyThacTin(h) };
  const Z = ZONES.get(b.bai | 0);
  if (Z && FARM.has(Z.kind)) { if (U.bai !== Z.id) U.toc = 0; U.bai = Z.id; }
  if (b.boCap) U.dung = 0;
  const gio = clamp(+b.gio || 1, 0.05, 48);
  const kq = uyThac(h, t - gio * 3600e3, t);
  U.lan = t;
  return { kq, trangThai: uyThacTin(h) };
}
const uyThacTin = (h) => { const U = h.uyThac || {}, Z = ZONES.get(U.bai | 0); return { bai: Z ? Z.n : null, baiId: U.bai ?? null, toc: U.toc || 0, mucDinh: UT.mucDinh, tiLe: UT.tiLe, on: !!U.on, dung: U.ngay === ngayVN(Date.now()) ? U.dung || 0 : 0, gioNgay: UT.gioNgay }; };

function chet(h) {
  const exp = Math.min(DEATH.expCap, Math.floor((need(h.lvl || 1) * DEATH.expPermille) / 1000)), gold = Math.floor(((h.gold || 0) * DEATH.goldPermille) / 1000);
  h.exp = (h.exp || 0) - exp; h.gold = (h.gold || 0) - gold; // kinh nghiệm được âm như client
  return { exp, gold };
}

// ---------- mặc / tháo / bán / bộ lọc ----------
const loi = (msg) => { throw Object.assign(new Error(msg), { code: 400 }); };
// sức mạnh / thân pháp / sinh khí / nội công đang có = điểm gốc + điểm đã cộng + dòng xanh có tác dụng của đồ đang mặc (độ bền 0 thì không) —
// như client: engine KItemList::EnoughAttrib so yêu cầu với m_nCurStrength… (đã cộng đồ đang mặc), tháo đồ không bắt tháo món khác (anh 30/10
// "các dòng sinh khí sức mạnh thân pháp trên trang bị không cộng vào chỉ số như trên client"). GIỐNG src/game/itemdb.js diemCo
const DIEM_DONG = { strength_v: "str", dexterity_v: "dex", vitality_v: "vit", energy_v: "eng" };
function diemCo(h) {
  const s = h.start || {}, a = h.attr || {}, c = { str: (s.str || 0) + (a.str || 0), dex: (s.dex || 0) + (a.dex || 0), vit: (s.vit || 0) + (a.vit || 0), eng: (s.eng || 0) + (a.eng || 0) };
  for (const [slot, it] of Object.entries(h.equip || {})) {
    if (!it || !it.k || it.ben === 0) continue;
    const kich = soKich(h, slot, it);
    (it.d || []).forEach(([k, v], i) => { if (DIEM_DONG[k] && coTacDung(i, kich)) c[DIEM_DONG[k]] += v; });
  }
  return c;
}
// yêu cầu mặc: cấp, trùng sinh, giới tính, sức mạnh / thân pháp — anh 04/11 bỏ yêu cầu ngũ hành (reqSeries) / môn phái (fac): "để người chơi có thể
// mang đồ thoải mái hơn". GIỐNG src/game/itemdb.js canWear
function yeuCau(h, it) {
  const g = GOC[it.k] || {};
  if ((h.lvl || 1) < capYeuCau(it)) return `Cần đẳng cấp ${capYeuCau(it)}`;
  if (g.reborn) return "Cần trùng sinh";
  if (g.sex && g.sex !== h.sex) return g.sex === "f" ? "Chỉ nữ mặc được" : "Chỉ nam mặc được";
  const c = g.str || g.dex ? diemCo(h) : null;
  if (g.str && c.str < g.str) return `Cần sức mạnh ${g.str}`;
  if (g.dex && c.dex < g.dex) return `Cần thân pháp ${g.dex}`;
  return null;
}
// mặc / tháo / đặt (cầm món trên tay rồi đặt — src/game/windows.js): vị trí x, y = ô trên trái trong túi
function lam(h, b, key, tk) { // tk: tài khoản (api.js /api/do) — việc đếm theo tài khoản (banXu)
  if (h.khoa && KHOA.has(b.act) && !(b.act === "lay" ? b.r === "tm" : b.act === "chuyenR" ? b.tu === "tm" : false)) loi("Rương và trang bị đang khóa — mở khóa ở Rương chứa đồ (nút Khóa, nhập mật mã)");
  const i = h.bag.findIndex((it) => it.u === (b.u | 0)), it = h.bag[i];
  const bx = Number.isInteger(b.x) ? b.x : null, by = Number.isInteger(b.y) ? b.y : null;
  switch (b.act) {
    case "mac": { // b.slot (tùy): ô trang bị trình duyệt chọn (đặt món lên ô nhẫn trái / phải)
      if (!it) loi("Không có món này trong túi");
      const x = BY.get(it.k), own = x && SLOT_OF[x.t];
      if (!own) loi("Món này không mặc được");
      let slot = own;
      if (own === "Ring1") slot = b.slot === "Ring1" || b.slot === "Ring2" ? b.slot : h.equip.Ring1 && !h.equip.Ring2 ? "Ring2" : "Ring1";
      else if (b.slot && b.slot !== own) loi(`${tenMon(it)} không mặc vào ô này được`);
      const why = yeuCau(h, it); if (why) loi(`${tenMon(it)}: ${why}`);
      const old = h.equip[slot];
      h.bag.splice(i, 1);
      // món đang mặc ở ô đó về túi: vào đúng chỗ món vừa mặc nếu vừa, không thì ô trống đầu tiên
      if (old && !vaoTui(h, old, it.x, it.y)) { h.bag.splice(i, 0, it); loi("Hành trang đầy, không tháo được món đang mặc"); }
      delete it.x; delete it.y; h.equip[slot] = it;
      return { msg: "Mặc " + tenMon(it) };
    }
    case "thao": { // b.x, b.y (tùy): đặt vào ô đó của túi
      const s = String(b.slot || ""), cur = h.equip[s];
      if (!cur) loi("Ô này không mặc gì");
      if (bx != null && !choTrong(h.bag, cur, bx, by)) loi("Chỗ đó không đủ ô trống");
      if (!vaoTui(h, cur, bx, by)) loi("Hành trang đầy");
      delete h.equip[s];
      return { msg: "Tháo " + tenMon(cur) };
    }
    case "dat": { // dời món trong túi tới (x, y)
      if (!it) loi("Không có món này trong túi");
      return datLai(h.bag, it, bx, by);
    }
    // tách chồng (anh 28/10 — client: Shift + chuột phải -> khung 拆分): b.n (1 … n − 1) sang chồng mới ở ô trống đầu tiên; b.het ("Tách toàn
    // bộ" — client 连续拆分) = tách liên tục từng phần b.n tới khi chồng gốc còn ≤ b.n hoặc hết ô trống
    case "tach": {
      if (!it) loi("Không có món này trong túi");
      if (!xepChong(it) || (it.n | 0) < 2) loi("Món này không tách được");
      const n = clamp(b.n | 0, 1, it.n - 1); let lan = 0;
      do {
        const moi = { ...it, n }; delete moi.u; delete moi.x; delete moi.y;
        const at = choDau(h.bag, moi); if (!at) break;
        [moi.x, moi.y] = at; moi.u = ++h.uN; h.bag.push(moi); it.n -= n; lan++;
      } while (b.het && it.n > n);
      if (!lan) loi("Hành trang không đủ chỗ");
      return {};
    }
    // ---- rương chứa đồ (26/10): cat = túi -> rương, lay = rương -> túi (ở ô x, y nếu có), datR = dời trong rương; gui / rut = gửi / rút
    // ngân lượng b.n
    case "cat": {
      if (!it) loi("Không có món này trong túi");
      if (it.tk) loi(CAU_TK);
      if (b.r === "tm" && laThuoc(it)) loi(TM_THUOC); // anh 16/11: túi tử mẫu (mở ở đâu cũng được) không chở thuốc — luật mang tối đa MANG() bình
      chuyen(h, h.bag, ruongSo(h, b.r), it, bx, by);
      return {};
    }
    case "chuyenR": { // dời món giữa 2 kho (rương chính 0 / rương mở rộng 1–3 / túi tử mẫu "tm") tới ô (x, y) của kho đích
      const A = ruongSo(h, b.tu), B = ruongSo(h, b.den), r = A.find((o) => o.u === (b.u | 0));
      if (!r) loi("Không có món này");
      if (A === B) return datLai(A, r, bx, by);
      if (b.den === "tm" && laThuoc(r)) loi(TM_THUOC); // anh 16/11: rương -> túi tử mẫu cũng không cho thuốc
      chuyen(h, A, B, r, bx, by);
      return {};
    }
    case "lay": case "datR": {
      const R = ruongSo(h, b.r), r = R.find((o) => o.u === (b.u | 0));
      if (!r) loi("Không có món này trong rương");
      if (b.act === "datR") return datLai(R, r, bx, by);
      // anh 16/11 ("mua máu bỏ vào túi tử mẫu thì mang được rất nhiều máu lên bãi"): thuốc cất từ trước trong túi tử mẫu chỉ lấy ra ở thành / thôn — ra bãi không nạp lại được
      if (b.r === "tm" && laThuoc(r) && !THANH.has((ZONES.get(BAI_NAY.get(key)) || {}).kind)) loi(`Thuốc trong túi tử mẫu chỉ lấy ra được ở thành thị hoặc thôn trang (mang theo tối đa ${MANG()} bình)`);
      const con = laThuoc(r) ? MANG() - soThuoc(h) : Infinity; // mang tối đa MANG() bình thuốc mọi loại
      if (con <= 0) loi(`Chỉ mang tối đa ${MANG()} bình thuốc (mọi loại) — đang có ${soThuoc(h)}`);
      const n0 = r.n, da = chuyen(h, R, h.bag, r, bx, by, con);
      return laThuoc(r) && n0 > da ? { msg: `Lấy ${da} ${tenMon(r)} — mang tối đa ${MANG()} bình thuốc, còn ${n0 - da} bình trong rương` } : {};
    }
    // sắp xếp (anh 06/11): chỉ khi bấm nút Sắp xếp — túi không bao giờ tự xếp (anh 25/10). b.kho = "tui" | 0 | 1–3 | "tm"; b.uong = thuốc đã
    // uống chưa báo (chỉ khi xếp túi — trình duyệt giữ nhịp tới lúc trả lời, main.js xepDo). Không vừa: báo lỗi, không đổi gì
    case "xep": {
      if (b.kho == null) loi("Không rõ kho");
      const tui = b.kho === "tui", L = tui ? h.bag : ruongSo(h, b.kho), C = xepLuoi(structuredClone(L), tui && Array.isArray(b.uong) ? b.uong : null);
      if (!C) loi(`${tui ? "Hành trang" : "Rương"} quá chật, không sắp xếp được — bớt vài món rồi thử lại`);
      L.length = 0; L.push(...C);
      return { msg: `Đã sắp xếp ${tui ? "hành trang" : b.kho === "tm" ? "túi tử mẫu" : b.kho | 0 ? `rương mở rộng ${b.kho | 0}` : "rương chứa đồ"}` };
    }
    case "gui": case "rut": {
      const n = Math.floor(+b.n || 0), gui = b.act === "gui", co = gui ? h.gold || 0 : h.tienRuong || 0;
      if (n <= 0) loi("Số tiền không hợp lệ");
      if (n > co) loi(gui ? "Ngân lượng mang theo không đủ" : "Ngân lượng trong rương không đủ");
      h.gold = (h.gold || 0) + (gui ? -n : n); h.tienRuong = (h.tienRuong || 0) + (gui ? n : -n);
      return { msg: `${gui ? "Gửi" : "Rút"} ${tien(n)} ${gui ? "vào" : "từ"} rương` };
    }
    // ---- rương mở rộng (Thẩm Cửu) + mật mã rương + Tiền trang
    case "moRuong": {
      const n = h.ruongMo | 0, gia = RG.moRong[n];
      if (gia == null) loi(`Đã mở đủ ${RG.moRong.length} rương mở rộng`);
      if ((h.xu | 0) < gia) loi(`Cần ${gia} Xu — trên người có ${h.xu | 0} Xu`);
      h.xu -= gia; h.ruongMo = n + 1; h.ruongPhu = h.ruongPhu || []; h.ruongPhu[n] = [];
      return { msg: `Mua rương mở rộng ${n + 1}: -${gia} Xu. Mở rương chứa đồ, bấm nút Mở rộng để xem${h.mkRuong ? "" : " — bấm Mật mã để thiết lập mật mã rương"}` };
    }
    case "datMk": case "doiMk": {
      if (!(h.ruongMo > 0)) loi("Chưa mua chức năng mở rộng rương — đến Thẩm Cửu, Ba Lăng");
      if (b.act === "datMk" && h.mkRuong) loi("Đã có mật mã — dùng Đổi mật mã");
      if (b.act === "doiMk" && !dungMk(h, b.mk)) loi("Mật mã cũ không đúng");
      const moi = String(b.moi ?? "");
      if (!MK_RE.test(moi)) loi(moi[0] === "0" ? "Số đầu của mật mã không thể là số 0." : "Mật mã 1 – 9 chữ số");
      h.mkRuong = bamMk(moi);
      return { msg: b.act === "datMk" ? "Đã thiết lập mật mã rương" : "Đã đổi mật mã rương" };
    }
    case "khoa": {
      if (!h.mkRuong) loi("Chưa thiết lập mật mã — bấm Mật mã ở rương chứa đồ");
      h.khoa = 1;
      return { msg: "Đã khóa: không mặc / tháo đồ, không lấy đồ / tiền ra khỏi rương" };
    }
    case "moKhoa": {
      const s = saiMk.get(h.name), t = Date.now();
      if (s && s.n >= 5 && t < s.den) loi(`Nhập sai quá 5 lần — thử lại sau ${Math.ceil((s.den - t) / 60000)} phút`);
      if (!dungMk(h, b.mk)) { saiMk.set(h.name, { n: s && t < s.den ? s.n + 1 : 1, den: t + 600000 }); loi("Mật mã không đúng"); }
      saiMk.delete(h.name); h.khoa = 0;
      return { msg: "Đã mở khóa" };
    }
    // ---- Lễ quan → Mở Pass Rương (xoaMkCua): b.viec "xem" | "dangKy" | "xacNhan" | "huy"; lời báo như script client
    case "xoaMk": {
      const st = xoaMkCua(h);
      if (b.viec === "dangKy") {
        if (st.dk) loi("Đại hiệp đã đăng ký xóa pass rương rồi");
        if (!h.mkRuong) loi("Rương chứa đồ của đại hiệp chưa có mật mã");
        h.xoaMk = ngaySo(Date.now());
        return { xoaMk: xoaMkCua(h) };
      }
      if (b.viec === "xacNhan") {
        if (!st.xacNhan) loi(st.dk ? "Chưa tới ngày xác nhận xóa pass rương" : "Đại hiệp chưa đăng ký xóa pass rương");
        delete h.mkRuong; delete h.xoaMk; h.khoa = 0; saiMk.delete(h.name);
        return { msg: "Đã mở pass rương thành công!", xoaMk: xoaMkCua(h) };
      }
      if (b.viec === "huy") {
        if (!st.dk) loi("Đại hiệp chưa đăng ký xóa pass rương");
        delete h.xoaMk;
        return { msg: "Hủy bỏ xóa pass rương thành công!", xoaMk: xoaMkCua(h) };
      }
      return { xoaMk: st, ...(st.het ? { msg: "Ngày xác nhận xoá pass rương đã quá hạn, xin hãy đăng ký lại!" } : {}) };
    }
    // ---- Kỳ Trân Các: mua bằng Xu (b.k, b.n — giá theo ảnh anh gửi, assets/data/ky-tran-cac.json), dùng món (dungVat)
    // Anh 12/11 "đồ mua = xu ở kỳ trân các k giao dịch, k ném ra được, k bán dc, chỉ hủy dc ở lễ quan": món mua ở đây khóa bảo hiểm vĩnh viễn
    // (KBH_VV — chặn giao dịch / bày bán Chợ Trời / vứt như thưởng thăng cấp; món Kỳ Trân Các vốn không bán cửa hàng được — act ban), không cần nữa thì
    // Lễ quan → Hủy vật phẩm (act huy). Món mở / rút ra từ món khóa (lễ bao, mã bài) khóa theo (dungVat). Chỉ món mua từ nay — món mua trước không ghi
    // nguồn nên giữ nguyên; món cùng loại rơi từ quái / boss vẫn giao dịch được (chồng riêng theo trạng thái khóa — themChong)
    case "muaKtc": {
      const x = BY.get(String(b.k)), gia = HANG_KTC.get(String(b.k)), n = clamp(b.n | 0, 1, TC.muaToiDa);
      if (!x || gia == null) loi("Kỳ Trân Các không bán món này");
      // hàng sự kiện (anh 16/11 — Báo Đáp Ân Sư: dòng sk "bdas"): chỉ bán khi sự kiện đang mở
      if (SK_KTC.has(x.k) && !skMo(SK_KTC.get(x.k), !!(tk && tk.admin))) loi(SK_KTC.get(x.k) === "bdas" ? "Hàng sự kiện chỉ bán trong thời gian hoạt động báo đáp ân sư" : "Hàng sự kiện hiện không bán");
      // chỉ mua ở thành thị / thôn trang; ở bãi luyện công chỉ xem (anh 28/10 lần 3)
      if (!THANH.has((ZONES.get(BAI_NAY.get(key)) || {}).kind)) loi("Bảo vật chỉ mua được ở thành thị hoặc thôn trang — ở bãi luyện công chỉ xem được");
      if ((h.xu | 0) < gia * n) loi(`Không đủ Xu — cần ${gia * n} Xu, trên người có ${h.xu | 0} Xu`);
      const kb = KHONG_KHOA.has(x.k) ? 0 : KBH_VV; // Mật đồ thần bí không bao giờ khóa (anh 05/11 — Kỳ Trân Các hiện không bán)
      if (laLeBao({ k: x.k })) { // lễ bao: mỗi bao 1 ô (đếm số viên còn)
        const moi = [];
        for (let j = 0; j < n; j++) { const o = { k: x.k, n: 1, con: x.dung.so, ...voiKhoa(kb) }, at = choDau([...h.bag, ...moi], o); if (!at) loi("Hành trang không đủ chỗ"); [o.x, o.y] = at; moi.push(o); }
        for (const o of moi) { o.u = ++h.uN; h.bag.push(o); }
      } else themChong(h, x, n, kb);
      h.xu -= gia * n;
      return { msg: `Mua ${n} ${x.n.trim()}: -${gia * n} Xu${kb ? " — " + CAU_KBH.xu : ""}` };
    }
    // ---- cửa hàng phúc duyên (Nhận thưởng → Phúc duyên → Giao dịch): b.k, b.n — trừ điểm phúc duyên (FuYuan_Reduce: "Bạn đã tốn N điểm phúc duyên")
    case "muaPd": {
      const x = BY.get(String(b.k)), gia = HANG_PD.get(String(b.k)), n = clamp(b.n | 0, 1, TC.muaToiDa), co = (h.pd && h.pd.bat && h.pd.diem) | 0;
      if (!x || gia == null) loi("Thần bí Thương Nhân không bán món này");
      if (co < gia * n) loi(`Không đủ điểm phúc duyên — cần ${gia * n}, đang có ${co}`);
      themChong(h, x, n);
      h.pd.diem = co - gia * n;
      return { msg: `Mua ${n} ${x.n.trim()}: Bạn đã tốn ${gia * n} điểm phúc duyên (còn ${h.pd.diem})` };
    }
    // ---- Quân Nhu quan Tống Kim (anh 06/11 — may-chu/tong-kim.js, client song_shop.lua / Sale 98): b.k, b.n — trừ điểm Tống Kim h.diemTk; chỉ ở Biện Kinh,
    // không bán khi trận đang đánh; đủ chỗ trong túi mới trừ điểm (món không khóa — như thưởng cuối trận)
    case "muaTk": {
      const TK = TKM(), x = BY.get(String(b.k)), gia = TK.giaTk().get(String(b.k)), n = clamp(b.n | 0, 1, TC.muaToiDa), co = h.diemTk | 0;
      if (!x || gia == null) loi("Quân Nhu quan không bán món này");
      // Quân Nhu quan đứng ở Điểm báo danh Tống Kim (bãi 325 — Xa phu Biện Kinh đưa tới; anh 13/11 "NPC bán đồ fix lại có thể mua"): trước chỉ nhận Biện Kinh nên luôn báo lỗi
      if (BAI_NAY.get(key) !== TK.BIEN_KINH && BAI_NAY.get(key) !== TK.BAO_DANH) loi("Chỉ mua được ở Quân Nhu quan (Điểm báo danh Tống Kim)");
      if (TK.dangDanh()) loi("Quân Nhu quan: Chiến tranh đang diễn ra ác liệt phía trước, các vị nên tạm lánh một chút!");
      if (co < gia * n) loi(`Không đủ điểm Tống Kim — cần ${gia * n}, đang có ${co}`);
      if (xepChong(x)) themChong(h, x, n); else taoQua(h, { mon: [{ k: x.k, n }] });
      h.diemTk = co - gia * n;
      return { msg: `Mua ${n} ${x.n.trim()}: tốn ${gia * n} điểm Tống Kim (còn ${h.diemTk})` };
    }
    case "dung": return dungVat(h, it, b, key, !!(tk && tk.admin)); // quản trị: thử món sự kiện ngoài ngày (anh 16/11 — Báo Đáp Ân Sư)
    // ---- mua lại món đã bán (lượt 88): b.u = mã món lúc bán; giá = giá mua lại đã chốt lúc bán; món về túi đúng như lúc bán (dòng, khóa, độ bền, phi phong…)
    case "muaLai": {
      const t = Date.now(), L = (Array.isArray(h.muaLai) ? h.muaLai : []).filter((x) => x && x.it && x.het > t), j = L.findIndex((x) => (x.it.u | 0) === (b.u | 0));
      if (j < 0) loi(`Món này không còn trong danh sách mua lại (chỉ giữ ${MUA_LAI.phut} phút sau khi bán)`);
      const r = L[j], x = BY.get(r.it.k);
      if (!x) loi("Món này không còn trong danh sách mua lại");
      if ((h.gold || 0) < r.gia) loi(`${CAU_KHIA} — Ngân lượng không đủ: mua lại cần ${tien(r.gia)}`);
      if (laThuoc(r.it) && soThuoc(h) + (r.it.n | 0) > MANG()) loi(`Mang tối đa ${MANG()} bình thuốc — bớt thuốc trong túi rồi mua lại`);
      const moi = { ...r.it, u: h.uN + 1 }; delete moi.x; delete moi.y;
      if (!vaoTui(h, moi)) loi("Hành trang không đủ chỗ");
      h.uN = moi.u; h.gold -= r.gia; L.splice(j, 1);
      if (L.length) h.muaLai = L; else delete h.muaLai;
      return { msg: `${CAU_KHIA} — Mua lại ${moi.n > 1 ? moi.n + " " : ""}${tenMon(moi)}: -${tien(r.gia)}` };
    }
    case "doiXu": {
      const n = Math.floor(+b.n || 0), gia = n * TT.luongMotXu;
      if (n < 1 || n > 100000) loi("Số Xu không hợp lệ");
      if ((h.gold || 0) < gia) loi(`Ngân lượng mang theo không đủ — cần ${tien(gia)}`);
      h.gold -= gia; h.xu = (h.xu | 0) + n;
      return { msg: `Đổi ${tien(gia)} lấy ${n} Xu` };
    }
    // ---- sửa đồ ở cửa hàng NPC (nút Sửa): b.slot = ô đang mặc, hoặc b.u = món trong túi. Câu báo theo engine (CoreShell GOI_TRADE_NPC_REPAIR)
    case "sua": {
      const o = b.slot ? (h.equip || {})[String(b.slot)] : it;
      if (!o) loi("Không có món này");
      if (!benMax(o.k)) loi("Vật phẩm này không thể sửa!");
      if (benCua(o) >= benMax(o.k)) loi("Vật phẩm này không cần sửa!");
      const p = giaSua(o);
      if ((h.gold || 0) < p) loi("Ngân lượng không đủ, không thể sửa!");
      h.gold = (h.gold || 0) - p; delete o.ben;
      return { msg: `Sửa ${tenMon(o)}: -${tien(p)}` };
    }
    case "ban": {
      if (!it) loi("Không có món này trong túi");
      // it.kbh + món của bảng Kỳ Trân Các: thuốc Hồi Thiên rút từ lễ bao mua bằng Xu (anh 12/11 — "k bán dc, chỉ hủy dc ở lễ quan")
      if (laKtc(it) || it.het || (it.kbh && KTC.items[it.k])) loi("Vật phẩm của Kỳ Trân Các không bán cho cửa hàng được");
      if (it.vv) loi("Ngựa vĩnh viễn từ mã bài không bán cho cửa hàng được"); // anh 16/11 — Báo Đáp Ân Sư (Mã bài Bôn Tiêu / Phiên Vũ)
      if (it.tk) loi(CAU_TK);
      const p = giaBan(it); h.bag.splice(i, 1); h.gold = (h.gold || 0) + p;
      giuMuaLai(h, it, p); // mua lại trong 5 phút (lượt 88)
      return { msg: `Bán ${it.n ? it.n + " " : ""}${tenMon(it)}: +${tien(p)}` };
    }
    case "mua": { // b.k = món bày ở cửa hàng (thuốc / Thổ Địa Phù / đồ trắng Tạp hóa), b.n = số lượng
      const x = BY.get(String(b.k)), n = b.n | 0;
      // trong trận Tống Kim (Quân y hậu doanh): thuốc Tống Kim nửa giá, rời trận / hết trận tự mất (anh 12/11 — CAU_TK)
      if (x && x.thuoc) { const tk = TKM().trongTran(key), g1 = tk ? TKM().giaThuocTk(x.gia) : x.gia; muaThuoc(h, x, n, tk ? g1 : 0); return { msg: `Mua ${n} ${x.n}${tk ? " (thuốc Tống Kim — rời trận tự mất)" : ""}: -${tien(g1 * n)}` }; }
      const g = HANG_VP.get(String(b.k));
      if (!x || !g) loi("Cửa hàng không bán món này");
      if (x.phu) { muaChong(h, x, g.gia, n); return { msg: `Mua ${n} ${x.n}: -${tien(g.gia * n)}` }; }
      // đồ trắng: mỗi lần 1 món, ngũ hành theo hàng bày (goods Series), m = 1 (giá bán lại như đồ rơi từ quái cấp 1)
      if ((h.gold || 0) < g.gia) loi("Ngân lượng không đủ");
      // hệ như chuan(): món có hệ cố định (ngựa — do-goc series / items.json s) thì chuan() ghi đè hệ khác lúc lưu -> lấy luôn ở đây cho câu báo đúng hệ thật
      // (rà soát lượt 58, anh 10/11: ngựa Mã phu không ngẫu nhiên — mỗi con 1 hệ, con cấp 7 / cấp 8 "Đại Uyển Bạch Mã" đều Thủy). Hàng không ghi hệ mà không
      // có hệ cố định: đang làm nhiệm vụ Dã Tẩu mua đúng món -> hệ nhiệm vụ đòi, còn lại ngẫu nhiên
      const coDinh = (GOC[x.k] || {}).series ?? (x.t === 10 && x.s >= 0 ? x.s : null);
      const heNv = DTA().heCanMua(h, x.k), it = { k: x.k, s: coDinh ?? g.s ?? heNv ?? ri(0, 4), d: [], m: 1 }, at = choDau(h.bag, it);
      if (!at) loi("Hành trang không đủ chỗ");
      NG.gan(it, "mua", "cửa hàng NPC", h.name);
      [it.x, it.y] = at; it.u = ++h.uN; h.bag.push(it); h.gold -= g.gia;
      // câu báo (anh 10/11 — người chơi mua nhầm Đại Uyển Bạch Mã cấp 7 cho nhiệm vụ cấp 8): tên có cấp khi trùng tên, hệ với hàng không ghi hệ (ngựa);
      // đúng món nhiệm vụ Dã Tẩu đang đòi -> xác nhận, món cùng tên khác cấp -> nhắc món cần
      const dung = heNv != null && heNv === it.s, khac = dung ? null : DTA().canMuaKhac(h, x.k);
      return { msg: `Mua ${DTA().tenDo(x.k)}${g.s == null ? ` (${HE_TEN[it.s] || "?"})` : ""}${dung ? " — đúng món Dã Tẩu cần" : ""}: -${tien(g.gia)}${khac ? ` — chú ý: Dã Tẩu cần ${khac}, không phải món này` : ""}` };
    }
    case "phu": { // dùng Thổ Địa Phù (b.u): trừ 1 tấm — trình duyệt đưa về thành, nhớ chỗ dùng (Xa phu "Trở lại địa điểm cũ")
      if (!it || !laPhu(it)) loi("Không có Thổ Địa Phù");
      if (PLD().camPhu(h)) loi("Không thể sử dụng Thổ Địa Phù ở đây"); // trên thuyền / bờ Bắc Phong Lăng Độ (DisabledUseTownP — G_ItemList_0)
      if (LDA().chan(tkCuaKhoa(key), BAI_NAY.get(key), oCuaKhoa(key))) loi("Không thể sử dụng Thổ Địa Phù ở đây"); // Lôi Đài (anh 15/11): rời sân bằng nút Rời sân; soát 16/11: chỉ nhân vật có vai (ô khác cùng tài khoản dùng được)
      if ((ZONES.get(BAI_NAY.get(key) | 0) || {}).kind === "đua ngựa") loi("Không thể sử dụng Thổ Địa Phù ở đây"); // đua ngựa (anh 16/11 — client racegame cấm Thổ Địa Phù): rời đường đua bằng thanh đua
      it.n = (it.n || 1) - 1; if (it.n <= 0) h.bag.splice(i, 1);
      return { msg: `Dùng ${tenMon(it)}` };
    }
    case "thanh": { // Trợ Thủ ở thành (src/game/auto.js treo): bán món trong túi dưới mức Tự bán (b.ban), mua thuốc đủ số (b.mua = [[k, n]])
      let banN = 0, banT = 0;
      // Nhặt rác (Trợ Thủ thẻ Nhặt đồ — anh 08/11): b.giu = mã món giữ lại -> bán mọi trang bị trong túi trừ các món đó (món khóa, Kỳ Trân Các, món Dã Tẩu không bán)
      const giuRac = Array.isArray(b.giu) ? new Set(b.giu.slice(0, 100).map(Number)) : null;
      if (b.ban && (h.locDo || giuRac)) for (const o of [...h.bag]) {
        if (!(giuRac ? theoTuBan(o) && GOC[o.k] && !o.kbh && !giuRac.has(o.u) : banTuBan(h, o))) continue; // món Kỳ Trân Các (lễ bao, ngựa mã bài): không bán
        const p = giaBan(o); h.bag.splice(h.bag.indexOf(o), 1); h.gold = (h.gold || 0) + p; banN++; banT += p; giuMuaLai(h, o, p); // mua lại (lượt 88)
      }
      // tiền trong rương chính dùng được khi tiền mang theo không đủ (anh 01/11: "tiền không tự rút ra mua phù, mana") — trả bằng tiền mang theo
      // trước, thiếu mới lấy của rương (rương đang khóa thì không); xong việc phần chưa tiêu trả lại rương
      const ruong0 = h.khoa ? 0 : Math.max(0, Math.floor(+h.tienRuong || 0));
      h.gold = (h.gold || 0) + ruong0; h.tienRuong = (h.tienRuong || 0) - ruong0;
      // thieu: món muốn mua mà không mua đủ (anh 31/10 khuya: Trợ Thủ ra bãi không mang Thổ Địa Phù — trước im lặng bỏ qua khi túi đầy / thiếu tiền).
      // Thổ Địa Phù mua trước thuốc (vé về thành). Các dòng thuốc muốn quá MANG() bình thì chia theo tỉ lệ (anh 01/11 "không tự về thành mua mana":
      // mặc định 60 máu + 30 nội lực — trước dòng đầu lấy đủ 60 bình, thuốc nội lực không còn chỗ)
      const mua = [], thieu = [], ds = (Array.isArray(b.mua) ? b.mua.slice(0, 4) : []).map(([k, muon]) => [BY.get(String(k)), muon | 0]).filter(([x]) => x);
      ds.sort((a, c) => !!c[0].phu - !!a[0].phu);
      const tongThuoc = ds.reduce((t, [x, m]) => t + (x.thuoc && HANG.has(x.k) ? clamp(m, 0, MANG()) : 0), 0), ty = tongThuoc > MANG() ? MANG() / tongThuoc : 1;
      for (const [x, muon] of ds) {
        if (x.phu && HANG_VP.has(x.k)) { // Thổ Địa Phù: mua đủ số muốn có (không tính giới hạn thuốc)
          const g = HANG_VP.get(x.k), co = h.bag.reduce((t, o) => t + (o.k === x.k ? o.n || 0 : 0), 0);
          const can = clamp(muon, 0, TC.chongToiDa) - co, n = Math.min(can, Math.floor((h.gold || 0) / g.gia));
          if (n > 0) try { muaChong(h, x, g.gia, n); mua.push(`${n} ${x.n} -${tien(n * g.gia)}`); } catch { thieu.push(`${x.n} (túi đầy)`); continue; }
          if (can > Math.max(0, n)) thieu.push(`${x.n} (thiếu tiền)`);
          continue;
        }
        if (!x.thuoc || !HANG.has(x.k)) continue;
        let can = Math.min(Math.floor(clamp(muon, 0, MANG()) * ty) - h.bag.reduce((t, o) => t + (o.k === x.k ? o.n : 0), 0), MANG() - soThuoc(h)), da = 0, ly = "";
        while (can > 0) {
          const n = Math.min(can, TC.muaToiDa, Math.floor((h.gold || 0) / x.gia));
          if (n < 1) { ly = "thiếu tiền"; break; }
          try { muaThuoc(h, x, n); } catch { ly = "túi đầy"; break; } // hết chỗ trong túi
          can -= n; da += n;
        }
        if (da) mua.push(`${da} ${x.n} -${tien(da * x.gia)}`);
        if (ly) thieu.push(`${x.n} (${ly})`);
      }
      // sửa đồ (b.sua): đồ đang mặc trước rồi đồ trong túi, đủ tiền món nào sửa món đó
      let suaN = 0, suaT = 0;
      if (b.sua) for (const o of [...Object.values(h.equip || {}), ...h.bag]) {
        if (!benMax(o.k) || benCua(o) >= benMax(o.k)) continue;
        const g = giaSua(o); if ((h.gold || 0) < g) continue;
        h.gold -= g; delete o.ben; suaN++; suaT += g;
      }
      // phần tiền rương chưa tiêu về lại rương; rut = đã lấy của rương để mua / sửa
      const tra = Math.min(ruong0, h.gold || 0), rut = ruong0 - tra;
      h.gold -= tra; h.tienRuong += tra;
      // cất tiền vào rương chính, chỉ giữ trên người b.cat lượng (anh 28/10 lần 3 "cất hết tiền vào rương, chỉ để 1 số tiền nhất định khi treo máy",
      // mặc định 10 vạn) — sau khi đã sửa / mua xong
      let cat = 0;
      if (b.cat != null && Number.isFinite(+b.cat)) { const giu = clamp(Math.floor(+b.cat), 0, 1e12); if ((h.gold || 0) > giu) { cat = h.gold - giu; h.gold = giu; h.tienRuong = (h.tienRuong || 0) + cat; } }
      const p = [...(banN ? [`bán ${banN} món +${tien(banT)}`] : []), ...(rut ? [`lấy ${tien(rut)} trong rương`] : []), ...(suaN ? [`sửa ${suaN} món -${tien(suaT)}`] : []), ...(mua.length ? ["mua " + mua.join(", ")] : []), ...(thieu.length ? ["KHÔNG mua đủ " + thieu.join(", ")] : []), ...(cat ? [`cất ${tien(cat)} vào rương`] : [])];
      return { msg: "Trợ Thủ: " + (p.length ? p.join("; ") : "không cần bán / sửa / mua gì") };
    }
    case "catDo": { // Trợ Thủ ở thành, đã chạy tới Rương chứa đồ (anh 31/10: "sau khi bán hết rác, đồ nào phù hợp bộ lọc không bán thì chạy tới rương
      // cất vào rương chứa đồ"): món mức Tự bán giữ lại (giuTuBan) -> ô trống đầu của rương chính, đầy thì rương mở rộng đã mở (1–3)
      const dsCat = Array.isArray(b.ds) ? new Set(b.ds.slice(0, 100).map(Number)) : null; // Nhặt rác: cất đúng các món giữ lại (anh 08/11)
      if (!h.locDo && !dsCat) return { msg: "" };
      let n = 0, con = 0;
      for (const o of h.bag.filter((x) => (dsCat ? dsCat.has(x.u) && theoTuBan(x) : giuTuBan(h, x)))) {
        let vao = false;
        for (let r = 0; r <= (h.ruongMo | 0) && !vao; r++) try { chuyen(h, h.bag, ruongSo(h, r), o); vao = true; } catch { /* rương này hết chỗ */ }
        if (vao) n++; else con++;
      }
      return { msg: !n && !con ? "" : !n ? `Trợ Thủ: rương chứa đồ hết chỗ — ${con} món giữ lại vẫn trong túi` : `Trợ Thủ: cất ${n} món vào rương${con ? ` — rương hết chỗ, còn ${con} món trong túi` : ""}` };
    }
    case "vut": { // vứt món trong túi ra đất ở (b.x, b.y) của bãi b.z — nằm ở danh sách chung của bãi (ai cùng bãi cũng thấy, ai nhặt trước được) TD.giay giây
      if (!it) loi("Không có món này trong túi");
      if (it.kbh) loi(CAU_KBH.vut); // khóa bảo hiểm (anh 05/11 — engine ServerThrowAwayItem)
      if ((ZONES.get(b.z | 0) || {}).bang) loi("Khu vực bang hội không vứt vật phẩm ra đất được"); // đợt 4: vật vứt theo mã bãi — chung mọi bản bang
      if (LDA().chan(tkCuaKhoa(key), b.z, oCuaKhoa(key)) || LDA().laSan(BAI_NAY.get(key))) loi("Lôi đài không vứt vật phẩm ra đất được"); // Lôi Đài (anh 15/11): vật vứt chung cả bãi — đường đưa đồ cho nhau; soát 16/11: chỉ nhân vật có vai
      if (it.tk) loi(CAU_TK);
      h.bag.splice(i, 1); delete it.x; delete it.y;
      if (laTB(it)) NG.cu(it);
      const v = { z: b.z | 0, x: toaDo(b.x), y: toaDo(b.y), it, vut: 1, ai: h.name }; // ai: người vứt (nguồn gốc món — đường đi khi người khác nhặt)
      roiChung(v);
      return { msg: `Vứt ${it.n ? it.n + " " : ""}${tenMon(it)} ra đất`, vut: datTin(v) };
    }
    // Lễ quan → Hủy vật phẩm (anh 05/11: "thêm vào lễ quan 1 chức năng đó là hủy vật phẩm, có thể hủy tất cả các loại vật phẩm bao gồm khóa
    // bảo hiểm" — script client gm_tool\dispose_item.lua: GiveItemUI "Hủy vật phẩm" -> DisposeConfirm xóa mọi món đặt vào khung, ghi log).
    // b.ds = [mã món trong túi | { u, k, n } — món + số lượng lúc người chơi đồng ý ở khung hỏi] (lưới Giao vật phẩm 6 × 4); hủy cả chồng; có
    // món không còn trong túi hoặc đã đổi (soát trước khi lên VPS: chồng được gộp thêm trong lúc khung hỏi đang mở) thì không hủy món nào.
    // Trả huy: [món đã hủy] — api.js ghi nhật ký "huy" kèm món (quản trị tra lại được)
    case "huy": {
      const MAX = 24, ds = [], co = new Set();
      for (const v of Array.isArray(b.ds) ? b.ds : []) {
        const o = v && typeof v === "object" ? v : { u: v }, u = o.u | 0;
        if (u > 0 && !co.has(u)) { co.add(u); ds.push({ u, k: o.k, n: o.n }); }
      }
      if (!ds.length) loi("Chưa đặt vật phẩm nào vào khung");
      if (ds.length > MAX) loi(`Mỗi lần hủy tối đa ${MAX} món`);
      const L = ds.map((v) => h.bag.find((o) => o.u === v.u));
      if (L.some((o) => !o)) loi("Có món không còn trong hành trang — mở lại khung Hủy vật phẩm rồi đặt lại");
      if (ds.some((v, j) => (v.k != null && String(v.k) !== L[j].k) || (v.n != null && (v.n | 0) !== (L[j].n || 1)))) loi("Vật phẩm trong khung đã thay đổi số lượng — mở lại khung Hủy vật phẩm rồi đặt lại");
      h.bag = h.bag.filter((o) => !L.includes(o));
      return { msg: "Thao tác hủy vật phẩm thành công", huy: L };
    }
    case "loc": {
      h.locDo = clamp(b.n | 0, 0, 6);
      return { msg: (h.locDo ? `Bán đồ trong túi: món dưới ${h.locDo} dòng` : "Bán đồ trong túi: tắt") + " — Trợ Thủ bán ở thành theo mức này" };
    }
  }
  loi("Không rõ việc");
}

// dời món it trong lưới L (túi / rương) tới (bx, by): chỗ trống thì đặt; đặt lên chồng cùng loại thì dồn vào chồng đó (tới chongMax),
// còn dư giữ chỗ cũ; đè đúng 1 món khác thì đổi chỗ nếu món kia vừa chỗ cũ
function datLai(L, it, bx, by) {
  if (bx == null || by == null) loi("Thiếu vị trí");
  if (choTrong(L, it, bx, by, [it])) { it.x = bx; it.y = by; return {}; }
  const cung = xepChong(it) && L.find((o) => o !== it && o.k === it.k && cungKhoa(o, it) && o.x === bx && o.y === by); // khác trạng thái khóa: đổi chỗ
  if (cung) {
    const mx = chongMax(it.k), m = Math.min(it.n, mx - cung.n); if (m <= 0) loi(`Chồng đó đã đủ ${mx}${laThuoc(it) ? " bình" : ""}`);
    gopHet(cung, it); cung.n += m; it.n -= m; if (!it.n) L.splice(L.indexOf(it), 1);
    return {};
  }
  const [w, hh] = coMon(it), ox = it.x, oy = it.y;
  const de = L.filter((o) => o !== it && !choTrong([o], it, bx, by));
  if (bx < 0 || by < 0 || bx + w > BAG_W || by + hh > BAG_H || de.length !== 1) loi("Chỗ đó không đủ ô trống");
  const o = de[0], rest = L.filter((q) => q !== it && q !== o);
  if (!choTrong(rest, o, ox, oy) || !choTrong([...rest, { ...o, x: ox, y: oy }], it, bx, by)) loi("Chỗ đó không đủ ô trống");
  it.x = bx; it.y = by; o.x = ox; o.y = oy;
  return {};
}
// chuyển món it từ lưới A sang lưới B (túi <-> rương) — vào ô (x, y) của B nếu có, không thì ô trống đầu tiên. Món xếp chồng: dồn vào chồng
// cùng loại chưa đầy của B (ở đúng (x, y) nếu có) trước, phần còn lại sang ô trống; chuyển tối đa toiDa (giới hạn mang thuốc), phần không
// chuyển được ở lại A. Trả số đã chuyển; không chuyển được gì thì báo lỗi
function chuyen(h, A, B, it, x, y, toiDa = Infinity) {
  const coXY = Number.isInteger(x) && Number.isInteger(y), het = coXY ? "Chỗ đó không đủ ô trống" : "Không còn chỗ trống";
  if (!xepChong(it)) {
    const at = coXY ? (choTrong(B, it, x, y) ? [x, y] : null) : choDau(B, it);
    if (!at) loi(het);
    A.splice(A.indexOf(it), 1); [it.x, it.y] = at; B.push(it);
    return 1;
  }
  let con = Math.min(it.n, toiDa), da = 0;
  const mx = chongMax(it.k);
  for (const o of B.filter((q) => q.k === it.k && cungKhoa(q, it) && q.n < mx && (!coXY || (q.x === x && q.y === y)))) { const m = Math.min(con, mx - o.n); if (m > 0) gopHet(o, it); o.n += m; con -= m; da += m; }
  if (con > 0) {
    const moi = { k: it.k, n: con, ...khoaCua(it), ...(it.tk ? { tk: 1 } : {}) }, at = coXY ? (choTrong(B, moi, x, y) ? [x, y] : null) : choDau(B, moi);
    if (at && !da && con === it.n) { A.splice(A.indexOf(it), 1); [it.x, it.y] = at; B.push(it); return con; } // cả chồng sang
    if (at) { moi.u = ++h.uN; [moi.x, moi.y] = at; B.push(moi); da += con; }
  }
  if (!da) loi(het);
  it.n -= da; if (it.n <= 0) A.splice(A.indexOf(it), 1);
  return da;
}
// giá sửa món it (engine KItem::GetRepairPrice — phép chia nguyên theo đúng thứ tự của engine)
function giaSua(it) {
  const mx = benMax(it.k), cur = benCua(it);
  if (!mx || cur >= mx) return 0;
  return Math.floor((Math.floor((Math.floor(giaGoc(it.k) * SUA.gia / 100) * (mx - cur)) / mx) * (SUA.dong + (it.d || []).length)) / SUA.dong);
}
// hao mòn đồ đang mặc: ds = [số lần ra đòn, số lần bị đánh trúng mất máu, số lần sang vùng khác] (mỗi nhịp ≤ 600 lần mỗi việc) ->
// { doi, sap: [tên món còn ≤ SUA.bao], hong: [tên món vừa về 0] }
function hao(h, ds) {
  const kq = { doi: false, sap: [], hong: [] }, k = +DB.haoMon || 0;
  if (!Array.isArray(ds) || k <= 0) return kq;
  ["danh", "trung", "di"].forEach((viec, j) => {
    const n = clamp(ds[j] | 0, 0, 600); if (!n) return;
    for (const [slot, N] of Object.entries(HAO[viec])) {
      const it = (h.equip || {})[slot], mx = it && benMax(it.k);
      if (!mx || benCua(it) <= 0 || khongPha(it.d)) continue; // "Không thể phá hủy": không mòn
      let mat = 0; for (let i = 0; i < n; i++) if (Math.random() * N < k) mat++;
      if (!mat) continue;
      const con = Math.max(0, benCua(it) - mat);
      it.ben = con; kq.doi = true;
      if (!con) kq.hong.push(tenMon(it)); else if (con <= SUA.bao) kq.sap.push(tenMon(it));
    }
  });
  return kq;
}

// mua n bình thuốc x (1 – muaToiDa): dồn vào chồng cùng loại chưa đầy trước, rồi ô trống; thiếu tiền / chỗ thì báo lỗi, không mua gì
// tổng số bình thuốc trong túi (mọi loại) — mang tối đa TC.mangToiDa (anh 25/10: 60 bình bất kể loại, vd 30 máu + 30 nội lực)
const soThuoc = (h) => (h.bag || []).reduce((t, o) => t + (laThuoc(o) ? o.n || 0 : 0), 0);
const MANG = () => TC.mangToiDa || 60;
// anh 16/11: túi tử mẫu (hành trang phụ mở ở đâu cũng được) không cất thuốc — trước đó cất thuốc vào túi rồi ra bãi lấy dần, mang quá MANG() bình
const TM_THUOC = `Túi tử mẫu không cất được thuốc — thuốc chỉ mang theo trong hành trang (tối đa ${MANG()} bình mọi loại)`;
function muaThuoc(h, x, n, giaTk = 0) { // giaTk > 0: thuốc Tống Kim giá này (chồng riêng it.tk)
  if (!x || !x.thuoc || !HANG.has(x.k)) loi("Cửa hàng không bán món này");
  if (n < 1 || n > TC.muaToiDa) loi(`Mỗi lần mua 1 – ${TC.muaToiDa} bình`);
  const co = soThuoc(h);
  if (co + n > MANG()) loi(co >= MANG() ? `Chỉ mang tối đa ${MANG()} bình thuốc (mọi loại) — đang có ${co}` : `Chỉ mang tối đa ${MANG()} bình thuốc (mọi loại) — đang có ${co}, mua thêm được ${MANG() - co}`);
  muaChong(h, x, giaTk > 0 ? giaTk : x.gia, n, giaTk > 0);
}
// mua n món xếp chồng x giá gia mỗi món: dồn vào chồng cùng loại chưa đầy trước, rồi ô trống; thiếu tiền / chỗ thì lỗi, không mua gì
function muaChong(h, x, gia1, n, tk = false) {
  if (n < 1 || n > TC.muaToiDa) loi(`Mỗi lần mua 1 – ${TC.muaToiDa}`);
  const gia = gia1 * n;
  if ((h.gold || 0) < gia) loi("Ngân lượng không đủ");
  themChong(h, x, n, 0, tk);
  h.gold -= gia;
}
// thêm n món xếp chồng x vào túi (mua / rút từ lễ bao): dồn vào chồng cùng loại chưa đầy trước, rồi ô trống; hết chỗ thì lỗi, không thêm gì
// dồn các chồng chưa đầy cùng loại k trong túi (anh 28/10 "nhặt xong tự động dồn"): chồng đứng trước (trên xuống, trái sang) nhận thêm từ
// chồng đứng sau tới chongMax; chồng sau hết thì bỏ ô đó. Không dồn món không xếp chồng / lễ bao (đếm số viên còn). donChongL: lưới bất kỳ
// (rương, túi tử mẫu — chuan dồn 1 lần)
// Khóa bảo hiểm (anh 05/11): chỉ dồn các chồng cùng trạng thái khóa (engine KItemList gộp chồng so nState)
function donChongL(G, k) {
  const mx = chongMax(k);
  const nhom = (o) => (o.kbh | 0) + (o.tk ? "t" : ""); // khóa bảo hiểm / thuốc Tống Kim: chỉ dồn chồng cùng loại
  for (const kh of new Set(G.filter((o) => o.k === k).map(nhom))) {
    const L = G.filter((o) => o.k === k && nhom(o) === kh && xepChong(o)).sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0, j = L.length - 1; i < j; ) {
      const a = L[i], b = L[j], m = Math.min(mx - a.n, b.n);
      if (m <= 0) { i++; continue; }
      gopHet(a, b); a.n += m; b.n -= m;
      if (!b.n) { G.splice(G.indexOf(b), 1); j--; }
    }
  }
}
function donChong(h, k) { donChongL(h.bag, k); }
// Sắp xếp (anh 06/11 "làm thêm nút sắp xếp túi đồ và rương" — act xep): C = BẢN SAO lưới (túi / rương), ds = thuốc trình duyệt đã uống chưa
// báo ([u, n] — trừ trên bản sao trước khi dồn). 1) dồn chồng cùng khóa + cùng trạng thái khóa bảo hiểm (không bao giờ trộn khóa / không khóa
// — anh 05/11), món có con (Kim Tê đang dùng, lễ bao) không dồn; chồng giữ lại = mã u nhỏ nhất. 2) thứ tự: trang bị theo ô (vũ khí, áo, mũ,
// đai, giày, hộ uyển, dây chuyền, nhẫn, ngọc bội, ngựa — cùng ô: cấp đồ cao, nhiều dòng trước) · thuốc · phù · Kỳ Trân Các · món khác · món Dã
// Tẩu cuối; trong nhóm món không khóa trước. 3) món to đặt trước (diện tích rồi chiều cao), ô trống đầu tiên trên xuống / trái sang như túi
// client. Không vừa -> null (nơi gọi báo lỗi, lưới cũ giữ nguyên)
const XEP_O = ["Weapon", "Cloth", "Cap", "Sash", "Shoes", "Bangle", "Necklace", "Ring1", "Pendant", "Horse"];
let XEP_TT = null; // khóa món -> thứ tự trong bảng món (items.json, thuốc, tạp hóa, Kỳ Trân Các)
function xepLuoi(C, ds) {
  if (ds) uong({ bag: C }, ds);
  const nhom = new Map();
  for (const o of C) if (xepChong(o) && o.con == null) { const g = o.k + "|" + (o.kbh | 0) + (o.tk ? "t" : ""); (nhom.get(g) || nhom.set(g, []).get(g)).push(o); }
  for (const G of nhom.values()) {
    if (G.length < 2) continue;
    G.sort((a, b) => a.u - b.u);
    const mx = chongMax(G[0].k); let con = G.reduce((t, o) => t + (o.n | 0), 0);
    for (const o of G) { o.n = Math.min(con, mx); con -= o.n; }
    if ((G[0].kbh | 0) === KBH_TAM) { const het = Math.max(...G.map((o) => +o.kbhHet || 0)); for (const o of G) o.kbhHet = het; } // khóa có hạn: giờ mở muộn nhất (anh 18/11)
  }
  C = C.filter((o) => o.n !== 0);
  XEP_TT = XEP_TT || new Map([...BY.keys()].map((k, i) => [k, i]));
  const khoa = (o) => {
    const x = BY.get(o.k) || {}, s = XEP_O.indexOf(SLOT_OF[x.t]), tt = XEP_TT.get(o.k) ?? 1e9;
    const c = o.dt ? 5 : laThuoc(o) ? 1 : laPhu(o) ? 2 : laKtc(o) ? 3 : s >= 0 ? 0 : 4;
    return c === 0 || c === 5 ? [c, s, o.kbh | 0, -capDo(o.k), -(o.d || []).length, tt, o.u] : [c, 0, tt, o.kbh | 0, -(o.n | 0), o.u];
  };
  const K = new Map(C.map((o) => [o, khoa(o)]));
  C.sort((a, b) => { const p = K.get(a), q = K.get(b); for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) return p[i] - q[i]; return 0; });
  const thu = (ds) => { const R = []; for (const o of ds) { delete o.x; delete o.y; const at = choDau(R, o); if (!at) return null; [o.x, o.y] = at; R.push(o); } return R; };
  const dt = (o) => coMon(o)[0] * coMon(o)[1];
  return thu([...C].sort((a, b) => dt(b) - dt(a) || coMon(b)[1] - coMon(a)[1])) || xepDo(C);
}
// lưới quá chật cho cách trên: dò lần lượt (ô trống đầu tiên trên xuống / trái sang phải là góc trên trái của 1 món — thử từng cỡ món còn lại, to
// trước, mỗi cỡ lấy món đứng trước theo thứ tự; bỏ trống ô đó khi còn dư ô). Tối đa XEP_DO bước, không ra -> null
const XEP_DO = 200000;
function xepDo(C) {
  const co = new Map();
  for (const o of C) { const [w, h] = coMon(o), k = w + "x" + h; if (!co.has(k)) co.set(k, { w, h, L: [], i: 0 }); co.get(k).L.push(o); }
  const nhom = [...co.values()].sort((a, b) => b.w * b.h - a.w * a.h || b.h - a.h);
  const g = new Uint8Array(BAG_W * BAG_H), at = new Map();
  let du = BAG_W * BAG_H - C.reduce((t, o) => t + coMon(o)[0] * coMon(o)[1], 0), con = C.length, buoc = 0;
  if (du < 0) return null;
  const vua = (x, y, w, h) => { if (x + w > BAG_W || y + h > BAG_H) return false; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j * BAG_W + i]) return false; return true; };
  const to = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j * BAG_W + i] = v; };
  const di = (c) => {
    while (c < g.length && g[c]) c++;
    if (!con) return true;
    if (c >= g.length || ++buoc > XEP_DO) return false;
    const x = c % BAG_W, y = (c / BAG_W) | 0;
    for (const n of nhom) if (n.i < n.L.length && vua(x, y, n.w, n.h)) {
      to(x, y, n.w, n.h, 1); at.set(n.L[n.i++], [x, y]); con--;
      if (di(c + 1)) return true;
      con++; n.i--; at.delete(n.L[n.i]); to(x, y, n.w, n.h, 0);
    }
    if (du > 0) { du--; g[c] = 2; if (di(c + 1)) return true; g[c] = 0; du++; }
    return false;
  };
  if (!di(0)) return null;
  for (const o of C) [o.x, o.y] = at.get(o);
  return [...C].sort((a, b) => a.y - b.y || a.x - b.x);
}
// kbh: thêm món khóa bảo hiểm (KBH_VV — thưởng thăng cấp / online, món mở ra từ món khóa): chỉ dồn vào chồng cùng trạng thái khóa
function themChong(h, x, n, kbh = 0, tk = false, het = 0) { // tk: thuốc Tống Kim (chồng riêng); het: giờ mở khóa khi kbh = KBH_TAM (anh 18/11 — thiếu giờ thì khóa vĩnh viễn)
  if ((kbh | 0) === KBH_TAM && !(+het > 0)) kbh = KBH_VV;
  const mx = chongMax(x.k), chong = h.bag.filter((o) => o.k === x.k && (o.kbh | 0) === (kbh | 0) && !o.tk === !tk && o.n < mx);
  let con = n - chong.reduce((t, o) => t + mx - o.n, 0);
  const moi = [];
  while (con > 0) {
    const it = { k: x.k, n: Math.min(con, mx), ...voiKhoa(kbh), ...((kbh | 0) === KBH_TAM ? { kbhHet: +het } : {}), ...(tk ? { tk: 1 } : {}) }, at = choDau([...h.bag, ...moi], it);
    if (!at) loi("Hành trang không đủ chỗ");
    [it.x, it.y] = at; moi.push(it); con -= it.n;
  }
  let du = n - moi.reduce((t, o) => t + o.n, 0);
  for (const o of chong) { const m = Math.min(du, mx - o.n); if (m > 0 && (kbh | 0) === KBH_TAM) gopHet(o, { kbhHet: het }); o.n += m; du -= m; }
  for (const it of moi) { it.u = ++h.uN; h.bag.push(it); }
}

// ---------- dùng món Kỳ Trân Các (act dung — công dụng theo script client, cong-cu/dung-ky-tran-cac.js ghi nguồn từng món) ----------
// it = món trong túi; b.chon = chiêu được Đại Thành Bí Kíp nâng; b.n = số viên rút từ lễ bao. Trả { msg } | { chon: [[chiêu, tên, cấp]] }
// (Đại Thành: hỏi chọn chiêu) | { hoiSo, con } (lễ bao: hỏi số viên) — kn: 1 = đổi sách / điểm / chiêu (api trả thêm kn để trình duyệt cập nhật)
const tenChieu = (id) => ((SK.skills[id] || {}).n || "chiêu " + id).trim();
const gioPhutS = (s) => { const g = Math.floor(s / 3600), p = Math.floor((s % 3600) / 60); return g ? `${g} giờ${p ? ` ${p} phút` : ""}` : `${p} phút`; };
const LD_CAM = new Set(["trangThai", "kyNang"]); // loại công dụng không dùng được trong sân Công Bình Tử (anh 17/11 — dungVat)
function dungVat(h, it, b, key, qt = false) {
  if (!it) loi("Không có món này trong túi");
  const x = BY.get(it.k), D = x && x.dung, lv = h.lvl || 1;
  if (!x || !x.ktc) loi("Món này không dùng được");
  // Thủy Tinh / Tinh Hồng Bảo Thạch: không dùng trực tiếp — nộp cho Xa phu khi đi đảo Tẩy Tủy (anh 28/10 — may-chu/tay-tuy.js)
  if (!D && /^qk:(238|239|240|353)$/.test(it.k)) loi(`${x.n.trim()}: mang theo khi đi đảo Tẩy Tủy (Xa phu Ba Lăng) — Lam + Tử + Lục Thủy Tinh mỗi loại 1 viên tẩy điểm kỹ năng, 6 viên Tinh Hồng Bảo Thạch tẩy điểm tiềm năng`);
  // Nhạc Vương Kiếm (questkey 195 — "tín vật để kiến lập bang hội"; lễ bao 500 Xu mở ra kiếm — anh 31/10; đúc từ Nhạc Vương Hồn Thạch ở Quân Nhu quan Tống Kim): anh 14/11
  // bang hội mở — không dùng trực tiếp, nộp khi lập bang ở Người hướng dẫn bang hội (may-chu/bang-hoi.js lap)
  if (!D && it.k === "qk:195") loi(`${x.n.trim()}: tín vật lập bang hội — nộp cho Người hướng dẫn bang hội (Ba Lăng huyện / Biện Kinh) khi lập bang`);
  // Tống Kim (anh 06/11 — may-chu/tong-kim.js): Nhạc Vương Hồn Thạch chỉ để đúc kiếm; Huân công bài (client jungongpai.lua: bốc kinh nghiệm, hết hạn 24:00 ngày
  // hôm sau); món chỉ dùng trong chiến trường (client checkmapid.lua — đang ở trận, đang báo danh / đánh): hoàn = trạng thái 3 phút (h.buff tk…), Chiến cổ /
  // Lệnh Bài = trình duyệt cộng trạng thái cho mình + người cùng phe quanh mình (tkDoi — tkBuff), Càn Khôn Tạo Hóa Đan = trình duyệt hồi máu (tkHoi)
  const TK = TKM(), tkv = TK.vatTk(it.k, D), tru1 = () => { it.n = (it.n || 1) - 1; if (it.n <= 0) h.bag.splice(h.bag.indexOf(it), 1); };
  // Lôi Đài Công Bình Tử (anh 17/11 "khi vào công bình tử, không được dùng các loại dược, hoàn"): trong sân (hoặc nhân vật đang có vai ở sân — như Thổ Địa Phù) không dùng
  // hoàn / vật phẩm trạng thái, phù cộng cấp kỹ năng, món Tống Kim. Thuốc uống ở trình duyệt (src/game/main.js drink chặn). GIỐNG main.js LD_CAM — sửa thì sửa cả 2
  if ((tkv || (D && LD_CAM.has(D.loai))) && LDA().chan(tkCuaKhoa(key), BAI_NAY.get(key), oCuaKhoa(key))) loi("Trong sân Công Bình Tử không dùng được thuốc, hoàn — rời sân rồi dùng");
  if (it.k === TK.CF.thuong.htMon) loi(`Dùng ${TK.CF.duc.can} viên đúc Nhạc Vương Kiếm ở Quân Nhu quan (Biện Kinh)`);
  if (it.k === TK.CF.thuong.hcMon || (D && D.loai === "huanCong")) {
    if (it.het && +it.het <= Date.now()) loi(`${x.n.trim()} đã hết hạn sử dụng`);
    const bang = (D && Array.isArray(D.kn) && D.kn.length ? D.kn : TK.CF.thuong.hcKn).filter((r) => Array.isArray(r) && +r[0] > 0 && +r[1] > 0);
    if (!bang.length) loi("Món này không dùng được");
    let j = Math.random() * bang.reduce((s, r) => s + +r[1], 0), e = +bang[bang.length - 1][0];
    for (const r of bang) { j -= +r[1]; if (j < 0) { e = +r[0]; break; } }
    tru1(); h.exp = (h.exp || 0) + e; lenCap(h);
    return { msg: `Sử dụng ${x.n.trim()}: nhận được ${e.toLocaleString("vi-VN")} điểm kinh nghiệm` };
  }
  if (tkv) {
    if (!TK.trongTran(key)) loi("Vật phẩm này chỉ có thể sử dụng ở Chiến trường Tống Kim");
    if (tkv.loai === "hoan") {
      TK.hoanTran(h, key); // vừa trọng thương: bỏ hoàn cũ trước (anh 17/11)
      buffDem(h, key, true); // trừ hẳn phần thời gian đã trôi trước khi ghi trạng thái mới; dùng lại thì tính lại từ đầu (như hoàn Kỳ Trân Các)
      const B = (h.buff = h.buff || {}), T = KTC.buff[tkv.buff] || {}, giay = Math.min(tkv.giay, TK.hoanGiay());
      tru1(); B[tkv.buff] = giay;
      return { msg: `Dùng ${x.n.trim()}: ${T.d || T.n || "trạng thái chiến trường"} trong ${gioPhutS(giay)} — trọng thương thì mất` };
    }
    tru1();
    if (tkv.loai === "doi") { TK.choDoi(key, tkv.k, tkv.giay); return { msg: `Dùng ${x.n.trim()}: tướng sĩ phe ta quanh đây được tăng sức trong ${gioPhutS(tkv.giay)}`, tkDoi: { k: tkv.k, giay: tkv.giay } }; }
    return { msg: `Dùng ${x.n.trim()}: hồi ${tkv.v.toLocaleString("vi-VN")} sinh lực và nội lực mỗi nửa giây trong ${tkv.giay} giây`, tkHoi: { v: tkv.v, giay: tkv.giay } };
  }
  if (!D) loi(`${x.n.trim()}: hiện chưa dùng được (game chưa có chức năng này)`);
  const bot = () => { it.n = (it.n || 1) - 1; if (it.n <= 0) h.bag.splice(h.bag.indexOf(it), 1); };
  // món mới vào túi (ngựa 2 × 3, Nhạc Vương Kiếm): chỗ trống tính cả ô của món đang dùng nếu đây là món cuối của chồng. Món mở ra từ món khóa
  // bảo hiểm cũng khóa (anh 05/11 — như client: đồ phân ra từ đồ khóa giữ trạng thái khóa)
  // kb: khóa của món mới — mặc định theo món đang dùng; Bảo rương đồ xanh khóa -> khóa có hạn (khoaRuong — anh 11/11)
  const datMoi = (moi, het, kb = khoaCua(it)) => { // khoaCua: khóa có hạn giữ giờ mở khóa (anh 18/11)
    const at = choDau(it.n > 1 ? h.bag : h.bag.filter((o) => o !== it), moi);
    if (!at) loi(het);
    Object.assign(moi, kb);
    if (laTB(moi)) NG.gan(moi, D.loai === "ngua" ? "ngua" : "dung", x.n.trim(), h.name); // nguồn gốc món (Bảo rương đã gắn "ruong" lúc quay món)
    bot(); [moi.x, moi.y] = at; moi.u = ++h.uN; h.bag.push(moi);
  };
  switch (D.loai) {
    case "ngua": { // mã bài (market_pack.lua): 1 con ngựa — hạn D.ngay ngày từ lúc dùng (anh 27/10), hết hạn thì biến mất (chuan)
      // D.vinhVien (anh 16/11 — Báo Đáp Ân Sư: Mã bài Bôn Tiêu / Phiên Vũ từ hương bao): ngựa không hạn, cờ vv — không bán cho cửa hàng (act ban), Trợ Thủ không tự bán
      const ng = BY.get(D.ngua); if (!ng) loi("Không có ngựa này");
      const vv = !!D.vinhVien || !(D.ngay > 0);
      datMoi({ k: D.ngua, d: [], m: 1, ...(vv ? { vv: 1 } : { het: Date.now() + D.ngay * 86400000 }) }, `Xin hãy sắp xếp lại hành trang! ${ng.n} cần ${coMon({ k: D.ngua }).join(" × ")} ô trống`);
      return { msg: vv ? `Nhận được 1 ${ng.n} — vĩnh viễn (không bán cho cửa hàng được)` : `Nhận được 1 ${ng.n} — hạn sử dụng ${D.ngay} ngày` };
    }
    // ---- anh 16/11 — Báo Đáp Ân Sư (may-chu/bao-dap-an-su.js; ky-tran-cac.json dung) ----
    case "bdasNl": return { msg: BD().huongDan(it.k) }; // nguyên liệu: chỉ báo mang tới NPC nào, không trừ
    // khảm nạm (anh 17/11 — may-chu/kham-nam.js): Thủy Tinh / Hoán Linh Thạch dùng ở khung khảm của Thợ rèn — chuột phải chỉ báo, không trừ
    case "khamNam": if (D.da === "hh" || D.da === "ht") return { msg: `${x.n.trim()}: mang tới Thợ rèn (Ba Lăng huyện, Biện Kinh) → Hoán hình · Hoán tính, đặt ${D.da === "hh" ? "vũ khí" : "trang bị (trừ vũ khí)"} cùng 1 ${x.n.trim()} vào khung` }; // anh 17/11 lần 2 — Hoán Hình Phù / Hoán Tính Lệnh
      return { msg: `${x.n.trim()}: mang tới Thợ rèn (Ba Lăng huyện, Biện Kinh) → Khảm nạm, đặt vào ${D.da === "tu" ? "ô Đẳng cấp" : D.da === "luc" ? "ô Linh lực" : D.da === "hl" ? "ô ngũ hành muốn đổi sang" : "một ô ngũ hành"} của khung khảm` };
    case "huongBao": { // Tơ Tằm / Ngũ Sắc / Trung Dược Hương Bao: kinh nghiệm (trần cả sự kiện) + 1 món (ns / td) — lỗi thì không trừ; món hiếm báo cả máy chủ (api.js loa)
      const r = BD().moHuongBao(h, it, D.hb, key, qt);
      return { msg: r.msg, ...(r.loa ? { loa: r.loa, hiem: r.hiem } : {}) };
    }
    case "kinhNghiem": { // Bách / Vạn / Thiên Niên Trân Lộ, Hồng Bao Sum Vầy / An Khang: + D.kn kinh nghiệm
      const e = Math.max(0, Math.floor(+D.kn || 0));
      bot(); h.exp = (h.exp || 0) + e; lenCap(h);
      return { msg: `Sử dụng ${x.n.trim()}: Bạn nhận được ${e.toLocaleString("vi-VN")} điểm kinh nghiệm` };
    }
    case "satThuGian": { // Sát Thủ Giản lễ hộp: D.so Sát thủ giản bậc theo cấp người dùng (20 … 200 — như Vượt Ải GIAN), khóa theo hộp
      const cap = clamp(Math.floor(lv / 10) * 10, 20, 200), m = BY.get(`ms:400:${cap}`);
      if (!m) loi("Không có Sát thủ giản cấp này");
      const so = Math.max(1, D.so | 0 || 2), truoc = h.bag.slice(), nCu = it.n;
      bot(); try { themChong(h, m, so, it.kbh, false, it.kbhHet); } catch (e) { h.bag = truoc; it.n = nCu; throw e; }
      return { msg: `Mở ${x.n.trim()}: nhận được ${so} ${m.n.trim()}` };
    }
    case "shxt": { // Mảnh bản đồ sơn hà xã tắc: + D.so mảnh (h.shxt — như nhặt đồ chí)
      const so = Math.max(1, D.so | 0);
      bot(); h.shxt = (h.shxt | 0) + so;
      return { msg: `Bạn nhận được ${so} mảnh bản đồ Sơn Hà Xã Tắc! Hiện tại bạn có tổng cộng ${h.shxt} mảnh bản đồ Sơn Hà Xã Tắc.` };
    }
    case "pldBac": { // Phong Lăng Truyền Tống Lệnh: sang thẳng bờ Bắc Phong Lăng Độ (phong-lang-do.js truyenTong — có môn phái, ở thành / thôn / bờ Nam, bến không nghỉ)
      const z = BAI_NAY.get(key);
      if (TKM().trongTran(key) || LDA().chan(tkCuaKhoa(key), z, oCuaKhoa(key))) loi(`Không thể sử dụng ${x.n.trim()} ở đây`);
      const r = PLD().truyenTong(h, z);
      bot();
      return { msg: `Sử dụng ${x.n.trim()}: ${r.tin.join(" ")}`, di: r.di };
    }
    case "nen": { // Nến Bát Trân Phúc Nguyệt: kinh nghiệm đánh quái × nen.heSo cho mình + đồng đội cùng bản đồ (bao-dap-an-su.js nenDoi — đồng đội nhận ở nhịp của họ)
      bot();
      return { msg: BD().nenDoi(h, key, tkCuaKhoa(key)).msg };
    }
    case "kyNang": { // Nhất Kỷ Càn Khôn Phù (+1, cần cấp D.capNv) / Càn khôn song tuyệt Bội (+2): mọi kỹ năng đã học + D.cap cấp trong D.ngay ngày (giờ thật) — h.ccKn,
      // tổng tối đa kyNang.toiDa (trình duyệt cộng — không ghi vào h.skills)
      const t = Date.now(), L = BD().ccCon(h, t), tong = L.reduce((s, r) => s + r.v, 0), toiDa = BD().cf().kyNang.toiDa, them = Math.max(1, D.cap | 0), ngay = Math.max(1, +D.ngay || 14);
      h.ccKn = L; // bỏ dòng hết hạn
      if (tong >= toiDa) loi(`Đã đạt tối đa +${toiDa} cấp kỹ năng`);
      // vượt tối đa thì chặn luôn (soát 16/11: đang +2 dùng thêm Càn khôn +2 thành 4 nhưng chỉ tính 3 — phí món); chờ 1 hiệu ứng hết hạn rồi dùng
      if (tong + them > toiDa) loi(`Đang được +${tong} cấp kỹ năng — dùng ${x.n.trim()} (+${them}) sẽ vượt tối đa +${toiDa}. Hãy chờ 1 hiệu ứng hết hạn rồi dùng`);
      if (D.capNv && lv < D.capNv) loi(`Cần đẳng cấp ${D.capNv} trở lên mới sử dụng được ${x.n.trim()}`);
      bot(); L.push({ v: them, het: t + ngay * 864e5 });
      return { msg: `Sử dụng ${x.n.trim()}: mọi kỹ năng đã học +${them} cấp trong ${ngay} ngày — đang được +${Math.min(toiDa, tong + them)} cấp (tối đa +${toiDa})` };
    }
    case "trangThai": { // Tiên Thảo Lộ / Thiên Sơn Bảo Lộ / Quế Hoa Tửu: "tái sử dụng vô hiệu" (client) -> đang có thì không dùng
      // các loại hoàn (anh 31/10 — D.lamMoi): chiêu trạng thái của engine, dùng lại thì thay trạng thái cũ -> tính lại từ đầu D.giay
      // trong trận Tống Kim (anh 17/11): hoàn tối đa 3 phút (TK.hoanGiay), trọng thương thì mất — hoanTran bỏ hoàn của lần chết vừa rồi trước khi xét / ghi
      const tkTran = laHoan(D.buff) && TK.trongTran(key);
      if (laHoan(D.buff)) TK.hoanTran(h, key);
      buffDem(h, key, true); // trừ hẳn phần thời gian đã trôi trước khi ghi trạng thái mới
      const B = (h.buff = h.buff || {}), T = KTC.buff[D.buff] || {};
      if (B[D.buff] > 0 && !D.lamMoi) loi(`Đang có hiệu quả ${T.n || x.n} (còn ${gioPhutS(B[D.buff])}) — dùng thêm vô hiệu`);
      // 5 loại Nội … hoàn (nei_wan.lua EatNei_Wan): ăn loại này thì các loại cùng nhóm đang có hết công hiệu
      const het = D.nhom ? Object.keys(B).filter((k2) => k2 !== D.buff && B[k2] > 0 && (KTC.buff[k2] || {}).nhom === D.nhom) : [];
      for (const k2 of het) delete B[k2];
      const giay = tkTran ? Math.min(D.giay, TK.hoanGiay()) : D.giay;
      bot(); B[D.buff] = giay;
      return { msg: `${het.map((k2) => `${String((KTC.buff[k2] || {}).n || k2).trim()} hết công hiệu. `).join("")}Dùng ${x.n.trim()}: ${T.d} trong ${gioPhutS(giay)}${tkTran ? " (chiến trường Tống Kim — trọng thương thì mất)" : ""}` };
    }
    case "kimTe": { // Kim Tê (anh 31/10, luật riêng S1): sửa trang bị đang mặc rồi đồ trong túi bằng điểm độ bền của Kim Tê — mỗi viên D.ben điểm,
      // 1 điểm = 1 độ bền; hết điểm giữa chừng thì món đó sửa được bao nhiêu hay bấy nhiêu. Không tốn tiền, không cần thợ rèn
      const ds = [...Object.values(h.equip || {}), ...h.bag.filter((o) => o !== it)].filter((o) => o && benMax(o.k) > 0 && benCua(o) < benMax(o.k));
      if (!ds.length) loi("Trang bị không cần sửa");
      let con = (it.con ?? D.ben) + ((it.n || 1) - 1) * D.ben; // tổng điểm của cả chồng
      const truoc = con, ten = [];
      for (const o of ds) {
        if (con <= 0) break;
        const mx = benMax(o.k), them = Math.min(mx - benCua(o), con);
        con -= them; ten.push(tenMon(o).trim());
        if (benCua(o) + them >= mx) delete o.ben; else o.ben = benCua(o) + them;
      }
      const n = Math.ceil(con / D.ben);
      if (n <= 0) h.bag.splice(h.bag.indexOf(it), 1);
      else { it.n = n; const le = con - (n - 1) * D.ben; if (le < D.ben) it.con = le; else delete it.con; }
      return { msg: `Dùng ${x.n.trim()} sửa ${ten.length} món (${ten.join(", ")}): +${truoc - con} độ bền${n > 0 ? ` — Kim Tê còn ${n > 1 ? `${n} viên, viên đang dùng ` : ""}${con - (n - 1) * D.ben} / ${D.ben} độ bền` : " — đã dùng hết Kim Tê"}` };
    }
    case "matTich": { // wulin-miji.lua: cấp ≥ 80, tối đa 15 quyển, +1 điểm kỹ năng
      if (lv < D.cap) loi("Bạn cầm quyển Võ Lâm Mật Tịch nghiên cứu cả nửa ngày, kết quả lĩnh ngộ được chút ít (cần đẳng cấp 80)");
      if ((h.mt | 0) >= D.toiDa) loi("Bạn đã nghiền ngẫm kỹ quyển Võ Lâm Mật Tịch, nhưng không thu được điều gì tâm đắc");
      bot(); h.mt = (h.mt | 0) + 1; h.kyNangThem = (h.kyNangThem | 0) + 1;
      return { msg: `Bạn cầm quyển Võ Lâm Mật Tịch nghiên cứu cả nửa ngày, kết quả cũng thu được một vài điều tâm đắc liên quan đến võ công: +1 điểm kỹ năng (${h.mt} / ${D.toiDa} quyển)`, kn: 1 };
    }
    case "tayTuy": { // xisui-jing.lua: cấp ≥ 80, tối đa 15 quyển, điểm tiềm năng theo cấp: 80–81: 1 … 88 trở lên: 5
      if (lv < D.cap || (h.tt | 0) >= D.toiDa) loi(`Bạn đã xem kỹ quyển Tẩy Tủy kinh nhưng không thể hiểu :(${lv < D.cap ? " (cần đẳng cấp 80)" : ` (đã đọc ${D.toiDa} quyển)`}`);
      const pot = Math.floor((Math.min(lv, 89) - 80) / 2) + 1;
      bot(); h.tt = (h.tt | 0) + 1; h.tiemNangThem = (h.tiemNangThem | 0) + pot;
      return { msg: `Bạn đã đọc 'Tẩy Tủy Kinh', nhận được ${pot} điểm tiềm năng (${h.tt} / ${D.toiDa} quyển)`, kn: 1 };
    }
    case "sach": case "sach120": { // skillbook.lua / lv120skillbook.lua: đúng phái, đủ cấp, chưa học -> học chiêu (cấp học D.lv, sách 120: 1)
      if (h.fac == null) loi("Chưa gia nhập môn phái, không thể học kỹ năng này!");
      const chieu = D.loai === "sach" ? D.chieu : ((PHAI_SACH.get(h.fac) || {})[120] || [])[0];
      if (D.loai === "sach" && h.fac !== D.phai) loi(`Bạn cầm lấy ${x.n} nghiên cứu cả nửa ngày, kết quả cũng không lĩnh ngộ được gì (sách của phái khác)`);
      if (lv < D.cap) loi(D.loai === "sach" ? `Bạn cầm lấy ${x.n} nghiên cứu cả nửa ngày, kết quả lĩnh ngộ rất ít (cần đẳng cấp ${D.cap})` : "Đẳng cấp chưa đủ 120, không thể học kỹ năng này!");
      const B = new Set(h.books || []);
      if (!chieu || B.has(chieu)) loi(D.loai === "sach" ? `Bạn đã cầm ${x.n} nghiền tới ngẫm lui, nhưng cũng không học được gì trong đó (đã học)` : "Đã lĩnh hội được kỹ năng 120 rồi, còn muốn học thêm nữa sao?");
      bot(); B.add(chieu); h.books = [...B];
      const cap = D.lv ?? 1;
      if (cap > 0) {
        h.skills = h.skills || {}; const cu = h.skills[chieu] | 0;
        if (cu < cap) { h.skills[chieu] = cap; h.kyNangThem = (h.kyNangThem | 0) + cap - cu; }
        h.skMin = { ...(h.skMin || {}), [chieu]: Math.max(cap, (h.skMin || {})[chieu] | 0) };
      }
      return { msg: `Đã học được kỹ năng ${tenChieu(chieu)}`, kn: 1 };
    }
    case "daiThanh": { // dachengmiji_90 / 120.lua: chọn 1 chiêu 90 / 120 đã học chưa tới cấp 20 -> cấp 20 (không tốn điểm)
      if (h.fac == null) loi("Hình như quyển sách này miêu tả võ công cao cấp của các đại môn phái, ngươi không thể hiểu sự huyền diệu của nó.");
      const ds = ((PHAI_SACH.get(h.fac) || {})[D.moc] || []).filter((c) => (h.books || []).includes(c) && ((h.skills || {})[c] | 0) < 20);
      if (!ds.length) loi("Kỹ năng đã đạt đến cấp cao nhất hoặc vẫn chưa học.");
      const id = b.chon | 0;
      if (!id) return { chon: ds.map((c) => [c, tenChieu(c), (h.skills || {})[c] | 0]) };
      if (!ds.includes(id)) loi("Kỹ năng đã đạt đến cấp cao nhất hoặc vẫn chưa học.");
      bot(); h.skills = h.skills || {}; const cu = h.skills[id] | 0;
      h.skills[id] = 20; h.kyNangThem = (h.kyNangThem | 0) + 20 - cu; h.skMin = { ...(h.skMin || {}), [id]: 20 };
      return { msg: `${tenChieu(id)} đã lên đẳng cấp 20`, kn: 1 };
    }
    case "hieuUng": { // Pháo Hoa / Hoa hồng (anh 03/11 — magicscript cột kỹ năng: 251 bắn pháo hoa, 285 mưa hoa hồng): trình duyệt vẽ hiệu ứng
      // quanh mình (src/game/vocong.js hieuUng), người đứng gần cũng thấy (kênh tức thời "chieu")
      bot();
      return { hieuUng: D.chieu | 0 };
    }
    case "phiPhong": { // Phi Phong (script\item\mantle.lua — Mantle(): khoác áo choàng lên y phục đang mặc; anh 03/11): bộ phận mantle của kho nhân
      // vật (D.mantle — 1 = 披风01). Anh 13/11 (lượt 86): kích hoạt trên CHÍNH y phục đang mặc (it.pp — kieuDang), mỗi y phục 1 lần, đi theo áo khi giao dịch
      const ao = aoMac(h);
      if (!ao) loi("Hãy mặc y phục rồi mới kích hoạt Phi Phong");
      if (laLePhuc(ao)) loi("Lễ phục đã có sẵn tà áo, không khoác thêm Phi Phong được — hãy mặc y phục khác rồi kích hoạt"); // anh 15/11 (LE_PHUC)
      if (ao.pp) loi("Y phục này đã kích hoạt Phi Phong rồi — mỗi y phục chỉ kích hoạt được 1 lần");
      bot(); ao.pp = D.mantle | 0 || 1; h.looks = kieuDang(h);
      return { msg: `Đã kích hoạt Phi Phong cho ${tenMon(ao).trim()} — áo choàng đi theo y phục này (giao dịch / bày bán cũng đi cùng)` };
    }
    case "phuQuy": { // Phú quý cẩm hạp (anh 03/11 — may-chu/phu-quy.js; script máy chủ fuguijinhe_item.lua + tbBetInfo:UseJinhe / Bet): chưa có
      // số -> kiểm điều kiện (thôn / thành, cấp, số lần trong đợt) rồi trình duyệt hỏi số 10–99 (hoiPq); có số -> ghi số + kinh nghiệm, trừ 1 hộp
      if (!(b.so > 0)) return { hoiPq: PQ().hoi(h, key) };
      const r = PQ().chon(h, key, b.so); bot();
      return { msg: r.msg };
    }
    case "leBao": { // caiyao\huitianlibao.lua: rút n viên (hỏi số), bao còn con viên; mang tối đa MANG() bình thuốc
      const con = it.con ?? D.so, max = Math.min(con, MANG() - soThuoc(h));
      if (max <= 0) loi(`Chỉ mang tối đa ${MANG()} bình thuốc (mọi loại) — đang có ${soThuoc(h)}`);
      if (!(b.n > 0)) return { hoiSo: max, con };
      const lay = clamp(b.n | 0, 1, max), th = BY.get(D.thuoc);
      themChong(h, th, lay, it.kbh, false, it.kbhHet); // bao khóa bảo hiểm -> thuốc rút ra cũng khóa (khóa có hạn: cùng giờ mở)
      it.con = con - lay; if (it.con <= 0) h.bag.splice(h.bag.indexOf(it), 1);
      return { msg: `Rút ${lay} ${th.n}${it.con > 0 ? ` — trong bao còn ${it.con} viên` : " — đã rút hết toàn bộ thuốc trong túi"}` };
    }
    case "leBaoNhieu": { // Thiết La Hán Lễ Bao (xinnianlibao\xinniangift.lua [1665]: 10 cuốn Thiết La Hán) — anh 31/10 tối "mở bán thiết la hán lễ bao"
      const m = BY.get(D.mon); if (!m) loi("Không có món này");
      const truoc = h.bag.slice(), nCu = it.n;
      bot(); // lễ bao cuối của chồng: ô của nó được dùng cho món mới
      try { themChong(h, m, D.so, it.kbh, false, it.kbhHet); } catch (e) { h.bag = truoc; it.n = nCu; throw e; } // lễ bao khóa bảo hiểm -> sách cũng khóa
      return { msg: `Nhận được ${D.so} ${m.n.trim()}` };
    }
    case "ruongDaTau": { // Bảo rương thần bí của Dã Tẩu (activitysys\config\17 [1]: cần 6 Huyền Thiên Chùy + 1 ô trống, bốc 1 món awardtable\71.txt) —
      // S1 (anh 31/10 khuya): số chùy + bảng món ở cau-hinh.json daTau.ruong { chuy, bang: [[mã | [mã…] (bốc 1), số, %]] }
      const R = (CFG.daTau || {}).ruong || {}, can = R.chuy ?? 6, bang = R.bang || [];
      const co = h.bag.reduce((t, o) => t + (o.k === D.chuy ? o.n || 1 : 0), 0);
      if (co < can) loi(`Cần ${can} Huyền Thiên Chùy, các hạ đem không đủ số lượng!`);
      const tong = bang.reduce((t, r) => t + (+r[2] || 0), 0); if (!(tong > 0)) loi("Bảo rương chưa có phần thưởng");
      let j = Math.random() * tong, dong = bang[bang.length - 1];
      for (const r of bang) { j -= +r[2] || 0; if (j < 0) { dong = r; break; } }
      // dòng ["xu", số, %] = Xu (anh 31/10 khuya lần 2: "thêm cả 1 xu, 2 xu, 5 xu vào pool thưởng")
      const k = Array.isArray(dong[0]) ? dong[0][Math.floor(Math.random() * dong[0].length)] : dong[0], m = k === "xu" ? null : BY.get(k), so = dong[1] | 0 || 1;
      if (k !== "xu" && !m) loi("Không có món này");
      if (m) themChong(h, m, so, it.kbh, false, it.kbhHet); // như client: đủ chỗ cho món mới rồi mới trừ rương + chùy (thiếu chỗ: "Hành trang không đủ chỗ", không mất gì); món theo trạng thái khóa của rương
      else h.xu = (h.xu | 0) + so;
      bot();
      let tru = can;
      // chùy khóa bảo hiểm (thưởng online / thăng cấp — anh 05/11) trừ trước, chùy giao dịch được giữ lại
      for (const o of h.bag.filter((v) => v.k === D.chuy).sort((a, c) => (c.kbh | 0) - (a.kbh | 0))) { const a = Math.min(tru, o.n || 1); o.n = (o.n || 1) - a; tru -= a; if (o.n <= 0) h.bag.splice(h.bag.indexOf(o), 1); if (tru <= 0) break; }
      return { msg: `Mở Bảo rương thần bí của Dã Tẩu (${can} Huyền Thiên Chùy): nhận được ${m ? `${so > 1 ? so + " " : ""}${m.n.trim()}` : `${so} Xu`}` };
    }
    case "phucDuyen": { // Phúc Duyên Lộ (script\item\fuyuanlu_*.lua: FuYuan_Add 10 / 20 / 50 — chưa mở phúc duyên thì câu client, không mất món)
      if (!h.pd || !h.pd.bat) loi("Bạn tạm thời chưa thể sử dụng Phúc Duyên, trước tiên hãy vào Nhận thưởng → Phúc duyên (Võ Lâm Minh Truyền Nhân) để mở công năng này.");
      bot(); h.pd.diem = (h.pd.diem | 0) + D.diem;
      return { msg: `Bạn nhận được ${D.diem} điểm phúc duyên (có ${h.pd.diem})` };
    }
    case "choHoangKim": { // Hoàng Kim Bảo Hạp / Vé số Hoàng Kim (quà mốc Dã Tẩu 6000 / 7000 / 8000 — anh 31/10 khuya lần 2): giữ lại, mở khi có trang bị Hoàng Kim
      loi(`${x.n.trim()}: game chưa có trang bị Hoàng Kim — cứ giữ lại, khi game cập nhật trang bị Hoàng Kim sẽ ${D.monPhai ? "đổi được 1 món Hoàng Kim môn phái của phái đang chơi" : "mở ra 1 món ngẫu nhiên bộ An Bang / Định Quốc"}`);
    }
    case "laHan": { // Thiết La Hán (script\item\tie-luohan.lua): mỗi ngày (giờ Việt Nam) tối đa D.lanNgay quyển + D.knNgay kinh nghiệm; trên cấp D.capToiDa
      // vô hiệu (không mất món). Nhóm cấp (cấp trên 100 tính như 100) -> [kinh nghiệm, %]: ngẫu nhiên 1–100 ≤ % thì đủ, không thì kinh nghiệm × số / 200
      const L = h.lvl || 1, nay = ngayVN(Date.now());
      if (L > D.capToiDa) loi("Bạn cùng với Thiết La Hán đối luyện hơn nửa ngày, kết quả không thu được hiệu quả gì");
      const S = (h.tlh = h.tlh && h.tlh.ngay === nay ? h.tlh : { ngay: nay, n: 0, kn: 0 });
      if (S.n >= D.lanNgay) loi(`Mỗi ngày chỉ được sử dụng ${D.lanNgay} quyển`);
      const [goc, tl] = D.kn[Math.floor((Math.min(L, 100) - 1) / 10)], so = 1 + Math.floor(Math.random() * 100), e = so > tl ? Math.floor((goc * so) / 200) : goc;
      if (S.kn + e > D.knNgay) loi("Đại hiệp đã thu được kinh nghiệm cao nhất từ hoạt động này.");
      bot(); S.n++; S.kn += e; h.exp = (h.exp || 0) + e; lenCap(h);
      return { msg: `Bạn đấu với Thiết La Hán hơn nửa ngày, kết quả đã thu được một số kinh nghiệm thực tiễn chiến đấu: +${e.toLocaleString("vi-VN")} kinh nghiệm (hôm nay ${S.n} / ${D.lanNgay} quyển)` };
    }
    case "leBaoMon": { // market_pack.lua: Nhạc Vương Kiếm lễ bao -> Nhạc Vương Kiếm
      const m = BY.get(D.mon);
      datMoi({ k: D.mon, n: 1 }, "Hành trang không đủ chỗ");
      return { msg: `Nhận được ${m.n}` };
    }
    case "tuMau": { // ibzimudai.lua: hỏi trước (trả tuMau = hạn hiện tại) -> b.chon "Nạp 1 tuần": +D.ngay ngày (đã hết hạn thì tính từ bây giờ)
      if (!b.chon) return { tuMau: h.tmHet || 0 };
      const t = Date.now(); bot(); h.tmHet = Math.max(t, h.tmHet || 0) + D.ngay * 86400000; h.tuiTM = h.tuiTM || [];
      return { msg: `Nạp thành công — túi tử mẫu dùng được tới ${new Date(h.tmHet + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ")} (giờ Việt Nam)`, tuMau: h.tmHet };
    }
    case "biBaoVd": return VDE().moBiBao(h, it, b, bot); // Viêm Đế Bí Bảo (anh 04/11 — may-chu/viem-de.js, client item\yandimibao.lua): dùng Chìa Khóa Như Ý / Chìa khóa vàng mở ra kinh nghiệm
    case "leBaoVa": { // Hộp lễ vật vượt ải (anh 28/10): cau-hinh.json vuotAi.leBao — bốc 1: Xu (tiLeXu, 1 / 2 / 3 Xu theo trọng số xu) / Tiên Thảo Lộ 1 giờ
      // (tiLeTtl, món ms:71 vào túi) / còn lại kinh nghiệm kn
      const C = (CFG.vuotAi || {}).leBao || {}, p = Math.random();
      if (p < (C.tiLeXu || 0)) { const n = C.xu && typeof C.xu === "object" ? +chonTrongSo(C.xu) || 1 : C.xu || 1; bot(); h.xu = (h.xu | 0) + n; return { msg: `Mở ${x.n}: nhận được ${n} Xu` }; } // anh 28/10 lần 7: 1 / 2 / 3 Xu theo trọng số
      if (p < (C.tiLeXu || 0) + (C.tiLeTtl || 0)) { const m = BY.get(C.ttl || "ms:71"); datMoi({ k: m.k, n: 1 }, "Hành trang không đủ chỗ"); return { msg: `Mở ${x.n}: nhận được 1 ${m.n}` }; }
      bot(); const e = C.kn | 0; h.exp = (h.exp || 0) + e; lenCap(h);
      return { msg: `Mở ${x.n}: nhận được ${e.toLocaleString("vi-VN")} điểm kinh nghiệm` };
    }
    case "ruongXanh": { // Bảo rương đồ xanh (anh 04/11 — monRuongXanh): 1 món trang bị xanh 3–6 dòng
      // anh 04/11 (túi gần đầy: món to không vừa -> không mở, rương còn -> mở đi mở lại tới khi ra món ít ô — bug): cần ít nhất RXC.oTrong ô trống
      // (như script client: CalcFreeItemCellCount() < 6 thì không cho mở); đã mở là chốt món — vừa túi thì vào túi, không vừa (ô trống rời rạc, vũ khí
      // 2 × 4) thì vào h.rxMon chờ, nhịp sau tự vào túi khi có chỗ (nhanRuongCho)
      const can = RXC.oTrong ?? 6;
      if (oTrongTui(h) < can) loi(`Hành trang cần ít nhất ${can} ô trống mới mở được ${x.n.trim()}`);
      const moi = monRuongXanh(lv, mayMan(h, key));
      if (!moi) loi("Bảo rương không mở được");
      const ten = tenMon(moi).trim(), n = moi.d.length, bao = n >= CFG.thongBaoTuDong ? { bao: [moi] } : {};
      // rương khóa bảo hiểm -> món khóa có hạn RXC.khoaGio giờ từ lúc mở (anh 11/11 — trước: khóa vĩnh viễn như rương); cả món chờ nhận (giờ vẫn chạy)
      // trình duyệt dựng câu từ moRuong (main.js dungVat) -> khoaGio để ghi "khóa bảo hiểm, tự mở khóa sau … giờ"; msg cho nơi khác
      const kb = khoaRuong(it), gio = +RXC.khoaGio || 72, chuKhoa = kb.kbh ? ` — khóa bảo hiểm, tự mở khóa sau ${gio} giờ` : "", mk = kb.kbh ? { khoaGio: gio } : {};
      if (choDau(it.n > 1 ? h.bag : h.bag.filter((o) => o !== it), moi)) {
        datMoi(moi, "Hành trang không đủ chỗ", kb);
        return { msg: `Mở ${x.n.trim()}: nhận được ${ten} (${n} dòng)${chuKhoa}`, moRuong: { n: ten, d: n, ...mk }, ...bao };
      }
      Object.assign(moi, kb);
      bot(); h.rxMon = [...(h.rxMon || []), moi]; h.rxDay = 1;
      return { msg: `Mở ${x.n.trim()}: nhận được ${ten} (${n} dòng)${chuKhoa} — hành trang không đủ chỗ đặt món này, món chờ nhận: dọn túi là tự vào`, moRuong: { n: ten, d: n, cho: 1, ...mk }, ...bao };
    }
    // Tín vật môn phái (anh 11/11 — may-chu/doi-phai.js): không dùng từ túi — mang tới NPC môn phái của mình ở Ba Lăng huyện (không mất món)
    case "tinVatPhai": return { msg: `${x.n.trim()}: mang tới NPC môn phái của mình ở Ba Lăng huyện (vd Thiếu Lâm La Hán, Nga My Cẩm Y Ni) → Đổi môn phái` };
    // Dị Dung Bí Thuật (anh 16/11 "làm 1 item cho phép người chơi tự đổi giới tính" — client ms:3570 yirongmishu.lua là túi mặt nạ; S1 dùng tên, hình, lời client
    // cho việc đổi giới tính; Kỳ Trân Các 100 Xu): luật như F10 đổi giới tính (may-chu/quan-tri.js doiGioi) — đồ đang mặc chỉ hợp giới cũ (do-goc.json sex: áo kèm
    // Phi Phong it.pp, mũ, giày, dây chuyền, hộ uyển, ngọc bội) cất vào hành trang, món to trước; thiếu chỗ thì báo, không trừ gì. Chỉ ở thành / thôn: đổi xong trang
    // về màn chọn nhân vật — không bỏ dở Tống Kim / lôi đài / đua ngựa. b.chon thiếu: chỉ hỏi (doiGioi = { tu, sang, mon }); b.chon: đổi, h.dpV + 1 (bản lưu cũ của
    // trang không ghi đè giới / chỉ số gốc — api.js luuNv), gioiXong -> trình duyệt về màn chọn nhân vật (main.js dungVat), vào lại là giới mới
    case "doiGioi": {
      const Z = ZONES.get(BAI_NAY.get(key));
      if (!Z || !THANH.has(Z.kind)) loi(`${x.n.trim()}: hãy dùng ở thành thị hoặc thôn trấn`);
      const G = { m: "nam", f: "nữ" }, cu = h.sex === "f" ? "f" : "m", moi = cu === "f" ? "m" : "f";
      const dt = (o) => { const [w, c] = coMon(o); return w * c; };
      const cat = Object.entries(h.equip || {}).filter(([, o]) => o && o.k && (GOC[o.k] || {}).sex && GOC[o.k].sex !== moi).sort((p, q) => dt(q[1]) - dt(p[1]));
      // rương + trang bị đang khóa (h.khoa — mac / thao bị chặn): không cho món đang mặc rời ô qua đường này (soát 16/11: người có mật khẩu đăng nhập mà không có mật mã
      // rương mua Dị Dung Bí Thuật -> đồ khóa rơi vào túi, bán / giao dịch được)
      if (h.khoa && cat.length) loi(`${x.n.trim()}: rương và trang bị đang khóa — mở khóa ở Rương chứa đồ (nút Khóa, nhập mật mã) rồi dùng lại`);
      const ten = cat.map(([, o]) => tenMon(o).trim()), thu =(h.bag || []).filter((o) => o !== it || (it.n || 1) > 1).map((o) => ({ ...o })); // xếp thử trên bản sao (món đang dùng đã trừ)
      if (!cat.every(([, o]) => vaoO(thu, { ...o }))) loi(`Hành trang không đủ chỗ cất ${cat.length} món chỉ ${G[cu]} mặc được (${ten.join(", ")}) — hãy dọn hành trang rồi dùng lại`);
      if (!b.chon) return { doiGioi: { tu: cu, sang: moi, mon: ten } };
      bot();
      for (const [s, o] of cat) { delete h.equip[s]; vaoTui(h, o); }
      h.sex = moi;
      const st = (CHR.start || []).find((r) => r.series === (h.series | 0) && r.sex === (moi === "f" ? 1 : 0)); if (st) h.start = { ...st };
      h.dpV = (h.dpV | 0) + 1;
      return { msg: `Dùng ${x.n.trim()}: đã đổi sang ${G[moi]}${cat.length ? ` — cất ${cat.length} món chỉ ${G[cu]} mặc được vào hành trang` : ""}. Vào lại game để nhận diện mạo mới`,
        gioiXong: 1, gioiMoi: { sex: moi, start: h.start || null, dpV: h.dpV }, gioi: `Đổi giới tính ${G[cu]} -> ${G[moi]} (${x.n.trim()}${it.kbh ? " khóa" : ""})${cat.length ? ` — cất vào hành trang: ${ten.join(", ")}` : ""}` };
    }
    case "bch": { // Bạch Câu Hoàn Đặc Biệt: +D.gio giờ ủy thác (ủy thác chỉ chạy khi còn giờ Bạch Câu Hoàn — anh 27/10)
      bot(); h.bch = (h.bch | 0) + D.gio * 3600;
      return { msg: `Dùng ${x.n}: +${D.gio} giờ ủy thác — còn ${gioPhutS(h.bch)}` };
    }
  }
  loi("Món này không dùng được");
}

// thuốc đã uống (trình duyệt đã hồi sinh lực / nội lực): ds = [[u, số bình], …]; trả true nếu túi đổi
function uong(h, ds) {
  let doi = false;
  for (const r of Array.isArray(ds) ? ds.slice(0, 60) : []) {
    const i = Array.isArray(r) ? h.bag.findIndex((o) => o.u === (r[0] | 0) && laThuoc(o)) : -1, n = Array.isArray(r) ? clamp(r[1] | 0, 0, TC.chongToiDa) : 0;
    if (i < 0 || !n) continue;
    const it = h.bag[i]; it.n -= Math.min(n, it.n); doi = true;
    if (!it.n) h.bag.splice(i, 1);
  }
  return doi;
}

// công cụ thử (quản trị): trình duyệt quyết cấp / kinh nghiệm / tiền / túi / đồ mặc
function ghiDev(h, nv) {
  if (!nv || typeof nv !== "object") return;
  if (Number.isFinite(+nv.lvl)) h.lvl = clamp(nv.lvl | 0, 1, MAX_LEVEL);
  if (Number.isFinite(+nv.exp)) h.exp = +nv.exp;
  if (Number.isFinite(+nv.gold)) h.gold = Math.max(0, +nv.gold);
  if (Number.isFinite(+nv.xu)) h.xu = Math.max(0, Math.floor(+nv.xu));
  // nguồn gốc món (anh 18/11 tối): trang bị công cụ gửi lên chưa có mã / mã lạ -> "qt"; mã cũ mà đổi dòng -> thêm đường đi "Quản trị sửa dòng"
  // trình duyệt có thể còn bản túi cũ chưa nhận mã (máy chủ vừa gắn "cu" lúc chuẩn hóa mà chưa gửi túi mới): món không mã nhưng trùng mã món trong nhân vật (u) + khóa
  // với món đang có -> chính món đó, chép lại mã / nguồn / đường đi
  const cuL = [...(h.bag || []), ...Object.values(h.equip || {})].filter((o) => o && o.g), cuG = new Map(cuL.map((o) => [o.g, JSON.stringify(o.d || [])])), cuU = new Map(cuL.map((o) => [o.u | 0, o])), tao = [];
  const soi = (o) => {
    if (!o || typeof o !== "object" || !laTB(o)) return;
    if (!o.g) { const c = cuU.get(o.u | 0); if (c && c.k === o.k) { o.g = c.g; o.ng = c.ng; if (c.di) o.di = c.di; } }
    if (!o.g || !cuG.has(o.g)) { delete o.g; delete o.ng; delete o.di; NG.gan(o, "qt", `công cụ thử (${h.name})`, h.name); tao.push(o); }
    else if (cuG.get(o.g) !== JSON.stringify(o.d || [])) { NG.di(o, "qt", "Quản trị sửa dòng (công cụ thử)"); tao.push(o); }
  };
  if (Array.isArray(nv.bag)) { nv.bag.forEach(soi); h.bag = nv.bag; }
  if (nv.equip && typeof nv.equip === "object") { Object.values(nv.equip).forEach(soi); h.equip = nv.equip; }
  // anh 17/11 ("công cụ admin … tất cả lên tối đa, thì em cũng cho các chiêu này lên giúp a"): chiêu luyện 90 / 120 / 150 (cấp máy chủ giữ — luyenDon) — quản
  // trị đặt thẳng cấp { mã: cấp }: chỉ chiêu sách của phái đang ở, 1 … cấp tối đa luyện được, độ luyện về 0
  if (nv.skLuyen && typeof nv.skLuyen === "object") for (const [id, lv] of Object.entries(nv.skLuyen)) {
    if (!laLuyen(id) || !sachPhai(h.fac, id)) continue;
    const c = clamp(lv | 0, 1, tranLuyen(+id)); (h.skills = h.skills || {})[+id] = c; (h.luyen = h.luyen || {})[+id] = 0;
  }
  chuan(h);
  return tao; // trang bị công cụ thử vừa tạo / sửa dòng (api.js ghi nhật ký quản trị)
}

// ---------- đăng nhập nhận thưởng (anh 27/10 "xem cái đăng nhập nhận thưởng — trước mắt thưởng tiền xu") ----------
// Như script client eventprizeloginprize.lua: mỗi NHÂN VẬT đếm số ngày đăng nhập liên tục h.dangNhap = { ngay, n } (ngày tính từ gio giờ
// sáng giờ Việt Nam; vào game ngày kế tiếp: n + 1, cách quá 1 ngày: n = 1; tối đa 43); mỗi TÀI KHOẢN chỉ nhận 1 lần / ngày (tk.nhanThuong = ngày
// đã nhận — "nhân vật khác vẫn đăng nhập để duy trì tích lũy"); chỉ nhận đúng ô n; n = 43 (quá 42 ngày): chọn trả phiTiep xu nhận tiếp thưởng
// ngày 42 (n về 42) hoặc nhận lại từ ngày 1. Thưởng: xu[ngày − 1] Xu (client thưởng kinh nghiệm — 1 xu / 1 triệu, anh chốt 27/10; cau-hinh.json dangNhap)
// đọc LÚC DÙNG (soát 14/11 — trước chép gio / phiTiep lúc khởi động: F10 → Cấu hình sửa phải khởi động lại mới ăn)
const DN = { get gio() { return (CFG.dangNhap || {}).gio ?? 5; }, get phiTiep() { return (CFG.dangNhap || {}).phiTiep ?? 5; }, get xu() { return (CFG.dangNhap || {}).xu || []; } };
const ngayDN = (t = Date.now()) => Math.floor((t + (7 - DN.gio) * 3600000) / 86400000);
// gọi mỗi nhịp: sang ngày mới thì đếm (true = có đổi, cần ghi)
function dangNhapDem(h, t = Date.now()) {
  const d = ngayDN(t), N = h.dangNhap;
  if (!N || !(N.n > 0)) { h.dangNhap = { ngay: d, n: 1 }; return true; }
  if (d <= N.ngay) return false;
  N.n = d - N.ngay === 1 ? Math.min(43, N.n + 1) : 1; N.ngay = d;
  return true;
}
// b = {} xem | { nhan: ngày } nhận | + chon "tra" / "lai" khi đã quá 42 ngày. Trả { tt: { n, da }, msg?, xu?, hoi? }
function thuongDN(h, tk, b = {}) {
  dangNhapDem(h);
  const d = ngayDN(), N = h.dangNhap, tt = () => ({ n: N.n, da: tk.nhanThuong === d ? 1 : 0 });
  if (!b.nhan) return { tt: tt() };
  if (tk.nhanThuong === d) return { msg: "Hôm nay nhân vật trong tài khoản của bạn đã nhận thưởng rồi.", tt: tt() };
  const id = b.nhan | 0;
  if (!(id === N.n || (N.n >= 43 && id === 42))) return { msg: `Bạn vẫn chưa thể nhận được phần thưởng này — hôm nay nhận ô ngày ${Math.min(N.n, 42)} (ô đang nhấp nháy)`, tt: tt() };
  let ngay = id;
  if (N.n >= 43) {
    if (b.chon === "tra") { if ((h.xu | 0) < DN.phiTiep) return { msg: "Tiền đồng trên người bạn không đủ", tt: tt() }; h.xu -= DN.phiTiep; N.n = ngay = 42; }
    else if (b.chon === "lai") N.n = ngay = 1;
    else return { hoi: 1, tt: tt() };
  }
  const xu = Math.max(0, DN.xu[ngay - 1] | 0);
  h.xu = (h.xu | 0) + xu; tk.nhanThuong = d;
  return { msg: `Nhận thưởng đăng nhập liên tục ngày ${ngay}: ${xu} Xu`, xu, tt: tt() };
}

// đăng nhập nhận thưởng hôm nay tài khoản chưa nhận (anh 03/11 — số đỏ trên nút Nhận thưởng: api.js nhip ntc)
const dnCho = (tk) => tk.nhanThuong !== ngayDN();

// ---------- bảng quản trị (may-chu/quan-tri.js — anh 28/10 "gửi quà"): tìm món, tóm tắt món, gửi quà vào túi ----------
const foldTen = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
// cách cho món vào túi: do = trang bị (gieo dòng xanh như đồ rơi), leBao = mỗi bao 1 ô, chong = xếp chồng, mot = món 1 ô (món ghi kc);
// null = không tặng được (đồ chí: nhặt là ghi vào bản đồ chí, không nằm trong túi; khóa cũ đã đổi — doi: Sát thủ giản có hệ)
const loaiQua = (x) => (!x || x.chi || x.doi ? null : GOC[x.k] ? "do" : laLeBao(x) ? "leBao" : xepChong(x) ? "chong" : "mot");
const tenBai = (z) => (ZONES.get(z | 0) || {}).n || null;
// món trong túi / đồ mặc / rương -> dòng cho bảng quản trị
function monTin(it) {
  const x = BY.get(it.k) || {};
  return { k: it.k, n: tenMon(it).trim(), ...(x.ic ? { ic: x.ic } : {}), ...((it.d || []).length ? { d: it.d.length } : {}), ...(xepChong(it) ? { sl: it.n || 1 } : {}), ...(it.con != null ? { con: it.con } : {}), ...(it.g ? { g: it.g, ng: it.ng } : {}) };
}
// tìm món theo tên (không dấu) hoặc đúng khóa -> tối đa n món
function timMon(q, n = 40) {
  const f = foldTen(q).trim(), kq = [];
  if (!f) return kq;
  for (const x of BY.values()) {
    const loai = loaiQua(x);
    if (!loai || (!foldTen(x.n).includes(f) && x.k !== String(q).trim())) continue;
    kq.push({ k: x.k, n: (x.n || x.k).trim(), loai, ...(x.ic ? { ic: x.ic } : {}), ...(loai === "do" ? { lv: x.lv || 1, ln: x.ln || "" } : {}) });
    if (kq.length >= n) break;
  }
  return kq;
}
// q = { tien, xu, mon: [{ k, n?, dong? (trang bị: số dòng xanh 0–6), he? (ngũ hành 0–4, không có = ngẫu nhiên), het? (món 1 ô không xếp chồng: hết hạn lúc
// này — Huân công bài Tống Kim) }], kbh? (mọi món khóa bảo hiểm — thưởng thăng cấp, anh 05/11) } -> [câu từng món]. Túi không đủ chỗ / món lạ -> lỗi, không
// thêm món nào
// món không bao giờ khóa bảo hiểm dù quà có khóa (anh 05/11: Mật đồ thần bí "1 là không khóa hết" — chồng khóa / không khóa không gộp, tốn ô)
const KHONG_KHOA = new Set([String((CFG.phongLangDo || {}).matDo || "ms:196")]);
function taoQua(h, q) {
  h.bag = h.bag || []; h.uN = h.uN | 0;
  // q.kbhHet: giờ mở khóa khi q.kbh = KBH_TAM (anh 18/11 — món mở từ hương bao khóa 72 giờ); thiếu giờ thì khóa vĩnh viễn (khoaCua)
  const bag0 = h.bag.map((o) => ({ ...o })), uN0 = h.uN, ds = [], kb0 = khoaCua({ kbh: q.kbh, kbhHet: q.kbhHet });
  try {
    for (const m of (Array.isArray(q.mon) ? q.mon : []).slice(0, 20)) {
      const x = BY.get(String(m && m.k)), loai = loaiQua(x);
      if (!loai) loi(`Không có món ${m && m.k}`);
      const ten = (x.n || x.k).trim(), kb = KHONG_KHOA.has(x.k) ? {} : kb0;
      if (loai === "do") {
        const s = m.he >= 0 && m.he <= 4 ? m.he | 0 : ri(0, 4), dong = clamp(m.dong | 0, 0, 6), n = clamp(m.n | 0 || 1, 1, 10);
        for (let i = 0; i < n; i++) {
          const it = NG.gan({ k: x.k, s, d: dong ? gieoDong(x.t, capDo(x.k), s, dong) : [], m: Math.max(1, x.lv | 0), ...kb, u: ++h.uN }, "qua", q.ng || "", h.name); // q.ng: tên phần thưởng (không có: việc đang làm)
          if (!vaoTui(h, it)) loi("Hành trang không đủ chỗ");
          ds.push(`${ten}${it.d.length ? ` (${it.d.length} dòng)` : ""}`);
        }
      } else if (loai === "chong") {
        const n = clamp(m.n | 0 || 1, 1, 999);
        themChong(h, x, n, KHONG_KHOA.has(x.k) ? 0 : kb0.kbh | 0, false, kb0.kbhHet); donChong(h, x.k);
        ds.push(`${n} ${ten}`);
      } else {
        const n = clamp(m.n | 0 || 1, 1, 20);
        for (let i = 0; i < n; i++) if (!vaoTui(h, { k: x.k, ...(loai === "leBao" ? { n: 1, con: x.dung.so } : {}), ...(m.het > 0 ? { het: Math.floor(+m.het) } : {}), ...kb, u: ++h.uN })) loi("Hành trang không đủ chỗ");
        ds.push(`${n} ${ten}`);
      }
    }
  } catch (e) { h.bag = bag0; h.uN = uN0; throw e; }
  const vang = clamp(Math.floor(+q.tien || 0), 0, 1e10), xu = clamp(Math.floor(+q.xu || 0), 0, 1e6);
  if (vang) { h.gold = (h.gold || 0) + vang; ds.push(tien(vang)); }
  if (xu) { h.xu = (h.xu | 0) + xu; ds.push(`${xu} Xu`); }
  if (!ds.length) loi("Chưa chọn quà");
  NKD().hdNv(h.name, "nhan", "Nhận: " + ds.join(", ")); // sổ hoạt động từng tài khoản (anh 11/11) — chỉ khi h là nhân vật của yêu cầu đang xử lý
  return ds;
}

// NOI: phần dùng chung cho may-chu/da-tau.js (Dã Tẩu)
const NOI = { oTrong: oTrongTui, laTB, campPhai: (fac) => (fac == null ? 0 : PHAI_CAMP.get(+fac) || 0), CFG, BY, ZONES, FARM, THANH, BAI_NAY, capVao, need, MAX_LEVEL, lenCap, loi, ngayVN, tien, themChong, coMon, mayMan, vaoTui, mang: MANG, soThuoc, laThuoc, xepChong, donChong, TIEN_MAX, ROWS, CHIA_XA, KBH_VV, KBH_TAM, CAU_KBH, KHONG_KHOA, CAU_TK, MAPS, FULL }; // chợ trời (may-chu/cho-troi.js): thuốc mang tối đa, gộp chồng, tiền tối đa; ROWS: sạp Hệ thống của Dã Tẩu dựng món; MAPS / FULL: bảng bản đồ đã nạp (region, scale — may-chu/npc-gan.js đổi tọa độ NPC, anh 13/11)
module.exports = { muaLaiGui, MUA_LAI, NOI, mobStats: MS, quaiCap: (lv) => (QUAI_CAP ? QUAI_CAP(lv) : null), knBai, baiNay, chuan, hamChieu, laLuyen, sachPhai, luyenDon, luyenCua, diemDaDung, dangNhapDem, thuongDN, dnCho, mauSat, gietQuai, roiMon, luyenKn, nhanChia, nhat, datBai, datChung, doiDo, banMon, coMon, tien, chet, lam, uong, hao, uyThacVe, uyThacDo, buffDem, buffCon, laHoan, CHIEU_SACH, thuUyThac, ghiDev, tenMon, giaBan, SLOT_OF, timMon, taoQua, monTin, tenBai, MAX_LEVEL, RXC, monRuongXanh, choRuongXanh, nhanRuongCho, BUA_MON, LUAT: { muaLai: { phut: MUA_LAI.phut, heSo: MUA_LAI.heSo }, sua: SUA, haoMon: +DB.haoMon || 0, vuKhi: VK, uyThac: { gioNgay: UT.gioNgay, tiLe: UT.tiLe, vangGiay: UT.vangGiay }, get dangNhap() { return { xu: DN.xu, phiTiep: DN.phiTiep }; }, ruongChuy: ((CFG.daTau || {}).ruong || {}).chuy ?? 6, ruongXanh: { soDong: RXC.soDong, oTrong: RXC.oTrong }, ruong: { moRong: RG.moRong }, tienTrang: { luongMotXu: TT.luongMotXu, luongBanXu: TT.luongBanXu, banXuNgay: TT.banXuNgay }, doiPhai: { cap: +((CFG.doiPhai || {}).cap) || 120, ngay: +((CFG.doiPhai || {}).ngay) || 7 }, kyNangPhai: CFG.kyNangPhai || null, choTroi: ((C) => { const t = C.thue ?? 20, b = Number.isFinite(+C.thueBan) ? +C.thueBan : t / 2; return { thue: t, thueBan: b, thueMua: Number.isFinite(+C.thueMua) ? +C.thueMua : t - b, cap: C.cap ?? 10 }; })(CFG.choTroi || {}), get thuongCap() { return ((CFG.thuongCap || {}).moc || []).map((m) => m.cap).filter((c) => c > 0).sort((a, b) => a - b); }, tanThu: CFG.tanThu || null, tangIchDoi: CFG.tangIchDoi || null, quaiChung: CFG.quaiChung ? { bai: (CFG.quaiChung.bai || []).map(Number), thuong: QC_THUONG, manh: CFG.quaiChung.manh || null } : null, satThu: { mau: (CFG.satThu && CFG.satThu.mau) || {}, dat: SAT_DAT }, chong: TC.chongToiDa, mua: TC.muaToiDa, mang: TC.mangToiDa || 60, banLai: TC.banLai, giaBan: CFG.giaBan, thieuCap: VB.thieuCap | 0, noiCong: +((CFG.noiCong || {}).phanTram) || 0, quaiVoCong: { ...(CFG.quaiVoCong || {}), bat: process.env.VL_QUAI_VO_CONG === "1" || !!(CFG.quaiVoCong || {}).bat }, voCong: (CFG.voCong && CFG.voCong.moPhai) || ["shaolin", "emei"], canBang: { trum: CAN_BANG.trum || null, soQuai: CAN_BANG.soQuai || null, tinhAnhMoi: QD.tinhAnhMoi, thuLinhMoi: QD.thuLinhMoi, ta: Object.fromEntries(Object.entries(RDB).map(([z, b]) => [z, { ten: b.ta.ten, mau: b.ta.mau, st: b.ta.st, ar: b.ta.ar, def: b.ta.def }])), bai: Object.fromEntries(Object.entries(CAN_BANG.bai || {}).map(([z, b]) => [z, { mau: b.mau, satThuong: b.satThuong, ...(b.chiSo ? { chiSo: b.chiSo } : {}), ...(b.soQuai ? { soQuai: b.soQuai } : {}), ...Object.fromEntries(["chinhXac", "neTranh", "capQuai", "mauThuLinh", "mauTinhAnh"].filter((k) => b[k] != null).map((k) => [k, b[k]])) }])) } } };
