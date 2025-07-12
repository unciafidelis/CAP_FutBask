// public/js/inMatch.js

document.addEventListener('DOMContentLoaded', init);

let pollingInterval;

async function init() {
  const body        = document.getElementById('matchCentre');
  const selectModal = document.getElementById('selectMatchModal');
  const selector    = document.getElementById('matchSelector');
  const btnShow     = document.getElementById('btnSelectMatch');
  const btnChange   = document.getElementById('btnChangeMatch');

  const tabs        = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const statsTabs   = document.querySelectorAll('.stats-tab');

  // 1) Carga partidos
  try {
    const res     = await fetch('/api/matches');
    const matches = await res.json();
    selector.innerHTML = '<option value="">Selecciona un partido</option>';
    matches.forEach(m => {
      const opt = document.createElement('option');
      opt.value       = m.id;
      opt.textContent = `${m.nombreEquipoA} vs ${m.nombreEquipoB} (${m.fecha} ${m.hora})`;
      selector.appendChild(opt);
    });
  } catch {
    selector.innerHTML = '<option value="">Error cargando partidos</option>';
  }

  // Mostrar modal al inicio
  selectModal.classList.add('active');

  // Habilitar botón al elegir partido
  selector.addEventListener('change', () => {
    btnShow.disabled = !selector.value;
  });

  // Ver partido y arrancar polling de resumen
  btnShow.addEventListener('click', async () => {
  const matchId = selector.value;
  if (!matchId) return alert('Selecciona un partido.');
  body.dataset.matchId = matchId;
  selectModal.classList.remove('active');

  // Aquí vuelves a traer partido + eventos
  const [match, events] = await Promise.all([
    fetchMatch(matchId),
    fetchEvents(matchId)
  ]);
  renderHeader(match, events);

  // Luego tu carga de resumen / alineación...
});


  // Cambiar partido manualmente
  btnChange.addEventListener('click', () => {
    clearInterval(pollingInterval);
    selectModal.classList.add('active');
  });

  // Pestañas principales
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.toggle('active', b === btn));
      tabContents.forEach(c =>
        c.id === btn.dataset.tab
          ? c.classList.add('active')
          : c.classList.remove('active')
      );
    });
  });

  // Sub-pestañas de estadísticas
  statsTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      statsTabs.forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.stats-table').forEach(table => {
        table.classList.toggle(
          'hidden',
          table.id !== btn.dataset.stat
        );
      });
    });
  });
}

async function updateAll(matchId) {
  // Solo refresca encabezado y resumen de eventos
  const [match, , events] = await Promise.all([
    fetchMatch(matchId),
    null,
    fetchEvents(matchId)
  ]).catch(err => {
    console.error('❌ Error en polling:', err);
    clearInterval(pollingInterval);
    return [];
  });
  if (!match) return;

  renderHeader(match, events);
  renderSummary(events);
}

async function fetchMatch(id) {
  const res = await fetch(`/api/matches/${id}`);
  if (!res.ok) throw new Error('Match not found');
  return res.json();
}

function renderHeader(match, events) {
  document.getElementById('teamAName').textContent = match.nombreEquipoA;
  document.getElementById('teamALogo').src         = match.logoA || 'placeholderA.png';
  document.getElementById('teamBName').textContent = match.nombreEquipoB;
  document.getElementById('teamBLogo').src         = match.logoB || 'placeholderB.png';

  // Tomar los eventos que ya cargaste en eventsState
  const goalsA = events.filter(ev => ev.eventType === 'goal' && ev.details.team === 'A').length;
  const goalsB = events.filter(ev => ev.eventType === 'goal' && ev.details.team === 'B').length;
  document.getElementById('scoreDisplay').textContent = `${goalsA} - ${goalsB}`;

  const lastClock = events.length
    ? events[events.length - 1].clock
    : "00'";
  document.getElementById('matchTime').textContent   = lastClock;
  document.getElementById('matchStatus').textContent = 'En vivo';
}


// 2) Trae la info de un solo jugador
// Constantes y estado global
const INITIAL_DISPLAY_COUNT = 5;
let eventsState    = [];    // arreglo con todos los eventos, ordenados desc por timestamp
let showAll        = false; // controla si mostramos todos o solo los primeros 5
let lastTimestamp  = null;  // timestamp del evento más reciente cargado


