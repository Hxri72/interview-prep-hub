---
title: "Useful @mantine/hooks (useDisclosure, useDebouncedValue, useMediaQuery…)"
stack: mantine-tailwind
order: 19
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "@mantine/hooks is a package of ready-made React hooks. You can use it even without Mantine's components."
  - "useDisclosure(false) gives [opened, { open, close, toggle }] — perfect for modals, drawers and menus."
  - "useDebouncedValue(value, 300) gives a copy of value that only updates after 300ms of no changes — great for search boxes."
  - "useMediaQuery('(min-width: 62em)') returns true or false, so you can switch layouts in JavaScript."
  - "Others: useToggle, useCounter, useLocalStorage, useClickOutside, useClipboard, useHotkeys, useViewportSize."
cards:
  - q: What does useDisclosure return?
    a: "A pair: [opened, handlers]. handlers has open(), close(), toggle() and set(value). Used for modals and drawers."
  - q: How does useDebouncedValue help a search box?
    a: It returns a second copy of the typed text that only updates after the user stops typing for the wait time (like 300ms). You call the API with that copy, so you don't send one request per keystroke.
  - q: useDebouncedValue vs useDebouncedCallback?
    a: useDebouncedValue delays a value (good for effects that react to it). useDebouncedCallback delays a function call (good for event handlers).
  - q: What does useMediaQuery return?
    a: "A boolean: true when the CSS media query matches, like useMediaQuery('(min-width: 62em)') on screens 992px and wider."
  - q: Why use these hooks instead of writing your own?
    a: They are small, tested, and handle cleanup (timers, listeners) for you, so you avoid memory leaks and edge-case bugs.
---

## 💡 What is it?

`@mantine/hooks` is a package of **ready-made React [hooks](glossary:hook)**. Each hook solves one common job, like opening a modal or waiting until the user stops typing.

It works on its own. You don't even need Mantine's components to use it.

## 🏠 Real-life example

Think of a **school toolbox** that every class shares.

Instead of each student making their own ruler, scissors and glue, the toolbox already has good ones. You just pick the tool you need.

- **The toolbox** = `@mantine/hooks`.
- **A light switch for the classroom fan** = `useDisclosure` (on / off).
- **A teacher who waits until the class goes quiet before speaking** = `useDebouncedValue`.
- **A window that tells you if it's big or small** = `useMediaQuery`.
- **Tidying the tools back after use** = the hooks clean up their timers and listeners for you.

## 🧑‍💻 Code example

Setup: a Vite React app with `npm install @mantine/core @mantine/hooks`. Paste into `src/App.jsx`.

```jsx
import '@mantine/core/styles.css';                                   // Mantine's CSS (needed once)
import { useState, useEffect } from 'react';                         // React state and effect hooks
import { MantineProvider, Button, Drawer, TextInput, Text } from '@mantine/core'; // a few Mantine components
import { useDisclosure, useDebouncedValue, useMediaQuery } from '@mantine/hooks'; // three ready-made hooks

function CandidateSearch() {                                         // a search box with a filter drawer
  const [opened, { open, close }] = useDisclosure(false);            // opened = is the drawer showing? starts false
  const [query, setQuery] = useState('');                            // what the user types, updated on every key
  const [debounced] = useDebouncedValue(query, 300);                 // a copy that updates only after 300ms of no typing
  const isDesktop = useMediaQuery('(min-width: 62em)');              // true on screens 62em (992px) and wider

  useEffect(() => {                                                  // runs when the debounced text changes
    if (debounced) console.log('Search API called for:', debounced); // in a real app: fetch(`/api/candidates?q=${debounced}`)
  }, [debounced]);                                                   // [debounced] = only re-run when the debounced value changes

  return (                                                           // what this component shows
    <div style={{ padding: 24 }}>                                    {/* 24px padding around everything */}
      <TextInput label="Search candidates" value={query} onChange={(e) => setQuery(e.currentTarget.value)} /> {/* controlled input */}
      <Button mt="md" onClick={open}>Filters</Button>                {/* mt="md" = margin-top 16px; click opens the drawer */}
      <Text size="sm" mt="xs">Layout: {isDesktop ? 'desktop' : 'mobile'}</Text> {/* shows which layout matched */}
      <Drawer opened={opened} onClose={close} title="Filters" position={isDesktop ? 'right' : 'bottom'}> {/* right side on desktop, bottom sheet on phones */}
        Filter options go here.                                      {/* drawer content */}
      </Drawer>                                                      {/* end of the drawer */}
    </div>                                                           // end of the wrapper
  );                                                                 // end of what CandidateSearch returns
}                                                                    // end of CandidateSearch

export default function App() {                                      // the main component
  return <MantineProvider><CandidateSearch /></MantineProvider>;     // wrap everything in the Mantine provider
}                                                                    // end of App
```

**What happens.** I ran these hooks in Node (jsdom) to get real values:

```text
useDisclosure start: false   → after open(): true   → after toggle(): false
Typed "r","re","rea","reac","react" quickly (50ms apart):
  debounced value right after typing: "r"      (not updated yet)
  after a 300ms pause:                "react"  → only now is the API called, once
useToggle(['light','dark']) after one toggle: dark
useCounter(0, { min: 0, max: 3 }) after 4 increments: 3  (it stops at max)
On a laptop the text says "Layout: desktop" and the drawer opens from the right.
```

