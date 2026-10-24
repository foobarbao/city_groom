# City Groom

Application mobile (Android + version web installable) de **casiers connectés
à Grenoble** : une carte réelle de la ville affiche des casiers (simulés pour la
démo) rattachés à des services proposés par des commerces réels.

Projet **en phase de démonstration**, conçu pour servir de base à une future
version de production.

> ⚠️ Le code applicatif n'est pas encore initialisé. Ce dépôt contient pour
> l'instant les règles de codage, le workflow et les premières décisions
> d'architecture.

## Stack

| Couche | Technologies |
|---|---|
| Application (PWA + APK Android) | Vue 3, TypeScript, Ionic, Capacitor, Vite, Pinia |
| Carte | MapLibre GL JS, tuiles vectorielles OpenStreetMap |
| Backend | Django REST Framework, GeoDjango |
| Base de données | PostgreSQL + PostGIS |

Détails et alternatives écartées : [ADR-0002](docs/adr/0002-choix-stack-mobile.md).

Carte : © les contributeurs d'[OpenStreetMap](https://www.openstreetmap.org/copyright).

## Documentation

| Document | Contenu |
|---|---|
| [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) | Règles de codage et de documentation (**à lire en premier**) |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branches, commits, Pull Requests, versions |
| [`docs/adr/`](docs/adr/) | Décisions d'architecture |
| [`CHANGELOG.md`](CHANGELOG.md) | Historique des changements |
| [`CLAUDE.md`](CLAUDE.md) | Consignes pour l'assistant IA |

## Démarrage

_À compléter lors de l'initialisation du projet (prérequis, installation,
lancement web, build Android)._
