function toggleDaysBetweenDoses() {
        const doses = document.getElementById('add-vax-doses').value;
        const wrap = document.getElementById('wrap-vax-days');
        if (doses > 1) {
          wrap.style.display = 'block';
        } else {
          wrap.style.display = 'none';
          document.getElementById('add-vax-days').value = 0;
        }
      }

(function() {
  var hash = window.location.hash.replace('#', '');
  var valid = ['dashboard','bookings','vaccines','history','reviews','messages'];
  var target = (hash && valid.indexOf(hash) !== -1) ? hash : 'dashboard';
  var el = document.getElementById(target);
  if (el) { el.classList.add('active'); el.style.display = 'block'; }
  // Also set the header title immediately
  var titles = { dashboard:'Dashboard Overview', bookings:'Active Bookings', vaccines:'Vaccine Inventory', history:'Vaccination History', reviews:'Patient Reviews', messages:'Patient Messages' };
  var ht = document.getElementById('header-title');
  if (ht && titles[target]) ht.innerText = titles[target];
  // Set active sidebar link
  var links = document.querySelectorAll('.sidenav .navlink[data-target]');
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('data-target') === target) links[i].classList.add('active');
    else links[i].classList.remove('active');
  }
})();

// Logic moved to centralised script.js

async function loadAdminData() {
const userStr = localStorage.getItem('vaxUser');
const currentUser = userStr ? JSON.parse(userStr) : { name: "Hospital Admin" };
const currentHospitalName = currentUser.name;

// Sync header UI
syncTopNav();

try {
    const [vaxRes, aptRes] = await Promise.all([
        fetch(`/vaccines?hospitalName=${encodeURIComponent(currentHospitalName)}`),
        fetch('/bookings')
    ]);
    const globalInventory    = await vaxRes.json();
    const globalAppointments = await aptRes.json();

    const inventory    = globalInventory.filter(v => v.hospitalName === currentHospitalName);
    const appointments = globalAppointments.filter(a => a.vaccineId && a.vaccineId.hospitalName === currentHospitalName);

    const pending = appointments.filter(a => ['pending','accepted'].includes((a.status||'').toLowerCase()));
    const completed = appointments.filter(a => (a.status||'').toLowerCase() === 'completed');
    
    // Total Bookings = In-progress (pending/accepted) + Completed
    document.getElementById('stat-total-bookings').innerText  = pending.length + completed.length;
    document.getElementById('stat-avail-vaccines').innerText  = inventory.reduce((s, v) => s + (v.stock || 0), 0);
    document.getElementById('stat-today-appts').innerText     = pending.length;

    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    const todayIso = `${yyyy}-${mm}-${dd}`;

    const todayList = document.getElementById('today-appointments-list');
    todayList.innerHTML = '';

    const todaysPending = pending.filter(a => {
        if (!a.date) return false;
        const aptDate = new Date(a.date);
        if (!isNaN(aptDate)) {
            return aptDate.getFullYear() === yyyy &&
                   String(aptDate.getMonth() + 1).padStart(2, '0') === mm &&
                   String(aptDate.getDate()).padStart(2, '0') === dd;
        }
        return a.date === todayIso;
    });

    if (todaysPending.length === 0) {
        todayList.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:3rem;color:#404752;">
            <span class="material-symbols-outlined" style="font-size:2.5rem;display:block;opacity:.4;margin-bottom:.5rem;">calendar_today</span>
            No appointments today
        </td></tr>`;
    } else {
        todaysPending.slice(0, 5).forEach(apt => {
            todayList.innerHTML += `
                <tr>
                    <td>${apt.time || 'TBD'}</td>
                    <td style="font-weight:700;">${apt.userId ? apt.userId.name : 'Unknown'}</td>
                    <td><span class="badge badge-completed">${apt.vaccineId ? apt.vaccineId.name : 'Vaccine'}</span></td>
                </tr>`;
        });
    }

    const pendingEl   = document.getElementById('pending-bookings');
    pendingEl.innerHTML   = '';

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let pCount = 0;

    appointments.forEach(apt => {
        const aptDate = new Date(apt.date);
        const mName   = isNaN(aptDate) ? 'Unknown' : monthNames[aptDate.getMonth()];
        const dNum    = isNaN(aptDate) ? '' : aptDate.getDate();
        const vaxName = apt.vaccineId ? apt.vaccineId.name : 'Vaccine';
        const ptName  = apt.userId    ? apt.userId.name    : 'Unknown';
        const ptAge   = (apt.userId && apt.userId.age) ? apt.userId.age : 'N/A';
        const ptGender = (apt.userId && apt.userId.gender) ? apt.userId.gender : 'N/A';
        const status  = (apt.status || '').toLowerCase();

        // Only show Pending or Accepted in the "Active Bookings" section
        if (status === 'pending' || status === 'accepted') {
            pCount++;
            const statusBadge = status === 'accepted'
                ? `<span class="badge badge-accepted" style="background:#dbeafe; color:#1e40af;">Confirmed</span>`
                : `<span class="badge badge-pending">Awaiting Approval</span>`;
            
            const actionButtons = status === 'pending'
                ? `<button class="btn-accept" onclick="updateBooking('${apt._id}','Accepted')">Approve Appointment</button>`
                : `<button class="btn-complete" onclick="updateBooking('${apt._id}','Completed')">Mark as Completed</button>`;

            pendingEl.innerHTML += `
                <div class="card" style="display:flex;flex-direction:column; border-left: 4px solid ${status === 'accepted' ? '#0061a4' : '#fbbf24'};">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
                        <div>
                            <h4 style="font-size:1rem;display:flex;align-items:center;gap:.3rem; color: #0f1d25;">
                                <span class="material-symbols-outlined" style="font-size:1.1rem;color:#0061a4;">person</span>
                                ${ptName}
                            </h4>
                            <p style="font-size:.75rem; color:#64748b; margin-left: 1.4rem;">${ptAge !== 'N/A' ? ptAge + 'y' : 'Age N/A'} · ${ptGender}</p>
                            <p style="font-size:.875rem;color:#404752;display:flex;align-items:center;gap:.3rem; margin-top: 0.5rem;">
                                <span class="material-symbols-outlined" style="font-size:1rem; color: #0061a4;">vaccines</span>
                                <span style="font-weight: 700;">${vaxName}</span>
                                ${(apt.totalDoses > 1 || (apt.vaccineId && apt.vaccineId.dosesRequired > 1)) ? `<span style="display:inline-block;padding:.1rem .4rem;border-radius:4px;font-size:.65rem;font-weight:700;text-transform:uppercase;background:#e9f5ff;color:#0061a4;vertical-align:middle;">Dose ${apt.doseNumber || 1}/${apt.totalDoses > 1 ? apt.totalDoses : apt.vaccineId.dosesRequired}</span>` : ''}
                            </p>
                        </div>
                        ${statusBadge}
                    </div>
                    <div style="background: #f8fafc; padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 1rem;">
                        <p style="font-size:.875rem;color:#0f1d25;display:flex;align-items:center;gap:.4rem; font-weight: 600;">
                            <span class="material-symbols-outlined" style="font-size:1.1rem; color: #64748b;">event</span>
                            ${mName} ${dNum} · ${apt.time || 'TBD'}
                        </p>
                    </div>
                    <div class="act-row">
                        ${actionButtons}
                        <button class="btn-reject" style="flex: 0.4;" onclick="updateBooking('${apt._id}','Rejected')">Reject</button>
                        ${apt.userId && apt.userId._id ? `<button style="flex:0.4;background:#dbeafe;color:#1e40af;padding:0.5rem;font-size:0.82rem;font-weight:700;border-radius:0.75rem;border:none;cursor:pointer;" onclick="openChat('${apt.userId._id}', '${ptName}')">Message</button>` : ''}
                    </div>
                </div>`;
        }
    });

    if (pCount === 0) pendingEl.innerHTML = emptyBox('hourglass_empty','No pending bookings');

    const vaxList = document.getElementById('vaccine-inventory-list');
    vaxList.innerHTML = '';
    if (inventory.length === 0) {
        vaxList.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2.5rem;color:#404752;">No vaccines registered yet.</td></tr>`;
    } else {
        inventory.forEach(vax => {
            const stockBadge = vax.stock > 10
                ? `<span class="badge badge-available">${vax.stock} units</span>`
                : `<span class="badge badge-out">${vax.stock} units (low)</span>`;
            vaxList.innerHTML += `
                <tr>
                    <td style="font-weight:700;">${vax.name}</td>
                    <td>${vax.doctorName || 'Staff'} <span style="font-size:.75rem;color:#404752;">(${vax.experience || '0 yrs'})</span></td>
                    <td style="font-weight:700;color:#065f46;">₹${(vax.cost || 0).toLocaleString('en-IN')}</td>
                    <td>${stockBadge}</td>
                    <td style="text-align:right;">
                        <button class="btn-stock" onclick="addStock('${vax._id}',10)">+10 Stock</button>
                        <button class="btn-edit" onclick='openEditModal(${JSON.stringify(vax).replace(/'/g, "&apos;")})'  title="Edit vaccine">
                            <span class="material-symbols-outlined" style="font-size:1rem;">edit</span>
                        </button>
                        <button class="btn-del" onclick="deleteVaccine('${vax._id}')">
                            <span class="material-symbols-outlined" style="font-size:1rem;">delete</span>
                        </button>
                    </td>
                </tr>`;
        });
    }

} catch (e) { console.error('Error loading admin data:', e); }
}

