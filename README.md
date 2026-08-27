# Longo Catalog — Automation (Part 1)

Playwright + TypeScript automation project for the Longo QA homework, targeting the staging
environment at `https://stage.longo.lv`.

## Stack choice and why

**Playwright + TypeScript.**

The choice of the testing tool is mostly explained by personal experience and convenience.
Firstly, e2e tests check UI side. UI is written with Typesctipt and JavaScript, of course if we are talking about web-applications, and in my opinion it is mentally easier to work without seperating environments. Having front-end and testing in one language and platform allows using one repository and deeper integration.
Secondly, I have used Selenium in for NodeJs and Puppeteer Sharp for C#. Compared to them Playwright is more straightforward and has better documentation.
Also, Playwright provides in-built HTML report production, launch with its own UI interface, AI integration etc. 

## Install

Requires Node.js (LTS) and npm.

```bash
npm ci
npx playwright install --with-deps
```

## Run

```bash
npx playwright test
```

This is the single command that runs the full suite (all `tests/*.spec.ts` files, across
Chromium/Firefox/WebKit as configured in `playwright.config.ts`). Useful variants:

```bash
npx playwright test tests/catalog-filtering.spec.ts   # a single spec
npx playwright test --project=chromium                # a single browser
npx playwright show-report                             # open the last HTML report
```

### Configuration

Nothing required to run against staging — `https://stage.longo.lv/` is the hardcoded default. To
point at a different environment (e.g. a local instance), set `BASE_URL`:

```bash
BASE_URL=https://stage.longo.lv/ npx playwright test
```

The base URL is only ever read from config/env (`playwright.config.ts`), never hardcoded in a
test or page object, so there is no path to an accidental run against production (`longo.lv`).

Browser is selected via `--project=chromium|firefox|webkit` (see above); locale is a per-test
concern handled through `pages/locale-switcher.ts` rather than a global config value, since only
the language-switching test needs to change it mid-run.

Parallelism is capped at 2 workers in `playwright.config.ts` (`workers: 2`), in line with the
"maximum 2 parallel workers" ground rule.

### Docker

A `Dockerfile` / `docker-compose.yml` are included as an optional extra:

```bash
docker compose up --build
```

Runs the suite in a container matching the pinned Playwright version and serves the HTML report
on `http://localhost:9323` afterwards.

### GitHub Actions

The workflow (`.github/workflows/playwright.yml`) is included but **does not pass when it runs**,
and this is expected given the assignment's own access rules, not a bug in the workflow or the
tests. The assignment brief states `stage.longo.lv` is reachable only from Latvian IP addresses.
GitHub-hosted runners run from Microsoft/GitHub's own datacenter IP ranges (not Latvia), so every
run gets rejected at the edge before it ever reaches the app.

## What's covered

| Required scenario                  | Test file                                  | What it does                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Catalog filtering**              | `tests/catalog-filtering.spec.ts` (test 1) | Applies make (`Volkswagen`) + body type (`Hečbeks`) + price range (5000–20000) on the catalog, then checks the first 3 result cards against **two independent attributes**: title contains the make, and price falls within the selected range (polled per card, not just "results appeared").                                   |
| **Negative / empty state**         | `tests/catalog-filtering.spec.ts` (test 2) | Combines `BMW` + `Mikroautobuss` — a make/body-type pair guaranteed to return zero results regardless of current staging stock. Asserts result count is 0, zero cards render, and the empty-state element is visible.                                                                                                            |
| **Card → detail page consistency** | `tests/card-detail-consistency.spec.ts`    | Reads model, year, mileage, price off the first catalog card, clicks into its detail page, and asserts all four values match (title as substring match, since the detail title is a longer "`<year> <make> <model> <trim>`" string; year/mileage/price as exact matches).                                                        |
| **Language switching**             | `tests/language-switching.spec.ts`         | Switches locale to `en` via the header switcher; asserts the URL changes to the translated route (`/en/catalog`, not just a prefix), visible content updates (results count text) and the switcher reflects `en`; then navigates to an unrelated page (Financing) and asserts the locale persists there too.                     |
| **Non-UI scenario**                | `tests/catalog-api.spec.ts`                | Calls the catalog's `POST /api/longo/longo-lv/catalog/find` endpoint directly via `request` (no browser page) — the same request found by inspecting network traffic while filtering in the UI. Checks the response is well-formed (status/shape/types), and that a make+bodyType+price filter is actually enforced server-side. |

**Optional extra also included:** `tests/accessibility.spec.ts` runs `@axe-core/playwright`
against the homepage and asserts zero serious/critical violations. That is an accessibility testing engine for websites with Playwright integration. Also included: GitHub Actions
workflow (above), HTML report (default reporter), and Docker setup
(above).

