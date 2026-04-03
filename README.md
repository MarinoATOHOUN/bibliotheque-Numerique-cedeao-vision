# Bibliothèque Numérique CEDEAO - Vision 2050

![CEDEAO Logo](./CEDEAO.png)

Une plateforme de gestion électronique de documents moderne, sécurisée et élégante développée pour faciliter le stockage, le classement et la consultation des ressources de la CEDEAO (Communauté Économique des États de l'Afrique de l'Ouest).

## 🚀 Fonctionnalités Principales

- **Authentification & Sécurité** : 
  - Système de connexion robuste via JWT.
  - Gestion stricte des rôles : **ADMIN** (contrôle total), **USER** (upload et lecture), **LECTOR** (lecture seule).
  - _Protocole d'urgence_ (Backdoor) : En cas de perte totale d'accès, un compte défini via variables d'environnement permet une récupération forcée et hautement encadrée par le système, obligeant la création d'un compte humain.
- **Gestion Avancée des Fichiers** : 
  - Upload de tout type de fichiers (PDF, Word, Excel, images, etc.).
  - Signature de l'opérateur persistante (traçabilité de l'import, même si l'utilisateur est supprimé de la plateforme).
  - Stockage physique rationalisé et renommage sécurisé des fichiers sur le serveur.
- **Visualisation Intégrée (Liseuse Native)** : 
  - Visionneuse modale intégrée pour lire les PDF, images et fichiers texte sans quitter l'interface.
- **Catégorisation Dynamique** :
  - Création libre de dossiers (catégories) par l'administrateur.
  - Déplacement et tri des documents par simple attribution de catégorie.
- **Design UI/UX Premium** : 
  - Interface en _Glassmorphism_ élégante reposant sur Tailwind CSS.
  - Affichage asynchrone dynamique et animations fluides (micro-interactions).

## ⚙️ Stack Technique

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS, Axios.
- **Backend** : Node.js, Express, TypeScript, Multer, bcryptjs, JWT.
- **Base de données** : SQLite gérée via l'ORM Prisma.
- **Déploiement** : Prêt pour la production (Hébergement Fullstack Monorepo sur Fly.io via Dockerfile).

---

## 🛠️ Installation & Lancement en Local (Développement)

### 1. Prérequis
- [Node.js](https://nodejs.org/en/) (Version 18 ou supérieure recommandée)
- Git

### 2. Cloner le Projet
```bash
git clone <votre_depot>
cd bibliotheque-Numerique-cedeao-vision
```

### 3. Configuration du Backend
```bash
cd server
npm install

# Créer le fichier d'environnement .env basé sur l'exemple
cp .env.example .env
```

Dans votre fichier `.env` du backend, ajoutez les variables minimales :
```env
PORT=5000
DATABASE_URL="file:./dev.db"

JWT_SECRET="votre_cle_jwt_super_secrete"

EMERGENCY_ADMIN_EMAIL="adminbackdoor@cedeao.int"
EMERGENCY_ADMIN_PASSWORD="super-mot-de-passe-tres-long"
```

Initier la base de données et démarrer l'API :
```bash
npx prisma db push
npx prisma generate
npm run dev
```

### 4. Configuration du Frontend
Ouvrez un second terminal, placez-vous à la racine du projet :
```bash
npm install
npm run dev
```
L'application est maintenant accessible sur `http://localhost:5173`. 
_NB : L'outil Studio pour administrer la base de données brute peut être lancé via `npx prisma studio` dans le dossier backend._

---

## 🌍 Déploiement en Production (Sur Fly.io)

L'application est configurée pour fonctionner sous la forme d'un conteneur unique (Backend Node.js servant le Frontend React compilé) avec un **Volume de stockage persistant** afin de garantir la sauvegarde de la base de données SQLite et des fichiers uploadés par les utilisateurs à travers les redémarrages.

### Étapes de déploiement

1. **Installez Flyctl** sur votre machine : `curl -L https://fly.io/install.sh | sh`
2. **Connectez-vous** : `fly auth login`
3. Exécutez la configuration initiale dans le dossier principal du projet :
   ```bash
   fly launch --no-deploy
   ```
   *(Acceptez de copier la configuration `fly.toml` existante).*
4. Configurez vos secrèts de production dans Fly.io afin qu'ils ne soient pas exposés publiquement :
   ```bash
   fly secrets set EMERGENCY_ADMIN_EMAIL="adminbackdoor@cedeao.int" EMERGENCY_ADMIN_PASSWORD="votre_mot_de_passe" JWT_SECRET="une_cle_cryptographique_forte"
   ```
5. Lancez le déploiement. Fly va construire l'image Docker contenant à la fois Front et Back :
   ```bash
   fly deploy
   ```

*La base de données et le dossier d'uploads migreront de façon autonome dans le volume monté à la racine `/data` grâce à la configuration dynamique du logiciel.*

---

## 🔐 Architecture des Rôles

*   **ADMIN** : Gère les membres (ajouter/bannir), gère l'arbre des catégories, peut effacer publiquement des ressources. Un seul compte "Urgence" permet de recréer l'accès administrateur si l'état des membres est corrompu (en contournant le login habituel pour amener à l'interface _"Accès d'Urgence"_).
*   **USER** : Compte collaborateur classique. Peut transférer de nouveaux documents, lire, et télécharger le patrimoine de la base de données.
*   **LECTOR** : Accès minimum, capable de visualiser le catalogue, et lire les documents dans la liseuse native, mais incapable de les télécharger physiquement, restreignant complètement la diffusion non-autorisée des ressources.

---
_Note : Bien que ce README spécifie le protocole de déploiement et de reprise d'urgence, veillez à toujours conserver l'anonymisation du mot de passe de secours en dehors du code suivi par Git (via variables d'environnement sécurisées)._
