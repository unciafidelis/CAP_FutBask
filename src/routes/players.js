// routes/players.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = (db) => {
  const router = express.Router();

  const imgDir = path.join(__dirname, '../img/playerImg');
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imgDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `player_${Date.now()}${ext}`;
      cb(null, name);
    }
  });

  const upload = multer({ storage });

  // === GET: Todos los jugadores ===
  router.get('/', (req, res) => {
    try {
      const stmt = db.prepare(`
        SELECT players.*, teams.nombre AS equipo_nombre, teams.foto AS foto_equipo
        FROM players
        LEFT JOIN teams ON players.equipo_id = teams.id
        ORDER BY players.id DESC
      `);
      res.json(stmt.all());
    } catch (err) {
      console.error('❌ Error al obtener jugadores:', err.message);
      res.status(500).json({ error: 'Error al cargar jugadores' });
    }
  });

  // === GET: Jugador por ID ===
  router.get('/:id', (req, res) => {
    try {
      const jugador = db.prepare(`
        SELECT players.*, teams.nombre AS equipo_nombre, teams.foto AS foto_equipo
        FROM players
        LEFT JOIN teams ON players.equipo_id = teams.id
        WHERE players.id = ?
      `).get(req.params.id);

      if (!jugador) return res.status(404).json({ error: 'Jugador no encontrado' });
      res.json(jugador);
    } catch (err) {
      console.error('❌ Error al obtener jugador:', err.message);
      res.status(500).json({ error: 'Error al obtener el jugador' });
    }
  });

  // === POST: Crear jugador con imagen ===
  router.post('/', upload.single('foto'), (req, res) => {
    const { nombre, posicion, pie, numero, equipo_id } = req.body;
    const foto = req.file ? `/img/playerImg/${req.file.filename}` : null;

    if (!nombre || !posicion || !pie || !numero || !equipo_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO players (nombre, posicion, pie, numero, equipo_id, foto)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(nombre, posicion, pie, parseInt(numero), parseInt(equipo_id), foto);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error('❌ Error al insertar jugador:', err.message);
      res.status(500).json({ error: 'Error al guardar el jugador' });
    }
  });

  // === PUT: Actualizar jugador con opción de nueva imagen ===
  router.put('/:id', upload.single('foto'), (req, res) => {
    const { nombre, posicion, pie, numero, equipo_id } = req.body;
    const { id } = req.params;

    if (!nombre || !posicion || !pie || !numero || !equipo_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
      const jugadorActual = db.prepare('SELECT foto FROM players WHERE id = ?').get(id);
      const nuevaFoto = req.file ? `/img/playerImg/${req.file.filename}` : jugadorActual?.foto || null;

      const stmt = db.prepare(`
        UPDATE players
        SET nombre = ?, posicion = ?, pie = ?, numero = ?, equipo_id = ?, foto = ?
        WHERE id = ?
      `);
      const result = stmt.run(nombre, posicion, pie, parseInt(numero), parseInt(equipo_id), nuevaFoto, id);

      if (result.changes === 0) return res.status(404).json({ error: 'Jugador no encontrado' });

      res.json({ message: 'Jugador actualizado correctamente' });
    } catch (err) {
      console.error('❌ Error al actualizar jugador:', err.message);
      res.status(500).json({ error: 'Error al actualizar el jugador' });
    }
  });

  // === DELETE: Eliminar jugador ===
  router.delete('/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM players WHERE id = ?');
      const result = stmt.run(req.params.id);

      if (result.changes === 0) return res.status(404).json({ error: 'Jugador no encontrado' });

      res.json({ message: 'Jugador eliminado correctamente' });
    } catch (err) {
      console.error('❌ Error al eliminar jugador:', err.message);
      res.status(500).json({ error: 'Error al eliminar el jugador' });
    }
  });

  // === GET: Jugadores por equipo ===
  router.get('/byTeam/:id', (req, res) => {
    try {
      const stmt = db.prepare(`
        SELECT 
          players.*, 
          players.foto AS foto_jugador,
          teams.foto AS foto_equipo
        FROM players
        JOIN teams ON players.equipo_id = teams.id
        WHERE players.equipo_id = ?
        ORDER BY players.numero ASC
      `);
      res.json(stmt.all(req.params.id));
    } catch (error) {
      console.error('❌ Error al obtener jugadores por equipo:', error.message);
      res.status(500).json({ error: 'Error al obtener jugadores' });
    }
  });

  return router;
};
