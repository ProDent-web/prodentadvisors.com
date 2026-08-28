<?php
/**
 * ProDent Advisors — contact form handler
 *
 * Uses PHP's built-in mail(), which Hostinger's shared hosting provides out of
 * the box. There is no account to create, no API key, and nothing to configure:
 * upload this file and the form delivers.
 *
 * Delivery works because the From address below is on prodentadvisors.com, the
 * same domain Hostinger hosts — so the message passes SPF/DKIM as legitimate
 * mail from this site rather than a spoof.
 */

declare(strict_types=1);

// ---------------------------------------------------------------------------
//  Settings — the only lines you would ever need to touch
// ---------------------------------------------------------------------------

/** Where submissions are delivered. */
const NOTIFY_TO = 'info@prodentadvisors.com';

/** Envelope sender. Must stay on this domain or messages will land in spam. */
const NOTIFY_FROM = 'noreply@prodentadvisors.com';

/** Shown as the sender name in the inbox. */
const FROM_NAME = 'ProDent Advisors Website';

/** Where a visitor lands after a successful send. */
const SUCCESS_URL = '/thank-you.html';

/** Where a visitor lands if something failed and JavaScript is switched off. */
const FAILURE_URL = '/contact.html?sent=error#contact-form';

/** Minimum seconds between submissions from one IP address. */
const THROTTLE_SECONDS = 20;

// ---------------------------------------------------------------------------

/** Does the caller want JSON (our fetch) rather than a redirect (plain form)? */
function wants_json(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $ajax   = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    return stripos($accept, 'application/json') !== false || $ajax !== '';
}

/** Finish the request in whichever form the caller expects. */
function respond(bool $ok, string $message, int $code = 200): void
{
    if (wants_json()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => $ok, 'message' => $message]);
        exit;
    }

    // No JavaScript: fall back to a plain redirect.
    header('Location: ' . ($ok ? SUCCESS_URL : FAILURE_URL), true, 303);
    exit;
}

/** Read a field, trimmed, with any header-injection characters removed. */
function field(string $key): string
{
    $raw = $_POST[$key] ?? '';
    if (!is_string($raw)) {
        return '';
    }
    // CR/LF in a value that reaches a mail header would let an attacker append
    // their own headers (Bcc, etc.), so they never survive.
    return trim(str_replace(["\r", "\n", "\0"], ' ', $raw));
}

/** RFC 2047 encoding so non-ASCII names survive the Subject line intact. */
function encode_header(string $text): string
{
    if (preg_match('/^[\x20-\x7E]*$/', $text) === 1) {
        return $text;
    }
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

/** Crude per-IP throttle. Fails open — never blocks a real send on error. */
function throttled(): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if ($ip === '') {
        return false;
    }
    $path = sys_get_temp_dir() . '/pda-form-' . md5($ip);
    $last = @filemtime($path);
    if ($last !== false && (time() - $last) < THROTTLE_SECONDS) {
        return true;
    }
    @touch($path);
    return false;
}

// ---------------------------------------------------------------------------
//  Handle the request
// ---------------------------------------------------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'This endpoint only accepts form submissions.', 405);
}

// Honeypot: a hidden field no human ever fills in. Report success so the bot
// has no signal that it was caught, but send nothing.
if (field('botcheck') !== '') {
    respond(true, 'Thanks! Your message has been received.');
}

if (throttled()) {
    respond(false, 'You just sent a message. Please wait a moment before sending another.', 429);
}

$name     = field('name');
$email    = field('email');
$phone    = field('phone');
$practice = field('practice');
$interest = field('interest');
$besttime = field('besttime');

// The message is the one field where line breaks are wanted — it goes in the
// body, never a header, so only null bytes are stripped.
$messageRaw = $_POST['message'] ?? '';
$message    = is_string($messageRaw) ? trim(str_replace("\0", '', $messageRaw)) : '';

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Please complete the required fields.', 422);
}

if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(false, 'That email address does not look right.', 422);
}

// ---------------------------------------------------------------------------
//  Compose
// ---------------------------------------------------------------------------

$lines = [
    'New enquiry from the ProDent Advisors website',
    '=============================================',
    '',
    'Name:            ' . $name,
    'Email:           ' . $email,
    'Phone:           ' . ($phone !== '' ? $phone : '—'),
    'Practice:        ' . ($practice !== '' ? $practice : '—'),
    'Interested in:   ' . ($interest !== '' ? $interest : '—'),
    'Best time:       ' . ($besttime !== '' ? $besttime : 'Any time'),
    '',
    'Message',
    '-------',
    $message,
    '',
    '---',
    'Sent ' . date('D, j M Y \a\t g:ia T'),
    'Reply directly to this email to reach ' . $name . '.',
];

$body    = implode("\r\n", $lines);
$subject = encode_header('New website enquiry — ' . ($name !== '' ? $name : 'ProDent Advisors'));

$headers = implode("\r\n", [
    'From: ' . encode_header(FROM_NAME) . ' <' . NOTIFY_FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . phpversion(),
]);

// The 5th argument sets the envelope sender, which is what SPF is checked
// against. Without it shared hosts fall back to a default that often fails.
$sent = @mail(NOTIFY_TO, $subject, $body, $headers, '-f' . NOTIFY_FROM);

if ($sent) {
    respond(true, 'Thanks! Your message has been received.');
}

error_log('[ProDent] mail() failed for submission from ' . $email);
respond(false, 'We could not send your message. Please email ' . NOTIFY_TO . ' directly.', 500);
