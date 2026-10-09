---
title: System prompts, few-shot and step-by-step prompting
stack: ai
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - The system prompt sets the model's role and lasting rules. The user message is the specific request.
  - Few-shot prompting means showing 2–5 example inputs with their correct outputs, so the model copies the pattern.
  - Step-by-step prompting asks the model to reason before it answers. Modern models with built-in thinking do much of this on their own.
  - Pick examples that cover the tricky cases, not just the easy ones, and keep them in the same format you want back.
  - "On the newest Claude models you can't \"prefill\" the start of the reply. Use structured outputs or clear format rules instead."
cards:
  - q: What is a system prompt?
    a: Instructions that set the model's role, tone and lasting rules for the whole conversation, like "You are an HR assistant. Reply in 3 lines."
  - q: What is few-shot prompting?
    a: Putting a few example inputs with their correct outputs in the prompt, so the model learns the pattern and copies it.
  - q: Zero-shot vs few-shot?
    a: Zero-shot gives only the instruction. Few-shot adds examples. Few-shot helps when the format or the edge cases are hard to describe in words.
  - q: Do you still need "think step by step"?
    a: Less than before. Models with built-in thinking already reason before answering. For simple jobs, keep effort low; for hard ones, allow more thinking.
  - q: What makes a good few-shot example set?
    a: It covers the tricky cases, uses the exact output format you want, has a mix of answers (not all the same label), and stays short.
---

## 💡 What is it?

These are three ways to guide an [LLM](glossary:llm):

1. **System prompt** — the model's role and lasting rules. Example: "You are an HR assistant. Reply in 3 short lines."
2. **[Few-shot](glossary:few-shot) prompting** — you show a few examples of input → correct output. The model copies the pattern.
3. **Step-by-step prompting** — you ask the model to think through the problem before it answers.

## 🏠 Real-life example

Think of **a new trainee at a school office**.

- **The system prompt** = the job description on day one: "You handle parent calls. Be polite. Never share phone numbers."
- **Few-shot examples** = the senior staff showing 3 real calls: "When a parent said X, we replied Y."
- **Step-by-step** = "Before you answer a tricky question, check the timetable, then the rules, then reply."

Mapping:
- **The trainee** = the LLM.
- **The job description** = the system prompt.
- **The 3 sample calls** = the few-shot examples.
- **"Check, then check, then reply"** = step-by-step reasoning.

## 🧑‍💻 Code example

This builds a few-shot request that labels candidates' replies. **No API key needed**: it only prints the request body. Save as `fewshot.mjs` and run `node fewshot.mjs`.

```js
const system =                                                   // the SYSTEM prompt: role + lasting rules
  'You classify candidate replies for recruiters. ' +            // the role
  'Answer with exactly one word: INTERESTED, NOT_INTERESTED or UNCLEAR.'; // the allowed answers

const examples = [                                               // FEW-SHOT examples: input → correct output
  ['Yes, I would love to join the interview on Monday.', 'INTERESTED'],   // example 1
  ['Thanks, but I just accepted another offer.', 'NOT_INTERESTED'],       // example 2
  ['Can you share the salary range first?', 'UNCLEAR'],                   // example 3
];                                                               // end of examples

const messages = [                                               // the conversation we will send
  ...examples.flatMap(([reply, label]) => [                      // turn each example into 2 turns
    { role: 'user', content: reply },                            // the example input, as if the user sent it
    { role: 'assistant', content: label },                       // the correct answer, as if the model replied
  ]),                                                            // end of the examples
  { role: 'user', content: 'Sounds good, send me the calendar link.' }, // the NEW reply we want classified
];                                                               // the last message is from the user (no prefill)

const request = {                                                // the full request body
  model: 'claude-opus-5-5',                                      // which model answers
  max_tokens: 1024,                                              // room for the answer (thinking tokens count here too)
  output_config: { effort: 'low' },                              // 'low' effort = less thinking, fine for a simple label
  system,                                                        // the system prompt from above
  messages,                                                      // the few-shot turns + the new reply
};                                                               // end of the request
console.log(JSON.stringify(request, null, 2));                   // print the request body we would send
```

**Real output** (shortened):

```text
{
  "model": "claude-opus-5-5",
  "max_tokens": 1024,
  "output_config": { "effort": "low" },
  "system": "You classify candidate replies for recruiters. Answer with exactly one word: ...",
  "messages": [
    { "role": "user", "content": "Yes, I would love to join the interview on Monday." },
    { "role": "assistant", "content": "INTERESTED" },
    ... 2 more example pairs ...
    { "role": "user", "content": "Sounds good, send me the calendar link." }
  ]
}
```

I also passed this exact object to the Anthropic SDK (with a fake server). The SDK accepted it and sent all **7 messages**. With a real key, you'd call `client.messages.create(request)`, and the expected answer is `INTERESTED`.

