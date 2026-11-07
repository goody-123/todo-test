const KEY = "todo-theme";
const root = document.documentElement;
const toggle = document.getElementById("theme-toggle");
const media = window.matchMedia("(prefers-color-scheme: dark)");

function stored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function apply(theme) {
  root.dataset.theme = theme;
  toggle.setAttribute("aria-pressed", String(theme === "dark"));
  // Label names the theme a click switches to.
  toggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

apply(stored() || (media.matches ? "dark" : "light"));

// Follow OS changes only while the user has not made an explicit choice.
media.addEventListener("change", (e) => {
  if (!stored()) apply(e.matches ? "dark" : "light");
});

toggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  apply(next);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Storage unavailable: theme still switches for this session.
  }
});
