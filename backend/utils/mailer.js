const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Send a vaccination reminder email
 * @param {string} to - recipient email
 * @param {object} details - { patientName, vaccine, hospital, date, time }
 */
async function sendReminderEmail(to, details) {
  const { patientName, vaccine, hospital, date, time } = details;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#0061a4,#0284c7);padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🏥 VaxCare</h1>
      <p style="color:#bae6fd;margin:4px 0 0;font-size:13px;">Vaccination Appointment Reminder</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#334155;line-height:1.6;margin-top:0;">
        Hello <strong>${patientName}</strong>,
      </p>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        This is a friendly reminder about your upcoming vaccination appointment:
      </p>
      <div style="background:#f0f8ff;border-left:4px solid #0061a4;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
          <tr><td style="padding:6px 0;font-weight:700;width:120px;">💉 Vaccine:</td><td>${vaccine}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700;">🏥 Hospital:</td><td>${hospital}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700;">📅 Date:</td><td>${date}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700;">🕐 Time:</td><td>${time}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#64748b;line-height:1.6;">
        Please arrive 10 minutes early and bring a valid government ID. If you need to reschedule, please cancel and rebook through the VaxCare portal.
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        This email was sent by VaxCare Clinical Sanctuary · Do not reply to this email
      </p>
    </div>
  </div>`;

  const mailOptions = {
    from: `"VaxCare Reminders" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🔔 Reminder: ${vaccine} vaccination on ${date}`,
    html
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendReminderEmail };
