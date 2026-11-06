import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocalTodoStorage } from "../src/todoStorage.js";
import { createTodoActions } from "../src/todoActions.js";

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

test("add, edit, toggle, delete via actions", () => {
  const a = createTodoActions(createLocalTodoStorage(fakeStorage()));
  assert.deepEqual(a.add("one"), { ok: true });
  const [t] = a.list();
  assert.deepEqual(a.editTitle(t.id, "uno"), { ok: true });
  assert.deepEqual(a.toggle(t.id, true), { ok: true });
  assert.equal(a.list()[0].title, "uno");
  assert.equal(a.list()[0].completed, true);
  assert.deepEqual(a.remove(t.id), { ok: true });
  assert.deepEqual(a.list(), []);
});

test("empty title returns error and is not saved (add and edit)", () => {
  const a = createTodoActions(createLocalTodoStorage(fakeStorage()));
  const r = a.add("   ");
  assert.equal(r.ok, false);
  assert.match(r.error, /empty/i);
  assert.deepEqual(a.list(), []);
  a.add("keep");
  const [t] = a.list();
  assert.equal(a.editTitle(t.id, "").ok, false);
  assert.equal(a.list()[0].title, "keep");
});

test("list survives a new actions instance on the same storage", () => {
  const s = fakeStorage();
  createTodoActions(createLocalTodoStorage(s)).add("persist");
  assert.equal(createTodoActions(createLocalTodoStorage(s)).list()[0].title, "persist");
});

test("only uses the storage interface", () => {
  const calls = [];
  const spy = {
    list: () => (calls.push("list"), []),
    add: () => calls.push("add"),
    update: () => calls.push("update"),
    remove: () => calls.push("remove"),
  };
  const a = createTodoActions(spy);
  a.list(); a.add("x"); a.editTitle("1", "y"); a.toggle("1", true); a.remove("1");
  assert.deepEqual(calls, ["list", "add", "update", "update", "remove"]);
});

test("due date can be set on add, changed and cleared via edit", () => {
  const a = createTodoActions(createLocalTodoStorage(fakeStorage()));
  assert.deepEqual(a.add("d", "2026-11-10"), { ok: true });
  const [t] = a.list();
  assert.equal(t.dueDate, "2026-11-10");
  assert.deepEqual(a.edit(t.id, "d", "2026-12-01"), { ok: true });
  assert.equal(a.list()[0].dueDate, "2026-12-01");
  assert.deepEqual(a.edit(t.id, "d", ""), { ok: true });
  assert.equal("dueDate" in a.list()[0], false);
  assert.equal(a.edit(t.id, "d", "nope").ok, false);
});

test("clearCompleted removes completed, keeps incomplete, persists", () => {
  const s = fakeStorage();
  const a = createTodoActions(createLocalTodoStorage(s));
  a.add("done1");
  a.add("open");
  a.add("done2");
  const [d1, , d2] = a.list();
  a.toggle(d1.id, true);
  a.toggle(d2.id, true);
  assert.deepEqual(a.clearCompleted(), { ok: true });
  assert.deepEqual(a.list().map((t) => t.title), ["open"]);
  const b = createTodoActions(createLocalTodoStorage(s));
  assert.deepEqual(b.list().map((t) => t.title), ["open"]);
});
