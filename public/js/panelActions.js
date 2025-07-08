// panelActions.js

// ————————————————
// 1) Acciones permitidas por posición
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
const statsState = {}; 
// statsState[playerId] = { cards: { yellow, red }, stats: { ... } }

// ————————————————
// 3) Abreviaturas dinámicas y definición de métricas
// ————————————————
const dynamicAbbrevs = {
  GK: ['SEG','ATJ','SAL'],
  D:  ['REC','SAL','CLV'],
  M:  ['REC','CLV','RGT'],
  FW: ['EFC','ATA','RGT','CLV']
};
const apparatusKeys = ['VEL','FUE','SLT'];

// ————————————————
// 4) Inicializa stats y badge global en una card
// ————————————————
function initCardStats(card) {
  const pos = card.dataset.posicion;
  const statsDiv = document.createElement('div');
  statsDiv.className = 'card-stats';
  (dynamicAbbrevs[pos] || []).forEach(abb => {
    const cell = document.createElement('div');
    cell.dataset.stat = abb;
    cell.innerHTML = `<span>${abb}</span><span>0</span>`;
    statsDiv.appendChild(cell);
  });
  apparatusKeys.forEach(abb => {
    const cell = document.createElement('div');
    cell.dataset.stat = abb;
    cell.innerHTML = `<span>${abb}</span><span>0</span>`;
    statsDiv.appendChild(cell);
  });
  statsDiv.style.display = 'none';
  card.appendChild(statsDiv);
  renderGlobalStat(card);
}

// ————————————————
// 5) Actualiza un stat concreto en la card
// ————————————————
function updateCardStat(card, key, value) {
  const cell = card.querySelector(`.card-stats div[data-stat="${key}"]`);
  if (cell) cell.children[1].textContent = Math.round(Math.min(value, 100));
}

// ————————————————
// 6) Refresca dinámicas + badge global en la card
// ————————————————
function refreshCardStats(card) {
  const pid = card.dataset.id;
  const st  = statsState[pid]?.stats || {};
  const pos = card.dataset.posicion;
  const statsDiv = card.querySelector('.card-stats');
  if (!statsDiv) return;
  (dynamicAbbrevs[pos] || []).forEach(abb => {
    const val = Math.round(Math.min(st[abb.toLowerCase()]||0, 100));
    const cell = statsDiv.querySelector(`div[data-stat="${abb}"]`);
    if (cell) cell.children[1].textContent = val;
  });
  renderGlobalStat(card);
}

// ————————————————
// 7) Cálculo y render badge global
// ————————————————
function calculateGlobalStatValue(card) {
  const pos = card.dataset.posicion;
  const keys = dynamicAbbrevs[pos] || [];
  const statsDiv = card.querySelector('.card-stats');
  if (!statsDiv || keys.length === 0) return 0;
  const sum = keys.reduce((acc, abb) => {
    const cell = statsDiv.querySelector(`div[data-stat="${abb}"]`);
    const val = cell ? parseFloat(cell.children[1].textContent)||0 : 0;
    return acc + val;
  }, 0);
  return Math.min(Math.floor(sum / keys.length), 100);
}
function renderGlobalStat(card) {
  let badge = card.querySelector('.card-global');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'card-global';
    card.appendChild(badge);
  }
  badge.textContent = calculateGlobalStatValue(card);
}

// ————————————————
// 8) Selección de jugador en cancha + mostrar/ocultar stats + habilitar botones
// ————————————————
let selectedCard = null;
document.addEventListener('click', e => {
  const card = e.target.closest('.player-card');
  if (!card || card.closest('#playerModal')) return;
  const pid = card.dataset.id;
  if (!pid) return;

  if (!card.querySelector('.card-stats')) initCardStats(card);
  if (selectedCard && selectedCard !== card) {
    selectedCard.classList.remove('selected');
    const prevStats = selectedCard.querySelector('.card-stats');
    if (prevStats) prevStats.style.display = 'none';
  }

  selectedCard = card;
  card.classList.add('selected');
  const statsBlock = card.querySelector('.card-stats');
  if (statsBlock) statsBlock.style.display = 'grid';

  const pos = card.dataset.posicion;
  document.querySelectorAll('.action-btn').forEach(btn => {
    const ok = allowedActions[pos]?.includes(btn.dataset.action);
    btn.disabled = !ok;
    btn.classList.toggle('enabled', ok);
  });
});

