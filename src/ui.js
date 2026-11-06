import { createLocalTodoStorage } from "./todoStorage.js";
import { createTodoActions } from "./todoActions.js";

const actions = createTodoActions(createLocalTodoStorage());

const form = document.getElementById("add-form");
const input = document.getElementById("add-title");
const listEl = document.getElementById("list");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");

function showError(msg) {
  errorEl.textContent = msg || "";
}

function handle(result) {
  if (!result.ok) {
    showError(result.error);
    return false;
  }
  showError("");
  render();
  return true;
}

function makeItem(todo) {
  const li = document.createElement("li");

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = todo.completed;
  check.setAttribute("aria-label", `Complete: ${todo.title}`);
  check.addEventListener("change", () => handle(actions.toggle(todo.id, check.checked)));

  const title = document.createElement("span");
  title.textContent = todo.title;
  if (todo.completed) title.className = "done";

  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = "Edit";
  edit.setAttribute("aria-label", `Edit: ${todo.title}`);
  edit.addEventListener("click", () => startEdit(li, todo));

  const del = document.createElement("button");
  del.type = "button";
  del.textContent = "Delete";
  del.setAttribute("aria-label", `Delete: ${todo.title}`);
  del.addEventListener("click", () => handle(actions.remove(todo.id)));

  li.append(check, title, edit, del);
  return li;
}

function startEdit(li, todo) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.value = todo.title;
  editInput.setAttribute("aria-label", "Edit title");

  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Save";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";

  const commit = () => handle(actions.editTitle(todo.id, editInput.value));
  save.addEventListener("click", commit);
  cancel.addEventListener("click", () => {
    showError("");
    render();
  });
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel.click();
  });

  li.replaceChildren(editInput, save, cancel);
  editInput.focus();
}

function render() {
  const todos = actions.list();
  listEl.replaceChildren(...todos.map(makeItem));
  emptyEl.hidden = todos.length > 0;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (handle(actions.add(input.value))) {
    input.value = "";
    input.focus();
  }
});

render();
