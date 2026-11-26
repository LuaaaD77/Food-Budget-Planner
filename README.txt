FOOD BUDGET PLANNER — LICENSING FOUNDATION (PHASE 1)

Included:
- Existing PWA and all existing planner/report features.
- Client activation screen and local Ed25519 signature verification.
- Cloudflare Worker activation API.
- D1 schema for one-time activation codes, device binding, status and revocation.
- Manual seller endpoint for creating activation codes.

IMPORTANT
This is a foundation package, not a live deployed licensing service. The client is intentionally in setup mode until you configure API_BASE and PUBLIC_KEY. Do not sell copies as license-protected until deployment and end-to-end tests are complete.

DATA PRESERVATION
The planner's existing localStorage key (foodBudgetPlanner_v1) is unchanged. Licensing uses separate keys:
- fbp_license_v1
- fbp_installation_v1
No planner records are deleted or migrated by licensing.

DEPLOYMENT OVERVIEW
1. Create a Cloudflare account (with a parent/guardian if required).
2. Install Wrangler locally and authenticate: npm install -g wrangler; wrangler login
3. Create D1: wrangler d1 create food-budget-planner-licenses
4. Put returned database_id in wrangler.toml.
5. Apply schema: wrangler d1 execute food-budget-planner-licenses --remote --file=schema.sql
6. Generate Ed25519 keypair (see KEY-GENERATION.txt). Store PRIVATE KEY only as Worker secret LICENSE_PRIVATE_KEY. Store ADMIN_TOKEN as Worker secret ADMIN_TOKEN.
7. Deploy: wrangler deploy
8. Set FBP_LICENSE_CONFIG.API_BASE in index.html to the deployed Worker URL and PUBLIC_KEY to the generated public SPKI base64.
9. Upload updated PWA files to GitHub Pages and test activation on a clean test browser.

CREATE A MANUAL ACTIVATION CODE
POST to https://YOUR-WORKER/admin/create
Header: Authorization: Bearer YOUR_ADMIN_TOKEN
JSON body: {"customerNote":"Order reference 001"}
The response contains a one-time activationCode. Send that code privately to the customer after payment.
Never send the ADMIN_TOKEN or private signing key to customers.

ACTIVATION
Customer enters the code once while online. The signed lifetime license is stored locally and verified offline on later launches.

LIMITATIONS
- A browser PWA cannot securely bind to physical hardware. The installation ID is stored in browser storage and can be lost if site data is cleared.
- A signed lifetime license cannot be remotely revoked while a device remains offline.
- This discourages unauthorized use; it cannot prevent copying the downloaded source code.
- Device transfer requires seller assistance. The seller must handle reissue carefully; an offline old installation may continue working.
- Do not store payment card details or unnecessary personal data in customer_note.

PHASE 1 STATUS
Source and backend foundation supplied. Cloudflare account setup, key generation, deployment, and end-to-end validation remain to be completed before commercial enforcement is active.


UI UPDATE (NOV 2026)
- Ingredients tab now has a Zoom out · All ingredients overview with animated compact tiles.
- Return · Organized by dish restores the existing grouped view and editing controls.
- Ingredient search now matches ingredient names only; dish names and notes are not searched.
- Existing saved data and licensing storage keys are unchanged.


EASIER INGREDIENT ENTRY UPDATE
- Improved mobile spacing for ingredient search and meal filter.
- Larger add button and clear success feedback.
- Selected dish checkboxes remain selected after adding an ingredient, making consecutive entries faster.
- Ingredient name field receives focus after each successful add.
- Clearer selected dish styling and subtle motion, with reduced-motion support.
- Existing data model and other app features are preserved.