function emptyBox(icon, text) {
return `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#404752;border:2px dashed #bfc7d4;border-radius:1rem;">
    <span class="material-symbols-outlined" style="font-size:2.5rem;display:block;opacity:.4;margin-bottom:.5rem;">${icon}</span>
    <p style="font-weight:600;">${text}</p>
</div>`;
}

async function addStock(id, amount) {
await fetch('/vaccines/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stockIncrement: amount })
});
loadAdminData();
}

async function deleteVaccine(id) {
if (!confirm('Delete this vaccine?')) return;
await fetch('/vaccines/' + id, { method: 'DELETE' });
loadAdminData();
}

// ── Edit Vaccine Modal ─────────────────────────────────────
function openEditModal(vax) {
document.getElementById('edit-vax-id').value     = vax._id;
document.getElementById('edit-vax-name').value   = vax.name || '';
document.getElementById('edit-vax-doctor').value = vax.doctorName || '';
// Parse numeric years from experience string like "5 yrs experience"
const expMatch = (vax.experience || '').match(/(\d+)/);
document.getElementById('edit-vax-exp').value    = expMatch ? expMatch[1] : '';
document.getElementById('edit-vax-stock').value  = vax.stock || 0;
document.getElementById('edit-vax-cost').value   = vax.cost || 0;
document.getElementById('edit-vax-doses').value  = vax.dosesRequired || 1;
document.getElementById('edit-vax-days').value   = vax.daysBetweenDoses || 0;
// Show/hide days-between-doses field
const doses = vax.dosesRequired || 1;
document.getElementById('edit-wrap-days').style.display = doses > 1 ? 'block' : 'none';
// Listen for dose changes
document.getElementById('edit-vax-doses').onchange = function() {
    document.getElementById('edit-wrap-days').style.display = this.value > 1 ? 'block' : 'none';
};
document.getElementById('edit-vaccine-overlay').classList.remove('hidden');
}

