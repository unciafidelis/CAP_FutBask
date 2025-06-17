document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const formPlayer = document.getElementById('playerForm');
    const formTeam = document.getElementById('teamForm');

    // Cargar tablas al iniciar
    loadReferees();
    loadEquipos();
    loadJugadores();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const formData = {
            nombre: document.getElementById('nombre').value,
            celular: document.getElementById('celular').value,
            email: document.getElementById('email').value,
            alias: document.getElementById('alias').value,
            password: password
        };

        try {
            const response = await fetch('/api/register-referee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Árbitro registrado con éxito.');
                form.reset();
                loadReferees(); // Recargar tabla
            } else {
                alert('Error: ' + (result.message || 'No se pudo registrar el árbitro.'));
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error de red. Inténtalo nuevamente.');
        }
    });

    async function loadReferees() {
        try {
            const response = await fetch('/api/referees');
            const referees = await response.json();

            const tbody = document.querySelector('#refereesTable tbody');
            tbody.innerHTML = '';

            referees.forEach(ref => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ref.nombre}</td>
                    <td>${ref.celular}</td>
                    <td>${ref.email}</td>
                    <td>${ref.alias}</td>
                    <td>${new Date(ref.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar árbitros:', error);
        }
    }

//form equipos
formTeam.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formTeamData = {
            nombre: document.getElementById('teamName').value,
            liga: document.getElementById('teamLeague').value,
        };

        try {
            const response = await fetch('/api/register-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formTeamData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Árbitro registrado con éxito.');
                formTeam.reset();
                loadEquipos(); // Recargar tabla
            } else {
                alert('Error: ' + (result.message || 'No se pudo registrar el árbitro.'));
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error de red. Inténtalo nuevamente.');
        }
    });

    async function loadEquipos() {
        try {
            const response = await fetch('/api/teams');
            const equipos = await response.json();

            const tbody = document.querySelector('#equiposTable tbody');
            tbody.innerHTML = '';

            equipos.forEach(eq => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${eq.nombre}</td>
                    <td>${eq.liga}</td>
                    <td>${new Date(eq.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar equipos:', error);
        }
    }

//Form jugadores

formPlayer.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formPlayerData = {
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
                body: JSON.stringify(formPlayerData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Jugador registrado con éxito.');
                formPlayer.reset();
                loadJugadores(); // Recargar tabla
            } else {
                alert('Error: ' + (result.message || 'No se pudo registrar el árbitro.'));
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error de red. Inténtalo nuevamente.');
        }
    });

    async function loadJugadores() {
        try {
            const response = await fetch('/api/players');
            const jugadores = await response.json();

            const tbody = document.querySelector('#jugadoresTable tbody');
            tbody.innerHTML = '';

            jugadores.forEach(j => {
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
