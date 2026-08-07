/**
 * GOLDEN ERP SYSTEM - HR PAYROLL EXP BOOK CONTROLLER (D1 DATABASE EDITION)
 * File: js/hr.js
 * 💡 Features: 0ms Instant Modal Opening, Fixed totalSalaryVal Reference & D1 Compatible Auto-Fill Engine
 */

var gHrSubTab = 'payroll'; // 'payroll' | 'fulltime' | 'parttime'
var gHrPayrollData = [];
var gHrPayrollFilteredData = [];
var gHrPayrollPage = 1;
var gHrPayrollLimit = 15;

// 💡 Full Time နှင့် Part Time စာရင်းကို သီးသန့်ခွဲထားရန် Cache Variable များ
var gHrStaffFT = []; // Full-Time Staff Cache
var gHrStaffPT = []; // Part-Time Staff Cache
var gHrStaffCache = []; // Fallback Cache

/**
 * 💡 Switch Sub-Tabs in HR Module
 * @param {string} subTab 'payroll' | 'fulltime' | 'parttime'
 */
function switchHrSubTab(subTab = 'payroll') {
  gHrSubTab = subTab;

  const sectionPay = document.getElementById('hr-payroll-section');
  const sectionStaff = document.getElementById('hr-staff-section');

  const btnPay = document.getElementById('hr-tab-payroll');
  const btnFT = document.getElementById('hr-tab-fulltime');
  const btnPT = document.getElementById('hr-tab-parttime');

  if (btnPay) btnPay.className = `hr-sub-tab-btn px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 border ${subTab === 'payroll' ? 'bg-teal-500/25 text-teal-300 border-teal-400/60 ring-2 ring-teal-500/30 opacity-100 shadow-teal-950/40' : 'bg-teal-950/20 border-teal-500/20 text-teal-400/60 opacity-60 hover:opacity-100'}`;
  if (btnFT) btnFT.className = `hr-sub-tab-btn px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 border ${subTab === 'fulltime' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 ring-2 ring-emerald-500/30 opacity-100 shadow-emerald-950/40' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400/60 opacity-60 hover:opacity-100'}`;
  if (btnPT) btnPT.className = `hr-sub-tab-btn px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 border ${subTab === 'parttime' ? 'bg-purple-500/25 text-purple-300 border-purple-400/60 ring-2 ring-purple-500/30 opacity-100 shadow-purple-950/40' : 'bg-purple-950/20 border-purple-500/20 text-purple-400/60 opacity-60 hover:opacity-100'}`;

  if (subTab === 'payroll') {
    if (sectionPay) sectionPay.classList.remove('hidden');
    if (sectionStaff) sectionStaff.classList.add('hidden');
    loadHrPayrollData(true);
  } else if (subTab === 'fulltime') {
    if (sectionPay) sectionPay.classList.add('hidden');
    if (sectionStaff) sectionStaff.classList.remove('hidden');
    if (typeof switchStaffCategory === 'function') switchStaffCategory('Full Time');
  } else if (subTab === 'parttime') {
    if (sectionPay) sectionPay.classList.add('hidden');
    if (sectionStaff) sectionStaff.classList.remove('hidden');
    if (typeof switchStaffCategory === 'function') switchStaffCategory('Part Time');
  }
}

/**
 * 💡 Load HR Payroll Exp Book Data from Cloudflare D1
 */
