# [FILL IN] checklist

Your real details are needed in these places. Edit the topic file, replace the whole `[FILL IN: …]` with the true detail, or delete the sentence if it does not apply.
**598 items.**


## resume/01-skillkeepr-overview.md (7)

- [ ] line 25: your honest split, e.g. 70% backend / 30% frontend
- [ ] line 70: team size and roles — how many developers, QA, product, design.
- [ ] line 71: how work is assigned to you — sprint tickets, feature ownership?
- [ ] line 77: the hardest thing for you when you joined, or the hardest feature so far — one concrete example.
- [ ] line 84: any result you can prove — features shipped, bugs fixed, test coverage you added, praise from the team.
- [ ] line 110: your honest reason.
- [ ] line 114: one real trade-off you have seen — for example faster cold starts, more tests in CI, or simpler shared libraries.

## resume/02-platform-architecture.md (6)

- [ ] line 101: any part of this diagram you set up or changed yourself.
- [ ] line 107: one time you traced a problem across these pieces — what you followed and what you found.
- [ ] line 113: anything measurable — number of customer companies, number of functions, uptime, etc. Only if you know it.
- [ ] line 135: confirm any detail you are sure of.
- [ ] line 139: one improvement you would really suggest.
- [ ] line 143: what you know of the deploy process — which tool runs the deploy, and what the CI pipeline checks.

## resume/03-multi-tenant-platform.md (5)

- [ ] line 75: your part — e.g. tenant-aware endpoints you wrote, auth module work, a bug you fixed. Only what is true.
- [ ] line 83: the hardest tenant-related issue you personally hit.
- [ ] line 89: number of tenants, if you know and can share it.
- [ ] line 99: add one sentence about what you personally built or fixed in this area.
- [ ] line 117: if you worked on any of this.

## resume/04-stripe-billing.md (8)

- [ ] line 25: what you actually did.
- [ ] line 79: which events your code handles.
- [ ] line 80: what the cron does exactly, and how often it runs.
- [ ] line 81: what happens to a company's access after a failed payment — grace period, emails, blocking?
- [ ] line 95: which of these you actually used, and any real bug you hit.
- [ ] line 101: any measurable result — fewer manual fixes, fewer support tickets, etc.
- [ ] line 111: one more sentence — e.g. how you handled duplicate events, or a result.
- [ ] line 125: what you did.

## resume/05-reusable-modules.md (8)

- [ ] line 18: one more concrete piece you touched.
- [ ] line 24: the honest answer — or say it was the team's rough estimate.
- [ ] line 68: exactly what you did in auth — e.g. token checks, permission checks, login flow — and anything else you added to the library.
- [ ] line 75: which one SkillKeepr uses, if you want to mention it.
- [ ] line 83: a real moment where a shared-library change was tricky for you.
- [ ] line 89: how this was measured — compare ticket times before/after, or the team's estimate. If it was only an estimate, say "roughly" or remove the number.
- [ ] line 97: the 30% claim and how it was measured — or say 'it noticeably cut our development time'.
- [ ] line 103: the pieces you know best.

## resume/06-ats-integration.md (6)

- [ ] line 79: your own part inside the team's work — e.g. the sync endpoint, the duplicate check, the status sync.
- [ ] line 80: how a company connects its ATS account — through unified.to's connect screen?
- [ ] line 94: the hardest bug or case you hit — e.g. missing emails, a field that differed between ATS tools.
- [ ] line 121: was automatic sync discussed?
- [ ] line 125: what your code does.
- [ ] line 129: what you did.

## resume/07-voice-agent-microservice.md (13)

- [ ] line 32: the real details it collects.
- [ ] line 95: which AWS services — ECS, EC2, Lambda?
- [ ] line 96: how audio flows with Twilio — Media Streams over WebSocket, or Gather/Say?
- [ ] line 97: how the recruiter sees the score and recording — in the SkillKeepr admin portal?
- [ ] line 98: what the AI evaluation checks, and which model scores the call.
- [ ] line 110: what you did about latency, and the rough time per turn if you know it.
- [ ] line 111: how you handled interruptions, silence or bad audio.
- [ ] line 120: number of calls made or customers using it, if you know.
- [ ] line 130: what you did about it.
- [ ] line 138: your real reasons.
- [ ] line 142: your real reason — quality of conversation, following instructions, cost?
- [ ] line 146: what your agent does.
- [ ] line 150: what you did.

## resume/08-voice-state-machine.md (17)

- [ ] line 22: e.g. greeting → consent → questions → candidate's questions → wrap-up, and what moves each one.
- [ ] line 24: confirm your design.
- [ ] line 59: phase 1
- [ ] line 59: phase 2
- [ ] line 59: final phase
- [ ] line 69: the real list of phases.
- [ ] line 70: what moves each phase forward — an answer, a time limit, a number of questions, a signal from Claude?
- [ ] line 71: confirm steps 1–5 match your design.
- [ ] line 72: where the call's state is kept during a call, and what happens if the service restarts.
- [ ] line 81: your hardest part, and what you did.
- [ ] line 89: benefits you really saw — fewer broken calls, easier debugging?
- [ ] line 95: your phases
- [ ] line 97: one real benefit you saw — e.g. easier testing, or seeing exactly which phase caused a problem.
- [ ] line 99: one hard case you handled, like interruptions or long silence.
- [ ] line 109: real phases and triggers.
- [ ] line 117: what you did.
- [ ] line 121: what you did.

## resume/09-grok-voice-premium.md (13)

- [ ] line 25: confirm how you did it
- [ ] line 54: what made you add a premium option — a customer request, a product decision, or call quality feedback?
- [ ] line 65: confirm whether Twilio is still used for the phone line in premium calls, or Grok places the call itself.
- [ ] line 72: how a customer gets premium — a plan feature, a setting, or per call?
- [ ] line 73: how you switched between the two providers in code.
- [ ] line 79: the real hard part for you — audio format, latency, streaming, or something else.
- [ ] line 85: any result you can share — how many customers chose premium, feedback, or the cost difference per call.
- [ ] line 93: how a customer chooses premium, and how you kept the two providers behind one interface.
- [ ] line 95: the real hard part
- [ ] line 101: the real cost difference, if you know it.
- [ ] line 105: confirm how you did it.
- [ ] line 109: what your agent does.
- [ ] line 113: what you measured, if anything.

## resume/10-openai-structured-outputs.md (13)

- [ ] line 23: what your backend did
- [ ] line 55: anything specific — how long recruiters spent on JDs before, or what problem the product team wanted to solve.
- [ ] line 87: confirm how the backend validated the AI output — JSON Schema, Zod, Joi, or the OpenAI SDK's structured output option.
- [ ] line 88: which fields the AI returned.
- [ ] line 89: the resume also says "text assistant" — what was it, and did you work on it?
- [ ] line 95: the real hard part for you — invalid replies, slow replies, keeping the conversation history, or something else.
- [ ] line 96: what happened when validation failed — retry, default values, or an error message.
- [ ] line 102: any result — time saved per JD, number of JDs created this way, or feedback.
- [ ] line 110: how you validated it and what happened when validation failed.
- [ ] line 118: what you did.
- [ ] line 122: what you did, if anything.
- [ ] line 126: any measures in your feature.
- [ ] line 130: the real reason — team choice, existing account, quality.

## resume/11-gap-analysis.md (2)

- [ ] line 65: only if you learn the real details from your team — what was compared, what you did, and what was found.
- [ ] line 105: replace this with a real 2-minute story once you know what you did. Use: problem → what you compared → one contradiction you found → how it was resolved.

## resume/12-build-vs-buy.md (12)

- [ ] line 19: confirm
- [ ] line 57: what triggered the evaluation — cost, quality, control, or a leadership question?
- [ ] line 67: the managed vendor's name.
- [ ] line 68: cost per call for each option, and the volumes you checked.
- [ ] line 69: the switching point — "below X calls a month, buy; above X, build".
- [ ] line 93: the real hard part for you.
- [ ] line 99: what was decided in practice, and what happened after.
- [ ] line 107: the numbers — e.g. at low volume the vendor was cheaper, but above X calls a month our own pipeline was cheaper.
- [ ] line 109: the exact recommendation
- [ ] line 115: your real list.
- [ ] line 123: a document, slides, or a meeting — and what they asked.
- [ ] line 127: confirm with your numbers.

## resume/13-mongodb-aggregation-indexing.md (9)

