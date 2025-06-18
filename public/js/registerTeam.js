document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('teamForm');
    const nameInput = document.getElementById('teamName');
    const divisionSelect = document.getElementById('division');
    const sportSelect = document.getElementById('sport');
    const tableBody = document.querySelector('#TeamTable tbody');

    let editingId = null;

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

    // Cambiar opciones de división según el deporte
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

    loadEquipos();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const equipo = {
            nombre: nameInput.value,
            division: divisionSelect.value,
            deporte: sportSelect.value
        };

        const url = editingId ? `/api/teams/${editingId}` : '/api/register-team';
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
        });
    }

    window.editEquipo = async function(id) {
        const response = await fetch(`/api/teams/${id}`);
        const equipo = await response.json();

        nameInput.value = equipo.nombre;
        sportSelect.value = equipo.deporte;

        // Disparar el cambio para cargar divisiones correspondientes
        sportSelect.dispatchEvent(new Event('change'));

        divisionSelect.value = equipo.division;
        editingId = equipo.id;
    };

    window.deleteEquipo = async function(id) {
        if (!confirm('¿Eliminar este equipo?')) return;
        await fetch(`/api/teams/${id}`, { method: 'DELETE' });
        alert('Equipo eliminado');
        loadEquipos();
    };
});
