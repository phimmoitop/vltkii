// API máy chủ chung (bước 1 của THIET-KE-S1.md mục 7): đăng nhập, 3 ô nhân vật, lưu nhân vật, số người trực tuyến.
//   POST   /api/dang-nhap  { ten, mk }  -> { ten, admin, nv, sv } + cookie phiên
//   POST   /api/dang-xuat
//   GET    /api/toi                     -> { ten, admin, nv, sv }
//   GET    /api/trang-thai              -> { online, sv }   (trình duyệt hỏi mỗi 5 giây: đo ping + số người)
//   GET    /api/anh-cho                 -> { anh: [tên file] }  ảnh màn chờ đổi bản đồ trong assets/ui/loading/ (thả ảnh vào là có)
//   POST   /api/nv/<ô>     { hero }     tạo nhân vật (tên dùng chung cả máy chủ, không trùng)
//   PUT    /api/nv/<ô>     { hero }     lưu nhân vật
//   DELETE /api/nv/<ô>                  xóa (chép vào du-lieu/da-xoa/)
//   POST   /api/nhip      { o, s, tin, k?, chet?, uong?, nhat?, bai?, hao?, bst? } -> { ai, tin, tinId, doi, online, nv?, kq?, phat?, tui?, nhat?, dat?, hao?, chia?,
//                         btg, btgThuong? } — bst / btg / btgThuong: boss thế giới (may-chu/boss-tg.js — sát thương khi kênh WebSocket chưa mở, trạng thái, thưởng)
//                         nst? -> snh, snThuong? — Săn Nhím Béo Phì (may-chu/san-nhim.js — như boss thế giới)
//                         phd? -> phKq? — Phong Hỏa Liên Thành (may-chu/phong-hoa.js: sát thương khi kênh chưa mở, thưởng giết quái + thắng trận)
//                         tkTin? = [câu] thưởng cuối trận Tống Kim (may-chu/tong-kim.js ketThuc ghi vào tệp — kèm tui + nv)
//                         ntc = loại thưởng của nút Nhận thưởng còn nhận được: "dn" đăng nhập, "cap" thăng cấp, "onl" online, "pd" phúc duyên
//                         rtb = Rương Thần Bí đang có [[mã, bãi, x, y]] (may-chu/ruong-tb.js)
//                         mcTin = câu tiến độ nhiệm vụ giết quái Võ Lâm Minh Chủ do đồng đội hạ giúp (may-chu/minh-chu.js nhanDoi)
//                         mcv = quái canh cây thu thập (máu chung, chết / sống lại — may-chu/minh-chu.js veTT); gửi b.mcv = [[u, d]] khi kênh chưa mở
//                         vad? -> vaKq?, vaDi?, vaPhong? — Vượt Ải tổ đội (may-chu/vuot-ai.js phòng: sát thương khi kênh chưa mở, thưởng / đồ rơi quái
//                         chung, lệnh vào ải khi đội trưởng báo danh, trạng thái phòng khi kênh chưa mở)
//                         thấy nhau trên bản đồ + nhận chat (may-chu/the-gioi.js); k = quái đã giết, chet = số lần trọng thương
//                         -> kinh nghiệm / tiền + đồ rơi xuống đất (may-chu/do.js); uong = thuốc đã uống [[u, số bình], …] -> trừ bình;
//                         nhat = vật trên đất nhặt được [g, …]; bai = vừa vào bãi đó -> dat = vật còn nằm trên đất ở bãi;
//                         hao = [số lần ra đòn, bị đánh trúng, sang vùng bản đồ khác] -> trừ độ bền đồ đang mặc, hao = { sap, hong } (tên món);
//                         dv = bản danh sách món người chơi vứt ra (chung cả bãi — anh 30/10) đang có -> dc = { v, ds } khi đã đổi;
//                         gd = giao dịch (may-chu/giao-dich.js cua) — người kia vừa giao xong thì kèm tui + nv
//                         chv = bản danh sách sạp chợ trời trình duyệt đang có -> cho = { v, ds } sạp đang mở ở bãi (khi đã đổi); choTin = câu báo
//                         người bán (có người mua) + tui, nv, sap (may-chu/cho-troi.js)
//   POST   /api/chat      { o, ch, t }  -> { id }
//   POST   /api/doi       { o, viec, ten?, id? } -> { doi, msg }   tổ đội (may-chu/to-doi.js); doi cũng gửi kèm mỗi nhịp
//   POST   /api/bang-hoi  { o, viec, … } -> { bh?: BangXem | null, ds?, msg?, tin?, cho? } (+ nv, tui khi tiền / túi đổi)   bang hội đợt 1 (may-chu/bang-hoi.js — anh 14/11,
//                         THIET-KE-BANG-HOI.md 1.8); nhịp trả bhMinh { id, ten, cv, nhan, v } | null, bhMoi { id, ten, nguoi, het } | null, b.bhcc (mã công cáo đang ghim)
//                         khác -> bhCc { id, t? }; lập bang phải đứng gần Người hướng dẫn bang hội (npc-gan.js); chuyenVi / giaiTan / duoi cần mật khẩu cấp 2 (bao-mat.js)
//                         Đợt 2 (HOP-DONG-DOT-2): quỹ / cống hiến / cấp bang / tác phường / Lễ Vật / Tế Đàn / mục tiêu tuần (viec mới — đầu tệp bang-hoi.js); nhịp: BH.quai
//                         (quái + ủy thác), BH.nhanCho (phiếu giao lại / hoàn — dấu h.bhMa trong GIU), BH.nhip nhận tk (khóa người); /api/pld truyền tk / ô (cống hiến)
//   POST   /api/khu-bang  { o, viec: xem | vao | dangNhap (z) | xaPhu (den) | chonMau (mau) } -> { khu?, di?, vao?, msg?, tin? } (+ nv, tui khi trả lộ phí Xa phu)   khu vực
//                         bang (bang hội đợt 4 — may-chu/khu-bang.js); nhịp trả kbDi { z, at?, tin, khu? } khi phải rời khu; LUAT.khuBang
//   POST   /api/loi-dai   { o, viec, khoa? } -> { say?, vao?, ve?, msg?, can?, ldp? } + nv   Lôi Đài Công Bình Tử (may-chu/loi-dai.js — anh 15/11); nhịp trả ldDi { z, at } (đứng
//                         ở vùng lôi đài không có vai), ldTin (câu báo hoàn phí)
//   POST   /api/ti-thi   { o, viec: gui (ten, cau) | nhan (id) | tuChoi (id) | vao | luat } -> { msg, vao?, ttGui?, tiThi? } + nv   tỉ thí (may-chu/ti-thi.js — anh 17/11): chiến
//                         thư từ menu người chơi, nhận lời = sân Lôi Đài 1 vs 1 miễn phí; nhịp trả ttMoi [chiến thư chờ mình] / ttVao (số sân mình chưa vào)
//   POST   /api/loi-dai-qt { o, viec: mo (che, ben, doiThu, dongDoi, cap, chuanBi, thiDau) | huy } -> { vao?, msg } + nv   trận thử lôi đài với bot (chỉ quản trị — anh 16/11,
//                         loi-dai.js thu; khóa an toàn cấp 2 như mọi API -qt)
//   POST   /api/dua-ngua  { o, viec: mo | gioiThieu | baoDanh | hop (u) | dung (i) | dich | roi | nhan | xem } -> { say?, vao?, ve?, tin?, thuong?, s? } + nv, tui
//                         Truy Phong Đại Loạn Đấu — đua ngựa (may-chu/dua-ngua.js — anh 16/11); nhịp trả dnDi { z, at } (đứng ở đường đua 863 mà không còn lượt)
//   POST   /api/dua-ngua-qt { o, viec: mo (phut, dua, bot) | bot (n) | batDau | hop | doCu (id) | di (moc) | ket | xoa | xem } -> { vao?, msg?, s? } + nv   lượt thử đua
//                         ngựa của công cụ thử (chỉ quản trị — dua-ngua.js thu; khóa an toàn cấp 2 như mọi API -qt)
//   POST   /api/bao-dap-an-su { o, viec: tt | moiRuou | dang | doi (loai tt | ns | td) | muaTo, n? } -> { bdas, msg?, kn?, tra? } + nv, tui   Báo Đáp Ân Sư (may-chu/
//                         bao-dap-an-su.js — anh 16/11): Võ Sư Ba Lăng (mời rượu / dâng hương bao), Chưởng Đăng Cung Nữ (đổi hương bao / mua Tơ Tằm); nhịp: Nến đồng đội
//                         thắp (nhanNen — tin hệ thống riêng + buff); /api/do dùng Phong Lăng Truyền Tống Lệnh trả thêm di (như /api/pld)
//   POST   /api/kham-nam { o, viec: tt | kham (u, da, oKham: cap | linh | 0–4) | muaHl (n) } -> { ok?, loai?, u?, msg?, tin?, daiCat?, khamNam } + nv, tui   khảm nạm
//                         Thủy tinh (may-chu/kham-nam.js — anh 17/11): Thợ rèn Ba Lăng / Biện Kinh (kham), Thương nhân thần bí (muaHl — Hoán Linh Thạch 250 Xu, khóa)
//   POST   /api/giao-dich { o, viec, ten?, id?, on?, ds?, n? } -> { gd, msg?, nv?, tui? }   giao dịch giữa 2 người chơi (may-chu/giao-dich.js — anh 30/10)
//   POST   /api/cho       { o, viec, qc?, u?, gia?, on?, bai?, x?, y?, k? } -> { sap?, xem?, ds?, msg?, bao?, nv?, tui? }   chợ trời — bày bán
//                         (may-chu/cho-troi.js — anh 02/11)
//   GET    /api/ung-ho                  -> { ds: [{ ten, tien }], tong, luc }  danh sách ủng hộ tác giả (may-chu/ung-ho.js — anh 12/11)
//   GET    /api/xep-hang                -> { ds: [{ n, lvl, exp, fac, tien }], bang: [{ ten, chu, cap, n, tongCap }] }  bảng xếp hạng (may-chu/xep-hang.js; bang —
//                         anh 14/11); nhịp trả thêm hang = thứ tự cấp của nhân vật đang chơi (ô "Hạng" dải trên)
//   POST   /api/do        { o, act: mac | thao | dat | ban | loc | mua | vut | phu | thanh | catDo | sua | cat | lay | datR | gui | rut | moRuong | datMk |
//                         doiMk | khoa | moKhoa | doiXu, u?, slot?, x?, y?, z?, n?, k?, r?, mk?, moi? } -> { msg, nv, tui, vut? }   (sua = sửa đồ;
//                         cat / lay / datR / chuyenR = rương chứa đồ, r = rương số mấy (0 chính, 1–3 mở rộng, "tm" túi tử mẫu), chuyenR
//                         { tu, den } = dời giữa 2 kho; gui / rut = ngân lượng rương; moRuong = mua rương mở rộng ở Thẩm
//                         Cửu; datMk / doiMk / khoa / moKhoa = mật mã rương; doiXu = Tiền trang đổi ngân lượng lấy n Xu; banXu = Tiền trang đổi n Xu ra ngân lượng (hoi: chỉ hỏi — còn đổi được bao nhiêu hôm nay, đếm theo tài khoản; trả banXu); thanh / catDo = Trợ Thủ ở thành: bán
//                         – sửa – mua – cất tiền / cất món mức Tự bán giữ lại vào rương)
//                         muaKtc { k, n } = mua ở Kỳ Trân Các bằng Xu; dung { u, chon?, n? } = dùng món Kỳ Trân Các -> thêm chon (Đại Thành:
//                         chọn chiêu) | hoiSo, con (lễ bao: hỏi số viên) | hoiPq (Phú quý cẩm hạp: hỏi số 10–99) | hieuUng (Pháo Hoa / Hoa hồng: mã chiêu hiệu ứng) | kn (sách / điểm thêm — knCua); mọi trả lời có buff (trạng thái còn)
//   POST   /api/quan-tri/nv { o, hero }  công cụ thử: ghi cấp / kinh nghiệm / tiền / xu / túi / đồ mặc (chỉ tài khoản quản trị)
//   POST   /api/quan-tri/uy-thac { o, gio, bai?, boCap?, xem? }  công cụ thử: ủy thác gio giờ ngay -> { uyThac, trangThai, nv, tui }
//   POST   /api/quan-tri/ds | tk | xu-ly | qua | mon | thong-bao | nhat-ky   bảng quản trị (may-chu/quan-tri.js — anh 28/10); việc của người chơi
//                         ghi nhật ký hoạt động (may-chu/nhat-ky.js): vào / ra, tạo / xóa nhân vật, lên cấp, đồ hiếm, Kỳ Trân Các, đổi Xu
// Ủy thác (27/10 — may-chu/do.js): mỗi nhịp đo tốc độ giết; nhân vật vắng mặt (không nhịp > 90 giây) lúc đang tự đánh -> nhịp kế tiếp
// máy chủ cày thay khoảng vắng, nhịp trả uyThac = bảng tổng kết (+ nv, tui).
// Lỗi: { loi: câu báo, ma? } — ma "het-phien" = chưa đăng nhập / tài khoản vừa đăng nhập ở nơi khác (mỗi tài khoản 1 phiên); "xa-npc" = API NPC gọi khi không ở
// đúng bản đồ / không đứng gần NPC (may-chu/npc-gan.js — anh 13/11, kèm cờ Nghi dùng công cụ ở F10: may-chu/nghi-tool.js).
// Cấp, kinh nghiệm, ngân lượng, xu, túi, đồ mặc (GIU) do máy chủ quyết (25/10): PUT /api/nv không đổi được các trường này; trình duyệt chỉ
// báo quái đã giết. Phần còn lại của nhân vật (điểm tiềm năng, võ công, phái, bãi…) vẫn do trình duyệt gửi, máy chủ chỉ chặn quá số điểm.
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu");
const TG = require("./the-gioi");
const NGM = require("./nguon-mon"); // nguồn gốc món (anh 18/11 tối) — NG đã là npc-gan
const MT = require("./mau-tin.js"); // màu chữ tin hệ thống: tên nhân vật, phần thưởng (anh 13/11)
const TD = require("./to-doi"); // tổ đội (anh 28/10 lần 4)
const GD = require("./giao-dich"); // giao dịch (anh 30/10)
const CHO = require("./cho-troi"); // chợ trời — bày bán (anh 02/11)
const DO = require("./do");
const XH = require("./xep-hang");
const DTau = require("./da-tau"); // Dã Tẩu (anh 27/10)
const PLD = require("./phong-lang-do"); // Phong Lăng Độ (anh 27/10)
const SAT = require("./sat-thu"); // Boss Sát thủ — Nhiếp Thí Trần (anh 27/10)
const VAI = require("./vuot-ai"); // Vượt Ải — Thách thức thời gian (anh 28/10)
const VDE = require("./viem-de"); // Viêm Đế Bảo Tàng (anh 04/11 — anh 09/11 "tối ưu phần thưởng cho server chúng ta")
const NCS = require("./nhat-chia-se"); // tham khảo cài đặt Nhặt đồ của người khác (anh 09/11)
const TTY = require("./tay-tuy"); // Đảo Tẩy Tủy — Xa phu / Thích Minh (anh 28/10)
const QT = require("./quan-tri"); // bảng quản trị (anh 28/10)
const NK = require("./nhat-ky"); // nhật ký hoạt động (anh 28/10)
// nhật ký chung theo hoạt động (anh 18/11: "chia ra cái hoạt động … để biết được người chơi làm những gì" — F10 → Nhật ký, nhóm con nhat-ky.js HD_NHOM):
// câu kết quả của hoạt động (tin / msg — mở hộp thoại NPC, xem trạng thái thì không ghi) -> 1 dòng "hd" bắt đầu bằng tên hoạt động
const boThe = (t) => (Array.isArray(t) ? t.map((x) => (Array.isArray(x) ? x[0] : x)).join("") : String(t ?? "")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const chuMonNk = (ds) => (ds || []).map((m) => `${(m.sl | 0) > 1 ? m.sl + " " : typeof m.n === "number" && m.n > 1 ? m.n + " " : ""}${String(typeof m.n === "string" ? m.n : DO.tenMon(m)).trim()}${(m.d | 0) > 0 ? ` (${m.d} dòng)` : (m.d || []).length ? ` (${m.d.length} dòng)` : ""}`).join(", ");
function ghiHd(ten, tk, nv, ...ds) { try { const c = ds.flat().map(boThe).filter(Boolean).join(" · "); if (c) NK.ghi("hd", tk, nv, `${ten}: ${c}`); } catch { /* sổ không làm hỏng việc */ } }
const HD_XEM = new Set(["mo", "xem", "tt", "info", "gioiThieu", "hoiHuy", "luat"]); // việc chỉ xem / mở hộp thoại: không ghi
const SN_LOAI = { phat: "phát hiện", tham: "tham gia", nsk: "may mắn" };
const MQ = require("./ma-qua"); // mã kích hoạt — Lễ quan (anh 29/10)
const DP = require("./doi-phai"); // đổi môn phái bằng Tín vật môn phái — NPC môn phái Ba Lăng (anh 11/11)
// việc đồ ghi sổ hoạt động từng tài khoản (nhat-ky.js hd): mua / bán / sửa ở cửa hàng NPC, Trợ Thủ về thành, rương chứa đồ, dùng / mở món, Kỳ Trân Các
const HD_DO = { muaLai: "mua", mua: "mua", ban: "ban", thanh: "mua", sua: "mua", muaKtc: "mua", muaPd: "mua", muaTk: "mua", doiXu: "mua", banXu: "ban", gui: "ruong", rut: "ruong", datR: "ruong", lay: "ruong", chuyenR: "ruong", dung: "dung", vut: "dung", huy: "dung", catDo: "ban" };
const CHQ = require("./cau-hinh-qt"); // tl của nhịp: bắt cả máy chủ F5 + mã bản trình duyệt (anh 11/11 — F10 → Cấu hình)
const BTG = require("./boss-tg"); // boss thế giới máu chung (anh 31/10 — quái chung bước 1; kênh tức thời may-chu/ws.js)
const BT = require("./bao-tri"); // bảo trì: chỉ tài khoản quản trị vào được (anh 31/10 khuya)
const DY = require("./duyet"); // duyệt người chơi: bật thì chỉ quản trị + tài khoản đã duyệt vào được (anh 11/11 khuya)
const KTN = require("./khoa-tai-nguyen"); // phiếu tài nguyên: assets/ chỉ cho người đã đăng nhập (chống sao chép — lượt 61)
const CH = require("./chong-hack"); // phát hiện tăng tốc trình duyệt (Cheat Engine, trình duyệt có nút tăng tốc — anh 31/10 khuya)
const NT = require("./nghi-tool"); // nghi dùng công cụ tự động (anh 13/11 — "S2 PRO AUTO"): cờ tk.nghiTool + nhật ký "tool" cho bảng F10, không tự khóa
const NG = require("./npc-gan"); // đứng gần NPC (anh 13/11): API NPC chỉ nhận ở đúng bản đồ + gần NPC — sai thì 400 ma "xa-npc" + cờ nghi dùng công cụ
const ONL = require("./online"); // Online nhận thưởng — tích lũy thời gian online trong ngày (anh 31/10 khuya)
const TCAP = require("./thuong-cap"); // Thưởng thăng cấp 10 … 150 (anh 02/11)
const PTH = require("./phan-than"); // Phân Thân — thuê phân thân của người chơi khác (anh 05/11)
const QC = require("./quai-chung"); // quái chung ở bãi train (anh 02/11 — làm thử Lâm Du Quan; cau-hinh.json quaiChung.bai)
const SN = require("./san-nhim"); // Săn Nhím Béo Phì (anh 03/11 — 5 đợt / ngày ở Ba Lăng huyện + Biện Kinh; cau-hinh.json sanNhim)
const PD = require("./phuc-duyen"); // phúc duyên (anh 31/10 khuya lần 2 — client fuyuan.lua)
const PQ = require("./phu-quy"); // Phú Quý Cẩm Hạp (anh 03/11 — Thần Tài Biện Kinh, quay số 22:10)
const BC = require("./bau-cua"); // Bầu Cua (anh 10/11 — Chủ sòng bạc Ba Lăng huyện / Biện Kinh, 19:00 – 19:30)
const BM = require("./bao-mat"); // Khóa an toàn — mật khẩu cấp 2 + tự đổi mật khẩu đăng nhập (anh 10/11 "Duyệt hết a")
const RTB = require("./ruong-tb"); // Rương Thần Bí (anh 03/11 — 20:10 ở bãi từ cấp 90)
const MC = require("./minh-chu"); // nhiệm vụ Võ Lâm Minh Chủ hằng ngày (anh 03/11 — Hắc Bạch Sứ Giả)
const TLAM = require("./tu-lam"); // Trợ Thủ tự làm Dã Tẩu / săn Boss Sát thủ — mở khóa trong ngày bằng Xu (anh 03/11)
const PHO = require("./phong-hoa"); // Phong Hỏa Liên Thành (anh 04/11 — 19:00 hằng ngày, Vệ binh thành môn Biện Kinh)
const TKM = require("./tong-kim"); // Tống Kim bãi thử (anh 05/11 — đợt 1)
const LHD = require("./lich-hd"); // lịch hoạt động: trạng thái + số lần hôm nay; GM chỉnh giờ ở F10 (anh 05/11)
const TCU = () => require("./tra-cuu"); // dữ liệu Tra cứu (rương, rơi đồ, thưởng — dựng từ cấu hình đang chạy, anh 05/11)
const BH = require("./bang-hoi"); // bang hội đợt 1 (anh 14/11 — THIET-KE-BANG-HOI.md): du-lieu/bang-hoi.json, khung Bang phái, nhãn bang trong nhịp
const KB = require("./khu-bang"); // bang hội đợt 4 — khu vực bang (HOP-DONG-DOT-4): /api/khu-bang, nhịp đưa người không còn được ở khu ra, LUAT.khuBang
const LD = require("./loi-dai"); // Lôi Đài Công Bình Tử (anh 15/11 — THIET-KE-LOI-DAI.md): /api/loi-dai, nhịp ldDi / ldTin, đăng xuất = bị loại, không phạt chết trong sân
const DN = require("./dua-ngua"); // Truy Phong Đại Loạn Đấu — đua ngựa (anh 16/11): /api/dua-ngua, /api/dua-ngua-qt, nhịp dnDi, Trợ Thủ tắt trên đường đua (không tính ủy thác)
const NSK = require("./nguon-su-kien"); // anh 18/11 — nguồn nguyên liệu sự kiện (sườn dùng lại): nhiệm vụ ngày lễ (nvCua nsk)
const BD = require("./bao-dap-an-su"); // anh 16/11 — Báo Đáp Ân Sư: /api/bao-dap-an-su, nhịp nhận Nến đồng đội, LUAT.baoDapAnSu (ngày mở / mở hương bao / cấp kỹ năng tối đa…)
const KN = require("./kham-nam"); // anh 17/11 — khảm nạm Thủy tinh: /api/kham-nam (Thợ rèn Ba Lăng / Biện Kinh, Thương nhân thần bí), LUAT.khamNam (phí, tỉ lệ Tử, mã đá)
const TT = require("./ti-thi"); // anh 17/11 — tỉ thí: /api/ti-thi (chiến thư, nhận lời -> sân lôi đài 1 vs 1 miễn phí), nhịp ttMoi / ttVao, LUAT.tiThi (câu khịa, giờ)
Object.defineProperty(DO.LUAT, "tkHoan", { enumerable: true, configurable: true, get: () => TKM.hoanGiay() }); // anh 17/11: giây tối đa của hoàn trong trận Tống Kim — trình duyệt ghi ở ô xem món
const PACK = require("../assets/server.json");

// name: tên máy chủ hiện ra — VL_TEN_MAY của từng máy (anh 12/11: 2 máy chung mã — S1 chanlong đặt "S1 · Đồ xanh" trong s1.service, S2 s343clgt không
// đặt -> assets/server.json); trình duyệt đổi tên thẻ máy chủ theo (src/game/main.js tenMay)
const SV = { server: PACK.server, name: String(process.env.VL_TEN_MAY || PACK.name).slice(0, 40), luat: DO.LUAT }; // luat: số bình mỗi chồng / mỗi lần mua, giá bán lại (cau-hinh.json)
const COOKIE = "vl_phien", COOKIE_AGE = 30 * 86400;     // giây
const BODY_MAX = 512 * 1024, NV_MAX = 256 * 1024;       // byte
const ONLINE_MS = 90 * 1000;                            // hỏi máy chủ trong 90 giây gần nhất = đang trực tuyến
const SAI_MAX = 10, SAI_KHOA = 10 * 60 * 1000;          // đăng nhập sai 10 lần -> khóa (địa chỉ + tài khoản) đó 10 phút
const TEN_BAD = /[\u0000-\u001f\u007f<>&"'`\\\u00ad\u061c\u115f\u1160\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufeff\uffa0]/; // + ký tự vô hình / đảo chiều (soát 14/11: tên trông như tên người khác, lật chữ khung chat)
// mọi ký tự điều khiển / định dạng / mặc định vô hình (Default_Ignorable: \u034F, \uFE00–\uFE0F, \uE0000–\uE0FFF, \u17B4, \u180B… — vẽ ra y hệt tên người khác)
// + ô braille trống \u2800 (trông như dấu cách). Chỉ tên mới tạo (tenNv) — nhân vật cũ, đăng nhập, lưu không đổi; tên trang trí (ký hiệu Thái / Ả Rập, hoa văn Java, ★, †, ™) vẫn được
const TEN_VH = /[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}\u2800]/u;
const GIU = ["lvl", "exp", "gold", "xu", "bag", "equip", "looks", "uN", "locDo", "ruong", "tienRuong", "uyThac", "dangNhap", "ruongMo", "ruongPhu", "mkRuong", "khoa", "xoaMk",
  "books", "skMin", "kyNangThem", "tiemNangThem", "mt", "tt", "buff", "bch", "sachV", "tuiTM", "tmHet",
  "shxt", "daTau", "pld", "satThu", "dtc", "vuotAi", "va", "viemDe", "vd", "leadExp", "leadLv", "tayTuy", "quaTin", "luyen", "tlh", "onl", "pd", "thuongCap", "sap", "choTin", "sanNhim", "pq", "phiPhong", "mc", "tuLam", "rxCho", "rxDay", "rxMon", "ptChoK", "ptChoKhoa", "quaCho", "qtTin", "qtDi", "pt", "ptCho", "ptTin", "ptDay",
  "diemTk", "tkNgay", "tkTin", "bcTin", "kbhMoTin", "doiPhai", "dpV", "dpLuc", "muaLai",
  "bhMa", "ldTin", "dnCho", "bdas", "ccKn", "nsk"]; // bdas / ccKn: Báo Đáp Ân Sư (anh 16/11 — may-chu/bao-dap-an-su.js): số trong ngày + kinh nghiệm hương bao cả sự kiện, cấp kỹ năng Nhất Kỷ / Càn khôn còn hạn. dnCho: đồ thưởng đua ngựa còn giữ (túi đầy lúc về đích — 16/11, may-chu/dua-ngua.js; nhận ở Truy Phong Sứ Giả). ldTin: câu báo hoàn phí Lôi Đài (15/11 — may-chu/loi-dai.js hoan ghi thẳng tệp, nhịp gửi). bhMa: dấu phiếu bang hội đã nhận / đã trừ (14/11 — bang hội đợt 2, may-chu/bang-hoi.js HĐ 8: thiếu ở đây thì trình duyệt lưu nhân vật làm mất dấu -> giao lại / hoàn nhầm). doiPhai: chờ bái nhập phái mới (chiêu 90 / 120 mang sang), dpV: lần đổi phái, dpLuc: lúc chuyển phái — mỗi tuần 1 lần (11/11 — may-chu/doi-phai.js). kbhMoTin: món khóa có hạn vừa mở khóa, chờ nhịp báo (11/11 — do.js chuan; soát: thiếu ở đây thì trình duyệt lưu nhân vật làm câu báo lặp mãi / mất). bcTin: câu báo tiền thắng Bầu Cua (10/11). Trường của nhân vật do máy chủ quyết (pt*: Phân Thân — 05/11; diemTk / tkNgay / tkTin: Tống Kim — điểm Tống Kim, Huân công bài trong ngày, câu báo thưởng cuối trận — 06/11) (dòng 2: sách / điểm / trạng thái từ Kỳ Trân Các — 27/10; dòng 3: hoạt động — mảnh Sơn Hà Xã Tắc, Dã Tẩu, Phong Lăng Độ, Boss Sát thủ, Vượt Ải; thống soái — tổ đội 28/10; quà quản trị chưa báo — 28/10; Thiết La Hán, Online nhận thưởng — 31/10; sạp chợ trời — 02/11; số con Săn Nhím Béo Phì trong ngày, số đã chọn Phú Quý Cẩm Hạp, Phi Phong đã khoác, nhiệm vụ Võ Lâm Minh Chủ, Trợ Thủ tự làm nhiệm vụ đã mở khóa — 03/11)
const ATTR = ["str", "dex", "vit", "eng"];

// ảnh màn chờ: đọc thư mục mỗi lần hỏi (ít, nhẹ) -> anh thả thêm ảnh không cần tắt bật máy chủ
const ANH_CHO = path.join(__dirname, "..", "assets", "ui", "loading");
const anhCho = () => { try { return fs.readdirSync(ANH_CHO).filter((f) => /^[^.].*\.(webp|jpe?g|png)$/i.test(f)).sort(); } catch { return []; } };
const online = new Map(); // tên tài khoản -> lần cuối hỏi máy chủ (ms)
const trongGame = new Map(); // tên tài khoản -> tên nhân vật đang chơi (nhật ký vào / rời game — nhip)
const sai = new Map();    // "địa chỉ|tài khoản" -> { n, den } (khóa theo cả tài khoản: 1 người gõ sai không khóa người khác cùng địa chỉ)

const diaChi = (req) => req.headers["cf-connecting-ip"] || req.socket.remoteAddress || "?"; // qua Cloudflare Tunnel: địa chỉ thật của người chơi
function guiJson(res, code, obj, head = {}) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...head });
  res.end(JSON.stringify(obj));
}
const loi = (res, code, msg, ma) => guiJson(res, code, ma ? { loi: msg, ma } : { loi: msg });

