---
title: "Resume question bank: quick answers for every resume line"
template: bank
stack: resume
order: 17
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - One page with short, honest answers to the resume questions interviewers ask most.
  - "Say \"I\" only for work you really did: the voice service, the JD chatbot backend, the ATS backend, Stripe auto-renewal, the scoring investigation."
  - "Always say \"estimate\" for the numbers: about 65% lower voice cost, about 30% faster development, 10–15 minutes saved per call."
  - "Know the three sync types: manual pull, scheduled polling and event-driven (webhooks). Our ATS sync used the first two."
  - When you don't remember a low-level detail, say so, and say how you would check it.
cards:
  - q: Why did you build your own voice pipeline instead of using Retell AI?
    a: Retell AI's cost became a concern. I researched Twilio + Google speech + an LLM, estimated about 65% lower cost, presented it, and built it.
  - q: Was the AI job description saved straight away?
    a: No. The backend returned it for preview. It was saved to MongoDB only after the recruiter confirmed it.
  - q: How did the ATS sync avoid duplicate candidates?
    a: It checked by email. An existing candidate was reused and linked to the job, not created again.
  - q: What happens in your system when a payment fails?
    a: The account isn't blocked at once. The system sends reminders, and blocks access only after a set grace period.
  - q: What is the difference between COLLSCAN and IXSCAN?
    a: COLLSCAN means MongoDB reads documents one by one. IXSCAN means it walks an index to find matches fast.
---

## 💡 What is it?

This page is a **question bank** for your resume. It collects the questions interviewers ask about your work, with short answers.

Each answer is short, so you can revise fast. For the full story, open the linked page.

Click a question to see its answer.

## 🏠 Real-life example

Think of the **important-questions list** a teacher gives before an exam.

- **The full textbook chapter** = the full story page for each project.
- **The list of likely questions** = this page.
- **Practising answers aloud** = practising these answers in your own words.
- **"Only write what you know"** = the honest-answer reminders at the end.

## 🧩 How to use this page

1. **Read one section a day.** Say each answer out loud in your own words.
2. **Don't memorise word by word.** Interviewers notice a script.
3. **Fill every [FILL IN]** with a real fact before you use that answer.
4. **Use "I" only for your own work.** Use "we" or "the system" for the rest.
5. **Say "estimate"** for every number that wasn't measured.

## 👋 About me and SkillKeepr

### Tell me about yourself.

> "Hi, I'm Hariprasad. I'm a Software Engineer with over three years of experience, at Haspaces Technology Solutions. I come from a full-stack MERN background. For the last couple of years, my main focus has been backend work with Node.js, Express and MongoDB.
>
> I work on SkillKeepr, an AI-powered recruitment platform. I started with bug fixes and small features. Over time I took ownership of bigger backend features and integrations: an ATS integration, the backend of an AI job-description assistant, Stripe auto-renewal, and an AI voice agent service.
>
> I recently finished my MCA from Amity. I'm looking for a role where I can take more ownership of backend systems."

Don't say you used the Context API at work. See [Tell me about yourself](topic:hr/tell-me-about-yourself) for the full version.

### What does SkillKeepr do?

It is a **multi-tenant recruitment platform**. Many companies use the same app, but each company's data is kept apart.

Recruiters create job descriptions (JDs), search and shortlist candidates, and move them through interview stages. Candidates create profiles and upload resumes. It also has AI matching and scoring, AI-written JDs, AI interviews, ATS integrations and subscription billing. See [SkillKeepr overview](topic:resume/skillkeepr-overview).

### Who are the main users?

- **Recruiters and hiring teams**: the main users.
- **Candidates**: they create profiles and take part in interviews.
- **Cloud admins**: SkillKeepr staff who manage tenants (customer companies).

### What was your role?

Mainly **backend development and integrations**. That means the ATS integration backend, the AI JD chatbot backend, Stripe auto-renewal, and the AI voice service. On the voice feature I also worked full stack. [FILL IN: which frontend parts of the voice feature you built.]

### How do you build a feature end to end?

I follow the existing architecture and coding patterns first. When a feature needs a new API design or an outside integration, I discuss the approach with my tech lead before I build it. After release, I help with production issues, for example by reading AWS CloudWatch logs.

The best example is the voice service. I researched it, proposed it, and built it.

## 🎙️ AI voice agent