function closeEditModal() {
document.getElementById('edit-vaccine-overlay').classList.add('hidden');
}

async function saveEditVaccine() {
const id     = document.getElementById('edit-vax-id').value;
const name   = document.getElementById('edit-vax-name').value.trim();
const doctor = document.getElementById('edit-vax-doctor').value.trim();
const exp    = document.getElementById('edit-vax-exp').value.trim();
const stock  = parseInt(document.getElementById('edit-vax-stock').value) || 0;
const cost   = parseFloat(document.getElementById('edit-vax-cost').value);
const dosesRequired    = parseInt(document.getElementById('edit-vax-doses').value) || 1;
const daysBetweenDoses = parseInt(document.getElementById('edit-vax-days').value)  || 0;

if (!name)   { alert('Vaccine name is required'); return; }
if (!doctor) { alert('Doctor name is required');  return; }
if (isNaN(cost) || cost < 0) { alert('Please enter a valid cost'); return; }

const saveBtn = event.currentTarget;
const origText = saveBtn.textContent;
saveBtn.textContent = 'Saving...';
saveBtn.disabled = true;

try {
    const res = await fetch('/vaccines/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            doctorName: doctor,
            experience: exp ? exp + ' yrs experience' : 'Experienced',
            stock,
            cost,
            dosesRequired,
            daysBetweenDoses
        })
    });
    const data = await res.json();
    if (!res.ok) { alert('Update failed: ' + (data.message || 'Server error')); return; }
    closeEditModal();
    loadAdminData();
} catch (err) {
    console.error(err);
    alert('Could not connect to server.');
} finally {
    saveBtn.textContent = origText;
    saveBtn.disabled = false;
}
}

async function updateBooking(id, status) {
await fetch('/bookings/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
});
loadAdminData();
}

async function registerVaccine() {
const name   = document.getElementById('add-vax-name').value.trim();
const doctor = document.getElementById('add-vax-doctor').value.trim();
const exp    = document.getElementById('add-vax-exp').value.trim();
const stock  = parseInt(document.getElementById('add-vax-stock').value) || 0;
const cost   = parseFloat(document.getElementById('add-vax-cost').value);
const dosesRequired = parseInt(document.getElementById('add-vax-doses').value) || 1;
const daysBetweenDoses = parseInt(document.getElementById('add-vax-days').value) || 0;

if (!name)   { alert('Vaccine name is required'); return; }
if (isNaN(cost) || cost < 0) { alert('Please enter a valid cost (≥ 0)'); return; }
if (!doctor) { alert('Doctor name is required');  return; }

const userStr = localStorage.getItem('vaxUser');
const user    = userStr ? JSON.parse(userStr) : {};
const location = user.location || 'Not specified';

try {
    const res  = await fetch('/vaccines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            doctorName:   doctor || 'Assigned Staff',
            experience:   exp ? exp + ' yrs experience' : 'Experienced',
            stock,
            cost,
            hospitalName: user.name || 'Hospital',
            location,
            rating: 0,
            dosesRequired,
            daysBetweenDoses
        })
    });
    const data = await res.json();
    if (!res.ok) { alert('Failed to add vaccine: ' + (data.message || 'Server error')); return; }
    ['add-vax-name','add-vax-doctor','add-vax-exp','add-vax-stock','add-vax-cost', 'add-vax-doses', 'add-vax-days']
        .forEach(id => document.getElementById(id).value = '');
    document.getElementById('wrap-vax-days').style.display = 'none';
    loadAdminData();
} catch (err) {
    console.error(err);
    alert('Could not connect to server. Make sure it is running.');
}
}

function switchSection(id) {
const titleMap = { dashboard: 'Dashboard Overview', bookings: 'Active Bookings', vaccines: 'Vaccine Inventory', history: 'Vaccination History', reviews: 'Patient Reviews', messages: 'Patient Messages' };

// Guard: only switch if the target section exists
const activeSec = document.getElementById(id);
if (!activeSec) {
    console.warn('switchSection: section "' + id + '" not found, falling back to dashboard');
    if (id !== 'dashboard') switchSection('dashboard');
    return;
}

// Skip if already showing this section (prevents flash on page load)
if (activeSec.classList.contains('active') && activeSec.style.display === 'block') {
    // Still update header and sidebar highlight in case they're stale
    document.getElementById('header-title').innerText = titleMap[id] || id;
    if (window.location.hash !== '#' + id) {
        window.history.pushState(null, null, '#' + id);
    }
    document.querySelectorAll('.sidenav .navlink').forEach(item => {
        if (item.dataset.target) {
            item.classList.toggle('active', item.dataset.target === id);
        }
    });
    if (id === 'reviews') loadReviews();
    if (id === 'history') loadHistory();
    if (id === 'messages') loadHospitalMessages();
    return;
}

document.getElementById('header-title').innerText = titleMap[id] || id;

if (window.location.hash !== '#' + id) {
    window.history.pushState(null, null, '#' + id);
}

const sections = document.querySelectorAll('.page-sec');
sections.forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
});

