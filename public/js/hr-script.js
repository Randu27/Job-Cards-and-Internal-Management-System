// ============================================================
// HR — Shared Helpers  (loaded on every HR page)
// ============================================================

function showPopup(type, title, message) {
  const existing = document.getElementById("hrPopupOverlay");
  if (existing) existing.remove();
  const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
  const overlay = document.createElement("div");
  overlay.id = "hrPopupOverlay";
  overlay.className = "hr-popup-overlay";
  overlay.innerHTML = `
    <div class="hr-popup ${type}">
      <div class="hr-popup-icon"><i class="bi ${icon}"></i></div>
      <div class="hr-popup-body">
        <div class="hr-popup-title">${title}</div>
        <div class="hr-popup-msg">${message}</div>
      </div>
      <button class="hr-popup-close" id="hrPopupClose"><i class="bi bi-x-lg"></i></button>
    </div>`;
  document.body.appendChild(overlay);
  const timer = setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 4000);
  document.getElementById("hrPopupClose")?.addEventListener("click", () => { clearTimeout(timer); if (overlay.parentNode) overlay.remove(); });
}

function formatDateForDisplay(dateStr) {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }); }
  catch (_) { return dateStr; }
}

function formatStatusForDisplay(s) {
  if (!s) return "—";
  if (s === "FullTime" || s === "fulltime") return "Full Time";
  if (s === "PartTime" || s === "parttime") return "Part Time";
  return s;
}

function formatStatusForDatabase(s) {
  if (!s) return "";
  if (s === "Full Time") return "FullTime";
  if (s === "Part Time") return "PartTime";
  return s;
}

