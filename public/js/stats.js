// ==============================
// VARIABLES GLOBALES
// ==============================
let players = [];
let selectedPlayer = null;

// ==============================
// CARGA INICIAL DE JUGADORES
// ==============================
async function loadPlayers() {
  const res = await fetch('/api/players');
  players = await res.json();
  renderPlayerList();
}

// ==============================
// RENDERIZAR LISTA DE JUGADORES
// ==============================
function renderPlayerList() {
  const list = document.getElementById('playerList');
  list.innerHTML = '';

  players.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.addEventListener('click', () => selectPlayer(index));

    card.innerHTML = `
      <img class="avatar" src="${p.foto || 'img/default.png'}" />
      <div class="player-info">
        <div class="rating">
          <span class="ovr">${p.ovr || '??'}</span>
          <span class="pot">${p.pot || '??'}</span>
        </div>
        <div class="name">${p.nombre}</div>
        <div class="position-badges">
          ${(p.preferredPositions || ['CB']).map(pos => `<span class="badge">${pos}</span>`).join('')}
        </div>
      </div>
      <div class="meta">
        <div class="age">${p.edad || '??'}</div>
        <img class="club" src="${p.clubLogo || 'img/club-default.png'}" />
      </div>
    `;
    list.appendChild(card);
  });
}

// ==============================
// MÉTRICAS POR POSICIÓN
// ==============================
const metricsByPosition = {
  portero: {
    seguridad: 'Seguridad',
    atajada: 'Atajada',
    salida: 'Salida',
    precisionDespeje: 'Precisión de despeje',
    fuerzaDespeje: 'Fuerza de despeje',
    saltoFisico: 'Salto/Físico'
  },
  defensa: {
    recuperacionBalon: 'Recuperación de balón',
    salida: 'Salida',
    contribucionAtaque: 'Contribución al ataque',
    velocidad: 'Velocidad',
    disparo: 'Disparo',
    saltoFisico: 'Salto/Físico'
  },
  mediocampista: {
    recuperaciones: 'Recuperaciones',
    participacionClave: 'Participación clave',
    regate: 'Regate',
    velocidad: 'Velocidad',
    fuerzaDisparo: 'Fuerza de disparo',
    saltoFisico: 'Salto/Físico'
  },
  delantero: {
    efectividad: 'Efectividad',
    participacionClave: 'Participación clave',
    regates: 'Regates',
    velocidad: 'Velocidad',
    fuerzaDisparo: 'Fuerza de disparo',
    saltoFisico: 'Salto/Físico'
  }
};

// ==============================
// MOSTRAR ESTADÍSTICAS DE JUGADOR
// ==============================
function selectPlayer(index) {
  selectedPlayer = players[index];
  document.getElementById('playerName').textContent = selectedPlayer.nombre;
  renderStats(selectedPlayer);
  logAction(`Jugador seleccionado: ${selectedPlayer.nombre}`);
}

function renderStats(player) {
  const panel = document.getElementById('statsPanel');
  panel.innerHTML = '';
  const stats = player.estadisticas || {};
  const position = (player.posicion || '').toLowerCase();
  const metrics = metricsByPosition[position] || {};

  for (const key in metrics) {
    const div = document.createElement('div');
    div.textContent = `${metrics[key]}: ${stats[key] ?? 'N/A'}`;
    panel.appendChild(div);
  }
}

// ==============================
// CONSTRUCCIÓN DE INPUTS DINÁMICOS EN MODAL
// ==============================
function buildManualFields(position, stats = {}) {
  const container = document.getElementById('manualFields');
  container.innerHTML = '';
  const fields = metricsByPosition[position.toLowerCase()] || {};

  for (const key in fields) {
    const label = document.createElement('label');
    label.innerHTML = `
      ${fields[key]}:
      <input type="number" id="${key}_input" value="${stats[key] ?? ''}" />
    `;
    container.appendChild(label);
  }
}

// ==============================
// EVENTOS DE MODAL MANUAL
// ==============================
document.getElementById('openManualStats').addEventListener('click', () => {
  if (!selectedPlayer) return alert('Selecciona un jugador primero');
  const pos = selectedPlayer.posicion || 'delantero';
  document.getElementById('posicionSelect').value = pos;
  buildManualFields(pos, selectedPlayer.estadisticas || {});
  document.getElementById('manualModal').classList.remove('hidden');
});

document.getElementById('posicionSelect').addEventListener('change', (e) => {
  const nueva = e.target.value;
  buildManualFields(nueva, selectedPlayer.estadisticas || {});
});

// Guardar cambios
document.getElementById('saveManual').addEventListener('click', async () => {
  const nuevaPos = document.getElementById('posicionSelect').value;
  const container = document.getElementById('manualFields');
  const inputs = container.querySelectorAll('input');
  const updatedStats = {};

  inputs.forEach(input => {
    const key = input.id.replace('_input', '');
    updatedStats[key] = parseInt(input.value) || 0;
  });

  selectedPlayer.posicion = nuevaPos;
  selectedPlayer.estadisticas = updatedStats;

  try {
    await fetch(`/api/players/${selectedPlayer.numero}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posicion: nuevaPos, estadisticas: updatedStats })
    });
    renderStats(selectedPlayer);
    document.getElementById('manualModal').classList.add('hidden');
    logAction(`Estadísticas modificadas: ${selectedPlayer.nombre} (${nuevaPos})`);
  } catch (err) {
    console.error(err);
    alert('Error al guardar');
  }
});

// Cerrar modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('manualModal').classList.add('hidden');
});

// ==============================
// INICIO
// ==============================
loadPlayers();
