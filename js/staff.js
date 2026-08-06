/**
 * GOLDEN ERP SYSTEM - STAFF MODULE
 * File: js/staff.js
 * 💡 Staff Master Directory with Safe Google Sheet Grade Matrix Engine (H1:U2 - 14 Columns)
 * 🛠️ FIXED: Added missing Grade L to openGradeModal & saveGradeForm (14 values payload).
 */

var gStaffCategory = 'Full Time'; // 'Full Time' or 'Part Time'
var gStaffPage = 1;
var gStaffLimit = 30;
var gStaffSearch = '';
var gStaffData = [];

// 💡 Google Sheet (FullTime!H1:U2) မှ ဖတ်ယူမည့် Dynamic Payroll Settings Cache
var gPayrollSettings = {
  grades: {},
  bonus: 0,
  fundRate: 0
};

/**
 * 💡 Fetch Payroll Settings Directly from Google Sheet (FullTime!H1:U2)
 * 🛡️ FIX: Always forceRefresh so this never serves a stale/incorrect 24h client cache
 *     entry (e.g. an old response captured before the sheet had real values, or before
 *     a past server-side range bug was fixed). Grade Matrix numbers must always be live.
 */
async function fetchPayrollSettings() {
  try {
    const res = await callApi('getPayrollSettings', { forceRefresh: true });
    const pData = (res && res.data) ? res.data : (res && res.grades ? res : null);
    if (pData) {
      gPayrollSettings = {
        grades: pData.grades || {},
        bonus: pData.bonus || 0,
        fundRate: pData.fundRate || 0
      };
    }
  } catch (err) {
    console.warn("Could not load payroll settings from Sheet API:", err);
  }
  return gPayrollSettings;
}

/**
 * 💡 Strict Search Filter Function for Staff Directory
 */
function filterStaffData(list = [], searchVal = '') {
  if (!searchVal || !searchVal.trim()) return list;
  const q = searchVal.trim().toLowerCase();

  return list.filter(row => {
    const name = String(row.staffIdName || row.name || '').toLowerCase();
    const staffId = String(row.id || row.fid || row.pid || '').toLowerCase();
    const position = String(row.position || '').toLowerCase();

    return name.includes(q) || staffId.includes(q) || position.includes(q);
  });
}

async function switchStaffCategory(category) {
  gStaffCategory = category;
  gStaffPage = 1;

  const btnFT = document.getElementById('staff-tab-ft');
  const btnPT = document.getElementById('staff-tab-pt');
  const pageTitle = document.getElementById('staff-page-title');
  const btnEditGrade = document.getElementById('btn-edit-grade');
  const btnEditGradeHr = document.getElementById('btn-edit-grade-hr');

  if (category === 'Full Time') {
    if (btnFT) btnFT.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/10";
    if (btnPT) btnPT.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-slate-800 text-slate-400 hover:text-white";
    if (pageTitle) pageTitle.innerHTML = `<i class="fa-solid fa-users text-indigo-400"></i> Full Time Staff List (FID)`;
    if (btnEditGrade) btnEditGrade.classList.remove('hidden');
    if (btnEditGradeHr) btnEditGradeHr.classList.remove('hidden');
  } else {
    if (btnFT) btnFT.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-slate-800 text-slate-400 hover:text-white";
    if (btnPT) btnPT.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/10";
    if (pageTitle) pageTitle.innerHTML = `<i class="fa-solid fa-user-clock text-indigo-400"></i> Part Time Staff List (PID)`;
    if (btnEditGrade) btnEditGrade.classList.add('hidden');
    if (btnEditGradeHr) btnEditGradeHr.classList.add('hidden');
  }

  renderStaffTableHead();
  await loadStaffData(false);
}

