// ── profile.js  –  Shared Profile Logic for VaxCare ─────────────
// Used by patient-profile.html and hospital-profile.html

// ── Toast helper ─────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('pf-toast');
  if (!container) return;
  const icon = type === 'success' ? 'check_circle' : 'error';
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:1.1rem">${icon}</span>${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Button loading spinner ────────────────────────────────────────
function setLoading(btnId, loading, label = 'Save Changes') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:1.1rem">autorenew</span> Saving...`
    : `<span class="material-symbols-outlined" style="font-size:1.1rem">save</span> ${label}`;
}

// ── Avatar upload via file input ──────────────────────────────────
function initAvatarUpload(inputId, previewId, initialsId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      window._profileImageBase64 = e.target.result;
      _applyAvatar(e.target.result, null, previewId, initialsId);
      const removeBtn = document.getElementById('avatarRemoveBtn');
      if (removeBtn) removeBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  });
}

// ── Remove Avatar ─────────────────────────────────────────────────
function removeAvatar() {
  window._profileImageBase64 = ""; // explicit empty string to signify deletion
  const name = document.getElementById('avatarName') ? document.getElementById('avatarName').innerText : '';
  _applyAvatar(null, name, 'avatarImg', 'avatarInitials');
  
  const fileInput = document.getElementById('avatarInput');
  if (fileInput) fileInput.value = "";
  
  const removeBtn = document.getElementById('avatarRemoveBtn');
  if (removeBtn) removeBtn.style.display = 'none';
}

// ── Render avatar: image or initials fallback ─────────────────────
function renderAvatar(profileImage, name, imgElId, initialsElId) {
  _applyAvatar(profileImage, name, imgElId, initialsElId);
}

function _applyAvatar(src, name, imgElId, initialsElId) {
  const imgEl      = document.getElementById(imgElId);
  const initialsEl = document.getElementById(initialsElId);
  if (src) {
    if (imgEl) { imgEl.src = src; imgEl.style.display = 'block'; }
    if (initialsEl) initialsEl.style.display = 'none';
  } else {
    if (imgEl) imgEl.style.display = 'none';
    if (initialsEl) {
      initialsEl.style.display = 'flex';
      initialsEl.innerText = (name || '?').charAt(0).toUpperCase();
    }
  }
}

// ── Sync top-right header after save ─────────────────────────────
// Updates the name span and avatar circle that appear in ALL dashboards
function syncHeaderAfterSave(name, profileImage) {
  // Update localStorage so future page loads reflect change
  try {
    const stored = JSON.parse(localStorage.getItem('vaxUser') || '{}');
    if (name) stored.name = name;
    if (profileImage !== undefined) stored.profileImage = profileImage;
    localStorage.setItem('vaxUser', JSON.stringify(stored));
  } catch (_) {
    // If quota exceeded due to large profileImage, save just the name and role info
    try {
      const stored = JSON.parse(localStorage.getItem('vaxUser') || '{}');
      if (name) stored.name = name;
      delete stored.profileImage; // Remove if it's too big
      localStorage.setItem('vaxUser', JSON.stringify(stored));
    } catch (e) {}
  }

  // Live-update the top-right header on the current page
  const nameEls = [
    document.getElementById('top-nav-name'),
    document.getElementById('header-name')
  ];
  nameEls.forEach(el => { if (el && name) el.innerText = name; });

  // Avatar: either the image element or the initials div
  const headerAvatarImg = document.getElementById('header-avatar-img');
  const headerAvatarInit = document.getElementById('header-avatar-init');
  
  if (profileImage && headerAvatarImg) {
    headerAvatarImg.src = profileImage;
    headerAvatarImg.style.display = 'block';
    if (headerAvatarInit) headerAvatarInit.style.display = 'none';
  } else if (profileImage === "" || !profileImage) {
    if (headerAvatarImg) headerAvatarImg.style.display = 'none';
    if (headerAvatarInit) {
      headerAvatarInit.style.display = 'inline-block';
      headerAvatarInit.innerText = name ? name.charAt(0).toUpperCase() : '?';
    }
  }
}

