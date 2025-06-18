document.addEventListener('DOMContentLoaded', () => {
    const formPlayer = document.getElementById('playerForm');
    const submitPlayerHandler = submitNewPlayer;

    loadJugadores();
    formPlayer.addEventListener('submit', submitPlayerHandler);

    async function submitNewPlayer(event) {
        event.preventDefault();

        const formPlayerData = {
            nombre: document.getElementById('playerName').value,
            posicion: document.getElementById('position').value,
            pie: document.getElementById('foot').value,
            numero: document.getElementById('number').value
        };

        const response = await fetch('/api/register-player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formPlayerData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Jugador registrado.');
            formPlayer.reset();
            loadJugadores();
        } else {
            alert('Error al registrar jugador: ' + (result.message || ''));
        }
    }

    async function loadJugadores() {
        const response = await fetch('/api/players');
        const jugadores = await response.json();
        const tbody = document.querySelector('#PlayerTable tbody');
        tbody.innerHTML = '';

        jugadores.forEach(j => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${j.numero}</td>
                <td>${j.nombre}</td>
                <td>${j.posicion}</td>
                <td>${j.pie}</td>
                <td class="actions-cell">
                    <button class="icon-button edit" onclick="editJugador('${j.id}')">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="icon-button delete" onclick="deleteJugador('${j.id}')">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.editJugador = async function (id) {
        const response = await fetch(`/api/players/${id}`);
        const j = await response.json();

        document.getElementById('playerName').value = j.nombre;
        document.getElementById('position').value = j.posicion;
        document.getElementById('foot').value = j.pie;
        document.getElementById('number').value = j.numero;

        formPlayer.removeEventListener('submit', submitPlayerHandler);
        formPlayer.addEventListener('submit', async function updateHandler(e) {
            e.preventDefault();

            const updated = {
                nombre: document.getElementById('playerName').value,
                posicion: document.getElementById('position').value,
                pie: document.getElementById('foot').value,
                numero: document.getElementById('number').value
            };

            await fetch(`/api/players/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });

            alert('Jugador actualizado');
            formPlayer.reset();
            loadJugadores();

            formPlayer.removeEventListener('submit', updateHandler);
            formPlayer.addEventListener('submit', submitPlayerHandler);
        });
    };

    window.deleteJugador = async function (id) {
        if (!confirm('¿Eliminar este jugador?')) return;
        await fetch(`/api/players/${id}`, { method: 'DELETE' });
        alert('Jugador eliminado');
        loadJugadores();
    };
});
