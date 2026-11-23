// Bộ đếm id vật phẩm chung toàn máy chủ. Nạp từ id lớn nhất còn tồn tại trong
// TrangBi; đồ rơi chỉ ở RAM nên các id của chúng được phép dùng lại sau restart.
"use strict";
let last = 0;

function floor(value) {
  const n = Number(value);
  if (Number.isSafeInteger(n) && n > last) last = n;
  return last;
}

function next() { if (last >= Number.MAX_SAFE_INTEGER) throw new Error("Hết dải id vật phẩm toàn máy chủ"); return ++last; }

module.exports = { floor, next };
