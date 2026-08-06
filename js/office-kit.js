/**
 * GOLDEN ERP SYSTEM - OFFICE EXPENSE & INVENTORY MODULE 
 * File: js/office.js 
 * 💡 19-Column Schema + Strict Search Criteria + Transfer Auto-Description + Universal Lock Engine + Comma-Safe Uniform Profit Engine
 */

window.OfficeState = {
  page: 1,
  limit: 30,
  totalRows: 0,
  activeData: [],
  searchVal: '',
  stats: { totalIncome: 0, totalExpense: 0, balance: 0 },
  uniformProducts: []
};

window.currentExpenseBook = 'office';

var searchTimeoutOffice = null;

/**
 * 💡 Switch between Office and Kitchen Expense Books
 */
function switchExpenseBook(bookType) {
  window.currentExpenseBook = bookType.toLowerCase();
  loadOfficeData(false);
}

/**
 * 🛠️ 2026-07-30 FIX — Single source of truth for "which book am I actually on".
 * Every place that used to hardcode "Office" (modal title, bookName sent to the
 * server, category/method/transfer dropdown list) now reads this instead, so
 * Kitchen Exp Book entries are saved to Kitchen Exp Book — not Office Exp Book —
 * and the Kitchen-specific category list (Rice & Oil, Fish & meat/Eggs, ...) is
 * shown instead of Office's category list.
 * Uses the same dual check as loadOfficeData() (currentExpenseBook OR
 * AppState.currentModule) so it stays correct no matter which one fired first.
 */
function getExpenseBookContext() {
  const isKitchen = (window.currentExpenseBook === 'kitchen' || window.AppState?.currentModule === 'kitchen');
  return {
    isKitchen,
    bookName: isKitchen ? 'Kitchen Exp Book' : 'Office Exp Book',
    dropdownKey: isKitchen ? 'kitchenExpBook' : 'officeExpBook',
    label: isKitchen ? 'Kitchen' : 'Office'
  };
}

/**
 * 💡 Keeps the "+ Add ... Entry" toolbar button in sync with the current book
 */
function updateOfficeAddButtonLabel() {
  const ctx = getExpenseBookContext();
  const labelEl = document.getElementById('office-add-btn-label');
  if (labelEl) labelEl.innerText = `Add ${ctx.label} Entry`;
}

/**
 * 💡 Safe Comma String Number Parser (Fixes "25,000" -> 25000 Parsing Issue)
 */
function parseCleanNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * 💡 Strict Filter Function for Office Expenses
 */
function filterOfficeData(list = [], searchVal = '', fromDate = '', toDate = '') {
  return list.filter(row => {
    // 1. Date Range Check
    if (typeof window.isDateInRange === 'function') {
      if (!window.isDateInRange(row.date, fromDate, toDate)) return false;
    }

    // 2. Text Search Check
    if (!searchVal || !searchVal.trim()) return true;
    const q = searchVal.trim().toLowerCase();
    const desc = String(row.description || '').toLowerCase();
    const cat = String(row.category || '').toLowerCase();
    const debit = String(row.debit || '');
    const credit = String(row.credit || '');

    return desc.includes(q) || cat.includes(q) || debit.includes(q) || credit.includes(q);
  });
}

function clearDateFilterOffice() {
  const fromEl = document.getElementById('office-date-from');
  const toEl = document.getElementById('office-date-to');
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  onSearchInputOffice();
}

/**
 * 💡 Dropdown Options များကို Config.js မှ Dynamic ဖြည့်ပေးခြင်း
 */
