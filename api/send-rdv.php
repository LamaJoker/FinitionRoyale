<?php
/* ════════════════════════════════════════════════════════════
   FINITION ROYALE — SEND RDV (short form — 4 fields)
   Reçoit : name, phone, city, need + honeypot "website"
   Envoie un email HTML à contact@finitionroyale.fr
════════════════════════════════════════════════════════════ */

// ─── CONFIG ─────────────────────────────────────────────────
$CONFIG = [
  'recipient'     => 'contact@finitionroyale.fr',       // ⚠️ À personnaliser
  'recipient_cc'  => '',                                 // Optionnel ex: gestion@…
  'from_email'    => 'noreply@finitionroyale.fr',       // Doit être du même domaine (créer un alias sur OVH)
  'from_name'     => 'Site Finition Royale',
  'log_file'      => __DIR__ . '/rdv-log.txt',
  'ip_log'        => __DIR__ . '/ip-log.txt',
  'max_per_hour'  => 5,
];

// ─── HEADERS ────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// ─── RATE LIMITING (par IP, 5/h) ────────────────────────────
$ip  = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$now = time();

$ipLog = [];
if (file_exists($CONFIG['ip_log'])) {
  $ipLog = json_decode(@file_get_contents($CONFIG['ip_log']), true) ?: [];
  // Purge entrées > 1h
  $ipLog = array_values(array_filter($ipLog, fn($e) => isset($e['t']) && ($now - $e['t']) < 3600));
  $count = count(array_filter($ipLog, fn($e) => ($e['ip'] ?? '') === $ip));
  if ($count >= $CONFIG['max_per_hour']) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Trop de demandes. Réessayez dans 1h.']);
    exit;
  }
}

// ─── PARSE JSON BODY ────────────────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Requête invalide']);
  exit;
}

// ─── HONEYPOT ───────────────────────────────────────────────
// Le champ 'website' doit être vide (caché aux humains, rempli par les bots)
if (!empty($data['website'])) {
  // Silent success pour les bots — on leur fait croire que ça a marché
  echo json_encode(['ok' => true]);
  exit;
}

// ─── VALIDATION ─────────────────────────────────────────────
function clean($v) {
  return htmlspecialchars(trim(strip_tags((string)($v ?? ''))), ENT_QUOTES, 'UTF-8');
}

$name  = clean($data['name']  ?? '');
$phone = clean($data['phone'] ?? '');
$city  = clean($data['city']  ?? '');
$need  = clean($data['need']  ?? '');
$src   = clean($data['source'] ?? 'form');
$page  = clean($data['page']   ?? '/');

$errors = [];
if (strlen($name)  < 2)                                     $errors[] = 'Prénom invalide';
if (!preg_match('/^(\+33|0)[1-9][\d\s.\-]{8,}$/', $phone))  $errors[] = 'Téléphone invalide';
if (strlen($city)  < 2)                                     $errors[] = 'Ville manquante';

if ($errors) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => implode(' · ', $errors)]);
  exit;
}

// ─── CONSTRUCTION EMAIL ─────────────────────────────────────
$date = date('d/m/Y à H:i');
$subject = '🚗 Nouvelle demande RDV — ' . $name . ' (' . $city . ')';

$html = '<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
  <div style="background:linear-gradient(135deg,#1a1a1a,#0a0a0a);padding:24px;text-align:center;">
    <div style="display:inline-block;width:50px;height:50px;line-height:50px;background:linear-gradient(135deg,#E6C867,#8F7530);color:#000;border-radius:12px;font-family:Georgia,serif;font-weight:600;font-size:22px;">FR</div>
    <h1 style="color:#E6C867;font-family:Georgia,serif;font-weight:500;font-size:22px;margin:12px 0 0;">Nouvelle demande RDV</h1>
  </div>
  <div style="padding:28px 24px;color:#1a1a1a;">
    <p style="color:#666;font-size:13px;margin:0 0 20px;">Reçu le ' . $date . '</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:120px;">Prénom</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">' . $name . '</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;">Téléphone</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;"><a href="tel:' . preg_replace('/\s/', '', $phone) . '" style="color:#C9A84C;text-decoration:none;">' . $phone . '</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;">Ville</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">' . $city . '</td></tr>';
