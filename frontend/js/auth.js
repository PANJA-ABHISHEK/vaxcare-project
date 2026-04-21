// ── Auth Modal Logic ─────────────────────────────────────────────

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchTab('login');
  }
}

function openSignupModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchTab('signup');
    document.getElementById('signupStep1').classList.remove('hidden');
    document.getElementById('signupStep2').classList.add('hidden');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

function switchTab(tab) {
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
  }
}

// Global Auth Helpers
function getAuthUser() {
  const user = localStorage.getItem('vaxUser');
  return user ? JSON.parse(user) : null;
}

function logoutUser() {
  localStorage.removeItem('vaxUser');
  localStorage.removeItem('vaxToken');
  window.location.href = '/index.html';
}

function checkAuth(requiredRole) {
  const user = getAuthUser();
  if (!user) {
    window.location.href = '/index.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = user.role === 'hospital' 
      ? '/hospital-admin-dashboard.html' 
      : '/patient-dashboard.html';
    return null;
  }
  return user;
}

function syncTopNav() {
  const user = getAuthUser();
  if (!user) return;
  const nameEl   = document.getElementById('top-nav-name') || document.getElementById('header-name');
  const avatarEl = document.getElementById('top-nav-avatar') || document.getElementById('header-avatar');
  
  if (nameEl) nameEl.innerText = user.name;
  if (avatarEl) avatarEl.innerText = user.name.charAt(0).toUpperCase();
}

// Redirect if already logged in (on index.html)
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
  const user = getAuthUser();
  if (user) {
    window.location.href = user.role === 'hospital' 
      ? '/hospital-admin-dashboard.html' 
      : '/patient-dashboard.html';
  }
}

// Close modal when clicking outside the box
document.addEventListener('click', function (e) {
  const modal = document.getElementById('loginModal');
  if (modal && e.target === modal) closeAuthModal();
});

// Signup multi-step
function nextSignupStep() {
  const role = document.querySelector('input[name="signupRole"]:checked')?.value;
  document.getElementById('signupStep1').classList.add('hidden');
  document.getElementById('signupStep2').classList.remove('hidden');

  const nameLabel      = document.getElementById('signup-name-label');
  const nameInput      = document.getElementById('signup-name');
  const hospitalFields = document.getElementById('hospital-extra-fields');
  const patientFields  = document.getElementById('patient-extra-fields');

  if (role === 'hospital') {
    if (nameLabel)      nameLabel.innerText   = 'Hospital Name';
    if (nameInput)      nameInput.placeholder = "e.g. St. Mary's General Hospital";
    if (hospitalFields) hospitalFields.style.display = 'block';
    if (patientFields)  patientFields.style.display  = 'none';
  } else {
    if (nameLabel)      nameLabel.innerText   = 'Full Name';
    if (nameInput)      nameInput.placeholder = 'John Doe';
    if (hospitalFields) hospitalFields.style.display = 'none';
    if (patientFields)  patientFields.style.display  = 'block';
  }
}

function prevSignupStep() {
  document.getElementById('signupStep2').classList.add('hidden');
  document.getElementById('signupStep1').classList.remove('hidden');
}

// Submit handler
async function handleAuthSubmit(event, type) {
  event.preventDefault();

  let role = '';
  const checkedRole = document.querySelector(`input[name="${type === 'login' ? 'loginRole' : 'signupRole'}"]:checked`);
  if (checkedRole) role = checkedRole.value;

  const email    = event.target.querySelector('input[type="email"]').value;
  const password = event.target.querySelector('input[type="password"]').value;
  const body     = { email, password, role };

  if (type === 'signup') {
    const nameInput     = document.getElementById('signup-name');
    const locationInput = document.getElementById('signup-location');
    const govtIdInput   = document.getElementById('signup-govt-id');
    const ageInput      = document.getElementById('signup-age');
    const genderInput   = document.getElementById('signup-gender');
    if (nameInput)                               body.name         = nameInput.value;
    if (locationInput && locationInput.value.trim()) body.location     = locationInput.value.trim();
    if (govtIdInput   && govtIdInput.value.trim())   body.governmentId = govtIdInput.value.trim();
    if (ageInput      && ageInput.value.trim())       body.age          = Number(ageInput.value.trim());
    if (genderInput   && genderInput.value)           body.gender       = genderInput.value;
  }

  const endpoint = type === 'login'
    ? '/login'
    : '/signup';

  const errorEl = document.getElementById(type === 'login' ? 'loginError' : 'signupError');

  try {
    const response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('vaxUser', JSON.stringify(data.user || data));
      if (data.token) localStorage.setItem('vaxToken', data.token);
      window.location.href = role === 'hospital'
        ? '/hospital-admin-dashboard.html'
        : '/patient-dashboard.html';
    } else {
      if (errorEl) {
        errorEl.innerText = data.message || data.error || 'Authentication failed';
        errorEl.classList.remove('hidden');
      } else {
        alert(data.message || data.error || 'Authentication failed');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    const msg = 'Could not connect to server. Make sure it is running.';
    if (errorEl) {
      errorEl.innerText = msg;
      errorEl.classList.remove('hidden');
    } else {
      alert(msg);
    }
  }
}
