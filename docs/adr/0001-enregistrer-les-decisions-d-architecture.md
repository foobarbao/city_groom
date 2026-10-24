# ADR-0001 — Enregistrer les décisions d'architecture

- **Statut** : Accepté
- **Date** : 2026-10-24

## Contexte

Le projet démarre en démonstration mais doit servir de base à la production.
Les choix faits maintenant (stack, stockage, authentification, distribution)
auront des conséquences durables, et leur justification se perd vite si elle
n'est écrite nulle part.

## Décision

Chaque décision structurante est consignée dans un ADR (Architecture Decision
Record), au format court décrit dans [`TEMPLATE.md`](TEMPLATE.md) :

- un fichier par décision : `docs/adr/NNNN-titre-en-kebab-case.md`, numérotation
  séquentielle, jamais réutilisée ;
- statuts possibles : `Proposé`, `Accepté`, `Rejeté`, `Remplacé par ADR-XXXX`,
  `Obsolète` ;
- un ADR accepté n'est plus modifié sur le fond : on en écrit un nouveau qui le
  remplace, et on met à jour le statut de l'ancien ;
- l'ADR est ajouté dans la PR qui implémente la décision (ou avant, dans une PR
  dédiée, si la décision doit être discutée).

## Conséquences

- L'historique des choix et de leurs raisons est consultable dans le dépôt.
- Un léger surcoût de rédaction à chaque décision importante, accepté au regard
  de l'objectif de production.
