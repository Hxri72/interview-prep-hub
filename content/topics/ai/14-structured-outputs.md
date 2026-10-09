---
title: Structured outputs with JSON Schema and Zod
stack: ai
order: 14
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Structured output means the model replies in fixed JSON that matches a schema, so your code can use it safely.
  - "Two layers: ask the provider to follow a JSON Schema (structured outputs feature), AND validate the result in your code (Zod)."
  - "Always plan for failure: retry once with the error message, then fall back (empty form, default value, or a human)."
  - Zod gives you the runtime check and the TypeScript type from one schema.
  - Validate before saving to the database or calling another service — AI output is untrusted input.
cards:
  - q: What is a structured output?
    a: An LLM reply forced into fixed JSON that matches a schema, so code can read fields like title and skills without guessing.
  - q: Why validate even when the provider supports structured outputs?
    a: The schema feature guarantees shape, not truth or business rules. Also, older models, refusals or a max_tokens cut-off can still give bad data. Validation is your safety net.
  - q: What do you do when validation fails?
    a: Retry once (optionally sending the validation errors back), then fall back — a default value, an empty form, or a human review queue. Log every failure.
  - q: Why Zod for this?
    a: One Zod schema gives both a runtime check (safeParse) and a TypeScript type (z.infer), and the SDKs can turn it into JSON Schema for the provider.
  - q: Have you used structured outputs?
    a: Yes — the OpenAI-based job-description chatbot backend I built at SkillKeepr, where the generated JD had to be consumed reliably by other code.
---

## 💡 What is it?

Normally an [LLM](glossary:llm) replies with free text. Your code can't easily use a paragraph.

A **[structured output](glossary:structured-output)** is a reply in fixed JSON that matches a [schema](glossary:schema). For example: `{ "title": "...", "skills": [...], "minYears": 3 }`.

You do it in two layers:
1. **Ask** the provider to follow your JSON Schema (its structured-outputs feature).
2. **Check** the reply in your own code with a validator like Zod, before you use it.

## 🏠 Real-life example

Think of **a school admission form**.

If you ask parents to "write about your child", every answer looks different. The office can't type it into the computer.

So the school hands out a **form with boxes**: Name, Date of birth, Class. Then a clerk **checks** each form: is the date real? Is the class between 1 and 12? Bad forms go back to the parent. If it is still wrong, the clerk calls the parent.

Mapping:
- **The parent** = the LLM.
- **The form with boxes** = the schema (JSON Schema / Zod).
- **The clerk checking** = validation in your code (`safeParse`).
- **Sending the form back** = retrying.
- **Calling the parent** = the fallback (a human or a default).
- **The office computer** = your database and other services.

## 🧑‍💻 Code example

This runs **without an API key**. A fake model returns bad JSON first, then good JSON. We validate with Zod, retry once, and fall back if needed.

```bash
npm init -y && npm pkg set type=module   # new project with import/export
npm install zod                          # Zod 4, the validation library
node structured.mjs                      # run the file below
```

```js
import { z } from 'zod';                                         // Zod checks data at runtime

const JobDraft = z.object({                                      // the SHAPE we need back from the model
  title: z.string().min(3),                                      // job title, at least 3 characters
  skills: z.array(z.string()).nonempty(),                        // a LIST of skills, at least 1
  minYears: z.number().int().min(0).max(30),                     // whole number of years, 0–30
  remote: z.boolean(),                                           // true or false, not "yes"
});                                                              // end of the schema

const fakeReplies = [                                            // pretend the model answers twice
  '{"title":"Node.js Developer","skills":"Node, Mongo","minYears":"3","remote":"yes"}', // try 1: wrong types
  '{"title":"Node.js Developer","skills":["Node.js","MongoDB"],"minYears":3,"remote":true}', // try 2: correct
];                                                               // end of fake replies
let call = 0;                                                    // counts how many times we "called" the model
const fakeModel = async () => fakeReplies[call++];               // returns the next fake reply

async function getJobDraft() {                                   // ask for JSON, check it, retry once
  for (let attempt = 1; attempt <= 2; attempt++) {               // at most 2 attempts
    const text = await fakeModel();                              // get the model's raw text
    let data;                                                    // will hold the parsed JSON
    try { data = JSON.parse(text); }                             // step 1: is it valid JSON at all?
    catch { console.log(`attempt ${attempt}: not JSON`); continue; } // no → try again
    const result = JobDraft.safeParse(data);                     // step 2: does it match the schema?
    if (result.success) return result.data;                      // yes → return clean, typed data
    console.log(`attempt ${attempt}: invalid →`,                 // no → show what was wrong
      result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ')); // one line per problem
  }                                                              // end of attempts
  return null;                                                   // still bad after 2 tries → fallback
}                                                                // end of getJobDraft

const draft = await getJobDraft();                               // run it
console.log(draft ?? 'FALLBACK: show the recruiter an empty form'); // use the data, or fall back safely
```

**Real output:**

```text
attempt 1: invalid → skills: Invalid input: expected array, received string | minYears: Invalid input: expected number, received string | remote: Invalid input: expected boolean, received string
{
  title: 'Node.js Developer',
  skills: [ 'Node.js', 'MongoDB' ],
  minYears: 3,
  remote: true
}
```

When I made **both** fake replies bad, it printed two `invalid` lines and then `FALLBACK: show the recruiter an empty form`. The app never crashed, and bad data never reached the database.

## 🔍 Deeper version