// 1) Trae eventos del servidor
async function fetchEvents(matchId) {
  try {
    const res = await fetch(`/api/logMatch/matches/${matchId}/events`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('❌ fetchEvents:', e);
    return [];
  }
}

// 2) Trae info de un jugador por ID
async function fetchPlayer(playerId) {
  try {
    const res = await fetch(`/api/players/${playerId}`);
    if (!res.ok) throw new Error(`Jugador ${playerId} no encontrado`);
    return await res.json();
  } catch (e) {
    console.error('❌ fetchPlayer:', e);
    return null;
  }
}

// 3) Renderiza una burbuja de evento (con equipo y nombre)
function renderEventBubble(ev, prepend = false) {
  const { details = {} } = ev;
  const pj = details.playerId != null
    ? eventsState.playersMap[details.playerId]
    : null;

  const teamLabel  = details.team ? `Equipo ${details.team}` : '';
  const playerName = pj?.nombre ?? details.playerName ?? '—';
  const playerFoto = pj?.foto_jugador ?? pj?.foto ?? 'img/playerImg/avatar.png';

  // Construir texto de acción
  let actionText;
  switch (ev.eventType) {
    case 'goal':
      actionText = `⚽ anota${details.autogol ? ' un autogol' : ''}!`;
      break;
    case 'card':
      actionText = details.card === 'yellow'
        ? 'recibe tarjeta amarilla'
        : 'recibe tarjeta roja';
      break;
    case 'substitution':
      actionText = `sale ${details.fromName}, entra ${details.toName}`;
      break;
    case 'player_action':
      actionText = `${details.action}: ${details.statValue} ${details.statKey}`;
      break;
    default:
      actionText = details.action ?? ev.eventType;
  }

  const bubble = document.createElement('div');
  bubble.classList.add(
    'chat-bubble',
    details.team === 'A' ? 'comment-left'
      : details.team === 'B' ? 'comment-right'
      : 'comment-center'
  );

  bubble.innerHTML = `
    <div class="bubble-header">
      <img src="${playerFoto}" class="bubble-player-img" alt="${playerName}">
      <span class="bubble-player">${playerName}</span>
      <div class="bubble-text">${actionText}</div>
      <div class="bubble-time">${ev.clock}</div>
    </div>
  `;

  const container = document.getElementById('actionsComments');
  if (prepend) container.prepend(bubble);
  else         container.appendChild(bubble);
}

// 4) Renderiza botón "Cargar más" o "Mostrar menos"
function renderLoadMore() {
  let btn = document.getElementById('loadMoreBtn');
  if (eventsState.length <= INITIAL_DISPLAY_COUNT) {
    btn?.remove();
    return;
  }
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'loadMoreBtn';
    btn.className = 'load-more-btn';
    document.getElementById('summary').appendChild(btn);
    btn.addEventListener('click', () => {
      showAll = !showAll;
      renderSummaryUI();
    });
  }
  btn.textContent = showAll
    ? 'Mostrar últimos 5'
    : `Cargar más (${eventsState.length - INITIAL_DISPLAY_COUNT} restantes)`;
}

// 5) Renderiza la lista en pantalla según el estado
function renderSummaryUI() {
  const container = document.getElementById('actionsComments');
  container.innerHTML = '';
  const toDisplay = showAll
    ? eventsState
    : eventsState.slice(0, INITIAL_DISPLAY_COUNT);
  toDisplay.forEach(ev => renderEventBubble(ev, false));
  renderLoadMore();
}

// 6) Inicia la carga y polling
async function initSummary(matchId) {
  clearInterval(pollingInterval);

  // cargar eventos y jugadores
  const evts = await fetchEvents(matchId);
  const uniqueIds = [...new Set(evts.map(e => e.details.playerId).filter(Boolean))];
  const playersMap = {};
  await Promise.all(uniqueIds.map(async id => {
    const p = await fetchPlayer(id);
    if (p) playersMap[id] = p;
  }));

  eventsState = evts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  eventsState.playersMap = playersMap;
  lastTimestamp = eventsState.length ? eventsState[0].timestamp : null;
  showAll = false;
  renderSummaryUI();
}

// 7) Polling para añadir sólo los nuevos
async function updateSummary(matchId) {
  const fresh = await fetchEvents(matchId);
  if (!fresh.length) return;

  fresh.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const newOnes = fresh.filter(e => new Date(e.timestamp) > new Date(lastTimestamp));
  if (!newOnes.length) return;

  // actualizar jugadores nuevos
  const newIds = [...new Set(newOnes.map(e => e.details.playerId).filter(id => (
    id != null && !eventsState.playersMap[id]
  )))];
  await Promise.all(newIds.map(async id => {
    const p = await fetchPlayer(id);
    if (p) eventsState.playersMap[id] = p;
  }));

  eventsState = newOnes.concat(eventsState);
  lastTimestamp = eventsState[0].timestamp;
  newOnes.forEach(e => renderEventBubble(e, true));
  renderLoadMore();
}

