---
title: Ant Design Form and Table
stack: mantine-tailwind
order: 20
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "antd's Form keeps all field values for you. Each Form.Item has a name (the key in the values) and rules (the checks)."
  - "Form.useForm() gives a form instance: validateFields, setFieldsValue, getFieldsValue, resetFields."
  - "onFinish runs only when every rule passes; onFinishFailed runs when some fail."
  - "Table needs columns (title, dataIndex, key), dataSource (the rows) and rowKey (a unique id per row)."
  - "For big data, use server pagination: pass current, pageSize and total, and fetch a new page in onChange."
cards:
  - q: What do name and rules do on Form.Item?
    a: "name is the field's key in the form values (like 'email'). rules is a list of checks, like { required: true, message: 'Email is required' } and { type: 'email' }."
  - q: How do you get a handle on an antd form from code?
    a: "const [form] = Form.useForm(); then <Form form={form}>. Now you can call form.validateFields(), form.setFieldsValue(), form.resetFields()."
  - q: What is rowKey on Table for?
    a: "It tells antd which field is each row's unique id, like rowKey=\"id\". React needs it to track rows correctly; without it you get warnings and selection bugs."
  - q: How do you load table pages from the server?
    a: "Control pagination: pass { current, pageSize, total } and use the Table's onChange to fetch the requested page from the API."
  - q: When does onFinish run?
    a: After submit, and only if all rules pass. Otherwise the errors show under the fields and onFinishFailed runs.
---

## 💡 What is it?

**Ant Design** (antd) is a React component library for business apps. Its two most-used parts are **Form** and **Table**.

- **Form** stores every field's value and checks it with **rules**.
- **Table** shows rows of data with **columns**, **sorting** and **pagination** (splitting rows into pages).

For a general overview of antd, see [Ant Design overview](topic:mantine-tailwind/ant-design).

## 🏠 Real-life example

Think of the **school office**.

- The **admission form** has labelled boxes. Each box has a rule, like "phone: 10 digits". That's the antd **Form**, with **Form.Item** boxes and **rules**.
- The clerk **only accepts the form if every box is right**. That's **onFinish**.
- The **attendance register** has columns (Name, Class) and rows (students). It's split into pages. That's the antd **Table**.
- Each student has a **roll number** so no two rows mix up. That's **rowKey**.
- **Asking the office for page 3 only**, not the whole register, is **server pagination**.

## 🧑‍💻 Code example

Setup: a Vite React app with `npm install antd`. Paste into `src/App.jsx`.

```jsx
import { Button, Form, Input, Table } from 'antd';                   // antd's Form, Input, Button and Table

const columns = [                                                    // the table's columns
  { title: 'Name', dataIndex: 'name', key: 'name' },                 // title = header text; dataIndex = which field to show
  { title: 'Stack', dataIndex: 'stack', key: 'stack' },              // second column, from the "stack" field
];                                                                   // end of columns

const candidates = [                                                 // the rows (normally from an API)
  { id: 1, name: 'Meena', stack: 'React' },                          // id = unique id for each row
  { id: 2, name: 'Arun', stack: 'Node' },                            // second row
  { id: 3, name: 'Divya', stack: 'MongoDB' },                        // third row
];                                                                   // end of rows

export default function App() {                                      // the main component
  const [form] = Form.useForm();                                     // a handle to control the form from code

  return (                                                           // what the page shows
    <div style={{ maxWidth: 480, padding: 24 }}>                     {/* max 480px wide, 24px padding */}
      <Form                                                          // the form
        form={form}                                                  // connect our handle
        layout="vertical"                                            // labels above inputs
        onFinish={(values) => console.log('valid ->', values)}       // runs only if every rule passes
        onFinishFailed={({ errorFields }) => console.log('errors ->', errorFields)} // runs when a rule fails
      >                                                              {/* end of the opening Form tag */}
        <Form.Item                                                   // one field wrapper
          label="Email"                                              // the label text
          name="email"                                               // the key in "values"
          rules={[                                                   // the checks for this field
            { required: true, message: 'Email is required' },        // must not be empty
            { type: 'email', message: 'Not a valid email' },         // must look like an email
          ]}                                                         // end of rules
        >                                                            {/* end of the opening Form.Item tag */}
          <Input placeholder="you@example.com" />                    {/* the text box */}
        </Form.Item>                                                 {/* end of the field */}
        <Button type="primary" htmlType="submit">Save</Button>       {/* htmlType="submit" submits the form */}
      </Form>                                                        {/* end of the form */}

      <Table                                                         // the table
        rowKey="id"                                                  // each row's unique id is its "id" field
        columns={columns}                                            // which columns to show
        dataSource={candidates}                                      // which rows to show
        pagination={{ pageSize: 2 }}                                 // 2 rows per page
      />                                                             {/* end of the table */}
    </div>                                                           // end of the wrapper
  );                                                                 // end of what App returns
}                                                                    // end of App
```

