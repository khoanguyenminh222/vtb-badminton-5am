import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// URL kết nối MongoDB lấy từ biến môi trường
const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error("Vui lòng thêm MONGODB_URI vào file .env.local");
}

if (process.env.NODE_ENV === "development") {
  // Phát triển: tái sử dụng kết nối MongoDB
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Sản xuất: tạo kết nối mới cho mỗi lần
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Cờ để chỉ khởi tạo database một lần
let dbInitialized = false;

async function initDb(db) {
  if (dbInitialized) return;

  try {
    // 1. Tạo chỉ mục duy nhất cho username của người dùng
    await db.collection("users").createIndex({ username: 1 }, { unique: true });

    // 2. Tạo chỉ mục duy nhất cho tên thành viên (thường hóa)
    await db.collection("members").createIndex({ name: 1 }, { unique: true });

    // 3. Tạo chỉ mục duy nhất cho settings.key
    await db.collection("settings").createIndex({ key: 1 }, { unique: true });

    // 4. Tạo chỉ mục cho lịch sử nhập liệu để truy vấn nhanh theo thời gian và người nhập
    await db.collection("payment_logs").createIndex({ createdAt: -1 });
    await db.collection("payment_logs").createIndex({ recordedBy: 1, createdAt: -1 });
    await db.collection("payment_audit_logs").createIndex({ createdAt: -1 });
    await db.collection("payment_audit_logs").createIndex({ action: 1, createdAt: -1 });

    // 5. Tạo tài khoản super_admin nếu chưa tồn tại
    const superAdminExists = await db.collection("users").findOne({ role: "super_admin" });
    if (!superAdminExists) {
      const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@5am";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await db.collection("users").insertOne({
        username: "super.admin",
        passwordHash,
        role: "super_admin",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Đã khởi tạo tài khoản super_admin thành công");
    }

    dbInitialized = true;
  } catch (error) {
    console.error("Lỗi khởi tạo chỉ mục/seed database:", error);
  }
}

// Hàm lấy kết nối database
export async function getDb() {
  const connectedClient = await clientPromise;
  const db = connectedClient.db();
  await initDb(db);
  return db;
}