function getStatusBadgeClass(s) {
  return (s||"").toLowerCase() === "fulltime" ? "badge-fulltime" : "badge-parttime";
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

const Validators = {
  name:    v => /^[a-zA-Z\s.\-']{2,}$/.test(v.trim()),
  empId:   v => /^[a-zA-Z0-9\-_]{3,15}$/.test(v.trim()),
  nic:     v => { const n=v.trim().toUpperCase(); return /^[0-9]{9}[VX]$/.test(n)||/^[0-9]{12}$/.test(n); },
  contact: v => { const c=v.trim().replace(/[\s\-]/g,""); return /^(0[1-9][0-9]{7,8}|\+94[1-9][0-9]{8})$/.test(c); },
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  address: v => v.trim().length >= 5,
  date:    v => { if (!v) return false; const d=new Date(v),t=new Date(); t.setHours(23,59,59,999); return d<=t; }
};

function getFirebaseErrorMessage(code) {
  const m = {
    "permission-denied":    "You don't have permission. Please contact your admin.",
    "already-exists":       "This record already exists.",
    "not-found":            "Record not found in the database.",
    "unavailable":          "Service unavailable. Check your internet connection.",
    "storage/unauthorized": "Not authorized to upload images.",
    "storage/canceled":     "Image upload cancelled. Please try again.",
    "storage/unknown":      "Unknown error during image upload.",
    "failed-precondition":  "Operation failed. Please try again.",
    "aborted":              "Operation aborted. Please try again.",
    "deadline-exceeded":    "Request timed out. Check your connection.",
    "resource-exhausted":   "Too many requests. Please wait and try again.",
  };
  return m[code] || `An unexpected error occurred (${code||"unknown"}). Please try again.`;
}


// ============================================================
// ADD EMPLOYEE PAGE
// ============================================================
(function initAddPage() {
  const form = document.getElementById("addEmployeeForm");
  if (!form) return;

  const empName     = document.getElementById("empName");
  const empId       = document.getElementById("empId");
  const empStatus   = document.getElementById("empStatus");
  const empDept     = document.getElementById("empDepartment");
  const empJoinDate = document.getElementById("empJoinDate");
  const empNic      = document.getElementById("empNic");
  const empAddress  = document.getElementById("empAddress");
  const empEmail    = document.getElementById("empEmail");
  const empContact  = document.getElementById("empContact");
  const empRemarks  = document.getElementById("empRemarks");
  const empImage    = document.getElementById("empImage");
  const imagePreview = document.getElementById("imagePreview");

  // Website access toggle
  const hasAccessChk  = document.getElementById("hasAccess");
  const accessSection = document.getElementById("accessSection");
  if (hasAccessChk && accessSection) {
    hasAccessChk.addEventListener("change", function () {
      accessSection.style.display = this.checked ? "block" : "none";
      if (!this.checked) {
        const pwd = document.getElementById("loginPassword");
        const ico = document.getElementById("toggleIcon");
        if (pwd) pwd.type = "password";
        if (ico) { ico.classList.remove("bi-eye"); ico.classList.add("bi-eye-slash"); }
      }
    });
  }

  // Password toggle
  const toggleBtn  = document.getElementById("togglePasswordBtn");
  const loginPwd   = document.getElementById("loginPassword");
  const toggleIcon = document.getElementById("toggleIcon");
  if (toggleBtn && loginPwd) {
    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const hidden = loginPwd.type === "password";
      loginPwd.type = hidden ? "text" : "password";
      if (toggleIcon) { toggleIcon.classList.toggle("bi-eye", hidden); toggleIcon.classList.toggle("bi-eye-slash", !hidden); }
    });
  }

  // Image preview
  if (empImage && imagePreview) {
    empImage.addEventListener("change", function () {
      const file = this.files[0];
      if (file) { const r=new FileReader(); r.onload=e=>{ imagePreview.src=e.target.result; imagePreview.style.display="block"; }; r.readAsDataURL(file); }
      else imagePreview.style.display = "none";
    });
  }

  const markValid   = f => { if(!f)return; f.classList.remove("is-invalid"); f.classList.add("is-valid"); };
  const markInvalid = f => { if(!f)return; f.classList.remove("is-valid"); f.classList.add("is-invalid"); };
  function highlightField(f) { if(!f)return; f.classList.add("is-invalid"); f.classList.remove("is-valid"); f.focus(); f.addEventListener("input",()=>f.classList.remove("is-invalid"),{once:true}); }

  function getValidationError() {
    if (!empName.value.trim())                return { field:empName,     msg:"Please enter the <strong>Employee Name</strong>." };
    if (!Validators.name(empName.value))      return { field:empName,     msg:"<strong>Employee Name</strong> — letters, spaces, dots or hyphens only (min 2 chars)." };
    if (!empId.value.trim())                  return { field:empId,       msg:"Please enter the <strong>Employee ID</strong>." };
    if (!Validators.empId(empId.value))       return { field:empId,       msg:"<strong>Employee ID</strong> must be 3–15 alphanumeric characters." };
    if (!empStatus.value)                     return { field:empStatus,   msg:"Please select an <strong>Employment Status</strong>." };
    if (!empDept.value)                       return { field:empDept,     msg:"Please select a <strong>Department</strong>." };
    if (!empJoinDate.value)                   return { field:empJoinDate, msg:"Please select the <strong>Date Joined</strong>." };
    if (!Validators.date(empJoinDate.value))  return { field:empJoinDate, msg:"<strong>Date Joined</strong> cannot be a future date." };
    if (!empNic.value.trim())                 return { field:empNic,      msg:"Please enter the <strong>NIC</strong> number." };
    if (!Validators.nic(empNic.value))        return { field:empNic,      msg:"<strong>NIC</strong>: old format 9 digits+V/X, or new format 12 digits." };
    if (!empAddress.value.trim())             return { field:empAddress,  msg:"Please enter the <strong>Address</strong>." };
    if (!Validators.address(empAddress.value)) return { field:empAddress, msg:"<strong>Address</strong> must be at least 5 characters." };
    if (!empEmail.value.trim())               return { field:empEmail,    msg:"Please enter the <strong>Email</strong> address." };
    if (!Validators.email(empEmail.value))    return { field:empEmail,    msg:"Please enter a <strong>valid Email</strong> (e.g. name@example.com)." };
    if (!empContact.value.trim())             return { field:empContact,  msg:"Please enter the <strong>Contact Number</strong>." };
    if (!Validators.contact(empContact.value)) return { field:empContact, msg:"<strong>Contact Number</strong>: valid Sri Lankan number (e.g. 0771234567)." };
    return null;
  }

  [[empName,     ()=>empName.value.trim()&&Validators.name(empName.value)],
   [empId,       ()=>empId.value.trim()&&Validators.empId(empId.value)],
   [empJoinDate, ()=>Validators.date(empJoinDate.value)],
   [empNic,      ()=>Validators.nic(empNic.value)],
   [empAddress,  ()=>Validators.address(empAddress.value)],
   [empEmail,    ()=>Validators.email(empEmail.value)],
   [empContact,  ()=>Validators.contact(empContact.value)],
  ].forEach(([el,fn])=>{ if(el) el.addEventListener("blur",()=>fn()?markValid(el):markInvalid(el)); });

  [empStatus,empDept].forEach(el=>{ if(el) el.addEventListener("change",()=>el.value?markValid(el):markInvalid(el)); });

  // Single submit handler
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const err = getValidationError();
    if (err) { highlightField(err.field); showPopup("error","Missing Information",err.msg); return; }

    const hasAccess = !!(hasAccessChk && hasAccessChk.checked);
    if (hasAccess) {
      const role=document.getElementById("jobRole")?.value;
      const lEm=document.getElementById("loginEmail")?.value;
      const lPw=document.getElementById("loginPassword")?.value;
      if (!role||!lEm||!lPw) { showPopup("error","Website Access Incomplete","Please fill in Job Role, Login Email and Password."); return; }
      if (lPw.length<6) { showPopup("error","Weak Password","Login password must be at least 6 characters."); return; }
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const origHTML  = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) { submitBtn.disabled=true; submitBtn.innerHTML=`<span class="spinner-border spinner-border-sm me-2"></span> Saving...`; }

    try {
      let imageUrl = "";
      const file = empImage?.files[0];
      if (file) {
        const ref = firebase.storage().ref("employees/" + empId.value.trim());
        await ref.put(file);
        imageUrl = await ref.getDownloadURL();
      }

      const existing = await firebase.firestore().collection("employees").doc(empId.value.trim()).get();
      if (existing.exists) {
        if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML=origHTML; }
        highlightField(empId);
        showPopup("error","Duplicate Employee ID",`ID <strong>${escapeHtml(empId.value.trim())}</strong> already exists.`); return;
      }

      const data = {
        name:          empName.value.trim(),
        status:        formatStatusForDatabase(empStatus.value),
        department:    empDept.value,
        joinDate:      empJoinDate.value,
        nic:           empNic.value.trim(),
        address:       empAddress.value.trim(),
        email:         empEmail.value.trim(),
        contact:       empContact.value.trim(),
        remarks:       empRemarks?.value.trim() || "",
        image:         imageUrl,
        websiteAccess: hasAccess,
        accessDetails: null,
        createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (hasAccess) {
        const role=document.getElementById("jobRole").value;
        const lEm=document.getElementById("loginEmail").value;
        const lPw=document.getElementById("loginPassword").value;
        try {
          const cred = await firebase.auth().createUserWithEmailAndPassword(lEm, lPw);
          data.accessDetails = { uid: cred.user.uid, role, email: lEm };
        } catch (authErr) {
          if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML=origHTML; }
          showPopup("error","Account Creation Failed", authErr.message||getFirebaseErrorMessage(authErr.code)); return;
        }
      }

      await firebase.firestore().collection("employees").doc(empId.value.trim()).set(data);

      const addedName = empName.value.trim();
      if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML=origHTML; }
      form.reset();
      if (imagePreview) imagePreview.style.display = "none";
      if (accessSection) accessSection.style.display = "none";
      [empName,empId,empStatus,empDept,empJoinDate,empNic,empAddress,empEmail,empContact]
        .forEach(f=>{ if(f) f.classList.remove("is-valid","is-invalid"); });
      showPopup("success","Employee Added!",`<strong>${escapeHtml(addedName)}</strong> has been added to the system.`);

    } catch (error) {
      console.error(error);
      if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML=origHTML; }
      showPopup("error","Something Went Wrong", getFirebaseErrorMessage(error.code));
    }
  });
})();


