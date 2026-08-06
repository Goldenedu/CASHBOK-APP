/**
 * GOLDEN ERP SYSTEM - INPUT VALIDATION & SANITIZATION ENGINE 
 * File: validation.js (or validators/validation.js)
 * 💡 Serverless Input Validation, Formula Injection Sanitizer & Formal Error Handling Engine
 * 🛠️ SECURED (Phase 3): Added Pure Number Exemption for Formula Sanitizer & ISO Date Split
 */

/**
 * 💡 SANITIZE FORMULA INJECTION ATTACKS FOR GOOGLE SHEETS
 * Escapes special leading characters (=, +, -, @, \t, \r) to prevent formula execution exploits in Google Sheets.
 * Exempts pure numbers (e.g. "-1000", "+50") so numeric amounts are not incorrectly converted to text strings.
 * 
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeFormulaInput(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();

  // 🛡️ 1. Pure numbers (e.g., "-1000", "+50", "125.50") are NOT formula injections
  if (!isNaN(Number(trimmed))) {
    return str;
  }

  // 🛡️ 2. Escape formula execution triggers
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return str;
}

/**
 * 💡 RECURSIVELY SANITIZE ALL STRING FIELDS IN AN OBJECT
 * 
 * @param {object} obj 
 * @returns {object}
 */
export function sanitizeObjectFormulas(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeFormulaInput(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObjectFormulas(obj[key]);
    }
  }
  return obj;
}

/**
 * 💡 Validate ISO Date Format (YYYY-MM-DD)
 * 
 * @param {string} dateStr 
 * @param {string} fieldName 
 * @returns {object} { valid: boolean, message?: string }
 */
export function validateDateStr(dateStr, fieldName = "Date") {
  if (!dateStr || typeof dateStr !== "string") {
    return { valid: false, message: `${fieldName} ဖြည့်သွင်းရန် လိုအပ်ပါသည်။` };
  }

  // 🛡️ Handles ISO DateTime strings (e.g., "2026-07-31T00:00:00.000Z" -> "2026-07-31")
  const cleanDateStr = dateStr.trim().split('T')[0];

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(cleanDateStr)) {
    return { valid: false, message: `${fieldName} ၏ ပုံစံမှာ YYYY-MM-DD ဖြစ်ရပါမည်။ (ဥပမာ - 2026-07-26)` };
  }

  const d = new Date(cleanDateStr);
  if (isNaN(d.getTime())) {
    return { valid: false, message: `မမှန်ကန်သော ${fieldName} ဖြစ်နေပါသည်။` };
  }

  return { valid: true };
}

/**
 * 💡 Validate Currency / Numeric Amount
 * 
 * @param {any} val 
 * @param {string} fieldName 
 * @param {boolean} allowNegative 
 * @returns {object} { valid: boolean, value?: number, message?: string }
 */
export function validateAmount(val, fieldName = "Amount", allowNegative = false) {
  if (val === undefined || val === null || val === "") {
    return { valid: true, value: 0 };
  }

  const num = Number(val);
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} တွင် ဂဏန်းသန့်သန့်သာ ရေးသွင်းရပါမည်။` };
  }

  if (!allowNegative && num < 0) {
    return { valid: false, message: `${fieldName} သည် ၀ ထက် ငယ်၍ မရပါ။` };
  }

  return { valid: true, value: Number(num.toFixed(2)) };
}

/**
 * 💡 Validate Required Text Input with Length & Formula Injection Sanitization
 * 
 * @param {string} str 
 * @param {string} fieldName 
 * @param {number} minLen 
 * @param {number} maxLen 
 * @returns {object} { valid: boolean, cleanValue?: string, message?: string }
 */
export function validateRequiredText(str, fieldName = "Field", minLen = 1, maxLen = 500) {
  const cleanStr = String(str || "").trim();

  if (!cleanStr || cleanStr.length < minLen) {
    return { valid: false, message: `${fieldName} ဖြည့်သွင်းရန် လိုအပ်ပါသည်။` };
  }

  if (cleanStr.length > maxLen) {
    return { valid: false, message: `${fieldName} သည် စာလုံးရေ ${maxLen} လုံးထက် မကျော်လွန်ရပါ။` };
  }

  const safeValue = sanitizeFormulaInput(cleanStr);
  return { valid: true, cleanValue: safeValue };
}

/**
 * 💡 Validate Ledger Entry Body Payload (Bank, Cash, Office, Kitchen, HR)
 */
export function validateLedgerPayload(body = {}) {
  const dateCheck = validateDateStr(body.date, "Transaction Date");
  if (!dateCheck.valid) return dateCheck;

  const descCheck = validateRequiredText(body.description, "Description", 1, 1000);
  if (!descCheck.valid) return descCheck;

  const debitCheck = validateAmount(body.debit, "Debit Amount", true);
  if (!debitCheck.valid) return debitCheck;

  const creditCheck = validateAmount(body.credit, "Credit Amount", true);
  if (!creditCheck.valid) return creditCheck;

  return { valid: true };
}

/**
 * 💡 Validate Student Profile Body Payload
 */
export function validateStudentPayload(body = {}) {
  const nameCheck = validateRequiredText(body.name, "Student Name", 1, 150);
  if (!nameCheck.valid) return nameCheck;

  return { valid: true };
}

/**
 * 💡 Validate Staff Profile Body Payload
 */
export function validateStaffPayload(body = {}) {
  const nameCheck = validateRequiredText(body.name, "Staff Name", 1, 150);
  if (!nameCheck.valid) return nameCheck;

  return { valid: true };
}

/**
 * 💡 UNIFIED SERVER-SIDE INPUT VALIDATOR & FORMULA INJECTION SANITIZER
 * Invoked directly by worker.js on all POST/PUT/DELETE mutation requests.
 * 
 * @param {object} body 
 * @returns {object} { success: boolean, message?: string }
 */
export function validateLedgerInput(body = {}) {
  if (!body || typeof body !== 'object') {
    return { success: false, message: "Request Payload မမှန်ကန်ပါ။" };
  }

  // 🛡️ 1. Sanitize all string fields against Google Sheets Formula Injection Attacks
  sanitizeObjectFormulas(body);

  const action = String(body.action || "").trim();

  // 🛡️ 2. Date Format Validation (if date field is present)
  if (body.date) {
    const dateCheck = validateDateStr(body.date, "Date (ရက်စွဲ)");
    if (!dateCheck.valid) {
      return { success: false, message: dateCheck.message };
    }
  }

  // 🛡️ 3. Amount Validation (Debit / Credit)
  if (body.debit !== undefined) {
    const debitCheck = validateAmount(body.debit, "Debit Amount (ဝင်ငွေ)", true);
    if (!debitCheck.valid) {
      return { success: false, message: debitCheck.message };
    }
  }

  if (body.credit !== undefined) {
    const creditCheck = validateAmount(body.credit, "Credit Amount (ထွက်ငွေ)", true);
    if (!creditCheck.valid) {
      return { success: false, message: creditCheck.message };
    }
  }

  // 🛡️ 4. Student Payload Validation
  if (action.includes("Student") && (action.startsWith("save") || action.startsWith("update"))) {
    const stuCheck = validateStudentPayload(body);
    if (!stuCheck.valid) {
      return { success: false, message: stuCheck.message };
    }
  }

  // 🛡️ 5. Staff Payload Validation
  if (action.includes("Staff") && (action.startsWith("save") || action.startsWith("update"))) {
    const staffCheck = validateStaffPayload(body);
    if (!staffCheck.valid) {
      return { success: false, message: staffCheck.message };
    }
  }

  return { success: true };
}
