---
title: A 20-field form is slow and hard to maintain
template: scenario
stack: debugging
order: 15
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Symptom: typing in a big form feels laggy, and the code is a mess of useState and if-checks."
  - "Detect: React DevTools Profiler shows the whole form re-rendering on every key press."
  - "Cause: one big component holds every field in state, so each keystroke re-renders all 20 fields."
  - "Fix: React Hook Form (uncontrolled inputs, far fewer re-renders) plus one Zod or Yup schema for validation; split the form into small sections."
  - "Prevent: one schema as the single source of rules, reuse field components, and profile big forms before release."
cards:
  - q: Why is a big controlled form slow?
    a: Every field's value lives in the parent's state. Each key press changes state, so React re-renders the whole form and all its fields.
  - q: How does React Hook Form make forms faster?
    a: It uses uncontrolled inputs and refs, so typing doesn't re-render the whole form. It only re-renders what needs to change, like an error message.
  - q: Why use a schema library like Zod or Yup?
    a: All validation rules live in one place, they're easy to read and test, and Zod can also create the TypeScript type for the form.
  - q: How do you find out the form re-renders too much?
    a: Record typing in the React DevTools Profiler, or turn on "Highlight updates when components render" and watch the whole form flash.
  - q: Besides a library, what else helps a big form?
    a: Split it into small section components or steps, so each part only re-renders when its own data changes.
---

## 💡 What is it?

A form has about **20 fields**. For example, a candidate profile: name, email, phone, experience, skills, address and more.

Two problems show up:
1. **It's slow.** Typing feels laggy, especially on cheaper laptops or phones.
2. **It's hard to change.** There are 20 `useState` calls, 20 `onChange` handlers and a long list of `if` checks for validation.

## 🏠 Real-life example

Think of a **class register** where the teacher writes every student's mark.

The old way: every time **one** student's mark changes, the teacher **rewrites the whole register page**. Slow and tiring.

The better way: each student has their **own small slip**. Only that slip changes. The teacher collects all slips at the end. And there's **one rule sheet** for checking marks, instead of rules scattered everywhere.

- **Rewriting the whole page for one mark** = the whole form re-rendering on every key press.
- **Each student's own slip** = uncontrolled inputs (React Hook Form).
- **Collecting the slips at the end** = reading all values on submit.
- **One rule sheet** = one validation schema (Zod or Yup).

## 🔎 Detect

- Users say typing is slow, or letters appear late.
- In **React DevTools**, turn on **"Highlight updates when components render"**. Type one letter. If the **whole form** flashes, every field is re-rendering.
- Record a few key presses in the **Profiler**. It shows how long each render took and which components rendered.

## 🐞 Debug

1. Open the form component. Count the `useState` calls holding field values.
2. Check: does each key press call a `setState` in the **top** form component? Then everything below it re-renders.
3. Look for extra costs inside the form: big option lists rebuilt on every render, or validation that runs on every field each time.
4. Check how validation is written. Rules spread across handlers are a maintenance problem, even if speed is fine.

## 🔧 Fix

**Before — every field in the parent's state (slow and long):**

```jsx
import { useState } from 'react';                                      // bring in useState

function ProfileForm() {                                               // one big form component
  const [name, setName] = useState('');                                // ❌ field 1 in state
  const [email, setEmail] = useState('');                              // ❌ field 2 in state … and 18 more like this
  const [errors, setErrors] = useState({});                            // all error messages
  function onSubmit(e) {                                               // runs when the form is sent
    e.preventDefault();                                                // stop the page from reloading
    const next = {};                                                   // collect errors here
    if (!name) next.name = 'Name is required';                         // ❌ rules written by hand
    if (!email.includes('@')) next.email = 'Enter a valid email';      // ❌ … one if for every rule
    setErrors(next);                                                   // show the errors
  }                                                                    // end of onSubmit
  return (                                                             // what to draw
    <form onSubmit={onSubmit}>                                         {/* the form */}
      <input value={name} onChange={(e) => setName(e.target.value)} /> {/* ❌ each key press re-renders ALL fields */}
      <input value={email} onChange={(e) => setEmail(e.target.value)} /> {/* ❌ same here */}
      <button>Save</button>                                            {/* submit button */}
    </form>                                                            // end of form
  );                                                                   // end of return
}                                                                      // end of ProfileForm
```

**After — React Hook Form + one Zod schema:**

