# Firestore Security Specification (Phase 0)

## 1. Security Model & Per-User Isolation Invariants

Every signed-in user gets a dedicated, strictly isolated Firestore data bucket rooted at `/users/{userId}` where `userId == request.auth.uid`:

- `/users/{userId}` — User profile (PII-protected; readable/writable only by `userId` or `isAdmin()`).
  - Non-admin users cannot escalate `role` (locked to `'Facility Agent'` on create, immutable on update) or `status` (immutable on update).
  - `uid` is immutable and must match `userId`.
- `/users/{userId}/voc_records/{recordId}` — Private VoC survey records bucket.
  - Strictly `isOwner(userId)` for `get`, `list`, `create`, `update`, `delete`. No other user (not even another authenticated colleague) can read, list, write, or delete another user's uploaded VoC records.
  - Master Gate: `exists(/databases/$(database)/documents/users/$(userId))` required on `create` and `update`.
  - Document `id` must match `{recordId}` and satisfy `isValidId(recordId)` (`^[a-zA-Z0-9_\-]+$`, 1..128 chars).
  - `ownerId` must equal `userId` on create and is immutable on update.
  - Strict field allowlist, bounded string lengths, bounded array sizes (`<= 200`), valid `likelihood` (`0..10`), valid `category`, and valid `status`.
- `/users/{userId}/topic_records/{recordId}` — Private Text Analytics topic sentiment records bucket.
  - Strictly `isOwner(userId)` for `get`, `list`, `create`, `update`, `delete`.
  - Master Gate: `exists(/databases/$(database)/documents/users/$(userId))` required on `create` and `update`.
  - `ownerId == userId` and `id == recordId`, immutable on update, strict allowlist and size caps.
- `/users/{userId}/topic_highlights/{docId}` — Private Text Analytics executive highlights.
  - Strictly `isOwner(userId)` for `get`, `list`, `create`, `update`, `delete`.
  - Master Gate: `exists(/databases/$(database)/documents/users/$(userId))` required on `create` and `update`.
  - `ownerId == userId`, bounded `top3`/`bottom3` arrays (`<= 10`).
- `/colleagues/{colleagueId}` — Admin-managed colleague directory (PII).
  - Only `isAdmin()` (or matching `resource.data.uid == request.auth.uid` on `get`) can read; only `isAdmin()` can `list`, `create`, `update`, `delete`.
- `/system_settings/{settingId}` — Workspace configuration.
  - Signed-in users can `get`; only `isAdmin()` can `list`, `create`, `update`, `delete`.
- `/admins/{adminUid}` — Admin registry.
  - Only `isAdmin()` can read/write.
- Legacy top-level `/voc_records/{recordId}` and all unmatched paths:
  - Explicitly denied via default-deny catch-all `match /{document=**} { allow read, write: if false; }`.

## 2. Dirty Dozen Attack Payloads (Must All Be Denied)

1. **Cross-Tenant Read**: User B (`uid: "userB"`) attempts `get` or `list` on `/users/userA/voc_records` or `/users/userA/topic_records`.
2. **Cross-Tenant Write / Injection**: User B attempts `create` or `update` inside `/users/userA/voc_records/rec1`.
3. **Owner Spoofing**: User A attempts `create` on `/users/userA/voc_records/rec1` with `{ ownerId: "userB" }`.
4. **Owner Reassignment on Update**: User A attempts `update` on `/users/userA/voc_records/rec1` changing `ownerId` from `"userA"` to `"userB"`.
5. **Privilege Escalation on Create**: Non-admin user creates `/users/userA` with `{ role: "superadmin" }`.
6. **Privilege Escalation on Update**: Non-admin user updates `/users/userA` changing `role` from `"Facility Agent"` to `"superadmin"`.
7. **Unauthenticated Access**: Unauthenticated caller (`auth: null`) attempts read/write on any path including `/users/userA/voc_records` or legacy `/voc_records/rec1`.
8. **Legacy Shared Collection Access**: Authenticated user attempts read/write on `/voc_records/rec1`.
9. **Unexpected Field / Schema Injection**: User A writes `{ isAdmin: true, extraBlob: "x" }` to `/users/userA/voc_records/rec1`.
10. **Oversized Payload / DoS**: User A writes a `comment` with `> 10000` chars or `likelihood: 999` or `timeline` with `> 200` items.
11. **Path Traversal / Malformed ID**: User A attempts to write a record with ID containing `/` or spaces or `> 128` chars.
12. **PII Harvesting on `/users` or `/colleagues`**: Non-admin User B attempts `list` on `/users` or `/colleagues` or `get` on `/users/userA`.