- [ ] line 89: the one real pipeline you will talk about — which screen, which stages, and why.
- [ ] line 90: the one real index you added — fields, and which query it helped.
- [ ] line 99: the real hard part you faced.
- [ ] line 105: numbers if you have them — e.g. "the jobs list went from 2.1 s to 180 ms; explain() showed COLLSCAN → IXSCAN, docs examined 40,000 → 20".
- [ ] line 111: the screen
- [ ] line 111: the stages, e.g. $match on status, $lookup departments and recruiters, $project, $sort, $skip/$limit, plus a count for the total
- [ ] line 113: which query got slow
- [ ] line 113: the index
- [ ] line 113: the before/after numbers

## resume/14-recruiter-candidate-ui.md (9)

- [ ] line 25: which project
- [ ] line 60: which screens or features you worked on.
- [ ] line 71: 2–3 features you built on the UI — e.g. a list page with filters and pagination, a form, a dashboard.
- [ ] line 72: how you kept styling consistent — a shared theme, shared components.
- [ ] line 81: the real hard part for you.
- [ ] line 85: a result you can share — a feature shipped, a page made faster, a bug fixed, feedback from recruiters.
- [ ] line 91: features
- [ ] line 93: project
- [ ] line 115: if you know the team's reason.

## resume/15-architectures-and-lambda.md (6)

- [ ] line 23: confirm your reasons
- [ ] line 74: which Lambda functions or areas of the main platform you built or changed.
- [ ] line 75: how the voice agent talks to the main platform, if it does — API calls, webhooks, a shared database.
- [ ] line 84: the real hard part you faced.
- [ ] line 88: a measurable or clear result — e.g. a job moved to a queue so the API stayed fast, or a function you made faster.
- [ ] line 96: your Lambda work

## resume/16-production-support-quality.md (12)

- [ ] line 17: one real test
- [ ] line 23: what was slow → what you changed → result
- [ ] line 55: your optimisation story — what was slow → how you found it → what you changed → the result.
- [ ] line 67: one real test you wrote — what it checked.
- [ ] line 71: how you wrote it — annotations in code, or a separate spec file — and which endpoints.
- [ ] line 74: what the GitHub Actions workflow runs — lint, tests, scans, build?
- [ ] line 75: the logging and error-tracking tools you used.
- [ ] line 81: the real hard part — a tricky bug or a slow piece of code.
- [ ] line 85: results — e.g. "the endpoint went from X s to Y ms", or "tests caught a bug before release".
- [ ] line 91: what was slow
- [ ] line 91: logs, timing, explain()
- [ ] line 103: your real bug story.

## ai/03-tokens-cost.md (1)

- [ ] line 128: one real thing you did to keep AI cost down in the JD chatbot or voice agent, if any

## ai/04-context-window.md (1)

- [ ] line 138: how the voice agent or JD chatbot kept the conversation history, if you know

## ai/05-temperature-settings.md (1)

- [ ] line 125: what your backend actually used, if you know

## ai/06-hallucination.md (1)

- [ ] line 122: one way you guarded against wrong AI output in the JD chatbot or call scoring, if any

## ai/07-training-inference-finetuning.md (1)

- [ ] line 126: confirm no fine-tuning was used

## ai/08-ai-coding-tools.md (1)

- [ ] line 140: one real example — e.g. a feature or test suite you built faster with Claude Code at SkillKeepr

## ai/09-reviewing-ai-code.md (1)

- [ ] line 122: one bug you caught in AI-generated code, if you remember one

## ai/10-calling-llm-api.md (1)

- [ ] line 185: one line about the OpenAI-based JD chatbot backend you built at SkillKeepr — e.g. how you handled timeouts or retries there. Only if true.

## ai/11-streaming.md (1)

- [ ] line 165: whether the JD chatbot you built at SkillKeepr streamed its answers, and how. Only if true.

## ai/12-prompt-engineering.md (1)

- [ ] line 161: one prompt you wrote for the JD chatbot backend at SkillKeepr — what context and format you gave it. Only if true.

## ai/13-system-prompts-few-shot.md (1)

- [ ] line 152: a system prompt or few-shot setup you used in the JD chatbot backend at SkillKeepr, or for Claude in the voice agent. Only if true.

## ai/14-structured-outputs.md (1)

- [ ] line 181: how your JD chatbot backend validated the AI output — Zod, Joi, JSON Schema, or the provider's feature — and what it did on failure.

## ai/15-tool-calling.md (1)

- [ ] line 171: if you used tool calling in the voice agent (Claude) or the JD chatbot, name one tool it could call. Only if true.

## ai/16-embeddings-vector-db.md (1)

- [ ] line 145: if SkillKeepr's candidate matching or search used embeddings, say how. Only if true — don't claim it otherwise.

## ai/17-rag.md (1)

- [ ] line 170: if you built or designed any RAG feature (for example, over job descriptions or candidate data), describe it here. Only if true — don't claim it otherwise.

## ai/18-agents.md (1)

- [ ] line 160: if you've built or used an agent-style loop (for example in the voice agent or the JD chatbot backend), add one honest line here.

## ai/19-agentic-multi-agent.md (1)

- [ ] line 143: if your voice agent or another project has an approval or review step, describe it in one honest line.

## ai/20-mcp.md (1)

- [ ] line 159: if you've used MCP servers in your daily work (for example with Claude Code) or built one, add one honest line.

## ai/21-langchain.md (1)

- [ ] line 161: if you've used LangChain in a project, say what for. If not, say honestly that your AI features used the provider SDKs directly.

## ai/22-langgraph.md (1)

- [ ] line 158: say honestly whether you've used LangGraph itself. If not: "I built the voice agent's state machine by hand, and I've practised LangGraph separately."

## ai/23-evals.md (1)

- [ ] line 141: how you tested the AI JD chatbot backend or the voice-call scoring, if you did. Only add it if it's true.

## ai/24-prompt-injection-guardrails.md (1)

- [ ] line 145: if you added any input or output checks to the JD chatbot or voice agent, describe them honestly here.

## ai/25-cost-latency.md (1)

- [ ] line 152: any real cost or latency step you took in the voice agent or JD chatbot — for example short prompts, ending calls once details are collected, or streaming. Only if true.

## ai/26-voice-ai.md (2)

- [ ] line 151: the real latency per turn you saw, how you handled barge-in and silence, and the real phase names — only what's true.
- [ ] line 161: what your agent does.

## architecture/01-what-is-architecture.md (1)

- [ ] line 148: how architecture decisions are made in your team.

## architecture/03-microservices.md (1)

- [ ] line 120: how the voice service and the main platform talk to each other.

## architecture/04-when-to-split.md (1)

- [ ] line 121: any other reason your team kept it separate.

## architecture/06-layered-architecture.md (1)

- [ ] line 133: which layers you personally worked in.

## architecture/07-service-communication.md (1)

- [ ] line 126: one async flow you worked on, e.g. the Stripe renewal cron and webhook.

## architecture/08-api-gateway.md (1)

- [ ] line 126: anything you configured in API Gateway yourself.

## architecture/09-serverless-lambda.md (1)

- [ ] line 142: which Lambda functions or features you built.

## architecture/10-serverless-limits.md (1)

- [ ] line 168: a real cold-start or timeout issue you handled there, if any — only if true.

## architecture/11-event-driven.md (1)

- [ ] line 128: one event flow you built yourself, e.g. the Stripe renewal webhook, and what reacts to it.

## architecture/12-multi-tenant.md (1)

- [ ] line 148: the part of the multi-tenant flow you personally worked on, if any.

## architecture/13-state-machines.md (1)

- [ ] line 135: the real phase names — don't use the example ones above in an interview.

## architecture/14-gap-analysis-adrs.md (1)

- [ ] line 172: only if you learn the real story from your team — what was compared, what you found, and what changed.

## architecture/15-idempotent-consumers.md (1)

- [ ] line 153: how duplicates were handled in the Stripe renewal webhook or the ATS sync you worked on — only what's true.

## architecture/16-shared-vs-db-per-tenant.md (1)

- [ ] line 144: anything you personally handled with per-tenant databases, e.g. migrations, seed data or connection issues — only if true.

## architecture/17-resilience.md (1)

- [ ] line 140: one real case where a partner was slow or failing, and what you did — only if true.

## debugging/01-how-to-answer.md (1)

- [ ] line 133: one real bug you found and fixed at SkillKeepr, told in these 4 steps. Only if it's true.

## debugging/02-unnecessary-re-renders.md (1)

- [ ] line 148: a real re-render problem you fixed in the recruiter or candidate screens, if you have one.

## debugging/03-slow-first-load.md (1)

- [ ] line 143: if you did load-time work on SkillKeepr's portals (for example code-split pages), add one real line here.

## debugging/04-slow-long-list.md (1)

- [ ] line 128: does a SkillKeepr table use server-side pagination (most list screens do)? Add one real example if you worked on one.

## debugging/05-slow-search-typing.md (1)

- [ ] line 133: confirm the delay you used and one screen where you worked on this.

