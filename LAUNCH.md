# Launch checklist (owner actions)

Things only the owner can do (accounts, passwords, keys, human review). Tick each box when done.

## Done already

- [x] GitHub CLI installed and authenticated (`gh auth status` shows account `aminebmzgh`).

## 1. Create the GitHub repo and push (needed before anything goes live)

Claude Code's permission settings blocked creating the repository automatically. Run this once in the project folder:

```sh
gh repo create calcrafty --private --source=. --remote=origin --push
```

Or allow Claude Code to do it: tell it "go ahead and create the GitHub repo and push".

## 2. Hostinger: connect the deploy branch (going live)

Do this after the first successful run of the **Deploy** workflow, which creates the `deploy` branch.

1. Log in to **hPanel** → **Websites** → **calcrafty.com** → **Manage**.
2. Open **Advanced → Git**.
3. Repository: `git@github.com:aminebmzgh/calcrafty.git`. Because the repo is private, hPanel shows an SSH key: copy it, then in GitHub open **calcrafty → Settings → Deploy keys → Add deploy key**, paste it, and leave it read-only.
4. Branch: **`deploy`**. Install path: leave empty (= `public_html`). `public_html` must be empty first, so delete Hostinger's default files in **File Manager**.
5. Click **Create**, then **Auto deployment** and copy the webhook URL.
6. In GitHub: **calcrafty → Settings → Webhooks → Add webhook**, paste the URL, set content type to `application/json`, choose "Just the push event", and save.
7. In hPanel, click **Deploy** once to pull the first version.

**Fallback** (only if Git deployment isn't available on your plan): in hPanel open **Advanced → SSH Access**, enable SSH and note the host, port and username. Create an SSH key pair, add the public key in hPanel, then run:

```sh
gh secret set SSH_HOST
gh secret set SSH_PORT
gh secret set SSH_USER
gh secret set SSH_KEY < path/to/private_key
gh variable set DEPLOY_VIA_SSH --body true
```

## 3. Hostinger: SSL and CDN

1. hPanel → **Websites → calcrafty.com → Security → SSL**: install the free Let's Encrypt certificate for `calcrafty.com` and `www.calcrafty.com`.
2. Visit `http://www.calcrafty.com/`. It should redirect to `https://calcrafty.com/`.
3. hPanel → **Performance → CDN**: enable Hostinger CDN if your plan includes it. If it doesn't, consider putting Cloudflare's free plan in front of the site (SSL mode "Full (strict)").

## Keyword research

- [ ] **Replace estimated keyword data with real data.** `research/keyword-map.csv` uses estimated volume and difficulty (marked `estimate` in `data_source`). Export keyword data from Ahrefs, Semrush or Google Keyword Planner into `research/raw/`, then ask Claude Code to "update the keyword map from research/raw".

## About page and contact

- [ ] Add who runs Calcrafty to `src/pages/about.astro` (search for `TODO: owner`): your name, background and why you started it. This matters for trust (E-E-A-T).
- [ ] Set up the `hello@calcrafty.com` mailbox (hPanel → **Emails**), or change `SITE.email` in `src/lib/site.ts`.