// ————————————————
// 9) Función que procesa y actualiza el estado según la acción y posición
// ————————————————
function processAction(st, action, pos) {
  const cap = v => Math.min(v, 100);
  switch (pos) {
    case 'GK':
      if (action === 'Seguridad') {
        st.errors = (st.errors||0)+1;
        st.seg = cap(100 - 30*st.errors);
        return { key:'SEG', value:st.seg };
      }
      if (action === 'Atajada') {
        st.saves        = (st.saves||0)+1;
        st.shotsAgainst = (st.shotsAgainst||0)+1;
        st.atj = cap((st.saves/st.shotsAgainst)*100);
        return { key:'ATJ', value:st.atj };
      }
      if (action === 'Salida') {
        st.salEx = (st.salEx||0)+1;
        st.salEr = st.salEr||0;
        st.sal = cap((st.salEx/(st.salEr||1))*100);
        return { key:'SAL', value:st.sal };
      }
      break;
    case 'D':
      if (action === 'Recuperación') {
        st.recOv = (st.recOv||0)+1;
        st.recLd = st.recLd||0;
        st.rec = cap((st.recOv/(st.recOv+st.recLd))*100);
        return { key:'REC', value:st.rec };
      }
      if (action === 'Salida') {
        st.salEx = (st.salEx||0)+1;
        st.salEr = st.salEr||0;
        st.sal = cap((st.salEx/(st.salEr||1))*100);
        return { key:'SAL', value:st.sal };
      }
      if (action === 'Clave') {
        st.clv = st.clv==null?70:cap(st.clv+10);
        return { key:'CLV', value:st.clv };
      }
      break;
    case 'M':
      if (action === 'Recuperación') {
        st.recOv = (st.recOv||0)+1;
        st.recLd = st.recLd||0;
        st.rec = cap((st.recOv/(st.recOv+st.recLd))*100);
        return { key:'REC', value:st.rec };
      }
      if (action === 'Clave') {
        st.clv = st.clv==null?50:cap(st.clv + (prompt("¿gol/asi?").toLowerCase()==='gol'?20:10));
        return { key:'CLV', value:st.clv };
      }
      if (action === 'Regates') {
        st.rgt = (st.rgt||0)+1;
        return { key:'RGT', value:st.rgt };
      }
      break;
    case 'FW':
      if (action === 'Efectividad') {
        st.goals = (st.goals||0)+1;
        st.shots = st.shots||0;
        st.efc = cap((st.goals/(st.shots||st.goals))*100);
        return { key:'EFC', value:st.efc };
      }
      if (action === 'ATA') {
        st.shots = (st.shots||0)+1;
        return { key:'ATA', value: cap(st.shots) };
      }
      if (action === 'Regates') {
        st.rgt = (st.rgt||0)+10;
        return { key:'RGT', value:st.rgt };
      }
      if (action === 'Clave') {
        st.clv = st.clv==null?50:cap(st.clv + (prompt("¿gol/asi?").toLowerCase()==='gol'?20:10));
        return { key:'CLV', value:st.clv };
      }
      break;
  }
  return null;
}

// ————————————————
// 10) Handler único para la botonera
// ————————————————
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!selectedCard || btn.disabled) return;
    const pid    = selectedCard.dataset.id;
    const pos    = selectedCard.dataset.posicion;
    const action = btn.dataset.action;
    if (!statsState[pid]) statsState[pid] = { cards:{ yellow:0, red:0 }, stats:{} };
    const st = statsState[pid].stats;
    const res = processAction(st, action, pos);
    if (res) {
      updateCardStat(selectedCard, res.key, res.value);
      refreshCardStats(selectedCard);
    }
  });
});

// ————————————————
// 11) Tarjetas amarilla/roja
// ————————————————
document.querySelector('.tarjeta-btn.amarilla').addEventListener('click', () => {
  if (!selectedCard) return;
  const pid = selectedCard.dataset.id;
  if (!statsState[pid]) statsState[pid] = { cards:{ yellow:0, red:0 }, stats:{} };
  if (confirm('Dar tarjeta amarilla?')) {
    const c = statsState[pid].cards;
    c.yellow++;
    if (c.yellow >= 2) selectedCard.classList.add('blocked');
  }
});
document.querySelector('.tarjeta-btn.roja').addEventListener('click', () => {
  if (!selectedCard) return;
  const pid = selectedCard.dataset.id;
  if (!statsState[pid]) statsState[pid] = { cards:{ yellow:0, red:0 }, stats:{} };
  if (confirm('Dar tarjeta roja?')) {
    statsState[pid].cards = { yellow:0, red:1 };
    selectedCard.classList.add('blocked');
  }
});