function populateDropdownsOffice() {
  const ctx = getExpenseBookContext();
  const def = (window.DROPDOWNS && window.DROPDOWNS[ctx.dropdownKey]) || {};

  const catSelect = document.getElementById('office-category');
  if (catSelect && def.category) {
    catSelect.innerHTML = def.category.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  const methodSelect = document.getElementById('office-method');
  if (methodSelect && def.method) {
    methodSelect.innerHTML = def.method.map(m => `<option value="${m}">${m}</option>`).join('');
  }

  const transSelect = document.getElementById('office-transfer');
  if (transSelect) {
    if (def.transfer) {
      transSelect.innerHTML = `<option value="">-- No Transfer --</option>` +
        def.transfer.map(t => `<option value="${t}">${t}</option>`).join('');
    } else {
      transSelect.innerHTML = `<option value="">-- No Transfer --</option>`;
    }
  }

  onCategoryChangeOffice();
}

/**
 * 💡 Category ပြောင်းလဲမှုပေါ် မူတည်၍ Form Controls များကို Dynamic ပိတ်/ဖွင့် လုပ်ပေးခြင်း
 */
async function onCategoryChangeOffice() {
  const category = document.getElementById('office-category') ? document.getElementById('office-category').value : '';

  const prodContainer = document.getElementById('office-product-container');
  const profitPreviewContainer = document.getElementById('office-profit-preview-container');
  const qtyPriceContainer = document.getElementById('office-qty-price-container');
  const liabilitiesContainer = document.getElementById('office-liabilities-container');

  const debitInput = document.getElementById('office-debit');
  const creditInput = document.getElementById('office-credit');
  const methodSelect = document.getElementById('office-method');
  const transSelect = document.getElementById('office-transfer');
  const liabilitiesInput = document.getElementById('office-liabilities');

  const isUniform = (category === "Advance Uniform" || category === "Advance Unifrom");
  const isLiabilities = (category === "Liabilities");

  if (isUniform) {
    if (prodContainer) prodContainer.classList.remove('hidden');
    if (profitPreviewContainer) profitPreviewContainer.classList.remove('hidden');
    if (qtyPriceContainer) qtyPriceContainer.classList.remove('hidden');
    if (liabilitiesContainer) liabilitiesContainer.classList.add('hidden');

    if (debitInput) debitInput.disabled = false;
    if (creditInput) creditInput.disabled = false;
    if (methodSelect) methodSelect.disabled = false;
    if (transSelect) transSelect.disabled = false;

    // Fetch and ensure Product ID dropdown options are always built
    await fetchUniformProductsListOffice();
    onProductChangeOffice();
  } 
  else if (isLiabilities) {
    if (prodContainer) prodContainer.classList.add('hidden');
    if (profitPreviewContainer) profitPreviewContainer.classList.add('hidden');
    if (qtyPriceContainer) qtyPriceContainer.classList.add('hidden');
    if (liabilitiesContainer) liabilitiesContainer.classList.remove('hidden');

    if (debitInput) { debitInput.value = 0; debitInput.disabled = true; }
    if (creditInput) { creditInput.value = 0; creditInput.disabled = true; }
    if (methodSelect) methodSelect.disabled = true;
    if (transSelect) { transSelect.value = ""; transSelect.disabled = true; }
  } 
  else {
    if (prodContainer) prodContainer.classList.add('hidden');
    if (profitPreviewContainer) profitPreviewContainer.classList.add('hidden');
    if (qtyPriceContainer) qtyPriceContainer.classList.add('hidden');
    if (liabilitiesContainer) liabilitiesContainer.classList.add('hidden');

    if (debitInput) debitInput.disabled = false;
    if (creditInput) creditInput.disabled = false;
    if (methodSelect) methodSelect.disabled = false;
    if (transSelect) transSelect.disabled = false;
    if (liabilitiesInput) liabilitiesInput.value = 0;
  }
}

/**
 * 💡 Transfer Target ရွေးချယ်ပါက Description တွင် Auto Text ထည့်သွင်းပေးခြင်း
 */
function onTransferTargetChangeOffice() {
  const transSelect = document.getElementById('office-transfer');
  const descInput = document.getElementById('office-description');
  if (!transSelect || !descInput) return;

  const targetBook = transSelect.value;
  if (targetBook && targetBook !== 'None' && targetBook !== '-') {
    descInput.value = `[Transfer to ${targetBook}] `;
  }
}

/**
 * 💡 Uniform Product ID သို့မဟုတ် QTY ပြောင်းလဲပါက Auto Description (- 4Nos) နှင့် Profit Preview Auto တွက်ပေးခြင်း
 */
function onProductChangeOffice() {
  const productId = document.getElementById('office-product-id') ? document.getElementById('office-product-id').value : '';
  const stockBadge = document.getElementById('office-stock-badge');
  const unitEl = document.getElementById('office-unit');
  const unit = parseCleanNum(unitEl ? unitEl.value : 1) || 1;

  if (productId && window.OfficeState.uniformProducts && window.OfficeState.uniformProducts.length > 0) {
    const prod = window.OfficeState.uniformProducts.find(p => String(p.productId).trim() === String(productId).trim());
    if (prod) {
      const descEl = document.getElementById('office-description');
      if (descEl) {
        descEl.value = `${prod.productId} ${prod.productName} ${prod.type || ''} ${prod.size || ''} - ${unit}Nos`.replace(/\s+/g, ' ').trim();
      }

      const unitPriceEl = document.getElementById('office-unit-price');
      if (unitPriceEl && parseCleanNum(unitPriceEl.value) === 0) {
        unitPriceEl.value = parseCleanNum(prod.unitPrice) || 0;
      }

      if (stockBadge) {
        stockBadge.innerText = `Stock: ${prod.currentQty !== undefined ? prod.currentQty : (prod.openingStock || 0)}`;
        stockBadge.classList.remove('hidden');
      }

      calculateDebitOffice();
    }
  } else {
    if (stockBadge) stockBadge.classList.add('hidden');
    const profitDisplayEl = document.getElementById('office-calculated-profit');
    if (profitDisplayEl) profitDisplayEl.innerText = "0 MMK";
  }
}

/**
 * 💡 Debit & Profit Preview Amount Auto တွက်ချက်ပေးခြင်း
 */
function calculateDebitOffice() {
  const categoryEl = document.getElementById('office-category');
  const category = categoryEl ? categoryEl.value : '';

  if (category === "Advance Uniform" || category === "Advance Unifrom") {
    const productId = document.getElementById('office-product-id') ? document.getElementById('office-product-id').value : '';
    const unitEl = document.getElementById('office-unit');
    const unit = parseCleanNum(unitEl ? unitEl.value : 0);
    const unitPrice = parseCleanNum(document.getElementById('office-unit-price')?.value);
    const creditVal = parseCleanNum(document.getElementById('office-credit')?.value);

    // Qty အလိုက် Auto Debit တွက်ပေးခြင်း
    if (creditVal === 0 && document.getElementById('office-debit')) {
      document.getElementById('office-debit').value = unit * unitPrice;
    }

    if (productId && window.OfficeState.uniformProducts && window.OfficeState.uniformProducts.length > 0) {
      const prod = window.OfficeState.uniformProducts.find(p => String(p.productId).trim() === String(productId).trim());
      if (prod) {
        // Description ထဲက Qty ကို Dynamic Update လုပ်ပေးခြင်း
        const descEl = document.getElementById('office-description');
        if (descEl && descEl.value.includes('-')) {
          const baseDesc = descEl.value.split('-')[0].trim();
          descEl.value = `${baseDesc} - ${unit}Nos`;
        }

        const sellingPrice = parseCleanNum(prod.sellingPrice);
        const profitPerUnit = sellingPrice - unitPrice;
        const totalProfit = unit * profitPerUnit;

        const profitDisplayEl = document.getElementById('office-calculated-profit');
        if (profitDisplayEl) {
          profitDisplayEl.innerText = Number(totalProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MMK";
        }
      }
    }
  }
}

/**
 * 💡 Fetch Uniform Product List (Dropdown Options အမြဲပေါ်စေရန် ပြင်ဆင်ထားပါသည်)
 */
async function fetchUniformProductsListOffice() {
  const select = document.getElementById('office-product-id');

  // Cache ရှိပါက Dropdown HTML Options များကို အရင် ရေးဆွဲပေးမည်
  if (window.OfficeState.uniformProducts && window.OfficeState.uniformProducts.length > 0) {
    if (select) {
      select.innerHTML = `<option value="">-- Select Product ID --</option>` +
        window.OfficeState.uniformProducts.map(p => `<option value="${p.productId}">${p.productId} - ${p.productName} (${p.size})</option>`).join('');
    }
    return;
  }

  // Cache မရှိသေးပါက API မှ ဖတ်ယူမည်
  try {
    const res = await callApi('getUniformData', { page: 1, limit: 1000 }, 'GET');
    if (res && res.data) {
      window.OfficeState.uniformProducts = res.data;
      if (select) {
        select.innerHTML = `<option value="">-- Select Product ID --</option>` +
          res.data.map(p => `<option value="${p.productId}">${p.productId} - ${p.productName} (${p.size})</option>`).join('');
      }
    }
  } catch (err) {
    console.warn("Failed to fetch uniform products:", err);
  }
}

async function loadOfficeData(isSilent = false, forceRefresh = false) {
  const state = window.OfficeState;
  const ctx = getExpenseBookContext();
  const bookName = ctx.bookName;

  updateOfficeAddButtonLabel();

  try {
    const cacheKey = `getExpenseData_${JSON.stringify({ bookName, page: state.page, limit: state.limit, searchVal: state.searchVal })}`;
    const hasCache = !forceRefresh && !!window.getApiCache(cacheKey);

    if (!isSilent && !hasCache && typeof toggleLoading === 'function') {
      toggleLoading(true);
    }

    const response = await callApi('getExpenseData', {
      bookName: bookName,
      page: state.page,
      limit: state.limit,
      searchVal: state.searchVal,
      forceRefresh: forceRefresh
    });

    if (response && response.data) {
      state.activeData = response.data;
      state.totalRows = response.totalRows || response.data.length || 0;
      state.stats = response.stats || { totalIncome: 0, totalExpense: 0, balance: 0 };

      updateStatsOffice();
      renderOfficeTable();
      updatePaginationOffice();
    }
  } catch (err) {
    console.error("Error loading Expense data:", err);
  } finally {
    if (!isSilent && typeof toggleLoading === 'function') {
      toggleLoading(false);
    }
  }
}

function updateStatsOffice() {
  const stats = window.OfficeState.stats;
  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

  setT('off-total-income', Number(stats.totalIncome || 0).toLocaleString('en-US') + " MMK");
  setT('off-total-expense', Number(stats.totalExpense || 0).toLocaleString('en-US') + " MMK");
  setT('off-balance', Number(stats.balance || 0).toLocaleString('en-US') + " MMK");
  setT('off-entries-count', window.OfficeState.totalRows.toLocaleString('en-US'));
}

/**
 * 💡 Render Office Table Grid Rows
 */
function renderOfficeTable() {
  const tableBody = document.getElementById('office-table-body');
  if (!tableBody) return;

  const rawData = window.OfficeState.activeData || [];
  const searchVal = window.OfficeState.searchVal || '';

  const fromEl = document.getElementById('office-date-from');
  const toEl = document.getElementById('office-date-to');
  const fromDate = fromEl ? fromEl.value : '';
  const toDate = toEl ? toEl.value : '';

  const data = filterOfficeData(rawData, searchVal, fromDate, toDate);

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="16" class="text-center py-8 text-slate-500 font-bold">ရှာဖွေမှုနှင့် ကိုက်ညီသော စာရင်း မရှိပါ။</td></tr>`;
    return;
  }

  const userRole = (window.AppState ? window.AppState.currentUserRole : 'Viewer');
  const isViewer = (userRole === "Viewer");

  tableBody.innerHTML = data.map((row) => {
    let displayDate = row.date || "";
    if (displayDate) {
      let parts = displayDate.split('-');
      if (parts.length === 3) displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const lockClass = (row.isLocked || isViewer) ? "opacity-30 cursor-not-allowed pointer-events-none" : "hover:text-white";
    const lockTitle = row.isLocked ? "Locked (Must be edited from Source Book)" : "";

    return `
      <tr class="hover:bg-slate-800/20 text-slate-300">
        <td class="text-center font-mono font-semibold text-slate-500">${row.no || '-'}</td>
        <td class="font-mono text-xs">${escapeHtml(displayDate)}</td>
        <td>${typeof window.formatCategoryBadgeHtml === 'function' ? window.formatCategoryBadgeHtml(row.category) : escapeHtml(row.category)}</td>
        <td class="min-w-[280px] max-w-md truncate" title="${escapeHtml(row.description)}">${escapeHtml(row.description)}</td>
        <td class="text-right font-mono">${row.unit || '0'}</td>
        <td class="text-right font-mono">${Number(row.unitPrice || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="font-bold">${escapeHtml(row.method) || '-'}</td>
        <td class="text-right text-emerald-400 font-mono font-semibold">${row.debit > 0 ? Number(row.debit).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
        <td class="text-right text-rose-400 font-mono font-semibold">${row.credit > 0 ? Number(row.credit).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
        <td class="text-right text-slate-400 font-mono font-bold">${Number(row.balances || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-right text-rose-400 font-mono font-bold">${Number(row.liabilities || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-xs text-indigo-400">${escapeHtml(row.transfer) || '-'}</td>
        <td class="font-mono text-xs text-slate-400">${escapeHtml(row.vrNo || '-')}</td>
        <td class="font-mono text-xs">${escapeHtml(row.my || '-')}</td>
        <td class="font-mono text-xs font-bold text-indigo-300">${escapeHtml(row.fy || '-')}</td>
        <td class="right-0 sticky bg-[#0c1322] border-l border-slate-800 shadow-lg text-center">
          <div class="flex items-center justify-center gap-3">
            <button onclick="editOfficeEntry('${row.uniqueId}')" class="text-indigo-400 hover:text-indigo-300 transition ${lockClass}" title="${lockTitle}" ${row.isLocked || isViewer ? 'disabled' : ''}>
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteOfficeEntry('${row.uniqueId}')" class="text-rose-400 hover:text-rose-300 transition ${lockClass}" title="${lockTitle}" ${row.isLocked || isViewer ? 'disabled' : ''}>
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updatePaginationOffice() {
  const state = window.OfficeState;
  const info = document.getElementById('off-pagination-info');
  if (info) {
    const start = state.totalRows === 0 ? 0 : (state.page - 1) * state.limit + 1;
    const end = Math.min(state.page * state.limit, state.totalRows);
    info.innerHTML = `Showing <span class="text-indigo-400 font-extrabold">${start}</span> to <span class="text-indigo-400 font-extrabold">${end}</span> of <span class="text-indigo-400 font-extrabold">${state.totalRows}</span> entries`;
  }

  const prevBtn = document.getElementById('off-btn-prev');
  if (prevBtn) prevBtn.disabled = (state.page === 1);

  const nextBtn = document.getElementById('off-btn-next');
  if (nextBtn) nextBtn.disabled = (state.page * state.limit >= state.totalRows);
}

function changePageOffice(dir) {
  const state = window.OfficeState;
  if (dir === -1 && state.page > 1) {
    state.page--;
    loadOfficeData(false);
  } else if (dir === 1 && (state.page * state.limit) < state.totalRows) {
    state.page++;
    loadOfficeData(false);
  }
}

function onSearchInputOffice() {
  clearTimeout(searchTimeoutOffice);
  searchTimeoutOffice = setTimeout(() => {
    const input = document.getElementById('office-search');
    window.OfficeState.searchVal = input ? input.value.trim() : '';
    window.OfficeState.page = 1;
    renderOfficeTable();
  }, 200);
}

function bindModalOfficeListeners() {
  const unitInput = document.getElementById('office-unit');
  if (unitInput) {
    unitInput.oninput = onProductChangeOffice;
  }

  const unitPriceInput = document.getElementById('office-unit-price');
  if (unitPriceInput) {
    unitPriceInput.oninput = calculateDebitOffice;
  }

  const prodSelect = document.getElementById('office-product-id');
  if (prodSelect) {
    prodSelect.onchange = onProductChangeOffice;
  }
}

function openAddModalOffice() {
  const form = document.getElementById('office-form');
  if (form) form.reset();

  const uidEl = document.getElementById('office-uniqueId');
  if (uidEl) uidEl.value = "";

  const dateEl = document.getElementById('office-date');
  if (dateEl) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  const titleEl = document.getElementById('office-form-title');
  if (titleEl) titleEl.innerText = `Add ${getExpenseBookContext().label} Expense Entry`;

  populateDropdownsOffice();
  bindModalOfficeListeners();

  const modalEl = document.getElementById('office-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function closeOfficeModal() {
  const modalEl = document.getElementById('office-modal');
  if (modalEl) modalEl.classList.add('hidden');
}

function parseLiabilityAmount(val) {
  if (!val) return 0;
  let str = String(val).trim();
  let isNeg = (str.includes('(') && str.includes(')')) || str.startsWith('-');
  let num = parseCleanNum(str);
  return isNeg ? -num : num;
}

/**
 * 💡 Save / Update Office Entry (Calculates and Injects Clean Profit Payload + Triggers Uniform Sync)
 */
async function saveOfficeForm(e) {
  if (e && e.preventDefault) e.preventDefault();

  const uniqueId = document.getElementById('office-uniqueId')?.value || '';
  const isAdd = (!uniqueId);
  const category = document.getElementById('office-category')?.value || '';
  const productId = document.getElementById('office-product-id') ? document.getElementById('office-product-id').value : '';
  const unit = parseCleanNum(document.getElementById('office-unit')?.value);
  const unitPrice = parseCleanNum(document.getElementById('office-unit-price')?.value);

  // 💡 COMMA-SAFE UNIFORM PROFIT CALCULATION FOR PAYLOAD
  let calculatedProfit = 0;
  if ((category === "Advance Uniform" || category === "Advance Unifrom") && productId && window.OfficeState.uniformProducts) {
    const prod = window.OfficeState.uniformProducts.find(p => String(p.productId).trim() === String(productId).trim());
    if (prod) {
      const sellingPrice = parseCleanNum(prod.sellingPrice);
      const profitPerUnit = sellingPrice - unitPrice;
      calculatedProfit = unit * profitPerUnit;
    }
  }

  const entry = {
    uniqueId: uniqueId,
    date: document.getElementById('office-date')?.value || '',
    category: category,
    id: productId,
    unit: unit,
    unitPrice: unitPrice,
    profit: calculatedProfit,
    method: document.getElementById('office-method')?.value || 'Cash',
    debit: parseCleanNum(document.getElementById('office-debit')?.value),
    credit: parseCleanNum(document.getElementById('office-credit')?.value),
    liabilities: parseLiabilityAmount(document.getElementById('office-liabilities')?.value),
    transfer: document.getElementById('office-transfer')?.value || '',
    description: document.getElementById('office-description')?.value || '',
    bookName: getExpenseBookContext().bookName,
    createdBy: (window.AppState && window.AppState.currentUser) ? window.AppState.currentUser : "System"
  };

  closeOfficeModal();
  const action = isAdd ? 'saveExpenseEntry' : 'updateExpenseEntry';
  if (typeof showToast === 'function') showToast("SUCCESS", "စာရင်းအား သိမ်းဆည်းနေပါသည်...");
  if (typeof toggleLoading === 'function') toggleLoading(true);

  try {
    const response = await callApi(action, entry);
    if (typeof toggleLoading === 'function') toggleLoading(false);

    if (response && response.success) {
      if (typeof showToast === 'function') {
        const label = getExpenseBookContext().label;
        showToast("SUCCESS", isAdd ? `${label} Expense စာရင်းသစ် အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။` : `${label} Expense စာရင်း အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။`);
      }
      if (window.BankCache) window.BankCache = { bank: null, cash: null, kitchen: null };
      
      // 💡 Advance Uniform ဖြစ်ပါက Uniform Ledger Cache ကိုပါ သန့်ရှင်းပြီး Sync လုပ်ပေးမည်
      if (category === "Advance Uniform" || category === "Advance Unifrom") {
        window.OfficeState.uniformProducts = [];
        if (typeof window.loadUniformData === 'function') {
          window.loadUniformData(true);
        }
      }

      loadOfficeData(true);
    } else {
      if (typeof showToast === 'function') showToast("ERROR", "မအောင်မြင်ပါ: " + (response ? response.message : ""));
    }
  } catch (err) {
    if (typeof toggleLoading === 'function') toggleLoading(false);
    if (typeof showToast === 'function') showToast("ERROR", "ဆာဗာချိတ်ဆက်မှု အမှား- " + err.message);
  }
}

function editOfficeEntry(uniqueId) {
  const row = window.OfficeState.activeData.find(item => item.uniqueId === uniqueId);
  if (!row) {
    if (typeof showToast === 'function') showToast("ERROR", "မူရင်းဒေတာကို ရှာမတွေ့ပါ။");
    return;
  }

  openAddModalOffice();

  const uidEl = document.getElementById('office-uniqueId');
  if (uidEl) uidEl.value = row.uniqueId;

  const dateEl = document.getElementById('office-date');
  if (dateEl) dateEl.value = row.date;

  const catEl = document.getElementById('office-category');
  if (catEl) catEl.value = row.category;
  
  onCategoryChangeOffice();

  if (document.getElementById('office-product-id')) document.getElementById('office-product-id').value = row.id || "";
  if (document.getElementById('office-unit')) document.getElementById('office-unit').value = row.unit || 1;
  if (document.getElementById('office-unit-price')) document.getElementById('office-unit-price').value = row.unitPrice || 0;
  
  const methodEl = document.getElementById('office-method');
  if (methodEl) methodEl.value = row.method || "Cash";

  const debitEl = document.getElementById('office-debit');
  if (debitEl) debitEl.value = row.debit || 0;

  const creditEl = document.getElementById('office-credit');
  if (creditEl) creditEl.value = row.credit || 0;

  const liabEl = document.getElementById('office-liabilities');
  if (liabEl) liabEl.value = row.liabilities || 0;

  const transferEl = document.getElementById('office-transfer');
  if (transferEl) transferEl.value = row.transfer || "";

  const descEl = document.getElementById('office-description');
  if (descEl) descEl.value = row.description || "";

  const titleEl = document.getElementById('office-form-title');
  if (titleEl) titleEl.innerText = `Edit ${getExpenseBookContext().label} Expense Entry`;
}

async function deleteOfficeEntry(uniqueId) {
  const ctx = getExpenseBookContext();
  if (confirm(`ဤ ${ctx.label} Expense စာရင်းအား အပြီးတိုင် ဖျက်သိမ်းလိုပါသလား။`)) {
    if (typeof showToast === 'function') showToast("SUCCESS", "စာရင်းကို ဖျက်သိမ်းနေပါသည်...");
    if (typeof toggleLoading === 'function') toggleLoading(true);

    try {
      const response = await callApi('deleteExpenseEntry', {
        uniqueId: uniqueId,
        bookName: ctx.bookName
      });

      if (typeof toggleLoading === 'function') toggleLoading(false);

      if (response && response.success) {
        if (typeof showToast === 'function') showToast("SUCCESS", "စာရင်းအား အောင်မြင်စွာ ဖျက်သိမ်းပြီးပါပြီ။");
        if (window.BankCache) window.BankCache = { bank: null, cash: null, kitchen: null };
        loadOfficeData(true);
      } else {
        if (typeof showToast === 'function') showToast("ERROR", "ဖျက်သိမ်းမှု မအောင်မြင်ပါ: " + (response ? response.message : ""));
      }
    } catch (err) {
      if (typeof toggleLoading === 'function') toggleLoading(false);
      if (typeof showToast === 'function') showToast("ERROR", "ဆာဗာချိတ်ဆက်မှု အမှား- " + err.message);
    }
  }
}

function exportToCSVOffice() {
  const data = window.OfficeState.activeData;
  if (!data || data.length === 0) {
    if (typeof showToast === 'function') showToast("ERROR", "ထုတ်ယူရန် မည်သည့်စာရင်းမျှ မရှိပါ။");
    return;
  }

  let csv = "NO,DATE,CATEGORY,DESCRIPTION,UNIT,UNIT PRICE,METHOD,DEBIT,CREDIT,BALANCES,LIABILITIES,TRANSFER,VR NO,MY,FY,UNIQUEID\n";
  data.forEach(row => {
    let desc = `"${(row.description || '').replace(/"/g, '""')}"`;
    let cat = `"${(row.category || '').replace(/"/g, '""')}"`;
    csv += `${row.no || ''},${row.date || ''},${cat},${desc},${row.unit || 0},${row.unitPrice || 0},${row.method || ''},${row.debit || 0},${row.credit || 0},${row.balances || 0},${row.liabilities || 0},${row.transfer || ''},${row.vrNo || ''},${row.my || ''},${row.fy || ''},${row.uniqueId || ''}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `office_expense_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 💡 EXPOSE GLOBALLY
window.loadOfficeData = loadOfficeData;
window.openAddModalOffice = openAddModalOffice;
window.closeOfficeModal = closeOfficeModal;
window.saveOfficeForm = saveOfficeForm;
window.editOfficeEntry = editOfficeEntry;
window.deleteOfficeEntry = deleteOfficeEntry;
window.exportToCSVOffice = exportToCSVOffice;
window.onCategoryChangeOffice = onCategoryChangeOffice;
window.onTransferTargetChangeOffice = onTransferTargetChangeOffice;
window.onProductChangeOffice = onProductChangeOffice;
window.calculateDebitOffice = calculateDebitOffice;
window.onSearchInputOffice = onSearchInputOffice;
window.clearDateFilterOffice = clearDateFilterOffice;
window.changePageOffice = changePageOffice;
window.switchExpenseBook = switchExpenseBook;
window.getExpenseBookContext = getExpenseBookContext;
window.updateOfficeAddButtonLabel = updateOfficeAddButtonLabel;
