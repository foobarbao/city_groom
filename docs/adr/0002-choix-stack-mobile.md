# ADR-0002 — Choix de la stack technique

- **Statut** : Accepté
- **Date** : 2026-10-24 (révisé le même jour après précision du besoin)

## Contexte

- **Besoin** : une application de démonstration centrée sur une **carte réelle
  de Grenoble**, affichant des **casiers connectés simulés** répartis dans la
  ville et rattachés à des **services proposés par des commerces réels**. La
  démo doit contenir un maximum de données réelles (cartographie, commerces).
- La démo doit être diffusée facilement à des testeurs, puis servir de base à
  une version de production.
- Cible : Android (APK) ; une version web installable facilite la diffusion
  (un lien suffit, y compris sur iPhone).
- Le développeur principal est expert **Vue.js** et **Django REST**, sans
  expérience mobile.
- Le cœur du produit est **géographique** : recherche par proximité, rayon,
  zones, itinéraires vers un casier. Le stockage et les requêtes spatiales
  sont donc un critère de choix majeur.
- La stack a été laissée au choix de l'assistant, avec pour critère « la plus
  pertinente pour le projet ».

## Options envisagées

### Application

1. **Vue 3 + Ionic + Capacitor** — Réutilise directement les compétences Vue.
   Un seul code produit une PWA et un APK (et iOS plus tard). Ionic fournit une
   navigation au comportement mobile (transitions, bouton retour Android).
   Capacitor donne accès au natif (GPS, notifications, scan de QR code pour
   ouvrir un casier) avec repli web. Une carte web (MapLibre) y fonctionne
   telle quelle.
2. **Vue 3 + Quasar + Capacitor** — Mêmes atouts, navigation moins « native »
   par défaut.
3. **Flutter / React Native** — Rendu plus natif, mais nouveau langage ou
   framework à apprendre, version web moins mature ou plus coûteuse, et
   intégration cartographique distincte entre web et mobile.
4. **Kotlin natif** — Pas de version web, pas d'iOS, courbe d'apprentissage
   maximale.

### Carte

1. **MapLibre GL JS + tuiles vectorielles OpenStreetMap** — Open source, sans
   clé ni compte, rendu vectoriel fluide (zoom, rotation), styles
   personnalisables. Données OSM très riches à Grenoble.
2. **Leaflet + tuiles raster** — Plus simple, mais rendu raster moins fluide
   sur mobile et moins personnalisable.
3. **Google Maps / Mapbox** — Excellents, mais compte, clé et facturation à
   l'usage ; dépendance commerciale dès la démo.

### Backend

1. **Django REST Framework + GeoDjango + PostgreSQL/PostGIS** — Compétence
   existante. GeoDjango et PostGIS offrent nativement les requêtes spatiales
   (distance, rayon, polygones) et `djangorestframework-gis` sérialise en
   GeoJSON, directement consommable par MapLibre. L'admin Django donne
   gratuitement un back-office (gestion des casiers, commerces, services).
   Le simulateur de casiers peut tourner en tâche planifiée côté serveur.
2. **Pas de backend (données statiques JSON dans l'app)** — Plus rapide pour
   une maquette, mais tout serait à refaire pour la production (état des
   casiers, réservations, comptes).
3. **BaaS (Firebase, Supabase)** — Rapide, mais compétence à acquérir et
   dépendance à un fournisseur pour la production.

## Décision

| Couche | Choix |
|---|---|
| Application | **Vue 3 + TypeScript + Ionic Vue + Capacitor**, bâti avec **Vite** |
| État, routage, i18n | Pinia, Vue Router (via Ionic), vue-i18n |
| Carte | **MapLibre GL JS**, tuiles vectorielles issues d'OpenStreetMap |
| Backend | **Django + Django REST Framework + GeoDjango** |
| Base de données | **PostgreSQL + PostGIS** |
| Tests | Vitest, Vue Test Utils, Playwright (app) ; pytest (backend) |
| Qualité | ESLint, Prettier (app) ; Ruff (backend) |
| Environnement local | Docker Compose (PostgreSQL/PostGIS + backend) |

Distribution :

- **PWA** déployée sur une URL pour les tests élargis ;
- **APK** Android généré par Capacitor pour les testeurs ayant besoin des
  fonctionnalités natives, puis **AAB** pour le Play Store.

Les versions exactes de chaque outil sont fixées lors de l'initialisation du
projet, après vérification des versions stables et de leur compatibilité
mutuelle (Capacitor, Ionic Vue, Node, Android Studio, Django, Python), et
consignées dans le README.

## Conséquences

- Courbe d'apprentissage minimale : Vue côté app, Django côté serveur ; les
  seules notions nouvelles sont Capacitor, le build Android et la cartographie.
- Les fonctionnalités natives sont abstraites derrière des services
  (voir `CODING_STANDARDS.md` §7) pour que la PWA fonctionne sans elles ou
  avec un repli.
- **Fournisseur de tuiles** : les serveurs de tuiles d'openstreetmap.org
  interdisent l'usage intensif par une application distribuée sans
  autorisation ; ils ne seront pas utilisés. Pour la démo, un service gratuit
  de tuiles vectorielles OSM sans clé (par exemple OpenFreeMap) est envisagé ;
  ces services étant fournis sans garantie, l'URL de tuiles est configurable
  par variable d'environnement et l'auto-hébergement des tuiles est à prévoir
  pour la production (`PROD:`). Choix final dans l'ADR sur les sources de
  données.
- **Attribution OpenStreetMap obligatoire** sur la carte (licence ODbL).
- Le build Android nécessite Android Studio / le SDK Android et un JDK ; la
  procédure sera décrite dans `docs/BUILD_AND_RELEASE.md`.
- Une clé de signature (keystore) devra être créée et sauvegardée hors dépôt
  avant la première diffusion d'APK.
- Un hébergement backend + base PostGIS est nécessaire dès que la démo est
  diffusée (choix à faire dans un ADR dédié).
