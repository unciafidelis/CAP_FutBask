const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// === CONFIGURACIÓN DEL DIRECTORIO Y BASE DE DATOS ===
const dbDir = path.join(__dirname, './db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'cap_app.db');
const db = new Database(dbPath, { verbose: console.log });

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
console.log('✅ Tabla "referees" creada o ya existente.');

// Equipos
db.prepare(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    division TEXT NOT NULL,
    deporte TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
console.log('✅ Tabla "teams" creada o ya existente.');

// Jugadores
db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    posicion TEXT NOT NULL,
    pie TEXT NOT NULL,
    numero INTEGER NOT NULL,
    equipo_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES teams(id)
  )
`).run();
console.log('✅ Tabla "players" creada o ya existente.');

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
console.log('✅ Tabla "tournaments" creada o ya existente.');

// Partidos
db.prepare(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    torneo_id INTEGER,
    equipoA TEXT NOT NULL,
    equipoB TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (torneo_id) REFERENCES tournaments(id)
  )
`).run();
console.log('✅ Tabla "matches" creada o ya existente.');

// Acciones
db.prepare(`
  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugador TEXT NOT NULL,
    numero INTEGER NOT NULL,
    accion TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    match_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  )
`).run();
console.log('✅ Tabla "actions" creada o ya existente.');

// Exportar base de datos
module.exports = db;
