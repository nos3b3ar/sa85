export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
  token: string;
};

export type ContactError = 'captcha' | 'invalid' | 'rate' | 'mail';

export class ContactSendError extends Error {
  constructor(readonly reason: ContactError) {
    super(reason);
  }
}

export async function sendContact(payload: ContactMessage): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ContactSendError('mail');
  }
  if (response.ok) return;
  if (response.status === 429) throw new ContactSendError('rate');
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  throw new ContactSendError(body.error === 'captcha' || body.error === 'invalid' ? body.error : 'mail');
}
