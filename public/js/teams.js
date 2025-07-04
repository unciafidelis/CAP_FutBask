// public/js/teams.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('teamForm');
  const nameInput = document.getElementById('teamName');
  const divisionSelect = document.getElementById('division');
  const sportSelect = document.getElementById('sport');
  const fileInput = document.getElementById('teamPhoto');

  const viewTeamsBtn = document.getElementById('viewTeamsBtn');
  const teamsModal = document.getElementById('teamsModal');
  const playersModal = document.getElementById('playersModal');
  const closeTeamsModal = document.getElementById('closeTeamsModal');
  const closePlayersModal = document.getElementById('closeJugadoresModal');
  const teamsListContainer = document.getElementById('teamsListContainer');
  const playersListContainer = document.getElementById('playersListContainer');
  const equiposTableBody = document.querySelector('#equiposModalTable tbody');
  const jugadoresTableBody = document.querySelector('#jugadoresModalTable tbody');

  const teamsList = document.getElementById('teamsList');
  const playersList = document.getElementById('playersList');
  const backToTeamsBtn = document.getElementById('backToTeams');

  const equipoPagination = document.getElementById('teamPagination');
  const jugadorPagination = document.getElementById('jugadorPagination');

  let equipos = [];
  let jugadores = [];
  let editingId = null;
  let currentEquipoPage = 1;
  let currentJugadorPage = 1;
  const itemsPerPage = 5;

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

    const formData = new FormData();
    formData.append('nombre', nameInput.value);
    formData.append('division', divisionSelect.value);
    formData.append('deporte', sportSelect.value);

    const imageFile = fileInput.files[0];
    if (imageFile) {
      formData.append('foto', imageFile);
    }

    const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      body: formData
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
    equipos = await response.json();
    renderEquiposPaginados();
    renderEquiposVisuales();
  }

  function renderEquiposPaginados() {
    const { page, totalPages, items } = paginate(equipos, currentEquipoPage);
    equiposTableBody.innerHTML = '';
    equipoPagination.innerHTML = '';

    items.forEach(eq => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${eq.nombre}</td>
        <td>${eq.deporte}</td>
        <td>${eq.division}</td>
        <td>
          <button onclick="editEquipo(${eq.id})">Editar</button>
          <button onclick="deleteEquipo(${eq.id})">Eliminar</button>
        </td>
      `;
      equiposTableBody.appendChild(tr);
    });

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

  function renderEquiposVisuales() {
    teamsList.innerHTML = '';
    equipos
      .sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
      .forEach((eq, index) => {
        const div = document.createElement('div');
        div.className = 'team-modal-entry';

        const position = document.createElement('div');
        position.className = 'team-position';
        position.textContent = `#${index + 1}`;

        const img = document.createElement('img');
        img.className = 'team-logo';
        img.src = eq.foto || '/img/teamImg/default.jpg';
        img.alt = eq.nombre;

        const name = document.createElement('h4');
        name.textContent = eq.nombre;

        const pos = document.createElement('p');
        pos.textContent = `${eq.division} - ${eq.deporte}`;

        const btns = document.createElement('div');
        btns.className = 'team-actions';
        btns.innerHTML = `
          <button onclick="editEquipo(${eq.id})">Editar</button>
          <button onclick="deleteEquipo(${eq.id})">Eliminar</button>
        `;

        const badge = document.createElement('span');
        badge.className = 'performance-badge ' + getPerformanceClass(eq.promedio || 0);
        badge.textContent = `${Math.round(eq.promedio || 0)}%`;

        div.appendChild(position);
        div.appendChild(img);
        div.appendChild(name);
        div.appendChild(pos);
        div.appendChild(btns);
        div.appendChild(badge);

        div.onclick = () => loadJugadores(eq.id, eq.nombre);
        teamsList.appendChild(div);
      });
  }

  function getPerformanceClass(p) {
    if (p < 25) return 'red';
    if (p < 51) return 'orange';
    if (p < 76) return 'yellow';
    return 'green';
  }

  window.editEquipo = async function (id) {
    const equipo = equipos.find(e => e.id === id);
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
    const response = await fetch(`/api/teams/${equipoId}/players`);
    jugadores = await response.json();
    currentJugadorPage = 1;
    renderJugadoresPaginados(nombreEquipo);
    playersListContainer.classList.remove('hidden');
    teamsListContainer.classList.add('hidden');
  }

  function renderJugadoresPaginados(nombreEquipo) {
    const { page, totalPages, items } = paginate(jugadores, currentJugadorPage);
    jugadoresTableBody.innerHTML = '';
    jugadorPagination.innerHTML = '';
    document.getElementById('playersModalTitle').textContent = `Jugadores de ${nombreEquipo}`;

    items.forEach(j => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${j.nombre}</td>
        <td>${j.posicion}</td>
        <td>${j.numero}</td>
      `;
      jugadoresTableBody.appendChild(row);
    });

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === page) btn.classList.add('active');
      btn.onclick = () => {
        currentJugadorPage = i;
        renderJugadoresPaginados(nombreEquipo);
      };
      jugadorPagination.appendChild(btn);
    }
  }

  viewTeamsBtn.addEventListener('click', () => {
    teamsModal.classList.remove('hidden');
  });

  closeTeamsModal.addEventListener('click', () => {
    teamsModal.classList.add('hidden');
    playersListContainer.classList.add('hidden');
    teamsListContainer.classList.remove('hidden');
  });

  closePlayersModal.addEventListener('click', () => {
    playersModal.classList.add('hidden');
  });

  backToTeamsBtn.addEventListener('click', () => {
    playersListContainer.classList.add('hidden');
    teamsListContainer.classList.remove('hidden');
  });

  function paginate(data, page) {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const items = data.slice(start, end);
    return { page, totalPages, items };
  }

  loadEquipos();
});
