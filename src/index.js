const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API para registrar árbitro
app.post('/api/register-referee', (req, res) => {
    const { nombre, celular, email, alias, password } = req.body;

    if (!nombre || !celular || !email || !alias || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const referee = {
        id: Date.now(),
        nombre,
        celular,
        email,
        alias,
        password,  // NOTA: más adelante podemos hacer hashing
        created_at: new Date().toISOString()
    };

    const dbPath = path.join(__dirname, '../db/referees.json');
    let referees = [];

    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            referees = JSON.parse(data);
        }

        // Evitar emails o alias duplicados
        const duplicate = referees.find(r => r.email === email || r.alias === alias);
        if (duplicate) {
            return res.status(409).json({ message: 'El correo electrónico o alias ya existe.' });
        }

        referees.push(referee);

        fs.writeFileSync(dbPath, JSON.stringify(referees, null, 2));

        res.status(201).json({ message: 'Árbitro registrado con éxito.' });
    } catch (error) {
        console.error('Error al guardar árbitro:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Iniciar server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// API para obtener lista de árbitros
app.get('/api/referees', (req, res) => {
    const dbPath = path.join(__dirname, '../db/referees.json');

    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            const referees = JSON.parse(data);
            res.json(referees);
        } else {
            res.json([]); // Si no existe aún el archivo, devuelve array vacío
        }
    } catch (error) {
        console.error('Error al leer árbitros:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