activeSec.style.display = 'block';
// Force reflow for transition
void activeSec.offsetWidth;
activeSec.classList.add('active');

document.querySelectorAll('.sidenav .navlink').forEach(item => {
    if (item.dataset.target) {
        item.classList.toggle('active', item.dataset.target === id);
    }
});

if (id === 'reviews') loadReviews();
if (id === 'history') loadHistory();
if (id === 'messages') loadHospitalMessages();
}

// ── Load Hospital Messages ──
let cachedChatArray = [];

function getAvatarColor(name) {
  const colors = [
    'linear-gradient(135deg,#0061a4,#0ea5e9)',
    'linear-gradient(135deg,#0891b2,#22d3ee)',
    'linear-gradient(135deg,#0369a1,#38bdf8)',
    'linear-gradient(135deg,#0284c7,#7dd3fc)',
    'linear-gradient(135deg,#075985,#0ea5e9)'
  ];
  var hash = 0;
  for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function filterMessages() {
  var query = (document.getElementById('msg-search-input').value || '').toLowerCase();
  renderMessageList(cachedChatArray.filter(function(p) { return p.name.toLowerCase().includes(query); }));
}

function renderMessageList(chatArray) {
  var msgList = document.getElementById('hospital-messages-list');
  msgList.innerHTML = '';

  if (chatArray.length === 0) {
msgList.innerHTML = '<div style="text-align:center;padding:3rem;color:#94a3b8;">' +
  '<span class="material-symbols-outlined" style="font-size:2.5rem;display:block;margin-bottom:0.5rem;opacity:.35;">search_off</span>' +
  '<p style="font-weight:600;color:#64748b;">No matching conversations</p>' +
  '</div>';
return;
  }

  chatArray.forEach(function(pat) {
var displayMsg = pat.lastMsg;
if (displayMsg.length > 55) displayMsg = displayMsg.slice(0, 55) + '...';
if (!displayMsg) displayMsg = 'No messages yet — tap to start chatting';

var avatarBg = getAvatarColor(pat.name);
var safeName = pat.name.replace(/'/g, "\\'");
var hasMsg = pat.lastTime > 0;
var msgColor = hasMsg ? '#334155' : '#94a3b8';
var msgWeight = hasMsg ? '400' : '400';
var msgStyle = !hasMsg ? 'font-style:italic;' : '';

var card = '<div onclick="openChat(\'' + pat.id + '\', \'' + safeName + '\')" ' +
  'class="msg-card" data-name="' + pat.name.toLowerCase() + '" ' +
  'style="cursor:pointer;display:flex;align-items:center;gap:0.85rem;padding:0.85rem 1rem;' +
  'background:#ffffff;border:1.5px solid #e2e8f0;border-radius:0.85rem;' +
  'transition:all 0.2s cubic-bezier(0.16,1,0.3,1);" ' +
  'onmouseover="this.style.borderColor=\'#0284c7\';this.style.background=\'#f0f9ff\';this.style.boxShadow=\'0 2px 12px rgba(2,132,199,0.1)\';this.style.transform=\'translateY(-1px)\'" ' +
  'onmouseout="this.style.borderColor=\'#e2e8f0\';this.style.background=\'#ffffff\';this.style.boxShadow=\'none\';this.style.transform=\'none\'">' +

    // Avatar
    '<div style="width:44px;height:44px;border-radius:50%;background:' + avatarBg + ';color:#fff;' +
    'display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;' +
    'flex-shrink:0;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.12);">' +
    pat.name.charAt(0).toUpperCase() + '</div>' +

    // Content
    '<div style="flex:1;min-width:0;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">' +
        '<h4 style="font-size:0.92rem;font-weight:700;color:#0f1d25;margin:0;font-family:\'Manrope\',sans-serif;">' + pat.name + '</h4>' +
        (pat.dateStr ? '<span style="font-size:0.7rem;color:#94a3b8;font-weight:600;white-space:nowrap;margin-left:0.5rem;">' + pat.dateStr + '</span>' : '') +
      '</div>' +
      '<p style="font-size:0.8rem;color:' + msgColor + ';font-weight:' + msgWeight + ';margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + msgStyle + '">' + displayMsg + '</p>' +
    '</div>' +

    // Arrow
    '<span class="material-symbols-outlined" style="font-size:1.1rem;color:#cbd5e1;flex-shrink:0;">chevron_right</span>' +

  '</div>';

msgList.innerHTML += card;
  });
}

async function loadHospitalMessages() {
var msgList = document.getElementById('hospital-messages-list');
msgList.innerHTML = '<div style="text-align:center;padding:2.5rem;color:#94a3b8;">' +
  '<span class="material-symbols-outlined" style="font-size:1.5rem;display:block;animation:spin 1s linear infinite;">progress_activity</span>' +
  '<p style="margin-top:0.5rem;font-size:0.82rem;">Loading conversations...</p></div>';
var userStr = localStorage.getItem('vaxUser');
if (!userStr) return;
var user = JSON.parse(userStr);

try {
    // ── Source 1: patients who have booked from this hospital ──
    var patientMap = new Map();
    try {
        var res = await fetch('/bookings');
        if (res.ok) {
            var allBookings = await res.json();
            allBookings
                .filter(function(a) { return a.vaccineId && a.vaccineId.hospitalName === user.name; })
                .forEach(function(b) {
                    if (b.userId && b.userId._id && !patientMap.has(b.userId._id)) {
                        patientMap.set(b.userId._id, { id: b.userId._id, name: b.userId.name || 'Patient', lastMsg: '', lastTime: 0, dateStr: '' });
                    }
                });
        }
    } catch(e) { console.warn('Bookings fetch failed', e); }

    // ── Source 2: patients who have actually messaged this hospital ──
    try {
        var convRes = await fetch('/messages/conversations/' + user._id);
        if (convRes.ok) {
            var convList = await convRes.json();
            convList.forEach(function(c) {
                if (!patientMap.has(c.partnerId)) {
                    patientMap.set(c.partnerId, { id: c.partnerId, name: c.partnerName, lastMsg: c.lastMsg, lastTime: c.lastTime, dateStr: c.dateStr });
                } else {
                    // Update existing entry with real message data
                    var existing = patientMap.get(c.partnerId);
                    existing.lastMsg = c.lastMsg;
                    existing.lastTime = c.lastTime;
                    existing.dateStr = c.dateStr;
                }
            });
        }
    } catch(e) { console.warn('Conversations fetch failed', e); }

    if (patientMap.size === 0) {
        msgList.innerHTML = '<div style="text-align:center;padding:3.5rem 2rem;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:1rem;background:#fafbfc;">' +
          '<span class="material-symbols-outlined" style="font-size:3rem;display:block;opacity:.3;margin-bottom:0.75rem;">forum</span>' +
          '<p style="font-weight:700;color:#64748b;font-size:0.95rem;">No patient conversations yet</p>' +
          '<small style="font-size:0.8rem;">When patients message you about their bookings, conversations will appear here.</small>' +
          '</div>';
        return;
    }

    // For booked patients without messages, fetch their last message
    for (var entry of patientMap.entries()) {
        var patientId = entry[0];
        var patData = entry[1];
        if (patData.lastTime === 0) {
            var sortedIds = [user._id, patientId].sort();
            var conversationId = sortedIds[0] + '_' + sortedIds[1];
            try {
                var msgRes = await fetch('/messages/' + conversationId);
                if (msgRes.ok) {
                    var msgs = await msgRes.json();
                    if (msgs.length > 0) {
                        var last = msgs[msgs.length - 1];
                        patData.lastMsg = last.message;
                        patData.lastTime = new Date(last.timestamp).getTime();
                        var d = new Date(last.timestamp);
                        patData.dateStr = d.toDateString() === new Date().toDateString()
                            ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : d.toLocaleDateString([], {month: 'short', day: 'numeric'});
                    }
                }
            } catch(e) {}
        }
    }

    cachedChatArray = Array.from(patientMap.values()).sort(function(a, b) { return b.lastTime - a.lastTime; });
    renderMessageList(cachedChatArray);
} catch(e) {
    console.error(e);
    msgList.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626;">' +
      '<span class="material-symbols-outlined" style="font-size:1.5rem;display:block;margin-bottom:0.5rem;">error</span>' +
      '<p style="font-weight:600;">Error loading messages</p></div>';
}
}

// ── Hospital Timings ──────────────────────────────────────────
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DEFAULT_TIMINGS = {
Mon: { open: '09:00', close: '17:00', closed: false },
Tue: { open: '09:00', close: '17:00', closed: false },
Wed: { open: '09:00', close: '17:00', closed: false },
Thu: { open: '09:00', close: '17:00', closed: false },
Fri: { open: '09:00', close: '17:00', closed: false },
Sat: { open: '09:00', close: '13:00', closed: false },
Sun: { open: '09:00', close: '13:00', closed: true  }
};

function buildTimings() {
const saved = JSON.parse(localStorage.getItem('hospitalTimings') || 'null') || DEFAULT_TIMINGS;
const list  = document.getElementById('timings-list');
if (!list) return;
list.innerHTML = '';
DAYS.forEach(day => {
    const t = saved[day] || DEFAULT_TIMINGS[day];
    const row = document.createElement('div');
    row.className = 'timing-row' + (t.closed ? ' is-closed' : '');
    row.id = 'trow-' + day;
    row.innerHTML = `
        <span class="day-lbl">${day}</span>
        <input type="time" id="t-open-${day}"  value="${t.open}"  ${t.closed ? 'disabled' : ''}/>
        <input type="time" id="t-close-${day}" value="${t.close}" ${t.closed ? 'disabled' : ''}/>
        <label class="closed-lbl">
            <input type="checkbox" id="t-closed-${day}" ${t.closed ? 'checked' : ''}
                onchange="toggleDay('${day}')"/>
            Closed
        </label>`;
    list.appendChild(row);
});
}

function toggleDay(day) {
const chk  = document.getElementById('t-closed-' + day);
const row  = document.getElementById('trow-' + day);
const open = document.getElementById('t-open-' + day);
const cls  = document.getElementById('t-close-' + day);
const isClosed = chk.checked;
row.classList.toggle('is-closed', isClosed);
open.disabled = isClosed;
cls.disabled  = isClosed;
}

async function saveTimings() {
const data = {};
DAYS.forEach(day => {
    data[day] = {
        open:   document.getElementById('t-open-'   + day)?.value || '09:00',
        close:  document.getElementById('t-close-'  + day)?.value || '17:00',
        closed: document.getElementById('t-closed-' + day)?.checked || false
    };
});

localStorage.setItem('hospitalTimings', JSON.stringify(data));

const btn = event.currentTarget;
const userStr = localStorage.getItem('vaxUser');
const user = userStr ? JSON.parse(userStr) : {};
try {
    await fetch('/hospitals/' + encodeURIComponent(user.name) + '/timings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timings: data })
    });
    btn.textContent = '✓ Saved!';
    btn.style.background = '#16a34a';
} catch {
    btn.textContent = '✓ Local only';
    btn.style.background = '#ca8a04';
}
setTimeout(() => { btn.textContent = 'Save Timings'; btn.style.background = ''; }, 2000);
}

// ── Load Reviews ──
async function loadReviews() {
const userStr = localStorage.getItem('vaxUser');
const user = userStr ? JSON.parse(userStr) : {};
const hospitalName = user.name || '';
const reviewsEl = document.getElementById('reviews-list');
reviewsEl.innerHTML = '<p style="color:#64748b;text-align:center;padding:2rem;">Loading reviews...</p>';

try {
    const res = await fetch('/bookings');
    const allBookings = await res.json();

    // Filter: completed bookings for this hospital that have a rating
    const reviewed = allBookings.filter(b =>
        b.vaccineId && b.vaccineId.hospitalName === hospitalName &&
        (b.status || '').toLowerCase() === 'completed' &&
        b.rating && b.rating > 0
    );

    // Calculate average rating
    const avgRating = reviewed.length > 0
        ? (reviewed.reduce((sum, b) => sum + b.rating, 0) / reviewed.length)
        : 0;
    document.getElementById('avg-rating-value').textContent = avgRating > 0 ? avgRating.toFixed(1) : '--';
    document.getElementById('review-count').textContent = reviewed.length + ' review' + (reviewed.length !== 1 ? 's' : '');

    reviewsEl.innerHTML = '';

    if (reviewed.length === 0) {
        reviewsEl.innerHTML = `
            <div style="text-align:center;padding:4rem 2rem;background:#fff;border-radius:1.25rem;box-shadow:0 2px 8px rgba(15,29,37,0.06);">
                <div style="width:72px;height:72px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                    <span class="material-symbols-outlined" style="font-size:2.5rem;color:#94a3b8;">rate_review</span>
                </div>
                <h4 style="font-size:1.1rem;font-weight:700;color:#0f1d25;margin-bottom:0.25rem;">No Reviews Yet</h4>
                <p style="color:#64748b;font-size:0.85rem;">Patient reviews will appear here after they rate completed vaccinations.</p>
            </div>`;
        return;
    }

    // Sort by most recent first
    reviewed.sort((a, b) => new Date(b.date) - new Date(a.date));

    reviewed.forEach(b => {
        const patientName = b.userId ? b.userId.name : 'Anonymous';
        const patientInitial = patientName.charAt(0).toUpperCase();
        const vaccineName = b.vaccineId ? b.vaccineId.name : 'Vaccine';
        const dateObj = new Date(b.date);
        const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown';
        const stars = '★'.repeat(b.rating) + '☆'.repeat(5 - b.rating);
        const reviewText = b.review || '';

        // Color coding for ratings
        const ratingColors = { 5: '#059669', 4: '#16a34a', 3: '#ca8a04', 2: '#ea580c', 1: '#dc2626' };
        const ratingColor = ratingColors[b.rating] || '#64748b';
        const ratingLabels = { 5: 'Excellent', 4: 'Good', 3: 'Average', 2: 'Below Average', 1: 'Poor' };
        const ratingLabel = ratingLabels[b.rating] || '';

        reviewsEl.innerHTML += `
        <div style="background:#fff;border-radius:1.25rem;padding:1.75rem;box-shadow:0 2px 8px rgba(15,29,37,0.06);border:1px solid #e2eaf3;transition:transform 0.2s,box-shadow 0.2s;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem;">
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0061a4,#00a8ff);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;flex-shrink:0;">${patientInitial}</div>
                    <div>
                        <div style="font-weight:700;font-size:0.95rem;color:#0f1d25;">${patientName}</div>
                        <div style="font-size:0.78rem;color:#64748b;display:flex;align-items:center;gap:0.5rem;">
                            <span class="material-symbols-outlined" style="font-size:0.85rem;">vaccines</span>
                            ${vaccineName} · ${dateStr}
                        </div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="color:${ratingColor};font-size:1.1rem;letter-spacing:2px;">${stars}</div>
                    <div style="font-size:0.72rem;font-weight:700;color:${ratingColor};text-transform:uppercase;letter-spacing:0.05em;">${ratingLabel}</div>
                </div>
            </div>
            ${reviewText ? `<div style="background:#f8fafc;border-radius:0.75rem;padding:1rem 1.25rem;border-left:3px solid ${ratingColor};">
                <p style="font-size:0.88rem;color:#404752;line-height:1.6;font-style:italic;">"${reviewText}"</p>
            </div>` : '<div style="font-size:0.82rem;color:#94a3b8;font-style:italic;">No written review provided</div>'}
        </div>`;
    });
} catch (e) {
    console.error('Error loading reviews:', e);
    reviewsEl.innerHTML = '<p style="color:#ba1a1a;text-align:center;padding:2rem;">Failed to load reviews.</p>';
}
}

async function loadHistory() {
const userStr = localStorage.getItem('vaxUser');
const currentUser = userStr ? JSON.parse(userStr) : {};
const currentHospitalName = currentUser.name;
const historyGrid = document.getElementById('history-grid');
historyGrid.innerHTML = '<p style="text-align:center;padding:3rem;color:#64748b;">Loading history records...</p>';

try {
    const res = await fetch('/bookings');
    const allBookings = await res.json();

    const completed = allBookings.filter(b =>
        b.vaccineId && b.vaccineId.hospitalName === currentHospitalName &&
        (b.status || '').toLowerCase() === 'completed'
    );

    completed.sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('history-count').innerText = completed.length;
    historyGrid.innerHTML = '';

    if (completed.length === 0) {
        historyGrid.innerHTML = `
        <div style="text-align:center;padding:5rem 2rem;background:#fff;border-radius:1.5rem;border:2px dashed #e2eaf3;">
            <span class="material-symbols-outlined" style="font-size:4rem;color:#cbd5e1;margin-bottom:1rem;">history</span>
            <h3 style="color:#475569;font-weight:700;">No History Records</h3>
            <p style="color:#94a3b8;max-width:300px;margin:0.5rem auto;">When you mark bookings as completed, they will appear here as permanent records.</p>
        </div>`;
        return;
    }

    completed.forEach(b => {
        const ptName = b.userId ? b.userId.name : 'Unknown Patient';
        const vaxName = b.vaccineId ? b.vaccineId.name : 'Vaccine';
        const dateObj = new Date(b.date);
        const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        const timeStr = b.time || 'N/A';
        const doseInfo = (b.totalDoses > 1 || (b.vaccineId && b.vaccineId.dosesRequired > 1))
            ? `Dose ${b.doseNumber || 1} of ${b.totalDoses > 1 ? b.totalDoses : b.vaccineId.dosesRequired}`
            : 'Full Course (Single Dose)';

        historyGrid.innerHTML += `
            <div style="background:#fff; border-radius:1rem; border:1px solid #e2eaf3; padding:1.5rem; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.02); transition:all 0.3s ease;">
                <div style="display:flex; align-items:center; gap:1.5rem;">
                    <div style="width:48px; height:48px; border-radius:12px; background:#f0fdf4; color:#16a34a; display:flex; align-items:center; justify-content:center;">
                        <span class="material-symbols-outlined" style="font-size:1.8rem;">task_alt</span>
                    </div>
                    <div>
                        <h4 style="font-size:1.1rem; font-weight:700; color:#0f1d25; margin:0;">${ptName}</h4>
                        <div style="display:flex; align-items:center; gap:0.8rem; margin-top:0.25rem;">
                            <span style="font-size:0.85rem; color:#64748b; background:#f1f5f9; padding:0.15rem 0.6rem; border-radius:4px;">${vaxName}</span>
                            <span style="font-size:0.85rem; color:#0061a4; font-weight:600;">${doseInfo}</span>
                        </div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700; color:#1e293b; font-size:0.95rem;">${dateStr}</div>
                    <div style="font-size:0.8rem; color:#64748b;">${timeStr}</div>
                    <div style="margin-top:0.5rem; font-size:0.65rem; font-weight:800; color:#16a34a; text-transform:uppercase; letter-spacing:0.05em; background:#dcfce7; padding:0.2rem 0.5rem; border-radius:4px; display:inline-block;">Verified Record</div>
                </div>
            </div>`;
    });
} catch (e) {
    console.error('Error loading history:', e);
    historyGrid.innerHTML = '<div class="card" style="text-align:center;color:#dc2626;padding:2rem;">Failed to load history. Please try again.</div>';
}
}

// ── Hospital Notification System ──────────────────────────────
const notifBtn = document.getElementById('notifBtn');
const notifDropdown = document.getElementById('notifDropdown');
const notifBadge = document.getElementById('notifBadge');
const notifList = document.getElementById('notifList');

if (notifBtn) {
notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = notifDropdown.style.display === 'block';
    notifDropdown.style.display = isVisible ? 'none' : 'block';
});
}
document.addEventListener('click', (e) => {
if (notifDropdown && !e.target.closest('#notifContainer')) {
    notifDropdown.style.display = 'none';
}
});