function docBody(req) {
  return new Promise((ok, no) => {
    const parts = []; let n = 0;
    req.on("data", (c) => { n += c.length; if (n <= BODY_MAX) parts.push(c); });
    req.on("end", () => {
      if (n > BODY_MAX) return no(Object.assign(new Error("Dữ liệu gửi lên quá lớn"), { code: 413 }));
      try { ok(n ? JSON.parse(Buffer.concat(parts).toString("utf8")) : {}); } catch { no(Object.assign(new Error("Dữ liệu gửi lên bị hỏng"), { code: 400 })); }
    });
    req.on("error", no);
  });
}

// cookie phiên "<tên tài khoản>.<mã phiên>"; Secure khi người chơi vào bằng https (đường hầm)
// cookie hỏng ("vl_phien=%" — decodeURIComponent ném lỗi) -> coi như không có phiên (rà soát lượt 60: trước đó ném lỗi ở kênh tức thời / lớp chặn = sập máy chủ)
function cookiePhien(req) { const m = /(?:^|;\s*)vl_phien=([^;]+)/.exec(req.headers.cookie || ""); if (!m) return null; try { return decodeURIComponent(m[1]); } catch { return null; } }
function datCookie(req, val, age) {
  const https = req.headers["x-forwarded-proto"] === "https" || /https/.test(req.headers["cf-visitor"] || "");
  return `${COOKIE}=${encodeURIComponent(val)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${https ? "; Secure" : ""}`;
}
const CHUAN_MS = 60000, CHUAN_LUC = new Map(); // tài khoản -> lúc chuẩn hóa món gần nhất (tkPhien)
function tkPhien(req) {
  const c = cookiePhien(req); if (!c) return null;
  const i = c.lastIndexOf("."); if (i < 0) return null;
  const tk = D.docTk(c.slice(0, i)); if (!tk || !tk.phien) return null;
  const a = Buffer.from(tk.phien), b = Buffer.from(c.slice(i + 1));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  // nhân vật lưu trước 25/10 (đồ là chuỗi khóa / { k, n }) -> món { u, k, b, d, m }. Anh 11/11 (máy chủ lag lúc ~130 người): trước chuẩn hóa cả
  // 3 nhân vật ở MỖI yêu cầu (~250 lần / giây) — món mới đã được chuẩn hóa ngay ở chỗ thêm (api.js / do.js / chợ / giao dịch…), ở đây chỉ còn
  // đổi bản cũ + món hết hạn / khóa có hạn tới giờ mở -> mỗi tài khoản tối đa 1 lần / CHUAN_MS (hết hạn / mở khóa trễ tối đa chừng đó)
  const t = Date.now();
  if (t - (CHUAN_LUC.get(tk.ten) || 0) >= CHUAN_MS) {
    CHUAN_LUC.set(tk.ten, t);
    let doi = false;
    for (const h of tk.nv) if (h && DO.chuan(h)) doi = true;
    if (doi) D.ghiTk(tk);
  }
  return tk;
}
// phiên không còn dùng được vì quản trị đá / khóa / đổi mật khẩu (may-chu/quan-tri.js tk.biDa) -> { ma, msg } để trình duyệt báo đúng lý do
function matPhien(req) {
  const c = cookiePhien(req), i = c ? c.lastIndexOf(".") : -1; if (i < 0) return null;
  const tk = D.docTk(c.slice(0, i)), b = tk && tk.biDa;
  if (!b || b.phien !== c.slice(i + 1)) return null;
  const k = b.khoa && QT.khoaCon(tk);
  return k ? { ma: "bi-khoa", msg: QT.cauKhoa(k) } : { ma: "bi-da", msg: QT.cauDa(b.lyDo) };
}
const tuiCua = (h) => ({ muaLai: DO.muaLaiGui(h), mlGio: Date.now(), bag: h.bag, equip: h.equip, looks: h.looks, locDo: h.locDo | 0, ruong: h.ruong || [], tienRuong: h.tienRuong || 0,
  ruongMo: h.ruongMo | 0, ruongPhu: h.ruongPhu || [], khoa: h.khoa | 0, coMk: h.mkRuong ? 1 : 0, tuiTM: h.tuiTM || [], tmHet: h.tmHet || 0 });
