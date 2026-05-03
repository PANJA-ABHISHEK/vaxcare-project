let _snapshot = {};

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth('hospital');
    if (!user) return;

    _syncHeaderFromStorage();
    initAvatarUpload('avatarInput', 'avatarImg', 'avatarInitials');

    try {
      const profile = await fetchProfile();
      populateForm(profile);
      _snapshot = { ...profile };
      loadStats(profile.name);
    } catch (err) {
      showToast('Could not load profile. Is the server running?', 'error');
    }
  });

  function _syncHeaderFromStorage() {
    const stored = JSON.parse(localStorage.getItem('vaxUser') || '{}');
    const nameEl = document.getElementById('header-name');
    const initEl = document.getElementById('header-avatar-init');
    const imgEl  = document.getElementById('header-avatar-img');
    if (nameEl) nameEl.innerText = stored.name || '';
    if (stored.profileImage && imgEl) {
      imgEl.src = stored.profileImage;
      imgEl.style.display = 'block';
      if (initEl) initEl.style.display = 'none';
    } else if (initEl) {
      initEl.innerText = (stored.name || 'H').charAt(0).toUpperCase();
    }
  }

  function populateForm(p) {
    document.getElementById('pfName').value        = p.name         || '';
    document.getElementById('pfEmail').value       = p.email        || '';
    document.getElementById('pfPhone').value       = p.phone        || '';
    document.getElementById('pfGovtId').value      = p.governmentId || '';
    document.getElementById('pfLocation').value    = p.location     || '';
    document.getElementById('pfAddress').value     = p.address      || '';
    document.getElementById('pfDescription').value = p.description  || '';
    document.getElementById('avatarName').innerText = p.name || '—';
    renderAvatar(p.profileImage, p.name, 'avatarImg', 'avatarInitials');
    syncHeaderAfterSave(p.name, p.profileImage);
  }

  async function loadStats(hospitalName) {
    try {
      const [vRes, bRes] = await Promise.all([
        fetch(`/vaccines?hospitalName=${encodeURIComponent(hospitalName)}`),
        fetch('/bookings')
      ]);
      const vaccines = vRes.ok ? await vRes.json() : [];
      const allBookings = bRes.ok ? await bRes.json() : [];
      const myBookings = allBookings.filter(b => b.vaccineId?.hospitalName === hospitalName);
      const rated = myBookings.filter(b => b.rating);
      const avg   = rated.length
        ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1)
        : '—';
      document.getElementById('statVaccines').innerText = vaccines.length;
      document.getElementById('statBookings').innerText = myBookings.length;
      document.getElementById('statRating').innerText   = avg;
    } catch (_) { /* stats non-critical */ }
  }

  function enterEditMode() {
    _snapshot = {
      name:         document.getElementById('pfName').value,
      email:        document.getElementById('pfEmail').value,
      phone:        document.getElementById('pfPhone').value,
      governmentId: document.getElementById('pfGovtId').value,
      location:     document.getElementById('pfLocation').value,
      address:      document.getElementById('pfAddress').value,
      description:  document.getElementById('pfDescription').value,
    };
    setEditMode(true);
  }

  function cancelEdit() {
    document.getElementById('pfName').value        = _snapshot.name         || '';
    document.getElementById('pfEmail').value       = _snapshot.email        || '';
    document.getElementById('pfPhone').value       = _snapshot.phone        || '';
    document.getElementById('pfGovtId').value      = _snapshot.governmentId || '';
    document.getElementById('pfLocation').value    = _snapshot.location     || '';
    document.getElementById('pfAddress').value     = _snapshot.address      || '';
    document.getElementById('pfDescription').value = _snapshot.description  || '';
    window._profileImageBase64 = null;
    setEditMode(false);
  }

  async function handleProfileSave() {
    const payload = {
      name:         document.getElementById('pfName').value.trim(),
      email:        document.getElementById('pfEmail').value.trim(),
      phone:        document.getElementById('pfPhone').value.trim(),
      governmentId: document.getElementById('pfGovtId').value.trim(),
      location:     document.getElementById('pfLocation').value.trim(),
      address:      document.getElementById('pfAddress').value.trim(),
      description:  document.getElementById('pfDescription').value.trim(),
    };
    if (!payload.name)  { showToast('Hospital name cannot be empty.', 'error');  return; }
    if (!payload.email) { showToast('Email cannot be empty.', 'error'); return; }

    setLoading('globalSaveBtn', true);
    try {
      const data = await saveProfile(payload);
      populateForm(data.user);
      _snapshot = { ...data.user };
      setEditMode(false);
      showToast('Hospital profile updated successfully!', 'success');
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