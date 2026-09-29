# Portail d'abonnement — Le Point Chablais

Portail numérique **complet** (Next.js 16 + TypeScript), séparé du site vitrine WordPress.
Destiné à **abo.pointchablais.ch**. Design maison (CSS), police Poppins.

## Côté visiteur / abonné
- Landing `/` (hero + formules, prix pilotés par l'admin)
- Inscription `/inscription`, Connexion `/connexion`
- Mot de passe oublié `/mot-de-passe-oublie` + réinitialisation `/reinitialiser`
- Espace abonné `/espace` : Mon compte, Mon abonnement, bibliothèque **E-paper** (PDF)
- Mon compte `/compte` : modifier coordonnées + changer le mot de passe
- Abonnement Stripe (carte + TWINT) en mode test, avec repli **simulé** si pas de clés
- PDF protégés (réservés aux abonnés actifs) + génération de factures
- Pages légales : Conditions de vente / d'abonnement / Confidentialité (modèles à faire valider)

## Back-office `/admin` (réservé au rôle admin) — menu latéral
- **Tableau de bord** : membres, abonnements actifs, revenu encaissé, paiements en attente + membres/factures récents
- **Membres** : recherche, filtre par statut, **pagination**, activer/désactiver, changer la formule, supprimer, **créer/inviter** un membre (mot de passe temporaire), **export CSV**
- **Abonnements** : liste des actifs + résiliation
- **Factures** : liste + recherche, marquer payé / en attente, total encaissé
- **Packs** : gérer les offres (nom, prix, actif, recommandé) → répercutés sur la landing + le paiement
- **Numéros (PDF)** : uploader un numéro (PDF + couverture + date de sortie), supprimer
- **Emails** : campagnes aux abonnés (tous / actifs) — nécessite un SMTP en prod (`SMTP_URL`), sinon enregistré en file
- **Administrateurs** : lister, ajouter, retirer les droits admin
- **Logs d'activité** : historique des actions admin
- **Rapports** : synthèse + taux d'abonnés + export CSV
- **Paramètres** : coordonnées et titre du site

## Stack
Next.js 16 (App Router) · TypeScript · MariaDB 11.4 (`mysql2`) · migrations **Knex** · Stripe · bcrypt + JWT.

## Structure
```
db/migrations/        migrations Knex versionnées (ne jamais modifier une migration déjà poussée)
db/seeds/             données de démo (local uniquement)
scripts/              outils CLI : import db.json, création admin
src/app/              pages + routes API
src/lib/db.ts         accès MariaDB (seul fichier qui parle à la base)
src/lib/storage.ts    chemins des fichiers uploadés
storage/editions/     PDF des numéros (protégés, servis via /api/edition/[id])
storage/covers/       couvertures (servies via /api/cover/[id])
public/               images statiques du site
knexfile.cjs          configuration Knex
```

## Installation locale (nouveau poste)
1. Installer **MariaDB 11.4 LTS** (MSI Windows) et créer la base :
   ```sql
   CREATE DATABASE pointchablais_abo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. `cp .env.example .env.local` puis renseigner `DATABASE_URL`.
3. ```bash
   npm install
   npm run db:migrate
   npm run db:seed          # comptes de démo
   npm run dev              # http://localhost:3000
   ```

### Comptes de démo (après `db:seed`)
> **Administrateur** — `admin@pointchablais.ch` / `Admin2026` → `/admin`
> **Abonné (actif)** — `demo@pointchablais.ch` / `Chablais2026`

## Au quotidien
Après un `git pull`, **`npm run dev` suffit** : les migrations en attente sont appliquées automatiquement.

### Modifier la base
```bash
npm run db:make -- add_phone_to_users   # crée db/migrations/<date>_add_phone_to_users.cjs
# remplir up() et down(), puis :
npm run db:migrate
```
Committer la migration avec le code qui l'utilise.

### Commandes
| Commande | Rôle |
|---|---|
| `npm run db:migrate` | Applique les migrations en attente |
| `npm run db:status` | Migrations appliquées / en attente |
| `npm run db:rollback` | Annule le dernier lot |
| `npm run db:make -- nom` | Nouvelle migration |
| `npm run db:seed` | Données de démo (ignoré si `NODE_ENV=production`) |
| `npm run db:reset` | Local : tout effacer, re-migrer, re-seeder |
| `npm run db:import-json` | Import unique de l'ancien `data/db.json` (+ fichiers) |
| `npm run admin:create -- email "Nom"` | Crée / promeut un administrateur |
| `npm run typecheck` / `npm run lint` | Vérifications |

## Stripe (mode test)
- Sans clé → mode **simulé** (activation sans page de paiement, pour la démo).
- Avec `STRIPE_SECRET_KEY=sk_test_…` → vraie page Stripe (carte test `4242 4242 4242 4242`). En prod : `STRIPE_WEBHOOK_SECRET` + webhook sur `/api/webhook`.

## Déploiement Infomaniak (Node.js)
1. Créer la base MariaDB + un **utilisateur dédié** (Manager → Bases de données).
2. Variables d'environnement : `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, (`STORAGE_DIR`, Stripe, SMTP).
3. Première mise en ligne :
   ```bash
   npm ci
   npm run db:migrate
   npm run db:import-json                 # si reprise de l'ancien data/db.json
   npm run admin:create -- email "Nom"    # si besoin
   npm run build && npm run start
   ```
4. Déploiements suivants : `npm ci && npm run db:migrate && npm run build`, puis redémarrer.
5. `storage/` doit être **inscriptible** et **conservé** entre les déploiements.
6. Jamais `db:seed` ni `db:reset` en prod. Sauvegarde de la base avant chaque migration.

## À finaliser avant ouverture publique
- Prix réels (/admin → Packs) · vrais PDF (/admin → Numéros) · pages légales validées
- Stripe **live** + webhook (clés créées par le client)
- **SMTP** pour l'envoi réel des e-mails (campagnes + mot de passe oublié)
