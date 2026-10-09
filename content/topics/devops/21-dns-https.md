---
title: Domains, DNS and HTTPS basics
stack: devops
order: 21
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - DNS turns a name like example.com into an IP address, the computer's real "phone number".
  - "Common records: A (name → IPv4 address), AAAA (→ IPv6), CNAME (name → another name), TXT (text, often for verification)."
  - HTTPS = HTTP inside TLS. It encrypts traffic and proves the site is really who it says it is, using a certificate.
  - Certificates expire, so they must be renewed — services like AWS Certificate Manager and Let's Encrypt do it automatically.
  - DNS changes are not instant everywhere, because answers are cached for the record's TTL.
cards:
  - q: What does DNS do?
    a: It turns a human-friendly name like api.example.com into an IP address the computer can connect to.
  - q: A record vs CNAME?
    a: An A record points a name directly to an IPv4 address. A CNAME points a name to another name, which is then looked up again.
  - q: What does HTTPS protect?
    a: It encrypts the data between browser and server, so nobody in the middle can read or change it, and the certificate proves the server is the real owner of the domain.
  - q: What is TTL in DNS?
    a: Time to live — how many seconds other computers may cache an answer. A long TTL means changes take longer to reach everyone.
  - q: What is HSTS?
    a: A header that tells the browser "always use HTTPS for this site", so it never even tries plain HTTP.
---

## 💡 What is it?

Computers find each other by **IP address**, like `172.66.147.243`. People prefer names, like `example.com`.

**DNS** (Domain Name System) is the internet's phone book. It turns names into IP addresses.

**HTTPS** is the safe version of HTTP. It **encrypts** the data (scrambles it so only the two ends can read it). It also proves, with a **certificate**, that you are talking to the real website.

## 🏠 Real-life example

Think of **posting a letter to a friend**.

- Your friend's **name** = the domain name (`example.com`).
- The **address book** that gives you their street address = DNS.
- The **street address** = the IP address.
- **"Forward my letters to my new house"** = a CNAME record (one name points to another name).
- Your **old address book page**, used until you get a new copy = DNS caching and TTL.
- A **sealed, tamper-proof envelope** = HTTPS encryption.
- The friend's **ID card checked by the postman** = the TLS certificate proving who they are.

## 🧑‍💻 Code example

Run these commands in a terminal (macOS or Linux; `dig` and `curl` are usually installed). Save them as `dns.sh` and run `bash dns.sh`.

```bash
dig +short example.com A                                    # ask DNS: which IPv4 addresses does example.com have?
dig +short www.github.com CNAME                             # ask DNS: does www.github.com point to another name?
curl -sI https://example.com | head -5                      # HTTPS request; -I = headers only, -s = silent; show the first 5 lines
curl -sI http://github.com | grep -iE "^(HTTP|location)"    # plain HTTP request; show the status and where it redirects
```

**Output** (real run, October 2026; IP addresses and dates will differ for you):

```text
172.66.147.243
104.20.23.154
github.com.
HTTP/2 200 
date: Fri, 09 Oct 2026 15:52:49 GMT
content-type: text/html; charset=utf-8
server: cloudflare
last-modified: Sun, 04 Oct 2026 20:44:03 GMT
HTTP/1.1 301 Moved Permanently
Location: https://github.com/
```

What this shows:
- `example.com` has two IP addresses (A records).
- `www.github.com` is a CNAME pointing to `github.com.`
- The HTTPS request worked (`200`), over HTTP/2.
- Plain `http://github.com` answers `301` and sends you to `https://`. That's how sites force HTTPS.

## 🔍 Deeper version

**How a DNS lookup works (simplified):**
1. The browser asks the computer's **resolver** (often from your internet provider, or a public one like 1.1.1.1).
2. If the answer isn't cached, the resolver asks the **root** servers, then the **.com** servers, then the domain's own **name servers**.
3. The answer comes back, and every step caches it for the record's **TTL** (time to live, in seconds).

**Common records:**

| Record | Means | Example |
|---|---|---|
| **A** | name → IPv4 address | `api.example.com → 203.0.113.10` |
| **AAAA** | name → IPv6 address | `api.example.com → 2001:db8::1` |
| **CNAME** | name → another name | `www.example.com → example.com` |
| **MX** | where email goes | `example.com → mail server` |
| **TXT** | free text, often for proving you own the domain | `google-site-verification=…` |
| **NS** | which name servers are in charge of the domain | `ns-123.awsdns-…` |

