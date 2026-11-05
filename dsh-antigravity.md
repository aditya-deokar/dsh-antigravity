# dsh-antigravity — Rebrand & Improvement Plan

Status: implementation complete for v0.1.0; real-account chat verification pending.
Scope: a locally installed, independently maintained edition of the
`dsh-antigravity` provider for DeepSeek Harness (`dsh`).

---

## 1. Objective

Deliver a rebranded, more reliable edition of the existing `dsh-antigravity`
plugin that:

1. Removes upstream author and repository branding from the package, UI,
   screenshots, metadata, and documentation.
2. Keeps the provider contract compatible with existing DSH profiles and
   stored credentials.
3. Fixes the known upstream defects around API drift, Unicode corruption,
   OAuth refresh, image attachments, theming, locale disposal, endpoint
   selection, and stale model catalogs.
4. Installs cleanly into the local `web` DSH profile and boots without
   warnings.
5. Ships with tests, diagnostics, and documentation that make future
   maintenance practical.

### Non-goals for v0.1.0

- Publishing to npm or creating a public repository.
- Multi-account pooling, automatic failover between accounts, or image
  generation orchestration.
- Replacing Google's OAuth client identity or reverse-engineering new
  endpoints.
- Claiming official support from Google or DeepSeek.

---

## 2. Compatibility Contract

These identifiers deliberately stay unchanged so the new edition is a drop-in
replacement:

| Contract | Value |
| --- | --- |
| Package name | `dsh-antigravity` |
| Provider ID | `antigravity` |
| Web API prefix | `/antigravity/api` |
| Plugin / client ID | `dsh-antigravity` |
| Credential file | `~/.dsh/storages/antigravity-oauth.json` |
| Settings file | `~/.dsh/storages/antigravity-settings.json` |
| Web settings slot | `settings.section` id `antigravity` |
| DSH baseline | `0.1.1-rc.2`, with forward fallbacks |

Branding changes are limited to presentation, metadata, comments, assets, and
documentation. Protocol identifiers remain stable.

---

## 3. Phase Map

| Phase | Workstream | Status |
| --- | --- | --- |
| 0 | Baseline install and upstream audit | Complete |
| 1 | Rebrand and legal hygiene | Complete |
| 2 | DSH API compatibility | Complete |
| 3 | Transport and OAuth reliability | Complete |
| 4 | Live model catalog and migration | Complete |
| 5 | Durable image attachments | Complete |
| 6 | Web UI rebrand, theme, accessibility, lifecycle | Complete |
| 7 | Privacy and diagnostics | Complete |
| 8 | Local packaging and installation | Complete |
| 9 | Verification matrix | Partial — real OAuth chat pending |
| 10 | Release and maintenance | Ongoing |

---

## Phase 0 — Baseline Install and Upstream Audit

**Goal:** Establish a working baseline and enumerate every defect worth fixing.

### Tasks

- [x] Install the original upstream plugin into the `web` profile as a baseline.
- [x] Boot the web server on `127.0.0.1:3123`.
- [x] Confirm `/antigravity/api/status` returns the upstream model list.
- [x] Read the upstream README, package manifest, host adapter, and client.
- [x] Review open issues and pull requests.
- [x] Record the issues adopted for this edition:
  - `CallId` → `ToolCallId` import failure.
  - Emoji / UTF-16 surrogate corruption.
  - Token-refresh gzip and invalid-JSON crash.
  - Image attachment forwarding and image-width error.
  - Hard-coded light-mode colors.
  - Locale registration not disposed.
  - Stale / retired model catalog.
  - Sandbox endpoint region failures.
- [x] Defer multi-account pooling and image generation to a later release.

### Exit criteria

- A reproducible baseline server and API response exist.
- Every adopted fix has a named upstream symptom and a local test target.

---

## Phase 1 — Rebrand and Legal Hygiene

**Goal:** Remove upstream personal identity while preserving MIT obligations.

### Tasks

- [x] Rename the package metadata to this edition, version `0.1.0`.
- [x] Set author branding without inventing a repository URL.
- [x] Replace the upstream navigation mark and settings icon with a neutral
  orbit mark.
- [x] Replace every upstream CSS class prefix with `agp-`.
- [x] Rewrite UI copy in English and Chinese around the plugin's own voice.
- [x] Remove upstream screenshots from the repository.
- [x] Remove upstream repository, homepage, and issue URLs from
  `package.json`.
