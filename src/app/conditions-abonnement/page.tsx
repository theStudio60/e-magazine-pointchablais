import LegalLayout from "@/components/legal-layout";

export const metadata = { title: "Conditions d'abonnement — Le Point Chablais" };

export default function Page() {
  return (
    <LegalLayout title="Conditions d'abonnement">
      <h2>1. Formules</h2>
      <p>Deux formules d&apos;abonnement numérique sont proposées : mensuelle et annuelle. Chaque formule donne accès à la version PDF du magazine et aux éditions incluses.</p>

      <h2>2. Durée et renouvellement</h2>
      <p>L&apos;abonnement est reconduit automatiquement à chaque échéance (mensuelle ou annuelle) jusqu&apos;à résiliation par l&apos;abonné.</p>

      <h2>3. Résiliation</h2>
      <p>L&apos;abonné peut résilier à tout moment depuis son espace personnel ou en écrivant à zoe@pointchablais.ch. La résiliation prend effet à la fin de la période déjà payée ; aucun remboursement au prorata n&apos;est effectué, sauf disposition légale contraire.</p>

      <h2>4. Compte et accès</h2>
      <p>L&apos;accès est strictement personnel. L&apos;abonné est responsable de la confidentialité de ses identifiants. Le partage du compte n&apos;est pas autorisé.</p>

      <h2>5. Disponibilité</h2>
      <p>Le Point Chablais met tout en œuvre pour assurer la disponibilité du service. Des interruptions pour maintenance ou raisons techniques peuvent survenir.</p>

      <h2>6. Modifications</h2>
      <p>Les présentes conditions peuvent être modifiées ; les abonnés seront informés des changements substantiels.</p>
    </LegalLayout>
  );
}
