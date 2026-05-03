import{n as e}from"./script-Bt3IUgpZ.js";var t=e((()=>{var e=`
<div id="chatbot-container" class="chatbot-container closed">
  <div class="chatbot-header" id="chatbot-header">
    <div style="display:flex;align-items:center;gap:0.5rem;">
      <span class="material-symbols-outlined" style="font-size:1.3rem;">smart_toy</span>
      <span style="font-weight:700;">VaxCare Assistant</span>
    </div>
    <button id="chatbot-toggle-btn" class="chatbot-toggle-btn">
      <span class="material-symbols-outlined" style="font-size:1.2rem;">close</span>
    </button>
  </div>
  <div class="chatbot-messages" id="chatbot-messages">
    <div class="message bot-message">
      <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:4px;">waving_hand</span>
      Hi there! I'm VaxCare Assistant. How can I help you today?
    </div>
    <div class="chatbot-suggestions" id="chatbot-suggestions">
      <!-- Dynamic suggestions will be injected here -->
    </div>
  </div>
  <div class="chatbot-input">
    <input type="text" id="chatbot-input-field" placeholder="Ask me anything..." />
    <button id="chatbot-send-btn">
      <span class="material-symbols-outlined" style="font-size:1.2rem;">send</span>
    </button>
  </div>
</div>
<button id="chatbot-fab" class="chatbot-fab" title="VaxCare Assistant">
  <span class="material-symbols-outlined" style="font-size:1.6rem;">chat</span>
</button>
`,t=`
<style>
.chatbot-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0061a4, #00a8ff);
  color: white;
  border: none;
  box-shadow: 0 4px 16px rgba(0,97,164,0.4);
  font-size: 24px;
  cursor: pointer;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
  animation: pulseFab 2.5s infinite;
}
@keyframes pulseFab {
  0% { box-shadow: 0 0 0 0 rgba(0, 168, 255, 0.6); }
  70% { box-shadow: 0 0 0 15px rgba(0, 168, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 168, 255, 0); }
}
.chatbot-fab:hover {
  transform: scale(1.08) translateY(-2px);
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  box-shadow: 0 8px 24px rgba(0,168,255,0.4);
  animation: none;
}
.chatbot-container {
  position: fixed;
  bottom: 92px;
  right: 24px;
  width: 370px;
  height: 500px;
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  transition: opacity 0.25s ease, transform 0.25s ease;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.chatbot-container.closed {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
}
.chatbot-header {
  background: linear-gradient(135deg, #0061a4, #0081d4);
  color: white;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Manrope', sans-serif;
}
.chatbot-toggle-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.chatbot-toggle-btn:hover {
  background: rgba(255,255,255,0.3);
}
.chatbot-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: #f8fafc;
}
.chatbot-messages .message {
  max-width: 85%;
  padding: 0.65rem 1rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  line-height: 1.5;
  word-wrap: break-word;
  animation: chatFadeIn 0.2s ease;
}
@keyframes chatFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.chatbot-messages .user-message {
  background: linear-gradient(135deg, #0284c7, #0ea5e9);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(2,132,199,0.15);
}
.chatbot-messages .bot-message {
  background: #fff;
  color: #0f1d25;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.chatbot-suggestions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
  animation: chatFadeIn 0.4s ease 0.2s both;
}
.suggestion-title {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 0.1rem;
  padding-left: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.suggestion-chip {
  background: white;
  border: 1.5px solid #bae6fd;
  color: #0284c7;
  padding: 0.6rem 0.85rem;
  border-radius: 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(2,132,199,0.05);
}
.suggestion-chip:hover {
  background: #f0f9ff;
  border-color: #38bdf8;
  color: #0369a1;
  transform: translateX(4px);
  box-shadow: 0 4px 10px rgba(2,132,199,0.12);
}
.chatbot-input {
  display: flex;
  padding: 0.75rem;
  gap: 0.5rem;
  background: #fff;
  border-top: 1px solid #f1f5f9;
}
.chatbot-input input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 2rem;
  outline: none;
  font-size: 0.85rem;
  font-family: 'Manrope', 'Inter', sans-serif;
  transition: border-color 0.15s;
}
.chatbot-input input:focus {
  border-color: #0061a4;
}
.chatbot-input button {
  background: linear-gradient(135deg, #0061a4, #00a8ff);
  color: white;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
  flex-shrink: 0;
}
.chatbot-input button:hover {
  transform: scale(1.05);
}
@media (max-width: 500px) {
  .chatbot-container {
    width: calc(100vw - 32px);
    right: 16px;
    bottom: 80px;
    height: 60vh;
  }
}
</style>
`;document.addEventListener(`DOMContentLoaded`,()=>{document.body.insertAdjacentHTML(`beforeend`,e),document.head.insertAdjacentHTML(`beforeend`,t);let n=document.getElementById(`chatbot-fab`),r=document.getElementById(`chatbot-container`),i=document.getElementById(`chatbot-toggle-btn`),a=document.getElementById(`chatbot-send-btn`),o=document.getElementById(`chatbot-input-field`),s=document.getElementById(`chatbot-messages`),c=()=>{r.classList.toggle(`closed`),r.classList.contains(`closed`)||o.focus()};n.addEventListener(`click`,c),i.addEventListener(`click`,c);let l=(e,t)=>{let n=document.createElement(`div`);n.className=`message ${t}-message`,n.textContent=e,s.appendChild(n),s.scrollTop=s.scrollHeight},u=async()=>{let e=o.value.trim();if(!e)return;l(e,`user`),o.value=``;let t=document.createElement(`div`);if(t.className=`message bot-message`,t.innerHTML=`<span style="display:inline-flex;gap:4px;"><span style="width:6px;height:6px;background:#94a3b8;border-radius:50%;animation:dotPulse 1s infinite 0s;"></span><span style="width:6px;height:6px;background:#94a3b8;border-radius:50%;animation:dotPulse 1s infinite 0.2s;"></span><span style="width:6px;height:6px;background:#94a3b8;border-radius:50%;animation:dotPulse 1s infinite 0.4s;"></span></span>`,s.appendChild(t),s.scrollTop=s.scrollHeight,!document.getElementById(`chatbot-typing-css`)){let e=document.createElement(`style`);e.id=`chatbot-typing-css`,e.textContent=`@keyframes dotPulse { 0%,80%,100% { transform:scale(0.6);opacity:0.4; } 40% { transform:scale(1);opacity:1; } }`,document.head.appendChild(e)}try{let n=await fetch(`/chatbot`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({message:e})}),r=await n.json();t.remove(),n.ok?l(r.reply,`bot`):l(`Sorry, I encountered an error. Please try again.`,`bot`)}catch{t.remove(),l(`Network error. Please check your connection and try again.`,`bot`)}};a.addEventListener(`click`,u),o.addEventListener(`keypress`,e=>{e.key===`Enter`&&u()});let d=document.getElementById(`chatbot-suggestions`);if(d){let e=window.location.pathname.toLowerCase(),t=[];t=e.includes(`patient`)?[`How do I book a vaccine?`,`Where can I view my certificate?`,`How do I review a hospital?`,`How do I cancel an appointment?`]:e.includes(`hospital`)?[`How to manage hospital bookings?`,`How do I add new vaccines to inventory?`,`How to approve patient appointments?`,`How to update my hospital profile?`]:[`How do I login or sign up?`,`How do I book a vaccine?`,`How can hospitals register on VaxCare?`,`How do I download my certificate?`];let n=`<div class="suggestion-title">Suggested for you:</div>`;t.forEach(e=>{n+=`<button class="suggestion-chip">${e}</button>`}),d.innerHTML=n,document.querySelectorAll(`.suggestion-chip`).forEach(e=>{e.addEventListener(`click`,()=>{o.value=e.textContent,u(),d.style.display=`none`})})}})}));export{t};