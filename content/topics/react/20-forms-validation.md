---
title: Forms and validation (React Hook Form + Zod)
stack: react
order: 20
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A form collects input. Validation checks that input before you send it to the server.
  - React Hook Form keeps inputs "uncontrolled", so typing does not re-render the whole form.
  - Zod describes the rules once (a schema), and the form shows an error under each wrong field.
  - The backend must validate again. Frontend checks are only for a better user experience.
  - "React 19 also has form Actions: <form action={fn}> plus useActionState for pending state and errors."
cards:
  - q: Why use React Hook Form instead of useState for every field?
    a: It reads values from the inputs directly (uncontrolled), so typing does not re-render the whole form. Big forms stay fast, and you write less code.
  - q: What does Zod do in a form?
    a: It describes the rules for the data in one schema. The form checks the input against it and shows a clear error for each wrong field.
  - q: Is frontend validation enough?
    a: No. Anyone can skip the browser and call the API directly. The backend must validate every request again.
  - q: How do you show an error that came from the server, like "email already exists"?
    a: Call setError('email', { message }) from React Hook Form after the API replies, so the message appears under the right field.
  - q: What is useActionState in React 19?
    a: A hook for form Actions. It runs your action function on submit and gives you the returned state (like an error) and an isPending flag.
---

## 💡 What is it?

A **form** collects what the user types, like a name or an email.

**Validation** means checking that input **before** you use it. For example: "email must look like an email" or "password needs 8 characters".

In React, two popular tools work together:
- **React Hook Form** manages the form: values, errors and submit.
- **Zod** describes the rules once, in one place. This rule list is called a [schema](glossary:schema).

## 🏠 Real-life example

Think of filling an **exam registration form** at school.

1. You write your name, roll number and email on the form.
2. The **class teacher** checks it before sending it to the office. "You forgot your roll number." "This email is wrong." She marks each mistake next to the box.
3. The **office** checks it again before accepting it. Someone could skip the teacher and walk straight to the office.

- The **form** = your React form.
- The **list of rules** on the notice board = the Zod schema.
- The **class teacher** = frontend validation (fast, friendly, next to each box).
- The **office check** = backend validation (the real security).
- The **mark next to each box** = an error message under each field.

## 🧑‍💻 Code example

Create a Vite React app, then install the libraries:
`npm install react-hook-form zod @hookform/resolvers`

Paste this into `src/App.jsx` and run `npm run dev`.

```jsx
import { useForm } from 'react-hook-form';                       // the form manager hook
import { zodResolver } from '@hookform/resolvers/zod';           // connects Zod rules to React Hook Form
import { z } from 'zod';                                         // the validation library

const schema = z.object({                                        // the rules for the whole form, in one place
  name: z.string().min(2, 'Name needs at least 2 letters'),      // text, at least 2 characters, with this message
  email: z.email('Please enter a valid email'),                  // must look like an email (Zod 4 style)
  experience: z.coerce.number().min(0, 'Cannot be negative'),    // turn the input text into a number, 0 or more
});                                                              // end of the schema

export default function App() {                                  // our component
  const {                                                        // take the tools we need from the hook
    register,                                                    // connects an input to the form
    handleSubmit,                                                // runs validation, then calls our function
    formState: { errors, isSubmitting },                         // errors per field, and "is it sending now?"
  } = useForm({ resolver: zodResolver(schema) });                // use the Zod schema for validation

  const onSubmit = async (data) => {                             // runs ONLY when all rules pass
    await new Promise((r) => setTimeout(r, 1000));               // pretend to call the API for 1 second
    alert(JSON.stringify(data));                                 // show the clean data, e.g. experience is a number
  };                                                             // end of onSubmit

  return (                                                       // what to show on screen
    <form onSubmit={handleSubmit(onSubmit)} noValidate>          {/* noValidate = skip the browser's own popups */}
      <input placeholder="Name" {...register('name')} />         {/* connect this input to the "name" field */}
      <p>{errors.name?.message}</p>                              {/* show the name error, if any */}
      <input placeholder="Email" {...register('email')} />       {/* connect this input to the "email" field */}
      <p>{errors.email?.message}</p>                             {/* show the email error, if any */}
      <input placeholder="Years" {...register('experience')} />  {/* connect this input to "experience" */}
      <p>{errors.experience?.message}</p>                        {/* show the experience error, if any */}
      <button disabled={isSubmitting}>                           {/* disable the button while sending */}
        {isSubmitting ? 'Saving…' : 'Save'}                      {/* change the label while sending */}
      </button>                                                  {/* end of the button */}
    </form>                                                      // end of the form
  );                                                             // end of what we return
}                                                                // end of App
```

**What you see:**

```text
Click "Save" with empty boxes:
  Name needs at least 2 letters
  Please enter a valid email
Type a real name, email and 3, then click "Save":
  Button shows "Saving…" for 1 second
  Alert: {"name":"Hari","email":"hari@test.com","experience":3}
```

