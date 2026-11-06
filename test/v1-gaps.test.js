import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLocalTodoStorage, isOverdue } from "../src/todoStorage.js";
import { createTodoActions } from "../src/todoActions.js";

function fakeStorage() {
  const data = new Map();
  return {
    writes: 0,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem(k, v) { this.writes++; data.set(k, String(v)); },
  };
}

test("uncomplete restores an item and persists across reload", () => {
  const st = fakeStorage();
  const a = createTodoActions(createLocalTodoStorage(st));
  a.add("x");
  const id = a.list()[0].id;
  a.toggle(id, true);
  a.toggle(id, false);
  assert.equal(createTodoActions(createLocalTodoStorage(st)).list()[0].completed, false);
});

test("clearCompleted with nothing completed is a no-op: returns 0, no write, items untouched", () => {
  const st = fakeStorage();
  const s = createLocalTodoStorage(st);
  s.add("a"); s.add("b", "2026-01-01");
  const before = st.writes;
  assert.equal(s.clearCompleted(), 0);
  assert.equal(st.writes, before);
  assert.equal(s.list().length, 2);
  assert.deepEqual(createTodoActions(s).clearCompleted(), { ok: true });
});

test("clearCompleted on empty store is safe", () => {
  assert.equal(createLocalTodoStorage(fakeStorage()).clearCompleted(), 0);
});

test("overdue: completing an overdue item drops highlight, uncompleting restores it", () => {
  const s = createLocalTodoStorage(fakeStorage());
  const t = s.add("late", "2026-11-05");
  const today = new Date(2026, 10, 6);
  assert.equal(isOverdue(s.list()[0], today), true);
  s.update(t.id, { completed: true });
  assert.equal(isOverdue(s.list()[0], today), false);
  s.update(t.id, { completed: false });
  assert.equal(isOverdue(s.list()[0], today), true);
  s.update(t.id, { dueDate: "" });
  assert.equal(isOverdue(s.list()[0], today), false);
});

test("edit keeps due date when unchanged and clears it with empty string", () => {
  const a = createTodoActions(createLocalTodoStorage(fakeStorage()));
  a.add("t", "2026-11-10");
  const id = a.list()[0].id;
  a.edit(id, "t2", "2026-11-10");
  assert.equal(a.list()[0].dueDate, "2026-11-10");
  a.edit(id, "t2", "");
  assert.equal("dueDate" in a.list()[0], false);
});

test("UI wiring: clear button disabled when none completed; page has no external resources", () => {
  const ui = readFileSync(new URL("../src/ui.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(ui, /clearBtn\.disabled = !todos\.some\(\(t\) => t\.completed\)/);
  assert.match(html, /id="clear-completed" disabled/);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:|src=["']https?:/i);
});
