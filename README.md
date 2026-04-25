# Système d'Archivage

Une application complète de gestion d'archivage pour les projets, documents, et unités administratives.

## 🚀 Fonctionnalités

- **Tableau de Bord** : Statistiques en temps réel sur les projets et documents.
- **Gestion des Projets** : Suivi détaillé des projets (stade, montant, intervenants).
- **Gestion Electronique des Documents (GED)** : Archivage, versions, et catégories.
- **Gestion des Unités** : Organisation par Région, CMD, et Unité.
- **Authentification Sécurisée** : Rôles (Admin, Chef de Projet).
- **Backend Flexible** : Support local (SQLite) ou production (PostgreSQL).

## 🛠️ Structure du Projet

Le projet est structuré comme un monorepo utilisant **pnpm** :

- `artifacts/archivage-app` : Frontend (React + Vite + Tailwind CSS).
- `artifacts/api-server` : Backend (Node.js + Express + Drizzle ORM).
- `lib/` : Bibliothèques partagées (Zod schemas, DB utils).

## 💻 Installation Locale

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)

### Étapes d'installation

1. **Cloner le projet** :
   ```bash
   git clone <votre-repo-url>
   cd Sys-d-archi--main
   ```

2. **Installer les dépendances** :
   ```bash
   pnpm install
   ```

3. **Lancer en mode développement** :
   Vous pouvez utiliser le script fourni (Windows) :
   ```bash
   .\run-dev.bat
   ```
   Ou manuellement via pnpm :
   ```bash
   pnpm dev
   ```

## 📝 Configuration (Production)

Pour la production, créez un fichier `.env` à la racine :

```env
DATABASE_URL=postgres://user:password@localhost:5432/dbname
SESSION_SECRET=votre_secret_tres_long
PORT=8080
NODE_ENV=production
```

## 📄 Licence

Ce projet est sous licence MIT.
