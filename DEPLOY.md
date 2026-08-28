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

## 4. Make the contact form email you  ← the part you asked about

The form on `contact.html` is wired to **Web3Forms**, which delivers submissions to
your inbox without needing any server code.

1. Go to **https://web3forms.com**
2. Enter **`info@prodentadvisors.com`** in the "Enter your email" box and submit.
3. Web3Forms emails that address an **Access Key** (a UUID like
   `a1b2c3d4-1234-5678-9abc-def012345678`). Open the email and copy it.
4. Open **`assets/js/main.js`**, find this line near the top of the contact-form
   section (line 113):

   ```js
   var WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
   ```

   Replace the placeholder with your key:

   ```js
   var WEB3FORMS_ACCESS_KEY = 'a1b2c3d4-1234-5678-9abc-def012345678';
   ```

5. Publish it:

   ```bash
   git add assets/js/main.js
   git commit -m "Add Web3Forms access key"
   git push
   ```

   With auto-deploy on (step 2d) it's live in seconds. Without it, click
   **Deploy** on the Hostinger GIT page.

That's it. Every submission now arrives at **info@prodentadvisors.com** with:

- **Subject:** `New website inquiry — <the person's name>`
- **From name:** `ProDent Advisors Website`
- **Reply-To:** the prospect's own email — so hitting **Reply** in your inbox
  writes straight back to them, no copy-pasting addresses.
- **Body:** name, email, phone, practice name, what they need help with,
  their best time to be reached, and their message.

**Until you paste the key**, the form refuses to submit. It shows a red message
telling the visitor to email or call instead, and logs an explanation to the
browser console. It will never show a success message for an email that wasn't
actually sent.

**On success**, the visitor is redirected to `thank-you.html` — a confirmation
page with what-happens-next, your direct phone and email, and links onward to
Results and Services. That page is set to `noindex` and deliberately kept out of
`sitemap.xml`, since a confirmation page shouldn't appear in search results.
It's also a clean conversion goal if you ever set up Google Analytics or Ads:
count arrivals at `/thank-you.html`.

**Test it after uploading:** submit the live form yourself, then check
`info@prodentadvisors.com` — including the spam folder the first time. If it landed
in spam, mark it "Not spam" once and future ones will inbox.

<details>
<summary>Optional: send notifications to more than one address</summary>

In `assets/js/main.js`, just below the `data.append('replyto', …)` line, add:

```js
data.append('cc', 'kathim@prodentadvisors.com');
```

Web3Forms' free tier allows 250 submissions/month, which is well beyond what a
practice-consulting site will see.
</details>

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
