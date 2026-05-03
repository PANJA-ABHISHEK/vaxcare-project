const express = require('express');
const router = express.Router();

// ── Comprehensive VaxCare Knowledge Base (fed to Gemini as system prompt) ──
const VAXCARE_SYSTEM_PROMPT = `
You are VaxCare Assistant, a friendly and helpful AI chatbot for the VaxCare vaccination booking and management platform.
Your job is to answer ANY question about VaxCare features, navigation, and usage — even if the user has typos or unclear phrasing.
Always understand the user's intent and give a clear, helpful answer.

Here is COMPLETE knowledge about VaxCare:

=== PLATFORM OVERVIEW ===
VaxCare is a full-stack vaccination tracking and booking platform connecting patients with hospitals.
Patients can search, compare, and book vaccines. Hospitals can manage inventory, approve/reject bookings, and track records.

=== USER ROLES ===
1. Patient – Search vaccines, book appointments, track vaccination history, download certificates, rate/review hospitals, message hospitals.
2. Hospital/Admin – Add/manage vaccine inventory, approve/reject patient bookings, mark vaccinations as completed, view reviews, respond to messages.

=== REGISTRATION & LOGIN ===
- Click "Login" button at top-right of homepage.
- Modal appears with Login and Sign Up tabs.
- Select role: Patient or Hospital.
- Sign Up: Enter name, email, password, role-specific details (location, government ID for hospitals; age, gender for patients).
- Login: Enter email, password, select role.
- After login, redirected to role-specific dashboard.
- Passwords are securely hashed with bcrypt. Sessions use JWT tokens stored in localStorage.

=== PATIENT FEATURES ===

Patient Dashboard:
- Searchable list of available vaccines from all hospitals.
- Each card shows: vaccine name, hospital, price, available doses, "Book Now" button.
- Filter/search by name or hospital.
- Sidebar links: Dashboard, My Appointments, Vaccination History, Profile.

Booking a Vaccine:
- Click "Book Now" on any vaccine card.
- Select preferred date and time slot.
- Confirm booking.
- Status starts as "Pending" until hospital approves.
- Once approved → "Approved". After vaccination → "Completed".

My Appointments:
- View all current and past appointments.
- Status: Pending, Approved, Completed, Cancelled, Rejected.
- Cancel pending bookings with "Cancel" button.
- Message hospital directly with "Message" button.

Vaccination History:
- Shows all completed vaccinations.
- Download Vaccination Certificate (PDF) for completed vaccinations.
- Rate and review hospital (1-5 stars + text review).

Patient Profile:
- View/edit: name, email, phone, age, gender, government ID.
- Upload/change profile picture.
- Change password in Security section.

Vaccination Certificate:
- Available only for completed vaccinations.
- Professional PDF with patient details, vaccine info, hospital, date, certificate ID.

=== HOSPITAL/ADMIN FEATURES ===

Hospital Admin Dashboard:
- Overview stats: total vaccines, total bookings, average rating.
- Sidebar: Dashboard, Bookings, Vaccines, History, Reviews, Messages, Profile.

Managing Vaccines (Inventory):
- "Vaccines" tab in sidebar.
- "Add Vaccine" button to add new vaccine.
- Set: vaccine name, description, price, doses available, dose type.
- Edit or delete existing vaccines.

Managing Bookings:
- "Bookings" tab in sidebar.
- See all patient booking requests.
- Approve pending bookings, Reject with reason, Mark as Completed after vaccination.
- Filter between active and completed bookings.

Reviews:
- View patient ratings and reviews.
- See average rating and individual comments.

Messages:
- Real-time messaging with patients via Socket.io.
- Respond to patient queries about bookings.

Hospital Profile:
- Update hospital name, email, phone, registration ID, location, address, description.
- Upload hospital logo.
- Change password.

=== NOTIFICATIONS ===
- Bell icon in dashboard header.
- Patients notified when: booking submitted, approved, rejected, completed.
- Hospitals notified when: new booking request arrives.

=== MESSAGING ===
- Real-time chat between patients and hospitals.
- Access from "My Appointments" page → "Message" button on any booking.
- Messages delivered instantly using Socket.io.

=== CHATBOT (You!) ===
- Available on every page via floating chat bubble (bottom-right).
- Context-aware suggestions based on current page.
- Can answer any question about VaxCare.

=== TECHNICAL DETAILS ===
- Frontend: HTML, CSS, JavaScript (vanilla)
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- Authentication: JWT tokens with bcrypt password hashing
- Real-time: Socket.io for messaging
- Runs on localhost:5000 during development

=== RESPONSE RULES ===
1. Be helpful, friendly, and concise.
2. Give step-by-step instructions when explaining how to do something.
3. Use numbered lists for steps, bullet points for features.
4. If the user has typos, understand their intent and answer correctly.
5. YOU MUST STRICTLY DECLINE to answer ANY question that is not related to the VaxCare platform. This includes general knowledge, coding, math, world news, etc. Politely redirect to VaxCare topics.
6. Never say "I don't know" about VaxCare features.
7. Keep responses under 150 words for readability.
8. Do NOT use markdown formatting like **bold** or *italic* — use plain text only.
9. Use emojis sparingly (max 1-2 per response).
`;

