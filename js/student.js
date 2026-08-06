/**
 * GOLDEN ERP SYSTEM - STUDENT LIST & DEMOGRAPHICS MODULE
 * File: js/student.js
 * 💡 Student Directory with Strict Search Criteria (Name, FYID, ID Only) & Formal Tone
 */

window.StudentState = {
  page: 1,
  limit: 30,
  totalRows: 0,
  activeData: [],
  searchVal: '',
  stats: { totalActive: 0, totalInactive: 0, total: 0 }
};

var searchTimeoutStudent = null;

/**
 * 💡 Strict Search Filter Function for Student Master List
 * Searches strictly by: Student Name (NAME / FYIDNAME), FYID, Student ID.
 * Excluded: Phone, NRC, Parents Name, Address, Remark.
 */
function filterStudentData(list = [], searchVal = '') {
  if (!searchVal || !searchVal.trim()) return list;
  const q = searchVal.trim().toLowerCase();

  return list.filter(row => {
    const nameMatch = String(row.name || '').toLowerCase().includes(q) || String(row.fyidName || '').toLowerCase().includes(q);
    const fyidMatch = String(row.fyid || '').toLowerCase().includes(q);
    const idMatch = String(row.id || '').toLowerCase().includes(q);

    return nameMatch || fyidMatch || idMatch;
  });
}

/**
 * 💡 Load Student List Data
 */
async function loadStudentData(isSilent = false) {
  if (!isSilent && typeof toggleLoading === 'function') toggleLoading(true);

  const state = window.StudentState;

  try {
    const response = await callApi('getStudentData', {
      page: state.page,
      limit: state.limit,
      searchVal: state.searchVal
    }, 'GET');

    if (!isSilent && typeof toggleLoading === 'function') toggleLoading(false);

    if (response && response.data) {
      state.activeData = response.data;
      state.totalRows = response.totalRows || response.data.length || 0;
      state.stats = response.stats || { totalActive: 0, totalInactive: 0, total: 0 };

      updateStatsStudent();
      renderStudentTable();
      updatePaginationStudent();
    }
  } catch (err) {
    if (!isSilent && typeof toggleLoading === 'function') toggleLoading(false);
    console.error("Error loading Student List data:", err);
  }
}

/**
 * 💡 Update Stats Cards
 */
function updateStatsStudent() {
  const stats = window.StudentState.stats;

  const actEl = document.getElementById('stu-total-active');
  if (actEl) actEl.innerText = Number(stats.totalActive || 0).toLocaleString('en-US');

  const inactEl = document.getElementById('stu-total-inactive');
  if (inactEl) inactEl.innerText = Number(stats.totalInactive || 0).toLocaleString('en-US');

  const totEl = document.getElementById('stu-total-students');
  if (totEl) totEl.innerText = Number(stats.total || 0).toLocaleString('en-US');

  const countEl = document.getElementById('stu-entries-count');
  if (countEl) countEl.innerText = window.StudentState.totalRows.toLocaleString('en-US');
}

/**
 * 💡 Render Student Table Grid Rows with Precise Search Filtering & FY Sequence NO
 * 🎯 Criteria: Search ONLY by Student Name (NAME), FYIDNAME, FYID, ID
 */
