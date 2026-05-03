// Snapshot of data before edit (used by Cancel)
  let _snapshot = {};

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth('patient');
    if (!user) return;

    // Populate header from localStorage first (instant, no flicker)
    _syncHeaderFromStorage();

    initAvatarUpload('avatarInput', 'avatarImg', 'avatarInitials');

    try {
      const profile = await fetchProfile();
      populateForm(profile);
      _snapshot = { ...profile };
    } catch (err) {
      showToast('Could not load profile. Is the server running?', 'error');
    }
  });

  // Populate header name + avatar from localStorage (fast)
  function _syncHeaderFromStorage() {
    const stored = JSON.parse(localStorage.getItem('vaxUser') || '{}');
    const nameEl = document.getElementById('top-nav-name');
    const initEl = document.getElementById('header-avatar-init');
    const imgEl  = document.getElementById('header-avatar-img');
    if (nameEl) nameEl.innerText = stored.name || '';
    if (stored.profileImage && imgEl) {
      imgEl.src = stored.profileImage;
      imgEl.style.display = 'block';
      if (initEl) initEl.style.display = 'none';
    } else if (initEl) {
      initEl.innerText = (stored.name || '?').charAt(0).toUpperCase();
    }
  }

  function populateForm(p) {
    document.getElementById('pfName').value     = p.name         || '';
    document.getElementById('pfEmail').value    = p.email        || '';
    document.getElementById('pfAge').value      = p.age          || '';
    document.getElementById('pfGender').value   = p.gender       || '';
    document.getElementById('pfPhone').value    = p.phone        || '';


    document.getElementById('avatarName').innerText = p.name || '—';
    renderAvatar(p.profileImage, p.name, 'avatarImg', 'avatarInitials');

    // Also keep header in sync
    syncHeaderAfterSave(p.name, p.profileImage);
  }

  function enterEditMode() {
    // Save snapshot before editing
    _snapshot = {
      name: document.getElementById('pfName').value,
      email: document.getElementById('pfEmail').value,
      age: document.getElementById('pfAge').value,
      gender: document.getElementById('pfGender').value,
      phone: document.getElementById('pfPhone').value,

    };
    setEditMode(true);
  }

  function cancelEdit() {
    // Restore snapshot values
    document.getElementById('pfName').value     = _snapshot.name         || '';
    document.getElementById('pfEmail').value    = _snapshot.email        || '';
    document.getElementById('pfAge').value      = _snapshot.age          || '';
    document.getElementById('pfGender').value   = _snapshot.gender       || '';
    document.getElementById('pfPhone').value    = _snapshot.phone        || '';

    window._profileImageBase64 = null;
    setEditMode(false);
  }

  async function handleProfileSave() {
    const payload = {
      name:         document.getElementById('pfName').value.trim(),
      email:        document.getElementById('pfEmail').value.trim(),
      age:          Number(document.getElementById('pfAge').value) || undefined,
      gender:       document.getElementById('pfGender').value,
      phone:        document.getElementById('pfPhone').value.trim(),

    };
    if (!payload.name)  { showToast('Name cannot be empty.', 'error');  return; }
    if (!payload.email) { showToast('Email cannot be empty.', 'error'); return; }

    setLoading('globalSaveBtn', true);
    try {
      const data = await saveProfile(payload);
      populateForm(data.user);
      _snapshot = { ...data.user };
      setEditMode(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setLoading('globalSaveBtn', false);
    }
  }

  async function handlePasswordChange() {
    const current = document.getElementById('pwCurrent').value;
    const newPw   = document.getElementById('pwNew').value;
    const confirm = document.getElementById('pwConfirm').value;
    if (!current || !newPw || !confirm) {
      showToast('Please fill all password fields.', 'error'); return;
    }
    setLoading('pwSaveBtn', true, 'Update Password');
    try {
      await changePassword(current, newPw, confirm);
      showToast('Password changed successfully!', 'success');
      ['pwCurrent','pwNew','pwConfirm'].forEach(id => document.getElementById(id).value = '');
      togglePasswordSection('pwSection', 'pwToggleBtn');
    } catch (err) {
      showToast(err.message || 'Password change failed.', 'error');
    } finally {
      setLoading('pwSaveBtn', false, 'Update Password');
    }
  }