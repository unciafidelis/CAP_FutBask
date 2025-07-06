document.addEventListener('DOMContentLoaded', () => {
  const formPlayer = document.getElementById('playerForm');
  const teamSelect = document.getElementById('teamSelect');
  const playersContainer = document.getElementById('playersContainer');
  const openModalBtn = document.getElementById('openPlayersModal');
  const closeModalBtn = document.getElementById('closeModal');
  const playerModal = document.getElementById('playerModal');
  const pagination = document.getElementById('pagination');
  const positionColors = {
    GK: 'position-GK',
    D: 'position-D',
    M: 'position-M',
    FW: 'position-FW'
  };

  let currentEditId = null;
  let jugadores = [];
  let currentPage = 1;
  const jugadoresPorPagina = 5;

  loadEquipos();
  loadJugadores() // Para tenerlos listos desde el inicio

  // Eventos modal
  openModalBtn?.addEventListener('click', async () => {
  const modal = document.getElementById('playerModal');
  const container = document.getElementById('playersContainer');

  container.innerHTML = ''; // Limpia contenido anterior
  await loadJugadores();    // Carga los jugadores
  modal.classList.remove('hidden');
});

  closeModalBtn.addEventListener('click', () => {
    playerModal.classList.add('hidden');
  });

  formPlayer.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData();
  formData.append('nombre', document.getElementById('playerName').value);
  formData.append('posicion', document.getElementById('position').value);
  formData.append('pie', document.getElementById('foot').value);
  formData.append('numero', document.getElementById('number').value);
  formData.append('equipo_id', teamSelect.value);

  const fotoInput = document.getElementById('playerPhoto');
  const imageFile = fotoInput.files[0];
  if (imageFile) {
    formData.append('foto', imageFile);
  }

  const url = currentEditId ? `/api/players/${currentEditId}` : '/api/players';
  const method = currentEditId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    body: formData
  });

  if (response.ok) {
    alert(currentEditId ? 'Jugador actualizado' : 'Jugador agregado');
    formPlayer.reset();
    currentEditId = null;
    jugadores = await fetchJugadores();
    renderModalJugadores(currentPage);
  } else {
    const result = await response.json();
    alert('Error: ' + (result.error || 'No se pudo procesar'));
  }
});


  async function loadEquipos() {
  try {
    const response = await fetch('/api/teams');
    if (!response.ok) throw new Error('No se pudo cargar la lista de equipos');

    const equipos = await response.json();

    if (!Array.isArray(equipos)) {
      console.error('⚠️ El backend no devolvió un array de equipos:', equipos);
      return;
    }

    teamSelect.innerHTML = '<option value="">Seleccionar equipo</option>';
    equipos.forEach(equipo => {
      const option = document.createElement('option');
      option.value = equipo.id;
      option.textContent = equipo.nombre;
      teamSelect.appendChild(option);
    });

    console.log('✅ Equipos cargados:', equipos);
  } catch (err) {
    console.error('❌ Error al cargar equipos:', err);
  }
}

  async function fetchJugadores() {
    const response = await fetch('/api/players');
    return await response.json();
  }

 async function loadJugadores(page = 1) {
  const response = await fetch('/api/players');
  const jugadores = await response.json();

  const playersContainer = document.getElementById('playersContainer');
  const pagination = document.getElementById('pagination');

  if (!playersContainer || !pagination) return;

  playersContainer.innerHTML = '';
  pagination.innerHTML = '';

  const pageSize = 5;
  const totalPages = Math.ceil(jugadores.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const currentJugadores = jugadores.slice(startIndex, startIndex + pageSize);

  currentJugadores.forEach(jugador => {
    const fotoJugador = jugador.foto
      ? `${jugador.foto}`
      : '/img/playerImg/avatar.png';

    const fotoEquipo = jugador.foto_equipo
      ? `${jugador.foto_equipo}`
      : '/img/teamImg/avatar.png';

    const tagClass = positionColors[jugador.posicion] || '';

const card = document.createElement('div');
card.className = 'jugador-card';

card.innerHTML = `
  <img src="${fotoJugador}" alt="${jugador.nombre}" class="foto-jugador" />
  <div class="info-nombre">${jugador.nombre}</div>
  <div class="info-posicion ${tagClass}">${jugador.posicion}</div>
  <div class="info-pie">${jugador.pie}</div>
  <div class="info-numero">${jugador.numero}</div>
  <img src="${fotoEquipo}" alt="Equipo" class="foto-equipo-mini" />
   <div class="player-actions">
          <button class="icon-button edit" onclick="editJugador(${jugador.id})">
            <span class="material-icons">edit</span>
          </button>
          <button class="icon-button delete" onclick="deleteJugador(${jugador.id})">
            <span class="material-icons">delete</span>
          </button>
        </div>
`;


    playersContainer.appendChild(card);
  });

  // Paginación
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === page ? 'active' : '';
    btn.addEventListener('click', () => loadJugadores(i));
    pagination.appendChild(btn);
  }
}


  function renderModalJugadores(page) {
    if (!playersContainer) return;

    playersContainer.innerHTML = '';
    const start = (page - 1) * jugadoresPorPagina;
    const end = start + jugadoresPorPagina;
    const jugadoresPagina = jugadores.slice(start, end);

    jugadoresPagina.forEach(j => {
      const tagClass = positionColors[j.posicion] || '';
      const tag = `<span class="position-tag ${tagClass}">${j.posicion}</span>`;
      const fotoJugador = j.foto ? `${j.foto}` : '/img/playerImg/avatar.png';
      console.log(fotoJugador)
      const fotoEquipo = j.foto_equipo ? `${j.foto_equipo}` : '/img/playerImg/avatar.png';
      
      const div = document.createElement('div');
      div.classList.add('modal-player-card');
      div.innerHTML = `
        <div class="player-info">
          <img src="${fotoJugador}" alt="Jugador" class="player-photo" />
          <div class="player-details">
            <strong>${j.nombre}</strong>
            ${tag}
            <p>Número: ${j.numero}</p>
            <p>Pie: ${j.pie}</p>
          </div>
          <img src="${fotoEquipo}" alt="Equipo" class="team-logo" />
        </div>
        <div class="player-actions">
          <button class="icon-button edit" onclick="editJugador(${j.id})">
            <span class="material-icons">edit</span>
          </button>
          <button class="icon-button delete" onclick="deleteJugador(${j.id})">
            <span class="material-icons">delete</span>
          </button>
        </div>
      `;
      playersContainer.appendChild(div);
    });

    renderPagination(jugadores.length, page);
  }

  function renderPagination(total, current) {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(total / jugadoresPorPagina);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === current) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentPage = i;
        renderModalJugadores(currentPage);
      });
      pagination.appendChild(btn);
    }
  }

  window.editJugador = async function (id) {
    try {
      const response = await fetch(`/api/players/${id}`);
      if (!response.ok) throw new Error('Jugador no encontrado');

      const j = await response.json();

      document.getElementById('playerName').value = j.nombre;
      document.getElementById('position').value = j.posicion;
      document.getElementById('foot').value = j.pie;
      document.getElementById('number').value = j.numero;
      teamSelect.value = j.equipo_id;

      currentEditId = id;
      window.scrollTo(0, 0);
    } catch (err) {
      alert('Error al cargar jugador para edición');
      console.error(err);
    }
  };

  window.deleteJugador = async function (id) {
    if (!confirm('¿Eliminar este jugador?')) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    alert('Jugador eliminado');
    jugadores = await fetchJugadores();
    renderModalJugadores(currentPage);
  };
});
