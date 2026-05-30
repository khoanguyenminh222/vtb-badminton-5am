import { SignJWT, jwtVerify } from "jose";

// Khóa bí mật dùng để ký JWT token (lấy từ biến môi trường hoặc dùng giá trị mặc định)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_jwt_key_at_least_32_characters_long"
);

/**
 * Ký một payload để tạo JWT token
 * @param {Object} payload - Dữ liệu cần ký
 * @returns {Promise<string>} JWT token đã ký
 */
export async function createToken(payload) {
  // Tạo JWT với thuật toán HS256, thời gian hết hạn 7 ngày
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Token sẽ hết hạn sau 7 ngày
    .sign(JWT_SECRET);
}

/**
 * Xác minh JWT token và trả về payload, hoặc null nếu không hợp lệ
 * @param {string} token - JWT token cần xác minh
 * @returns {Promise<Object|null>} Dữ liệu trong token hoặc null nếu không hợp lệ
 */
export async function verifyToken(token) {
  // Không có token thì trả về null
  if (!token) return null;
  try {
    // Xác minh token và lấy payload
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.id, // Thêm userId cho tiện sử dụng
      ...payload
    };
  } catch (error) {
    // Nếu token không hợp lệ hoặc hết hạn, trả về null
    return null;
  }
}
