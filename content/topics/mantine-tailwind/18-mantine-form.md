---
title: Forms with @mantine/form
stack: mantine-tailwind
order: 18
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "@mantine/form gives you one hook, useForm, that holds a form's values, errors and touched state."
  - "You pass initialValues and validate rules. Then you connect each input with {...form.getInputProps('email')} and key={form.key('email')}."
  - "Two modes: 'controlled' (the default) re-renders on every keystroke; 'uncontrolled' keeps values outside React state, so big forms stay fast."
  - "form.onSubmit(handler) runs validation first and calls your handler only if there are no errors."
  - "Built-in validators (isEmail, hasLength, isNotEmpty) cover simple rules. For schemas, Mantine 9 has schemaResolver; older versions use mantine-form-zod-resolver."
cards:
  - q: What does useForm return?
    a: A form object with the values, errors and helpers like getInputProps, key, onSubmit, validate, setFieldValue, reset and getValues.
  - q: What does form.getInputProps('email') do?
    a: "It returns the props an input needs — value or defaultValue, onChange, onBlur, onFocus and error — so one spread connects the input to the form."
  - q: Controlled vs uncontrolled mode in @mantine/form?
    a: "Controlled (default) stores values in React state and re-renders on each change. Uncontrolled keeps values in a ref and only re-renders when needed, which is faster for large forms. In uncontrolled mode, read values with form.getValues() and add key={form.key(path)} to inputs."
  - q: When does form.onSubmit call your handler?
    a: Only after validation passes. If any rule fails, it sets the errors (shown under the inputs) and does not call the handler.
  - q: How do you validate with a Zod schema?
    a: "In Mantine 9, validate: schemaResolver(schema). In Mantine 7 or 8, use zodResolver from the mantine-form-zod-resolver package."
---

## 💡 What is it?

`@mantine/form` is Mantine's form library. Its main tool is one [hook](glossary:hook): **`useForm`**.

`useForm` remembers what the user typed (the **values**), what is wrong (the **errors**), and which fields were touched. It also runs your **validation rules** before the form is sent.

You connect each input with one line: `{...form.getInputProps('email')}`.

## 🏠 Real-life example

Think of a **school admission form** handled by the office clerk.

- The **blank form** with empty boxes = `initialValues`.
- The **rules printed at the top** ("phone must be 10 digits") = `validate`.
- The clerk **checking every box before accepting it** = `form.onSubmit` running validation.
- **Red ink next to a wrong box** = the `error` shown under an input.
- The clerk **only filing complete forms** = your submit handler runs only when there are no errors.

## 🧑‍💻 Code example

Setup: a Vite React app with `npm install @mantine/core @mantine/hooks @mantine/form`. Paste into `src/App.jsx`.

```jsx
import '@mantine/core/styles.css';                                   // Mantine's CSS (needed once)
import { MantineProvider, TextInput, Button, Stack } from '@mantine/core'; // provider, input, button, vertical stack
import { useForm, isEmail, hasLength } from '@mantine/form';         // the form hook and two ready-made rules

function CandidateForm() {                                           // a small "add candidate" form
  const form = useForm({                                             // create the form
    mode: 'uncontrolled',                                            // keep values out of React state → fewer re-renders
    initialValues: { name: '', email: '' },                          // both boxes start empty
    validate: {                                                      // one rule per field
      name: hasLength({ min: 2 }, 'Name must have 2+ letters'),      // at least 2 characters, else this message
      email: isEmail('Invalid email'),                               // must look like an email, else this message
    },                                                               // end of rules
  });                                                                // end of useForm

  return (                                                           // what the form shows
    <form onSubmit={form.onSubmit((values) => console.log('Saved', values))}> {/* validate first; log only if valid */}
      <Stack maw={360}>                                              {/* vertical stack, max width 360px */}
        <TextInput label="Name" key={form.key('name')} {...form.getInputProps('name')} />    {/* key = needed in uncontrolled mode */}
        <TextInput label="Email" key={form.key('email')} {...form.getInputProps('email')} /> {/* the spread adds defaultValue, onChange, error… */}
        <Button type="submit">Save</Button>                          {/* submitting runs the rules */}
      </Stack>                                                       {/* end of the stack */}
    </form>                                                          // end of the form
  );                                                                 // end of what CandidateForm returns
}                                                                    // end of CandidateForm

export default function App() {                                      // the main component
  return <MantineProvider><CandidateForm /></MantineProvider>;       // wrap the form in the Mantine provider
}                                                                    // end of App
```

**What happens.** I ran the same form logic in Node (with jsdom) to get these real results:

```text
Submit with both boxes empty → errors: {"name":"Name must have 2+ letters","email":"Invalid email"}
(the two messages appear in red under the inputs; "Saved" is NOT logged)

Type "Meena" and "meena@example.com", submit → no errors
Console: Saved { name: 'Meena', email: 'meena@example.com' }

getInputProps('email') gives these props: data-path, defaultValue, error, onBlur, onChange, onFocus
```

## 🔍 Deeper version

**Controlled vs uncontrolled mode.**

| | `mode: 'controlled'` (default) | `mode: 'uncontrolled'` |
|---|---|---|
| Where values live | React state | a ref, outside React state |
| Re-renders | on every keystroke | only when needed (errors, reset…) |
| `getInputProps` gives | `value` | `defaultValue` |
| Read values with | `form.values` | `form.getValues()` |
| Extra step | none | add `key={form.key(path)}` to each input |

