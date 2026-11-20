// Quái chung ở bãi train (anh 02/11: "quay lại cái bãi quái đánh chung đi, anh muốn làm" -> "em làm thử bãi Lâm Du Quan đi, anh check thử"): cùng
// bãi thì mọi người thấy chung 1 đàn quái ở cùng chỗ, ai cũng đánh được, chết là mất với mọi người. Dựng theo quái chung Vượt Ải tổ đội
// (vuot-ai.js phòng, src/game/vadoi.js): máy chủ giữ danh sách quái + máu + chết + thưởng; máy "chủ bãi" (1 người trong bãi, tab không ẩn
// trước) sinh quái (gửi mẫu / cấp / hệ / máu / chỗ — máy chủ cấp mã), chọn mục tiêu từng con, báo vị trí 5 lần / giây; máy khác vẽ theo; chỉ máy
// của người bị đánh trừ máu người đó (src/game/quaichung.js). Bãi bật: cau-hinh.json quaiChung.bai — bỏ bãi khỏi danh sách + khởi động lại máy
// chủ là về quái riêng như cũ.
//   Anh 03/11 ("mỗi dãy cấp 1-10, 10-20 … gồm 2 loại bản đồ: quái riêng và quái chung, bãi quái chung tăng thêm 10% ngân lượng và exp"): bãi chính
//   mỗi dãy cấp (quaiChung.bai — 20 bãi) có 2 bản trên cùng bản đồ: bản quái riêng như mọi bãi + bản quái chung. Người chơi chọn bản lúc đi Xa phu
//   / Trợ Thủ (đội viên theo bản của đội trưởng) -> trình duyệt báo { t: "vao", zone, chung: 1 } (ws.js kn.chung); chỉ người bản chung vào phòng
//   này, mỗi bản chỉ thấy người cùng bản (the-gioi.js, ws.js guiBai). Kinh nghiệm + tiền quái chung × quaiChung.thuong (do.js gietQuai).
//   Số quái: 1 người = số quái bản riêng của bãi (canBang), mỗi người thêm soQuai[0] con, thêm tối đa soQuai[1] (65 -> 75 -> 85 -> 95).
//   Máu gửi gọn (anh 03/11 — đỡ tốn mạng điện thoại): mỗi lượt chỉ con đổi máu (hd), mỗi NHAC_MS / lúc đổi danh sách mới gửi đủ (hp).
//   Thưởng mỗi con: người gây nhiều sát thương nhất nhận trọn như giết quái riêng (kinh nghiệm, tiền, đồ rơi — riêng người đó thấy / nhặt, chia
//   đội như cũ — do.js gietQuai); người khác cùng đánh nhận kinh nghiệm × phần sát thương của mình (không tiền / đồ, không chia đội) — trừ người
//   cùng đội với người nhận trọn: họ đã có phần chia đội (do.js chiaDoi — anh 02/11, đội đánh cùng 1 con). Nhận ở nhịp sau (api.js nhip -> nhanThuong).
//   Số quái = soQuai[0] + soQuai[1] × số người trong bãi, tối đa soQuai[2]. Sát thương mỗi người tối đa stGiay / giây (chặn gửi bậy).
//   Người trong bãi = trang mới (đã gửi "qcVao") có kênh tức thời ở bãi đó, còn báo sống trong SONG_MS (trang cũ chưa tải lại không làm chủ bãi).
// Kênh tức thời (ws.js): trình duyệt -> "qcVao" (xin đủ trạng thái) · "qcSinh" { ds: [[mẫu, cấp, hệ, máu, x, y, thủ lĩnh, tinh anh]] } (chủ bãi) ·
//   "qcd" { s, d: [[mã, sát thương]], st: [[mã, choáng ms, chậm ms]] } (cũng đi kèm nhịp b.qcd khi kênh chưa mở) · "qch" { ts, q: [[mã, x, y, tên
//   mục tiêu | "", số đòn đã vung]] } (chủ bãi, 10 lần / giây) · "qcAn" { an } (tab ẩn / báo sống)
//   · "qcBo" { u: [mã] } (chủ bãi, bản đồ dựng nguyên — Phong Lăng Độ: con ở quá xa mọi người, chưa ai đánh -> bỏ để sinh lại gần người)
//   máy chủ -> "qc" { p } (trạng thái — đủ: kèm q danh sách + vt vị trí) · "qch" (vị trí chủ bãi báo, chuyển ngay người khác) · "qct" (choáng / chậm)
// Boss Sát thủ chung (anh 03/11: "đưa boss sát thủ lên bãi chung hết — người khác đánh thì phải thấy chứ", "bị giết thì hồi sinh sau 2 phút";
//   chọn "chỉ khi có người nhận nhiệm vụ"): người trong bản chung đang nhận nhiệm vụ boss của bãi này (nvSat — api.js nhịp) -> máy chủ sinh boss ở
//   chỗ của nó (assets/data/sat-thu.json — boss bãi phụ đã dời về bãi chung cùng dãy cấp: cong-cu/doi-sat-thu-bai-chung.mjs), hệ ngẫu nhiên, máu
//   do.js mauSat; ai trong bản chung cũng thấy / đánh. Chết: satThu.hoiSinh giây sau mới sinh lại (nếu vẫn còn người cần). Không còn ai cần quá
//   satThu.boChung giây và BO_MS không ai đánh thì bỏ. Thưởng: mọi người có đánh đều có phần như quái chung (không bỏ đồng đội của người đánh
//   nhiều nhất) — do.js gietQuai loại 3: chỉ người đang nhận đúng boss đó xong nhiệm vụ (sat-thu.js nhanGiet), người khác không được gì.
"use strict";
const DO = require("./do.js");
const WS = require("./ws.js");
const ND = require("./nghi-dame.js"); // nghi hack sát thương (anh 16/11 — chỉ ghi)
const SAT = () => require("./sat-thu.js"); // Boss Sát thủ chung (anh 03/11)

