document.addEventListener('DOMContentLoaded', () => {
    const formTeam = document.getElementById('teamForm');
    const submitTeamHandler = submitNewTeam;

    loadEquipos();
    formTeam.addEventListener('submit', submitTeamHandler);

    async function submitNewTeam(event) {
        event.preventDefault();
        const formTeamData = {
            nombre: document.getElementById('teamName').value,
            liga: document.getElementById('teamLeague').value
        };

        const response = await fetch('/api/register-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formTeamData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Equipo registrado.');
            formTeam.reset();
            loadEquipos();
        } else {
            alert('Error al registrar equipo: ' + (result.message || ''));
        }
    }

    async function loadEquipos() {
        const response = await fetch('/api/teams');
        const equipos = await response.json();
        const tbody = document.querySelector('#TeamTable tbody');
        tbody.innerHTML = '';

        equipos.forEach(eq => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${eq.nombre}</td>
                <td>${eq.liga}</td>
                <td>${new Date(eq.created_at).toLocaleString()}</td>
                <td class="actions-cell">
                    <button class="icon-button edit" onclick="editEquipo('${eq.id}')">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="icon-button delete" onclick="deleteEquipo('${eq.id}')">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.editEquipo = async function (id) {
        const response = await fetch(`/api/teams/${id}`);
        const eq = await response.json();

        document.getElementById('teamName').value = eq.nombre;
        document.getElementById('teamLeague').value = eq.liga;

        formTeam.removeEventListener('submit', submitTeamHandler);
        formTeam.addEventListener('submit', async function updateHandler(e) {
            e.preventDefault();
            const updated = {
                nombre: document.getElementById('teamName').value,
                liga: document.getElementById('teamLeague').value
            };

            await fetch(`/api/teams/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });

            alert('Equipo actualizado');
            formTeam.reset();
            loadEquipos();

            formTeam.removeEventListener('submit', updateHandler);
            formTeam.addEventListener('submit', submitTeamHandler);
        });
    };

    window.deleteEquipo = async function (id) {
        if (!confirm('¿Eliminar este equipo?')) return;
        await fetch(`/api/teams/${id}`, { method: 'DELETE' });
        alert('Equipo eliminado');
        loadEquipos();
    };
});
