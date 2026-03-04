# 🚀 Guide de Déploiement SenRM GovStack

Guide complet pour déployer la plateforme SenRM en mode développement ou production.

## 📋 Table des Matières

1. [Modes de Communication](#modes-de-communication)
2. [Déploiement Développement](#déploiement-développement)
3. [Déploiement Production](#déploiement-production)
4. [Basculement Dev → Prod](#basculement-dev--prod)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Modes de Communication

SenRM supporte **deux modes** de communication entre Building Blocks:

### Mode 1: HTTP Direct (Développement)

```
┌──────────┐           ┌──────────┐
│ Payment  │ ─────────>│ Identity │
│    BB    │    HTTP   │    BB    │
└──────────┘           └──────────┘
```

**Avantages:**
- ✅ Simple et rapide
- ✅ Facile à déboguer
- ✅ Pas d'infrastructure supplémentaire
- ✅ Idéal pour développement local

**Inconvénients:**
- ❌ Pas de chiffrement inter-BB
- ❌ Pas d'audit centralisé
- ❌ Non conforme GovStack en production

**Configuration:**
```env
USE_IM_BB=false
IDENTITY_BB_URL=http://localhost:3000
PAYMENT_BB_URL=http://localhost:3001
```

### Mode 2: IM-BB avec X-Road (Production)

```
┌──────────┐           ┌─────────┐           ┌──────────┐
│ Payment  │──────────>│  IM-BB  │──────────>│ Identity │
│    BB    │  X-Road   │ (X-Road)│  X-Road   │    BB    │
└──────────┘           └─────────┘           └──────────┘
                            │
                            ↓
                      Audit Logs
                      Encryption
                      Signatures
```

**Avantages:**
- ✅ GovStack compliant
- ✅ Chiffrement + signatures
- ✅ Audit trail complet
- ✅ Service discovery
- ✅ Non-répudiation

**Inconvénients:**
- ❌ Infrastructure supplémentaire (IM-BB)
- ❌ Plus complexe
- ❌ Overhead de performance

**Configuration:**
```env
USE_IM_BB=true
IM_BB_URL=https://im-bb.senrm.gov.sn
IM_BB_CLIENT_ID=PAYMENT-BB
IM_BB_INSTANCE=SN/GOV/SENRM/PAYMENT-BB
```

---

## 🛠️ Déploiement Développement

### Prérequis

- Node.js 18+
- npm ou yarn
- Git

### Étape 1: Cloner le projet

```bash
git clone https://github.com/senrm/govstack.git
cd senrm
```

### Étape 2: Configuration environnement

```bash
# Copier le fichier de configuration dev
cp .env.development .env

# Vérifier le contenu
cat .env
```

**Vérifiez que:**
```env
USE_IM_BB=false  ← Mode HTTP direct
```

### Étape 3: Identity BB

```bash
cd identity-bb

# Installer les dépendances
npm install

# Générer le client Prisma
npm run prisma:generate

# Créer la base de données
npm run prisma:migrate

# Insérer les données de test
npm run prisma:seed

# Démarrer en mode dev
npm run start:dev
```

**Vérification:**
```bash
# Dans un nouveau terminal
curl http://localhost:3000/health

# Devrait retourner:
# {"status":"ok","buildingBlock":"IDENTITY-BB",...}
```

### Étape 4: Payment BB

```bash
# Nouveau terminal
cd payment-bb

# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env

# IMPORTANT: Vérifier la configuration
nano .env
```

**Dans `.env`, assurez-vous d'avoir:**
```env
USE_IM_BB=false
IDENTITY_BB_URL=http://localhost:3000
PORT=3001
```

```bash
# Générer Prisma
npm run prisma:generate

# Migrations
npm run prisma:migrate

# Seed
npm run prisma:seed

# Démarrer
npm run start:dev
```

**Vérification:**
```bash
curl http://localhost:3001/health

# Devrait afficher:
# ╔══════════════════════════════════════════════════════════╗
# ║       GovStack Payment Building Block (PAYMENT-BB)        ║
# ╚══════════════════════════════════════════════════════════╝
#
# 🚀  Server:      http://localhost:3001
# 📚  API Docs:    http://localhost:3001/api/docs
#
# Information Mediator Configuration
# ╠════════════════════════════════════════════════════╣
# ║  Mode: DIRECT                                       ║
# ║  Direct HTTP Communication (Development)           ║
# ╚════════════════════════════════════════════════════╝
```

### Étape 5: (Optionnel) API Gateway

```bash
cd api-gateway

# Démarrer avec Docker
docker-compose up -d

# Vérifier
curl http://localhost:8080/health
```

### Étape 6: Tester l'intégration

```bash
# 1. Login via Identity BB
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@senrm.gov.sn","password":"Admin123!"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Utiliser le token dans Payment BB
curl -X GET http://localhost:3001/api/transactions \
  -H "Authorization: Bearer $TOKEN"

# 3. Créer une transaction
curl -X POST http://localhost:3001/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "XOF",
    "paymentProviderId": "PROVIDER_ID",
    "description": "Test transaction"
  }'
```

**Si ça marche ✅:**
- Payment BB a appelé Identity BB directement
- Pas d'IM-BB impliqué
- Mode développement OK

---

## 🏭 Déploiement Production

### Prérequis

- Docker & Docker Compose
- Serveur Linux (Ubuntu 22.04 recommandé)
- Nom de domaine configuré
- Certificats SSL/TLS

### Architecture Production

```
Internet
   ↓
[api.senrm.gov.sn] → API Gateway (Nginx)
   ↓
   ├──> Identity BB (Container)
   ├──> Payment BB (Container)
   └──> Messaging BB (Container)
        ↓
   [im-bb.senrm.gov.sn] → Information Mediator (X-Road)
        ↓
   PostgreSQL Database
```

### Étape 1: Préparer le serveur

```bash
# Se connecter au serveur
ssh admin@server.senrm.gov.sn

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Vérifier
docker --version
docker compose version
```

### Étape 2: Cloner et configurer

```bash
# Cloner le projet
git clone https://github.com/senrm/govstack.git
cd senrm

# Copier la configuration production
cp .env.production .env

# Éditer la configuration
nano .env
```

**Configuration production critique:**

```env
# ============================
# MODE PRODUCTION
# ============================
USE_IM_BB=true  ← ACTIVER IM-BB
NODE_ENV=production

# ============================
# IM-BB Configuration
# ============================
IM_BB_URL=https://im-bb.senrm.gov.sn

# Identity BB
IDENTITY_BB_INSTANCE=SN/GOV/SENRM/IDENTITY-BB
IDENTITY_BB_CLIENT_ID=IDENTITY-BB

# Payment BB
PAYMENT_BB_INSTANCE=SN/GOV/SENRM/PAYMENT-BB
PAYMENT_BB_CLIENT_ID=PAYMENT-BB

# ============================
# Sécurité
# ============================
JWT_SECRET=CHANGEZ-CECI-SECRET-TRES-FORT-MIN-64-CHARS

# ============================
# Base de données
# ============================
DATABASE_URL_IDENTITY=postgresql://user:STRONG_PWD@postgres:5432/identity_prod
DATABASE_URL_PAYMENT=postgresql://user:STRONG_PWD@postgres:5432/payment_prod

# ============================
# URLs publiques
# ============================
API_GATEWAY_URL=https://api.senrm.gov.sn
FRONTEND_URL=https://app.senrm.gov.sn
```

### Étape 3: Déployer l'Information Mediator

```bash
cd im-bb

# Configuration IM-BB
cp .env.example .env
nano .env
```

```env
# IM-BB Production Config
XROAD_TOKEN_PIN=VOTRE_PIN_SECURISE
XROAD_ADMIN_PASSWORD=CHANGEZ_CECI
XROAD_DB_PWD=CHANGEZ_CECI
INSTANCE_IDENTIFIER=SN/GOV/SENRM
```

```bash
# Démarrer l'IM-BB
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Vérifier les logs
docker-compose logs -f xroad-security-server
```

**Accéder à l'interface admin:**
```
https://im-bb.senrm.gov.sn:8443
Username: xrd
Password: (celui dans .env)
```

### Étape 4: Déployer les Building Blocks

```bash
cd ..

# Créer le réseau Docker
docker network create govstack-network

# Démarrer PostgreSQL
docker-compose up -d postgres

# Démarrer Identity BB
docker-compose up -d identity-bb

# Démarrer Payment BB
docker-compose up -d payment-bb

# Vérifier tous les services
docker-compose ps
```

### Étape 5: Configurer l'API Gateway

```bash
cd api-gateway

# Vérifier la configuration Nginx
cat nginx.conf

# Démarrer
docker-compose up -d

# Tester
curl https://api.senrm.gov.sn/health
```

### Étape 6: Enregistrer les services dans l'IM-BB

```bash
# Depuis chaque BB, enregistrer dans l'IM-BB
cd payment-bb

curl -X POST https://im-bb.senrm.gov.sn:8080/api/registry \
  -H "Content-Type: application/yaml" \
  --data-binary @govstack-service-registry.yaml
```

### Étape 7: Vérifier l'intégration

```bash
# Vérifier les logs de l'IM-BB
docker-compose -f im-bb/docker-compose.yml logs -f

# Tester un appel inter-BB
# Les logs IM-BB devraient montrer:
# [X-Road] Message: PAYMENT-BB → IDENTITY-BB/api/users/me
```

---

## 🔄 Basculement Dev → Prod

### Méthode 1: Modification des fichiers .env

**Pour chaque BB (Identity, Payment, etc.):**

```bash
# 1. Éditer le fichier .env
cd identity-bb
nano .env

# 2. Changer USE_IM_BB
# AVANT:
USE_IM_BB=false

# APRÈS:
USE_IM_BB=true
IM_BB_URL=https://im-bb.senrm.gov.sn
IM_BB_CLIENT_ID=IDENTITY-BB
IM_BB_INSTANCE=SN/GOV/SENRM/IDENTITY-BB

# 3. Redémarrer le service
npm run start:prod
```

### Méthode 2: Variables d'environnement Docker

```bash
# docker-compose.yml
services:
  payment-bb:
    environment:
      - USE_IM_BB=true  ← Changer ici
      - IM_BB_URL=https://im-bb.senrm.gov.sn
      - IM_BB_CLIENT_ID=PAYMENT-BB
```

### Vérification du mode actif

Au démarrage, chaque BB affiche:

```
╔════════════════════════════════════════════════════╗
║  Information Mediator Configuration               ║
╠════════════════════════════════════════════════════╣
║  Mode: IM-BB                          ← ICI      ║
║  Client: PAYMENT-BB                                ║
║  IM-BB URL: https://im-bb.senrm.gov.sn            ║
╚════════════════════════════════════════════════════╝
```

---

## 🆘 Troubleshooting

### Problème: BBs ne trouvent pas l'IM-BB

**Symptômes:**
```
Error: connect ECONNREFUSED im-bb.senrm.gov.sn:8080
```

**Solutions:**
```bash
# 1. Vérifier que l'IM-BB tourne
docker-compose -f im-bb/docker-compose.yml ps

# 2. Vérifier la connectivité réseau
ping im-bb.senrm.gov.sn
curl http://im-bb.senrm.gov.sn:8080/

# 3. Vérifier la configuration DNS
nslookup im-bb.senrm.gov.sn

# 4. Vérifier les variables d'environnement
docker-compose config | grep IM_BB_URL
```

### Problème: Mode non reconnu

**Symptômes:**
```
Mode: DIRECT (mais devrait être IM-BB)
```

**Solutions:**
```bash
# Vérifier USE_IM_BB
cat .env | grep USE_IM_BB

# Doit être exactement:
USE_IM_BB=true

# PAS:
# USE_IM_BB="true"  ❌
# USE_IM_BB=TRUE    ❌
# USE_IM_BB=1       ❌
```

### Problème: X-Road headers manquants

**Symptômes:**
```
[IM-BB] Error: Missing X-Road-Client header
```

**Solutions:**
```bash
# Vérifier ImBbService génère bien les headers
# Dans payment-bb/src/common/im-bb/im-bb.service.ts

# Les headers doivent inclure:
# - X-Road-Client
# - X-Road-Service
# - X-Road-Id
# - X-Road-UserId
```

---

## 📊 Tableau Récapitulatif

| Aspect | Développement | Production |
|--------|---------------|------------|
| **USE_IM_BB** | `false` | `true` |
| **Communication** | HTTP direct | Via IM-BB (X-Road) |
| **Base de données** | SQLite (fichier) | PostgreSQL |
| **URLs** | `localhost:3000` | `https://api.senrm.gov.sn` |
| **Sécurité** | JWT seulement | JWT + X-Road signing + TLS |
| **Audit** | Logs locaux | IM-BB centralisé |
| **Infrastructure** | 2 BBs | 2 BBs + IM-BB + API Gateway |
| **Complexité** | Simple | Complexe |
| **GovStack Compliant** | ❌ | ✅ |

---

## ✅ Checklist de Déploiement

### Développement

- [ ] Node.js installé
- [ ] Identity BB démarre sur :3000
- [ ] Payment BB démarre sur :3001
- [ ] `USE_IM_BB=false` dans tous les .env
- [ ] Login fonctionne
- [ ] Payment BB peut appeler Identity BB
- [ ] Swagger accessible

### Production

- [ ] Serveur Linux préparé
- [ ] Docker installé
- [ ] Domaines DNS configurés
- [ ] Certificats SSL valides
- [ ] `USE_IM_BB=true` dans tous les .env
- [ ] IM-BB démarré et accessible
- [ ] PostgreSQL configuré
- [ ] BBs démarrés
- [ ] API Gateway configuré
- [ ] Services enregistrés dans IM-BB
- [ ] Tests inter-BB OK
- [ ] Monitoring actif (Prometheus/Grafana)
- [ ] Backups configurés

---

**Besoin d'aide ?**
- Documentation: `/docs`
- Issues: https://github.com/senrm/govstack/issues
- Contact: dev@senrm.gov.sn

