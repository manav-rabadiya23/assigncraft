/**
 * Builds the text that is put into WhatsApp / the email app.
 * Both go through a link, so the text has to stay short: optional parts
 * (technical details, file lines, file report) are dropped when it is too long.
 */

const WHATSAPP_MAX = 1900; // encoded length of the whole message in the wa.me link
const EMAIL_MAX = 1700; // mailto links are cut by some email apps beyond ~2000

const encodedLength = (text) => encodeURIComponent(text).length;

function fit({ head, message, optional, max }) {
  const build = (extras) => [head, message, ...extras].join("\n\n");

  for (let count = optional.length; count >= 0; count -= 1) {
    const text = build(optional.slice(0, count));
    if (encodedLength(text) <= max) return text;
  }

  // Even without extras it is too long: shorten the message itself.
  let text = build([]);
  while (text.length > 20 && encodedLength(text) > max - 6) {
    text = text.slice(0, Math.floor(text.length * 0.9));
  }
  return `${text.trimEnd()}…`;
}

const detailLines = ({ name, mobile, email }) =>
  [
    `Name: ${name}`,
    mobile ? `Mobile: ${mobile}` : "",
    email ? `Email: ${email}` : "",
  ]
    .filter(Boolean)
    .join("\n");

/** Compact message using WhatsApp's *bold* markup. */
export function buildWhatsAppText(fields) {
  const { topicLabel, message, report, snippet, tech } = fields;

  const optional = [];
  if (report) optional.push(`*File report*\n${report}`);
  if (snippet) optional.push(`*File lines*\n${snippet.slice(0, 300)}`);
  if (tech) optional.push(`*Technical*\n${tech}`);

  return fit({
    head: `*AssignCraft: ${topicLabel}*\n${detailLines(fields)}`,
    message,
    optional,
    max: WHATSAPP_MAX,
  });
}

/** Plain-text email body (the subject is built separately). */
export function buildEmailBody(fields) {
  const { message, report, snippet, tech } = fields;

  const optional = [];
  if (report) optional.push(`--- File report ---\n${report}`);
  if (snippet)
    optional.push(`--- First lines of the file ---\n${snippet.slice(0, 500)}`);
  if (tech) optional.push(`--- Technical details ---\n${tech}`);

  return fit({
    head: "Hello,",
    message: `${message}\n\n--- My details ---\n${detailLines(fields)}`,
    optional,
    max: EMAIL_MAX,
  });
}