Uncontrolled is faster for big forms. The `key` lets Mantine re-mount an input when values are reset from code.

**Useful helpers:**
- `form.setFieldValue('email', 'x@y.com')` changes one field.
- `form.validateField('email')` checks one field.
- `form.reset()` goes back to `initialValues`.
- `form.isDirty()` tells you whether anything changed.
- `form.insertListItem` and `removeListItem` handle **lists**, like several work-experience entries. Paths look like `experience.0.company`.

**When to validate.** By default rules run on submit. You can also set `validateInputOnBlur: true` or `validateInputOnChange: ['email']` for earlier feedback.

**Schema validation.** For bigger forms, write the rules once as a schema:

```ts
import { z } from 'zod';                                             // Zod: a schema library
import { useForm, schemaResolver } from '@mantine/form';             // schemaResolver is built into Mantine 9

const schema = z.object({                                            // the shape and rules of the form
  name: z.string().min(2, 'Too short'),                              // name: at least 2 characters
  email: z.email('Bad email'),                                       // email: must be a valid email (Zod 4 syntax)
});                                                                  // end of the schema

const form = useForm({ mode: 'uncontrolled', initialValues: { name: 'A', email: 'x' }, validate: schemaResolver(schema, { sync: true }) }); // validate with the schema
// form.validate() → errors {"name":"Too short","email":"Bad email"}  (real run)
```

:::version[Version note]
`schemaResolver` (it works with any "Standard Schema" library, like Zod) was **added in Mantine 9**. In Mantine 7 and 8, install `mantine-form-zod-resolver` and use `validate: zodResolver(schema)`. The `mode` option (uncontrolled forms) was added during the Mantine 7 releases; Mantine 7.0 did not have it. SkillKeepr is on Mantine 7.
:::

**Backend still validates.** Form rules are for user experience. The server must check again, because anyone can call the API directly. At SkillKeepr, the backend services validate with Joi. See [request validation](topic:express/validation).

## 🎯 Why do we use it?

- **Less code.** One hook replaces many `useState` calls and onChange handlers.
- **One place for rules.** Every error message lives in `validate`.
- **Speed.** Uncontrolled mode keeps long forms (like a candidate profile) fast.
- **Fits Mantine inputs.** `getInputProps` already matches every Mantine input's props, including `error`.

## ⚠️ Common mistakes

- **Forgetting `key={form.key(path)}` in uncontrolled mode.** Then `form.reset()` or `setValues()` may not update what the user sees.
- **Reading `form.values` in uncontrolled mode.** It isn't kept up to date there. Use `form.getValues()`.
- **Putting the submit logic in `onClick`** instead of `form.onSubmit`. Then validation is skipped.
- **Trusting front-end validation only.** Always validate again on the server.

## 🗣️ How to answer in an interview

> "At SkillKeepr the forms use @mantine/form. Its useForm hook holds the values, errors and touched state. I give it initialValues and a validate object with one rule per field, then connect each input with a spread of form.getInputProps. On submit, form.onSubmit runs the rules and only calls my handler if everything passes. Otherwise each input shows its error message.
>
> For larger forms I use uncontrolled mode. Values live outside React state, so typing doesn't re-render the whole form. I add key={form.key(path)} to each input and read values with getValues. For schema validation, Mantine 9 has schemaResolver for Zod; on Mantine 7 you'd use the zod resolver package. And the backend validates again — at SkillKeepr that's Joi."

[FILL IN: a SkillKeepr form you worked on, if any — I worked mainly on the backend, so say so honestly if you didn't build the form UI.]

## 🔁 Follow-up questions

### How do you show a server error, like "email already exists", under the field?

Call `form.setFieldError('email', 'Email already exists')` after the API returns that error. The message appears under the input just like a rule error.

### How do you handle a list of items, like several phone numbers?

Store an array in `initialValues`. Use `form.insertListItem('phones', '')` to add one, `removeListItem('phones', index)` to remove one, and paths like `phones.0` in `getInputProps`.

### What does transformValues do?

It changes the values just before your submit handler gets them. For example, it can trim spaces or turn a string into a number, so the handler receives clean data.

### @mantine/form vs React Hook Form?

Both are good. React Hook Form is library-independent and very popular. @mantine/form fits Mantine inputs with no adapter. In a Mantine app, @mantine/form keeps things simple. See [forms in React](topic:react/forms-validation).

## ✅ Quick check

### 1. In `mode: 'uncontrolled'`, which line reads the current values?

- A) `form.values`
- B) `form.getValues()`
- C) `form.getInputProps()`

:::answer
**B.** In uncontrolled mode values aren't kept in React state, so use `form.getValues()`.
:::

### 2. The user clicks Save with an empty name. What happens with `form.onSubmit(handler)`?

:::answer
The `name` rule fails, so the error "Name must have 2+ letters" appears under the input, and **`handler` is not called**.
:::

### 3. You are on Mantine 7 and want Zod validation. What do you use?

:::answer
`zodResolver` from the **`mantine-form-zod-resolver`** package: `validate: zodResolver(schema)`. The built-in `schemaResolver` only exists from Mantine 9.
:::
