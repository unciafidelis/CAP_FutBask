const express = require('express');
const bcrypt  = require('bcrypt');

module.exports = (db) => {
  const router = express.Router();

  // 1) Listar todos los árbitros
  // GET /api/referees
  router.get('/', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, nombre, celular, email, alias, created_at
        FROM referees
        ORDER BY created_at DESC
      `).all();
      res.json(rows);
    } catch (err) {
      console.error("❌ Error obteniendo árbitros:", err);
      res.status(500).json({ error: "Error al obtener árbitros" });
    }
  });

  // 2) Obtener árbitro por ID
  // GET /api/referees/:id
  router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    try {
      const row = db.prepare(`
        SELECT id, nombre, celular, email, alias, created_at
        FROM referees
        WHERE id = ?
      `).get(id);
      if (!row) return res.status(404).json({ error: "Árbitro no encontrado" });
      res.json(row);
    } catch (err) {
      console.error("❌ Error obteniendo árbitro:", err);
      res.status(500).json({ error: "Error al obtener árbitro" });
    }
  });

  // 3) Crear nuevo árbitro
  // POST /api/referees
  router.post('/', async (req, res) => {
    const { nombre, celular, email, alias, password } = req.body;
    if (!nombre || !celular || !email || !alias || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    try {
      const hash = await bcrypt.hash(password, 10);
      const stmt = db.prepare(`
        INSERT INTO referees (nombre, celular, email, alias, password, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      const info = stmt.run(nombre, celular, email, alias, hash);
      const newId = info.lastInsertRowid;
      const newRef = db.prepare(`
        SELECT id, nombre, celular, email, alias, created_at
        FROM referees
        WHERE id = ?
      `).get(newId);
      res.status(201).json(newRef);
    } catch (err) {
      console.error("❌ Error creando árbitro:", err);
      res.status(500).json({ error: "Error al crear árbitro" });
    }
  });

  // 4) Actualizar árbitro
  // PUT /api/referees/:id
  router.put('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, celular, email, alias, password } = req.body;
    if (!nombre || !celular || !email || !alias) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    try {
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        db.prepare(`
          UPDATE referees
          SET nombre = ?, celular = ?, email = ?, alias = ?, password = ?
          WHERE id = ?
        `).run(nombre, celular, email, alias, hash, id);
      } else {
        db.prepare(`
          UPDATE referees
          SET nombre = ?, celular = ?, email = ?, alias = ?
          WHERE id = ?
        `).run(nombre, celular, email, alias, id);
      }
      const updated = db.prepare(`
        SELECT id, nombre, celular, email, alias, created_at
        FROM referees
        WHERE id = ?
      `).get(id);
      res.json(updated);
    } catch (err) {
      console.error("❌ Error actualizando árbitro:", err);
      res.status(500).json({ error: "Error al actualizar árbitro" });
    }
  });

  // 5) Eliminar árbitro
  // DELETE /api/referees/:id
  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    try {
      const info = db.prepare(`
        DELETE FROM referees
        WHERE id = ?
      `).run(id);
      if (info.changes === 0) {
        return res.status(404).json({ error: "Árbitro no encontrado" });
      }
      res.json({ message: "Árbitro eliminado correctamente" });
    } catch (err) {
      console.error("❌ Error eliminando árbitro:", err);
      res.status(500).json({ error: "Error al eliminar árbitro" });
    }
  });

  return router;
};