Axe-core tests currently **fail, and is expected to** — `@axe-core/playwright` found 3 real
`serious`/`critical` accessibility defects on staging (cookie dialog with no accessible name,
locale-switcher links below WCAG AA contrast, and filter `<select>` elements with no accessible
name at all). 

### Page Object Model

All page objects live in `pages/`, one class per page/component, holding locators and interaction
methods — no raw selectors appear inside test bodies:

- `pages/catalog-page.ts` — the catalog page: filter controls (make, body type, price), results
  count, empty state, and a `card(index)` factory returning a `ResultCard`.
- `pages/result-card.ts` — a single catalog result card (title, price, year/mileage chips), used
  by both the filtering and consistency tests.
- `pages/vehicle-detail-page.ts` — the vehicle detail page (title, price, mileage chip).
- `pages/locale-switcher.ts` — the lv/en/ru switcher in the header; not tied to one page since
  it's present site-wide.

Tests only call methods on these classes (`catalogPage.selectMake(...)`, `card.getPriceValue()`,
etc.) — CSS/role selectors are encapsulated inside the page objects, not scattered in specs.

### Fixtures and utils

- `fixtures/cookie-banner.ts` extends Playwright's base `test` with a `removedCookieBannerPage`
  fixture: it navigates to `/`, waits, and clicks "Atļaut visu" (Accept all) before handing the
  page to the test. Every UI test consumes this instead of repeating the dismissal steps, so the
  cookie banner can never block interactions and the logic lives in one place. The API test
  (`catalog-api.spec.ts`) doesn't use it, since it never opens a browser page.
- `utils/human-delay.ts` adds a randomized pause (400–1200ms) between actions. It's used
  throughout the page objects and tests because staging's rate limiting started returning
  429/403 responses when requests fired in tight, evenly spaced bursts.

### Waits

No fixed `sleep()` is used to wait for app state. All waits are either Playwright's built-in
auto-waiting/web-first assertions, or explicit conditions (`waitForFunction` on the results-count
placeholder text, `waitFor({ state: 'visible' })` on a filter chip or the empty state). The one
timed wait in the codebase (`page.waitForTimeout(3000)` in `catalog-page.ts`) is not a
substitute for a real wait — it's a fixed recovery pause after a transient "Neparedzēta kļūme"
error banner, before retrying the click, and is documented inline as such. That title appears after clicking too fast on the category options and can be overcome after a delay.

### Independence

Each test navigates from scratch via its own page object (`catalogPage.goto()` /
`removedCookieBannerPage` fixture) and doesn't depend on state left behind by another test.
`fullyParallel: true` is set in `playwright.config.ts`, so tests are expected to run in any order
or in parallel workers without interfering with each other.

## What was deliberately left out

- **Only one locale pair is asserted end-to-end** (lv → en, plus persistence across navigation).
  `ru` isn't separately covered — the switcher logic is generic (`LocaleSwitcher.switchTo(locale)`
  already accepts `'ru'`), but only one test case for 'en' is covered.
- **Mobile viewports** aren't part of the automated suite; mobile is covered by the manual
  exploratory session in Part 2. 

## Known flakiness

- The environment stage.longo.lv is defended by Cloudflare. Sometimes that causes test failures when there is a timeout error. For that reason retry strategy was enforced. Also server side limits the number of requests made from the machine. Response code 429 signifies about it.  
- Comparing data on the catalog page and detailed vehicle page once caused unexpected error. As long as catalog page always loads with random list of vehicles clicking on the first card could not open detail vehicle page because it did not exist. 
- **Filter interactions occasionally hit a transient staging error.** Applying a filter click/
  select fast can trigger a "Neparedzēta kļūme! Lūdzu, mēģ..." error banner instead of a normal
  re-fetch. `CatalogPage.applyFilter` detects this, waits 3s, and retries once — this has been
  reliable in practice but is inherently timing-dependent staging behaviour, not something the
  test can fully control.
- **`slowMo: 500` and `humanDelay()` are deliberately throttling the suite** to avoid staging's
  bot/rate-limit protection (429/403s were observed under fast, bursty interaction). This makes
  the suite slower but more reliable; the catalog-filtering test also raises its own timeout to
  60s to give this room.
- **The `expandSection` retry loop in `CatalogPage`** exists because the filter sidebar can
  re-render and collapse an accordion mid-click; it retries opening the section for up to 10s.
  This has not been observed to fail in testing but is a heuristic around the app's real
  behaviour, not a guaranteed fix.