async function fetchHospitalNotifications() {
const token = localStorage.getItem('vaxToken');
try {
    const res = await fetch('/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { renderHospitalNotifications(await res.json()); }
} catch (err) { console.error('Error fetching notifications:', err); }
}

function renderHospitalNotifications(notifications) {
if (!notifList) return;
notifList.innerHTML = '';
const unreadCount = notifications.filter(n => !n.read).length;

if (unreadCount > 0) { 
    const currentCount = parseInt(notifBadge.textContent) || 0;
    if (unreadCount > currentCount && window.playNotificationSound) {
        window.playNotificationSound();
    }
    notifBadge.textContent = unreadCount; 
    notifBadge.classList.remove('hidden'); 
} else { 
    notifBadge.classList.add('hidden'); 
}

if (notifications.length === 0) { 
    notifList.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <span class="material-symbols-outlined" style="font-size: 2rem; color: #94a3b8; display:block; margin-bottom:0.5rem;">notifications_off</span>
        <h4 style="color: #0f1d25; font-size: 0.95rem; font-weight: 700;">All clear!</h4>
        <p style="color: #64748b; font-size: 0.8rem;">No notifications yet.</p>
      </div>
    `; 
    return; 
}
notifications.forEach(notif => {
    const item = document.createElement('div');
    item.style.cssText = `padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background 0.15s;${notif.read ? '' : 'background:#f0f7ff;'}`;
    item.onmouseover = () => item.style.background = '#f8fafc';
    item.onmouseout = () => item.style.background = notif.read ? '' : '#f0f7ff';

    const date = new Date(notif.createdAt);
    const timeStr = date.toLocaleDateString() === new Date().toLocaleDateString() 
      ? `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
      : date.toLocaleDateString([], {month: 'short', day: 'numeric'});

    // Determine icon based on notification type
    let notifIcon = 'notifications';
    let notifIconColor = '#64748b';
    let notifIconBg = '#f1f5f9';
    let actionHint = '';
    if (notif.type === 'booking' || (notif.title && notif.title.includes('Booking'))) {
        notifIcon = 'calendar_today';
        notifIconColor = '#0061a4';
        notifIconBg = '#dbeafe';
        actionHint = '<div style="font-size:0.68rem;color:#0061a4;font-weight:700;margin-top:0.3rem;display:flex;align-items:center;gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.75rem;">arrow_forward</span>Click to view bookings</div>';
    } else if (notif.type === 'message') {
        notifIcon = 'chat';
        notifIconColor = '#7c3aed';
        notifIconBg = '#ede9fe';
        actionHint = '<div style="font-size:0.68rem;color:#7c3aed;font-weight:700;margin-top:0.3rem;display:flex;align-items:center;gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.75rem;">arrow_forward</span>Click to open chat</div>';
    }

    item.innerHTML = `
      <div style="display:flex;gap:0.65rem;align-items:flex-start;">
        <div style="width:32px;height:32px;border-radius:50%;background:${notifIconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
          <span class="material-symbols-outlined" style="font-size:1rem;color:${notifIconColor};">${notifIcon}</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.85rem;font-weight:700;color:#0f1d25;margin-bottom:0.2rem;">${notif.title}</div>
          <div style="font-size:0.78rem;color:#404752;line-height:1.4;">${notif.message}</div>
          ${actionHint}
          <div style="font-size:0.7rem;color:#94a3b8;margin-top:0.25rem;">${timeStr}</div>
        </div>
        <button onclick="deleteHospitalNotif('${notif._id}', event)" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:2px;flex-shrink:0;" title="Delete">
          <span class="material-symbols-outlined" style="font-size:0.9rem;">delete</span>
        </button>
      </div>
    `;
    item.addEventListener('click', () => {
        if (!notif.read) markHospitalNotifRead(notif._id, item);
        
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
                        document.getElementById('notifDropdown').style.display = 'none';
                    }, 100);
                }
            }
        }
        // Handle booking notifications → switch to bookings section
        else if (notif.type === 'booking' || (notif.title && notif.title.includes('Booking Request'))) {
            document.getElementById('notifDropdown').style.display = 'none';
            switchSection('bookings');
        }
    });
    notifList.appendChild(item);
});
}

