---
title: "Mantine layout: Box, Group, Stack, Flex, Container"
stack: mantine-tailwind
order: 3
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Box is a plain div that accepts style props. Group puts children in a row. Stack puts them in a column."
  - "Flex is a full flexbox with every option, and each option can change per screen size."
  - "Container centres your content and limits its width (default size md = 960px)."
  - "The gap prop uses the spacing scale: gap=\"md\" = 16px, which is the default for Group and Stack."
  - AppShell builds a whole page frame with a header, a sidebar (navbar) and a main area.
cards:
  - q: What is the difference between Group and Stack?
    a: "Group lines children up in a row (horizontally). Stack lines them up in a column (vertically). Both use gap=\"md\" (16px) by default."
  - q: When would you use Flex instead of Group?
    a: "When you need full flexbox control, especially values that change by screen size, like direction={{ base: 'column', sm: 'row' }}."
  - q: What does Container do?
    a: It centres content and gives it a max width. size="md" (the default) is 960px wide; xs is 540px and xl is 1320px.
  - q: What is Box in Mantine?
    a: The base element of every Mantine component — a div (or any element via the component prop) that accepts style props like p, m, bg and w.
  - q: What is AppShell?
    a: A page-layout component with header, navbar, aside, footer and main areas. It handles fixed positions and collapsing the navbar on mobile.
---

## 💡 What is it?

Mantine has small **layout components** that place other things on the page.

- **`Box`** — a plain box (a `div`) that you can style with props.
- **`Group`** — puts children **side by side** in a row.
- **`Stack`** — puts children **one under another** in a column.
- **`Flex`** — a full [flexbox](glossary:flexbox) with every option.
- **`Container`** — keeps content **centred** with a maximum width.

You use them instead of writing CSS for rows, columns and spacing.

## 🏠 Real-life example

Think of **arranging things in a school bag**.

- **`Box`** = one pocket. It holds things, and you can colour it.
- **`Group`** = pens lying side by side in a pencil box.
- **`Stack`** = books standing one on top of another.
- **`Flex`** = a smart shelf that can be a row on a big desk but turns into a column on a small table.
- **`Container`** = the bag itself. It stays the same width and sits in the middle of your back, however wide you are.
- **`gap`** = the space you leave between items so they don't get crushed.

## 🧑‍💻 Code example

Use the setup from [Mantine setup](topic:mantine-tailwind/mantine-setup), then replace **`src/App.jsx`**:

```jsx
import { Box, Button, Container, Flex, Group, Stack, Text, TextInput } from '@mantine/core'; // layout + basic parts

export default function App() {                                   // our main component
  return (                                                        // what the screen shows
    <Container size="sm" py="xl">                                 {/* centred, max 720px wide, 32px padding top and bottom */}
      <Stack gap="lg">                                            {/* children in a column, 20px apart */}
        <Group justify="space-between">                           {/* a row: first item left, last item right */}
          <Text fw={700} size="xl">Candidates</Text>              {/* bold (700) text, 20px font */}
          <Button size="sm">Add</Button>                          {/* a small button on the right */}
        </Group>                                                  {/* end of the top row */}
        <Flex                                                     // a flexible row/column
          direction={{ base: 'column', sm: 'row' }}               // column on phones, row from 768px
          gap="md"                                                // 16px between items
          align={{ base: 'stretch', sm: 'flex-end' }}             // full width on phones, bottom-aligned on bigger screens
        >                                                         {/* end of Flex props */}
          <TextInput label="Search" style={{ flex: 1 }} />        {/* input takes the free space */}
          <Button variant="light">Filter</Button>                 {/* a soft-coloured button */}
        </Flex>                                                   {/* end of the search row */}
        <Box p="md" bg="gray.1" bdrs="md">                        {/* padding 16px, light grey bg, 8px rounded corners */}
          <Text c="dimmed">No candidates yet.</Text>              {/* grey "dimmed" text */}
        </Box>                                                    {/* end of the empty-state box */}
      </Stack>                                                    {/* end of the column */}
    </Container>                                                  // end of the page box
  );                                                              // end of what App returns
}                                                                 // end of App
```

Run `npm run dev` and resize the window.

```text
375px (phone): "Candidates" on the left, "Add" on the right.
  Below: the Search box full width, the Filter button under it.
  Below that: a light-grey rounded box saying "No candidates yet."
1280px (laptop): the content stays 720px wide in the middle.
  Search box and Filter button now sit side by side in one row.
```

## 🔍 Deeper version

**What each one is under the hood:**

