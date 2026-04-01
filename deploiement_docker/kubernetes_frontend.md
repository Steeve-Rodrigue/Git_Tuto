# Déploiement d'un frontend Next.js sur Kubernetes

## Table des matières

1. [Prérequis](#prérequis)
2. [Architecture](#architecture)
3. [Les fichiers Kubernetes](#les-fichiers-kubernetes)
4. [ConfigMap](#1-configmap)
5. [Deployment](#2-deployment)
6. [Service](#3-service)
7. [Ingress](#4-ingress)
8. [Déploiement](#déploiement)
9. [Vérification](#vérification)
10. [Erreurs fréquentes](#erreurs-fréquentes)

---

## Prérequis

- Une image Docker pushée sur ghcr.io (publique)
- `kubectl` installé et configuré
- Un cluster Kubernetes accessible (SSPCloud, k3s, etc.)

Vérifie que kubectl est bien connecté au cluster :

```bash
kubectl get nodes
```

---

## Architecture

```
Navigateur
    │  https://portfolio-frontend.lab.sspcloud.fr
    ▼
Ingress (Nginx)          ←  ingress.yaml
    │  / → portfolio-frontend-svc:80
    ▼
Service                  ←  service.yaml
    │  :80 → :3000
    ▼
Pod (Next.js)            ←  deployment.yaml
    │  variables injectées
    ▼
ConfigMap                ←  configmap.yaml
    NODE_ENV, PORT...
```

---

## Les fichiers Kubernetes

```
k8s/
└── frontend/
    ├── configmap.yaml
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

---

## 1. ConfigMap

Le ConfigMap stocke les variables d'environnement non sensibles. C'est l'équivalent d'un fichier `.env` géré par Kubernetes.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: portfolio-frontend-config
data:
  NODE_ENV: "production"
  NEXT_TELEMETRY_DISABLED: "1"
  PORT: "3000"
  HOSTNAME: "0.0.0.0"
  NEXT_PUBLIC_API_URL: "https://portfolio-backend.lab.sspcloud.fr"
  NEXT_PUBLIC_R_API_URL: "https://portfolio-r-service.lab.sspcloud.fr"
```

### Rôle de chaque variable

| Variable | Rôle |
|---|---|
| `NODE_ENV` | Active les optimisations de production Next.js |
| `NEXT_TELEMETRY_DISABLED` | Désactive l'envoi de données à Vercel |
| `PORT` | Port d'écoute du serveur Next.js |
| `HOSTNAME` | `0.0.0.0` obligatoire pour que Kubernetes puisse router le trafic |
| `NEXT_PUBLIC_API_URL` | URL du backend FastAPI — accessible côté navigateur |
| `NEXT_PUBLIC_R_API_URL` | URL du service R Plumber — accessible côté navigateur |

> **Règle Next.js** : les variables préfixées `NEXT_PUBLIC_` sont exposées au navigateur. Ne jamais y mettre de secrets.

---

## 2. Deployment

Le Deployment dit à Kubernetes de lancer et maintenir les pods en vie. Si un pod tombe, Kubernetes en recrée un automatiquement.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portfolio-frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: portfolio-frontend
  template:
    metadata:
      labels:
        app: portfolio-frontend
    spec:
      containers:
        - name: portfolio-frontend
          image: ghcr.io/TON_USERNAME/portfolio-frontend:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: portfolio-frontend-config
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
```

### Rôle de chaque partie

| Champ | Rôle |
|---|---|
| `replicas` | Nombre de pods à maintenir en vie |
| `selector.matchLabels` | Identifie les pods appartenant à ce Deployment |
| `image` | Image Docker à télécharger depuis ghcr.io |
| `containerPort` | Port sur lequel Next.js écoute dans le container |
| `envFrom.configMapRef` | Injecte toutes les variables du ConfigMap |
| `resources.requests` | Ressources réservées par Kubernetes pour ce pod |
| `resources.limits` | Maximum que le pod peut consommer |

### Les ressources

```
requests  →  ce que Kubernetes réserve sur un noeud
limits    →  le maximum consommable (dépassé = pod tué et redémarré)

128Mi     =  128 mégaoctets RAM
100m      =  0.1 coeur CPU  (1000m = 1 coeur complet)
```

---

## 3. Service

Le Service fournit une adresse stable pour accéder aux pods. L'IP d'un pod change à chaque redémarrage — le Service reste toujours à la même adresse.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: portfolio-frontend-svc
spec:
  selector:
    app: portfolio-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

### Rôle de chaque partie

| Champ | Rôle |
|---|---|
| `metadata.name` | Nom stable référencé par l'Ingress |
| `selector.app` | Identifie les pods vers lesquels rediriger le trafic |
| `port` | Port exposé en interne dans le cluster |
| `targetPort` | Port réel du container Next.js |

```
Requête entrante  →  Service (port 80)  →  Pod (port 3000)
```

> Le Service expose le pod **uniquement en interne** dans le cluster. C'est l'Ingress qui expose vers internet.

---

## 4. Ingress

L'Ingress est le point d'entrée depuis internet. Il reçoit les requêtes HTTP et les redirige vers le bon Service selon l'URL.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portfolio-frontend-ingress
spec:
  ingressClassName: nginx
  rules:
    - host: portfolio-frontend.lab.sspcloud.fr
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: portfolio-frontend-svc
                port:
                  number: 80
```

### Rôle de chaque partie

| Champ | Rôle |
|---|---|
| `ingressClassName` | Utilise Nginx comme contrôleur d'Ingress |
| `host` | URL publique de ton frontend |
| `path: /` | Toutes les URLs du site sont concernées |
| `pathType: Prefix` | Toute URL commençant par `/` est routée ici |
| `service.name` | Doit correspondre exactement au `metadata.name` du Service |
| `service.port` | Doit correspondre au `port` du Service |

> **Note** : l'annotation `kubernetes.io/ingress.class: nginx` est dépréciée. Utilise `spec.ingressClassName: nginx` à la place.

---

## Déploiement

### Appliquer tous les fichiers en une commande

```bash
kubectl apply -f k8s/frontend/
```

Kubernetes crée les ressources dans l'ordre : ConfigMap → Deployment → Service → Ingress.

### Vérifier le déploiement

```bash
# Vérifier les pods
kubectl get pods

# Vérifier le service
kubectl get svc

# Vérifier l'ingress
kubectl get ingress
```
