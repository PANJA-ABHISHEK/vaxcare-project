function logoutUser() {
    localStorage.removeItem('vaxUser');
    localStorage.removeItem('vaxToken');
    window.location.href = '/index.html';
}

// =============================================
// NOTIFICATIONS & REMINDERS SYSTEM
// =============================================
const notifBtn = document.getElementById('notifBtn');
const notifDropdown = document.getElementById('notifDropdown');
const notifBadge = document.getElementById('notifBadge');
const notifList = document.getElementById('notifList');
const toastContainer = document.getElementById('toastContainer');
const token = localStorage.getItem('vaxToken');

// Toggle Notification Dropdown
notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#notifContainer')) {
        notifDropdown.classList.remove('show');
    }
});

// Show Toast Notification
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'warning') icon = 'warning';
    toast.innerHTML = `
        <div class="toast-icon"><span class="material-symbols-outlined">${icon}</span></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><span class="material-symbols-outlined">close</span></button>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5000);
}

async function fetchNotifications() {
    try {
        const res = await fetch('/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { renderNotifications(await res.json()); }
    } catch (err) { console.error('Error fetching notifications:', err); }
}

function renderNotifications(notifications) {
    notifList.innerHTML = '';
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Handle badge and shake animation
    if (unreadCount > 0) { 
        const currentCount = parseInt(notifBadge.textContent) || 0;
        if (unreadCount > currentCount) {
            notifBtn.classList.remove('shake');
            void notifBtn.offsetWidth; // trigger reflow
            notifBtn.classList.add('shake');
            if (window.playNotificationSound) window.playNotificationSound();
        }
        notifBadge.textContent = unreadCount; 
        notifBadge.classList.remove('hidden'); 
    } else { 
        notifBadge.classList.add('hidden'); 
    }
    
    if (notifications.length === 0) { 
        notifList.innerHTML = `
          <div class="notif-empty" style="padding: 3rem 2rem; text-align: center;">
            <div style="width: 64px; height: 64px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
              <span class="material-symbols-outlined" style="font-size: 2rem; color: #94a3b8;">notifications_off</span>
            </div>
            <h4 style="color: #0f1d25; font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">You're all caught up!</h4>
            <p style="color: #64748b; font-size: 0.85rem; line-height: 1.4;">When you book a vaccine or receive a reminder, it will show up here.</p>
          </div>
        `; 
        return; 
    }
    notifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `notif-item ${notif.read ? '' : 'unread'}`;
        
        const date = new Date(notif.createdAt);
        const timeStr = date.toLocaleDateString() === new Date().toLocaleDateString() 
          ? `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
          : date.toLocaleDateString([], {month: 'short', day: 'numeric'});

        // Check if we have appointment details to show dynamic countdown
        let extraDesc = '';
        if (notif.appointmentDate && notif.appointmentTime) {
            const dynamicText = getDynamicCountdownText(notif.appointmentDate, notif.appointmentTime);
            const isUrgent = dynamicText.includes('hours') || dynamicText.includes('missed');
            extraDesc = `<div class="notif-time" style="margin-top: 0.3rem; color: ${isUrgent ? '#ba1a1a' : '#0061a4'}; font-weight: 700;">${dynamicText}</div>`;
        }

        // Determine icon and action based on notification type/title
        let notifIcon = 'vaccines';
        let notifIconColor = '#0061a4';
        let actionHint = '';
        let clickTarget = null; // null = no redirect, 'history', 'appointments', 'dashboard'

        if (notif.title && notif.title.includes('Completed')) {
            notifIcon = 'check_circle';
            notifIconColor = '#16a34a';
            actionHint = '<div style="font-size:0.72rem;color:#16a34a;font-weight:700;margin-top:0.3rem;display:flex;align-items:center;gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.8rem;">arrow_forward</span>Click to view history & download certificate</div>';
            clickTarget = 'history';
        } else if (notif.title && (notif.title.includes('Accepted') || notif.title.includes('Submitted'))) {
            notifIcon = 'calendar_today';
            notifIconColor = '#0061a4';
            actionHint = '<div style="font-size:0.72rem;color:#0061a4;font-weight:700;margin-top:0.3rem;display:flex;align-items:center;gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.8rem;">arrow_forward</span>Click to view your appointments</div>';
            clickTarget = 'appointments';
        } else if (notif.title && notif.title.includes('Next Dose')) {
            notifIcon = 'medication';
            notifIconColor = '#d97706';
            actionHint = '<div style="font-size:0.72rem;color:#d97706;font-weight:700;margin-top:0.3rem;display:flex;align-items:center;gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.8rem;">arrow_forward</span>Click to book your next dose</div>';
            clickTarget = 'dashboard';
        } else if (notif.type === 'message') {
            notifIcon = 'chat';
            notifIconColor = '#7c3aed';
            actionHint = '<div style="font-size:0.72rem;color:#7c3aed;font-weight:700;margin-top:0.3rem;display:flex;align-items:center;gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.8rem;">arrow_forward</span>Click to open chat</div>';
        }

        item.innerHTML = `
          <div class="notif-icon" style="color:${notifIconColor};">
            <span class="material-symbols-outlined">${notifIcon}</span>
          </div>
          <div class="notif-content">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div class="notif-title">${notif.title}</div>
                <button onclick="deleteNotification('${notif._id}', event)" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:2px; border-radius:4px;" title="Delete Notification">
                    <span class="material-symbols-outlined" style="font-size: 1rem;">delete</span>
                </button>
            </div>
            <div class="notif-desc">${notif.message}</div>
            ${actionHint}
            <div class="notif-time">${timeStr}</div>
            ${extraDesc}
          </div>
        `;

        item.addEventListener('click', () => {
          // Auto-delete to keep the dropdown clear and reduce clutter
          try {
              fetch(`/notifications/${notif._id}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
              });
          } catch(e) {}
          
          // Hide item immediately from UI
          item.style.display = 'none';
          if (!notif.read) {
              const currentCount = parseInt(notifBadge.textContent) || 0;
              if (currentCount > 1) {
                  notifBadge.textContent = currentCount - 1;
              } else {
                  notifBadge.classList.add('hidden');
              }
          }
          
          // Handle message notifications → open chat
          if (notif.type === 'message' && notif.conversationId) {
              const ids = notif.conversationId.split('_');
              const userStr = localStorage.getItem('vaxUser');
              if (userStr) {
                  const currentUserId = JSON.parse(userStr)._id;
                  const otherUserId = ids.find(id => id !== currentUserId);
                  
                  let senderName = "User";
                  if (notif.title && notif.title.startsWith("New message from ")) {
                      senderName = notif.title.substring(17);
                  }
                  
                  if (otherUserId && window.openChat) {
                      setTimeout(() => {
                          window.openChat(otherUserId, senderName);
                          notifDropdown.classList.remove('show');
                      }, 100);
                  }
              }
          }
          // Handle booking/vaccination notifications → redirect to correct page
          else if (clickTarget === 'history') {
              window.location.href = '/src/pages/patient-history.html';
          }
          else if (clickTarget === 'appointments') {
              window.location.href = '/src/pages/patient-appointments.html';
          }
          else if (clickTarget === 'dashboard') {
              // Already on dashboard — just close dropdown and scroll to vaccines
              notifDropdown.classList.remove('show');
              const vaccineSection = document.querySelector('.dashboard-grid');
              if (vaccineSection) vaccineSection.scrollIntoView({ behavior: 'smooth' });
          }
        });

        notifList.appendChild(item);
    });
}

async function markAsRead(id, element) {
    try {
        const res = await fetch(`/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            element.classList.remove('unread');
            const currentCount = parseInt(notifBadge.textContent);
            if (currentCount > 1) {
                notifBadge.textContent = currentCount - 1;
            } else {
                notifBadge.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error('Error marking notification as read:', err);
    }
}

document.getElementById('markAllReadBtn').addEventListener('click', () => {
    notifList.querySelectorAll('.notif-item.unread').forEach(i => i.classList.remove('unread'));
    notifBadge.classList.add('hidden');
});

async function deleteNotification(id, event) {
    event.stopPropagation(); // prevent triggering markAsRead
    try {
        const res = await fetch(`/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchNotifications(); // Reload list
        } else {
            const data = await res.json().catch(() => ({}));
            alert('Failed to delete notification. \n\nPlease restart your Node.js server (npm start) so it registers the new DELETE route!');
            console.error('Failed to delete notification');
        }
    } catch (err) {
        console.error('Error deleting notification:', err);
        alert('Failed to connect to the server. Please restart it.');
    }
}

async function fetchUpcomingReminder() {
    try {
        const res = await fetch('/reminders/upcoming', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const upcoming = await res.json();
            if (upcoming) { renderUpcomingReminder(upcoming); }
        }
    } catch (err) { console.error('Error fetching reminder:', err); }
}

function getDynamicCountdownText(dateStr, timeStr) {
    const now = new Date();
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const target = new Date(dateStr);
    target.setHours(hours, minutes, 0, 0);

    const diffMs = target - now;
    if (diffMs < 0) return "Appointment missed";
    
    const diffHours = diffMs / (1000 * 60 * 60);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const targetDay = new Date(target);
    targetDay.setHours(0,0,0,0);
    const dayDiff = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
        if (diffHours <= 12) return `In ${Math.max(1, Math.ceil(diffHours))} hours`;
        return `Today at ${timeStr}`;
    }
    if (dayDiff === 1) return `Tomorrow at ${timeStr}`;
    return `In ${dayDiff} days`;
}

let countdownInterval;

function renderUpcomingReminder(booking) {
    const vaccineName = booking.vaccineId ? booking.vaccineId.name : 'Vaccine';
    const hospitalName = booking.vaccineId ? booking.vaccineId.hospitalName : 'Hospital';
    const date = new Date(booking.date);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Dynamic text
    const countdownText = getDynamicCountdownText(booking.date, booking.time);
    const isUrgent = countdownText.includes('hours') || countdownText.includes('missed');

    // Show Toast if very soon
    const lastToastId = localStorage.getItem('last_reminder_toast_id');
    if (lastToastId !== booking._id && isUrgent) {
        setTimeout(() => {
            showToast('Upcoming Appointment', `Your ${vaccineName} appointment is ${countdownText.toLowerCase()}`, 'info');
            localStorage.setItem('last_reminder_toast_id', booking._id);
        }, 1500);
    }

    // Dashboard Card Removed

    // Floating Reminder logic
    const floatingReminder = document.getElementById('floatingReminder');
    
    if (window._dismissed_floating_reminder !== booking._id) {
        floatingReminder.innerHTML = `
            <div class="floating-icon"><span class="material-symbols-outlined">notifications_active</span></div>
            <div class="floating-content">
                <div class="floating-title">Upcoming Vaccination</div>
                <div class="floating-desc">${vaccineName} at ${hospitalName}</div>
                <div class="floating-countdown ${isUrgent ? 'urgent' : ''}" id="floatReminderCountdown">${countdownText}</div>
            </div>
            <button class="floating-close" onclick="dismissFloatingReminder('${booking._id}')">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;
        setTimeout(() => floatingReminder.classList.add('show'), 500);
    }

    // Clear existing interval
    if (countdownInterval) clearInterval(countdownInterval);

    // Dynamic UI update loop
    countdownInterval = setInterval(() => {
        const newText = getDynamicCountdownText(booking.date, booking.time);
        const newUrgent = newText.includes('hours') || newText.includes('missed');
        
        // Main Count update removed

        const floatCount = document.getElementById('floatReminderCountdown');
        if (floatCount && floatCount.innerText !== newText) {
            floatCount.innerText = newText;
            if (newUrgent) floatCount.classList.add('urgent');
        }
        
        // Update bell dropdown if open
        if (notifDropdown.classList.contains('show')) {
            fetchNotifications();
        }
    }, 60000); // Check every minute
}

function dismissFloatingReminder(bookingId) {
    const el = document.getElementById('floatingReminder');
    el.classList.remove('show');
    window._dismissed_floating_reminder = bookingId;
}

// Rating dropdown state
let currentRatingValue = 0;

function toggleRatingDrop() {
    const list = document.getElementById('ratingList');
    const arrow = document.getElementById('ratingArrow');
    const btn = document.getElementById('ratingBtn');
    const open = !list.classList.contains('hidden');
    list.classList.toggle('hidden', open);
    arrow.classList.toggle('flipped', !open);
    btn.classList.toggle('open', !open);
}

// Set rating filter and reload
function setRating(value, label, el) {
    currentRatingValue = value;
    document.getElementById('ratingLabel').innerText = label;
    document.querySelectorAll('.ropt').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    // Close the dropdown
    document.getElementById('ratingList').classList.add('hidden');
    document.getElementById('ratingArrow').classList.remove('flipped');
    document.getElementById('ratingBtn').classList.remove('open');
    loadVaccines();
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const drop = document.getElementById('ratingDropdown');
    if (drop && !drop.contains(e.target)) {
        document.getElementById('ratingList')?.classList.add('hidden');
        document.getElementById('ratingArrow')?.classList.remove('flipped');
        document.getElementById('ratingBtn')?.classList.remove('open');
    }
});

// Fetch vaccines from API, apply search + rating filters
async function loadVaccines() {
    const location = (document.getElementById('locationInput')?.value || '').trim();
    try {
        const url = '/vaccines' + (location ? '?location=' + encodeURIComponent(location) : '');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        let vaccines = await res.json();

        // Filter by vaccine/hospital name
        const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
        if (query) {
            vaccines = vaccines.filter(v =>
                v.name.toLowerCase().includes(query) ||
                (v.hospitalName || '').toLowerCase().includes(query)
            );
        }

        // Filter by minimum rating using custom dropdown value
        if (currentRatingValue > 0) {
            vaccines = vaccines.filter(v => (v.rating || 0) >= currentRatingValue);
        }

        renderCards(vaccines);
    } catch (err) {
        console.error('Error:', err);
        document.getElementById('resultsCount').innerText = 'Failed to load';
    }
}

// Build vaccine cards and insert into grid
function renderCards(vaccines) {
    const grid = document.getElementById('vaccinesGrid');
    grid.innerHTML = '';

    if (vaccines.length === 0) {
        grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1;">
            <span class="material-symbols-outlined">vaccines</span>
            <p>No vaccines found.</p>
            <small>Try a different search term or clear the location filter.</small>
        </div>`;
        document.getElementById('resultsCount').innerText = 'No results';
        return;
    }

    // Helper: build star HTML (filled gold + empty grey outlines)
    function buildStarsHtml(r, sz = '1rem') {
        let h = '';
        for (let i = 1; i <= 5; i++) {
            h += i <= r
                ? `<span class="material-symbols-outlined" style="font-size:${sz};color:#f59e0b;font-variation-settings:'FILL' 1;">star</span>`
                : `<span class="material-symbols-outlined" style="font-size:${sz};color:#d1d5db;font-variation-settings:'FILL' 0,'wght' 300;">star</span>`;
        }
        return h;
    }

    vaccines.forEach(v => {
        const rating = v.rating || 0;
        const stock = v.stock || 0;

        const ratingHtml = rating > 0
            ? `<div class="rate-badge">
               <span class="material-symbols-outlined">star</span>
               ${rating.toFixed(1)}
           </div>`
            : `<div style="display:flex;align-items:center;gap:1px;">${buildStarsHtml(0, '0.95rem')}</div>`;

        const stockClass = stock > 10 ? 'stock-ok' : 'stock-low';
        const stockLabel = stock > 10 ? `AVAILABLE (${stock})` : stock > 0 ? `LOW STOCK (${stock})` : 'OUT OF STOCK';

        const doseBadgeHtml = (v.dosesRequired && v.dosesRequired > 1) 
            ? `<span style="display:inline-block;padding:.15rem .5rem;border-radius:4px;font-size:.65rem;font-weight:700;text-transform:uppercase;background:#e9f5ff;color:#0061a4;margin-left:0.5rem;vertical-align:middle;">${v.dosesRequired} Doses</span>`
            : '';

        grid.innerHTML += `
        <div class="vcard">
            <div class="vcard-top">
                <div class="vcard-icon">
                    <span class="material-symbols-outlined">vaccines</span>
                </div>
                ${ratingHtml}
            </div>

            <div>
                <div class="vcard-name" style="display:flex;align-items:center;">${v.name} ${doseBadgeHtml}</div>
                <div class="vcard-meta" style="margin-top:0.25rem;">
                    <span class="material-symbols-outlined">local_hospital</span>
                    ${v.hospitalName || 'Unknown Hospital'}
                </div>
                ${v.location ? `<div class="vcard-meta">
                    <span class="material-symbols-outlined">location_on</span>
                    ${v.location}
                </div>` : ''}
            </div>

            <div style="display:flex;align-items:center;gap:0.5rem;margin:0.75rem 0 0.25rem;">
                <span class="material-symbols-outlined" style="font-size:1.1rem;color:#065f46;">payments</span>
                <span style="font-family:'Manrope',sans-serif;font-size:1.25rem;font-weight:800;color:#065f46;">₹${(v.cost || 0).toLocaleString('en-IN')}</span>
                ${v.cost === 0 || !v.cost ? '<span style="font-size:0.72rem;color:#64748b;font-weight:600;">FREE</span>' : ''}
            </div>

            <hr class="vcard-line"/>

            <div class="doctor-row">
                <div class="doctor-avatar">
                    <span class="material-symbols-outlined">person</span>
                </div>
                <div>
                    <div class="doctor-name">${v.doctorName || 'Assigned Staff'}</div>
                    <div class="doctor-exp">${v.experience || 'Experienced'}</div>
                </div>
            </div>

            <div class="vcard-foot" style="display:flex; flex-direction:column; gap:1.25rem; margin-top:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <span class="stock-badge ${stockClass}" style="padding:0.4rem 0.8rem; font-size:0.75rem;">${stockLabel}</span>
                    ${v.hospitalId ? `<button class="btn" onclick="openChat('${v.hospitalId}', '${v.hospitalName.replace(/'/g, "\\'")}')" style="border-radius:2rem;padding:0.5rem;width:38px;height:38px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#0ea5e9;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#e0f2fe';this.style.borderColor='#bae6fd';this.style.transform='translateY(-1px)'" onmouseout="this.style.background='#f8fafc';this.style.borderColor='#e2e8f0';this.style.transform='none'" title="Message Hospital">
                        <span class="material-symbols-outlined" style="font-size:1.2rem;font-variation-settings:'FILL' 1;">chat</span>
                    </button>` : ''}
                    <button class="btn" onclick="viewReviews('${v._id}', '${v.name.replace(/'/g, "\\'")}')" style="border-radius:2rem;padding:0.5rem 1.1rem;font-size:0.8rem;background:#ffffff;border:1.5px solid #e2e8f0;color:#475569;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.35rem;transition:all 0.2s;" onmouseover="this.style.background='#fffbeb';this.style.borderColor='#fcd34d';this.style.color='#d97706';this.style.transform='translateY(-1px)'" onmouseout="this.style.background='#ffffff';this.style.borderColor='#e2e8f0';this.style.color='#475569';this.style.transform='none'">
                        <span class="material-symbols-outlined" style="font-size:1.1rem;font-variation-settings:'FILL' 1;color:#f59e0b;">star</span>
                        Reviews
                    </button>
                </div>
                <button class="btn"
                    style="border-radius:1rem;padding:0.85rem 1.25rem;font-size:0.95rem;font-weight:800;display:flex;justify-content:center;align-items:center;width:100%;background:linear-gradient(135deg, #0284c7, #0ea5e9);border:none;color:white;box-shadow:0 4px 12px rgba(2,132,199,0.25);transition:all 0.25s ease;letter-spacing:0.5px;cursor:pointer;"
                    onclick="bookVaccine('${v._id}', '${v.name.replace(/'/g, "\\'")}', '${(v.hospitalName || '').replace(/'/g, "\\'")}', '${(v.doctorName || '').replace(/'/g, "\\'")}', ${v.cost || 0}, ${v.dosesRequired || 1})"
                    ${stock === 0 ? 'disabled style="opacity:.5;cursor:not-allowed;border-radius:1rem;width:100%;background:#94a3b8;box-shadow:none;"' : ''}
                    onmouseover="if(${stock}!==0){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(2,132,199,0.35)';}"
                    onmouseout="if(${stock}!==0){this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(2,132,199,0.25)';}">
                    BOOK NOW
                </button>
            </div>
        </div>`;
    });

    document.getElementById('resultsCount').innerText =
        `Showing ${vaccines.length} result${vaccines.length === 1 ? '' : 's'}`;
}

// ── Booking Modal ──
let bookingVaccineId    = null;
let bookingHospitalName = null;
let selectedTime        = null;

// Open booking modal with vaccine info
function bookVaccine(vaccineId, vaccineName, hospitalName, doctorName, cost, dosesRequired) {
    const user = JSON.parse(localStorage.getItem('vaxUser'));
    if (!user) { window.location.href = '/index.html'; return; }

    bookingVaccineId    = vaccineId;
    bookingHospitalName = hospitalName;
    selectedTime        = null;

    const doseBadgeHtml = (dosesRequired && dosesRequired > 1) 
        ? `<span style="display:inline-block;padding:.15rem .5rem;border-radius:4px;font-size:.65rem;font-weight:700;text-transform:uppercase;background:#e9f5ff;color:#0061a4;margin-left:0.5rem;vertical-align:middle;">${dosesRequired} Doses</span>`
        : '';

    document.getElementById('bk-name').innerHTML     = vaccineName + ' ' + doseBadgeHtml;
    document.getElementById('bk-hospital').innerText = hospitalName || 'Unknown Hospital';
    document.getElementById('bk-doctor').innerText   = doctorName || 'Assigned Staff';
    document.getElementById('bk-cost').innerText     = (cost && cost > 0) ? '₹' + Number(cost).toLocaleString('en-IN') : 'FREE';
    document.getElementById('bkDate').value          = '';
    
    // Set min date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('bkDate').min = `${yyyy}-${mm}-${dd}`;
    
    document.getElementById('bk-error').innerText    = '';
    document.getElementById('slot-container').innerHTML =
        '<p style="color:#64748b;font-size:.85rem;">Select a date to see available slots.</p>';

    document.getElementById('bookModal').classList.remove('hidden');
}

function closeBookModal() {
    document.getElementById('bookModal').classList.add('hidden');
}

// Generate 30-min time slots between open and close times
function generateSlots(openTime, closeTime) {
    const slots = [];
    const [oh, om] = openTime.split(':').map(Number);
    const [ch, cm] = closeTime.split(':').map(Number);
    let cur = oh * 60 + om;
    const end = ch * 60 + cm;
    while (cur < end) {
        const h   = Math.floor(cur / 60);
        const m   = cur % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12  = h % 12 === 0 ? 12 : h % 12;
        slots.push(`${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`);
        cur += 30;
    }
    return slots;
}

// Map JS getDay() to timings keys
const DAY_KEYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Load available time slots when user picks a date
async function loadSlots() {
    const date   = document.getElementById('bkDate').value;
    const errEl  = document.getElementById('bk-error');
    const box    = document.getElementById('slot-container');
    errEl.innerText = '';
    selectedTime    = null;

    if (!date) {
        box.innerHTML = '<p style="color:#64748b;font-size:.85rem;grid-column:1/-1;">Select a date to see available slots.</p>';
        return;
    }

    box.innerHTML = '<p style="color:#64748b;font-size:.85rem;grid-column:1/-1;">Loading slots...</p>';

    const dayKey = DAY_KEYS[new Date(date + 'T00:00:00').getDay()];

    // ── 1) Get timings: try backend first, fall back to localStorage ──
    let timings = null;
    try {
        const timRes  = await fetch('/hospitals/' + encodeURIComponent(bookingHospitalName) + '/timings');
        const timData = await timRes.json();
        timings = timData.timings || null;
    } catch { /* server might not be restarted yet */ }

    // Fallback to localStorage timings saved by the hospital on THIS device
    if (!timings) {
        const local = localStorage.getItem('hospitalTimings');
        if (local) {
            try { timings = JSON.parse(local); } catch { /* ignore */ }
        }
    }

    if (!timings || !timings[dayKey]) {
        box.innerHTML = '<p style="color:#ba1a1a;font-size:.85rem;grid-column:1/-1;">No timings set for this hospital yet. Ask admin to save timings.</p>';
        return;
    }
    if (timings[dayKey].closed) {
        box.innerHTML = '<p style="color:#ba1a1a;font-size:.85rem;grid-column:1/-1;">🚫 Hospital is closed on ' + dayKey + '.</p>';
        return;
    }

    // ── 2) Generate 30-min slots ──
    const allSlots = generateSlots(timings[dayKey].open, timings[dayKey].close);
    if (allSlots.length === 0) {
        box.innerHTML = '<p style="color:#ba1a1a;font-size:.85rem;grid-column:1/-1;">No slots available for this day.</p>';
        return;
    }

    // ── 3) Fetch already-booked slots (isolated — failure just means no greyout) ──
    let booked = new Set();
    try {
        const bkRes  = await fetch('/bookings/booked-slots?vaccineId=' + bookingVaccineId + '&date=' + date);
        const bkData = await bkRes.json();
        booked = new Set(bkData.bookedSlots || []);
    } catch { /* show all slots if this fails */ }

    // ── 4) Render ──
    box.innerHTML = '';
    let remainingSlots = allSlots.filter(s => !booked.has(s));

    // If the selected date is today, filter out past time slots
    const today = new Date();
    const selectedDate = new Date(date + 'T00:00:00');
    if (selectedDate.toDateString() === today.toDateString()) {
        const nowMinutes = today.getHours() * 60 + today.getMinutes();
        remainingSlots = remainingSlots.filter(slot => {
            // Parse "HH:MM AM/PM" to 24h minutes
            const parts = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!parts) return true;
            let h = parseInt(parts[1]);
            const m = parseInt(parts[2]);
            const period = parts[3].toUpperCase();
            if (period === 'PM' && h !== 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            return (h * 60 + m) > nowMinutes;
        });
    }

    if (remainingSlots.length === 0) {
        box.innerHTML = '<p style="color:#ba1a1a;font-size:.85rem;grid-column:1/-1;">No slots available for this day.</p>';
        return;
    }

    remainingSlots.forEach(slot => {
        const btn  = document.createElement('button');
        btn.type   = 'button';
        btn.className = 'time-slot';
        btn.onclick   = () => selectTime(btn);
        btn.innerText = slot;
        box.appendChild(btn);
    });
}

function selectTime(el) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    selectedTime = el.innerText.replace('✗','').trim();
}

// Submit booking → POST /bookings
async function confirmBooking() {
    const user = JSON.parse(localStorage.getItem('vaxUser'));
    if (!user) return;

    const date  = document.getElementById('bkDate').value;
    const errEl = document.getElementById('bk-error');
    errEl.innerText = '';

    if (!date)         { errEl.innerText = 'Please select a date.'; return; }
    if (!selectedTime) { errEl.innerText = 'Please select a time slot.'; return; }

    const confirmBtn = document.getElementById('bk-confirm');
    confirmBtn.disabled  = true;
    confirmBtn.innerText = 'Booking...';

    try {
        const res  = await fetch('/bookings', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('vaxToken') 
            },
            body: JSON.stringify({
                userId: user._id, vaccineId: bookingVaccineId,
                date, time: selectedTime, status: 'Pending'
            })
        });
        const data = await res.json();
        if (data.booking) {
            closeBookModal();
            showToast('Booking Confirmed', `Your appointment for ${document.getElementById('bk-name').innerText} is confirmed.`, 'success');
            loadVaccines();
            fetchNotifications();
            fetchUpcomingReminder();
        } else {
            errEl.innerText = 'Booking failed: ' + (data.message || 'Unknown error');
        }
    } catch (err) {
        console.error(err);
        errEl.innerText = 'Error connecting to server.';
    } finally {
        confirmBtn.disabled  = false;
        confirmBtn.innerText = 'Confirm Booking';
    }
}

// Page init: auth check, load vaccines, bind listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth('patient')) {
        syncTopNav();
        loadVaccines();
        fetchNotifications();
        fetchUpcomingReminder();
        document.getElementById('searchInput')?.addEventListener('input', loadVaccines);
        document.getElementById('locationInput')?.addEventListener('input', loadVaccines);
        document.getElementById('bkDate')?.addEventListener('change', loadSlots);
        document.getElementById('btnCurrentLocation')?.addEventListener('click', () => {
            const locInput = document.getElementById('locationInput');
            if (navigator.geolocation) {
                locInput.value = 'Locating...';
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        try {
                            const { latitude, longitude } = pos.coords;
                            const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                            const d = await r.json();
                            locInput.value = d.city || d.locality || d.principalSubdivision || '';
                            loadVaccines();
                        } catch { locInput.value = ''; }
                    },
                    () => { locInput.value = ''; }
                );
            }
        });
    }
});

// ── View Reviews Modal ──
async function viewReviews(vaccineId, vaccineName) {
    const modal = document.getElementById('reviewsModal');
    const titleEl = document.getElementById('rv-vaccine-name');
    const listEl = document.getElementById('rv-list');
    const avgEl = document.getElementById('rv-avg');
    const countEl = document.getElementById('rv-count');

    titleEl.textContent = vaccineName;
    listEl.innerHTML = '<p style="color:#64748b;text-align:center;padding:2rem;">Loading reviews...</p>';
    avgEl.textContent = '--';
    countEl.textContent = '';
    modal.classList.remove('hidden');

    try {
        const res = await fetch('/bookings');
        const allBookings = await res.json();

        const reviewed = allBookings.filter(b =>
            b.vaccineId && b.vaccineId._id === vaccineId &&
            (b.status || '').toLowerCase() === 'completed' &&
            b.rating && b.rating > 0
        );

        const avgRating = reviewed.length > 0
            ? (reviewed.reduce((sum, b) => sum + b.rating, 0) / reviewed.length)
            : 0;
        avgEl.textContent = avgRating > 0 ? avgRating.toFixed(1) : '--';
        const starsRow = document.getElementById('rv-stars-row');
        if (starsRow) {
            let starsHtml = '';
            const rounded = Math.round(avgRating);
            for (let i = 1; i <= 5; i++) {
                starsHtml += i <= rounded
                    ? '<span class="material-symbols-outlined" style="font-size:1.1rem;color:#f59e0b;font-variation-settings:\'FILL\' 1;">star</span>'
                    : '<span class="material-symbols-outlined" style="font-size:1.1rem;color:#d1d5db;font-variation-settings:\'FILL\' 0,\'wght\' 300;">star</span>';
            }
            starsRow.innerHTML = starsHtml;
        }
        countEl.textContent = reviewed.length + ' review' + (reviewed.length !== 1 ? 's' : '');

        listEl.innerHTML = '';

        if (reviewed.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center;padding:3rem 2rem;">
                    <div style="width:64px;height:64px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                        <span class="material-symbols-outlined" style="font-size:2rem;color:#94a3b8;">rate_review</span>
                    </div>
                    <div style="display:flex;justify-content:center;gap:2px;margin-bottom:0.75rem;"><span class="material-symbols-outlined" style="font-size:1.5rem;color:#d1d5db;font-variation-settings:'FILL' 0,'wght' 300;">star</span><span class="material-symbols-outlined" style="font-size:1.5rem;color:#d1d5db;font-variation-settings:'FILL' 0,'wght' 300;">star</span><span class="material-symbols-outlined" style="font-size:1.5rem;color:#d1d5db;font-variation-settings:'FILL' 0,'wght' 300;">star</span><span class="material-symbols-outlined" style="font-size:1.5rem;color:#d1d5db;font-variation-settings:'FILL' 0,'wght' 300;">star</span><span class="material-symbols-outlined" style="font-size:1.5rem;color:#d1d5db;font-variation-settings:'FILL' 0,'wght' 300;">star</span></div>
                    <h4 style="font-size:1rem;font-weight:700;color:#0f1d25;margin-bottom:0.25rem;">No Reviews Yet</h4>
                    <p style="color:#64748b;font-size:0.82rem;">Be the first to book and review this vaccine!</p>
                </div>`;
            return;
        }

        reviewed.sort((a, b) => new Date(b.date) - new Date(a.date));

        reviewed.forEach(b => {
            const patientName = b.userId ? b.userId.name : 'Patient';
            const initial = patientName.charAt(0).toUpperCase();
            const dateObj = new Date(b.date);
            const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                                const ratingColors = { 5: '#059669', 4: '#16a34a', 3: '#ca8a04', 2: '#ea580c', 1: '#dc2626' };
            const ratingColor = ratingColors[b.rating] || '#64748b';
            const ratingLabels = { 5: 'Excellent', 4: 'Good', 3: 'Average', 2: 'Below Average', 1: 'Poor' };
            const ratingLabel = ratingLabels[b.rating] || '';
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                stars += i <= b.rating
                    ? '<span class="material-symbols-outlined" style="font-size:1rem;color:' + ratingColor + ';font-variation-settings:\'FILL\' 1;">star</span>'
                    : '<span class="material-symbols-outlined" style="font-size:1rem;color:#d1d5db;font-variation-settings:\'FILL\' 0,\'wght\' 300;">star</span>';
            }
            const reviewText = b.review || '';

            listEl.innerHTML += `
            <div style="background:#fff;border-radius:1rem;padding:1.25rem;border:1px solid #e2eaf3;margin-bottom:0.75rem;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.75rem;">
                    <div style="display:flex;align-items:center;gap:0.6rem;">
                        <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#0061a4,#00a8ff);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;">${initial}</div>
                        <div>
                            <div style="font-weight:700;font-size:0.9rem;color:#0f1d25;">${patientName}</div>
                            <div style="font-size:0.72rem;color:#94a3b8;">${dateStr}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="display:flex;align-items:center;gap:1px;">${stars}</div>
                        <div style="font-size:0.65rem;font-weight:700;color:${ratingColor};text-transform:uppercase;">${ratingLabel}</div>
                    </div>
                </div>
                ${reviewText ? `<div style="background:#f8fafc;border-radius:0.6rem;padding:0.8rem 1rem;border-left:3px solid ${ratingColor};">
                    <p style="font-size:0.85rem;color:#404752;line-height:1.55;font-style:italic;">"${reviewText}"</p>
                </div>` : '<p style="font-size:0.8rem;color:#94a3b8;font-style:italic;">No written review</p>'}
            </div>`;
        });
    } catch (e) {
        console.error('Error loading reviews:', e);
        listEl.innerHTML = '<p style="color:#ba1a1a;text-align:center;padding:2rem;">Failed to load reviews.</p>';
    }
}

function closeReviewsModal() {
    document.getElementById('reviewsModal').classList.add('hidden');
}