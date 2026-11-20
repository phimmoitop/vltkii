// Giờ Việt Nam (UTC+7) cho lịch hoạt động — máy chủ không đặt múi giờ, mọi lịch so "HH:MM" theo giờ Việt Nam.
// thu: ngày trong tuần được bật của một hoạt động (CF.thu: 0 = Chủ nhật … 6 = Thứ bảy; thiếu / rỗng = mọi ngày) — anh 05/11: GM chỉnh lịch ở F10
const VN = 7 * 3600e3;
const vn = (t = Date.now()) => { const d = new Date(t + VN), s = d.toISOString(); return { hm: s.slice(11, 16), ngay: s.slice(0, 10), thu: d.getUTCDay(), phut: d.getUTCHours() * 60 + d.getUTCMinutes() }; };
const thuOk = (CF, t = Date.now()) => !Array.isArray(CF && CF.thu) || !CF.thu.length || CF.thu.includes(new Date(t + VN).getUTCDay());
const phutCua = (hm) => { const [a, b] = String(hm).split(":").map(Number); return (a | 0) * 60 + (b | 0); };
// ms của giờ hm ngày Việt Nam ngay ("YYYY-MM-DD")
const lucCua = (ngay, hm) => Date.parse(ngay + "T00:00:00Z") - VN + phutCua(hm) * 60000;
const sangNgay = (ngay, d) => new Date(Date.parse(ngay + "T00:00:00Z") + d * 86400e3).toISOString().slice(0, 10);
const hopLe = (hm) => typeof hm === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(hm);
module.exports = { VN, vn, thuOk, phutCua, lucCua, sangNgay, hopLe };
