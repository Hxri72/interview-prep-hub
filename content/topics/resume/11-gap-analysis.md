---
title: "Gap analysis: prototype vs production candidate scoring"
template: story
stack: resume
order: 11
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "My real gap-analysis example: resume scoring and candidate scoring gave different results in the prototype and in production."
  - My tech lead asked me to find out why. I traced the scoring logic for technical skills, experience and trust score.
  - The formulas were different. The prototype had the intended business rules, so I aligned production with it.
  - I checked the fix in AWS CloudWatch logs, to confirm which formula was applied. I don't claim a formal automated test.
  - "Trust Score: I studied how it is calculated, but I did not fix a Trust Score issue myself."
cards:
  - q: What is an architecture gap analysis?
    a: A careful comparison of two versions of a system, or a system and its plan. It lists what is missing, what is different, and what contradicts.
  - q: Give a real example of a gap analysis you did.
    a: Candidate scores were different between our prototype and production. I traced both calculations, found the formulas differed, and aligned production with the prototype's rules.
  - q: How did you verify the scoring fix?
    a: I logged the scoring details and checked them in AWS CloudWatch, to confirm the right formula was used.
  - q: What is Trust Score?
    a: A score for how believable a candidate's profile is. It uses rules about email, phone number and work experience details.
  - q: Why did the prototype win?
    a: Because the prototype held the original business rules. Production had drifted away from them.
---

:::note[Your resume wording]
Your resume says "two gap analyses of the existing monolith against a proposed three-service design", with contradictions in "scoring weights, trust-tier thresholds and voice state-machine phases". Your confirmed story is about **scoring formulas, prototype vs production**. Reword the resume line to match this story, or be ready to explain the other parts. [FILL IN: confirm whether the trust-tier and voice-phase parts are true.]
:::

## 💡 What is it?

A **gap analysis** compares two versions of the same thing. It lists every difference (a "gap").

My real example is **candidate scoring** on SkillKeepr. The **prototype** (the first test version) and **production** (the live app) gave **different scores** for the same candidate.

My tech lead asked me to find out why. I found the formulas were different, and I fixed production to match the intended rules.

## 🏠 Real-life example

Think of **two teachers marking the same exam**.

The answer key from the head teacher says: "Theory 60 marks, practical 40 marks." One teacher follows it. The other teacher uses 50 and 50 by mistake. The same student gets two different totals.

- **The head teacher's answer key** = the prototype (it holds the real business rules).
- **The teacher using 50/50** = production, which drifted away from the rules.
- **Comparing both mark sheets line by line** = the gap analysis.
- **Telling the second teacher to use the key** = aligning production with the prototype.
- **Checking a few corrected papers** = checking the CloudWatch logs.

## 🧩 The problem

SkillKeepr scores candidates. The score uses things like **technical skills**, **experience** and a **trust score**.

The **resume score** and the **candidate score** gave different results in the prototype and in production. Recruiters use these scores to pick candidates, so a wrong score is a real problem.

My tech lead asked me to investigate.

## 🛠️ What I built

**1. Traced the calculation.** I followed the scoring code in both versions, step by step.

**2. Compared each factor.** I listed every factor and how each version used it.

```text
Factor            | Prototype            | Production           | Gap?
------------------|----------------------|----------------------|------
Technical skills  | [FILL IN: rule]      | [FILL IN: rule]      | ?
Experience        | [FILL IN: rule]      | [FILL IN: rule]      | ?
Trust score       | [FILL IN: rule]      | [FILL IN: rule]      | ?
```

(Fill the table only with what you really found. Keep real weights off the public site if they are business-sensitive.)

**3. Found the gap.** The **formulas were different** between the two versions.

**4. Decided which one was right.** The prototype held the **original business rules**. So production had to change, not the prototype.

**5. Aligned production.** I changed the production calculation to follow the intended rules.

**6. Checked it.** I added or reviewed **logging** around the scoring. Then I read the scoring details in **AWS CloudWatch** (AWS's log service). This showed which formula was really applied.

**About Trust Score:** it scores how believable a candidate's profile is. It uses rules about **email validity**, **phone number validity** and **work experience** details. I studied how it is calculated, as part of this work. I did **not** fix a Trust Score bug myself.

## 🧗 The hard part

**Finding the real rules.** The scoring logic had several factors. Each version calculated them in its own way. I had to follow every step to see where the numbers split.

**Deciding which side was correct.** A difference alone doesn't tell you who is wrong. I needed to know that the prototype held the intended business rules.

[FILL IN: one concrete difference you found, said simply. For example, "production used a different weight for experience".]

## 🏆 The result

- Production scoring now follows the same intended rules as the prototype.
- I confirmed the applied formula in the CloudWatch logs.
- Recruiters see consistent scores for the same candidate.

[FILL IN: whether there is now a test for the formula, and roughly when this happened.]

## 🗣️ How to answer in an interview

> "One gap analysis I did was on candidate scoring. Our resume score and candidate score were giving different results in the prototype and in production. My tech lead asked me to investigate.
>
> I traced the calculation in both versions. I compared each factor: technical skills, experience and trust score. I found that the formulas were different. The prototype held the original business rules, so I aligned the production calculation with it.
>
> To verify it, I added logging around the scoring and checked the details in AWS CloudWatch. That confirmed which formula was being applied.
>
> The lesson for me was to check the source of truth first. A difference doesn't tell you which side is wrong. Here, the business rules lived in the prototype."

**If they ask "did you write tests for it?"** answer honestly: "I verified it through the logs. [FILL IN: say yes only if you added a test.]"

## 🔁 Follow-up questions

### How did you know the prototype was correct and not production?

The prototype contained the original business logic that the team had agreed on. Production had moved away from it over time. [FILL IN: who confirmed this, for example the tech lead.]

### How did you verify the fix?

I added or reviewed logging around the scoring. Then I checked the logged values in AWS CloudWatch, to see which formula was really applied. I don't claim a formal automated test.

### What is Trust Score?

A score for how believable a candidate's profile and resume are. It checks things like email validity, phone number validity and employment details, using set rules and a formula. I investigated how it is calculated. I did not personally fix a Trust Score issue.

### How would you stop this from happening again?

Keep one shared scoring function that both places call, so there is only one formula. Add unit tests with known inputs and expected scores. Write the business rules down where the team can see them.

### What is the difference between a gap and a contradiction?

A gap is something missing on one side. A contradiction is when both sides describe the same thing differently, so one of them must change. Different scoring formulas are a contradiction.

## 📚 Topics to revise

- [Gap analysis and ADRs](topic:architecture/gap-analysis-adrs)
- [Monitoring and alerts](topic:devops/monitoring-alerts)
- [Jest basics](topic:testing/jest-basics)
- [Resume question bank](topic:resume/question-bank)
