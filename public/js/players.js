document.addEventListener('DOMContentLoaded', () => {
  const formPlayer = document.getElementById('playerForm');
  const teamSelect = document.getElementById('teamSelect');
  const positionColors = {
    GK: 'position-GK',
    D: 'position-D',
    M: 'position-M',
    FW: 'position-FW'
  };
  let currentEditId = null;

  loadEquipos();
  loadJugadores();

  formPlayer.addEventListener('submit', async (event) => {
    event.preventDefault();

    const jugador = {
      nombre: document.getElementById('playerName').value,
      posicion: document.getElementById('position').value,
      pie: document.getElementById('foot').value,
      numero: parseInt(document.getElementById('number').value),
      equipo_id: parseInt(teamSelect.value)
    };

    const url = currentEditId ? `/api/players/${currentEditId}` : '/api/players';
    const method = currentEditId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jugador)
    });

    if (response.ok) {
      alert(currentEditId ? 'Jugador actualizado' : 'Jugador agregado');
      formPlayer.reset();
      currentEditId = null;
      loadJugadores();
    } else {
      const result = await response.json();
      alert('Error: ' + (result.message || 'No se pudo procesar'));
    }
  });

  async function loadEquipos() {
    try {
      const response = await fetch('/api/teams');
      const equipos = await response.json();

      if (!teamSelect) return;

      teamSelect.innerHTML = '<option value="">Seleccionar equipo</option>';
      equipos.forEach(equipo => {
        const option = document.createElement('option');
        option.value = equipo.id;
        option.textContent = equipo.nombre;
        teamSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error al cargar equipos:', err);
    }
  }

  async function loadJugadores() {
    const response = await fetch('/api/players');
    const jugadores = await response.json();
    const tbody = document.querySelector('#PlayerTable tbody');
    tbody.innerHTML = '';

    jugadores.forEach(j => {
      const tagClass = positionColors[j.posicion] || '';
      const tag = `<span class="position-tag ${tagClass}">${j.posicion}</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${j.numero}</td>
        <td>${j.nombre}</td>
        <td>${tag}</td>
        <td>${j.pie}</td>
        <td>${j.equipo_nombre || '—'}</td>
        <td>
          <button class="icon-button edit" onclick="editJugador(${j.id})">
            <span class="material-icons">edit</span>
          </button>
          <button class="icon-button delete" onclick="deleteJugador(${j.id})">
            <span class="material-icons">delete</span>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
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
    } catch (err) {
      alert('Error al cargar jugador para edición');
      console.error(err);
    }
  };

  window.deleteJugador = async function (id) {
    if (!confirm('¿Eliminar este jugador?')) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    alert('Jugador eliminado');
    loadJugadores();
  };
});
