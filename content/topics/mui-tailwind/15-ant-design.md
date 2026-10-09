---
title: Ant Design overview (also on my resume)
stack: mui-tailwind
order: 15
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - "Ant Design (antd) is a React component library made for business apps: tables, forms, dashboards."
  - "Its strongest parts are Table (sorting, filters, pagination), Form (validation rules), and feedback like message and Modal."
  - "Since v5, you theme it with design tokens in ConfigProvider, e.g. token.colorPrimary for the main colour."
  - "Algorithms change the whole look in one line: theme.darkAlgorithm, theme.compactAlgorithm."
  - "Compared with MUI: antd feels like an admin dashboard; MUI follows Material Design. Both are big, accessible libraries."
cards:
  - q: What is Ant Design best known for?
    a: Data-heavy business screens. Its Table and Form components are very powerful out of the box.
  - q: How do you change the main colour in antd v5+?
    a: "Wrap the app in <ConfigProvider theme={{ token: { colorPrimary: '#2554d9' } }}>."
  - q: How does antd Form validation work?
    a: "Each Form.Item has a name and rules, like rules={[{ required: true, message: 'Enter an email' }]}. The form checks them on submit."
  - q: How do you turn on dark mode in antd?
    a: "Pass algorithm: theme.darkAlgorithm in ConfigProvider's theme prop."
  - q: Ant Design vs MUI in one line?
    a: antd is built for admin dashboards with rich tables and forms; MUI follows Google's Material Design and is very customisable. Pick one per app.
---

## 💡 What is it?

**Ant Design** (often written **antd**) is a **React component library**. It gives you ready-made, good-looking [components](glossary:component).

It is made for **business apps**: admin panels, dashboards, data tables and long forms. It is very popular for internal tools.

## 🏠 Real-life example

Think of a **ready-made office furniture set**.

Instead of building every desk and cupboard yourself, you buy a matching set: desks, filing cabinets and chairs. All of them look the same and fit together. You can still choose the colour.

- **The furniture set** = Ant Design.
- **Filing cabinets with labelled drawers** = the `Table`, with sorting and filters built in.
- **A form with boxes to tick** = the `Form`, with validation rules.
- **Choosing the colour of the whole set** = design tokens in `ConfigProvider`.
- **A "night" version of the set** = `theme.darkAlgorithm`.

## 🧑‍💻 Code example

Setup: a Vite React app, then `npm install antd`. Paste into `src/App.jsx` and run `npm run dev`.

```jsx
import { Button, ConfigProvider, Form, Input, Table, message, theme } from 'antd'; // antd components and helpers

const columns = [                                                    // the table's columns
  { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) }, // sortable by name (A→Z)
  { title: 'Experience (years)', dataIndex: 'exp', sorter: (a, b) => a.exp - b.exp },   // sortable by number
];                                                                   // end of columns

const data = [                                                       // the table's rows
  { key: '1', name: 'Asha', exp: 4 },                                // key = unique id for each row
  { key: '2', name: 'Hari', exp: 3 },                                // another row
];                                                                   // end of data

export default function App() {                                      // the main component
  return (                                                           // what the page shows
    <ConfigProvider                                                  // sets the theme for every antd component inside
      theme={{                                                       // the theme object
        token: { colorPrimary: '#2554d9', borderRadius: 8 },         // colorPrimary = main brand blue; borderRadius = 8px corners
        algorithm: theme.defaultAlgorithm,                           // light look (theme.darkAlgorithm for dark mode)
      }}                                                             // end of the theme object
    >                                                                {/* end of the opening ConfigProvider tag */}
      <div style={{ maxWidth: 480, padding: 24 }}>                   {/* max 480px wide, 24px padding */}
        <Form                                                        // an antd form
          layout="vertical"                                          // labels above the inputs
          onFinish={(values) => message.success(`Saved ${values.email}`)} // runs only if every rule passes
        >                                                            {/* end of the opening Form tag */}
          <Form.Item                                                 // one field wrapper
            label="Email"                                            // the label text
            name="email"                                             // the key in "values"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]} // must be filled and look like an email
          >                                                          {/* end of the opening Form.Item tag */}
            <Input placeholder="you@example.com" />                  {/* the text box */}
          </Form.Item>                                               {/* end of the field */}
          <Button type="primary" htmlType="submit">Save</Button>     {/* primary = brand blue; htmlType submit = submits the form */}
        </Form>                                                      {/* end of the form */}
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 5 }} /> {/* table with sorting; 5 rows per page */}
      </div>                                                         {/* end of the wrapper */}
    </ConfigProvider>                                                // end of ConfigProvider
  );                                                                 // end of what App returns
}                                                                    // end of App
```

**What you see:**

```text
An "Email" field and a blue Save button.
Clicking Save with an empty or wrong email shows "Enter a valid email" in red under the field.
With a valid email, a green toast says "Saved you@example.com".
Below: a table of two candidates. Clicking a column title sorts it.
```

