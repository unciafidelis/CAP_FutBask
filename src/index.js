// === DEPENDENCIAS ===
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db/db');
const seedReferees = require('./init/referees-seed');

const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');
const tournamentsRouter = require('./routes/tournaments');
const matchesRouter = require('./routes/matches');
const actionsRouter = require('./routes/actions');
const authRouter = require('./routes/auth');
const statsRoutes = require('./routes/stats');

const app = express();

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'cap-secret-key',
  resave: false,
  saveUninitialized: false
}));

// === SEMILLA DE ÁRBITROS ===
seedReferees(db);

// === RUTA ESTÁTICA PARA CARGAR IMG DESDE src/img ===
app.use('/img/teamImg', express.static(path.join(__dirname, 'img/teamImg')));
app.use('/img/playerImg', express.static(path.join(__dirname, 'img', 'playerImg')));
// === RUTAS ESTÁTICAS RESTRINGIDAS A EXTENSIONES SEGURAS ===
app.use((req, res, next) => {
  const isStatic = /\.(css|js|png|jpg|jpeg|svg|ico)$/.test(req.url);
  if (isStatic) {
    express.static(path.join(__dirname, '../public'))(req, res, next);
  } else {
    next();
  }
});

// === RUTAS API ===
app.use('/api/teams', teamsRouter(db));
app.use('/api/players', playersRouter(db));
app.use('/api/tournaments', tournamentsRouter(db));
app.use('/api/matches', matchesRouter(db));
app.use('/api/actions', actionsRouter(db));
app.use('/api', authRouter(db)); // login, logout, referee info
app.use('/api/stats', statsRoutes);
// === RUTAS HTML PROTEGIDAS ===
app.get('/:file', (req, res) => {
  const publicFiles = ['login.html'];
  const file = req.params.file;
  const staticDir = path.join(__dirname, '../public');
  const filePath = path.join(staticDir, file);

  if (!req.session || !req.session.referee) {
    if (!publicFiles.includes(file)) return res.redirect('/');
  }

  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  res.status(404).send('Página no encontrada');
});

// === RAÍZ REDIRIGE A LOGIN ===
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, '../public', 'login.html');
  res.sendFile(filePath);
});

// === INICIO DE SERVIDOR ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
