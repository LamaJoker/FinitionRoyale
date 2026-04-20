# Finition Royale — Déploiement OVH (version CRO)

Site d'acquisition optimisé conversion. À déployer tel quel par FTP sur ton hébergement OVH.

---

## 📦 Ce que contient le pack

```
/
├── index.html                    — Landing page CRO
├── 404.html                      — Page d'erreur
├── mentions-legales.html         — ⚠️ À compléter (SIRET, forme juridique)
├── politique-confidentialite.html
├── robots.txt
├── sitemap.xml
├── .htaccess                     — HTTPS, cache, sécurité
├── favicon.ico · apple-touch-icon.png · favicon-16/32.png
├── api/
│   └── send-rdv.php             — Traitement formulaire (à configurer)
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/                     — 8 images à générer (voir plus bas)
```

---

## 🚀 Déploiement (5 minutes)

### 1. Upload FTP via FileZilla
- **Hôte** : `ftp.cluster0XX.hosting.ovh.net` (à adapter)
- **Protocole** : FTP (ou SFTP si dispo)
- **Port** : 21
- **Active les fichiers cachés** : *Serveur → Forcer l'affichage des fichiers cachés* (pour uploader le `.htaccess`)

Upload tout le contenu du dossier dans le dossier racine de ton hébergement OVH (`www/` ou équivalent).

### 2. Vérifier après upload
- https://www.finitionroyale.fr — page principale
- https://www.finitionroyale.fr/api/send-rdv.php — doit retourner un JSON 405 (Method Not Allowed) : ✅ PHP fonctionne
- https://www.finitionroyale.fr/404page-test — doit afficher la 404 personnalisée

---

## ⚙️ À configurer AVANT le lancement

### 1. Formulaire — `api/send-rdv.php` ligne 9-12
```php
'recipient'    => 'contact@finitionroyale.fr',   // Où tu veux recevoir les leads
'recipient_cc' => '',                             // Optionnel (email secondaire)
'from_email'   => 'noreply@finitionroyale.fr',   // DOIT être un alias du domaine
```

**Important OVH** : crée un alias `noreply@finitionroyale.fr` dans l'espace client OVH.
Sans ça, les mails seront bloqués en spam (SPF échoue).

### 2. Mentions légales — `mentions-legales.html`
Remplacer dans le fichier :
- `[À compléter]` par : SIRET, forme juridique (EI, EURL, SASU…), TVA si applicable
- Adresse complète du siège social

### 3. Google Tag Manager — déjà en place
- ID : `GTM-5FPWLHB4`
- Events trackés nativement :
  - `cta_click` (param: location) — 46 points de contact
  - `phone_click` (param: location)
  - `whatsapp_click` (param: location)
  - `form_start`, `form_field_filled`, `form_submit_attempt`, `form_success`
  - `scroll_depth` (25/50/75/100)
  - `time_on_page` (15/30/60/120/300s)
  - `before_after_interaction`, `faq_open`

---

## 🖼️ Images à générer (8 fichiers)

Chemin : `/assets/img/`

| Fichier | Usage | Prompt Gemini |
|---|---|---|
| `avant-sieges.jpg` | Avant/après section | Sièges voiture encrassés, taches, usure, photo réaliste |
| `apres-sieges.jpg` | Avant/après section | Mêmes sièges, propres, comme neufs |
| `avant-phares.jpg` | Avant/après section | Phare de voiture jauni, oxydé, opaque |
| `apres-phares.jpg` | Avant/après section | Même phare, transparent, comme neuf |
| `avant-exterieur.jpg` | Avant/après section | Carrosserie sale, poussière, traces d'eau |
| `apres-exterieur.jpg` | Avant/après section | Même voiture, brillante, lustrée, reflet net |
| `og-finition-royale.jpg` | Partage Facebook/LinkedIn (1200×630) | Montage : logo FR doré + voiture premium + texte "Detailing à domicile Besançon" |