// nhân vật gửi trình duyệt: không gửi mật mã rương đã băm (chỉ cờ coMk)
const nvGui = (h) => { if (!h || !h.mkRuong) return h; const { mkRuong, ...r } = h; return { ...r, coMk: 1 }; };
// shxt = mảnh Sơn Hà Xã Tắc, dt = nhiệm vụ Dã Tẩu đang làm (1 dòng — khung Nhiệm vụ / tin hệ thống), mc = nhiệm vụ Võ Lâm Minh Chủ hôm nay (may-chu/minh-chu.js tomTat),
// diemTk = điểm Tống Kim (Quân Nhu quan — may-chu/tong-kim.js)
const nvCua = (h) => ({ lvl: h.lvl, exp: h.exp, gold: h.gold, xu: h.xu | 0, leadLv: h.leadLv || 1, leadExp: h.leadExp || 0, bch: h.bch | 0, shxt: h.shxt | 0, dt: DTau.tomTat(h, h.daTau), dtc: DTau.chiTiet(h), pld: PLD.tomTat(h), satThu: SAT.tomTat(h), va: VAI.tomTat(h), vd: VDE.tomTat(h), tayTuy: TTY.tomTat(h), pd: PD.tomTat(h), mc: MC.tomTat(h), tl: TLAM.tomTat(h), diemTk: h.diemTk | 0, ccKn: BD.ccCon(h), nsk: NSK.tomTat(h) }); // nsk: nhiệm vụ ngày lễ (anh 18/11 — nguon-su-kien.js) // ccKn: +cấp kỹ năng còn hạn (anh 16/11 — Báo Đáp Ân Sư)
// sách / điểm thêm của nhân vật (vừa dùng món Kỳ Trân Các): trình duyệt nhận books, điểm thêm, skMin (cấp tối thiểu từ sách / Đại Thành) và
// nâng hero.skills tới skMin — không ghi đè các điểm kỹ năng trình duyệt vừa cộng mà chưa lưu
const knCua = (h) => ({ books: h.books || [], skMin: h.skMin || {}, kyNangThem: h.kyNangThem | 0, tiemNangThem: h.tiemNangThem | 0, mt: h.mt | 0, tt: h.tt | 0 });
const oCua = (tk, b) => { const o = b.o | 0, h = o >= 0 && o < D.SLOT_N && tk.nv[o]; if (!h) throw Object.assign(new Error("Ô này không có nhân vật"), { code: 404 }); return h; };

// batDoiMk: phải đổi mật khẩu đăng nhập trước khi vào game (tài khoản quản trị tạo / đặt lại — may-chu/bao-mat.js); truoc: lần đăng nhập trước { luc, ip }
// (vào game hiện 1 dòng để người chơi tự thấy có ai vào lén); co2: đã có mật khẩu cấp 2
const thongTin = (tk) => ({ ten: tk.ten, admin: !!tk.admin, nv: tk.nv.map(nvGui), sv: SV, batDoiMk: tk.batDoiMk ? 1 : 0, truoc: tk.truoc || null, co2: tk.mk2 ? 1 : 0 });
function soOnline() {
  const t = Date.now(); let n = 0;
  for (const [k, at] of online) if (t - at < ONLINE_MS) n++; else online.delete(k);
  return n;
}
// tên nhân vật cấm (anh 10/11: "cấm ng chơi đặt tên nv có chữ GM, ADMIN, cấm đặt từ tục tiễu: Địt, đụ, lồn, cặc, địt mẹ, đụ mẹ, vv") — danh sách ở
// cau-hinh.json tenCam (thêm từ không cần sửa mã): chua = có trong tên (bỏ dấu cách / chấm / gạch), tu = đúng 1 từ của tên, dauCuoi = đầu hoặc cuối
// 1 từ ("GMHuy", "Huy_GM" — "Sigma" vẫn đặt được). Từ có dấu so với tên giữ dấu; từ không dấu so với tên bỏ dấu + đổi số giống chữ (Adm1n, L0n).
// Tách từ theo dấu cách / ký tự không phải chữ và chữ hoa giữa từ (GMHuy -> GM Huy). Tài khoản quản trị không bị chặn
// "proauto" / "freeioo" (= free100 sau doiSo) / "chongdongbang": chữ bảng công cụ auto — tên như vậy hiện ở bảng boss / Tống Kim làm máy người xem tự báo
// "nghi dùng công cụ" (src/game/do-cong-cu.js — soát 13/11)
const TEN_CAM = { chua: ["admin", "proauto", "freeioo", "chongdongbang", "địt", "lồn", "cặc", "buồi", "đéo", "đụmá", "đụmẹ", "ditme", "dume", "duma", "dmm", "dcm", "dkm", "vcl", "vkl"],
  tu: ["đụ", "đĩ", "dit", "lon", "cac", "buoi", "deo"], dauCuoi: ["gm"], ...(DO.NOI.CFG.tenCam || {}) };
