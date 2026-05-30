import { google } from "googleapis";

/**
 * Trích xuất spreadsheetId và gid (nếu có) từ một URL Google Sheet
 * @param {string} url - URL của Google Sheet
 * @returns {Object|null} {spreadsheetId, gid} hoặc null nếu không hợp lệ
 */
export function parseSheetUrl(url) {
  if (!url) return null;
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const spreadsheetId = idMatch[1];

  const gidMatch = url.match(/[?&#]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  return { spreadsheetId, gid };
}

/**
 * Cấu hình và trả về client API Google Sheets
 * Sử dụng GoogleAuth với thông tin tài khoản dịch vụ rõ ràng để đảm bảo độ tin cậy
 */
export function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "";

  // Debug: ghi nhật ký trạng thái credential (không ghi giá trị nhạy cảm)
  console.log("[Sheets] email được thiết lập:", !!email, "| khóa bắt đầu bằng:", privateKey.slice(0, 27));

  if (!email || !email.includes("@") || !privateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      `Thông tin xác thực Google Service Account bị thiếu hoặc không hợp lệ.\n` +
      `EMAIL: ${email ? email : "(rỗng)"}\n` +
      `KÓA bắt đầu với: ${privateKey.slice(0, 30)}`
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Chuyển đổi chỉ mục cột (0 dựa) thành nhãn kiểu Excel (A, B, C... Z, AA, AB...)
 */
export function colIndexToLabel(index) {
  let label = "";
  let temp = index;
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
}

/**
 * Lấy siêu dữ liệu sheet (tiêu đề và ID sheet số) của tab khớp với gid
 * Quay lại tab đầu tiên nếu không cung cấp gid hoặc không khớp
 */
export async function getSheetMeta(sheetsClient, spreadsheetId, gid) {
  const response = await sheetsClient.spreadsheets.get({ spreadsheetId });
  const sheets = response.data.sheets || [];

  let sheet;
  if (gid) {
    sheet = sheets.find((s) => String(s.properties.sheetId) === String(gid));
  }
  if (!sheet) sheet = sheets[0];
  if (!sheet) throw new Error("Không tìm thấy sheet nào trong spreadsheet");

  return {
    title: sheet.properties.title,
    sheetId: sheet.properties.sheetId, // ID số cần thiết cho insertDimension
  };
}

/**
 * Chuẩn hóa tên để so sánh (xóa khoảng trắng + gộp khoảng trắng + chữ thường)
 */
function normalizeName(name) {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Các từ khóa được sử dụng để phát hiện cột tóm tắt cuối cùng "SỐ TIỀN CÒN LẠI"
 * Nếu không có từ khóa nào khớp với bất kỳ ô tiêu đề nào, cột sẽ được thêm ở cuối
 */
const SUMMARY_COL_KEYWORDS = ["còn lại", "con lai", "tổng", "tong", "remaining", "balance"];

function isSummaryColumn(cellValue) {
  if (!cellValue) return false;
  const norm = normalizeName(cellValue);
  return SUMMARY_COL_KEYWORDS.some((kw) => norm.includes(kw));
}

/**
 * Phân tích tất cả các cột ngày tháng trong tiêu đề sheet và gán cho chúng các đối tượng Date đầy đủ
 * Tính đến các chuyển năm tiềm ẩn (ví dụ: Tháng 12 sang Tháng 1)
 * bằng cách giả định rằng thứ tự vật lý của các cột là theo thứ tự thời gian
 *
 * @param {Array<string>} headers - Giá trị hàng tiêu đề
 * @param {number} startIdx - Chỉ mục cột bắt đầu ngày
 * @param {number} endIdx - Chỉ mục cột kết thúc ngày (loại trừ)
 * @param {Date} refDate - Ngày tham chiếu (ngày nhập được ghi)
 * @returns {Array<{colIndex: number, date: Date}>}
 */
export function parseSheetDates(headers, startIdx, endIdx, refDate) {
  const dates = [];
  const refYear = refDate.getFullYear();

  // 1. Phân tích tháng và ngày cho từng cột tiêu đề hợp lệ
  for (let i = startIdx; i < endIdx; i++) {
    const label = headers[i];
    if (!label) continue;
    const parts = String(label).trim().split("/");
    if (parts.length !== 2) continue;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(d) || isNaN(m) || m < 1 || m > 12 || d < 1 || d > 31) continue;
    dates.push({ colIndex: i, day: d, month: m });
  }

  if (dates.length === 0) return [];

  // 2. Tái tạo năm cho từng cột dựa trên thứ tự vật lý theo thời gian
  let currentYear = refYear;
  const parsedDates = [];

  for (let i = 0; i < dates.length; i++) {
    const item = dates[i];
    if (i > 0) {
      const prev = dates[i - 1];
      if (item.month < prev.month || (item.month === prev.month && item.day < prev.day)) {
        currentYear++;
      }
    }
    parsedDates.push({
      colIndex: item.colIndex,
      date: new Date(currentYear, item.month - 1, item.day)
    });
  }

  // 3. Dịch chuyển toàn bộ khoảng thời gian năm bằng một độ lệch trong [-2, 2] để căn chỉnh tốt nhất với refDate
  let bestOffset = 0;
  let minDiff = Infinity;
  for (let offset = -2; offset <= 2; offset++) {
    let localMinDiff = Infinity;
    for (const item of parsedDates) {
      const shiftedTime = new Date(item.date.getFullYear() + offset, item.date.getMonth(), item.date.getDate()).getTime();
      const diff = Math.abs(shiftedTime - refDate.getTime());
      if (diff < localMinDiff) {
        localMinDiff = diff;
      }
    }
    if (localMinDiff < minDiff) {
      minDiff = localMinDiff;
      bestOffset = offset;
    }
  }

  // Áp dụng độ lệch tốt nhất
  if (bestOffset !== 0) {
    for (const item of parsedDates) {
      item.date.setFullYear(item.date.getFullYear() + bestOffset);
    }
  }

  return parsedDates;
}

/**
 * Ghi lại các khoản thanh toán của thành viên vào một ngày cụ thể
 *
 * Cấu trúc Sheet:
 *   Hàng 1  : Hàng tiêu đề được gộp (bỏ qua)
 *   Hàng 2  : Tiêu đề — A=STT, B=TÊN THÀNH VIÊN, C=TIỀN SÂN, D=TIỀN CẦU,
 *                       E… =các cột ngày tháng (d/m), cột cuối=SỐ TIỀN CÒN LẠI
 *   Hàng 3+ : Hàng dữ liệu thành viên (tên trong cột B)
 *
 * Khi cột ngày tháng chưa tồn tại, một cột mới sẽ được chèn vào theo thứ tự thời gian
 * dựa trên các cột ngày tháng khác, giữ nó trước cột tóm tắt "SỐ TIỀN CÒN LẠI"
 *
 * @param {string} sheetUrl  - URL Google Sheet (có thể chứa ?gid=… cho một tab cụ thể)
 * @param {string} dateStr   - Chuỗi ngày tháng 'YYYY-MM-DD'
 * @param {Array<{displayName:string}>} members - Danh sách thành viên được chọn
 * @param {number|string} amountValue - Giá trị ghi nhận cho mỗi thành viên (số tiền hoặc trạng thái tạm)
 */
export async function recordPayments(sheetUrl, dateStr, members, amountValue) {
  const parsed = parseSheetUrl(sheetUrl);
  if (!parsed) throw new Error("Định dạng URL Google Sheet không hợp lệ");

  const { spreadsheetId, gid } = parsed;
  const sheetsClient = getSheetsClient();
  const { title: sheetTitle, sheetId: numericSheetId } =
    await getSheetMeta(sheetsClient, spreadsheetId, gid);

  // Xây dựng nhãn ngày tháng ví dụ: "29/5" (không có số 0 ở đầu)
  const [yyyyStr, mmStr, ddStr] = dateStr.split("-");
  const dateLabel = `${parseInt(ddStr, 10)}/${parseInt(mmStr, 10)}`;
  const refDate = new Date(parseInt(yyyyStr, 10), parseInt(mmStr, 10) - 1, parseInt(ddStr, 10));

  // Hằng số cho cấu trúc sheet
  const HEADER_ROW_INDEX = 1;      // 0-dựa → hàng 2
  const DATE_START_COL_INDEX = 4;  // 0-dựa → cột E
  const MEMBER_NAME_COL_INDEX = 1; // 0-dựa → cột B
  const DATA_START_ROW_INDEX = 2;  // 0-dựa → hàng 3

  // ----- ĐỌC DỮ LIỆU SHEET HIỆN TẠI -----
  const res = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:ZZ`,
  });
  const rows = res.data.values || [];
  const headerRow = [...(rows[HEADER_ROW_INDEX] || [])]; // bản sao có thể thay đổi cục bộ

  // ----- TÌM CỘT NGÀY THÁNG HIỆN CÓ -----
  let dateColIndex = -1;
  for (let i = DATE_START_COL_INDEX; i < headerRow.length; i++) {
    if (normalizeName(headerRow[i]) === normalizeName(dateLabel)) {
      dateColIndex = i;
      break;
    }
  }

  // ----- CHÈN CỘT NGÀY THÁNG NẾU THIẾU -----
  if (dateColIndex === -1) {
    // Tìm chỉ mục cột tóm tắt (nếu có)
    let summaryColIndex = -1;
    for (let i = DATE_START_COL_INDEX; i < headerRow.length; i++) {
      if (isSummaryColumn(headerRow[i])) {
        summaryColIndex = i;
        break;
      }
    }

    const endSearchIdx = summaryColIndex !== -1 ? summaryColIndex : headerRow.length;
    const parsedDates = parseSheetDates(headerRow, DATE_START_COL_INDEX, endSearchIdx, refDate);

    // Tìm vị trí chèn: cột đầu tiên có ngày lớn hơn refDate
    let insertAtIndex = -1;
    for (const item of parsedDates) {
      if (item.date > refDate) {
        insertAtIndex = item.colIndex;
        break;
      }
    }

    // Nếu không có ngày tháng lớn hơn, chèn trước cột tóm tắt hoặc nối tiếp
    if (insertAtIndex === -1) {
      if (summaryColIndex !== -1) {
        insertAtIndex = summaryColIndex;
      } else {
        // Tìm ô tiêu đề không rỗng cuối cùng từ DATE_START_COL_INDEX
        let lastUsed = DATE_START_COL_INDEX - 1;
        for (let i = DATE_START_COL_INDEX; i < headerRow.length; i++) {
          if (headerRow[i] !== undefined && headerRow[i] !== null && headerRow[i] !== "") {
            lastUsed = i;
          }
        }
        insertAtIndex = lastUsed + 1;
      }
    }

    // Sử dụng insertDimension để vật lý chèn một cột trống ở insertAtIndex
    // Điều này dịch chuyển cột tóm tắt (và bất kỳ thứ gì bên phải của nó) sang phải một vị trí
    // để công thức và ô gộp tham chiếu đến cột đó vẫn còn nguyên vẹn
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: numericSheetId,
                dimension: "COLUMNS",
                startIndex: insertAtIndex,      // 0-dựa, bao gồm
                endIndex: insertAtIndex + 1,    // 0-dựa, loại trừ
              },
              inheritFromBefore: true, // kế thừa định dạng từ cột bên trái
            },
          },
        ],
      },
    });

    // Viết nhãn ngày vào ô tiêu đề của cột mới được tạo (hàng 2)
    const newDateColLabel = colIndexToLabel(insertAtIndex);
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetTitle}'!${newDateColLabel}2`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[dateLabel]] },
    });

    dateColIndex = insertAtIndex;

    // Cập nhật mô hình headerRow cục bộ để phản ánh việc chèn
    headerRow.splice(insertAtIndex, 0, dateLabel);
  }

  const dateColLabel = colIndexToLabel(dateColIndex);

  // ----- XÂY DỰNG BẢN ĐỒ HÀNG THÀNH VIÊN (tên → số hàng dựa trên 1) -----
  const memberRowMap = {};
  for (let i = DATA_START_ROW_INDEX; i < rows.length; i++) {
    const row = rows[i];
    if (row && row[MEMBER_NAME_COL_INDEX]) {
      const key = normalizeName(row[MEMBER_NAME_COL_INDEX]);
      if (key) memberRowMap[key] = i + 1; // chuyển đổi sang dựa trên 1
    }
  }

  let nextNewRowNum = rows.length + 1; // hàng tiếp theo khả dụng (dựa trên 1)

  // ----- GHI THANH TOÁN -----
  const batchData = [];

  for (const member of members) {
    const key = normalizeName(member.displayName);
    let memberRowNum = memberRowMap[key];

    if (!memberRowNum) {
      // Nối thêm thành viên mới: viết STT (cột A) và displayName (cột B)
      const sttNum = nextNewRowNum - DATA_START_ROW_INDEX;
      batchData.push({
        range: `'${sheetTitle}'!A${nextNewRowNum}`,
        values: [[sttNum]],
      });
      batchData.push({
        range: `'${sheetTitle}'!B${nextNewRowNum}`,
        values: [[member.displayName]],
      });
      memberRowNum = nextNewRowNum;
      memberRowMap[key] = memberRowNum;
      nextNewRowNum++;
    }

    // Viết số tiền thanh toán tại giao điểm của cột ngày × hàng thành viên
    batchData.push({
      range: `'${sheetTitle}'!${dateColLabel}${memberRowNum}`,
      values: [[amountValue]],
    });
  }

  if (batchData.length > 0) {
    await sheetsClient.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: batchData,
      },
    });
  }

  return { success: true, sheetTitle };
}

