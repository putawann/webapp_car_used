# Handoff: used-car price demo web app (webapp_car_used)

User writes in Thai; reply in Thai. User is a student building an ML used-car price predictor (Thailand market) plus a demo website.

## Where things are
- **Web app repo (main work):** `D:\claude_access\webapp_car_used` → GitHub `putawann/webapp_car_used`, branch `main`, deployed by GitHub Pages from `main` root: https://putawann.github.io/webapp_car_used/
  - Latest commit `ef33f63` (v0.0.8). History v0.0.1–v0.0.8 is in `git log` (commit messages describe each step in Thai).
  - No build step: `index.html` + `css/style.css` + ES modules in `js/` (`app.js` form/UI, `fx.js` Three.js background, `ui.js` GSAP/Lenis/scramble/cursor/sound, `data.js` translations + placeholder price formula, `specs.js` generated). Libraries via CDN import map in `index.html`.
  - Must be served over HTTP to test locally (`python -m http.server 8765`), not opened as a file.
- **ML project (notebooks):** `D:\claude_access\new_project` (EDA, feature selection, linear/tree/RF/XGBoost notebooks; `config.py` points to the dataset). Not touched this session.
- **Training dataset:** path is in `D:\claude_access\new_project\config.py` (`car_dataset_v5.1.csv`, 30,104 rows; columns brand, model, car_type, fuel_type, gear_type, color, engine_capacity, mileage, year, car_age, price).
- Other repos on the account: `project_car_used`, `truth-card-game` (not looked at).

## Current state of the web app
- ctOS / "Predictive World"-style design (monospace, single blue accent), TH/EN switch, sun/moon theme toggle.
- Fixed 3D background: particle car morphing through 6 body types (sedan → SUV → pickup → hatchback → van → sports), spinning wheels, road/speed lines, bloom in dark mode; particles form the price digits after a prediction. Pause/play button bottom-right; animation plays by default even with OS reduced-motion (user's Windows has animation effects OFF — this was a source of confusion earlier).
- Form = cascading dropdowns Brand → Model → Year → Spec (cc · fuel · gear · body) + Color; only **mileage** is free input. Specs come from **real Thai-market data**, NOT the training file (explicit user requirement).
  - Source of truth: `data/specs/*.csv` (one file per brand, small brands in `others.csv`), every row has a `source` URL. Regenerate with `python tools/build_specs.py [dataset.csv]` (passing the dataset checks all 554 model names the ML model knows are covered).
  - Cross-check vs real listings: 97.2% match; remaining mismatches are mostly data-entry errors in the training data.
  - Fuel includes `ev` (cc=0), which the training data does not have → must be mapped before calling a real model.
- `predictPrice()` in `js/data.js` is still a **placeholder formula** (the "MODEL HOOK"); it receives `{brand, model, year, mileage, trans, fuel, cc, body, color}` and may be async.

## Open items / likely next steps
1. Connect the real trained model (replace `predictPrice`), including mapping `ev`/new values to training categories.
2. Spec data still unverified by web search for the long tail (~500 rarer/luxury/old/grey-import models were reviewed from knowledge only). Unresolved: Mitsubishi Triton 2005 V6 3.0 petrol in Thailand?; MG5 hatchback 2015 existence in Thailand.
3. Optional earlier suggestions never done: mileage plausibility warning; mobile testing of the 3D scene (only tested desktop; browser tab was often hidden so frames were forced manually).
4. Earlier minimal design is preserved at commit `dbb2cd0` (v0.0.4) if the user wants it back.

## Working conventions the user expects
- Plan first for big changes; ask before commit/push/deploy (user usually replies "commit push deploy now" / "ทำเลย"). After pushing, wait for the Pages build and verify the live site.
- Commit messages in Thai, version-numbered `v0.0.x`, ending with the attribution line from the system reminder.
- Git identity is set per-repo (GitHub noreply address); don't change global config.
- Keep things simple (no unnecessary deps); verify in the browser before claiming done.

## Suggested skills
- `superpowers:brainstorming` / `superpowers:writing-plans` — before any new feature or model integration.
- `superpowers:systematic-debugging` — if the site misbehaves (check reduced-motion / hidden-tab behavior first).
- `claude-in-chrome` — for in-browser verification of the deployed or local site.
- `superpowers:verification-before-completion` — before reporting work as done or pushing.
- `artifact-design` — only if a shareable page/report is requested.
