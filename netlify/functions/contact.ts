/**
 * Kontaktformular: prüft das Turnstile-Token bei Cloudflare und verschickt die Nachricht
 * über Microsoft Graph aus dem eigenen Microsoft-365-Postfach.
 *
 * Umgebungsvariablen in Netlify (nie im Repo):
 * TURNSTILE_SECRET_KEY, MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, CONTACT_MAILBOX
 */

type Payload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown;
  token?: unknown;
};

const limits = { name: 100, email: 200, subject: 200, message: 5000 };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`missing ${name}`);
  return value;
}

async function verifyTurnstile(token: string, ip: string | null) {
  const form = new URLSearchParams({ secret: env('TURNSTILE_SECRET_KEY'), response: token });
  if (ip) form.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

async function graphToken() {
  const form = new URLSearchParams({
    client_id: env('MS_CLIENT_ID'),
    client_secret: env('MS_CLIENT_SECRET'),
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const response = await fetch(`https://login.microsoftonline.com/${env('MS_TENANT_ID')}/oauth2/v2.0/token`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new Error(`token ${response.status}`);
  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) throw new Error('token missing');
  return result.access_token;
}

async function sendMail(input: { name: string; email: string; subject: string; message: string }) {
  const mailbox = env('CONTACT_MAILBOX');
  const token = await graphToken();
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: `[sa85.de] ${input.subject}`,
        body: {
          contentType: 'Text',
          content: `Name: ${input.name}\nE-Mail: ${input.email}\n\n${input.message}\n\n-- \nGesendet über das Kontaktformular auf sa85.de`,
        },
        toRecipients: [{ emailAddress: { address: mailbox } }],
        replyTo: [{ emailAddress: { address: input.email, name: input.name } }],
      },
      saveToSentItems: false,
    }),
  });
  if (response.status !== 202) throw new Error(`sendMail ${response.status}`);
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json(405, { error: 'method' });

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json(400, { error: 'invalid' });
  }

  // Honeypot: Bots bekommen eine Erfolgsmeldung, es wird aber nichts verschickt.
  if (text(payload.company, 200)) return json(202, { ok: true });

  const name = text(payload.name, limits.name);
  const email = text(payload.email, limits.email);
  const subject = text(payload.subject, limits.subject).replace(/[\r\n]+/g, ' ');
  const message = text(payload.message, limits.message);
  const token = text(payload.token, 2048);

  if (!name || !emailPattern.test(email) || !subject || message.length < 10) return json(400, { error: 'invalid' });
  if (!token) return json(400, { error: 'captcha' });

  try {
    const ip = request.headers.get('x-nf-client-connection-ip');
    if (!(await verifyTurnstile(token, ip))) return json(403, { error: 'captcha' });
    await sendMail({ name, email, subject, message });
  } catch (error) {
    console.error('contact failed', error instanceof Error ? error.message : error);
    return json(502, { error: 'mail' });
  }

  return json(202, { ok: true });
}

export const config = {
  path: '/api/contact',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
