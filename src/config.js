/* ============================================================
   FINITION ROYALE — Configuration (source unique de vérité)
   ------------------------------------------------------------
   Tout ce qui est ici est disponible dans les gabarits via
   {{cle}} ou {{objet.sous.cle}}, et sert aussi à générer les
   données structurées, le sitemap et le calculateur de devis.
   Une modification ici → tout le site suit au prochain build.
   ============================================================ */

/** Tarifs par type de véhicule — utilisés par les pages, le JSON-LD et le calculateur. */
const vehicles = [
  { id: 'citadine',   label: 'Citadine / compacte',    examples: 'Clio, 208, Polo…' },
  { id: 'berline',    label: 'Berline / break',        examples: 'Série 3, A4, Passat…' },
  { id: 'suv',        label: 'SUV / 4×4',              examples: 'X3, Q5, Tiguan…' },
  { id: 'utilitaire', label: 'Monospace / utilitaire', examples: 'Scénic, Transporter…' },
];

const offers = [
  {
    key: 'eclat',
    id: 'eclat-essentiel',
    name: 'Éclat Essentiel',
    tagline: 'Remise en état complète',
    summary: 'Lavage premium intérieur et extérieur',
    duration: '2 à 3 h',
    protection: '2 à 4 semaines',
    prices: { citadine: 80, berline: 95, suv: 115, utilitaire: 130 },
  },
  {
    key: 'prestige',
    id: 'prestige-complet',
    name: 'Prestige Complet',
    tagline: 'Polish, cuir et cire',
    summary: 'Polish, traitement cuir ou tissu, cire',
    duration: '4 à 6 h',
    protection: '4 à 6 mois',
    featured: true,
    prices: { citadine: 180, berline: 220, suv: 260, utilitaire: 300 },
  },
  {
    key: 'ceramique',
    id: 'protection-ceramique',
    anchor: 'ceramique',
    name: 'Protection Céramique',
    tagline: 'Protection 2 à 5 ans',
    summary: 'Revêtement nano-céramique professionnel',
    duration: '1 journée',
    protection: '2 à 5 ans',
    prices: { citadine: 350, berline: 420, suv: 500, utilitaire: 580 },
  },
];

const extras = [
  { key: 'optiques', name: "Restauration d'optiques", from: 60 },
  { key: 'sieges',   name: 'Détachage des sièges',     from: 40 },
  { key: 'vitres',   name: 'Traitement des vitres',    from: 35 },
];

/** Communes desservies ; `slug` = page dédiée existante. */
const zones = [
  { name: 'Besançon',        slug: 'detailing-besancon',        postalCode: '25000', lat: 47.2380, lng: 6.0244 },
  { name: 'Thise',           slug: 'detailing-thise',           postalCode: '25220', lat: 47.2852, lng: 6.0811 },
  { name: 'Devecey',         slug: 'detailing-devecey',         postalCode: '25870', lat: 47.3222, lng: 6.0225 },
  { name: 'Baume-les-Dames', slug: 'detailing-baume-les-dames', postalCode: '25110', lat: 47.3525, lng: 6.3608 },
  { name: 'Ornans',          slug: 'detailing-ornans',          postalCode: '25290', lat: 47.1061, lng: 6.1436 },
  { name: 'Montbéliard',     slug: 'detailing-montbeliard',     postalCode: '25200', lat: 47.5100, lng: 6.7983 },
  { name: 'Pontarlier',      postalCode: '25300', lat: 46.9039, lng: 6.3547 },
  { name: 'Vesoul',          postalCode: '70000', lat: 47.6197, lng: 6.1544 },
];

module.exports = {
  // ── Identité ──
  brand: 'Finition Royale',
  tagline: 'Detailing automobile premium à domicile',
  shortPitch: 'Polish, protection céramique et nettoyage intérieur premium chez vous, dans tout le Grand Besançon.',

  // ── Site ──
  // URL de production. Surchargée au build par SITE_URL, ou automatiquement
  // par le domaine de production Vercel (VERCEL_PROJECT_PRODUCTION_URL) :
  // canonical, sitemap et Open Graph suivent le domaine réellement en ligne.
  siteUrl: 'https://finition-royale.vercel.app',
  locale: 'fr_FR',
  lang: 'fr',
  themeColor: '#0a0a0a',
  // Date de dernière mise à jour éditoriale (sitemap) si la page n'en précise pas.
  lastUpdated: '2026-10-05',

  // ── Contact ──
  phone:     '07 71 22 90 38',   // affichage
  phoneTel:  '+33771229038',     // lien tel:
  phoneIntl: '33771229038',      // wa.me / sms:
  email:     'contact@finitionroyale.fr',

  // ── Géographie ──
  city: 'Besançon',
  region: 'Grand Besançon',
  department: 'Doubs (25)',
  bigRegion: 'Bourgogne-Franche-Comté',
  zones,
  zonesText: 'Besançon, Thise, Devecey, Baume-les-Dames, Ornans, Montbéliard',
  serviceRadiusKm: 60,
  hours: 'Lun–Sam · 8h–19h',
  responseTime: 'moins de 2 h',
  leadTime: '3 à 7 jours',

  // ── Offres ──
  vehicles,
  offers,
  extras,
  welcomeCode: 'ROYAL10',
  welcomeDiscount: '10 %',

  // ── Légal (données RNE / INSEE) ──
  legal: {
    statut:      'Entreprise individuelle (EI)',
    director:    'Valentin Lhomme-Choulet',
    siret:       '988 085 627 00012',
    siren:       '988 085 627',
    regAddress:  '5 rue de la Charrière, 25170 Moncley',
    locality:    'Moncley',
    postalCode:  '25170',
    foundedDate: '2025-06-15',
    rcsCity:     'Besançon',
    tvaIntra:    'Non applicable (franchise en base de TVA, art. 293 B du CGI)',
    apeNaf:      '45.20A — Entretien et réparation de véhicules automobiles légers',
    assurance:   'Responsabilité civile professionnelle souscrite',
    mediator:    'CM2C — 49 rue de Ponthieu, 75008 Paris — cm2c.net',
  },

  // ── Visuels ──
  // true tant que les images avant/après sont des visuels d'illustration
  // (images générées). Passer à false une fois remplacées par des photos
  // de chantiers réels : les légendes du site s'adaptent automatiquement.
  visualsAreIllustrations: true,

  // ── Formulaires (Web3Forms : clé publique par conception) ──
  web3formsKey: 'b011b98a-5781-444a-b35f-118df9c0e73d',

  // ── Mesure d'audience & réseaux ──
  gaId: 'G-2EMJFFFFEZ',
  social: {
    instagram:      'https://www.instagram.com/finitionroyale',
    facebook:       'https://www.facebook.com/finitionroyale',
    googleBusiness: 'https://www.google.com/maps/place/Finition+Royale',
  },

  // ── Crédit (pied de page) ──
  credit: { name: 'Valentin Lhomme-Choulet', url: 'https://lamajoker.github.io/' },

  // ── Messages pré-remplis (déjà encodés pour une URL) ──
  waDefault: 'Bonjour%2C%20je%20voudrais%20r%C3%A9server%20un%20detailing.',
  waQuote:   'Bonjour%2C%20je%20voudrais%20un%20devis%20pour%20mon%20v%C3%A9hicule.%0AV%C3%A9hicule%20%3A%20%0APrestation%20%3A%20%0ACommune%20%3A%20',
  waZone:    'Bonjour%2C%20intervenez-vous%20dans%20ma%20commune%20%3F',
};
