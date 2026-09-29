import LegalLayout from "@/components/legal-layout";

export const metadata = { title: "Politique de confidentialité — Le Point Chablais" };

export default function Page() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <h2>1. Responsable du traitement</h2>
      <p>Le Point Chablais, Rue Centrale 9, 1892 Lavey-Village, Suisse — zoe@pointchablais.ch. Le traitement des données respecte la loi fédérale sur la protection des données (nLPD).</p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données nécessaires à la gestion de votre abonnement : nom, adresse e-mail, adresse postale (facultative) et informations d&apos;abonnement. Les données de paiement sont traitées par notre prestataire (Stripe) et ne sont pas conservées par nos soins.</p>

      <h2>3. Finalités</h2>
      <p>Les données servent à créer et gérer votre compte, traiter les paiements, donner accès aux éditions et vous contacter au sujet de votre abonnement.</p>

      <h2>4. Conservation</h2>
      <p>Les données sont conservées le temps de la relation d&apos;abonnement, puis pour la durée légale applicable.</p>

      <h2>5. Vos droits</h2>
      <p>Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour l&apos;exercer, écrivez à zoe@pointchablais.ch.</p>

      <h2>6. Cookies</h2>
      <p>Le portail utilise uniquement les cookies nécessaires à son fonctionnement (session de connexion). Aucun cookie publicitaire n&apos;est déposé.</p>

      <h2>7. Sécurité</h2>
      <p>Les mots de passe sont chiffrés et les échanges sont sécurisés (HTTPS). L&apos;accès aux éditions est réservé aux abonnés authentifiés.</p>
    </LegalLayout>
  );
}
