/**
 * Schéma initial du portail abo.pointchablais.ch
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  const opts = (t) => {
    t.engine("InnoDB");
    t.charset("utf8mb4");
    t.collate("utf8mb4_unicode_ci");
  };

  await knex.schema.createTable("users", (t) => {
    opts(t);
    t.increments("id").unsigned().primary();
    t.string("email", 255).notNullable().unique("uq_users_email");
    t.string("password_hash", 255).notNullable();
    t.string("name", 255).notNullable().defaultTo("");
    t.string("address", 500).notNullable().defaultTo("");
    t.string("subscriber_no", 20).nullable().unique("uq_users_subscriber_no");
    t.enu("role", ["admin", "user"]).notNullable().defaultTo("user");
    t.string("plan", 50).nullable();
    t.enu("status", ["active", "inactive"]).notNullable().defaultTo("inactive");
    t.datetime("current_period_end", { precision: 3 }).nullable();
    t.string("payment_method", 100).nullable();
    t.string("reset_token", 128).nullable().index("ix_users_reset_token");
    t.bigInteger("reset_expires").nullable();
    t.string("stripe_customer_id", 255).nullable().index("ix_users_stripe_customer");
    t.string("stripe_subscription_id", 255).nullable();
    t.datetime("created_at", { precision: 3 }).notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP(3)"));
    t.index(["status", "role"], "ix_users_status_role");
  });
  // Les ids 1..41 ne sont jamais attribués (compatibilité numéros abonné 10042+)
  await knex.raw("ALTER TABLE users AUTO_INCREMENT = 42");

  await knex.schema.createTable("packs", (t) => {
    opts(t);
    t.string("key", 50).primary();
    t.string("name", 100).notNullable();
    t.enu("billing_interval", ["month", "year"]).notNullable();
    t.integer("price").unsigned().notNullable().comment("centimes");
    t.boolean("active").notNullable().defaultTo(true);
    t.boolean("recommended").notNullable().defaultTo(false);
    t.integer("sort_order").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("editions", (t) => {
    opts(t);
    t.increments("seq").unsigned().primary();
    t.string("id", 20).nullable().unique("uq_editions_id");
    t.string("date_label", 100).notNullable();
    t.string("title", 255).notNullable().defaultTo("Le Point Chablais");
    t.string("publish_at", 40).nullable();
    t.integer("position").notNullable().defaultTo(0).index("ix_editions_position");
    t.datetime("created_at", { precision: 3 }).notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP(3)"));
  });

  await knex.schema.createTable("invoices", (t) => {
    opts(t);
    t.increments("id").unsigned().primary();
    t.string("number", 30).nullable().unique("uq_invoices_number");
    t.integer("user_id").unsigned().nullable().index("ix_invoices_user");
    t.string("user_name", 255).notNullable();
    t.string("user_email", 255).notNullable();
    t.integer("amount").unsigned().notNullable().comment("centimes");
    t.string("plan", 50).notNullable();
    t.enu("status", ["paye", "en_attente"]).notNullable();
    t.datetime("date", { precision: 3 }).notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP(3)")).index("ix_invoices_date");
    t.foreign("user_id", "fk_invoices_user").references("users.id").onDelete("SET NULL").onUpdate("CASCADE");
  });

  await knex.schema.createTable("logs", (t) => {
    opts(t);
    t.string("id", 40).primary();
    t.datetime("ts", { precision: 3 }).notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP(3)")).index("ix_logs_ts");
    t.string("actor", 255).notNullable();
    t.string("action", 100).notNullable();
    t.text("detail").notNullable();
  });

  await knex.schema.createTable("emails", (t) => {
    opts(t);
    t.string("id", 40).primary();
    t.datetime("ts", { precision: 3 }).notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP(3)")).index("ix_emails_ts");
    t.string("from_addr", 255).notNullable();
    t.string("subject", 500).notNullable();
    t.text("body", "mediumtext").notNullable();
    t.string("audience", 50).notNullable();
    t.integer("recipients").unsigned().notNullable().defaultTo(0);
    t.enu("status", ["envoye", "en_file"]).notNullable();
  });

  await knex.schema.createTable("settings", (t) => {
    opts(t);
    t.string("k", 50).primary();
    t.json("v").notNullable();
    t.datetime("updated_at", { precision: 3 })
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)"));
  });

  // Données de référence (nécessaires en prod aussi)
  await knex("packs").insert([
    { key: "mensuel", name: "Mensuel", billing_interval: "month", price: 500, active: true, recommended: false, sort_order: 0 },
    { key: "annuel", name: "Annuel", billing_interval: "year", price: 4900, active: true, recommended: true, sort_order: 1 },
  ]);
  await knex("settings").insert({
    k: "site",
    v: JSON.stringify({
      contactEmail: "zoe@pointchablais.ch",
      address: "Rue Centrale 9, 1892 Lavey-Village",
      heroTitle: "Le journal qui réunit Aigle, Bex et le Chablais.",
    }),
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("invoices");
  for (const t of ["emails", "logs", "editions", "packs", "settings", "users"]) {
    await knex.schema.dropTableIfExists(t);
  }
};