- [x] Remove any legacy alternative environment prefix in favor of `ANTIGRAVITY_*`.
- [x] Keep the MIT license and add an explicit derivation note.
- [x] Search the entire tree for upstream handles, links, and personal data.

### Verification

Run a full-tree search against a private checklist of upstream handles,
personal identifiers, legacy environment prefixes, and repository URLs.

Expected: no matches.

### Exit criteria

- No upstream author handle, personal email, screenshot, or repository link
  remains.
- Attribution is limited to the neutral MIT derivation note.

---

## Phase 2 — DSH API Compatibility

**Goal:** Boot on DSH `0.1.1-rc.2` and survive the `CallId` rename.

### Tasks

- [x] Import the whole `@deepseek-ai/dsh-llm` namespace.
- [x] Resolve `ToolCallId ?? CallId` at module load.
- [x] Fail with a clear error if neither export exists.
- [x] Keep `inject = ["llm"]` and `apply.inject` in sync.
- [x] Resolve the attachment service lazily with `ctx.get("attachments")`.
- [x] Guard optional services so a missing attachment service only affects
  image requests.

### Exit criteria

- `node --check` passes.
- The host boots without an import or registration error on the local DSH
  version.
- The same source is expected to boot on newer DSH releases that export
  `ToolCallId`.

---

## Phase 3 — Transport and OAuth Reliability

**Goal:** Make network and credential failures diagnosable instead of fatal.

### Tasks

- [x] Add gzip-aware `readResponseText`, `readResponseJson`, and
  `responseBodyChunks`.
- [x] Replace unsafe `response.json()` / `response.text()` calls.
- [x] Accept empty and truncated bodies without throwing a JSON parser error.
- [x] Remove the sandbox endpoint from the default fallback chain.
- [x] Add the official daily endpoint as a secondary fallback.
- [x] Retry only on endpoint failures that can plausibly succeed elsewhere.
- [x] Treat region-gated 400 responses as endpoint failures.
- [x] Fall through to the next runtime model on 404.
- [x] Keep the idle-stream watchdog and consumer cancellation semantics.
- [x] Report a friendly, redacted error with endpoint, project, runtime model,
  matched model, and available-model diagnostics.

### Exit criteria

- A gzip token-refresh response no longer crashes login.
- A 400 from one endpoint does not abort the whole request before the next
  endpoint is tried.
- Real-account confirmation remains part of Phase 9.

---

## Phase 4 — Live Model Catalog and Migration

**Goal:** Stop shipping a stale allow-list as the source of truth.

### Tasks

- [x] Fetch the live catalog first and group backend runtime IDs into stable
  public IDs.
- [x] Fall back to the bundled catalog only when discovery fails.
- [x] Canonicalize runtime IDs: lowercase, separators, aliases, effort
  suffixes, and tiered suffixes.
- [x] Preserve runtime IDs per public model for quota matching and request
  fallback.
- [x] Add Gemini 3.8 / 3.7 / 3.6 / 3.5 Flash, Gemini 3.1 Pro, Gemini 3.1
  Flash Image, Claude Opus 5.5, Claude Sonnet 5.5, legacy 4.6 models, and
  GPT-OSS 120B.
- [x] Add routing entries and output-token limits for the new models.
- [x] Auto-enable newly discovered models.
- [x] Persist explicit opt-outs in `disabledModelIds`.
- [x] Drop models that the backend no longer advertises.
- [x] Expose catalog source (`live` or bundled) to the UI.
- [x] Keep the existing settings file shape readable and upgradable.

### Tests

- [x] Runtime ID canonicalization.
- [x] Effort extraction and canonical ordering.
- [x] Enable-list merge: keep, add, drop, opt-out.

### Exit criteria

- `npm test` passes.
- A live catalog refresh updates the picker without duplicating models.
- A retired model disappears from the picker but stays harmless in storage.

---

## Phase 5 — Durable Image Attachments

**Goal:** Forward DSH attachment images correctly and avoid image-only turn
bugs.

### Tasks

