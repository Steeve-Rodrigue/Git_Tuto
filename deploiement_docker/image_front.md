# Dockerfile multi-stage & publication sur ghcr.io

## Table des matières

1. [Prérequis](#prérequis)
2. [Dockerfile multi-stage](#dockerfile-multi-stage)
3. [Configuration Next.js](#configuration-nextjs)
4. [.dockerignore](#dockerignore)
5. [Publication sur ghcr.io](#publication-sur-ghcrio)
6. [Vérification](#vérification)

---

## Prérequis

- Docker installé sur ta machine
- Un compte GitHub
- Un projet Next.js avec `package.json` et `package-lock.json`

---

## Dockerfile multi-stage

Le multi-stage build permet de produire une image finale légère (~160MB) en séparant les étapes de build et d'exécution. Sans cette approche l'image finale dépasserait 1.5GB.

Crée un fichier `Dockerfile` à la racine de ton dossier `frontend/` :

```dockerfile
# ─────────────────────────────────────────
# STAGE 1 — Dépendances
# ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────
# STAGE 2 — Build
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─────────────────────────────────────────
# STAGE 3 — Runner (image finale)
# ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie uniquement ce qui est nécessaire pour tourner
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Rôle de chaque stage

| Stage | Rôle | Taille | Embarqué en prod |
|---|---|---|---|
| `deps` | Installe les dépendances npm | ~450MB | Non |
| `builder` | Compile le code Next.js | ~1.2GB | Non |
| `runner` | Fait tourner l'app | ~160MB | **Oui** |

Seul le stage `runner` finit dans l'image finale. Les deux premiers sont jetés après le build.

### Pourquoi `HOSTNAME="0.0.0.0"`

Sans cette variable, le serveur Node.js écoute sur `localhost` uniquement. En Kubernetes, le trafic ne peut pas atteindre le pod. `0.0.0.0` signifie "accepter les connexions depuis n'importe quelle interface".

### Pourquoi un utilisateur non-root

Par défaut Docker tourne en `root` dans le container. Si quelqu'un exploite une faille dans l'app, il obtient les droits root. L'utilisateur `nextjs` limite les dégâts.

---

## Configuration Next.js

Le stage `runner` dépend du dossier `.next/standalone` généré par Next.js. Sans cette configuration le dossier n'existe pas et le build Docker échoue.

Dans `next.config.ts` :

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

Vérifie que le build local génère bien le dossier :

```bash
npm run build
ls .next/standalone
# server.js   node_modules/   ...
```

---

## .dockerignore

Crée un fichier `.dockerignore` à la racine de `frontend/` pour éviter de copier des fichiers inutiles dans le stage builder :

```
node_modules
.next
.git
.env*.local
README.md
```

Sans ce fichier, Docker copie `node_modules` (500MB+) dans le stage builder avant de le réinstaller — ce qui ralentit inutilement le build.

---

## Publication sur ghcr.io

GitHub Container Registry (ghcr.io) est le registry Docker hébergé par GitHub. Il est gratuit, illimité, et s'intègre nativement avec GitHub Actions.

### Étape 1 — Créer un token GitHub

Va sur GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**

Coche uniquement :
```
✓ write:packages
✓ read:packages
```

Durée recommandée : **90 jours**. GitHub t'enverra un email avant l'expiration.

### Étape 2 — Se connecter au registry

```bash
echo TON_TOKEN | docker login ghcr.io -u TON_USERNAME --password-stdin
```

Résultat attendu :
```
Login Succeeded
```

> **Note :** Docker stocke le token dans `~/.docker/config.json`. Ne partage jamais ce fichier et ne le commite pas sur Git.

### Étape 3 — Build et push en une commande

```bash
docker buildx build \
  --platform linux/amd64 \
  --tag ghcr.io/TON_USERNAME/portfolio-frontend:latest \
  --push \
  .
```

Le flag `--platform linux/amd64` est important si tu développes sur un Mac M1/M2 (architecture ARM). Ton serveur de production tourne très probablement en `amd64` — sans ce flag l'image ne tournera pas dessus.

### Étape 4 — Rendre l'image publique

Par défaut l'image est privée. Pour la rendre publique :

GitHub → ton profil → **Packages** → `portfolio-frontend` → **Package settings** → **Change visibility** → **Public**

Si tu veux garder l'image privée, crée un pull secret Kubernetes :

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=TON_USERNAME \
  --docker-password=TON_TOKEN \
  -n portfolio
```

Puis référence ce secret dans ton `deployment.yaml` :

```yaml
spec:
  imagePullSecrets:
    - name: ghcr-secret
```

---

## Vérification

### Vérifier l'image en local avant de pusher

```bash
# Build sans push
docker build -t portfolio-frontend .

# Lancer en local
docker run -p 3000:3000 portfolio-frontend

# Vérifier la taille
docker images portfolio-frontend
```

### Vérifier que l'image est bien sur ghcr.io

```
https://github.com/TON_USERNAME?tab=packages
```

Tu dois voir `portfolio-frontend` dans la liste avec le tag `latest`.

### Tester l'image depuis le registry

```bash
# Supprimer l'image locale
docker rmi ghcr.io/TON_USERNAME/portfolio-frontend:latest

# La télécharger et la lancer depuis ghcr.io
docker run -p 3000:3000 ghcr.io/TON_USERNAME/portfolio-frontend:latest
```

---

## Renouveler le token à l'expiration

Quand le token expire, GitHub t'envoie un email automatique. Pour le renouveler :

1. GitHub → **Settings** → **Personal access tokens** → **Regenerate**
2. Mettre à jour le login local :

```bash
echo NOUVEAU_TOKEN | docker login ghcr.io -u TON_USERNAME --password-stdin
```

> Dans le pipeline GitHub Actions, le token utilisé est `GITHUB_TOKEN` — intégré automatiquement à chaque run, il n'expire jamais et ne nécessite aucune maintenance.