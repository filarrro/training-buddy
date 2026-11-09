# Training Buddy — Architecture (MVP, T1–T8)

Frontend-only, offline PWA. Vite + React 19 + TypeScript (strict, TS 7), Zustand (+ persist → IndexedDB via idb-keyval), canvas-confetti, vite-plugin-pwa (injectManifest, `src/sw.ts`), Vitest (+ fake-indexeddb, jsdom, Testing Library).
Source of truth for behaviour: `docs/requirements.md` (Refined Requirements) and `docs/tickets.md`.

Commands: `npm run dev` (5173) · `npm run build` (`tsc -b && vite build`) · `npm run preview` (4173) · `npm test` · `npm run typecheck`.

## Folder layout

```
index.html                 lang, viewport-fit=cover, theme-color
vite.config.ts             React plugin + vitest config (PWA agent adds vite-plugin-pwa)
src/
  main.tsx                 global CSS, registerPwa(), <App/>
  app/
    App.tsx                hydration gate (Splash) → Shell: current screen + enter animation, ToastHost, UpdateToast, storage banner
    nav.ts                 nav store (screen stack) + nav.startSession()
    history.ts             system/browser "back" bridge
    Splash.tsx, Placeholder.tsx, app.css
  components/              design-system components (see below) + components.css
  domain/                  pure logic, no React/stores
    types.ts               Category, Target, Exercise, WorkoutItem, RestSettings, Workout, Settings, Step, SessionStepStatus, SessionPhase, ActiveSession
    builtins.ts            CATEGORIES (color, icon glyph, label key, side unit), BUILTIN_EXERCISES, FBW A/B, DEFAULT_REST
    generator.ts           generateSteps() (BR1/BR2), workSteps, countWorkSteps, restBefore, indexById
    format.ts              names, targets ("4 × 5–7 powt."), side labels, clock mm:ss, overtime, durations
    estimate.ts            FR5 estimate
    validation.ts          LIMITS, validateTarget (forms), sanitize* (persisted data)
  data/db.ts               IndexedDB kv + persist storage + persistOptions() + useStorageStatus
  stores/
    library.ts             custom exercises/workouts + FBW overrides, selectors, hooks, name helpers
    settings.ts            lang, sound, countdownBeeps, vibration, keepScreenOn
    ui.ts                  lockHintSeen, installScreenSeen
    toast.ts               transient toasts (showToast)
    hydration.ts           useHydrated / waitForHydration
  i18n/
    core.ts                dictionaries, translate(), plural rules, detectLang
    index.ts               useT(), t(), plural(), useLang(), useDocumentLang()
    locales/{pl,en}/{common,start,preview,session,config,settings,pwa}.ts
  screens/                 StartScreen, PreviewScreen, SettingsScreen, home/**, config/**
  session/                 store.ts (session state), SessionScreen, FinishScreen, …
  pwa/                     index.ts (registerPwa, UpdateToast, shouldShowInstallScreen), InstallScreen, LockHintScreen
  styles/                  tokens.css, global.css, animations.css
  test/setup.ts            fake-indexeddb, act env, jsdom shims
docs/decisions/<area>.md   per-agent decision logs (Polish)
```

## File ownership (next phase)

| Agent | Owns |
|---|---|
| session | `src/session/**` (store.ts, engine.ts, audio.ts, wakeLock.ts, SessionScreen.tsx, FinishScreen.tsx, components under `src/session/`), `src/i18n/locales/*/session.ts` |
| home | `src/screens/StartScreen.tsx`, `PreviewScreen.tsx`, `SettingsScreen.tsx`, `src/screens/home/**`, `src/i18n/locales/*/{start,preview,settings}.ts` |
| config | `src/screens/config/**`, `src/i18n/locales/*/config.ts`; may ADD (not change existing signatures) actions in `src/stores/library.ts` |
| pwa | `vite.config.ts`, `index.html`, `public/**`, `src/sw.ts`, `src/pwa/**`, `src/i18n/locales/*/pwa.ts` |
| foundation (frozen) | components, styles, domain, data, stores, `i18n/index.ts` + `i18n/core.ts`, `app/` — only additive, backwards-compatible additions when clearly needed |

Each agent logs its own decisions in `docs/decisions/<area>.md` and never edits another area's file.
Placeholder screens exist for every screen so the app compiles; owners replace them wholesale but keep the **export name and props**:

