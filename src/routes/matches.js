// routes/matches.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // 1) Obtener todos los partidos con IDs y nombres de equipos
  router.get('/', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT 
          m.id,
          m.fecha,
          m.hora,
          m.torneo_id,
          m.equipoA    AS equipoA_id,
          m.equipoB    AS equipoB_id,
          ta.nombre    AS nombreEquipoA,
          tb.nombre    AS nombreEquipoB
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

  // 2) Obtener un partido específico
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare(`
        SELECT 
          m.id,
          m.fecha,
          m.hora,
          m.torneo_id,
          m.equipoA    AS equipoA_id,
          ta.nombre    AS nombreEquipoA,
          ta.foto      AS fotoA,
          m.equipoB    AS equipoB_id,
          tb.nombre    AS nombreEquipoB,
          tb.foto      AS fotoB
        FROM matches m
        JOIN teams ta ON m.equipoA = ta.id
        JOIN teams tb ON m.equipoB = tb.id
        WHERE m.id = ?
      `);
      const row = stmt.get(id);
      if (!row) return res.status(404).json({ message: "Partido no encontrado" });

      res.json({
        id:            row.id,
        torneo_id:     row.torneo_id,
        equipoA_id:    row.equipoA_id,
        equipoB_id:    row.equipoB_id,
        nombreEquipoA: row.nombreEquipoA,
        nombreEquipoB: row.nombreEquipoB,
        logoA:         row.fotoA,
        logoB:         row.fotoB,
        fecha:         row.fecha,
        hora:          row.hora
      });
    } catch (err) {
      console.error("❌ Error al obtener el partido:", err.message);
      res.status(500).json({ error: "Error interno al obtener el partido" });
    }
  });

  // 3) Crear nuevo partido
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

  // 4) Actualizar partido existente
  router.put('/:id', (req, res) => {
    const { torneo_id, equipoA, equipoB, fecha, hora } = req.body;
    const { id } = req.params;
    if (!torneo_id || !equipoA || !equipoB || !fecha || !hora) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    try {
      const stmt = db.prepare(`
        UPDATE matches
        SET torneo_id = ?, equipoA = ?, equipoB = ?, fecha = ?, hora = ?
        WHERE id = ?
      `);
      const result = stmt.run(torneo_id, equipoA, equipoB, fecha, hora, id);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Partido no encontrado' });
      }
      res.json({ message: 'Partido actualizado correctamente' });
    } catch (err) {
      console.error("❌ Error al actualizar partido:", err.message);
      res.status(500).json({ message: "Error al actualizar partido" });
    }
  });

  // 5) Eliminar partido
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
