document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    let editId = null;

    // Cargar árbitros al iniciar
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

        const url = editId ? `/api/referees/${editId}` : '/api/register-referee';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert(editId ? 'Árbitro actualizado con éxito.' : 'Árbitro registrado con éxito.');
                form.reset();
                editId = null;
                loadReferees();
            } else {
                alert('Error: ' + (result.message || 'No se pudo procesar la solicitud.'));
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
                    <td class="actions-cell">
                        <button class="icon-button edit" onclick="editReferee('${ref.id}')">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="icon-button delete" onclick="deleteReferee('${ref.id}')">
                            <span class="material-icons">delete</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar árbitros:', error);
        }
    }

    // Función global para editar
    window.editReferee = async (id) => {
        try {
            const response = await fetch(`/api/referees/${id}`);
            const ref = await response.json();

            document.getElementById('nombre').value = ref.nombre;
            document.getElementById('celular').value = ref.celular;
            document.getElementById('email').value = ref.email;
            document.getElementById('alias').value = ref.alias;
            document.getElementById('password').value = '';
            document.getElementById('confirm_password').value = '';

            editId = ref.id;
        } catch (error) {
            console.error('Error al cargar árbitro:', error);
            alert('No se pudo cargar el árbitro para edición.');
        }
    };

    // Función global para eliminar
    window.deleteReferee = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este árbitro?')) return;

        try {
            const response = await fetch(`/api/referees/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Árbitro eliminado correctamente.');
                loadReferees();
            } else {
                const result = await response.json();
                alert('Error al eliminar: ' + (result.message || 'No se pudo eliminar.'));
            }
        } catch (error) {
            console.error('Error al eliminar árbitro:', error);
            alert('Error de red al intentar eliminar.');
        }
    };
});
