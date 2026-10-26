// The readout's copy and share buttons, the copy-format menu and the toast that confirms them.
import { colorFormats } from "./format.js";
import { state, stateQuery } from "./state.js";
import { $ } from "./dom.js";

let toastTimer;
export const copyText = (text, done) =>
  (navigator.clipboard?.writeText(text) ?? Promise.reject()).then(() => done, () => "Couldn't copy").then(message => {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  });

const formats = () => colorFormats(state.T, state.model, state.light);
const copyFormat = i => {
  const [label, text] = formats()[i];
  copyText(text, `Copied ${i ? label : text}`);
};

export function initShare() {
  const copy = $("copyColor"), menu = $("copyMenu");
  const items = [...menu.children];
  const setMenuOpen = open => {
    menu.hidden = !open;
    copy.setAttribute("aria-expanded", open);
    if (!open) return;
    formats().forEach(([, text], i) => (items[i].lastChild.textContent = text));
    items[0].focus();
  };

  // A tap or click copies the hex. Holding the button, or pressing ↓ on it, opens the other formats.
  let pressTimer, held;
  copy.onpointerdown = () => {
    held = false;
    pressTimer = setTimeout(() => setMenuOpen((held = true)), 450);
  };
  copy.onpointerup = copy.onpointerleave = () => clearTimeout(pressTimer);
  // Stops the system menu a long press opens on Android.
  copy.oncontextmenu = e => e.preventDefault();
  copy.onclick = () => {
    if (held) held = false;
    else copyFormat(0);
  };
  // Handlers are statements, not `a && b` expressions: an `on…` handler that returns false cancels the event.
  copy.onkeydown = e => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    setMenuOpen(true);
  };

  menu.onclick = e => {
    const i = items.indexOf(e.target.closest("button"));
    if (i < 0) return;
    copyFormat(i);
    copy.focus();
  };
  menu.onkeydown = e => {
    if (e.key === "Escape") copy.focus();
  };
  // Closes whenever focus leaves it: a click elsewhere, Tab, Escape, or a choice.
  menu.addEventListener("focusout", e => menu.contains(e.relatedTarget) || setMenuOpen(false));

  // The system share sheet where there is one; otherwise the link goes to the clipboard.
  $("shareLink").onclick = () => {
    const url = location.origin + location.pathname + stateQuery();
    if (navigator.share) navigator.share({ title: document.title, url }).catch(e => e.name === "AbortError" || copyText(url, "Link copied"));
    else copyText(url, "Link copied");
  };
}
