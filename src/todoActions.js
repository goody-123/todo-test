// UI-facing actions. Talks to storage only through the interface (list, add, update, remove).
// Each action returns { ok: true } or { ok: false, error: string } so the UI never needs try/catch.

export function createTodoActions(storage) {
  function run(fn) {
    try {
      fn();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return {
    list: () => storage.list(),
    add: (title) => run(() => storage.add(title)),
    editTitle: (id, title) => run(() => storage.update(id, { title })),
    toggle: (id, completed) => run(() => storage.update(id, { completed })),
    remove: (id) => run(() => storage.remove(id)),
  };
}