// ————— Cronómetro estilo FIFA con minutos y segundos —————
let segundosTranscurridos = 0, minutos = 0, intervalo = null;
function formatearTiempo(mins, secs) {
  return `${mins}:${String(secs).padStart(2,'0')}'`;
}
document.getElementById("btnIniciarTiempo").addEventListener("click", () => {
  if (!intervalo) intervalo = setInterval(() => {
    segundosTranscurridos++;
    if (segundosTranscurridos === 60) { minutos++; segundosTranscurridos = 0; }
    document.getElementById("minutero").textContent =
      formatearTiempo(minutos, segundosTranscurridos);
  }, 1000);
});
document.getElementById("btnPausarTiempo").addEventListener("click", () => {
  clearInterval(intervalo); intervalo = null;
});
document.getElementById("btnReiniciarTiempo").addEventListener("click", () => {
  clearInterval(intervalo); intervalo = null;
  segundosTranscurridos = minutos = 0;
  document.getElementById("minutero").textContent = formatearTiempo(0,0);
});

// ———— Evento Finalizar Partido ————
document.getElementById("btnFinalizar").addEventListener("click", () => {
  if (!partidoActivo) return alert("No hay partido activo.");
  if (!confirm("¿Finalizar partido? Se guardarán estadísticas.")) return;
  const [gA,gB] = document.getElementById("score").textContent.split(" - ").map(n=>+n);
  const stats   = obtenerTodasLasEstadisticasRegistradas();
  fetch(`/api/stats/match/${partidoActivo.id}/complete`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ marcador:{A:gA,B:gB}, stats })
  })
  .then(r => r.ok ? r.json() : Promise.reject("Error"))
  .then(()=> alert("Partido finalizado y stats guardadas"))
  .catch(()=> alert("Error al finalizar."));
});
function obtenerTodasLasEstadisticasRegistradas(){ return { players:[], teams:[] }; }

// ————— Toggle sidebars —————
toggleLeft.addEventListener('click', () => {
  sidebarLeft.classList.toggle('open');
  toggleLeft.innerHTML = sidebarLeft.classList.contains('open') ? '&#9664;' : '&#9654;';
});
toggleRight.addEventListener('click', () => {
  sidebarRight.classList.toggle('open');
  toggleRight.innerHTML = sidebarRight.classList.contains('open') ? '&#9654;' : '&#9664;';
});

// ————— Botón de configuración flotante —————
btnConfigMain.addEventListener("click", () => configOptions.classList.toggle("show"));

// ————— Abrir modal de jugadores desde el modal principal —————
document.getElementById("equipoModalA").addEventListener("click", () => {
  if (partidoActivo?.equipoA_id) abrirModalJugadores(partidoActivo.equipoA_id, 'A');
});
document.getElementById("equipoModalB").addEventListener("click", () => {
  if (partidoActivo?.equipoB_id) abrirModalJugadores(partidoActivo.equipoB_id, 'B');
});


// panelScore.js

// ————————————————
// Estado del marcador y registro de eventos
// ————————————————
const scoreState = {
  A: 0,
  B: 0,
  events: []  // { team, playerId, autogoal, timestamp }
};

// ————————————————
// Actualiza la visualización del marcador
// ————————————————
function updateScoreDisplay() {
  const scoreEl = document.getElementById('score');
  if (!scoreEl) return;
  scoreEl.textContent = `${scoreState.A} - ${scoreState.B}`;
}

// ————————————————
// Registra un gol o autogol
// ————————————————
function handleGoal(side) {
  if (!selectedCard) {
    return alert('Selecciona un jugador antes de marcar un gol.');
  }
  const playerId = selectedCard.dataset.id;
  const playerTeam = selectedCard.dataset.team; // 'A' o 'B'
  const isAuto = playerTeam !== side;
  // Incrementa el marcador
  scoreState[side]++;
  // Guarda el evento
  scoreState.events.push({
    team: side,
    playerId: playerId,
    autogoal: isAuto,
    timestamp: new Date().toISOString()
  });
  // Refresca UI
  updateScoreDisplay();
  console.log('Evento de gol registrado:', scoreState.events.slice(-1)[0]);
}

// ————————————————
// Vincula botones de gol para equipo A y B
// ————————————————
document.getElementById('btnGoalA').addEventListener('click', () => {
  handleGoal('A');
});
document.getElementById('btnGoalB').addEventListener('click', () => {
  handleGoal('B');
});

// ————————————————
// Inicializar marcador al cargar
// ————————————————
document.addEventListener('DOMContentLoaded', () => {
  updateScoreDisplay();
});