| Component | CSS it makes | Default props |
|---|---|---|
| `Box` | a plain `div` | none — accepts all style props |
| `Group` | `display: flex`, row | `gap="md"`, `align="center"`, `justify="flex-start"`, `wrap="wrap"` |
| `Stack` | `display: flex`, column | `gap="md"`, `align="stretch"`, `justify="flex-start"` |
| `Flex` | full flexbox | every prop can be **responsive** (`{ base, sm, md… }`) |
| `Container` | `max-width` + `margin: auto` | `size="md"` |

**Container sizes** (default theme): `xs` 540px, `sm` 720px, `md` 960px, `lg` 1140px, `xl` 1320px. Add `fluid` to remove the max width.

**Group vs Flex.** `Group` props are **not** responsive. If you need "column on phone, row on laptop", use `Flex` with objects, or `SimpleGrid`. `Group` has a `grow` prop: every child gets equal width.

**The `component` prop.** `Box` and `Flex` are *polymorphic*, which means they can render as another tag. For example, `<Box component="section">` renders a `<section>`, and `<Flex component="nav">` renders a `<nav>`. `Group` and `Stack` always render a `div`, so wrap them in `<Box component="nav">` when you need a semantic tag. This keeps your HTML [semantic](topic:html-css/semantic-html).

**AppShell** is for the whole page frame:

```jsx
<AppShell                                                        // the page frame
  header={{ height: 60 }}                                        // a 60px fixed header
  navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }} // 260px sidebar; below 768px it hides unless opened
  padding="md"                                                   // 16px padding around the main area
>                                                                {/* end of AppShell props */}
  <AppShell.Header>Logo</AppShell.Header>                        {/* top bar */}
  <AppShell.Navbar>Menu links</AppShell.Navbar>                  {/* left sidebar */}
  <AppShell.Main>Page content</AppShell.Main>                    {/* the main area */}
</AppShell>                                                      // end of the frame
```

`opened` comes from `useDisclosure`, and a `<Burger>` button in the header toggles it on phones.

## 🎯 Why do we use it?

- **Less CSS.** Rows, columns and gaps without writing a stylesheet.
- **Consistent spacing.** `gap="md"` always means the same 16px across the app.
- **Responsive with one prop.** `Flex` and style props change by screen size.
- **Readable JSX.** `<Stack>` tells the next developer "this is a column" at a glance.

## ⚠️ Common mistakes

- **Expecting `Group` to stack on phones.** It wraps, but it doesn't switch to a column. Use `Flex` with `direction={{ base: 'column', sm: 'row' }}`.
- **Putting `Container` inside `Container`.** The inner one adds another max width and extra padding.
- **Using margins on every child** instead of `gap` on the parent.
- **Forgetting `style={{ flex: 1 }}`** (or `flex={1}`) on the item that should fill the free space.

## 🗣️ How to answer in an interview

> "Mantine has small layout primitives. `Box` is a styled div that accepts style props, `Group` lays children out in a row, `Stack` in a column, and `Flex` exposes full flexbox where every prop can be responsive. `Container` centres content with a max width — `md` is 960px by default. They all use the theme's spacing scale through the `gap` prop, so spacing stays consistent. For full pages there's `AppShell`, which gives you a header, a collapsible navbar and a main area."

[FILL IN: a page layout you built with these at SkillKeepr — e.g. a list page with a toolbar row and a results column.]

## 🔁 Follow-up questions

### Group or Flex — which do you reach for first?

`Group` for simple rows like a toolbar or button group. `Flex` when the layout must change by screen size, or when I need `direction`, `rowGap` or `columnGap`.

### How do you make Group children take equal width?

Add the `grow` prop: `<Group grow>`. Every child gets `flex-grow: 1`, so they share the row equally.

### How do you render a column as a real list (`<ul>`)?

`Stack` always renders a `div`, so use `Flex`, which accepts the `component` prop: `<Flex component="ul" direction="column" gap="sm">`. Each child should then be an `<li>`.

### How does AppShell handle mobile?

The `navbar` config has a `breakpoint` and `collapsed: { mobile, desktop }`. Below the breakpoint, the navbar is hidden unless `collapsed.mobile` is false. A `Burger` button usually toggles it.

## ✅ Quick check

### 1. What is the space between children of `<Stack>` with no `gap` prop?

:::answer
**16px.** The default is `gap="md"`, and the default `md` spacing is 16px.
:::

### 2. You want a search box and button in a column on phones but in a row on laptops. Which is right?

- A) `<Group>`
- B) `<Flex direction={{ base: 'column', sm: 'row' }}>`
- C) `<Stack>`

:::answer
**B.** `Flex` props can be responsive objects. `Group` and `Stack` have a fixed direction.
:::

### 3. How wide can `<Container>` content get with no `size` prop?

:::answer
**960px.** The default `size` is `md`, which is `60rem` = 960px with the default 16px font size.
:::
