document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('teamForm');

    // Cargar tablas al iniciar
    loadTeam();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = {
            nombre: document.getElementById('teamName').value,
            liga: document.getElementById('teamLeague').value,
        };

        try {
            const response = await fetch('/api/register-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Equipo registrado con éxito.');
                form.reset();
                loadTeam(); // Recargar tabla
            } else {
                alert('Error: ' + (result.message || 'No se pudo registrar el árbitro.'));
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error de red. Inténtalo nuevamente.');
        }
    });

    async function loadTeam() {
        try {
            const response = await fetch('/api/teams');
            const Team = await response.json();

            const tbody = document.querySelector('#TeamTable tbody');
            tbody.innerHTML = '';

            Team.forEach(ref => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ref.nombre}</td>
                    <td>${ref.liga}</td>
                    <td>${new Date(ref.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar Equipos:', error);
        }
    }
});