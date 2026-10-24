/**
 * @file French UI strings (default and only locale for now, CODING_STANDARDS.md §5).
 */
export default {
  app: {
    // PROD: final product name not chosen yet (docs/PRODUCT.md, open questions).
    name: 'City Groom',
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
    loading: 'Chargement des casiers…',
    unavailable: 'La carte ne peut pas s’afficher pour le moment. Voici la liste des casiers.',
    freeCompartments: 'Complet | 1 compartiment libre | {count} compartiments libres',
    open: 'Voir le casier →',
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
