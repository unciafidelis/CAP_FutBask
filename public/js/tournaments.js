const sportSelect = document.getElementById('sport');
const divisionSelect = document.getElementById('division');
const selectedTeamsInput = document.getElementById('selectedTeamIds');
const openModalBtn = document.getElementById('openTeamSelector');
const teamModal = document.getElementById('teamModal');
const closeTeamModal = document.getElementById('closeTeamModal');
const confirmTeams = document.getElementById('confirmTeams');
const selectAllTeamsBtn = document.getElementById('selectAllTeams');
const clearTeamSelectionBtn = document.getElementById('clearTeamSelection');
const teamListContainer = document.getElementById('teamListContainer');
const teamPagination = document.getElementById('teamPagination');
const form = document.getElementById('tournamentForm');
const nameInput = document.getElementById('tournamentName');
const tableBody = document.querySelector('#TournamentTable tbody');

let equiposFiltrados = [];
let currentTeamPage = 1;
const teamsPerPage = 10;
let selectedTeamIds = new Set();
let currentTorneoId = null;

const divisiones = {
  Futbol: [
    "Libre varonil",
    "Libre varonil Sabatino",
    "Infantil Varonil dominical",
    "Libre femenil dominical",
    "Libre varonil Dominical"
  ],
  Basketbol: [
    "Varonil Juvenil",
    "Femenil juvenil",
    "Libre varonil",
    "Libre varonil Sabatino",
    "Libre femenil Sabatino"
  ]
};

// === LÓGICA DE FORMULARIO ===
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

// Abrir modal
openModalBtn.addEventListener('click', async () => {
  const deporte = sportSelect.value;
  const division = divisionSelect.value;

  if (!deporte || !division) {
    alert('Selecciona deporte y división primero');
    return;
  }

  const response = await fetch('/api/teams');
  const equipos = await response.json();

  equiposFiltrados = equipos.filter(e => e.deporte === deporte && e.division === division);
  currentTeamPage = 1;
  renderTeamList();
  teamModal.classList.remove('hidden');
});

// Cerrar modal
closeTeamModal.addEventListener('click', () => {
  teamModal.classList.add('hidden');
});

// Seleccionar todos
selectAllTeamsBtn.addEventListener('click', () => {
  equiposFiltrados.forEach(eq => selectedTeamIds.add(eq.id));
  renderTeamList();
});

// Limpiar selección
clearTeamSelectionBtn.addEventListener('click', () => {
  selectedTeamIds.clear();
  renderTeamList();
});

// Confirmar equipos
confirmTeams.addEventListener('click', () => {
  selectedTeamsInput.value = JSON.stringify(Array.from(selectedTeamIds));
  teamModal.classList.add('hidden');
});

// Guardar o editar torneo
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const torneo = {
    nombre: nameInput.value,
    deporte: sportSelect.value,
    division: divisionSelect.value,
    equipos: Array.from(selectedTeamIds)
  };

  if (torneo.equipos.length === 0) {
    alert('Selecciona al menos un equipo');
    return;
  }

  const url = currentTorneoId ? `/api/tournaments/${currentTorneoId}` : '/api/tournaments';
  const method = currentTorneoId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(torneo)
  });

  if (response.ok) {
    alert(currentTorneoId ? 'Torneo actualizado' : 'Torneo creado');
    form.reset();
    divisionSelect.innerHTML = '<option value="">Selecciona un deporte primero</option>';
    selectedTeamIds.clear();
    selectedTeamsInput.value = '';
    currentTorneoId = null;
    loadTorneos();
  } else {
    const result = await response.json();
    alert('Error: ' + (result.message || 'No se pudo procesar'));
  }
});

// === RENDERIZAR TABLA ===
async function loadTorneos() {
  const response = await fetch('/api/tournaments');
  const torneos = await response.json();
  tableBody.innerHTML = '';

  torneos.forEach(t => {
    const tr = document.createElement('tr');
    const equipos = t.equipos.join(', ');
    tr.innerHTML = `
      <td>${t.nombre}</td>
      <td>${equipos}</td>
      <td>
        <button class="icon-button edit" onclick="editTorneo(${t.id})">
          <span class="material-icons">edit</span>
        </button>
        <button class="icon-button delete" onclick="deleteTorneo(${t.id})">
          <span class="material-icons">delete</span>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// === EDITAR ===
window.editTorneo = async function(id) {
  const response = await fetch(`/api/tournaments/${id}`);
  const torneo = await response.json();

  document.getElementById('tournamentName').value = torneo.nombre;
  document.getElementById('sport').value = torneo.deporte;

  sportSelect.dispatchEvent(new Event('change'));
  divisionSelect.value = torneo.division;

  selectedTeamIds = new Set(torneo.equipos);
  selectedTeamsInput.value = JSON.stringify(Array.from(selectedTeamIds));

  currentTorneoId = id;
  alert('Puedes modificar el torneo. Recuerda volver a seleccionar los equipos si cambias división.');
};

// === ELIMINAR ===
window.deleteTorneo = async function (id) {
  if (!confirm('¿Eliminar este torneo?')) return;
  await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
  alert('Torneo eliminado');
  loadTorneos();
};

// === MODAL: Equipos ===
function renderTeamList() {
  teamListContainer.innerHTML = '';

  const start = (currentTeamPage - 1) * teamsPerPage;
  const end = start + teamsPerPage;
  const equiposPagina = equiposFiltrados.slice(start, end);

  equiposPagina.forEach(eq => {
    const wrapper = document.createElement('div');
    wrapper.className = 'team-checkbox-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'team_' + eq.id;
    checkbox.value = eq.id;
    checkbox.checked = selectedTeamIds.has(eq.id);
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedTeamIds.add(eq.id);
      } else {
        selectedTeamIds.delete(eq.id);
      }
    });

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = eq.nombre;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    teamListContainer.appendChild(wrapper);
  });

  renderTeamPagination();
}

function renderTeamPagination() {
  teamPagination.innerHTML = '';
  const totalPages = Math.ceil(equiposFiltrados.length / teamsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = (i === currentTeamPage) ? 'active' : '';
    btn.addEventListener('click', () => {
      currentTeamPage = i;
      renderTeamList();
    });
    teamPagination.appendChild(btn);
  }
}

loadTorneos();
