# Deploying prodentadvisors.com to Hostinger

Everything in this folder is a plain static site — no build step, no Node, no PHP.
You upload the files and it works.

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

## 2. Upload the site

**hPanel → Files → File Manager**, open `public_html`, and delete Hostinger's
default placeholder (`default.php` or their sample `index.html`).

Then upload **the contents of this folder** (not the folder itself) into `public_html`:

```
public_html/
├── .htaccess              ← important, see note below
├── index.html
├── about.html
├── contact.html
├── results.html
├── services.html
├── services-startups.html
├── services-consulting.html
├── services-marketing.html
├── services-billing.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── assets/
    ├── css/styles.css
    ├── js/main.js
    └── img/…
```

Easiest method: upload `prodent-site.zip` (in this folder) into `public_html`,
right-click it → **Extract**, then delete the zip.

> **⚠️ `.htaccess` is a hidden file.** In File Manager, click the **gear / Settings**
> icon and enable **"Show hidden files (dotfiles)"** — otherwise it won't appear and
> won't get uploaded. Without it you lose the HTTPS redirect, the www redirect,
> the custom 404 page, and caching.

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

5. Re-upload `assets/js/main.js` to `public_html/assets/js/`.

That's it. Every submission now arrives at **info@prodentadvisors.com** with:

- **Subject:** `New website inquiry — <the person's name>`
- **From name:** `ProDent Advisors Website`
- **Reply-To:** the prospect's own email — so hitting **Reply** in your inbox
  writes straight back to them, no copy-pasting addresses.
- **Body:** name, email, phone, practice name, what they need help with,
  their best time to be reached, and their message.

**Until you paste the key**, the form runs in *demo mode*: it validates, shows the
success message and clears — but sends nothing. The success message says
"(Demo mode…)" so you can tell at a glance.

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

Edit the file on your computer, then re-upload just that file through File Manager,
overwriting the old one. HTML pages are set to `no-cache`, so edits appear
immediately. CSS, JS and images are cached for a year by browsers — if you change
`styles.css` or `main.js` and don't see the update, hard-refresh
(**Cmd+Shift+R** / **Ctrl+Shift+R**), or rename the file and update the reference.