| Screen (nav name) | Component (file) | Props |
|---|---|---|
| `start` | `StartScreen` (screens/StartScreen.tsx) | — |
| `preview` | `PreviewScreen` (screens/PreviewScreen.tsx) | `{ workoutId: string }` |
| `settings` | `SettingsScreen` (screens/SettingsScreen.tsx) | — |
| `config` | `ConfigScreen` (screens/config/ConfigScreen.tsx) | — |
| `configWorkout` | `WorkoutEditorScreen` (screens/config/WorkoutEditorScreen.tsx) | `{ workoutId?: string }` (undefined = new) |
| `configExercise` | `ExerciseEditorScreen` (screens/config/ExerciseEditorScreen.tsx) | `{ exerciseId?: string }` (undefined = new) |
| `session` | `SessionScreen` (session/SessionScreen.tsx) | — |
| `finish` | `FinishScreen` (session/FinishScreen.tsx) | — |
| `install` | `InstallScreen` (pwa/InstallScreen.tsx) | — |
| `lockHint` | `LockHintScreen` (pwa/LockHintScreen.tsx) | `{ workoutId: string }` |

## Navigation API (`src/app/nav.ts`)

State-based, no router. `useNav` holds `stack: NavEntry[]` (`{ screen, key }`) and `direction` (`forward` | `back` | `fade`, drives the enter animation).

```ts
import { nav, useScreen, useNav } from '../app/nav';
nav.go({ name: 'preview', workoutId });   // push
nav.replace({ name: 'finish' });          // replace top (lockHint → session, session → finish)
nav.back();                               // pop (no-op at root)
nav.reset();                              // stack = [start]; nav.reset({ name: 'install' })
nav.startSession(workoutId): boolean      // snapshot workout + exercises → createSession() → 'lockHint' (first time) or 'session'
```

- `startSession` clones the workout and its exercises (BR3), calls `createSession(workout, exercises)` from `src/session/store.ts`, then **replaces** `preview` with `lockHint`/`session` (so the stack becomes `[start, session]`). Returns `false` for a missing workout or one without exercises.
- LockHintScreen: on confirm call `useUi.getState().markLockHintSeen()` then `nav.replace({ name: 'session' })`.
- Session end: SessionScreen → `nav.replace({ name: 'finish' })`; FinishScreen "Wróć do startu" → `nav.reset()`.
- System back (`app/history.ts`): on `session` → `requestExitConfirm()` from `session/store.ts` (session UI shows the "End workout?" dialog, reading `useSessionStore(s => s.exitConfirmRequested)` and calling `clearExitConfirm()`); on `finish` → reset to start; otherwise `nav.back()`.
- Install screen: App calls `shouldShowInstallScreen()` (pwa) once after hydration; if true → `nav.reset({ name: 'install' })`. InstallScreen "Continue" → `markInstallScreenSeen()` + `nav.reset()`.

## Store APIs

All persisted stores use `persistOptions()` from `src/data/db.ts`: IndexedDB DB `training-buddy`, store `kv`, schema `version: 1` + `migrate` stub, and a `merge` that runs `sanitize*` (corrupt data → defaults, never a crash). Persist storage never rejects (a rejection would block hydration). If IndexedDB is unavailable the app runs in memory and `useStorageStatus(s => s.available) === false` shows a banner.

### `src/stores/library.ts` (key `library`)
State: `exercises` (CUSTOM only) and `workouts` (custom + stored overrides of FBW A/B with the same id). Built-ins come from `domain/builtins.ts`.

Actions (`useLibrary.getState().x(...)`):
- `saveExercise(ex)` — upsert custom; built-in ids ignored. If target type changes (reps ↔ time) all items using it get the new default target, sets kept (D34).
- `deleteExercise(id)` — removes it from library and from every workout in one `set()` (D33); workouts may end with `items: []` ("Brak ćwiczeń").
- `changeExerciseType(id, newDefaultTarget)` — explicit D34 variant.
- `duplicateExercise(id, t)` / `duplicateWorkout(id, t)` → new id; name "X (kopia)", "X (kopia 2)" (BR10; suffix = `t('common.copySuffix')`).
- `saveWorkout(w)` — upsert; FBW ids are stored as overrides (`builtIn: true`, `nameKey` kept).
- `updateWorkout(id, patch)` — patch (mode, rest, items, name…); for FBW creates/updates the override (FR8, FR26).
- `deleteWorkout(id)` — custom only.
- `restoreBuiltin(id)` — removes the FBW override (BR11).

Selectors (pure, memoised — safe as `useLibrary(selector)`; default arg = current state):
`getAllWorkouts()`, `getWorkout(id)`, `getAllExercises()`, `getExercise(id)`, `getExercisesById()`, `getWorkoutExercises(workout)`, `workoutsUsingExercise(exerciseId)`, `isBuiltinOverridden(id)`, `getBuiltinDefault(id)`.
Hooks: `useAllWorkouts()`, `useWorkout(id)`, `useAllExercises()`, `useExercise(id)`, `useExercisesById()`.
Helpers: `newId()`, `normalizeName()`, `isExerciseNameTaken(name, exceptId?)`, `isWorkoutNameTaken(name, exceptId?)` (case-insensitive, custom only), `duplicateName(base, existing, suffix)`, `itemFromExercise(ex)`.

