---
title: "GCP basics: Cloud Run, Speech-to-Text, Text-to-Speech"
stack: devops
order: 14
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - Google Cloud (GCP) is Google's cloud — like AWS, it rents servers, storage and ready-made AI services.
  - "Cloud Run runs your Docker container and scales it, even to zero. Speech-to-Text turns audio into text. Text-to-Speech turns text into natural audio."
  - You can use GCP APIs from an app hosted elsewhere — my voice agent is hosted on AWS but calls Google's speech APIs.
  - Access uses a service account (GCP's version of an IAM role); keep its key secret or use keyless auth where possible.
  - "For phone calls, audio settings matter: phone audio is 8 kHz, often µ-law encoded, so you pick matching encoding and sample rate."
cards:
  - q: What is Cloud Run?
    a: A GCP service that runs your container image, gives it an HTTPS URL, and scales it up with traffic and down to zero when idle.
  - q: What do Speech-to-Text and Text-to-Speech do?
    a: Speech-to-Text turns audio into text (transcription). Text-to-Speech turns text into spoken audio in a chosen voice.
  - q: Can an app on AWS use Google Cloud APIs?
    a: Yes. The APIs are called over HTTPS/gRPC with a service account's credentials, from anywhere. My voice agent runs on AWS and uses Google's speech APIs.
  - q: What is a GCP service account?
    a: An identity for an app, not a person. You give it only the roles it needs (least privilege) and the app uses its credentials to call Google APIs.
  - q: Why stream speech-to-text in a voice call?
    a: Streaming sends audio as it arrives and returns partial text quickly, so the agent can reply with less delay than waiting for the full sentence.
---

## 💡 What is it?

**GCP** (Google Cloud Platform) is **Google's cloud**. Like AWS, it rents servers, storage and ready-made services.

Three services are useful to know:
- **Cloud Run** — runs your **Docker container**, gives it a URL, and scales it.
- **Speech-to-Text** — turns **audio into text**.
- **Text-to-Speech** — turns **text into a natural voice**.

My AI voice agent is **hosted on AWS**, but its standard voice uses **Google's Speech-to-Text and Text-to-Speech**.

## 🏠 Real-life example

Think of a **school assembly with a guest speaker from another country**.

- The speaker talks in their language = the **candidate speaking** on the phone.
- A **translator writes everything down** as they speak = **Speech-to-Text**.
- The **principal reads the notes and decides what to say back** = the AI brain (Claude, in my voice agent).
- An **announcer reads the reply out loud** through the microphone = **Text-to-Speech**.
- The **hall where the assembly happens** = where the app is hosted (AWS for my agent).
- The translator and announcer **come from another agency** = Google Cloud services used from an AWS-hosted app.

## 🧑‍💻 Code example

Turn text into an audio file with Google Text-to-Speech. Setup:
- `npm install @google-cloud/text-to-speech`
- create a service account with the Text-to-Speech role, download its key, then `export GOOGLE_APPLICATION_CREDENTIALS=./key.json` (never commit this file)

Save as `speak.mjs`, then run `node speak.mjs`.

```js
import textToSpeech from '@google-cloud/text-to-speech';     // Google's official Text-to-Speech client
import { writeFile } from 'node:fs/promises';               // to save the audio to a file

const client = new textToSpeech.TextToSpeechClient();       // reads credentials from GOOGLE_APPLICATION_CREDENTIALS

const [response] = await client.synthesizeSpeech({          // ask Google to turn text into speech
  input: { text: 'Hello! Are you free for a quick two-minute chat?' }, // the words to say
  voice: { languageCode: 'en-IN', ssmlGender: 'FEMALE' },   // en-IN = Indian English; Google picks a matching voice
  audioConfig: { audioEncoding: 'MP3' },                    // MP3 for a file; phone calls often use MULAW at 8000 Hz
});                                                          // end of the request

await writeFile('hello.mp3', response.audioContent);        // audioContent is the audio bytes — save them
console.log('Saved hello.mp3,', response.audioContent.length, 'bytes'); // confirm it worked
```

**Expected output** (needs a Google Cloud project and credentials, so not run here; the byte size varies):

```text
Saved hello.mp3, 28416 bytes
```

Open `hello.mp3` and you hear the sentence in an Indian English voice.

## 🔍 Deeper version

**Common GCP services and their AWS twins:**

| GCP | What it does | Closest AWS service |
|---|---|---|
| Compute Engine | Virtual servers | EC2 |
| Cloud Run | Run containers, scale to zero | Lambda (container image) / App Runner / Fargate |
| Cloud Storage | Files in buckets | S3 |
| Cloud Run functions | Small functions per event | Lambda |
| Pub/Sub | Messaging | SNS + SQS |
| IAM + service accounts | Permissions | IAM + roles |
| Speech-to-Text / Text-to-Speech | Speech AI | Amazon Transcribe / Polly |

**Speech-to-Text modes.**
- **Batch (recognize)** — send a short audio file, get text back.
- **Long-running** — for long files; you poll for the result.
- **Streaming** — send audio chunks as they arrive, get **partial** and **final** results. This is what a live phone call needs.

**Phone audio is special.** Phone lines carry low-quality audio: usually **8,000 samples per second** (8 kHz), often **µ-law (MULAW)** encoded. Twilio's media streams send this format. You must tell Speech-to-Text the right `encoding` and `sampleRateHertz`, and ask Text-to-Speech for the same format going back. Wrong settings give bad transcripts or noise.

**Latency adds up in a voice loop:** audio in → Speech-to-Text → LLM → Text-to-Speech → audio out. Streaming each step and keeping replies short is how voice agents feel natural. See [the voice agent story](topic:resume/voice-agent-microservice).

**Auth from outside GCP.** An app on AWS can use a service account key (stored as a secret, never in Git). A safer option is **Workload Identity Federation**, which lets an AWS role get short-lived Google credentials without any key file. [FILL IN: how your voice agent authenticates to Google Cloud.]

**Cloud Run basics.** You deploy a container image (`gcloud run deploy`). It must listen on the `PORT` variable. It scales per request load and can scale to zero, so idle cost is very low. Good for APIs and workers that fit in a container.

## 🎯 Why do we use it?

- **Best-in-class AI APIs.** Speech, translation and vision are ready to call. You don't train models.
- **Mix and match.** You can host on AWS and still use one excellent GCP API.
- **Simple container hosting.** Cloud Run runs any container with almost no setup.
- **Pay per use.** Speech is billed by audio length; Cloud Run by request time.

## ⚠️ Common mistakes

- **Committing the service account key file.** Treat it like a password.
- **Giving the service account Owner/Editor roles.** Give only the speech role it needs.
- **Wrong audio settings for phone calls** (sample rate or encoding mismatch).
- **Waiting for full sentences** instead of streaming, which makes the call feel slow.
- **Ignoring region and data rules** for recorded candidate audio.

## 🗣️ How to answer in an interview

> "GCP is Google's cloud. The services I know best are Cloud Run, which runs a container and scales it down to zero, and the speech APIs. Speech-to-Text turns audio into text — in streaming mode it returns partial results as the person speaks — and Text-to-Speech turns text into natural audio.
>
> In my AI voice agent, the service is hosted on AWS, but the standard voice uses Google's Speech-to-Text and Text-to-Speech, with Twilio for the phone line and Claude deciding what to say. So the app calls Google's APIs from AWS using service account credentials kept as a secret.
>
> The important details for phone calls are audio format — phone audio is 8 kHz, often µ-law — and latency, which is why streaming matters."

[FILL IN: one real problem you hit with the speech APIs — audio format, latency or accents — and how you solved it.]

## 🔁 Follow-up questions

### Why use Google's speech APIs from an AWS app instead of AWS's own?

Teams pick the API that works best for their use case — quality for the accents and languages they need, latency or cost. [FILL IN: your real reason for choosing Google's speech services.]

### What is the difference between interim and final results in streaming Speech-to-Text?

Interim results are quick guesses that may change as more audio arrives. Final results are the settled text for a phrase. Agents often wait for the final result (or a short pause) before replying.

### How would you keep the service account secure?

Least-privilege roles, store the key in a secret manager (or use Workload Identity Federation with no key), rotate keys, and never log them.

### What does Cloud Run need from your container?

It must start an HTTP server on the port given in the `PORT` environment variable, and it should be stateless, because instances come and go.

## ✅ Quick check

### 1. Which service turns a candidate's spoken answer into text?

:::answer
**Speech-to-Text.** Text-to-Speech goes the other way.
:::

### 2. True or false: an app hosted on AWS can't use Google Cloud APIs.

:::answer
**False.** Google's APIs work from anywhere with valid credentials. My voice agent does exactly this.
:::

### 3. Why must you set the encoding and sample rate correctly for phone audio?

:::answer
Phone audio is usually **8 kHz µ-law**. If the API expects a different format, the transcript is wrong or the audio is noise.
:::