const N = DO.NOI, CFG = N.CFG.quaiChung || {};
// quái bản chung mạnh hơn (anh 03/11 "bãi quái chung quái mạnh hơn 50% bao gồm cả tần suất tấn công" — cau-hinh.json quaiChung.manh): máu nhân ở
// đây lúc chủ bãi sinh (qcSinh); sát thương + tần suất đánh trình duyệt nhân (luật quaiChung.manh — src/game/quaichung.js)
const QC_MAU = Math.max(1, +((CFG.manh || {}).mau) || 1);
const BAI = new Set((CFG.bai || []).map(Number));
const [THEM, THEM_MAX] = Array.isArray(CFG.soQuai) ? CFG.soQuai : [10, 30];
const CB = DO.LUAT.canBang || {};
// số quái bản riêng của bãi — như src/game/world.js: canBang.bai[mã].soQuai > canBang.soQuai > 65
const soGoc = (bai) => { const v = (CB.bai && CB.bai[bai] && CB.bai[bai].soQuai) ?? CB.soQuai; return v > 0 ? Math.round(v) : 65; };
const ST_GIAY = +CFG.stGiay || 500000, XOA_MS = (+CFG.xoaSau || 60) * 1000, XAC_MS = 2500, GUI_MS = 100, NHAC_MS = 1000, SONG_MS = 10000, CHU_MS = 5000;
const BO_MS = 30000; // qcBo: con bị đánh trong chừng này thì chưa bỏ
const NK_GIU = 400;  // giữ chừng này lần đổi danh sách quái (sinh / dọn): người chậm hơn thế nhận đủ danh sách
const PH = new Map();  // mã bãi -> P
const CHO = new Map(); // tài khoản -> [{ r: bản ghi giết như nhịp b.k, he: phần kinh nghiệm, top }]
const NV_SAT = new Map(); // tài khoản -> số hiệu Boss Sát thủ đang nhận nhiệm vụ (nvSat — api.js nhịp)
const SAT_CHET = new Map(); // "bãi:số hiệu boss" -> lúc boss chung chết (giữ cả khi phòng bị bỏ — hồi sinh đủ satThu.hoiSinh giây)

