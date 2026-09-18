# Plan: Automatic Photo/Video Backup (v1)

Status: **Ready to build**
Scope owner: mobile only — no backend changes required for v1

## Why this, why now

Auto-backup of the camera roll is the reason most people install a mobile
cloud-storage app (Google Photos, iCloud, OneDrive, Dropbox all do this).
ZDrive mobile today is manual-upload only via `expo-document-picker` — for
the core "back up my phone" job, that's a real gap. This is the single
highest-leverage feature to build next on mobile.

Everything else considered alongside this (push notifications, offline
pinning, resumable uploads, richer share links, sort/filter/grid view, an
AI-search-forward UI, document scanning) is explicitly **out of scope for
this plan** and tracked separately. Auto-backup stands alone and ships
fastest as its own unit.

## Current state (verified against the actual codebase, 2026-09-18)

- Expo SDK 56, managed workflow, already using custom config plugins
  (`plugins/withGradle*.js`) — adding new native config via plugins is an
  established pattern here, not a new risk.
- Uploads today: `src/hooks/useFileUpload.ts` → `expo-document-picker`,
  sequential, one file per request (matches the backend's single-file
  `FileInterceptor` endpoint — there's no multi-file endpoint to build
  toward).
- No camera-roll access, no background task, no push, no offline access
  anywhere in the codebase today.
- Search (`src/components/files/SearchBar.tsx`) is a plain substring
  filter — not wired to the backend's semantic/CLIP search at all. (Real
  opportunity, but a separate plan — see "Related, deferred work" below.)

## Two decisions already locked

**Dedup: local-only, no backend change.** `expo-media-library` asset IDs
are stable per-device. Track "already uploaded" as a `Set<string>` in
memory, persisted to `AsyncStorage`. An asset only enters the set on
*confirmed* upload success.

Known, accepted limitation: reinstalling the app or switching devices has
no server-side memory of what's already backed up, so it will re-attempt
uploads the backend will presumably still have as separate/duplicate
files (unless the backend independently dedups by content hash, which it
does not today). A backend content-hash check is the correct long-term
fix but is deliberately deferred — most users don't reinstall often
enough for this to be the wrong v1 trade.

**First enable: new items only, no backfill.** Turning auto-backup on
starts watching from "now" — it does not queue the entire existing camera
roll. Avoids a surprise multi-GB upload burning data/battery/storage quota
the moment someone flips the toggle. A manual "back up my existing
photos" action can be added later as its own small feature if wanted.

## Architecture

| Component | Responsibility |
|---|---|
| `src/services/autoBackup.service.ts` (new) | Diffs camera roll against the local uploaded-set, filters by the Wi-Fi-only toggle, uploads via the **existing** `filesService` single-file call. No new backend endpoint. |
| `src/store/autoBackup.store.ts` (new, Zustand — matches `security.store.ts`/`consent.store.ts`) | Persists: enabled toggle, Wi-Fi-only toggle, the uploaded-asset-ID set. |
| `AppState` listener | Triggers a sync check every time the app becomes active. This is the primary trigger — catches the common case (open app periodically) instantly. |
| `expo-task-manager` + `expo-background-task` (new deps) | Registers a periodic background task for catch-up while backgrounded. **Honest platform constraint:** iOS does not allow continuous background execution in a managed Expo app — the OS wakes this task on its own schedule (typically 15+ min intervals, Wi-Fi/charging-aware). This is the same ceiling every non-native competitor app hits; there is no way to get "the instant you take a photo it's backed up" without ejecting to bare workflow and writing platform-native background upload code, which is explicitly not being proposed here. |
| Settings screen | New "Auto-backup" section using the existing `SettingsRow` component: master toggle + Wi-Fi-only sub-toggle. |

## Permissions & first-run flow

1. User enables the "Auto-backup" toggle in Settings.
2. `MediaLibrary.requestPermissionsAsync()` — if denied, toggle reverts to
   off, show an explanatory message (not a dead-end silent failure).
3. On grant, `autoBackup.store` flips `enabled: true`, records the
   current timestamp as the "watermark" — only assets created after this
   point are ever queued.
4. `AppState` listener + the periodic background task both call the same
   `autoBackup.service.sync()` entrypoint from here on.

## Failure modes (named, not hand-waved)

| Failure | What happens |
|---|---|
| Storage quota exceeded (plan full/expired) | Same `isSubscriptionExpiredError`-style detection `useFileUpload.ts` already does. Auto-backup pauses, surfaces an in-app message next time the app is foregrounded. No push notification (out of scope) — this is a real, accepted gap: a user could go a while without noticing backup is paused if they don't open the app. |
| Network drops mid-upload | Sequential uploads (matching the existing pattern) — the in-flight item is simply not added to the uploaded-set, so it's retried next sync cycle. Nothing is marked done until confirmed. |
| App killed mid-batch | Same as above — safe to resume, no partial-success bookkeeping needed since the set only updates on confirmed success. |
| Large video fails mid-upload | Restarts from zero on next attempt — there's no resumable/chunked upload in this plan (see "Related, deferred work"). Worth knowing before shipping, not a blocker: most camera-roll content is photos, and this matches today's existing manual-upload behavior exactly, just automated. |
| Permission revoked after being granted (user changes OS settings) | Next sync attempt gets a permission error from `expo-media-library`; auto-backup should detect this and flip its own toggle off rather than silently no-op-ing forever, with the same in-app message as the quota case. |

## Explicitly NOT in this plan

Push notifications, offline/pin-for-offline, resumable uploads, richer
share links (password-protected, view-only), sort/filter/grid view, an
AI-search-forward UI/photo gallery, document scanning. All real, all
worth building — each is its own plan.

## Test coverage

The sync-decision logic — given a list of device assets, the
already-uploaded set, and the current network/Wi-Fi-toggle state, what
should be queued — is pure logic with no native-module dependency. Write
2-3 real Jest unit tests against `autoBackup.service`'s selection function
directly (mock the asset list and store state, assert the queued set).
Not proposing a full E2E suite for v1 — that's disproportionate to the
actual risk surface here.

## Effort

Mobile-only, no cross-repo coordination, no backend deploy to wait on.
Realistically a few focused days of solo human work; substantially faster
with an AI pair driving implementation.

## Related, deferred work (tracked, not scoped here)

- **Resumable/chunked uploads** — entangled with auto-backup in spirit
  (large video reliability) but a big enough unit of work (backend
  multipart-upload support, not just mobile) to be its own plan.
- **Push notifications** — backend has zero FCM/APNs infrastructure today
  (verified, not assumed) — this is a joint backend+mobile plan.
- **Backend content-hash dedup** — the proper long-term fix to the
  reinstall/multi-device gap noted above. Backend-only work once
  scoped; mobile just needs to call a new check before upload.
- **AI-search-forward UI / photo gallery grid** — the backend's CLIP
  embedding search is real and shipped but the mobile search bar is
  plain substring matching today. This is arguably the single strongest
  differentiation opportunity ZDrive has that competitors don't — worth
  its own plan, not bundled here.
- **Document scanning (scan-to-PDF)** — high-value for the Indian market
  specifically (Aadhaar, forms, receipts). Self-contained mobile feature,
  its own plan.