if ($need !== '') {
  $html .= '<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;vertical-align:top;">Demande</td><td style="padding:10px 0;border-bottom:1px solid #eee;">' . nl2br($need) . '</td></tr>';
}
$html .= '
    </table>

    <div style="margin:24px 0;padding:16px;background:#fff8e1;border-left:3px solid #C9A84C;border-radius:6px;">
      <p style="margin:0;font-weight:600;color:#1a1a1a;">⏱️ Objectif : rappeler dans l\'heure</p>
      <p style="margin:6px 0 0;font-size:13px;color:#666;">Promesse affichée sur le site. Le lead attend un appel rapide.</p>
    </div>

    <div style="text-align:center;margin-top:20px;">
      <a href="tel:' . preg_replace('/\s/', '', $phone) . '" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#E6C867,#8F7530);color:#000;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">📞 Appeler ' . $name . '</a>
      <a href="https://wa.me/' . preg_replace('/[^0-9]/', '', str_replace('+33', '33', $phone)) . '" style="display:inline-block;padding:12px 24px;background:#25D366;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;margin-left:8px;">💬 WhatsApp</a>
    </div>

    <p style="font-size:12px;color:#aaa;margin:24px 0 0;border-top:1px solid #eee;padding-top:16px;">
      Source : ' . $src . ' · Page : ' . $page . ' · IP : ' . $ip . '
    </p>
  </div>
</div>
</body></html>';

$text = "Nouvelle demande RDV — $date\n\n"
      . "Prénom    : $name\n"
      . "Téléphone : $phone\n"
      . "Ville     : $city\n"
      . ($need ? "Demande   : $need\n" : '')
      . "\nRappeler dans l'heure (promesse site).\n"
      . "\n---\nSource: $src · Page: $page · IP: $ip\n";

// ─── HEADERS EMAIL ──────────────────────────────────────────
$boundary = md5(uniqid((string)mt_rand(), true));

$headers  = "From: {$CONFIG['from_name']} <{$CONFIG['from_email']}>\r\n";
$headers .= "Reply-To: $name <no-reply@finitionroyale.fr>\r\n";
if ($CONFIG['recipient_cc']) $headers .= "Cc: {$CONFIG['recipient_cc']}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";

$body  = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= $text . "\r\n";
$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= $html . "\r\n";
$body .= "--$boundary--\r\n";

$subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';

// ─── ENVOI ──────────────────────────────────────────────────
$sent = @mail($CONFIG['recipient'], $subjectEncoded, $body, $headers);

// ─── LOGGING ────────────────────────────────────────────────
$logLine = json_encode([
  't'      => $now,
  'ip'     => $ip,
  'sent'   => $sent,
  'name'   => $name,
  'phone'  => $phone,
  'city'   => $city,
  'need'   => mb_substr($need, 0, 120),
  'src'    => $src,
  'page'   => $page,
], JSON_UNESCAPED_UNICODE) . PHP_EOL;

@file_put_contents($CONFIG['log_file'], $logLine, FILE_APPEND | LOCK_EX);

// Update IP log
$ipLog[] = ['ip' => $ip, 't' => $now];
@file_put_contents($CONFIG['ip_log'], json_encode($ipLog), LOCK_EX);

// ─── RESPONSE ───────────────────────────────────────────────
if (!$sent) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => "Problème d'envoi. Appelez-nous directement au 07 71 22 90 38."]);
  exit;
}

echo json_encode(['ok' => true, 'message' => 'Demande reçue. On vous rappelle sous 1h.']);