const bat = (bai) => BAI.has(+bai);
function phong(bai) {
  let P = PH.get(bai);
  if (!P) {
    P = { bai, q: new Map(), vt: new Map(), trong: new Map(), song: new Map(), an: new Set(), chu: null, ack: new Map(), han: new Map(), dan: new Map(),
      seq: 0, sv: 0, daSpec: new Map(), doi: true, guiLuc: 0, rong: 0, hpDoi: new Set(), hpLuc: 0, nk: [] };
    PH.set(bai, P);
  }
  return P;
}
const capP = (P) => soGoc(P.bai) + Math.min(THEM_MAX, THEM * Math.max(0, P.trong.size - 1));
// chủ bãi: giữ người đang làm nếu còn trong bãi, tab hiện và còn báo sống; không thì người tab hiện đầu tiên, không có thì người đầu tiên
function chonChu(P, t) {
  const duoc = (a) => !(P.cu && P.cu.has(a)); // trang có bản đồ bãi cũ không làm chủ bãi (cuBdv)
  const tot = (a) => P.trong.has(a) && duoc(a) && !P.an.has(a) && t - (P.song.get(a) || 0) < CHU_MS;
  const ds = [...P.trong.keys()].filter(duoc), moi = tot(P.chu) ? P.chu : ds.find(tot) || ds.find((a) => t - (P.song.get(a) || 0) < CHU_MS) || ds[0] || null;
  if (moi !== P.chu) { P.chu = moi; P.doi = true; }
}
// Phiên bản bản đồ bãi (assets/web/map/map.json zones bdv — anh 11/11 Thục Cương sơn 92 đổi khung bản đồ): chủ bãi sinh quái theo lưới của máy mình,
// trang chưa tải lại (bdv khác — trang trước 11/11 không gửi bdv: ws.js "vao") giữ lưới cũ -> quái ra chỗ chặn / ngoài đường của trang mới (soát 11/11:
// 51%). Trang đó không làm chủ bãi (chonChu); người đó nhận 1 tin hệ thống riêng nhắc tải lại trang (mỗi BAO_BDV_MS 1 lần)
const BAO_BDV = new Map(), BAO_BDV_MS = 10 * 60 * 1000;
function cuBdv(P, M, t) {
  const v = (N.ZONES.get(P.bai) || {}).bdv | 0;
  P.cu = v ? new Set([...M].filter(([, kn]) => (kn.bdv | 0) !== v).map(([a]) => a)) : null;
  if (!P.cu) return;
  for (const a of P.cu) {
    if (t - (BAO_BDV.get(a) || 0) < BAO_BDV_MS) continue;
    BAO_BDV.set(a, t);
    try { require("./the-gioi.js").thongBaoTk(`${(N.ZONES.get(P.bai) || {}).n || "Bãi này"} vừa đổi bản đồ — tải lại trang (F5) để thấy quái đứng đúng chỗ`, a, true); } catch (e) { console.error("Quái chung — báo tải lại:", e.message); }
  }
}
const mauCua = (m) => [m.uid, Math.max(0, Math.ceil(m.mau))];
const dongQ = (m) => [m.uid, m.tpl, m.lv, m.he, m.mauMax, m.x, m.y, m.boss, m.ta, m.sat || 0]; // sat: số hiệu Boss Sát thủ chung
// danh sách quái đổi (sinh: e.them = dòng q, dọn: e.bo = mã) -> bản mới + ghi nhật ký để gửi phần đổi
function doiDs(P, e) {
  P.sv++; e.sv = P.sv; P.nk.push(e); P.doi = true;
  if (P.nk.length > NK_GIU) P.nk.splice(0, P.nk.length - NK_GIU);
}
// hd: chỉ các con đổi máu từ lượt trước (null: gửi đủ hp); qd: danh sách đổi từ bản tu { tu, a: [dòng q thêm], x: [mã bỏ] }
function trangThai(P, tk, full, dan, hd, qd) {
  return { bai: P.bai, chu: P.trong.get(P.chu) || null, tv: [...P.trong.values()], cap: capP(P), sv: P.sv,
    ...(hd ? { hd } : { hp: [...P.q.values()].map(mauCua) }), dan, ack: P.ack.get(tk) || 0, gio: Date.now(), ...(qd ? { qd } : {}),
    ...(full ? { q: [...P.q.values()].map(dongQ), vt: [...P.vt].map(([u, v]) => [u, ...v]) } : {}) };
}
// gửi trạng thái cho cả bãi: người có bản danh sách mà nhật ký còn giữ đủ từ đó -> chỉ phần đổi (qd); người mới / bản quá cũ -> đủ danh sách
function phat(P) {
  const t = Date.now(); P.guiLuc = t; P.doi = false;
  const dan = [...P.dan]; P.dan.clear();
  const du = t - P.hpLuc >= NHAC_MS; if (du) P.hpLuc = t;
  const hd = du ? null : [...P.hpDoi].map((u) => P.q.get(u)).filter(Boolean).map(mauCua);
  P.hpDoi.clear();
  for (const tk of P.trong.keys()) {
    const kn = WS.cua(tk); if (!kn) continue;
    const s0 = P.daSpec.get(tk);
    let full = false, qd = null, hdc = hd;
    if (s0 !== P.sv) {
      if (s0 != null && P.nk.length && P.nk[0].sv <= s0 + 1) {
        const a = new Map(), x = [];
        for (const e of P.nk) if (e.sv > s0) { if (e.them) a.set(e.them[0], e.them); else if (a.has(e.bo)) a.delete(e.bo); else x.push(e.bo); }
        qd = { tu: s0, a: [...a.values()], x };
        if (hd) hdc = [...hd, ...qd.a.filter((r) => P.q.has(r[0])).map((r) => mauCua(P.q.get(r[0])))];
      } else full = true;
      P.daSpec.set(tk, P.sv);
    }
    kn.gui({ t: "qc", p: trangThai(P, tk, full, dan, full ? null : hdc, qd) });
  }
}