Never return freshly built arrays/objects from a `useLibrary(...)` selector (zustand v5 would loop) — use the memoised selectors or `useShallow`.

### `src/stores/settings.ts` (key `settings`)
`useSettings` → `{ lang, sound, countdownBeeps, vibration, keepScreenOn, setLang(lang), update(patch), reset() }`. Defaults: lang from `navigator.language` (`pl*` → pl, else en), all toggles `true`.

### `src/stores/ui.ts` (key `ui`)
`useUi` → `{ lockHintSeen, installScreenSeen, markLockHintSeen(), markInstallScreenSeen(), setFlag(flag, value) }`.

### `src/stores/toast.ts`
`showToast(message, { tone?: 'neutral'|'success'|'danger'|'work'|'rest', actionLabel?, onAction?, durationMs? })` — rendered by `<ToastHost/>` in App.

### `src/stores/hydration.ts`
`useHydrated()`, `waitForHydration()`, `allHydrated()`. App shows the animated Splash until all persisted stores hydrate (4 s safety timeout). Add any new persisted store to `PERSISTED` there (foundation file — additive change).

### `src/session/store.ts` (session agent)
Contract used by foundation: `createSession(workout: Workout, exercises: Exercise[]): ActiveSession`, `requestExitConfirm(): void`. Stub also exports `useSessionStore` (`session`, `exitConfirmRequested`) and `clearExitConfirm()`. The `ActiveSession` / `SessionPhase` types live in `domain/types.ts`; the session agent may extend them additively.

## Domain essentials

- Ids: built-in exercises `builtin:pullup-overhand`, `builtin:dips`, `builtin:bulgarian-split-squat`, `builtin:nordic-curl`, `builtin:plank`, `builtin:pullup-wide`, `builtin:deficit-pushup`, `builtin:skater-squat`, `builtin:hip-thrust`, `builtin:hanging-leg-raise`; workouts `builtin:fbw-a`, `builtin:fbw-b`. Stable forever.
- `generateSteps(workout, exercisesById)` → `Step[]`: `WorkStep { itemIndex, exerciseId, set, setsTotal, exerciseNo, exerciseTotal, round?, roundsTotal?, side?, workIndex }`, `RestStep { reason: 'sets'|'exercises'|'rounds'|'sides', durationSec }`. 0 s rests omitted, no rest after the last step. Circuit: `set === round`, `exerciseNo/exerciseTotal` are within the round.
- `restBefore(steps, i)` → index of the rest directly before step `i` (BR5) or -1.
- Formatting: `exerciseName(ex, t)`, `workoutName(w, t)`, `formatSetsTarget(sets, target, t, { unilateral, category })`, `formatTarget`, `formatTimeRangeHint`, `sideLabel(side, category, t)`, `formatClock(sec)`, `remainingSec(ms)`, `formatOvertime(sec)`, `formatDuration(sec, t)`, `estimateWorkoutSec` + `formatEstimate`.
- Validation for forms: `LIMITS` (reps 1–100, time 5–600 s, sets 1–10, rest 0–600 s, names 50/40), `validateTarget(target)` → error codes, `isValidName(name, max)`.

## i18n

```ts
import { useT, t, plural } from '../i18n';
const t = useT();                              // reactive (language switch without reload)
t('common.action.save');
t('common.count.sets', { count: 5 });          // "5 serii" — plural via Intl.PluralRules
t('session.restEndsIn', { time: '0:30' });     // {param} interpolation
```
- Key = `<namespace>.<key>`; namespaces: `common, start, preview, session, config, settings, pwa`. Each namespace file (`src/i18n/locales/{pl,en}/<ns>.ts`) exports a flat `Record<string,string>`; keys inside the file are written WITHOUT the namespace prefix.
- Plurals: add `key_one`, `key_few`, `key_many`, `key_other` (PL) and `key_one`, `key_other` (EN); call with `{ count }`.
- Missing key → PL → the key itself. Always add both PL and EN.
- Categories: `common.category.<id>`; built-in names: `common.exercise.<slug>`, `common.workout.fbw-a|fbw-b`; modes `common.mode.straight|circuit`; side labels `common.side.<left|right>.<leg|side>`.
- `<html lang>` is kept in sync by `useDocumentLang()` in App.
- Non-React code: `t()` / `plural()` read the current language from the settings store.

## Design system

