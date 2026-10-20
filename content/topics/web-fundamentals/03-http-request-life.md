---
title: "Life of an HTTP request: DNS → TCP → TLS → HTTP → response"
stack: web-fundamentals
order: 3
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "DNS turns a name like example.com into an IP address. Then TCP opens a connection to that address on a port (443 for HTTPS)."
  - TLS sets up encryption and checks the server's certificate, so nobody can read or fake the traffic.
  - "An HTTP request is just text: a method, a path, headers and an optional body. The response is a status code, headers and a body."
  - Keep-alive and HTTP/2 reuse one connection for many requests, which saves the DNS, TCP and TLS cost.
  - The DevTools Network "Timing" tab shows each step, so you can see exactly which one is slow.
cards:
  - q: What happens before your server sees an HTTPS request?
    a: DNS finds the IP address, TCP opens a connection with a 3-step handshake, and TLS agrees on encryption and checks the certificate. Only then is the HTTP request sent.
  - q: What is a port?
    a: A number that tells the computer which program should get the traffic. HTTPS uses 443, HTTP uses 80, and a dev server might use 5173 or 3000.
  - q: What does a TLS certificate prove?
    a: That the server really owns the domain name. A trusted company (a certificate authority) signed it, and the browser checks that signature.
  - q: What are the parts of an HTTP request?
    a: A request line (method, path, version), headers (like Host, Content-Type, Cookie), an empty line, and an optional body.
  - q: What is TTFB?
    a: Time To First Byte — how long from sending the request until the first byte of the response arrives. It includes network time and your server's work.
---

## 💡 What is it?

When a browser opens `https://example.com/jobs`, it does **four steps** before your code even runs: find the address (**DNS**), connect (**TCP**), make it secure (**TLS**), then send the request (**HTTP**).

Your server then sends a **response**. Knowing each step tells you **where time goes** and **where things break**.

## 🏠 Real-life example

Think of **sending a sealed letter to a company you've never visited**.

- You look up the company's **address in a phone book** = DNS (name → IP address).
- You pick the **right department window** in that building = the port (443 for HTTPS).
- You **call ahead and agree** "I'm sending a letter now" = TCP's handshake.
- You check the company's **official seal** and agree on a **secret code language** = TLS (certificate + encryption).
- You hand over the letter: **what you want, who you are, the details** = the HTTP method, headers and body.
- They reply with a **result code** ("done", "not found", "not allowed") and the papers = the status code and response body.
- If you'll send more letters, you **keep the line open** = keep-alive.

## 🧑‍💻 Code example

HTTP is just **text** sent over a TCP connection. This script sends a raw HTTP request by hand and prints the exact text that goes back and forth. Save as `raw-http.js` and run `node raw-http.js`.

```js
const http = require('node:http');                       // Node's built-in HTTP server module
const net = require('node:net');                         // Node's built-in TCP module (raw connections)

const server = http.createServer((req, res) => {         // run this for every request that arrives
  res.setHeader('Content-Type', 'application/json');     // tell the client the body is JSON
  res.end(JSON.stringify({ ok: true, path: req.url }));  // send the body and finish the response
});                                                      // end of the request handler

server.listen(4801, () => {                              // start listening on port 4801
  const socket = net.connect(4801, '127.0.0.1');         // open a raw TCP connection to it
  const request =                                        // the exact text an HTTP request is made of
    'GET /jobs?page=2 HTTP/1.1\r\n' +                    // request line: method, path, version
    'Host: localhost:4801\r\n' +                         // header: which site we want
    'Accept: application/json\r\n' +                     // header: what we can read back
    'Connection: close\r\n' +                            // header: close the connection after this
    '\r\n';                                              // an empty line ends the headers
  console.log('--- REQUEST TEXT ---\n' + request);       // print what we send
  socket.write(request);                                 // send the raw text over TCP
  let reply = '';                                        // collect the response here
  socket.on('data', (chunk) => (reply += chunk));        // add each piece as it arrives
  socket.on('end', () => {                               // the server closed the connection
    console.log('--- RESPONSE TEXT ---\n' + reply);      // print the raw response text
    server.close();                                      // stop the server so Node can exit
  });                                                    // end of the 'end' handler
});                                                      // end of listen callback
```

Real output:

