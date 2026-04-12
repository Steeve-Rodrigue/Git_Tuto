# CI/CD — Push automatique de l'image Docker sur ghcr.io

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Structure du pipeline](#structure-du-pipeline)
4. [Le fichier workflow complet](#le-fichier-workflow-complet)
5. [Explication détaillée](#explication-détaillée)
6. [Résultat](#résultat)
7. [Erreurs fréquentes](#erreurs-fréquentes)

---

## Vue d'ensemble

A chaque push sur `main`, le pipeline GitHub Actions :

```
git push main
     │
     ▼
  ① Test          type-check + lint
     │  (échec = pipeline stoppé, rien n'est pushé)
     ▼
  ② Build & Push  docker build → ghcr.io
     │
     ▼
ghcr.io/TON_USERNAME/portfolio-frontend:latest
ghcr.io/TON_USERNAME/portfolio-frontend:sha-abc123
```

---

## Prérequis

### 1. Le script `type-check` dans `package.json`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
```

### 2. Aucun secret à configurer

Le pipeline utilise `GITHUB_TOKEN` — un token intégré automatiquement par GitHub Actions à chaque run. Pas besoin de créer de secret manuellement.

### 3. L'image ghcr.io doit être publique

Sur GitHub → ton profil → **Packages** → `portfolio-frontend` → **Package settings** → **Change visibility** → **Public**

---

## Structure du pipeline

```
.github/
└── workflows/
    └── frontend-ci.yml
```

Le fichier doit être dans `.github/workflows/` à la racine du projet — pas dans `frontend/`.

---

## Le fichier workflow complet

```yaml
name: Frontend CI

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'

env:
  IMAGE_NAME: portfolio-frontend

jobs:
  # ─────────────────────────────────────────
  # JOB 1 — Test
  # ─────────────────────────────────────────
  test:
    name: Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

  # ─────────────────────────────────────────
  # JOB 2 — Build & Push
  # ─────────────────────────────────────────
  build:
    name: Build & Push
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set lowercase owner
        run: echo "OWNER=$(echo ${{ github.repository_owner }} | tr '[:upper:]' '[:lower:]')" >> $GITHUB_ENV

      - name: Login to ghcr.io
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          platforms: linux/amd64
          push: true
          tags: |
            ghcr.io/${{ env.OWNER }}/${{ env.IMAGE_NAME }}:latest
            ghcr.io/${{ env.OWNER }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## Explication détaillée

### `on` — déclencheur

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
```

Le pipeline se déclenche uniquement quand :
- un push est fait sur `main`
- ET les fichiers modifiés sont dans `frontend/` ou le fichier CI lui-même

Sans `paths`, le pipeline tournerait à chaque push même si tu modifies le backend.

---

### `env` — variables globales

```yaml
env:
  IMAGE_NAME: portfolio-frontend
```

Défini une seule fois et réutilisé dans tout le pipeline. Si tu changes le nom de l'image, tu ne modifies qu'un seul endroit.

---

### Job `test`

| Step | Rôle |
|---|---|
| `Checkout` | Télécharge le code sur la machine virtuelle GitHub |
| `Setup Node` | Installe Node.js 20 avec cache npm |
| `Install dependencies` | `npm ci` — installation reproductible depuis le lock file |
| `Type check` | `tsc --noEmit` — vérifie les types TypeScript |
| `Lint` | `next lint` — vérifie la qualité du code |

Si un step échoue, le job `build` ne démarre pas.

---

### Job `build`

#### `needs: test`

```yaml
needs: test
```

Ce job attend que le job `test` soit terminé avec succès. Si les tests échouent, l'image n'est jamais buildée ni pushée sur ghcr.io.

#### `Set lowercase owner`

```yaml
- name: Set lowercase owner
  run: echo "OWNER=$(echo ${{ github.repository_owner }} | tr '[:upper:]' '[:lower:]')" >> $GITHUB_ENV
```

Convertit le username GitHub en minuscules. Docker exige des noms d'image en minuscules — sans cette étape le push échoue si ton username contient des majuscules.

```
Steeve-Rodrigue  →  tr '[:upper:]' '[:lower:]'  →  steeve-rodrigue
```

#### `Login to ghcr.io`

```yaml
uses: docker/login-action@v3
with:
  registry: ghcr.io
  username: ${{ github.actor }}
  password: ${{ secrets.GITHUB_TOKEN }}
```

Authentifie la machine virtuelle sur ghcr.io. `GITHUB_TOKEN` est généré automatiquement par GitHub à chaque run — aucun secret à créer manuellement.

#### `Build and push`

```yaml
context: ./frontend       →  dossier contenant le Dockerfile
platforms: linux/amd64    →  architecture du serveur de production
push: true                →  pousse sur ghcr.io après le build
tags: |
  ...latest               →  tag qui pointe toujours sur la dernière image
  ...sha-abc123           →  tag unique lié au commit Git
cache-from: type=gha      →  récupère le cache du run précédent
cache-to: type=gha,mode=max  →  sauvegarde le cache pour le prochain run
```

#### Les deux tags générés

```
ghcr.io/steeve-rodrigue/portfolio-frontend:latest      ←  se déplace à chaque push
ghcr.io/steeve-rodrigue/portfolio-frontend:sha-abc123  ←  permanent, lié au commit
```

Le tag SHA permet de savoir exactement quel commit correspond à quelle image en production, et de rollback facilement.

---

## Résultat

Après chaque push sur `main` qui touche au frontend :

```
github.com/TON_USERNAME?tab=packages
```

Tu verras l'image mise à jour avec deux tags :

```
latest      →  mis à jour
sha-abc123  →  nouveau tag ajouté
sha-def456  →  ancien tag toujours présent
```

---

## Erreurs fréquentes

### `Missing script: "type-check"`

```
npm error Missing script: "type-check"
```

Le script n'est pas dans `package.json`. Ajoute-le :

```json
"type-check": "tsc --noEmit"
```

### `invalid tag: repository name must be lowercase`

```
invalid tag "ghcr.io/Steeve-Rodrigue/..."
```

Le username contient des majuscules. Le step `Set lowercase owner` corrige ce problème — vérifie qu'il est bien présent dans ton fichier.

### Le pipeline ne se déclenche pas

Vérifie que les fichiers modifiés correspondent aux `paths` définis :

```yaml
paths:
  - 'frontend/**'                          ←  fichiers dans frontend/
  - '.github/workflows/frontend-ci.yml'   ←  le fichier CI lui-même
```

Si tu as modifié uniquement un fichier hors de ces chemins, le pipeline ne se déclenche pas. Force le déclenchement :

```bash
echo "# trigger" >> frontend/README.md
git add .
git commit -m "ci: trigger pipeline"
git push
```

### `denied: permission_denied`

L'image est privée sur ghcr.io. Rends-la publique :

GitHub → ton profil → **Packages** → `portfolio-frontend` → **Package settings** → **Change visibility** → **Public**