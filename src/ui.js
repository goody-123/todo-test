import { createLocalTodoStorage, isOverdue } from "./todoStorage.js";
import { createTodoActions } from "./todoActions.js";

const actions = createTodoActions(createLocalTodoStorage());

const form = document.getElementById("add-form");
const input = document.getElementById("add-title");
const dueInput = document.getElementById("add-due");
const listEl = document.getElementById("list");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");
const summaryEl = document.getElementById("summary");
const clearBtn = document.getElementById("clear-completed");

function showError(msg) {
  errorEl.textContent = msg || "";
}

// After a successful action the list is rebuilt, so put keyboard focus back somewhere sensible.
// focus: { id, role } to focus a control in that row, or omitted to focus the add input.
function handle(result, focus) {
  if (!result.ok) {
    showError(result.error);
    return false;
  }
  showError("");
  render();
  const target = focus && listEl.querySelector(`[data-id="${focus.id}"][data-role="${focus.role}"]`);
  (target || input).focus();
  return true;
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function button(label, ariaLabel, className) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  if (ariaLabel) b.setAttribute("aria-label", ariaLabel);
  if (className) b.className = className;
  return b;
}

function makeItem(todo) {
  const li = document.createElement("li");

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = todo.completed;
  check.dataset.id = todo.id;
  check.dataset.role = "check";
  check.setAttribute("aria-label", `Complete: ${todo.title}`);
  check.addEventListener("change", () => handle(actions.toggle(todo.id, check.checked), { id: todo.id, role: "check" }));

  const body = document.createElement("div");
  body.className = "body";
  const title = document.createElement("span");
  title.className = todo.completed ? "title done" : "title";
  title.textContent = todo.title;
  body.append(title);

  if (todo.dueDate) {
    const due = document.createElement("span");
    due.className = "due";
    const time = document.createElement("time");
    time.dateTime = todo.dueDate;
    time.textContent = `Due ${formatDate(todo.dueDate)}`;
    due.append(time);
    if (isOverdue(todo)) {
      li.classList.add("overdue");
      const label = document.createElement("strong");
      label.className = "overdue-label";
      label.textContent = "\u26A0 Overdue";
      due.append(" \u00B7 ", label);
    }
    body.append(due);
  }

  const edit = button("Edit", `Edit: ${todo.title}`);
  edit.dataset.id = todo.id;
  edit.dataset.role = "edit";
  edit.addEventListener("click", () => startEdit(li, todo));

  const del = button("Delete", `Delete: ${todo.title}`, "danger");
  del.addEventListener("click", () => handle(actions.remove(todo.id)));

  const group = document.createElement("div");
  group.className = "actions";
  group.append(edit, del);

  li.append(check, body, group);
  return li;
}

function startEdit(li, todo) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.value = todo.title;
  editInput.setAttribute("aria-label", "Edit title");

  const dueEdit = document.createElement("input");
  dueEdit.type = "date";
  dueEdit.value = todo.dueDate || "";
  dueEdit.setAttribute("aria-label", "Edit due date (clear to remove)");

  const save = button("Save", null, "primary");
  const cancel = button("Cancel");

  const commit = () => handle(actions.edit(todo.id, editInput.value, dueEdit.value), { id: todo.id, role: "edit" });
  save.addEventListener("click", commit);
  cancel.addEventListener("click", () => {
    showError("");
    render();
    listEl.querySelector(`[data-id="${todo.id}"][data-role="edit"]`)?.focus();
  });
  for (const el of [editInput, dueEdit]) {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel.click();
    });
  }

  const fields = document.createElement("div");
  fields.className = "edit-fields";
  fields.append(editInput, dueEdit);
  const group = document.createElement("div");
  group.className = "actions";
  group.append(save, cancel);

  li.classList.add("editing");
  li.replaceChildren(fields, group);
  editInput.focus();
}

function render() {
  const todos = actions.list();
  listEl.replaceChildren(...todos.map(makeItem));
  emptyEl.hidden = todos.length > 0;
  const open = todos.filter((t) => !t.completed).length;
  summaryEl.textContent = todos.length ? `${open} open, ${todos.length - open} done` : "";
  clearBtn.disabled = !todos.some((t) => t.completed);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (handle(actions.add(input.value, dueInput.value))) {
    input.value = "";
    dueInput.value = "";
  }
});

clearBtn.addEventListener("click", () => handle(actions.clearCompleted()));

render();