// 8) Integración en tu init general
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('matchSelector');
  const btnShow  = document.getElementById('btnSelectMatch');
  btnShow.addEventListener('click', () => {
    const matchId = selector.value;
    if (!matchId) return;
    initSummary(matchId);
  });
});

//--------------------------

// 1) Obtener alineación de la API
async function fetchLineup(matchId) {
  try {
    const res = await fetch(`/api/logMatch/matches/${matchId}/lineup`);
    if (!res.ok) throw new Error(`Lineup not found (${res.status})`);
    return await res.json();   // { A: [...], B: [...] }
  } catch (e) {
    console.error('❌ fetchLineup:', e);
    return { A: [], B: [] };
  }
}

// 2) Dibujar titulares y suplentes
// 1) Reordena titulares: Media (M) y Delantero (FW) arriba, Portero (GK) y Defensa (D) al fondo
// public/js/inMatch.js

// —————— Utilidades de Alineación ——————
function reorderTitulares(titulares) {
  const top    = titulares.filter(p => ['M', 'FW', 'D'].includes(p.posicion));
  const bottom = titulares.filter(p => ['GK'].includes(p.posicion));
  const middle = titulares.filter(p =>
    !['M','FW','GK','D'].includes(p.posicion)
  );
  return [...top, ...middle, ...bottom];
}

async function fetchLineup(matchId) {
  try {
    const res = await fetch(`/api/logMatch/matches/${matchId}/lineup`);
    if (!res.ok) throw new Error(`Lineup not found (${res.status})`);
    return await res.json(); // { A: [...], B: [...] }
  } catch (e) {
    console.error('❌ fetchLineup:', e);
    return { A: [], B: [] };
  }
}

function renderLineupSection(lineup) {
  ['A','B'].forEach(team => {
    const container = document.getElementById(`lineup${team}`);
    container.innerHTML = '';

    // Separa titulares y suplentes
    let titulares = lineup[team].filter(p => p.posicion !== 'bench');
    const suplentes = lineup[team].filter(p => p.posicion === 'bench');

    // Reordena titulares
    titulares = reorderTitulares(titulares);

    // TITULARES: dos filas, pero aquí usamos flex-wrap para adaptarnos
    container.insertAdjacentHTML('beforeend', '<h3>Alineación titular</h3>');
    const divTit = document.createElement('div');
    divTit.className = 'players-list';
    titulares.forEach(p => {
      divTit.insertAdjacentHTML('beforeend', `
        <div class="player-card">
          <div class="player-number">#${p.numero}</div>
          <div class="player-name">${p.nombre}</div>
          <div class="player-position">${p.posicion}</div>
        </div>
      `);
    });
    container.appendChild(divTit);

    // SUPLENTES
    container.insertAdjacentHTML('beforeend', '<h3>Suplentes</h3>');
    const divSub = document.createElement('div');
    divSub.className = 'players-list bench-list';
    suplentes.forEach(p => {
      divSub.insertAdjacentHTML('beforeend', `
        <div class="player-card">
          <div class="player-number">#${p.numero}</div>
          <div class="player-name">${p.nombre}</div>
        </div>
      `);
    });
    container.appendChild(divSub);
  });
}

async function loadAndRenderLineup(matchId) {
  const lineup = await fetchLineup(matchId);
  renderLineupSection(lineup);
}

// —————— Resto de inMatch.js ——————
document.addEventListener('DOMContentLoaded', () => {
  const selector        = document.getElementById('matchSelector');
  const btnShow         = document.getElementById('btnSelectMatch');
  const btnReloadLineup = document.getElementById('btnReloadLineup');
  const matchCentre     = document.getElementById('matchCentre');

  // Carga partidos en el selector (asume ya implementado)
  // loadMatches();

  // Cuando el usuario elige "Ver partido"
  btnShow.addEventListener('click', async () => {
    const matchId = selector.value;
    if (!matchId) return;
    matchCentre.dataset.matchId = matchId;

    // ... lógica de marcador, cronómetro y resumen ...

    // Carga inicial de alineación
    await loadAndRenderLineup(matchId);
  });

  // Botón de "Actualizar alineación"
  btnReloadLineup.addEventListener('click', async () => {
    const matchId = matchCentre.dataset.matchId;
    if (!matchId) return;
    await loadAndRenderLineup(matchId);
  });

  // ... resto de event listeners para goles, tarjetas, tabs, etc. ...
});

