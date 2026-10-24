# Consignes pour Claude

Ce fichier est lu automatiquement par Claude Code. Il résume les règles du
projet ; les documents de référence font foi en cas de doute.

## Références obligatoires

- Règles de codage : `docs/CODING_STANDARDS.md`
- Workflow Git : `CONTRIBUTING.md`
- Décisions d'architecture : `docs/adr/`

## Règles essentielles

1. **Documenter systématiquement, dans la même PR que le code** : TSDoc sur
   tout ce qui est exporté, en-tête de fichier, commentaires sur le *pourquoi*,
   mise à jour du README / des docs / du `CHANGELOG.md`. Un travail non
   documenté n'est pas terminé.
2. **Toute décision structurante → un ADR** dans `docs/adr/` (modèle :
   `docs/adr/TEMPLATE.md`). Ne pas trancher seul une décision structurante
   qui n'est pas déjà couverte par un ADR accepté : la proposer.
3. **Langues** : code, commentaires et commits en anglais ; documentation du
   dépôt, PR et échanges en français.
4. **Git** : ne jamais pousser sur `main` ou `develop` ; travailler sur une
   branche dédiée, commits au format Conventional Commits, PR vers `develop`.
5. **Raccourcis de démo** : autorisés seulement s'ils sont marqués
   `// PROD: <action requise>`.
6. **Aucun secret** dans le dépôt (clés, keystore, `.env`).
7. Avant de pousser : lint, format, typecheck et tests doivent passer.

## Contexte développeur

Le développeur est expert Django REST et Vue.js, débutant en développement
mobile : expliquer les notions propres au mobile (cycle de vie Android,
permissions, Capacitor, signature d'APK…) en faisant le parallèle avec le web
quand c'est utile.
