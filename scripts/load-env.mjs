// Charge .env.local puis .env (sans écraser les variables déjà définies).
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* fichier absent */
  }
}
