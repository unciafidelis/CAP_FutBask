// routes/players.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = (db) => {
  const router = express.Router();
  // ✅ Definimos correctamente el directorio de imágenes
    const imgDir = path.join(__dirname, '../img/playerImg');
  
    // ✅ Creamos el directorio si no existe
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }

    
  // === Configuración de Multer para fotos de jugador ===
  const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, imgDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `player_${Date.now()}${ext}`;
        cb(null, name);
      }
    });

  const upload = multer({ storage });

  // === Obtener todos los jugadores ===
  router.get('/', (req, res) => {
    try {
      const stmt = db.prepare(`
        SELECT players.*, teams.nombre AS equipo_nombre, teams.foto AS foto_equipo
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

  // === Obtener un jugador por ID ===
  router.get('/:id', (req, res) => {
    const { id } = req.params;

    try {
      const jugador = db.prepare(`
        SELECT players.*, teams.nombre AS equipo_nombre, teams.foto AS foto_equipo
        FROM players
        LEFT JOIN teams ON players.equipo_id = teams.id
        WHERE players.id = ?
      `).get(id);

      if (!jugador) return res.status(404).json({ error: 'Jugador no encontrado' });

      res.json(jugador);
    } catch (err) {
      console.error('❌ Error al obtener jugador por ID:', err.message);
      res.status(500).json({ error: 'Error al obtener el jugador' });
    }
  });

  // === Crear jugador con imagen ===
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

  // === Actualizar jugador (opcional con nueva imagen) ===
  router.put('/:id', upload.single('foto'), (req, res) => {
    const { nombre, posicion, pie, numero, equipo_id } = req.body;
    const { id } = req.params;
    const nuevaFoto = req.file ? req.file.filename : null;

    if (!nombre || !posicion || !pie || !numero || !equipo_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
      const jugadorActual = db.prepare('SELECT foto FROM players WHERE id = ?').get(id);
      const fotoFinal = nuevaFoto || (jugadorActual ? jugadorActual.foto : null);

      const stmt = db.prepare(`
        UPDATE players
        SET nombre = ?, posicion = ?, pie = ?, numero = ?, equipo_id = ?, foto = ?
        WHERE id = ?
      `);
      const result = stmt.run(nombre, posicion, pie, parseInt(numero), parseInt(equipo_id), fotoFinal, id);

      if (result.changes === 0) return res.status(404).json({ error: 'Jugador no encontrado' });

      res.json({ message: 'Jugador actualizado correctamente' });
    } catch (err) {
      console.error('❌ Error al actualizar jugador:', err.message);
      res.status(500).json({ error: 'Error al actualizar el jugador' });
    }
  });

  // === Eliminar jugador ===
  router.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
      const stmt = db.prepare('DELETE FROM players WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) return res.status(404).json({ error: 'Jugador no encontrado' });

      res.json({ message: 'Jugador eliminado correctamente' });
    } catch (err) {
      console.error('❌ Error al eliminar jugador:', err.message);
      res.status(500).json({ error: 'Error al eliminar el jugador' });
    }
  });

  // === Jugadores por equipo ===
  router.get('/byTeam/:id', (req, res) => {
    const equipoId = req.params.id;

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
      const jugadores = stmt.all(equipoId);
      res.json(jugadores);
    } catch (error) {
      console.error('❌ Error al obtener jugadores por equipo:', error.message);
      res.status(500).json({ error: 'Error al obtener jugadores' });
    }
  });

  return router;
};
