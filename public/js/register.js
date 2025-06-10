document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');

    // Cargar la tabla al iniciar
    loadReferees();

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
            tbody.innerHTML = ''; // Limpiar tabla

            referees.forEach(referee => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>${referee.nombre}</td>
                    <td>${referee.celular}</td>
                    <td>${referee.email}</td>
                    <td>${referee.alias}</td>
                    <td>${new Date(referee.created_at).toLocaleString()}</td>
                `;

                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error al cargar árbitros:', error);
        }
    }
});
