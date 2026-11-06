# To-do app v1

## Goal
A simple to-do app that works on one device with no login, storing data locally.

## Users
A single person using the app on one device. No accounts, no sharing.

## Scope v1
- Create, view, edit, complete and delete to-do items.
- Data persisted on the device (local storage). Survives app restart.
- Single-device, no login, no sync.
- A storage layer with a clear interface so Supabase could be added later without UI changes.

## Out of scope
- Login and user accounts.
- Supabase or any cloud storage.
- Multi-device sync.
- Sharing, reminders, categories, due dates.

## Decisions made
- v1 is single-device with no login (stated in channel).
- Milo and Rael are to agree on local vs Supabase storage; the channel's single-device, no-login decision is the basis for that choice.

## Assumed
- Storage is local on the device, not Supabase. Simplest option that fits single-device, no login. Marked Assumed because the channel never named the final storage choice explicitly.
- Platform is web, using browser localStorage. Platform was not discussed.
- A to-do item has: id, title, completed flag, created timestamp.
- No item limit, no ordering beyond creation order.
- Storage interface: list, add, update, remove.

## Acceptance criteria
- User can add a to-do and see it in the list.
- User can edit a to-do title.
- User can mark a to-do complete and incomplete.
- User can delete a to-do.
- After reload, all to-dos and their states are still present.
- No login screen and no network calls to Supabase exist in the app.
- Storage access goes only through the storage interface.
- Empty title is rejected.
