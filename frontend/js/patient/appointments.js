// Month abbreviations for formatting dates in appointment cards
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];




// loadAppointments() — fetches all bookings for the current user from GET /bookings,
// then splits them into Upcoming (Pending/Accepted) and Completed sections
async function loadAppointments() {
const userStr = localStorage.getItem('vaxUser');
if (!userStr) { window.location.href = '/index.html'; return; }
const user = JSON.parse(userStr);
const activeEl = document.getElementById('activeContainer');
activeEl.innerHTML = '<p style="color:#64748b;text-align:center;padding:2rem;">Loading appointments...</p>';

try {
    const res = await fetch('/bookings?userId=' + user._id);
    if (!res.ok) {
        activeEl.innerHTML = '<div class="empty"><span class="material-symbols-outlined">error</span><p>Failed to load appointments (status ' + res.status + ')</p></div>';
        return;
    }
    const appointments = await res.json();

    activeEl.innerHTML = '';
    let count = 0;

    appointments.forEach(function(apt) {
        const status = (apt.status || '').toLowerCase();
        if (status !== 'pending' && status !== 'accepted') return;

        count++;
        const aptDate = new Date(apt.date);
        const mName   = isNaN(aptDate) ? 'Unknown' : monthNames[aptDate.getMonth()];
        const dNum    = isNaN(aptDate) ? '--' : aptDate.getDate();
        const yr      = isNaN(aptDate) ? '----' : aptDate.getFullYear();
        const vaxName = apt.vaccineId ? apt.vaccineId.name : 'Vaccine';
        const locName = apt.vaccineId ? apt.vaccineId.hospitalName : 'Unknown Hospital';

        const badgeCss = status === 'accepted'
            ? 'background:#d1fae5;color:#065f46;'
            : 'background:#fef9c3;color:#854d0e;';

        const totalD = apt.totalDoses > 1 ? apt.totalDoses : ((apt.vaccineId && apt.vaccineId.dosesRequired) || 1);
        const doseN  = apt.doseNumber || 1;
        const doseBadge = totalD > 1 
            ? '<span style="display:inline-block;padding:.1rem .5rem;border-radius:4px;font-size:.65rem;font-weight:700;text-transform:uppercase;background:#e9f5ff;color:#0061a4;margin-left:0.5rem;vertical-align:middle;">Dose ' + doseN + ' of ' + totalD + '</span>'
            : '';

        const safeLocName = locName.replace(/'/g, "\\'");
        const msgBtn = (apt.hospitalDetails && apt.hospitalDetails.id)
            ? '<button onclick="openChat(\'' + apt.hospitalDetails.id + '\', \'' + safeLocName + '\')" class="btn btn-sm" style="border-radius:9999px;background:#e0f2fe;border:none;color:#0284c7;font-weight:700;display:flex;align-items:center;gap:0.3rem;" title="Message Hospital"><span class="material-symbols-outlined" style="font-size:1.1rem;">chat</span> Message</button>'
            : '';

        activeEl.innerHTML +=
            '<div class="appt">' +
                '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f1f5f9;border-radius:1rem;padding:1rem 1.25rem;min-width:80px;text-align:center;">' +
                    '<span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#0061a4;">' + mName + '</span>' +
                    '<span style="font-size:2rem;font-weight:900;line-height:1;">' + dNum + '</span>' +
                '</div>' +
                '<div class="appt-info">' +
                    '<span style="display:inline-block;padding:.2rem .7rem;border-radius:9999px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;' + badgeCss + 'width:fit-content;">' + apt.status + '</span>' +
                    '<h4 style="display:flex;align-items:center;">' + vaxName + ' ' + doseBadge + '</h4>' +
                    '<p>' + locName + ' &middot; ' + (apt.time || 'TBD') + '</p>' +
                '</div>' +
                '<div class="appt-acts" style="display:flex;gap:0.5rem;align-items:center;">' +
                    '<button onclick="cancelAppointment(\'' + apt._id + '\')" class="btn btn-red btn-sm" style="border-radius:9999px;">Cancel</button>' +
                    msgBtn +
                '</div>' +
            '</div>';
    });

    if (count === 0) {
        activeEl.innerHTML = '<div class="empty"><span class="material-symbols-outlined">event_busy</span><p>No active appointments found</p><small>Book a vaccine from the dashboard to see it here.</small></div>';
    }
} catch (e) {
    console.error('loadAppointments error:', e);
    activeEl.innerHTML = '<div class="empty"><span class="material-symbols-outlined">error</span><p>Error loading appointments</p><small>' + e.message + '</small></div>';
}
}

// cancelAppointment() — sends PUT /bookings/:id with status='Cancelled'.
// The backend also restores +1 vaccine stock when a booking is cancelled.
async function cancelAppointment(id) {
try {
    const token = localStorage.getItem('vaxToken');
    await fetch('/bookings/' + id, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: 'Cancelled' })
    });
    loadAppointments();
} catch (e) { console.error(e); }
}

// DOMContentLoaded — entry point
document.addEventListener('DOMContentLoaded', async () => {
if (!await checkAuth('patient')) return;
syncTopNav();
loadAppointments();
});