### Explain the voice agent architecture.

A call starts in two ways. A recruiter can start it from SkillKeepr, or it starts automatically for a candidate who is eligible after scoring. The main backend sends the call request and the interview settings to a **separate voice service**.

The voice service uses **Twilio** for the phone call, **speech-to-text** to hear the candidate, an **LLM** (Claude) to choose the next reply, and **text-to-speech** to speak. After the call, it sends the transcript and recording details back to the backend. The recording is stored in **S3**. See [the voice agent story](topic:resume/voice-agent-microservice).

### What is the voice service written in?

It is a **Python FastAPI** service. The main SkillKeepr backend is **Node.js**. Don't mix the two up when you explain it.

### Why did you replace Retell AI?

We first used Retell AI, a ready-made voice-agent service. Cost became a concern. I researched Twilio + Google Cloud speech + an LLM, presented the cost and feasibility to the team, and was asked to build it.

I **estimated** about **65% lower cost**. It is an estimate, not a measured saving. See [build vs buy](topic:resume/build-vs-buy).

### What trade-offs did you consider?

- **Cost:** our own pipeline was cheaper per call.
- **Effort:** we had to build it.
- **Control:** we can change every step of the call.
- **Maintenance:** we must run and fix it ourselves now.

### How did the agent handle different interview levels?

Each interview had a **configuration** with set instructions and questions.

| Level | What it asks | Length |
|---|---|---|
| Basic | experience, notice period, visa or sponsorship | about 5–10 minutes |
| Intermediate | skills and past experience, in more depth | longer |

The instructions guide the AI. The conversation flow handles the follow-up questions.

### How does the voice service talk to the main backend?

Over **HTTP**. The backend calls the voice service's API to start a call. When the call ends, the voice service sends an **HTTP callback** (it calls the backend back) with the transcript and recording details. Don't guess the internal network setup.

### Tell me about a production latency issue you fixed.

The agent sometimes **interrupted candidates** while they were thinking. It treated a short pause as the end of their answer.

I read the call logs in AWS CloudWatch and the voice-service logs, stage by stage. Then I raised the wait from about **2–3 seconds to about 5–7 seconds**, so candidates had time to finish. I tested it with real calls and checked the logs again. We also discussed how to handle longer silences.

### How does the state machine help?

It tracks **who is speaking**: the candidate is speaking, the candidate has finished, or the agent is speaking. **Voice activity detection** (code that notices when someone is talking) and turn rules decide when to transcribe, when to wait, and when to reply.

Because each stage is separate and logged with its timing, you can see where a call is slow. See [the voice state machine](topic:resume/voice-state-machine).

## 🤖 AI job-description assistant

### Explain the AI job-description feature.

A recruiter types what they need, for example "a MERN stack developer". The frontend sends it to our **Node.js backend**. The backend calls a **Python agent** that uses **OpenAI** to write the JD.

The agent returns the result. I mapped it into our JD format and validated it. Then the backend sent it to the frontend for **preview**. I built the backend; another developer built the frontend. See [the JD chatbot story](topic:resume/openai-structured-outputs).

### Why did the backend need to map and validate the AI response?

The AI's reply didn't always have the exact shape our backend expected. So I pulled out the needed fields, mapped them to our schema (the expected shape), and validated them.

If a field could be recovered from the recruiter's request, we filled it in before validation. A field with a wrong type or shape was never treated as valid data.

### Was the JD saved immediately?

No. It went back to the frontend as a **preview**. It was saved to MongoDB **only after the recruiter reviewed and confirmed it**.

### Which validation library did you use?

[FILL IN: check the code first.] Don't name a library you haven't confirmed.

## 📊 Scoring and gap analysis

### Give an example of a gap analysis.

Resume scoring and candidate scoring gave **different results in the prototype and in production**. My tech lead asked me to find out why.

I traced the logic for technical skills, experience and trust score. The formulas were different. The prototype had the intended business rules, so I aligned production with it. See [the gap analysis story](topic:resume/gap-analysis).

### How did you verify the scoring fix?

I added or reviewed logging around the scoring. Then I checked the details in AWS CloudWatch, to confirm which formula was applied.

Say "I checked it in the logs". Don't claim an automated test unless you added one.

### What is Trust Score?

A score for how believable a candidate's profile is. It uses rules about email validity, phone number validity and work experience details.