## debugging/06-useeffect-infinite-loop.md (1)

- [ ] line 121: a real infinite-loop bug you hit in a SkillKeepr screen, if you have one.

## debugging/07-stale-data-after-save.md (1)

- [ ] line 119: SkillKeepr uses Redux with sagas — add a real case where you refreshed data after a save, if you have one.

## debugging/08-search-race-condition.md (1)

- [ ] line 138: SkillKeepr's frontend uses redux-saga — confirm if search sagas use takeLatest, and add a real example if you have one.

## debugging/09-frontend-memory-leak.md (1)

- [ ] line 154: a real memory or performance issue you found in a React app, if you have one. Only add it if it's true.

## debugging/11-works-locally-not-prod.md (2)

- [ ] line 123: which tool you use, if any.
- [ ] line 142: a real "works locally, broken in production" bug you fixed, with the cause. Only add it if it's true.

## debugging/12-random-logouts.md (1)

- [ ] line 137: if users reported logouts on your project, what the cause was. Only add it if it's true.

## debugging/13-white-screen-crash.md (2)

- [ ] line 53: tool you use, if any.
- [ ] line 136: if your project has (or lacks) error boundaries, and what you would add. Keep it public-safe.

## debugging/14-layout-breaks-mobile.md (1)

- [ ] line 143: a real mobile layout bug you fixed with Mantine or Tailwind, if you have one. Only add it if it's true.

## debugging/15-slow-big-form.md (1)

- [ ] line 148: which form library your project uses and a form you built, if you have one. Only add it if it's true.

## debugging/16-prop-drilling.md (1)

- [ ] line 143: how your project shares the logged-in user and permissions across pages, at a public-safe level, if you know it.

## debugging/18-slow-endpoint.md (1)

- [ ] line 162: a real slow endpoint you fixed at SkillKeepr — what was slow, what you found, what you changed, and the before/after time. Only if it's true.

## debugging/19-server-unresponsive-load.md (1)

- [ ] line 161: a real case where a Node service froze under load and what you changed — only if it happened.

## debugging/20-server-memory-leak.md (1)

- [ ] line 153: a real memory problem you saw in a Node service — only if it happened.

## debugging/21-duplicate-webhook-events.md (1)

- [ ] line 155: whether you saw duplicate events and what safeguard the renewal webhook actually uses — only what's true.

## debugging/22-cross-tenant-data-leak.md (1)

- [ ] line 155: any tenant-isolation work you did yourself — only if true.

## debugging/23-intermittent-500s.md (1)

- [ ] line 161: a real intermittent error you investigated in production — what the pattern was and the fix. Only if it happened.

## debugging/24-unhandled-rejection-crash.md (1)

- [ ] line 146: a real crash like this you fixed — only if it happened.

## debugging/25-lost-update.md (1)

- [ ] line 166: a real case where two users or two jobs overwrote each other's change — only if it happened.

## debugging/26-third-party-api-down.md (1)

- [ ] line 160: a real time an outside service (Stripe, Twilio, unified.to, Google speech) was slow or down for you, and what you did. Only if true.

## debugging/27-login-brute-force.md (1)

- [ ] line 149: if you added rate limiting or lockout to a login route at SkillKeepr or in a project, say what you did. Only if true.

## debugging/28-query-slow-in-prod.md (1)

- [ ] line 147: a real slow query you fixed at SkillKeepr, with the before/after numbers. See the MongoDB aggregation resume page for how to prepare it. Only if true.

## debugging/29-large-upload-crash.md (1)

- [ ] line 166: SkillKeepr uploads bulk resumes and interview videos straight to S3 with presigned multipart URLs. Say which part you worked on, if any. Only if true.

## debugging/30-auth-errors-after-deploy.md (1)

- [ ] line 141: a real auth problem after a deploy you saw at SkillKeepr or elsewhere, and how you found it. Only if true.

## debugging/31-background-job-twice.md (1)

- [ ] line 160: a real duplicate or stuck job you saw — for example in resume parsing or ATS candidate sync — and what you changed. Only if true.

## debugging/32-cors-error.md (1)

- [ ] line 147: a real CORS problem you fixed — for example after a new subdomain or adding cookies. Only if true.

## debugging/33-charged-no-access.md (1)

- [ ] line 174: a real "charged but no access" or renewal issue you saw, and how you fixed it. Only if it really happened — otherwise, keep the answer as "how I would debug it".

## devops/01-git-basics.md (1)

- [ ] line 138: your team's branch naming or commit message style at SkillKeepr, if you have one.

## devops/02-branching-prs.md (1)

- [ ] line 145: your team's real flow at SkillKeepr — e.g. feature branches into develop, how many approvals, which checks run on PRs.

## devops/03-merge-vs-rebase.md (1)

- [ ] line 144: does your team prefer merge or rebase for updating feature branches, and squash or merge commits for PRs?

## devops/04-merge-conflicts.md (1)

- [ ] line 145: a real conflict you resolved at work, if you remember one — e.g. two people editing the same route or config.

## devops/05-git-commands.md (1)

- [ ] line 147: a time you used revert or cherry-pick at work, if any.

## devops/06-what-is-cicd.md (2)

- [ ] line 155: your own part in the pipelines, if any.
- [ ] line 179: what the pipeline you used at SkillKeepr runs — e.g. type-check and lint before commit, scans in GitHub Actions, deploys through AWS CodeBuild — and what part you set up or changed.

## devops/07-github-actions.md (2)

- [ ] line 151: which workflows you wrote or changed, if any.
- [ ] line 175: a workflow you wrote or maintained — e.g. for a personal project deployed to Railway or GitHub Pages.

## devops/08-ci-secrets.md (1)

- [ ] line 147: how secrets were handled in pipelines you worked with — e.g. at SkillKeepr or in your personal projects on Railway.

## devops/09-environments.md (2)

- [ ] line 112: which stages you deploy to and how a change gets to production.
- [ ] line 136: one sentence about the environments you deploy to at SkillKeepr.

## devops/10-railway.md (1)

- [ ] line 143: name one personal project you deployed on Railway and what it does.

## devops/11-rollback.md (1)

- [ ] line 135: how a bad deploy is rolled back in your team, and one real time you did it, if you have one.

## devops/13-aws-basics.md (1)

- [ ] line 132: which AWS services you personally set up or changed.

## devops/14-gcp-basics.md (3)

- [ ] line 104: how your voice agent authenticates to Google Cloud.
- [ ] line 131: one real problem you hit with the speech APIs — audio format, latency or accents — and how you solved it.
- [ ] line 137: your real reason for choosing Google's speech services.

## devops/15-docker-basics.md (2)

- [ ] line 128: how much you've used Docker yourself — local development, writing Dockerfiles, or deploying containers.
- [ ] line 154: a real place you used Docker — local MongoDB/Redis, a Dockerfile you wrote, or a containerised service.

## devops/16-dockerfile-node.md (1)

- [ ] line 155: whether you wrote or changed Dockerfiles at work or in personal projects, and for which service.

## devops/17-docker-compose.md (1)

- [ ] line 148: whether you used docker compose for local development, and for which services. Only if true.

## devops/18-secrets-management.md (1)

- [ ] line 116: your own part in this, if any — for example adding a new secret for the Stripe renewal work.

## devops/19-monitoring-alerts.md (1)

- [ ] line 108: which monitoring and error-tracking tools you used, and one time an alert or a log helped you find a problem.

## devops/20-health-checks.md (1)

- [ ] line 133: any uptime monitor or health check you set up or used at work. Only if true.

## devops/21-dns-https.md (1)

- [ ] line 110: your own part with domains or certificates, if any.

## devops/22-scaling-deployments.md (1)

- [ ] line 117: any scaling problem you saw or handled.

## express/01-what-is-express.md (1)

- [ ] line 160: one line on what your Express services at SkillKeepr do (for example, which APIs you built). Only add what's true.

## express/07-builtin-middleware.md (1)

- [ ] line 172: which of these packages your Express services at SkillKeepr actually use (for example the logger), and how CORS is configured there. Only add what's true.

## express/08-custom-middleware.md (1)

- [ ] line 198: how JWT auth and roles are set up in your SkillKeepr services (for example, recruiter vs candidate roles), if you can share it. The resume confirms you used JWT; add details only if true.

## express/09-error-middleware.md (1)

- [ ] line 147: how errors were handled in the SkillKeepr Express services — for example a shared error handler that was part of your reusable backend modules. Only add it if it's true.

## express/10-async-errors.md (1)

- [ ] line 164: whether the SkillKeepr services are on Express 4 or 5, and whether an error class or async wrapper was part of the reusable backend modules on your resume. Only add what's true.

## express/11-project-structure.md (1)

