/**
 * @file French UI strings (default and only locale for now, CODING_STANDARDS.md §5).
 */
export default {
  app: {
    name: 'City Groom',
    tagline: 'Reconnectez-vous à vos commerces de quartier',
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
    loading: 'Chargement des casiers…',
    freeCompartments:
      'aucun compartiment libre | 1 compartiment libre | {count} compartiments libres',
    open: 'Voir le casier',
  },
  locker: {
    back: 'Carte',
    chooseSize: 'Quelle taille pour votre article ?',
    free: 'aucun libre | 1 libre | {count} libres',
    fits: 'Idéal pour : {examples}',
    dimensions: '{height} × {width} × {depth} cm',
    previewTitle: 'Comment ça marche',
    previewDoor: 'Exemple : la porte {label} s’ouvrira',
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
