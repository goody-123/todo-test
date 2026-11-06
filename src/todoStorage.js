// Storage interface for to-dos: list, add, update, remove, clearCompleted.
// Item shape: { id, title, completed, createdAt: number, dueDate?: "YYYY-MM-DD" }
// dueDate is optional and date-only. No network, no backend.
// The UI must only use this interface so another backend can replace it later.

const KEY = "todos";

function validateTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Title must not be empty");
  }
  return title.trim();
}

// Returns a valid "YYYY-MM-DD" string, or undefined when cleared (null/undefined/"").
function validateDueDate(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("dueDate must be a YYYY-MM-DD string");
  }
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    throw new Error("dueDate is not a real date");
  }
  return value;
}

// Local-timezone date-only string for a Date or an existing "YYYY-MM-DD" string.
function toLocalDateString(value) {
  if (typeof value === "string") return validateDueDate(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${String(value.getFullYear()).padStart(4, "0")}-${mm}-${dd}`;
  }
  throw new Error("today must be a Date or YYYY-MM-DD string");
}

// True only for incomplete to-dos whose dueDate is before today (local, date-only).
export function isOverdue(todo, today = new Date()) {
  if (!todo || todo.completed || !todo.dueDate) return false;
  return todo.dueDate < toLocalDateString(today);
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

    add(title, dueDate) {
      const item = {
        id: globalThis.crypto.randomUUID(),
        title: validateTitle(title),
        completed: false,
        createdAt: Date.now(),
      };
      const due = validateDueDate(dueDate);
      if (due) item.dueDate = due;
      write([...read(), item]);
      return item;
    },

    // changes: { title?, completed?, dueDate? }. dueDate null/undefined/"" clears it. id and createdAt cannot be changed.
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
      if ("dueDate" in changes) {
        const due = validateDueDate(changes.dueDate);
        if (due) next.dueDate = due;
        else delete next.dueDate;
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

    // Removes only completed to-dos. Returns the number removed.
    clearCompleted() {
      const items = read();
      const kept = items.filter((t) => !t.completed);
      if (kept.length !== items.length) write(kept);
      return items.length - kept.length;
    },
  };
}
