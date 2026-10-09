---
title: OpenAI JD chatbot with schema-validated structured outputs
template: story
stack: resume
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "The feature: an AI chatbot that helps recruiters create job descriptions (JDs)."
  - The recruiter gives only the high-level details. OpenAI writes the rest of the JD.
  - I built the backend. Another developer built the frontend.
  - Structured outputs mean the AI replies in fixed JSON that the code can trust, checked against a schema.
  - If the AI reply doesn't match the schema, the backend must retry, fix or reject it — never save it blindly.
cards:
  - q: What does the JD chatbot do?
    a: A recruiter gives high-level job details, like role, skills and experience. OpenAI generates the full job description from them.
  - q: Which part did you build?
    a: The backend. Another developer built the chat screen on the frontend.
  - q: What is a structured output?
    a: The AI is asked to reply in JSON that matches a fixed schema. The backend checks it before using it, so other code can trust the data.
  - q: What do you do if the AI returns invalid JSON?
    a: "The standard approach is to validate it, retry once with the error, and fall back or show an error if it still fails. [FILL IN: what your backend did]"
  - q: Why not just save the AI's plain text?
    a: Other parts of the system need fields like title, skills and experience separately. Plain text can't be used reliably by code.
---

## 💡 What is it?

At SkillKeepr, recruiters can create job descriptions (JDs) with an **AI chatbot**.

The recruiter only gives the important high-level details. OpenAI fills in the rest and writes the full JD.

I built the **backend** for this feature. Another developer built the frontend.

## 🏠 Real-life example

Think of asking a **friend who writes well** to fill a school form for you.

You tell them: "Name, class, three hobbies." They write the full form neatly.

But the form has **fixed boxes**. Name goes in the name box. Hobbies go in the hobbies box. If your friend writes a story across all the boxes, the office can't use the form.

- **You** = the recruiter, giving high-level details.
- **Your friend** = OpenAI, writing the full JD.
- **The fixed boxes** = the schema (structured output).
- **The office checking the form** = the backend validating the reply.

## 🧩 The problem

Writing a full job description takes recruiters a lot of time. Most JDs have the same parts: summary, responsibilities, skills, experience.

The AI can write these parts. But the backend needs them as **separate fields**, not one big paragraph. Other features use these fields, like candidate matching and the JD form.

[FILL IN: anything specific — how long recruiters spent on JDs before, or what problem the product team wanted to solve.]

## 🛠️ What I built

The **backend** of the AI JD chatbot.

```text
Recruiter types high-level details in the chat
        │
Backend receives the message ─► sends it to the AI with instructions
        │
AI replies ─► backend checks the reply ─► saves the conversation
        │
When the recruiter is happy ─► backend creates the job description
```

**How structured outputs usually work (general idea):**
- You give the model a **schema**: the exact fields and types you want back.
- The model replies in JSON.
- The backend **validates** the JSON against the schema before using it.

Example (not the real SkillKeepr schema):

```js
const JobDescriptionSchema = z.object({          // the shape we expect from the AI
  title: z.string(),                             // job title, e.g. "Node.js Developer"
  summary: z.string(),                           // a short paragraph about the role
  skills: z.array(z.string()),                   // list of skills, e.g. ["Node.js", "MongoDB"]
  minExperienceYears: z.number().min(0),         // minimum years of experience, 0 or more
});                                              // end of the schema
```

[FILL IN: confirm how the backend validated the AI output — JSON Schema, Zod, Joi, or the OpenAI SDK's structured output option.]
[FILL IN: which fields the AI returned.]
[FILL IN: the resume also says "text assistant" — what was it, and did you work on it?]

## 🧗 The hard part

**How this usually goes:** AI replies are not always perfect. Sometimes a field is missing. Sometimes the JSON is broken. Sometimes the text is too long. The backend must handle all of this without breaking the recruiter's chat.

[FILL IN: the real hard part for you — invalid replies, slow replies, keeping the conversation history, or something else.]
[FILL IN: what happened when validation failed — retry, default values, or an error message.]

## 🏆 The result

Recruiters can create a full job description from a few high-level details. The backend only saves AI replies that match the expected structure.

[FILL IN: any result — time saved per JD, number of JDs created this way, or feedback.]

## 🗣️ How to answer in an interview

> "At SkillKeepr I built the backend of an AI chatbot that helps recruiters create job descriptions. The recruiter gives the high-level details, like the role and key skills, and OpenAI generates the rest of the JD. Another developer built the frontend.
>
> The important part was making the AI's reply usable by code. Other features need the JD as separate fields, not one paragraph. So we asked the model for structured output, JSON that matches a schema, and validated it before saving.
>
> [FILL IN: how you validated it and what happened when validation failed.]
>
> The hard part was [FILL IN]. The result is that recruiters can create a full JD in a few steps."

## 🔁 Follow-up questions

### What if the model returns invalid JSON?

The standard approach: validate, retry once and include the validation error in the retry, then fall back or show a clear error. Never save unvalidated output. [FILL IN: what you did.]

### How do you control the cost of AI calls?

Common ways: short prompts, a smaller model for simple steps, limits per user or tenant, and logging token usage. [FILL IN: what you did, if anything.]

### How do you stop prompt injection in a chatbot?

Keep system instructions separate from user text. Validate the output. Don't let the model trigger risky actions on its own. [FILL IN: any measures in your feature.]

### Why OpenAI and not another model?

[FILL IN: the real reason — team choice, existing account, quality.]

### Where do types help here?

TypeScript types describe the data at coding time. But AI output arrives at runtime, so you still need runtime validation like Zod or Joi.

## 📚 Topics to revise

- [Structured outputs](topic:ai/structured-outputs)
- [Tool calling](topic:ai/tool-calling)
- [Request validation with Joi or Zod](topic:express/validation)
- [async/await and error handling](topic:javascript/async-await)
- [Error handling in Node](topic:nodejs/error-handling)
