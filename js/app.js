/**
 * GOLDEN ERP SYSTEM - MAIN SPA ROUTER & APPLICATION CONTROLLER
 * File: js/app.js
 * 💡 SECURED: 0ms Instant Router, Cashier Auto-Landing Redirect & Silent Background Sync
 */

window.viewCache = window.viewCache || {};

/**
 * 💡 Universal Category Badge Formatter Across the Entire App
 * Matches Bank Loan, Cash Loan, Adv, Income, Transfer, Opening, Expense, etc. with rich colors
 */
window.formatCategoryBadgeHtml = function(categoryStr) {
  const cat = String(categoryStr || '-').trim();
  if (!cat || cat === '-') return '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700/60">-</span>';

  const lower = cat.toLowerCase();

  // 1. Red / Rose Accent (Bank Loan, Cash Loan, Adv, Advance, Expense, Liabilities)
  if (lower.includes('loan') || lower.includes('adv') || lower.includes('expense') || lower.includes('liability')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/20"><i class="fa-solid fa-triangle-exclamation text-[9px] text-rose-400"></i> ${cat}</span>`;
  }

  // 2. Emerald / Green Accent (Income, Sales, Service, Fee, Tuition)
  if (lower.includes('income') || lower.includes('sale') || lower.includes('service') || lower.includes('fee') || lower.includes('tuition')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/20"><i class="fa-solid fa-circle-arrow-down text-[9px] text-emerald-400"></i> ${cat}</span>`;
  }

  // 3. Sky / Blue Accent (Transfer, Move)
  if (lower.includes('transfer') || lower.includes('move')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-950/20"><i class="fa-solid fa-right-left text-[9px] text-sky-400"></i> ${cat}</span>`;
  }

  // 4. Amber / Gold Accent (Opening, Capital, Balance)
  if (lower.includes('open') || lower.includes('balance') || lower.includes('capital')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/20"><i class="fa-solid fa-vault text-[9px] text-amber-400"></i> ${cat}</span>`;
  }

  // 5. Purple / Indigo Accent (Payroll, Salary, Bonus, Fund, Staff)
  if (lower.includes('payroll') || lower.includes('salary') || lower.includes('bonus') || lower.includes('fund') || lower.includes('staff')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-950/20"><i class="fa-solid fa-user-tag text-[9px] text-purple-400"></i> ${cat}</span>`;
  }

  // 6. Teal / Cyan Accent (Student, Boarder, Uniform, Inventory)
  if (lower.includes('boarder') || lower.includes('student') || lower.includes('uniform') || lower.includes('stock')) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-950/20"><i class="fa-solid fa-tag text-[9px] text-teal-400"></i> ${cat}</span>`;
  }

  // Default fallback badge
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">${cat}</span>`;
};

document.addEventListener('DOMContentLoaded', function () {
  initApp();
});

/**
 * 💡 Initialize ERP Application Shell with Cashier Auto-Landing Support
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

  // 💡 Trigger Background Prefetching for 0ms Instant Navigation
  if (typeof window.prefetchCoreModules === 'function') {
    window.prefetchCoreModules();
  }

  // 💡 CASHIER AUTO-LANDING REDIRECT: Redirect Cashier directly to 'cashier' tab
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
 * Format: "FY 2026-2027 | Sat | 11:34 AM | User: Admin"
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

// 💡 LIVE CLOCK AUTO-UPDATE ENGINE (Every 10 Seconds)
if (!window.headerClockInterval) {
  window.headerClockInterval = setInterval(() => {
    const activeUser = localStorage.getItem('golden_user_name') || localStorage.getItem('golden_user_role') || 'Admin';
    updateHeaderMetadata(activeUser);
  }, 10000);
}

/**
 * 💡 Central Tab & View Router Engine (Instant 0ms Rendering)
 */
