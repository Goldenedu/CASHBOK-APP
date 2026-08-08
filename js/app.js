/**
 * GOLDEN ERP SYSTEM - MAIN SPA ROUTER & APPLICATION CONTROLLER (D1 DATABASE EDITION)
 * File: js/app.js
 * 💡 Features: D1 Database Compatible Dashboard Analytics, Salary Grade Matrix Modal Loader & Instant Router
 */

window.viewCache = window.viewCache || {};

/**
 * 💡 Universal Category Badge Formatter Across the Entire App
 */
window.formatCategoryBadgeHtml = function(categoryStr) {
  const cat = String(categoryStr || '-').trim();
  if (!cat || cat === '-') return '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700/60">-</span>';

  const lower = cat.toLowerCase();

  if (lower.includes('loan') || lower.includes('adv') || lower.includes('expense') || lower.includes('liability')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/20"><i class="fa-solid fa-triangle-exclamation text-[9px] text-rose-400"></i> ${cat}</span>`;
  }

  if (lower.includes('income') || lower.includes('sale') || lower.includes('service') || lower.includes('fee') || lower.includes('tuition')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/20"><i class="fa-solid fa-circle-arrow-down text-[9px] text-emerald-400"></i> ${cat}</span>`;
  }

  if (lower.includes('transfer') || lower.includes('move')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-950/20"><i class="fa-solid fa-right-left text-[9px] text-sky-400"></i> ${cat}</span>`;
  }

  if (lower.includes('open') || lower.includes('balance') || lower.includes('capital')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/20"><i class="fa-solid fa-vault text-[9px] text-amber-400"></i> ${cat}</span>`;
  }

  if (lower.includes('payroll') || lower.includes('salary') || lower.includes('bonus') || lower.includes('fund') || lower.includes('staff')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-950/20"><i class="fa-solid fa-user-tag text-[9px] text-purple-400"></i> ${cat}</span>`;
  }

  if (lower.includes('boarder') || lower.includes('student') || lower.includes('uniform') || lower.includes('stock')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-950/20"><i class="fa-solid fa-tag text-[9px] text-teal-400"></i> ${cat}</span>`;
  }

  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">${cat}</span>`;
};

document.addEventListener('DOMContentLoaded', function () {
  initApp();
});

/**
 * 💡 Initialize ERP Application Shell
 */
function initApp() {
  const token = localStorage.getItem('golden_auth_token');
  const user = localStorage.getItem('golden_user_name') || 'User';
  const role = (localStorage.getItem('golden_user_role') || '').trim();

  if (!token) {
    console.log("[InitApp] User is not authenticated. Displaying login screen.");
    document.documentElement.className = 'dark not-authed';
    return;
  }

  document.documentElement.className = 'dark is-authed';
  updateHeaderMetadata(user);

  if (typeof window.prefetchCoreModules === 'function') {
    window.prefetchCoreModules();
  }

  let currentTab = window.AppState ? window.AppState.currentModule : null;

  if (!currentTab) {
    if (role === 'Cashier' || role === 'Main Cashier') {
      currentTab = 'cashier';
    } else {
      currentTab = 'dashboard';
    }
  }

  switchTab(currentTab || 'dashboard');
}

/**
 * 💡 Update Header Metadata Badge Dynamically
 */
function updateHeaderMetadata(username) {
  const metaEl = document.getElementById('live-metadata');
  if (!metaEl) return;

  const activeUser = username || localStorage.getItem('golden_user_name') || localStorage.getItem('golden_user_role') || 'Admin';

  const d = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[d.getDay()];

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

  metaEl.textContent = `FY 2026-2027 | ${dayName} | ${formattedTime} | User: ${activeUser}`;
}

if (!window.headerClockInterval) {
  window.headerClockInterval = setInterval(() => {
    const activeUser = localStorage.getItem('golden_user_name') || localStorage.getItem('golden_user_role') || 'Admin';
    updateHeaderMetadata(activeUser);
  }, 10000);
}

/**
 * 💡 Central Tab & View Router Engine
 */
