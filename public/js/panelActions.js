// panelActions.js

// ————————————————
// 1) Mapa de acciones permitidas por posición
// ————————————————
const allowedActions = {
  GK: ['Seguridad', 'Atajada', 'Salida'],
  D:  ['Recuperación', 'Salida', 'Clave'],
  M:  ['Recuperación', 'Clave', 'Regates'],
  FW: ['Efectividad', 'ATA', 'Regates', 'Clave']
};

// ————————————————
// 2) Estado en memoria de cada jugador
// ————————————————
const statsState = {}; // statsState[playerId] = { cards:{ yellow, red }, stats:{} }

// ————————————————
// Abreviaturas para dinámicas
// ————————————————
const abbrevs = {
  Seguridad:    'SEG',
  Atajada:      'ATJ',
  Salida:       'SAL',
  Recuperación: 'REC',
  Clave:        'CLV',
  Regates:      'RGT',
  Efectividad:  'EFC',
  ATA:          'ATA'
};

// ————————————————
// 3) Inicializa bloque de stats en la card
// ————————————————
function initCardStats(card) {
  const pos = card.dataset.posicion;
  const dinámicas = allowedActions[pos] || [];
  const aparato = ['VEL','FUE','SLT'];
  const statsDiv = document.createElement('div');
  statsDiv.className = 'card-stats';
  dinámicas.forEach(act => {
    const abb = abbrevs[act] || act.substr(0,3).toUpperCase();
    const cell = document.createElement('div');
    cell.dataset.stat = abb;
    cell.innerHTML = `<span>${abb}</span><span>0</span>`;
    statsDiv.appendChild(cell);
  });
  aparato.forEach(abb => {
    const cell = document.createElement('div');
    cell.dataset.stat = abb;
    cell.innerHTML = `<span>${abb}</span><span>0</span>`;
    statsDiv.appendChild(cell);
  });
  card.appendChild(statsDiv);
}

// ————————————————
// 4) Refresca solo dinámicas en la card
// ————————————————
function refreshCardStats(card) {
  const pid = card.dataset.id;
  const st  = statsState[pid]?.stats || {};
  const pos = card.dataset.posicion;
  const dinámicas = allowedActions[pos] || [];
  const statsDiv = card.querySelector('.card-stats');
  if (!statsDiv) return;
  dinámicas.forEach(act => {
    const abb = abbrevs[act] || act.substr(0,3).toUpperCase();
    const val = Math.round(st[act.toLowerCase()] || 0);
    const cell = statsDiv.querySelector(`div[data-stat="${abb}"]`);
    if (cell) cell.children[1].textContent = val;
  });
}

// ————————————————
// 5) Selección de jugador en cancha + habilitar botones
// ————————————————
let selectedCard = null;
document.addEventListener('click', e => {
  const card = e.target.closest('.player-card');
  if (!card || card.closest('#playerModal')) return;
  const pid = card.dataset.id;
  if (!pid) return;
  if (!card.querySelector('.card-stats')) initCardStats(card);
  if (selectedCard) {
    selectedCard.classList.remove('selected');
    const prevStats = selectedCard.querySelector('.card-stats');
    if (prevStats) prevStats.style.display = 'none';
  }
  selectedCard = card;
  selectedCard.classList.add('selected');
  const statsBlock = selectedCard.querySelector('.card-stats');
  if (statsBlock) statsBlock.style.display = 'grid';
  const pos = selectedCard.dataset.posicion;
  document.querySelectorAll('.action-btn').forEach(btn => {
    const ok = allowedActions[pos]?.includes(btn.dataset.action);
    btn.disabled = !ok;
    btn.classList.toggle('enabled', ok);
  });
});

// ————————————————
// 6) Manejo de cada acción de la botonera
// ————————————————
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!selectedCard || btn.disabled) return alert('Selecciona un jugador y una acción válida.');
    const pid    = selectedCard.dataset.id;
    const hdr    = selectedCard.querySelector('.card-header');
    const action = btn.dataset.action;
    if (!statsState[pid]) statsState[pid] = { cards:{ yellow:0, red:0 }, stats:{} };
    const st = statsState[pid].stats;
    switch(action) {
      case 'Seguridad':
        st.errors = (st.errors||0) + 1;
        st.seguridad = Math.max(0, 100 - 30 * st.errors);
        break;
      case 'Atajada':
        st.saves = (st.saves||0) + 1;
        break;
      case 'Salida':
        st.salidasExitosas = (st.salidasExitosas||0) + 1;
        st.salidasErradas  = st.salidasErradas||0;
        st.salida = (st.salidasExitosas / (st.salidasErradas||1)) * 100;
        break;
      case 'Recuperación':
        st.recuperados = (st.recuperados||0) + 1;
        st.perdidos    = st.perdidos||0;
        st.recuperacion = (st.recuperados / (st.recuperados + st.perdidos)) * 100;
        break;
      case 'Clave':
        if (st.clave == null) st.clave = 50;
        const tipo = prompt("¿Gol o Asistencia? (gol/asi)").toLowerCase();
        if (tipo==='gol') st.clave = Math.min(100, st.clave + 20);
        if (tipo==='asi') st.clave = Math.min(100, st.clave + 10);
        break;
      case 'ATA':
        st.ata = (st.ata||0) + 1;
        break;
      case 'Efectividad':
        st.goals = (st.goals||0) + 1;
        st.shots = st.shots||0;
        st.efectividad = (st.goals / (st.shots||st.goals)) * 100;
        break;
      case 'Regates':
        st.regates = (st.regates||0) + 1;
        break;
    }
    refreshCardStats(selectedCard);
  });
});

// ————————————————
// 7) Tarjetas amarilla/roja
// ————————————————
document.querySelector('.tarjeta-btn.amarilla').addEventListener('click', () => {
  if (!selectedCard) return alert('Selecciona un jugador.');
  const pid = selectedCard.dataset.id;
  if (!statsState[pid]) statsState[pid] = { cards:{ yellow:0, red:0 }, stats:{} };
  if (!confirm('Dar tarjeta amarilla?')) return;
  const c = statsState[pid].cards;
  c.yellow++;
  selectedCard.classList.toggle('blocked', c.yellow >= 2);
});
document.querySelector('.tarjeta-btn.roja').addEventListener('click', () => {
  if (!selectedCard) return alert('Selecciona un jugador.');
  const pid = selectedCard.dataset.id;
  if (!statsState[pid]) statsState[pid] = { cards:{ yellow:0, red:0 }, stats:{} };
  if (!confirm('Dar tarjeta roja?')) return;
  statsState[pid].cards = { yellow:0, red:1 };
  selectedCard.classList.add('blocked');
});