- [ ] line 197: how the SkillKeepr backend services are organised (layer-based or feature-based), and which parts were in the "reusable backend module patterns" on your resume that cut development time by ~30%. Only add what's true.

## express/12-validation.md (1)

- [ ] line 167: which validation library the SkillKeepr Express services use (Joi, Zod, express-validator, or something else). Only add it if it's true.

## express/13-response-format.md (1)

- [ ] line 169: the response format used in the SkillKeepr APIs and how it appears in your Swagger docs. Only add it if it's true.

## express/14-cors.md (1)

- [ ] line 155: a real CORS issue you fixed between the SkillKeepr frontend and backend (for example a new environment or domain). Only add it if it's true.

## express/15-security-middleware.md (1)

- [ ] line 163: which of these were set up in the SkillKeepr Express services (helmet, rate limiting, CORS, validation), and anything specific you added. Only add what's true.

## express/16-file-uploads.md (1)

- [ ] line 172: any real file upload feature at SkillKeepr (e.g. resumes or candidate documents) and where the files were stored. Only add it if it's true.

## express/17-static-files.md (1)

- [ ] line 151: how static files or the React build were served in your SkillKeepr projects (CDN, nginx, cloud storage, Express) — only if you know.

## express/18-logging.md (1)

- [ ] line 168: which logging and error-tracking tools you used at SkillKeepr (the resume mentions logging and error tracking, but not the tool names) — only if you know.

## express/19-pagination-filtering.md (1)

- [ ] line 171: a real list endpoint you paginated at SkillKeepr (e.g. candidates or jobs), and whether it used page numbers or cursors — only if you know.

## express/20-express-5.md (1)

- [ ] line 187: whether your SkillKeepr services run Express 4 or Express 5, and if you did or planned an upgrade — only if you know.

## express/21-supertest.md (1)

- [ ] line 181: what your Jest coverage at SkillKeepr included — unit tests, route tests with Supertest, or both, and one real example. The resume mentions Jest coverage, but not Supertest specifically.

## express/22-health-checks.md (1)

- [ ] line 182: what health checks or uptime monitoring you used for SkillKeepr services (Railway, AWS, GCP) — only if you know.

## express/23-dependency-injection.md (1)

- [ ] line 179: how dependencies were shared in your SkillKeepr backend (e.g. the "reusable backend module patterns" on your resume) — only describe what was really done.

## express/24-performance.md (1)

- [ ] line 159: one real performance fix you made at SkillKeepr — the resume mentions indexing so response times held as data grew; add the details only if you remember them.

## express/25-joi.md (1)

- [ ] line 233: one schema you wrote, e.g. for which endpoint, and anything tricky like a when() rule.

## hr/01-star-method.md (3)

- [ ] line 77: one specific thing you found or fixed while testing.
- [ ] line 79: the real result — for example, no renewal issues after release.
- [ ] line 125: e.g. hardest problem, a mistake, learning fast

## hr/02-tell-me-about-yourself.md (2)

- [ ] line 66: what you want — e.g. own bigger backend and AI features, work at larger scale
- [ ] line 66: company

## hr/03-my-journey.md (7)

- [ ] line 55: your real reason.
- [ ] line 62: what first got you interested in programming.
- [ ] line 66: your first tasks
- [ ] line 68: the next step you want
- [ ] line 94: one or two projects you built, and what each one did.
- [ ] line 98: your own reason, if different.
- [ ] line 102: your real routine — e.g. weekends and evenings.

## hr/04-why-change.md (6)

- [ ] line 65: your real reasons — e.g. bigger scale, deeper ownership of backend services, more AI work
- [ ] line 67: company
- [ ] line 67: something specific about them
- [ ] line 89: your honest, positive version.
- [ ] line 93: if true, a short positive line.
- [ ] line 101: your real situation.

## hr/05-why-this-company.md (7)

- [ ] line 62: company
- [ ] line 62: their product
- [ ] line 62: their users
- [ ] line 64: one specific thing — e.g. the scale of your platform, your AI features, your engineering blog post about X
- [ ] line 66: the one skill from their job description you match best.
- [ ] line 68: an area they are strong in
- [ ] line 90: per company.

## hr/06-strengths.md (6)

- [ ] line 21: confirm this was new to you
- [ ] line 58: confirm these were new to you
- [ ] line 65: how quickly you learned it, or what was new to you.
- [ ] line 69: link to their job — e.g. you're building AI features and integrating many services
- [ ] line 91: one more real example.
- [ ] line 95: what your manager has actually praised you for.

## hr/07-weaknesses.md (6)

- [ ] line 62: a small, real example — e.g. a time you spent too long on a bug.
- [ ] line 64: e.g. an hour
- [ ] line 66: a real improvement — e.g. blockers get solved faster.
- [ ] line 70: real progress.
- [ ] line 96: your real evidence.
- [ ] line 100: real feedback, and what you did with it.

## hr/08-salary.md (4)

- [ ] line 71: city
- [ ] line 71: your researched range — keep it private
- [ ] line 77: private
- [ ] line 107: your situation.

## hr/09-notice-period.md (5)

- [ ] line 69: e.g. 30 / 60 / 90 days — private
- [ ] line 71: whether a buyout is possible, if true.
- [ ] line 75: private
- [ ] line 101: your honest stance.
- [ ] line 109: your company's usual practice.

## hr/10-hardest-problem.md (8)

- [ ] line 74: what you did about latency.
- [ ] line 76: the real phases.
- [ ] line 84: one tricky case you found or handled.
- [ ] line 86: the real result.
- [ ] line 108: the real phases and what moves the call from one to the next.
- [ ] line 112: what you actually did.
- [ ] line 116: what you actually did.
- [ ] line 124: voice agent / Stripe / other

## hr/11-production-mistake.md (10)

- [ ] line 64: what went wrong — e.g. a change you shipped that broke something for users
- [ ] line 66: the real cause, in one line
- [ ] line 66: how you found out — logs, an alert, a user report
- [ ] line 68: the quick fix — e.g. rolled back or patched it
- [ ] line 70: what you changed — e.g. added a Jest test for that case, added a check to the code review list, added logging
- [ ] line 72: one line — e.g. test the edge case before shipping, not after
- [ ] line 72: how you work differently now
- [ ] line 94: how you found yours.
- [ ] line 112: what broke and who it affected
- [ ] line 113: what I owned

## hr/12-disagreement.md (9)

- [ ] line 61: the real topic — e.g. how to design an API, how to structure a feature, or an estimate
- [ ] line 63: your idea
- [ ] line 63: your reason — e.g. it was simpler to test, or safer for production
- [ ] line 65: their idea
- [ ] line 65: their reason
- [ ] line 67: how — e.g. trying a small version, looking at data, or asking the lead
- [ ] line 67: the final choice
- [ ] line 69: the result — e.g. it shipped on time
- [ ] line 102: a real example, if you have one.

## hr/13-deadline-bug.md (2)

- [ ] line 66: hours
- [ ] line 72: optional — a real time this happened to you, and what you did.

## hr/14-unclear-requirements.md (2)

- [ ] line 67: optional — a real example, e.g. a feature at SkillKeepr where you clarified requirements with product or design before building.
- [ ] line 98: whether your team writes them, and who writes them.

## hr/15-learning-fast.md (4)

- [ ] line 61: what you actually did — e.g. read the docs, made a small test call, then connected it to the agent
- [ ] line 65: one more result you can share.
- [ ] line 86: the real hard part — e.g. real-time audio, latency, or the conversation flow.
- [ ] line 90: a rough honest time, e.g. a few weeks to a first working version.

## hr/16-agile-scrum.md (8)

- [ ] line 60: e.g. two weeks
- [ ] line 60: tool, e.g. Jira
- [ ] line 62: story points or hours
- [ ] line 62: how — e.g. the lead, or people pick them
- [ ] line 66: one real change your team made after a retro, if you have one.
- [ ] line 91: your team's estimation style.
- [ ] line 95: your team's version.
- [ ] line 99: a real example, if you have one.

## hr/17-rebuild-differently.md (5)

- [ ] line 66: idea 1 — e.g. caching settings that are read on every request
- [ ] line 68: idea 2 — e.g. running tests automatically in CI on every pull request
- [ ] line 70: optional idea 3, with reason and trade-off.
- [ ] line 102: your choice and why.
- [ ] line 106: something you think worked well — e.g. shared backend modules that save time across services.

## hr/18-three-years.md (3)

- [ ] line 61: something specific about this company or role — e.g. the scale of the product, the backend ownership, or AI work
- [ ] line 85: your honest answer.
- [ ] line 93: your honest reason — e.g. you enjoy designing systems and APIs, and the voice agent work.

## hr/19-questions-to-ask.md (1)