async function switchTab(tabId) {
  const token = localStorage.getItem('golden_auth_token');

  if (!token) {
    document.documentElement.className = 'dark not-authed';
    return;
  }

  const viewMap = {
    'dashboard': 'dashboard',
    'bank': 'bank-cash',
    'cash': 'bank-cash',
    'income': 'income',
    'office': 'office-kit',
    'kitchen': 'office-kit',
    'hr': 'hr',
    'cashier': 'cashier',
    'student': 'student',
    'uniform': 'uniform',
    'promotion': 'promotion',
    'report-financial': 'reports',
    'report-in-detail': 'reports',
    'report-in-rep': 'reports',
    'report-student': 'reports',
    'report-staff-fund': 'reports-fund',
    'settings': 'settings'
  };

  const titleMap = {
    'dashboard': 'Home Dashboard',
    'bank': 'Main Bank Book',
    'cash': 'Main Cash Book',
    'income': 'Main Income Book',
    'office': 'Office Expense Book',
    'kitchen': 'Kitchen Expense Book',
    'hr': 'HR Payroll Group',
    'cashier': 'Cashier Cash Book',
    'student': 'Student Directory List',
    'uniform': 'Uniform Inventory Ledger',
    'promotion': 'Promotion Fee Rate Matrix',
    'report-financial': 'Financial Statement Report',
    'report-in-detail': 'Income Detail Report (InDetail)',
    'report-in-rep': 'Monthly Income Report (InRep)',
    'report-student': 'Student Demographics Report',
    'report-staff-fund': 'Staff Bonus & Fund Report',
    'settings': 'System Settings & Controls'
  };

  const viewFileName = viewMap[tabId] || 'dashboard';

  updateSidebarHighlight(tabId);

  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = titleMap[tabId] || 'Home Dashboard';
  }

  if (window.AppState) {
    window.AppState.currentModule = tabId;
  }

  const isTemplateCached = !!window.viewCache[viewFileName];

  try {
    if (!isTemplateCached && typeof toggleLoading === 'function') {
      toggleLoading(true);
    }

    let htmlContent = window.viewCache[viewFileName];

    if (!htmlContent) {
      const response = await fetch(`views/${viewFileName}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load view template: views/${viewFileName}.html`);
      }
      htmlContent = await response.text();
      window.viewCache[viewFileName] = htmlContent;
    }

    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = htmlContent;
    }

    await triggerModuleInit(tabId);

  } catch (err) {
    console.error(`[SwitchTab Error] Tab '${tabId}':`, err);
    if (typeof showToast === 'function') {
      showToast("ERROR", "စာမျက်နှာ ခေါ်ယူခြင်း မအောင်မြင်ပါ: " + err.message);
    }
  } finally {
    if (typeof toggleLoading === 'function') {
      toggleLoading(false);
    }
  }
}

/**
 * 💡 Trigger Data Loading & Initialization for Specific Module
 */
async function triggerModuleInit(tabId) {
  try {
    switch (tabId) {
      case 'dashboard':
        await loadDashboardData(false, false);
        break;

      case 'bank':
      case 'cash':
        if (typeof window.switchSubBook === 'function') {
          window.switchSubBook(tabId === 'bank' ? 'Bank' : 'Cash');
        } else if (typeof loadBankCashKitData === 'function') {
          await loadBankCashKitData(false, false);
        }
        break;

      case 'cashier':
        if (typeof window.initCashierView === 'function') {
          window.initCashierView('CABank', false);
        } else if (typeof loadCashierData === 'function') {
          await loadCashierData(false);
        }
        break;

      case 'income':
        if (typeof loadIncomeData === 'function') {
          await loadIncomeData(false);
        }
        break;

      case 'office':
      case 'kitchen':
        if (typeof window.switchExpenseBook === 'function') {
          window.switchExpenseBook(tabId === 'office' ? 'Office' : 'Kitchen');
        } else if (typeof loadOfficeData === 'function') {
          await loadOfficeData(false);
        }
        break;

      case 'hr':
        if (typeof switchHrSubTab === 'function') {
          switchHrSubTab('payroll');
        } else if (typeof loadHrPayrollData === 'function') {
          await loadHrPayrollData(false);
        }
        break;

      case 'student':
        if (typeof loadStudentData === 'function') {
          await loadStudentData(false);
        }
        break;

      case 'uniform':
        if (typeof loadUniformData === 'function') {
          await loadUniformData(false);
        }
        break;

      case 'promotion':
        if (typeof loadPromotionData === 'function') {
          await loadPromotionData(false);
        }
        break;

      case 'report-financial':
        if (typeof showReportPanel === 'function') {
          showReportPanel('panel-report-financial');
        } else if (typeof loadReportFinancialData === 'function') {
          await loadReportFinancialData(false);
        }
        break;

      case 'report-in-detail':
        if (typeof showReportPanel === 'function') {
          showReportPanel('panel-report-income-detail');
        }
        break;

      case 'report-in-rep':
        if (typeof showReportPanel === 'function') {
          showReportPanel('panel-report-monthly-income');
        }
        break;

      case 'report-student':
        if (typeof showReportPanel === 'function') {
          showReportPanel('panel-report-student');
        }
        break;

      case 'report-staff-fund':
        if (typeof loadReportStaffFundData === 'function') {
          await loadReportStaffFundData(false);
        }
        break;

      case 'settings':
        if (typeof loadSettingsData === 'function') {
          await loadSettingsData(false);
        }
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`[ModuleInit Error] Failed to initialize '${tabId}':`, err);
  }
}

