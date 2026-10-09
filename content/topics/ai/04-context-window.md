---
title: The context window
stack: ai
order: 4
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - The context window is the maximum amount of text (in tokens) a model can see at once.
  - "It holds everything: system prompt, chat history, documents, tool results AND the model's answer."
  - If you send too much, the call fails or you must cut something out.
  - The model has no memory between calls — only what you put in the window this time.
  - Manage it by trimming old messages, summarising, and sending only relevant document chunks (RAG).
cards:
  - q: What is a context window?
    a: The maximum number of tokens a model can look at in one call — instructions, history, documents and its own answer together.
  - q: Does the answer count towards the context window?
    a: Yes. Input tokens plus output tokens must fit inside the window.
  - q: What happens in a chat app when the conversation gets too long?
    a: The app must drop or summarise older messages, or the request is rejected for being too large.
  - q: Why not just paste a whole 500-page manual into the prompt?
    a: It may not fit, it costs a lot of tokens, it is slower, and models can miss details buried in very long inputs. RAG sends only the relevant parts.
  - q: Does a bigger context window mean the model remembers past chats?
    a: No. It only sees what you send in the current call. Bigger windows just let you send more at once.
---

## 💡 What is it?

The **[context window](glossary:context-window)** is how much text a model can **see at one time**. It is measured in [tokens](glossary:token).

It holds **everything** for one call: the system prompt, the chat history, any documents, tool results — and the model's own answer.

If it's full, older information must be cut out. The model can't see anything outside the window.

## 🏠 Real-life example

Think of a **classroom whiteboard**.

The teacher can only use what is written on the board right now.

- The **whiteboard size** = the context window.
- **Writing on the board** = adding text to the prompt.
- **The board getting full** = hitting the token limit.
- **Erasing old notes** to make space = dropping old chat messages.
- **Writing a short summary in the corner** before erasing = summarising the chat.
- **Yesterday's board that was cleaned** = past API calls. The teacher can't see them any more.

## 🧑‍💻 Code example

Keep a chat inside a token budget. It always keeps the system prompt, then adds messages from the **newest** backwards until the budget is full. Save it as `context.js`. Run `node context.js`.

```js
// Keep a chat inside a token budget by dropping the oldest messages
const estimateTokens = (text) => Math.ceil(text.length / 4); // about 4 characters per token
const system = { role: 'system', content: 'You are a helpful HR assistant.' }; // rules we must always keep
const history = [                                            // the chat so far, oldest first
  { role: 'user', content: 'Hi, I want to apply for the Node.js job.' },       // message 1 (oldest)
  { role: 'assistant', content: 'Great! Please share your years of experience.' }, // message 2
  { role: 'user', content: 'I have 3 years with Node, Express and MongoDB.' },   // message 3
  { role: 'assistant', content: 'Thanks. What is your notice period?' },          // message 4
  { role: 'user', content: 'It is 30 days.' },                                    // message 5 (newest)
];                                                           // end of the chat
function fitToBudget(system, messages, budget) {             // budget = max tokens we may send
  let used = estimateTokens(system.content);                 // the system prompt always goes in
  const kept = [];                                           // messages we will send
  for (let i = messages.length - 1; i >= 0; i--) {           // walk from the NEWEST message backwards
    const cost = estimateTokens(messages[i].content);        // tokens for this message
    if (used + cost > budget) break;                         // no room left → stop adding older ones
    kept.unshift(messages[i]);                               // keep it, in the original order
    used += cost;                                            // count it
  }                                                          // end of the loop
  return { messages: [system, ...kept], used };              // what we will actually send
}                                                            // end of fitToBudget
const { messages, used } = fitToBudget(system, history, 40); // pretend the window is only 40 tokens
console.log('tokens used:', used);                           // how full the window is
console.log(messages.map((m) => m.role + ': ' + m.content).join('\n')); // what the model will "see"
```

**Output:**

```text
tokens used: 33
system: You are a helpful HR assistant.
user: I have 3 years with Node, Express and MongoDB.
assistant: Thanks. What is your notice period?
user: It is 30 days.
```