## 🔍 Deeper version

**Main building blocks:**

| Area | Components | Why people like them |
|---|---|---|
| Data | `Table`, `List`, `Descriptions` | sorting, filters, pagination, fixed columns, row selection |
| Forms | `Form`, `Form.Item`, `Input`, `Select`, `DatePicker` | validation rules, form-level state, error messages |
| Layout | `Layout`, `Grid` (`Row`, `Col`, 24 columns), `Space`, `Flex` | quick admin layouts |
| Feedback | `message`, `notification`, `Modal`, `Drawer` | toasts and dialogs |

**Theming with design tokens.** A **design token** is a named design value, like "primary colour" or "corner radius". Since **v5**, antd themes with tokens in `ConfigProvider`:
- **Seed tokens** (`colorPrimary`, `borderRadius`, `fontSize`) are the base values. antd calculates hover, active and lighter shades from them.
- **Component tokens** change one component only: `components: { Button: { controlHeight: 40 } }` (40px tall buttons).
- **Algorithms** change everything at once: `theme.darkAlgorithm`, `theme.compactAlgorithm`. You can combine them in an array.

**Responsive grid.** antd's `Col` uses **24 columns** with breakpoints `xs` (<576px), `sm` (≥576px), `md` (≥768px), `lg` (≥992px), `xl` (≥1200px), `xxl` (≥1600px). These differ from MUI's and Tailwind's, so don't mix grids across libraries.

**Styling.** antd v5 uses CSS-in-JS (its own engine), like MUI uses Emotion. If you add Tailwind too, you face the same "who wins" question as with [MUI and Tailwind](topic:mui-tailwind/mui-and-tailwind-together).

**Imports.** Named imports like `import { Button } from 'antd'` are tree-shaken by modern bundlers. Tree shaking means unused components are dropped from your bundle. Old projects used `babel-plugin-import` for this; v5 doesn't need it.

:::version[Version note]
**antd v4** themed with Less variables and needed extra build setup. **antd v5** (2022) moved to CSS-in-JS with design tokens in `ConfigProvider`. Newer major versions keep the token approach. Old tutorials that edit `.less` files are for v4.
:::

## 🎯 Why do we use it?

- **Fast admin screens.** A sortable, filterable, paginated table is a few lines of config.
- **Strong forms.** Validation, error messages and form state are built in.
- **Consistent look** with very little design work.
- **Easy theming** with tokens instead of overriding CSS.

## ⚠️ Common mistakes

- **Mixing antd with another big library** (like MUI) in the same screens. You get two design languages and a bigger bundle.
- **Forgetting `key` on table rows** (or `rowKey`). React shows warnings, and selection can break.
- **Following v4 Less tutorials** in a v5+ project.
- **Overriding antd styles with high-specificity CSS** instead of using tokens. Upgrades then break your overrides.

## 🗣️ How to answer in an interview

> "Ant Design is a React component library aimed at business apps. Its strongest parts are the Table, with sorting, filters and pagination built in, and the Form, where each field has validation rules.
>
> Since version 5 it's themed with design tokens through ConfigProvider. I set seed tokens like colorPrimary and borderRadius, and antd works out the hover and active shades. Algorithms like darkAlgorithm switch the whole look in one line.
>
> I used Ant Design early in my career, along with Tailwind. Compared with MUI, antd feels more like an admin-dashboard kit, while MUI follows Material Design. I'd pick one per app rather than mixing them."

[FILL IN: which early project used Ant Design, and what you built with it.]

## 🔁 Follow-up questions

### How do you validate one field based on another, like "confirm password"?

Use a function rule with `getFieldValue`: return a rule whose `validator` compares the value with `getFieldValue('password')`. Add `dependencies={['password']}` so it re-checks when the password changes.

### How do you load table data from an API page by page?

Set `pagination` to controlled mode: pass `current`, `pageSize` and `total`, and use `onChange` to fetch the next page from the server.

### antd vs MUI: which would you choose?

For a data-heavy admin tool, antd's Table and Form are very fast to build with. For a product that needs a custom brand look or follows Material Design, MUI is often easier to customise. Team experience matters too.

### Can you use antd with server-side rendering?

Yes. Its CSS-in-JS needs an extra setup step to collect styles on the server, and antd provides helpers for Next.js.

## ✅ Quick check

### 1. How do you make every antd primary button green?

:::answer
In `ConfigProvider`, set `theme={{ token: { colorPrimary: '#16a34a' } }}`. Every component that uses the primary colour updates.
:::

### 2. When does `Form`'s `onFinish` run?

- A) On every keystroke
- B) After submit, only if all rules pass
- C) Only when a rule fails

:::answer
**B.** If a rule fails, antd shows the error under that field and calls `onFinishFailed` instead.
:::

### 3. How many columns does antd's grid have?

:::answer
**24.** For example, `<Col span={12}>` is half the width. (MUI's Grid has 12 columns.)
:::
