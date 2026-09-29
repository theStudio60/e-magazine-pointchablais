/**
 * Données de démo pour le développement local (jamais en prod).
 * npm run db:seed
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  if (process.env.NODE_ENV === "production") {
    console.log("Seed démo ignoré en production.");
    return;
  }

  // bcrypt : demo = Chablais2026, admin = Admin2026
  const users = [
    {
      email: "demo@pointchablais.ch",
      password_hash: "$2b$10$QcZiKvs65l.O4bKs7InJqOAUSmaNBLtVoU2YRQnuiq9SxTQlT4o9W",
      name: "Compte démo",
      address: "1860 Aigle",
      role: "user",
      plan: "annuel",
      status: "active",
      current_period_end: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      payment_method: "Carte de crédit (test)",
    },
    {
      email: "admin@pointchablais.ch",
      password_hash: "$2b$10$PHYu3eOzCTrKOzi5yWbhdOXOjRLFNGDq/czz9MMmXQvmkNlel6QKm",
      name: "Administrateur",
      address: "",
      role: "admin",
      plan: null,
      status: "inactive",
      current_period_end: null,
    },
  ];

  for (const u of users) {
    const exists = await knex("users").where({ email: u.email }).first();
    if (exists) continue;
    const [id] = await knex("users").insert(u);
    await knex("users").where({ id }).update({ subscriber_no: String(10000 + id) });
  }

  const editions = ["Septembre 2026", "Août 2026", "Juillet 2026", "Juin 2026"];
  for (const [i, date] of editions.entries()) {
    await knex("editions")
      .insert({ seq: i + 1, id: `ed${i + 1}`, date_label: date, title: "Le Point Chablais", position: i })
      .onConflict("id")
      .ignore();
  }
};
