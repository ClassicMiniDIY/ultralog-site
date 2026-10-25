# ultralog.co: Route 53 → Cloudflare, and API access for Claude

> **Status (2026-10-25):** Part 1 done. Batches A-D done: ultralog.co and www are Worker custom
> domains, www 301s to the apex, SSL Full (strict), Always Use HTTPS, TLS 1.2+. The Route 53
> hosted zone is deleted (its servers now answer REFUSED, so stale resolvers fall back to the
> Cloudflare delegation) and GitHub Pages is off. Backups outside the repo:
> `../ultralog-site-dns-backup-2026-10-25.json` (Cloudflare import) and
> `../ultralog-site-route53-backup-2026-10-25.json` (Route 53 zone). Left: delete the setup token.

Part 1 is yours (registrar and account steps). Part 2 is what Claude does over the Cloudflare
API and `gh`, one approved batch at a time. The site keeps serving from GitHub Pages until the
cutover in batch C, so nothing goes down while DNS moves.

## Current DNS (public lookup, 2026-10-24)

| Name | Type | Value |
| --- | --- | --- |
| `ultralog.co` | A | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (GitHub Pages) |
| `ultralog.co` | AAAA | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| `www.ultralog.co` | CNAME | `ultralog.co` |

No MX or TXT records are visible. The registrar is Amazon Registrar (Route 53 Domains), and
DNSSEC is off, so there is nothing to disable before you move the name servers.

---

## Part 1: your steps

### 1. Export the Route 53 zone

A public lookup cannot list every record, for example a `_github-pages-challenge` TXT record. Export the full zone first:

```bash
aws route53 list-hosted-zones-by-name --dns-name ultralog.co --query 'HostedZones[0].Id' --output text
```

```bash
aws route53 list-resource-record-sets --hosted-zone-id <ZONE_ID_FROM_ABOVE> > ultralog-route53.json
```

Keep `ultralog-route53.json`. Step 2 compares against it, and it is the rollback copy.

### 2. Add the zone to Cloudflare

1. Open the Cloudflare dashboard and choose the **ClassicMiniDIY** account (it already hosts `open-ecu-alliance`).
2. Click **Add a domain**, enter `ultralog.co`, and choose **Quick scan for DNS records**.
3. Choose the **Free** plan.
4. Compare the imported records with `ultralog-route53.json`. Add any record the scan missed. Do not import the Route 53 `NS` and `SOA` records.
5. Set the apex `A`/`AAAA` records and the `www` `CNAME` to **DNS only** (grey cloud). GitHub Pages then keeps its own certificate until the cutover.
6. Write down the two name servers Cloudflare assigns (`<name>.ns.cloudflare.com`).

### 3. Point the domain at Cloudflare's name servers

1. Go to the Route 53 console, then **Registered domains**, then **ultralog.co**.
2. Choose **Actions**, then **Edit name servers**.
3. Replace the four `awsdns` servers with the two Cloudflare servers, and save.

Or with the CLI (Route 53 Domains is only in `us-east-1`):

```bash
aws route53domains update-domain-nameservers --region us-east-1 --domain-name ultralog.co --nameservers Name=<first>.ns.cloudflare.com Name=<second>.ns.cloudflare.com
```

Cloudflare emails you when the zone is **Active**. That is usually within an hour, and can take up to 48 hours. Check it with:

```bash
dig +short NS ultralog.co
```

Keep the Route 53 hosted zone for at least two days after the zone is Active. Resolvers can cache the old NS records for up to 48 hours. Batch E deletes the zone.

### 4. Create two Cloudflare API tokens

To create each token, go to **My Profile**, then **API Tokens**, then **Create Token**.

**a. `ultralog-site setup (Claude)`**: a **Custom token** with a 14-day TTL.

| Scope | Permission | Access |
| --- | --- | --- |
| Account | Workers Scripts | Edit |
| Account | Account Settings | Read |
| Zone | Zone | Read |
| Zone | DNS | Edit |
| Zone | Workers Routes | Edit |
| Zone | Zone Settings | Edit |
| Zone | Single Redirect | Edit |
| User | User Details | Read |

- **Account Resources:** Include, then ClassicMiniDIY.
- **Zone Resources:** Include, then Specific zone, then `ultralog.co`.
- Set the TTL end date 14 days out. When setup is done, delete the token or let it expire.

**b. `ultralog-site deploy (GitHub Actions)`**: start from the **Edit Cloudflare Workers** template.

- **Account Resources:** ClassicMiniDIY only.
- **Zone Resources:** `ultralog.co` only.
- No TTL. This token becomes the CI secret, and CI redeploys the custom domains on every run.

