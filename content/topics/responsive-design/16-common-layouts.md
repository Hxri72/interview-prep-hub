---
title: Common responsive layouts (navbar, sidebar → drawer, table → cards, dialogs)
stack: responsive-design
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Navbar: hamburger (☰) menu on phones, all links in a row on laptops."
  - "Sidebar: hidden on phones and opened as a drawer; always visible on laptops."
  - "Data table: scroll sideways inside a box, or show each row as a card on phones."
  - "Forms: one field per line on phones; two side by side on laptops. Dialogs: full screen on phones."
  - "Card lists: 1 per row on phones, 3–4 per row on laptops (grid auto-fit or breakpoints)."
cards:
  - q: How should a navbar behave on phones?
    a: Show the logo and a hamburger (☰) button. Tapping it opens the links. On laptops, show all links in a row.
  - q: How do you handle a big data table on a phone?
    a: Either let it scroll sideways inside a wrapper (overflow-x auto), or render each row as a card with label/value pairs.
  - q: What happens to a dashboard sidebar on mobile?
    a: It's hidden and opens as a drawer over the content when you tap the menu button. On laptops it's always visible on the left.
  - q: How should a popup dialog work on phones?
    a: Usually full screen, so the form has room and the keyboard doesn't hide it. On laptops it's a small centred box.
  - q: How should a form be laid out responsively?
    a: One field per line with full-width buttons on phones; two fields side by side where it makes sense on bigger screens.
---

## 💡 What is it?

Most apps are built from the **same few layouts**. Each one has a well-known **phone version** and **laptop version**:

| Layout | On a phone | On a laptop |
|---|---|---|
| Navigation menu | Hamburger (☰) opens a menu | All links in a row |
| Dashboard with sidebar | Sidebar hidden; opens as a drawer | Sidebar always on the left |
| Card list | 1 card per row | 3–4 cards per row |
| Data table | Scroll sideways, or each row as a card | Normal table |
| Form | One field per line, full-width buttons | Two fields side by side |
| Popup (dialog) | Full screen | Small box in the middle |

Learn these six, and you can build almost any screen.

## 🏠 Real-life example

Think of a **school bag vs a school locker**.

- In the **locker** (laptop), everything is laid out side by side. You can see all your books at once.
- In the **bag** (phone), there's no room. Books are **stacked**, and some things go in a **side pocket** you open only when needed.

Mapping:
- **Books side by side in the locker** = links in a row, sidebar always open, table columns.
- **Books stacked in the bag** = one card per row, one field per line.
- **The side pocket** = the hamburger menu and the drawer.
- **Taking out one book to read it fully** = a full-screen dialog on a phone.

## 🧑‍💻 Code example

Save as `index.html` and open in Chrome. Try 375px and 1280px in device mode (F12 → phone icon).

```html
<!DOCTYPE html> <!-- modern HTML page -->
<html lang="en"> <!-- page language: English -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- fit the phone width -->
  <style> /* CSS starts */
    * { box-sizing: border-box; } /* width includes padding and border */
    body { margin: 0; font-family: sans-serif; } /* no default margin, simple font */
    .nav { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #1f2937; color: white; } /* top bar: logo left, menu right */
    .menu-btn { font-size: 24px; background: none; border: 0; color: white; min-width: 44px; min-height: 44px; } /* ☰ button, 44px tap target */
    .links { display: none; } /* PHONE: links hidden until the menu opens */
    .links.open { display: flex; flex-direction: column; position: absolute; top: 56px; left: 0; right: 0; background: #1f2937; padding: 8px 16px; } /* opened menu drops down under the bar */
    .links a { color: white; padding: 8px 0; text-decoration: none; } /* menu links, 8px vertical space */
    .page { display: flex; } /* sidebar + main side by side (sidebar hidden on phones) */
    .sidebar { display: none; width: 200px; background: #f3f4f6; padding: 16px; } /* PHONE: sidebar hidden; 200px wide when shown */
    main { flex: 1; padding: 16px; } /* main area takes the leftover space */
    .row { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 8px; } /* PHONE: each table row is a card */
    .row span { display: block; } /* PHONE: each value on its own line */
    .row span::before { content: attr(data-label) ": "; font-weight: bold; } /* PHONE: show the column name before each value */
    @media (min-width: 768px) { /* 768px AND WIDER */
      .menu-btn { display: none; } /* no hamburger on bigger screens */
      .links { display: flex; gap: 16px; position: static; } /* links in a row, 16px apart, back in the bar */
      .sidebar { display: block; } /* sidebar always visible */
      .row { display: grid; grid-template-columns: 2fr 1fr 1fr; border-radius: 0; margin: 0; border-width: 0 0 1px; } /* rows become table rows: 3 columns */
      .row span::before { content: none; } /* hide the column names; the header row shows them */
    } /* end of the 768px rule */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible page -->
  <nav class="nav"> <!-- the top bar -->
    <strong>Hiring Hub</strong> <!-- logo -->
    <button class="menu-btn" aria-label="Open menu" aria-expanded="false">☰</button> <!-- hamburger, only on phones -->
    <div class="links"><a href="#">Jobs</a><a href="#">Candidates</a><a href="#">Reports</a></div> <!-- the menu links -->
  </nav> <!-- end of top bar -->
  <div class="page"> <!-- sidebar + main -->
    <aside class="sidebar">Filters</aside> <!-- hidden on phones, left column on laptops -->
    <main> <!-- main content -->
      <div class="row"><span data-label="Name">Asha</span><span data-label="Role">React Dev</span><span data-label="Status">Shortlisted</span></div> <!-- one candidate: a card on phones, a table row on laptops -->
      <div class="row"><span data-label="Name">Rahul</span><span data-label="Role">Node Dev</span><span data-label="Status">Applied</span></div> <!-- another candidate -->
    </main> <!-- end of main -->
  </div> <!-- end of page -->
  <script> // a little JavaScript for the hamburger
    const btn = document.querySelector('.menu-btn'); // find the ☰ button
    const links = document.querySelector('.links'); // find the links box
    btn.addEventListener('click', () => { // when the ☰ is tapped
      const open = links.classList.toggle('open'); // show or hide the menu; open = true if now shown
      btn.setAttribute('aria-expanded', String(open)); // tell screen readers if the menu is open
    }); // end of the click handler
  </script> <!-- end of script -->
</body> <!-- end of visible page -->
</html> <!-- end of page -->
```

