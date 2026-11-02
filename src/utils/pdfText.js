/**
 * jsPDF's built-in fonts only know Latin-1, so symbols such as the rupee sign
 * or arrows would be drawn as garbage. This maps them to safe equivalents.
 */
export function toPdfSafeText(text = "") {
  return (
    String(text)
      .replace(/\u00a0/g, " ")
      .replace(/₹/g, "Rs. ")
      .replace(/◦/g, "-")
      .replace(/[→⇒➜]/g, "->")
      .replace(/[←⇐]/g, "<-")
      .replace(/[✓✔]/g, "v")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/\t/g, "    ")
      // Anything still outside Latin-1 (except the bullet) becomes "?" instead of mojibake.
      .replace(/[^\u0009\u000a\u0020-\u007e\u00a0-\u00ff\u2022]/g, "?")
  );
}