Notice that `experience` arrives as the **number** `3`, not the text `"3"`. Zod converted it for you.

## 🔍 Deeper version

**Controlled vs uncontrolled.** A [controlled input](topic:react/controlled-uncontrolled) keeps its value in React [state](glossary:state). Every key press calls `setState` and re-renders the component. React Hook Form keeps inputs **uncontrolled**. It reads values from the DOM through refs. So typing in one field does not re-render the whole form. This matters for big forms. See [a slow 20-field form](topic:debugging/slow-big-form).

**One schema, two jobs.** A Zod schema can also create a TypeScript type with `z.infer<typeof schema>`. Many teams share the same schema between the frontend and a Node backend. Then the rules can't drift apart.

**When validation runs.** By default, React Hook Form validates on submit. You can change this with `mode`:

| `mode` | When it checks |
|---|---|
| `'onSubmit'` (default) | when the user submits |
| `'onBlur'` | when the user leaves a field |
| `'onChange'` | on every key press (more re-renders) |
| `'onTouched'` | after the first blur, then on every change |

**Server errors.** Some rules only the server knows, like "this email is already used". After the API replies with an error, call `setError('email', { message: 'Email already exists' })`. The message appears under the right field.

**Backend validation is a must.** Anyone can call your API with Postman or `curl`. The browser checks are skipped then. So the server must validate every request again. In Express you can do this with Joi or Zod. See [request validation in Express](topic:express/validation).

:::version[Version note]
**React 19** added **form Actions**. You can write `<form action={saveAction}>`. React calls your function with the form data. The `useActionState` hook gives you the returned state (like an error) and an `isPending` flag. `useFormStatus` lets a button inside the form know it is submitting. These are great for simple forms. For big forms with many rules, many teams still use React Hook Form.
:::

## 🎯 Why do we use it?

- **Better experience.** The user sees what is wrong right away, next to the right box.
- **Fewer bad requests.** You don't send obviously wrong data to the server.
- **Less code.** No `useState` for every field, and no hand-written `if` checks.
- **Speed.** Uncontrolled inputs keep large forms fast.
- **One place for rules.** The schema is easy to read, test and reuse.

## ⚠️ Common mistakes

- **Trusting the frontend only.** The backend must validate too, always.
- **A `useState` for every field in a big form.** Each key press re-renders the whole form. It becomes slow.
- **Not showing server errors.** "Something went wrong" is not helpful. Map the server error to the right field.
- **Forgetting number conversion.** Input values are always text. Use `z.coerce.number()` or `valueAsNumber`.
- **Letting users double-submit.** Disable the button while `isSubmitting` is true.

## 🗣️ How to answer in an interview

> "For forms I use React Hook Form with a Zod schema. React Hook Form keeps the inputs uncontrolled, so typing doesn't re-render the whole form, which keeps big forms fast. The Zod schema holds all the rules in one place, and I connect it with zodResolver. Errors show under each field, and I disable the submit button while the request is running.
>
> For errors only the server knows, like a duplicate email, I call setError so the message appears on the right field. And I always validate again on the backend, because frontend validation is only for user experience. Anyone can call the API directly.
>
> React 19 also has form Actions with useActionState. I'd use those for small, simple forms."

At SkillKeepr, forms use `@mantine/form` (Mantine's form hook). [FILL IN: one form you built with it.]

## 🔁 Follow-up questions

### Controlled or uncontrolled — which is better for forms?

Controlled inputs are simple and good for small forms, or when you need the value on every key press (like live search). Uncontrolled inputs (React Hook Form) are better for big forms, because they don't re-render on every key press.

### How do you validate one field based on another, like "confirm password"?

Use Zod's `.refine()` on the whole object. Compare the two fields and set `path: ['confirmPassword']`, so the error shows under the right box.

### How do you share validation rules between the frontend and backend?

Put the Zod schema in a shared package or folder. The frontend uses it with React Hook Form. The Node backend uses the same schema to check the request body. `z.infer` gives both sides the same TypeScript type.

### How do you stop the user from submitting twice?

Disable the button while `isSubmitting` is true. On the backend, an idempotency key can also stop duplicate creates. See [idempotency keys](topic:rest-auth/idempotency-keys).

## ✅ Quick check

### 1. A user types `"5"` in an "experience" box. With `z.number()` (no coerce), what happens?

:::answer
Validation **fails**. Input values are always strings, so `"5"` is not a number. Use `z.coerce.number()`, or `register('experience', { valueAsNumber: true })`.
:::

### 2. True or false: if the frontend validates with Zod, the backend can skip validation.

:::answer
**False.** Anyone can call the API without the browser. The backend must always validate again.
:::

### 3. Why is React Hook Form usually faster than one `useState` per field?

- A) It uses a faster version of React
- B) Inputs are uncontrolled, so typing doesn't re-render the whole form
- C) It skips validation

:::answer
**B.** It reads values from the inputs through refs, so a key press doesn't re-render the whole form.
:::