const coDau = (s) => /[^\u0000-\u007f]/.test(s);
const boDau = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const doiSo = (s) => s.replace(/[0134578@$!|]/g, (c) => ({ 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", "@": "a", $: "s", "!": "i", "|": "l" })[c]);
function tenCam(t) {
  const tu = t.replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2").replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2").split(/[^\p{L}\p{N}@$!|]+/u).filter(Boolean).map((x) => x.toLowerCase());
  const dau = tu.join(""), khong = doiSo(boDau(dau)), tuKhong = tu.map((x) => doiSo(boDau(x)));
  const co = (w) => (coDau(w) ? dau : khong).includes(w.toLowerCase());
  const la = (w) => (coDau(w) ? tu : tuKhong).includes(w.toLowerCase());
  const dc = (w) => { const k = w.toLowerCase(); return khong.startsWith(k) || khong.endsWith(k) || tuKhong.some((x) => x.startsWith(k) || x.endsWith(k)); }; // cả tên viết liền ("G M", "Huy G M")
  return (TEN_CAM.chua || []).some(co) || (TEN_CAM.tu || []).some(la) || (TEN_CAM.dauCuoi || []).some(dc);
}
BH.ganKiemTen(tenCam); // tên bang hội + danh hiệu bang lọc cùng danh sách tên cấm (anh 14/11 — THIET-KE-BANG-HOI.md 1.2)
function tenNv(s) {
  const t = String(s || "").normalize("NFC").trim().replace(/\s+/g, " ");
  return t.length >= 2 && t.length <= 14 && !TEN_BAD.test(t) && !TEN_VH.test(t) ? t : null;
}

function dangNhap(req, res, b) {
  const k = diaChi(req) + "|" + D.tenTk(b.ten), s = sai.get(k), t = Date.now();
  if (s && s.n >= SAI_MAX && t < s.den) return loi(res, 429, `Sai quá ${SAI_MAX} lần — thử lại sau ${Math.ceil((s.den - t) / 60000)} phút`);
  const tk = D.docTk(b.ten), ip = diaChi(req);
  if (!tk || !D.dungMk(tk, b.mk)) {
    sai.set(k, { n: s && t < s.den ? s.n + 1 : 1, den: t + SAI_KHOA });
    NK.ghi("sai-mk", tk ? tk.ten : D.tenTk(b.ten).slice(0, 20) || "?", null, tk ? "Sai mật khẩu" : "Đăng nhập tài khoản không có", { ip });
    return loi(res, 401, "Sai tên tài khoản hoặc mật khẩu");
  }
  sai.delete(k);
  const khoa = QT.khoaCon(tk); // quản trị khóa (bảng quản trị)
  if (khoa) { NK.ghi("vao", tk.ten, null, "Đăng nhập bị từ chối — tài khoản đang khóa", { ip }); return loi(res, 403, QT.cauKhoa(khoa), "bi-khoa"); }
  if (!tk.admin && BT.con()) { NK.ghi("vao", tk.ten, null, "Đăng nhập bị từ chối — máy chủ bảo trì", { ip }); return loi(res, 503, BT.cau(), "bao-tri"); }
  if (!tk.admin && !DY.duoc(tk.ten)) { NK.ghi("vao", tk.ten, null, "Đăng nhập bị từ chối — chưa được duyệt vào máy chủ", { ip }); return loi(res, 403, DY.cau(), "chua-duyet"); }
  if (tk.vao) tk.truoc = { luc: tk.vao, ip: tk.ip || "" }; // lần đăng nhập trước (thongTin truoc — anh 10/11 mật khẩu cấp 2)
  tk.phien = crypto.randomBytes(24).toString("base64url"); tk.vao = t; tk.ip = ip; delete tk.biDa; // phiên mới: nơi đăng nhập trước bị đăng xuất
  tk.ips = [ip, ...(Array.isArray(tk.ips) ? tk.ips : []).filter((x) => x !== ip)].slice(0, 10); // các IP gần đây — bảng quản trị gom tài khoản trùng IP (anh 10/11)
  GD.roi(tk.ten); // giao dịch của lần đăng nhập trước (mở giao dịch, phiên, lời xin): bỏ
  D.ghiTk(tk);
  NK.ghi("vao", tk.ten, null, "Đăng nhập", { ip });
  online.set(tk.ten, t); trongGame.delete(tk.ten);
  // + phiếu tài nguyên (may-chu/khoa-tai-nguyen.js — lượt 61): assets/ chỉ phát cho người đã đăng nhập; đăng nhập lại được = gỡ thu hồi (đặt lại mật khẩu…)
  KTN.traLai(tk.ten);
  guiJson(res, 200, thongTin(tk), { "Set-Cookie": [datCookie(req, tk.ten + "." + tk.phien, COOKIE_AGE), KTN.cap(req, tk.ten)] });
}

function taoNv(res, tk, o, b, trang) {
  if (tk.nv[o]) return loi(res, 409, "Ô này đã có nhân vật");
  const h = b.hero; if (!h || typeof h !== "object" || Array.isArray(h)) return loi(res, 400, "Thiếu nhân vật");
  const name = tenNv(h.name); if (!name) return loi(res, 400, "Tên nhân vật 2–14 ký tự, không dùng < > & \" ' ` \\ hay ký tự ẩn / ký tự điều khiển");
  if (!(tk.admin && BM.daMo(tk, trang)) && tenCam(name)) return loi(res, 400, "Tên nhân vật không được có chữ GM, ADMIN hay từ ngữ thô tục — chọn tên khác"); // quản trị: phải mở khóa an toàn
  if (D.tenDaCo(name)) return loi(res, 409, `Tên "${name}" đã có người dùng — chọn tên khác`);
  const t = Date.now();
  // trường máy chủ giữ (GIU) không nhận từ trình duyệt lúc tạo (soát 05/11: trước nhận nguyên -> gieo được rương / tiền công phân thân… = đúc vật phẩm)
  const goc = { ...h }; for (const k of GIU) delete goc[k];
  const hero = { ...goc, v: 1, slot: o, name, server: SV.server, lvl: 1, exp: 0, gold: 0, xu: 0, bag: [], equip: {}, uN: 0, locDo: 0, created: t, last: t };
  DO.chuan(hero);
  if (JSON.stringify(hero).length > NV_MAX) return loi(res, 413, "Nhân vật quá lớn");
  tk.nv[o] = hero; D.ghiTk(tk);
  NK.ghi("nv", tk.ten, name, "Tạo nhân vật");
  guiJson(res, 200, { hero });
}

function luuNv(res, tk, o, b) {
  const cu = tk.nv[o]; if (!cu) return loi(res, 404, "Ô này không có nhân vật");
  const h = b.hero; if (!h || typeof h !== "object" || Array.isArray(h)) return loi(res, 400, "Thiếu nhân vật");
  if (h.name !== cu.name) return loi(res, 409, "Nhân vật không khớp ô lưu — hãy tải lại trang");
  const hero = { ...h, v: 1, slot: o, name: cu.name, server: cu.server, created: cu.created, last: Date.now() };
  const dpCu = (h.dpV | 0) !== (cu.dpV | 0); // bản lưu gửi trước lần đổi môn phái gần nhất (may-chu/doi-phai.js): phái / hệ / võ công theo bản máy chủ
  for (const k of GIU) if (k in cu) hero[k] = cu[k]; else delete hero[k];
  // + sex: Dị Dung Bí Thuật đổi giới tính cũng tăng dpV (anh 16/11 — do.js dungVat doiGioi): bản lưu gửi trước lúc đổi không ghi đè giới mới
  if (dpCu) for (const k of ["fac", "facKey", "camp", "rank", "series", "start", "skills", "sex"]) if (k in cu) hero[k] = cu[k]; else delete hero[k];
  // giới tính chỉ đổi qua máy chủ (Dị Dung Bí Thuật — do.js doiGioi; F10 — quan-tri.js gioi): bản lưu trình duyệt không đổi được (soát 16/11: sửa bản lưu = đổi giới
  // không tốn 100 Xu). Không đưa vào GIU — taoNv bỏ các khóa GIU nên nhân vật mới mất giới đã chọn
  if ("sex" in cu) hero.sex = cu.sex;
  if (cu.doiPhai) { hero.fac = null; hero.facKey = null; delete hero.camp; delete hero.rank; hero.skills = {}; } // đang chờ bái nhập phái mới: Vô Môn Phái
  delete hero.coMk; // cờ "đã có mật mã rương" chỉ để trình duyệt xem (nvGui)
  // điểm tiềm năng / kỹ năng đã cộng không được quá số cấp cho (5 / 1 mỗi cấp — src/game/rules.js) + điểm từ vật phẩm (Tẩy Tủy Kinh,
  // Võ Lâm Mật Tịch, sách võ công, Đại Thành Bí Kíp — may-chu/do.js dungVat): quá thì trả lại hết. Chiêu sách (90 / 120 / 150) chưa đọc sách:
  // bỏ (anh 27/10 "phải đọc sách như client"); cấp tối thiểu từ sách / Đại Thành (skMin) giữ lại
  const a = hero.attr || {};
  if (ATTR.reduce((t, k) => t + (a[k] | 0), 0) > 5 * ((hero.lvl || 1) - 1) + (hero.tiemNangThem | 0)) hero.attr = { str: 0, dex: 0, vit: 0, eng: 0 };
  hero.skills = hero.skills && typeof hero.skills === "object" ? hero.skills : {};
  for (const id of Object.keys(hero.skills)) if (DO.CHIEU_SACH.has(+id) && !(hero.books || []).includes(+id)) delete hero.skills[id];
  // chiêu luyện (do.js laLuyen — sách 90 / 120 / 150 có cờ luyện, anh 29/10): cấp theo độ luyện, máy chủ giữ -> lấy của bản máy chủ
  for (const id of new Set([...Object.keys(hero.skills), ...Object.keys(cu.skills || {})])) if (DO.laLuyen(id)) { const v = (cu.skills || {})[id] | 0; if (v > 0) hero.skills[id] = v; else delete hero.skills[id]; }
  // điểm kỹ năng (29/10): được (cấp − 1) + Võ Lâm Mật Tịch, đã dùng = phần trên cấp cho không (skMin) của chiêu không luyện; quá thì trả lại hết
  if (DO.diemDaDung(hero) > (hero.lvl || 1) - 1 + (hero.mt | 0)) for (const id of Object.keys(hero.skills)) if (!DO.laLuyen(id)) delete hero.skills[id];
  for (const [id, m] of Object.entries(hero.skMin || {})) if ((hero.skills[id] | 0) < m) hero.skills[id] = m;
  // chiêu sách không thuộc phái đang ở: bỏ (anh 10/11 "đường môn đánh mà có hiệu ứng chiêu 12x của ngũ độc" — đổi phái bằng công cụ thử F10 chỉ xóa ở trình duyệt, cấp chiêu luyện /
  // skMin của phái cũ do máy chủ giữ nên 2 dòng trên trả lại, chiêu tự phát Hấp Tinh Yểm vẫn chạy trên tài khoản đã sang Đường Môn)
  for (const id of Object.keys(hero.skills)) if (DO.CHIEU_SACH.has(+id) && !DO.sachPhai(hero.fac, id)) delete hero.skills[id];
  DO.hamChieu(hero); // từng chiêu ≤ cấp nhân vật − cấp yêu cầu + 1 (anh 29/10 — như engine)
  if (JSON.stringify(hero).length > NV_MAX) return loi(res, 413, "Nhân vật quá lớn");
  tk.nv[o] = hero; D.ghiTk(tk);
  guiJson(res, 200, { ok: 1, online: soOnline() });
}

// nhịp 2 lần / giây: kèm quái đã giết / số lần trọng thương thì máy chủ tính kinh nghiệm, ngân lượng, rơi đồ rồi gửi kết quả
function nhip(res, tk, b, trang) {
  const o = b.o | 0, h = o >= 0 && o < D.SLOT_N ? tk.nv[o] : null, ket = {}, key = tk.ten + "|" + o, lv0 = h ? h.lvl || 1 : 0;
  const giet = Array.isArray(b.k) && b.k.length, chet = Math.min(3, b.chet | 0), uong = Array.isArray(b.uong) && b.uong.length;
  const nhat = Array.isArray(b.nhat) && b.nhat.length, hao = Array.isArray(b.hao) && b.hao.some((v) => v > 0);
  // nhật ký vào / rời game: 1 lần mỗi lượt chơi của nhân vật (tab ẩn nhịp thưa vẫn là 1 lượt)
  if (h && b.s && trongGame.get(tk.ten) !== h.name) { trongGame.set(tk.ten, h.name); NK.ghi("choi", tk.ten, h.name, `Vào game — ${DO.tenBai(b.s.zone) || `bản đồ ${b.s.zone | 0}`}`); GD.roi(tk.ten); }
  if (b.s === null) BM.khoaTrang(tk.ten, trang); // thoát game (về màn chọn nhân vật / đóng trang): khóa an toàn của trang này khóa lại (rà soát 10/11)
  if (h && b.s === null && trongGame.delete(tk.ten)) { NK.ghi("roi", tk.ten, h.name, "Rời game"); GD.roi(tk.ten); }
  if (b.s === null) try { LD.roiGame(tk.ten, o); } catch (e) { console.error("Lôi đài — rời game:", e.message); } // Lôi Đài: thoát game giữa trận = bị loại (soát 16/11: chỉ khi ô o là nhân vật có vai — thẻ khác cùng tài khoản thoát thì thôi)
  if (h && b.bai != null) { ket.dat = DO.datBai(key, b.bai); ket.nv = nvCua(h); } // vào bãi: gửi kèm nhiệm vụ (bảng nhiệm vụ góc trái — đếm trong ngày mới nhất)
  // ủy thác: vừa vắng mặt lúc đang tự đánh -> cày thay khoảng vắng (trước quái của nhịp này)
  let ghi = false;
  const ut = h ? DO.uyThacVe(h) : null;
  if (ut) {
    const { bao, ...kq } = ut; ket.uyThac = kq; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghi = true;
    for (const it of bao) { TG.thongBao(`${MT.ten(h.name)} ủy thác nhặt được ${MT.thuong(`${DO.tenMon(it)} ${it.d.length} dòng`)}!`); NK.ghi("hiem", tk.ten, h.name, `Ủy thác nhặt ${DO.tenMon(it)} ${it.d.length} dòng`, { mon: [NK.mon(it)] }); }
  }
  if (h && (giet || chet > 0 || uong || nhat || hao)) {
    if (uong && DO.uong(h, b.uong)) ket.tui = tuiCua(h);
    if (hao) { const r = DO.hao(h, b.hao); if (r.doi) ket.tui = tuiCua(h); if (r.sap.length || r.hong.length) ket.hao = { sap: r.sap, hong: r.hong }; }
    if (giet) {
      // quyền quản trị bỏ qua kiểm tra quái (công cụ thử): chỉ khi trang đã mở khóa an toàn — lộ mật khẩu đăng nhập quản trị không đủ (rà soát 10/11)
      ket.kq = DO.gietQuai(h, b.k, { ten: tk.ten, admin: !!tk.admin && BM.daMo(tk, trang), key });
      if (ket.kq.tui) { delete ket.kq.tui; ket.tui = tuiCua(h); } // Boss Sát thủ: Sát Thủ lệnh vào túi
      if (ket.kq.loa) { for (const t of ket.kq.loa) TG.thongBao(t); delete ket.kq.loa; } // Vượt Ải: qua ải báo cả máy chủ
    }
    if (nhat) {
      const { bao, ...n } = DO.nhat(h, key, b.nhat);
      ket.nhat = n;
      for (const it of bao) { TG.thongBao(`${MT.ten(h.name)} nhặt được ${MT.thuong(`${DO.tenMon(it)} ${it.d.length} dòng`)}!`); NK.ghi("hiem", tk.ten, h.name, `Nhặt ${DO.tenMon(it)} ${it.d.length} dòng`, { mon: [NK.mon(it)] }); }
      for (const m of n.nhan) if (m.db && !m.bua) NK.ghi("hiem", tk.ten, h.name, `Nhặt ${m.sl ? `${m.sl} ` : ""}${m.n.trim()}`); // món đặc biệt: Thủy Tinh, mật đồ, đồ chí…
      if (n.nhan.length) ket.tui = tuiCua(h);
    }
    if (!LD.chan(tk.ten, b.s && b.s.zone, o)) for (let i = 0; i < chet; i++) ket.phat = DO.chet(h); // Lôi Đài: bị hạ trong sân không mất gì (soát 16/11: theo nhân vật ô o — ô khác cùng tài khoản vẫn bị phạt)
    ghi = true;
    ket.nv = nvCua(h);
  }
  if (h) {
    // tổ đội: kinh nghiệm đồng đội chia cho (may-chu/do.js chiaDoi — anh 28/10 lần 5 "chia kinh nghiệm theo client") + kinh nghiệm thống soái
    const chia = DO.nhanChia(h, tk.ten, key);
    if (chia) { ket.chia = chia; ket.nv = nvCua(h); ghi = true; }
    // anh 16/11 — Báo Đáp Ân Sư: Nến Bát Trân Phúc Nguyệt đồng đội vừa thắp (bao-dap-an-su.js nenDoi -> hàng chờ, O(1) khi trống): áp trạng thái nen (ket.buff dưới gửi luôn) + tin riêng
    { let nn = null; try { nn = BD.nhanNen(tk.ten, h, key); } catch (e) { console.error("Báo Đáp Ân Sư — Nến:", e.message); } if (nn) { for (const t of nn) TG.thongBaoTk(t, tk.ten); ghi = true; } }
    // nhiệm vụ Võ Lâm Minh Chủ (may-chu/minh-chu.js): con quái nhiệm vụ đồng đội cùng bãi hạ giúp (như client: cả tổ đội đều tính)
    const mcd = MC.nhanDoi(h, tk.ten);
    // quái canh cây (minh-chu.js veTT / danhVe — anh 03/11 lượt 2): sát thương khi kênh tức thời chưa mở + trạng thái
    if (Array.isArray(b.mcv)) for (const r of b.mcv.slice(0, 20)) if (Array.isArray(r)) MC.danhVe(tk.ten, r[0], r[1]);
    ket.mcv = MC.veTT(tk.ten);
    if (mcd) { if (mcd.tin.length) ket.mcTin = mcd.tin; ket.nv = nvCua(h); ghi = true; }
    // boss thế giới (may-chu/boss-tg.js — anh 31/10): sát thương gửi kèm nhịp khi kênh WebSocket chưa mở + thưởng đang chờ (kinh nghiệm, đồ)
    if (Array.isArray(b.bst)) for (const r of b.bst.slice(0, 20)) if (Array.isArray(r)) BTG.danh(tk.ten, r[0], r[1]);
    const bt = BTG.nhanThuong(h, tk.ten);
    if (bt) { ket.btgThuong = bt; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghi = true;
      for (const r of bt) if (!(r.lai && r.day) && !r.chiXem) ghiHd(r.sk ? "Báo Đáp Ân Sư" : "Boss Hoàng Kim", tk.ten, h.name, `${r.sk ? "siêu boss " : ""}${r.ten || "boss"}${r.nua ? " (hết giờ — ½ quà)" : ""}${r.hang ? ` — hạng ${r.hang}` : ""}${r.pct != null ? ` (${r.pct}% sát thương)` : ""}${r.kn ? `, +${r.kn} kinh nghiệm` : ""}${(r.mon || []).length ? `, ${chuMonNk(r.mon)}` : ""}${r.kich && (r.kich.mon || []).length ? `, kết liễu: ${chuMonNk(r.kich.mon)}` : ""}${r.tg ? `, +${r.tg} Bảo rương đồ xanh` : ""}${r.xu ? `, +${r.xu} Xu` : ""}${r.day ? " (túi đầy — chờ nhận)" : ""}`); }
    // Săn Nhím Béo Phì (may-chu/san-nhim.js — anh 03/11): như boss thế giới — sát thương khi kênh chưa mở + thưởng người ra đòn kết liễu
    if (Array.isArray(b.nst)) for (const r of b.nst.slice(0, 20)) if (Array.isArray(r)) SN.danh(tk.ten, r[0], r[1], r[2]);
    const sn = SN.nhanThuong(h);
    if (sn) { ket.snThuong = sn; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghi = true;
      for (const r of sn) if (!(r.lai && r.day)) ghiHd("Săn Nhím", tk.ten, h.name, `${SN_LOAI[r.loai] || "kết liễu"}${r.tenBai ? ` ở ${r.tenBai}` : ""}${r.kn ? ` — +${r.kn} kinh nghiệm` : ""}${(r.mon || []).length ? `, ${chuMonNk(r.mon)}` : ""}${r.xu ? `, +${r.xu} Xu` : ""}${r.day ? " (túi đầy — chờ nhận)" : ""}${r.lai ? " (nhận món chờ)" : ""}`); }
    // Vượt Ải tổ đội (may-chu/vuot-ai.js phòng — anh 31/10): sát thương khi kênh tức thời chưa mở, thưởng đám / đồ rơi của quái chung chết ở máy
    // chủ, lệnh vào ải khi đội trưởng báo danh (túi / tiền đã trừ phí), trạng thái phòng khi kênh chưa mở
    if (b.vad) VAI.danhP(tk.ten, b.vad);
    const va = VAI.nhanPhong(h, tk.ten, key);
    if (va) { ket.vaKq = va; ket.nv = nvCua(h); ghi = true; ghiHd("Vượt Ải", tk.ten, h.name, va.kn > 0 ? `+${va.kn} kinh nghiệm` : "", va.tin, va.tinVa || [], va.nhan.length ? `rơi: ${chuMonNk(va.nhan)}` : ""); }
    // Boss Sát thủ (anh 18/11 — sat-thu.js nhanDoi): đội trưởng vừa nhận nhiệm vụ giùm -> câu báo + nhân vật mới (trình duyệt dựng boss)
    { const sd = SAT.layDoi(tk.ten); if (sd) { for (const t of sd) TG.thongBaoTk(t, tk.ten); ket.nv = nvCua(h); ghiHd("Boss Sát thủ", tk.ten, h.name, sd); } }
    const vaDi = VAI.layDi(tk.ten);
    if (vaDi) { ket.vaDi = vaDi; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghiHd("Vượt Ải", tk.ten, h.name, vaDi.tin || []); }
    const vaP = VAI.phongNhip(tk.ten, h);
    if (vaP !== undefined) ket.vaPhong = vaP;
    // Viêm Đế Bảo Tàng (may-chu/viem-de.js phòng — như Vượt Ải tổ đội): sát thương khi kênh chưa mở, thưởng boss / đợt, kéo cả đội vào, trạng thái phòng khi kênh chưa mở
    if (b.vdd) VDE.danhP(tk.ten, b.vdd);
    const vdKq = VDE.nhanPhong(h, tk.ten, key);
    if (vdKq) { ket.vdKq = vdKq; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghi = true; ghiHd("Viêm Đế", tk.ten, h.name, vdKq.tin, vdKq.nhan.length ? `rơi: ${chuMonNk(vdKq.nhan)}` : ""); }
    const vdDi = VDE.layDi(tk.ten);
    if (vdDi) { ket.vdDi = vdDi; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghiHd("Viêm Đế", tk.ten, h.name, vdDi.tin || []); }
    const vdP = VDE.phongNhip(tk.ten, h);
    if (vdP !== undefined) ket.vdPhong = vdP;
    if (DO.dangNhapDem(h)) ghi = true; // đăng nhập nhận thưởng: sang ngày mới (5 giờ sáng) thì đếm ngày liên tục
    const s = b.s && typeof b.s === "object" ? { zone: b.s.zone | 0, auto: !!b.s.auto && !LD.laSan(b.s.zone | 0) && !DN.laDuong(b.s.zone | 0) } : null; // Lôi Đài / đường đua: Trợ Thủ tắt — không tính ủy thác
    if (s) { DO.baiNay(key, s.zone); DTau.daToi(key, s.zone); } // bãi đang đứng (Kỳ Trân Các chỉ mua ở thành / thôn); tới nơi "Đưa ta đến" đã trừ phù: hết quyền hoàn
    // khu vực bang (bang hội đợt 4 — khu-bang.js nhip, O(1)): đang ở bãi bang mà không còn được ở đó (rời / bị đuổi / bang giải tán / đổi lãnh địa / khu đóng) -> lệnh đi kbDi (≤ 1 lần / dayLai giây)
    if (s) { let kd = null; try { kd = KB.nhip(tk.ten, o, h, s.zone); } catch (e) { console.error("Khu vực bang:", e.message); } if (kd) ket.kbDi = kd; }
    // Lôi Đài (may-chu/loi-dai.js nhip, O(1)): đứng ở vùng lôi đài mà không có vai ở sân đó -> lệnh về ldDi { z, at } (≤ 1 lần / 5 giây)
    if (s) { let ld = null; try { ld = LD.nhip(tk.ten, o, h, s.zone); } catch (e) { console.error("Lôi đài — nhịp:", e.message); } if (ld) ket.ldDi = ld; }
    // tỉ thí (may-chu/ti-thi.js nhip — anh 17/11): chiến thư đang chờ mình trả lời ttMoi (dự phòng kênh tức thời), sân tỉ thí mình chưa vào ttVao
    try { const tt = TT.nhip(tk.ten, o); if (tt) Object.assign(ket, tt); } catch (e) { console.error("Tỉ thí — nhịp:", e.message); }
    // đua ngựa (may-chu/dua-ngua.js nhip, O(1)): đứng ở đường đua 863 mà không còn lượt của mình (đã về đích / đã rời / lượt xong) -> lệnh về Ba Lăng dnDi { z, at } (≤ 1 lần / 5 giây)
    if (s) { let dn = null; try { dn = DN.nhip(tk.ten, o, h, s.zone); } catch (e) { console.error("Đua ngựa — nhịp:", e.message); } if (dn) ket.dnDi = dn; }
    // quái chung ở bãi train (may-chu/quai-chung.js): sát thương khi kênh tức thời chưa mở; thưởng các con đã chết mình có đánh (kèm chỗ rơi)
    if (b.qcd && s) QC.danh(tk.ten, s.zone, b.qcd);
    QC.nvSat(tk.ten, (h.satThu && h.satThu.nv) | 0); // Boss Sát thủ chung (anh 03/11): bản chung có người đang nhận nhiệm vụ boss của bãi -> máy chủ sinh boss
    const qk = QC.nhanThuong(h, tk.ten, key, !!tk.admin);
    if (qk) { if (qk.tui) { delete qk.tui; ket.tui = tuiCua(h); } ket.qcKq = qk; ket.nv = nvCua(h); ghi = true; } // tui: món vào thẳng túi (Boss Sát thủ chung — anh 18/11)
    // món người chơi vứt ra (chung cả bãi — anh 30/10): danh sách của bãi khi đã đổi so với bản trình duyệt đang có
    const dc = s ? DO.datChung(s.zone, b.dv) : null;
    if (dc) ket.dc = dc;
    if (GD.capNhat(tk.ten)) { ket.tui = tuiCua(h); ket.nv = nvCua(h); } // người kia vừa bấm xác nhận giao dịch sau cùng: túi / tiền mình đã đổi
    // chợ trời (may-chu/cho-troi.js): có người mua hàng trên sạp mình -> tiền + sạp mới, câu báo; danh sách sạp của bãi khi đã đổi
    if (CHO.capNhat(tk.ten)) { ket.nv = nvCua(h); ket.sap = CHO.sapGui(h); }
    if (h.choTin && h.choTin.length) { ket.choTin = h.choTin; delete h.choTin; ghi = true; }
    const cho = s ? CHO.nhip(s.zone, b.chv) : null;
    if (cho) ket.cho = cho;
    // Phong Hỏa Liên Thành (may-chu/phong-hoa.js — anh 04/11): sát thương khi kênh tức thời chưa mở; thưởng giết quái (kinh nghiệm) + thắng trận
    if (b.phd && s) PHO.danh(tk.ten, s.zone, b.phd);
    const phk = PHO.nhanThuong(h, tk.ten, key, !!tk.admin);
    if (phk) { ket.phKq = phk; ket.nv = nvCua(h); ghi = true; }
    if (DO.uyThacDo(h, key, s, (ket.kq ? ket.kq.n : 0) + (qk ? qk.n : 0), tk.ten)) ghi = true; // bản quái chung: con mình nhận trọn cũng tính tốc độ giết; tk.ten: tăng ích tổ đội thì không đo
    { const nq = (ket.kq ? ket.kq.nBh | 0 : 0) + (qk ? qk.nBh | 0 : 0) + (ut ? ut.quai | 0 : 0); if (nq > 0) try { BH.quai(tk.ten, o, h.name, nq); } catch (e) { console.error("Bang hội — quái:", e.message); } } // bang hội đợt 2: 500 con = 10 giá trị, trần 80 / ngày chung ủy thác
    // luyện kỹ năng (anh 29/10 — do.js luyenDon / luyenKn): đòn trúng của chiêu luyện (trình duyệt đếm) + chiêu 120 theo kinh nghiệm vừa nhận (giết
    // quái / đội chia) -> ket.luyen = độ luyện + cấp các chiêu luyện, ket.luyenLen = [[mã, cấp cũ, cấp mới]]
    const kqLk = (ket.kq && ket.kq.luyen) || [], chLk = (ket.chia && ket.chia.luyen) || [], vaLk = (ket.vaKq && ket.vaKq.luyen) || [];
    if (ket.kq) delete ket.kq.luyen; if (ket.chia) delete ket.chia.luyen; if (ket.vaKq) delete ket.vaKq.luyen;
    const lenLk = [...DO.luyenDon(h, b.luyen, s ? s.zone : -1), ...kqLk, ...chLk, ...vaLk];
    if (lenLk.length || (Array.isArray(b.luyen) && b.luyen.length) || (ket.kq && ket.kq.kn > 0) || (ket.vaKq && ket.vaKq.kn > 0)) { ket.luyen = DO.luyenCua(h); ghi = true; }
    if (lenLk.length) ket.luyenLen = lenLk;
    if (s && PLD.nhip(h, s.zone)) { ghi = true; ket.nv = nvCua(h); } // rời thuyền / bờ Bắc Phong Lăng Độ bằng đường khác: bỏ trạng thái
    if (s && VAI.nhip(h, s.zone)) { ghi = true; ket.nv = nvCua(h); } // rời ải Vượt Ải bằng đường khác (thoát game…): bỏ ải
    if (s && VDE.nhip(h, s.zone)) { ghi = true; ket.nv = nvCua(h); ket.tui = tuiCua(h); } // rời bảo tàng Viêm Đế bằng đường khác (thoát game…): rời đội, mất Hình nhân
    // Online nhận thưởng (may-chu/online.js): đếm thời gian đang trong game; vừa đủ mốc thì báo (onlBao — trình duyệt hiện ở khung tin)
    if (s) { const on = ONL.dem(h, key, ghi); if (on.ghi) ghi = true; if (on.bao.length) ket.onlBao = on.bao; }
    // tăng tốc trình duyệt (may-chu/chong-hack.js): b.tc = đồng hồ trang; nghi thì ghi nhật ký + cờ tài khoản cho bảng quản trị
    if (s && CH.nhip(tk, h, key, b.tc, b.nd)) ghi = true;
    // dò công cụ ở trình duyệt (src/game/do-cong-cu.js — anh 13/11): b.dct = { ma: [mã], bc: bằng chứng } -> lọc (≤ 8 mã a–z, ≤ 80 ký tự) + cờ "dct:<mã>" (may-chu/nghi-tool.js)
    if (NT.nhip(tk, h, b)) ghi = true;
    // Tống Kim (may-chu/tong-kim.js — anh 06/11): trạng thái chiến trường (hoàn Tống Kim — h.buff tk…) chỉ còn khi đang trong trận; ra khỏi trận thì bỏ
    if (TKM.boBuffTk(h, key)) ghi = true;
    // hoàn trong trận (anh 17/11): tối đa 3 phút, trọng thương thì mất hết (tong-kim.js hoanTran)
    if (TKM.hoanTran(h, key)) ghi = true;
    // thuốc Tống Kim (anh 12/11 — do.js CAU_TK): rời trận / sang bãi khác / hết trận thì mất (chỉ nhịp có trạng thái bãi — BAI_NAY vừa cập nhật ở trên)
    if (s) { const bo = TKM.boThuocTk(h, key); if (bo) { ghi = true; ket.tui = tuiCua(h); ket.tkMat = [`Rời chiến trường Tống Kim: ${bo} bình thuốc Tống Kim đã mất (chỉ dùng trong trận)`]; } }
    if (DO.buffDem(h, key, ghi)) ghi = true; // trạng thái Tiên Thảo Lộ / may mắn: giờ trôi lúc đang chơi
    ket.buff = DO.buffCon(h, key);
    // Phân Thân (may-chu/phan-than.js — anh 05/11): giờ dùng trong ngày (chỉ lúc có phân thân theo ở bãi train), hết giờ thì cất hết, tiền công
    // khi người khác thuê phân thân của mình
    const ptn = PTH.nhip(h, key, s, ghi);
    if (ptn) { if (ptn.pt) ket.pt = ptn.pt; if (ptn.tin.length) ket.ptTin = ptn.tin; if (ptn.tui) { ket.tui = tuiCua(h); ket.nv = nvCua(h); } if (ptn.ghi) ghi = true; }
    // bang hội đợt 2 (may-chu/bang-hoi.js nhanCho — HĐ 8.3): phiếu của ô này (không có -> null ngay, O(1)): "ra" chưa có dấu -> giao lại vào h.quaCho / kinh nghiệm (khung
    // báo quà ngay dưới), "vao" chưa có dấu -> hoàn phía bang; dấu h.bhMa ghi cùng lần ghi tài khoản này
    { let r = null; try { r = BH.nhanCho(tk.ten, o, h); } catch (e) { console.error("Bang hội — phiếu:", e.message); } if (r) { ghi = true; ket.nv = nvCua(h); if (r.tui) ket.tui = tuiCua(h); } }
    // quà quản trị gửi (may-chu/quan-tri.js qua): túi / tiền mới + câu báo (khung báo quà ở trình duyệt)
    // quà toàn máy chủ chưa vừa túi (quan-tri.js quaTat — anh 04/11): mỗi nhịp thử lại, vừa thì nhận như quà quản trị (khung báo quà)
    // thưởng cuối trận Tống Kim chưa vừa túi (q.tk — may-chu/tong-kim.js traoThuong): vừa thì câu báo vào tkTin (không phải khung quà quản trị)
    // anh 18/11 — Báo Đáp Ân Sư: món mở từ hương bao khóa vĩnh viễn trước bản khóa 72 giờ -> đổi sang khóa có hạn (1 lần mỗi nhân vật — bao-dap-an-su.js khoa72)
    { let k7 = null; try { k7 = BD.khoa72(h); } catch (e) { console.error("Báo Đáp Ân Sư — khóa có hạn:", e && e.message); } if (k7) { ghi = true; if (k7.tin.length) { ket.tui = tuiCua(h); NK.hd("nhan", k7.tin[0]); } }
      // câu báo: nhịp sau ≥ 6 giây đang ở trong bản đồ (b.s) — kbhMo: trình duyệt hiện ở ô tin (như hết giờ khóa)
      let kb7 = null; try { kb7 = b.s ? BD.k72Bao(h) : null; } catch {} if (kb7) { ghi = true; ket.kbhMo = [...(ket.kbhMo || []), ...kb7]; } }
    if (h.quaCho && h.quaCho.length) {
      const con = [];
      for (const q of h.quaCho) {
        try {
          const ds = DO.taoQua(h, q);
          if (q.tk) h.tkTin = [...(Array.isArray(h.tkTin) ? h.tkTin : []), `Tống Kim: đã nhận phần thưởng còn chờ — ${ds.join(", ")}`].slice(-20);
          else h.quaTin = [...(h.quaTin || []), { luc: q.luc || Date.now(), ds, ...(q.loi ? { loi: q.loi } : {}), ...(q.he ? { he: 1 } : {}) }].slice(-20); // he: quà hệ thống còn chờ (boss vắng mặt, vượt ải, sự kiện — anh 16/11)
        } catch { con.push(q); }
      }
      if (con.length !== h.quaCho.length) ghi = true;
      if (con.length) h.quaCho = con; else delete h.quaCho;
    }
    // Tống Kim (may-chu/tong-kim.js ketThuc — anh 06/11): câu báo thưởng cuối trận (điểm Tống Kim, Hồn Thạch, kinh nghiệm, Huân công bài) — kèm túi / nhân vật mới
    if (Array.isArray(h.tkTin) && h.tkTin.length) { ket.tkTin = h.tkTin; delete h.tkTin; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghi = true; }
    else if (h.tkTin) { delete h.tkTin; ghi = true; }
    // quản trị vừa đổi nhân vật (anh 04/11 — quan-tri.js xu-ly): câu báo (tăng cấp, quà chờ) + cấp mới; giải kẹt: lệnh về Ba Lăng
    if (h.qtTin && h.qtTin.length) { ket.qtTin = h.qtTin; delete h.qtTin; ket.nv = nvCua(h); ket.tui = tuiCua(h); ghi = true; }
    if (h.qtDi) { ket.qtDi = h.qtDi; delete h.qtDi; ghi = true; }
    if (h.quaTin && h.quaTin.length) { ket.qua = h.quaTin; delete h.quaTin; ket.tui = tuiCua(h); ket.nv = nvCua(h); ghi = true; }
    // Bảo rương đồ xanh chờ nhận (anh 04/11 — Vượt Ải xong trọn ải / Phong Hỏa thắng) + món mở rương chưa vừa túi (h.rxMon): vào túi khi có chỗ (do.js nhanRuongCho)
    const rxb = DO.nhanRuongCho(h);
    if (rxb) { ket.rxBao = rxb; DO.chuan(h); ket.tui = tuiCua(h); ghi = true; }
    // khóa bảo hiểm có hạn vừa hết giờ (anh 11/11 — trang bị mở từ Bảo rương đồ xanh khóa; do.js chuan ghi h.kbhMoTin): câu báo + túi mới (bỏ dòng khóa)
    if (Array.isArray(h.kbhMoTin) && h.kbhMoTin.length) {
      ket.kbhMo = [...(ket.kbhMo || []), ...h.kbhMoTin.map((n) => `${n}: hết thời gian chờ mở khóa — đã mở khóa bảo hiểm, giao dịch / bày bán được`)];
      delete h.kbhMoTin; ket.tui = tuiCua(h); ghi = true;
    } else if (h.kbhMoTin) { delete h.kbhMoTin; ghi = true; }
    // phần thưởng đang chờ nhận (anh 03/11 — "nhân vật đủ điều kiện nhận thưởng nhưng họ quên thì làm sao nhắc", chọn kiểu chấm đỏ có số): loại thưởng
    // của nút Nhận thưởng còn nhận được — trình duyệt hiện số đỏ trên nút, "(có thể nhận)" trong khung chọn, dòng tin lúc vào game / có loại mới
    ket.ntc = [DO.dnCho(tk) && "dn", TCAP.coNhan(h) && "cap", ONL.coNhan(h, key) && "onl", PD.coNhan(h, key) && "pd"].filter(Boolean);
    // Phú Quý Cẩm Hạp (may-chu/phu-quy.js — anh 03/11): đợt vừa quay mà có số trúng chưa nhận -> 1 câu nhắc mỗi đợt
    const pqb = PQ.bao(h);
    if (pqb) { ket.pqBao = pqb; ghi = true; }
    // Bầu Cua (may-chu/bau-cua.js — anh 10/11): vừa được trả tiền thắng -> tiền mới + câu báo (đã thoát game thì lần vào sau)
    if (BC.capNhat(tk.ten)) ket.nv = nvCua(h);
    if (Array.isArray(h.bcTin) && h.bcTin.length) { ket.bcTin = h.bcTin; delete h.bcTin; ket.nv = nvCua(h); ghi = true; }
    // Lôi Đài (may-chu/loi-dai.js hoan — vòng lặp / quản trị ghi thẳng tệp): câu báo hoàn phí + tiền mới + túi (soát 16/11: hoàn vượt TIEN_MAX vào rương — tienRuong)
    if (Array.isArray(h.ldTin) && h.ldTin.length) { ket.ldTin = h.ldTin; delete h.ldTin; ket.nv = nvCua(h); ket.tui = tuiCua(h); ghi = true; }
    else if (h.ldTin) { delete h.ldTin; ghi = true; }
    const bcua = BC.nhipCon(); if (bcua) ket.bcua = bcua; // biểu tượng Bầu Cua: từ 5 phút trước giờ mở tới hết giờ (anh 10/11 lần 3 "icon đặt mọi nơi")
    if (Array.isArray(tk.gmTin) && tk.gmTin.length) { ket.gmTin = tk.gmTin; delete tk.gmTin; ghi = true; } // tin riêng của GM (quan-tri.js xu-ly nhan — anh 10/11)
    { const mk0 = tk.mk2Bao, mkb = BM.baoSai(tk, trang); if (mkb) ket.mk2Bao = mkb; if (mkb || tk.mk2Bao !== mk0) ghi = true; } // có người nhập sai mật khẩu ở phiên khác (may-chu/bao-mat.js — anh 10/11)
    if ((h.lvl || 1) > lv0) NK.ghi("cap", tk.ten, h.name, `Lên cấp ${h.lvl}`);
  }
  if (ghi) D.ghiTk(tk);
  // ghim của quản trị ở khung chat (may-chu/quan-tri.js ghim — anh 03/11): b.gh = mã ghim trình duyệt đang có; khác mã hiện tại thì gửi { id, t? }
  const G = QT.ghimNay(), gh = b.gh != null && +b.gh !== G.id ? { gh: G } : {};
  // bang hội (anh 14/11 — may-chu/bang-hoi.js nhip, tra O(1)): bhMinh (bang của nhân vật này) | null, bhMoi (lời mời vào bang đang chờ) | null, bhCc (công cáo ghim — chỉ khi
  // b.bhcc khác mã hiện tại); lỗi bang không làm hỏng nhịp. tk: đợt 2 — khóa người (chủ / IP) cập nhật cùng lúc "lần cuối online"
  let bh = {}; try { bh = BH.nhip(tk.ten, o, h, b, tk); } catch (e) { console.error("Nhịp bang hội:", e.message); }
  // km: ổ khóa an toàn { co: đã có mật khẩu cấp 2, mo: đang mở cho trang này } (may-chu/bao-mat.js — trình duyệt vẽ ổ khóa đóng / mở)
  guiJson(res, 200, { ...TG.nhip(tk, b), tl: CHQ.tlNay(), doi: TD.cua(tk.ten), gd: GD.cua(tk.ten), online: soOnline(), hang: h ? XH.hang(tk, o) : null, btg: BTG.trangThai(tk.ten), btgDs: BTG.dsTT(tk.ten), snh: SN.trangThai(tk.ten), rtb: RTB.dong(), km: BM.trangThai(tk, trang), ...gh, ...bh, ...ket });
}

// xem trang bị người chơi ở gần (anh 03/11 "thêm tính năng xem trang bị người ở gần" — src/game/main.js menuNguoi -> windows.js soiDo): người
// đó đang chơi, cùng bãi + cùng bản (quái chung / riêng) với mình -> đồ ĐANG MẶC (nguyên như lưu: dòng xanh, ngũ hành, độ bền…) + cấp / giới tính /
// hệ / phái / điểm gốc + điểm cộng (trình duyệt tính yêu cầu đủ / thiếu, dòng ẩn — như Soi đồ của quản trị, quan-tri.js soi); không túi / rương
function xemDo(tk, b) {
  const bao = (t) => { throw Object.assign(new Error(t), { code: 400 }); };
  const toi = TG.dangChoi(tk.ten); if (!toi) bao("Chưa vào game");
  const ten = String(b.ten || "").trim().slice(0, 40), ai = ten ? TG.timTen(ten) : null, o = ai && TG.dangChoi(ai);
  if (!o || ai === tk.ten || o.zone !== toi.zone || !o.chung !== !toi.chung || !KB.cungBan(ai, tk.ten, toi.zone)) bao(`Không thấy ${ten || "người chơi này"} ở gần`); // khu vực bang: chỉ cùng bản (đợt 4)
  const tk2 = D.docTk(ai), h = tk2 && tk2.nv.find((x) => x && x.name === ten); if (!h) bao(`Không thấy ${ten} ở gần`);
  // anh 17/11 (khung xem người khác mẫu B — thẻ Thuộc tính): chân dung, hạng cấp cả máy chủ (xep-hang.js), bang + chức như nhãn trên đầu (bang-hoi.js nhanCua — danh hiệu
  // riêng / chung thay chữ chức, ẩn sỹ); lỗi tra bang không làm hỏng việc xem
  const o2 = tk2.nv.indexOf(h); let bang = null;
  try { const c = BH.cuaNv(tk2.ten, o2, h.name); if (c) { const { B, m } = c, dc = B.dhChung || {}; bang = { ten: B.ten, cv: m.cv === "an" ? "ẩn sỹ" : m.cv === "chu" ? "Bang chủ" : m.cv === "lao" || m.cv === "doi" ? m.dh || BH.TEN_CV[m.cv] : (h.sex === "f" ? dc.nu : dc.nam) || "Đệ tử" }; } } catch (e) { bang = null; }
  return { nv: { name: h.name, lvl: h.lvl || 1, sex: h.sex === "f" ? "f" : "m", series: h.series | 0, fac: h.fac ?? null, start: h.start || {}, attr: h.attr || {},
    equip: Object.fromEntries(Object.entries(h.equip || {}).filter(([, it]) => it && it.k).map(([s, it]) => [s, { ...it }])),
    portrait: h.portrait | 0 || undefined, hang: XH.hang(tk2, o2), bang } };
}

function xoaNv(res, tk, o) {
  if (!tk.nv[o]) return loi(res, 404, "Ô này không có nhân vật");
  // bang hội (anh 14/11 — THIET-KE-BANG-HOI.md 1.5): bang chủ phải chuyển vị trước (chặn xóa); thành viên khác rời bang, bỏ đơn / lời mời / thời gian chờ của ô này
  const bhLoi = BH.xoaNv(tk.ten, o, tk.nv[o].name); if (bhLoi) return loi(res, 409, bhLoi);
  NK.ghi("nv", tk.ten, tk.nv[o].name, `Xóa nhân vật cấp ${tk.nv[o].lvl || 1}`);
  D.catXoa(tk, o); tk.nv[o] = null; D.ghiTk(tk); CHO.xoa(tk.ten, o); // sạp chợ trời của nhân vật: bỏ (món nằm trong bản đã xóa — da-xoa/)
  guiJson(res, 200, { ok: 1 });
}

// p = đường dẫn đã giải mã (/api/…). Đọc hết dữ liệu gửi lên TRƯỚC khi đọc tài khoản: từ lúc đọc tới lúc ghi file tài khoản không
// có await nào, nên 2 yêu cầu cùng tài khoản không ghi đè lên nhau.
async function xuLyApi(req, res, p) {
  try {
    const m = req.method, body = m === "POST" || m === "PUT" ? await docBody(req) : {};
    if (p === "/api/dang-nhap" && m === "POST") return dangNhap(req, res, body);
    if (p === "/api/dang-ky" && m === "POST") {
      if (process.env.VL_DANG_KY === "0") return loi(res, 403, "Máy chủ hiện không mở đăng ký");
      const ten = D.tenTk(body.ten), mk = String(body.mk || "");
      if (!/^[a-z0-9_]{3,20}$/.test(ten)) return loi(res, 400, "Tên tài khoản 3–20 ký tự: chữ thường không dấu, số, dấu _");
      if (mk.length < 6 || mk.length > 64) return loi(res, 400, "Mật khẩu cần từ 6 đến 64 ký tự");
      try {
        const tkMoi = D.taoTk(ten, mk, false);
        return guiJson(res, 201, { ok: 1, ten: tkMoi.ten });
      } catch (e) { return loi(res, 409, e.message); }
    }
    const tk = tkPhien(req);
    if (p === "/api/anh-cho" && m === "GET") return guiJson(res, 200, { anh: anhCho() });
    // công khai (màn đăng nhập): KHÔNG kèm bảng luật (lượt 61 — bản sao đọc số cân bằng qua đây); luật gửi lúc đăng nhập / /api/toi (thongTin sv)
    if (p === "/api/trang-thai" && m === "GET") { if (tk) online.set(tk.ten, Date.now()); return guiJson(res, 200, { online: soOnline(), sv: { server: SV.server, name: SV.name }, baoTri: BT.tomTat(), ...(DY.bat() ? { duyet: 1 } : {}) }); } // duyet: màn đăng nhập báo máy chủ chỉ cho người được duyệt
    // lịch hoạt động công khai (không có gì của người chơi): khung Hướng dẫn hoạt động lúc chưa vào game, lệnh khởi động lại máy chủ kiểm tra
    if (p === "/api/lich-hd" && m === "GET") return guiJson(res, 200, LHD.chung());
    // ủng hộ duy trì máy chủ (anh 13/11 — khung 4 bước ở trang chủ / Esc → Ủng hộ tác giả): "Đã ủng hộ" -> danh sách chờ quản trị duyệt (may-chu/ung-ho.js dangKy);
    // công khai — chưa đăng nhập (trang chủ) cũng gửi được
    if (p === "/api/ung-ho-dk" && m === "POST") return guiJson(res, 200, require("./ung-ho").dangKy(body, tk && tk.ten, diaChi(req)));
    if (!tk) { const mat = matPhien(req); return mat ? loi(res, 401, mat.msg, mat.ma) : loi(res, 401, "Chưa đăng nhập, hoặc tài khoản vừa đăng nhập ở nơi khác", "het-phien"); }
    // bảo trì (may-chu/bao-tri.js — anh 31/10 khuya): tài khoản thường đang mở game -> rời game, trình duyệt về màn đăng nhập kèm câu báo
    if (!tk.admin && BT.con()) {
      if (trongGame.delete(tk.ten)) { TG.roi(tk.ten); NK.ghi("roi", tk.ten, null, "Rời game — máy chủ bảo trì"); }
      return loi(res, 503, BT.cau(), "bao-tri");
    }
    // chế độ duyệt (may-chu/duyet.js — anh 11/11 khuya): tài khoản chưa duyệt / vừa bị bỏ duyệt đang mở game -> rời game, về màn đăng nhập kèm câu báo
    if (!tk.admin && !DY.duoc(tk.ten)) {
      if (trongGame.delete(tk.ten)) { TG.roi(tk.ten); NK.ghi("roi", tk.ten, null, "Rời game — chưa được duyệt vào máy chủ"); }
      return loi(res, 403, DY.cau(), "chua-duyet");
    }
    online.set(tk.ten, Date.now());
    { const o = body && body.o != null ? body.o | 0 : -1, h = o >= 0 && o < D.SLOT_N && tk.nv ? tk.nv[o] : null; NK.ctx(tk.ten, h && h.name); }
    NGM.ctx(`${m} ${p}${body && typeof body.act === "string" ? " " + body.act : body && typeof body.viec === "string" ? " " + body.viec : ""}`); // nguồn gốc món: việc đang làm (nguon-mon.js) // sổ hoạt động từng tài khoản (nhat-ky.js — anh 11/11)
    // phiếu tài nguyên (lượt 61 — may-chu/khoa-tai-nguyen.js): thiếu / sắp hết hạn -> cấp lại kèm câu trả lời này (mở trang, nhịp… — treo máy cả tuần vẫn
    // tải được bản đồ mới). Câu trả lời tự đặt Set-Cookie (đăng xuất, đổi mật khẩu) thì của nó được ưu tiên
    if (KTN.canLamMoi(req, tk.ten)) res.setHeader("Set-Cookie", KTN.cap(req, tk.ten));
    // Khóa an toàn (may-chu/bao-mat.js — anh 10/11): mật khẩu cấp 2 / đổi mật khẩu đăng nhập; rồi chặn: đang bị bắt đổi mật khẩu -> chỉ cho xem thông tin,
    // đăng xuất; việc đồ / tiền rời tài khoản + API quản trị -> phải mở khóa (403 kèm mã can-mk2 / can-dat-mk2: trình duyệt hỏi rồi gửi lại đúng yêu cầu)
    const trang = BM.trangCua(req);
    // nghi dùng công cụ (may-chu/nghi-tool.js — anh 13/11, chỉ ghi): POST có Sec-Fetch-Site khác same-origin; API NPC thiếu / lạ mã trang x-trang; nhịp: nhớ mã trang
    NT.yeuCau(tk, req, p, m, body, trang);
    // đổi mật khẩu đăng nhập cấp phiên mới (bao-mat.js doiMk1): gửi cookie mới cho trang đang dùng — nơi khác giữ phiên cũ bị đăng xuất
    if (p === "/api/bao-mat" && m === "POST") {
      const ph0 = tk.phien, r = BM.lam(tk, body, { trang, ip: diaChi(req) }); D.ghiTk(tk);
      return guiJson(res, 200, r, tk.phien && tk.phien !== ph0 ? { "Set-Cookie": datCookie(req, tk.ten + "." + tk.phien, COOKIE_AGE) } : {});
    }
    const chBM = BM.chan(tk, trang, p, m, body);
    if (chBM) return loi(res, 403, chBM.msg, chBM.ma);
    // đứng gần NPC (may-chu/npc-gan.js — anh 13/11 công cụ gọi Dã Tẩu / Nhiếp Thí Trần / Hắc Bạch Sứ Giả từ bãi train): sai bản đồ / xa -> ném 400 ma "xa-npc"
    // (đã ghi cờ); cửa hàng, rương chứa đồ, Trợ Thủ ở thành, Tự làm kẹt: chỉ ghi
    NG.chan(tk, p, m, body);
    if (p === "/api/toi" && m === "GET") return guiJson(res, 200, thongTin(tk));
    if (p === "/api/nhip" && m === "POST") return nhip(res, tk, body, trang);
    if (p === "/api/chat" && m === "POST") return guiJson(res, 200, TG.chat(tk, body));
    // tổ đội (may-chu/to-doi.js): { o, viec, ten?, id? } -> { doi, msg }
    if (p === "/api/doi" && m === "POST") return guiJson(res, 200, TD.lam(tk.ten, body));
    // bang hội (may-chu/bang-hoi.js — anh 14/11, hợp đồng THIET-KE-BANG-HOI.md 1.8): { o, viec, … } -> { bh?, ds?, msg?, tin?, cho? }; r.doi = tiền / túi / quà chờ của tài
    // khoản này vừa đổi (lập bang nộp kiếm + tiền, rời bang nộp phí, người lập tự giải tán nhận lại kiếm) -> ghi tài khoản + gửi nv / tui. Không await giữa đọc và ghi
    if (p === "/api/bang-hoi" && m === "POST") {
      // qt (anh 14/11): quản trị đã mở khóa an toàn ở trang này — lap { qt: 1 } được bỏ qua điều kiện lập bang (bang-hoi.js lap)
      const h = oCua(tk, body), { doi, ...r } = BH.lam(tk, h, body.o | 0, body, !!tk.admin && BM.daMo(tk, trang));
      if (doi) { DO.chuan(h); D.ghiTk(tk); }
      return guiJson(res, 200, { ...r, ...(doi ? { nv: nvCua(h), tui: tuiCua(h) } : {}) });
    }
    // khu vực bang (bang hội đợt 4 — may-chu/khu-bang.js): { o, viec: "xem" | "vao" | "dangNhap" (z) | "xaPhu" (den) | "chonMau" (mau) } -> { khu?, di?, vao?, msg?, tin? } (+ nv, tui khi trả lộ phí Xa phu)
    if (p === "/api/khu-bang" && m === "POST") {
      const h = oCua(tk, body), { doi, ...r } = KB.lam(tk, h, body.o | 0, body);
      if (doi) { DO.chuan(h); D.ghiTk(tk); }
      return guiJson(res, 200, { ...r, ...(doi ? { nv: nvCua(h), tui: tuiCua(h) } : {}) });
    }
    // xem trang bị người chơi ở gần (anh 03/11 — menu người chơi): { o, ten } -> { nv } (xemDo)
    if (p === "/api/xem-do" && m === "POST") return guiJson(res, 200, xemDo(tk, body));
    // giao dịch (may-chu/giao-dich.js — anh 30/10): vừa giao xong thì kèm túi + tiền mới của mình (bên kia nhận ở nhịp kế tiếp)
    if (p === "/api/giao-dich" && m === "POST") {
      const h = oCua(tk, body), r = GD.lam(tk, h, body);
      return guiJson(res, 200, { gd: r.gd, ...(r.msg ? { msg: r.msg } : {}), ...(r.doi ? { nv: nvCua(h), tui: tuiCua(h) } : {}) });
    }
    // chợ trời (may-chu/cho-troi.js — anh 02/11): mua / định giá / thu hồi thì kèm túi + tiền mới của mình (người bán nhận ở nhịp kế tiếp)
    if (p === "/api/cho" && m === "POST") {
      const h = oCua(tk, body), r = CHO.lam(tk, h, body.o | 0, body);
      const { doi, ...ra } = r;
      return guiJson(res, 200, { ...ra, ...(doi ? { nv: nvCua(h), tui: tuiCua(h) } : {}) });
    }
    if (p === "/api/xep-hang" && m === "GET") return guiJson(res, 200, { ds: XH.ds(), bang: XH.bangDs() }); // bang: xếp hạng bang hội (anh 14/11 — cùng vòng quét 5 phút)
    if (p === "/api/ung-ho" && m === "GET") return guiJson(res, 200, require("./ung-ho").xem()); // danh sách ủng hộ tác giả (anh 12/11 — Esc → Ủng hộ tác giả)
    // Phân Thân (may-chu/phan-than.js — anh 05/11): { o, viec: "mo" | "thue" | "goi" | "cat", id? } -> { pt, ds?, msg? } (+ túi khi vừa trả phí)
    if (p === "/api/phan-than" && m === "POST") {
      const h = oCua(tk, body), r = PTH.lam(tk, h, body); D.ghiTk(tk);
      const { tui, ...ra } = r;
      return guiJson(res, 200, { ...ra, ...(tui ? { tui: tuiCua(h), nv: nvCua(h) } : {}) });
    }
    // Hướng dẫn hoạt động (anh 05/11): lịch + trạng thái + số lần đã làm hôm nay của nhân vật ô o
    if (p === "/api/lich-hd" && m === "POST") { const h = oCua(tk, body); return guiJson(res, 200, { ...LHD.chung(), toi: LHD.cuaToi(h, tk) }); }
    // Tra cứu (rương mở ra gì, rơi đồ, thưởng hoạt động, vật phẩm có từ đâu): JSON dựng sẵn, trình duyệt giữ theo ETag
    if (p === "/api/tra-cuu" && m === "GET") {
      const r = TCU().lay();
      if (req.headers["if-none-match"] === r.v) { res.writeHead(304, { ETag: r.v, "Cache-Control": "no-cache" }); return res.end(); }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache", ETag: r.v }); return res.end(r.json);
    }
    if (p === "/api/do" && m === "POST") {
      if (body.act === "xep" && GD.co(tk.ten) === 2) return loi(res, 400, "Đang giao dịch, không thể sắp xếp"); // Sắp xếp (anh 06/11): món đang đặt ở khung giao dịch giữ theo mã + ô
      const h = oCua(tk, body), r = DO.lam(h, body, tk.ten + "|" + (body.o | 0), tk);
      DO.chuan(h); D.ghiTk(tk);
      if (r && r.msg && HD_DO[body.act]) NK.hd(HD_DO[body.act], r.msg); // sổ hoạt động từng tài khoản (anh 11/11 "mua gì, nhặt gì, lấy gì") // tính lại kiểu dáng theo đồ mặc
      // Bảo rương đồ xanh (anh 04/11): mở ra món từ thongBaoTuDong dòng thì báo cả máy chủ + nhật ký quản trị (như nhặt được)
      for (const it of r.bao || []) { TG.thongBao(`${MT.ten(h.name)} mở ${DO.tenMon({ k: DO.RXC.k }).trim()} được ${MT.thuong(`${DO.tenMon(it)} ${it.d.length} dòng`)}!`); NK.ghi("hiem", tk.ten, h.name, `Mở ${DO.tenMon({ k: DO.RXC.k }).trim()}: ${DO.tenMon(it)} ${it.d.length} dòng`, { mon: [NK.mon(it)] }); }
      if (body.act === "muaKtc" || body.act === "doiXu" || body.act === "muaPd" || body.act === "muaTk" || (body.act === "banXu" && r.msg)) NK.ghi(body.act === "doiXu" || body.act === "banXu" ? "xu" : "ktc", tk.ten, h.name, r.msg); // muaPd: cửa hàng phúc duyên; muaTk: Quân Nhu quan Tống Kim
      // Lễ quan → Hủy vật phẩm (anh 05/11): 1 dòng nhật ký kèm các món đã hủy (quản trị tra lại được khi người chơi hỏi)
      if (r.gioi) NK.ghi("nv", tk.ten, h.name, r.gioi); // Dị Dung Bí Thuật — đổi giới tính (anh 16/11 — do.js dungVat doiGioi)
      // anh 16/11 — Báo Đáp Ân Sư: mở hương bao ra món hiếm / kinh nghiệm lớn -> tin hệ thống màu cả máy chủ + nhật ký quản trị
      if (r.loa) { for (const t of r.loa) TG.thongBao(t); if (r.hiem) NK.ghi("hiem", tk.ten, h.name, r.hiem); }
      if (r.huy) NK.ghi("huy", tk.ten, h.name,`Hủy ${r.huy.map((it) => `${it.n > 1 ? it.n + " " : ""}${DO.tenMon(it).trim()}${(it.d || []).length ? ` (${it.d.length} dòng)` : ""}${it.kbh ? " (khóa)" : ""}`).join(", ")}`, { mon: r.huy.map(NK.mon) });
      return guiJson(res, 200, { msg: r.msg, nv: nvCua(h), tui: tuiCua(h), ...(r.vut ? { vut: r.vut } : {}), ...(r.chon ? { chon: r.chon } : {}),
        ...(r.hoiSo ? { hoiSo: r.hoiSo, con: r.con } : {}), ...(r.hoiPq ? { hoiPq: r.hoiPq } : {}), ...(r.hieuUng ? { hieuUng: r.hieuUng } : {}), ...(r.moRuong ? { moRuong: r.moRuong } : {}), ...(r.tuMau !== undefined ? { tuMau: r.tuMau } : {}), ...(r.vdBao ? { vdBao: r.vdBao } : {}), ...(r.doiGioi ? { doiGioi: r.doiGioi } : {}), ...(r.gioiXong ? { gioiXong: 1, gioiMoi: r.gioiMoi } : {}), ...(r.kn ? { kn: knCua(h) } : {}), ...(r.xoaMk ? { xoaMk: r.xoaMk } : {}),
        ...(r.tkDoi ? { tkDoi: r.tkDoi } : {}), ...(r.tkHoi ? { tkHoi: r.tkHoi } : {}), ...(r.banXu ? { banXu: r.banXu } : {}), ...(r.di ? { di: r.di } : {}), buff: DO.buffCon(h, tk.ten + "|" + (body.o | 0)) }); // tkDoi / tkHoi: món Tống Kim (Chiến cổ / Lệnh Bài, Càn Khôn — trình duyệt áp); di: Phong Lăng Truyền Tống Lệnh -> bờ Bắc (anh 16/11 — Báo Đáp Ân Sư, trình duyệt diPld)
    }
    // Dã Tẩu (may-chu/da-tau.js): { o, viec, … } -> { say: { text, opts } | talk: [câu] | giao: { tieuDe, loi } | thuong: { text, ds }, tin: [câu] }; viec "den"
    // (Đưa ta đến nơi làm nhiệm vụ — anh 11/11) -> { di | hoiPhu | canh | tin }: khóa "tài khoản|ô" để đọc bãi đang đứng (do.js BAI_NAY, nhịp ghi)
    if (p === "/api/da-tau" && m === "POST") {
      const h = oCua(tk, body), r = DTau.lam(h, body, tk.ten + "|" + (body.o | 0)); DO.chuan(h); D.ghiTk(tk);
      if (!HD_XEM.has(body.viec)) ghiHd("Dã Tẩu", tk.ten, h.name, r.tin || []);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Online nhận thưởng (may-chu/online.js — anh 31/10 khuya): { o, viec: "mo" | "xem" | "nhan" } -> { say | talk, tin }
    if (p === "/api/thuong-online" && m === "POST") {
      const h = oCua(tk, body), r = ONL.lam(h, tk.ten + "|" + (body.o | 0), body); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // thưởng thăng cấp (may-chu/thuong-cap.js — anh 02/11): { o, viec: "mo" | "xem" | "nhan" } -> { say | talk, tin }
    if (p === "/api/thuong-cap" && m === "POST") {
      const h = oCua(tk, body), r = TCAP.lam(h, body); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Trợ Thủ tự làm nhiệm vụ ngày (may-chu/tu-lam.js — anh 03/11): { o, viec: "mo" (+ loai "dt" | "st") | "dt" (+ thuong, giuHuy, gian, huy) | "st" }
    // -> { msg | tiep, tin, ly, giay, bai, boss, tl } + nhân vật / túi
    if (p === "/api/tu-lam" && m === "POST") {
      const h = oCua(tk, body), r = TLAM.lam(h, body, tk.ten); DO.chuan(h); D.ghiTk(tk);
      if ((body.viec === "dt" || body.viec === "st") && (r.tin || []).length) ghiHd(body.viec === "dt" ? "Dã Tẩu" : "Boss Sát thủ", tk.ten, h.name, `Trợ Thủ tự làm — ${r.tin.map(boThe).join(" · ")}`);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // phúc duyên (may-chu/phuc-duyen.js — anh 31/10 khuya lần 2): { o, viec: "mo" | "nhan" | "xem" | "about" | "shop" } -> { say | talk | shop: 93, tin }
    // nhiệm vụ Võ Lâm Minh Chủ (may-chu/minh-chu.js — anh 03/11): { o, viec, ai?, cay? } -> { say | talk | tin | msg | haiGiay | cd } + nhân vật / túi
    if (p === "/api/minh-chu" && m === "POST") {
      const h = oCua(tk, body), r = MC.lam(h, body, tk.ten); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // nhiệm vụ Võ Lâm Minh Chủ (chỉ tài khoản quản trị — thử): { o, viec: "xem" | "dat" (giet?: số con, xong?: bỏ dấu đã xong hôm nay) }
    if (p === "/api/minh-chu-qt" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      const h = oCua(tk, body), r = MC.quanTri(h, body); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h) });
    }
    // Rương Thần Bí (may-chu/ruong-tb.js — anh 03/11): { o, id } -> { msg, len } + nhân vật / túi (lỗi: rương mất / đứng xa / chưa đủ cấp / túi đầy)
    if (p === "/api/ruong-tb" && m === "POST") {
      const h = oCua(tk, body), r = RTB.mo(tk.ten, h, body.id); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Rương Thần Bí (chỉ tài khoản quản trị — thử): { viec: "ra" (so?, tai?: [[bãi, x, y]]) | "huy" | "xem" }
    if (p === "/api/ruong-tb-qt" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      return guiJson(res, 200, RTB.quanTri(body));
    }
    // Phú Quý Cẩm Hạp — Thần Tài (may-chu/phu-quy.js — anh 03/11): { o, viec, n? } -> { say | talk | tin } + nhân vật / túi
    if (p === "/api/phu-quy" && m === "POST") {
      const h = oCua(tk, body), r = PQ.lam(h, body, tk.ten); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Phú Quý Cẩm Hạp (chỉ tài khoản quản trị — thử): { viec: "xem" | "quay" (so?, dot?) | "lech" (phut — máy thử) }
    if (p === "/api/phu-quy-qt" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      return guiJson(res, 200, PQ.quanTri(body));
    }
    // Bầu Cua — Chủ sòng bạc (may-chu/bau-cua.js — anh 10/11): { o, viec: "mo" | "luat" | "xem" | "dat" (cua 0–5, n vạn) } -> { say | talk | bc (bàn
    // cược) | msg } + nhân vật (tiền)
    if (p === "/api/bau-cua" && m === "POST") {
      const h = oCua(tk, body), r = BC.lam(tk, h, body.o | 0, body);
      if (body.viec === "dat") D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h) });
    }
    // Bầu Cua (chỉ tài khoản quản trị — thử): { viec: "xem" | "lech" (phut) | "ep" (kq) — 2 việc sau chỉ máy thử VL_BC_THU=1 }
    if (p === "/api/bau-cua-qt" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      return guiJson(res, 200, BC.quanTri(body));
    }
    if (p === "/api/phuc-duyen" && m === "POST") {
      const h = oCua(tk, body), r = PD.lam(h, tk.ten + "|" + (body.o | 0), body); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // công cụ thử hoạt động (chỉ tài khoản quản trị): { o, hd: "pld" | "dt" | "st" | "va" | "onl" | "pd", viec, … } -> như /api/pld | /api/da-tau | /api/sat-thu |
    // /api/vuot-ai + dev (trạng thái)
    // boss thế giới (chỉ tài khoản quản trị — thử): { viec: "goi" (tpl?, tai?: { bai, x, y, X, Y }, mau?) | "huy" | "xem" } -> { b, … }
    if (p === "/api/boss-tg" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      return guiJson(res, 200, BTG.quanTri(body));
    }
    // Phong Hỏa Liên Thành — Vệ binh thành môn Biện Kinh (may-chu/phong-hoa.js — anh 04/11): { o, viec: "mo" | "vao" } -> { l (lịch), daNop, vao?: { zone,
    // at }, msg? } + nhân vật (lỗi: chưa mở / đã đóng / chưa đủ cấp / thiếu phí)
    if (p === "/api/phong-hoa" && m === "POST") {
      const h = oCua(tk, body), r = PHO.lam(h, body, tk.ten); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h) });
    }
    // Lôi Đài — Công Bình Tử (may-chu/loi-dai.js — anh 15/11): { o, viec, khoa? } -> { say?, vao?, ve?, msg?, can?, ldp? } + nhân vật (phí vào sân trừ ở đây)
    if (p === "/api/loi-dai" && m === "POST") {
      const h = oCua(tk, body), r = LD.lam(h, body, tk.ten);
      // soát 16/11: ghi tài khoản lỗi (đĩa đầy…) sau lần vào sân có nộp phí -> gỡ phần nộp vừa ghi ở sân / sổ phí (tiền chưa trừ trên đĩa) rồi báo lỗi như cũ
      try { D.ghiTk(tk); } catch (e) { try { LD.boNop(tk.ten, body.o | 0); } catch (e2) { console.error("Lôi đài — gỡ lần nộp:", e2 && e2.message); } throw e; }
      return guiJson(res, 200, { ...r, nv: nvCua(h) });
    }
    // Lôi Đài — trận thử với bot (chỉ tài khoản quản trị như /api/tong-kim-qt; khóa an toàn cấp 2: bao-mat.js QT_RE "-qt" — THIET-KE-LOI-DAI.md §6, anh 16/11):
    // { o, viec: "mo" (che, ben, doiThu, dongDoi, cap, chuanBi, thiDau) | "huy" } -> { vao?: { zone, at }, msg } + nhân vật (không phí — nhân vật không đổi, không ghi tệp)
    if (p === "/api/loi-dai-qt" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      const h = oCua(tk, body); return guiJson(res, 200, { ...LD.thu(h, body, tk.ten), nv: nvCua(h) });
    }
    // Tỉ thí (anh 17/11 — may-chu/ti-thi.js lam): { o, viec: gui (ten, cau) | nhan (id) | tuChoi (id) | vao | luat } -> { msg, vao?, ttGui?, tiThi? } + nhân vật. Nhận lời = vào sân lôi
    // đài 1 vs 1 (loi-dai.js — miễn phí, nhân vật không đổi: không ghi tệp)
    if (p === "/api/ti-thi" && m === "POST") {
      const h = oCua(tk, body); return guiJson(res, 200, { ...TT.lam(h, body, tk.ten), nv: nvCua(h) });
    }
    // Truy Phong Đại Loạn Đấu — đua ngựa (may-chu/dua-ngua.js lam — anh 16/11): Truy Phong Sứ Giả (Ba Lăng), hộp đạo cụ, dùng đạo cụ, Ông chủ đường đua (thưởng
    // kinh nghiệm / Tử Thủy Tinh / Xu ghi ở đây) -> { say?, vao?, ve?, tin?, thuong?, s? } + nhân vật / túi
    if (p === "/api/dua-ngua" && m === "POST") {
      const h = oCua(tk, body), r = DN.lam(h, body, tk.ten); DO.chuan(h); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Báo Đáp Ân Sư (anh 16/11 — may-chu/bao-dap-an-su.js lam): Võ Sư Ba Lăng (moiRuou / dang) + Chưởng Đăng Cung Nữ (doi / muaTo) — đứng gần đúng NPC: npc-gan.js
    // (NG.chan ở trên); tt chỉ xem -> { bdas, msg?, kn?, tra? } + nhân vật / túi. Không await giữa đọc và ghi
    if (p === "/api/bao-dap-an-su" && m === "POST") {
      const h = oCua(tk, body), r = BD.lam(h, body, tk.ten + "|" + (body.o | 0), tk); DO.chuan(h); D.ghiTk(tk);
      if (r.msg) ghiHd("Báo Đáp Ân Sư", tk.ten, h.name, r.msg); // nhật ký chung + sổ riêng (anh 18/11 — trước chỉ sổ riêng loại mua / dùng)
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Khảm nạm Thủy tinh (anh 17/11 — may-chu/kham-nam.js lam): kham ở Thợ rèn Ba Lăng / Biện Kinh, muaHl ở Thương nhân thần bí — đứng gần đúng NPC: npc-gan.js
    // (NG.chan ở trên); tt chỉ xem luật -> { ok?, loai?, u?, msg?, tin?, daiCat?, khamNam } + nhân vật / túi. kham tự ghi sổ hoạt động. Không await giữa đọc và ghi
    if (p === "/api/kham-nam" && m === "POST") {
      const h = oCua(tk, body), r = KN.lam(h, body, tk); DO.chuan(h); D.ghiTk(tk);
      if (r.msg && body.viec === "muaHl") NK.hd("mua", r.msg);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // đua ngựa — lượt thử của công cụ thử (chỉ quản trị; khóa an toàn cấp 2: bao-mat.js QT_RE "-qt"): { o, viec, … } -> { vao?, msg?, s? } + nhân vật (không đổi nhân vật)
    if (p === "/api/dua-ngua-qt" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      const h = oCua(tk, body); return guiJson(res, 200, { ...DN.thu(h, body, tk.ten), nv: nvCua(h) });
    }
    // Tống Kim — Mộ binh quan / Quân Nhu quan Biện Kinh (may-chu/tong-kim.js lam — anh 06/11): { o, viec: "mo" | "phe" (x 0 Tống / 1 Kim) | "vao" | "luat" |
    // "qn" | "shop" | "duc" (x?) | "ducOk" } -> { say?: { text, opts }, talk?: { text }, vao?: { zone, at }, shop?: { hang, diem }, tin? } + nhân vật / túi
    if (p === "/api/tong-kim" && m === "POST") {
      const h = oCua(tk, body), r = TKM.lam(h, body, tk.ten); DO.chuan(h); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Phong Hỏa Liên Thành (chỉ tài khoản quản trị — thử): { viec: "mo" (baoDanh?, danh?, chuSoai? phút) | "huy" | "ket" (thang) | "xem" }
    if (p === "/api/phong-hoa-qt" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      return guiJson(res, 200, PHO.quanTri(body));
    }
    // Săn Nhím Béo Phì (chỉ tài khoản quản trị — thử): { viec: "mo" (tai?: [[bãi, x, y]], mau?, ngay?, phut?) | "huy" | "xem" } -> { s, … }
    if (p === "/api/san-nhim" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      return guiJson(res, 200, SN.quanTri(body));
    }
    if (p === "/api/quan-tri/hoat-dong" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      const h = oCua(tk, body), r = body.hd === "dt" ? DTau.dev(h, body) : body.hd === "st" ? SAT.dev(h, body) : body.hd === "va" ? VAI.dev(h, body) : body.hd === "vd" ? VDE.dev(h, body, tk) : body.hd === "onl" ? ONL.dev(h, tk.ten + "|" + (body.o | 0), body) : body.hd === "pd" ? PD.dev(h, tk.ten + "|" + (body.o | 0), body) : body.hd === "cap" ? TCAP.dev(h, body) : PLD.dev(h, body);
      DO.chuan(h); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Phong Lăng Độ (may-chu/phong-lang-do.js): { o, viec, bo?, ben?, u? } -> { say | talk | giao: { tieuDe, loi, viec, ben } | di: { z, at, hoiSinh? }
    // | lich, tin }
    if (p === "/api/pld" && m === "POST") {
      const h = oCua(tk, body), r = PLD.lam(h, body, tk.ten, body.o | 0); D.ghiTk(tk); // tk / ô: cập bờ Bắc cộng cống hiến bang hội (đợt 2)
      if (!HD_XEM.has(body.viec)) ghiHd("Phong Lăng Độ", tk.ten, h.name, r.tin || []);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Boss Sát thủ (may-chu/sat-thu.js — Nhiếp Thí Trần): { o, viec, cap?, id?, u? } -> { say | talk | giao: { tieuDe, loi, viec } }
    if (p === "/api/sat-thu" && m === "POST") {
      const h = oCua(tk, body), nv0 = h.satThu && h.satThu.nv, r = SAT.lam(h, body, tk); DO.chuan(h); D.ghiTk(tk);
      if (body.viec === "nhan" && h.satThu && h.satThu.nv && h.satThu.nv !== nv0) ghiHd("Boss Sát thủ", tk.ten, h.name, `nhận nhiệm vụ — ${boThe(r.say && r.say.text)}`);
      else if (body.viec === "vaoAi" || body.viec === "veAi") ghiHd("Vượt Ải", tk.ten, h.name, r.tin || []); // vào ải qua Nhiếp Thí Trần
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Đảo Tẩy Tủy (may-chu/tay-tuy.js — Xa phu Ba Lăng "Đi đảo Tẩy Tủy", Thích Minh trên đảo): { o, viec } -> { say | talk | tin, di?, tay? }
    if (p === "/api/tay-tuy" && m === "POST") {
      const h = oCua(tk, body), r = TTY.lam(h, body); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Viêm Đế Bảo Tàng (may-chu/viem-de.js): { o, viec, n? } -> { say | talk | tin, di? } + nhân vật / túi
    if (p === "/api/viem-de" && m === "POST") {
      const h = oCua(tk, body), r = VDE.lam(h, body, tk); DO.chuan(h); D.ghiTk(tk);
      if (!HD_XEM.has(body.viec)) ghiHd("Viêm Đế", tk.ten, h.name, r.tin || []);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Tham khảo cài đặt Nhặt đồ của người khác (may-chu/nhat-chia-se.js): { o, viec: "ds" | "chiaSe" | "go", nhat? } -> { ds, toi } — không đổi nhân vật
    if (p === "/api/nhat-chia-se" && m === "POST") return guiJson(res, 200, NCS.lam(oCua(tk, body), body));
    // Vượt Ải (may-chu/vuot-ai.js — trong ải): { o, viec: "ra" | "chet" | "xem" } -> { tin, talk?, di? } (vào ải qua Nhiếp Thí Trần: /api/sat-thu)
    if (p === "/api/vuot-ai" && m === "POST") {
      const h = oCua(tk, body), r = VAI.lam(h, body, tk); D.ghiTk(tk);
      if (!HD_XEM.has(body.viec)) ghiHd("Vượt Ải", tk.ten, h.name, r.tin || []);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // đăng nhập nhận thưởng (khung client loginprize): { o } xem | { o, nhan: ngày, chon? } nhận
    if (p === "/api/thuong-dn" && m === "POST") {
      const h = oCua(tk, body), r = DO.thuongDN(h, tk, body); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    // Mã kích hoạt (anh 29/10 — Lễ quan Ba Lăng, may-chu/ma-qua.js): { o, ma } -> { ds: quà đã nhận, loi: lời nhắn của quản trị, nv, tui }
    // Đổi môn phái (anh 11/11 — may-chu/doi-phai.js): { o, viec: roi | nhap, phai?, chon? } -> { msg, dp, phai (trường nhân vật trình duyệt áp), kn, luyen, tui, nv }
    if (p === "/api/doi-phai" && m === "POST") {
      const h = oCua(tk, body), r = DP.lam(h, body, tk.ten + "|" + (body.o | 0), tk.ten); DO.chuan(h); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, kn: knCua(h), luyen: DO.luyenCua(h), tui: tuiCua(h), nv: nvCua(h) });
    }
    if (p === "/api/ma-qua" && m === "POST") {
      const h = oCua(tk, body), r = MQ.nhap(tk, h, body.ma); D.ghiTk(tk);
      return guiJson(res, 200, { ...r, nv: nvCua(h), tui: tuiCua(h) });
    }
    if (p === "/api/quan-tri/uy-thac" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      const h = oCua(tk, body), r = DO.thuUyThac(h, body); D.ghiTk(tk);
      return guiJson(res, 200, { uyThac: r.kq ? (({ bao, ...k }) => k)(r.kq) : null, trangThai: r.trangThai, nv: nvCua(h), tui: tuiCua(h) });
    }
    if (p === "/api/quan-tri/nv" && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      const h = oCua(tk, body), tao = DO.ghiDev(h, body.hero) || []; D.ghiTk(tk);
      // nguồn gốc món (anh 18/11 tối): trang bị công cụ thử tạo / sửa dòng -> nhật ký quản trị (kèm món — F10 trỏ vào xem đủ dòng)
      if (tao.length) NK.ghi("qt", tk.ten, h.name, `Công cụ thử tạo / sửa ${tao.length} trang bị: ${tao.slice(0, 8).map((o) => `${DO.tenMon(o).trim()} [${(o.d || []).map((l) => l.join("=")).join(", ")}]`).join("; ")}`, { mon: tao.slice(0, 8).map(NK.mon) });
      return guiJson(res, 200, { nv: nvCua(h), tui: tuiCua(h), ...(body.hero && body.hero.skLuyen ? { luyen: DO.luyenCua(h) } : {}) }); // skLuyen: công cụ thử đặt cấp chiêu luyện (anh 17/11)
    }
    // Tống Kim bãi thử (chỉ tài khoản quản trị — may-chu/tong-kim.js): { viec: "mo" (bai, trai, soBot?, tri?, cap?, hs?) | "huy" | "xem" | "phe" (phe) |
    // "soBot" (soBot) | "tri" (tri) | "hs" (hs — hệ số sát thương PK) } -> { ok?, s }; trận theo lịch (thử nhanh — anh 06/11): "moTran" (baoDanh, danh, soai1,
    // soai2 — phút, số lẻ được; vaoMuon?, soBot?, thienTu?) | "ketTran" | "huyTran" -> { ok, l (lịch), s? }
    if (p === "/api/tong-kim-qt" && m === "POST") { if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị"); return guiJson(res, 200, TKM.quanTri(body, tk)); }
    // bảng quản trị (may-chu/quan-tri.js)
    const qv = QT.VIEC.exec(p);
    if (qv && m === "POST") {
      if (!tk.admin) return loi(res, 403, "Chỉ tài khoản quản trị");
      return guiJson(res, 200, QT.lam(qv[1], tk, body, {
        online: (ten) => { const at = online.get(ten) || 0; return Date.now() - at < ONLINE_MS ? at : 0; },
        roi: (ten) => { online.delete(ten); trongGame.delete(ten); },
        ip: diaChi(req), // IP của quản trị (nhật ký xóa mật khẩu cấp 2 — anh 10/11)
      }));
    }
    if (p === "/api/dang-xuat" && m === "POST") {
      tk.phien = null; D.ghiTk(tk); online.delete(tk.ten); trongGame.delete(tk.ten); GD.roi(tk.ten); BM.khoaLai(tk.ten);
      try { LD.roiGame(tk.ten); } catch (e) { console.error("Lôi đài — đăng xuất:", e.message); } // Lôi Đài: đăng xuất giữa trận = bị loại
      NK.ghi("thoat", tk.ten, null, "Đăng xuất");
      return guiJson(res, 200, { ok: 1 }, { "Set-Cookie": [datCookie(req, "", 0), KTN.xoa(req)] }); // + bỏ phiếu tài nguyên (lượt 61)
    }
    const nv = /^\/api\/nv\/(\d)$/.exec(p);
    if (nv && +nv[1] < D.SLOT_N) {
      const o = +nv[1];
      if (m === "POST") return taoNv(res, tk, o, body, trang);
      if (m === "PUT") return luuNv(res, tk, o, body);
      if (m === "DELETE") return xoaNv(res, tk, o);
    }
    return loi(res, 404, "Không có API này");
  } catch (e) {
    // mã lỗi của API là số (400, 404, 413…); lỗi hệ thống có mã chữ (ECONNRESET: người chơi ngắt kết nối giữa lúc gửi — docBody; ENOENT…) — trước
    // đem làm mã HTTP -> writeHead ném lỗi, cả máy chủ sập (VPS 31/10 16:04): giờ trả 500; đã trả lời / kết nối đã đứt thì thôi
    const so = Number.isInteger(e.code) && e.code >= 400 && e.code < 600;
    if (!so) console.error(/^ECONN/.test(e.code) ? `API ${req.method} ${p}: kết nối đứt giữa chừng (${e.code})` : e);
    if (res.headersSent || res.destroyed) return;
    return loi(res, so ? e.code : 500, so ? e.message : "Lỗi máy chủ: " + e.message, so && e.ma ? String(e.ma) : undefined); // ma: mã lỗi cho trình duyệt (bao-mat.js loiMa)
  } finally { NK.ctx(null); NGM.ctx(""); } // hết yêu cầu: bộ hẹn giờ / kênh tức thời chạy sau không ghi nhầm vào sổ người này
}

// kênh tức thời (chay-game.js -> may-chu/ws.js): như tkPhien, đang bảo trì thì chỉ tài khoản quản trị
// đang bị bắt đổi mật khẩu đăng nhập (may-chu/bao-mat.js): chưa vào game được -> không mở kênh
const tkWs = (req) => { const tk = tkPhien(req); return tk && !tk.batDoiMk && (tk.admin || (!BT.con() && DY.duoc(tk.ten))) ? tk : null; };

module.exports = { xuLyApi, tkPhien, tkWs };
