---
title: "next/image, next/font and metadata (SEO)"
stack: nextjs
order: 19
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "<Image> from next/image resizes, compresses and lazy-loads images for you. It needs width and height (or fill) so the page doesn't jump."
  - "next/font downloads fonts at build time and serves them from your own site. No extra request to Google, no layout jump."
  - "export const metadata = { title, description } in a page or layout sets the <title> and meta tags for SEO."
  - "A title template like '%s | Job Board' adds the site name to every page title."
  - "In Next.js 16, the Image prop priority became preload, and images.domains became images.remotePatterns."
cards:
  - q: Why use next/image instead of a plain <img>?
    a: It makes smaller image files in modern formats, picks the right size for each screen, lazy-loads images below the fold, and reserves space so the layout doesn't jump.
  - q: Why does <Image> need width and height?
    a: So the browser reserves the right space before the image loads. Without it, the page jumps (layout shift).
  - q: How do you set the page title in the App Router?
    a: "Export a metadata object from page.tsx or layout.tsx, e.g. export const metadata = { title: 'Jobs' }. For data-based titles, export generateMetadata."
  - q: What does next/font do?
    a: It downloads the font at build time and serves it from your own domain, so there's no request to Google from the browser and no font jump.
  - q: How do you allow images from another website?
    a: List the host in images.remotePatterns in next.config.ts. (The older images.domains is deprecated.)
---

## 💡 What is it?

Next.js has three built-in helpers that make pages **fast and easy for Google to read**:

- **`next/image`**: an `<Image>` component that makes images smaller and loads them smartly.
- **`next/font`**: loads fonts in the fastest way, from your own site.
- **Metadata**: an object that sets the page `<title>` and description. Search engines and link previews read these.

SEO means **Search Engine Optimisation**: making pages easy for Google to find and show.

## 🏠 Real-life example

Think of **preparing a school notice board**.

- **Shrinking photos to fit the board** = `next/image`. You don't pin a huge poster in a tiny space. You print it at the right size.
- **Marking a box for each photo before it arrives** = `width` and `height`. Other notices don't move when the photo is pinned up.
- **Pinning far-away photos only when someone walks there** = lazy loading.
- **Buying the special letter stickers once and keeping them in the school** = `next/font`. You don't run to the shop every time you need a letter.
- **The title strip on top of the board** = metadata (`<title>` and description).

## 🧑‍💻 Code example

In a Next.js App Router project (`npx create-next-app@latest`), put any image at `public/logo.png`. Add these files. Run `npm run build` and then `npm start`.

**`app/layout.tsx`**

```tsx
import type { Metadata } from 'next';                          // the type for the metadata object
import { Inter } from 'next/font/google';                      // a Google font, downloaded at BUILD time

const inter = Inter({ subsets: ['latin'] });                   // load only Latin letters → smaller file

export const metadata: Metadata = {                            // SEO info for every page under this layout
  title: { default: 'Mini Job Board', template: '%s | Mini Job Board' }, // %s = each page's own title
  description: 'Practice project',                             // the <meta name="description"> text
};                                                             // end of metadata

export default function RootLayout({ children }: { children: React.ReactNode }) { // the root layout
  return (                                                     // the page frame
    <html lang="en">                                           {/* lang helps screen readers and Google */}
      <body className={inter.className}>{children}</body>      {/* the font is applied to the whole body */}
    </html>                                                    // end of html
  );                                                           // end of return
}                                                              // end of RootLayout
```

**`app/page.tsx`**

```tsx
import Image from 'next/image';                                // the smart image component

export default function Home() {                               // the page at "/"
  return (                                                     // what it shows
    <Image src="/logo.png" alt="Logo" width={120} height={40} preload /> // 120×40 px; preload = load it early
  );                                                           // end of return
}                                                              // end of Home
```

**`app/login/page.tsx`**

```tsx
export const metadata = { title: 'Login' };                    // fills %s in the template → "Login | Mini Job Board"
export default function Login() {                              // the page at "/login"
  return <h1>Please log in</h1>;                               // a simple heading
}                                                              // end of Login
```

Real output from a Next.js 16 test app (HTML, shortened):

```text
/        → <title>Mini Job Board</title>
           <meta name="description" content="Practice project">
           <img alt="Logo" width="120" height="40"
                srcSet="/_next/image?url=%2Flogo.png&w=128&q=75 1x,
                        /_next/image?url=%2Flogo.png&w=256&q=75 2x" ...>
/login   → <title>Login | Mini Job Board</title>
```

Notice: the image URL goes through `/_next/image`. Next.js resizes it. It also made a 2× version for sharp screens.

## 🔍 Deeper version

