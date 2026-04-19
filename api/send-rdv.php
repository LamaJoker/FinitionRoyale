<?php
/* ════════════════════════════════════════════════════════════
   FINITION ROYALE — SEND RDV
   Reçoit le formulaire et envoie un email au pro
════════════════════════════════════════════════════════════ */

// ─── Config ──────────────────────────────────────────────
$CONFIG = [
  'recipient'     => 'contact@finitionroyale.fr',     // ⚠️ À remplacer
  'recipient_cc'  => '',                               // Optionnel
  'from_email'    => 'noreply@finitionroyale.fr',     // Doit être du domaine
  'from_name'     => 'Site Finition Royale',
  'log_file'      => __DIR__ . '/rdv-log.txt',
  'max_per_hour'  => 5,
  'ip_log'        => __DIR__ . '/ip-log.txt'
];

// ─── Headers CORS ────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// ─── Rate limiting ───────────────────────────────────────
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$now = time();

if (file_exists($CONFIG['ip_log'])) {
  $log = json_decode(file_get_contents($CONFIG['ip_log']), true) ?: [];
  $log = array_filter($log, fn($e) => $now - $e['t'] < 3600);
  $count = count(array_filter($log, fn($e) => $e['ip'] === $ip));
  if ($count >= $CONFIG['max_per_hour']) {
    http_response_code(429);
    echo json_encode(['error' => 'Trop de demandes. Réessayez dans 1h.']);
    exit;
  }
} else {
  $log = [];
}

// ─── Lire les données ────────────────────────────────────
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
  http_response_code(400);
  echo json_encode(['error' => 'JSON invalide']);
  exit;
}

// ─── Honeypot ────────────────────────────────────────────
if (!empty($data['_honeypot'])) {
  // Silent fail pour les bots
  http_response_code(200);
  echo json_encode(['ok' => true]);
  exit;
}

// ─── Validation ──────────────────────────────────────────
function s($v) {
  return htmlspecialchars(trim(strip_tags($v ?? '')), ENT_QUOTES, 'UTF-8');
}

$prenom   = s($data['prenom'] ?? '');
$nom      = s($data['nom'] ?? '');
$tel      = s($data['tel'] ?? '');
$email    = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL) ?: '';
$vehicule = s($data['vehicule'] ?? '');
$service  = s($data['service'] ?? '');
$date     = s($data['date'] ?? '');
$creneau  = s($data['creneau'] ?? '');
$localite = s($data['localite'] ?? '');
$commentaire = s($data['commentaire'] ?? '');
$prix     = s($data['prix_estime'] ?? '');
$url      = s($data['url'] ?? '');
$referrer = s($data['referrer'] ?? '');

// Validation minimale
if (!$prenom || !$nom || !$tel || !$vehicule || !$service || !$date || !$creneau || !$localite) {
  http_response_code(400);
  echo json_encode(['error' => 'Champs obligatoires manquants']);
  exit;
}

// Validation phone
$tel_clean = preg_replace('/[\s.\-]/', '', $tel);
if (!preg_match('/^(\+33|0)[1-9]\d{8}$/', $tel_clean)) {
  http_response_code(400);
  echo json_encode(['error' => 'Numéro invalide']);
  exit;
}

// ─── Labels ──────────────────────────────────────────────
$VEHICULES = [
  'citadine' => 'Citadine',
  'berline' => 'Berline / Break',
  'suv' => 'SUV / 4×4'
];
$SERVICES = [
  'interieur' => 'Intérieur Complet',
  'shampoing' => 'Shampoing Sièges & Tapis',
  'exterieur' => 'Extérieur Premium',
  'phares' => 'Rénovation Phares',
  'pack' => 'Pack Intérieur + Extérieur'
];

$vehicule_label = $VEHICULES[$vehicule] ?? $vehicule;
$service_label  = $SERVICES[$service] ?? $service;

