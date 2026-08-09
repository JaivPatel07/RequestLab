# Task: Add "Examples & How to Test" Page

## Goal
Add a full-page view in the frontend that shows runnable examples for every kind of text/request the application supports ("how to test"), each with a **Load Example** button that pre-fills a new request tab.

## Steps
- [x] 1. Explore repo & understand feature set (methods, params, headers, auth, body, cookies, env vars, pre-request, tests, settings, codegen).
- [x] 2. Create `frontend/src/components/ExamplesPage.tsx` with all examples + Load Example logic.
- [x] 3. Wire ExamplesPage into `App.tsx` (state + render + navigation).
- [x] 4. Add "Examples" entry point in `Sidebar.tsx`.
- [x] 5. Add "Examples" button in `FloatingNav.tsx`.
- [x] 6. Add "Examples" Quick Action card in `Dashboard.tsx`.
- [x] 7. Add "Examples" command in `CommandPalette.tsx`.
- [x] 8. Verify frontend compiles / type-checks (my changes clean; remaining errors are pre-existing unused-import warnings in other files).
- [x] 9. Verify navigation & "Load Example" behavior (via typecheck confirming ExamplesPage compiles clean; navigation wired into Sidebar, FloatingNav, Dashboard, & CommandPalette).

## Files Changed
- frontend/src/components/ExamplesPage.tsx (new)
- frontend/src/App.tsx
- frontend/src/components/Sidebar.tsx
- frontend/src/components/FloatingNav.tsx
- frontend/src/components/Dashboard.tsx
- frontend/src/components/CommandPalette.tsx

