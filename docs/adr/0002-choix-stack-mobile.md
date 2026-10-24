# ADR-0002 — Choix de la stack mobile

- **Statut** : Proposé (à valider avant le premier code applicatif)
- **Date** : 2026-10-24

## Contexte

- L'application doit être diffusée rapidement à des testeurs, puis servir de
  base à une version de production.
- La cible initiale est Android (APK). Une version web installable faciliterait
  la diffusion aux testeurs (un simple lien, y compris pour les utilisateurs
  iPhone).
- Le développeur principal est expert **Vue.js** et **Django REST**, sans
  expérience mobile préalable.
- Le backend, s'il y en a un, sera vraisemblablement en Django REST Framework.

## Options envisagées

1. **Vue 3 + Ionic + Capacitor** — Réutilise directement les compétences Vue.
   Un seul code produit une PWA (web) et un APK Android (et iOS plus tard).
   Ionic fournit des composants et une navigation au comportement mobile
   (transitions entre pages, bouton retour Android, gestes). Capacitor donne
   accès aux API natives (caméra, GPS, notifications…) avec un repli web.
   Inconvénient : performances inférieures au natif pour des interfaces très
   animées, ce qui n'est pas l'enjeu ici.
2. **Vue 3 + Quasar + Capacitor** — Mêmes atouts (un seul code, PWA + APK), très
   riche en composants. Navigation moins « native » qu'Ionic par défaut ;
   écosystème mobile plus restreint.
3. **Flutter** ou **React Native** — Rendu plus proche du natif, mais nouveau
   langage / framework à apprendre, et la version web est moins mature
   (Flutter) ou demande un travail supplémentaire (React Native).
4. **Kotlin natif** — Meilleure intégration Android, mais aucune version web,
   pas d'iOS sans tout réécrire, et courbe d'apprentissage la plus forte.

## Décision proposée

**Option 1 : Vue 3 + TypeScript + Ionic Vue + Capacitor, bâti avec Vite.**

Outillage associé : Pinia (état), Vue Router (via Ionic), vue-i18n, Vitest,
Vue Test Utils, Playwright, ESLint, Prettier.

Distribution :

- **PWA** déployée sur une URL publique pour les tests élargis (aucune
  installation, fonctionne sur Android et iPhone) ;
- **APK** Android généré par Capacitor pour les testeurs ayant besoin des
  fonctionnalités natives, puis pour la publication sur le Play Store
  (au format AAB).

## Conséquences

- Courbe d'apprentissage minimale : l'essentiel du code est du Vue standard.
- Il faut abstraire les fonctionnalités natives derrière des services
  (voir `CODING_STANDARDS.md` §6) pour que la PWA fonctionne sans elles ou
  avec un repli.
- Le build Android nécessite Android Studio / le SDK Android et un JDK ; la
  procédure sera décrite dans `docs/BUILD_AND_RELEASE.md`.
- Une clé de signature (keystore) devra être créée et sauvegardée hors dépôt
  avant la première diffusion d'APK.