// mỗi 100 ms: người vào / ra (kênh tức thời ở bãi + đã gửi qcVao), chủ bãi, dọn xác, gửi trạng thái; bãi không còn ai quá xoaSau giây thì bỏ
setInterval(() => {
  if (!BAI.size) return;
  const t = Date.now(), co = new Map();
  WS.moi((kn) => { if (bat(kn.zone) && kn.qc === kn.zone && t - (kn.qcLuc || 0) < SONG_MS) (co.get(kn.zone) || co.set(kn.zone, new Map()).get(kn.zone)).set(kn.ten, kn); });
  for (const bai of BAI) {
    const M = co.get(bai) || new Map();
    let P = PH.get(bai);
    if (!P && !M.size) continue;
    P = P || phong(bai);
    for (const [tk, kn] of M) { P.song.set(tk, kn.qcLuc); if (!P.trong.has(tk)) { const p = require("./the-gioi.js").dangChoi(tk); if (p) { P.trong.set(tk, p.name); P.doi = true; } } }
    for (const tk of [...P.trong.keys()]) if (!M.has(tk)) { P.trong.delete(tk); P.an.delete(tk); P.daSpec.delete(tk); P.song.delete(tk); P.doi = true; }
    cuBdv(P, M, t);
    chonChu(P, t);
    for (const [u, m] of P.q) if (m.mau <= 0 && t - m.chet > XAC_MS) { P.q.delete(u); P.vt.delete(u); doiDs(P, { bo: u }); }
    satBai(P, t);
    if (!P.trong.size) { if (!P.rong) P.rong = t; else if (t - P.rong > XOA_MS) PH.delete(bai); continue; }
    P.rong = 0;
    if ((P.doi && t - P.guiLuc >= GUI_MS) || t - P.guiLuc >= NHAC_MS) phat(P);
  }
}, 100).unref();