**`next/image` in detail:**
- **Sizes:** it builds a `srcSet`, so each screen downloads only the size it needs.
- **Formats:** it can serve modern formats like WebP or AVIF (set in `images.formats`).
- **Lazy loading:** images load only when they come near the screen.
- **No layout shift:** `width`/`height` (or `fill` with a sized parent) reserve the space. This improves the CLS score (Cumulative Layout Shift), one of Google's Core Web Vitals.
- **`preload`:** use it for the main image at the top of the page (the "LCP" image), so it loads first.
- **Remote images:** you must allow the host in `next.config.ts` with `images.remotePatterns`. This stops people using your server to resize any image on the internet.

```ts
// next.config.ts                                                // the Next.js settings file
import type { NextConfig } from 'next';                          // the type for the config
const nextConfig: NextConfig = {                                 // our settings
  images: { remotePatterns: [new URL('https://cdn.example.com/**')] }, // allow images from this host only
};                                                               // end of settings
export default nextConfig;                                       // Next.js reads this export
```

**`next/font`:** The font files are downloaded **at build time** and served from your own domain. So the browser makes no request to Google. That's faster, and better for privacy. It also sets a fallback font with matching size, so text doesn't jump when the real font arrives. Use `next/font/local` for your own font files.

**Metadata:**
- **Static:** `export const metadata = { ... }` in `layout.tsx` or `page.tsx`.
- **Dynamic:** `export async function generateMetadata({ params })`. Use it when the title depends on data, like "Senior React Developer | Jobs".
- Child pages **merge** with parent layouts. That's how the `template` works.
- Metadata works **only in Server Components**.
- Special files: `app/robots.ts`, `app/sitemap.ts`, `opengraph-image.png` (the picture shown when a link is shared).

:::version[Version note]
In **Next.js 16**, the `<Image priority>` prop is **deprecated**. Use **`preload`** instead (checked in the Next.js 16.4 type definitions). The old `images.domains` setting is also deprecated. Use `images.remotePatterns`. In the old Pages Router, titles were set with `<Head>` from `next/head`. In the App Router, use the `metadata` export.
:::

## 🎯 Why do we use it?

- **Faster pages.** Images are often the biggest part of a page. Smaller images mean faster loading, especially on phones.
- **Better Google ranking.** Google rewards fast pages with stable layouts. A good title and description also help people click your result.
- **Less work.** You don't need to resize images by hand or write `<head>` tags on every page.

## ⚠️ Common mistakes

- **Forgetting `width`/`height`** (or `fill` without a sized, `position: relative` parent). Next.js shows an error, or the layout jumps.
- **Using a remote image without `remotePatterns`.** Next.js refuses to load it.
- **Exporting `metadata` from a Client Component** (`'use client'`). It doesn't work. Keep metadata in server files.
- **Adding `preload` to many images.** Only the main image at the top needs it. Too many hurts speed.

## 🗣️ How to answer in an interview

> "Next.js has built-in tools for performance and SEO. The Image component from next/image resizes and compresses images, serves the right size for each screen, lazy-loads images below the fold, and reserves space using width and height so the layout doesn't jump. For the main image at the top, I'd add the preload prop. In Next.js 16, that replaced priority.
>
> next/font downloads fonts at build time and serves them from the same domain, so there's no extra request to Google and no font jump.
>
> For SEO, I export a metadata object from a layout or page, with a title template so every page gets the site name. When the title depends on data, I use generateMetadata.
>
> I haven't used Next.js in production yet. But I care about the same things in React apps, like image sizes and lazy loading."

[FILL IN: once you've built the practice project, mention your metadata and image setup.]

## 🔁 Follow-up questions

### What are Core Web Vitals?

Google's three page-experience scores. **LCP**: how fast the main content appears. **INP**: how fast the page reacts to clicks. **CLS**: how much the layout jumps. `next/image` helps LCP and CLS.

### When would you use `fill` instead of width and height?

When the image should cover its box and the box size comes from CSS, like a banner or a card cover. The parent needs a size and `position: relative`. Add `sizes` so the browser picks the right file.

### How do you set a title from database data?

Export `generateMetadata`. It's an async function that gets the `params`, loads the data, and returns `{ title, description }`.

### Why is next/font better than a Google Fonts `<link>` tag?

The font is downloaded at build time and served from your own domain. The browser makes no request to a third-party server, and size-adjusted fallbacks stop the text from jumping.

## ✅ Quick check

### 1. The layout has `template: '%s | Mini Job Board'`. The jobs page exports `metadata = { title: 'Jobs' }`. What is the page title?

:::answer
**`Jobs | Mini Job Board`**. The page's title replaces `%s`.
:::

### 2. You add `<Image src="https://cdn.example.com/a.png" width={200} height={100} alt="" />` and it fails. Why?

:::answer
The remote host isn't allowed. Add it to `images.remotePatterns` in `next.config.ts`.
:::

### 3. In Next.js 16, which prop makes the main hero image load first?

- A) `priority`
- B) `preload`
- C) `loading="lazy"`

:::answer
**B) `preload`.** `priority` still works but is deprecated in Next.js 16. `loading="lazy"` does the opposite: it delays loading.
:::
