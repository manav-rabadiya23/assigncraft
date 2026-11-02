/**
 * Opens a link the way a click would, so it works with popup blockers and for
 * mailto: links, and never navigates the current page by mistake.
 *   newTab: true  -> new tab (WhatsApp)
 *   newTab: false -> hand the link to the browser/OS (mailto: opens the email app)
 */
export function openLink(url, { newTab = false } = {}) {
  const link = document.createElement("a");
  link.href = url;

  if (newTab) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
