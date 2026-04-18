<?php
/**
 * send-rdv.php — Traitement formulaire RDV Finition Royale
 * Validation serveur + anti-spam + envoi email
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// ── Config ──────────────────────────────────────────────────────────────────
define('EMAIL_TO',      'contact@finitionroyale.fr');
define('EMAIL_FROM',    'noreply@finitionroyale.fr');
define('EMAIL_SUBJECT', 'Nouvelle demande de RDV — Finition Royale');
define('RATE_LIMIT_MAX', 3);   // max soumissions par IP / heure
define('RATE_LIMIT_TTL', 3600);

// ── Helpers ──────────────────────────────────────────────────────────────────
function json_exit(bool $success, string $message = '', int $code = 200): never {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

function clean(string $v): string {
    return htmlspecialchars(trim(strip_tags($v)), ENT_QUOTES, 'UTF-8');
}

function validate_phone(string $v): bool {
    return (bool) preg_match('/^(\+33|0)[1-9][\d\s.\-]{7,12}$/', preg_replace('/\s+/', '', $v));
}

function validate_email(string $v): bool {
    return (bool) filter_var($v, FILTER_VALIDATE_EMAIL);
}

// ── CORS (dev) ────────────────────────────────────────────────────────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://www.finitionroyale.fr', 'https://finitionroyale.fr'];
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}

// ── Method ────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_exit(false, 'Méthode non autorisée', 405);
}

// ── Rate limiting (session-based + IP-based via file) ────────────────────────
$ip      = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ip_key  = sys_get_temp_dir() . '/rdv_rl_' . md5($ip);
$rl_data = file_exists($ip_key) ? json_decode(file_get_contents($ip_key), true) : ['count' => 0, 'ts' => time()];

if (time() - $rl_data['ts'] > RATE_LIMIT_TTL) {
    $rl_data = ['count' => 0, 'ts' => time()];
}
if ($rl_data['count'] >= RATE_LIMIT_MAX) {
    json_exit(false, 'Trop de tentatives. Réessayez dans une heure.', 429);
}

// ── Honeypot ──────────────────────────────────────────────────────────────────
$honeypot = $_POST['_honeypot'] ?? '';
if (!empty($honeypot)) {
    // Bot détecté — simuler un succès silencieux
    json_exit(true, 'Demande envoyée avec succès.');
}

// ── Champs requis ─────────────────────────────────────────────────────────────
$required = ['prenom', 'nom', 'tel', 'vehicule', 'service', 'rdv-date', 'creneau', 'localite', 'rgpd'];
foreach ($required as $field) {
    if (empty($_POST[$field])) {
        json_exit(false, "Champ requis manquant : $field", 422);
    }
}

// ── Validation ────────────────────────────────────────────────────────────────
$prenom   = clean($_POST['prenom']);
$nom      = clean($_POST['nom']);
$tel      = clean($_POST['tel']);
$email    = clean($_POST['email'] ?? '');
$vehicule = clean($_POST['vehicule']);
$service  = clean($_POST['service']);
$date     = clean($_POST['rdv-date']);
$creneau  = clean($_POST['creneau']);
$localite = clean($_POST['localite']);
$marque   = clean($_POST['marque'] ?? '');
$etat     = clean($_POST['etat'] ?? '');
$comment  = clean($_POST['service-comment'] ?? '');

// Valider téléphone
if (!validate_phone($tel)) {
    json_exit(false, 'Numéro de téléphone invalide.', 422);
}

// Valider email si fourni
if (!empty($email) && !validate_email($email)) {
    json_exit(false, 'Adresse email invalide.', 422);
}

// Valider date (pas dans le passé, pas un dimanche)
$date_ts = strtotime($date);
if ($date_ts === false || $date_ts < strtotime('today')) {
    json_exit(false, 'Date invalide.', 422);
}
if (date('N', $date_ts) === '7') {
    json_exit(false, 'Nous sommes fermés le dimanche.', 422);
}

// Valider énumérations
$vehicules_ok = ['citadine', 'berline', 'suv'];
$services_ok  = ['interieur', 'shampoing', 'exterieur', 'phares', 'pack'];
if (!in_array($vehicule, $vehicules_ok, true)) {
    json_exit(false, 'Type de véhicule invalide.', 422);
}
if (!in_array($service, $services_ok, true)) {
    json_exit(false, 'Service invalide.', 422);
}

// ── Construire l'email ────────────────────────────────────────────────────────
$vehicule_labels = [
    'citadine' => 'Citadine (Clio, 208…)',
    'berline'  => 'Berline / SUV',
    'suv'      => '4×4 / Utilitaire',
];
$service_labels = [
    'interieur' => 'Intérieur Complet',
    'shampoing' => 'Shampoing Sièges & Tapis',
    'exterieur' => 'Lavage Extérieur Premium',
    'phares'    => 'Rénovation Phares',
    'pack'      => 'Pack Intérieur + Extérieur',
];

$date_fr  = strftime('%A %d %B %Y', $date_ts);
$v_label  = $vehicule_labels[$vehicule] ?? $vehicule;
$s_label  = $service_labels[$service]  ?? $service;

$body = <<<EOT
Nouvelle demande de rendez-vous — Finition Royale
═══════════════════════════════════════════════════

👤 CLIENT
  Prénom  : $prenom
  Nom     : $nom
  Tél     : $tel
  Email   : {$email}

🚗 VÉHICULE
  Type    : $v_label
  Marque  : {$marque}
  État    : {$etat}

🧼 PRESTATION
  Service : $s_label

📅 RENDEZ-VOUS
  Date    : $date_fr
  Créneau : $creneau
  Lieu    : $localite

💬 COMMENTAIRES
  $comment

───────────────────────────────────────────────────
Répondre à ce client :
  Tél   : $tel
  Email : {$email}
───────────────────────────────────────────────────
Envoyé le : EOT . date('d/m/Y à H:i');

$headers  = "From: Finition Royale <" . EMAIL_FROM . ">\r\n";
$headers .= "Reply-To: $prenom $nom <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . PHP_VERSION;

$sent = mail(EMAIL_TO, EMAIL_SUBJECT . " — $prenom $nom", $body, $headers);

// Email de confirmation client
if (!empty($email) && $sent) {
    $client_body = <<<EOT
Bonjour $prenom,

Merci pour votre demande de rendez-vous chez Finition Royale !

📋 VOTRE DEMANDE
  Service   : $s_label
  Véhicule  : $v_label
  Date      : $date_fr
  Créneau   : $creneau
  Lieu      : $localite

Nous vous confirmons votre rendez-vous dans les 2 heures.

N'hésitez pas à nous contacter si vous avez des questions :
  contact@finitionroyale.fr

— L'équipe Finition Royale
EOT;

    mail(
        $email,
        'Votre demande de RDV — Finition Royale',
        $client_body,
        "From: Finition Royale <" . EMAIL_FROM . ">\r\nContent-Type: text/plain; charset=UTF-8"
    );
}

// ── Rate limit update ─────────────────────────────────────────────────────────
$rl_data['count']++;
file_put_contents($ip_key, json_encode($rl_data));

// ── Réponse ───────────────────────────────────────────────────────────────────
if ($sent) {
    json_exit(true, 'Votre demande a bien été envoyée. Nous vous contactons sous 2h.');
} else {
    // Fallback : sauvegarder localement si mail() échoue
    $log_dir  = sys_get_temp_dir() . '/rdv_logs';
    if (!is_dir($log_dir)) mkdir($log_dir, 0700, true);
    $log_file = $log_dir . '/rdv_' . date('Ymd') . '.log';
    file_put_contents($log_file, date('Y-m-d H:i:s') . " | $prenom $nom | $tel | $email\n", FILE_APPEND);

    // On renvoie succès quand même pour l'UX (on a les données en log)
    json_exit(true, 'Votre demande a bien été enregistrée. Nous vous contactons sous 2h.');
}
