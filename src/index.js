// === DEPENDENCIAS ===
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const db = require('./db/db');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

// === SESIONES ===
app.use(session({
  secret: 'cap-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// === RUTAS DE ARCHIVOS ESTÁTICOS (solo extensiones permitidas) ===
app.use((req, res, next) => {
  const isStatic = /\.(css|js|png|jpg|jpeg|svg|ico)$/.test(req.url);
  if (isStatic) {
    express.static(path.join(__dirname, '../public'))(req, res, next);
  } else {
    next();
  }
});

// === JSON PATHS ===
const paths = {
  referees: path.join(__dirname, 'db', 'referees.json'),
  teams: path.join(__dirname, 'db', 'teams.json'),
  players: path.join(__dirname, 'db', 'players.json'),
  tournaments: path.join(__dirname, 'db', 'tournaments.json'),
  matches: path.join(__dirname, 'db', 'matches.json')
};

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// === REGISTRO INICIAL DE REFEREES EN BD ===
const refereesData = readJSON(paths.referees);
const existing = db.prepare('SELECT COUNT(*) AS total FROM referees').get().total;

if (existing === 0) {
  const insert = db.prepare(`
    INSERT INTO referees (nombre, celular, email, alias, password)
    VALUES (?, ?, ?, ?, ?)
  `);

  refereesData.forEach(ref => {
    const hash = bcrypt.hashSync(ref.password, 10);
    insert.run(ref.nombre, ref.celular, ref.email, ref.alias, hash);
  });

  console.log('✅ Árbitros registrados correctamente en la base de datos.');
} else {
  console.log('ℹ️ Árbitros ya registrados.');
}

// === LOGIN ===
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const stmt = db.prepare("SELECT * FROM referees WHERE alias = ? OR email = ?");
  const user = stmt.get(username, username);

  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

  req.session.referee = {
    id: user.id,
    alias: user.alias,
    nombre: user.nombre
  };

  res.status(200).json({ message: 'Login exitoso' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.sendStatus(200);
  });
});

app.get('/api/referee', (req, res) => {
  if (req.session && req.session.referee) {
    res.json({ referee: req.session.referee });
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
});

// === API: PLAYERS ===
app.get('/api/players', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT players.*, teams.nombre AS equipo_nombre
      FROM players
      LEFT JOIN teams ON players.equipo_id = teams.id
      ORDER BY players.id DESC
    `);
    const jugadores = stmt.all();
    res.json(jugadores);
  } catch (err) {
    console.error('❌ Error al obtener jugadores:', err.message);
    res.status(500).json({ error: 'Error al cargar jugadores' });
  }
});

app.post('/api/players', (req, res) => {
  const { nombre, posicion, pie, numero, equipo_id } = req.body;

  if (!nombre || !posicion || !pie || !numero || !equipo_id) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO players (nombre, posicion, pie, numero, equipo_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(nombre, posicion, pie, numero, equipo_id);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ Error al insertar jugador:', err.message);
    res.status(500).json({ error: 'Error al guardar el jugador' });
  }
});

app.put('/api/players/:id', (req, res) => {
  const { nombre, posicion, pie, numero, equipo_id } = req.body;
  const { id } = req.params;

  if (!nombre || !posicion || !pie || !numero || !equipo_id) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE players
      SET nombre = ?, posicion = ?, pie = ?, numero = ?, equipo_id = ?
      WHERE id = ?
    `);
    const result = stmt.run(nombre, posicion, pie, numero, equipo_id, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    res.json({ message: 'Jugador actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar jugador:', err.message);
    res.status(500).json({ error: 'Error al actualizar el jugador' });
  }
});

app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM players WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    res.json({ message: 'Jugador eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar jugador:', err.message);
    res.status(500).json({ error: 'Error al eliminar el jugador' });
  }
});


// === API: TEAMS ===
// === CRUD: Equipos ===
app.get('/api/teams', (req, res) => {
  const rows = db.prepare("SELECT * FROM teams").all();
  res.json(rows);
});