I studied how it is calculated. I did **not** fix a Trust Score issue myself.

### What voice state-machine issues did you investigate?

I tested calls locally and watched the voice-service logs. I saw two problems:

- calls that connected, but the agent didn't respond
- the agent interrupting candidates before they finished

I traced the logs and the state changes, and worked on fixes to the conversation flow.

## 🔗 ATS integration

### Explain your ATS integration.

An **ATS** (Applicant Tracking System) is software companies use to manage jobs and applicants. **unified.to** is one API that connects to many ATSs, like Workable, Greenhouse, Lever and Zoho. So we built one integration instead of one per ATS.

Recruiters connect their ATS account. Then our backend pulls their jobs and the candidates for those jobs into SkillKeepr. I built the backend; another developer built the frontend. We tested it with Workable, Greenhouse, Lever and Zoho. See [the ATS story](topic:resume/ats-integration).

### Manual sync vs scheduled sync: what's the difference?

- **Manual sync:** the recruiter clicks **Sync** on a job, and we pull new candidates then.
- **Scheduled sync:** a timer checks for new candidates every few hours. [FILL IN: the real intervals, from the config.]

### What is event-driven sync? Did you use it?

**Event-driven** means the other system tells us when something happens, for example "a new candidate was created". It usually uses a [webhook](glossary:webhook).

**Polling** is the opposite: we ask again and again, on a timer. Our sync used manual pulls and scheduled polling. So don't call it webhook-driven.

### How did you avoid duplicate candidates?

We checked by **email**. A new candidate was saved. An existing candidate was **not created again**. We reused the record and linked it to the job.

### What if the candidate's phone number or resume changed in the ATS?

In that flow, we **did not update** the existing candidate. We reused the record and linked it to the job. So it stopped duplicates, but it didn't refresh old details.

### How did you avoid linking the same candidate to the same job twice?

We checked whether the candidate was already linked to that job. If yes, we skipped it. If not, we created the link.

**General knowledge:** a **compound unique index** on candidate + job also blocks duplicate links, even when two requests arrive together. Don't claim we had one unless you've checked the code.

## 💳 Stripe billing

### Explain subscription auto-renewal.

Stripe handles billing. When a company subscribes, we store details like the subscription ID, start date and expiry date. Stripe charges the card automatically each period.

My part was **auto-renewal**: the renewal cron (a scheduled job) and the webhook handling. I tested it with **Stripe Test Clocks**, which let you move a test subscription forward in time. Other developers built the purchase flow. See [the Stripe story](topic:resume/stripe-billing).

### What happens when a payment fails?

The account is **not blocked at once**. The system sends reminders, and blocks access only after a set **grace period** (a few extra days to fix the payment). [FILL IN: the exact events and retry rules, from the code.]

### What is a Stripe webhook?

An HTTP message Stripe sends to our backend when something happens, like "invoice paid" or "payment failed". The backend checks the webhook signature first, to make sure it really came from Stripe. Then it updates the subscription. See [webhook signatures](topic:rest-auth/webhook-signatures).

### Why have a grace period?

So a customer isn't locked out the moment a card fails. They get reminders and time to fix it, under the business rules.

### What if they ask for low-level details you don't remember?

Be honest: "I worked on this earlier, so I'd revisit the module for exact event names. I can explain the flow confidently."

## ♻️ Reusable modules

### What reusable backend patterns did your team use?

Shared helpers so every service doesn't write the same code again:

| Pattern | What it does |
|---|---|
| Response builder | gives every API the same response shape |
| Authorizer decorator | adds the login and permission check to a handler in one line |
| Pagination and sorting helpers | the same page and sort logic everywhere |
| Data transformation helpers | change data into the shape the API returns |
| Stripe and integration wrappers | one tidy way to call outside services |

See [the reusable modules story](topic:resume/reusable-modules).

### Did you build the whole shared library?

No. I worked on it, including the authentication modules, together with the team. I reused the other shared helpers. Only say "I built" for the parts you really wrote.

### How do you explain the ~30% faster development?

It is an **estimate** of the time saved by reusing shared code. It was not measured before and after. Say "about 30%, estimated".

## 🍃 MongoDB indexes

### What is an index?

A separate, sorted structure that helps MongoDB find documents fast. Think of a school register sorted by name: you jump to the right page instead of reading every row. See [indexes](topic:mongodb/indexes).

