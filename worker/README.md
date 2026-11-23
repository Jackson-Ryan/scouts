# Scout Tools API Worker

A small Cloudflare Worker that handles server-side operations for the static GitHub Pages site:

1. **GitHub SSO for `/admin/` (`POST /api/auth/exchange`)** — completes the OAuth 2.0 + PKCE code exchange using `GITHUB_CLIENT_SECRET`, verifies the GitHub username against `ALLOWED_ADMINS` (`Jackson-Ryan`), and confirms repository push permission before returning a session token. Anyone else gets `403 Forbidden`.
2. **In-app public game submissions (`POST /api/submissions`)** — lets any Scout leader submit a game from `/games/add` without a GitHub account. Submissions are validated, rate-limited, honeypot-checked, and queued for review inside `/admin/`.

## Setup

### 1. Create a GitHub OAuth App

1. Open **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name:** `Scout Tools Admin`
   - **Homepage URL:** `https://jackson-ryan.github.io/scouts/` (or your custom domain)
   - **Authorization callback URL:** `https://jackson-ryan.github.io/scouts/admin/`
3. Copy the **Client ID** and generate a **Client Secret**.

### 2. Create a fine-grained token for public submissions

This token is only used to queue public game submissions — it does **not** need code write access.

1. Open **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Restrict **Repository access** to **Only select repositories → `Jackson-Ryan/scouts`**.
3. Under **Repository permissions**, grant **Issues: Read and write** (leave Contents and everything else as *No access*).
4. Copy the generated token.

### 3. Deploy the Worker

```bash
cd worker
npx wrangler login
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GITHUB_SUBMISSIONS_TOKEN
npx wrangler deploy
```

Note the deployed Worker URL printed by Wrangler (for example `https://scout-tools-api.<your-subdomain>.workers.dev`).

### 4. Connect the site

Open `assets/js/site-config.js` and fill in your public values:

```js
githubClientId: "Ov23li...",
apiBase: "https://scout-tools-api.<your-subdomain>.workers.dev",
```

If you use a custom domain, also add it to `ALLOWED_ORIGINS` in `worker/wrangler.toml` and re-run `npx wrangler deploy`.

Commit and push `assets/js/site-config.js` to `main`, and both `/admin/` GitHub SSO and in-app `/games/add` submissions will be live on GitHub Pages.