// Boss Sát thủ chung của bãi P: boss người trong bản chung đang cần (nhiệm vụ đúng bãi này) mà chưa có -> sinh (đủ satThu.hoiSinh giây từ lần
// chết); boss không còn ai cần quá satThu.boChung giây và BO_MS không ai đánh -> bỏ
function satBai(P, t) {
  const ST = SAT().ST.boss, CF = SAT().CF, can = new Set(), song = new Map();
  for (const tk of P.trong.keys()) { const id = NV_SAT.get(tk); if (id && ST[id] && (ST[id].bai | 0) === P.bai) can.add(id); }
  for (const m of P.q.values()) if (m.sat && m.mau > 0) song.set(m.sat, m);
  for (const id of can) {
    const m = song.get(id); if (m) { m.canLuc = t; continue; }
    if (t - (SAT_CHET.get(P.bai + ":" + id) || 0) < CF.hoiSinh * 1000) continue;
    const b = ST[id], he = Math.floor(Math.random() * 5), mau = Math.max(1, Math.round(DO.mauSat(b, he))), uid = ++P.seq;
    const x = { uid, tpl: b.tpl, lv: b.lv, he, mau, mauMax: mau, x: b.x, y: b.y, boss: 0, ta: 0, sat: id, dmg: new Map(), canLuc: t };
    P.q.set(uid, x); doiDs(P, { them: dongQ(x) }); P.hpDoi.add(uid);
  }
  for (const [id, m] of song) if (!can.has(id) && t - m.canLuc > CF.boChung * 1000 && t - (m.danhLuc || 0) > BO_MS) { P.q.delete(m.uid); P.vt.delete(m.uid); doiDs(P, { bo: m.uid }); }
}
// nhiệm vụ Boss Sát thủ đang nhận của tài khoản tk (api.js mỗi nhịp — h.satThu.nv; 0 = không có)
function nvSat(tk, id) { if (id > 0) NV_SAT.set(tk, id | 0); else NV_SAT.delete(tk); }