### How does MongoDB use an index to find a value?

1. The index is a sorted tree (a B-tree).
2. MongoDB starts at the top and compares the value it wants with the values there.
3. It follows only the branch where the value can be, and skips the rest.
4. At the matching entry, it follows the pointer to the document.

So it needs a few steps, not one step per document.

### How do you check if a query uses an index?

```js
db.candidates.createIndex({ email: 1 }) // index on email; 1 = ascending order
db.candidates.find({ email: "hari@example.com" }) // find candidates with this email
  .explain("executionStats") // show how MongoDB ran the query, with numbers
```

| In the output | Meaning |
|---|---|
| `COLLSCAN` | collection scan: it read documents one by one |
| `IXSCAN` | index scan: it used an index |
| `totalDocsExamined` | how many documents it read |
| `executionTimeMillis` | time taken in milliseconds (noisy for small tests) |

See [explain()](topic:mongodb/explain).

### What does an index cost?

- It uses **extra storage**.
- Inserts, updates and deletes get a bit **slower**, because the index must be updated too.

So add indexes for real, frequent queries only. See [index costs](topic:mongodb/index-costs).

### What are unique and compound indexes?

```js
db.candidates.createIndex({ email: 1 }, { unique: true }) // no two candidates can share an email
db.jobCandidates.createIndex({ candidateId: 1, jobId: 1 }, { unique: true }) // a candidate can be linked to a job only once
```

A **compound index** has more than one field. The field order matters: match it to your queries. See [compound indexes](topic:mongodb/compound-indexes-esr).

Before you claim an index at SkillKeepr, check one real index in the code.

## ⚙️ CI/CD and Agile

### What is CI/CD?

- **CI (Continuous Integration):** every code change is checked automatically, with tests and a build.
- **CD (Continuous Delivery or Deployment):** the checked change is prepared, or released, to an environment automatically.

It catches mistakes early and removes repeated manual work. See [what is CI/CD](topic:devops/what-is-cicd).

### How does GitHub Actions help?

When you push code or open a pull request, a **workflow** (a YAML file of steps) runs. It installs packages, runs tests and builds the app. If the team sets it up, it can also deploy.

It does **not** deploy anything by itself. Someone must write the deploy steps. See [GitHub Actions](topic:devops/github-actions).

### What does working in Scrum mean?

We worked in **sprints**, short fixed periods with chosen goals. We planned the work, met briefly every day, showed finished work, and discussed how to improve.

| Word | Meaning |
|---|---|
| Product backlog | the ordered list of all product work |
| Sprint planning | the meeting to choose work for the sprint |
| Daily Scrum | a short daily meeting to share progress and blockers |
| Scrum Master | helps the team follow Scrum and removes blockers |
| Product Owner | decides the order of work, for the most value |
| Retrospective | the meeting to improve how the team works |

See [Agile and Scrum](topic:hr/agile-scrum). [FILL IN: your sprint length.]

## 🛡️ Honest-answer reminders

- Don't claim you built a whole shared module. Say which parts you wrote.
- The **30%** and the **65%** are **estimates**. Say so every time.
- For ATS, keep the three sync types apart: manual pull, scheduled polling, webhooks. You used the first two.
- In the ATS flow, existing candidates were **reused, not updated**.
- The voice service is **Python FastAPI**. The main backend is **Node.js**. Don't guess the internal networking.
- Hosting is **AWS**. Google Cloud is used only for the speech services.
- Don't say you used the **Context API** at work. You are learning it now.
- For Stripe, explain the flow with confidence, and say you'd revisit the code for the exact details.
- Use examples you remember well enough to answer three follow-ups.

## ✅ Final revision checklist

- Say your introduction out loud, in under 90 seconds.
- Explain SkillKeepr and its three kinds of users.
- Explain the voice architecture, the Retell AI decision, and the pause fix.
- Explain the JD flow: Python agent → mapping and validation → preview → save after confirm.
- Explain the scoring gap analysis and how you checked it in CloudWatch.
- Explain the ATS sync: manual and scheduled, duplicates by email, job links.
- Explain Stripe auto-renewal, failed payments and the grace period.
- Pick one real shared module you worked on, and one real MongoDB index.
- Explain how an index tree finds a value, and how `explain()` proves it.
- Define CI/CD, GitHub Actions and the Scrum words.
