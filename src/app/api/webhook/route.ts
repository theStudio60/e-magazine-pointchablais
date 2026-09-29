import { NextResponse } from "next/server";
import { stripe, stripeEnabled } from "@/lib/stripe";
import {
  getUserById,
  getUserByStripeCustomer,
  updateUser,
  getPack,
  recordStripeInvoice,
  addLog,
} from "@/lib/db";
import { sendMail, sendAdminAlert, mails, appUrl } from "@/lib/mailer";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Récupère la fin de période (nouvelle API : sur l'item, plus sur la subscription).
function subPeriodEnd(sub: Stripe.Subscription): number | null {
  return (
    sub.items?.data?.[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null
  );
}

export async function POST(req: Request) {
  if (!stripeEnabled || !stripe) return NextResponse.json({ received: true });

  const sig = req.headers.get("stripe-signature") || "";
  const whsec = process.env.STRIPE_WEBHOOK_SECRET || "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = whsec
      ? stripe.webhooks.constructEvent(raw, sig, whsec)
      : (JSON.parse(raw) as Stripe.Event);
  } catch {
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }

  const site = appUrl(new URL(req.url).origin);
  const espace = `${site}/espace`;

  try {
    // 1) Première souscription : on active le compte tout de suite.
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const uid = s.metadata?.uid;
      const plan = s.metadata?.plan || "annuel";
      const u0 = uid ? await getUserById(uid) : undefined;
      if (u0) {
        let end: string | null = u0.currentPeriodEnd;
        if (s.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(s.subscription as string);
            const pe = subPeriodEnd(sub);
            if (pe) end = new Date(pe * 1000).toISOString();
          } catch {
            /* on garde la date connue */
          }
        }
        await updateUser(u0.id, {
          status: "active",
          plan,
          currentPeriodEnd: end,
          stripeCustomerId: (s.customer as string) || u0.stripeCustomerId,
          stripeSubscriptionId: (s.subscription as string) || u0.stripeSubscriptionId,
          paymentMethod: "Stripe",
        });
        // La facture est créée par l'événement invoice.paid (dédupliquée) ;
        // filet de secours si l'id de facture est déjà dans la session.
        const invId = (s as unknown as { invoice?: string }).invoice;
        if (invId) {
          const pack = await getPack(plan);
          await recordStripeInvoice({
            stripeInvoiceId: invId,
            user: u0,
            amount: pack?.price ?? s.amount_total ?? 0,
            plan,
            status: "paye",
          });
        }
        await addLog(u0.email, "Abonnement", `Souscription ${plan} (Stripe)`);
        const a = mails.adminAlert("Nouvel abonné", [
          ["Nom", u0.name || "—"],
          ["E-mail", u0.email],
          ["Formule", plan],
          ["N° abonné", u0.subscriberNo],
        ]);
        await sendAdminAlert(a.subject, a.html);
      }
    }

    // 2) Paiement réussi (première fois ET chaque renouvellement mensuel/annuel).
    else if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const inv = event.data.object as Stripe.Invoice;
      const u = await getUserByStripeCustomer(inv.customer as string);
      if (u) {
        let plan = u.plan || "annuel";
        let end: string | null = inv.lines?.data?.[0]?.period?.end
          ? new Date(inv.lines.data[0].period.end * 1000).toISOString()
          : u.currentPeriodEnd;
        const subId = (inv as unknown as { subscription?: string }).subscription;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            plan = (sub.metadata?.plan as string) || plan;
            const pe = subPeriodEnd(sub);
            if (pe) end = new Date(pe * 1000).toISOString();
          } catch {
            /* fallback sur la période de la facture */
          }
        }
        await updateUser(u.id, {
          status: "active",
          plan,
          currentPeriodEnd: end,
          stripeSubscriptionId: subId || u.stripeSubscriptionId,
          paymentMethod: "Stripe",
        });
        const created = await recordStripeInvoice({
          stripeInvoiceId: inv.id as string,
          user: u,
          amount: inv.amount_paid ?? inv.total ?? 0,
          plan,
          status: "paye",
        });
        if (created) {
          await addLog(u.email, "Paiement reçu", `Abonnement ${plan} — facture ${inv.number || inv.id}`);
          const m = mails.paymentReceived(u.name, plan, inv.amount_paid ?? inv.total ?? 0, end, espace);
          await sendMail(u.email, m.subject, m.html);
        }
      }
    }

    // 3) Paiement échoué : on log (l'accès n'est coupé que si Stripe annule l'abonnement).
    else if (event.type === "invoice.payment_failed") {
      const inv = event.data.object as Stripe.Invoice;
      const u = await getUserByStripeCustomer(inv.customer as string);
      if (u) {
        await addLog(u.email, "Paiement échoué", `Tentative refusée — Stripe va réessayer (facture ${inv.number || inv.id})`);
        // Un seul e-mail par facture (Stripe réessaie plusieurs fois).
        if ((inv.attempt_count ?? 1) <= 1) {
          const m = mails.paymentFailed(u.name, espace);
          await sendMail(u.email, m.subject, m.html);
          const a = mails.adminAlert("Paiement échoué", [
            ["Abonné", u.name || u.email],
            ["E-mail", u.email],
            ["Montant", `CHF ${((inv.amount_due ?? 0) / 100).toFixed(2)}`],
          ]);
          await sendAdminAlert(a.subject, a.html);
        }
      }
    }

    // 3b) Rappel avant renouvellement (Stripe envoie invoice.upcoming quelques jours avant).
    else if (event.type === "invoice.upcoming") {
      const inv = event.data.object as Stripe.Invoice;
      const u = await getUserByStripeCustomer(inv.customer as string);
      if (u && u.status === "active") {
        const when = inv.next_payment_attempt
          ? new Date(inv.next_payment_attempt * 1000).toISOString()
          : u.currentPeriodEnd;
        const m = mails.renewalReminder(u.name, u.plan || "annuel", inv.amount_due ?? 0, when, espace);
        await sendMail(u.email, m.subject, m.html);
      }
    }

    // 4) Statut de l'abonnement modifié / annulé.
    else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const u = await getUserByStripeCustomer(sub.customer as string);
      if (u) {
        // On garde l'accès tant que Stripe considère l'abonnement en cours (grâce incluse).
        const ok = ["active", "trialing", "past_due"].includes(sub.status);
        const pe = subPeriodEnd(sub);
        const wasActive = u.status === "active";
        await updateUser(u.id, {
          status: ok ? "active" : "inactive",
          currentPeriodEnd: pe ? new Date(pe * 1000).toISOString() : u.currentPeriodEnd,
        });
        if (wasActive && !ok) {
          await addLog(u.email, "Abonnement terminé", `Statut Stripe : ${sub.status}`);
          const m = mails.subscriptionEnded(u.name, `${site}/abonnement`);
          await sendMail(u.email, m.subject, m.html);
          const a = mails.adminAlert("Abonnement terminé", [
            ["Abonné", u.name || u.email],
            ["E-mail", u.email],
            ["Statut Stripe", sub.status],
          ]);
          await sendAdminAlert(a.subject, a.html);
        }
      }
    }
  } catch {
    // on ignore les erreurs de traitement pour renvoyer 200 à Stripe
  }

  return NextResponse.json({ received: true });
}