## 🔍 Deeper version

**System prompt vs user message.**

| | System prompt | User message |
|---|---|---|
| Purpose | role, tone, lasting rules | this specific request |
| Changes | rarely | every request |
| Written by | you (the developer) | often the end user |
| Caching | a good candidate for prompt caching | changes every time |

Keep the system prompt stable. A stable prefix can be **cached**, which makes later requests cheaper and faster.

**Few-shot, done well.**
- **2–5 examples** are usually enough. More examples mean more [tokens](glossary:token) and more cost on every call.
- **Cover the hard cases.** In the example above, "salary range first?" is the tricky one. Easy examples teach nothing new.
- **Mix the answers.** If every example says `INTERESTED`, the model leans that way.
- **Same format as you want back.** If you want one word, the examples show one word.
- You can put examples as **fake turns** (like above) or inside the system prompt in `<example>` tags. Both work.

**Step-by-step (reasoning).**
- Old trick: "Think step by step before answering." It helped because writing the steps down helps the model get them right.
- **Today:** many models have **built-in thinking**. Current Claude models think on their own (adaptive thinking) before answering. You control *how much* with an `effort` setting: `low` for simple jobs, `high` for hard ones.
- If a model has no built-in thinking, you can still ask it to reason first, then give the final answer in a fixed place, like `<answer>…</answer>`.
- Thinking costs tokens and time. Don't ask for heavy reasoning on a yes/no label.

:::version[Version note]
**Prefill is gone on the newest Claude models.** Older tutorials end the messages with a half-written *assistant* turn, like `{ role: 'assistant', content: '{' }`, to force JSON. On current models (Claude Opus 4.6 and later, Sonnet 4.6 and later, Claude Opus 5.5…) this returns a **400 error**. Use [structured outputs](topic:ai/structured-outputs) or clear format rules instead.
:::

**Where else few-shot helps:** extracting fields from messy text, matching a writing tone, classifying tickets, turning plain English into a filter object.

## 🎯 Why do we use it?

- The **system prompt** keeps behaviour consistent across thousands of requests: same role, same rules, same tone.
- **Few-shot** examples teach a format or judgement that is hard to explain in words. One good example can beat a paragraph of rules.
- **Reasoning** improves accuracy on multi-step problems, like comparing a resume against 10 job requirements.

## ⚠️ Common mistakes

- **Putting user data in the system prompt.** It mixes your rules with untrusted text and breaks caching. Put user data in the user message.
- **Examples that are all the same.** The model copies the bias.
- **Too many examples.** Every example is paid for on every single call.
- **Prefilling the assistant turn on new Claude models.** It now returns a 400 error.

## 🗣️ How to answer in an interview

> "The system prompt sets the role and lasting rules — for example 'You classify candidate replies; answer with one of three labels.' The user message carries the specific input. I keep the system prompt stable, which also lets it be cached.
>
> Few-shot means adding two to five examples of input and correct output. I pick examples that cover the tricky cases, mix the labels so there's no bias, and keep them in the exact format I want back. Step-by-step reasoning helps on multi-step problems, but modern models think on their own, so I mostly control it with an effort setting — low for simple classification, higher for hard reasoning. And on newer Claude models I don't prefill the reply; I use structured outputs for strict formats."

[FILL IN: a system prompt or few-shot setup you used in the JD chatbot backend at SkillKeepr, or for Claude in the voice agent. Only if true.]

## 🔁 Follow-up questions

### When would you choose few-shot over fine-tuning?

Almost always try few-shot (and good prompts) first. It's instant, cheap and easy to change. Fine-tuning is for when you have many examples and prompts clearly aren't enough. See [training vs fine-tuning](topic:ai/training-inference-finetuning).

### How many few-shot examples should you use?

Start with 2–5. Add more only if tests show they help. Each example adds tokens to every request.

### Where do you put the examples — system prompt or messages?

Either works. Fake user/assistant turns make the pattern very clear. Examples inside the system prompt (in `<example>` tags) keep the messages clean and cache well.

### Does "think step by step" still matter?

Less than before. Models with built-in thinking already reason. You tune the depth with effort settings, and keep the final answer in a fixed format.

## ✅ Quick check

### 1. All 4 of your few-shot examples are labelled `INTERESTED`. What's the risk?

:::answer
The model learns a **bias** and leans towards `INTERESTED` even when it's wrong. Mix the labels and include the tricky cases.
:::

### 2. Where should a candidate's message go — the system prompt or a user message?

- A) System prompt
- B) User message

:::answer
**B.** The system prompt holds your stable rules. User data goes in the user message — it's untrusted, and it changes every request.
:::

### 3. On a current Claude model you end `messages` with `{ role: 'assistant', content: '{' }` to force JSON. What happens?

:::answer
It returns a **400 error**. Prefill isn't supported on the newest Claude models. Use structured outputs instead.
:::
