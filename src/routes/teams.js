// routes/teams.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = (db) => {
  const router = express.Router();

  // ✅ Definimos correctamente el directorio de imágenes
  const imgDir = path.join(__dirname, '../img/teamImg');

  // ✅ Creamos el directorio si no existe
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imgDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `team_${Date.now()}${ext}`;
      cb(null, name);
    }
  });

  const upload = multer({ storage });

  // === CREAR EQUIPO ===
  router.post('/', upload.single('foto'), (req, res) => {
    const { nombre, division, deporte } = req.body;
    const foto = req.file ? `/img/teamImg/${req.file.filename}` : null;

    if (!nombre || !division || !deporte) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO teams (nombre, division, deporte, foto, global)
        VALUES (?, ?, ?, ?, 0)
      `);
      const result = stmt.run(nombre, division, deporte, foto);
      res.status(201).json({ message: 'Equipo creado', id: result.lastInsertRowid });
    } catch (err) {
      console.error('❌ Error al crear equipo:', err.message);
      res.status(500).json({ message: 'Error al guardar equipo' });
    }
  });

  // === ACTUALIZAR EQUIPO ===
  router.put('/:id', upload.single('foto'), (req, res) => {
    const { nombre, division, deporte } = req.body;
    const { id } = req.params;
    const foto = req.file ? `/img/teamImg/${req.file.filename}` : null;

    try {
      const query = foto
        ? `UPDATE teams SET nombre = ?, division = ?, deporte = ?, foto = ? WHERE id = ?`
        : `UPDATE teams SET nombre = ?, division = ?, deporte = ? WHERE id = ?`;

      const values = foto
        ? [nombre, division, deporte, foto, id]
        : [nombre, division, deporte, id];

      const stmt = db.prepare(query);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }

      res.json({ message: 'Equipo actualizado' });
    } catch (err) {
      console.error('❌ Error al actualizar equipo:', err.message);
      res.status(500).json({ message: 'Error al actualizar equipo' });
    }
  });

  // === OBTENER TODOS LOS EQUIPOS ===
  router.get('/', (req, res) => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM teams ORDER BY created_at DESC
      `);
      const equipos = stmt.all();
      res.json(equipos);
    } catch (err) {
      console.error('❌ Error al obtener equipos:', err.message);
      res.status(500).json({ message: 'Error al obtener equipos' });
    }
  });

  // === OBTENER JUGADORES DE UN EQUIPO ===
  router.get('/:id/players', (req, res) => {
    const { id } = req.params;

    try {
      const stmt = db.prepare(`
        SELECT id, nombre, numero, posicion, pie
        FROM players
        WHERE equipo_id = ?
        ORDER BY numero ASC
      `);
      const jugadores = stmt.all(id);
      res.json(jugadores);
    } catch (err) {
      console.error('❌ Error al obtener jugadores del equipo:', err.message);
      res.status(500).json({ error: 'Error al obtener los jugadores del equipo' });
    }
  });

  // === ELIMINAR EQUIPO ===
// === ELIMINAR EQUIPO ===
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
      // Obtener el nombre del archivo de imagen
      const equipo = db.prepare('SELECT foto FROM teams WHERE id = ?').get(id);
      if (!equipo) {
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }

      // Liberar jugadores (quitarles equipo_id)
      db.prepare('UPDATE players SET equipo_id = NULL WHERE equipo_id = ?').run(id);

      // Eliminar la imagen física si no es default
      if (equipo.foto && !equipo.foto.includes('default')) {
        const filename = path.basename(equipo.foto); // Ej. team_12345.jpg
        const imagePath = path.join(imgDir, filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Eliminar el equipo
      const result = db.prepare('DELETE FROM teams WHERE id = ?').run(id);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'No se pudo eliminar el equipo' });
      }

      res.json({ message: 'Equipo eliminado correctamente' });
    } catch (err) {
      console.error('❌ Error al eliminar equipo:', err.message);
      res.status(500).json({ message: 'Error interno al eliminar el equipo' });
    }
  });



  return router;
};
