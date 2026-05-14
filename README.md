# Adscreation Hub

Multi-brand AI creative production studio. Built on Next.js + Supabase + Google Drive, deployed to Vercel.

## What this is (Phase 1)

The site shell. You can:
- Create isolated brand rooms (one per brand)
- Add products with a status flag (`pre_order`, `sale`, `sold_out`, `draft`)
- See the live tone engine automatically swap "Pre-order" vs "Sale" CTAs and banned phrases per product
- Link a Google Drive folder to each brand
- Add competitor references — paste a Meta Ad Library URL, a Drive file ID, or just the ad copy
- Write a Brand DNA prompt that will be loaded server-side on every generation call

What's **not** in Phase 1 (coming next):
- Generation (Gemini images, Higgsfield video)
- Google Drive OAuth (manual folder ID for now)
- Auto-scrape of competitor ads
- Auth / login

---

## First-time setup (~10 minutes)

You need three accounts: GitHub, Supabase, Vercel. All free.

### 1. Supabase project (3 min)

1. Go to https://supabase.com → New project
2. Pick a name (e.g. `adscreation-hub`), generate a strong DB password, save it somewhere
3. Wait for it to provision (~1 min)
4. Open the **SQL Editor**, paste the contents of `supabase-schema.sql`, click Run
5. Open **Settings → API**, copy these three values for later:
   - **Project URL** → goes into `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (under "Project API keys", secret) → goes into `SUPABASE_SERVICE_ROLE_KEY`

> The service_role key bypasses RLS. Never commit it. Only Vercel and your local `.env.local` should ever see it.

### 2. Local install (3 min)

```bash
cd C:\Users\Danielle\Downloads\adscreation-hub
npm install
copy .env.local.example .env.local
```

Open `.env.local` in a text editor and paste the three values from step 1.

Then:

```bash
npm run dev
```

Visit http://localhost:3000 — you should see an empty Brands page. Create your first brand to test.

### 3. Push to GitHub (2 min)

```bash
git init
git add .
git commit -m "Initial commit: Adscreation Hub Phase 1"
git branch -M main
```

On https://github.com/new, create a new private repo named `adscreation-hub` (don't initialize with anything). Then:

```bash
git remote add origin https://github.com/hubberdione/adscreation-hub.git
git push -u origin main
```

### 4. Deploy to Vercel (2 min)

1. Go to https://vercel.com → Add New Project → import the `adscreation-hub` repo
2. Framework preset: Next.js (auto-detected)
3. Expand **Environment Variables** and add the same three values from step 1:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click Deploy

After ~1 minute you have a live URL like `https://adscreation-hub.vercel.app`. Every push to `main` auto-deploys.

---

## Project structure

```
app/
  layout.tsx                            — site shell + nav
  page.tsx                              — redirects to /brands
  brands/
    page.tsx                            — list all brands
    new/page.tsx                        — create brand form
    [slug]/
      layout.tsx                        — brand context + tab nav
      page.tsx                          — brand overview dashboard
      products/page.tsx                 — products list + new form
      products/[id]/page.tsx            — product detail + tone preview
      competitors/page.tsx              — competitor references list + form
      dna/page.tsx                      — brand DNA prompt editor
      drive/page.tsx                    — Google Drive folder link
  api/
    brands/route.ts                     — GET list, POST create
    brands/[slug]/route.ts              — GET, PATCH, DELETE one brand
    brands/[slug]/products/route.ts     — products GET/POST
    brands/[slug]/products/[id]/route.ts — product GET/PATCH/DELETE
    brands/[slug]/competitors/route.ts  — competitor references GET/POST

lib/
  supabase/server.ts                    — server-side Supabase client (service role)
  supabase/client.ts                    — browser Supabase client (anon key)
  brand-scope.ts                        — requireBrand() — the isolation core
  tone.ts                               — buildCopyTone() — single source of truth for pre-order vs sale
  schemas.ts                            — Zod schemas (input validation at the boundary)
  utils.ts                              — cn() helper

types/
  brand.ts, product.ts, competitor.ts

components/
  BrandCard.tsx, ProductRow.tsx, ToneBadge.tsx
  ui/                                   — minimal inline Button/Card/Input/Badge

supabase-schema.sql                     — run this once in Supabase SQL editor
```

---

## Design principles (non-negotiable)

1. **No cross-brand data access ever.** Every server function takes `brandId` and scopes all queries to it. `lib/brand-scope.ts` is the only entry point.
2. **DNA prompt is always loaded server-side**, never sent from the client.
3. **API keys live in Vercel env vars only.** Never shipped to the browser.
4. **Pre-order products cannot use sale-tone CTAs.** `buildCopyTone()` is the single gate.
5. **One function, one purpose.** Files stay small and focused.
6. **Validation at boundaries.** Every API route validates input with Zod. Internal calls trust their inputs.

---

## Phase 2 — Google Drive setup (one-time)

Phase 2 reads files from each brand's Google Drive folder using a **service account** (a "robot Google account" that you share folders with). One-time setup:

### 2.1 Create the service account (~5 min)

1. Open https://console.cloud.google.com/ — sign in with your Google account
2. Top bar: click the project dropdown → **New Project** → name `adscreation-hub` → Create
3. Wait ~10 seconds for it to provision, then make sure it's selected
4. Left sidebar (☰ menu) → **APIs & Services → Library** → search for "Google Drive API" → click it → **Enable**
5. Left sidebar → **IAM & Admin → Service Accounts** → **+ Create Service Account**
   - Name: `drive-reader`
   - ID: `drive-reader` (auto-fills)
   - Click **Create and Continue**, skip the optional steps, **Done**
6. Click into the new service account → **Keys** tab → **Add Key → Create New Key → JSON → Create**
7. A JSON file downloads. Open it in a text editor. You need two values from it:
   - `client_email` (looks like `drive-reader@adscreation-hub-xxxxx.iam.gserviceaccount.com`)
   - `private_key` (a long string starting `-----BEGIN PRIVATE KEY-----`)

### 2.2 Add to Vercel env vars (~1 min)

In Vercel → your project → Settings → Environment Variables, add:

| Key | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | the `client_email` value (no quotes) |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | the `private_key` value, including the `-----BEGIN...END PRIVATE KEY-----` lines. Vercel will store the `\n` characters correctly — paste verbatim. |

Then **Deployments → Redeploy** the latest deploy.

### 2.3 Share each brand's Drive folder

For each brand, open its Drive folder → **Share** → paste the service account email (from step 2.2) → set permission to **Viewer** → uncheck "Notify people" → Share.

After that, paste the folder ID into the brand's Drive page in the app. Files appear automatically.

---

## Coming next (Phase 3+)

- **Phase 3:** Gemini image generation route — loads DNA prompt + tone + product refs from Drive
- **Phase 4:** Higgsfield video generation + Kive asset library integration
- **Phase 5a:** (already in Phase 1 schema) Manual competitor references shipped
- **Phase 5b:** Auto-scrape Meta Ad Library on a schedule
