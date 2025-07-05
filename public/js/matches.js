// public/js/matches.js

document.addEventListener('DOMContentLoaded', () => {
  const matchForm = document.getElementById('matchForm');
  const torneoSelect = document.getElementById('torneo');
  const equipoASelect = document.getElementById('equipoA');
  const equipoBSelect = document.getElementById('equipoB');
  const fechaInput = document.getElementById('fecha');
  const horaHour = document.getElementById('horaHour');
  const horaMinute = document.getElementById('horaMinute');
  const horaAmPm = document.getElementById('horaAmPm');

  const openModalBtn = document.getElementById('openModal');
  const matchModal = document.getElementById('matchModal');
  const closeModal = document.getElementById('closeModal');
  const matchesTableBody = document.querySelector('#matchesTable tbody');
  const matchPagination = document.getElementById('matchPagination');

  const itemsPerPage = 5;
  let matches = [];
  let editingMatchId = null;
  let currentPage = 1;

  // === Cargar datos iniciales ===
  loadTorneos();
  loadEquipos();
  loadMatches();
  populateHoras();

  function populateHoras() {
    for (let h = 1; h <= 12; h++) {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h.toString().padStart(2, '0');
      horaHour.appendChild(opt);
    }
    for (let m = 0; m < 60; m += 5) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.toString().padStart(2, '0');
      horaMinute.appendChild(opt);
    }
    ['AM', 'PM'].forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      horaAmPm.appendChild(opt);
    });
  }

  async function loadTorneos() {
    const res = await fetch('/api/tournaments');
    const torneos = await res.json();
    torneos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.nombre;
      torneoSelect.appendChild(opt);
    });
  }

  async function loadEquipos() {
    const res = await fetch('/api/teams');
    const equipos = await res.json();
    [equipoASelect, equipoBSelect].forEach(select => {
      equipos.forEach(eq => {
        const opt = document.createElement('option');
        opt.value = eq.id;
        opt.textContent = eq.nombre;
        select.appendChild(opt.cloneNode(true));
      });
    });
  }

  matchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
      torneo_id: torneoSelect.value,
      equipo_a_id: equipoASelect.value,
      equipo_b_id: equipoBSelect.value,
      fecha: fechaInput.value,
      hora: `${horaHour.value}:${horaMinute.value} ${horaAmPm.value}`
    };

    const url = editingMatchId ? `/api/matches/${editingMatchId}` : '/api/matches';
    const method = editingMatchId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert(editingMatchId ? 'Partido actualizado' : 'Partido creado');
      matchForm.reset();
      editingMatchId = null;
      loadMatches();
      matchModal.classList.add('hidden');
    } else {
      alert('Error al guardar');
    }
  });

  async function loadMatches() {
    const res = await fetch('/api/matches');
    matches = await res.json();
    renderMatches();
  }

  function renderMatches() {
    matchesTableBody.innerHTML = '';
    matchPagination.innerHTML = '';

    const totalPages = Math.ceil(matches.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const currentMatches = matches.slice(start, start + itemsPerPage);

    currentMatches.forEach(match => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${match.torneo_nombre}</td>
        <td>${match.equipo_a_nombre}</td>
        <td>${match.equipo_b_nombre}</td>
        <td>${match.fecha}</td>
        <td>${match.hora}</td>
        <td>
          <button onclick="editMatch(${match.id})">Editar</button>
          <button onclick="deleteMatch(${match.id})">Eliminar</button>
        </td>
      `;
      matchesTableBody.appendChild(tr);
    });

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.onclick = () => {
        currentPage = i;
        renderMatches();
      };
      matchPagination.appendChild(btn);
    }
  }

  window.editMatch = function (id) {
    const match = matches.find(m => m.id === id);
    if (!match) return;

    torneoSelect.value = match.torneo_id;
    equipoASelect.value = match.equipo_a_id;
    equipoBSelect.value = match.equipo_b_id;
    fechaInput.value = match.fecha;

    const [hora, minuto] = match.hora.split(':');
    const [min, ampm] = minuto.split(' ');
    horaHour.value = parseInt(hora);
    horaMinute.value = parseInt(min);
    horaAmPm.value = ampm;

    editingMatchId = id;
    matchModal.classList.remove('hidden');
  };

  window.deleteMatch = async function (id) {
    if (!confirm('¿Eliminar este partido?')) return;
    const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Partido eliminado');
      loadMatches();
    } else {
      alert('Error al eliminar');
    }
  };

  openModalBtn.addEventListener('click', () => {
    matchModal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => {
    matchModal.classList.add('hidden');
  });
});
