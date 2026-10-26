<!--
  DRAFT privacy policy of CityPal (customer app and partner portal).

  Why this file is in French: it is user-facing content, to be published on
  the CityPal domain (required by Google's OAuth brand verification, see
  docs/GOOGLE_SIGN_IN.md) and linked from the apps. Repository rules keep
  every other document in English (CLAUDE.md §4).

  Published version (2026-10-25): the customer app page /confidentialite
  (apps/customer/src/views/PrivacyPage.vue, texts in i18n `privacy`),
  written from this draft with the owner's answers (controller Alexis
  Steinmann personally, contact@citypal.fr, announcements by opt-in). This
  file keeps the full list of points to complete and to validate.

  2026-10-26: interest in upcoming offers ("Ça m'intéresse", §2.1 bis),
  added to the draft and to the published page.

  Status: draft written on 2026-10-25 from what the code actually collects
  (accounts app, customer app, portal). NOT legal advice. Every
  "[À COMPLÉTER]" is information only the project owner has; every
  "[À VALIDER]" is a proposal a legal adviser must confirm before
  publication. The list of open points is at the end of the file.
-->

# Politique de confidentialité de CityPal

_Brouillon du 25 octobre 2026 — à compléter et à faire valider par un juriste
avant publication._

Cette politique explique quelles données personnelles CityPal collecte,
pourquoi, combien de temps elles sont conservées et comment exercer vos
droits. Elle s'applique à l'application CityPal (clients), au portail CityPal
Pro (commerçants, coursiers partenaires, équipe) et au site citypal.fr
[À COMPLÉTER : domaine définitif].

## 1. Qui est responsable de vos données ?

Le responsable du traitement est :

- [À COMPLÉTER : raison sociale, forme juridique, capital]
- [À COMPLÉTER : adresse du siège]
- [À COMPLÉTER : numéro SIREN / RCS]
- Contact pour vos données : [À COMPLÉTER : adresse e-mail dédiée, ex.
  confidentialite@citypal.fr]
- Délégué à la protection des données (DPO) : [À COMPLÉTER : nom et contact,
  ou mention qu'aucun DPO n'est désigné] [À VALIDER : obligation de désigner
  un DPO]

## 2. Quelles données collectons-nous, et pourquoi ?

### 2.1 Votre compte (connexion avec Google)

Vous pouvez utiliser CityPal sans compte. Si vous choisissez « Continuer avec
Google », nous recevons de Google uniquement votre **profil de base** :

