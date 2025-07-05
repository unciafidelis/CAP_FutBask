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


// === EXPORTACIÓN DE INSTANCIA DB ===
module.exports = db;
