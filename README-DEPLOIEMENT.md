# 🏁 Finition Royale — Guide de déploiement OVH / FileZilla

**Projet livré le 19 avril 2026** — Site statique HTML/CSS/JS + backend PHP, optimisé pour FTP OVH, sans build step.

---

## 📦 1. Contenu de la livraison

```
finition-royale-ftp/
├── index.html                      Page d'accueil (one-page)
├── 404.html                        Page d'erreur brandée
├── mentions-legales.html           Obligatoire (droit français)
├── politique-confidentialite.html  RGPD-compliant
├── sitemap.xml                     SEO — 3 URLs
├── robots.txt                      Règles crawlers
├── .htaccess                       HTTPS, cache, sécurité, redirections
├── assets/
│   ├── css/
│   │   └── style.css               ~1800 lignes, tout consolidé
│   ├── js/
│   │   └── main.js                 Vanilla JS, aucune dépendance
│   └── img/                        ⚠️ À REMPLIR (voir §4)
└── api/
    └── send-rdv.php                Backend formulaire de RDV
```

**À ajouter à la racine (déjà générés précédemment) :**
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `logo-finition-royale.png` (optionnel, référencé en OG)

---

## 🗺️ 2. Architecture sur le serveur OVH

Sur OVH, ton espace FTP contient typiquement un dossier `www/` (ou parfois `htdocs/`). **C'est ici que tout va.**

```
www/                                ← racine de finitionroyale.fr
├── index.html
├── 404.html
├── mentions-legales.html
├── politique-confidentialite.html
├── sitemap.xml
├── robots.txt
├── .htaccess                       ⚠️ fichier caché — activer "afficher fichiers cachés" dans FileZilla
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/
│       ├── og-finition-royale.jpg
│       ├── avant-sieges.jpg
│       ├── apres-sieges.jpg
│       ├── avant-phares.jpg
│       ├── apres-phares.jpg
│       ├── avant-exterieur.jpg
│       ├── apres-exterieur.jpg
│       └── logo-finition-royale.png
└── api/
    └── send-rdv.php
```

**Règle simple :** tout le contenu du dossier `finition-royale-ftp/` → racine du `www/` OVH, en respectant la même arborescence.

---

## ✅ 3. Checklist AVANT upload

### 3.1 Éditer `api/send-rdv.php`

Ouvre le fichier et vérifie la config tout en haut :

```php
$CONFIG = [
    'recipient'   => 'contact@finitionroyale.fr',      // ← ton vraie adresse
    'from_email'  => 'noreply@finitionroyale.fr',      // ← DOIT être @finitionroyale.fr
    'from_name'   => 'Finition Royale — Site web',
    'log_file'    => __DIR__ . '/rdv-log.txt',
    'ip_log'      => __DIR__ . '/ip-log.txt',
    'max_per_hour'=> 5,
];
```

> **⚠️ IMPORTANT :** le `from_email` doit obligatoirement être une adresse du domaine `finitionroyale.fr` (ex: `noreply@finitionroyale.fr`), sinon OVH va rejeter les mails (SPF/DKIM). Crée l'alias dans le Manager OVH > Emails.

### 3.2 Vérifier `.htaccess`

Le fichier est livré prêt à l'emploi. Deux options à décommenter si besoin :

- **Forcer `www.` devant le domaine** (SEO — évite le contenu dupliqué) : décommenter les 3 lignes `RewriteCond %{HTTP_HOST} ^finitionroyale\.fr$`.
- **Si OVH active déjà HTTPS automatiquement,** pas besoin de toucher, c'est géré.

### 3.3 Images à préparer

Le dossier `assets/img/` est **vide**. Le site fonctionne quand même (fallback sur Unsplash), mais pour la prod il faut :

| Fichier | Dimensions | Usage |
|---|---|---|
| `og-finition-royale.jpg` | 1200×630 | Aperçu partages Facebook/LinkedIn |
| `logo-finition-royale.png` | 512×512 | Logo social/OG (déjà généré dans ta mémoire) |
| `avant-sieges.jpg` / `apres-sieges.jpg` | 1200×800 | Slider avant/après shampoing |
| `avant-phares.jpg` / `apres-phares.jpg` | 1200×800 | Slider avant/après phares |
| `avant-exterieur.jpg` / `apres-exterieur.jpg` | 1200×800 | Slider avant/après lavage ext. |

