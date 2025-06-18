const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// === Archivos JSON ===
const refereeFile = path.join(__dirname, 'data', '../db/referees.json');
const teamsFile = path.join(__dirname, 'data', '../db/teams.json');
const playersFile = path.join(__dirname, 'data', '../db/players.json');
const tournamentsFile = path.join(__dirname, 'data', '../db/tournaments.json');


// === Funciones Utilitarias ===
function readJSON(file) {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file);
    return JSON.parse(data);
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getNextId(items) {
    if (items.length === 0) return 1;
    return Math.max(...items.map(item => item.id)) + 1;
}

// === REFEREES ===
app.get('/api/referees', (req, res) => {
    res.json(readJSON(refereeFile));
});

app.post('/api/register-referee', (req, res) => {
    const referees = readJSON(refereeFile);
    const newReferee = {
        id: getNextId(referees),
        ...req.body,
        created_at: new Date()
    };
    referees.push(newReferee);
    writeJSON(refereeFile, referees);
    res.status(201).json(newReferee);
});

app.get('/api/referees/:id', (req, res) => {
    const referees = readJSON(refereeFile);
    const referee = referees.find(r => r.id == req.params.id);
    if (referee) {
        res.json(referee);
    } else {
        res.status(404).json({ error: 'No encontrado' });
    }
});

app.put('/api/referees/:id', (req, res) => {
    let referees = readJSON(refereeFile);
    let updated = false;
    referees = referees.map(r => {
        if (r.id == req.params.id) {
            updated = true;
            return { ...r, ...req.body };
        }
        return r;
    });
    writeJSON(refereeFile, referees);
    updated
        ? res.status(200).json({ message: 'Árbitro actualizado' })
        : res.status(404).json({ error: 'No encontrado' });
});

app.delete('/api/referees/:id', (req, res) => {
    const referees = readJSON(refereeFile);
    const filtered = referees.filter(r => r.id != req.params.id);
    if (filtered.length === referees.length) {
        return res.status(404).json({ error: 'No encontrado' });
    }
    writeJSON(refereeFile, filtered);
    res.status(200).json({ message: 'Árbitro eliminado' });
});


// === TEAMS ===
app.get('/api/teams', (req, res) => {
    res.json(readJSON(teamsFile));
});

app.post('/api/register-team', (req, res) => {
    const teams = readJSON(teamsFile);
    const newTeam = {
        id: getNextId(teams),
        ...req.body,
        created_at: new Date()
    };
    teams.push(newTeam);
    writeJSON(teamsFile, teams);
    res.status(201).json(newTeam);
});

app.get('/api/teams/:id', (req, res) => {
    const teams = readJSON(teamsFile);
    const team = teams.find(t => t.id == req.params.id);
    team
        ? res.json(team)
        : res.status(404).json({ error: 'Equipo no encontrado' });
});

app.put('/api/teams/:id', (req, res) => {
    let teams = readJSON(teamsFile);
    let updated = false;
    teams = teams.map(t => {
        if (t.id == req.params.id) {
            updated = true;
            return { ...t, ...req.body };
        }
        return t;
    });
    writeJSON(teamsFile, teams);
    updated
        ? res.status(200).json({ message: 'Equipo actualizado' })
        : res.status(404).json({ error: 'Equipo no encontrado' });
});

app.delete('/api/teams/:id', (req, res) => {
    const teams = readJSON(teamsFile);
    const filtered = teams.filter(t => t.id != req.params.id);
    if (filtered.length === teams.length) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    writeJSON(teamsFile, filtered);
    res.status(200).json({ message: 'Equipo eliminado' });
});

// === PLAYERS ===
app.get('/api/players', (req, res) => {
    res.json(readJSON(playersFile));
});

app.post('/api/register-player', (req, res) => {
    const players = readJSON(playersFile);
    const newPlayer = {
        id: getNextId(players),
        ...req.body,
        created_at: new Date()
    };
    players.push(newPlayer);
    writeJSON(playersFile, players);
    res.status(201).json(newPlayer);
});

app.get('/api/players/:id', (req, res) => {
    const players = readJSON(playersFile);
    const player = players.find(p => p.id == req.params.id);
    player
        ? res.json(player)
        : res.status(404).json({ error: 'Jugador no encontrado' });
});

app.put('/api/players/:id', (req, res) => {
    let players = readJSON(playersFile);
    let updated = false;
    players = players.map(p => {
        if (p.id == req.params.id) {
            updated = true;
            return { ...p, ...req.body };
        }
        return p;
    });
    writeJSON(playersFile, players);
    updated
        ? res.status(200).json({ message: 'Jugador actualizado' })
        : res.status(404).json({ error: 'Jugador no encontrado' });
});

app.delete('/api/players/:id', (req, res) => {
    const players = readJSON(playersFile);
    const filtered = players.filter(p => p.id != req.params.id);
    if (filtered.length === players.length) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    writeJSON(playersFile, filtered);
    res.status(200).json({ message: 'Jugador eliminado' });
});

// === TORNEOS ===
app.get('/api/tournaments', (req, res) => {
    res.json(readJSON(tournamentsFile));
});

app.post('/api/register-tournament', (req, res) => {
    const torneos = readJSON(tournamentsFile);
    const newTorneo = {
        id: getNextId(torneos),
        ...req.body,
        created_at: new Date()
    };
    torneos.push(newTorneo);
    writeJSON(tournamentsFile, torneos);
    res.status(201).json(newTorneo);
});

app.delete('/api/tournaments/:id', (req, res) => {
    const torneos = readJSON(tournamentsFile);
    const filtered = torneos.filter(t => t.id != req.params.id);
    if (filtered.length === torneos.length) {
        return res.status(404).json({ error: 'Torneo no encontrado' });
    }
    writeJSON(tournamentsFile, filtered);
    res.status(200).json({ message: 'Torneo eliminado' });
});




// === SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
