document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('teamForm');
  const nameInput = document.getElementById('teamName');
  const divisionSelect = document.getElementById('division');
  const sportSelect = document.getElementById('sport');
  const fileInput = document.getElementById('teamPhoto');

  const viewTeamsBtn = document.getElementById('viewTeamsBtn');
  const teamsModal = document.getElementById('teamsModal');
  const closeTeamsModal = document.getElementById('closeTeamsModal');
  const teamsListContainer = document.getElementById('teamsListContainer');
  const teamsList = document.getElementById('teamsList');
  const equipoPagination = document.getElementById('teamPagination');

  let equipos = [];
  let editingId = null;
  let currentEquipoPage = 1;
  const itemsPerPage = 4;

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
      teamsModal.classList.add('hidden');
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

        const badge = document.createElement('span');
        badge.className = 'performance-badge ' + getPerformanceClass(eq.promedio || 0);
        badge.textContent = `${Math.round(eq.promedio || 0)}%`;

        const btns = document.createElement('div');
        btns.className = 'team-actions';
        btns.innerHTML = `
          <button onclick="editEquipo(${eq.id})">Editar</button>
          <button onclick="deleteEquipo(${eq.id})">Eliminar</button>
        `;

       

        div.appendChild(position);
        div.appendChild(img);
        div.appendChild(name);
        div.appendChild(pos);
         div.appendChild(badge);
        div.appendChild(btns);

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
    teamsModal.classList.add('hidden');
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

  viewTeamsBtn.addEventListener('click', () => {
    teamsModal.classList.remove('hidden');
  });

  closeTeamsModal.addEventListener('click', () => {
    teamsModal.classList.add('hidden');
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
