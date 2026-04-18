# Finition Royale — Site Web

Detailing automobile à domicile — Besançon & Doubs

---

## Stack

| Outil | Rôle |
|-------|------|
| HTML/CSS/JS vanilla | Interface sans framework |
| Vite 5 | Build, minification, dev server |
| Node.js | Génération des pages villes |
| PHP | Traitement formulaire |
| Google Tag Manager + GA4 | Tracking |
| OVH + FTP | Hébergement |

---

## Structure du projet

```
finition-royale/
├── src/
│   ├── pages/
│   │   ├── index.html            ← Page principale
│   │   └── ville.template.html   ← Template générique villes
│   ├── styles/
│   │   ├── base.css              ← Reset, variables, typo
│   │   ├── components.css        ← Boutons, cards, form
│   │   └── layout.css            ← Nav, hero, sections, footer
│   ├── scripts/
│   │   ├── main.js               ← Entry point
│   │   └── modules/
│   │       ├── nav.js            ← Navigation + burger
│   │       ├── form.js           ← Formulaire RDV multi-étapes
│   │       ├── animations.js     ← Scroll reveal + compteurs
│   │       ├── tracking.js       ← GTM/GA4 events
│   │       └── cookies.js        ← Bandeau RGPD
│   └── data/
│       ├── villes.json           ← Données de toutes les villes
│       └── services.json         ← Services, témoignages, FAQ
│
├── public/                       ← Fichiers copiés tels quels
│   ├── .htaccess                 ← Config Apache (OVH)
│   ├── send-rdv.php              ← Traitement formulaire
│   ├── sitemap.xml               ← SEO
│   ├── robots.txt
│   ├── mentions-legales/
│   ├── politique-confidentialite/
│   └── zone-intervention-detailing-besancon/
│
├── scripts/
│   ├── generate-villes.js        ← Génère les pages villes
│   ├── copy-extras.js            ← Copie les extras dans dist/
│   └── deploy-ftp.sh             ← Déploiement FTP
│
├── dist/                         ← Build de production (gitignore)
│   ├── assets/css/
│   ├── assets/js/
│   └── pages/villes/             ← Pages générées
│
├── .env.deploy.example           ← Template credentials FTP
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer le dev server (http://localhost:3000)
npm run dev

# Build complet de production
npm run build

# Générer uniquement les pages villes
npm run generate:villes
```

---

## Ajouter une nouvelle ville

**1.** Ouvrir `src/data/villes.json`

**2.** Ajouter un objet à la fin du tableau :

```json
{
  "slug": "nom-de-la-ville",
  "nom": "Nom de la Ville",
  "dept": "Doubs",
  "deptCode": "25",
  "region": "Bourgogne-Franche-Comté",
  "codePostal": "25XXX",
  "description": "Meta description SEO (155 chars max)",
  "intro": "Texte court hero — HTML autorisé. <strong>Gras</strong> possible.",
  "seoContent": "Paragraphe SEO long — HTML autorisé.",
  "villesVoisines": ["besancon", "ornans"],
  "canonical": "https://www.finitionroyale.fr/pages/villes/nom-de-la-ville.html"
}
```

**3.** Générer et vérifier :

```bash
npm run generate:villes
# → dist/pages/villes/nom-de-la-ville.html créé
```

**4.** Ajouter au sitemap (`public/sitemap.xml`) et au footer SEO de `index.html`.

---

## Modifier le contenu

### Tarifs
Fichier : `src/data/services.json` → clé `services[].tarifs`

```json
"tarifs": {
  "citadine": "45–55€",
  "berline": "60–75€",
  "suv": "80–100€"
}
```

### Témoignages
Fichier : `src/data/services.json` → clé `temoignages`

### FAQ
Fichier : `src/data/services.json` → clé `faq`

### Services principaux
Fichier : `src/data/services.json` → clé `services`

---

## Variables CSS

Toutes les variables sont dans `src/styles/base.css` :

```css
:root {
  /* Couleurs */
  --or:           #C9A84C;   /* Doré principal */
  --or-light:     #E8C97A;   /* Doré clair */
  --noir:         #080808;   /* Fond principal */
  --blanc:        #F5F0E8;   /* Texte principal */
  --gris:         #6a6460;   /* Texte secondaire */

  /* Polices */
  --font-display: 'Bebas Neue';    /* Titres impact */
  --font-serif:   'Cormorant Garamond';  /* Italiques */
  --font-body:    'DM Sans';       /* Corps de texte */
}
```

---

## Déploiement FTP (OVH)

**1.** Copier et compléter le fichier de config :

```bash
cp .env.deploy.example .env.deploy
# Éditer .env.deploy avec vos identifiants OVH
```

**2.** Déployer :

```bash
# Dry run (aperçu sans transfert)
npm run deploy:dry

# Déploiement réel
source .env.deploy && npm run deploy
```

> Prérequis : `lftp` installé (`brew install lftp` ou `apt install lftp`)

---

## Tracking GTM/GA4

Les événements suivants sont trackés automatiquement :

| Événement | Déclencheur |
|-----------|-------------|
| `cta_click` | Clic bouton CTA primaire |
| `phone_click` | Clic lien téléphone |
| `email_click` | Clic lien email |
| `instagram_click` | Clic lien Instagram |
| `form_start` | Premier choix dans le formulaire |
| `form_step` | Navigation étapes formulaire |
| `form_submit_attempt` | Clic "Confirmer" |
| `form_success` | Soumission réussie |
| `scroll_depth` | 25 / 50 / 75 / 100% |

---

## Formulaire — send-rdv.php

Le PHP gère :
- ✅ Validation serveur (téléphone, email, date, énumérations)
- ✅ Anti-spam honeypot
- ✅ Rate limiting (3 soumissions max / IP / heure)
- ✅ Email professionnel → contact@finitionroyale.fr
- ✅ Email de confirmation → client
- ✅ Fallback log si mail() échoue
- ✅ Validation date (pas dimanche, pas dans le passé)

---

## Performance

- **CSS** : variables CSS, pas de framework = bundle ~15 KB
- **JS** : modules ES6, tree-shaking Vite = bundle ~8 KB
- **Polices** : preconnect + display=swap
- **Cache** : .htaccess avec expires et gzip
- **Images** : utiliser WebP + `loading="lazy"` + `width`/`height`

---

## SEO

- ✅ Schema.org LocalBusiness + FAQPage sur index
- ✅ Breadcrumb sur toutes les pages
- ✅ Canonical sur toutes les pages
- ✅ Sitemap.xml
- ✅ robots.txt
- ✅ .htaccess HTTPS + www → non-www

---

## Checklist avant mise en ligne

- [ ] GTM ID correct dans `index.html` et `ville.template.html`
- [ ] GA4 ID correct dans `modules/cookies.js`
- [ ] `send-rdv.php` : EMAIL_TO et EMAIL_FROM configurés
- [ ] SIRET ajouté dans `mentions-legales/index.html`
- [ ] Favicons en place dans `public/` (favicon.ico, favicon-32x32.png, apple-touch-icon.png)
- [ ] Image OG en place : `public/assets/img/og-finition-royale.jpg` (1200×630px)
- [ ] Logo en place : `public/assets/img/logo-finition-royale.png`
- [ ] Build de production testé localement
- [ ] `npm run deploy:dry` vérifié
- [ ] Google Search Console : sitemap soumis
- [ ] Test performance Lighthouse > 90
