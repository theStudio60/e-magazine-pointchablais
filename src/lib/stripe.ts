import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY || "";
// Actif seulement si une vraie clé Stripe (test ou live) est fournie.
export const stripeEnabled = key.startsWith("sk_");
export const stripe: Stripe | null = stripeEnabled ? new Stripe(key) : null;

export type PlanKey = "mensuel" | "annuel";

export const PLANS: Record<
  PlanKey,
  { label: string; amount: number; interval: "month" | "year"; priceId?: string }
> = {
  mensuel: {
    label: "Mensuel",
    amount: 500, // CHF 5.00 (en centimes)
    interval: "month",
    priceId: process.env.STRIPE_PRICE_MENSUEL,
  },
  annuel: {
    label: "Annuel",
    amount: 4900, // CHF 49.00
    interval: "year",
    priceId: process.env.STRIPE_PRICE_ANNUEL,
  },
};
