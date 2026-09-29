// Configuration Knex (migrations + seeds).
// DATABASE_URL : .env.local / .env en local, variables d'environnement du serveur en prod.
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* fichier absent */
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant (.env.local ou variables d'environnement).");
}

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: "mysql2",
  connection: {
    uri: process.env.DATABASE_URL,
    timezone: "Z",
    charset: "utf8mb4",
  },
  pool: { min: 0, max: 5 },
  migrations: {
    directory: "./db/migrations",
    tableName: "knex_migrations",
    extension: "cjs",
    loadExtensions: [".cjs"],
  },
  seeds: {
    directory: "./db/seeds",
    extension: "cjs",
    loadExtensions: [".cjs"],
  },
};
