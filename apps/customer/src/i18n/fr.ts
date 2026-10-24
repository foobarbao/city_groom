/**
 * @file French UI strings (default and only locale for now, CODING_STANDARDS.md §5).
 */
export default {
  app: {
    // Product name decided by the project owner on 2026-10-24 (docs/PRODUCT.md).
    // PROD: trademark (INPI) and domain checks before publication.
    name: 'CityPal',
    tagline: 'Vos commerces de quartier, sans voiture ni détour',
    simulatedNotice: 'Démonstration : casiers et disponibilités simulés.',
  },
  errors: {
    network: 'Connexion impossible. Vérifiez votre réseau puis réessayez.',
    notFound: "Ce casier n'existe pas ou n'est pas en service.",
    generic: 'Une erreur est survenue. Réessayez dans un instant.',
    retry: 'Réessayer',
  },
  map: {
    title: 'Casiers à proximité',
    subtitle: 'Aucun casier | 1 casier près de chez vous | {count} casiers près de chez vous',
    listTitle: 'Casiers',
    lockersTab: 'Casiers',
    loading: 'Chargement des casiers…',
    unavailable: 'La carte ne peut pas s’afficher pour le moment. Voici la liste des casiers.',
    freeCompartments: 'Complet | 1 compartiment libre | {count} compartiments libres',
    open: 'Voir le casier →',
  },
  merchants: {
    tab: 'Commerces',
    empty:
      "Les commerces réels de Grenoble s'afficheront ici après leur import depuis OpenStreetMap.",
    partner: 'Partenaire',
    notPartner: 'Partenariat non établi',
    source: 'Données des commerces © les contributeurs OpenStreetMap',
    categories: {
      laundry: 'Blanchisserie',
      dry_cleaning: 'Pressing',
      shoe_repair: 'Cordonnerie',
      tailoring: 'Retouches',
      watch_repair: 'Horlogerie',
      jewellery_repair: 'Bijouterie',
      electronics_repair: 'Réparation électronique',
      key_cutting: 'Clés',
    },
  },
  locker: {
    back: 'Retour',
    eyebrow: 'Casier',
    opensWith: 'S’ouvre avec : {methods}',
    chooseSize: 'Quelle taille pour votre article ?',
    free: 'aucun libre | 1 libre | {count} libres',
    fits: 'Idéal pour : {examples}',
    dimensions: 'Intérieur : {height} × {width} × {depth} cm',
    previewTitle: 'Comment ça marche',
    previewDoor: 'La porte {label} s’ouvrira pour vous',
    noDoorOfSize: "Ce casier n'a pas de compartiment de cette taille.",
    steps: {
      identify: 'Identifiez-vous au casier ({methods}).',
      open: 'La porte {label} s’ouvre automatiquement.',
      drop: 'Déposez votre article, puis refermez la porte.',
    },
    panel: 'Écran',
    accessMethods: {
      bluetooth: 'Bluetooth',
      nfc: 'NFC',
      qr_code: 'QR code',
    },
    sizes: {
      S: 'Petit',
      M: 'Moyen',
      L: 'Grand',
      XL: 'Penderie',
    },
  },
}
