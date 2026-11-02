/**
 * Scrolls to an element, focuses it (or the first field inside it) and flashes a
 * highlight, so a validation error shows the user exactly where to fix it.
 * `target` can be an element, an element id or a CSS selector.
 */
export function focusAndHighlight(target) {
  const element =
    typeof target === "string"
      ? document.getElementById(target) || document.querySelector(target)
      : target;

  if (!element) return false;

  element.scrollIntoView({ behavior: "smooth", block: "center" });

  const focusable = element.matches?.("input, textarea, select, button")
    ? element
    : element.querySelector?.(
        "input:not([type=hidden]), textarea, select, button",
      );

  window.setTimeout(() => {
    focusable?.focus({ preventScroll: true });
  }, 350);

  element.setAttribute("data-attention", "true");
  window.setTimeout(() => element.removeAttribute("data-attention"), 2600);

  return true;
}
