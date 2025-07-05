document.addEventListener('DOMContentLoaded', () => {
  const teamSelect = document.getElementById('teamSelect');
  const playersList = document.getElementById('playersList');
  const manualFields = document.getElementById('manualFields');
  const playerNameHeader = document.getElementById('playerName');
  const radarChartCanvas = document.getElementById('radarChart');
  const statsPanel = document.getElementById('statsPanel');

  let currentChart = null;
  let equipos = [];
  let jugadores = [];
  let estadisticas = [];
  let selectedJugador = null;

  async function loadEquipos() {
    const res = await fetch('/api/teams');
    equipos = await res.json();
    renderEquipos();
  }

  function renderEquipos() {
    teamSelect.innerHTML = '<option value="">-- Selecciona un equipo --</option>';
    equipos.forEach(equipo => {
      const option = document.createElement('option');
      option.value = equipo.id;
      option.textContent = equipo.nombre;
      teamSelect.appendChild(option);
    });
  }

  teamSelect.addEventListener('change', () => {
    const teamId = teamSelect.value;
    if (teamId) loadJugadores(teamId);
  });

  async function loadJugadores(teamId) {
    const res = await fetch(`/api/players/byTeam/${teamId}`);
    jugadores = await res.json();
    renderJugadores();
  }

  function renderJugadores() {
  const playersList = document.getElementById('playersList');
  playersList.innerHTML = '';

  jugadores.forEach(jugador => {
    const div = document.createElement('div');
    div.classList.add('player-entry');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.gap = '10px';
    div.style.padding = '10px';
    div.style.backgroundColor = '#1e1e1e';
    div.style.borderRadius = '8px';
    div.style.cursor = 'pointer';

    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.alignItems = 'center';
    info.style.gap = '10px';

    // Logo del equipo (foto_equipo)
    const img = document.createElement('img');
    img.src = jugador.foto_equipo || 'img/logoClub.webp';
    img.className = 'club-photo';
    img.style.width = '30px';
    img.style.height = '30px';
    img.style.borderRadius = '4px';

    // Nombre y número
    const nameBlock = document.createElement('div');
    nameBlock.innerHTML = `<strong>#${jugador.numero}</strong> ${jugador.nombre}`;
    nameBlock.style.fontSize = '0.9rem';
    nameBlock.style.color = '#fff';

    // Etiqueta de posición
    const tag = document.createElement('span');
    tag.className = 'position-tag';
    tag.textContent = jugador.posicion.slice(0, 2).toUpperCase();

    if (jugador.posicion.toLowerCase().startsWith('p')) tag.classList.add('position-GK');
    else if (jugador.posicion.toLowerCase().startsWith('d')) tag.classList.add('position-D');
    else if (jugador.posicion.toLowerCase().startsWith('m')) tag.classList.add('position-M');
    else if (jugador.posicion.toLowerCase().startsWith('f')) tag.classList.add('position-FW');

    info.appendChild(img);
    info.appendChild(nameBlock);

    div.appendChild(info);
    div.appendChild(tag);

    div.onclick = () => mostrarDashboard(jugador);

    playersList.appendChild(div);
  });
}



  function mostrarDashboard(jugador) {
    selectedJugador = jugador;
    playerNameHeader.textContent = jugador.nombre;
    document.getElementById('playerFullName').textContent = jugador.nombre;
    document.getElementById('playerAge').textContent = jugador.edad || '--';
    document.getElementById('playerPhoto').src = 'img/avatar-default.png';
    document.getElementById('playerClubLogo').src = jugador.foto || 'img/logoClub.webp';

    const positionContainer = document.getElementById('playerPositions');
    positionContainer.innerHTML = '';
    if (jugador.posicion) {
      jugador.posicion.split(',').forEach(pos => {
        const span = document.createElement('span');
        span.classList.add('badge');
        span.textContent = pos.trim();
        positionContainer.appendChild(span);
      });
    }

    loadEstadisticas(jugador.id);
  }

  async function loadEstadisticas(jugadorId) {
    const res = await fetch(`/api/stats/${jugadorId}`);
    const data = await res.json();
    estadisticas = data;
    renderEstadisticas();
  }

  function renderEstadisticas() {
    statsPanel.innerHTML = '';
    if (!estadisticas || estadisticas.length === 0) return;

    const statsLabels = estadisticas.map(e => e.nombre);
    const statsValues = estadisticas.map(e => e.valor);

    if (currentChart) {
      currentChart.destroy();
    }

    const ctx = radarChartCanvas.getContext('2d');
    currentChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: statsLabels,
        datasets: [{
          label: `Estadísticas de ${selectedJugador.nombre}`,
          data: statsValues,
          backgroundColor: 'rgba(61, 90, 254, 0.3)',
          borderColor: '#3d5afe',
          pointBackgroundColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            angleLines: { color: '#ccc' },
            grid: { color: '#444' },
            pointLabels: { color: '#ccc' },
            ticks: {
              backdropColor: 'transparent',
              color: '#fff',
              stepSize: 20,
              max: 100
            }
          }
        }
      }
    });
  }

  // Abrir modal de edición manual
  document.getElementById('openManualStats').addEventListener('click', () => {
    if (!selectedJugador) {
      alert('Selecciona un jugador primero');
      return;
    }

    const select = document.getElementById('posicionSelect');
    select.value = selectedJugador.posicion || 'delantero';

    renderManualFields(select.value);
    document.getElementById('manualModal').classList.remove('hidden');
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('manualModal').classList.add('hidden');
  });

  document.getElementById('posicionSelect').addEventListener('change', (e) => {
    renderManualFields(e.target.value);
  });

  function renderManualFields(posicion) {
    const campos = {
      portero: ['Precisión de despeje', 'Fuerza de despeje', 'Salto/físico'],
      defensa: ['Velocidad', 'Disparo', 'Salto/físico'],
      mediocampista: ['Velocidad', 'Fuerza de disparo', 'Salto/físico'],
      delantero: ['Velocidad', 'Fuerza de disparo', 'Salto/físico']
    };

    manualFields.innerHTML = '';
    campos[posicion].forEach(campo => {
      const div = document.createElement('div');
      div.classList.add('form-group');
      div.innerHTML = `
        <label>${campo}</label>
        <input type="number" min="0" max="100" data-campo="${campo}" required placeholder="0-100">
      `;
      manualFields.appendChild(div);
    });
  }

  document.getElementById('saveManual').addEventListener('click', async () => {
    if (!selectedJugador) return;

    const inputs = manualFields.querySelectorAll('input');
    const body = {
      jugador_id: selectedJugador.id,
      estadisticas: []
    };

    inputs.forEach(input => {
      body.estadisticas.push({
        nombre: input.dataset.campo,
        valor: parseInt(input.value || 0)
      });
    });

    const res = await fetch('/api/stats/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Estadísticas guardadas');
      document.getElementById('manualModal').classList.add('hidden');
      loadEstadisticas(selectedJugador.id);
    } else {
      alert('Error al guardar estadísticas');
    }
  });

  // Iniciar carga inicial
  loadEquipos();
});