// ============================================================
// EMPLOYEE DIRECTORY PAGE
// ============================================================
(function initDirectoryPage() {
  if (!document.getElementById("dirList")) return;

  let allEmployees = [];
  let currentEmpId = null;

  const dirList      = document.getElementById("dirList");
  const searchInput  = document.getElementById("dirSearch");
  const filterDept   = document.getElementById("filterDept");
  const filterStatus = document.getElementById("filterStatus");
  const countNum     = document.getElementById("countNum");

  async function loadDirectory() {
    renderSkeletons();
    try {
      const snap = await firebase.firestore().collection("employees").orderBy("name").get();
      allEmployees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyFilters();
    } catch (err) {
      console.error(err);
      dirList.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-wifi-off"></i><p>Could not load employees. Check your connection.</p></div></div>`;
    }
  }

  function renderSkeletons(n=6) {
    dirList.innerHTML = Array.from({length:n},()=>`
      <div class="col-md-6 col-lg-4">
        <div class="skeleton-card">
          <div class="sk-circle"></div>
          <div class="sk-lines"><div class="sk-line"></div><div class="sk-line short"></div></div>
        </div>
      </div>`).join("");
  }

  function applyFilters() {
    const q    = (searchInput?.value||"").trim().toLowerCase();
    const dept = filterDept?.value   || "";
    const stat = filterStatus?.value || "";
    const filtered = allEmployees.filter(e => {
      const matchQ    = !q || ["name","id","email","nic","contact"].some(k=>(e[k]||"").toLowerCase().includes(q));
      const matchDept = !dept || (e.department||"") === dept;
      let   matchStat = !stat;
      if (stat==="Full Time") matchStat = (e.status||"").toLowerCase()==="fulltime";
      if (stat==="Part Time") matchStat = (e.status||"").toLowerCase()==="parttime";
      return matchQ && matchDept && matchStat;
    });
    if (countNum) countNum.textContent = filtered.length;
    renderCards(filtered);
  }

  function renderCards(list) {
    if (!list.length) {
      dirList.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-person-x"></i><p>No employees match your search.</p></div></div>`;
      return;
    }
    dirList.innerHTML = list.map(e => {
      const initial = (e.name||"?")[0].toUpperCase();
      const avatar  = e.image
        ? `<img src="${escapeHtml(e.image)}" class="emp-avatar" alt="${escapeHtml(e.name)}">`
        : `<div class="emp-avatar-placeholder">${initial}</div>`;
      const badge = getStatusBadgeClass(e.status);
      return `
        <div class="col-md-6 col-lg-4">
          <div class="emp-card" onclick="openEmployeeModal('${escapeHtml(e.id)}')">
            ${avatar}
            <div class="emp-card-info">
              <div class="emp-card-name">${escapeHtml(e.name||"—")}</div>
              <div class="emp-card-meta">
                <span><i class="bi bi-hash"></i>${escapeHtml(e.id)}</span>
                <span><i class="bi bi-building"></i>${escapeHtml(e.department||"—")}</span>
              </div>
              <div class="mt-1"><span class="badge-status ${badge}">${escapeHtml(formatStatusForDisplay(e.status))}</span></div>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  window.openEmployeeModal = function (id) {
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;
    currentEmpId = id;
    populateViewMode(emp);
    showViewMode();
    const modal = document.getElementById("empModal");
    if (modal) { modal.style.display="flex"; document.body.style.overflow="hidden"; }
  };

  // ── View mode ────────────────────────────────────────────
  function populateViewMode(emp) {
    const initial = (emp.name||"?")[0].toUpperCase();
    const aw = document.getElementById("modalAvatarWrap");
    if (aw) aw.innerHTML = emp.image
      ? `<img src="${escapeHtml(emp.image)}" class="dir-modal-avatar" alt="${escapeHtml(emp.name)}">`
      : `<div class="dir-modal-avatar-ph">${initial}</div>`;
    const mn = document.getElementById("modalName"); if (mn) mn.textContent = emp.name||"—";
    const ms = document.getElementById("modalSub");  if (ms) ms.textContent = `${emp.id} · ${emp.department||"—"} · ${formatStatusForDisplay(emp.status)}`;

    // Build access display
    let accessVal = "Not Enabled";
    if (emp.websiteAccess && emp.accessDetails) {
      accessVal = `Enabled — Role: ${emp.accessDetails.role} | Login: ${emp.accessDetails.email}`;
    }

    const fields = [
      { label:"Employee ID",    val:emp.id },
      { label:"Status",         val:formatStatusForDisplay(emp.status) },
      { label:"Department",     val:emp.department },
      { label:"Date Joined",    val:formatDateForDisplay(emp.joinDate) },
      { label:"NIC",            val:emp.nic },
      { label:"Contact",        val:emp.contact },
      { label:"Email",          val:emp.email,          full:true },
      { label:"Address",        val:emp.address,        full:true },
      { label:"Remarks",        val:emp.remarks||"—",   full:true },
      { label:"Website Access", val:accessVal,           full:true },
    ];

    // Show reset password button only for employees with access
    const resetBtn = document.getElementById("btnResetPassword");
    if (resetBtn) {
    resetBtn.style.display = (emp.websiteAccess && emp.accessDetails?.email) ? "inline-flex" : "none";
    }

    const grid = document.getElementById("detailGrid");
    if (grid) grid.innerHTML = fields.map(f=>`
      <div class="detail-item ${f.full?"full":""}">
        <label>${f.label}</label>
        <div class="val">${escapeHtml(f.val||"—")}</div>
      </div>`).join("");
  }

  // ── Edit mode ────────────────────────────────────────────
  window.enterEditMode = function () {
    const emp = allEmployees.find(e => e.id === currentEmpId);
    if (!emp) return;

    const set = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||""; };
    set("editName",     emp.name);
    set("editEmpId",    emp.id);
    set("editStatus",   (emp.status||"").toLowerCase()==="fulltime" ? "Full Time" : "Part Time");
    set("editDept",     emp.department);
    set("editJoinDate", emp.joinDate);
    set("editNic",      emp.nic);
    set("editAddress",  emp.address);
    set("editEmail",    emp.email);
    set("editContact",  emp.contact);
    set("editRemarks",  emp.remarks);

    const prev = document.getElementById("editPhotoPreview");
    if (prev) { prev.src = emp.image||"https://via.placeholder.com/60"; prev.style.display="block"; }
    const inp = document.getElementById("editPhotoInput");
    if (inp) { inp.value=""; inp.onchange=function(){ if(this.files[0]&&prev){const r=new FileReader();r.onload=ev=>prev.src=ev.target.result;r.readAsDataURL(this.files[0]);}; }; }

    // Web access section
    const hasAccessEdit = document.getElementById("editHasAccess");
    const accessEditSec = document.getElementById("editAccessSection");
    if (hasAccessEdit) {
      const enabled = !!(emp.websiteAccess && emp.accessDetails);
      hasAccessEdit.checked = enabled;
      if (accessEditSec) accessEditSec.style.display = enabled ? "block" : "none";
      if (enabled && emp.accessDetails) {
        set("editJobRole",    emp.accessDetails.role);
        set("editLoginEmail", emp.accessDetails.email);
        // Leave editLoginPassword blank — only fill if changing
      }
      hasAccessEdit.onchange = function () {
        if (accessEditSec) accessEditSec.style.display = this.checked ? "block" : "none";
      };
    }

    // Edit password toggle
    const editToggleBtn  = document.getElementById("editTogglePasswordBtn");
    const editLoginPwdEl = document.getElementById("editLoginPassword");
    const editToggleIco  = document.getElementById("editToggleIcon");
    if (editToggleBtn && editLoginPwdEl) {
      editToggleBtn.onclick = function (e) {
        e.preventDefault();
        const hidden = editLoginPwdEl.type === "password";
        editLoginPwdEl.type = hidden ? "text" : "password";
        if (editToggleIco) { editToggleIco.classList.toggle("bi-eye",hidden); editToggleIco.classList.toggle("bi-eye-slash",!hidden); }
      };
    }

    showEditMode();
  };

  window.cancelEditMode = function () {
    const emp = allEmployees.find(e => e.id === currentEmpId);
    if (emp) populateViewMode(emp);
    showViewMode(); cancelDelete();
  };

  // ── Reset Password ─────────────────────────────────────────────
window.resetEmployeePassword = async function () {
  const emp = allEmployees.find(e => e.id === currentEmpId);
  if (!emp || !emp.websiteAccess || !emp.accessDetails?.email) {
    showPopup("error", "Cannot Reset Password", "This employee does not have website access.");
    return;
  }

  if (!confirm(`Send password reset email to ${emp.accessDetails.email}?`)) {
    return;
  }

  const resetBtn = document.getElementById("btnResetPassword");
  const origText = resetBtn ? resetBtn.innerHTML : "";

  if (resetBtn) {
    resetBtn.disabled = true;
    resetBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Sending...`;
  }

  try {
    await firebase.auth().sendPasswordResetEmail(emp.accessDetails.email);
    
    showPopup("success", "Reset Email Sent", 
      `Password reset link has been sent to <strong>${escapeHtml(emp.accessDetails.email)}</strong>.<br>The employee can reset their password via the link.`);

  } catch (err) {
    console.error(err);
    showPopup("error", "Reset Failed", getFirebaseErrorMessage(err.code));
  } finally {
    if (resetBtn) {
      resetBtn.disabled = false;
      resetBtn.innerHTML = origText;
    }
  }
};

  // ── Save ─────────────────────────────────────────────────
  window.saveEmployee = async function () {
    const g = id => document.getElementById(id)?.value || "";
    const name=g("editName"), status=g("editStatus"), dept=g("editDept"), joinDate=g("editJoinDate"),
          nic=g("editNic"), address=g("editAddress"), email=g("editEmail"), contact=g("editContact"), remarks=g("editRemarks");

    if (!name.trim()||!Validators.name(name))  return showPopup("error","Validation","<strong>Employee Name</strong> is invalid.");
    if (!status)                               return showPopup("error","Validation","Please select <strong>Employment Status</strong>.");
    if (!dept)                                 return showPopup("error","Validation","Please select a <strong>Department</strong>.");
    if (!joinDate||!Validators.date(joinDate)) return showPopup("error","Validation","<strong>Date Joined</strong> cannot be a future date.");
    if (!Validators.nic(nic))                  return showPopup("error","Validation","<strong>NIC</strong> format is invalid.");
    if (!Validators.address(address))          return showPopup("error","Validation","<strong>Address</strong> must be at least 5 characters.");
    if (!Validators.email(email))              return showPopup("error","Validation","<strong>Email</strong> address is invalid.");
    if (!Validators.contact(contact))          return showPopup("error","Validation","<strong>Contact Number</strong> is not a valid Sri Lankan number.");

    const hasAccessEdit   = document.getElementById("editHasAccess");
    const wantAccess      = !!(hasAccessEdit && hasAccessEdit.checked);
    const editRole        = g("editJobRole");
    const editLoginEm     = g("editLoginEmail");
    const editLoginPw     = document.getElementById("editLoginPassword")?.value || "";
    const existingEmp     = allEmployees.find(e => e.id === currentEmpId);
    const alreadyHadAccess = !!(existingEmp?.websiteAccess && existingEmp?.accessDetails);

    if (wantAccess && !editRole)                             return showPopup("error","Validation","Please select a <strong>Job Role</strong> for website access.");
    if (wantAccess && !editLoginEm)                          return showPopup("error","Validation","Please enter a <strong>Login Email</strong> for website access.");
    if (wantAccess && !alreadyHadAccess && !editLoginPw)     return showPopup("error","Validation","Please enter a <strong>Login Password</strong> for new website access.");
    if (wantAccess && editLoginPw && editLoginPw.length < 6) return showPopup("error","Validation","Login password must be at least 6 characters.");

    const saveBtn = document.getElementById("btnSave");
    if (saveBtn) { saveBtn.disabled=true; saveBtn.innerHTML=`<span class="spinner-border spinner-border-sm me-1"></span> Saving…`; }

    try {
      let imageUrl = existingEmp?.image || "";
      const photoFile = document.getElementById("editPhotoInput")?.files[0];
      if (photoFile) {
        const ref = firebase.storage().ref("employees/" + currentEmpId);
        await ref.put(photoFile);
        imageUrl = await ref.getDownloadURL();
      }

      let accessDetails = existingEmp?.accessDetails || null;
      let websiteAccess = wantAccess;

      if (wantAccess) {
        if (!alreadyHadAccess) {
          // Create new Firebase Auth account
          const cred = await firebase.auth().createUserWithEmailAndPassword(editLoginEm, editLoginPw);
          accessDetails = { uid: cred.user.uid, role: editRole, email: editLoginEm };
        } else {
          // Update role/email (password change requires re-auth — skip silently unless new pw provided)
          accessDetails = { ...existingEmp.accessDetails, role: editRole, email: editLoginEm };
        }
      } else {
        accessDetails = null;
        websiteAccess = false;
      }

      const updated = {
        name: name.trim(), status: formatStatusForDatabase(status), department: dept,
        joinDate, nic: nic.trim(), address: address.trim(), email: email.trim(),
        contact: contact.trim(), remarks: remarks.trim(), image: imageUrl,
        websiteAccess, accessDetails,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await firebase.firestore().collection("employees").doc(currentEmpId).update(updated);
      const idx = allEmployees.findIndex(e => e.id === currentEmpId);
      if (idx !== -1) allEmployees[idx] = { ...allEmployees[idx], ...updated };

      if (saveBtn) { saveBtn.disabled=false; saveBtn.innerHTML=`<i class="bi bi-check-lg me-1"></i>Save Changes`; }
      populateViewMode(allEmployees[idx]);
      showViewMode(); applyFilters();
      showPopup("success","Employee Updated!",`<strong>${escapeHtml(name.trim())}</strong>'s details have been updated.`);

    } catch (err) {
      console.error(err);
      if (saveBtn) { saveBtn.disabled=false; saveBtn.innerHTML=`<i class="bi bi-check-lg me-1"></i>Save Changes`; }
      showPopup("error","Update Failed", err.message||getFirebaseErrorMessage(err.code));
    }
  };

  // ── Delete ───────────────────────────────────────────────
  window.promptDelete = function () {
    const emp = allEmployees.find(e => e.id === currentEmpId);
    const lbl = document.getElementById("deleteNameLabel");
    if (lbl) lbl.textContent = emp ? emp.name : currentEmpId;
    document.getElementById("deleteConfirmBox")?.classList.add("active");
  };
  window.cancelDelete  = function () { document.getElementById("deleteConfirmBox")?.classList.remove("active"); };
  window.confirmDelete = async function () {
    const btn = document.getElementById("confirmDeleteBtn");
    if (btn) { btn.disabled=true; btn.textContent="Deleting…"; }
    try {
      const emp = allEmployees.find(e => e.id === currentEmpId);
      if (emp?.image) { try { await firebase.storage().ref("employees/"+currentEmpId).delete(); } catch(_){} }
      await firebase.firestore().collection("employees").doc(currentEmpId).delete();
      const name = emp?.name || currentEmpId;
      allEmployees = allEmployees.filter(e => e.id !== currentEmpId);
      applyFilters(); closeModal();
      showPopup("success","Employee Deleted",`<strong>${escapeHtml(name)}</strong> has been removed.`);
    } catch (err) {
      console.error(err);
      if (btn) { btn.disabled=false; btn.textContent="Yes, Delete"; }
      showPopup("error","Delete Failed", getFirebaseErrorMessage(err.code));
    }
  };

  function showViewMode() {
    document.getElementById("viewSection")?.classList.remove("hidden");
    document.getElementById("editSection")?.classList.remove("active");
    const e=document.getElementById("btnEdit"),s=document.getElementById("btnSave"),
          c=document.getElementById("btnCancelEdit"),d=document.getElementById("btnDelete");
    if(e)e.style.display=""; if(s)s.style.display="none"; if(c)c.style.display="none"; if(d)d.style.display="";
    cancelDelete();
  }
  function showEditMode() {
    document.getElementById("viewSection")?.classList.add("hidden");
    document.getElementById("editSection")?.classList.add("active");
    const e=document.getElementById("btnEdit"),s=document.getElementById("btnSave"),
          c=document.getElementById("btnCancelEdit"),d=document.getElementById("btnDelete");
    if(e)e.style.display="none"; if(s)s.style.display=""; if(c)c.style.display=""; if(d)d.style.display="none";
    cancelDelete();
  }

  window.closeModal = function () {
    const m = document.getElementById("empModal");
    if (m) m.style.display="none";
    document.body.style.overflow=""; currentEmpId=null; cancelDelete();
  };
  window.handleModalBgClick = function (e) { if(e.target===document.getElementById("empModal")) closeModal(); };
  document.addEventListener("keydown", e=>{ if(e.key==="Escape"){const m=document.getElementById("empModal");if(m&&m.style.display!=="none")closeModal();} });

  if (searchInput)  searchInput.addEventListener("input",   applyFilters);
  if (filterDept)   filterDept.addEventListener("change",   applyFilters);
  if (filterStatus) filterStatus.addEventListener("change", applyFilters);

  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded", loadDirectory);
  else loadDirectory();
})();


// ============================================================
// PRINT REPORT PAGE
// ============================================================
(function initPrintPage() {
  if (!document.getElementById("reportArea")) return;

  const reportArea   = document.getElementById("reportArea");
  const printLoading = document.getElementById("printLoading");
  const printEmpty   = document.getElementById("printEmpty");
  const reportThead  = document.getElementById("reportThead");
  const reportTbody  = document.getElementById("reportTbody");
  const deptFilter   = document.getElementById("printDeptFilter");
  const statusFilter = document.getElementById("printStatusFilter");
  const startDateEl  = document.getElementById("startDateFilter");
  const endDateEl    = document.getElementById("endDateFilter");
  const colToggles   = document.getElementById("colToggles");
  const exportPdfBtn = document.getElementById("exportPdfBtn");
  const reportDate   = document.getElementById("reportDate");

  let allEmployees = [];

  const COLUMNS = [
    {key:"id",         label:"Employee ID", on:true },
    {key:"name",       label:"Name",        on:true },
    {key:"department", label:"Department",  on:true },
    {key:"status",     label:"Status",      on:true },
    {key:"joinDate",   label:"Date Joined", on:true },
    {key:"nic",        label:"NIC",         on:true },
    {key:"contact",    label:"Contact",     on:true },
    {key:"email",      label:"Email",       on:true },
    {key:"address",    label:"Address",     on:false},
    {key:"remarks",    label:"Remarks",     on:false},
  ];

  if (colToggles) {
    COLUMNS.forEach((col,i)=>{
      const lbl=document.createElement("label");
      lbl.className=`print-col-toggle ${col.on?"on":""}`;
      lbl.innerHTML=`<input type="checkbox" ${col.on?"checked":""}> ${col.label}`;
      lbl.querySelector("input").addEventListener("change",function(){ COLUMNS[i].on=this.checked; lbl.classList.toggle("on",this.checked); renderTable(getFiltered()); });
      colToggles.appendChild(lbl);
    });
  }

  function activeCols() { return COLUMNS.filter(c=>c.on); }

  function fmtStatus(s) {
    if (!s) return "—";
    if (s.toLowerCase()==="fulltime") return "Full Time";
    if (s.toLowerCase()==="parttime") return "Part Time";
    return s;
  }

  function getFiltered() {
    const dept  = (deptFilter?.value||"").toLowerCase();
    const stat  = (statusFilter?.value||"").toLowerCase();
    const start = startDateEl?.value ? new Date(startDateEl.value) : null;
    const end   = endDateEl?.value   ? new Date(endDateEl.value+"T23:59:59") : null;
    return allEmployees.filter(emp=>{
      const matchDept = !dept || (emp.department||"").toLowerCase()===dept;
      let matchStat   = !stat;
      if (stat==="fulltime") matchStat = (emp.status||"").toLowerCase()==="fulltime";
      if (stat==="parttime") matchStat = (emp.status||"").toLowerCase()==="parttime";
      let matchDate = true;
      if (emp.joinDate) { const d=new Date(emp.joinDate); if(start&&d<start)matchDate=false; if(end&&d>end)matchDate=false; }
      return matchDept && matchStat && matchDate;
    });
  }

  function updateSummary(list) {
    const ft=list.filter(e=>(e.status||"").toLowerCase()==="fulltime").length;
    const depts=new Set(list.map(e=>e.department).filter(Boolean)).size;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set("pTotal",list.length); set("pFullTime",ft); set("pPartTime",list.length-ft); set("pDepts",depts);
  }

  function renderTable(employees) {
    const cols = activeCols();
    if (reportThead) reportThead.innerHTML=`<tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr>`;
    if (reportTbody) {
      if (!employees.length) { reportTbody.innerHTML=""; if(printEmpty)printEmpty.style.display="block"; }
      else {
        if (printEmpty) printEmpty.style.display="none";
        reportTbody.innerHTML=employees.map(emp=>`<tr>${cols.map(c=>{
          if(c.key==="status"){const ft=(emp.status||"").toLowerCase()==="fulltime";return `<td><span class="report-status-badge ${ft?"active":"inactive"}">${fmtStatus(emp.status)}</span></td>`;}
          return `<td>${escapeHtml(emp[c.key]||"—")}</td>`;
        }).join("")}</tr>`).join("");
      }
    }
    updateSummary(employees);
  }

  async function loadPrintData() {
    if (printLoading) printLoading.style.display="block";
    if (reportArea)   reportArea.style.display="none";
    try {
      const snap = await firebase.firestore().collection("employees").orderBy("name").get();
      allEmployees = snap.docs.map(d=>({id:d.id,...d.data()}));
      if (printLoading) printLoading.style.display="none";
      if (reportArea)   reportArea.style.display="block";
      if (reportDate) reportDate.textContent="Generated: "+new Date().toLocaleString("en-GB",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
      renderTable(getFiltered());
    } catch (err) {
      console.error(err);
      if (printLoading) printLoading.style.display="none";
      if (reportArea)   reportArea.style.display="block";
      if (printEmpty) { printEmpty.style.display="block"; const t=printEmpty.querySelector("h5"); if(t)t.textContent="Failed to load data"; }
    }
  }

  async function generatePDF() {
    if (printLoading) printLoading.style.display="block";
    try {
      const employees = getFiltered();
      if (!employees.length) { alert("No data to generate PDF."); if(printLoading)printLoading.style.display="none"; return; }

      const deptLabel   = deptFilter?.options[deptFilter.selectedIndex]?.text     || "All Departments";
      const statusLabel = statusFilter?.options[statusFilter.selectedIndex]?.text || "All Status";
      const fmtD = ds => ds ? new Date(ds).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : null;
      const sv=startDateEl?.value, ev=endDateEl?.value;
      const timePeriod = sv&&ev?`${fmtD(sv)} — ${fmtD(ev)}`:sv?`From ${fmtD(sv)}`:ev?`Up to ${fmtD(ev)}`:"All Time";

      const {jsPDF} = window.jspdf;
      const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
      const pageW=doc.internal.pageSize.getWidth(), pageH=doc.internal.pageSize.getHeight();

      const drawHeader = title => {
        doc.setFillColor(33,37,41); doc.rect(0,0,pageW,45,"F");
        doc.setTextColor(255,255,255); doc.setFont(undefined,"bold"); doc.setFontSize(22); doc.text("GRAFIX PRINT HUB",14,20);
        doc.setFont(undefined,"normal"); doc.setFontSize(10); doc.text(title,14,30);
        doc.setFontSize(8); doc.setTextColor(200,200,200);
        doc.text(`REPORT TYPE: ${title.toUpperCase()}`,pageW-14,15,{align:"right"});
        doc.setFont(undefined,"bold"); doc.text(`TIME PERIOD: ${timePeriod.toUpperCase()}`,pageW-14,23,{align:"right"});
        doc.setFont(undefined,"normal"); doc.setTextColor(180,180,180); doc.text(`GENERATED: ${new Date().toLocaleString()}`,pageW-14,31,{align:"right"});
        doc.setLineWidth(0.2);
      };

      const drawTable = startY => {
        const cols=activeCols(), colLabels=cols.map(c=>c.label), colKeys=cols.map(c=>c.key);
        const usableW=pageW-28;
        doc.setFontSize(8);
        const nat=colLabels.map((lbl,i)=>{ const hW=doc.getTextWidth(lbl)+6; const cW=employees.reduce((mx,emp)=>{let v=emp[colKeys[i]]||"—";if(colKeys[i]==="status")v=fmtStatus(emp.status);return Math.max(mx,doc.getTextWidth(String(v))+6);},0); return Math.max(hW,cW,18); });
        const tot=nat.reduce((a,b)=>a+b,0), scale=usableW/Math.max(tot,usableW), cw=nat.map(w=>w*scale);
        let cy=startY, cx=14;
        doc.setFontSize(9); doc.setFont(undefined,"bold");
        colLabels.forEach((lbl,i)=>{ doc.setFillColor(52,58,64); doc.setDrawColor(100,100,100); doc.rect(cx,cy,cw[i],10,"FD"); doc.setTextColor(255,255,255); doc.text(lbl,cx+3,cy+6.5); cx+=cw[i]; });
        cy+=10; doc.setFontSize(8); doc.setFont(undefined,"normal");
        employees.forEach((emp,ri)=>{
          let rh=8; colKeys.forEach((k,i)=>{ let v=emp[k]||"—"; if(k==="status")v=fmtStatus(emp.status); rh=Math.max(rh,doc.splitTextToSize(String(v),cw[i]-4).length*5+3); });
          if(cy+rh>pageH-25){ doc.addPage(); drawHeader("Employee Report"); cy=50; cx=14; doc.setFontSize(9); doc.setFont(undefined,"bold"); colLabels.forEach((lbl,i)=>{ doc.setFillColor(52,58,64); doc.setDrawColor(100,100,100); doc.rect(cx,cy,cw[i],10,"FD"); doc.setTextColor(255,255,255); doc.text(lbl,cx+3,cy+6.5); cx+=cw[i]; }); cy+=10; doc.setFontSize(8); doc.setFont(undefined,"normal"); }
          cx=14;
          colKeys.forEach((k,i)=>{ let v=emp[k]||"—"; if(k==="status")v=fmtStatus(emp.status); const lines=doc.splitTextToSize(String(v),cw[i]-4); doc.setFillColor(ri%2===0?245:255,ri%2===0?247:255,ri%2===0?250:255); doc.setDrawColor(210,210,210); doc.rect(cx,cy,cw[i],rh,"FD"); doc.setTextColor(30,30,30); doc.text(lines,cx+3,cy+5); cx+=cw[i]; });
          cy+=rh;
        });
        return cy;
      };

      const drawSummary = y => {
        const ft=employees.filter(e=>(e.status||"").toLowerCase()==="fulltime").length, depts=new Set(employees.map(e=>e.department).filter(Boolean)).size;
        doc.setFontSize(9); doc.setTextColor(0,0,0); doc.setFont(undefined,"bold"); doc.text("REPORT SUMMARY",14,y);
        doc.setFontSize(8); doc.setFont(undefined,"normal");
        doc.text(`• Total Employees: ${employees.length}`,14,y+6); doc.text(`• Full Time: ${ft}`,14,y+12);
        doc.text(`• Part Time: ${employees.length-ft}`,14,y+18); doc.text(`• Departments: ${depts}`,14,y+24);
        doc.setDrawColor(200,200,200); doc.line(14,y+30,pageW-14,y+30); return y+35;
      };

      const addFooter = () => { const total=doc.internal.getNumberOfPages(); for(let i=1;i<=total;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(150,150,150);doc.setFont(undefined,"normal");doc.text(`Grafix Print Hub | Employee Management System | Page ${i} of ${total}`,pageW/2,pageH-10,{align:"center"});} };

      drawHeader("Employee Report");
      const endY = drawTable(50);
      if (endY+40<pageH-20) drawSummary(endY+5); else { doc.addPage(); drawHeader("Employee Report"); drawSummary(50); }
      addFooter();
      doc.save(`Employee_Report_${deptLabel}_${statusLabel}_${Date.now()}.pdf`);

    } catch(err) { console.error("PDF error:",err); alert("Failed to generate PDF. Please try again."); }
    finally { if(printLoading)printLoading.style.display="none"; }
  }

  if (deptFilter)   deptFilter.addEventListener("change",   ()=>renderTable(getFiltered()));
  if (statusFilter) statusFilter.addEventListener("change", ()=>renderTable(getFiltered()));
  if (startDateEl)  startDateEl.addEventListener("change",  ()=>renderTable(getFiltered()));
  if (endDateEl)    endDateEl.addEventListener("change",    ()=>renderTable(getFiltered()));
  if (exportPdfBtn) exportPdfBtn.addEventListener("click",  generatePDF);

  loadPrintData();
})();