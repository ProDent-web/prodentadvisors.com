# Deploying prodentadvisors.com to Hostinger

Everything here is a plain static site — no build step, no Node, no PHP.

Deployment runs through GitHub: the repo at
**https://github.com/ProDent-web/prodentadvisors.com** is the source of truth, and
Hostinger pulls from it. You push, the site updates.

---

## 1. Point the domain at Hostinger

In **hPanel → Domains**:

- If you bought `prodentadvisors.com` **through Hostinger**, it's already pointed. Skip ahead.
- If it's registered elsewhere (GoDaddy, Namecheap, Google Domains…), go to
  **hPanel → Websites → Dashboard → DNS / Nameservers**, copy the two nameservers
  (they look like `ns1.dns-parking.com` / `ns2.dns-parking.com`), then set those as
  the nameservers at your registrar. Propagation takes 1–24 hours.

Add **both** `prodentadvisors.com` and `www.prodentadvisors.com` to the hosting plan.
The included `.htaccess` redirects `www` → non-www automatically.

---

## 2. Connect Hostinger to GitHub

Your site lives at **https://github.com/ProDent-web/prodentadvisors.com**
(public, branch `main`). Hostinger pulls straight from it — no manual uploading.

### 2a. Empty `public_html` first

**hPanel → Files → File Manager → `public_html`.** Hostinger refuses to attach a
Git repo to a folder that already has files in it, so delete everything inside —
including their default `default.php` / sample `index.html`. Delete the *contents*,
not the `public_html` folder itself.

### 2b. Attach the repository

**hPanel → Websites → Dashboard** (for prodentadvisors.com) **→ Advanced → GIT**

Fill in the "Create a new repository" form:

| Field | Value |
|---|---|
| **Repository address** | `https://github.com/ProDent-web/prodentadvisors.com.git` |
| **Branch** | `main` |
| **Directory** | *leave blank* |

Leaving **Directory** blank installs into `public_html` itself. If you type
something there, Hostinger creates `public_html/that-name/` and your site ends up
at `prodentadvisors.com/that-name/` — which is not what you want.

Click **Create**. Because the repo is public, no SSH key or password is needed.

### 2c. Deploy

The repository now appears in a list on that same page with a **Deploy** button.
Click it. Hostinger pulls `main` into `public_html` and your site is live.

### 2d. Turn on auto-deploy (optional but worth the two minutes)

Right now, Hostinger only updates when you click **Deploy**. To make every push go
live automatically:

1. On the Hostinger GIT page, next to your repository, click **Auto Deployment**
   (some plans label it with a webhook / link icon). Copy the **webhook URL** it
   shows you.
2. Go to **https://github.com/ProDent-web/prodentadvisors.com/settings/hooks**
   → **Add webhook**.
3. Set:
   - **Payload URL** — paste the Hostinger webhook URL
   - **Content type** — `application/json`
   - **Which events** — *Just the push event*
   - **Active** — checked
4. **Add webhook.**

GitHub sends a test ping immediately; a green checkmark next to the webhook means
Hostinger accepted it. From then on, `git push` = live site in a few seconds.

---

## 3. Turn on SSL

**hPanel → Websites → Dashboard → Security → SSL** → install the free Let's Encrypt
certificate for `prodentadvisors.com`. Wait until it says **Active** (usually a few
minutes) before testing, because `.htaccess` forces every visitor to `https://`.

Once every page loads over HTTPS cleanly, you can optionally uncomment the
`Strict-Transport-Security` line near the bottom of `.htaccess` for extra security.

---

## 4. The contact form — nothing to set up

**There is no step here.** Submissions go to **info@prodentadvisors.com** the
moment the site is deployed. No account, no API key, no third-party service.

`send.php` sits in the web root and uses PHP's built-in `mail()`, which Hostinger
provides on every plan. The form posts to it, it emails you, done.

**What arrives in your inbox**

- **Subject:** `New website enquiry — <the person's name>`
- **From:** `ProDent Advisors Website <noreply@prodentadvisors.com>`
- **Reply-To:** the prospect's own address — hit **Reply** and you're writing
  straight back to them, no copy-pasting
- **Body:** name, email, phone, practice, what they need help with, their best
  time to be reached, and their message, plus a timestamp

Then they land on `thank-you.html`.