```jsx
import { useForm } from 'react-hook-form';                             // the form library
import { zodResolver } from '@hookform/resolvers/zod';                 // connects Zod rules to the form
import { z } from 'zod';                                               // the schema library

const schema = z.object({                                              // ✅ ALL rules in one place
  name: z.string().min(1, 'Name is required'),                         // name must not be empty
  email: z.email('Enter a valid email'),                               // must look like an email (Zod 4)
  experience: z.coerce.number().min(0, 'Must be 0 or more'),           // turn text into a number, then check it
});                                                                    // … add the other 17 fields here

function ProfileForm({ onSave }) {                                     // the same form, fixed
  const { register, handleSubmit, formState: { errors } } = useForm({  // set up the form
    resolver: zodResolver(schema),                                     // use the Zod rules for validation
  });                                                                  // end of useForm
  return (                                                             // what to draw
    <form onSubmit={handleSubmit(onSave)}>                             {/* onSave gets clean, valid data */}
      <input {...register('name')} />                                  {/* ✅ uncontrolled: typing doesn't re-render the form */}
      {errors.name && <p>{errors.name.message}</p>}                    {/* show the error only if there is one */}
      <input {...register('email')} />                                 {/* ✅ same for email */}
      {errors.email && <p>{errors.email.message}</p>}                  {/* email error */}
      <input type="number" {...register('experience')} />              {/* years of experience */}
      <button>Save</button>                                            {/* submit button */}
    </form>                                                            // end of form
  );                                                                   // end of return
}                                                                      // end of ProfileForm
```

Install with `npm install react-hook-form zod @hookform/resolvers`.

For even bigger forms, **split** them: `<PersonalSection />`, `<ExperienceSection />`, `<AddressSection />`, or a multi-step wizard. React Hook Form's `useFormContext` lets each section reach the same form.

## 🛡️ Prevent

- Choose a **form library** for any form with more than a few fields.
- Keep **one schema** per form as the single place for rules. With Zod, you can also share it with the backend and get the TypeScript type with `z.infer`.
- Build **reusable field components** (a text field with a label and an error message), so every form looks and behaves the same.
- Profile big forms once before release.
- Keep server validation too. Frontend validation helps users; the backend must still check everything. See [Request validation with Joi or Zod](topic:express/validation).

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I'd profile it first: usually every field lives in the parent's state, so each key press re-renders all 20 fields. I'd move it to React Hook Form, which uses uncontrolled inputs, put all rules in one Zod schema, and split the form into small sections. Then I'd profile again to confirm."

**Full version:**

> "First I confirm the cause with React DevTools. With 'Highlight updates' on, typing one letter flashes the whole form. The Profiler shows the top form component re-rendering on every key press, because all 20 values are in its state.
>
> The fix is React Hook Form. It registers inputs as uncontrolled, so typing doesn't re-render the form; only error messages update. For validation I write one Zod schema with every rule and plug it in with zodResolver. That also gives me a TypeScript type for the form data.
>
> For maintainability, I split the form into section components or steps, and reuse one field component for label, input and error.
>
> Then I profile again to show fewer renders, and I keep server-side validation as well."

[FILL IN: which form library your project uses and a form you built, if you have one. Only add it if it's true.]

## 🔁 Follow-up questions

### Controlled vs uncontrolled inputs — what's the difference?

**Controlled:** React state holds the value (`value={name}`), so every change re-renders. **Uncontrolled:** the browser's input holds the value, and you read it with a ref or on submit. React Hook Form uses uncontrolled inputs for speed.

### When is a controlled input still the right choice?

When another part of the UI must react to every key press. For example, a live character counter or a search-as-you-type box. Keep that state small and local.

### Zod or Yup?

Both work well. Zod is TypeScript-first and can create types from the schema, so many new projects choose it. Yup is older and common in Formik projects.

### How do you show errors from the server, like "email already exists"?

Use React Hook Form's `setError('email', { message: 'Email already exists' })` after the API call fails. It shows under the right field.

## ✅ Quick check

### 1. A form keeps 20 values in one `useState` object in the parent. What happens when you type one letter?

:::answer
**The whole form re-renders**, because the parent's state changed. All 20 fields render again for one key press.
:::

### 2. What does `{...register('email')}` give the input?

- A) A `value` prop from React state
- B) `name`, `ref`, `onChange` and `onBlur`, so the form library can read it without re-rendering the form
- C) A Zod schema

:::answer
**B.** `register` connects the input to the form using a ref and event handlers. The value stays in the input itself.
:::
