// routes/matches.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Obtener todos los partidos con nombres de equipos
  router.get('/', (req, res) => {
    try {
     const rows = db.prepare(`
  SELECT 
    m.id, m.fecha, m.hora,
    m.torneo_id,
    ta.nombre AS nombreEquipoA,
    tb.nombre AS nombreEquipoB
  FROM matches m
  JOIN teams ta ON m.equipoA = ta.id
  JOIN teams tb ON m.equipoB = tb.id
  ORDER BY m.id DESC
`).all();

      res.json(rows);
    } catch (err) {
      console.error("❌ Error al obtener partidos:", err.message);
      res.status(500).json({ error: "Error al obtener partidos" });
    }
  });

  // Obtener un partido específico con datos de equipos
  router.get('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare(`
      SELECT 
        m.id, m.fecha, m.hora, m.torneo_id,
        ta.id AS equipoA_id, ta.nombre AS nombreEquipoA, ta.foto AS fotoA,
        tb.id AS equipoB_id, tb.nombre AS nombreEquipoB, tb.foto AS fotoB
      FROM matches m
      JOIN teams ta ON m.equipoA = ta.id
      JOIN teams tb ON m.equipoB = tb.id
      WHERE m.id = ?
    `);
    const row = stmt.get(id);
    if (!row) return res.status(404).json({ message: "Partido no encontrado" });

    // Renombramos aquí para que el frontend no falle
    res.json({
      id: row.id,
      equipoA_id: row.equipoA_id,
      equipoB_id: row.equipoB_id,
      equipoA: row.nombreEquipoA,   // ✅ nombre esperado por panel.js
      equipoB: row.nombreEquipoB,
      logoA: row.fotoA,             // ✅ nombre esperado por panel.js
      logoB: row.fotoB,
      fecha: row.fecha,
      hora: row.hora,
      torneo_id: row.torneo_id
    });
  } catch (err) {
    console.error("❌ Error al obtener el partido:", err.message);
    res.status(500).json({ error: "Error interno al obtener el partido" });
  }
});

  // Crear nuevo partido
  router.post('/', (req, res) => {
    const { torneo_id, equipoA, equipoB, fecha, hora } = req.body;
    if (!torneo_id || !equipoA || !equipoB || !fecha || !hora) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO matches (torneo_id, equipoA, equipoB, fecha, hora)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(torneo_id, equipoA, equipoB, fecha, hora);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error("❌ Error al crear partido:", err.message);
      res.status(500).json({ message: "Error al crear partido" });
    }
  });

  // Eliminar partido
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
      const result = db.prepare('DELETE FROM matches WHERE id = ?').run(id);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Partido no encontrado' });
      }
      res.json({ message: 'Partido eliminado correctamente' });
    } catch (err) {
      console.error("❌ Error al eliminar partido:", err.message);
      res.status(500).json({ message: "Error al eliminar partido" });
    }
  });

  return router;
};