// con quái chết (máu chung về 0): thưởng chờ nhịp sau cho từng người có đánh (người nhiều nhất nhận trọn)
function chet(P, m) {
  m.mau = 0; m.chet = Date.now(); P.doi = true;
  const v = P.vt.get(m.uid), x = v ? v[0] : m.x, y = v ? v[1] : m.y;
  let tong = 0, top = null, max = -1;
  for (const [tk, d] of m.dmg) { tong += d; if (d > max) { max = d; top = tk; } }
  const r = [P.bai, m.tpl, m.lv, m.sat ? 3 : m.boss ? 1 : m.ta ? 2 : 0, m.he, Math.round(x), Math.round(y)];
  if (m.sat) SAT_CHET.set(P.bai + ":" + m.sat, m.chet);
  const doiTop = top ? (require("./to-doi.js").thanhVien(top) || { tv: [] }).tv : [];
  // Phân Thân (anh 05/11): ai mà quá nửa sát thương của họ là của phân thân -> phần của họ coi như phân thân giết: kinh nghiệm, không tiền / đồ (cả bảng
  // Boss Sát thủ — soát 05/11: trước chỉ xét người đứng đầu)
  const laPt = (tk, d) => !!m.dmgPt && (m.dmgPt.get(tk) || 0) * 2 > d;
  // anh 18/11 — nguồn sự kiện (nguon-su-kien.js satThu): Boss Sát thủ — số người CÙNG ĐỘI được tính hạ boss (có nhiệm vụ đúng boss này + có đánh), tính cả mình
  const duocSat = m.sat ? new Set([...m.dmg].filter(([tk, d]) => d > 0 && NV_SAT.get(tk) === m.sat).map(([tk]) => tk)) : null;
  const soDoiSat = (tk) => { if (!duocSat || !duocSat.has(tk)) return 1; const d = require("./to-doi.js").thanhVien(tk); return d ? d.tv.filter((x) => duocSat.has(x)).length || 1 : 1; };
  for (const [tk, d] of m.dmg) {
    if (!(d > 0) || (!m.sat && tk !== top && doiTop.includes(tk))) continue; // cùng đội người nhận trọn: nhận phần chia đội thay phần sát thương (Boss Sát thủ: ai có nhiệm vụ cũng phải có phần riêng)
    const L = CHO.get(tk) || []; L.push({ r, he: tk === top ? 1 : d / tong, top: tk === top, ...(laPt(tk, d) ? { pt: 1 } : {}), ...(m.sat ? { ds: soDoiSat(tk) } : {}) }); if (L.length > 400) L.shift(); CHO.set(tk, L);
  }
}
// sát thương của tk ở bãi (kênh tức thời "qcd" / nhịp b.qcd): ack số tin, trừ máu theo hạn mức stGiay, ghi người vừa đánh (chủ bãi chọn mục tiêu)
const QT_ = (tk) => { try { return require("./bao-mat.js").qtMo(tk); } catch { return false; } }; // quản trị đã mở khóa an toàn: bỏ hạn mức sát thương / giây (anh 18/11 — "Một đòn chết" của công cụ thử)
function danh(tk, bai, tin) {
  const P = PH.get(+bai); if (!P || !P.trong.has(tk) || !tin || typeof tin !== "object") return;
  const s = Math.floor(+tin.s || 0); if (s > (P.ack.get(tk) || 0)) { P.ack.set(tk, s); P.doi = true; }
  const t = Date.now(), H = P.han.get(tk) || { han: ST_GIAY * 3, luc: t };
  H.han = Math.min(ST_GIAY * 3, H.han + ((t - H.luc) / 1000) * ST_GIAY); H.luc = t; P.han.set(tk, H);
  const qt = QT_(tk); if (qt) H.han = Infinity;
  let coChet = false;
  // tin.dp: sát thương của phân thân người này (anh 05/11 — may-chu/phan-than.js): tính vào phần của người thuê (chung hạn mức stGiay), ghi riêng
  // m.dmgPt để biết phần của từng người là của phân thân (chet: laPt)
  let tho = 0; // sát thương gửi lên của chính người này (chưa cắt theo hạn mức, không tính phân thân) — nghi hack sát thương (anh 16/11 — may-chu/nghi-dame.js, chỉ ghi)
  for (const [ds, pt] of [[tin.d, false], [tin.dp, true]]) for (const r of Array.isArray(ds) ? ds.slice(0, 120) : []) {
    const m = Array.isArray(r) && P.q.get(r[0] | 0), v = Math.floor(+r[1] || 0);
    if (!m || m.mau <= 0 || !(v > 0)) continue;
    if (!pt) tho += v;
    if (pt && m.sat) continue; // Boss Sát thủ: phân thân không gây sát thương, chỉ hỗ trợ (anh 13/11 — trang cũ chưa F5 vẫn gửi dp)
    const nhan = Math.min(v, H.han, m.mau); if (!(nhan > 0)) continue;
    H.han -= nhan; m.mau -= nhan; m.dmg.set(tk, (m.dmg.get(tk) || 0) + nhan); m.danhLuc = t; P.dan.set(m.uid, P.trong.get(tk)); P.hpDoi.add(m.uid); P.doi = true;
    if (pt) { m.dmgPt = m.dmgPt || new Map(); m.dmgPt.set(tk, (m.dmgPt.get(tk) || 0) + nhan); }
    if (m.mau <= 0) { chet(P, m); coChet = true; }
  }
  if (tho > 0 && !qt) ND.cong(tk, "qc", tho);
  if (coChet) phat(P); // có con chết: báo cả bãi ngay, không chờ lượt gửi 100 ms (anh 02/11 "lag và delay giữa 2 acc")
  const st = (Array.isArray(tin.st) ? tin.st.slice(0, 60) : []).filter((r) => Array.isArray(r) && P.q.has(r[0] | 0))
    .map((r) => [r[0] | 0, Math.max(0, Math.min(30000, r[1] | 0)), Math.max(0, Math.min(30000, r[2] | 0))]);
  if (st.length) for (const a of P.trong.keys()) if (a !== tk) WS.guiTk(a, { t: "qct", st });
}
const songKn = (kn) => { kn.qcLuc = Date.now(); };
// vào bãi / nối lại kênh (ws.js "vao" — kn.chung): bản quái chung thì vào phòng ngay (nối lại kênh cũng không rơi khỏi phòng), bản riêng thì ra
WS.nhan("vao", (kn) => {
  kn.qc = kn.chung && bat(kn.zone) ? kn.zone : -1;
  if (kn.qc < 0) return;
  songKn(kn);
  const P = PH.get(kn.zone); if (P) P.daSpec.delete(kn.ten);
});
// tin.s = số tin sát thương trình duyệt đã đếm: tải lại trang thì đếm lại từ 1 -> hạ số đã nhận xuống (giữ số cũ thì tin mới bị coi như đã nhận).
// Trang cũ chưa F5 (kn.moi false — không biết bản riêng / chung): vẫn vào phòng như bản thử 02/11, không thì bãi chính không có quái
WS.nhan("qcVao", (kn, tin) => {
  if (!bat(kn.zone) || (kn.moi && !kn.chung)) return;
  if (!kn.moi) kn.chung = 1;
  kn.qc = kn.zone; songKn(kn);
  const P = PH.get(kn.zone); if (!P) return;
  P.daSpec.delete(kn.ten); // lần gửi tới kèm đủ danh sách
  if (Number.isFinite(+tin.s)) P.ack.set(kn.ten, Math.min(P.ack.get(kn.ten) || 0, Math.max(0, Math.floor(+tin.s))));
});
WS.nhan("qcAn", (kn, tin) => { if (kn.qc !== kn.zone) return; songKn(kn); const P = PH.get(kn.zone); if (!P) return; if (tin.an) P.an.add(kn.ten); else P.an.delete(kn.ten); });
WS.nhan("qcd", (kn, tin) => { if (kn.qc === kn.zone) { songKn(kn); danh(kn.ten, kn.zone, tin); } });
// chủ bãi sinh quái: kiểm mẫu thuộc bãi (thủ lĩnh = mẫu trùm bãi), cấp quanh mốc bãi, máu trong khoảng; mỗi lúc 1 thủ lĩnh / 1 tinh anh; tổng ≤ số quái + 2
WS.nhan("qcSinh", (kn, tin) => {
  const P = PH.get(kn.zone); if (!P || P.chu !== kn.ten || !Array.isArray(tin.ds)) return;
  const Z = N.ZONES.get(P.bai); if (!Z) return;
  songKn(kn);
  const song = [...P.q.values()].filter((m) => m.mau > 0 && !m.sat); // Boss Sát thủ chung không tính vào số quái
  let n = song.length, coBoss = song.some((m) => m.boss), coTa = song.some((m) => m.ta);
  for (const r of tin.ds.slice(0, 10)) {
    if (!Array.isArray(r) || n >= capP(P) + 2) break;
    const tpl = r[0] | 0, lv = r[1] | 0, boss = r[6] ? 1 : 0, ta = !boss && r[7] ? 1 : 0;
    if (!(boss ? Z.boss === tpl : (Z.m || []).includes(tpl)) || lv < Z.lo - 5 || lv > Z.hi + 10 || (boss && coBoss) || (ta && coTa)) continue;
    const mau = Math.max(1, Math.min(2e8, Math.floor((+r[3] || 0) * QC_MAU))), uid = ++P.seq; // × manh.mau: quái bản chung mạnh hơn (anh 03/11)
    const m = { uid, tpl, lv, he: Math.max(0, Math.min(4, r[2] | 0)), mau, mauMax: mau, x: Math.round(+r[4] || 0), y: Math.round(+r[5] || 0), boss, ta, dmg: new Map() };
    P.q.set(uid, m);
    n++; if (boss) coBoss = true; if (ta) coTa = true;
    doiDs(P, { them: dongQ(m) }); P.hpDoi.add(uid);
  }
});
// chủ bãi báo vị trí + mục tiêu + số đòn đã vung (anh 02/11: máy khác vẽ theo — nội suy như người chơi khác) -> giữ (người vào sau nhận trong
// danh sách đủ) + chuyển ngay cho người khác trong bãi, kèm ts = đồng hồ máy chủ bãi lúc báo (ms)
WS.nhan("qch", (kn, tin) => {
  const P = PH.get(kn.zone); if (!P || P.chu !== kn.ten || !Array.isArray(tin.q)) return;
  songKn(kn);
  const q = [], ts = Math.round(+tin.ts || 0);
  for (const r of tin.q.slice(0, 150)) {
    if (!Array.isArray(r) || !P.q.has(r[0] | 0)) continue;
    const v = [Math.round(+r[1] || 0), Math.round(+r[2] || 0), typeof r[3] === "string" ? r[3].slice(0, 32) : ""];
    P.vt.set(r[0] | 0, v); q.push([r[0] | 0, ...v, Math.max(0, r[4] | 0)]);
  }
  // d: tin báo đòn (chỉ con vừa vung — máy khác không lấy làm mốc nhịp, quaichung.js viTri; soát 06/11)
  if (q.length) for (const a of P.trong.keys()) if (a !== kn.ten) WS.guiTk(a, { t: "qch", q, ...(ts > 0 ? { ts } : {}), ...(tin.d ? { d: 1 } : {}) });
});
// chủ bãi (bản đồ dựng nguyên — Phong Lăng Độ): con ở quá xa mọi người trong bãi -> bỏ (chủ bãi sinh lại quanh người — như World.boQuaiXa bản
// riêng); con đang có người đánh (trong BO_MS) / thủ lĩnh / tinh anh thì giữ
WS.nhan("qcBo", (kn, tin) => {
  const P = PH.get(kn.zone); if (!P || P.chu !== kn.ten || !Array.isArray(tin.u)) return;
  songKn(kn);
  const t = Date.now();
  for (const u of tin.u.slice(0, 100)) {
    const m = P.q.get(u | 0);
    if (!m || m.mau <= 0 || m.boss || m.ta || m.sat || t - (m.danhLuc || 0) < BO_MS) continue;
    P.q.delete(m.uid); P.vt.delete(m.uid); doiDs(P, { bo: m.uid });
  }
});