**Layer 1 — make the provider follow the schema.** Modern APIs can **constrain** the model, so it can only produce JSON that matches your schema. With the Anthropic SDK you pass a Zod schema and use `messages.parse()`. This **needs `ANTHROPIC_API_KEY`**:

```js
import Anthropic from '@anthropic-ai/sdk';                       // the official SDK
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'; // turns a Zod schema into JSON Schema
const client = new Anthropic();                                  // key from ANTHROPIC_API_KEY
const response = await client.messages.parse({                   // parse() = call + validate
  model: 'claude-opus-5-5',                                      // which model
  max_tokens: 16000,                                             // room for the answer
  messages: [{ role: 'user', content: 'Draft a JD: Node dev, 3+ yrs, remote.' }], // the request
  output_config: { format: zodOutputFormat(JobDraft) },          // the schema the reply must follow
});                                                              // end of the request
console.log(response.parsed_output);                             // typed object, or null if parsing failed
```

I tested this with a fake server. The SDK sent `output_config.format.type = "json_schema"` with the fields `title, skills, minYears, remote`, and returned the typed object in `parsed_output`.

The OpenAI SDK has the same idea, with helpers like `zodResponseFormat` (Chat Completions) and `zodTextFormat` (Responses API).

**Layer 2 — still validate in your code.** The schema feature guarantees the **shape**. It does not guarantee:
- the **truth** (the model can still put a wrong skill in a valid list),
- your **business rules** (for example, "salary max ≥ salary min"),
- a complete answer, if it was cut off at `max_tokens` or the model refused.

So check `stop_reason`, check `parsed_output !== null`, and run your own rules.

**The retry → fallback pattern.**

| Step | What happens |
|---|---|
| 1. Call | ask for JSON with a schema |
| 2. Validate | `JSON.parse` + `safeParse` + business rules |
| 3. Retry once | optionally include the validation errors: "Fix these problems: …" |
| 4. Fallback | default value, empty form, or a human review queue |
| 5. Log | prompt version, raw output, errors — so you can fix the prompt later |

**One schema, three uses.** A Zod schema gives you:
- the runtime check (`safeParse`),
- the TypeScript type (`type JobDraft = z.infer<typeof JobDraft>`),
- the JSON Schema for the provider (via the SDK helper).

So the types, the validation and the AI contract can't drift apart. See [Zod](topic:typescript/zod).

**Related: strict tool inputs.** For [tool calling](topic:ai/tool-calling), you can set `strict: true` on a tool, so the model's tool arguments always match the tool's schema.

## 🎯 Why do we use it?

Real features need data, not paragraphs:
- a job description saved to the database,
- a candidate score passed to another service,
- fields filled into a form.

If the AI's reply is free text, one strange answer can crash the next step. Structured outputs, plus validation, make AI output **reliable enough for code to consume**.

## ⚠️ Common mistakes

- **Trusting the JSON without validating.** AI output is untrusted input, just like a user's form.
- **No fallback.** When the second try fails too, the app must still do something sensible.
- **Business rules only in the prompt.** "minYears must be 0–30" belongs in the schema/validator, not only in words.
- **Ignoring `stop_reason`.** A reply cut at `max_tokens` can be half an object.

## 🗣️ How to answer in an interview

> "A structured output means the model replies in JSON that matches a schema, so other code can consume it. I use two layers. First, I give the provider a JSON Schema — usually generated from a Zod schema — so the model is constrained to that shape. Second, I validate the result in my own code with Zod's safeParse, plus business rules, because the schema guarantees shape but not truth, and a reply can still be cut off or refused.
>
> If validation fails, I retry once, sometimes passing back the validation errors, and if it fails again I fall back — a default value, an empty form, or a human review. I log the failures with the prompt version so we can improve the prompt. I used structured outputs in the OpenAI-based job-description chatbot backend I built at SkillKeepr, so the generated JD could be consumed reliably."

[FILL IN: how your JD chatbot backend validated the AI output — Zod, Joi, JSON Schema, or the provider's feature — and what it did on failure.]

## 🔁 Follow-up questions

### What happens if the model returns invalid JSON?

`JSON.parse` throws, or `safeParse` fails. You catch it, retry once (maybe with the errors), then use a fallback. You never pass unvalidated data on. See [the resume story](topic:resume/openai-structured-outputs).

### Structured outputs vs "please reply in JSON" in the prompt?

The prompt-only way usually works but can fail: extra text, missing fields, wrong types. The structured-outputs feature constrains the model, so the shape is reliable. Validate in both cases.

### How do you keep the TypeScript type and the schema in sync?

Write the Zod schema once and get the type with `z.infer`. The same schema produces the JSON Schema for the provider.

### Can a valid JSON object still be wrong?

Yes. It can have the right shape but wrong facts, like a skill the JD never mentioned. Use business-rule checks, sampling reviews and [evals](topic:ai/evals) for quality.

## ✅ Quick check

### 1. The model returns `"minYears": "3"`. Does `z.number()` accept it?

:::answer
**No.** `"3"` is a string, not a number, so `safeParse` fails with "expected number, received string". (You could use `z.coerce.number()` if you choose to accept strings.)
:::

### 2. The provider's structured-outputs feature is on. Do you still need validation?

- A) No, the shape is guaranteed
- B) Yes — for business rules, truth, cut-offs and refusals

:::answer
**B.** The feature guarantees the **shape**, not correct facts or your business rules. A reply can also be cut off or refused.
:::

### 3. Validation fails twice. What should the code do?

:::answer
**Fall back safely** — a default value, an empty form, or a human review queue — and **log** the failure. Never pass the bad data on.
:::
