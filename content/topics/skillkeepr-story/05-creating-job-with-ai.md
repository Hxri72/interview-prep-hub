---
template: chapter
title: Creating a job with AI (the JD chatbot)
stack: skillkeepr-story
order: 5
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Priya types a few lines about the job. An AI writes the full job description (JD)."
  - "Flow: React frontend → Node backend → Python agent that calls OpenAI → back to Node."
  - The AI reply did not always match our JD shape, so the Node backend maps and validates it first.
  - The JD is shown as a preview. It is saved to MongoDB only after Priya confirms.
  - "My part: I built the backend. Another developer built the frontend."
cards:
  - q: How does the AI JD feature work end to end?
    a: The recruiter gives high-level details. The Node backend sends them to a Python agent that calls OpenAI. The reply comes back, Node maps and validates it into our JD shape, and the recruiter sees a preview.
  - q: Why validate the AI reply at all?
    a: An AI model does not always return the exact shape your code expects. A missing title or a wrong field name would break the screen or save bad data.
  - q: Why save only after the recruiter confirms?
    a: The AI can be wrong. The recruiter is the human check, so nothing goes into the database until they approve it.
  - q: What was your part in this feature?
    a: I built the backend — the API, calling the Python agent, mapping and validating the AI response, and saving after confirmation. Another developer built the frontend.
  - q: What do you do when the AI reply fails validation?
    a: "Return a clear error and let the system retry or let the recruiter edit it, instead of saving bad data. [FILL IN: what your backend actually did]"
---

## 💡 What happens in this chapter

Priya works at **Acme Hiring**. She needs a job post for a Node.js developer.

Writing a full [job description](topic:resume/openai-structured-outputs) takes time. So she types a few lines into a chat box: the title, the level, and some key skills.

An AI writes the rest. Priya checks a **preview**, edits it if needed, and clicks **Confirm**. Only then is the job saved.

## 🏠 Real-life example

Think of a **school notice** written with a helper.

The class teacher tells a senior student: "Write a notice for sports day, Friday, ground, 9 AM." The student writes a full notice. But the student sometimes forgets the time or uses the wrong format.

- **The class teacher** = Priya, the recruiter.
- **The short instructions** = her few lines in the chat box.
- **The senior student** = the AI (OpenAI, called by the Python agent).
- **The office clerk who checks the format** = the Node backend that maps and validates the reply.
- **The teacher signing the notice** = Priya clicking Confirm.
- **Pinning it on the notice board** = saving it to MongoDB.

## 🗺️ The flow

```text
Priya's browser (React)
   │  1. POST high-level JD details
   ▼
Node backend (API)
   │  2. sends the details to the AI agent
   ▼
Python agent  ──►  OpenAI
   │  3. returns a generated JD (shape not always right)
   ▼
Node backend
   │  4. maps fields + validates (title, level, skills, description)
   │     ├─ valid   → 5. return a PREVIEW (not saved yet)
   │     └─ invalid → return a clear error / retry
   ▼
Priya reviews and edits the preview
   │  6. clicks Confirm
   ▼
Node backend  ──►  MongoDB (JD saved)
```

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| Chat box and preview | React | [Calling APIs in React](topic:react/calling-apis) |
| The API | Node.js backend | [REST resource design](topic:rest-auth/resource-urls) |
| Calling the AI | Python agent → OpenAI | [Calling an LLM API](topic:ai/calling-llm-api) |
| Getting a fixed shape back | Structured output + validation | [Structured outputs](topic:ai/structured-outputs) |
| Wrong or made-up details | Hallucination checks | [Hallucination](topic:ai/hallucination) |
| Saving the job | MongoDB | [Schema validation](topic:mongodb/schema-validation) |
| Talking between services | HTTP between Node and Python | [Service communication](topic:architecture/service-communication) |

## 🧑‍💻 Key code idea

The heart of my part: turn an **untrusted AI reply** into a **clean JD**, or reject it. This is plain JavaScript, so you can see every check.

Save it as `jd-map.js` and run `node jd-map.js`.

