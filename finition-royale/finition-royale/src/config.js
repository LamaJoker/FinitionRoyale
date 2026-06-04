/* ============================================
   FINITION ROYALE — Configuration globale
   ============================================
   Modifie ici UNE SEULE FOIS
   → tout le site se met à jour au prochain build
   ============================================ */

module.exports = {
  // ── Identité ──
  brand: "Finition Royale",
  tagline: "Detailing automobile premium à domicile",
  shortPitch: "Polish, protection céramique et nettoyage intérieur premium chez vous, dans tout le Grand Besançon.",

  // ── Contact ──
  phone:      "07 71 22 90 38",   // format d'affichage humain
  phoneRaw:   "0771229038",        // format compose
  phoneIntl:  "33771229038",       // format international (wa.me / sms:)
  phoneTel:   "+33771229038",      // format tel: (clic-pour-appeler)
  email:      "contact@finition-royale.fr",

  // ── Géo ──
  city:       "Besançon",
  region:     "Grand Besançon",
  department: "Doubs (25)",
  bigRegion:  "Bourgogne-Franche-Comté",
  address:    "Besançon, 25000",
  zones:      "Besançon, Thise, Devecey, Baume-les-Dames, Ornans, Montbéliard",
  zonesList:  ["Besançon", "Thise", "Devecey", "Baume-les-Dames", "Ornans", "Montbéliard", "Pontarlier", "Vesoul"],
  hours:      "Lun–Sam · 8h–19h",
  hoursSchema: "Mo-Sa 08:00-19:00",
  geo: { lat: 47.2378, lng: 6.0241 },

  // ── Site ──
  siteUrl:    "https://finition-royale.fr",
  defaultOgImage: "/assets/og-image.jpg",

  // ── Légal ── (à compléter par le client réel)
  legal: {
    statut:     "Entreprise individuelle (micro-entreprise)",
    director:   "Nom Prénom du gérant",      // ← À COMPLÉTER
    siret:      "000 000 000 00000",         // ← À COMPLÉTER (14 chiffres)
    siren:      "000 000 000",                // ← À COMPLÉTER (9 chiffres)
    rcsCity:    "Besançon",
    tvaIntra:   "Non applicable (franchise en base TVA)", // ou FRxxxxxxxxxxx
    apeNaf:     "45.20A — Entretien et réparation de véhicules automobiles légers",
    assurance:  "Responsabilité Civile Professionnelle souscrite",
    mediator:   "Médiateur de la consommation : CM2C — 49 rue de Ponthieu, 75008 Paris — cm2c.net",
    rgpdEmail:  "contact@finition-royale.fr",
  },

  // ── Réseaux & Analytics ──
  gaId:       "G-2EMJFFFFEZ",
  instagram:  "https://www.instagram.com/finitionroyale",
  facebook:   "https://www.facebook.com/finitionroyale",
  googleBusiness: "https://www.google.com/maps/place/Finition+Royale",

  // ── Messages pré-remplis CTA ──
  waDefault:  "Bonjour, je voudrais réserver un detailing.",
  waQuote:    "Bonjour, je voudrais un devis pour mon véhicule.%0AVéhicule : %0APrestation : %0ACommune : ",
  smsDefault: "Bonjour, je voudrais réserver un detailing.",
  smsQuote:   "Bonjour, je voudrais un devis pour mon véhicule.%0AVéhicule : %0APrestation : %0ACommune : ",

  // ── Pages (pour sitemap + nav) ──
  pages: [
    { slug: "index",             title: "Accueil",                 priority: 1.0, nav: false },
    { slug: "prestations",       title: "Prestations",             priority: 0.9, nav: true  },
    { slug: "avant-apres",       title: "Avant / Après",           priority: 0.8, nav: true  },
    { slug: "zone-besancon",     title: "Zone Besançon",           priority: 0.7, nav: false },
    { slug: "a-propos",          title: "À propos",                priority: 0.7, nav: true  },
    { slug: "blog",              title: "Blog",                    priority: 0.6, nav: true  },
    { slug: "faq",               title: "FAQ",                     priority: 0.7, nav: true  },
    { slug: "contact",           title: "Contact",                 priority: 0.7, nav: true  },
    { slug: "devis-en-ligne",    title: "Devis en ligne",          priority: 0.8, nav: false },
    { slug: "mentions-legales",  title: "Mentions légales",        priority: 0.3, nav: false },
    { slug: "cgv",               title: "CGV",                     priority: 0.3, nav: false },
    { slug: "politique-confidentialite", title: "Confidentialité", priority: 0.3, nav: false },
    { slug: "merci",             title: "Merci",                   priority: 0.1, nav: false },
  ],
};
