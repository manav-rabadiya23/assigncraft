/**
 * Reads a .txt file. Handles UTF-8 (with or without BOM), UTF-16 and falls back
 * to Windows-1252, so text saved by Notepad / older editors does not turn into
 * garbage. Markdown-style **bold** in the file is kept as bold.
 */
export async function extractTextFromTxt(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let encoding = "utf-8";
  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";

  try {
    return new TextDecoder(encoding, { fatal: true })
      .decode(buffer)
      .replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}
