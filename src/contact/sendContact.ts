export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/**
 * Platzhalter, bis ein Mailversand an business@sa85.de hängt.
 * Vorgesehener Weg: Netlify Function mit Microsoft Graph
 * POST /users/business@sa85.de/sendMail (Application Permission Mail.Send,
 * auf dieses eine Postfach beschränkt).
 */
export async function sendContact(payload: ContactMessage): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 650));
  console.info('[sa85] Kontaktformular liegt bereit, Versand ist noch nicht angebunden.', payload);
}
