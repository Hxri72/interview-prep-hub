---
title: "Forms, labels and input types"
stack: html-css
order: 4
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "A form groups inputs. A label tells the user (and screen readers) what to type."
  - "Connect a label to its input with for + id, or by wrapping the input inside the label."
  - "Use the right input type (email, tel, number, date, password) to get the right phone keyboard and free checks."
  - "Built-in checks: required, minlength, maxlength, min, max, pattern."
  - "Browser checks are for comfort only. The server must always validate again."
cards:
  - q: Why does every input need a label?
    a: The label tells users and screen readers what the field is. Clicking the label also focuses the input.
  - q: How do you connect a label to an input?
    a: Give the input an id and the label a matching for attribute, or put the input inside the label.
  - q: Why use type="email" instead of type="text"?
    a: Phones show an email keyboard with @, and the browser checks the format before submit.
  - q: Is placeholder a replacement for a label?
    a: No. The placeholder disappears when you type, and it often has low contrast. Always use a real label.
  - q: Is browser validation enough?
    a: No. Anyone can skip it. The server must validate every request again.
---

## 💡 What is it?

A **form** collects information from the user, like a login or a job application.

Inside the form you put **inputs** (text boxes, checkboxes, dropdowns) and a **label** for each one. The label says what to type. The `type` of an input tells the browser what kind of data it is, like an email or a date.

## 🏠 Real-life example

Think of a **school admission form on paper**.

- The **whole sheet** = the `<form>`.
- Each **printed word like "Name:"** = a `<label>`.
- Each **empty box to write in** = an `<input>`.
- A box that says **"Date of birth: DD/MM/YYYY"** = an input with `type="date"`.
- A **"Required" star** = the `required` attribute.
- The **office clerk who checks the form again** = the server. Even if you filled it neatly, they still check.

## 🧑‍💻 Code example

Save as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                                       <!-- modern HTML5 page -->
<html lang="en">                                                      <!-- page language: English -->
<head>                                                                <!-- page info -->
  <meta charset="UTF-8">                                              <!-- text encoding -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- fit the phone screen -->
  <title>Apply</title>                                                <!-- tab title -->
</head>                                                               <!-- end of head -->
<body>                                                                <!-- visible content -->
  <form action="/apply" method="post">                                <!-- send to /apply with a POST request -->
    <label for="name">Full name</label>                               <!-- label; for="name" links it to id="name" -->
    <input id="name" name="name" required minlength="2">              <!-- required = can't be empty; minlength="2" = at least 2 letters -->

    <label for="email">Email</label>                                  <!-- label for the email box -->
    <input id="email" name="email" type="email" required>             <!-- type="email" = phone shows @ keyboard and checks the format -->

    <label for="exp">Years of experience</label>                      <!-- label for the number box -->
    <input id="exp" name="exp" type="number" min="0" max="40">        <!-- only numbers from 0 to 40 -->

    <label><input type="checkbox" name="remote"> Open to remote</label> <!-- input wrapped in the label = also linked -->

    <button type="submit">Apply</button>                              <!-- submits the form -->
  </form>                                                             <!-- end of form -->
</body>                                                               <!-- end of body -->
</html>                                                               <!-- end of page -->
```

```text
Click "Apply" with everything empty: the browser stops and says
"Please fill out this field" under Full name.

Type "abc" in Email and submit: "Please include an '@' in the email address".
Type 50 in experience: "Value must be less than or equal to 40".
Click the words "Open to remote": the checkbox toggles, because the label is linked.
```

## 🔍 Deeper version

**Useful input types:**

| type | What you get |
|---|---|
| `email` | @ keyboard on phones, format check |
| `tel` | number pad on phones (no format check) |
| `number` | number field with min, max, step |
| `password` | hides the characters |
| `date`, `time` | built-in date and time pickers |
| `file` | file chooser; `accept=".pdf"` limits file types |
| `search` | search box, often with a clear button |
| `checkbox`, `radio` | on/off and pick-one choices |

**Built-in validation attributes:** `required`, `minlength`, `maxlength`, `min`, `max`, `step`, `pattern` (a [regex](glossary:regex)). CSS can style them with `:invalid` and `:user-invalid` (shows the error only after the user touched the field).

**Helpful attributes:**
- `name` is the key sent to the server (`name=Hari`). Without it, the value isn't sent.
- `autocomplete="email"` lets the browser fill saved data.
- `inputmode="numeric"` shows a number keyboard without number-type quirks.
- `aria-describedby` links an input to a help or error message.

**Grouping.** Use `<fieldset>` with a `<legend>` for groups like radio buttons ("Work mode: Remote / Hybrid / Office").

**Button types.** A `<button>` inside a form is `type="submit"` by default. Use `type="button"` for buttons that should **not** submit.

**In React** you usually handle the submit with JavaScript and a library like React Hook Form + Zod. The HTML rules (labels, types, names) still matter. See [forms and validation in React](topic:react/forms-validation).

**Security.** Browser checks are **only for comfort**. Anyone can send a request without your form, using curl or DevTools. The server must validate everything again. See [validation in Express](topic:express/validation).

## 🎯 Why do we use it?

- **Better user experience.** The right keyboard on phones, instant error messages, autofill.
- **Accessibility.** Labels tell screen reader users what each field is.
- **Less JavaScript.** Many checks are free in the browser.

## ⚠️ Common mistakes

- **Using placeholder as the label.** It disappears when typing and is often hard to read.
- **Missing `name`**, so the value never reaches the server.
- **A plain `<button>` in a form** that you didn't want to submit. Add `type="button"`.
- **Trusting browser validation** and skipping server validation.

## 🗣️ How to answer in an interview

> "A form groups inputs, and every input needs a real label, linked with for and id or by wrapping the input. That helps screen readers, and clicking the label focuses the field. I choose the right input type — email, tel, number, date — because phones then show the right keyboard and the browser gives free checks like required, min, max and pattern.
>
> But browser validation is only for user comfort. Anyone can bypass it, so the backend validates every request again, for example with Joi or Zod. In React I usually use React Hook Form with a Zod schema, but the HTML basics — labels, names and types — still apply."

## 🔁 Follow-up questions

### What is the difference between `name` and `id` on an input?

`id` is for the page: labels and CSS/JS use it, and it must be unique. `name` is for the data: it's the key sent to the server with the value.

### GET vs POST for a form?

GET puts the values in the URL, which is good for search filters you want to share. POST sends them in the request body, which is right for creating data and for passwords.

### How do you show a custom error message under a field?

Show the message in an element with an `id`, and link the input to it with `aria-describedby`. Add `aria-invalid="true"` while it's wrong.

## ✅ Quick check

### 1. Which input type shows an @ key on most phone keyboards?

:::answer
**`type="email"`.** It also checks the email format before submit.
:::

### 2. A button inside a form has no `type`. What happens when you click it?

:::answer
**It submits the form.** The default type inside a form is `submit`. Add `type="button"` if it shouldn't submit.
:::

### 3. True or false: if the form has `required` on every field, the server doesn't need to check for empty values.

:::answer
**False.** Browser checks can be skipped. The server must validate every request.
:::
