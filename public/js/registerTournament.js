document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tournamentForm');
  const sportSelect = document.getElementById('sport');
  const divisionSelect = document.getElementById('division');
  const teamsSelect = document.getElementById('teams');
  const tournamentTableBody = document.querySelector('#TournamentTable tbody');

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
    clearTeams();
  });

  divisionSelect.addEventListener('change', loadTeams);

  async function loadTeams() {
    const sport = sportSelect.value;
    const division = divisionSelect.value;
    if (!sport || !division) return;

    const response = await fetch('/api/teams');
    const allTeams = await response.json();

    const filtered = allTeams.filter(team =>
      team.deporte === sport && team.division === division
    );

    teamsSelect.innerHTML = '';
    if (filtered.length === 0) {
      const opt = document.createElement('option');
      opt.text = 'No hay equipos disponibles';
      opt.disabled = true;
      teamsSelect.appendChild(opt);
      return;
    }

    filtered.forEach(team => {
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = team.nombre;
      teamsSelect.appendChild(option);
    });
  }

  function clearTeams() {
    teamsSelect.innerHTML = '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedTeamIds = Array.from(teamsSelect.selectedOptions).map(opt => parseInt(opt.value));
    if (selectedTeamIds.length < 2) {
      alert('Selecciona al menos 2 equipos para crear un torneo.');
      return;
    }

    const torneo = {
      nombre: document.getElementById('tournamentName').value,
      deporte: sportSelect.value,
      division: divisionSelect.value,
      equipos: selectedTeamIds,
      created_at: new Date()
    };

    const response = await fetch('/api/register-tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(torneo)
    });

    if (response.ok) {
      alert('Torneo creado exitosamente');
      form.reset();
      divisionSelect.innerHTML = '<option value="">Selecciona un deporte primero</option>';
      clearTeams();
      loadTorneos();
    } else {
      const result = await response.json();
      alert('Error: ' + (result.message || 'No se pudo crear el torneo.'));
    }
  });

  async function loadTorneos() {
    const responseTorneos = await fetch('/api/tournaments');
    const torneos = await responseTorneos.json();

    const responseEquipos = await fetch('/api/teams');
    const allTeams = await responseEquipos.json();

    tournamentTableBody.innerHTML = '';

    torneos.forEach(torneo => {
      const row = document.createElement('tr');
      const equiposNombres = torneo.equipos
        .map(id => {
          const eq = allTeams.find(t => t.id === id);
          return eq ? eq.nombre : 'Desconocido';
        }).join(', ');

      row.innerHTML = `
        <td>${torneo.nombre}</td>
        <td>${equiposNombres}</td>
        <td>
            <button class="icon-button delete" onclick="deleteTorneo('${torneo.id}')">
              <span class="material-icons">delete</span>
            </button>
        </td>
      `;

      tournamentTableBody.appendChild(row);
    });
  }

  window.deleteTorneo = async function(id) {
    const confirmed = confirm("¿Deseas eliminar este torneo?");
    if (!confirmed) return;

    const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadTorneos();
    } else {
      alert("No se pudo eliminar el torneo.");
    }
  };

  loadTorneos();
});