```text
--- REQUEST TEXT ---
GET /jobs?page=2 HTTP/1.1
Host: localhost:4801
Accept: application/json
Connection: close


--- RESPONSE TEXT ---
HTTP/1.1 200 OK
Content-Type: application/json
Date: Tue, 20 Oct 2026 17:58:22 GMT
Connection: close
Content-Length: 33

{"ok":true,"path":"/jobs?page=2"}
```

Now watch **every step** for a real HTTPS site with `curl`:

```bash
curl -v https://example.com -o /dev/null   # -v = show every step, -o /dev/null = hide the page itself
curl -s -o /dev/null -w "dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer}\n" https://example.com   # print how long each step took, in seconds
```

Real output (trimmed):

```text
* Host example.com:443 was resolved.
*   Trying 172.66.147.243:443...
* Connected to example.com (172.66.147.243) port 443
* ALPN: curl offers h2,http/1.1
* SSL connection using TLSv1.3 / AEAD-CHACHA20-POLY1305-SHA256
* ALPN: server accepted h2
*  subject: CN=example.com
*  issuer: C=US; O=SSL Corporation; CN=Cloudflare TLS Issuing ECC CA 3
* using HTTP/2
> GET / HTTP/2
> Host: example.com
> Accept: */*
< HTTP/2 200
< content-type: text/html; charset=utf-8
< cf-cache-status: HIT
< alt-svc: h3=":443"; ma=86400

dns:0.002529 tcp:0.066932 tls:0.120960 ttfb:0.162013
```

Read it like a story: the name became an IP (**DNS**), a connection opened on port 443 (**TCP**), TLS 1.3 started and the **certificate** for `example.com` was checked, both sides chose **HTTP/2**, the request went out (`>` lines), and the response came back (`<` lines). The timings are cumulative, from the start: DNS was about 3 ms (already cached), TCP was done at 67 ms, TLS at 121 ms, and the first byte arrived at 162 ms.

## 🔍 Deeper version

**1. DNS (name → IP).** The browser asks, in order: its own cache → the operating system's cache → the configured DNS resolver (your ISP's, or one like 1.1.1.1). If the resolver doesn't know, it asks the **root** servers → the **.com** servers → the domain's own **authoritative** servers (for example AWS Route 53). Answers are cached for their **TTL** (time to live). More detail: [DNS and HTTPS](topic:devops/dns-https).

**2. IP and port.** The **IP address** finds the computer. The [port](glossary:port) finds the program on it: 443 = HTTPS, 80 = HTTP, 5173 = Vite's dev server.

**3. TCP handshake.** TCP gives a reliable, ordered stream of bytes. It starts with 3 messages: **SYN** ("can we talk?"), **SYN-ACK** ("yes"), **ACK** ("great"). That costs **one round trip** before any data moves.

**4. TLS handshake.** The server sends its **certificate**: its domain name, its public key, and a signature from a trusted **certificate authority** (CA). The browser checks the name matches, the date is valid, and the signature chain leads to a CA it trusts. Then both sides agree on a shared encryption key. TLS 1.3 needs **one round trip** for this (older TLS 1.2 needed two).

**5. HTTP request and response.**

| Part | Request example | Response example |
|---|---|---|
| First line | `GET /api/jobs?page=2 HTTP/1.1` | `HTTP/1.1 200 OK` |
| Headers | `Host`, `Authorization`, `Cookie`, `Content-Type`, `Accept` | `Content-Type`, `Set-Cookie`, `Cache-Control`, `Content-Length` |
| Empty line | marks the end of headers | marks the end of headers |
| Body | JSON for POST/PUT, empty for GET | HTML, JSON, an image… |

See [HTTP methods](topic:rest-auth/http-methods) and [status codes](topic:rest-auth/status-codes).

**6. HTTP versions.**

| Version | How it sends requests | Why it matters |
|---|---|---|
| HTTP/1.1 | One request at a time per connection; browsers open about 6 connections per site | Many files = waiting in line |
| HTTP/2 | Many requests at once on **one** connection, compressed headers | Faster for pages with many files |
| HTTP/3 | Like HTTP/2, but over **QUIC** (on UDP), with faster setup and no "one lost packet blocks all" problem | Better on mobile and bad networks |

In the curl output, `ALPN` is how the two sides **agreed** on HTTP/2. The `alt-svc: h3` header says "HTTP/3 is also available".

**7. Keep-alive and reuse.** DNS + TCP + TLS cost several round trips. So browsers **keep the connection open** and reuse it for the next requests. That's why the first request to a site is the slowest.