**Why it won't go to spam:** the From address is on prodentadvisors.com, the same
domain Hostinger hosts, so the mail passes SPF/DKIM as legitimate mail from your
own site rather than a spoof. This is exactly why `NOTIFY_FROM` in `send.php`
must stay on your domain — pointing it at a Gmail address would break that and
send everything to junk.

**Changing the recipient** — edit one line at the top of `send.php`:

```php
const NOTIFY_TO = 'info@prodentadvisors.com';
```

then `git add -A && git commit -m "Change form recipient" && git push`.

### Verify it once, after deploying

Submit the live form yourself and check `info@prodentadvisors.com` — **look in
spam the first time**, and if it's there mark "Not spam" so future ones inbox.

If nothing arrives at all, it's almost always one of these:

1. **The mailbox doesn't exist yet.** In hPanel → **Emails**, confirm
   `info@prodentadvisors.com` is a real mailbox on this account.
2. **PHP is off or misversioned.** hPanel → **Advanced → PHP Configuration**;
   `send.php` needs PHP 7.1 or newer (Hostinger defaults well above that).
3. **`mail()` is disabled on the plan.** Rare, but check hPanel → **Emails →
   Email Accounts**. If it is, tell me and I'll switch `send.php` to
   authenticated SMTP against your Hostinger mailbox instead — about ten
   minutes of work and one password.

Hostinger logs every message it sends. hPanel → **Emails → Deliverability** shows
whether the mail left the server, which separates "PHP never sent it" from
"it sent and your mail client filed it somewhere".

### Built-in spam protection

- A hidden honeypot field. Bots fill it, humans never see it; those submissions
  are silently dropped and the bot is told "thanks" so it doesn't retry.
- A 20-second per-IP throttle, so nobody can hammer your inbox.
- Every field is stripped of newlines before it touches a mail header, which
  blocks header-injection — the standard way contact forms get hijacked into
  sending spam on your behalf.

### It works without JavaScript

The `<form>` carries `action="send.php" method="post"`, so if a visitor has
JavaScript disabled the browser submits it the ordinary way and `send.php`
redirects them to the thank-you page. The JavaScript only upgrades that to an
inline experience without a page reload.

---

## 5. Before you announce the site — one thing to fix

**The social links are placeholders.** The footer on every page links to bare
`https://www.instagram.com/`, `https://www.facebook.com/`,
`https://www.linkedin.com/`. Swap in your real profile URLs, or delete the
`<div class="socials">` block from each page's footer.

---

## 6. After launch

- **Google Search Console** — add `prodentadvisors.com`, verify via DNS TXT record
  (hPanel → DNS Zone Editor), and submit `https://prodentadvisors.com/sitemap.xml`.
- **Google Business Profile** — make sure the phone `(571) 464-2655` and
  `info@prodentadvisors.com` match what's on the site exactly; consistency helps
  local ranking.
- **Test on your phone** before sharing the link.

---

## Making changes later

Edit files on your computer, then:

```bash
git add -A
git commit -m "Describe what you changed"
git push
```

That's the whole workflow. With auto-deploy on, the site updates within seconds.
Without it, click **Deploy** in hPanel afterwards.

Two things worth knowing:

- **Every change is versioned.** If an edit breaks something, `git revert` or
  GitHub's history gets you back — which is the real reason to deploy this way
  rather than dragging files into File Manager.
- **Don't edit files in Hostinger's File Manager.** Hostinger's deploy overwrites
  the folder from GitHub, so any change made on the server gets wiped on the next
  push. GitHub is the source of truth now.

**Caching note:** HTML is served `no-cache`, so page edits appear immediately.
CSS, JS and images are cached by browsers for a year — after changing
`styles.css` or `main.js`, hard-refresh (**Cmd+Shift+R** / **Ctrl+Shift+R**) to
see it. Visitors get the new file because the deploy changes its timestamp, but
if you ever want to be certain, rename the file and update the reference.

---

## Appendix: deploying without Git

If you ever need to bypass GitHub — Hostinger's Git page is down, or you want a
one-off fix — you can still upload by hand. Run `zip -r site.zip . -x ".git/*"`
in this folder, upload the zip into `public_html` through File Manager,
right-click → **Extract**, then delete the zip.

Remember to enable **"Show hidden files (dotfiles)"** in File Manager's settings
first, or `.htaccess` won't be included and you'll lose the HTTPS redirect, the
www redirect, the custom 404 page, and caching.