function updateSidebarHighlight(activeTabId) {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`btn-${activeTabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

/**
 * 💡 Load Home Dashboard Analytics Data (D1 Database Compatible)
 */
async function loadDashboardData(isSilent = false, forceRefresh = false) {
  const token = localStorage.getItem('golden_auth_token');
  if (!token) return;

  try {
    if (!isSilent && typeof toggleLoading === 'function') toggleLoading(true);

    const res = await callApi('getDashboardData', { forceRefresh: forceRefresh }, 'GET');

    const d = (res && res.success && res.data) ? res.data : {};

    const fin = d.financials || d.kpi || {};
    const bal = d.balances || {};
    const demo = d.demographics || d.info || {};
    const liab = d.liabilities || {};
    const rec = d.receivables || {};

    // 1. KPI Top Cards
    setElementText('db-total-income', formatMoney(fin.totalIncome) + ' MMK');
    setElementText('db-total-expense', formatMoney(fin.totalExpense) + ' MMK');
    setElementText('db-net-profit', formatMoney(fin.netProfit) + ' MMK');
    setElementText('db-total-entries', formatNumber(demo.totalActive || demo.students || 0));

    // 2. Daily Balances
    setElementText('db-bal-bank', formatMoney(bal.bank) + ' MMK');
    setElementText('db-bal-cash', formatMoney(bal.cash) + ' MMK');
    setElementText('db-bal-office', formatMoney(bal.office) + ' MMK');
    setElementText('db-bal-kitchen', formatMoney(bal.kitchen) + ' MMK');
    setElementText('db-bal-payroll', formatMoney(bal.payroll) + ' MMK');
    setElementText('db-bal-total', formatMoney(bal.total) + ' MMK');

    // 3. Liabilities
    setElementText('db-lia-bank', formatMoney(liab.bankLoan) + ' MMK');
    setElementText('db-lia-cash', formatMoney(liab.cashLoan) + ' MMK');
    setElementText('db-lia-office', formatMoney(liab.officeLiabilities) + ' MMK');
    setElementText('db-lia-bonus', formatMoney(liab.hrBonus) + ' MMK');
    setElementText('db-lia-fund', formatMoney(liab.hrFund) + ' MMK');
    setElementText('db-lia-total', formatMoney(liab.total) + ' MMK');

    // 4. Receivables
    setElementText('db-rec-snack', formatMoney(rec.advanceSnack) + ' MMK');
    setElementText('db-rec-uniform', formatMoney(rec.advanceUniform) + ' MMK');
    setElementText('db-rec-other', formatMoney(rec.otherAdvance) + ' MMK');
    setElementText('db-rec-total', formatMoney(rec.total) + ' MMK');

    // 5. Active Demographic Info
    const stuTot = demo.students ?? demo.info?.students?.total ?? 0;
    const ftTot = demo.fullTimeStaff ?? demo.info?.fullTime?.total ?? 0;
    const ptTot = demo.partTimeStaff ?? demo.info?.partTime?.total ?? 0;
    const grandAll = demo.totalActive ?? (stuTot + ftTot + ptTot);

    setElementText('db-stu-total', formatNumber(stuTot));
    setElementText('db-ft-total', formatNumber(ftTot));
    setElementText('db-pt-total', formatNumber(ptTot));
    setElementText('db-demo-tot-all', formatNumber(grandAll));

  } catch (err) {
    console.warn("Dashboard loading fallback applied:", err.message);
  } finally {
    if (!isSilent && typeof toggleLoading === 'function') toggleLoading(false);
  }
}

/**
 * 💡 OPEN SALARY GRADE MATRIX MODAL (D1 DATABASE COMPATIBLE)
 */
async function openGradeModal() {
  const modal = document.getElementById('grade-modal');
  if (modal) modal.classList.remove('hidden');

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const res = await callApi('getPayrollSettings', {}, 'GET');
    if (typeof toggleLoading === 'function') toggleLoading(false);

    if (res && res.data) {
      const d = res.data;
      // D1 Database Field Names: grade_a, grade_b ... bonus_rate, fund_rate
      const gradeKeys = ['A','B','C','D','E','F','G','H','I','J','K','L'];
      gradeKeys.forEach(k => {
        const input = document.getElementById(`grade-${k}`);
        if (input) {
          const val = d[`grade_${k.toLowerCase()}`] ?? d[`grade${k}`] ?? 0;
          input.value = val;
        }
      });

      const bonusInput = document.getElementById('grade-bonus');
      if (bonusInput) bonusInput.value = d.bonus_rate ?? d.bonusRate ?? 0;

      const fundInput = document.getElementById('grade-fund');
      if (fundInput) fundInput.value = d.fund_rate ?? d.fundRate ?? 0.05;
    }
  } catch (err) {
    if (typeof toggleLoading === 'function') toggleLoading(false);
    console.error("Error opening grade modal:", err);
  }
}

function closeGradeModal() {
  const modal = document.getElementById('grade-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * 💡 SAVE SALARY GRADE MATRIX SETTINGS (SAVE TO D1 DATABASE)
 */
async function saveGradeForm(event) {
  if (event && event.preventDefault) event.preventDefault();

  const payload = {
    gradeA: parseFloat(document.getElementById('grade-A')?.value || 0),
    gradeB: parseFloat(document.getElementById('grade-B')?.value || 0),
    gradeC: parseFloat(document.getElementById('grade-C')?.value || 0),
    gradeD: parseFloat(document.getElementById('grade-D')?.value || 0),
    gradeE: parseFloat(document.getElementById('grade-E')?.value || 0),
    gradeF: parseFloat(document.getElementById('grade-F')?.value || 0),
    gradeG: parseFloat(document.getElementById('grade-G')?.value || 0),
    gradeH: parseFloat(document.getElementById('grade-H')?.value || 0),
    gradeI: parseFloat(document.getElementById('grade-I')?.value || 0),
    gradeJ: parseFloat(document.getElementById('grade-J')?.value || 0),
    gradeK: parseFloat(document.getElementById('grade-K')?.value || 0),
    gradeL: parseFloat(document.getElementById('grade-L')?.value || 0),
    bonusRate: parseFloat(document.getElementById('grade-bonus')?.value || 0),
    fundRate: parseFloat(document.getElementById('grade-fund')?.value || 0)
  };

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const res = await callApi('updatePayrollSettings', payload);

    if (res && res.success) {
      if (typeof showToast === 'function') showToast("SUCCESS", "Grade Matrix နှုန်းထားများကို Cloudflare D1 Database ထဲသို့ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။");
      closeGradeModal();
      
      if (typeof fetchPayrollSettings === 'function') {
        await fetchPayrollSettings();
        if (typeof renderGradeDropdownOptions === 'function') renderGradeDropdownOptions();
      }
    } else {
      if (typeof showToast === 'function') showToast("ERROR", (res ? res.message : "") || "Grade သိမ်းဆည်းမှု မအောင်မြင်ပါ။");
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast("ERROR", "Grade သိမ်းဆည်းမှု အမှား: " + err.message);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatMoney(val) {
  const num = typeof cleanNumber === 'function' ? cleanNumber(val) : Number(val) || 0;
  return num.toLocaleString('en-US');
}

function formatNumber(val) {
  const num = typeof cleanNumber === 'function' ? cleanNumber(val) : Number(val) || 0;
  return num.toLocaleString('en-US');
}

window.openGradeModal = openGradeModal;
window.closeGradeModal = closeGradeModal;
window.saveGradeForm = saveGradeForm;