```js
const LEVELS = ['junior', 'mid', 'senior'];                 // the only levels our JD form accepts

function mapAndValidateJD(raw) {                           // raw = whatever the AI agent sent back
  const errors = [];                                       // collect every problem, not just the first
  const jd = {                                             // build the shape our database expects
    title: String(raw.title ?? raw.jobTitle ?? '').trim(), // the AI sometimes says "jobTitle" instead of "title"
    level: String(raw.level ?? '').toLowerCase(),          // "Senior" → "senior"
    skills: Array.isArray(raw.skills)                      // skills must end up as an array
      ? raw.skills                                         // already an array → keep it
      : String(raw.skills ?? '').split(','),               // a comma string → split into an array
    description: String(raw.description ?? '').trim(),     // the long text of the job
  };                                                       // end of the mapped JD
  jd.skills = jd.skills.map((s) => String(s).trim()).filter(Boolean); // clean spaces and drop empty items
  if (!jd.title) errors.push('title is missing');          // a job must have a title
  if (!LEVELS.includes(jd.level)) errors.push(`level "${jd.level}" is not allowed`); // only our 3 levels
  if (jd.skills.length === 0) errors.push('skills are missing'); // at least one skill
  if (jd.description.length < 20) errors.push('description is too short'); // 20 = our minimum length
  return errors.length ? { ok: false, errors } : { ok: true, jd }; // ok → preview it; not ok → retry or ask the recruiter
}                                                          // end of mapAndValidateJD

const good = { jobTitle: 'Node.js Developer', level: 'Senior', skills: 'Node.js, MongoDB, AWS', description: 'Build and run backend APIs for Acme Hiring.' }; // a usable reply with small shape differences
const bad = { title: '', level: 'Expert', skills: [], description: 'Short' }; // a broken reply

console.log(JSON.stringify(mapAndValidateJD(good)));       // expect ok: true with a cleaned JD
console.log(JSON.stringify(mapAndValidateJD(bad)));        // expect ok: false with 4 errors
```

```text
{"ok":true,"jd":{"title":"Node.js Developer","level":"senior","skills":["Node.js","MongoDB","AWS"],"description":"Build and run backend APIs for Acme Hiring."}}
{"ok":false,"errors":["title is missing","level \"expert\" is not allowed","skills are missing","description is too short"]}
```

The first reply had small shape problems ("jobTitle", "Senior", a comma string). The mapper fixed them. The second reply was broken, so it was rejected with every reason listed.

## 🧗 Hard parts and trade-offs

- **The AI shape changes.** The same request can come back with different field names or types. Mapping must be forgiving, but validation must be strict.
- **Two services, two languages.** Node calls a Python agent over HTTP. You need timeouts and clear errors when the agent is slow or down. See [a third-party API is down](topic:debugging/third-party-api-down).
- **Preview before save.** Saving straight away would be simpler. But a wrong AI answer would then sit in the database. The confirm step keeps a human in control.
- **Cost and time.** Every AI call costs money and takes seconds. See [controlling AI cost and latency](topic:ai/cost-latency).

## 🙋 My part

- I built the **backend** of this feature. Another developer built the frontend.
- The backend sends the recruiter's details to a **Python agent** that calls OpenAI, and receives the result.
- The AI response **did not always match** the expected JD shape. I **mapped and validated** it into the shape our system expects.
- The JD is returned for **preview**, and saved to **MongoDB only after the recruiter confirms**.
- Validation library used: [FILL IN: the library or approach you used — don't guess].
- What happened on a validation failure: [FILL IN: retry, error message, or let the recruiter edit].

## 🗣️ How to explain it in an interview

> "Recruiters on our platform can create a job description with AI. They give the high-level details, like title, level and key skills. I built the backend for this. The Node API sends the details to a Python agent, which calls OpenAI and returns a generated JD.
>
> The tricky part was that the AI response didn't always match the shape our system expects. Field names or types could differ, or something could be missing. So I mapped the response into our JD structure and validated it before using it. The JD goes back to the frontend as a preview, and we save it to MongoDB only after the recruiter confirms. That keeps a human check on anything the AI writes."

## 🔁 Follow-up questions

### Why not let the frontend call OpenAI directly?

The API key would be exposed in the browser, and anyone could use it. Calls must go through the backend. See [client and server](topic:web-fundamentals/client-server).

### How would you make the AI reply more reliable?

Ask for a fixed JSON schema (structured outputs), keep a low temperature, validate the result, and retry once on failure. See [structured outputs](topic:ai/structured-outputs).

### What if the Python agent is slow or down?

Set a timeout on the call, return a clear error, and let the recruiter try again. Don't leave the request hanging. [FILL IN: what your backend did]

### How do you stop bad data being saved?

Validate on the backend before preview, and validate again before saving. The recruiter's confirmation is the final human check.

## 📚 Topics to revise

- [Resume story: OpenAI chatbot with structured outputs](topic:resume/openai-structured-outputs)
- [Calling an LLM API from Node.js](topic:ai/calling-llm-api)
- [Structured outputs with JSON Schema and Zod](topic:ai/structured-outputs)
- [Adding GenAI to a MERN app](topic:ai/genai-in-mern)
- [Request validation in Express](topic:express/validation)
- [Hallucination and how to reduce it](topic:ai/hallucination)