**8. DevTools → Network → Timing** shows the same steps for any request:

| Timing label | Step |
|---|---|
| Queueing / Stalled | Waiting for a free connection |
| DNS Lookup | DNS |
| Initial connection | TCP |
| SSL | TLS |
| Waiting for server response (TTFB) | Network + **your server's work** |
| Content Download | Receiving the body |

If **TTFB** is large and the other steps are small, your **server** is slow. If DNS, TCP or SSL are large, it's the **network** or the setup.

Where this fits on the whole trip: [the big picture](topic:web-fundamentals/big-picture). A shorter version of the URL story: [what happens when you type a URL](topic:system-design/what-happens-url).

## 🎯 Why do we use it?

Every slow page and every "can't connect" error happens **somewhere** in this chain. Knowing the chain lets you:
- read the Network tab and **point to the slow step**
- understand why a **CDN** helps (it's closer, so every round trip is shorter)
- understand why **HTTPS certificates**, ports and DNS records must be correct before your app works in production

## ⚠️ Common mistakes

- **Blaming the backend for every slow request.** Check the Timing tab. Sometimes DNS, TLS or a far-away server is the slow part.
- **Forgetting the port.** `localhost:5173` and `localhost:3000` are different programs. They're also different **origins** for the browser.
- **Thinking HTTPS only "hides" data.** It also proves you're talking to the real server (the certificate) and stops anyone changing the data on the way.
- **Ignoring the empty line in raw HTTP.** Headers end with an empty line. Without it, the server keeps waiting.

## 🗣️ How to answer in an interview

> "When the browser requests an HTTPS URL, it first resolves the domain with DNS — checking the browser, OS and resolver caches, and if needed walking root, TLD and authoritative servers. Then it opens a TCP connection to the IP on port 443 with the three-way handshake.
>
> Next comes the TLS handshake: the server presents its certificate, the browser checks the domain, the expiry and the CA signature, and they agree on encryption keys. TLS 1.3 does this in one round trip.
>
> Then the actual HTTP request goes out — method, path, headers, and maybe a body — and the server replies with a status code, headers and a body. With HTTP/2 many requests share one connection, and keep-alive reuses it, so only the first request pays the full setup cost. When something is slow, I open the Timing tab in DevTools and check whether it's DNS, connection, TLS, or TTFB, which is the server's own work."

## 🔁 Follow-up questions

### What's the difference between HTTP and HTTPS?

HTTPS is HTTP sent **inside TLS**. It's encrypted, it can't be changed on the way, and the certificate proves the server's identity. Browsers block many features (cookies with `Secure`, service workers) on plain HTTP.

### Why is the first request to a site slower than the next ones?

The first one pays for DNS, TCP and TLS. The next ones **reuse** the open connection (keep-alive, HTTP/2) and cached DNS, so only the HTTP part remains.

### What is a CDN, and why does it make the site faster?

A CDN keeps copies of your files on servers close to users. Shorter distance means faster TCP, TLS and downloads. In the curl output, `cf-cache-status: HIT` shows Cloudflare's CDN served a cached copy. See [CDNs](topic:system-design/cdn).

### What does TTFB include?

Network time for the request, **your server's processing** (database queries, API calls), and the time for the first byte to travel back. A high TTFB with fast DNS/TCP/TLS points to slow server code.

### Is HTTP stateless?

Yes. Each request stands alone; the server doesn't remember earlier ones by itself. Logins work by sending something on **every** request, like a cookie or an `Authorization` header.

## ✅ Quick check

### 1. Put these in order for a first HTTPS visit: TLS handshake, DNS lookup, HTTP request, TCP handshake.

:::answer
**DNS lookup → TCP handshake → TLS handshake → HTTP request.** You need the address before connecting, a connection before encryption, and encryption before sending the request.
:::

### 2. In DevTools, DNS is 2 ms, Initial connection 30 ms, SSL 25 ms, TTFB 1,800 ms. Where is the problem?

:::answer
**On the server.** The network steps are fast, but the server took about 1.8 s to start answering. Check the backend: slow queries, external calls or heavy work.
:::

### 3. What tells the server which website you want, when many sites share one IP?

:::answer
The **`Host` header** (and for HTTPS, the domain name sent during TLS, called SNI). That's why the raw request in the example includes `Host: localhost:4801`.
:::
