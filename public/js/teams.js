document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('teamForm');
  const nameInput = document.getElementById('teamName');
  const divisionSelect = document.getElementById('division');
  const sportSelect = document.getElementById('sport');
  const tableBody = document.querySelector('#TeamTable tbody');

  const viewTeamsBtn = document.getElementById('viewTeamsBtn');
  const teamsModal = document.getElementById('teamsModal');
  const playersModal = document.getElementById('playersModal');
  const closeTeamsModal = document.getElementById('closeTeamsModal');
  const closePlayersModal = document.getElementById('closePlayersModal');
  const teamsListContainer = document.getElementById('teamsListContainer');
  const playersListContainer = document.getElementById('playersListContainer');

  let editingId = null;

  const divisiones = {
    Futbol: [
      "Libre varonil", "Libre varonil Sabatino", "Infantil Varonil dominical",
      "Libre femenil dominical", "Libre varonil Dominical"
    ],
    Basketbol: [
      "Varonil Juvenil", "Femenil juvenil", "Libre varonil",
      "Libre varonil Sabatino", "Libre femenil Sabatino"
    ]
  };

  sportSelect.addEventListener('change', () => {
    const sport = sportSelect.value;
    divisionSelect.innerHTML = '<option value="">Selecciona una división</option>';

    if (divisiones[sport]) {
      divisiones[sport].forEach(div => {
        const option = document.createElement('option');
        option.value = div;
        option.textContent = div;
        divisionSelect.appendChild(option);
      });
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const equipo = {
      nombre: nameInput.value,
      division: divisionSelect.value,
      deporte: sportSelect.value
    };

    const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipo)
    });

    if (response.ok) {
      alert(editingId ? 'Equipo actualizado' : 'Equipo agregado');
      form.reset();
      editingId = null;
      divisionSelect.innerHTML = '<option value="">Selecciona un deporte primero</option>';
      loadEquipos();
    } else {
      const result = await response.json();
      alert('Error: ' + (result.message || 'No se pudo procesar'));
    }
  });

  async function loadEquipos() {
    const response = await fetch('/api/teams');
    const equipos = await response.json();
    tableBody.innerHTML = '';
    teamsListContainer.innerHTML = '';

    equipos.forEach(eq => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${eq.nombre}</td>
        <td>${eq.division}</td>
        <td>${eq.deporte}</td>
        <td>${new Date(eq.created_at).toLocaleString()}</td>
        <td>
          <button class="icon-button edit" onclick="editEquipo('${eq.id}')">
            <span class="material-icons">edit</span>
          </button>
          <button class="icon-button delete" onclick="deleteEquipo('${eq.id}')">
            <span class="material-icons">delete</span>
          </button>
        </td>
      `;
      tableBody.appendChild(tr);

      // Render también para el modal
      const teamDiv = document.createElement('div');
      teamDiv.classList.add('team-modal-entry');
      teamDiv.textContent = eq.nombre;
      teamDiv.onclick = () => loadJugadores(eq.id, eq.nombre);
      teamsListContainer.appendChild(teamDiv);
    });
  }

  window.editEquipo = async function (id) {
    const response = await fetch(`/api/teams`);
    const equipos = await response.json();
    const equipo = equipos.find(e => e.id == id);

    if (!equipo) return alert('Equipo no encontrado');

    nameInput.value = equipo.nombre;
    sportSelect.value = equipo.deporte;
    sportSelect.dispatchEvent(new Event('change'));
    divisionSelect.value = equipo.division;
    editingId = equipo.id;
  };

  window.deleteEquipo = async function (id) {
    if (!confirm('¿Eliminar este equipo?')) return;

    const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' });

    if (response.ok) {
      alert('Equipo eliminado');
      loadEquipos();
    } else {
      const result = await response.json();
      alert('Error al eliminar: ' + (result.message || ''));
    }
  };

  async function loadJugadores(equipoId, nombreEquipo) {
    playersListContainer.innerHTML = '';
    const response = await fetch(`/api/teams/${equipoId}/players`);
    const jugadores = await response.json();

    document.getElementById('playersModalTitle').textContent = `Jugadores de ${nombreEquipo}`;
    jugadores.forEach(j => {
      const div = document.createElement('div');
      div.className = 'player-entry';
      div.textContent = j.nombre;
      playersListContainer.appendChild(div);
    });

    playersModal.classList.remove('hidden');
  }

  viewTeamsBtn.addEventListener('click', () => {
    teamsModal.classList.remove('hidden');
  });

  closeTeamsModal.addEventListener('click', () => {
    teamsModal.classList.add('hidden');
  });

  closePlayersModal.addEventListener('click', () => {
    playersModal.classList.add('hidden');
  });

  loadEquipos();
});

const teamsList = document.getElementById('teamsList');
const playersList = document.getElementById('playersList');
const playersListContainer = document.getElementById('playersListContainer');
const teamsListContainer = document.getElementById('teamsListContainer');
const backToTeamsBtn = document.getElementById('backToTeams');

backToTeamsBtn.addEventListener('click', () => {
  playersListContainer.classList.add('hidden');
  teamsListContainer.classList.remove('hidden');
});

async function loadEquiposParaModal() {
  const response = await fetch('/api/teams');
  const equipos = await response.json();
  teamsList.innerHTML = '';

  equipos.forEach(eq => {
    const div = document.createElement('div');
    div.className = 'team-modal-entry';
    div.textContent = eq.nombre;
    div.onclick = () => loadJugadores(eq.id, eq.nombre);
    teamsList.appendChild(div);
  });
}

async function loadJugadores(equipoId, nombreEquipo) {
  const response = await fetch(`/api/teams/${equipoId}/players`);
  const jugadores = await response.json();

  document.getElementById('playersModalTitle').textContent = `Jugadores de ${nombreEquipo}`;
  playersList.innerHTML = '';

  jugadores.forEach(j => {
    const div = document.createElement('div');
    div.className = 'player-entry';
    div.textContent = j.nombre;
    playersList.appendChild(div);
  });

  teamsListContainer.classList.add('hidden');
  playersListContainer.classList.remove('hidden');
}

document.getElementById('viewTeamsBtn').addEventListener('click', () => {
  loadEquiposParaModal();
  document.getElementById('teamsModal').classList.remove('hidden');
});

document.getElementById('closeTeamsModal').addEventListener('click', () => {
  document.getElementById('teamsModal').classList.add('hidden');
  playersListContainer.classList.add('hidden');
  teamsListContainer.classList.remove('hidden');
});
// Variables de paginación
let equipos = [];     // Se llenará con los equipos desde la API
let jugadores = [];   // Se llenará con los jugadores por equipo
let currentEquipoPage = 1;
let currentJugadorPage = 1;
const itemsPerPage = 5;

// Referencias DOM
const equiposTableBody = document.querySelector('#equiposModalTable tbody');
const jugadoresTableBody = document.querySelector('#jugadoresModalTable tbody');
const equiposModal = document.getElementById('modalEquipos');
const jugadoresModal = document.getElementById('modalJugadores');

// Botones de navegación (puedes agregarlos al HTML si no existen)
const equipoPagination = document.createElement('div');
equipoPagination.className = 'pagination';
equiposModal.querySelector('.modal-content').appendChild(equipoPagination);

const jugadorPagination = document.createElement('div');
jugadorPagination.className = 'pagination';
jugadoresModal.querySelector('.modal-content').appendChild(jugadorPagination);

// Función genérica para paginar
function paginate(data, page) {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const items = data.slice(start, end);
  return { page, totalPages, items };
}

// Render equipos con paginación
function renderEquiposPaginados() {
  const { page, totalPages, items } = paginate(equipos, currentEquipoPage);
  equiposTableBody.innerHTML = '';

  for (let i = 0; i < itemsPerPage; i++) {
    const eq = items[i];
    const row = document.createElement('tr');
    if (eq) {
      row.innerHTML = `
        <td>${eq.nombre}</td>
        <td>${eq.deporte}</td>
        <td>${eq.division}</td>
        <td>
          <button onclick="verJugadores(${eq.id})">Ver Jugadores</button>
        </td>
      `;
    } else {
      row.innerHTML = '<td colspan="4">&nbsp;</td>';
    }
    equiposTableBody.appendChild(row);
  }

  equipoPagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === page) btn.classList.add('active');
    btn.onclick = () => {
      currentEquipoPage = i;
      renderEquiposPaginados();
    };
    equipoPagination.appendChild(btn);
  }
}

// Render jugadores con paginación
function renderJugadoresPaginados() {
  const { page, totalPages, items } = paginate(jugadores, currentJugadorPage);
  jugadoresTableBody.innerHTML = '';

  for (let i = 0; i < itemsPerPage; i++) {
    const jugador = items[i];
    const row = document.createElement('tr');
    if (jugador) {
      row.innerHTML = `
        <td>${jugador.nombre}</td>
        <td>${jugador.posicion}</td>
        <td>${jugador.numero}</td>
      `;
    } else {
      row.innerHTML = '<td colspan="3">&nbsp;</td>';
    }
    jugadoresTableBody.appendChild(row);
  }

  jugadorPagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === page) btn.classList.add('active');
    btn.onclick = () => {
      currentJugadorPage = i;
      renderJugadoresPaginados();
    };
    jugadorPagination.appendChild(btn);
  }
}

// Función para abrir modal jugadores por equipo
async function verJugadores(teamId) {
  const res = await fetch(`/api/teams/${teamId}/players`);
  jugadores = await res.json();
  currentJugadorPage = 1;
  jugadoresModal.classList.remove('hidden');
  renderJugadoresPaginados();
}