// ── Initialize Gemini AI ─────────────────────────────────────────
const { GoogleGenerativeAI } = require('@google/generative-ai');
let genAI = null;
let geminiModel = null;

function getGeminiModel() {
  if (geminiModel) return geminiModel;
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  No GEMINI_API_KEY found in .env');
    return null;
  }
  
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: VAXCARE_SYSTEM_PROMPT
    });
    console.log('✅ Gemini AI (gemini-2.5-flash) initialized');
    return geminiModel;
  } catch (err) {
    console.error('❌ Gemini init failed:', err.message);
    return null;
  }
}

// ── Simple fallback (only used if Gemini API is completely down) ──
function getQuickFallback(message) {
  const lower = message.toLowerCase();
  
  if (/\b(hi|hello|hey)\b/i.test(message)) {
    return "Hello! 👋 Welcome to VaxCare. I can help you with booking vaccines, navigating your dashboard, downloading certificates, managing your profile, and more. What would you like to know?";
  }
  if (/\b(thank|thanks)\b/i.test(message)) {
    return "You're welcome! 😊 Feel free to ask anything else about VaxCare.";
  }
  if (lower.includes('login') || lower.includes('sign in'))
    return "To Login: Click \"Login\" at top-right → Select role (Patient/Hospital) → Enter email & password → Click \"Login to VaxCare\".";
  if (lower.includes('sign up') || lower.includes('register'))
    return "To Sign Up: Click \"Login\" → \"Sign Up\" tab → Choose role → Fill details → Click \"Create Account\".";
  if (lower.includes('book') || lower.includes('vaccin') || lower.includes('appoint'))
    return "To Book: Login as Patient → Dashboard → Browse vaccines → Click \"Book Now\" → Select date & time → Confirm. Booking starts as Pending until hospital approves.";
  if (lower.includes('certificate') || lower.includes('download'))
    return "To Download Certificate: Go to \"Vaccination History\" → Find completed vaccination → Click \"Certificate\" button → PDF downloads automatically.";
  if (lower.includes('profile'))
    return "To Edit Profile: Click \"Profile\" in sidebar → \"Edit Profile\" → Update details → \"Save Changes\". Change password in Security section.";
  if (lower.includes('cancel'))
    return "To Cancel: Go to \"My Appointments\" → Find the booking → Click \"Cancel\". Only Pending or Approved bookings can be cancelled.";
  if (lower.includes('message') || lower.includes('contact'))
    return "To Message Hospital: Go to \"My Appointments\" → Click \"Message\" on any booking → Chat in real-time!";
  if (lower.includes('hospital') || lower.includes('admin'))
    return "Hospital Dashboard: Manage Vaccines (add/edit), Bookings (approve/reject), view Reviews, Messages, and update Profile from the sidebar.";
  if (lower.includes('what') && lower.includes('vaxcare'))
    return "VaxCare is a vaccination booking platform connecting patients with hospitals. Book vaccines, track appointments, download certificates, rate hospitals, and chat in real-time!";

  return "I'm VaxCare Assistant! I can help with: booking vaccines, login/signup, appointments, certificates, profile, hospital management, messaging, and more. What would you like to know?";
}

// ── POST /chatbot ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ reply: "Please type a message!" });
    }

    // Try Gemini AI first (primary intelligence)
    const model = getGeminiModel();
    if (model) {
      try {
        const result = await model.generateContent(message);
        const reply = result.response.text();
        
        if (reply && reply.trim()) {
          // Clean any accidental markdown from Gemini response
          const cleanReply = reply.trim()
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
            .replace(/\*(.*?)\*/g, '$1');       // Remove *italic*
          return res.status(200).json({ reply: cleanReply });
        }
      } catch (aiError) {
        console.error('Gemini API error:', aiError.message);
        
        // If rate limited, wait and retry once with a shorter prompt
        if (aiError.message && aiError.message.includes('429')) {
          console.log('⏳ Rate limited — using fallback');
        }
      }
    }

    // Fallback: simple keyword-based (only when Gemini is unavailable)
    const fallbackReply = getQuickFallback(message);
    return res.status(200).json({ reply: fallbackReply });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      reply: "Sorry, I'm having a brief issue. Please try again! You can ask me about booking vaccines, login, certificates, or any VaxCare feature." 
    });
  }
});

module.exports = router;
