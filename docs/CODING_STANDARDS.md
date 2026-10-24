# Règles de codage — City Groom

> **Statut** : en vigueur · **Dernière mise à jour** : 2026-10-24
>
> Ce document est la référence pour tout code écrit sur ce projet, qu'il soit
> écrit par un humain ou par un assistant IA. Toute dérogation doit être
> justifiée dans la PR concernée, et toute évolution de ces règles passe par une
> PR dédiée.

## Sommaire

1. [Principe fondateur : la documentation n'est pas optionnelle](#1-principe-fondateur--la-documentation-nest-pas-optionnelle)
2. [Ce qu'il faut documenter, et où](#2-ce-quil-faut-documenter-et-où)
3. [Documentation dans le code](#3-documentation-dans-le-code)
4. [Langues](#4-langues)
5. [Style et qualité du code](#5-style-et-qualité-du-code)
6. [Architecture et organisation](#6-architecture-et-organisation)
7. [Tests](#7-tests)
8. [Sécurité et données](#8-sécurité-et-données)
9. [Démo aujourd'hui, production demain](#9-démo-aujourdhui-production-demain)
10. [Définition de « terminé »](#10-définition-de--terminé-)

---

## 1. Principe fondateur : la documentation n'est pas optionnelle

Ce projet démarre comme une démonstration mais **doit pouvoir servir de base à la
production**. Le code sera relu, repris et maintenu par des personnes (et des
outils) qui n'auront pas le contexte de son écriture. On documente donc
**en même temps** qu'on code, jamais « plus tard ».

Règles non négociables :

- **Aucune PR n'est mergée si la documentation n'est pas à jour.** Une
  fonctionnalité non documentée est une fonctionnalité non terminée.
- **On documente le *pourquoi*, pas seulement le *quoi*.** Le code dit ce qu'il
  fait ; la documentation dit pourquoi il le fait ainsi, quelles alternatives
  ont été écartées et quelles contraintes s'appliquent.
- **Toute décision structurante fait l'objet d'un ADR** (Architecture Decision
  Record, voir [`docs/adr/`](adr/)). Choix de framework, de stockage, de mode
  d'authentification, de stratégie hors-ligne… : si on peut se demander dans six
  mois « pourquoi a-t-on fait ça ? », c'est un ADR.
- **Le `CHANGELOG.md` est mis à jour à chaque PR** qui modifie un comportement
  visible (utilisateur, API, configuration, build).
- **La documentation obsolète est un bug.** Si on modifie un comportement, on
  corrige la doc qui le décrit dans la même PR.

## 2. Ce qu'il faut documenter, et où

| Quoi | Où | Quand |
|---|---|---|
| Présentation, installation, lancement | `README.md` | Dès qu'une étape change |
| Workflow Git, commits, PR, revue | `CONTRIBUTING.md` | Quand le process évolue |
| Règles de codage | `docs/CODING_STANDARDS.md` (ce fichier) | Par PR dédiée |
| Décisions d'architecture | `docs/adr/NNNN-titre.md` | Avant ou pendant l'implémentation |
| Architecture d'ensemble (schémas, modules, flux) | `docs/ARCHITECTURE.md` | Dès que la structure existe, puis à chaque évolution |
| Historique des changements | `CHANGELOG.md` | À chaque PR |
| Contrat d'API consommé (endpoints, payloads, erreurs) | `docs/api/` | Dès qu'un endpoint est consommé |
| Build, signature APK, déploiement web | `docs/BUILD_AND_RELEASE.md` | Dès le premier build distribué |
| Variables d'environnement | `.env.example` (commenté) + README | Dès qu'une variable est ajoutée |
| API publique d'un module, composant, fonction | Docstrings / JSDoc / TSDoc dans le code | Toujours |
| Logique non évidente, contournements, dette | Commentaires dans le code | Toujours |
| Instructions pour l'assistant IA | `CLAUDE.md` | Quand une convention change |

## 3. Documentation dans le code

### 3.1 En-tête de fichier

Chaque fichier source non trivial commence par un bloc qui explique son rôle
dans l'application et ses dépendances principales.

```ts
/**
 * @file Store Pinia gérant la session utilisateur (connexion, jetons, profil).
 *
 * Les jetons sont persistés via le stockage sécurisé natif sur Android
 * (Android Keystore, via un plugin Capacitor dédié) et via sessionStorage sur
 * la version web.
 * Voir ADR-0004 pour le choix de cette stratégie.
 */
```

### 3.2 Fonctions, composables, services

Toute fonction **exportée** est documentée (TSDoc) : rôle, paramètres, valeur de
retour, erreurs levées, effets de bord, et un exemple si l'usage n'est pas
évident.

```ts
/**
 * Récupère les prestations disponibles autour d'une position.
 *
 * @param position - Coordonnées GPS de l'utilisateur.
 * @param radiusKm - Rayon de recherche en kilomètres (défaut : 5, max : 50).
 * @returns Liste des prestations triées par distance croissante.
 * @throws {ApiError} Si l'API répond avec un statut >= 400.
 * @throws {NetworkError} Si l'appareil est hors-ligne.
 *
 * @example
 * const services = await fetchNearbyServices({ lat: 48.85, lng: 2.35 }, 10)
 */
export async function fetchNearbyServices(position: GeoPoint, radiusKm = 5): Promise<Service[]> {
  // ...
}
```

### 3.3 Composants Vue

Chaque composant documente en tête de `<script setup>` :

- son rôle et l'écran / le contexte où il est utilisé ;
- ses `props` (chaque prop a un commentaire TSDoc) ;
- ses `emits` (quand et avec quelle charge utile) ;
- ses `slots` le cas échéant ;
- les dépendances natives (caméra, géolocalisation…) et leur comportement sur web.

### 3.4 Commentaires en ligne

- Un commentaire explique **pourquoi**, jamais une paraphrase du code.
- Les contournements de bugs (plateforme, librairie) citent la source (issue,
  doc) et la condition de suppression.
- Marqueurs normalisés, toujours avec contexte :
  - `TODO(#issue):` travail prévu, lié à une issue GitHub ;
  - `FIXME(#issue):` comportement incorrect connu ;
  - `HACK:` contournement assumé, avec la raison ;
  - `PROD:` point à traiter **impérativement** avant une mise en production
    (voir §9).

```ts
// ❌ Incrémente le compteur
retryCount++

// ✅ Android met parfois l'app en veille pendant la requête : on retente une fois
//    avant d'afficher l'erreur. Voir https://github.com/ionic-team/capacitor/issues/XXXX
retryCount++
```

## 4. Langues

| Élément | Langue |
|---|---|
| Identifiants (variables, fonctions, classes, fichiers) | Anglais |
| Commentaires et docstrings dans le code | Anglais |
| Messages de commit | Anglais (Conventional Commits) |
| Documentation du dépôt (`README`, `docs/`, ADR) | Français |
| Titres et descriptions de PR / issues | Français |
| Textes affichés à l'utilisateur | Jamais en dur : passés par l'i18n (FR par défaut) |

> Les exemples de commentaires en français dans ce document sont là pour la
> lisibilité ; dans le code, ils sont rédigés en anglais.

## 5. Style et qualité du code

- **TypeScript en mode `strict`**. `any` interdit sauf justification en
  commentaire (`// eslint-disable-next-line` + raison).
- **Formatage automatique** (Prettier) et **lint** (ESLint + règles Vue) :
  aucun débat de style en revue, l'outil tranche. Le code poussé passe le lint
  sans avertissement.
- **Vue 3 Composition API** avec `<script setup lang="ts">` exclusivement.
- **Nommage** :
  - composants : `PascalCase`, nom composé d'au moins deux mots (`ServiceCard.vue`) ;
  - composables : `useXxx` (`useGeolocation.ts`) ;
  - stores Pinia : `useXxxStore` ;
  - constantes : `UPPER_SNAKE_CASE` ;
  - booléens : préfixe `is`, `has`, `can`, `should`.
- **Fonctions courtes et à responsabilité unique.** Au-delà d'environ 40 lignes
  ou 3 niveaux d'imbrication, on découpe.
- **Pas de nombres ni de chaînes magiques** : constantes nommées et documentées.
- **Pas de code mort ni de code commenté** dans les PR : Git garde l'historique.
- **Gestion d'erreurs explicite** : aucune promesse non gérée, aucun `catch`
  vide. Toute erreur est soit traitée, soit remontée avec du contexte, et
  l'utilisateur reçoit un message compréhensible.

## 6. Architecture et organisation

La stack précise est arrêtée dans
[ADR-0002](adr/0002-choix-stack-mobile.md). Principes indépendants de la stack :

- **Séparation des couches** : écrans (`views/`) → composants (`components/`)
  → logique (`composables/`, `stores/`) → accès aux données (`services/api/`).
  Un composant ne fait jamais d'appel HTTP directement.
- **Abstraction des fonctionnalités natives** : tout accès au matériel
  (caméra, GPS, notifications, stockage sécurisé) passe par un service dédié
  qui gère la différence Android / navigateur. Le reste de l'app ignore sur
  quelle plateforme elle tourne.
- **Configuration par environnement** : aucune URL, clé ou option en dur ;
  tout passe par des variables d'environnement documentées dans `.env.example`.
- **Le contrat d'API est typé** : les types des payloads échangés avec le backend
  (Django REST) sont définis à un seul endroit et, à terme, générés depuis le
  schéma OpenAPI du backend.

## 7. Tests

- **Tests unitaires** (Vitest) pour la logique : composables, stores, services,
  utilitaires. Tout correctif de bug s'accompagne d'un test qui le reproduit.
- **Tests de composants** (Vue Test Utils) pour les composants à logique.
- **Tests de bout en bout** (Playwright sur la version web) pour les parcours
  critiques, à mettre en place dès que l'app a un premier parcours complet.
- Les tests sont lancés en CI sur chaque PR ; une PR rouge n'est pas mergée.
- Pas d'objectif de couverture chiffré au stade démo, mais **toute logique
  métier est testée**.

## 8. Sécurité et données

- **Aucun secret dans le dépôt** (clés API, keystore Android, mots de passe).
  Le keystore de signature APK est conservé hors dépôt et sauvegardé : le perdre
  empêche toute mise à jour de l'app publiée.
- Rien ne doit être considéré comme secret côté client : une app mobile ou web
  se décompile. Les vraies clés restent côté backend.
- Jetons d'authentification : stockage sécurisé natif sur Android, jamais en
  `localStorage` en clair pour la production.
- Communications exclusivement en HTTPS.
- Données personnelles (localisation, identité) : on documente pour chacune
  pourquoi elle est collectée, où elle est stockée et combien de temps
  (préparation RGPD).
- Les dépendances sont auditées (`npm audit`) avant chaque release.

## 9. Démo aujourd'hui, production demain

Pour avancer vite sur la démo sans compromettre la future production :

- Les raccourcis sont **autorisés s'ils sont visibles** : chaque raccourci est
  marqué `// PROD: <ce qu'il faut faire>` dans le code.
- `grep -rn "PROD:" src/` doit donner la liste exhaustive de ce qui reste à
  faire avant la mise en production. Cette liste est revue à chaque release.
- Les données factices (mocks, fixtures) sont isolées dans un dossier dédié et
  activées par une variable d'environnement, jamais mélangées au code réel.
- On ne prend **jamais** de raccourci sur : la structure du projet, le typage,
  la gestion des secrets, la documentation.

## 10. Définition de « terminé »

Une tâche est terminée quand **toutes** ces cases sont cochées :

- [ ] Le code respecte ce document et passe lint, format et typecheck.
- [ ] Les tests pertinents sont écrits et passent.
- [ ] Les fonctions / composants exportés sont documentés (TSDoc).
- [ ] Le `README` et les docs concernées sont à jour.
- [ ] Un ADR est rédigé si une décision structurante a été prise.
- [ ] Le `CHANGELOG.md` est mis à jour.
- [ ] Les raccourcis de démo sont marqués `PROD:`.
- [ ] Le comportement a été vérifié sur la version web **et** sur Android
      (émulateur ou appareil) lorsque le changement touche à l'interface ou au
      natif.
- [ ] La PR est relue et approuvée.
