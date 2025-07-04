// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');

module.exports = (db) => {
  const router = express.Router();

  // === LOGIN ===
  router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const stmt = db.prepare("SELECT * FROM referees WHERE alias = ? OR email = ?");
    const user = stmt.get(username, username);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    req.session.referee = {
      id: user.id,
      alias: user.alias,
      nombre: user.nombre
    };

    res.status(200).json({ message: 'Login exitoso' });
  });

  // === LOGOUT ===
  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    });
  });

  // === INFO DE USUARIO AUTENTICADO ===
  router.get('/referee', (req, res) => {
    if (req.session && req.session.referee) {
      res.json({ referee: req.session.referee });
    } else {
      res.status(401).json({ error: 'No autenticado' });
    }
  });

  return router;
};
