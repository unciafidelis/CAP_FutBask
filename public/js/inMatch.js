// js/inMatch.js

document.addEventListener('DOMContentLoaded', init);

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
  } catch (err) {
    console.warn('Error cargando /api/matches', err);
    selector.innerHTML = '<option value="">Error cargando partidos</option>';
  }

  // Mostrar modal
  modal.classList.add('active');

  // Habilitar botón cuando se selecciona algo
  selector.addEventListener('change', () => {
    btnShow.disabled = !selector.value;
  });

  // Ver partido
  btnShow.addEventListener('click', async () => {
    const matchId = selector.value;
    if (!matchId) return alert('Selecciona un partido.');
    body.dataset.matchId = matchId;
    modal.classList.remove('active');
    await updateAll(matchId);
    setInterval(() => updateAll(matchId), 5000);
  });

  // Cambiar partido (reabre modal)
  btnChange.addEventListener('click', () => {
    modal.classList.add('active');
  });
}

async function updateAll(matchId) {
  // 2) Trae datos en paralelo, pero stats puede fallar
  const [ match, lineup, events ] = await Promise.all([
    fetchMatch(matchId),
    fetchLineup(matchId),
    fetchEvents(matchId)
  ]);

  // stats por separado para capturar 404
  let stats;
  try {
    stats = await fetchStats(matchId);
  } catch (err) {
    console.warn('Stats no disponibles, usando valores vacíos', err);
    stats = { players: [], teams: [] };
  }

  if (!match) return;
  renderHeader(match, events);
  renderTabs();
  renderSummary(events);
  renderLineup(lineup, match);
  renderStats(stats);
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

async function fetchStats(id) {
  const res = await fetch(`/api/stats/match/${id}`);
  if (res.status === 404) {
    // no hay ruta GET, devolvemos vacío sin hacer throw
    return { players: [], teams: [] };
  }
  if (!res.ok) throw new Error('Error fetching stats');
  return await res.json();
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

function renderSummary(events) {
  const container = document.getElementById('actionsComments');
  container.innerHTML = '';
  if (!events.length) return;
  events.sort((a,b)=> new Date(a.timestamp)-new Date(b.timestamp));
  events.forEach(ev => {
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', ev.details.team==='A'?'comment-left':'comment-right');
    const imgSrc = ev.details.playerFoto || 'img/player_placeholder.png';
    bubble.innerHTML = `
      <img src="${imgSrc}" alt="J${ev.details.playerId}">
      <div class="bubble-content">
        <div class="bubble-header">${ev.details.playerName||'Jugador '+ev.details.playerId}</div>
        <div class="bubble-action">${
          ev.eventType==='playerAction'? ev.details.action
          : ev.eventType==='goal'? `Gol${ev.details.autogoal?' (autogol)':''}`
          : ev.eventType==='card'? `Tarjeta ${ev.details.card}`
          : ev.eventType==='substitution'? `Cambio ${ev.details.from}→${ev.details.to}`
          : ev.eventType
        }</div>
        <div class="bubble-time">${ev.clock}</div>
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

function renderStats(stats) {
  const byTeam = { A:[], B:[] };
  stats.players?.forEach(p => byTeam[p.team]?.push(p));
  ['A','B'].forEach(team => {
    const cont = document.getElementById(`stats${team}`);
    cont.innerHTML = '';
    byTeam[team].forEach(p => {
      const entries = Object.entries(p.stats||{})
        .map(([k,v])=>`<div><span>${k.toUpperCase().slice(0,3)}</span><span>${Math.round(v)}</span></div>`).join('');
      const cards   = `
        ${p.cards?.yellow?`<div class="card-yellow">🟨 x${p.cards.yellow}</div>`:''}
        ${p.cards?.red   ?`<div class="card-red">🟥 x${p.cards.red}</div>`:''}
      `;
      const card = document.createElement('div');
      card.className = 'player-card';
      card.innerHTML = `
        <div class="card-image"><img src="${p.foto}" alt="${p.nombre}"></div>
        <div class="card-number">${p.numero}</div>
        <div class="card-name">${p.nombre}</div>
        <div class="card-stats">${entries}${cards}</div>
      `;
      cont.appendChild(card);
    });
  });
}