// ─── Format date FR ──────────────────────────────────────
$date_fr = $date;
$dt = DateTime::createFromFormat('Y-m-d', $date);
if ($dt) {
  $jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  $mois = ['','janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  $date_fr = $jours[$dt->format('w')] . ' ' . $dt->format('j') . ' ' . $mois[(int)$dt->format('n')] . ' ' . $dt->format('Y');
}

// ─── Email HTML ──────────────────────────────────────────
$subject = "🚗 Nouveau RDV — {$prenom} {$nom} ({$service_label})";

$html = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; color: #222; }
  .box { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .header { background: #080808; color: #C9A84C; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
  .content { padding: 24px; }
  .row { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; gap: 12px; }
  .row:last-child { border: none; }
  .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  .value { color: #222; font-weight: 600; text-align: right; }
  .price { background: #C9A84C; color: #080808; padding: 14px; text-align: center; font-weight: 700; font-size: 18px; border-radius: 6px; margin: 16px 0; }
  .cta { display: block; background: #080808; color: #C9A84C !important; padding: 14px; text-align: center; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600; }
  .footer { background: #f9f9f9; padding: 16px; text-align: center; font-size: 11px; color: #888; }
  .comment { background: #f9f5ea; padding: 12px; border-left: 3px solid #C9A84C; margin: 12px 0; border-radius: 4px; }
</style>
</head>
<body>
  <div class="box">
    <div class="header">
      <h1>🎉 Nouvelle demande de RDV</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#fff;opacity:0.8">Finition Royale — Detailing Auto</p>
    </div>
    <div class="content">
      <div class="price">Tarif estimé : {$prix}</div>

      <div class="row"><span class="label">Nom</span><span class="value">{$prenom} {$nom}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value"><a href="tel:{$tel_clean}">{$tel}</a></span></div>
HTML;

if ($email) {
  $html .= "<div class=\"row\"><span class=\"label\">Email</span><span class=\"value\"><a href=\"mailto:{$email}\">{$email}</a></span></div>";
}

$html .= <<<HTML
      <div class="row"><span class="label">Véhicule</span><span class="value">{$vehicule_label}</span></div>
      <div class="row"><span class="label">Prestation</span><span class="value">{$service_label}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">{$date_fr}</span></div>
      <div class="row"><span class="label">Créneau</span><span class="value">{$creneau}</span></div>
      <div class="row"><span class="label">Commune</span><span class="value">{$localite}</span></div>
HTML;

if ($commentaire) {
  $html .= "<div class=\"comment\"><strong>💬 Commentaire client :</strong><br>" . nl2br($commentaire) . "</div>";
}

$html .= <<<HTML
      <a href="tel:{$tel_clean}" class="cta">📞 Rappeler {$prenom} maintenant</a>
    </div>
    <div class="footer">
      Envoyé depuis {$url}<br>
      IP : {$ip} · {$now}
    </div>
  </div>
</body>
</html>
HTML;

// ─── Envoi ──────────────────────────────────────────────
$from_name = mb_encode_mimeheader($CONFIG['from_name'], 'UTF-8');
$headers = [
  "MIME-Version: 1.0",
  "Content-Type: text/html; charset=UTF-8",
  "From: {$from_name} <{$CONFIG['from_email']}>",
  "Reply-To: " . ($email ?: $CONFIG['from_email']),
  "X-Mailer: PHP/" . phpversion()
];

if ($CONFIG['recipient_cc']) {
  $headers[] = "Cc: " . $CONFIG['recipient_cc'];
}

$subject_encoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = mail($CONFIG['recipient'], $subject_encoded, $html, implode("\r\n", $headers));

// ─── Log ─────────────────────────────────────────────────
$log[] = ['ip' => $ip, 't' => $now];
@file_put_contents($CONFIG['ip_log'], json_encode($log));

$logEntry = date('Y-m-d H:i:s') . " | IP: {$ip} | {$prenom} {$nom} | {$tel} | {$service} | " . ($sent ? 'OK' : 'FAIL') . "\n";
@file_put_contents($CONFIG['log_file'], $logEntry, FILE_APPEND);

// ─── Réponse ────────────────────────────────────────────
if ($sent) {
  echo json_encode(['ok' => true, 'message' => 'Demande reçue']);
} else {
  http_response_code(500);
  echo json_encode(['error' => 'Erreur envoi email']);
}