async function switchTab(tabId) {
  const token = localStorage.getItem('golden_auth_token');

  if (!token) {
    document.documentElement.className = 'dark not-authed';
    return;
  }

  const viewMap = {
    'dashboard': 'dashboard',
    'bank': 'bank-cash',          // 🔧 FIXED: Changed from 'bank-cash-kit' (file doesn't exist)
    'cash': 'bank-cash',          // 🔧 FIXED: Changed from 'bank-cash-kit' (file doesn't exist)
    'income': 'income',
    'office': 'office-kit',       // 🔧 FIXED: Changed from 'office' (file doesn't exist)
    'kitchen': 'office-kit',      // 🔧 FIXED: Changed from 'office' to use office-kit
    'hr': 'hr',
    'cashier': 'cashier', // 💡 NEW: Cashier Sub-Ledger View
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
    'cashier': 'Cashier Cash Book', // 💡 NEW: Cashier Title
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
    // Only show loading spinner if template is NOT cached yet
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
        // 💡 CASHIER MODULE INITIALIZATION
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

/**
 * 💡 Update Sidebar Active Button State
 */
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
 * 💡 Load Home Dashboard Analytics Data
 */
async function loadDashboardData(isSilent = false, forceRefresh = false) {
  const token = localStorage.getItem('golden_auth_token');
  if (!token) return;

  try {
    if (!isSilent && typeof toggleLoading === 'function') toggleLoading(true);

    const res = await callApi('getDashboardData', { forceRefresh: forceRefresh });

    const d = (res && res.success && res.data) ? res.data : {
      kpi: { totalIncome: 0, totalExpense: 0, netProfit: 0, totalEntries: 0 },
      balances: { bank: 0, cash: 0, office: 0, kitchen: 0, payroll: 0, total: 0 },
      liabilities: { bankLoan: 0, cashLoan: 0, officeLiabilities: 0, hrBonus: 0, hrFund: 0, total: 0 },
      receivables: { advanceSnack: 0, advanceUniform: 0, otherAdvance: 0, total: 0 },
      info: {
        students: { male: 0, female: 0, total: 0 },
        fullTime: { male: 0, female: 0, total: 0 },
        partTime: { male: 0, female: 0, total: 0 }
      }
    };

    // 1. KPI Top Cards
    setElementText('db-total-income', formatMoney(d.kpi?.totalIncome) + ' MMK');
    setElementText('db-total-expense', formatMoney(d.kpi?.totalExpense) + ' MMK');
    setElementText('db-net-profit', formatMoney(d.kpi?.netProfit) + ' MMK');
    setElementText('db-total-entries', formatNumber(d.kpi?.totalEntries));

    // 2. Daily Balances
    setElementText('db-bal-bank', formatMoney(d.balances?.bank) + ' MMK');
    setElementText('db-bal-cash', formatMoney(d.balances?.cash) + ' MMK');
    setElementText('db-bal-office', formatMoney(d.balances?.office) + ' MMK');
    setElementText('db-bal-kitchen', formatMoney(d.balances?.kitchen) + ' MMK');
    setElementText('db-bal-payroll', formatMoney(d.balances?.payroll) + ' MMK');
    setElementText('db-bal-total', formatMoney(d.balances?.total) + ' MMK');

    // 3. Liabilities
    setElementText('db-lia-bank', formatMoney(d.liabilities?.bankLoan) + ' MMK');
    setElementText('db-lia-cash', formatMoney(d.liabilities?.cashLoan) + ' MMK');
    setElementText('db-lia-office', formatMoney(d.liabilities?.officeLiabilities) + ' MMK');
    setElementText('db-lia-bonus', formatMoney(d.liabilities?.hrBonus) + ' MMK');
    setElementText('db-lia-fund', formatMoney(d.liabilities?.hrFund) + ' MMK');
    setElementText('db-lia-total', formatMoney(d.liabilities?.total) + ' MMK');

    // 4. Receivables
    setElementText('db-rec-snack', formatMoney(d.receivables?.advanceSnack) + ' MMK');
    setElementText('db-rec-uniform', formatMoney(d.receivables?.advanceUniform) + ' MMK');
    setElementText('db-rec-other', formatMoney(d.receivables?.otherAdvance) + ' MMK');
    setElementText('db-rec-total', formatMoney(d.receivables?.total) + ' MMK');

    // 5. Active Demographic Info
    setElementText('db-stu-male', formatNumber(d.info?.students?.male));
    setElementText('db-stu-female', formatNumber(d.info?.students?.female));
    setElementText('db-stu-total', formatNumber(d.info?.students?.total));

    setElementText('db-ft-male', formatNumber(d.info?.fullTime?.male));
    setElementText('db-ft-female', formatNumber(d.info?.fullTime?.female));
    setElementText('db-ft-total', formatNumber(d.info?.fullTime?.total));

    setElementText('db-pt-male', formatNumber(d.info?.partTime?.male));
    setElementText('db-pt-female', formatNumber(d.info?.partTime?.female));
    setElementText('db-pt-total', formatNumber(d.info?.partTime?.total));

    const grandMale = (d.info?.students?.male || 0) + (d.info?.fullTime?.male || 0) + (d.info?.partTime?.male || 0);
    const grandFemale = (d.info?.students?.female || 0) + (d.info?.fullTime?.female || 0) + (d.info?.partTime?.female || 0);
    const grandAll = (d.info?.students?.total || 0) + (d.info?.fullTime?.total || 0) + (d.info?.partTime?.total || 0);

    setElementText('db-demo-tot-male', formatNumber(grandMale));
    setElementText('db-demo-tot-female', formatNumber(grandFemale));
    setElementText('db-demo-tot-all', formatNumber(grandAll));

  } catch (err) {
    console.warn("Dashboard loading fallback applied:", err.message);
  } finally {
    if (!isSilent && typeof toggleLoading === 'function') toggleLoading(false);
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
