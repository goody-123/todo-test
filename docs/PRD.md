## Goal
A simple to-do app for one person on one device. Add to-dos, complete them, set due dates, see overdue ones highlighted, and clear completed ones in one action.

## Users
A single user on a single device. No accounts.

## Scope v1
- Add, edit, complete, uncomplete and delete a to-do.
- Optional due date on each to-do.
- Overdue to-dos (due date before today, not completed) are visually highlighted.
- A "clear completed" button that removes all completed to-dos.
- Data persists across reloads on the same device.

## Out of scope
- Login, accounts, multi-device sync.
- Supabase or any hosted backend.
- Reminders, notifications, recurring tasks, tags, sharing.
- Production deployment.

## Decisions made
- v1 is single-device with no login (stated in channel).
- Milo and Rael are to agree on the storage approach. Given single-device and no login, local storage is the only approach consistent with that decision.
- Add a "clear completed" button (requested in channel).
- Each to-do can have a due date, and overdue ones are highlighted (requested in channel).

## Assumed
- Storage is browser localStorage behind a small data module, so a backend could be swapped in later. The channel never recorded an explicit local vs Supabase answer.
- The app is a web app. The stack is whatever the repo already uses, and if there is none, plain React or similar chosen by Rael.
- Due date is date only, with no time. Overdue means the due date is before today in the user's local timezone.
- Completed to-dos are never shown as overdue.
- "Clear completed" asks for no confirmation. If undo is wanted later, it is a follow-up.
- No repo state was verified. The channel question about whether earlier work was done is unanswered here, and this PRD assumes a clean start.

## Acceptance criteria
- A user can add, complete, uncomplete, edit and delete a to-do.
- A user can set, change and clear a due date on a to-do.
- An incomplete to-do with a due date before today shows a distinct highlight. Completed or undated to-dos never do.
- "Clear completed" removes all completed to-dos and leaves the others untouched. It is disabled or hidden when none are completed.
- All data survives a page reload.
- No network calls, no login, no Supabase dependency.