// thưởng các con quái chung đã chết mà tk có đánh (api.js nhịp): do.js gietQuai với ctx.chung (máy chủ đã xác nhận — không kiểm lại); món / tiền
// rơi kèm chỗ con chết (x, y, z) để trình duyệt vẽ; n = số con nhận trọn (ủy thác đo tốc độ giết — do.js uyThacDo)
function nhanThuong(h, tk, key, admin) {
  const L = CHO.get(tk); if (!h || !L || !L.length) return null;
  CHO.delete(tk);
  const out = { kn: 0, len: 0, n: 0, nBh: 0, nhan: [], roi: [], tin: [] }; // nBh: số con tính cống hiến bang hội (chỉ con mình nhận trọn — api.js BH.quai)
  for (const o of L) {
    const kq = DO.gietQuai(h, [o.r], { ten: tk, admin, key, chung: true, heSoKn: o.he, khongRoi: !o.top || !!o.pt, khongChia: !o.top, ...(o.pt ? { pt: 1 } : {}), ...(o.ds ? { doiSat: o.ds } : {}) }); // o.pt: phân thân giết — kinh nghiệm, không tiền / đồ
    out.kn += kq.kn; out.len += kq.len; if (o.top) out.n += kq.n;
    if (o.top) out.nBh += kq.nBh | 0; // bang hội đợt 2
    const [z, , , , , x, y] = o.r;
    for (const m of kq.nhan) out.nhan.push({ ...m, x, y, z });
    for (const [, g, gid] of kq.roi || []) out.roi.push({ g: gid, tien: g, x, y, z });
    if (kq.tin) out.tin.push(...kq.tin);
    if (kq.tui) out.tui = 1; // anh 18/11: Boss Sát thủ chung — Sát Thủ lệnh / rượu / Trung Dược đã vào túi -> nhịp gửi túi mới (api.js)
  }
  return out.kn || out.nhan.length || out.roi.length || out.tin.length ? out : null;
}

module.exports = { bat, danh, nhanThuong, nvSat, BAI };