Dark-only theme (tokens in `src/styles/tokens.css`). Key variables:
- Neutrals: `--c-bg #0B0F17`, `--c-surface #141A24`, `--c-elevated #1D2532`, `--c-elevated-2`, `--c-border(-strong)`, `--c-text #F3F5F9`, `--c-text-2`, `--c-muted #8B95A7`, `--c-on-accent` (dark text on every filled accent).
- WORK (energy/primary): `--c-work #FF5A1F`, `--c-work-2 #FF8A3D`, `--grad-work`, `--c-work-text`, `--c-work-soft`, `--glow-work`.
- REST: `--c-rest #14D3C5`, `--c-rest-2 #38BDF8`, `--grad-rest`, `--c-rest-text`, `--c-rest-soft`, `--glow-rest`.
- Success: `--c-success #A3E635`, `--grad-success`; danger `--c-danger #F43F5E`, `--c-danger-text`.
- Categories: `--c-cat-pull|push|legs|posterior|core` (also `CATEGORIES[cat].color/cssVar`).
- Type: `--fs-xs … --fs-4xl`, `--fs-display` (session timer), weights `--fw-*`; utility classes `.display-num`, `.tabular`, `.eyebrow`, `.muted`, `.text-work|rest|success|danger`.
- Spacing `--sp-1…9` (4 px grid), radii `--r-xs…xl`, `--r-pill`, sizes `--tap-min 48px`, `--btn-h-lg 60px`, shadows `--shadow-1..3`.
- Motion: `--dur-fast|base|slow|screen|progress`, `--stagger-step`, `--ease-out|in-out|spring|emph` (reduced-motion shrinks durations).
- Safe areas: `--safe-top|bottom|left|right`.

Layout classes (global.css): `.screen` > `ScreenHeader` + `.screen-body` (+ optional `.action-bar` sticky bottom thumb zone with safe-area padding). Helpers `.stack`, `.stack-lg`, `.row`, `.row-between`, `.grow`, `.visually-hidden`.

Animation utilities (`src/styles/animations.css`, all neutralised under `prefers-reduced-motion`):
| Class | Use |
|---|---|
| `.screen-enter` (+`--back`, `--fade`) | applied by App to each screen |
| `.stagger` | on a list: children fade-up one by one (`--i` overrides order) |
| `.press` | scale .96 on :active (Button/Card already have it) |
| `.pulse-overlay` + `.pulse-work` / `.pulse-rest` / `.pulse-success` | full-screen colour pulse at end of rest / countdown (D29) — static colour under reduced motion |
| `.pop` | 3-2-1 number pop (re-key the element per number) |
| `.slide-in-next` | "next exercise" card slide-in |
| `.slide-up`, `.fade-in`, `.fade-up`, `.scale-in` | generic entrances |
| `.check-burst`, `.check-burst-ring`, `.check-draw` | "Zrobione" check-mark burst |
| `.breathe` | glow pulse on the current element |
| `.shimmer`, `.shake`, `.spin` | loading / invalid input / spinner |
Keyframes are named `tb-*` and can be reused in component CSS.

Components (`import { … } from '../components'`):
- `Button` — `variant: primary|rest|success|secondary|ghost|danger`, `size: sm|md|lg` (lg = 60 px thumb-zone), `block`, `icon`, `iconRight`; `IconButton` — `{ icon, label }` 48 px.
- `Card` — `interactive` (renders `<button>`), `accent` (CSS colour for left stripe), `elevated`, `disabled`.
- `CategoryBadge` — `{ category, size: 'dot'|'sm'|'md' }` (glyph + colour + label).
- `ProgressBar` — `{ value 0..1, label, valueText?, tone }` (spring fill).
- `ProgressRing` — `{ progress 0..1, size, stroke, tone, animated, label, children }` (SVG gradient ring; centre content).
- `Stepper` — `{ value, onChange, min, max, step, label, format? }`.
- `ConfirmDialog` — `{ open, title, message?, confirmLabel?, cancelLabel?, tone, onConfirm, onCancel }` (alertdialog, focus trap, Esc).
- `BottomSheet` — `{ open, onClose, title, children, footer? }`.
- `ScreenHeader` — `{ title, eyebrow?, onBack?, actions?, large? }`.
- `Toast`, `ToastHost` (use `showToast()`), `Icon` (`name` from the built-in set or raw `path`), `cx()`, `useModal`, `usePresence`.

## Testing notes

- Unit tests next to code (`*.test.ts(x)`); `src/test/setup.ts` loads fake-indexeddb, sets the React act environment and shims `scrollTo`/`matchMedia`.
- Component tests: wrap store updates in `await act(async () => …)` (sync `act` does not flush here).
- Reset stores in `beforeEach` with `useLibrary.setState({ exercises: [], workouts: [] })`, `nav.reset()` etc.
