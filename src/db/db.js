// db/db.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// === CONFIGURACIÓN DE RUTA Y ARCHIVO DB ===
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'cap_app.db');
const db = new Database(dbPath, { verbose: console.log });

// === ACTIVAR CLAVES FORÁNEAS (importante en SQLite) ===
db.pragma('foreign_keys = ON');

// === CREACIÓN DE TABLAS ===

// Árbitros
db.prepare(`
  CREATE TABLE IF NOT EXISTS referees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    celular TEXT NOT NULL,
    email TEXT NOT NULL,
    alias TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
console.log('✅ Tabla "referees" lista.');

// Equipos
db.prepare(`
  CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  division TEXT NOT NULL,
  deporte TEXT NOT NULL,
  foto TEXT,
  global REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();
console.log('✅ Tabla "teams" lista.');

// Jugadores (modificado para incluir foto)
db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    posicion TEXT NOT NULL,
    pie TEXT NOT NULL,
    numero INTEGER NOT NULL,
    equipo_id INTEGER NOT NULL,
    foto TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES teams(id) ON DELETE CASCADE
  )
`).run();

console.log('✅ Tabla "players" lista.');


// Torneos
db.prepare(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
console.log('✅ Tabla "tournaments" lista.');

// Partidos
db.prepare(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    torneo_id INTEGER NOT NULL,
    equipoA INTEGER NOT NULL,
    equipoB INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (torneo_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (equipoA) REFERENCES teams(id),
    FOREIGN KEY (equipoB) REFERENCES teams(id)
  )
`).run();
console.log('✅ Tabla "matches" lista.');

// Acciones
db.prepare(`
  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugador TEXT NOT NULL,
    numero INTEGER NOT NULL,
    accion TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    match_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
  )
`).run();
console.log('✅ Tabla "actions" lista.');

db.prepare(`
  CREATE TABLE IF NOT EXISTS estadisticas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugador_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    valor INTEGER NOT NULL CHECK (valor BETWEEN 0 AND 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jugador_id) REFERENCES players(id) ON DELETE CASCADE
  )
`).run();
console.log('✅ Tabla "estadisticas" lista.');

db.prepare(`
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partido_id INTEGER,
  equipo_id INTEGER,
  jugador_id INTEGER,
  tipo TEXT,
  accion TEXT,
  tarjeta TEXT,
  minuto INTEGER,
  timestamp INTEGER
);
`).run();
console.log('✅ Tabla "eventos" lista.');

db.prepare(`
CREATE TABLE IF NOT EXISTS match_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id    INTEGER NOT NULL,
  timestamp   TEXT    NOT NULL,
  clock       TEXT,
  event_type  TEXT    NOT NULL,
  details     TEXT,               -- JSON string
  FOREIGN KEY(match_id) REFERENCES matches(id)
);
`).run();
console.log('✅ Tabla "eventos" lista.');

db.prepare(`
  -- en tu script de inicialización de la BD:
CREATE TABLE IF NOT EXISTS lineup (
  match_id INTEGER NOT NULL,
  team     TEXT    NOT NULL CHECK(team IN ('A','B')),
  players  TEXT    NOT NULL,         -- JSON.stringify([...])
  PRIMARY KEY(match_id, team)
);
  `).run();
  console.log('✅ Tabla "lineup" lista.');

  // Al inicializar tu DB:
db.prepare(`
  CREATE TABLE IF NOT EXISTS posiciones (
    torneo  TEXT    NOT NULL,
    equipo  TEXT    NOT NULL,
    PJ      INTEGER NOT NULL DEFAULT 0,
    G       INTEGER NOT NULL DEFAULT 0,
    E       INTEGER NOT NULL DEFAULT 0,
    P       INTEGER NOT NULL DEFAULT 0,
    GF      INTEGER NOT NULL DEFAULT 0,
    GC      INTEGER NOT NULL DEFAULT 0,
    DG      INTEGER NOT NULL DEFAULT 0,
    Pts     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(torneo, equipo)
  )
`).run();
console.log('✅ Tabla "posiciones" lista.');

db.prepare(`
  CREATE TABLE IF NOT EXISTS estadisticas_completas (
  match_id   INTEGER,
  jugador_id INTEGER,
  goles      INTEGER,
  cambios    INTEGER,
  amarillas  INTEGER,
  rojas      INTEGER
);`).run();
console.log('✅ Tabla "estadisticas_completas" lista.');

// === EXPORTACIÓN DE INSTANCIA DB ===
module.exports = db;
