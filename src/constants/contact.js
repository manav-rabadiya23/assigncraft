/* ============================================================================
 * CONTACT SETTINGS  –  type your own details in the three lines below.
 *
 * OWNER_WHATSAPP : your WhatsApp number, country code first, digits only
 *                  (India example: "919876543210"). "Send to WhatsApp" opens
 *                  WhatsApp with the visitor's message ready; they press Send.
 * OWNER_EMAIL    : your email address. "Send to Email" opens the visitor's email
 *                  app with the message ready; they press Send.
 * OWNER_PHONE_DISPLAY : the number shown on the About page and contact card.
 *                  !! It is a RANDOM PLACEHOLDER for now. Replace it with yours. !!
 *
 * (VITE_CONTACT_WHATSAPP / VITE_CONTACT_EMAIL in Vercel also work and win if set.)
 * ========================================================================== */
const OWNER_WHATSAPP = "";
const OWNER_EMAIL = "";
export const OWNER_PHONE_DISPLAY = "+91 98765 43210";

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

export const CONTACT_WHATSAPP = digitsOnly(
  import.meta.env.VITE_CONTACT_WHATSAPP || OWNER_WHATSAPP,
);

export const CONTACT_EMAIL = String(
  import.meta.env.VITE_CONTACT_EMAIL || OWNER_EMAIL,
).trim();

/** Link for the phone number (tap to call on a phone). */
export const OWNER_PHONE_LINK = `tel:+${digitsOnly(OWNER_PHONE_DISPLAY)}`;

export const CONTACT_TOPICS = [
  { value: "format", label: "A file or format is not read correctly" },
  { value: "bug", label: "Something is not working" },
  { value: "idea", label: "Suggestion or new feature" },
  { value: "other", label: "Something else" },
];
