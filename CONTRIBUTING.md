# Contribuer à City Groom

Ce document décrit le workflow Git, les conventions de commit et le processus
de revue. Les règles de codage sont dans
[`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md).

## 1. Branches

Modèle inspiré de Git Flow, simplifié :

| Branche | Rôle | Protégée | Merge depuis |
|---|---|---|---|
| `main` | Code en production / version distribuée. Chaque merge = une release taguée. | Oui | `release/*`, `hotfix/*` |
| `develop` | Intégration continue des fonctionnalités terminées. Toujours fonctionnelle. | Oui | `feature/*`, `fix/*`, `docs/*`, `chore/*` |
| `feature/<sujet>` | Nouvelle fonctionnalité. | Non | — |
| `fix/<sujet>` | Correction de bug non urgente. | Non | — |
| `docs/<sujet>` | Documentation seule. | Non | — |
| `chore/<sujet>` | Outillage, dépendances, CI. | Non | — |
| `release/vX.Y.Z` | Préparation d'une version (gel fonctionnel, numéro de version, changelog). | Non | `develop` |
| `hotfix/<sujet>` | Correction urgente sur la production. | Non | `main` |

Les branches créées par l'assistant IA suivent le préfixe `claude/<sujet>` et
sont soumises aux mêmes règles de PR et de revue.

Règles :

- **Personne ne pousse directement sur `main` ni sur `develop`** : tout passe par
  une Pull Request.
- Une branche = un sujet. Les branches sont courtes (quelques jours au plus)
  et supprimées après merge.
- Les noms sont en `kebab-case` et en anglais : `feature/user-login`,
  `fix/gps-permission-crash`.
- Une `release/*` ou une `hotfix/*` mergée dans `main` est aussi mergée dans
  `develop`.

## 2. Commits — Conventional Commits

Format :

```
<type>(<portée optionnelle>): <résumé à l'impératif, en anglais, ≤ 72 caractères>

<corps optionnel : le pourquoi du changement, en anglais>

<pied optionnel : Refs #12, BREAKING CHANGE: ...>
```

Types autorisés :

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Formatage, sans changement de logique |
| `refactor` | Restructuration sans changement de comportement |
| `perf` | Amélioration de performance |
| `test` | Ajout / correction de tests |
| `build` | Build, dépendances, configuration Capacitor / Android |
| `ci` | Intégration continue |
| `chore` | Maintenance diverse |

Exemples :

```
feat(booking): add service booking form
fix(geoloc): handle denied permission on Android 14
docs(adr): record mobile stack decision
```

Des commits petits et cohérents : chaque commit compile et a un sens seul.

## 3. Pull Requests

1. Créer la branche depuis `develop` à jour.
2. Développer en respectant la [définition de « terminé »](docs/CODING_STANDARDS.md#10-définition-de--terminé-).
3. Ouvrir une PR vers `develop` en remplissant le modèle (description,
   documentation mise à jour, tests, captures d'écran pour l'interface).
4. La CI doit être verte (lint, typecheck, tests, build).
5. Au moins une relecture approuvée avant le merge.
6. Merge en **squash** pour les branches de travail (historique de `develop`
   lisible : une PR = un commit), en **merge commit** pour `release/*` et
   `hotfix/*` vers `main`.

## 4. Versions

- Numérotation **SemVer** : `MAJEUR.MINEUR.CORRECTIF`. Tant que l'app est en
  démo, on reste en `0.x.y`.
- Chaque release est taguée sur `main` (`v0.1.0`) et décrite dans
  `CHANGELOG.md` (format [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)).
- Le `versionCode` Android est incrémenté à chaque APK distribué.
