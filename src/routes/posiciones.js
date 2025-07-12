// routes/posiciones.js
const express = require('express');
const router  = express.Router();
const db      = require('../db/db'); // tu instancia de SQLite

// GET /api/posiciones?torneo=xxx
router.get('/', (req, res) => {
  const torneo = req.query.torneo || 'general';
  const rows = db.prepare(`
    SELECT equipo, PJ, G, E, P, GF, GC, DG, Pts
    FROM posiciones
    WHERE torneo = ?
    ORDER BY Pts DESC, DG DESC, GF DESC
  `).all(torneo);
  res.json(rows);
});

module.exports = router;
