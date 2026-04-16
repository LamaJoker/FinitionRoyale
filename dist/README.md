# Finition Royale — Site Web

Detailing automobile à domicile — Besançon & Doubs

---

## Stack

- **HTML/CSS/JS** vanilla (sans framework)
- **Vite** — build, minification, dev server
- **Système de templates** Node.js pour les pages villes
- **Google Tag Manager** + GA4

---

## Structure du projet

```
finition-royale/
├── src/
│   ├── components/          # Composants HTML réutilisables (nav, footer)
│   ├── pages/
│   │   ├── index.html       # Page principale
│   │   └── ville.template.html  # Template générique pour les villes
│   ├── styles/
│   │   ├── base.css         # Reset, variables, typographie
│   │   ├── components.css   # Boutons, cards, badges, formulaire
│   │   └── layout.css       # Nav, hero, grilles, sections, footer
│   ├── scripts/
│   │   ├── main.js          # Entry point — importe tous les modules
│   │   └── modules/
│   │       ├── nav.js       # Navigation scroll + burger + smooth scroll
│   │       ├── form.js      # Formulaire RDV multi-étapes + validation
│   │       ├── animations.js # Scroll reveal + compteurs animés
│   │       ├── tracking.js  # GTM/GA4 — CTA, form, scroll
│   │       └── cookies.js   # Bandeau RGPD
│   └── data/
│       ├── villes.json      # Données de toutes les villes
│       └── services.json    # Services, témoignages, FAQ
│
├── scripts/
│   └── generate-villes.js  # Générateur de pages villes (Node.js)
│
├── public/
│   └── assets/             # Images statiques, favicons
│
├── dist/                   # Build de production (gitignore)
├── package.json
├── vite.config.js
└── README.md
```

---

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Build de production
npm run build

# Générer uniquement les pages villes
npm run generate:villes
```

---

## Ajouter une nouvelle ville

1. **Ouvrir** `src/data/villes.json`

2. **Ajouter** un objet ville à la fin du tableau :

```json
{
  "slug": "votre-ville",
  "nom": "Votre Ville",
  "dept": "Doubs",
  "deptCode": "25",
  "region": "Bourgogne-Franche-Comté",
  "codePostal": "25XXX",
  "description": "Meta description (155 chars max)",
  "intro": "Texte intro hero (HTML autorisé)",
  "seoContent": "Contenu SEO principal (HTML autorisé)",
  "villesVoisines": ["besancon", "ornans"],
  "canonical": "https://www.finitionroyale.fr/pages/villes/votre-ville.html"
}
```

3. **Générer** les pages :

```bash
npm run generate:villes
```

4. **Vérifier** dans `dist/pages/villes/votre-ville.html`

---

## Modifier le contenu

### Tarifs
→ Modifier `src/data/services.json` — clé `services[].tarifs`

### Témoignages
→ Modifier `src/data/services.json` — clé `temoignages`

### FAQ
→ Modifier `src/data/services.json` — clé `faq`

### Services (liste + icônes)
→ Modifier `src/data/services.json` — clé `services`

---

## Variables CSS

Toutes les variables de design sont dans `src/styles/base.css` :

```css
:root {
  --or:           #C9A84C;   /* Couleur principale */
  --or-light:     #E8C97A;
  --noir:         #080808;   /* Fond principal */
  --blanc:        #F5F0E8;   /* Texte principal */
  --font-display: 'Bebas Neue';
  --font-serif:   'Cormorant Garamond';
  --font-body:    'DM Sans';
}
```

---

## Tracking

Les événements suivants sont automatiquement trackés (GTM/GA4) :

| Événement | Déclencheur |
|-----------|-------------|
| `cta_click` | Clic sur bouton CTA primaire |
| `phone_click` | Clic sur lien téléphone |
| `email_click` | Clic sur lien email |
| `instagram_click` | Clic sur lien Instagram |
| `form_start` | Premier choix dans le formulaire |
| `form_step` | Navigation entre étapes formulaire |
| `form_submit_attempt` | Clic sur "Confirmer" |
| `form_success` | Soumission réussie |
| `scroll_depth` | Profondeur de scroll (25/50/75/100%) |

---

## Build de production

```bash
npm run build
```

Génère dans `/dist` :
- HTML minifié
- CSS minifié
- JS minifié + tree-shaken
- Pages villes générées

---

## Déploiement FTP (OVH)

```bash
# Après build
npm run build

# Uploader le contenu de dist/ sur FTP
# Racine → www/ ou public_html/
```

---

## Performance

- Fonts Google préchargées (preconnect)
- Images : utiliser WebP + `loading="lazy"`
- JS : modules ES6 + tree-shaking via Vite
- CSS : pas de framework (bundle minimal)

---

## Checklist avant mise en ligne

- [ ] GTM ID configuré dans `index.html` et `ville.template.html`
- [ ] GA4 ID configuré dans `modules/cookies.js`
- [ ] `send-rdv.php` déployé sur le serveur
- [ ] Toutes les villes générées (`npm run generate:villes`)
- [ ] Favicons en place dans `/public/`
- [ ] Images OG en place (`/public/assets/img/og-finition-royale.jpg`)
- [ ] sitemap.xml créé et soumis à Google Search Console
- [ ] Build de production testé (`npm run build && npm run preview`)