- [ ] line 79: a related project of yours, if it fits

## html-css/05-accessibility.md (1)

- [ ] line 139: one accessibility fix you made in a real project, if any. Only if it's true.

## html-css/17-organising-css.md (1)

- [ ] line 155: which approach your SkillKeepr frontend uses — e.g. the component library's sx / styled API, plain CSS, or utility classes.

## html-css/20-core-web-vitals.md (1)

- [ ] line 157: any real performance improvement you made on the SkillKeepr frontend — e.g. code splitting or image handling — and its effect, if you measured it.

## javascript/09-closures.md (1)

- [ ] line 141: one real place you used a closure at SkillKeepr, if you can think of one — e.g. a middleware or helper you wrote. Only add it if it's true.

## javascript/19-classes.md (1)

- [ ] line 153: a class you wrote at SkillKeepr, for example a custom error or service class — only if it's true.

## javascript/23-async-await.md (1)

- [ ] line 153: a real place you used Promise.all or async/await error handling at SkillKeepr, e.g. calling several APIs at once — only if it's true.

## javascript/24-promise-combinators.md (1)

- [ ] line 154: a real place you ran calls in parallel at SkillKeepr, e.g. loading recruiter dashboard data — only if it's true.

## javascript/26-modules.md (1)

- [ ] line 153: which module system your SkillKeepr frontend and backend use — only if you know it.

## javascript/29-fetch-api.md (1)

- [ ] line 146: whether the SkillKeepr frontend uses axios or fetch, and how the API helper is set up. Only add it if it's true.

## javascript/30-browser-storage.md (1)

- [ ] line 133: where the SkillKeepr frontend stores the JWT (localStorage, memory, or httpOnly cookie). Only add it if it's true.

## javascript/31-debounce-throttle.md (1)

- [ ] line 153: a real place you used debounce in the recruiter or candidate screens at SkillKeepr, e.g. a candidate search box. Only add it if it's true.

## javascript/34-currying-composition.md (1)

- [ ] line 137: a real helper or middleware factory from your SkillKeepr code that uses this idea, if you have one. Only add it if it's true.

## javascript/35-memoization.md (1)

- [ ] line 152: a place where you cached an expensive calculation or API result at SkillKeepr, if you have one. Only add it if it's true.

## javascript/36-garbage-collection.md (1)

- [ ] line 142: a real memory problem you found in the recruiter or candidate screens at SkillKeepr, if any. Only add it if it's true.

## javascript/37-generators-iterators.md (1)

- [ ] line 155: if you ever looped over paginated API results (e.g. an ATS sync) or a stream with for await...of at SkillKeepr, mention it here. Only add it if it's true.

## javascript/38-polyfills.md (1)

- [ ] line 157: if you ever had to add a polyfill or fix a browser-support issue in the SkillKeepr frontend, mention it here. Only add it if it's true.

## mantine-tailwind/01-component-library-vs-utility.md (1)

- [ ] line 131: one SkillKeepr screen you built with Mantine, if you want a concrete example.

## mantine-tailwind/02-mantine-setup.md (1)

- [ ] line 187: one screen or component you built with Mantine at SkillKeepr.

## mantine-tailwind/03-mantine-layout.md (1)

- [ ] line 144: a page layout you built with these at SkillKeepr — e.g. a list page with a toolbar row and a results column.

## mantine-tailwind/04-style-props-spacing.md (1)

- [ ] line 145: if you used style props or the spacing scale at SkillKeepr, add one example.

## mantine-tailwind/05-mantine-theming.md (1)

- [ ] line 179: if you changed or extended the SkillKeepr theme, say what you added.

## mantine-tailwind/06-mantine-grid.md (1)

- [ ] line 149: a SkillKeepr screen where you used Grid or SimpleGrid, e.g. dashboard tiles.

## mantine-tailwind/07-mantine-customizing.md (1)

- [ ] line 150: a component you customised at SkillKeepr, e.g. a themed table or uploader.

## mantine-tailwind/08-mantine-dark-mode.md (1)

- [ ] line 155: whether the SkillKeepr portals support dark mode, and anything you built for it.

## mantine-tailwind/09-tailwind-setup.md (1)

- [ ] line 166: the early-career project where you used Tailwind, and what you built with it.

## mantine-tailwind/10-tailwind-classes.md (1)

- [ ] line 140: a project where you used Tailwind — your notes say it was early in your career.

## mantine-tailwind/13-tailwind-reuse.md (1)

- [ ] line 153: if you built a shared component like this in a past project, mention it — only if true.

## mantine-tailwind/14-mantine-and-tailwind-together.md (1)

- [ ] line 151: whether any project you worked on mixed Mantine (or another library) with Tailwind, and how you handled styling conflicts.

## mantine-tailwind/15-ant-design.md (1)

- [ ] line 150: which early project used Ant Design, and what you built with it.

## mantine-tailwind/17-bundle-size.md (1)

- [ ] line 146: if you reduced a bundle or sped up a page load, add the real before/after here — only if true.

## mantine-tailwind/18-mantine-form.md (1)

- [ ] line 156: a SkillKeepr form you worked on, if any — I worked mainly on the backend, so say so honestly if you didn't build the form UI.

## mantine-tailwind/19-mantine-hooks.md (1)

- [ ] line 141: a hook you personally used in SkillKeepr code, if any.

## mantine-tailwind/20-antd-form-table.md (1)

- [ ] line 156: which early-career project used Ant Design, and what form or table you built with it.

## mongodb/01-what-is-mongodb.md (1)

- [ ] line 146: one or two lines on what the main SkillKeepr collections are (for example candidates, jobs, recruiters) and how big they are, only if you know it.

## mongodb/02-sql-vs-nosql.md (1)

- [ ] line 137: why MongoDB was chosen for SkillKeepr, and where (if anywhere) PostgreSQL is used there. Your resume lists both — say only what is true.

## mongodb/03-bson-objectid.md (1)

- [ ] line 143: if SkillKeepr uses custom _id values (not ObjectId) anywhere, mention it here. Only if true.

## mongodb/04-crud.md (1)

- [ ] line 174: a real example of upsert or bulk updates at SkillKeepr, for example in the Workable candidate sync — only if that is how it was built.

## mongodb/05-query-operators.md (1)

- [ ] line 163: an example of a real recruiter filter you built at SkillKeepr (which fields were filtered), only if you remember it accurately.

## mongodb/06-update-operators.md (1)

