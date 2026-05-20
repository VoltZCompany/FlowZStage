// ============================================================
// Tesla iOS Refresh — app.js
// Single-file navigator + screen renderers.
// ============================================================

const I = {
  // SF Symbols-style (approximated as inline SVG, stroke 1.8, rounded)
  house: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z"/></svg>`,
  houseFill: `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M11.3 3.2a1 1 0 0 1 1.4 0l8 6.7a1 1 0 0 1 .3.7V20a1 1 0 0 1-1 1h-4.5v-6a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v6H4a1 1 0 0 1-1-1v-9.4a1 1 0 0 1 .3-.7l8-6.7z"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`,
  micFill: `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 0 1 2 0 7 7 0 0 1-6 6.9V21a1 1 0 0 1-2 0v-3.1A7 7 0 0 1 5 11z"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  calFill: `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1a3 3 0 0 1 3 3v2H3V7a3 3 0 0 1 3-3V3a1 1 0 0 1 1-1zM3 11v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-9H3z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  lockFill: `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M7 10V7a5 5 0 0 1 10 0v3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3zm2-3v3h6V7a3 3 0 0 0-6 0z"/></svg>`,
  // action icons
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="22" height="22"><path d="M12 5v14M5 12h14"/></svg>`,
  chevL: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M15 5l-7 7 7 7"/></svg>`,
  chevR: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 5l7 7-7 7"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M5 12l5 5L20 7"/></svg>`,
  dots: `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM9 21a3 3 0 0 0 6 0"/></svg>`,
  map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M4 4.5a2 2 0 0 1 2-2h2l2 5-2.5 1.5a12 12 0 0 0 5.5 5.5L15 12l5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 4.5z"/></svg>`,
  plane: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M2 13l9-2V4.5a1.5 1.5 0 0 1 3 0V11l7 2v2l-7-1v4l2 2v1l-3.5-1L9 21v-1l2-2v-4l-9 1v-2z"/></svg>`,
  bed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M7 9V6"/></svg>`,
  van: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M2 16V7a2 2 0 0 1 2-2h9v11M13 9h4l4 4v3M2 16h2M8 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM18 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-1 .3-2 .8-3-.5.5-1.8 2-1.8 4a5 5 0 0 0 10 0c0-5-5-10-5-10z"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M20 12L12 20l-8-8V4h8l8 8z"/><circle cx="8.5" cy="7.5" r="1.2" fill="currentColor"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6M9 15h6M9 11h2M9 19h6"/></svg>`,
  note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="8" cy="15" r="4"/><path d="M11 12l10-10M17 6l3 3M14 9l3 3"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M12 15V3M8 7l4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/></svg>`,
  palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="9"/><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1.2" fill="currentColor"/><path d="M13.5 21A3 3 0 0 1 12 16a2 2 0 0 0 1-3.5"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>`,
};

const D = window.TESLA_DATA;

// Priority tokens
const PRIO = {
  urgent: { color: '#FF3B30', bg: 'rgba(255,59,48,.15)', label: 'Urgente', glyph: I.flame },
  high:   { color: '#FF9500', bg: 'rgba(255,149,0,.15)', label: 'Alta',    glyph: I.bolt },
  medium: { color: '#6C63FF', bg: 'rgba(108,99,255,.18)', label: 'Média',   glyph: '' },
  low:    { color: '#34C759', bg: 'rgba(52,199,89,.15)', label: 'Baixa',   glyph: '' },
};

const CAT = {
  work:     { label: 'Trabalho', icon: '💼', color: '#5E5CE6' },
  personal: { label: 'Pessoal',  icon: '👤', color: '#BF5AF2' },
  health:   { label: 'Saúde',    icon: '🍏', color: '#30D158' },
  finance:  { label: 'Finanças', icon: '💰', color: '#FFD60A' },
  study:    { label: 'Estudos',  icon: '📚', color: '#FF9F0A' },
  home:     { label: 'Casa',     icon: '🏠', color: '#64D2FF' },
  other:    { label: 'Outro',    icon: '📋', color: '#8E8E93' },
};

// ============================================================
// Navigation
// ============================================================
const state = {
  tab: 'home',
  stack: ['home'],
  params: {},
  segments: { shows: 'upcoming', home: 'all', vault: 'notes' },
  selectedDate: new Date(2026, 3, 25),
  calMonth: new Date(2026, 3, 1),
};

function go(screenId, params = {}) {
  state.stack.push(screenId);
  state.params = params;
  renderScreen();
}
function back() {
  if (state.stack.length > 1) state.stack.pop();
  renderScreen();
}
function switchTab(tab) {
  state.tab = tab;
  const root = { home: 'home', shows: 'showList', calendar: 'calendar', vault: 'vault' }[tab];
  state.stack = [root];
  renderScreen();
  renderTabBar();
}

// ============================================================
// Tab bar
// ============================================================
function renderTabBar() {
  const tabs = [
    { id: 'home',     label: 'Hoje',       off: I.house,    on: I.houseFill },
    { id: 'shows',    label: 'Shows',      off: I.mic,      on: I.micFill },
    { id: 'calendar', label: 'Calendário', off: I.cal,      on: I.calFill },
    { id: 'vault',    label: 'Cofre',      off: I.lock,     on: I.lockFill },
  ];
  document.getElementById('tab-bar').innerHTML = tabs.map(t => `
    <div class="tab-item ${state.tab === t.id ? 'active' : ''}" onclick="switchTab('${t.id}')">
      ${state.tab === t.id ? t.on : t.off}
      <span class="tab-label">${t.label}</span>
    </div>`).join('');
}

