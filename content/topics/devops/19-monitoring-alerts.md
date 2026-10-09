---
title: Logging, monitoring and alerts
stack: devops
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Logs tell you what happened. Metrics tell you how much and how fast. Alerts wake someone up when numbers go bad.
  - Watch the golden signals — latency, traffic, errors and saturation (how full the system is).
  - On AWS, CloudWatch collects Lambda logs and metrics, and CloudWatch Alarms send alerts.
  - Alert on symptoms users feel (error rate, slow responses), not on every small blip.
  - Every alert should be actionable — someone should know what to do when it fires.
cards:
  - q: What's the difference between logs, metrics and alerts?
    a: Logs are detailed records of events. Metrics are numbers over time (requests per minute, error rate). Alerts are rules on metrics that notify a person when something is wrong.
  - q: What are the four golden signals?
    a: Latency (how slow), traffic (how many requests), errors (how many fail) and saturation (how full CPU, memory or the database are).
  - q: What would you alert on for an API?
    a: A high error rate (for example over 5% of requests failing for 5 minutes), high p95 latency, and the service being down. These are things users feel.
  - q: What does CloudWatch give you for Lambda?
    a: Logs from console output, built-in metrics like invocations, errors, duration and throttles, and alarms that can notify through email or chat.
  - q: What is alert fatigue?
    a: Too many noisy alerts, so people start ignoring them — and then miss the real one.
---

## 💡 What is it?

When your app is live, you can't watch it with your own eyes. You need three things:

- **Logs:** a diary of events. "User 42 logged in." "Payment failed."
- **Metrics:** numbers over time. "500 requests per minute, 2% errors, average 120 ms."
- **Alerts:** rules that notify a person. "Error rate above 5% for 5 minutes → message the on-call developer."

Together, this is called **monitoring**, or **observability**.

## 🏠 Real-life example

Think of a **hospital patient**.

- The **nurse's notes** ("10:00 gave medicine, 10:30 patient slept") = logs.
- The **heart-rate screen**, showing numbers all day = metrics.
- The **beep when the heart rate goes too high** = an alert.
- **A beep that rings every minute for nothing**, so nurses ignore it = alert fatigue.
- **A beep only for real danger, with a clear action** ("call the doctor") = a good, actionable alert.

## 🧑‍💻 Code example

This small script shows the idea. It writes structured logs, counts metrics and checks an alarm rule. Save it as `metrics.js` and run `node metrics.js`.

```js
const counts = { requests: 0, errors: 0 };                                  // two simple metrics, both start at 0
function handle(path) {                                                     // pretend to handle one request
  counts.requests++;                                                        // metric: count every request
  const status = path === '/crash' ? 500 : 200;                             // /crash fails, the rest succeed
  if (status >= 500) counts.errors++;                                       // metric: count server errors
  console.log(JSON.stringify({ level: status >= 500 ? 'error' : 'info', path, status })); // a structured JSON log line
}                                                                           // end of handle
['/jobs', '/jobs', '/crash', '/candidates'].forEach(handle);                // simulate 4 requests
const errorRate = (counts.errors / counts.requests) * 100;                  // errors as a percent of all requests
console.log(`requests=${counts.requests} errors=${counts.errors} errorRate=${errorRate}%`); // print the metrics
if (errorRate > 5) console.log('ALARM: error rate above 5% — alert the on-call developer'); // the alarm rule
```

**Output** (real run):

```text
{"level":"info","path":"/jobs","status":200}
{"level":"info","path":"/jobs","status":200}
{"level":"error","path":"/crash","status":500}
{"level":"info","path":"/candidates","status":200}
requests=4 errors=1 errorRate=25%
ALARM: error rate above 5% — alert the on-call developer
```

In real systems you don't write this yourself. A logging library (like pino) writes the JSON, and a monitoring service (like CloudWatch) counts the metrics and runs the alarm.

## 🔍 Deeper version

**The three pillars:**

| Pillar | Answers | Example tools |
|---|---|---|
| **Logs** | "What exactly happened?" | CloudWatch Logs, ELK, Loki |
| **Metrics** | "How many, how fast, how often?" | CloudWatch Metrics, Prometheus, Datadog |
| **Traces** | "Where did this one request spend its time?" | AWS X-Ray, OpenTelemetry, Jaeger |

