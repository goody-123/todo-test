import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocalTodoStorage } from "../src/todoStorage.js";

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

test("list returns empty array when nothing stored", () => {
  assert.deepEqual(createLocalTodoStorage(fakeStorage()).list(), []);
});

test("add creates item with correct shape and keeps order", () => {
  const s = createLocalTodoStorage(fakeStorage());
  const a = s.add("  first ");
  s.add("second");
  assert.equal(a.title, "first");
  assert.equal(a.completed, false);
  assert.equal(typeof a.id, "string");
  assert.equal(typeof a.createdAt, "number");
  assert.deepEqual(s.list().map((t) => t.title), ["first", "second"]);
});

test("add rejects empty and whitespace titles", () => {
  const s = createLocalTodoStorage(fakeStorage());
  for (const bad of ["", "   ", undefined, null, 5]) {
    assert.throws(() => s.add(bad), /empty/);
  }
  assert.equal(s.list().length, 0);
});

test("update changes title and completed, keeps id and createdAt", () => {
  const s = createLocalTodoStorage(fakeStorage());
  const a = s.add("x");
  const u = s.update(a.id, { title: "y", completed: true });
  assert.equal(u.title, "y");
  assert.equal(u.completed, true);
  assert.equal(u.id, a.id);
  assert.equal(u.createdAt, a.createdAt);
  assert.deepEqual(s.list(), [u]);
  assert.equal(s.update(a.id, { completed: false }).completed, false);
});

test("update rejects empty title, bad completed, unknown id", () => {
  const s = createLocalTodoStorage(fakeStorage());
  const a = s.add("x");
  assert.throws(() => s.update(a.id, { title: " " }), /empty/);
  assert.throws(() => s.update(a.id, { completed: "yes" }), /boolean/);
  assert.throws(() => s.update("nope", { title: "z" }), /not found/);
  assert.equal(s.list()[0].title, "x");
});

test("remove deletes item and rejects unknown id", () => {
  const s = createLocalTodoStorage(fakeStorage());
  const a = s.add("a");
  const b = s.add("b");
  s.remove(a.id);
  assert.deepEqual(s.list().map((t) => t.id), [b.id]);
  assert.throws(() => s.remove(a.id), /not found/);
});

test("data persists across a new storage instance (reload)", () => {
  const backing = fakeStorage();
  const a = createLocalTodoStorage(backing).add("keep me");
  assert.deepEqual(createLocalTodoStorage(backing).list(), [a]);
});

test("corrupt stored data yields empty list", () => {
  const backing = fakeStorage();
  backing.setItem("todos", "{not json");
  assert.deepEqual(createLocalTodoStorage(backing).list(), []);
});
