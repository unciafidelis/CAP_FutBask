// js/inMatch.js

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const body = document.getElementById('matchCentre');
  const modal = document.getElementById('selectMatchModal');
  const selector = document.getElementById('matchSelector');
  const btnShow = document.getElementById('btnSelectMatch');
  const btnChange = document.getElementById('btnChangeMatch');

  // Cargar partidos en el selector
  try {
    const res = await fetch('/api/matches');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const matches = await res.json();
    if (!matches.length) console.warn('No hay información disponible en: matches');
    selector.innerHTML = '<option value="">Selecciona un partido</option>';
    matches.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.nombreEquipoA} vs ${m.nombreEquipoB} (${m.fecha} ${m.hora})`;
      selector.appendChild(opt);
    });
  } catch (err) {
    console.warn('No hay información disponible en: matches', err);
    selector.innerHTML = '<option value="">Error cargando partidos</option>';
  }

  // Mostrar modal inicialmente
  modal.classList.add('active');

  // Habilitar botón Ver partido al seleccionar
  selector.addEventListener('change', () => {
    btnShow.disabled = !selector.value;
  });

  // Al hacer clic en "Ver partido"
  btnShow.addEventListener('click', () => {
    const matchId = selector.value;
    if (!matchId) {
      alert('Selecciona un partido.');
      return;
    }
    body.dataset.matchId = matchId;
    modal.classList.remove('active');
    main();
  });

  // Botón Cambiar partido (fija modal)
  btnChange.addEventListener('click', () => {
    modal.classList.add('active');
  });
}

async function main() {
  const body = document.getElementById('matchCentre');
  const matchId = body.dataset.matchId;
  if (!matchId) {
    console.error('No match ID specified in <body data-match-id>');
    return;
  }

  try {
    // Cargar datos
    const [match, lineup, events, stats] = await Promise.all([
      fetchMatch(matchId),
      fetchLineup(matchId),
      fetchEvents(matchId),
      fetchStats(matchId)
    ]);

    if (!match) return;
    renderHeader(match);
    renderTabs();
    renderSummary(events);
    renderLineup(lineup);
    renderStats(stats);
  } catch (err) {
    console.error('Error loading match centre:', err);
  }
}

// Fetch functions con manejo de errores
async function fetchMatch(id) {
  try {
    const res = await fetch(`/api/matches/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data) console.warn('No hay información disponible en: match');
    return data;
  } catch (err) {
    console.warn('No hay información disponible en: match', err);
    return null;
  }
}

async function fetchLineup(id) {
  try {
    const res = await fetch(`/api/logMatch/matches/${id}/lineup`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if ((!data.A?.length) && (!data.B?.length)) console.warn('No hay información disponible en: lineup');
    return data;
  } catch (err) {
    console.warn('No hay información disponible en: lineup', err);
    return { A: [], B: [] };
  }
}

async function fetchEvents(id) {
  try {
    const res = await fetch(`/api/logMatch/matches/${id}/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.length) console.warn('No hay información disponible en: events');
    return data;
  } catch (err) {
    console.warn('No hay información disponible en: events', err);
    return [];
  }
}

async function fetchStats(id) {
  try {
    const res = await fetch(`/api/stats/match/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if ((!data.players?.length) && (!data.teams?.length)) console.warn('No hay información disponible en: stats');
    return data;
  } catch (err) {
    console.warn('No hay información disponible en: stats', err);
    return { players: [], teams: [] };
  }
}

// Render Functions
function renderHeader(m) {
  document.getElementById('teamAName').textContent = m.nombreEquipoA || 'N/A';
  document.getElementById('teamALogo').src = m.logoA || 'placeholderA.png';
  document.getElementById('teamBName').textContent = m.nombreEquipoB || 'N/A';
  document.getElementById('teamBLogo').src = m.logoB || 'placeholderB.png';
  document.getElementById('scoreDisplay').textContent = '0 - 0';
  document.getElementById('matchTime').textContent = `00'`;
  document.getElementById('matchStatus').textContent = 'En vivo';
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tab).classList.add('active');
    });
  });
}

function renderSummary(events) {
  const container = document.getElementById('actionsComments');
  container.innerHTML = '';
  if (!events.length) {
    console.warn('No hay información en: events');
    return;
  }
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  events.forEach(ev => {
    const div = document.createElement('div');
    div.className = 'event-comment';
    div.setAttribute('data-clock', ev.clock || '');
    const textMap = {
      playerAction: `Jugador ${ev.details.playerId} → ${ev.details.action}`,
      card: `Tarjeta ${ev.details.card} a jugador ${ev.details.playerId}`,
      goal: `Gol${ev.details.autogoal ? ' (autogol)' : ''} de jugador ${ev.details.playerId}`,
      substitution: `Cambio equipo ${ev.details.team} – ${ev.details.from} → ${ev.details.to}`
    };
    const txt = textMap[ev.eventType] || ev.eventType;
    div.textContent = `${ev.clock || ''}: ${txt}`;
    container.appendChild(div);
    document.getElementById('matchTime').textContent = ev.clock || '';
  });
}

function renderLineup(lineup) {
  ['A', 'B'].forEach(team => {
    const container = document.getElementById(`lineup${team}`);
    container.innerHTML = '';
    if (!lineup[team]?.length) {
      console.warn(`No hay información en: lineup ${team}`);
      return;
    }
    lineup[team].forEach(j => {
      const card = document.createElement('div');
      card.className = 'player-card';
      card.innerHTML = `
        <div class="card-image"><img src="${j.foto}" alt="${j.nombre}"></div>
        <div class="card-number">${j.numero}</div>
        <div class="card-name">${j.nombre}</div>
        <div class="card-position">${j.posicion}</div>
      `;
      container.appendChild(card);
    });
  });
}

function renderStats(stats) {
  if (!stats.players?.length) {
    console.warn('No hay información en: stats players');
  }
  const byTeam = { A: [], B: [] };
  stats.players?.forEach(p => byTeam[p.team]?.push(p));
  ['A', 'B'].forEach(team => {
    const container = document.getElementById(`stats${team}`);
    container.innerHTML = '';
    if (!byTeam[team].length) {
      console.warn(`No hay información en: stats ${team}`);
      return;
    }
    byTeam[team].forEach(p => {
      const card = document.createElement('div');
      card.className = 'player-card';
      const statsEntries = Object.entries(p.stats || {}).map(
        ([k, v]) => `<div><span>${k.toUpperCase().substr(0,3)}</span><span>${Math.round(v)}</span></div>`
      ).join('');
      const cardsInfo = `
        ${p.cards?.yellow ? `<div class="card-yellow">🟨 x${p.cards.yellow}</div>` : ''}
        ${p.cards?.red    ? `<div class="card-red">🟥 x${p.cards.red}</div>` : ''}
      `;
      card.innerHTML = `
        <div class="card-image"><img src="${p.foto}" alt="${p.nombre}"></div>
        <div class="card-number">${p.numero}</div>
        <div class="card-name">${p.nombre}</div>
        <div class="card-stats">${statsEntries}${cardsInfo}</div>
      `;
      container.appendChild(card);
    });
  });
}
