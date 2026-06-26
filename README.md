# 🏆 CHAD Homies Rankings

Le classement officiel du groupe — ELO, combats quotidiens, news et bien plus.

---

## Stack technique

- **Next.js 16** (App Router, Server Components)
- **TypeScript** + **Tailwind CSS v4**
- **Prisma v5** + **PostgreSQL**
- **NextAuth v5** (authentification)
- **Framer Motion** (animations)
- **Docker** (déploiement)

---

## Lancer le projet en développement

### Prérequis

- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/download/) **OU** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Étape 1 — Cloner et installer

```bash
git clone <url-du-repo>
cd chad-homies
npm install
```

### Étape 2 — Base de données

**Option A — Tu as Docker (recommandé, le plus simple) :**

```bash
# Lance uniquement PostgreSQL dans Docker
docker-compose -f docker-compose.dev.yml up -d
```

**Option B — Tu as PostgreSQL installé directement :**

Crée la base de données manuellement :
```sql
CREATE DATABASE chad_homies;
```

### Étape 3 — Variables d'environnement

```bash
cp .env.example .env.local
```

Ouvre `.env.local` et vérifie/adapte :
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/chad_homies"
AUTH_SECRET="une-clé-secrète-de-32-caractères-min"
```

### Étape 4 — Initialiser la base de données

```bash
# Crée les tables
npm run db:push

# Insère les données de démo
npm run db:seed
```

### Étape 5 — Lancer le serveur

```bash
npm run dev
```

Ouvre **http://localhost:3000** dans ton navigateur.

### Comptes de démo disponibles

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@chadhomies.fr | Admin1234! |
| Pierre | pierre@chadhomies.fr | Pierre1234! |
| Lucas | lucas@chadhomies.fr | Lucas1234! |
| Thomas | thomas@chadhomies.fr | Thomas1234! |
| (etc.) | prenom@chadhomies.fr | Prenom1234! |

---

## Commandes utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run db:push      # Synchronise le schéma Prisma → BDD
npm run db:migrate   # Crée une migration versionnée
npm run db:seed      # Insère les données de démo
npm run db:studio    # Interface graphique Prisma Studio
npm run db:reset     # Remet la BDD à zéro + reseed
npm run lint         # ESLint
```

---

## Déploiement (pour l'hébergeur)

### Avec Docker (recommandé)

```bash
# 1. Copier et remplir les variables d'environnement
cp .env.example .env

# Remplir obligatoirement :
#   DATABASE_URL    → connexion PostgreSQL
#   AUTH_SECRET     → clé secrète (openssl rand -base64 32)
#   NEXTAUTH_URL    → URL publique du site (ex: http://monserveur.com)

# 2. Lancer l'application
docker-compose up -d

# 3. Initialiser la base de données (première fois uniquement)
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

### Sans Docker

```bash
npm install
# Configurer .env.local
npm run build
npm run db:migrate
npm run start
```

---

## Architecture du projet

```
src/
├── app/              # Pages et API Routes (Next.js App Router)
│   ├── (auth)/       # Pages connexion/inscription
│   ├── (main)/       # Pages principales
│   ├── (admin)/      # Dashboard admin
│   └── api/          # API REST
├── components/       # Composants React réutilisables
├── lib/              # Utilitaires (prisma, auth, elo, cron...)
├── hooks/            # Hooks React personnalisés
├── schemas/          # Validation Zod
└── types/            # Types TypeScript
prisma/
├── schema.prisma     # Schéma base de données
└── seed.ts           # Données de démo
```
