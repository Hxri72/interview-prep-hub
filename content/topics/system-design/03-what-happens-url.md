---
title: What happens when you type a URL (DNS, client-server)
stack: system-design
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "DNS turns the name (example.com) into an IP address, the server's \"phone number\"."
  - The browser opens a TCP connection to that IP, then a TLS handshake makes it secure (HTTPS).
  - The browser sends an HTTP request (GET /). The server, often behind a CDN or load balancer, sends back a response.
  - The browser reads the HTML, downloads CSS, JS and images, builds the page and paints it on screen.
  - Caches at every step (browser, DNS, CDN) make repeat visits much faster.
cards:
  - q: What does DNS do?
    a: It translates a domain name like example.com into an IP address that computers use to find the server.
  - q: What is the TLS handshake?
    a: The browser and server agree on encryption keys and the browser checks the server's certificate, so the connection is secure (the S in HTTPS).
  - q: In order, what are the main steps after pressing Enter?
    a: DNS lookup → TCP connection → TLS handshake → HTTP request → server response → browser parses HTML, loads CSS/JS → renders the page.
  - q: Where can caching happen in this flow?
    a: Browser cache, OS and DNS resolver caches, CDN edge caches, and server-side caches.
  - q: What is the difference between the client and the server?
    a: The client (browser or app) asks for things. The server listens and answers the requests.
---

## 💡 What is it?

This is a classic interview warm-up question. It checks that you understand how the web works **from start to finish**.

In short: the browser finds the server's address with **DNS**, connects to it securely, asks for the page with **HTTP**, and then draws the page.

The browser is the **client** (it asks). The machine that answers is the **server**.

## 🏠 Real-life example

Think of **visiting a friend's new house for the first time**.

- You only know the friend's **name**. You call a common friend to get the **street address** = **DNS** (name → IP address).
- You **travel** to that address = the **TCP connection**.
- At the gate, the guard **checks your ID and gives you a secret knock** = the **TLS handshake** (secure HTTPS).
- You **ask** for the photo album = the **HTTP request** (`GET /`).
- Your friend **hands it over** = the **HTTP response**.
- You **open the album and look** at the pictures = the browser **rendering** the page.
- Next time you **remember the address** = **caching**.

## 🧑‍💻 Code example

This script does the first steps by hand, like a browser. Save as `url.js` and run `node url.js` (needs internet).

```js
const dns = require('node:dns').promises;                    // Node's built-in DNS tool (name → IP address)

async function main() {                                      // async so we can use await inside
  const host = 'example.com';                                // the domain name the user typed
  const t0 = performance.now();                              // start a timer (milliseconds)
  const { address } = await dns.lookup(host);                // step 1: DNS turns the name into an IP address
  const t1 = performance.now();                              // time after DNS finished
  console.log(`1. DNS: ${host} → ${address} (${Math.round(t1 - t0)} ms)`); // print the IP and how long DNS took

  const res = await fetch(`https://${host}/`);               // steps 2–4: connect (TCP + TLS), send GET, get the reply
  const t2 = performance.now();                              // time after the response arrived
  console.log(`2. HTTP status: ${res.status} (${Math.round(t2 - t1)} ms)`); // 200 means OK
  console.log(`3. Content-Type: ${res.headers.get('content-type')}`);      // tells the browser it's HTML
  const html = await res.text();                             // read the body as text
  console.log(`4. HTML starts with: ${html.slice(0, 15)}`);  // the browser would now parse this and draw the page
}                                                            // end of main

main();                                                      // run it
```

**Output** (your IP address and times will differ):

```text
1. DNS: example.com → 104.20.23.154 (18 ms)
2. HTTP status: 200 (153 ms)
3. Content-Type: text/html; charset=utf-8
4. HTML starts with: <!doctype html>
```

## 🔍 Deeper version

**The full journey, step by step:**

```text
You type example.com ─► 1. DNS lookup ─► IP address
                        2. TCP connect (3-way handshake) to IP:443
                        3. TLS handshake (certificate check, keys)
                        4. HTTP request: GET / with headers and cookies
                        5. CDN / load balancer ─► app server ─► database
                        6. HTTP response: status, headers, HTML
                        7. Browser parses HTML, fetches CSS/JS/images
                        8. Builds the page and paints it
