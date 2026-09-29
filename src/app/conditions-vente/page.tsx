import LegalLayout from "@/components/legal-layout";

export const metadata = { title: "Conditions de vente — Le Point Chablais" };

export default function Page() {
  return (
    <LegalLayout title="Conditions générales de vente">
      <h2>1. Éditeur</h2>
      <p>Le présent portail est édité par Le Point Chablais, Rue Centrale 9, 1892 Lavey-Village, Suisse. Contact : zoe@pointchablais.ch.</p>

      <h2>2. Objet</h2>
      <p>Les présentes conditions régissent la vente d&apos;abonnements numériques donnant accès à la version électronique (PDF) du magazine Le Point Chablais.</p>

      <h2>3. Prix</h2>
      <p>Les prix sont indiqués en francs suisses (CHF), toutes taxes comprises le cas échéant. Le Point Chablais se réserve le droit de modifier ses tarifs ; le prix applicable est celui affiché au moment de la souscription.</p>

      <h2>4. Paiement</h2>
      <p>Le paiement s&apos;effectue en ligne via notre prestataire de paiement sécurisé (carte de crédit, TWINT, PostFinance selon disponibilité). Les données de paiement ne sont pas conservées par Le Point Chablais.</p>

      <h2>5. Accès au service</h2>
      <p>L&apos;accès à la version numérique est activé après confirmation du paiement. L&apos;abonné accède à ses numéros depuis son espace personnel.</p>

      <h2>6. Droit de rétractation / résiliation</h2>
      <p>L&apos;abonnement peut être résilié à tout moment depuis l&apos;espace abonné ou sur demande ; il prend fin à l&apos;échéance de la période en cours.</p>

      <h2>7. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit suisse. For juridique : Aigle (VD), sous réserve de dispositions impératives.</p>
    </LegalLayout>
  );
}