async function markHospitalNotifRead(id, element) {
const token = localStorage.getItem('vaxToken');
try {
    const res = await fetch(`/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
        element.style.background = '';
        const c = parseInt(notifBadge.textContent);
        if (c > 1) { notifBadge.textContent = c - 1; } else { notifBadge.classList.add('hidden'); }
    }
} catch (err) { console.error(err); }
}

async function deleteHospitalNotif(id, event) {
event.stopPropagation();
const token = localStorage.getItem('vaxToken');
try {
    const res = await fetch(`/notifications/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) fetchHospitalNotifications();
} catch (err) { console.error(err); }
}

if (document.getElementById('markAllReadBtn')) {
document.getElementById('markAllReadBtn').addEventListener('click', () => {
    notifList.querySelectorAll('div[style*="f0f7ff"]').forEach(i => i.style.background = '');
    notifBadge.classList.add('hidden');
});
}

document.addEventListener('DOMContentLoaded', async () => { 
if (await checkAuth('hospital')) {
    // Determine the target section from the URL hash BEFORE any async work
    const validSections = ['dashboard', 'bookings', 'vaccines', 'history', 'reviews', 'messages'];
    const hash = window.location.hash.replace('#', '');
    const targetSection = (hash && validSections.includes(hash)) ? hash : 'dashboard';

    // Show the target section immediately to prevent any flash
    switchSection(targetSection);

    syncTopNav();
    // Load data in the background — the section is already visible
    await loadAdminData(); 
    buildTimings();
    fetchHospitalNotifications();
    // Refresh notifications every 30 seconds
    setInterval(fetchHospitalNotifications, 30000);

    // ── Real-time Socket.IO for instant booking notifications ──
    try {
        const socket = io();
        const user = JSON.parse(localStorage.getItem('vaxUser'));
        if (user && user._id) {
            socket.emit('join', user._id);
            socket.on('newBookingNotification', (data) => {
                console.log('Real-time booking notification received:', data);
                // Play notification sound immediately
                if (window.playNotificationSound) window.playNotificationSound();
                // Refresh the notification list from the server
                fetchHospitalNotifications();
                // Also refresh bookings data if user is on bookings section
                loadAdminData();
            });
        }
    } catch (socketErr) { console.error('Socket.IO connection error:', socketErr); }
    
    // Listen for hash changes to allow back/forward navigation
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.replace('#', '') || 'dashboard';
        if (validSections.includes(newHash)) {
            switchSection(newHash);
        }
    });
}
});
