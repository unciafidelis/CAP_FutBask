// js/inMatch.js

document.addEventListener('DOMContentLoaded', init);

let refreshInterval = null;

async function init() {
  const body     = document.getElementById('matchCentre');
  const modal    = document.getElementById('selectMatchModal');
  const selector = document.getElementById('matchSelector');
  const btnShow  = document.getElementById('btnSelectMatch');
  const btnChange= document.getElementById('btnChangeMatch');

  // 1) Carga partidos en el selector
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

  // Mostrar modal
  modal.classList.add('active');

  // Habilitar botón Ver partido
  selector.addEventListener('change', () => {
    btnShow.disabled = !selector.value;
  });

  // Al hacer clic en "Ver partido"
  btnShow.addEventListener('click', async () => {
    const matchId = selector.value;
    if (!matchId) return alert('Selecciona un partido.');
    body.dataset.matchId = matchId;
    modal.classList.remove('active');
    if (refreshInterval) clearInterval(refreshInterval);
    await updateAll(matchId);
    refreshInterval = setInterval(() => updateAll(matchId), 5000);
  });

  // Botón Cambiar partido (reabre modal)
  btnChange.addEventListener('click', () => {
    modal.classList.add('active');
  });
}

async function updateAll(matchId) {
  // 2) Trae datos en paralelo
  const [ match, lineup, events ] = await Promise.all([
    fetchMatch(matchId),
    fetchLineup(matchId),
    fetchEvents(matchId)
  ]);

  if (!match) return;

  // 2.1) Construye un mapa id→{name,foto}
  const playerInfo = {};
  ['A','B'].forEach(team => {
    (lineup[team]||[]).forEach(j => {
      playerInfo[j.id] = { 
        name: j.nombre,
        foto: j.foto
      };
    });
  });

  renderHeader(match, events);
  renderTabs();
  renderSummary(events, match, playerInfo);
  renderLineup(lineup, match);
}

// ——— Fetchers ——————————————————————————————————————————

async function fetchMatch(id) {
  const res = await fetch(`/api/matches/${id}`);
  if (!res.ok) throw new Error('Error fetching match');
  return await res.json();
}

async function fetchLineup(id) {
  const res = await fetch(`/api/logMatch/matches/${id}/lineup`);
  if (!res.ok) throw new Error('Error fetching lineup');
  return await res.json(); // { A: [...], B: [...] }
}

async function fetchEvents(id) {
  const res = await fetch(`/api/logMatch/matches/${id}/events`);
  if (!res.ok) throw new Error('Error fetching events');
  return await res.json(); // [ ... ]
}

// ——— Renderers ——————————————————————————————————————————

function renderHeader(m, events) {
  document.getElementById('teamAName').textContent = m.nombreEquipoA;
  document.getElementById('teamALogo').src         = m.logoA || 'placeholderA.png';
  document.getElementById('teamBName').textContent = m.nombreEquipoB;
  document.getElementById('teamBLogo').src         = m.logoB || 'placeholderB.png';

  const goalsA = events.filter(ev => ev.eventType==='goal' && ev.details.team==='A').length;
  const goalsB = events.filter(ev => ev.eventType==='goal' && ev.details.team==='B').length;
  document.getElementById('scoreDisplay').textContent = `${goalsA} - ${goalsB}`;

  const lastClock = events.length ? events[events.length-1].clock : "00'";
  document.getElementById('matchTime').textContent   = lastClock;
  document.getElementById('matchStatus').textContent = 'En vivo';
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    };
  });
}

function renderSummary(events, match, playerInfo) {
  const container = document.getElementById('actionsComments');
  container.innerHTML = '';
  if (!events.length) return;

  // Ordenar cronológicamente y quedarnos con los últimos 5
  events.sort((a,b)=> new Date(a.timestamp) - new Date(b.timestamp));
  const recientes = events.slice(-5);

  recientes.forEach(ev => {
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', ev.details.team==='A' ? 'comment-left' : 'comment-right');

    // Obtiene datos del jugador
    const info = playerInfo[ev.details.playerId] || {};
    const playerName = ev.details.playerName || info.name || `Jugador ${ev.details.playerId}`;
    const playerImg  = ev.details.playerFoto || info.foto || 'img/player_placeholder.png';

    // Narración estilo comentarista
    let narr = '';
    switch (ev.eventType) {
      case 'goal':
        narr = `⚽ ${playerName} ${ev.details.autogol ? 'anota un autogol' : 'marca un gol'}!`;
        break;
      case 'card':
      case 'yellow_card':
        narr = `🟨 Tarjeta amarilla a ${playerName}.`;
        break;
      case 'red_card':
        narr = `🟥 Tarjeta roja a ${playerName}.`;
        break;
      case 'substitution':
        const teamName = ev.details.team==='A' ? match.nombreEquipoA : match.nombreEquipoB;
        const fromName = ev.details.fromName  || `#${ev.details.from}`;
        const toName   = ev.details.toName    || `#${ev.details.to}`;
        narr = `🔁 Cambio en ${teamName}: sale ${fromName}, entra ${toName}.`;
        break;
      default:
        narr = `➡️ ${playerName} ${ev.details.action||''}.`;
    }

    bubble.innerHTML = `
      <img src="${playerImg}" class="bubble-player-img" alt="${playerName}">
      <div class="bubble-content">
        <div class="bubble-text">${narr}</div>
        <div class="bubble-time">${ev.clock||''}</div>
      </div>
    `;
    container.appendChild(bubble);
  });
}

function renderLineup(lineup, m) {
  ['A','B'].forEach(team => {
    const el = document.getElementById(`lineup${team}`);
    el.innerHTML = `
      <div class="team-header">
        <img src="${team==='A'?m.logoA:m.logoB}" class="team-logo-sm">
        <span class="team-name-sm">${team==='A'?m.nombreEquipoA:m.nombreEquipoB}</span>
      </div>
      <div class="players-list"></div>
    `;
    const list = el.querySelector('.players-list');
    lineup[team].forEach(j => {
      const card = document.createElement('div');
      card.className = 'player-card';
      card.innerHTML = `
        <div class="card-image"><img src="${j.foto}" alt="${j.nombre}"></div>
        <div class="card-number">${j.numero}</div>
        <div class="card-name">${j.nombre}</div>
        <div class="card-position">${j.posicion}</div>
      `;
      list.appendChild(card);
    });
  });
}
