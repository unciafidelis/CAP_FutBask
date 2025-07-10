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

    await updateAll(matchId);
    pollingInterval = setInterval(() => updateAll(matchId), 5000);
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

async function fetchEvents(id) {
  const res = await fetch(`/api/logMatch/matches/${id}/events`);
  if (!res.ok) throw new Error('Events not found');
  return res.json();
}

function renderHeader(m, events) {
  document.getElementById('teamAName').textContent = m.nombreEquipoA;
  document.getElementById('teamALogo').src         = m.logoA || 'placeholderA.png';
  document.getElementById('teamBName').textContent = m.nombreEquipoB;
  document.getElementById('teamBLogo').src         = m.logoB || 'placeholderB.png';

  const goalsA = events.filter(ev => ev.eventType === 'goal' && ev.details.team === 'A').length;
  const goalsB = events.filter(ev => ev.eventType === 'goal' && ev.details.team === 'B').length;
  document.getElementById('scoreDisplay').textContent = `${goalsA} - ${goalsB}`;

  const lastClock = events.length
    ? events[events.length - 1].clock
    : "00'";
  document.getElementById('matchTime').textContent   = lastClock;
  document.getElementById('matchStatus').textContent = 'En vivo';
}

function renderSummary(events) {
  const container = document.getElementById('actionsComments');
  container.innerHTML = '';
  if (!events.length) return;

  // Últimos 5 eventos en orden cronológico
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  events.slice(-5).forEach(ev => {
    const bubble = document.createElement('div');
    bubble.classList.add(
      'chat-bubble',
      ev.details.team === 'A' ? 'comment-left' : 'comment-right'
    );

    let narr = '';
    switch (ev.eventType) {
      case 'goal':
        narr = `⚽ ${ev.details.playerName} anota${ev.details.autogol ? ' un autogol' : ''}!`;
        break;
      case 'card':
        narr = ev.details.card === 'yellow'
          ? `🟨 Tarjeta amarilla a ${ev.details.playerName}.`
          : `🟥 Tarjeta roja a ${ev.details.playerName}.`;
        break;
      case 'substitution':
        narr = `🔁 Cambio en ${
          ev.details.team === 'A' ? ev.details.teamNameA : ev.details.teamNameB
        }: sale ${ev.details.fromName}, entra ${ev.details.toName}.`;
        break;
      default:
        narr = `➡️ ${ev.details.playerName} ${ev.details.action}.`;
    }

    bubble.innerHTML = `
      <img src="${ev.details.playerFoto || 'img/player_placeholder.png'}"
           class="bubble-player-img"
           alt="${ev.details.playerName}">
      <div class="bubble-content">
        <div class="bubble-text">${narr}</div>
        <div class="bubble-time">${ev.clock}</div>
      </div>
    `;
    container.appendChild(bubble);
  });
}