// ============================================================
// Screen renderer
// ============================================================
function renderScreen() {
  const current = state.stack[state.stack.length - 1];
  const mount = document.getElementById('screens');
  const renderers = {
    home: renderHome,
    showList: renderShowList,
    showDetail: renderShowDetail,
    createShow: renderCreateShow,
    calendar: renderCalendar,
    createTask: renderCreateTask,
    taskDetail: renderTaskDetail,
    vault: renderVault,
    settings: renderSettings,
  };
  const fn = renderers[current] || renderHome;
  mount.innerHTML = `<div class="screen active">${fn(state.params)}</div>`;
  // Scroll listener for nav-bar border
  const scroll = mount.querySelector('.screen-scroll');
  if (scroll) {
    const nav = mount.querySelector('.nav-bar');
    scroll.addEventListener('scroll', () => {
      if (!nav) return;
      if (scroll.scrollTop > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    });
  }
}

// ============================================================
// HOME (Hoje) — priorities reorganized, "Today + Shows + Priorities" hierarchy
// ============================================================
function renderHome() {
  const seg = state.segments.home;
  const pending = D.tasks.filter(t => !t.done);
  const urgent  = pending.filter(t => t.priority === 'urgent');
  const todayShow = D.shows.find(s => s.id === 's1');
  const todayTasks = pending.filter(t => {
    if (!t.deadline) return false;
    const d = new Date(t.deadline);
    return d.toDateString() === new Date(2026, 3, 25).toDateString();
  });

  let list;
  if (seg === 'all') list = pending;
  else if (seg === 'urgent') list = urgent;
  else if (seg === 'today') list = todayTasks;
  else list = D.tasks.filter(t => t.done);

  return `
    <div class="screen-scroll">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="go('settings')">${I.gear}</button>
          <div class="nav-title-compact">Hoje</div>
          <button class="nav-btn" onclick="go('createTask')">${I.plus}</button>
        </div>
      </div>

      <h1 class="large-title">Hoje</h1>
      <div style="padding: 0 20px 12px; color: var(--label-2); font-size: 15px; letter-spacing: -0.02em;">
        Sábado, 25 de abril · ${pending.length} tarefa${pending.length !== 1 ? 's' : ''} pendente${pending.length !== 1 ? 's' : ''}
      </div>

      ${todayShow ? `
      <div style="padding: 0 20px 16px;">
        <div onclick="go('showDetail', {id: 's1'})" style="
          background: linear-gradient(135deg, #6C63FF 0%, #8B83FF 100%);
          border-radius: 20px;
          padding: 18px 20px;
          color: #fff;
          box-shadow: 0 10px 30px rgba(108,99,255,.4);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        ">
          <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,.08);"></div>
          <div style="position: absolute; bottom: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,.05);"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; position: relative;">
            <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.8px; background: rgba(255,255,255,.22); padding: 4px 10px; border-radius: 999px; text-transform: uppercase; white-space: nowrap;">Próximo Show</div>
            <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; background: rgba(255,255,255,.22); padding: 4px 10px; border-radius: 999px; white-space: nowrap;">AMANHÃ · 22H</div>
          </div>
          <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 4px; position: relative;">Festival Alta Voltagem</div>
          <div style="font-size: 14px; opacity: .9; letter-spacing: -0.01em; position: relative;">Espaço das Américas · São Paulo</div>
          <div style="display: flex; gap: 24px; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.18); position: relative;">
            <div style="flex-shrink: 0;"><div style="font-size: 11px; opacity: .75; letter-spacing: 1px;">PROGRESSO</div><div style="font-size: 15px; font-weight: 700; white-space: nowrap;">6 de 9 itens</div></div>
            <div style="flex-shrink: 0;"><div style="font-size: 11px; opacity: .75; letter-spacing: 1px;">VOO</div><div style="font-size: 15px; font-weight: 700; white-space: nowrap;">LA3442 · 18h30</div></div>
          </div>
        </div>
      </div>` : ''}

      <div class="segmented">
        ${['all','urgent','today','done'].map(k => `
          <div class="segmented-item ${seg === k ? 'active' : ''}" onclick="state.segments.home='${k}'; renderScreen()">
            ${k==='all'?'Todas':k==='urgent'?'Urgentes':k==='today'?'Hoje':'Feitas'}
          </div>`).join('')}
      </div>

      <div style="padding: 0 20px;">
        ${list.length === 0 ? renderEmpty('Tudo em dia', 'Nenhuma tarefa nesta seção') : list.map(renderTaskCard).join('')}
      </div>
    </div>

    <div class="fab" onclick="go('createTask')">${I.plus}</div>
  `;
}

function renderTaskCard(t) {
  const p = PRIO[t.priority];
  const c = CAT[t.category];
  const dl = t.deadline ? new Date(t.deadline) : null;
  const time = dl ? dl.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const day = dl ? dl.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.','') : null;
  return `
    <div class="card" onclick="go('taskDetail', {id: '${t.id}'})" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px;">
      <div onclick="event.stopPropagation()" style="
        width: 24px; height: 24px; border-radius: 50%;
        border: 2px solid ${t.done ? p.color : 'var(--label-3)'};
        background: ${t.done ? p.color : 'transparent'};
        display: flex; align-items: center; justify-content: center;
        color: #fff; flex-shrink: 0;
      ">${t.done ? I.check : ''}</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 16px; font-weight: 500; color: var(--label); letter-spacing: -0.02em; ${t.done ? 'text-decoration: line-through; color: var(--label-2);' : ''}">${t.title}</div>
        <div style="display: flex; gap: 8px; margin-top: 6px; align-items: center; flex-wrap: wrap;">
          <span class="chip" style="background: ${p.bg}; color: ${p.color};">${p.glyph}${p.label}</span>
          <span style="font-size: 12px; color: var(--label-2); letter-spacing: -0.01em;">${c.icon} ${c.label}</span>
          ${day ? `<span style="font-size: 12px; color: var(--label-2);">· ${day}${time ? ` · ${time}` : ''}</span>` : ''}
        </div>
      </div>
      <div class="list-chevron">›</div>
    </div>
  `;
}

// ============================================================
// SHOWS list
// ============================================================
function renderShowList() {
  const seg = state.segments.shows;
  const list = D.shows.filter(s => seg === 'upcoming' ? !s.past : s.past)
    .sort((a,b) => seg === 'upcoming'
      ? new Date(a.date) - new Date(b.date)
      : new Date(b.date) - new Date(a.date));

  return `
    <div class="screen-scroll">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="go('settings')">${I.gear}</button>
          <div class="nav-title-compact">Shows</div>
          <button class="nav-btn" onclick="go('createShow')">${I.plus}</button>
        </div>
      </div>
      <h1 class="large-title">Shows</h1>
      <div style="padding: 0 20px 8px; color: var(--label-2); font-size: 15px; letter-spacing: -0.02em;">
        ${list.length} ${seg === 'upcoming' ? 'agendados' : 'realizados'} · gestão completa da logística
      </div>

      <div class="segmented">
        <div class="segmented-item ${seg === 'upcoming' ? 'active' : ''}" onclick="state.segments.shows='upcoming'; renderScreen()">Próximos</div>
        <div class="segmented-item ${seg === 'past' ? 'active' : ''}" onclick="state.segments.shows='past'; renderScreen()">Realizados</div>
      </div>

      <div style="padding: 0 20px;">
        ${list.length === 0 ? renderEmpty('Nenhum show', seg === 'upcoming' ? 'Toque em + para criar seu próximo show' : 'Shows passados aparecerão aqui') : list.map(renderShowCard).join('')}
      </div>
    </div>

    <div class="fab" onclick="go('createShow')">${I.plus}</div>
  `;
}

function renderShowCard(s) {
  const progress = s.remindersTotal > 0 ? s.remindersDone / s.remindersTotal : 0;
  const date = new Date(s.date + 'T' + s.time);
  const dateLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, '');
  return `
    <div class="card" onclick="go('showDetail', {id: '${s.id}'})" style="padding: 0; overflow: hidden; margin-bottom: 12px; ${s.past ? 'opacity: .65;' : ''}">
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; gap: 6px; margin-bottom: 6px;">
              <span class="chip" style="background: ${s.urgent ? 'rgba(255,59,48,.15)' : s.past ? 'rgba(52,199,89,.15)' : 'rgba(108,99,255,.15)'}; color: ${s.urgent ? '#FF3B30' : s.past ? '#34C759' : '#6C63FF'}; font-size: 10px; letter-spacing: .5px; padding: 3px 9px;">${s.countdown}</span>
            </div>
            <div style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: var(--label);">${s.name}</div>
            <div style="font-size: 13px; color: var(--label-2); letter-spacing: -0.01em; margin-top: 2px;">${s.contratante}</div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 11px; color: var(--label-2); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${dateLabel}</div>
            <div class="mono-time" style="font-size: 24px; font-weight: 700; color: var(--label); letter-spacing: -0.03em; margin-top: 2px;">${s.time}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; color: var(--label-2); font-size: 14px; letter-spacing: -0.01em;">
          ${I.map}
          <span>${s.venue}${s.city ? ` · ${s.city}` : ''}</span>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${s.hasHotel ? `<div class="chip" style="background: var(--fill-2); color: var(--label-2); gap: 4px;">${I.bed}<span>Hotel</span></div>` : ''}
          ${s.hasAirplane ? `<div class="chip" style="background: var(--fill-2); color: var(--label-2); gap: 4px;">${I.plane}<span>Voo ${s.flightTime || ''}</span></div>` : ''}
          ${s.hasVan ? `<div class="chip" style="background: var(--fill-2); color: var(--label-2); gap: 4px;">${I.van}<span>Van</span></div>` : ''}
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 12px; color: var(--label-2); font-weight: 600;">Checklist</span>
            <span style="font-size: 12px; color: var(--label); font-weight: 700;" class="mono-time">${s.remindersDone}/${s.remindersTotal}</span>
          </div>
          <div style="height: 6px; border-radius: 3px; background: var(--fill-2); overflow: hidden;">
            <div style="height: 100%; width: ${progress * 100}%; background: ${progress === 1 ? 'var(--success)' : 'var(--brand)'}; border-radius: 3px; transition: width .3s;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// SHOW DETAIL
// ============================================================
function renderShowDetail(params) {
  const s = params && params.id ? (D.shows.find(x => x.id === params.id) || D.showDetail) : D.showDetail;
  // Merge with D.showDetail if it's the same show (to get full details)
  const detail = (D.showDetail && D.showDetail.id === s.id) ? D.showDetail : s;
  const reminders = detail.reminders || [];
  const contacts = detail.contacts || [];
  const done = reminders.filter(r => r.done).length;
  const total = reminders.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const date = new Date(detail.date + 'T' + detail.time);
  const today = new Date(2026, 3, 25);
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  const countdownLabel = diffDays < 0 ? 'Já aconteceu' : diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Em 1 dia' : `Em ${diffDays} dias`;
  const dateLabel = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return `
    <div class="screen-scroll">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="back()">${I.chevL}<span>Shows</span></button>
          <div class="nav-title-compact">${s.name}</div>
          <button class="nav-btn">${I.dots}</button>
        </div>
      </div>

      <!-- Hero -->
      <div style="padding: 4px 20px 0;">
        <div style="background: linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%); border-radius: 24px; padding: 22px; color: #fff; position: relative; overflow: hidden; margin-bottom: 20px;">
          <div style="position: absolute; top: -50px; right: -50px; width: 180px; height: 180px; border-radius: 50%; border: 1px dashed rgba(255,255,255,.2);"></div>
          <div style="position: absolute; top: -70px; right: -70px; width: 240px; height: 240px; border-radius: 50%; border: 1px dashed rgba(255,255,255,.1);"></div>
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 2px; opacity: .85; text-transform: uppercase;">⚡ ${countdownLabel}</div>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: -0.03em; margin-top: 8px; line-height: 1.1;">${detail.name}</div>
          <div style="font-size: 14px; opacity: .85; margin-top: 6px; letter-spacing: -0.01em;">${detail.contratante}</div>
          <div style="display: flex; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.2); position: relative;">
            <div style="flex: 1;"><div style="font-size: 10px; opacity: .7; text-transform: uppercase; letter-spacing: 1px;">Data</div><div style="font-size: 15px; font-weight: 700; margin-top: 2px; text-transform: capitalize;">${dateLabel.split(',')[0]}, ${date.getDate()}/${date.getMonth()+1}</div></div>
            <div style="flex: 1;"><div style="font-size: 10px; opacity: .7; text-transform: uppercase; letter-spacing: 1px;">Show</div><div class="mono-time" style="font-size: 15px; font-weight: 700; margin-top: 2px;">${detail.time}</div></div>
            <div style="flex: 1;"><div style="font-size: 10px; opacity: .7; text-transform: uppercase; letter-spacing: 1px;">Palco</div><div class="mono-time" style="font-size: 15px; font-weight: 700; margin-top: 2px;">${detail.stageReadyTime || '—'}</div></div>
          </div>
        </div>

        <!-- Progress -->
        <div class="card" style="padding: 16px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div>
              <div style="font-size: 13px; color: var(--label-2); font-weight: 600; letter-spacing: -0.01em;">CHECKLIST</div>
              <div style="font-size: 22px; font-weight: 800; color: var(--label); letter-spacing: -0.03em; margin-top: 2px;">${total > 0 ? `${done} de ${total} concluídos` : 'Nenhum item'}</div>
            </div>
            <div style="width: 56px; height: 56px; position: relative;">
              <svg viewBox="0 0 40 40" style="transform: rotate(-90deg); width: 56px; height: 56px;">
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--fill-2)" stroke-width="4"/>
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--brand)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${2*Math.PI*17}" stroke-dashoffset="${2*Math.PI*17*(1-pct/100)}"/>
              </svg>
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: var(--label);" class="mono-time">${pct}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Segments -->
      <div class="section-header">Local</div>
      <div class="section">
        <div class="list-group">
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #FF9F0A;">${I.map}</div>
            <div class="list-content">
              <div class="list-title">${detail.venue}</div>
              <div class="list-subtitle">${[detail.venueAddress, detail.city].filter(Boolean).join(' · ') || '—'}</div>
            </div>
            <div class="list-chevron">›</div>
          </div>
        </div>
      </div>

      ${(detail.flight || detail.hotel || detail.van) ? `
      <div class="section-header">Logística</div>
      <div class="section">
        <div class="list-group">
          ${detail.flight ? `
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #5E5CE6;">${I.plane}</div>
            <div class="list-content">
              <div class="list-title">Voo ${detail.flight.airline} ${detail.flight.number}</div>
              <div class="list-subtitle">${detail.flight.airport} · ${detail.flight.time}</div>
            </div>
            <div class="list-chevron">›</div>
          </div>` : ''}
          ${detail.hotel ? `
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #30D158;">${I.bed}</div>
            <div class="list-content">
              <div class="list-title">${detail.hotel.name}</div>
              <div class="list-subtitle">${detail.hotel.address || ''}</div>
            </div>
            <div class="list-chevron">›</div>
          </div>` : ''}
          ${detail.van ? `
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #BF5AF2;">${I.van}</div>
            <div class="list-content">
              <div class="list-title">Van ${detail.van.color}</div>
              <div class="list-subtitle">${detail.van.driver} · ${detail.van.plate}</div>
            </div>
            <div class="list-chevron">›</div>
          </div>` : ''}
        </div>
      </div>` : ''}

      ${reminders.length > 0 ? `
      <div class="section-header">Checklist do show</div>
      <div class="section">
        <div class="list-group">
          ${reminders.map(r => `
            <div class="list-row" style="cursor: default;">
              <div style="
                width: 24px; height: 24px; border-radius: 50%;
                border: 2px solid ${r.done ? 'var(--brand)' : 'var(--label-3)'};
                background: ${r.done ? 'var(--brand)' : 'transparent'};
                display: flex; align-items: center; justify-content: center;
                color: #fff; flex-shrink: 0;
              ">${r.done ? I.check : ''}</div>
              <div class="list-content">
                <div class="list-title" style="${r.done ? 'color: var(--label-2); text-decoration: line-through;' : ''}">${r.text}</div>
                ${r.time ? `<div class="list-subtitle mono-time">🕐 ${r.time}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="section-header">Contatos</div>
      <div class="section">
        <div class="list-group">
          <div class="list-row">
            <div class="list-icon-wrap" style="background: var(--brand);">${I.phone}</div>
            <div class="list-content">
              <div class="list-title">${detail.contratante}</div>
              <div class="list-subtitle">Contratante${detail.contratantePhone ? ` · ${detail.contratantePhone}` : ''}</div>
            </div>
            <div class="list-chevron">›</div>
          </div>
          ${contacts.map(c => `
            <div class="list-row">
              <div class="list-icon-wrap" style="background: #8E8E93;">${I.phone}</div>
              <div class="list-content">
                <div class="list-title">${c.name}</div>
                <div class="list-subtitle">${c.role} · ${c.phone}</div>
              </div>
              <div class="list-chevron">›</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="padding: 0 20px 40px;">
        <button onclick="back()" style="width: 100%; padding: 14px; border-radius: 14px; border: none; background: var(--fill-2); color: var(--danger); font-family: inherit; font-size: 17px; font-weight: 600; letter-spacing: -0.02em; cursor: pointer;">Excluir show</button>
      </div>
    </div>
  `;
}

// ============================================================
// SAVE SHOW
// ============================================================
function saveShow() {
  const nome        = (document.getElementById('cs-nome')?.value || '').trim();
  const contratante = (document.getElementById('cs-contratante')?.value || '').trim();
  const telefone    = (document.getElementById('cs-telefone')?.value || '').trim();
  const data        = (document.getElementById('cs-data')?.value || '').trim();
  const hora        = (document.getElementById('cs-hora')?.value || '').trim();
  const local       = (document.getElementById('cs-local')?.value || '').trim();
  const endereco    = (document.getElementById('cs-endereco')?.value || '').trim();
  const cidade      = (document.getElementById('cs-cidade')?.value || '').trim();

  if (!nome)        { alert('Nome do show é obrigatório');   return; }
  if (!contratante) { alert('Contratante é obrigatório');    return; }
  if (!data)        { alert('Data do show é obrigatória');   return; }
  if (!hora)        { alert('Horário do show é obrigatório'); return; }
  if (!local)       { alert('Local / venue é obrigatório');  return; }

  const id = 'show_' + Date.now();
  const showDate = new Date(data + 'T12:00:00');
  const today = new Date(2026, 3, 25);
  const diffDays = Math.ceil((showDate - today) / (1000 * 60 * 60 * 24));
  const countdown = diffDays < 0  ? 'JÁ ACONTECEU'
                  : diffDays === 0 ? `HOJE · ${hora}`
                  : diffDays === 1 ? `AMANHÃ · ${hora}`
                  : `EM ${diffDays} DIAS`;

  // Calculate stage-ready time (90 min before show)
  const [hh, mm] = hora.split(':').map(Number);
  let srtMins = hh * 60 + mm - 90;
  srtMins = ((srtMins % 1440) + 1440) % 1440;
  const stageReadyTime = `${String(Math.floor(srtMins / 60)).padStart(2,'0')}:${String(srtMins % 60).padStart(2,'0')}`;

  const newShow = {
    id, name: nome, contratante,
    contratantePhone: telefone || '',
    date: data, time: hora, stageReadyTime,
    venue: local, venueAddress: endereco, city: cidade,
    hasHotel: false, hasAirplane: false, hasVan: false,
    hotel: null, flight: null, van: null,
    contacts: [], reminders: [],
    remindersDone: 0, remindersTotal: 0,
    countdown, urgent: diffDays <= 1, past: diffDays < 0,
  };

  D.shows.unshift(newShow);

  // Navigate: replace createShow with showDetail for the new show
  state.stack.pop();
  state.stack.push('showDetail');
  state.params = { id };
  renderScreen();
}

// ============================================================
// CREATE SHOW (modal sheet)
// ============================================================
function renderCreateShow() {
  const inp = (id, type, placeholder) => `
    <div class="list-row" style="flex-direction: column; align-items: stretch; gap: 2px; padding: 10px 16px;">
      <input id="${id}" type="${type}" placeholder="${placeholder}" style="
        background: transparent; border: none; outline: none;
        font-size: 17px; font-family: inherit; color: var(--label);
        letter-spacing: -0.02em; width: 100%; padding: 0;
      " />
    </div>`;
  const inpLabeled = (id, type, label, placeholder) => `
    <div class="list-row" style="flex-direction: column; align-items: stretch; gap: 2px; padding: 10px 16px;">
      <div style="font-size: 12px; color: var(--label-2); font-weight: 500; letter-spacing: -0.01em;">${label}</div>
      <input id="${id}" type="${type}" placeholder="${placeholder}" style="
        background: transparent; border: none; outline: none;
        font-size: 17px; font-family: inherit; color: var(--label);
        letter-spacing: -0.02em; width: 100%; padding: 0; margin-top: 2px;
      " />
    </div>`;
  return `
    <div class="screen-scroll" style="background: var(--grouped-bg);">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="back()">Cancelar</button>
          <div class="nav-title-compact" style="opacity: 1;">Novo Show</div>
          <button class="nav-btn done" onclick="saveShow()">Salvar</button>
        </div>
      </div>

      <div style="padding: 4px 20px 12px; font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--label);">Novo Show</div>
      <div style="padding: 0 20px 20px; color: var(--label-2); font-size: 15px; letter-spacing: -0.02em;">Preencha as informações básicas. Voos, hotel e van podem ser adicionados depois.</div>

      <div class="section-header">Informações</div>
      <div class="section">
        <div class="list-group">
          ${inpLabeled('cs-nome', 'text', 'Nome do show *', 'Ex: Festival Alta Voltagem')}
          ${inpLabeled('cs-contratante', 'text', 'Contratante *', 'Ex: GR6 Produções')}
          ${inpLabeled('cs-telefone', 'tel', 'Telefone', '(11) 98765-4321')}
        </div>
      </div>

      <div class="section-header">Data & Horário</div>
      <div class="section">
        <div class="list-group">
          ${inpLabeled('cs-data', 'date', 'Data *', '')}
          ${inpLabeled('cs-hora', 'time', 'Horário do show *', '')}
        </div>
      </div>

      <div class="section-header">Local</div>
      <div class="section">
        <div class="list-group">
          ${inpLabeled('cs-local', 'text', 'Casa / venue *', 'Ex: Espaço das Américas')}
          ${inpLabeled('cs-endereco', 'text', 'Endereço', 'Rua, número, bairro')}
          ${inpLabeled('cs-cidade', 'text', 'Cidade', 'São Paulo, SP')}
        </div>
      </div>

      <div class="section-header">Logística</div>
      <div class="section">
        <div class="list-group">
          ${toggleRow('Hotel', I.bed, '#30D158', false)}
          ${toggleRow('Voo', I.plane, '#5E5CE6', false)}
          ${toggleRow('Van', I.van, '#BF5AF2', false)}
        </div>
      </div>

      <div style="padding: 0 20px 40px;">
        <button onclick="saveShow()" style="width: 100%; padding: 16px; border-radius: 14px; border: none; background: var(--brand); color: #fff; font-family: inherit; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; cursor: pointer; box-shadow: 0 10px 20px rgba(108,99,255,.3);">Criar show</button>
      </div>
    </div>
  `;
}

function inputRow(label, placeholder) {
  return `
    <div class="list-row" style="flex-direction: column; align-items: stretch; gap: 2px; padding: 10px 16px;">
      <div style="font-size: 12px; color: var(--label-2); font-weight: 500; letter-spacing: -0.01em;">${label}</div>
      <div style="font-size: 17px; color: var(--label-3); letter-spacing: -0.02em;">${placeholder}</div>
    </div>`;
}
function valueRow(label, value, highlight = false) {
  return `
    <div class="list-row">
      <div class="list-content">
        <div class="list-title" style="font-size: 16px;">${label}</div>
      </div>
      <div class="list-value mono-time" style="${highlight ? 'color: var(--brand); font-weight: 600;' : ''}">${value}</div>
      <div class="list-chevron">›</div>
    </div>`;
}
function toggleRow(label, icon, color, on = false) {
  return `
    <div class="list-row" onclick="this.dataset.on = this.dataset.on === '1' ? '0' : '1'; const sw = this.querySelector('.sw'); const on = this.dataset.on === '1'; sw.style.background = on ? 'var(--success)' : 'var(--surface-3)'; sw.querySelector('.knob').style.transform = on ? 'translateX(20px)' : 'translateX(0)';" data-on="${on ? '1' : '0'}">
      <div class="list-icon-wrap" style="background: ${color};">${icon}</div>
      <div class="list-content">
        <div class="list-title">${label}</div>
      </div>
      <div class="sw" style="width: 51px; height: 31px; border-radius: 999px; background: ${on ? 'var(--success)' : 'var(--surface-3)'}; position: relative; transition: background .2s; flex-shrink: 0;">
        <div class="knob" style="position: absolute; top: 2px; left: 2px; width: 27px; height: 27px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 3px 6px rgba(0,0,0,.2); transform: ${on ? 'translateX(20px)' : 'translateX(0)'};"></div>
      </div>
    </div>`;
}

// ============================================================
// CALENDAR
// ============================================================
function renderCalendar() {
  const m = state.calMonth;
  const year = m.getFullYear();
  const month = m.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leading = first.getDay();
  const days = [];
  for (let i = 0; i < leading; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  const monthLabel = m.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const selDate = state.selectedDate;
  const selKey = selDate.toISOString().slice(0,10);

  const tasksOnDay = D.tasks.filter(t => t.deadline && t.deadline.slice(0,10) === selKey);
  const showsOnDay = D.shows.filter(s => s.date === selKey);

  const hasTasks = (d) => D.tasks.some(t => t.deadline && new Date(t.deadline).toDateString() === d.toDateString());
  const hasShows = (d) => D.shows.some(s => s.date === d.toISOString().slice(0,10));

  return `
    <div class="screen-scroll">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="state.calMonth = new Date(${year}, ${month-1}, 1); state.selectedDate = new Date(${year}, ${month-1}, 1); renderScreen()">${I.chevL}</button>
          <div class="nav-title-compact" style="opacity: 1; text-transform: capitalize;">${monthLabel}</div>
          <button class="nav-btn" onclick="state.calMonth = new Date(${year}, ${month+1}, 1); state.selectedDate = new Date(${year}, ${month+1}, 1); renderScreen()" style="transform: rotate(180deg);">${I.chevL}</button>
        </div>
      </div>

      <h1 class="large-title" style="text-transform: capitalize;">${monthLabel}</h1>

      <div style="padding: 0 20px 12px;">
        <div class="card" style="padding: 14px;">
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 8px;">
            ${['D','S','T','Q','Q','S','S'].map(d => `<div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--label-2); text-transform: uppercase; letter-spacing: 1px; padding: 6px 0;">${d}</div>`).join('')}
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
            ${days.map((d, i) => {
              if (!d) return `<div style="aspect-ratio: 1;"></div>`;
              const isSel = d.toDateString() === selDate.toDateString();
              const isToday = d.toDateString() === new Date(2026,3,25).toDateString();
              const dots = [];
              if (hasTasks(d)) dots.push('var(--warning)');
              if (hasShows(d)) dots.push('var(--brand)');
              return `
                <div onclick="state.selectedDate = new Date(${d.getFullYear()}, ${d.getMonth()}, ${d.getDate()}); renderScreen()" style="
                  aspect-ratio: 1;
                  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
                  border-radius: 10px;
                  background: ${isSel ? 'var(--brand)' : 'transparent'};
                  color: ${isSel ? '#fff' : isToday ? 'var(--brand)' : 'var(--label)'};
                  font-weight: ${isToday || isSel ? '700' : '500'};
                  font-size: 15px;
                  cursor: pointer;
                  transition: background .15s;
                " class="mono-time">
                  ${d.getDate()}
                  <div style="display: flex; gap: 2px; height: 4px;">
                    ${dots.map(c => `<div style="width: 4px; height: 4px; border-radius: 50%; background: ${isSel ? '#fff' : c};"></div>`).join('')}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="section-header" style="text-transform: capitalize;">${selDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
      <div style="padding: 0 20px;">
        ${showsOnDay.length === 0 && tasksOnDay.length === 0 ? `
          <div style="background: var(--surface); border-radius: 14px; padding: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 8px; opacity: .5;">📭</div>
            <div style="color: var(--label-2); font-size: 15px;">Nenhum compromisso neste dia</div>
          </div>` : ''}
        ${showsOnDay.map(s => `
          <div onclick="go('showDetail', {id: '${s.id}'})" style="background: linear-gradient(135deg, #6C63FF, #4F46E5); border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; color: #fff; cursor: pointer; box-shadow: 0 6px 20px rgba(108,99,255,.35);">
            <div style="font-size: 10px; font-weight: 800; letter-spacing: 2px; opacity: .85; background: rgba(255,255,255,.2); display: inline-block; padding: 3px 8px; border-radius: 999px; text-transform: uppercase;">🎤 SHOW</div>
            <div style="font-size: 17px; font-weight: 700; margin-top: 8px; letter-spacing: -0.02em;">${s.name}</div>
            <div style="font-size: 13px; opacity: .85; margin-top: 2px;"><span class="mono-time">${s.time}</span> · ${s.venue}${s.city ? ` · ${s.city}` : ''}</div>
          </div>
        `).join('')}
        ${tasksOnDay.map(t => {
          const p = PRIO[t.priority];
          const dl = new Date(t.deadline);
          const time = dl.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `
            <div class="card" onclick="go('taskDetail', {id: '${t.id}'})" style="border-left: 4px solid ${p.color}; padding: 14px 16px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex: 1;">
                  <span class="chip" style="background: ${p.bg}; color: ${p.color}; font-size: 10px; padding: 2px 8px;">${p.label.toUpperCase()}</span>
                  <div style="font-size: 15px; font-weight: 600; color: var(--label); margin-top: 6px; letter-spacing: -0.02em;">${t.title}</div>
                  <div class="mono-time" style="font-size: 12px; color: var(--label-2); margin-top: 2px;">🕐 ${time}</div>
                </div>
                <div class="list-chevron">›</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================================
// CREATE TASK
// ============================================================
function renderCreateTask() {
  return `
    <div class="screen-scroll" style="background: var(--grouped-bg);">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="back()">Cancelar</button>
          <div class="nav-title-compact" style="opacity: 1;">Nova Tarefa</div>
          <button class="nav-btn done" onclick="back()">Adicionar</button>
        </div>
      </div>

      <div style="padding: 4px 20px 24px; font-size: 28px; font-weight: 800; letter-spacing: -0.03em;">Nova Tarefa</div>

      <div class="section">
        <div class="list-group" style="padding: 16px;">
          <input placeholder="Título da tarefa" style="width: 100%; border: none; outline: none; font-family: inherit; font-size: 20px; font-weight: 600; background: transparent; color: var(--label); letter-spacing: -0.02em;" />
          <div style="height: 1px; background: var(--separator-op); margin: 12px 0;"></div>
          <textarea placeholder="Notas (opcional)" rows="3" style="width: 100%; border: none; outline: none; font-family: inherit; font-size: 15px; background: transparent; color: var(--label); resize: none; letter-spacing: -0.01em;"></textarea>
        </div>
      </div>

      <div class="section-header">Prioridade</div>
      <div class="section">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0;">
          ${Object.entries(PRIO).map(([k,p]) => `
            <div style="background: var(--surface); border: 2px solid ${k==='high' ? p.color : 'transparent'}; border-radius: 14px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: ${p.bg}; color: ${p.color}; display: flex; align-items: center; justify-content: center;">${p.glyph || '●'}</div>
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 600; color: var(--label);">${p.label}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section-header">Prazo</div>
      <div class="section">
        <div class="list-group">
          ${valueRow('Data', '26 abr 2026')}
          ${valueRow('Hora', '18:00', true)}
        </div>
      </div>

      <div class="section-header">Categoria</div>
      <div class="section">
        <div class="list-group">
          ${Object.entries(CAT).slice(0,4).map(([k,c]) => `
            <div class="list-row">
              <div class="list-icon-wrap" style="background: ${c.color};">${c.icon}</div>
              <div class="list-content"><div class="list-title">${c.label}</div></div>
              ${k === 'work' ? `<div style="color: var(--brand);">${I.check}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section-header">Notificações</div>
      <div class="section">
        <div class="list-group">
          ${toggleRow('Lembrete no prazo', I.bell, '#FF9500', true)}
          ${toggleRow('Insistir a cada 30 min', I.clock, '#5E5CE6', false)}
          ${toggleRow('Incluir no resumo diário', I.note, '#30D158', true)}
        </div>
      </div>

      <div style="height: 40px;"></div>
    </div>
  `;
}

// ============================================================
// TASK DETAIL
// ============================================================
function renderTaskDetail(params) {
  const t = D.tasks.find(x => x.id === params.id) || D.tasks[0];
  const p = PRIO[t.priority];
  const c = CAT[t.category];
  const dl = t.deadline ? new Date(t.deadline) : null;

  return `
    <div class="screen-scroll" style="background: var(--grouped-bg);">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="back()">${I.chevL}<span>Hoje</span></button>
          <div class="nav-title-compact">Tarefa</div>
          <button class="nav-btn">${I.dots}</button>
        </div>
      </div>

      <div style="padding: 4px 20px 24px;">
        <span class="chip" style="background: ${p.bg}; color: ${p.color}; font-size: 11px;">${p.glyph}${p.label.toUpperCase()}</span>
        <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--label); margin: 10px 0 8px; line-height: 1.15;">${t.title}</h1>
        ${t.notes ? `<p style="color: var(--label-2); font-size: 15px; line-height: 1.5; letter-spacing: -0.01em;">${t.notes}</p>` : ''}
      </div>

      <div class="section">
        <div class="list-group">
          <div class="list-row">
            <div class="list-icon-wrap" style="background: var(--warning);">${I.clock}</div>
            <div class="list-content">
              <div class="list-title">Prazo</div>
              <div class="list-subtitle">${dl ? dl.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'Sem prazo'}</div>
            </div>
            <div class="list-value mono-time">${dl ? dl.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
          </div>
          <div class="list-row">
            <div class="list-icon-wrap" style="background: ${c.color};">${c.icon}</div>
            <div class="list-content">
              <div class="list-title">Categoria</div>
            </div>
            <div class="list-value">${c.label}</div>
          </div>
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #FF9500;">${I.bell}</div>
            <div class="list-content">
              <div class="list-title">Notificação</div>
              <div class="list-subtitle">1h antes do prazo</div>
            </div>
          </div>
        </div>
      </div>

      <div style="padding: 0 20px;">
        <button onclick="back()" style="width: 100%; padding: 16px; border-radius: 14px; border: none; background: var(--brand); color: #fff; font-family: inherit; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; cursor: pointer; box-shadow: 0 10px 20px rgba(108,99,255,.3); margin-bottom: 10px;">Marcar como feita</button>
        <button onclick="back()" style="width: 100%; padding: 14px; border-radius: 14px; border: none; background: var(--fill-2); color: var(--danger); font-family: inherit; font-size: 17px; font-weight: 500; cursor: pointer;">Excluir tarefa</button>
      </div>
      <div style="height: 40px;"></div>
    </div>
  `;
}

// ============================================================
// VAULT
// ============================================================
function renderVault() {
  const seg = state.segments.vault;
  return `
    <div class="screen-scroll">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="go('settings')">${I.gear}</button>
          <div class="nav-title-compact">Cofre</div>
          <button class="nav-btn">${I.plus}</button>
        </div>
      </div>
      <h1 class="large-title">Cofre</h1>
      <div style="padding: 0 20px 8px; color: var(--label-2); font-size: 15px; letter-spacing: -0.02em;">Notas, arquivos e lembretes privados — protegidos por biometria.</div>

      <div class="segmented">
        <div class="segmented-item ${seg==='notes'?'active':''}" onclick="state.segments.vault='notes'; renderScreen()">Notas</div>
        <div class="segmented-item ${seg==='files'?'active':''}" onclick="state.segments.vault='files'; renderScreen()">Arquivos</div>
        <div class="segmented-item ${seg==='reminders'?'active':''}" onclick="state.segments.vault='reminders'; renderScreen()">Lembretes</div>
      </div>

      <div style="padding: 0 20px;">
        ${seg === 'notes' ? `
          ${vaultCard(I.note, '#FF9F0A', 'Rider técnico padrão', 'Backline: Yamaha MG12XU, 4 monitores in-ear Shure PSM300, pedal board completo…', 'Atualizada há 2 dias')}
          ${vaultCard(I.note, '#5E5CE6', 'Contatos camarim', 'Água sem gás, frutas variadas, toalhas brancas (12), gelo, 2 pizzas de mussarela (pós-show)…', 'Atualizada há 1 semana')}
          ${vaultCard(I.note, '#BF5AF2', 'Senhas Wi-Fi das casas', 'Espaço das Américas: voltzfest2026 / Audio Club: audio_staff / Teatro Municipal: tmrp@2026', 'Atualizada há 3 semanas')}
        ` : seg === 'files' ? `
          ${vaultCard(I.doc, '#FF3B30', 'Contrato Festival Alta Voltagem.pdf', '2,4 MB · PDF', 'Adicionado há 1 dia')}
          ${vaultCard(I.doc, '#FF3B30', 'Rider técnico 2026.pdf', '880 KB · PDF', 'Adicionado há 2 semanas')}
          ${vaultCard(I.folder, '#FF9F0A', 'Fichas dos músicos', '5 arquivos', 'Atualizada há 1 mês')}
          ${vaultCard(I.key, '#8E8E93', 'Dados bancários contratante.txt', '1 KB · texto', 'Adicionado há 3 meses')}
        ` : `
          ${vaultCard(I.bell, '#FF9500', 'Renovar seguro dos equipamentos', '⏰ 15 de maio · 12:00', 'Urgente')}
          ${vaultCard(I.bell, '#5E5CE6', 'Pagar comissão empresário', '⏰ Todo dia 5 · 10:00', 'Recorrente')}
          ${vaultCard(I.bell, '#30D158', 'Cópia de segurança da agenda', '⏰ Toda segunda · 09:00', 'Recorrente')}
        `}
      </div>
    </div>

    <div class="fab">${I.plus}</div>
  `;
}

function vaultCard(icon, color, title, content, footer) {
  return `
    <div class="card" style="padding: 14px 16px; margin-bottom: 10px; display: flex; gap: 12px;">
      <div class="list-icon-wrap" style="background: ${color}; width: 40px; height: 40px; border-radius: 11px;">${icon}</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 16px; font-weight: 600; color: var(--label); letter-spacing: -0.02em;">${title}</div>
        <div style="font-size: 13px; color: var(--label-2); margin-top: 2px; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${content}</div>
        <div style="font-size: 11px; color: var(--label-3); margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px;">${footer}</div>
      </div>
    </div>`;
}

// ============================================================
// SETTINGS
// ============================================================
function renderSettings() {
  return `
    <div class="screen-scroll" style="background: var(--grouped-bg);">
      <div class="nav-bar">
        <div class="nav-bar-row">
          <button class="nav-btn" onclick="back()">${I.chevL}<span>Voltar</span></button>
          <div class="nav-title-compact">Configurações</div>
          <div style="width: 22px;"></div>
        </div>
      </div>

      <h1 class="large-title">Configurações</h1>

      <div style="padding: 0 20px 20px;">
        <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 14px;">
          <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, var(--brand), #4F46E5); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; box-shadow: 0 6px 20px rgba(108,99,255,.4);">TL</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 18px; font-weight: 700; color: var(--label); letter-spacing: -0.02em;">Tesla Live</div>
            <div style="font-size: 13px; color: var(--label-2); letter-spacing: -0.01em;">Plano Pro · R$197/mês</div>
          </div>
          <div class="list-chevron">›</div>
        </div>
      </div>

      <div class="section-header">Aparência</div>
      <div class="section">
        <div class="list-group">
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #5E5CE6;">${I.moon}</div>
            <div class="list-content"><div class="list-title">Tema</div></div>
            <div class="list-value">Automático</div>
            <div class="list-chevron">›</div>
          </div>
          <div class="list-row">
            <div class="list-icon-wrap" style="background: var(--brand);">${I.palette}</div>
            <div class="list-content"><div class="list-title">Cor de destaque</div></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: var(--brand); margin-right: 8px;"></div>
            <div class="list-chevron">›</div>
          </div>
        </div>
      </div>

      <div class="section-header">Notificações</div>
      <div class="section">
        <div class="list-group">
          ${toggleRow('Resumo diário (8:00)', I.note, '#30D158', true)}
          ${toggleRow('Insistir em urgentes', I.flame, '#FF3B30', true)}
          ${toggleRow('Alerta de prazo', I.bell, '#FF9500', true)}
        </div>
      </div>

      <div class="section-header">Dados</div>
      <div class="section">
        <div class="list-group">
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #34C759;">${I.share}</div>
            <div class="list-content"><div class="list-title">Exportar backup</div></div>
            <div class="list-chevron">›</div>
          </div>
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #64D2FF;">${I.folder}</div>
            <div class="list-content">
              <div class="list-title">Armazenamento</div>
              <div class="list-subtitle">128 MB · 24 shows, 56 tarefas</div>
            </div>
            <div class="list-chevron">›</div>
          </div>
          <div class="list-row">
            <div class="list-icon-wrap" style="background: var(--danger);">${I.trash}</div>
            <div class="list-content"><div class="list-title" style="color: var(--danger);">Apagar todos os dados</div></div>
          </div>
        </div>
      </div>

      <div class="section-header">Sobre</div>
      <div class="section">
        <div class="list-group">
          <div class="list-row">
            <div class="list-icon-wrap" style="background: #8E8E93;">${I.info}</div>
            <div class="list-content">
              <div class="list-title">Versão</div>
              <div class="list-subtitle">Tesla 1.0.0 · VoltZ Company</div>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align: center; padding: 16px; font-size: 11px; color: var(--label-3); letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">
        ⚡ Alta Voltagem · Arte Profissional
      </div>
      <div style="height: 40px;"></div>
    </div>
  `;
}

function renderEmpty(title, subtitle) {
  return `
    <div style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 48px; margin-bottom: 12px; opacity: .5;">✨</div>
      <div style="font-size: 20px; font-weight: 700; color: var(--label); letter-spacing: -0.02em;">${title}</div>
      <div style="font-size: 14px; color: var(--label-2); margin-top: 4px; letter-spacing: -0.01em;">${subtitle}</div>
    </div>`;
}

// ============================================================
// Theme toggle
// ============================================================
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.getElementById('theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
  document.getElementById('theme-label').textContent = theme === 'dark' ? 'Dark' : 'Light';
  localStorage.setItem('tesla-theme', theme);
}
document.getElementById('theme-toggle').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme;
  setTheme(cur === 'dark' ? 'light' : 'dark');
});

// Init
const savedTheme = localStorage.getItem('tesla-theme') || 'dark';
setTheme(savedTheme);
renderTabBar();
renderScreen();
