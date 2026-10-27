export const $ = id => document.getElementById(id);

// After a card or map star loads a temperature, brings the star and readout back into view.
export function scrollToFirstScreen() {
  const anchor = document.querySelector("[data-scroll-anchor]") ?? document.body;
  anchor.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
