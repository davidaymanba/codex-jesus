const WHATSAPP_BASE_URL = 'https://wa.me/';

/** wa.me chat link for an E.164 number (`+966 50…` → `96650…`) with a prefilled message. */
export function whatsAppHref(phone: string, message: string): string {
  const url = new URL(phone.replace(/\D/g, ''), WHATSAPP_BASE_URL);
  url.searchParams.set('text', message);
  return url.toString();
}