function renderStaffTableHead() {
  const thead = document.getElementById('staff-table-head');
  if (!thead) return;

  if (gStaffCategory === 'Full Time') {
    thead.innerHTML = `
      <tr class="bg-[#0e172a]">
        <th scope="col" class="w-12 text-center text-slate-400 text-xs py-3">NO</th>
        <th scope="col" class="w-28 text-slate-400 text-xs py-3">JOIN DATE</th>
        <th scope="col" class="min-w-[200px] text-slate-400 text-xs py-3">STAFF IDNAME</th>
        <th scope="col" class="w-28 text-slate-400 text-xs py-3">EDUCATION</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">POSITION</th>
        <th scope="col" class="w-28 text-slate-400 text-xs py-3">SALARY GRADE</th>
        <th scope="col" class="w-28 text-right text-slate-400 text-xs py-3">WORKING DAYS</th>
        <th scope="col" class="w-32 text-right text-slate-400 text-xs py-3">BASIC AMT</th>
        <th scope="col" class="w-32 text-right text-slate-400 text-xs py-3">EXTRA AMT</th>
        <th scope="col" class="w-32 text-right text-slate-400 text-xs py-3">TOTAL SALARY</th>
        <th scope="col" class="w-28 text-right text-emerald-400 text-xs py-3">BONUS</th>
        <th scope="col" class="w-28 text-right text-teal-400 text-xs py-3">FUND</th>
        <th scope="col" class="w-36 text-right text-indigo-400 text-xs py-3">TOTAL NET AMT</th>
        <th scope="col" class="w-24 text-slate-400 text-xs py-3">STATUS</th>
        <th scope="col" class="w-24 text-slate-400 text-xs py-3">GENDER</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">NRC NO</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">BANK ACCOUNT</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">PHONE NO</th>
        <th scope="col" class="w-44 text-slate-400 text-xs py-3">EMAIL</th>
        <th scope="col" class="w-28 text-slate-400 text-xs py-3">FUND DATE</th>
        <th scope="col" class="w-32 text-right text-emerald-400 text-xs py-3">UNPAID BONUS</th>
        <th scope="col" class="w-32 text-right text-teal-400 text-xs py-3">UNPAID FUND</th>
        <th scope="col" class="w-24 text-center text-slate-400 text-xs py-3 right-0 sticky bg-[#0c1322] border-l border-slate-800 shadow-lg">ACTION</th>
      </tr>`;
  } else {
    thead.innerHTML = `
      <tr class="bg-[#0e172a]">
        <th scope="col" class="w-12 text-center text-slate-400 text-xs py-3">NO</th>
        <th scope="col" class="w-28 text-slate-400 text-xs py-3">JOIN DATE</th>
        <th scope="col" class="min-w-[200px] text-slate-400 text-xs py-3">STAFF IDNAME</th>
        <th scope="col" class="w-28 text-slate-400 text-xs py-3">EDUCATION</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">POSITION</th>
        <th scope="col" class="w-32 text-right text-indigo-400 text-xs py-3">TOTAL SALARY</th>
        <th scope="col" class="w-36 text-right text-indigo-400 text-xs py-3">TOTAL NET AMT</th>
        <th scope="col" class="w-24 text-slate-400 text-xs py-3">STATUS</th>
        <th scope="col" class="w-24 text-slate-400 text-xs py-3">GENDER</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">NRC NO</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">BANK ACCOUNT</th>
        <th scope="col" class="w-36 text-slate-400 text-xs py-3">PHONE NO</th>
        <th scope="col" class="w-44 text-slate-400 text-xs py-3">EMAIL</th>
        <th scope="col" class="w-24 text-center text-slate-400 text-xs py-3 right-0 sticky bg-[#0c1322] border-l border-slate-800 shadow-lg">ACTION</th>
      </tr>`;
  }
}