- [x] Detect nested images, including images inside tool results.
- [x] Require the attachment service when durable references are present.
- [x] Return `UNSUPPORTED_CONTENT` for text-only models.
- [x] Read request images with `maxPixels` and `maxBytes` limits.
- [x] Project offloaded images with a base64 representation budget.
- [x] Preserve the legacy inline-base64 path when formats are mixed.
- [x] Convert prepared image versions to Gemini `inlineData`.
- [x] Add a model-facing text handle beside every image.
- [x] Keep image-only messages as explicit user turns.
- [x] Pass the attachment service through the adapter without hard imports.
- [x] Document the attachment-service requirement.

### Exit criteria

- Syntax and unit checks pass.
- A request with a prepared image produces `inlineData` plus a handle text
  part.
- A request with an unprepared durable image fails clearly rather than sending
  an empty image.
- Real-account visual verification remains part of Phase 9.

---

## Phase 6 — Web UI Rebrand, Theme, Accessibility, Lifecycle

**Goal:** Make the settings pane feel native to DSH in both themes and clean up
after itself.

### Tasks

- [x] Replace every hard-coded color with `--dsw-alias-*` tokens.
- [x] Use `--dsw-alias-bg-layer-1/-2`, border levels, label levels, button
  tokens, state colors, and markdown code-block tokens.
- [x] Remove the light-only card, badge, bar, and error colors.
- [x] Add custom brand mark and page header at the new visual standard.
- [x] Add `focus-visible` rings to every interactive control.
- [x] Add `role="progressbar"` with `aria-valuenow` and labels.
- [x] Add `role="alert"` for errors and `aria-busy` on the account card.
- [x] Keep checkbox labels implicit and keyboard operable.
- [x] Add reduced-motion handling.
- [x] Dispose the navigation MutationObserver, click listener, and animation
  frame on plugin unload.
- [x] Register locales through `ctx.effect` so they unregister.
- [x] Remove the upstream 300 ms polling interval.
- [x] Throttle navigation icon patching with `requestAnimationFrame`.
- [x] Add a diagnostics panel with refresh and copy actions.
- [x] Show catalog source and credential expiry.
- [x] Keep English and Chinese copy for every new string.

### Exit criteria

- The pane is legible in light and dark themes with no hard-coded colors.
- Keyboard focus is visible on buttons, checkboxes, and the diagnostics
  summary.
- Unloading the plugin leaves no observer, listener, timer, frame, or locale
  registration behind.

---

## Phase 7 — Privacy and Diagnostics

**Goal:** Make screenshots and support reports safe by default.

### Tasks

- [x] Mask the email local part in the credential summary.
- [x] Never return the raw refresh token, access token, or client secret from
  a web API.
- [x] Redact `ya29.*` access tokens, `1//*` refresh tokens, bearer headers,
  and secret JSON fields.
- [x] Add a `/antigravity/api/doctor` endpoint with redacted diagnostics.
- [x] Keep diagnostics local; no telemetry or remote logging.
- [x] Document credential and settings paths.
- [x] Add unit tests for masking and redaction.

### Exit criteria

- `/antigravity/api/status` and `/antigravity/api/doctor` contain no complete
  email address or credential value.
- Copying diagnostics from the UI yields redacted text.

---

## Phase 8 — Local Packaging and Installation

**Goal:** Install this working copy into the local `web` profile reliably.

### Tasks

- [x] Add a rebranded `package.json` with `dsh.bundle.patch` and
  `dsh.client.inject`.
- [x] Add `cordis.patch.yml` with the `dsh-antigravity` insert entry.
- [x] Expose both `dsh-antigravity-login` and compatibility
  `antigravity-login` binaries.
- [x] Add `scripts/install-local.mjs`.
- [x] Add `npm run check`, `npm test`, `npm run verify`, and
  `npm run install:local`.
- [x] Add `README.md`, `LICENSE`, and `assets/icon.svg`.
- [x] Exclude personal screenshots and upstream assets.

### Install procedure

```powershell
cd "C:\Users\adity\Documents\DeepSeek Plugins\dsh-antigravity"
node scripts/install-local.mjs web
```

Then restart the web server:

```powershell
dsh web --no-open --port 3123
```

### Exit criteria

- The profile manifest points at this directory.
- The plugin appears in the DSH plugin inventory.
- `/antigravity/api/status` responds after restart.
- No boot warnings mention `dsh-antigravity`.

---

## Phase 9 — Verification Matrix

**Goal:** Prove the edition works at every layer that can be tested locally.

