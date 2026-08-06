/**
 * GOLDEN ERP SYSTEM - SYSTEM SETTINGS & CONTROLS CONTROLLER
 * File: js/settings.js
 * 💡 Balances Control Reader (Home!J4:M10) & Automated Email/Excel Backup System
 */

function formatNumWithCommas(val) {
  if (val === null || val === undefined || val === '') return '0';
  const num = parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return String(val);
  return num.toLocaleString('en-US');
}

/**
 * 💡 1. LOAD SETTINGS DATA (Home!J4:M10 Balances Control)
 */
async function loadSettingsData(forceRefresh = false) {
  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const res = await callApi('getSettingsData', { forceRefresh });

    if (res && res.success && res.balancesControl) {
      renderBalancesControlTable(res.balancesControl);
    } else if (res && res.warning) {
      if (typeof showToast === 'function') showToast("INFO", "Balances Control သတိပေးချက်: " + res.warning);
    }
  } catch (err) {
    console.warn('loadSettingsData error:', err.message);
    if (typeof showToast === 'function') showToast("ERROR", "Balances Control အချက်အလက်များ ရယူ၍ မရပါ: " + err.message);
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

/**
 * 💡 Render Balances Control Comparison Table
 */
function renderBalancesControlTable(bcData) {
  const tbody = document.getElementById('settings-balances-table-body');
  const tfoot = document.getElementById('settings-balances-table-foot');

  if (!tbody) return;

  const dataRows = bcData.data || [];
  const totalRow = bcData.total || [];

  if (!dataRows || dataRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500 italic">Home!J4:M10 တွင် Balances Control အချက်အလက်များ ရှာမတွေ့ပါ။</td></tr>`;
    if (tfoot) tfoot.innerHTML = '';
    return;
  }

  // Render Data Rows (Bank Book, Cash Book, Office Exp Book, Kitchen Exp Book, HR Payroll Exp Book)
  tbody.innerHTML = dataRows.map(r => {
    const bookName = r[0] || '-';
    const accountantAmt = r[1];
    const cashierAmt = r[2];
    const controlAmt = r[3];

    const isNegAcc = String(accountantAmt || '').includes('-') || String(accountantAmt || '').includes('(');
    const isNegCtrl = String(controlAmt || '').includes('-') || String(controlAmt || '').includes('(');

    return `
      <tr class="hover:bg-slate-800/30 transition border-b border-slate-800/40">
        <td class="py-2.5 px-3 font-extrabold text-slate-200">${escapeHtml(bookName)}</td>
        <td class="py-2.5 px-3 text-right font-mono font-bold ${isNegAcc ? 'text-rose-400' : 'text-emerald-400'}">${formatNumWithCommas(accountantAmt)}</td>
        <td class="py-2.5 px-3 text-right font-mono text-slate-300">${formatNumWithCommas(cashierAmt)}</td>
        <td class="py-2.5 px-3 text-right font-mono font-black ${isNegCtrl ? 'text-rose-400' : 'text-indigo-300'}">${formatNumWithCommas(controlAmt)}</td>
      </tr>
    `;
  }).join('');

  // Render Total Row
  if (tfoot && totalRow && totalRow.length > 0) {
    const isNegAccTot = String(totalRow[1] || '').includes('-') || String(totalRow[1] || '').includes('(');
    const isNegCtrlTot = String(totalRow[3] || '').includes('-') || String(totalRow[3] || '').includes('(');

    tfoot.innerHTML = `
      <tr class="bg-indigo-500/10 font-black text-indigo-300 border-t-2 border-indigo-500/30">
        <td class="py-3 px-3 uppercase text-xs tracking-wider text-slate-200">${escapeHtml(totalRow[0] || 'Total')}</td>
        <td class="py-3 px-3 text-right font-mono text-sm ${isNegAccTot ? 'text-rose-400' : 'text-emerald-300'}">${formatNumWithCommas(totalRow[1])}</td>
        <td class="py-3 px-3 text-right font-mono text-slate-300">${formatNumWithCommas(totalRow[2])}</td>
        <td class="py-3 px-3 text-right font-mono text-sm font-black ${isNegCtrlTot ? 'text-rose-400' : 'text-indigo-300'}">${formatNumWithCommas(totalRow[3])}</td>
      </tr>
    `;
  }
}

/**
 * 💡 2. Trigger Manual Spreadsheet Backup (EMAIL REPORT + DIRECT EXCEL DOWNLOAD)
 */
async function triggerManualBackup() {
  if (!confirm("goldeneduprivateschool@gmail.com သို့ အီးမေးလ် အစီရင်ခံစာ ပေးပို့၍ အလိုအလျောက် Excel (.xlsx) Backup ဖိုင် ဒေါင်းလုဒ် ရယူရန် သေချာပါသလား။")) {
    return;
  }

  try {
    if (typeof toggleLoading === 'function') toggleLoading(true);
    const res = await callApi('triggerManualBackup', {});

    if (res && res.success) {
      if (typeof showToast === 'function') {
        showToast("SUCCESS", res.message || "Manual Backup အောင်မြင်စွာ ဆောင်ရွက်ပြီးပါပြီ။");
      }

      // Direct Excel (.xlsx) file download trigger on browser
      const downloadUrl = res.backupUrl || res.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } else {
      throw new Error(res?.message || "Backup ဆောင်ရွက်ခြင်း မအောင်မြင်ပါ။");
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast("ERROR", err.message);
    } else {
      alert("အမှားအယွင်း: " + err.message);
    }
  } finally {
    if (typeof toggleLoading === 'function') toggleLoading(false);
  }
}

// 💡 NOTE: The old "Drive Backup & Reset" workflow (startDriveBackupAndResetWorkflow,
// renderDriveResetModalContent, openDriveResetModal/closeDriveResetModal,
// toggleGroupCheckboxes, confirmAndExecuteSheetReset, and the old #drive-reset-modal
// markup) has been REMOVED from this file. That whole card was split out and replaced by:
//   - js/settings-eoy.js   (controller)
//   - views/settings-eoy.html (card + #eoy-reset-modal markup)
// which is mounted into views/settings.html's #eoy-drive-backup-section placeholder.
// Do not re-add the old functions here — it would just be dead code with no matching UI.

// 💡 Export functions to global window object for app.js integration
window.loadSettingsData = loadSettingsData;