- [ ] line 163: one real update you wrote at SkillKeepr (for example changing an application's status inside a candidate or job document), only if you remember it accurately.

## mongodb/07-projection-sort-limit.md (1)

- [ ] line 152: how list screens (e.g. candidate lists for recruiters) were paginated at SkillKeepr — page numbers or "load more" — only if you know.

## mongodb/08-mongoose-basics.md (1)

- [ ] line 154: how SkillKeepr's Express services set up Mongoose (one shared connection module? schema files per model? lean() on list endpoints?) — only what is true.

## mongodb/09-schema-validation.md (1)

- [ ] line 179: a real field rule or default you added to a candidate or recruiter schema at SkillKeepr, if you have one. Only add it if it's true.

## mongodb/10-mongoose-crud.md (1)

- [ ] line 175: one real CRUD route from SkillKeepr, like updating a candidate's status. Only add it if it's true.

## mongodb/11-embedding-vs-referencing.md (1)

- [ ] line 159: one real modelling choice in the SkillKeepr candidate or recruiter data (what you embedded and what you referenced). Only add it if it's true.

## mongodb/12-relationships.md (1)

- [ ] line 159: how candidates, jobs and applications are actually connected in SkillKeepr's data, if you can describe it. Only add it if it's true.

## mongodb/13-populate.md (1)

- [ ] line 165: a real place you used populate or $lookup at SkillKeepr, like showing candidate names on an applications list. Only add it if it's true.

## mongodb/14-mongoose-middleware.md (1)

- [ ] line 167: a real hook you wrote or used in SkillKeepr's models (for example bcrypt hashing or timestamps). Only add it if it's true.

## mongodb/15-virtuals-methods-statics.md (1)

- [ ] line 172: a method, static or virtual you used in SkillKeepr's models, if any. Only add it if it's true.

## mongodb/16-lean-and-select.md (1)

- [ ] line 155: a real read endpoint at SkillKeepr where you used lean or select, or saw a speed gain. Only add it if it's true.

## mongodb/17-indexes.md (1)

- [ ] line 160: a real index you added on SkillKeepr candidate or recruiter data, and how you knew it helped. Only add it if it's true.

## mongodb/18-compound-indexes-esr.md (1)

- [ ] line 159: a real compound index from SkillKeepr (field order) and the query it served. Only add it if it's true.

## mongodb/19-special-indexes.md (1)

- [ ] line 156: any unique, TTL or partial index you actually used at SkillKeepr (e.g. for tokens or per-tenant uniqueness). Only add it if it's true.

## mongodb/20-explain.md (1)

- [ ] line 180: a real query you checked with explain at SkillKeepr, and the before/after numbers if you have them. Only add it if it's true.

## mongodb/21-aggregation-basics.md (1)

- [ ] line 164: a real aggregation pipeline you wrote at SkillKeepr over candidate or recruiter data — what report it powered. Only add it if it's true.

## mongodb/22-lookup-unwind.md (1)

- [ ] line 179: where you used populate or $lookup at SkillKeepr (e.g. recruiter dashboards). Only add it if it's true.

## mongodb/23-pagination.md (1)

- [ ] line 163: which pagination style SkillKeepr's candidate or application lists use. Only add it if it's true.

## mongodb/24-multi-tenant-design.md (1)

- [ ] line 174: how SkillKeepr's multi-tenant data is actually separated (shared collections vs database per tenant) and where tenantId is enforced. Only add what's true.

## mongodb/25-nosql-injection.md (1)

- [ ] line 146: how input validation and tenant filtering are done in the SkillKeepr backend — only if true.

## mongodb/26-index-costs.md (1)

- [ ] line 127: a real index you added or removed on the multi-tenant collections at SkillKeepr, and how you measured it — only if true.

## mongodb/27-advanced-aggregation.md (1)

- [ ] line 160: if you used $facet or $bucket in the multi-tenant aggregation pipelines at SkillKeepr, describe the report here — only if true.

## mongodb/28-transactions.md (1)

- [ ] line 147: whether the Stripe billing and renewal flow at SkillKeepr used MongoDB transactions, and for which writes — only if true.

## mongodb/29-atomic-updates-locking.md (1)

- [ ] line 153: a real race condition or duplicate-record bug you saw at SkillKeepr and how you fixed it — only if true.

## mongodb/30-scaling-overview.md (1)

- [ ] line 144: how the SkillKeepr MongoDB is hosted (Atlas or self-managed, replica set or sharded) — only if true.

## mongodb/31-atlas-vector-search.md (1)

- [ ] line 170: whether SkillKeepr uses MongoDB Atlas, and whether any feature uses vector search — only if true.

## nextjs/01-what-is-nextjs.md (1)

- [ ] line 138: once you've built the practice project, add — 'I built a small job board with Server Components and a Server Action'.

## nextjs/02-react-vs-nextjs.md (1)

- [ ] line 138: name the build tool your SkillKeepr frontend uses, only if you know it.

## nextjs/03-project-structure.md (1)

- [ ] line 153: once you've built the practice project, mention how you organised it.

## nextjs/04-app-vs-pages-router.md (1)

- [ ] line 127: once you've built the practice project, mention it here.

## nextjs/05-file-based-routing.md (1)

- [ ] line 143: confirm React Router version used at SkillKeepr

## nextjs/06-dynamic-routes.md (1)

- [ ] line 151: once you've built the practice project, mention your /jobs/[id

## nextjs/07-layouts.md (1)

- [ ] line 161: confirm how your SkillKeepr app wrapped pages in a layout

## nextjs/08-special-files.md (1)

- [ ] line 172: confirm how your SkillKeepr app showed loading and errors, e.g. per-slice loading/error state.

## nextjs/09-route-groups.md (1)

- [ ] line 144: once you've built the practice project, mention how you used a route group in it.

## nextjs/10-server-components.md (1)

- [ ] line 135: once you've built the practice project, mention one Server Component you wrote.

## nextjs/11-client-components.md (1)

- [ ] line 152: once you've built the practice project, mention the 'use client' component you made.

## nextjs/12-rendering-types.md (1)

- [ ] line 138: once you've built the practice project, say which rendering type each page used.

## nextjs/13-hydration.md (1)

- [ ] line 140: once you've built the practice project, mention a hydration issue you hit, if any.

## nextjs/14-data-fetching-caching.md (1)

- [ ] line 187: once you've built the practice project, describe what you cached and how you cleared it.

## nextjs/15-streaming.md (1)

- [ ] line 137: once you've built the practice project, mention a part you streamed.

## nextjs/16-server-actions.md (1)

- [ ] line 175: once you've built the practice project, mention your Server Action for adding a job.

## nextjs/17-route-handlers.md (1)

- [ ] line 158: once you've built the practice project, add one line about the Route Handler you wrote.

## nextjs/18-navigation.md (1)

- [ ] line 142: once you've built the practice project, mention one place you used Link or redirect.

## nextjs/19-image-font-metadata.md (1)

- [ ] line 162: once you've built the practice project, mention your metadata and image setup.

## nextjs/20-env-variables.md (1)

- [ ] line 145: once you've built the practice project, mention which variables it uses.

## nextjs/21-proxy.md (1)

- [ ] line 133: once you've built the practice project, mention the proxy rule you added.

## nextjs/22-authentication.md (1)

- [ ] line 156: confirm you're comfortable saying the last line — your resume says you worked on authentication modules in the shared backend library.

## nextjs/23-deployment.md (1)

- [ ] line 175: once you've deployed the practice project, say where (e.g. Vercel) and add the live link.

## nodejs/05-event-loop.md (1)

- [ ] line 160: if you ever fixed slow or blocking code in a Node service at SkillKeepr, add one line about it here. Only if it's true.

## nodejs/07-blocking-the-event-loop.md (1)

- [ ] line 161: if you ever saw or fixed a slow endpoint or blocking code at SkillKeepr, add one line here. Only if it's true.

## nodejs/09-commonjs-vs-esm.md (1)

- [ ] line 145: which module system your SkillKeepr Node services use — CommonJS or ESM — if you know. Only add it if it's true.

## nodejs/10-npm-and-package-json.md (1)

- [ ] line 143: anything specific about how dependencies are managed in your SkillKeepr projects (e.g. npm vs pnpm, npm ci in GitHub Actions). Only add it if it's true.

## nodejs/13-environment-variables.md (1)

- [ ] line 148: where secrets live for your SkillKeepr services — e.g. Railway variables, GitHub Actions secrets, AWS or GCP — if you know. Only add it if it's true.

## nodejs/14-fs-module.md (1)

- [ ] line 141: a real place you used fs in a SkillKeepr service (e.g. reading templates, writing exports or handling uploads), if any. Only add it if it's true.

## nodejs/17-event-emitter.md (1)

- [ ] line 155: a place you used EventEmitter or Node events in a SkillKeepr service, if any. Only add it if it's true.

## nodejs/18-async-patterns.md (1)

- [ ] line 165: a real place at SkillKeepr where you ran calls in parallel or fixed a missing await. Only add it if it's true.

## nodejs/19-error-handling.md (1)

- [ ] line 177: how errors were logged or tracked in production at SkillKeepr (the resume mentions logging and error tracking — add the real tool name). Only add what's true.

## nodejs/20-buffers.md (1)

- [ ] line 144: confirm how the raw body was handled for the Stripe webhook route at SkillKeepr (the resume mentions secure webhook handling). Only add what's true.

## nodejs/21-streams.md (1)

- [ ] line 150: any place you streamed files, exports or uploads at SkillKeepr. Only add it if it's true.

## nodejs/23-worker-threads.md (1)

- [ ] line 130: any CPU-heavy work at SkillKeepr that was moved off the main thread or to a background job, if any. Only add it if it's true.

## nodejs/25-cluster-and-pm2.md (1)

- [ ] line 149: how your Node services were run in production at SkillKeepr (PM2, Railway, containers, Lambda?). Only add what is true.

## nodejs/26-memory-and-leaks.md (1)

- [ ] line 149: if you ever investigated memory growth in a SkillKeepr service, add one line about what you found. Only if it's true.

## nodejs/27-profiling-and-debugging.md (1)

- [ ] line 152: which logging / error-tracking / monitoring tools you actually used at SkillKeepr. Only add what is true.

## nodejs/28-graceful-shutdown.md (1)

- [ ] line 146: if your SkillKeepr services (Railway, GCP voice service) had shutdown handling, add one line. Only if it's true.

## nodejs/29-security-basics.md (1)

- [ ] line 154: one real security practice from SkillKeepr — e.g. how tenant isolation or Stripe webhook verification was done. Only add what is true.

## nodejs/30-performance-tips.md (1)

- [ ] line 152: a real performance fix from SkillKeepr — your resume mentions applying MongoDB indexing so response times held as data grew. Add the details (which query, before/after) only if you know them.

## nodejs/31-modern-node-features.md (1)

- [ ] line 143: which of these you actually use at SkillKeepr — e.g. Jest for tests (on your resume), nodemon or --watch, dotenv. Only add what is true.

## postgresql/01-what-is-relational.md (1)

- [ ] line 155: where you used PostgreSQL — which project or service, and what it stored.

## postgresql/02-tables-keys.md (1)

- [ ] line 147: if you used PostgreSQL, which id type your tables used.

## postgresql/03-data-types.md (1)

- [ ] line 160: if you used PostgreSQL, which types mattered in your tables, e.g. how money or dates were stored.

## postgresql/04-select-where.md (1)

- [ ] line 195: if you used PostgreSQL, a real query you wrote (what it filtered and sorted).

## postgresql/05-insert-update-delete.md (2)

- [ ] line 194: if you used PostgreSQL, a real write you built — e.g. an upsert for a sync.
- [ ] line 200: only if your sync used PostgreSQL — otherwise say "in MongoDB we did the same with an email check".

## postgresql/06-aggregates-group-by.md (1)

- [ ] line 203: a real report you built — in MongoDB aggregation or in SQL — and what it counted.

## postgresql/07-foreign-keys-constraints.md (1)

- [ ] line 157: if you used PostgreSQL, a constraint that caught a real bug, or how your schema linked tables.

## postgresql/08-sql-injection.md (1)

- [ ] line 159: if you used PostgreSQL, which library you used (pg, Prisma, an ORM) and how queries were parameterised.

## postgresql/09-joins.md (1)

- [ ] line 159: where you used PostgreSQL, and one real query with a join that you wrote.

## postgresql/10-self-joins.md (1)

- [ ] line 131: where you used PostgreSQL, and a self join you wrote, if any.

## postgresql/11-subqueries.md (1)

- [ ] line 148: where you used PostgreSQL, and one subquery you wrote.

## postgresql/12-ctes.md (1)

- [ ] line 147: where you used PostgreSQL, and a CTE you wrote, if any.

## postgresql/13-normalization.md (1)

- [ ] line 138: where you used PostgreSQL, and a schema you designed or improved.

## postgresql/14-denormalization.md (1)

- [ ] line 133: where you used PostgreSQL, and a place where you stored a count or snapshot on purpose.

## postgresql/15-indexes.md (1)

- [ ] line 170: where you used PostgreSQL, and an index you added and how you proved it helped.

## postgresql/16-explain-analyze.md (1)

- [ ] line 161: where you used PostgreSQL, and a slow query you investigated.

## postgresql/17-acid-transactions.md (1)

- [ ] line 157: where you used PostgreSQL, and one real case where you needed a transaction.

## postgresql/18-node-pg.md (1)

- [ ] line 169: where you used PostgreSQL, and whether you used pg directly or an ORM.

## postgresql/19-orms.md (1)

- [ ] line 158: where you used PostgreSQL, and whether you used an ORM or raw SQL there.

## postgresql/20-interview-queries.md (1)

- [ ] line 197: where you used PostgreSQL, and one real query like these that you wrote.

## postgresql/21-isolation-locking.md (1)

- [ ] line 186: where you used PostgreSQL, and any real concurrency bug you fixed.

## postgresql/22-window-functions.md (1)

- [ ] line 166: where you used PostgreSQL, and any report where you used a window function.

## postgresql/23-jsonb.md (1)

- [ ] line 183: where you used PostgreSQL, and whether you stored any JSON in it.

## react/01-what-is-react.md (1)

- [ ] line 132: one screen or feature you built in React at SkillKeepr, in one line.

## react/09-controlled-uncontrolled.md (1)

- [ ] line 159: which approach the SkillKeepr forms you worked on used, if you know.

## react/10-lifting-state.md (1)

- [ ] line 137: a real example from the recruiter or candidate screens where two components shared the same state, if you have one.

## react/13-what-causes-a-re-render.md (1)

- [ ] line 144: a re-render you fixed in the recruiter or candidate screens, if you have one.

## react/14-use-effect.md (1)

- [ ] line 156: a real useEffect bug you found or fixed in the recruiter or candidate screens at SkillKeepr, if you have one. Only add it if it's true.

## react/16-use-memo-use-callback.md (1)

- [ ] line 147: a real place you used useMemo or useCallback at SkillKeepr, if you have one.

## react/17-react-memo.md (1)

- [ ] line 147: a real component you wrapped in React.memo, if any.

## react/18-custom-hooks.md (1)

- [ ] line 159: a custom hook you wrote or used at SkillKeepr, e.g. for debounced search, if you remember one.

## react/20-forms-validation.md (1)

- [ ] line 157: one form you built with it.

## react/21-calling-apis.md (1)

- [ ] line 158: how API calls were made in the SkillKeepr screens you built — for example a shared fetch wrapper called from Redux sagas.

## react/22-race-conditions-abort.md (1)

- [ ] line 150: a place in your SkillKeepr screens where fast filter or search changes could show stale results, and how it was handled — for example takeLatest in a saga.

## react/23-react-router.md (1)

- [ ] line 161: how routing was organised in the SkillKeepr UI you worked on — for example a route config with public and private pages.

## react/24-protected-routes.md (1)

- [ ] line 171: if true — at SkillKeepr the UI used a private-route wrapper that checked the login flag and the user's permission strings before showing a page. Confirm and describe your part.

## react/25-composition-children.md (1)

- [ ] line 142: a reusable component you built with children or slots — for example a modal, card or table wrapper in the SkillKeepr UI.

## react/26-code-splitting.md (1)

- [ ] line 143: if true — at SkillKeepr every page was lazy-loaded through a small loadable wrapper. Describe one heavy part you split or would split.

## react/27-error-boundaries.md (1)

- [ ] line 149: whether your app had error boundaries, and where you added or would add them.

## react/29-testing-rtl.md (1)

- [ ] line 180: if you wrote frontend tests at SkillKeepr, name one component you tested. Your confirmed testing work is Jest unit tests on the backend.

## react/31-performance-profiler.md (1)

- [ ] line 143: one real performance problem you found in a React screen, if you have one. At SkillKeepr, list tables use server-side pagination.

## react/33-tanstack-query.md (1)

- [ ] line 167: SkillKeepr's frontend fetches data with Redux and redux-saga. Have you used TanStack Query or RTK Query in any project? Say so honestly.

## react/34-react-19.md (1)

- [ ] line 131: which React version SkillKeepr uses, and whether you've used any React 19 features. The code guide says the platform is on React 18.3.

## redux-context/01-why-state-management.md (1)

- [ ] line 110: one example of data many screens shared, like the logged-in user's details and permissions.

## redux-context/05-redux-core.md (1)

- [ ] line 143: one thing you stored in Redux, like a page's list data with its loading and error flags.

## redux-context/06-redux-data-flow.md (1)

- [ ] line 131: one real flow you worked on — e.g. "a search box dispatches an action → a saga calls the API → success action → reducer saves the list → the table re-renders".

## redux-context/08-redux-toolkit.md (1)

- [ ] line 143: confirm whether your project uses RTK or plain Redux with this pattern.

## redux-context/12-selectors-memoized.md (1)

- [ ] line 127: a selector you wrote there, if any.

## redux-context/16-how-to-choose.md (1)

- [ ] line 119: what you would choose if you started that frontend today, and why.

## redux-context/17-redux-saga.md (1)

- [ ] line 193: one saga you wrote or changed at SkillKeepr, if you did.

## redux-context/18-context-practice-project.md (1)

- [ ] line 395: where you have actually used Context — this practice project, a personal app, or work

## redux-context/19-saga-effects.md (1)

- [ ] line 272: one saga you wrote yourself, and which effects it used.

## redux-context/20-saga-testing.md (1)

- [ ] line 187: whether your team tests sagas at SkillKeepr, and which style. You wrote Jest unit tests on the backend; only claim frontend saga tests if you really wrote them.

## responsive-design/01-what-is-responsive-design.md (1)

- [ ] line 150: one screen you made responsive at work, e.g. a recruiter list that becomes cards on phones.

## responsive-design/08-grid-auto-fit.md (1)

- [ ] line 137: a list or card view you built this way, if you did.

## responsive-design/13-tailwind-breakpoints.md (1)

- [ ] line 144: if you built a responsive screen with Tailwind early in your career, name it here.

## responsive-design/14-mantine-breakpoints.md (1)

- [ ] line 174: one screen you built with Mantine that changes layout on mobile, if you have one.

## responsive-design/15-matching-breakpoints.md (1)

- [ ] line 154: only if a project of yours mixed Mantine (or another component library) with Tailwind — say which one owned the breakpoints.

## responsive-design/16-common-layouts.md (1)

- [ ] line 161: a real recruiter or candidate screen you made responsive, e.g. a candidate table that becomes cards on phones.

## rest-auth/07-pagination-offset-cursor.md (1)

- [ ] line 145: which pagination style the lists you built at SkillKeepr use, if you know.

## rest-auth/10-authn-vs-authz.md (1)

- [ ] line 152: one line on how SkillKeepr does it, if you're comfortable sharing — e.g. 'our auth uses HttpOnly JWT cookies, and the tenant is locked inside the JWT, so a token can't be used on another company's site'.

## rest-auth/12-sessions-vs-tokens.md (1)

- [ ] line 147: if true and you're comfortable — 'that's the setup we use at SkillKeepr: HttpOnly JWT cookies'.

## rest-auth/14-jwt-login-flow.md (1)

- [ ] line 168: if true — 'At SkillKeepr, auth uses HttpOnly JWT cookies, and the tenant is locked inside the JWT, so a token from one company can't be used on another company's site.'

## rest-auth/16-token-storage.md (1)

- [ ] line 149: if true — 'At SkillKeepr we use HttpOnly JWT cookies, and the frontend only reads a simple logged-in flag.'

## rest-auth/18-rbac.md (1)

- [ ] line 155: one line about how roles and permissions work at SkillKeepr, at a high level, if you know it.

## rest-auth/19-oauth.md (1)

- [ ] line 149: any OAuth integration you worked on (for example connecting an ATS, calendar or CRM account). Only add it if it's true.

## rest-auth/20-api-keys.md (1)

- [ ] line 139: a real place you used API keys or service-to-service auth (for example a third-party API key kept in environment variables). Only add it if it's true.

## rest-auth/21-webhooks.md (1)

- [ ] line 147: which events the renewal flow handles, and how duplicates were handled.

## rest-auth/22-webhook-signatures.md (1)

- [ ] line 160: confirm how the Stripe renewal webhook you worked on was verified. Only add details that are true.

## rest-auth/23-idempotency-keys.md (1)

- [ ] line 154: how duplicate Stripe events were handled in the auto-renewal flow you worked on. Only add it if it's true.

## rest-auth/24-websockets.md (1)

- [ ] line 164: a real feature where you used WebSockets (your resume lists WebSockets). Only add details that are true.

## rest-auth/25-realtime-options.md (1)

- [ ] line 156: a real feature where you used polling, SSE or WebSockets, and why. Only add it if it's true.

## rest-auth/26-swagger-openapi.md (1)

- [ ] line 174: how the docs were made — hand-written YAML, JSDoc comments, or generated — and who used them.

## rest-auth/27-api-security.md (1)

- [ ] line 156: a real security measure you added or reviewed in a backend you worked on. Only add it if it's true.

## system-design/01-how-to-approach.md (1)

- [ ] line 137: if you designed a real feature this way at SkillKeepr, add one line, e.g. the AI voice agent's call flow.

## system-design/04-api-design.md (1)

- [ ] line 145: one API you designed or documented with Swagger at SkillKeepr, if you can describe it at a high level.

## system-design/05-schema-design.md (1)

- [ ] line 142: one schema decision you made or saw at SkillKeepr, e.g. why a section was embedded.

## system-design/06-scaling-vertical-horizontal.md (1)

- [ ] line 122: a real scaling problem you saw at SkillKeepr, if any.

## system-design/08-caching.md (1)

- [ ] line 145: a place you added or used caching in a real project, if any.

## system-design/09-redis-cache-aside.md (1)

- [ ] line 147: whether you've used Redis in a project, and for what. If not, say you've learned the pattern and would use it this way.

## system-design/10-cdn.md (1)

- [ ] line 136: your part, if any, in the S3 + CloudFront setup or deploys at SkillKeepr.

## system-design/11-database-scaling.md (1)

- [ ] line 146: one real slow query or index you fixed, if you have one.

## system-design/12-queues-background-jobs.md (1)

- [ ] line 139: did you work on a queue worker? What did it do?

## system-design/13-rate-limiting.md (1)

- [ ] line 135: any rate limit you added or saw in your work, if true.

## system-design/15-realtime-at-scale.md (1)

- [ ] line 108: did you work on any real-time feature?

## system-design/18-notification-system.md (2)

- [ ] line 143: did you work on reminders or notifications? What part?
- [ ] line 162: any part of this you built, if true.

## system-design/19-file-upload-service.md (2)

- [ ] line 141: did you work on any part of the upload or parsing flow?
- [ ] line 160: your real involvement, if any.

## system-design/20-job-board.md (1)

- [ ] line 140: which parts of this flow you worked on.

## testing/01-testing-pyramid.md (2)

- [ ] line 121: which modules or services you tested, e.g. a service or helper, and one real bug a test caught.
- [ ] line 143: one example.

## testing/02-unit-integration-e2e.md (1)

- [ ] line 173: whether you also wrote integration or e2e tests there.

## testing/03-jest-basics.md (2)

- [ ] line 143: one test you wrote and what it checked.
- [ ] line 165: one example.

## testing/05-mocking.md (2)

- [ ] line 155: a test you wrote using mocks, and what it checked.
- [ ] line 179: one example.

## testing/06-supertest.md (2)

- [ ] line 174: whether you also tested endpoints end to end with requests, and how auth was handled in those tests.
- [ ] line 196: how API testing was done on your team.

## testing/07-test-databases.md (2)

- [ ] line 138: whether you wrote tests against a real or in-memory database.
- [ ] line 162: what database testing looked like on your team.

## testing/08-rtl.md (2)

- [ ] line 186: whether you wrote frontend tests, and for which screens.
- [ ] line 211: frontend testing you did at SkillKeepr, if any.

## testing/09-coverage.md (1)

- [ ] line 150: how you used coverage for the Jest unit tests you wrote at SkillKeepr — e.g. which module you added tests to.

## testing/10-tdd.md (1)

- [ ] line 159: whether you used test-first for any of the Jest unit tests you wrote at SkillKeepr — only if true.

## testing/11-linting-formatting.md (1)

- [ ] line 151: what you personally set up or fixed in this tooling, if anything.

## testing/12-code-reviews.md (1)

- [ ] line 141: one real thing you caught in a review, or one useful comment you received.

## testing/13-logging.md (1)

- [ ] line 137: one time logs helped you find a bug — what you searched for and what you found.

## testing/14-error-tracking.md (1)

- [ ] line 148: which error tracking or monitoring tool you used at SkillKeepr, and one issue it helped you find.

## testing/15-production-incidents.md (1)

- [ ] line 149: one real incident — symptom → how logs or the error tracker found it → root cause → fix → what you changed so it doesn't repeat.

## testing/16-clean-code-solid.md (1)

- [ ] line 143: one refactor you did — what was messy, what you split or changed, and the result.

## testing/17-agile-scrum.md (3)

- [ ] line 195: sprint length
- [ ] line 195: team size and roles
- [ ] line 197: tool, e.g. Jira

## typescript/01-what-is-typescript.md (1)

- [ ] line 124: one real bug TypeScript caught for you at SkillKeepr — only if you have one.

## typescript/09-typing-functions.md (1)

- [ ] line 165: one function signature from your SkillKeepr backend that you can explain, e.g. a service method's parameters and return type.

## typescript/10-narrowing.md (1)

- [ ] line 170: a place in your SkillKeepr code where you narrowed a union or an `unknown` value, if you remember one.

## typescript/11-discriminated-unions.md (1)

- [ ] line 149: if you typed Redux actions or API states this way at SkillKeepr, mention it here.

## typescript/12-generics.md (1)

- [ ] line 156: a generic type or helper you used at SkillKeepr, e.g. a typed API response or a shared table component — only if true.

## typescript/13-generic-constraints.md (1)

- [ ] line 153: a shared helper or component where you used a constraint, if any.

## typescript/14-utility-types.md (1)

- [ ] line 163: a real use from your SkillKeepr backend or frontend, e.g. a PATCH body or a response type without secrets — only if true.

## typescript/15-keyof-typeof.md (1)

- [ ] line 163: a status list or config in your project that you typed this way, if any.

## typescript/16-enums-vs-unions.md (1)

- [ ] line 145: which style your SkillKeepr codebase uses for statuses and roles, if you know.

## typescript/18-tsconfig-strict.md (1)

- [ ] line 153: how strict the tsconfig is in your SkillKeepr services, if you know — e.g. "strict is on in the services I work on".

## typescript/19-ts-react.md (1)

- [ ] line 158: one real example from the SkillKeepr React screens — e.g. a component or Redux slice you typed. Only if it's true.

## typescript/20-ts-express.md (1)

- [ ] line 160: the SkillKeepr backend services are written in TypeScript and validate with Joi — add one route or service you typed and validated. Only if it's true.

## typescript/21-zod.md (1)

- [ ] line 160: the SkillKeepr backend services validate with Joi — mention one place you added or changed a Joi schema. Only if it's true.
