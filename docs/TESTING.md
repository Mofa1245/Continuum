# How to Test Continuum

Run all commands from the **repo root**: `C:\Users\MBF\Downloads\Continuum` (or your clone path).

---

## 1. Prerequisites

- **Node.js** (v18+). Check: `node -v`
- **npm**. Check: `npm -v`
- **Python 3** (for UI backend). Check: `python --version` or `python3 --version`
- **pip** (for UI backend deps). Check: `pip --version`

Install dependencies and build:

```powershell
cd C:\Users\MBF\Downloads\Continuum
npm install
npm run build
```

Optional (for UI):

```powershell
pip install -r ui/backend/requirements.txt
cd ui/frontend && npm install && cd ../..
```

---

## 2. Create Some Runs (so you have data to verify)

Runs are stored as `runs/run_*.json`. You need at least one run to test verify, watch, and the UI.

**Option A – Invoice pipeline (recommended, matches README)**

```powershell
npx tsx examples/invoice-processor/pipeline.ts
```

This writes 3 runs (invoice1, invoice2, invoice3) into `runs/`.

**Option B – Drift demo (format_drift at path `total`)**

```powershell
npm run continuum -- drift-demo
```

Runs prompt_v1 (baseline) then prompt_v2, compares outputs, and writes artifacts so the drift appears in CLI verify, Dashboard diff view, TokenDiff, and DriftHeatmap. Expect exit code 1 and a `format_drift` entry: path `json_parse.total`, expected `72`, received `"72.00"`.

**Option C – Other CLI demos (also write to `runs/`)**

```powershell
npm run continuum -- invoice-demo
# or
npm run continuum -- llm-demo
# or
npm run continuum -- demo
```

After any of these, list runs:

```powershell
dir runs
```

You should see files like `run_*.json`.

---

## 3. Test Verify (no drift)

Verify that stored runs replay without drift:

```powershell
npm run continuum -- verify-all --strict
```

- **Expected:** `All runs verified successfully.` and exit code 0.
- **If you see failures:** Some run’s replayed output doesn’t match the stored run (drift).

Verify a single run:

```powershell
npm run continuum -- verify <runId> --strict
```

Example (use a real run ID from `runs/`):

```powershell
npm run continuum -- verify run_1234567890_abc1234 --strict
```

---

## 4. Test Drift Detection (optional)

To see verify **fail** (drift):

1. Open `examples/invoice-processor/pipeline.ts`.
2. Change the prompt (e.g. line ~43) from  
   `Extract invoice fields carefully.`  
   to  
   `Extract invoice fields strictly in JSON.`
3. Run the pipeline again:  
   `npx tsx examples/invoice-processor/pipeline.ts`
4. Run verify:  
   `npm run continuum -- verify-all --strict`  
   You should see verification fail for the affected run(s).

Revert the prompt change when done.

---

## 5. Test the UI (dashboard)

Start backend + frontend and open the dashboard:

```powershell
npm run continuum -- ui
```

- Backend: http://localhost:8000  
- Frontend: http://localhost:3000 (browser should open after a few seconds)

If the browser doesn’t open, go to http://localhost:3000 manually.

**Manual start (two terminals):**

- Terminal 1: `uvicorn ui.backend.main:app --port 8000`
- Terminal 2: `cd ui/frontend && npm run dev`  
Then open http://localhost:3000.

The UI reads from `artifacts/runs/`; the backend syncs from `runs/*.json` into `artifacts/runs/<run_id>/` when you load the app.

---

## 6. Test Watch (live debugging workflow)

`continuum watch` monitors `runs/`, runs verify on each **new** run, and opens the UI when drift is detected.

**Terminal 1 – start watch:**

```powershell
npm run continuum -- watch
```

You should see: `Watching runs/ for new runs. Press Ctrl+C to stop.`

**Terminal 2 – create a new run:**

```powershell
npm run continuum -- invoice-demo
```

In Terminal 1 you should see something like:

- `New run detected: run_.... Verifying...`
- Either `run_...: verified.` or `Drift detected. Opening dashboard...` (and the browser opens).

To test drift-with-UI:

1. Start watch in Terminal 1.
2. In pipeline code, change the prompt (as in section 4).
3. In Terminal 2, run the invoice pipeline or invoice-demo again.
4. Watch should report drift and open the dashboard.

Stop watch with **Ctrl+C** in Terminal 1.

---

## 7. Other CLI Commands (smoke test)

- **Inspect a run:**  
  `npm run continuum -- inspect <runId>`
- **Replay check:**  
  `npm run continuum -- replay-check <runId>`
- **Validate run invariants:**  
  `npm run continuum -- validate-run <runId>`
- **Replay (strict):**  
  `npm run continuum -- replay <runId> --strict`
- **Diff two runs:**  
  `npm run continuum -- diff <runIdA> <runIdB>`

Use a real `runId` from `runs/` (filename without `.json`).

---

## 8. Unit / Typecheck (optional)

```powershell
npm run typecheck
npm run test
```

---

## Quick Checklist

| Step | Command | Expected |
|------|---------|----------|
| Build | `npm install && npm run build` | No errors |
| Create runs | `npx tsx examples/invoice-processor/pipeline.ts` | 3 runs in `runs/` |
| Verify all | `npm run continuum -- verify-all --strict` | All runs verified successfully |
| UI | `npm run continuum -- ui` | Browser opens at http://localhost:3000 |
| Watch | `npm run continuum -- watch` then create a run in another terminal | New run detected → verify → message |
| Drift demo | `npm run continuum -- drift-demo` | format_drift at total (72 vs "72.00"); artifacts written |

---

## Report for ChatGPT (copy-paste to get on the same step)

**Project:** Continuum – records AI workflow runs and replays them for drift detection. Repo root: `C:\Users\MBF\Downloads\Continuum`.

**Stack:**  
- Node/TypeScript CLI (`dist/cli/index.js`); run via `npm run continuum -- <command>` on Windows to avoid PowerShell launcher issues.  
- Runs stored as `runs/run_*.json` (FileRunStore).  
- UI: Python FastAPI backend (port 8000), Next.js frontend (port 3000); backend syncs `runs/*.json` into `artifacts/runs/<run_id>/` for the dashboard.

**CLI commands:**  
`resolve`, `demo`, `llm-demo`, `invoice-demo`, `ui`, `watch`, `inspect <runId>`, `replay-check <runId>`, `validate-run <runId>`, `replay <runId> [--strict]`, `verify <runId> [--strict]`, `verify-all [--strict]`, `diff <runIdA> <runIdB>`.

**How to test end-to-end:**  
1) From repo root: `npm install`, `npm run build`.  
2) Create runs: `npx tsx examples/invoice-processor/pipeline.ts` (or `npm run continuum -- invoice-demo`).  
3) Verify: `npm run continuum -- verify-all --strict` → expect “All runs verified successfully.”  
4) UI: `npm run continuum -- ui` → browser at http://localhost:3000.  
5) Watch: `npm run continuum -- watch` in one terminal; in another, run invoice-demo or the pipeline → new run triggers verify; if drift, UI opens.

**Drift test:** Change the prompt in `examples/invoice-processor/pipeline.ts`, re-run the pipeline, then `verify-all --strict` → verification should fail.

**Current state:** Watch command implemented; verify-on-new-run and open-UI-on-drift work. CLI on Windows used via `npm run continuum --` to avoid “Application not found” when running the global `continuum` launcher.