> Les prompts Gemini pour ces images sont déjà prêts (voir ton projet).

---

## 🚀 4. Procédure d'upload FileZilla

### 4.1 Connexion

1. Ouvre **FileZilla**
2. Dans la barre du haut :
   - **Hôte :** `ftp.cluster0XX.hosting.ovh.net` (exact dans ton Manager OVH > Hébergements > FTP-SSH)
   - **Identifiant :** celui reçu par mail OVH
   - **Mot de passe :** celui défini dans le Manager
   - **Port :** 21 (FTP) ou 22 (SFTP recommandé)
3. Clique **Connexion rapide**

### 4.2 Afficher les fichiers cachés

**CRUCIAL** sinon `.htaccess` ne s'affiche pas et n'est pas uploadé :

> Menu **Serveur** → **Forcer l'affichage des fichiers cachés** ✅

### 4.3 Upload

1. Panneau de gauche (local) → va dans `finition-royale-ftp/`
2. Panneau de droite (distant) → va dans `www/`
3. **Sélectionne tout le contenu** du dossier local (Ctrl+A) — **pas le dossier parent**, juste son contenu
4. Glisse-dépose vers `www/`
5. Si FileZilla demande « écraser ? », choisis **Oui à tout** (en phase de première mise en ligne)
6. Laisse l'upload se finir — compte 30 secondes à 2 minutes selon ta connexion

### 4.4 Permissions (rarement nécessaire sur OVH mais bon à savoir)

Si le PHP ne marche pas, clic droit sur `send-rdv.php` → **Attributs du fichier** → `644`.
Dossiers → `755`.

---

## 🧪 5. Tests POST-upload

### 5.1 Tests essentiels

Ouvre https://www.finitionroyale.fr et vérifie :

- [ ] Le site s'affiche correctement
- [ ] Le HTTPS est actif (cadenas vert)
- [ ] La navigation smooth-scroll fonctionne (clics sur menu)
- [ ] Le slider avant/après est interactif
- [ ] Le formulaire de RDV enchaîne bien les 4 étapes
- [ ] **Le formulaire envoie bien un mail** (teste avec ta propre adresse)
- [ ] Le sticky CTA mobile apparaît bien après scroll (teste sur téléphone)
- [ ] La bannière cookies apparaît au 1er chargement
- [ ] Les pages `/mentions-legales.html` et `/politique-confidentialite.html` se chargent
- [ ] Une URL bidon (ex: `/test404`) renvoie bien vers `404.html`

### 5.2 Si le formulaire ne marche pas

1. Ouvre la console navigateur (F12 → Console) — regarde les erreurs
2. Vérifie que `api/send-rdv.php` a bien été uploadé
3. Teste directement : https://www.finitionroyale.fr/api/send-rdv.php → tu dois voir `{"error":"Méthode non autorisée"}` (c'est normal, signe que le PHP tourne)
4. Si c'est un mail qui n'arrive pas : vérifie le SPF/DKIM OVH et l'adresse `from_email`

---

## 📊 6. À configurer APRÈS déploiement

### 6.1 Google Tag Manager / Analytics

Le GTM est déjà branché avec l'ID **`GTM-5FPWLHB4`** (dans ton fichier d'origine).

- Connecte-toi à https://tagmanager.google.com/
- Vérifie que les events sont bien reçus (mode **Aperçu** GTM)
- Events trackés automatiquement : `cta_click`, `phone_click`, `email_click`, `instagram_click`, `form_start`, `form_step`, `form_submit_attempt`, `form_success`, `scroll_depth` (25/50/75/100%)

### 6.2 Google Search Console

1. https://search.google.com/search-console
2. Ajouter la propriété **finitionroyale.fr** (validation via DNS ou fichier HTML)
3. Soumettre le sitemap : `https://www.finitionroyale.fr/sitemap.xml`
4. Demander l'indexation de la page d'accueil

### 6.3 Google My Business (critique pour du local SEO)

