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
  
  // ── Contact ──
  phone:      "0771229038",      // format d'affichage
  phoneIntl:  "33771229038",     // format international pour liens wa.me / sms:
  email:      "contact@finition-royale.fr",
  
  // ── Géo ──
  city:       "Besançon",
  region:     "Grand Besançon",
  address:    "Besançon, 25000",
  zones:      "Besançon, Thise, Devecey, Baume-les-Dames, Ornans, Montbéliard",
  hours:      "Lun–Sam · 8h–19h",
  hoursSchema: "Mo-Sa 08:00-19:00",
  geo: { lat: 47.2378, lng: 6.0241 },
  
  // ── Site ──
  siteUrl:    "https://finition-royale.fr",
  
  // ── Réseaux & Analytics ──
  gaId:       "G-2EMJFFFFEZ",    // ← à remplacer par ton ID GA4
  
  // ── Messages pré-remplis CTA ──
  waDefault:  "Bonjour, je voudrais réserver un detailing.",
  waQuote:    "Bonjour, je voudrais un devis pour mon véhicule.%0AVéhicule : %0APrestation : %0ACommune : ",
  smsDefault: "Bonjour, je voudrais réserver un detailing.",
  smsQuote:   "Bonjour, je voudrais un devis pour mon véhicule.%0AVéhicule : %0APrestation : %0ACommune : ",
  
  // ── Pages (pour sitemap + nav) ──
  pages: [
    { slug: "index",       title: "Accueil",        priority: 1.0, nav: false },
    { slug: "prestations", title: "Prestations",    priority: 0.9, nav: true  },
    { slug: "avant-apres", title: "Avant / Après",  priority: 0.8, nav: true  },
    { slug: "faq",         title: "FAQ",            priority: 0.7, nav: true  },
    { slug: "contact",     title: "Contact",        priority: 0.7, nav: true  },
  ],
};