## 🔍 Deeper version

**The hooks you'll use most:**

| Hook | Returns | Typical use |
|---|---|---|
| `useDisclosure(false)` | `[opened, { open, close, toggle, set }]` | modals, drawers, menus |
| `useDebouncedValue(v, ms)` | `[debounced, cancel, { cancel, flush }]` | search boxes, filters |
| `useDebouncedCallback(fn, ms)` | a delayed version of `fn` | autosave on change |
| `useMediaQuery(query)` | `boolean` | swap a table for cards on phones |
| `useToggle(['a','b'])` | `[value, toggle]` | cycle through options |
| `useCounter(0, { min, max })` | `[count, { increment, decrement, set, reset }]` | quantity pickers, steps |
| `useLocalStorage({ key, defaultValue })` | `[value, setValue]` | remember a setting |
| `useClickOutside(handler)` | a `ref` | close a dropdown when clicking elsewhere |
| `useClipboard({ timeout })` | `{ copy, copied }` | "Copy link" buttons |
| `useHotkeys([['mod+K', fn]])` | — | keyboard shortcuts |

**Debounce, in one picture.** Every key press restarts a timer. Only when the timer finishes (no typing for 300ms) does the debounced value change. The [debounce idea](topic:javascript/debounce-throttle) is the same as writing it by hand, but the hook clears the timer when the component unmounts.

:::version[Version note]
In **Mantine 7 and 8**, `useDebouncedValue` returns `[value, cancel]`. **Mantine 9** adds a third item, `{ cancel, flush }`. Code that reads only `[value]` works on all versions. SkillKeepr is on Mantine 7.
:::

**`useMediaQuery` and the first render.** The browser's answer isn't known on the server, or before the first effect. If you render on the server, pass an initial value, `useMediaQuery(query, false)`, to avoid a layout flash.

**Why not write them yourself?** You can. But each one hides small traps: clearing timers, removing event listeners, handling server rendering, and keeping a stable function reference. The hooks already handle these, which avoids [memory leaks](glossary:memory-leak).

## 🎯 Why do we use it?

- **Less boilerplate.** `useDisclosure` replaces a `useState` plus three small functions.
- **Fewer API calls.** `useDebouncedValue` stops one request per keystroke.
- **Responsive logic in JS.** `useMediaQuery` lets you render a different component, not just restyle one.
- **Safe cleanup.** Timers and listeners are removed when the component goes away.

## ⚠️ Common mistakes

- **Calling the API with `query` instead of `debounced`.** Then the debounce does nothing.
- **Too long a debounce.** 1000ms feels laggy. 250–500ms is usual for search.
- **Using `useMediaQuery` for simple styling.** If only the style changes, use CSS or Mantine's responsive props instead. Use the hook when you need different components.
- **Destructuring `useDisclosure` wrongly**, like `const { opened } = useDisclosure()`. It returns an **array**: `const [opened, handlers] = …`.

## 🗣️ How to answer in an interview

> "@mantine/hooks is a set of small, tested React hooks. The ones I reach for most are useDisclosure for modals and drawers — it gives me the open state plus open, close and toggle — and useDebouncedValue for search inputs. The input stays controlled and updates on every key, but I call the API with the debounced copy, which only changes after the user pauses for about 300 milliseconds. So I send one request instead of one per keystroke.
>
> useMediaQuery is useful when a phone needs a different component, like cards instead of a table. The hooks also clean up their timers and listeners, so there are no leaks. At SkillKeepr the frontend uses Mantine's hooks, for example debouncing search boxes."

[FILL IN: a hook you personally used in SkillKeepr code, if any.]

## 🔁 Follow-up questions

### Debounce vs throttle — which hook for what?

Debounce waits until activity **stops** (search box). Throttle runs at most once per interval **while** activity continues (scroll or resize handlers). Mantine also has `useThrottledValue` and `useThrottledCallback`.

### How would you cancel a pending debounced search?

Call the `cancel` function that `useDebouncedValue` returns, for example when the user clears the input.

### Can you use @mantine/hooks without Mantine components?

Yes. It is a separate package with no dependency on `@mantine/core`. Only React is needed.

### How does useClickOutside know where you clicked?

It returns a `ref`. You put the ref on your element. The hook listens to clicks on the document and calls your handler when the click target is not inside that element.

## ✅ Quick check

### 1. What does this give you?

```jsx
const [opened, { open, close, toggle }] = useDisclosure(false); // starts closed
```

:::answer
`opened` is `false` at first. `open()` makes it `true`, `close()` makes it `false`, and `toggle()` flips it.
:::

### 2. With `useDebouncedValue(query, 300)`, the user types "react" in under 300ms. How many times does an effect depending on `debounced` run for the search?

:::answer
**Once**, with `"react"`, after the user pauses for 300ms. While they type, the debounced value doesn't change.
:::

### 3. `useCounter(0, { min: 0, max: 3 })` — you call `increment()` four times. What is the count?

:::answer
**3.** The counter stops at `max`.
:::