async function loadStaffData(useCache = false) {
  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    renderStaffTableHead();

    const res = await callApi('getStaffData', {
      category: gStaffCategory,
      page: gStaffPage,
      limit: gStaffLimit,
      searchVal: gStaffSearch
    });

    if (res && res.success) {
      gStaffData = res.data || [];
      renderStaffKpis(res.stats || {});
      renderStaffTable(gStaffData);
      renderStaffPagination(res.totalRows || 0);
    } else {
      if (typeof showToast === 'function') showToast("ERROR", res.message || "Staff အချက်အလက်များ ရယူ၍ မရပါ။");
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast("ERROR", "ဆာဗာ ချိတ်ဆက်မှု အမှား: " + err.message);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

function renderStaffKpis(stats) {
  const grid = document.getElementById('staff-kpi-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stats-card p-5 rounded-xl flex items-start gap-4">
      <div class="p-3.5 rounded-lg bg-indigo-500/10 text-indigo-400"><i class="fa-solid fa-users text-xl"></i></div>
      <div>
        <p class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Force</p>
        <h3 class="text-base font-extrabold text-white mt-1">${stats.activeCount || 0}</h3>
      </div>
    </div>
    <div class="stats-card p-5 rounded-xl flex items-start gap-4">
      <div class="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-400"><i class="fa-solid fa-money-bill-wave text-xl"></i></div>
      <div>
        <p class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Net Payroll</p>
        <h3 class="text-base font-extrabold text-white mt-1">${(stats.totalNetAmt || 0).toLocaleString()} MMK</h3>
      </div>
    </div>
    <div class="stats-card p-5 rounded-xl flex items-start gap-4">
      <div class="p-3.5 rounded-lg bg-sky-500/10 text-sky-400"><i class="fa-solid fa-mars text-xl"></i></div>
      <div>
        <p class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Male Staff</p>
        <h3 class="text-base font-extrabold text-white mt-1">${stats.maleCount || 0}</h3>
      </div>
    </div>
    <div class="stats-card p-5 rounded-xl flex items-start gap-4">
      <div class="p-3.5 rounded-lg bg-rose-500/10 text-rose-400"><i class="fa-solid fa-venus text-xl"></i></div>
      <div>
        <p class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Female Staff</p>
        <h3 class="text-base font-extrabold text-white mt-1">${stats.femaleCount || 0}</h3>
      </div>
    </div>
  `;
}

function renderStaffTable(rawData) {
  const tbody = document.getElementById('staff-table-body');
  if (!tbody) return;

  const data = filterStaffData(rawData, gStaffSearch);

  if (!data || data.length === 0) {
    const colSpan = (gStaffCategory === 'Full Time') ? 23 : 14;
    tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center py-8 text-slate-500 font-bold">ရှာဖွေမှုနှင့် ကိုက်ညီသော Staff စာရင်း မရှိပါ။</td></tr>`;
    return;
  }

  if (gStaffCategory === 'Full Time') {
    tbody.innerHTML = data.map((item, idx) => `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="text-center text-slate-400 py-3">${item.no || (idx + 1)}</td>
        <td class="font-mono text-slate-300 py-3">${item.joinDate || ''}</td>
        <td class="font-bold text-white py-3">${item.staffIdName || item.name}</td>
        <td class="text-slate-300 py-3">${item.education || ''}</td>
        <td class="text-indigo-300 font-semibold py-3">${item.position || ''}</td>
        <td class="font-bold text-amber-400 py-3">${item.salaryGrade || 'Non'}</td>
        <td class="text-right font-bold text-slate-200 py-3">${item.workingDays || 0}</td>
        <td class="text-right font-bold text-emerald-400 py-3">${(item.basicAmt || 0).toLocaleString()}</td>
        <td class="text-right font-bold text-rose-400 py-3">${(item.extraAmt || 0).toLocaleString()}</td>
        <td class="text-right font-bold text-slate-200 py-3">${(item.totalSalary || 0).toLocaleString()}</td>
        <td class="text-right font-bold text-emerald-400 py-3">${(item.bonus || 0).toLocaleString()}</td>
        <td class="text-right font-bold text-teal-400 py-3">${(item.fund || 0).toLocaleString()}</td>
        <td class="text-right font-extrabold text-indigo-400 py-3">${(item.totalNetAmt || 0).toLocaleString()}</td>
        <td class="py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${item.status || 'Active'}</span></td>
        <td class="text-slate-300 py-3">${item.gender || 'Male'}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.nrcNo || ''}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.bankAccount || ''}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.phoneNo || ''}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.email || ''}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.fundDate || ''}</td>
        <td class="text-right font-bold text-emerald-400 py-3">${(item.unpaidBonus || 0).toLocaleString()}</td>
        <td class="text-right font-bold text-teal-400 py-3">${(item.unpaidFund || 0).toLocaleString()}</td>
        <td class="text-center py-3 right-0 sticky bg-[#0c1322] border-l border-slate-800 shadow-lg">
          <div class="flex items-center justify-center gap-2">
            <button onclick="editStaffEntry('${item.uniqueId}')" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded transition" title="Edit Profile"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
            <button onclick="deleteStaffEntry('${item.uniqueId}')" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded transition" title="Delete Profile"><i class="fa-solid fa-trash-can text-xs"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = data.map((item, idx) => `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="text-center text-slate-400 py-3">${item.no || (idx + 1)}</td>
        <td class="font-mono text-slate-300 py-3">${item.joinDate || ''}</td>
        <td class="font-bold text-white py-3">${item.staffIdName || item.name}</td>
        <td class="text-slate-300 py-3">${item.education || ''}</td>
        <td class="text-indigo-300 font-semibold py-3">${item.position || ''}</td>
        <td class="text-right font-bold text-indigo-400 py-3">${(item.totalSalary || 0).toLocaleString()}</td>
        <td class="text-right font-extrabold text-indigo-400 py-3">${(item.totalNetAmt || 0).toLocaleString()}</td>
        <td class="py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${item.status || 'Active'}</span></td>
        <td class="text-slate-300 py-3">${item.gender || 'Male'}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.nrcNo || ''}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.bankAccount || ''}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.phoneNo || ''}</td>
        <td class="font-mono text-xs text-slate-300 py-3">${item.email || ''}</td>
        <td class="text-center py-3 right-0 sticky bg-[#0c1322] border-l border-slate-800 shadow-lg">
          <div class="flex items-center justify-center gap-2">
            <button onclick="editStaffEntry('${item.uniqueId}')" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded transition" title="Edit Profile"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
            <button onclick="deleteStaffEntry('${item.uniqueId}')" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded transition" title="Delete Profile"><i class="fa-solid fa-trash-can text-xs"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

function renderStaffPagination(totalRows) {
  const info = document.getElementById('staff-pagination-info');
  const btnPrev = document.getElementById('staff-btn-prev');
  const btnNext = document.getElementById('staff-btn-next');

  const totalPages = Math.ceil(totalRows / gStaffLimit) || 1;
  if (info) info.textContent = `Showing Page ${gStaffPage} of ${totalPages} (${totalRows} total entries)`;

  if (btnPrev) btnPrev.disabled = (gStaffPage <= 1);
  if (btnNext) btnNext.disabled = (gStaffPage >= totalPages);
}

function changePageStaff(delta) {
  gStaffPage += delta;
  if (gStaffPage < 1) gStaffPage = 1;
  loadStaffData(false);
}

var searchTimeoutStaff;
function onSearchInputStaff() {
  clearTimeout(searchTimeoutStaff);
  searchTimeoutStaff = setTimeout(() => {
    const input = document.getElementById('staff-search-input');
    gStaffSearch = input ? input.value.trim() : '';
    gStaffPage = 1;
    renderStaffTable(gStaffData);
  }, 200);
}

/**
 * 💡 SALARY GRADE DROPDOWN RENDERER (Strictly Uses Google Sheet Data)
 */
function renderGradeDropdownOptions(selectedValue = 'Non') {
  const gradeSelect = document.getElementById('staff-grade');
  if (!gradeSelect) return;

  const currentVal = selectedValue || gradeSelect.value || 'Non';
  let html = '<option value="Non">Non-Grade</option>';

  const grades = gPayrollSettings.grades || {};

  Object.keys(grades).forEach(g => {
    const keyName = g.startsWith('GRADE') ? g : `GRADE ${g}`;
    const amt = Number(grades[g] || 0);
    html += `<option value="${keyName}">${keyName} (${amt.toLocaleString()} MMK)</option>`;
  });

  gradeSelect.innerHTML = html;
  gradeSelect.value = currentVal;
}

/**
 * 💡 Dynamic Dropdown Population (Pure Google Sheet Dependency)
 */
async function populateDropdownsStaff(selectedValue = 'Non') {
  // 1. Fetch live settings directly from Sheet (FullTime!H1:U2)
  await fetchPayrollSettings();

  // 2. Render Grade Dropdown from Sheet Data
  renderGradeDropdownOptions(selectedValue);

  // 3. Education Dropdown
  const eduSelect = document.getElementById('staff-education');
  if (eduSelect) {
    const edus = window.DROPDOWNS?.staffCommon?.education || ["Non", "Phd", "Master", "Degree", "High Graduate", "Middle", "Primary", "High School"];
    eduSelect.innerHTML = edus.map(e => `<option value="${e}">${e}</option>`).join('');
  }

  // 4. Position Dropdown
  const posSelect = document.getElementById('staff-position');
  if (posSelect) {
    let positions = [];
    if (gStaffCategory === 'Full Time') {
      positions = window.DROPDOWNS?.staffCommon?.fullTimePositions || ["Non", "Admin", "Teacher", "Finance", "Chef"];
    } else {
      positions = window.DROPDOWNS?.staffCommon?.partTimePositions || ["Non", "သင်ကြားရေး", "အခြား နည်းပြဆရာ"];
    }
    posSelect.innerHTML = positions.map(p => `<option value="${p}">${p}</option>`).join('');
  }
}

/**
 * 💡 ON SALARY GRADE CHANGE
 */
function onSalaryGradeChangeStaff() {
  const gradeVal = document.getElementById('staff-grade')?.value || 'Non';
  const basicInput = document.getElementById('staff-basic');

  let basicAmt = 0;
  if (gradeVal !== 'Non' && gPayrollSettings.grades) {
    if (gPayrollSettings.grades[gradeVal] !== undefined) {
      basicAmt = gPayrollSettings.grades[gradeVal];
    } else {
      const cleanKey = gradeVal.replace('GRADE ', '').trim();
      Object.keys(gPayrollSettings.grades).forEach(k => {
        if (k.includes(cleanKey)) basicAmt = gPayrollSettings.grades[k];
      });
    }
  }

  if (basicInput) {
    basicInput.value = (gradeVal === 'Non') ? 0 : basicAmt;
  }

  calculateLiveStaffSalary();
}

function calculateLiveStaffSalary() {
  const basic = parseFloat(document.getElementById('staff-basic')?.value || 0);
  const extra = parseFloat(document.getElementById('staff-extra')?.value || 0);
  const days = parseFloat(document.getElementById('staff-working-days')?.value || 26);
  const isResigned = !!document.getElementById('staff-resigned')?.value;

  const bonusConfig = gPayrollSettings.bonus || 0;
  const fundRateConfig = gPayrollSettings.fundRate || 0;

  const totalSalary = isResigned ? 0 : Math.round((basic + extra) * (days / 26));
  const bonus = isResigned ? 0 : bonusConfig;
  const fund = isResigned ? 0 : Math.round(totalSalary * fundRateConfig);
  const totalNet = totalSalary + bonus + fund;

  const pSalary = document.getElementById('preview-total-salary');
  const pBonus = document.getElementById('preview-bonus');
  const pFund = document.getElementById('preview-fund');
  const pNet = document.getElementById('preview-total-net');

  if (pSalary) pSalary.textContent = `${totalSalary.toLocaleString()} MMK`;
  if (pBonus) pBonus.textContent = `${bonus.toLocaleString()} MMK`;
  if (pFund) pFund.textContent = `${fund.toLocaleString()} MMK`;
  if (pNet) pNet.textContent = `${totalNet.toLocaleString()} MMK`;
}

async function openAddModalStaff() {
  const modal = document.getElementById('staff-modal');
  const form = document.getElementById('staff-form');

  if (form) form.reset();

  const uid = document.getElementById('staff-uniqueId');
  if (uid) uid.value = '';

  const joinDate = document.getElementById('staff-joindate');
  if (joinDate) joinDate.value = new Date().toISOString().slice(0, 10);

  const title = document.getElementById('staff-form-title');
  if (title) title.textContent = `Add ${gStaffCategory} Record`;

  const ftFields = document.getElementById('staff-fulltime-fields');
  const ptFields = document.getElementById('staff-parttime-fields');

  if (gStaffCategory === 'Full Time') {
    if (ftFields) ftFields.classList.remove('hidden');
    if (ptFields) ptFields.classList.add('hidden');
  } else {
    if (ftFields) ftFields.classList.add('hidden');
    if (ptFields) ptFields.classList.remove('hidden');
  }

  if (modal) modal.classList.remove('hidden');

  // Fetch directly from Google Sheet and populate options
  await populateDropdownsStaff('Non');
  calculateLiveStaffSalary();
}

function closeStaffModal() {
  const modal = document.getElementById('staff-modal');
  if (modal) modal.classList.add('hidden');
}

async function editStaffEntry(uniqueId) {
  const item = gStaffData.find(s => s.uniqueId === uniqueId);
  if (!item) return;

  await openAddModalStaff();

  const title = document.getElementById('staff-form-title');
  if (title) title.textContent = `Edit ${gStaffCategory} Record`;

  if (document.getElementById('staff-uniqueId')) document.getElementById('staff-uniqueId').value = item.uniqueId;
  if (document.getElementById('staff-joindate')) document.getElementById('staff-joindate').value = item.joinDate || '';
  if (document.getElementById('staff-name')) document.getElementById('staff-name').value = item.name || '';
  if (document.getElementById('staff-education')) document.getElementById('staff-education').value = item.education || '';
  if (document.getElementById('staff-position')) document.getElementById('staff-position').value = item.position || '';

  if (gStaffCategory === 'Full Time') {
    const gradeVal = item.salaryGrade || 'Non';
    await populateDropdownsStaff(gradeVal);
    if (document.getElementById('staff-grade')) document.getElementById('staff-grade').value = gradeVal;
    if (document.getElementById('staff-working-days')) document.getElementById('staff-working-days').value = item.workingDays || 26;
    if (document.getElementById('staff-basic')) document.getElementById('staff-basic').value = item.basicAmt || 0;
    if (document.getElementById('staff-extra')) document.getElementById('staff-extra').value = item.extraAmt || 0;
  } else {
    if (document.getElementById('staff-total-salary')) document.getElementById('staff-total-salary').value = item.totalSalary || 0;
  }

  if (document.getElementById('staff-nrc')) document.getElementById('staff-nrc').value = item.nrcNo || '';
  if (document.getElementById('staff-bank')) document.getElementById('staff-bank').value = item.bankAccount || '';
  if (document.getElementById('staff-phone')) document.getElementById('staff-phone').value = item.phoneNo || '';
  if (document.getElementById('staff-email')) document.getElementById('staff-email').value = item.email || '';
  if (document.getElementById('staff-resigned')) document.getElementById('staff-resigned').value = item.resignedDate || '';

  calculateLiveStaffSalary();
}

/**
 * 💡 SAVE STAFF FORM
 */
async function saveStaffForm(event) {
  event.preventDefault();

  const uid = document.getElementById('staff-uniqueId')?.value || '';
  const actionName = uid ? 'updateStaffEntry' : 'saveStaffEntry';

  const basic = parseFloat(document.getElementById('staff-basic')?.value || 0);
  const extra = parseFloat(document.getElementById('staff-extra')?.value || 0);
  const days = parseFloat(document.getElementById('staff-working-days')?.value || 26);
  const isResigned = !!document.getElementById('staff-resigned')?.value;

  const bonusConfig = gPayrollSettings.bonus || 0;
  const fundRateConfig = gPayrollSettings.fundRate || 0;

  let totalSalary = 0;
  let bonus = 0;
  let fund = 0;
  let totalNetAmt = 0;

  if (gStaffCategory === 'Full Time') {
    totalSalary = isResigned ? 0 : Math.round((basic + extra) * (days / 26));
    bonus = isResigned ? 0 : bonusConfig;
    fund = isResigned ? 0 : Math.round(totalSalary * fundRateConfig);
    totalNetAmt = totalSalary + bonus + fund;
  } else {
    totalSalary = parseFloat(document.getElementById('staff-total-salary')?.value || 0);
    totalNetAmt = totalSalary;
  }

  const payload = {
    category: gStaffCategory,
    uniqueId: uid,
    joinDate: document.getElementById('staff-joindate')?.value || '',
    name: document.getElementById('staff-name')?.value || '',
    education: document.getElementById('staff-education')?.value || '',
    position: document.getElementById('staff-position')?.value || '',
    salaryGrade: document.getElementById('staff-grade')?.value || 'Non',
    workingDays: days,
    basicAmt: basic,
    extraAmt: extra,
    totalSalary: totalSalary,
    bonus: bonus,
    fund: fund,
    totalNetAmt: totalNetAmt,
    nrcNo: document.getElementById('staff-nrc')?.value || '',
    bankAccount: document.getElementById('staff-bank')?.value || '',
    phoneNo: document.getElementById('staff-phone')?.value || '',
    email: document.getElementById('staff-email')?.value || '',
    resignedDate: document.getElementById('staff-resigned')?.value || ''
  };

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const res = await callApi(actionName, payload);
    if (res && res.success) {
      if (typeof showToast === 'function') showToast("SUCCESS", "ဝန်ထမ်း အချက်အလက်များ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။");
      closeStaffModal();
      loadStaffData(false);
    } else {
      if (typeof showToast === 'function') showToast("ERROR", res.message || "သိမ်းဆည်းမှု မအောင်မြင်ပါ။");
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast("ERROR", "ဆာဗာ ချိတ်ဆက်မှု အမှား: " + err.message);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

async function deleteStaffEntry(uniqueId) {
  if (!confirm("ဤဝန်ထမ်း မှတ်တမ်းအား အပြီးတိုင် ဖျက်သိမ်းလိုပါသလား။")) return;

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const res = await callApi('deleteStaffEntry', {
      uniqueId: uniqueId,
      category: gStaffCategory
    });

    if (res && res.success) {
      if (typeof showToast === 'function') showToast("SUCCESS", "ဝန်ထမ်း မှတ်တမ်းအား အောင်မြင်စွာ ဖျက်သိမ်းပြီးပါပြီ။");
      loadStaffData(false);
    } else {
      if (typeof showToast === 'function') showToast("ERROR", res.message || "ဖျက်သိမ်းမှု မအောင်မြင်ပါ။");
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast("ERROR", "ဆာဗာ ချိတ်ဆက်မှု အမှား: " + err.message);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

function exportToCSVStaff() {
  if (!gStaffData || gStaffData.length === 0) {
    if (typeof showToast === 'function') showToast("ERROR", "ထုတ်ယူရန် မည်သည့် အချက်အလက်မျှ မရှိပါ။");
    return;
  }
  let csv = "NO,JOIN_DATE,STAFF_IDNAME,POSITION,PHONE,STATUS\n";
  gStaffData.forEach(r => {
    csv += `"${r.no}","${r.joinDate}","${r.staffIdName || r.name}","${r.position}","${r.phoneNo}","${r.status}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Staff_${gStaffCategory}_Export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/**
 * 💡 OPEN GRADE EDIT MODAL (Reads Directly from Google Sheet)
 */
async function openGradeModal() {
  const modal = document.getElementById('grade-modal');
  if (modal) modal.classList.remove('hidden');

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    await fetchPayrollSettings();

    const grades = gPayrollSettings.grades || {};

    ['A','B','C','D','E','F','G','H','I','J','K','L'].forEach(letter => {
      const input = document.getElementById(`grade-${letter}`);
      const fullKey = `GRADE ${letter}`;
      if (input) {
        input.value = grades[fullKey] !== undefined ? grades[fullKey] : (grades[letter] || 0);
      }
    });

    const bonusInput = document.getElementById('grade-bonus');
    const fundInput = document.getElementById('grade-fund');
    if (bonusInput) bonusInput.value = gPayrollSettings.bonus || 0;
    if (fundInput) fundInput.value = gPayrollSettings.fundRate || 0;

  } catch (err) {
    console.warn("Grade modal settings fetch warning:", err);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

function closeGradeModal() {
  const modal = document.getElementById('grade-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * 💡 SAVE GRADE FORM (Saves To Google Sheet & Immediately Refreshes Runtime Cache)
 */
async function saveGradeForm(event) {
  event.preventDefault();

  const values = [
    parseFloat(document.getElementById('grade-A')?.value || 0),
    parseFloat(document.getElementById('grade-B')?.value || 0),
    parseFloat(document.getElementById('grade-C')?.value || 0),
    parseFloat(document.getElementById('grade-D')?.value || 0),
    parseFloat(document.getElementById('grade-E')?.value || 0),
    parseFloat(document.getElementById('grade-F')?.value || 0),
    parseFloat(document.getElementById('grade-G')?.value || 0),
    parseFloat(document.getElementById('grade-H')?.value || 0),
    parseFloat(document.getElementById('grade-I')?.value || 0),
    parseFloat(document.getElementById('grade-J')?.value || 0),
    parseFloat(document.getElementById('grade-K')?.value || 0),
    parseFloat(document.getElementById('grade-L')?.value || 0),
    parseFloat(document.getElementById('grade-bonus')?.value || 0),
    parseFloat(document.getElementById('grade-fund')?.value || 0)
  ];

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const res = await callApi('updatePayrollSettings', { values });

    if (res && res.success) {
      if (typeof showToast === 'function') showToast("SUCCESS", "Grade Matrix နှုန်းထားများကို Google Sheet ထဲသို့ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။");
      closeGradeModal();
      
      // Google Sheet မှ တန်ဖိုးအသစ်များကို အချိန်နဲ့တစ်ပြေးညီ ရယူ၍ Dropdown အား ပြန်လည် Render လုပ်ပေးမည်
      await fetchPayrollSettings();
      renderGradeDropdownOptions();
    } else {
      if (typeof showToast === 'function') showToast("ERROR", res.message || "Grade သိမ်းဆည်းမှု မအောင်မြင်ပါ။");
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast("ERROR", "Grade သိမ်းဆည်းမှု အမှား: " + err.message);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

// Global Expose
window.switchStaffCategory = switchStaffCategory;
window.loadStaffData = loadStaffData;
window.onSearchInputStaff = onSearchInputStaff;
window.changePageStaff = changePageStaff;
window.openAddModalStaff = openAddModalStaff;
window.closeStaffModal = closeStaffModal;
window.editStaffEntry = editStaffEntry;
window.saveStaffForm = saveStaffForm;
window.deleteStaffEntry = deleteStaffEntry;
window.exportToCSVStaff = exportToCSVStaff;
window.openGradeModal = openGradeModal;
window.closeGradeModal = closeGradeModal;
window.saveGradeForm = saveGradeForm;
window.onSalaryGradeChangeStaff = onSalaryGradeChangeStaff;
window.calculateLiveStaffSalary = calculateLiveStaffSalary;
