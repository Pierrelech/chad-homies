# Guide de déploiement — CHAD Homies Rankings

## Prérequis

- **Node.js 20+** → https://nodejs.org
- **PostgreSQL 14+** (base de données)
- **Git**
- Un domaine ou une IP publique

---

## 1. Cloner le projet

```bash
git clone <url-du-repo> chad-homies
cd chad-homies
npm install
```

---

## 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvre `.env` et remplis **au minimum** ces valeurs :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (voir ci-dessous) |
| `AUTH_SECRET` | Clé secrète aléatoire (voir ci-dessous) |
| `APP_URL` | URL publique du site, ex: `https://chad.monsite.com` |
| `NEXTAUTH_URL` | Même valeur que `APP_URL` |
| `DISCORD_CLIENT_ID` | Client ID de l'app Discord |
| `DISCORD_CLIENT_SECRET` | Secret de l'app Discord |

**Générer `AUTH_SECRET` :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Format `DATABASE_URL` :**
```
postgresql://UTILISATEUR:MOT_DE_PASSE@localhost:5432/chad_homies
```

---

## 3. Créer la base de données PostgreSQL

```bash
# Connecte-toi à PostgreSQL
psql -U postgres

# Crée la base
CREATE DATABASE chad_homies;
\q
```

Puis applique le schéma :
```bash
npx prisma db push
```

---

## 4. Configurer Discord OAuth

1. Va sur https://discord.com/developers/applications
2. Ouvre ton application Discord (ou crée-en une)
3. Onglet **OAuth2** → **Redirects**
4. Ajoute l'URL : `https://ton-domaine.com/api/auth/discord/callback`
5. Sauvegarde

> Si tu utilises la même app Discord qu'en dev, garde l'ancienne URL localhost **et** ajoute la nouvelle URL de production — les deux peuvent coexister.

---

## 5. Build et lancement

```bash
npm run build
npm start
```

L'application tourne sur le port **3000** par défaut.

---

## 6. Rester en ligne avec PM2 (recommandé)

PM2 garde l'application active même après un redémarrage du serveur.

```bash
npm install -g pm2

pm2 start npm --name "chad-homies" -- start
pm2 save
pm2 startup   # Suit les instructions affichées pour démarrer au boot
```

Commandes utiles :
```bash
pm2 status          # Voir l'état
pm2 logs chad-homies  # Voir les logs
pm2 restart chad-homies  # Redémarrer
```

---

## 7. Reverse proxy Nginx (recommandé)

Pour exposer le site sur le port 80/443 :

```nginx
server {
    listen 80;
    server_name ton-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Pour HTTPS avec Let's Encrypt :
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.com
```

---

## 8. Créer le premier Super Admin

Après le déploiement, connecte-toi avec Discord. Puis passe ton compte en `SUPER_ADMIN` directement en base :

```bash
npx prisma studio
```

Ouvre le navigateur sur `http://localhost:5555`, trouve ton utilisateur dans la table `User` et change le champ `role` en `SUPER_ADMIN`.

**Ou via SQL :**
```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE username = 'ton-username';
```

Une fois Super Admin, tu peux gérer les rôles des autres membres depuis l'interface d'administration du site.

---

## 9. Données de démonstration (optionnel)

Pour peupler la base avec des données de test :
```bash
npm run db:seed
```

> **Attention :** Le seed crée des utilisateurs fictifs. Ne l'utilise pas en production si tu veux partir d'une base propre.

---

## Variables d'environnement complètes

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/chad_homies"
AUTH_SECRET="ta-cle-secrete-generee"
APP_URL="https://ton-domaine.com"
NEXTAUTH_URL="https://ton-domaine.com"
DISCORD_CLIENT_ID="ton-client-id"
DISCORD_CLIENT_SECRET="ton-client-secret"
NODE_ENV="production"
```

---

## Commandes utiles

```bash
npm run build          # Build de production
npm start              # Lancer en production
npm run db:push        # Appliquer les changements de schéma
npm run db:studio      # Interface graphique pour la BDD
```