```

**1. DNS.** The browser checks its own cache, then the operating system, then a **DNS resolver** (often your internet provider's). The resolver asks the root servers, then the `.com` servers, then the domain's own name server. The answer is cached for its **TTL** (time to live). More in [DNS and HTTPS](topic:devops/dns-https).

**2. TCP.** A reliable connection is opened with a 3-way handshake (SYN, SYN-ACK, ACK). Port **443** is for HTTPS; **80** is for plain HTTP.

**3. TLS.** The server shows its **certificate**. The browser checks it was issued by a trusted authority for this domain. Then both sides agree on encryption keys. Modern TLS 1.3 needs just one round trip.

**4–6. HTTP.** The browser sends `GET /` with headers like `Host`, `Accept` and cookies. Often a [CDN](topic:system-design/cdn) answers straight away from a nearby copy. If not, the request reaches a [load balancer](topic:system-design/load-balancers-stateless), then an app server, which may read a [cache](topic:system-design/caching) or the [database](glossary:database). The reply has a [status code](glossary:status-code), headers (like `Cache-Control`) and a body.

**7–8. Rendering.** The browser builds the DOM from HTML and the CSSOM from CSS, runs JavaScript, works out the layout and paints pixels. See [how a web page loads](topic:html-css/how-page-loads).

:::version[Version note]
**HTTP/2** sends many requests over one connection at the same time. **HTTP/3** runs on QUIC (over UDP) instead of TCP, which makes connection setup faster and helps on bad networks. Most big sites support both today. The overall steps above stay the same.
:::

## 🎯 Why do we use it?

Knowing this flow helps you **find where time is lost**:
- Slow DNS → use a fast DNS provider and longer TTLs.
- Far-away server → use a CDN.
- Big JavaScript bundle → [code splitting](topic:react/code-splitting).
- Slow API → caching, indexes, or [fixing the slow endpoint](topic:debugging/slow-endpoint).

It also explains bugs like wrong DNS records, expired certificates and CORS errors.

## ⚠️ Common mistakes

- **Skipping DNS or TLS.** Interviewers expect both steps.
- **Saying "the server sends the website".** The server sends HTML first. The browser then makes many more requests for CSS, JS and images.
- **Forgetting caches.** Repeat visits skip many steps because of caching.
- **Mixing up TCP and HTTP.** TCP is the connection. HTTP is the language spoken over it.

## 🗣️ How to answer in an interview

> "First, the browser needs the server's IP address, so it does a DNS lookup. It checks its own cache, then the OS, then a DNS resolver, which may ask the root and .com servers. Then the browser opens a TCP connection to that IP on port 443 and does a TLS handshake, where it checks the server's certificate and agrees on encryption keys. Next it sends an HTTP GET request with headers and cookies. Often a CDN or a load balancer receives it first, then an app server builds the response, maybe using a cache or a database. The browser gets the HTML, parses it, downloads the CSS, JavaScript and images, builds the DOM and paints the page. Caching at the browser, DNS and CDN levels makes the next visit much faster."

## 🔁 Follow-up questions

### What is a DNS TTL?

How long a DNS answer may be cached, in seconds. A long TTL makes lookups faster. A short TTL lets you switch servers quickly.

### What happens if the certificate is expired?

The TLS check fails and the browser shows a security warning. Most users stop there, so expired certificates take sites "down".

### Why is the first visit slower than the second?

The first visit does DNS, TCP and TLS from scratch and downloads every file. The second visit reuses cached DNS answers, connections and files.

### Where does a CDN fit in?

The DNS answer can point to the nearest CDN edge server. The edge returns cached files instantly and only asks your origin server when it doesn't have a copy.

## ✅ Quick check

### 1. Put these in order: TLS handshake, DNS lookup, HTTP request, TCP connection.

:::answer
**DNS lookup → TCP connection → TLS handshake → HTTP request.**
:::

### 2. Which port does HTTPS use by default?

- A) 80
- B) 443
- C) 3000

:::answer
**B) 443.** Port 80 is plain HTTP.
:::

### 3. True or false: the server sends the whole page, including all images, in one response.

:::answer
**False.** The server first sends HTML. The browser then requests each CSS, JS and image file separately (many in parallel).
:::