**Golden signals** (from Google's SRE book):
- **Latency:** how long requests take. Watch the **p95 or p99**, not just the average. The average hides the slow users.
- **Traffic:** requests per second.
- **Errors:** failed requests (5xx) as a percent.
- **Saturation:** how full the system is: CPU, memory, database connections, queue length.

**CloudWatch on AWS (serverless):**
- Everything a Lambda prints with `console.log` goes to **CloudWatch Logs** automatically.
- Lambda sends built-in **metrics**: Invocations, Errors, Duration, Throttles, ConcurrentExecutions. API Gateway adds 4XX/5XX counts and latency. SQS adds queue age.
- **Logs Insights** lets you search JSON logs with a query, for example the 20 slowest requests today.
- **CloudWatch Alarms** watch a metric. For example, "Lambda Errors ≥ 5 in 5 minutes" sends a message through SNS to email or Slack.
- **Log retention:** set it (for example 7 or 30 days). Logs kept forever cost money.

**Good alerts:**
- Alert on **symptoms users feel** (error rate, latency, the site being down), not on causes like "CPU is 70%".
- Use a time window ("for 5 minutes") to avoid alerts on one-second blips.
- Every alert needs an **owner and a runbook**: a short note that says what to check first.

**Logging well** is covered in [logging](topic:testing/logging): levels, JSON, request IDs, and never logging secrets. Grouping errors with stack traces is covered in [error tracking](topic:testing/error-tracking).

**At SkillKeepr (public-safe):** the backend runs on AWS Lambda, so its logs go to CloudWatch. [FILL IN: which monitoring and error-tracking tools you used, and one time an alert or a log helped you find a problem.]

## 🎯 Why do we use it?

- **Find problems before users report them.**
- **Find the cause fast.** Logs plus a request ID take you to the exact failing call.
- **Know if a deploy broke something.** Error rate jumps right after a release mean you should roll back.
- **Plan for growth.** Saturation metrics tell you when to scale.

## ⚠️ Common mistakes

- **Plain-text logs** that can't be searched or filtered. Use JSON.
- **Watching only the average latency.** A few very slow users disappear in the average.
- **Too many alerts.** People mute the channel and miss the real problem.
- **Logs kept forever with no retention setting**, so the bill grows every month.

## 🗣️ How to answer in an interview

> "I think of monitoring in three parts. Logs tell me exactly what happened. Metrics give numbers over time, like request rate, error rate and latency. Alerts notify someone when a metric crosses a line. On AWS with Lambda, everything the function logs goes to CloudWatch Logs, Lambda reports invocations, errors and duration as metrics, and CloudWatch Alarms can notify the team.
>
> I focus on the golden signals: latency, traffic, errors and saturation. I watch p95 latency rather than the average. I alert on what users feel, like the 5xx error rate staying above a few percent for five minutes, not on every small spike, and every alert should say what to check first. For logs, I use structured JSON with a request ID and never log secrets."

## 🔁 Follow-up questions

### Why p95 latency instead of the average?

The average hides the slow tail. If 95 users wait 100 ms and 5 users wait 10 seconds, the average looks fine, but 5% of users are suffering. p95 shows it.

### Logs vs traces?

A log is one event in one service. A trace follows one request across all services and shows how long each step took. Traces help most with microservices.

### How do you avoid alert fatigue?

Alert only on user-facing symptoms. Use time windows. Make every alert actionable with a runbook. Review and remove noisy alerts often.

### What would you check first when an alarm says "error rate high"?

Did we just deploy? Which endpoint is failing (logs by path)? What does the stack trace say? Is a third-party service down? See [intermittent 500s](topic:debugging/intermittent-500s).

## ✅ Quick check

### 1. Which is a metric, not a log?

- A) `{"level":"error","path":"/crash","status":500}`
- B) "Error rate: 2% over the last 5 minutes"

:::answer
**B.** A metric is a number over time. A is one log line about one event.
:::

### 2. Which alert is better?

- A) "CPU above 60% for 1 second"
- B) "5xx error rate above 5% for 5 minutes"

:::answer
**B.** It's a symptom users feel, with a time window to ignore short blips. A would fire all the time for nothing.
:::

### 3. Where do a Lambda function's `console.log` lines go?

:::answer
To **CloudWatch Logs**, automatically, in a log group for that function.
:::
