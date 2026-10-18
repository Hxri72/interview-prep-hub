---
title: OpenAI JD chatbot with schema-validated structured outputs
template: story
stack: resume
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "The feature: an AI chatbot that helps recruiters create job descriptions (JDs). The recruiter gives the high-level details, and OpenAI writes the rest."
  - I built the backend. Another developer built the frontend.
  - Structured outputs mean the AI replies in fixed JSON that the code can trust, checked against a schema.
  - "The flow: frontend → our Node.js backend → a Python agent that calls OpenAI → back to our backend. I mapped and validated the reply into our JD shape."
  - The JD goes back to the recruiter as a preview. It is saved to MongoDB only after the recruiter confirms it.
cards:
  - q: What does the JD chatbot do?
    a: A recruiter gives high-level job details, like role, skills and experience. OpenAI generates the full job description from them.
  - q: Which part did you build?
    a: The backend. Another developer built the chat screen on the frontend.
  - q: What is a structured output?
    a: The AI is asked to reply in JSON that matches a fixed schema. The backend checks it before using it, so other code can trust the data.
  - q: What do you do if the AI returns invalid JSON?
    a: "We extract the fields we need, map them to our schema, and validate them. A field we can rebuild from the recruiter's request is filled in; a field with the wrong type is not treated as valid. [FILL IN: what happened next — retry or error]"
  - q: Was the generated JD saved straight away?
    a: No. The backend returned it to the frontend as a preview. It was saved to MongoDB only after the recruiter reviewed and confirmed it.
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

The **backend** of the AI JD chatbot. The AI part itself runs in a separate **Python agent** that talks to OpenAI.

```text
Recruiter types: "MERN stack developer, 3 years"
        │
Frontend ─► our Node.js / Express backend
        │
Backend ─► Python agent ─► OpenAI writes the JD
        │                     (e.g. adds MongoDB, Express.js, React, Node.js as skills)
        ▼
Backend gets the reply back
        │
Backend maps the reply to our JD shape and validates it
        │
Frontend shows a preview ─► recruiter reviews and edits
        │
Recruiter confirms ─► backend saves the JD in MongoDB
```

**Why mapping was needed.** The Python agent's reply did not always have the exact shape our backend expected. So I:
1. took out the fields we needed,
2. mapped them to our JD fields,
3. filled a field from the recruiter's request when we could rebuild it,
4. treated a field with a wrong type or shape as **not valid**.

Example of the idea (not the real SkillKeepr code). Save it as `map-jd.js` and run `node map-jd.js`:

```js
const aiReply = { job_title: 'MERN Developer', skills: 'React, Node.js' }; // a messy AI reply: wrong field name, skills as one string
const request = { role: 'MERN Developer', experience: 3 };                  // what the recruiter typed (3 = years)

function mapJd(reply, req) {                                    // turns the AI reply into our JD shape
  const skills = typeof reply.skills === 'string'               // did the AI send skills as one string?
    ? reply.skills.split(',').map((s) => s.trim())              // yes → split at commas into a list
    : reply.skills;                                             // no → use it as it is
  const jd = {                                                  // the shape our backend expects
    title: reply.title ?? reply.job_title ?? req.role,          // try each name; fall back to the recruiter's role
    skills,                                                     // the list of skills
    minExperienceYears: reply.minExperienceYears ?? req.experience, // rebuild from the request if missing
  };                                                            // end of jd
  if (!Array.isArray(jd.skills)) throw new Error('skills is not a list'); // wrong shape → not valid data
  if (typeof jd.minExperienceYears !== 'number') throw new Error('experience is not a number'); // wrong type → not valid
  return jd;                                                    // safe to send to the frontend as a preview
}                                                               // end of mapJd

console.log(mapJd(aiReply, request));                           // print the mapped JD
```

```text
{
  title: 'MERN Developer',
  skills: [ 'React', 'Node.js' ],
  minExperienceYears: 3
}
```

[FILL IN: the real JD fields and how the backend validated them. Don't name a validation library until you check the code.]
[FILL IN: the resume also says "text assistant" — what was it, and did you work on it?]

## 🧗 The hard part

**The AI reply's shape changed.** Sometimes a field was missing, named differently, or the wrong type. The backend had to turn every reply into the same predictable shape, so the frontend never broke.

**Deciding what to fix and what to reject.** A missing title can come from the recruiter's request. But a broken skills field can't be guessed. So we only filled in fields we could rebuild safely.

[FILL IN: what happened when validation failed — retry, default values, or an error message.]

## 🏆 The result

- Recruiters can create a full job description from a few high-level details.
- The frontend always gets the same JD shape, so the preview doesn't break.
- Nothing is saved until the recruiter confirms it, so bad AI text never lands in the database by itself.

[FILL IN: any result — time saved per JD, number of JDs created this way, or feedback.]

## 🗣️ How to answer in an interview

> "At SkillKeepr I built the backend of an AI feature that helps recruiters create job descriptions. Another developer built the frontend.
>
> The recruiter types the high-level request, like 'MERN stack developer'. The frontend sends it to our Node.js and Express backend. The backend calls a Python agent that uses OpenAI to generate the JD. For a MERN role, it adds skills like MongoDB, Express, React and Node.
>
> The reply didn't always match the structure our backend expected. So I extracted the fields we needed, mapped them to our schema, and validated them. If a field could be rebuilt from the original request, we normalised it. If a field had the wrong type, we didn't treat it as valid.
>
> Then we returned the JD to the frontend as a preview. It was saved to MongoDB only after the recruiter reviewed and confirmed it."

## 🔁 Follow-up questions

### Why did the backend need to map and validate the AI response?

AI output can change shape from one reply to the next. The frontend needs one predictable structure. So the backend takes out the needed fields, maps them to our schema and checks them before sending them on.

### Why not save the JD as soon as the AI writes it?

The AI can make mistakes. The recruiter must check it first. So we show a preview and save to MongoDB only after the recruiter confirms.

### Why is there a Python agent between your backend and OpenAI?

The AI logic lived in a separate Python agent. Our Node.js backend called it and handled the mapping, validation and saving. [FILL IN: why the team chose Python for the agent, if you know]

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
