const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('../db/db');

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

//equipo JSON

// API para registrar equipo
app.post('/api/register-team', (req, res) => {
    const { nombre, liga } = req.body;

    if (!nombre || !liga) {
        return res.status(400).json({ message: 'Nombre y liga son obligatorios.' });
    }

    const equipo = {
        id: Date.now(),
        nombre,
        liga,
        created_at: new Date().toISOString()
    };

    const dbPath = path.join(__dirname, '../db/teams.json');
    let equipos = [];

    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            equipos = JSON.parse(data);
        }

        const duplicate = equipos.find(e => e.nombre.toLowerCase() === nombre.toLowerCase());
        if (duplicate) {
            return res.status(409).json({ message: 'El nombre del equipo ya existe.' });
        }

        equipos.push(equipo);
        fs.writeFileSync(dbPath, JSON.stringify(equipos, null, 2));

        res.status(201).json({ message: 'Equipo registrado con éxito.' });
    } catch (error) {
        console.error('Error al guardar equipo:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// API para obtener lista de equipos
app.get('/api/teams', (req, res) => {
    const dbPath = path.join(__dirname, '../db/teams.json');

    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            const equipos = JSON.parse(data);
            res.json(equipos);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error al leer equipos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

//jugador JSON

// API para registrar jugador
app.post('/api/register-player', (req, res) => {
    const { nombre, posicion, pie, numero } = req.body;

    if (!nombre || !posicion || !pie || !numero) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const jugador = {
        nombre,
        posicion,
        pie,
        numero,
    };

    const playerPath = path.join(__dirname, '../db/players.json');
    let jugadores = [];

    try {
        if (fs.existsSync(playerPath)) {
            const data = fs.readFileSync(playerPath, 'utf8');
            jugadores = JSON.parse(data);
        }

        jugadores.push(jugador);
        fs.writeFileSync(playerPath, JSON.stringify(jugadores, null, 2));

        res.status(201).json({ message: 'Jugador registrado con éxito.' });
    } catch (error) {
        console.error('Error al guardar jugador:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// API para obtener lista de jugadores

app.get('/api/players', (req, res) => {
    const playerPath = path.join(__dirname, '../db/players.json');

    try {
        if (fs.existsSync(playerPath)) {
            const data = fs.readFileSync(playerPath, 'utf8');
            const players = JSON.parse(data);
            res.json(players);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error al leer equipos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
