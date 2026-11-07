import { test } from "node:test";
import assert from "node:assert/strict";

let n = 0;
async function load({ stored, osDark }) {
  const store = new Map(stored ? [["todo-theme", stored]] : []);
  const attrs = {};
  let click;
  const toggle = {
    textContent: "Dark mode",
    setAttribute: (k, v) => { attrs[k] = v; },
    addEventListener: (ev, fn) => { if (ev === "click") click = fn; },
  };
  globalThis.document = { documentElement: { dataset: {} }, getElementById: () => toggle };
  globalThis.window = { matchMedia: () => ({ matches: osDark, addEventListener() {} }) };
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  await import(`../src/theme.js?case=${n++}`);
  return { toggle, attrs, store, click: () => click() };
}

test("label correct on load: light theme says Dark mode", async () => {
  const t = await load({ stored: "light", osDark: true });
  assert.equal(t.toggle.textContent, "Dark mode");
  assert.equal(t.attrs["aria-pressed"], "false");
});

test("label correct on load: dark theme says Light mode (stored)", async () => {
  const t = await load({ stored: "dark", osDark: false });
  assert.equal(t.toggle.textContent, "Light mode");
  assert.equal(t.attrs["aria-pressed"], "true");
});

test("label follows OS preference when nothing stored", async () => {
  assert.equal((await load({ osDark: true })).toggle.textContent, "Light mode");
  assert.equal((await load({ osDark: false })).toggle.textContent, "Dark mode");
});

test("click flips label and aria-pressed, and persists for next load", async () => {
  const t = await load({ osDark: false });
  t.click();
  assert.equal(t.toggle.textContent, "Light mode");
  assert.equal(t.attrs["aria-pressed"], "true");
  t.click();
  assert.equal(t.toggle.textContent, "Dark mode");
  assert.equal(t.attrs["aria-pressed"], "false");
  t.click();
  assert.equal(t.store.get("todo-theme"), "dark");
  const reload = await load({ stored: t.store.get("todo-theme"), osDark: false });
  assert.equal(reload.toggle.textContent, "Light mode");
});
