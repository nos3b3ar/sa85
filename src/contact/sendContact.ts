export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function sendContact(payload: ContactMessage): Promise<void> {
  const body = new URLSearchParams({
    'form-name': 'contact',
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
    company: '',
  });
  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error('Die Nachricht konnte nicht gesendet werden.');
}
