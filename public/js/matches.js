// js/matches.js

document.addEventListener('DOMContentLoaded', () => {
  // ————————————— Elementos DOM —————————————
  const matchForm        = document.getElementById('matchForm');
  const torneoSelect     = document.getElementById('torneo');
  const equipoASelect    = document.getElementById('equipoA');
  const equipoBSelect    = document.getElementById('equipoB');
  const fechaInput       = document.getElementById('fecha');
  const horaHour         = document.getElementById('horaHour');
  const horaMinute       = document.getElementById('horaMinute');
  const horaAmPm         = document.getElementById('horaAmPm');

  const openModalBtn     = document.getElementById('openModal');
  const matchModal       = document.getElementById('matchModal');
  const closeModalBtn    = document.getElementById('closeModal');
  const matchesTableBody = document.querySelector('#matchesTable tbody');
  const matchPagination  = document.getElementById('matchPagination');

  // ————————————— Estado —————————————
  let torneos = [];
  let equiposDisponibles = [];
  let matches = [];
  let editingMatchId = null;
  const itemsPerPage = 5;
  let currentPage = 1;

  // ————————————— Inicialización —————————————
  populateHoras();
  loadTorneos();
  loadEquipos();
  loadMatches();

  // ————————————— Rellena selects de hora —————————————
  function populateHoras() {
    for (let h = 1; h <= 12; h++) {
      horaHour.innerHTML += `<option value="${h}">${h.toString().padStart(2,'0')}</option>`;
    }
    for (let m = 0; m < 60; m += 5) {
      horaMinute.innerHTML += `<option value="${m}">${m.toString().padStart(2,'0')}</option>`;
    }
    ['AM','PM'].forEach(p => {
      horaAmPm.innerHTML += `<option value="${p}">${p}</option>`;
    });
  }

  // ————————————— Carga torneos —————————————
  async function loadTorneos() {
    const res = await fetch('/api/tournaments');
    torneos = await res.json();
    torneoSelect.innerHTML = `<option value="">Selecciona Torneo</option>`;
    torneos.forEach(t => {
      torneoSelect.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });
  }

  // ————————————— Carga equipos —————————————
  async function loadEquipos() {
    const res = await fetch('/api/teams');
    equiposDisponibles = await res.json();
    equipoASelect.innerHTML = `<option value="">Selecciona Equipo A</option>`;
    equiposDisponibles.forEach(eq => {
      equipoASelect.innerHTML += `<option value="${eq.id}">${eq.nombre}</option>`;
    });
    updateEquipoBOptions();
  }

  // ————————————— Filtra Equipo B según A —————————————
  equipoASelect.addEventListener('change', updateEquipoBOptions);
  function updateEquipoBOptions() {
    const selA = equipoASelect.value;
    equipoBSelect.innerHTML = `<option value="">Selecciona Equipo B</option>`;
    equiposDisponibles
      .filter(eq => eq.id.toString() !== selA)
      .forEach(eq => {
        equipoBSelect.innerHTML += `<option value="${eq.id}">${eq.nombre}</option>`;
      });
  }

  // ————————————— Carga partidos —————————————
  async function loadMatches() {
    const res = await fetch('/api/matches');
    matches = await res.json();
    renderMatches();
  }

  // ————————————— Renderiza tabla y paginación —————————————
  function renderMatches() {
    matchesTableBody.innerHTML = '';
    matchPagination.innerHTML = '';

    const valid = matches.filter(m =>
      m.torneo_id && m.equipoA_id && m.equipoB_id && m.fecha && m.hora
    );
    const totalPages = Math.ceil(valid.length / itemsPerPage);
    const start = (currentPage-1)*itemsPerPage;
    const pageMatches = valid.slice(start, start+itemsPerPage);

    pageMatches.forEach(m => {
      const torneo = torneos.find(t => t.id === m.torneo_id)?.nombre || '—';
      const equipoA = equiposDisponibles.find(e => e.id === m.equipoA_id)?.nombre || '—';
      const equipoB = equiposDisponibles.find(e => e.id === m.equipoB_id)?.nombre || '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${torneo}</td>
        <td>${equipoA}</td>
        <td>${equipoB}</td>
        <td>${m.fecha}</td>
        <td>${m.hora}</td>
        <td>
          <button class="edit-btn" data-id="${m.id}">Editar</button>
          <button class="delete-btn" data-id="${m.id}">Eliminar</button>
        </td>`;
      matchesTableBody.appendChild(tr);
    });

    // paginación
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentPage = i;
        renderMatches();
      });
      matchPagination.appendChild(btn);
    }

    // listeners de editar/eliminar
    document.querySelectorAll('.edit-btn').forEach(b => {
      b.addEventListener('click', () => openEditForm(b.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(b => {
      b.addEventListener('click', () => deleteMatch(b.dataset.id));
    });
  }

  // ————————————— Abre modal lista —————————————
  openModalBtn.addEventListener('click', () => {
    matchModal.classList.remove('hidden');
  });
  closeModalBtn.addEventListener('click', () => {
    matchModal.classList.add('hidden');
  });

  // ————————————— Crear/Editar formulario —————————————
  matchForm.addEventListener('submit', async e => {
    e.preventDefault();
    const torneo_id = torneoSelect.value;
    const equipoA   = equipoASelect.value;
    const equipoB   = equipoBSelect.value;
    const fecha     = fechaInput.value;
    const hora      = `${horaHour.value}:${horaMinute.value} ${horaAmPm.value}`;

    if (!torneo_id||!equipoA||!equipoB||!fecha||!hora) {
      return alert('Todos los campos son requeridos');
    }

    const payload = { torneo_id, equipoA, equipoB, fecha, hora };

    try {
      let res, msg;
      if (editingMatchId) {
        // EDITAR
        res = await fetch(`/api/matches/${editingMatchId}`, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        msg = 'Partido actualizado';
      } else {
        // CREAR
        res = await fetch('/api/matches', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        msg = 'Partido creado';
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.message||'Error');

      alert(msg);
      editingMatchId = null;
      matchForm.reset();
      updateEquipoBOptions();
      loadMatches();
      matchModal.classList.add('hidden');
    } catch (err) {
      console.error(err);
      alert('Error al guardar partido');
    }
  });

  // ————————————— Abre formulario para editar —————————————
  async function openEditForm(id) {
    try {
      const res = await fetch(`/api/matches/${id}`);
      const m   = await res.json();
      if (!res.ok) throw new Error();

      // rellenar form
      torneoSelect.value   = m.torneo_id;
      equipoASelect.value  = m.equipoA_id;
      updateEquipoBOptions();
      equipoBSelect.value  = m.equipoB_id;
      fechaInput.value     = m.fecha;

      // hora
      let [h, rest] = m.hora.split(':');
      let [mn, ap]  = rest.split(' ');
      horaHour.value   = parseInt(h);
      horaMinute.value = parseInt(mn);
      horaAmPm.value   = ap;

      editingMatchId = id;
      matchModal.classList.add('hidden');
      window.scrollTo({ top:0, behavior:'smooth' });
    } catch {
      alert('No se pudo cargar el partido');
    }
  }

  // ————————————— Eliminar partido —————————————
  async function deleteMatch(id) {
    if (!confirm('¿Eliminar este partido?')) return;
    try {
      const res = await fetch(`/api/matches/${id}`, { method:'DELETE' });
      if (!res.ok) throw new Error();
      alert('Partido eliminado');
      loadMatches();
    } catch {
      alert('Error al eliminar partido');
    }
  }
});