### 5. Give Claude the setup token (Keychain, never chat)

```bash
security add-generic-password -a "$USER" -s cloudflare-ultralog-setup -w
```

`-w` with no value makes `security` prompt for the token, so the token stays out of shell history and the transcript. Claude reads it only inside commands, as `CLOUDFLARE_API_TOKEN="$(security find-generic-password -s cloudflare-ultralog-setup -w)"`, and never prints it. The first read may show a macOS prompt; click **Always Allow** for `security`.

Check that the token works:

```bash
curl -s -H "Authorization: Bearer $(security find-generic-password -s cloudflare-ultralog-setup -w)" https://api.cloudflare.com/client/v4/user/tokens/verify
```

The response should contain `"status":"active"`. Also send Claude the **Account ID**, which is not a secret: it is in the dashboard sidebar under the account name.

### 6. GitHub secrets (after batch A creates the repo)

Paste each token at the prompt. Do not put it on the command line.

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo ClassicMiniDIY/ultralog-site
```

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID --repo ClassicMiniDIY/ultralog-site --body <ACCOUNT_ID>
```

The app repo needs a token that can send a `repository_dispatch` to the site repo. Create it on GitHub:

1. Go to **Settings**, then **Developer settings**, then **Fine-grained tokens**, then **Generate new token**.
2. Set **Resource owner** to `ClassicMiniDIY` and **Repository access** to `ultralog-site` only.
3. Under **Repository permissions**, set **Contents** to **Read and write**. Metadata read is added automatically.
4. Set a one-year expiry.

If the org blocks fine-grained tokens, allow them under **Org settings**, then **Personal access tokens**. Then store the token:

```bash
gh secret set SITE_DISPATCH_TOKEN --repo ClassicMiniDIY/UltraLog
```

---

## Part 2: what Claude does (each batch needs your yes)

**A. GitHub.** Create the public repo `ClassicMiniDIY/ultralog-site` and push `main`. CI then fails until Part 1 step 6 is done; that is expected.

**B. First deploy to workers.dev.** Using the setup token:

1. Run `wrangler deploy`.
2. Smoke-test `https://ultralog-site.classicminidiy.workers.dev`: `/`, `/download`, `/releases`, `/docs`, `/ecus/haltech`, `/sitemap.xml`.
3. After the secrets exist, re-run the GitHub Actions deploy to prove CI.

ultralog.co still serves GitHub Pages at this point.

**C. Cutover (Cloudflare API).** This is the only step visitors can notice; it takes a few minutes.

1. Delete the apex `A`/`AAAA` records and the `www` `CNAME`. A Workers custom domain cannot share its hostname with existing records.
2. Add these routes to `wrangler.jsonc` and deploy. Cloudflare creates the proxied DNS records and the edge certificates. The change is committed, so CI keeps the routes.
   ```jsonc
   "routes": [
     { "pattern": "ultralog.co", "custom_domain": true },
     { "pattern": "www.ultralog.co", "custom_domain": true }
   ]
   ```
3. Add a Single Redirect (phase `http_request_dynamic_redirect`): when `http.host eq "www.ultralog.co"`, send a 301 to `concat("https://ultralog.co", http.request.uri.path)` with the query string kept.
4. Set the zone settings: SSL/TLS **Full (strict)**, **Always Use HTTPS** on, minimum TLS **1.2**. HSTS waits until the site has been stable for a week.
5. Verify with `curl -sI`: `https://ultralog.co/` returns 200 from the Worker, `http://` gives a 301 to `https://`, `www` gives a 301 to the apex, and `/download/` gives a 307 to `/download`.

**D. Retire GitHub Pages (PR to UltraLog `main`, after 2-3 days on Cloudflare).**

1. Delete `docs/CNAME`, `docs/index.html`, `docs/robots.txt` and `docs/sitemap.xml`.
2. Turn off Pages with `gh api -X DELETE repos/ClassicMiniDIY/UltraLog/pages`.
3. Add the release dispatch step and the `release: edited` workflow (snippets in `docs/plans/2026-10-24-ultralog-site.md`).

**E. Clean up.** After the zone has been Active for two days:

1. Delete the Route 53 hosted zone. You can do this, or Claude can through the AWS tools with your approval.
2. Delete the setup token.

### Rollback

- **Before C:** nothing visitors can see has changed.
- **After C, while Pages is still on (before D):**
  1. Remove the two `routes` (Workers & Pages, then `ultralog-site`, then Domains, or a deploy without them).
  2. Re-add the GitHub Pages `A`/`AAAA` records from the table above, plus the `www` `CNAME`, as DNS only.
  3. The site is back on Pages within minutes.
