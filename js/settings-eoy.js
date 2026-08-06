/**
 * GOLDEN ERP SYSTEM - EOY DRIVE BACKUP & SAFE RESET CONTROLLER
 * File: js/settings-eoy.js
 * 💡 Split out of js/settings.js. Handles ONLY the "Drive Backup & Reset System" card:
 *    Step 1: Drive FY-folder backup + Email
 *    Step 2: Sheet-name selection & confirmation (Row 1-5 untouched, guaranteed)
 *    Step 3: Safe data reset (Row 6+ on ledger sheets + matching Home summary blocks)
 *
 * LOAD ORDER: include this file AFTER js/settings.js (or after js/app.bundle.js).
 * It self-wires into the existing loadSettingsData() so no other file needs editing —
 * see hookEoyIntoSettingsLoad() at the bottom.
 */

// 💡 Cache the fetched partial so we don't re-fetch views/settings-eoy.html every time
let __eoyHtmlCache = null;

/**
 * 💡 Fetch & inject views/settings-eoy.html into the <div id="eoy-drive-backup-section">
 * placeholder that should replace the old "ROW 2 - RIGHT: DRIVE BACKUP" card (and the
 * old #drive-reset-modal block) inside views/settings.html.
 */
async function initEoySettingsSection() {
  const mountPoint = document.getElementById('eoy-drive-backup-section');
  if (!mountPoint) {
    // views/settings.html hasn't been updated with the placeholder yet — nothing to do.
    return;
  }

  try {
    if (!__eoyHtmlCache) {
      const res = await fetch('views/settings-eoy.html');
      if (!res.ok) throw new Error(`Failed to load views/settings-eoy.html (${res.status})`);
      __eoyHtmlCache = await res.text();
    }
    mountPoint.innerHTML = __eoyHtmlCache;
  } catch (err) {
    console.error('[EOY Settings] Failed to load settings-eoy.html:', err);
    mountPoint.innerHTML = `<div class="p-4 text-rose-400 text-xs font-bold">EOY Drive Backup & Reset section ကို load လုပ်၍ မရပါ: ${err.message}</div>`;
  }
}

/**
 * 💡 STEP 1: Start the Drive Backup (+ Email) flow, then open the sheet-selection modal
 */
