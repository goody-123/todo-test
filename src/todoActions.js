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
    add: (title, dueDate) => run(() => storage.add(title, dueDate)),
    editTitle: (id, title) => run(() => storage.update(id, { title })),
    // dueDate "" or null clears it.
    edit: (id, title, dueDate) => run(() => storage.update(id, { title, dueDate })),
    toggle: (id, completed) => run(() => storage.update(id, { completed })),
    remove: (id) => run(() => storage.remove(id)),
  };
}