async function loadHrPayrollData(useCache = true) {
  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);

    const response = await callApi('getExpenseData', {
      bookName: 'HR Payroll Exp Book',
      forceRefresh: !useCache
    }, 'GET');

    if (response && response.success) {
      gHrPayrollData = response.data || [];
      
      // Calculate Stats
      let totInc = 0;
      let totExp = 0;
      gHrPayrollData.forEach(r => {
        totInc += Number(r.debit || 0);
        totExp += Number(r.credit || 0);
      });

      renderHrPayrollStats({ totalIncome: totInc, totalExpense: totExp, balance: totInc - totExp });
      applyHrPayrollSearchAndRender();
    }

    preloadStaffCacheForPayroll();

  } catch (error) {
    console.error('Failed to load HR Payroll data:', error);
    if (typeof showToast === 'function') showToast("ERROR", "HR Payroll စာရင်းများ ဖတ်ယူ၍ မရပါ: " + error.message);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

/**
 * 💡 Preload Staff Data for Fast ID Lookup
 */
async function preloadStaffCacheForPayroll() {
  try {
    const resFT = await callApi('getStaffData', { category: 'Full Time', page: 1, limit: 500, forceRefresh: true }, 'GET');
    const resPT = await callApi('getStaffData', { category: 'Part Time', page: 1, limit: 500, forceRefresh: true }, 'GET');

    gHrStaffFT = (resFT && resFT.success && Array.isArray(resFT.data)) ? resFT.data : [];
    gHrStaffPT = (resPT && resPT.success && Array.isArray(resPT.data)) ? resPT.data : [];
    gHrStaffCache = [...gHrStaffFT, ...gHrStaffPT];
  } catch (e) {
    console.warn("Staff cache preload warning:", e.message);
  }
}

async function ensureStaffCacheForCategory(isPartTime) {
  const needsRefresh = isPartTime
    ? (!gHrStaffPT || gHrStaffPT.length === 0)
    : (!gHrStaffFT || gHrStaffFT.length === 0);

  if (!needsRefresh) return;

  try {
    const category = isPartTime ? 'Part Time' : 'Full Time';
    const res = await callApi('getStaffData', { category, page: 1, limit: 500, forceRefresh: true }, 'GET');

    if (res && res.success && Array.isArray(res.data)) {
      if (isPartTime) {
        gHrStaffPT = res.data;
      } else {
        gHrStaffFT = res.data;
      }
      gHrStaffCache = [...gHrStaffFT, ...gHrStaffPT];
    }
  } catch (e) {
    console.warn("ensureStaffCacheForCategory warning:", e.message);
  }
}

/**
 * 💡 Render Stats KPI Cards
 */
function renderHrPayrollStats(stats) {
  const elInc = document.getElementById('hr-pay-total-income');
  const elExp = document.getElementById('hr-pay-total-expense');
  const elBal = document.getElementById('hr-pay-balance');
  const elCount = document.getElementById('hr-pay-entries-count');

  if (elInc) elInc.textContent = `${Number(stats.totalIncome || 0).toLocaleString('en-US')} MMK`;
  if (elExp) elExp.textContent = `${Number(stats.totalExpense || 0).toLocaleString('en-US')} MMK`;
  if (elBal) elBal.textContent = `${Number(stats.balance || 0).toLocaleString('en-US')} MMK`;
  if (elCount) elCount.textContent = gHrPayrollData.length.toLocaleString('en-US');
}

/**
 * 💡 Filter & Search Payroll Data
 */
function applyHrPayrollSearchAndRender() {
  const searchInput = document.getElementById('hr-payroll-search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const fromEl = document.getElementById('hr-date-from');
  const toEl = document.getElementById('hr-date-to');
  const fromDate = fromEl ? fromEl.value : '';
  const toDate = toEl ? toEl.value : '';

  gHrPayrollFilteredData = gHrPayrollData.filter(row => {
    if (typeof window.isDateInRange === 'function') {
      if (!window.isDateInRange(row.date, fromDate, toDate)) return false;
    }

    if (!query) return true;
    const descMatch = String(row.description || '').toLowerCase().includes(query);
    const catMatch = String(row.category || '').toLowerCase().includes(query);
    const vrMatch = String(row.vr_no || row.vrNo || '').toLowerCase().includes(query);

    return descMatch || catMatch || vrMatch;
  });

  gHrPayrollPage = 1;
  renderHrPayrollTable();
}

function onSearchInputHrPayroll() {
  applyHrPayrollSearchAndRender();
}

function clearDateFilterHrPayroll() {
  const fromEl = document.getElementById('hr-date-from');
  const toEl = document.getElementById('hr-date-to');
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  applyHrPayrollSearchAndRender();
}

/**
 * 💡 Render Table Grid with D1 Compatibility
 */
function renderHrPayrollTable() {
  const tbody = document.getElementById('hr-payroll-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const totalEntries = gHrPayrollFilteredData.length;
  const totalPages = Math.ceil(totalEntries / gHrPayrollLimit) || 1;
  if (gHrPayrollPage > totalPages) gHrPayrollPage = totalPages;

  const startIndex = (gHrPayrollPage - 1) * gHrPayrollLimit;
  const endIndex = Math.min(startIndex + gHrPayrollLimit, totalEntries);
  const pageItems = gHrPayrollFilteredData.slice(startIndex, endIndex);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" class="text-center py-8 text-slate-500 font-bold">ရှာဖွေမှုနှင့် ကိုက်ညီသော HR Payroll စာရင်း မရှိပါ။</td></tr>`;
    updateHrPayrollPaginationInfo(0, 0, 0);
    return;
  }

  pageItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/30 transition-all border-b border-slate-800/40 text-xs text-slate-300';
    const displayNo = item.no || (startIndex + index + 1);
    const uid = item.uniqueid || item.uniqueId || '';
    const vrNo = item.vr_no || item.vrNo || '-';
    const unpaidBonus = Number(item.unpaid_bonus ?? item.unpaidBonus ?? 0);
    const unpaidFund = Number(item.unpaid_fund ?? item.unpaidFund ?? 0);

    tr.innerHTML = `
      <td class="text-center font-mono font-semibold text-slate-400 py-3 px-3">${displayNo}</td>
      <td class="font-mono py-3 px-3">${escapeHtmlHr(item.date) || '-'}</td>
      <td class="py-3 px-3">${typeof window.formatCategoryBadgeHtml === 'function' ? window.formatCategoryBadgeHtml(item.category) : escapeHtmlHr(item.category)}</td>
      <td class="font-bold text-slate-100 max-w-xs truncate py-3 px-3" title="${escapeHtmlHr(item.description)}">${escapeHtmlHr(item.description) || '-'}</td>
      <td class="font-semibold py-3 px-3">${escapeHtmlHr(item.method) || '-'}</td>
      <td class="text-right font-mono font-bold text-emerald-400 py-3 px-3">${item.debit > 0 ? Number(item.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
      <td class="text-right font-mono font-bold text-rose-400 py-3 px-3">${item.credit > 0 ? Number(item.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
      <td class="text-right font-mono font-bold text-indigo-400 py-3 px-3">${Number(item.balances || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="text-right font-mono font-bold text-emerald-400 py-3 px-3">${unpaidBonus > 0 ? Number(unpaidBonus).toLocaleString('en-US') : '-'}</td>
      <td class="text-right font-mono font-bold text-teal-400 py-3 px-3">${unpaidFund > 0 ? Number(unpaidFund).toLocaleString('en-US') : '-'}</td>
      <td class="font-mono text-slate-400 py-3 px-3">${escapeHtmlHr(vrNo)}</td>
      <td class="font-mono py-3 px-3">${escapeHtmlHr(item.my) || '-'}</td>
      <td class="font-mono font-bold text-indigo-300 py-3 px-3">${escapeHtmlHr(item.fy) || '-'}</td>
      <td class="text-center right-0 sticky bg-[#0c1322] border-l border-slate-800 shadow-lg py-3 px-3">
        <div class="flex items-center justify-center gap-2">
          <button onclick="printPayslip('${uid}')" class="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition" title="Print Payslip"><i class="fa-solid fa-print"></i></button>
          <button onclick="editHrPayrollEntry('${uid}')" class="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button onclick="deleteHrPayrollEntry('${uid}')" class="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition btn-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateHrPayrollPaginationInfo(startIndex + 1, endIndex, totalEntries);
}

function updateHrPayrollPaginationInfo(start, end, total) {
  const info = document.getElementById('hr-pay-pagination-info');
  if (info) info.textContent = `Showing ${start} to ${end} of ${total} entries`;

  const btnPrev = document.getElementById('hr-pay-btn-prev');
  const btnNext = document.getElementById('hr-pay-btn-next');

  if (btnPrev) btnPrev.disabled = (gHrPayrollPage <= 1);
  if (btnNext) btnNext.disabled = (end >= total);
}

function changePageHrPayroll(delta) {
  gHrPayrollPage += delta;
  renderHrPayrollTable();
}

function escapeHtmlHr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================================
// 💡 CRITICAL AUTO-FILL ENGINE: ON STAFF ID / CATEGORY CHANGE (D1 COMPATIBLE)
// ============================================================================

async function onStaffIdChangePayroll() {
  const staffIdInput = document.getElementById('hr-pay-staff-id');
  const categorySelect = document.getElementById('hr-pay-category');
  const dateInput = document.getElementById('hr-pay-date');

  const rawStaffId = staffIdInput ? staffIdInput.value.trim() : '';
  const category = categorySelect ? categorySelect.value : 'Full Time Salary';
  const dateVal = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);

  const elCredit = document.getElementById('hr-pay-credit');
  const elBonus = document.getElementById('hr-pay-unpaid-bonus');
  const elFund = document.getElementById('hr-pay-unpaid-fund');
  const elDesc = document.getElementById('hr-pay-description');

  if (!rawStaffId) {
    if (elCredit) elCredit.value = 0;
    if (elBonus) elBonus.value = 0;
    if (elFund) elFund.value = 0;
    if (elDesc) elDesc.value = '';
    return;
  }

  const isPartTime = category.toLowerCase().includes('part time salary') || category.toLowerCase().includes('part time bonus') || category.toLowerCase().includes('part time fund');

  await ensureStaffCacheForCategory(isPartTime);

  let targetStaffList = isPartTime ? gHrStaffPT : gHrStaffFT;

  if ((!targetStaffList || targetStaffList.length === 0) && window.gStaffData) {
    targetStaffList = window.gStaffData.filter(s => {
      const cat = String(s.category || s.staffCategory || '').toLowerCase();
      return isPartTime ? cat.includes('part') : cat.includes('full');
    });
  }

  const targetIdNum = parseInt(rawStaffId, 10);
  const prefixKey = isPartTime ? 'pid' : 'fid';

  // 💡 Staff ID Matching with D1 Field Names (staff_id, staff_idname, name)
  const matchedStaff = (targetStaffList || []).find(s => {
    const sId = parseInt(s.staff_id || s.staffId || s.id || s.fid || s.pid || 0, 10);
    const sName = String(s.staff_idname || s.staffIdName || s.name || '').toLowerCase();
    const searchPad = `00${targetIdNum}`.slice(-3);

    return sId === targetIdNum || sName.includes(`${prefixKey} ${searchPad}`) || sName.includes(`${prefixKey}${searchPad}`);
  });

  if (!matchedStaff) {
    if (elCredit) elCredit.value = 0;
    if (elBonus) elBonus.value = 0;
    if (elFund) elFund.value = 0;
    if (elDesc) elDesc.value = `[${isPartTime ? 'PID' : 'FID'} ${rawStaffId} ဝန်ထမ်း မရှိပါ]`;
    return;
  }

  // Format Date MY String (e.g. "Aug-26")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dObj = new Date(dateVal);
  const now = new Date();
  const fallbackMY = `${months[now.getMonth()]}-${String(now.getFullYear()).slice(-2)}`;
  const myStr = !isNaN(dObj.getTime()) ? `${months[dObj.getMonth()]}-${String(dObj.getFullYear()).slice(-2)}` : fallbackMY;

  // 💡 Calculate Values with D1 Field Name Compatibility
  let creditVal = 0;
  let bonusFieldVal = 0;
  let fundFieldVal = 0;

  // 🔧 FIXED: Declared totalSalaryVal properly to fix Uncaught ReferenceError
  const totalSalaryVal = Number(matchedStaff.total_salary ?? matchedStaff.totalSalary ?? 0);
  const netSalary = Number(matchedStaff.total_net_amt ?? matchedStaff.totalNetAmt ?? totalSalaryVal);
  const bonusAmt = Number(matchedStaff.bonus ?? 0);
  const fundAmt = Number(matchedStaff.fund ?? 0);
  const unpaidBonus = Number(matchedStaff.unpaid_bonus ?? matchedStaff.unpaidBonus ?? 0);
  const unpaidFund = Number(matchedStaff.unpaid_fund ?? matchedStaff.unpaidFund ?? 0);

  if (category === 'Full Time Salary' || category === 'Part Time Salary') {
    creditVal = totalSalaryVal; // ✅ Bound to TOTAL SALARY
    bonusFieldVal = bonusAmt;
    fundFieldVal = fundAmt;
  } else if (category === 'Full Time Bonus' || category === 'Part Time Bonus') {
    bonusFieldVal = unpaidBonus || bonusAmt;
    creditVal = bonusFieldVal;
  } else if (category === 'Full Time Fund' || category === 'Part Time Fund') {
    fundFieldVal = unpaidFund || fundAmt;
    creditVal = fundFieldVal;
  }

  // Populate Input Fields
  if (elCredit) elCredit.value = creditVal;
  if (elBonus) elBonus.value = bonusFieldVal;
  if (elFund) elFund.value = fundFieldVal;

  // Auto Display Name Generation
  const defaultPrefix = isPartTime ? 'PID' : 'FID';
  const staffNameOnly = matchedStaff.name || '';
  const defaultIdStr = `${defaultPrefix} ${String(matchedStaff.staff_id || matchedStaff.staffId || matchedStaff.id || targetIdNum).padStart(3, '0')} ${staffNameOnly}`;
  const staffDisplayName = matchedStaff.staff_idname || matchedStaff.staffIdName || defaultIdStr;

  if (elDesc) elDesc.value = `[${staffDisplayName}, ${category} ${myStr}]`;
}

/**
 * 💡 Open Add Modal (0ms Instant Opening)
 */
function openAddModalHrPayroll() {
  const form = document.getElementById('hr-payroll-form');
  if (form) form.reset();

  const elId = document.getElementById('hr-pay-uniqueId');
  if (elId) elId.value = '';

  const elDate = document.getElementById('hr-pay-date');
  if (elDate) elDate.value = new Date().toISOString().slice(0, 10);

  const elDeb = document.getElementById('hr-pay-debit');
  if (elDeb) elDeb.value = 0;

  const elCred = document.getElementById('hr-pay-credit');
  if (elCred) elCred.value = 0;

  const title = document.getElementById('hr-payroll-form-title');
  if (title) title.textContent = 'Add HR Payroll Entry';

  // 💡 INSTANT OPEN: Show modal immediately first (0ms delay)
  const modal = document.getElementById('hr-payroll-modal');
  if (modal) modal.classList.remove('hidden');

  // Preload staff cache in background non-blocking
  preloadStaffCacheForPayroll();
}

function closeHrPayrollModal() {
  const modalEl = document.getElementById('hr-payroll-modal');
  if (modalEl) modalEl.classList.add('hidden');
}

/**
 * 💡 Save HR Payroll Form Entry to Cloudflare D1 Database
 */
async function saveHrPayrollForm(e) {
  if (e && e.preventDefault) e.preventDefault();

  const staffIdVal = document.getElementById('hr-pay-staff-id')?.value.trim();
  const categoryVal = document.getElementById('hr-pay-category')?.value || 'Full Time Salary';
  const creditVal = parseFloat(document.getElementById('hr-pay-credit')?.value || 0);

  if (!staffIdVal) {
    if (typeof showToast === 'function') showToast("ERROR", "ကျောင်းသား/ဝန်ထမ်း ID ဖြည့်သွင်းပါ");
    return;
  }

  const payload = {
    bookName: 'HR Payroll Exp Book',
    uniqueId: document.getElementById('hr-pay-uniqueId')?.value || '',
    date: document.getElementById('hr-pay-date')?.value || new Date().toISOString().slice(0, 10),
    category: categoryVal,
    staffId: staffIdVal,
    method: document.getElementById('hr-pay-method')?.value || 'Cash',
    debit: parseFloat(document.getElementById('hr-pay-debit')?.value || 0),
    credit: creditVal,
    unpaidBonus: parseFloat(document.getElementById('hr-pay-unpaid-bonus')?.value || 0),
    unpaidFund: parseFloat(document.getElementById('hr-pay-unpaid-fund')?.value || 0),
    description: document.getElementById('hr-pay-description')?.value || '',
    fy: 'FY 2026-2027'
  };

  closeHrPayrollModal();
  if (typeof toggleLoading === 'function') toggleLoading(true);

  try {
    const actionName = payload.uniqueId ? 'updateExpenseEntry' : 'saveHrPayrollForm';
    const response = await callApi(actionName, payload);

    if (response && response.success) {
      if (typeof showToast === 'function') showToast('SUCCESS', 'HR Payroll စာရင်း အချက်အလက်များ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။');
      if (typeof clearAllApiCache === 'function') clearAllApiCache();
      loadHrPayrollData(false);
    } else {
      if (typeof showToast === 'function') showToast("ERROR", (response ? response.message : "") || "သိမ်းဆည်းမှု မအောင်မြင်ပါ။");
    }
  } catch (error) {
    if (typeof showToast === 'function') showToast('ERROR', `အမှားအယွင်း ဖြစ်ပေါ်ခဲ့သည်: ${error.message}`);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

/**
 * 💡 Edit Entry
 */
function editHrPayrollEntry(uniqueId) {
  const row = gHrPayrollData.find(item => (item.uniqueid === uniqueId || item.uniqueId === uniqueId));
  if (!row) {
    if (typeof showToast === 'function') showToast("ERROR", "မူရင်း အချက်အလက် ရှာမတွေ့ပါ။");
    return;
  }

  openAddModalHrPayroll();

  const elId = document.getElementById('hr-pay-uniqueId');
  if (elId) elId.value = row.uniqueid || row.uniqueId || '';

  const elDate = document.getElementById('hr-pay-date');
  if (elDate) elDate.value = row.date || '';

  const elCat = document.getElementById('hr-pay-category');
  if (elCat) elCat.value = row.category || 'Full Time Salary';

  const elMethod = document.getElementById('hr-pay-method');
  if (elMethod) elMethod.value = row.method || 'Cash';

  const elDeb = document.getElementById('hr-pay-debit');
  if (elDeb) elDeb.value = row.debit || 0;

  const elCred = document.getElementById('hr-pay-credit');
  if (elCred) elCred.value = row.credit || 0;

  const elBonus = document.getElementById('hr-pay-unpaid-bonus');
  if (elBonus) elBonus.value = row.unpaid_bonus ?? row.unpaidBonus ?? 0;

  const elFund = document.getElementById('hr-pay-unpaid-fund');
  if (elFund) elFund.value = row.unpaid_fund ?? row.unpaidFund ?? 0;

  const elStaffId = document.getElementById('hr-pay-staff-id');
  if (elStaffId) {
    const matchId = String(row.description || '').match(/(?:FID|PID)\s*0*(\d+)/i);
    elStaffId.value = row.staff_id || row.staffId || (matchId ? matchId[1] : '');
  }

  const elDesc = document.getElementById('hr-pay-description');
  if (elDesc) elDesc.value = row.description || '';

  const title = document.getElementById('hr-payroll-form-title');
  if (title) title.textContent = 'Edit HR Payroll Entry';
}

/**
 * 💡 Delete Entry
 */
async function deleteHrPayrollEntry(uniqueId) {
  if (!confirm("ဤ စာရင်းအား အပြီးတိုင် ဖျက်သိမ်းလိုပါသလား။")) return;

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const response = await callApi('deleteExpenseEntry', { uniqueId, bookName: 'HR Payroll Exp Book' });

    if (response && response.success) {
      if (typeof showToast === 'function') showToast('SUCCESS', 'HR Payroll စာရင်းအား အောင်မြင်စွာ ဖျက်သိမ်းပြီးပါပြီ။');
      if (typeof clearAllApiCache === 'function') clearAllApiCache();
      loadHrPayrollData(false);
    } else {
      if (typeof showToast === 'function') showToast("ERROR", (response ? response.message : "") || "ဖျက်သိမ်းမှု မအောင်မြင်ပါ။");
    }
  } catch (error) {
    if (typeof showToast === 'function') showToast('ERROR', `ဖျက်သိမ်းမှု အမှား: ${error.message}`);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

/**
 * 💡 Print Payslip Engine
 */
function printPayslip(uniqueId) {
  const row = gHrPayrollData.find(item => (item.uniqueid === uniqueId || item.uniqueId === uniqueId));
  if (!row) return;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '-';
  };

  const netAmt = Number(row.credit || row.debit || 0).toLocaleString('en-US') + ' MMK';

  let displayMY = row.my;
  if (!displayMY && row.date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(row.date);
    if (!isNaN(d.getTime())) {
      displayMY = `${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
    }
  }

  const unpaidBonus = Number(row.unpaid_bonus ?? row.unpaidBonus ?? 0);
  const unpaidFund = Number(row.unpaid_fund ?? row.unpaidFund ?? 0);

  setTxt('print-pay-desc-top', row.description);
  setTxt('print-pay-cat-top', row.category);
  setTxt('print-pay-date-top', row.date);
  setTxt('print-pay-month-top', displayMY || '-');
  setTxt('print-pay-net-top', netAmt);
  setTxt('print-pay-bonus-top', unpaidBonus.toLocaleString() + ' MMK');
  setTxt('print-pay-fund-top', unpaidFund.toLocaleString() + ' MMK');

  setTxt('print-pay-desc-bot', row.description);
  setTxt('print-pay-cat-bot', row.category);
  setTxt('print-pay-date-bot', row.date);
  setTxt('print-pay-month-bot', displayMY || '-');
  setTxt('print-pay-net-bot', netAmt);
  setTxt('print-pay-bonus-bot', unpaidBonus.toLocaleString() + ' MMK');
  setTxt('print-pay-fund-bot', unpaidFund.toLocaleString() + ' MMK');

  window.print();
}

/**
 * 💡 CSV Export Engine
 */
function exportToCSVHrPayroll() {
  if (!gHrPayrollData || gHrPayrollData.length === 0) {
    if (typeof showToast === 'function') showToast("ERROR", "ထုတ်ယူရန် မည်သည့် စာရင်းမျှ မရှိပါ။");
    return;
  }

  let csv = "NO,DATE,CATEGORY,DESCRIPTION,METHOD,DEBIT,CREDIT,BALANCES,UNPAID BONUS,UNPAID FUND,VR NO,MY,FY\n";
  gHrPayrollData.forEach((r, idx) => {
    let desc = `"${(r.description || '').replace(/"/g, '""')}"`;
    let unpaidBonus = r.unpaid_bonus ?? r.unpaidBonus ?? 0;
    let unpaidFund = r.unpaid_fund ?? r.unpaidFund ?? 0;
    let vrNo = r.vr_no || r.vrNo || '';

    csv += `${r.no || (idx + 1)},${r.date || ''},${r.category || ''},${desc},${r.method || ''},${r.debit || 0},${r.credit || 0},${r.balances || 0},${unpaidBonus},${unpaidFund},${vrNo},${r.my || ''},${r.fy || ''}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `HR_Payroll_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 💡 EXPOSE GLOBALLY
window.switchHrSubTab = switchHrSubTab;
window.loadHrPayrollData = loadHrPayrollData;
window.onSearchInputHrPayroll = onSearchInputHrPayroll;
window.changePageHrPayroll = changePageHrPayroll;
window.onStaffIdChangePayroll = onStaffIdChangePayroll;
window.openAddModalHrPayroll = openAddModalHrPayroll;
window.closeHrPayrollModal = closeHrPayrollModal;
window.saveHrPayrollForm = saveHrPayrollForm;
window.editHrPayrollEntry = editHrPayrollEntry;
window.deleteHrPayrollEntry = deleteHrPayrollEntry;
window.printPayslip = printPayslip;
window.exportToCSVHrPayroll = exportToCSVHrPayroll;