⚠️ En attendant tes images finales, le site utilise un fallback vers Unsplash (`onerror` sur les `<img>`) — tu peux lancer sans les images, elles se rempliront au fur et à mesure que tu les upload.

---

## 🧪 Tester le formulaire

1. Va sur `/#rdv`
2. Remplis avec : Prénom "Test", Téléphone "0612345678", Ville "Besançon"
3. Envoie → tu dois recevoir un email HTML stylé sur `contact@finitionroyale.fr`
4. Si **rien** arrive :
   - Vérifie les spams
   - Vérifie l'alias `noreply@finitionroyale.fr` sur OVH
   - Regarde `/api/rdv-log.txt` (créé automatiquement) pour voir si le POST a été reçu

---

## 📊 Checklist de lancement CRO

- [ ] Alias `noreply@finitionroyale.fr` créé sur OVH
- [ ] Email `contact@finitionroyale.fr` reçoit bien un test de formulaire
- [ ] SIRET + forme juridique dans `mentions-legales.html`
- [ ] 8 images dans `/assets/img/`
- [ ] Google Business Profile créé + vérifié (adresse Besançon, zone 40 km)
- [ ] 5 premiers vrais avis Google obtenus (SMS clients existants)
- [ ] GTM configuré côté GA4 / Meta Pixel pour tracker les events
- [ ] Téléphone testé depuis mobile : le clic ouvre bien le dialer
- [ ] WhatsApp testé depuis mobile : ouvre bien avec message pré-rempli
- [ ] Formulaire testé depuis mobile : envoi OK, lead reçu

---

## 🎯 Ce qui a été optimisé CRO (vs première version)

| Point de friction | Solution appliquée |
|---|---|
| Formulaire 4 étapes → abandon | **Formulaire 4 champs** (prénom, tel, ville, besoin) avec promesse "rappel sous 1h" |
| Pas de téléphone mobile visible | **Téléphone dans la nav** + sticky mobile 3-boutons (appel/WA/réserver) |
| Pas de WhatsApp | **6 points WhatsApp** : hero, nav mobile, zone, form alt, FAQ, sticky, float desktop |
| Avis enterrés en §8 | **Avis remontés en §5**, après avant/après (preuve visuelle puis sociale) |
| Zone géo floue | **Carte visuelle 40 km** + liste 10 villes cliquables + mention quartiers Besançon |
| Pas de garantie | **Proof bar 4 garanties** sous hero + section "Pourquoi nous" 4 cartes |
| Pas d'urgence | **Bandeau disponibilité live** : "Demain 14h · 2 créneaux cette semaine" |
| Pas de tracking fin | **46 CTAs tagués** `data-cta` avec location précise (nav/hero/sticky/ba/pack…) |

---

## 🗺️ Prochaines étapes (après mise en ligne)

1. **Pages villes SEO** (à faire en session dédiée) — 10 pages : /dole, /pontarlier, /ornans, /baume-les-dames, /quingey, /thise, /chalezeule, /saone, /audeux, /besancon
2. **Blog SEO** (3 articles minimum) :
   - "Comment enlever une tache de café sur un siège de voiture"
   - "Combien coûte un nettoyage auto professionnel à Besançon ?"
   - "Detailing auto vs lavage classique : la vraie différence"
3. **Review Schema individuel** (snippet étoiles dans Google)
4. **Hotjar / Microsoft Clarity** (heatmap gratuite) pour voir où les visiteurs bloquent
5. A/B test hero : "Réserver" vs "Appeler maintenant" comme CTA primaire

---

## 📞 Contact technique

Problème de déploiement ? Questions sur le code ? Le code est volontairement vanilla (pas de build, pas de framework) pour rester simple à maintenir et rapide à charger. Tout se modifie dans les 3 fichiers principaux :
- `index.html` — contenu
- `assets/css/style.css` — design
- `assets/js/main.js` — interactions + tracking