| Check | Method | Status |
| --- | --- | --- |
| Syntax | `npm run check` | Pass |
| Unit tests | `npm test` | Pass (13/13) |
| Package manifest | `npm pack --dry-run` | Pending final run |
| Local install | `dsh plugin --profile web add link:...` | Pending reinstall |
| Boot | `dsh web --no-open --port 3123` | Pending restart |
| API status | `GET /antigravity/api/status` | Pending restart |
| Doctor route | `GET /antigravity/api/doctor` | Pending restart |
| Settings UI | Browser at `/settings` | Pending restart |
| Light theme | Visual check | Pending |
| Dark theme | Visual check | Pending |
| OAuth login | Real Google account | Blocked — no test account |
| Chat completion | Real Google account | Blocked — no test account |
| Image request | Real Google account + attachment | Blocked — no test account |
| Quota refresh | Real Google account | Blocked — no test account |
| Uninstall/reinstall | Remove, add, restart | Pending final run |

### Real-account acceptance script

When an account is available:

1. Sign in and confirm the masked email and plan badge.
2. Confirm quota groups include reset times.
3. Refresh the catalog and verify the picker matches the backend.
4. Send a text prompt to Gemini and to Claude; confirm streaming output.
5. Send a prompt with a PNG attachment; confirm the image is understood.
6. Trigger a tool call; confirm the tool result is replayed correctly.
7. Disable a model, refresh, and confirm it stays disabled.
8. Enable a new model, refresh, and confirm it stays enabled.
9. Open diagnostics and confirm no secret or full email is present.
10. Sign out and confirm credentials are deleted.

---

## Phase 10 — Release and Maintenance

**Goal:** Keep the edition maintainable without republishing upstream identity.

### Tasks

- [ ] Tag v0.1.0 once real-account checks pass.
- [ ] Keep a changelog of DSH API changes and backend model changes.
- [ ] Re-run `npm run verify` before every reinstall.
- [ ] Review the bundled catalog quarterly; live discovery remains primary.
- [ ] Track `dsh-llm` export changes (`CallId`, `ToolCallId`, attachment
  policy helpers).
- [ ] Evaluate deferred enhancements:
  - Multi-account pool with explicit selection and failover.
  - Usage history and per-model spend estimates.
  - Image generation request surface.
  - Automatic catalog refresh on a timer.
- [ ] Never add telemetry or remote credential storage.

### Exit criteria

- A repeatable install, verification, and rollback procedure exists.
- Deferred features are documented rather than half-implemented.

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| DSH renames another LLM export | Medium | Boot failure | Namespace import + runtime lookup; fail with a precise message. |
| Google changes runtime model IDs | High | Model discovery gaps | Live catalog is primary; canonicalization tolerates suffixes; bundled fallback remains. |
| OAuth client identity changes | Low | Login failure | Client ID/secret overrides via environment. |
| Endpoint region gating | Medium | Request failure | Ordered endpoint fallback with retry classification; explicit override. |
| Attachment service absent | Low | Image requests fail | Clear `UNSUPPORTED_CONTENT` error; text requests unaffected. |
| Theme token rename | Low | Visual regressions | Tokens are public DSH aliases; fallback colors only in typography, not surfaces. |
| Real-account behavior differs from API shape | Medium | Unverified edge cases | Phase 9 script; diagnostics panel for field reports. |

## 5. Rollback

1. Stop the DSH web server.
2. Remove the local link:
   `dsh plugin --profile web remove dsh-antigravity`.
3. Reinstall the previous package or restore the previous profile manifest.
4. Restart DSH.

Credential and settings files are untouched by install and removal, so signing
in again is not required unless the user explicitly signs out.

## 6. Definition of Done

- [x] No upstream personal branding, repository links, or screenshots remain.
- [x] Package, provider, API, slot, and storage identifiers are compatible.
- [x] The plugin boots against local DSH `0.1.1-rc.2`.
- [x] All adopted upstream defects have a code fix and, where practical, a
  unit test.
- [x] Light and dark themes use DSH tokens only.
- [x] Locale, observers, listeners, timers, and frames are disposed.
- [x] Images, gzip responses, and OAuth refresh have explicit handling.
- [x] Diagnostics are redacted and copyable.
- [x] Local install and verification commands are documented.
- [ ] Real-account text, tool-call, image, and quota checks pass.
- [ ] Final reinstall and post-restart smoke test pass.