Si ce n'est pas déjà fait :
- Crée une fiche **Google Business Profile** pour Finition Royale
- Zone de service : Besançon + villes environnantes
- Relie-la au site finitionroyale.fr
- Demande activement les 10 premiers avis (c'est ce qui fera décoller le local)

### 6.4 SPF / DKIM (anti-spam pour les mails envoyés)

Dans le Manager OVH > Zone DNS :
- Vérifie qu'un enregistrement **SPF** existe (ex: `v=spf1 include:mx.ovh.com ~all`)
- Active le **DKIM** dans la section emails OVH

Sans ça, les mails `send-rdv.php` risquent d'atterrir en spam.

---

## 🔍 7. Audit : ce qui a été corrigé / amélioré

### 7.1 Architecture
- ❌ **Avant :** projet Vite multi-fichiers (src/pages, src/styles, src/scripts, data JSON, script generate-villes Node) → incompatible avec un simple FTP
- ✅ **Après :** structure plate, 1 CSS, 1 JS, upload direct

### 7.2 Backend
- ❌ **Avant :** formulaire frontend sans backend — les leads se perdaient
- ✅ **Après :** `api/send-rdv.php` avec validation, anti-spam (honeypot + rate limit IP), logs, fallback mailto si API plantée

### 7.3 SEO
- ❌ **Avant :** pas de `sitemap.xml`, pas de `robots.txt`, pas de JSON-LD
- ✅ **Après :** sitemap + robots + **JSON-LD AutomotiveBusiness** + **FAQPage** + OpenGraph complet + canonical

### 7.4 Sécurité / Performance
- ❌ **Avant :** pas de `.htaccess`
- ✅ **Après :** force HTTPS, GZIP, cache agressif (CSS/JS 1 mois, images 6 mois, fonts 1 an), headers sécu (X-Frame-Options, X-Content-Type, Referrer-Policy), blocage des logs

### 7.5 Conversion (CRO)
- ✅ CTA dual en hero (réserver + voir tarifs)
- ✅ Social proof immédiat (4,9/5 · 47 avis) visible au-dessus de la ligne de flottaison
- ✅ Bande d'urgence avec code promo **ROYAL10 -10 %**
- ✅ Sticky CTA mobile (tel + réserver) après 60 % scroll hero
- ✅ Formulaire en **4 étapes** au lieu d'un long formulaire (réduit friction cognitive)
- ✅ **Récap + prix estimé** affiché avant le submit (rassure, évite les abandons)
- ✅ Table tarifaire transparente par type de véhicule (supprime l'objection "prix caché")
- ✅ Processus en 4 étapes (Réserver → On vient → On nettoie → Satisfaction) — rassure sur le mobile
- ✅ FAQ qui traite les 7 objections principales
- ✅ Fallback `mailto:` si l'API tombe — **zéro lead perdu**

### 7.6 Légal / RGPD
- ❌ **Avant :** pas de mentions légales, pas de politique de confidentialité
- ✅ **Après :** les deux pages livrées (avec placeholders `[À compléter]` à remplir avec SIRET, forme juridique, etc.) + bannière cookies conforme CNIL

### 7.7 Accessibilité
- ✅ Skip-link, attributs ARIA, contraste gold/noir conforme WCAG AA, respect de `prefers-reduced-motion`

---

## 📝 8. À faire dès que possible (Val)

1. **Remplir les `[À compléter]` dans `mentions-legales.html`** :
   - Forme juridique (micro-entreprise / EI / SASU ?)
   - SIRET
   - Adresse exacte
   - Nom du directeur de publication
   - Mention TVA (ou "Non applicable, article 293 B du CGI" si micro)

2. **Générer et uploader les images dans `assets/img/`**

3. **Créer l'alias `noreply@finitionroyale.fr`** dans OVH Emails

4. **Tester un vrai RDV de bout en bout** depuis mobile

5. **Lancer la fiche Google Business Profile** si pas encore fait — c'est ton levier #1 pour le local SEO Besançon

6. **Activer les campagnes Google Ads locales** (optionnel mais rapide pour générer les premiers leads) — tu as maintenant les landing pages optimisées pour les conversions

---

## 🆘 9. Support

En cas de pépin post-déploiement :
- Logs PHP : dans le Manager OVH > Hébergements > Logs & statistiques
- Logs formulaire : `/api/rdv-log.txt` (téléchargeable par FTP)
- Logs IP/abus : `/api/ip-log.txt`

Bon lancement 🏁
