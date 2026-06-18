# Finition Royale — Site web

Architecture build-once, deploy-static. SEO-ready, optimisé pour OVH.

## Structure

```
finition-royale/
├── src/                    ← ÉDITEZ ICI
│   ├── config.js           ← Téléphone, zones, GA ID, marque, etc.
│   ├── components/         ← Nav, footer, sticky CTA, head, layout
│   ├── pages/              ← Contenu des pages (front-matter + HTML)
│   └── assets/             ← CSS, JS, images, logos, favicons
│
├── dist/                   ← GÉNÉRÉ AUTO (à uploader sur OVH)
│   ├── *.html              ← Pages complètes, SEO-ready
│   ├── assets/
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── .htaccess           ← URL propres, cache, HTTPS, sécurité
│   ├── site.webmanifest
│   └── 404.html
│
├── build.js                ← Script de build (Node.js)
└── package.json
```

## Workflow

### 1. Pré-requis (une seule fois)
Installer Node.js ≥ 16 : https://nodejs.org

### 2. Modifier le site
- Numéro de téléphone → `src/config.js`
- Ajouter/modifier une page → `src/pages/ma-page.html`
- Modifier le menu → `src/components/nav.html`
- Modifier le footer → `src/components/footer.html`
- Modifier le CTA mobile → `src/components/sticky-cta.html`

### 3. Builder
```bash
node build.js
```

### 4. Tester en local
```bash
cd dist && python3 -m http.server 8000
# Ouvrir http://localhost:8000
```

### 5. Uploader sur OVH
Uploader **TOUT le contenu de `dist/`** à la racine de ton hébergement OVH via FTP (FileZilla).

⚠️ **Ne pas oublier le fichier `.htaccess`** (caché, commence par un point).

---

## Points importants

### URLs propres
Grâce à `.htaccess`, les URLs sont sans `.html` :
- ✅ `finition-royale.fr/prestations`
- ❌ ~~`finition-royale.fr/prestations.html`~~ (redirigé 301)

### SEO intégré
- **JSON-LD LocalBusiness** (étoiles dans Google) — `src/components/head.html`
- **JSON-LD FAQPage** (résultats enrichis FAQ) — dans `pages/faq.html`
- **Sitemap.xml** généré auto
- **Canonical URLs** sur chaque page
- **Open Graph** complet par page

### Google Analytics 4
1. Créer un compte GA4 : https://analytics.google.com
2. Récupérer le Measurement ID (format `G-XXXXXXXXXX`)
3. Le coller dans `src/config.js` → `gaId`
4. Rebuild → l'ID est injecté partout

### Tracking des CTA
Tous les boutons ont un attribut `data-track="cta_xxx"`. Le JS envoie automatiquement un événement GA4 `cta_click` à chaque clic. Tu peux ensuite mesurer :
- Quels CTA convertissent le mieux
- Quelles pages génèrent le plus de conversions
- WhatsApp vs SMS : que préfèrent les clients

### Performance
- Fonts preloadées
- CSS/JS minifiables (ajouter une étape plus tard si besoin)
- Cache navigateur 1 an sur les assets (via `.htaccess`)
- Compression gzip active (via `.htaccess`)

---

## Todo restant

- [ ] **Créer une clé Web3Forms** (https://web3forms.com) et la coller dans `src/config.js` → `web3formsKey`. Sans elle, le formulaire de contact ne transmet pas les demandes. ← *seul point bloquant*
- [ ] Vérifier que l'ID GA4 (`gaId` dans `src/config.js`) correspond bien au compte Analytics.
- [ ] Ajouter de nouvelles photos avant/après au fil des chantiers dans `src/assets/` puis les référencer dans `src/pages/avant-apres.html`.
- [ ] Ajouter les vrais avis Google quand ils arrivent (sections « Témoignages » des pages zones).

### Déjà fait ✅
- Données légales réelles injectées (SIRET, SIREN, gérant, siège social) — `src/config.js` → `legal`.
- `og-image.jpg` (1200×630) généré automatiquement au build (rendu du SVG de marque via sharp).
- Vraies photos intégrées : avant/après (Qashqai, Clio, 308), photo équipe (à-propos), vignettes blog — déclinées en AVIF/WebP/JPEG.
- Clé Web3Forms centralisée dans `src/config.js`.

---

## Ajouter une nouvelle page

1. Créer `src/pages/ma-nouvelle-page.html` avec un front-matter :

```html
---
title: "Titre SEO | Finition Royale"
description: "Description SEO (max 160 caractères)"
path: "/ma-nouvelle-page"
slug: "ma-nouvelle-page"
---

<section class="page-hero">
  <div class="container">
    <h1>Mon titre</h1>
  </div>
</section>

<!-- Le contenu HTML ici -->
```

2. `node build.js`
3. La page est générée + ajoutée au sitemap automatiquement
4. Upload de `dist/` sur OVH

---

## Dépannage

**"Variables {{xxx}} restent dans le HTML"**  
→ La clé n'existe pas dans `config.js`. Ajoute-la.

**"La nav/footer ne s'affiche pas"**  
→ Tu as oublié de rebuild. Fais `node build.js`.

**"URLs propres ne marchent pas sur OVH"**  
→ Vérifier que `.htaccess` est bien uploadé (il est caché). Activer "Afficher les fichiers cachés" dans FileZilla.