**What happens.** I rendered this form and table with antd 6.6 in Node (jsdom) and called `validateFields()`:

```text
Empty email       → errors: email → ["Email is required"]
Email "abc"       → errors: email → ["Not a valid email"]
"meena@example.com" → valid: {"email":"meena@example.com"}
Table: page 1 shows 2 rows; the pager shows 2 page buttons (3 rows ÷ 2 per page)
```

## 🔍 Deeper version

**Form instance methods** (from `Form.useForm()`):

| Method | What it does |
|---|---|
| `validateFields()` | runs all rules; resolves with values or rejects with `errorFields` |
| `setFieldsValue({ email: 'x' })` | fills fields from code, like when editing a record |
| `getFieldsValue()` | reads current values without validating |
| `resetFields()` | goes back to `initialValues` |
| `setFields([{ name: 'email', errors: ['Taken'] }])` | shows a server error under a field |

**Rule types.** `required`, `type` (`'email'`, `'url'`, `'number'`), `min` / `max` / `len`, `pattern` (a regex), and `validator` for custom checks. A **custom validator** can compare fields, like "confirm password must match password". Add `dependencies={['password']}` so it re-checks when the other field changes.

**Nested and list fields.** `name={['address', 'city']}` stores `values.address.city`. `Form.List` handles repeated groups, like several work experiences.

**Table features you'll be asked about:**
- **Sorting:** add `sorter: (a, b) => a.name.localeCompare(b.name)` to a column.
- **Filtering:** `filters` plus `onFilter` on a column.
- **Custom cells:** `render: (value, row) => <Tag>{value}</Tag>`.
- **Row selection:** `rowSelection={{ onChange: (keys) => … }}`. It uses `rowKey` to know which rows are selected.
- **Server pagination:** keep `{ current, pageSize, total }` in state, pass it as `pagination`, and in `onChange(pagination, filters, sorter)` call your API for that page. Never load 50,000 rows into the browser.

:::version[Version note]
antd **v4** themed with Less. **v5** moved to CSS-in-JS design tokens. **antd 6** (current in October 2026) keeps the same Form and Table APIs shown here, so most v5 tutorials still apply.
:::

## 🎯 Why do we use it?

- **Forms in minutes.** Values, validation, error messages and submit handling are built in.
- **Admin tables for free.** Sorting, filters, pagination and selection need only config.
- **Consistent UX** across every screen of an internal tool.

## ⚠️ Common mistakes

- **No `rowKey`** (and no `key` in the data). React warns, and selection or expanded rows break.
- **Using `value` and `onChange` on inputs inside `Form.Item name`.** The Form already controls them. Set values with `setFieldsValue` instead.
- **Client-side pagination for huge data.** Fetch one page at a time from the server.
- **Trusting form rules only.** The backend must validate again.

## 🗣️ How to answer in an interview

> "In Ant Design, the Form keeps the values for me. Each Form.Item has a name, which is the key in the submitted values, and rules like required or type email. onFinish only runs if every rule passes; otherwise the error appears under the field. I use Form.useForm when I need to control it from code — for example setFieldsValue when editing a record, or setFields to show a server error like 'email already exists'.
>
> For Table I pass columns, a dataSource and a rowKey with the unique id. For big lists I switch to server pagination: I keep current, pageSize and total in state and fetch the requested page in onChange.
>
> I used Ant Design early in my career; at SkillKeepr we use Mantine, but the ideas are the same."

[FILL IN: which early-career project used Ant Design, and what form or table you built with it.]

## 🔁 Follow-up questions

### How do you show an API error like "email already exists" under the field?

Call `form.setFields([{ name: 'email', errors: ['Email already exists'] }])` after the API responds.

### How do you edit an existing candidate with the same form?

Load the record, then call `form.setFieldsValue(record)`, or pass `initialValues` when the form first renders.

### How do you add a column with action buttons?

Add a column with a `render` function that returns buttons, for example `render: (_, row) => <Button onClick={() => edit(row.id)}>Edit</Button>`.

### Form state: antd vs @mantine/form?

Both keep values and errors for you. antd uses `Form.Item name` and declarative `rules`. Mantine uses `useForm` with a `validate` object and `getInputProps`. See [Forms with @mantine/form](topic:mantine-tailwind/mantine-form).

## ✅ Quick check

### 1. A user submits with the email box empty. Which runs: `onFinish` or `onFinishFailed`?

:::answer
**`onFinishFailed`.** The `required` rule fails, so "Email is required" shows under the field and `onFinish` is not called.
:::

### 2. A table has 3 rows and `pagination={{ pageSize: 2 }}`. How many rows show on page 1?

- A) 1
- B) 2
- C) 3

:::answer
**B.** 2 rows on page 1 and 1 row on page 2.
:::

### 3. What does `rowKey="id"` tell the table?

:::answer
That each row's **unique id** is in its `id` field. React uses it to track rows, and row selection uses it to know which rows are selected.
:::
