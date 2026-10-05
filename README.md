# Finition Royale — site vitrine

Site d'une entreprise de **detailing automobile premium à domicile** à Besançon (Doubs).
Conçu et développé de A à Z : design, intégration, générateur statique, SEO, performance et sécurité.

**En ligne : [finition-royale.vercel.app](https://finition-royale.vercel.app)**

![Aperçu du site Finition Royale sur ordinateur et mobile](docs/preview.jpg)

| Lighthouse (mobile) | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | :---: | :---: | :---: | :---: |
| Accueil | 98 | 100 | 100 | 100 |
| Prestations | 98 | 100 | 100 | 100 |
| Devis en ligne | 99 | 100 | 100 | 100 |
| Article de blog | 98 | 100 | 100 | 100 |

*CLS = 0 sur toutes les pages mesurées. CSS 11 Ko et JS 4 Ko une fois compressés, zéro dépendance côté navigateur.*

---

## Ce que le projet montre

### Design
- **Design system** sobre et luxueux (noir, or, Cormorant Garamond + DM Sans) décliné en tokens CSS : couleurs, typographie fluide (`clamp()`), espacements, rayons, ombres.
- Composants : cartes de formules avec bordure en dégradé, comparatif, calculateur à cartes de choix, galerie défilante (`scroll-snap`), visionneuse en `<dialog>` natif, accordéon FAQ animé (`::details-content`), menu mobile plein écran.
- **Carte des zones générée en SVG** à partir des coordonnées GPS des communes (projection, anneaux de distance) : aucun service de carte tiers.
- Animations au défilement **en CSS pur** (`animation-timeline: view()`), désactivées si l'utilisateur préfère réduire les animations.
- Typographie française automatique : espaces insécables avant `: ; ? !`, guillemets « », apostrophes typographiques.

### SEO
- **Graphe JSON-LD** cohérent sur chaque page : `WebSite`, `AutoWash` (entreprise, zone desservie, horaires, catalogue d'offres avec fourchettes de prix), `WebPage`, `BreadcrumbList`, `BlogPosting`, `Service` par commune.
- **FAQPage générée depuis le contenu visible** : le balisage ne peut pas diverger de la page.
- Fil d'Ariane HTML + données structurées produits depuis une seule déclaration (`parent:` dans le front-matter).
- URL canonique et `og:url` **déduites du domaine de production réel** (`VERCEL_PROJECT_PRODUCTION_URL`) : brancher un nom de domaine ne demande aucune modification de code.
- Sitemap avec dates de mise à jour par page et images, `robots.txt`, `llms.txt` pour les assistants IA, images Open Graph par article.
- Six pages locales (Besançon, Thise, Devecey, Baume-les-Dames, Ornans, Montbéliard) et quatre guides, maillés entre eux.

### Performance
- Images **AVIF / WebP / JPEG en 4 largeurs** avec `srcset` + `sizes`, dimensions déclarées (zéro décalage de mise en page).
- Polices **auto-hébergées**, sous-ensemble latin, préchargées, avec **polices de secours aux métriques ajustées** (`size-adjust`, calculées avec Capsize) pour supprimer le saut à l'affichage.
- CSS et JS minifiés (esbuild) et **nommés par empreinte** : cache navigateur d'un an sans risque de servir une ancienne version.
- Logo et icônes en SVG inline : le logo PNG de 139 Ko est remplacé par un SVG de 0,9 Ko.

### Accessibilité
- Lien d'évitement, focus visible, `aria-current` sur la navigation, menu et visionneuse en `<dialog>` modal (focus piégé, Échap).
- Calculateur en boutons radio natifs, estimation annoncée par une région `aria-live`, erreurs de formulaire reliées aux champs (`aria-invalid`).
- Contrastes AA, respect de `prefers-reduced-motion`.

### Sécurité & RGPD
- **CSP stricte sans `unsafe-inline`** : aucun script, style ni gestionnaire d'événement inline (vérifié automatiquement).
- HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- Google Analytics chargé **uniquement après consentement** ; aucune requête vers Google Fonts.

---

## Architecture

Pas de framework : un **générateur statique maison** d'environ 700 lignes commentées, sans autre dépendance qu'esbuild (minification) et sharp (images, en local).

```
src/
├── config.js          Source unique : identité, tarifs, communes, légal…
├── pages/             Une page = front-matter + HTML
├── components/        Gabarit, en-tête, pied de page, barre mobile, bandeau cookies
├── partials/          Blocs réutilisables      <fr-include name="cta-band" title="…">
├── icons/             Icônes SVG               <fr-icon name="phone">
├── images/            Photos sources haute qualité
├── assets/            CSS, JS, polices, logo, images générées
└── server/htaccess    Configuration Apache (hébergement hors Vercel)
scripts/
├── build.js           Génère dist/
├── check.js           Contrôle qualité du site généré
├── images.js          Déclinaisons AVIF/WebP/JPEG + manifeste
├── brand.js           Favicons, icônes PWA, image Open Graph (Chrome headless)
└── serve.js           Serveur local
```

**Le générateur :**
- `{{ variable }}` et `{{ objet.chemin.0.cle }}` résolus depuis la config. **Une variable inconnue fait échouer le build** : pas de `{{prix}}` oublié en production.
- Shortcodes : `<fr-picture name="…" sizes="…">` produit un `<picture>` complet depuis le manifeste d'images ; `<fr-include>` et `<fr-icon>` gèrent les blocs et les icônes.
- Les tarifs sont déclarés **une seule fois** dans `config.js`, puis réutilisés par les cartes, le comparatif, les données structurées et le calculateur de devis (injectés en JSON).
- Liste du blog et « À lire aussi » générées depuis le front-matter des articles (catégorie, dates, temps de lecture calculé).

**Le contrôle qualité** (`npm run check`, bloquant : code de sortie 1 en cas d'erreur) vérifie chaque page : titre et description (présence, longueur, unicité), un seul `<h1>`, canonical absolue, liens internes **et ancres**, `alt` et dimensions des images, `srcset` existants, JSON-LD valide, IDs uniques, `rel="noopener"`, compatibilité CSP et cohérence du sitemap.

## Démarrer

```bash
npm install
npm run dev          # build + serveur local sur http://localhost:8099
```

| Commande | Rôle |
| --- | --- |
| `npm run build` | Génère `dist/` |
| `npm run check` | Contrôle qualité du site généré |
| `npm test` | Build + contrôle |
| `npm run images` | Régénère les variantes d'images depuis `src/images/` |
| `npm run brand` | Régénère favicons, icônes et image de partage |

## Contenu

- **Tarifs, horaires, coordonnées, communes** → `src/config.js`.
- **Nouvelle page** → `src/pages/ma-page.html` avec un front-matter (`title`, `description`, `crumb`, `parent`…). Elle rejoint automatiquement le sitemap.
- **Nouvel article** → même chose avec `type: "article"`, `parent: "blog"`, `category`, `published`, `image`. Il apparaît sur la page Conseils.
- **Nouvelle photo** → déposer l'original dans `src/images/`, lancer `npm run images`, puis l'utiliser via `<fr-picture name="…">`.
- **Visuels avant/après** → les images actuelles sont des visuels d'illustration, signalés comme tels sur le site. Une fois remplacées par des photos de chantiers, passer `visualsAreIllustrations` à `false` dans la config : les légendes s'adaptent.

## Déploiement

- **Vercel** : `vercel.json` (installation, build, en-têtes de sécurité, cache). Chaque pull request obtient une URL de prévisualisation.
- **Apache / OVH** : `dist/.htaccess` reproduit le même comportement (URLs propres, HTTPS, en-têtes, cache).

---

Conception et développement : [Valentin Lhomme-Choulet](https://lamajoker.github.io/).