/**
 * Kiểm tra xem trên Sheet đã có tiền thu ghi nhận của bất kỳ thành viên nào trong ngày được chọn hay chưa
 * @param {string} sheetUrl - URL của Google Sheet
 * @param {string} dateStr - Chuỗi ngày dạng YYYY-MM-DD
 * @param {Array<{displayName: string}>} members - Danh sách thành viên được chọn
 * @returns {Promise<{hasExistingData: boolean, existingMembers: string[]}>}
 */
export async function checkExistingPayments(sheetUrl, dateStr, members) {
  const parsed = parseSheetUrl(sheetUrl);
  if (!parsed) throw new Error("Định dạng URL Google Sheet không hợp lệ");

  const { spreadsheetId, gid } = parsed;
  const sheetsClient = getSheetsClient();
  const { title: sheetTitle } = await getSheetMeta(sheetsClient, spreadsheetId, gid);

  // Xây dựng nhãn ngày tháng ví dụ: "29/5"
  const [yyyyStr, mmStr, ddStr] = dateStr.split("-");
  const dateLabel = `${parseInt(ddStr, 10)}/${parseInt(mmStr, 10)}`;

  const HEADER_ROW_INDEX = 1;      // 0-dựa → hàng 2
  const DATE_START_COL_INDEX = 4;  // 0-dựa → cột E
  const MEMBER_NAME_COL_INDEX = 1; // 0-dựa → cột B
  const DATA_START_ROW_INDEX = 2;  // 0-dựa → hàng 3

  const res = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:ZZ`,
  });
  const rows = res.data.values || [];
  const headerRow = rows[HEADER_ROW_INDEX] || [];

  // Tìm cột ngày tháng hiện có
  let dateColIndex = -1;
  for (let i = DATE_START_COL_INDEX; i < headerRow.length; i++) {
    if (normalizeName(headerRow[i]) === normalizeName(dateLabel)) {
      dateColIndex = i;
      break;
    }
  }

  if (dateColIndex === -1) {
    // Cột ngày chưa tồn tại -> chắc chắn chưa có dữ liệu trùng
    return { hasExistingData: false, existingMembers: [] };
  }

  const existingMembers = [];
  for (const member of members) {
    const key = normalizeName(member.displayName);
    // Tìm hàng của thành viên trong dữ liệu sheet
    for (let i = DATA_START_ROW_INDEX; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[MEMBER_NAME_COL_INDEX]) {
        const rowNameKey = normalizeName(row[MEMBER_NAME_COL_INDEX]);
        if (rowNameKey === key) {
          const value = row[dateColIndex];
          // Nếu ô không rỗng, không undefined, không chỉ gồm khoảng trắng
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            existingMembers.push(member.displayName);
          }
          break;
        }
      }
    }
  }

  return {
    hasExistingData: existingMembers.length > 0,
    existingMembers,
  };
}