The first two messages were dropped. So the model no longer "knows" which job the candidate applied for. That's the trade-off — and why summaries help.

## 🔍 Deeper version

**What fills the window:**

| Part | Notes |
|---|---|
| System prompt | Rules and role; sent every call |
| Tool definitions | Each tool's name, description and input schema |
| Chat history | Grows every turn |
| Retrieved documents | RAG chunks, file contents |
| Tool results | Data returned from your functions |
| **The output** | The answer must also fit — reserve room for it |

**Sizes.** Modern models have windows from tens of thousands to around a million tokens, depending on the model. Check the model's documentation for its exact limit and its max output tokens.

**Bigger isn't free:**
- **Cost:** every token you send is billed. See [tokens and cost](topic:ai/tokens-cost).
- **Speed:** more input takes longer to process.
- **Attention quality:** models can miss details placed deep inside very long inputs. Put the most important instructions clearly at the start or end.

**Strategies for long conversations and big documents:**
1. **Sliding window:** keep only the last N messages (like the example).
2. **Summarise:** replace old messages with a short summary the model wrote earlier.
3. **RAG:** don't send the whole manual. Search it and send only the matching chunks. See [RAG](topic:ai/rag).
4. **Store facts outside:** save key facts (job ID, candidate name) in your database and inject them each call.
5. **Server-side compaction or context editing:** some providers can trim or compress context for you. Check the API docs.

**No memory between calls.** The model is stateless. "Memory" in chat apps is just your code re-sending history every time.

## 🎯 Why do we use it?

Knowing the context window helps you design features that **don't break on long input**:
- Chatbots that keep working after 50 messages.
- Document Q&A over files bigger than the window.
- Predictable cost, because you control how much you send.

## ⚠️ Common mistakes

- **Forgetting the output needs room.** A prompt that nearly fills the window leaves no space for the answer.
- **Dropping old messages that held key facts**, like which job the candidate applied for. Pin important facts separately.
- **Pasting whole documents** when only one paragraph matters.
- **Believing the model remembers yesterday's chat.** It only sees what you send now.

## 🗣️ How to answer in an interview

> "The context window is the maximum number of tokens a model can see in one call. It includes everything — the system prompt, tool definitions, chat history, any documents, tool results — and the answer it writes. The model is stateless, so its only 'memory' is what I put in the window on that call.
>
> For long conversations I'd keep the system prompt and recent messages, summarise older ones, and store important facts like the job or candidate ID in the database and inject them each time. For large documents I'd use RAG and only send the relevant chunks, which keeps cost and latency down and actually improves accuracy. [FILL IN: how the voice agent or JD chatbot kept the conversation history, if you know]."

## 🔁 Follow-up questions

### How do you handle a 300-page PDF bigger than the window?

Split it into chunks, create embeddings, store them in a vector database, and for each question send only the most relevant chunks. That's RAG.

### Is a bigger context window always better?

It lets you send more, but it costs more, is slower, and the model can still miss details in very long inputs. Sending the right information beats sending everything.

### What happens if the request is bigger than the window?

The API returns an error. Your code should trim, summarise or retrieve less before retrying.

### Where should important instructions go in a long prompt?

Put them clearly in the system prompt and repeat critical rules near the end, close to the question. Clear structure helps the model find them.

## ✅ Quick check

### 1. In the example, why did the model lose which job the candidate wanted?

:::answer
The budget was only 40 tokens, so the code dropped the two oldest messages — including "I want to apply for the Node.js job". The model can't see dropped messages.
:::

### 2. Which of these count towards the context window?

- A) Only the user's latest message
- B) System prompt, history, documents, tool results and the answer

:::answer
**B.** Everything sent in the call, plus the generated answer, must fit.
:::

### 3. True or false: a model with a 1-million-token window remembers last week's conversation.

:::answer
**False.** The window size only limits one call. The model remembers nothing between calls unless you send it again.
:::
