import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createLocalTodoStorage } from "../src/todoStorage.js";
import { createTodoActions } from "../src/todoActions.js";

const srcFiles = readdirSync(new URL("../src/", import.meta.url)).filter((f) => f.endsWith(".js"));
const read = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

test("AC: no Supabase, login or network calls in app code", () => {
  const banned = /supabase|login|sign[-_ ]?in|password|\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|https?:\/\//i;
  for (const f of srcFiles) assert.doesNotMatch(read(f), banned, `src/${f}`);
  const scripts = [...html.matchAll(/<script[^>]*>/g)].map((m) => m[0]);
  for (const s of scripts) assert.doesNotMatch(s, /https?:\/\//, "external script");
  assert.doesNotMatch(html, /supabase|login|password|type="password"/i);
});

test("AC: storage accessed only through the interface (UI/actions never touch localStorage)", () => {
  for (const f of ["ui.js", "todoActions.js"]) {
    assert.doesNotMatch(read(f), /localStorage|sessionStorage|indexedDB/, `src/${f}`);
  }
});

test("AC: full lifecycle with persistence across reload", () => {
  const backing = fakeStorage();
  const a1 = createTodoActions(createLocalTodoStorage(backing));
  a1.add("a");
  a1.add("b");
  const [x, y] = a1.list();
  a1.editTitle(x.id, "a2");
  a1.toggle(x.id, true);
  a1.toggle(y.id, true);
  a1.toggle(y.id, false);
  const a2 = createTodoActions(createLocalTodoStorage(backing)); // reload
  assert.deepEqual(a2.list().map((t) => [t.title, t.completed]), [["a2", true], ["b", false]]);
  a2.remove(x.id);
  assert.deepEqual(createTodoActions(createLocalTodoStorage(backing)).list().map((t) => t.title), ["b"]);
});

test("AC: empty title rejected on add and edit, nothing persisted", () => {
  const backing = fakeStorage();
  const a = createTodoActions(createLocalTodoStorage(backing));
  for (const bad of ["", " ", "\t\n"]) assert.equal(a.add(bad).ok, false);
  assert.equal(backing.getItem("todos"), null);
  a.add("ok");
  const [t] = a.list();
  assert.equal(a.editTitle(t.id, "  ").ok, false);
  assert.equal(a.list()[0].title, "ok");
});