A **CNAME can't be used at the bare domain** (`example.com`). AWS Route 53 offers an **alias record** for this, so the bare domain can point straight to CloudFront or a load balancer.

**TTL and changes.** If a record has a TTL of 3600 seconds, some users may see the old address for up to an hour after you change it. Lower the TTL a day before a planned move.

**HTTPS and TLS:**
- **TLS** is the protocol under HTTPS. The browser and server agree on keys, and then all data is encrypted.
- The server shows a **certificate**, signed by a trusted **certificate authority (CA)**, that says "this key belongs to `example.com`". The browser checks the signature, the domain name and the expiry date.
- **Wildcard certificates** (`*.example.com`) cover every subdomain, which is useful for apps where each customer gets a subdomain.
- Certificates **expire** (often after about 90 days to a year). Let's Encrypt and **AWS Certificate Manager (ACM)** renew them automatically. An expired certificate gives users a scary browser warning.
- **HSTS** (`Strict-Transport-Security` header) tells the browser to always use HTTPS for your site.

**AWS setup (typical):** Route 53 holds the DNS records, ACM gives free auto-renewing certificates, and CloudFront or API Gateway serves HTTPS with those certificates. For CloudFront, the ACM certificate must be in the **us-east-1** region.

**At SkillKeepr (public-safe):** each customer company gets its **own subdomain**, and the frontend works out which tenant it is from that subdomain (see [multi-tenant architecture](topic:architecture/multi-tenant)). DNS records are managed in Route 53. [FILL IN: your own part with domains or certificates, if any.]

## 🎯 Why do we use it?

- **People remember names, not numbers.** And you can change servers without changing the name.
- **HTTPS keeps logins, cookies and payments private** and stops anyone in the middle from changing the page.
- **Browsers require it.** Many features (service workers, secure cookies, camera access) only work on HTTPS, and browsers mark plain HTTP sites "Not secure".

## ⚠️ Common mistakes

- **Forgetting the TTL** and being surprised that a DNS change "doesn't work" for some users.
- **Letting a certificate expire** because renewal wasn't automatic.
- **Mixed content:** an HTTPS page loading a script over `http://`, which browsers block.
- **Putting a CNAME on the bare domain**, which DNS doesn't allow. Use an alias or A record.

## 🗣️ How to answer in an interview

> "DNS is the internet's phone book. It turns a name like api.example.com into an IP address. The main records are A for an IPv4 address, AAAA for IPv6, CNAME to point one name at another name, and TXT for things like domain verification. Answers are cached for the record's TTL, so changes can take a while to reach everyone, and I lower the TTL before a planned migration.
>
> HTTPS is HTTP over TLS. It encrypts traffic, and the server's certificate, signed by a trusted authority, proves it really owns the domain. Certificates expire, so I use automatic renewal, like AWS Certificate Manager or Let's Encrypt. I redirect HTTP to HTTPS and add HSTS so the browser always uses HTTPS. On AWS, a typical setup is Route 53 for DNS, ACM for certificates, and CloudFront or API Gateway in front."

## 🔁 Follow-up questions

### What happens when you type a URL and press Enter?

DNS lookup → TCP connection → TLS handshake → HTTP request → server response → the browser renders the page. This is a classic system-design warm-up question.

### Why can't I use a CNAME for example.com?

The bare (root) domain must also hold other records, like NS and SOA, and a CNAME can't sit next to other records. Use an A record or a provider "alias" record instead.

### What's a wildcard certificate?

A certificate for `*.example.com`, which covers every one-level subdomain like `acme.example.com` and `globex.example.com`. It's handy for multi-tenant apps.

### My site shows "Your connection is not private". What do you check?

Whether the certificate expired, whether it covers this exact domain name, and whether the full certificate chain is sent. Also check the device's clock.

## ✅ Quick check

### 1. Which record points `www.example.com` to `example.com`?

- A) A
- B) CNAME
- C) MX

:::answer
**B) CNAME.** It points one name to another name. An A record points to an IP address. MX is for email.
:::

### 2. You changed an A record 10 minutes ago. Some users still reach the old server. Why?

:::answer
Their DNS resolvers cached the old answer, and the record's **TTL** hasn't run out yet. They'll get the new address when it does.
:::

### 3. In the example, what did `http://github.com` answer?

:::answer
**301 Moved Permanently** with `Location: https://github.com/`. The site redirects plain HTTP to HTTPS.
:::
