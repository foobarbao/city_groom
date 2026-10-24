/**
 * @file French UI strings of the partner portal (default and only locale for
 * now, CODING_STANDARDS.md §5).
 */
export default {
  app: {
    // Working name, chosen "for now" by the project owner (docs/PRODUCT.md).
    // PROD: confirm the product name (trademark and domain checks).
    name: 'Reliance Pro',
    tagline: 'L’espace des commerces, des coursiers à vélo et de l’équipe',
    fictitious: 'Démonstration : activité, commandes et chiffres fictifs.',
    asOf: 'Situation au {date} à {time}',
    home: 'Accueil',
  },
  home: {
    title: 'Démonstration Reliance',
    intro:
      'Des casiers près de chez soi, des commerces du centre-ville et des coursiers à vélo cargo. Choisissez un espace à découvrir.',
    customer: {
      title: 'Application client',
      text: 'La carte des casiers et des commerces, et l’ouverture d’un casier.',
    },
    merchant: {
      title: 'Espace commerçant',
      text: 'Les articles qui arrivent, le chiffre d’affaires et la commission.',
    },
    courier: {
      title: 'Espace coursier',
      text: 'Les tournées à venir et le volume attendu.',
    },
    operator: {
      title: 'Espace exploitation',
      text: 'Volumes, remplissage des casiers, carte du réseau.',
    },
    open: 'Ouvrir',
    dataNote:
      'Carte, arrêts de tram et commerces : données réelles OpenStreetMap. Casiers, commandes et tournées : simulés. Les commerces de l’espace commerçant sont fictifs (« Démo · »).',
  },
  charts: {
    table: 'Voir les données',
    forecast: 'Prévision',
  },
  merchant: {
    title: 'Espace commerçant',
    choose: 'Commerce',
    incomingTitle: 'Ce qui arrive',
    incomingEmpty: 'Aucun article attendu pour les prochaines tournées.',
    incomingRound: 'Tournée de {time}, {day}',
    items: 'Aucun article | 1 article | {count} articles',
    inProgressTitle: 'En cours chez vous',
    inProgressEmpty: 'Aucun article en cours.',
    returnBy: 'Retour au casier {locker}',
    totalsTitle: 'Les {days} derniers jours',
    orders: 'Commandes',
    revenue: 'Chiffre d’affaires',
    net: 'Vous recevez',
    commission: 'Commission',
    revenueChart: 'Chiffre d’affaires par jour',
    itemsChart: 'Articles par jour',
    itemsSeries: 'Articles',
    commissionTitle: 'Une commission claire et dégressive',
    commissionRate: 'Taux actuel : {rate}',
    commissionText:
      'Le client paie le prix de votre boutique. La plateforme prélève {rate} sur vos ventes, rien d’autre.',
    commissionTarget:
      'Objectif : {target}. Le taux baisse à mesure que le réseau grandit (commerces partenaires, clients) : parlez-en autour de vous. Les paliers seront annoncés.',
    commissionExample:
      'Au taux de {target}, vos commissions de la période auraient été de {amount}.',
  },
  courier: {
    title: 'Espace coursier',
    intro:
      'Deux tournées par jour à heures fixes : une charge de travail prévisible, à vélo cargo.',
    roundsPerDay: 'Tournées par jour',
    roundTimes: 'à {times}',
    itemsPerRound: 'Articles par tournée',
    kmPerRound: 'Km par tournée',
    lastWeek: 'moyenne des 7 derniers jours',
    perMonth: 'Articles par mois',
    projected: 'projection sur les prévisions',
    nextTitle: 'Prochaines tournées',
    round: 'Tournée de {time}, {day}',
    toCollect: 'à collecter : {count}',
    toReturn: 'à rapporter : {count}',
    lockers: 'aucun casier | 1 casier | {count} casiers',
    merchants: 'aucun commerce | 1 commerce | {count} commerces',
    km: '{km} km',
    mapTitle: 'Parcours de la prochaine tournée',
    mapNote: 'Tracé indicatif : les arrêts sont reliés à vol d’oiseau.',
    itemsChart: 'Articles transportés par jour',
    itemsSeries: 'Articles',
  },
  operator: {
    title: 'Espace exploitation',
    ordersToday: 'Commandes aujourd’hui',
    itemsInLockers: 'Articles dans les casiers',
    itemsAtMerchants: 'Articles chez les commerçants',
    fillRate: 'Remplissage du réseau',
    ofCompartments: '{used} compartiments utilisés sur {total}',
    ordersChart: 'Commandes par jour',
    ordersSeries: 'Commandes',
    sizesTitle: 'Remplissage par taille',
    size: 'Taille',
    used: 'Utilisés',
    capacity: 'Capacité',
    mapTitle: 'Le réseau en direct',
    mapNote: 'Plus un casier est foncé, plus il est rempli.',
    lockersTitle: 'Casiers',
    lockerLine: '{rate} rempli · {free} libres',
    lockerBack: 'Exploitation',
    lockerFillRate: 'Remplissage',
    // Text on the drawn control panel screen.
    panel: 'Reliance',
    doorsTitle: 'État des portes',
    statuses: {
      free: 'Libre',
      reserved: 'Réservée',
      occupied: 'Occupée',
      out_of_service: 'Hors service',
    },
    accessMethods: 'Ouverture : {methods}',
    methods: { bluetooth: 'Bluetooth', nfc: 'NFC', qr_code: 'QR code' },
    simulated: 'Casier simulé',
  },
}