// ── Password section toggle ───────────────────────────────────────
function togglePasswordSection(sectionId, btnId) {
  const section = document.getElementById(sectionId);
  const btn     = document.getElementById(btnId);
  if (!section) return;
  const isOpen = section.classList.toggle('open');
  if (btn) {
    btn.innerHTML = isOpen
      ? `<span class="material-symbols-outlined">lock_open</span> Hide Password Change`
      : `<span class="material-symbols-outlined">lock</span> Change Password`;
  }
}

// ── API: GET /profile ─────────────────────────────────────────────
async function fetchProfile() {
  const token = localStorage.getItem('vaxToken');
  const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://vaxcare-project.onrender.com';
  const res = await fetch(`${baseUrl}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load profile');
  return await res.json();
}

// ── API: PUT /profile ─────────────────────────────────────────────
async function saveProfile(payload) {
  const token = localStorage.getItem('vaxToken');
  const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://vaxcare-project.onrender.com';
  if (window._profileImageBase64 !== undefined && window._profileImageBase64 !== null) {
    payload.profileImage = window._profileImageBase64;
  }
  const res  = await fetch(`${baseUrl}/profile`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Update failed');

  // Sync name and avatar to header immediately
  syncHeaderAfterSave(payload.name, payload.profileImage || window._profileImageBase64);
  return data;
}

// ── API: PUT /profile/password ────────────────────────────────────
async function changePassword(currentPassword, newPassword, confirmPassword) {
  const token = localStorage.getItem('vaxToken');
  const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://vaxcare-project.onrender.com';
  if (newPassword !== confirmPassword) throw new Error('New passwords do not match.');
  const res  = await fetch(`${baseUrl}/profile/password`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Password change failed');
  return data;
}

// ── Edit / View mode ──────────────────────────────────────────────
// editMode: true  → inputs enabled, Save/Cancel visible, Edit hidden
// editMode: false → inputs disabled, Save/Cancel hidden, Edit visible
function setEditMode(enabled) {
  // All profile inputs
  document.querySelectorAll('.pf-input-wrap input, .pf-input-wrap select, .pf-input-wrap textarea')
    .forEach(el => { el.disabled = !enabled; });

  // Avatar upload button (camera icon)
  const avatarLabel = document.getElementById('avatarEditLabel');
  if (avatarLabel) avatarLabel.style.display = enabled ? 'flex' : 'none';

  // Avatar remove button (trash icon)
  const removeBtn = document.getElementById('avatarRemoveBtn');
  if (removeBtn) {
    const hasImage = (window._profileImageBase64 && window._profileImageBase64 !== "") || 
                     (!window._profileImageBase64 && document.getElementById('avatarImg') && document.getElementById('avatarImg').src && document.getElementById('avatarImg').style.display !== 'none');
    removeBtn.style.display = (enabled && hasImage) ? 'flex' : 'none';
  }

  // Button visibility
  const editBtn   = document.getElementById('globalEditBtn');
  const saveBtn   = document.getElementById('globalSaveBtn');
  const cancelBtn = document.getElementById('globalCancelBtn');
  if (editBtn)   editBtn.style.display   = enabled ? 'none'         : 'flex';
  if (saveBtn)   saveBtn.style.display   = enabled ? 'flex'         : 'none';
  if (cancelBtn) cancelBtn.style.display = enabled ? 'inline-flex'  : 'none';
}

// Spin keyframe for loading spinner
const _s = document.createElement('style');
_s.textContent = `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
document.head.appendChild(_s);

// Expose functions globally for non-module scripts
window.showToast = showToast;
window.setLoading = setLoading;
window.initAvatarUpload = initAvatarUpload;
window.removeAvatar = removeAvatar;
window.renderAvatar = renderAvatar;
window.syncHeaderAfterSave = syncHeaderAfterSave;
window.togglePasswordSection = togglePasswordSection;
window.fetchProfile = fetchProfile;
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.setEditMode = setEditMode;
