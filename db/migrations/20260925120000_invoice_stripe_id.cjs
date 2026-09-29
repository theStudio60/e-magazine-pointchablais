/**
 * Ajoute stripe_invoice_id (unique) aux factures : évite les doublons quand
 * plusieurs événements Stripe (checkout + invoice.paid) référencent la même facture.
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("invoices", (t) => {
    t.string("stripe_invoice_id", 255).nullable().unique("uq_invoices_stripe");
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.schema.alterTable("invoices", (t) => {
    t.dropUnique(["stripe_invoice_id"], "uq_invoices_stripe");
    t.dropColumn("stripe_invoice_id");
  });
};