| Donnée | Pourquoi |
|---|---|
| Identifiant Google (un numéro, pas votre mot de passe) | Retrouver votre compte à chaque connexion |
| Adresse e-mail, et le fait que Google l'a vérifiée | Vous identifier, vous contacter au sujet de vos commandes |
| Prénom, nom | Vous saluer, identifier vos commandes |
| Photo de profil (adresse de l'image chez Google) | L'afficher dans votre compte |
| Date de création du compte, date de dernière connexion | Gestion et sécurité des comptes |

Nous n'avons **jamais** accès à votre mot de passe Google, à vos e-mails, à
vos contacts ni à vos fichiers. Votre nom et votre photo sont mis à jour à
chaque connexion, à partir de votre profil Google.

Base légale : exécution du contrat (vous fournir le service) [À VALIDER].

### 2.1 bis Offres à venir (« Ça m'intéresse »)

Si vous êtes connecté et touchez « Ça m'intéresse » sur une offre annoncée
comme bientôt disponible (par exemple les casiers à trottinettes), nous
enregistrons ce choix et sa date avec votre compte. But : mesurer l'intérêt
pour l'offre et décider où l'ouvrir. Cela ne vous inscrit pas aux annonces
par e-mail. Vous pouvez retirer votre intérêt à tout moment depuis la page de
l'offre.

Base légale : votre demande [À VALIDER].

### 2.2 Vos commandes, consignes et échanges

Pour fournir le service, nous traitons :

- **Commandes de services** : boutique choisie, prestation, quantité, prix,
  taille de casier, casiers de dépôt et de retrait, dates et statut ;
- **Consignes** : casier, taille, créneaux de dépôt et de retrait, porte
  attribuée, transferts éventuels vers un autre casier, prix ;
- **Messages et devis** échangés avec les boutiques, y compris les **photos**
  que vous joignez (réduites avant envoi) ;
- **Avis** : note sur 5 et commentaire, liés à une commande terminée (seuls
  les clients ayant commandé peuvent donner un avis) ;
- **Abonnement** choisi.

Base légale : exécution du contrat [À VALIDER].

_Note pour la version actuelle : dans la démonstration, ces données restent
dans votre navigateur (stockage local) et ne sont pas envoyées à nos serveurs.
Cette note sera retirée quand le service réel fonctionnera._ [À VALIDER]

### 2.3 Votre position

L'écran « Casiers autour de moi » peut utiliser la position de votre
appareil, **uniquement si vous l'autorisez**, pour classer les casiers du plus
proche au plus éloigné. La position est utilisée **sur votre appareil
seulement** : elle n'est ni envoyée à nos serveurs ni conservée.

Base légale : votre consentement, que vous pouvez retirer dans les réglages de
votre navigateur ou de votre téléphone [À VALIDER].

### 2.4 Commerçants : compte, offres et Google Agenda

Pour les commerçants partenaires, nous traitons en plus :

- les informations de la boutique (nom, adresse, catégorie), les **offres**
  publiées (photo, description, prix, délai) et les réponses aux avis ;
- si vous **connectez Google Agenda** : CityPal demande à Google une
  autorisation limitée (`calendar.app.created`). Elle permet seulement de
  **créer un agenda « CityPal »** dans votre Google Agenda et d'y écrire vos
  tâches (passages du coursier, prestations, remises). CityPal **ne voit pas
  vos autres agendas ni vos autres événements**. Vous pouvez déconnecter
  Google Agenda à tout moment depuis le planning, ou retirer l'accès dans
  votre compte Google. L'agenda « CityPal » reste alors dans votre Google
  Agenda : vous pouvez le supprimer vous-même.

L'utilisation des données reçues des API Google respecte la politique de
Google sur les données utilisateur des services d'API, y compris les exigences
d'utilisation limitée (« Limited Use »). [À VALIDER : formulation exacte
exigée par Google pour la validation de l'application]

### 2.5 Coursiers partenaires

[À COMPLÉTER : données traitées pour les coursiers (identité, contrat,
tournées réalisées…) et données des clients visibles par les coursiers
(par exemple uniquement les codes de casier et de commande, sans nom ?)]

### 2.6 Données techniques et sécurité

Comme tout service en ligne, nos serveurs reçoivent des données techniques
(adresse IP, type de navigateur, date et heure des requêtes) pour faire
fonctionner le service, le protéger (par exemple limiter les tentatives de
connexion répétées) et corriger les erreurs.

Base légale : intérêt légitime (sécurité du service) [À VALIDER].

[À COMPLÉTER : outil de mesure d'audience prévu ou non. Aujourd'hui, aucun
outil de mesure d'audience ni de publicité n'est utilisé.]

## 3. Stockage sur votre appareil

L'application enregistre dans votre navigateur (« stockage local ») ce qui
lui permet de fonctionner : votre session de connexion, vos réglages et, dans
la démonstration, vos commandes et consignes. Ces éléments sont nécessaires
au service et ne servent ni à la publicité ni au suivi.
[À VALIDER : exemption de consentement pour ces traceurs strictement
nécessaires, selon les recommandations de la CNIL]

## 4. Qui reçoit vos données ?

- **Les boutiques partenaires** auxquelles vous passez commande ou écrivez :
  les informations nécessaires à votre commande, vos messages, photos et
  devis. [À COMPLÉTER : la boutique voit-elle votre nom ? votre e-mail ?]
- **Les coursiers partenaires**, pour transporter vos articles : [À
  COMPLÉTER, voir 2.5]
- **Nos prestataires techniques**, qui agissent pour notre compte :

| Prestataire | Rôle | Lieu des données |
|---|---|---|
| Google | Connexion avec Google ; Google Agenda (commerçants qui le connectent) | [À VALIDER : transfert hors UE et garanties] |
| Render | Hébergement du serveur CityPal | Union européenne (Francfort) [À VALIDER] |
| Neon | Base de données | Union européenne (Francfort) [À VALIDER] |
| Netlify | Hébergement des pages de l'application | [À VALIDER : lieu et garanties] |
| OpenFreeMap | Fonds de carte (votre appareil télécharge les images de la carte depuis ce service, qui reçoit donc votre adresse IP) | [À VALIDER] |
| [À COMPLÉTER : prestataire de paiement] | Paiement des commandes et abonnements | [À COMPLÉTER] |
| [À COMPLÉTER : fournisseur des casiers connectés] | Ouverture des portes | [À COMPLÉTER] |
| [À COMPLÉTER : envoi d'e-mails ou de notifications, si prévu] | Notifications | [À COMPLÉTER] |

Nous ne vendons pas vos données et ne les utilisons pas à des fins
publicitaires.

## 5. Transferts hors de l'Union européenne

Certains prestataires (notamment Google) peuvent traiter des données hors de
l'Union européenne. Ces transferts sont encadrés par [À VALIDER : décision
d'adéquation (Data Privacy Framework) ou clauses contractuelles types, selon
chaque prestataire].

## 6. Combien de temps conservons-nous vos données ?

| Données | Durée |
|---|---|
| Compte | [À COMPLÉTER : par exemple jusqu'à la suppression du compte, puis suppression après X ans d'inactivité] |
| Commandes et factures | [À COMPLÉTER / À VALIDER : durées comptables légales] |
| Messages et photos | [À COMPLÉTER] |
| Avis | [À COMPLÉTER] |
| Journaux techniques | [À COMPLÉTER : par exemple quelques mois] |
| Intérêt pour une offre à venir | Jusqu'à son retrait ou la suppression du compte [À VALIDER] |
| Position | Non conservée (utilisée sur l'appareil seulement) |

## 7. Vos droits

Vous pouvez à tout moment demander à **accéder** à vos données, à les
**rectifier**, à les **effacer**, à **limiter** leur traitement, à vous y
**opposer** (pour les traitements fondés sur l'intérêt légitime), à les
**récupérer** dans un format réutilisable (portabilité), et **retirer votre
consentement** lorsque le traitement repose sur celui-ci. Vous pouvez aussi
définir des directives sur le sort de vos données après votre décès.

Pour exercer ces droits : [À COMPLÉTER : adresse e-mail], en précisant
l'adresse e-mail de votre compte. Nous répondons dans un délai d'un mois.
[À VALIDER]

Vous pouvez supprimer votre compte : [À COMPLÉTER : depuis l'application,
une fois la fonction disponible, ou par e-mail].

Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une
réclamation à la **CNIL** (www.cnil.fr).

## 8. Sécurité

Les échanges avec nos serveurs sont chiffrés (HTTPS). La connexion avec Google
est vérifiée par nos serveurs auprès de Google. L'accès à l'administration est
réservé à l'équipe CityPal. [À COMPLÉTER : autres mesures, par exemple
sauvegardes chiffrées]

## 9. Mineurs

[À COMPLÉTER : âge minimum pour créer un compte] [À VALIDER : règles pour
les mineurs de moins de 15 ans]

## 10. Modifications

Nous pouvons mettre à jour cette politique. La date de dernière mise à jour
figure en haut de la page ; en cas de changement important, nous vous en
informerons dans l'application.

---

<!--
  OPEN POINTS (for the project owner and the legal adviser)

  Project owner, to provide:
  1. Legal entity: name, form, address, SIREN, contact e-mail; DPO or not.
  2. Final domain (policy URL must be on it).
  3. Retention periods (§6) — also docs/PRODUCT.md open question 13.
  4. What merchants and couriers see of a customer (name? e-mail?) (§2.5, §4).
  5. Planned providers: payment, locker vendor, e-mail/notifications,
     audience measurement (none today).
  6. Minimum age; account deletion flow (in-app or by e-mail).

  Legal adviser, to validate:
  - every legal basis marked [À VALIDER];
  - local-storage exemption (CNIL guidance on strictly necessary trackers);
  - transfers outside the EU (Google, Netlify) and the hosting locations;
  - Google API "Limited Use" wording required for OAuth verification;
  - review policy (ADR-0008) — a separate page on how reviews are collected
    and checked.
-->
