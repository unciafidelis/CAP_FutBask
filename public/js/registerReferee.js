document.addEventListener('DOMContentLoaded', () => {
  const form            = document.getElementById('registerForm');
  const submitBtn       = document.getElementById('submitBtn');
  const cancelEditBtn   = document.getElementById('cancelEditBtn');
  const showModalBtn    = document.getElementById('showRefereesBtn');
  const modal           = document.getElementById('refereesModal');
  const closeModalBtn   = document.getElementById('closeRefereesModal');
  let editId = null;

  // 1) Abrir / cerrar modal
  showModalBtn.onclick = () => {
    loadReferees();
    modal.classList.remove('hidden');
  };
  closeModalBtn.onclick = () => modal.classList.add('hidden');

  // 2) Cancelar edición
  cancelEditBtn.onclick = () => resetForm();

  // 3) Envío del formulario
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const pw  = form.password.value;
    const pw2 = form.confirm_password.value;
    if (pw !== pw2) {
      return alert('Las contraseñas no coinciden.');
    }

    const payload = {
      nombre:   form.nombre.value,
      celular:  form.celular.value,
      email:    form.email.value,
      alias:    form.alias.value,
      password: pw
    };

    const url    = editId ? `/api/referees/${editId}` : '/api/referees';
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error en servidor');
      alert(editId ? 'Árbitro actualizado.' : 'Árbitro registrado.');
      resetForm();
      loadReferees();
      modal.classList.remove('hidden'); // volver a lista
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  });

  // 4) Cargar y renderizar árbitros
  async function loadReferees() {
    try {
      const res = await fetch('/api/referees');
      const refs = await res.json();
      const tbody = document.querySelector('#refereesTable tbody');
      tbody.innerHTML = '';
      refs.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.nombre}</td>
          <td>${r.celular}</td>
          <td>${r.email}</td>
          <td>${r.alias}</td>
          <td>${new Date(r.created_at).toLocaleString()}</td>
          <td>
            <button class="icon-button edit" data-id="${r.id}">
              <span class="material-icons">edit</span>
            </button>
            <button class="icon-button delete" data-id="${r.id}">
              <span class="material-icons">delete</span>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Delegación de eventos en la tabla
      tbody.onclick = async e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.classList.contains('edit')) {
          return startEditReferee(id);
        }
        if (btn.classList.contains('delete')) {
          return deleteReferee(id);
        }
      };
    } catch (err) {
      console.error('Error cargando árbitros:', err);
    }
  }

  // 5) Iniciar edición
  async function startEditReferee(id) {
    try {
      const res = await fetch(`/api/referees/${id}`);
      if (!res.ok) throw new Error('No encontrado');
      const r = await res.json();
      form.nombre.value   = r.nombre;
      form.celular.value  = r.celular;
      form.email.value    = r.email;
      form.alias.value    = r.alias;
      form.password.value = '';
      form.confirm_password.value = '';
      editId = id;
      submitBtn.textContent     = 'Actualizar Árbitro';
      cancelEditBtn.classList.remove('hidden');
      modal.classList.add('hidden'); // cerrar lista mientras editas
    } catch (err) {
      console.error(err);
      alert('No se pudo cargar datos para edición.');
    }
  }

  // 6) Eliminar
  async function deleteReferee(id) {
    if (!confirm('¿Eliminar este árbitro?')) return;
    try {
      const res = await fetch(`/api/referees/${id}`, { method:'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      alert('Árbitro eliminado.');
      loadReferees();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar.');
    }
  }

  // 7) Resetear formulario a “nuevo registro”
  function resetForm() {
    form.reset();
    editId = null;
    submitBtn.textContent = 'Registrar Árbitro';
    cancelEditBtn.classList.add('hidden');
    modal.classList.remove('hidden');
  }
});