**What you see:**

```text
375px  → dark bar with logo and ☰; tapping ☰ drops the links down; no sidebar;
         each candidate is a card with "Name: Asha / Role: React Dev / Status: Shortlisted"
1280px → logo with links in a row (no ☰); grey "Filters" sidebar on the left;
         candidates as a 3-column table
```

## 🔍 Deeper version

**Navbar.** On phones, a hamburger button toggles the menu. Make the button a real `<button>` with `aria-label` and `aria-expanded`, and a tap area of at least 44×44px. Close the menu when a link is chosen or Escape is pressed.

**Sidebar → drawer.** On laptops, the sidebar is a column. On phones, it becomes a **drawer** that slides over the content, with a dark overlay behind it. In Mantine, `AppShell` does this with `navbar={{ breakpoint: 'sm', collapsed: { mobile: !opened } }}` and a `<Burger hiddenFrom="sm" />` button. Trap keyboard focus inside the open drawer, and close it on overlay click or Escape.

**Data tables.** Two options:

| Option | How | Good when |
|---|---|---|
| Scroll sideways | wrap in `<div style="overflow-x:auto">` | many columns; people compare across rows |
| Rows as cards | CSS (like above) or render different markup on phones | few key fields; people scan one row at a time |

With scrolling, keep the first column sticky (`position: sticky; left: 0`) so people know which row they're on.

**Card lists.** Use `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` for automatic 1→2→4 columns, or breakpoints (`grid-cols-1 md:grid-cols-3`). See [grid auto-fit](topic:responsive-design/grid-auto-fit).

**Forms.** One column on phones. On laptops, put **related short fields** side by side (first name + last name), but keep long fields full width. Use the right `type` (`email`, `tel`) so phones show the right keyboard.

**Dialogs.** On phones, make dialogs full screen. In Mantine: `<Modal fullScreen={isMobile}>`. Keep the action buttons visible above the keyboard.

**Use CSS first.** Show/hide and reflow with CSS where possible. Swap whole components with JavaScript (`useMediaQuery`) only when the markup must be different.

## 🎯 Why do we use it?

These patterns are what users **already expect**. A hamburger means "menu". A full-screen form on a phone feels natural.

Using known patterns makes apps easier to use and faster to build. Interviewers often ask "how would you make this dashboard work on mobile?", and these six answers cover most screens.

## ⚠️ Common mistakes

- **Squeezing a wide table** onto a phone, so the text becomes tiny or the page scrolls sideways.
- **A hamburger that's a `<div>`** with no button role. Keyboard and screen-reader users can't open it.
- **Hover-only menus.** Phones have no hover.
- **Small dialogs on phones** where the keyboard covers the input and the Save button.

## 🗣️ How to answer in an interview

> "I follow a few standard patterns. The navbar shows all links in a row on laptops and a hamburger button on phones, which is a real button with aria-expanded. The dashboard sidebar is a permanent column on desktop and a drawer on mobile, which in Mantine's AppShell is one `collapsed: { mobile }` setting. Card lists go from one per row to three or four, using grid auto-fit or breakpoints. For big data tables I either let them scroll sideways with a sticky first column, or show each row as a card with label and value pairs. Forms are one column on phones, and dialogs go full screen. I do as much as possible in CSS, and swap components with useMediaQuery only when the markup really needs to change."

[FILL IN: a real recruiter or candidate screen you made responsive, e.g. a candidate table that becomes cards on phones.]

## 🔁 Follow-up questions

### Scroll a table sideways, or turn rows into cards?

Scroll when users compare many columns across rows. Cards when each row is read on its own and only a few fields matter on a phone.

### How do you make a drawer accessible?

Open it with a real button. Move focus into the drawer when it opens, trap focus inside, close on Escape and overlay click, and return focus to the button after closing. Mantine's `Drawer` and `Modal` do most of this (`trapFocus` is on by default).

### Why use full-screen dialogs on phones?

There's room for the form, nothing behind it can be tapped by mistake, and the on-screen keyboard doesn't hide the fields.

### When should you render different components instead of using CSS?

When the HTML structure must change, like a `<table>` vs a list of cards, or a permanent sidebar vs a modal drawer.

## ✅ Quick check

### 1. Which CSS lets a wide table scroll inside its own box instead of the whole page?

:::answer
Wrap it: `.table-wrap { overflow-x: auto; }`. Only the wrapper scrolls sideways.
:::

### 2. True or false: a dropdown menu that opens only on `:hover` works well on phones.

:::answer
**False.** Phones have no hover. Open menus on click or tap.
:::

### 3. What minimum tap size should a hamburger button have?

:::answer
About **44 × 44 px**, so a thumb can hit it easily.
:::
