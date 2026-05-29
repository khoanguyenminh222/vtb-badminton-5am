/**
 * Chuẩn hóa tên bằng cách xóa khoảng trắng đầu/cuối và gộp nhiều khoảng trắng thành một
 * @param {string} name - Tên cần chuẩn hóa
 * @returns {string} Tên đã chuẩn hóa
 */
export function cleanDisplayName(name) {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Chuẩn hóa tên thành viên để xác minh tính duy nhất: xóa khoảng trắng, gộp khoảng trắng, chuyển thành chữ thường
 * @param {string} name - Tên cần chuẩn hóa
 * @returns {string} Tên đã chuẩn hóa (chữ thường)
 */
export function normalizeName(name) {
  return cleanDisplayName(name).toLowerCase();
}