async function startEoyDriveBackupAndResetWorkflow() {
  if (!confirm("Google Drive ထဲသို့ နှစ်အလိုက် ဖိုဒါဖြင့် Backup ဖိုင် ပွားယူ သိမ်းဆည်းရန် သေချာပါသလား။\n(Backup အောင်မြင်မှသာ ဖျက်လိုသော Sheet များကို ရွေးချယ်နိုင်ပါမည်)")) {
    return;
  }

  try {
    if (typeof toggleLoading === 'function') {
      toggleLoading(true, "Google Drive တွင် Backup Copy ကူးယူနေပါသည်။ ကျေးဇူးပြု၍ ခဏစောင့်ပါ...");
    }

    const res = await callApi('createEoyDriveBackup', {});

    if (res && res.success) {
      if (typeof showToast === 'function') {
        showToast("SUCCESS", res.message || "Google Drive Backup အောင်မြင်ပါသည်။");
      }
      openEoyResetModal(res);
    } else {
      throw new Error(res?.message || "Google Drive Backup ကူးယူခြင်း မအောင်မြင်ပါ။");
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

/**
 * 💡 STEP 2 (render): Fill in the backup-confirmed banner inside the modal
 */
function renderEoyResetModalContent(resData = {}) {
  const statusMsg = document.getElementById('eoy-drive-backup-status-msg');
  if (!statusMsg) return;

  const folderTitle = resData.fyFolderName || "FY 2026-2027 CASH BOOK DATA";
  const fileTitle = resData.backupFileName || "";

  statusMsg.innerHTML = `
    <span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono inline-flex items-center gap-1.5">
      <i class="fa-solid fa-folder-closed text-amber-400"></i> ${window.escapeHtml ? escapeHtml(folderTitle) : folderTitle}
    </span>
    ${fileTitle ? `<span class="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg font-mono inline-flex items-center gap-1.5 ml-2"><i class="fa-solid fa-file-csv text-indigo-400"></i> ${window.escapeHtml ? escapeHtml(fileTitle) : fileTitle}</span>` : ''}
  `;
}

/**
 * 💡 STEP 2 (open/close/select-all controls)
 */
function openEoyResetModal(resData = {}) {
  renderEoyResetModalContent(resData);
  const modal = document.getElementById('eoy-reset-modal');
  if (modal) {
    modal.classList.remove('hidden');
    toggleEoyGroupCheckboxes('main', true);
    toggleEoyGroupCheckboxes('cashier', true);
  }
}

function closeEoyResetModal() {
  const modal = document.getElementById('eoy-reset-modal');
  if (modal) modal.classList.add('hidden');
}

function toggleEoyGroupCheckboxes(groupType, isChecked) {
  const selector = groupType === 'main' ? '.cb-eoy-main' : '.cb-eoy-cashier';
  document.querySelectorAll(selector).forEach(cb => { cb.checked = isChecked; });
}

/**
 * 💡 STEP 3: Confirm sheet names, then execute the safe reset
 * (Row 6+ ledger data + the matching Home-sheet summary block for each selected sheet)
 */
async function confirmAndExecuteEoySheetReset() {
  const selectedCbs = document.querySelectorAll('.eoy-sheet-reset-cb:checked');
  const selectedSheets = Array.from(selectedCbs).map(cb => cb.value);

  if (selectedSheets.length === 0) {
    alert("ကျေးဇူးပြု၍ ဒေတာ ရှင်းလင်းရန် အနည်းဆုံး Sheet တစ်ခု ရွေးချယ်ပေးပါ (Main Cash Book သို့မဟုတ် Cashier Cash Book)။");
    return;
  }

  const confirmMsg = `သေချာပါသလား။ ရွေးချယ်ထားသော Sheet (${selectedSheets.join(', ')}) များ၏ Row 6 အောက်ပိုင်း ဒေတာများကို ရှင်းလင်းပြီး Home Sheet ရှိ သက်ဆိုင်ရာ Summary Block ဒေတာများကို Opening Balance အသစ်အဖြစ် Row 6 သို့ Auto ကူးထည့်ပါမည်။\n\n* (Google Drive ထဲတွင် Backup ကူးယူပြီးပါပြီ။ Row 1-5 ၏ Formula/Header များနှင့် Home Sheet ကို လုံးဝ ထိခိုက်မည်မဟုတ်ပါ)`;

  if (!confirm(confirmMsg)) return;

  try {
    if (typeof toggleLoading === 'function') {
      toggleLoading(true, "ရွေးချယ်ထားသော Sheet ဒေတာများကို Row 6 မှ စတင် ရှင်းလင်းနေပါသည်...");
    }

    const res = await callApi('executeEoySafeSheetReset', { sheetsToClear: selectedSheets });

    if (res && res.success) {
      closeEoyResetModal();

      // 💡 Distinguish "fully done" from "cleared, but the Home→Row6 opening
      // balance copy didn't fully complete" — don't silently show green success
      // for the latter, since Row 6 may now be genuinely empty for some sheets.
      const hasIssues = res.hasOpeningBalanceIssues || (Array.isArray(res.openingBalanceMissing) && res.openingBalanceMissing.length > 0);

      if (hasIssues) {
        const missingList = (res.openingBalanceMissing || []).join(', ');
        const errDetail = Array.isArray(res.errors) && res.errors.length > 0 ? '\n\n' + res.errors.join('\n') : '';
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'warning',
            title: 'Row ဖျက်ပြီးပါပြီ — Opening Balance ကူးထည့်ခြင်း မပြည့်စုံပါ',
            text: (res.message || '') + errDetail,
            confirmButtonColor: '#d97706'
          });
        } else {
          alert(`⚠️ (${missingList}) Sheet အတွက် Opening Balance ကူးထည့်ခြင်း မအောင်မြင်ပါ။\n\n${res.message || ''}${errDetail}`);
        }
      } else if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'ဒေတာ ရှင်းလင်းခြင်း အောင်မြင်ပါသည်',
          text: res.message || 'ရွေးချယ်ထားသော Sheet များ၏ ဒေတာများကို အောင်မြင်စွာ ရှင်းလင်းပြီးပါပြီ။',
          confirmButtonColor: '#7e22ce'
        });
      } else if (typeof showToast === 'function') {
        showToast("SUCCESS", res.message || "Sheet ဒေတာများ အောင်မြင်စွာ ရှင်းလင်းပြီးပါပြီ။");
      } else {
        alert(res.message || "Sheet ဒေတာများ အောင်မြင်စွာ ရှင်းလင်းပြီးပါပြီ။");
      }

      // Refresh the Balances Control table + clear stale cache
      if (typeof window.clearAllApiCache === 'function') window.clearAllApiCache();
      if (typeof loadSettingsData === 'function') loadSettingsData(true);
    } else {
      throw new Error(res?.message || "Sheet ဒေတာ ရှင်းလင်းခြင်း မအောင်မြင်ပါ။");
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

/**
 * 💡 Self-wiring: piggyback on the existing loadSettingsData() (defined in js/settings.js)
 * so the settings tab automatically mounts this card without editing js/app.js.
 * Safe to call even if loadSettingsData isn't defined yet (falls back to a no-op wrapper).
 */
(function hookEoyIntoSettingsLoad() {
  const originalLoadSettingsData = window.loadSettingsData;

  window.loadSettingsData = async function (...args) {
    if (typeof originalLoadSettingsData === 'function') {
      await originalLoadSettingsData(...args);
    }
    await initEoySettingsSection();
  };
})();

// 💡 Export to global scope for onclick handlers in views/settings-eoy.html
window.initEoySettingsSection = initEoySettingsSection;
window.startEoyDriveBackupAndResetWorkflow = startEoyDriveBackupAndResetWorkflow;
window.openEoyResetModal = openEoyResetModal;
window.closeEoyResetModal = closeEoyResetModal;
window.toggleEoyGroupCheckboxes = toggleEoyGroupCheckboxes;
window.confirmAndExecuteEoySheetReset = confirmAndExecuteEoySheetReset;