function renderStudentTable() {
  const tableBody = document.getElementById('student-table-body');
  if (!tableBody) return;

  const rawData = window.StudentState.activeData || [];
  const searchInput = document.getElementById('student-search');
  const searchVal = searchInput ? searchInput.value.trim() : (window.StudentState.searchVal || '');

  // 💡 Client-side Strict Multi-Column Filter (NAME, FYIDNAME, FYID, ID Only)
  const filteredData = filterStudentData(rawData, searchVal);

  if (!filteredData || filteredData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="16" class="text-center py-8 text-slate-500 font-bold">ရှာဖွေမှုနှင့် ကိုက်ညီသော ကျောင်းသား စာရင်း မရှိပါ။</td></tr>`;
    return;
  }

  const isViewer = (window.AppState ? window.AppState.currentUserRole : '') === "Viewer";

  tableBody.innerHTML = filteredData.map((row) => {
    let displayDate = row.date || "";
    if (displayDate) {
      let parts = displayDate.split('-');
      if (parts.length === 3) displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    let displayTransDate = row.transferDate || "";
    if (displayTransDate) {
      let parts = displayTransDate.split('-');
      if (parts.length === 3) displayTransDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const isInactive = (row.status || "").toLowerCase() === "inactive";

    return `
      <tr class="hover:bg-slate-800/20 text-slate-300">
        <td class="text-center font-mono font-semibold text-slate-500">${row.no || '-'}</td>
        <td class="font-mono text-xs">${escapeHtml(displayDate)}</td>
        <td class="font-mono font-bold text-indigo-300">${escapeHtml(row.fy || '-')}</td>
        <td class="font-bold text-slate-200 font-mono">${escapeHtml(row.fyid || '-')}</td>
        <td class="font-bold text-slate-100">${escapeHtml(row.name || '-')}</td>
        <td>${escapeHtml(row.class || '-')}</td>
        <td><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">${escapeHtml(row.category || '-')}</span></td>
        <td>${escapeHtml(row.promo || '-')}</td>
        <td>${escapeHtml(row.stuStatus || '-')}</td>
        <td>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${!isInactive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
            ${escapeHtml(row.status || 'Active')}
          </span>
        </td>
        <td>${escapeHtml(row.gender || '-')}</td>
        <td class="font-mono text-xs">${escapeHtml(displayTransDate || '-')}</td>
        <td>${escapeHtml(row.parentsName || '-')}</td>
        <td class="font-mono text-xs">${escapeHtml(row.phoneNo || '-')}</td>
        <td class="max-w-xs truncate" title="${escapeHtml(row.address || '')}">${escapeHtml(row.address || '-')}</td>
        <td class="right-0 sticky bg-[#0c1322] border-l border-slate-800 shadow-lg text-center">
          <div class="flex items-center justify-center gap-3 ${isViewer ? 'hidden' : ''}">
            <button onclick="editStudentEntry('${row.uniqueId}')" class="text-indigo-400 hover:text-indigo-300 transition" title="Edit Profile">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteStudentEntry('${row.uniqueId}')" class="text-rose-400 hover:text-rose-300 transition" title="Delete Profile">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updatePaginationStudent() {
  const state = window.StudentState;
  const info = document.getElementById('stu-pagination-info');
  if (info) {
    const start = state.totalRows === 0 ? 0 : (state.page - 1) * state.limit + 1;
    const end = Math.min(state.page * state.limit, state.totalRows);
    info.innerHTML = `Showing <span class="text-indigo-400 font-extrabold">${start}</span> to <span class="text-indigo-400 font-extrabold">${end}</span> of <span class="text-indigo-400 font-extrabold">${state.totalRows}</span> entries`;
  }
}

function changePageStudent(dir) {
  const state = window.StudentState;
  if (dir === -1 && state.page > 1) {
    state.page--;
    loadStudentData(false);
  } else if (dir === 1 && (state.page * state.limit) < state.totalRows) {
    state.page++;
    loadStudentData(false);
  }
}

function onSearchInputStudent() {
  clearTimeout(searchTimeoutStudent);
  searchTimeoutStudent = setTimeout(() => {
    const searchInput = document.getElementById('student-search');
    window.StudentState.searchVal = searchInput ? searchInput.value.trim() : '';
    renderStudentTable();
  }, 200);
}

/**
 * 💡 Generate Dynamic FY Dropdown
 */
function populateDynamicFYDropdownStudent(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let currentStartYear = (month < 4) ? year - 1 : year;

  const currentFY = `${currentStartYear}-${currentStartYear + 1}`;
  const prevFY = `${currentStartYear - 1}-${currentStartYear}`;
  const nextFY = `${currentStartYear + 1}-${currentStartYear + 2}`;

  select.innerHTML = `
    <option value="${prevFY}">${prevFY}</option>
    <option value="${currentFY}" selected>${currentFY}</option>
    <option value="${nextFY}">${nextFY}</option>
  `;
}

/**
 * 💡 Save / Update Student Profile
 */
async function saveStudentForm(e) {
  if (e && e.preventDefault) e.preventDefault();
  closeStudentModal();

  const uniqueId = document.getElementById('stu-uniqueId')?.value || '';
  const isAdd = (!uniqueId);

  const entry = {
    uniqueId: uniqueId,
    id: parseInt(document.getElementById('stu-id')?.value, 10) || "",
    date: document.getElementById('stu-date')?.value || "",
    fy: document.getElementById('stu-fy')?.value || "",
    name: document.getElementById('stu-name')?.value || "",
    class: document.getElementById('stu-class')?.value || "",
    category: document.getElementById('stu-category')?.value || "",
    promo: document.getElementById('stu-promo')?.value || "",
    stuStatus: document.getElementById('stu-stustatus')?.value || "",
    transferDate: document.getElementById('stu-transferdate')?.value || "",
    parentsName: document.getElementById('stu-parents')?.value || "",
    phoneNo: document.getElementById('stu-phone')?.value || "",
    address: document.getElementById('stu-address')?.value || "",
    createdBy: (window.AppState ? window.AppState.currentUser : '') || "System"
  };

  const action = isAdd ? 'saveStudentEntry' : 'updateStudentEntry';
  if (typeof showToast === 'function') showToast("SUCCESS", "ကျောင်းသား အချက်အလက် ထည့်သွင်း/ပြင်ဆင်နေပါသည်...");

  try {
    const response = await callApi(action, entry);
    if (response && response.success) {
      if (typeof showToast === 'function') {
        showToast("SUCCESS", isAdd ? "ကျောင်းသားသစ် မှတ်တမ်း အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။" : "ကျောင်းသား မှတ်တမ်း ပြင်ဆင်ခြင်း အောင်မြင်ပါသည်။");
      }
      loadStudentData(true);
    } else {
      if (typeof showToast === 'function') showToast("ERROR", "သိမ်းဆည်းမှု မအောင်မြင်ပါ: " + (response ? response.message : ""));
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast("ERROR", "ဆာဗာ ချိတ်ဆက်မှု အမှား: " + err.message);
  }
}

function openAddModalStudent() {
  const form = document.getElementById('student-form');
  if (form) form.reset();

  const uidEl = document.getElementById('stu-uniqueId');
  if (uidEl) uidEl.value = "";

  const idEl = document.getElementById('stu-id');
  if (idEl) idEl.value = "";

  const dateEl = document.getElementById('stu-date');
  if (dateEl) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  populateDynamicFYDropdownStudent('stu-fy');

  const modalEl = document.getElementById('student-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function closeStudentModal() {
  const modalEl = document.getElementById('student-modal');
  if (modalEl) modalEl.classList.add('hidden');
}

/**
 * 💡 Edit Student Profile
 */
function editStudentEntry(uniqueId) {
  const row = window.StudentState.activeData.find(item => item.uniqueId === uniqueId);
  if (!row) {
    if (typeof showToast === 'function') showToast("ERROR", "မူရင်း အချက်အလက် ရှာမတွေ့ပါ။");
    return;
  }

  openAddModalStudent();

  const uidEl = document.getElementById('stu-uniqueId');
  if (uidEl) uidEl.value = row.uniqueId;

  const idEl = document.getElementById('stu-id');
  if (idEl) idEl.value = row.id || "";

  const dateEl = document.getElementById('stu-date');
  if (dateEl) dateEl.value = row.date || "";

  const fyEl = document.getElementById('stu-fy');
  if (fyEl) fyEl.value = row.fy || "";

  const nameEl = document.getElementById('stu-name');
  if (nameEl) nameEl.value = row.name || "";

  const classEl = document.getElementById('stu-class');
  if (classEl) classEl.value = row.class || "";

  const catEl = document.getElementById('stu-category');
  if (catEl) catEl.value = row.category || "";

  const promoEl = document.getElementById('stu-promo');
  if (promoEl) promoEl.value = row.promo || "";

  const stuStatusEl = document.getElementById('stu-stustatus');
  if (stuStatusEl) stuStatusEl.value = row.stuStatus || "New Student";

  const transDateEl = document.getElementById('stu-transferdate');
  if (transDateEl) transDateEl.value = row.transferDate || "";

  const parentsEl = document.getElementById('stu-parents');
  if (parentsEl) parentsEl.value = row.parentsName || "";

  const phoneEl = document.getElementById('stu-phone');
  if (phoneEl) phoneEl.value = row.phoneNo || "";

  const addrEl = document.getElementById('stu-address');
  if (addrEl) addrEl.value = row.address || "";
}

/**
 * 💡 Delete Student Entry
 */
async function deleteStudentEntry(uniqueId) {
  if (confirm("ဤ ကျောင်းသား မှတ်တမ်းအား အပြီးတိုင် ဖျက်သိမ်းလိုပါသလား။")) {
    if (typeof showToast === 'function') showToast("SUCCESS", "ကျောင်းသား စာရင်း ဖျက်သိမ်းနေပါသည်...");
    try {
      const response = await callApi('deleteStudentEntry', { uniqueId });
      if (response && response.success) {
        if (typeof showToast === 'function') showToast("SUCCESS", "ကျောင်းသား စာရင်း ဖျက်သိမ်းခြင်း အောင်မြင်ပါသည်။");
        loadStudentData(true);
      } else {
        if (typeof showToast === 'function') showToast("ERROR", "ဖျက်သိမ်းမှု မအောင်မြင်ပါ: " + (response ? response.message : ""));
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast("ERROR", "ဆာဗာ ချိတ်ဆက်မှု အမှား: " + err.message);
    }
  }
}

/**
 * 💡 CSV Export Engine
 */
function exportToCSVStudent() {
  const data = window.StudentState.activeData;
  if (!data || data.length === 0) {
    if (typeof showToast === 'function') showToast("ERROR", "ထုတ်ယူရန် မည်သည့် စာရင်းမျှ မရှိပါ။");
    return;
  }

  let csv = "NO,DATE,FY,ID,FYID,NAME,CLASS,CATEGORY,PROMO,STU STATUS,STATUS,GENDER,TRANSFER DATE,PARENTS NAME,PHONE NO,ADDRESS,UNIQUEID\n";
  data.forEach(row => {
    let name = `"${(row.name || '').replace(/"/g, '""')}"`;
    let parents = `"${(row.parentsName || '').replace(/"/g, '""')}"`;
    let addr = `"${(row.address || '').replace(/"/g, '""')}"`;
    let cls = `"${(row.class || '').replace(/"/g, '""')}"`;
    let cat = `"${(row.category || '').replace(/"/g, '""')}"`;

    csv += `${row.no || ''},${row.date || ''},${row.fy || ''},${row.id || ''},${row.fyid || ''},${name},${cls},${cat},${row.promo || ''},${row.stuStatus || ''},${row.status || ''},${row.gender || ''},${row.transferDate || ''},${parents},${row.phoneNo || ''},${addr},${row.uniqueId || ''}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `student_list_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 💡 EXPOSE GLOBALLY
window.loadStudentData = loadStudentData;
window.openAddModalStudent = openAddModalStudent;
window.closeStudentModal = closeStudentModal;
window.saveStudentForm = saveStudentForm;
window.editStudentEntry = editStudentEntry;
window.deleteStudentEntry = deleteStudentEntry;
window.exportToCSVStudent = exportToCSVStudent;
window.onSearchInputStudent = onSearchInputStudent;
window.changePageStudent = changePageStudent;
