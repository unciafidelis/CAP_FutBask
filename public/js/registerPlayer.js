document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('playerForm');

    // Cargar tablas al iniciar
    loadPlayer();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = {
            nombre: document.getElementById('playerName').value,
            posicion: document.getElementById('position').value,
            pie: document.getElementById('foot').value,
            numero: document.getElementById('number').value,
        };

        try {
            const response = await fetch('/api/register-player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Jugador registrado con éxito.');
                form.reset();
                loadPlayer(); // Recargar tabla
            } else {
                alert('Error: ' + (result.message || 'No se pudo registrar el árbitro.'));
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error de red. Inténtalo nuevamente.');
        }
    });

    async function loadPlayer() {
        try {
            const response = await fetch('/api/players');
            const Player = await response.json();

            const tbody = document.querySelector('#PlayerTable tbody');
            tbody.innerHTML = '';

            Player.forEach(j => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${j.numero}</td>
                    <td>${j.nombre}</td>
                    <td>${j.posicion}</td>
                    <td>${j.pie}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar jugadores:', error);
        }
    }
});