// Storage interface for to-dos: list, add, update, remove.
// Item shape: { id: string, title: string, completed: boolean, createdAt: number }
// The UI must only use this interface so another backend can replace it later.

const KEY = "todos";

function validateTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Title must not be empty");
  }
  return title.trim();
}

// `storage` is any object with getItem/setItem (defaults to browser localStorage).
export function createLocalTodoStorage(storage = globalThis.localStorage) {
  if (!storage) throw new Error("localStorage is not available");

  function read() {
    const raw = storage.getItem(KEY);
    if (raw === null) return [];
    try {
      const items = JSON.parse(raw);
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    storage.setItem(KEY, JSON.stringify(items));
  }

  function findIndex(items, id) {
    const i = items.findIndex((t) => t.id === id);
    if (i === -1) throw new Error(`Todo not found: ${id}`);
    return i;
  }

  return {
    list() {
      return read();
    },

    add(title) {
      const item = {
        id: globalThis.crypto.randomUUID(),
        title: validateTitle(title),
        completed: false,
        createdAt: Date.now(),
      };
      write([...read(), item]);
      return item;
    },

    // changes: { title?, completed? }. id and createdAt cannot be changed.
    update(id, changes = {}) {
      const items = read();
      const i = findIndex(items, id);
      const next = { ...items[i] };
      if ("title" in changes) next.title = validateTitle(changes.title);
      if ("completed" in changes) {
        if (typeof changes.completed !== "boolean") {
          throw new Error("completed must be a boolean");
        }
        next.completed = changes.completed;
      }
      items[i] = next;
      write(items);
      return next;
    },

    remove(id) {
      const items = read();
      const i = findIndex(items, id);
      items.splice(i, 1);
      write(items);
    },
  };
}