app.post('/api/teams', (req, res) => {
  const { nombre, division, deporte } = req.body;

  if (!nombre || !division || !deporte) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO teams (nombre, division, deporte)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(nombre, division, deporte);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ Error al insertar equipo:', err.message);
    res.status(500).json({ error: 'Error al guardar el equipo' });
  }
});

app.put('/api/teams/:id', (req, res) => {
  const { nombre, division, deporte } = req.body;
  const id = req.params.id;

  if (!nombre || !division || !deporte) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE teams
      SET nombre = ?, division = ?, deporte = ?
      WHERE id = ?
    `);
    const result = stmt.run(nombre, division, deporte, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.status(200).json({ message: 'Equipo actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar equipo:', err.message);
    res.status(500).json({ error: 'Error al actualizar el equipo' });
  }
});

app.delete('/api/teams/:id', (req, res) => {
  const id = req.params.id;

  try {
    const stmt = db.prepare("DELETE FROM teams WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.status(200).json({ message: 'Equipo eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar equipo:', err.message);
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
});




// === API: TOURNAMENTS ===
// === Crear Torneo ===
app.post('/api/tournaments', (req, res) => {
  const { nombre, deporte, division, equipos } = req.body;

  if (!nombre || !deporte || !division || !equipos || !Array.isArray(equipos)) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  try {
    const insertTorneo = db.prepare(`
      INSERT INTO tournaments (nombre, categoria, fecha_inicio, fecha_fin)
      VALUES (?, ?, NULL, NULL)
    `);
    const result = insertTorneo.run(nombre, division);
    const torneoId = result.lastInsertRowid;

    const insertMatch = db.prepare(`
      INSERT INTO matches (torneo_id, equipoA, equipoB, fecha, hora)
      VALUES (?, ?, ?, '', '')
    `);

    for (let i = 0; i < equipos.length; i++) {
      for (let j = i + 1; j < equipos.length; j++) {
        const equipoA = equipos[i];
        const equipoB = equipos[j];
        insertMatch.run(torneoId, equipoA, equipoB);
      }
    }

    res.status(201).json({ message: 'Torneo y partidos creados' });
  } catch (err) {
    console.error('❌ Error al crear torneo:', err.message);
    res.status(500).json({ message: 'Error interno al crear el torneo' });
  }
});

// === Obtener Torneos con nombres de equipos ===
app.get('/api/tournaments', (req, res) => {
  try {
    const torneos = db.prepare(`SELECT * FROM tournaments ORDER BY id DESC`).all();

    const getEquipos = db.prepare(`
      SELECT DISTINCT equipoA, equipoB FROM matches WHERE torneo_id = ?
    `);

    const getNombreEquipo = db.prepare(`SELECT nombre FROM teams WHERE id = ?`);

    const data = torneos.map(t => {
      const enfrentamientos = getEquipos.all(t.id);
      const equiposSet = new Set();

      enfrentamientos.forEach(m => {
        if (m.equipoA) equiposSet.add(getNombreEquipo.get(m.equipoA)?.nombre);
        if (m.equipoB) equiposSet.add(getNombreEquipo.get(m.equipoB)?.nombre);
      });

      return {
        id: t.id,
        nombre: t.nombre,
        deporte: t.deporte || '', 
        equipos: Array.from(equiposSet)
      };
    });

    res.json(data);
  } catch (err) {
    console.error('❌ Error al obtener torneos:', err.message);
    res.status(500).json({ message: 'Error interno al cargar torneos' });
  }
});

// === Eliminar Torneo y sus Partidos ===
app.delete('/api/tournaments/:id', (req, res) => {
  const id = req.params.id;

  try {
    db.prepare(`DELETE FROM matches WHERE torneo_id = ?`).run(id);
    const result = db.prepare(`DELETE FROM tournaments WHERE id = ?`).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    res.status(200).json({ message: 'Torneo eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar torneo:', err.message);
    res.status(500).json({ message: 'Error al eliminar torneo' });
  }
});

// === Actualizar Torneo y regenerar partidos ===
app.put('/api/tournaments/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, deporte, division, equipos } = req.body;

  if (!nombre || !deporte || !division || !Array.isArray(equipos)) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  try {
    // Actualizar datos del torneo
    const update = db.prepare(`
      UPDATE tournaments
      SET nombre = ?, categoria = ?, fecha_inicio = '', fecha_fin = ''
      WHERE id = ?
    `);
    const result = update.run(nombre, division, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    // Eliminar partidos anteriores
    db.prepare(`DELETE FROM matches WHERE torneo_id = ?`).run(id);

    // Insertar nuevos partidos
    const insertMatch = db.prepare(`
      INSERT INTO matches (torneo_id, equipoA, equipoB, fecha, hora)
      VALUES (?, ?, ?, '', '')
    `);

    for (let i = 0; i < equipos.length; i++) {
      for (let j = i + 1; j < equipos.length; j++) {
        const equipoA = equipos[i];
        const equipoB = equipos[j];
        insertMatch.run(id, equipoA, equipoB);
      }
    }

    res.status(200).json({ message: 'Torneo actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar torneo:', err.message);
    res.status(500).json({ error: 'Error interno al actualizar el torneo' });
  }
});

// === Obtener Torneo individual (para edición) ===
app.get('/api/tournaments/:id', (req, res) => {
  const id = req.params.id;

  try {
    const torneo = db.prepare(`
      SELECT id, nombre, categoria AS division FROM tournaments WHERE id = ?
    `).get(id);

    if (!torneo) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    const enfrentamientos = db.prepare(`
      SELECT equipoA, equipoB FROM matches WHERE torneo_id = ?
    `).all(id);

    const equiposSet = new Set();
    enfrentamientos.forEach(m => {
      if (m.equipoA) equiposSet.add(m.equipoA);
      if (m.equipoB) equiposSet.add(m.equipoB);
    });

    torneo.deporte = ''; // No está guardado explícitamente en DB
    torneo.equipos = Array.from(equiposSet);

    res.json(torneo);
  } catch (err) {
    console.error('❌ Error al obtener torneo por ID:', err.message);
    res.status(500).json({ message: 'Error al obtener el torneo' });
  }
});



// === API: MATCHES ===
app.get('/api/matches', (req, res) => {
  const rows = db.prepare("SELECT * FROM matches").all();
  res.json(rows);
});

app.post('/api/matches', (req, res) => {
  const { torneo_id, equipoA, equipoB, fecha, hora } = req.body;
  const stmt = db.prepare(`
    INSERT INTO matches (torneo_id, equipoA, equipoB, fecha, hora)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(torneo_id, equipoA, equipoB, fecha, hora);
  res.status(201).json({ id: result.lastInsertRowid });
});

// === API: ACTIONS ===
app.get('/api/actions', (req, res) => {
  const rows = db.prepare("SELECT * FROM actions").all();
  res.json(rows);
});

app.post('/api/actions', (req, res) => {
  const { jugador, numero, accion, timestamp, match_id } = req.body;
  const stmt = db.prepare(`
    INSERT INTO actions (jugador, numero, accion, timestamp, match_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(jugador, numero, accion, timestamp, match_id);
  res.status(201).json({ id: result.lastInsertRowid });
});

// === PROTEGER HTMLs ===
app.get('/:file', (req, res) => {
  const publicFiles = ['login.html'];
  const file = req.params.file;
  const staticDir = path.join(__dirname, '../public');
  const filePath = path.join(staticDir, file);

  if (!req.session || !req.session.referee) {
    if (!publicFiles.includes(file)) {
      return res.redirect('/');
    }
  }

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  res.status(404).send('Página no encontrada');
});

// === REDIRECCIÓN RAÍZ ===
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, '../public', 'login.html');
  res.sendFile(filePath);
});

// === INICIA SERVIDOR ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
