import{n as e}from"./script-Bt3IUgpZ.js";var t=e((()=>{if(typeof io>`u`){let e=document.createElement(`script`);e.src=`https://cdn.socket.io/4.5.4/socket.io.min.js`,document.head.appendChild(e)}var e=`
<style>
/* ── Chat Overlay (New) ─────────────────────────────────── */
.live-chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.live-chat-overlay.closed {
  opacity: 0;
  pointer-events: none;
}

/* ── Chat Container ─────────────────────────────────── */
.live-chat-container {
  width: 90%;
  max-width: 450px;
  height: 80vh;
  max-height: 650px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: modalPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: center;
}

.live-chat-overlay.closed .live-chat-container {
  animation: modalPopOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modalPopIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes modalPopOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.9) translateY(20px); }
}

/* ── Header ─────────────────────────────────────────── */
.live-chat-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
  color: white;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Outfit', 'Manrope', 'Inter', sans-serif;
  position: relative;
}
.live-chat-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+') repeat;
  opacity: 0.5;
  pointer-events: none;
}
.live-chat-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1;
}
.live-chat-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 0.5px;
  border: 2px solid rgba(255,255,255,0.5);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  flex-shrink: 0;
  color: #fff;
}
.live-chat-header-name-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.live-chat-header-name {
  font-weight: 700;
  font-size: 1.15rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.live-chat-header-status {
  font-size: 0.8rem;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
}
.live-chat-header-status::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
  animation: pulseStatus 2s infinite;
}
@keyframes pulseStatus {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
.live-chat-close-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
  backdrop-filter: blur(4px);
}
.live-chat-close-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1) rotate(90deg);
}

/* ── Messages Area ──────────────────────────────────── */
.live-chat-messages {
  flex: 1;
  padding: 1.5rem 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.live-chat-messages::-webkit-scrollbar { width: 6px; }
.live-chat-messages::-webkit-scrollbar-track { background: transparent; }
.live-chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

/* ── Message Wrappers ───────────────────────────────── */
.chat-msg-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 82%;
  animation: chatMsgIn 0.3s cubic-bezier(0.16,1,0.3,1);
}
.chat-msg-wrapper.me { align-self: flex-end; }
.chat-msg-wrapper.them { align-self: flex-start; }

@keyframes chatMsgIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Bubbles ────────────────────────────────────────── */
.chat-msg {
  padding: 0.75rem 1rem;
  border-radius: 1.25rem;
  font-size: 0.95rem;
  line-height: 1.5;
  word-wrap: break-word;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}
.chat-me {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
  color: white;
  border-bottom-right-radius: 4px;
}
.chat-them {
  background: #ffffff;
  color: #1e293b;
  border-bottom-left-radius: 4px;
  border: 1px solid #e2e8f0;
}

/* ── Timestamp ──────────────────────────────────────── */
.chat-timestamp {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 0.25rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 0 0.3rem;
}
.chat-msg-wrapper.me .chat-timestamp { text-align: right; }
.chat-msg-wrapper.them .chat-timestamp { text-align: left; }

/* ── Date Separator ─────────────────────────────────── */
.chat-date-sep {
  text-align: center;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  padding: 1rem 0 0.5rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ── Input Area ─────────────────────────────────────── */
.live-chat-input {
  display: flex;
  padding: 1rem 1.25rem;
  gap: 0.75rem;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.02);
}
.live-chat-input input {
  flex: 1;
  padding: 0.8rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 2rem;
  outline: none;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  transition: all 0.2s ease;
  color: #1e293b;
}
.live-chat-input input::placeholder {
  color: #94a3b8;
}
.live-chat-input input:focus {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
.live-chat-input button {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.live-chat-input button:hover {
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}
.live-chat-input button:active {
  transform: scale(0.95);
}

/* ── Empty State ────────────────────────────────────── */
.chat-empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.chat-empty-state span.material-symbols-outlined {
  font-size: 3.5rem;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));
}
.chat-empty-state p {
  font-weight: 700;
  font-size: 1.1rem;
  color: #475569;
  margin-top: 0;
  margin-bottom: 0.25rem;
}
.chat-empty-state small {
  font-size: 0.85rem;
  color: #64748b;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 600px) {
  .live-chat-container {
    width: 100%;
    height: 100%;
    max-height: none;
    max-width: none;
    border-radius: 0;
  }
}
</style>
`,t=`
<div id="live-chat-overlay" class="live-chat-overlay closed">
  <div id="live-chat-container" class="live-chat-container">
    <div class="live-chat-header">
      <div class="live-chat-header-info">
        <div class="live-chat-avatar" id="live-chat-avatar"></div>
        <div class="live-chat-header-name-wrap">
          <span class="live-chat-header-name" id="live-chat-title">Chat</span>
          <span class="live-chat-header-status">Online</span>
        </div>
      </div>
      <button id="live-chat-close-btn" class="live-chat-close-btn">
        <span class="material-symbols-outlined" style="font-size:1.3rem;">close</span>
      </button>
    </div>
    <div class="live-chat-messages" id="live-chat-messages">
      <div class="chat-empty-state">
        <span class="material-symbols-outlined">chat_bubble</span>
        <p>Start a conversation</p>
        <small>Send a message to begin chatting</small>
      </div>
    </div>
    <div class="live-chat-input">
      <input type="text" id="live-chat-input-field" placeholder="Type a message..." autocomplete="off" />
      <button id="live-chat-send-btn">
        <span class="material-symbols-outlined" style="font-size:1.2rem;">send</span>
      </button>
    </div>
  </div>
</div>
`,n,r=null,i=null;document.addEventListener(`DOMContentLoaded`,()=>{document.head.insertAdjacentHTML(`beforeend`,e),document.body.insertAdjacentHTML(`beforeend`,t);let a=document.getElementById(`live-chat-overlay`);document.getElementById(`live-chat-container`);let o=document.getElementById(`live-chat-close-btn`),s=document.getElementById(`live-chat-send-btn`),c=document.getElementById(`live-chat-input-field`);o.addEventListener(`click`,()=>{a.classList.add(`closed`),r=null}),a.addEventListener(`click`,e=>{e.target===a&&(a.classList.add(`closed`),r=null)});let l=()=>``,u=null,d=!1,f=()=>{if(!u){let e=window.AudioContext||window.webkitAudioContext;e&&(u=new e)}u&&u.state===`suspended`&&u.resume()};document.addEventListener(`click`,()=>{f(),d&&u&&u.state===`running`&&p(!0)},{once:!0});let p=(e=!1)=>{try{if(f(),!u)return;if(u.state===`suspended`){e||(d=!0);return}d=!1;let t=(e,t,n,r,i)=>{let a=u.createOscillator(),o=u.createGain();a.type=t,a.frequency.setValueAtTime(e,n),o.gain.setValueAtTime(0,n),o.gain.linearRampToValueAtTime(i,n+.05),o.gain.exponentialRampToValueAtTime(.01,n+r),a.connect(o),o.connect(u.destination),a.start(n),a.stop(n+r)},n=u.currentTime;t(523.25,`sine`,n,.4,.7),t(659.25,`sine`,n+.1,.6,.7),t(783.99,`triangle`,n+.1,.6,.4)}catch(e){console.log(`Audio playback failed`,e)}};window.playNotificationSound=p;let m=()=>{if(n)return;let e=localStorage.getItem(`vaxUser`);if(!e)return;i=JSON.parse(e)._id;let t=0,a=()=>{typeof io<`u`?(n=io(l()),n.emit(`join`,i),n.on(`receiveMessage`,e=>{e.senderId!==i&&(p(),typeof window.fetchNotifications==`function`?window.fetchNotifications():typeof window.fetchHospitalNotifications==`function`&&window.fetchHospitalNotifications()),(e.senderId===r||e.receiverId===r)&&h(e.message,e.senderId===i?`me`:`them`,g(e.timestamp))})):t<10&&(t++,setTimeout(a,500))};a()};m();let h=(e,t,n)=>{let r=document.getElementById(`live-chat-messages`),i=document.createElement(`div`);i.className=`chat-msg-wrapper `+t;let a=document.createElement(`div`);if(a.className=`chat-msg chat-`+t,a.textContent=e,i.appendChild(a),n){let e=document.createElement(`div`);e.className=`chat-timestamp`,e.textContent=n,i.appendChild(e)}r.appendChild(i),r.scrollTop=r.scrollHeight},g=e=>e?new Date(e).toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`}):new Date().toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`});window.openChat=async(e,t)=>{if(!i){let e=localStorage.getItem(`vaxUser`);if(e)i=JSON.parse(e)._id;else return}m(),r=e,document.getElementById(`live-chat-title`).textContent=t,document.getElementById(`live-chat-avatar`).textContent=t.charAt(0).toUpperCase(),document.getElementById(`live-chat-overlay`).classList.remove(`closed`);let n=document.getElementById(`live-chat-messages`);n.innerHTML=`<div style="text-align:center;padding:2rem;color:#94a3b8;"><span class="material-symbols-outlined" style="font-size:1.5rem;display:block;animation:spin 1s linear infinite;">progress_activity</span></div>`;let a=[i,e].sort(),o=a[0]+`_`+a[1];try{let e=l(),t=await fetch(`${e}/messages/${o}`);if(t.ok){let e=await t.json();n.innerHTML=``,e.length===0?n.innerHTML=`<div class="chat-empty-state"><span class="material-symbols-outlined">chat_bubble</span><p>No messages yet</p><small>Say hello to start the conversation!</small></div>`:e.forEach(function(e){h(e.message,e.senderId===i?`me`:`them`,g(e.timestamp))})}}catch(e){console.error(e),n.innerHTML=`<div style="text-align:center;color:#dc2626;padding:2rem;">Error loading messages</div>`}document.getElementById(`live-chat-input-field`).focus()};let _=async()=>{let e=c.value.trim();if(!e||!r)return;let t=document.querySelector(`.chat-empty-state`);t&&t.remove(),h(e,`me`,g(new Date().toISOString())),c.value=``;let a={senderId:i,receiverId:r,message:e,timestamp:new Date};n&&n.emit(`sendMessage`,a);try{let t=l();await fetch(`${t}/messages/send`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({receiverId:r,message:e})})}catch(e){console.error(`Failed to save message`,e)}};s.addEventListener(`click`,_),c.addEventListener(`keypress`,e=>{e.key===`Enter`&&_()})})}));export{t};