---
title: Meta tags and SEO basics
stack: html-css
order: 6
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - "Meta tags in the head give information about the page to browsers, search engines and social apps."
  - "Must-have tags: charset, viewport, title and a description."
  - "Open Graph tags (og:title, og:image) control the preview card when a link is shared."
  - "SEO = helping search engines find, understand and rank the page: good titles, semantic HTML, fast pages."
  - "A client-side React app starts with almost empty HTML. Server rendering (like Next.js) helps SEO."
cards:
  - q: What does the viewport meta tag do?
    a: It makes the page as wide as the phone screen and stops the phone from showing a zoomed-out desktop page.
  - q: What is the meta description used for?
    a: Search engines often show it as the short text under the title in search results.
  - q: What are Open Graph tags?
    a: Tags like og:title and og:image that decide how the link preview looks on WhatsApp, LinkedIn and others.
  - q: Why is a plain React SPA weaker for SEO?
    a: Its first HTML is nearly empty and content is built by JavaScript. Server rendering sends ready HTML.
  - q: What is SEO?
    a: Search Engine Optimisation — making a page easy for search engines to find, understand and rank.
---

## 💡 What is it?

**Meta tags** are small tags in the `<head>`. Users don't see them on the page. They give **information about the page** to browsers, search engines and apps like WhatsApp.

**[SEO](glossary:seo)** (Search Engine Optimisation) means making your page easy for Google to **find, understand and rank**.

## 🏠 Real-life example

Think of a **school library book**.

- The **book's cover title** = the `<title>` tag.
- The **short summary on the back cover** = the meta description.
- The **"language: English" label** = `<html lang="en">` and `charset`.
- The **picture on the cover** = the Open Graph image shown when you share a link.
- The **librarian's catalogue** = Google's search index.

A book with a clear title and summary is easier for the librarian to file and for students to find.

## 🧑‍💻 Code example

Save as `index.html`. Open it, then right-click → **View Page Source** to see the head.

```html
<!DOCTYPE html>                                                         <!-- modern HTML5 page -->
<html lang="en">                                                        <!-- page language, used by Google and screen readers -->
<head>                                                                  <!-- all meta info lives here -->
  <meta charset="UTF-8">                                                <!-- text encoding; put it first -->
  <meta name="viewport" content="width=device-width, initial-scale=1">  <!-- width = phone width; 1 = no zoom at start -->
  <title>Node.js Developer Jobs in Kochi | JobBoard</title>             <!-- tab title and main search result title -->
  <meta name="description" content="Find Node.js and React jobs in Kochi. Updated daily."> <!-- the summary text in search results -->
  <link rel="canonical" href="https://jobboard.example/jobs/nodejs-kochi"> <!-- the one "official" URL for this page -->
  <meta property="og:title" content="Node.js Developer Jobs in Kochi">  <!-- title on the share preview card -->
  <meta property="og:description" content="Fresh Node.js jobs, updated daily."> <!-- text on the share card -->
  <meta property="og:image" content="https://jobboard.example/og/nodejs.png"> <!-- picture on the share card -->
  <meta name="robots" content="index, follow">                          <!-- allow search engines to index and follow links -->
</head>                                                                 <!-- end of head -->
<body>                                                                  <!-- visible content -->
  <h1>Node.js Developer Jobs in Kochi</h1>                              <!-- one clear main heading that matches the topic -->
</body>                                                                 <!-- end of body -->
</html>                                                                 <!-- end of page -->
```

```text
On screen: only the heading. The tab shows "Node.js Developer Jobs in Kochi | JobBoard".
In View Page Source you see all the meta tags.
If this page were online and shared on WhatsApp, the preview card would show
the og:title, og:description and og:image.
```

## 🔍 Deeper version

**Key head tags:**

| Tag | Why |
|---|---|
| `<meta charset="UTF-8">` | Correct text for all languages |
| `<meta name="viewport">` | Mobile layout (see [viewport meta](topic:responsive-design/viewport-meta)) |
| `<title>` | Tab text and search result title (aim for ~50–60 characters) |
| `<meta name="description">` | Often shown under the title in results |
| `<link rel="canonical">` | Tells search engines the main URL when copies exist |
| `og:*` / `twitter:*` | Link preview cards |
| `<meta name="robots">` | `noindex` hides a page from search (e.g. admin pages) |

**What Google cares about (simply):**
1. **Can it crawl the page?** Real links (`<a href>`), a sitemap, no `noindex` by mistake.
2. **Can it understand it?** Semantic HTML, one clear `h1`, good title, alt text. See [semantic HTML](topic:html-css/semantic-html).
3. **Is it a good page?** Fast loading, works on phones, good [Core Web Vitals](topic:html-css/core-web-vitals), useful content.

**Structured data.** JSON-LD scripts (like `JobPosting` from schema.org) help Google show rich results, such as job listings.

**SPAs and SEO.** A client-rendered React app sends almost empty HTML and builds the page with JavaScript. Google can run JavaScript, but it's slower and less reliable, and social apps usually can't. Fixes: server-side rendering or static generation (Next.js), or pre-rendering important pages. Admin dashboards behind a login don't need SEO at all.

**Setting tags in React.** React 19 lets you render `<title>` and `<meta>` inside components, and React moves them into the head.

## 🎯 Why do we use it?

- **Mobile layout works** (viewport).
- **People find the page** on Google, and click it because the title and description are clear.
- **Shared links look good**, with a title and image.
- **Text shows correctly** in every language (charset).

## ⚠️ Common mistakes

- **Missing the viewport tag**, so phones show a tiny zoomed-out page.
- **The same title on every page.** Each page needs its own.
- **Leaving `noindex`** from a test server on the live site.
- **Expecting a client-only SPA** to rank well for public content.

## 🗣️ How to answer in an interview

> "Meta tags in the head give information about the page. The must-haves are charset UTF-8, the viewport tag so phones show the page at the right width, a unique title and a meta description, which search engines often show in results. Open Graph tags control the preview card when someone shares the link.
>
> For SEO I focus on crawlable links, semantic HTML with one clear h1, good titles, fast pages and mobile support. One trade-off I'd mention is that a client-side React app starts with almost empty HTML, so for public pages that need SEO, server rendering or static generation with something like Next.js is better. For logged-in dashboards, SEO doesn't matter."

## 🔁 Follow-up questions

### What is a canonical URL?

The main URL of a page when the same content is reachable from several URLs (like with `?sort=` or tracking parameters). It tells search engines which one to rank.

### How do you hide a page from Google?

Add `<meta name="robots" content="noindex">`, or send the `X-Robots-Tag: noindex` header. `robots.txt` blocks crawling, but it doesn't reliably remove a page that's already indexed.

### Do meta keywords help SEO?

No. Google has ignored the meta keywords tag for many years.

## ✅ Quick check

### 1. Which tag fixes a page that looks tiny and zoomed out on phones?

:::answer
**The viewport meta tag:** `<meta name="viewport" content="width=device-width, initial-scale=1">`.
:::

### 2. Which tags decide how a link looks when shared on LinkedIn or WhatsApp?

:::answer
**Open Graph tags**, like `og:title`, `og:description` and `og:image`.
:::

### 3. True or false: a recruiter admin dashboard behind a login needs strong SEO.

:::answer
**False.** Search engines can't see pages behind a login, and you don't want them to. SEO matters for public pages, like job listings.
:::
