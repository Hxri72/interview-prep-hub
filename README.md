# 📘 Interview Prep Hub

My personal interview-preparation site: MERN stack, system design, DSA, AI and HR, explained in simple English.

## Run it locally

```bash
npm install        # first time only
npm run dev        # open http://localhost:5173
```

## Add or edit a topic

1. Create `content/topics/<stack>/<NN>-<slug>.md` (copy an existing topic as a starting point).
2. Follow the template in `CLAUDE.md` (frontmatter + the 9 sections).
3. Run `npm run build`. It tells you exactly what is missing.

No code changes are needed. The sidebar, search, Quick Revise and Rapid Fire update automatically.

## Features

Dashboard with progress and today's plan · sidebar with learned/total per stack · topic pages with *Mark as learned / Revise later / Bookmark* · Quick Revise · Rapid Fire flashcards · Practice Problems · Saved · Glossary · search (`/` or `Ctrl+K`) · clean light theme · works on phones.

Progress is saved in your browser (localStorage). Use **Export / Import** on the dashboard to move it between devices.

## Publish on GitHub Pages (free)

GitHub Pages is free for **public** repositories. The site is static, so there is no server to pay for.

**One-time setup:**

1. Create a new **public** repository on GitHub, for example `interview-prep-hub`. Don't add a README; this project has one.
2. In this folder, run:
   ```bash
   git init
   git add .
   git commit -m "Interview Prep Hub"
   git branch -M main
   git remote add origin https://github.com/<your-username>/interview-prep-hub.git
   git push -u origin main
   ```
   `source-notes/` (your resume and notes) and `.screenshots/` are in `.gitignore`, so they are **not** uploaded.
3. On GitHub, open the repo → **Settings → Pages** → under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. The "Deploy to GitHub Pages" workflow runs on its own (or click **Run workflow**). After about 1–2 minutes, the site is live at
   `https://<your-username>.github.io/interview-prep-hub/`.

**Every update after that:** edit the content, run `npm run build` to check it, then:
```bash
git add .
git commit -m "Add notes"
git push
```
The site updates itself in about 2 minutes.

**Good to know:**
- The workflow sets the base path from the repository name, so renaming the repo just works.
- Anyone with the link can read the site. Keep salary numbers and private details out of the content (`[FILL IN]` items like salary are meant to stay offline).
- Progress (learned, bookmarks, flashcard results) is saved in each browser. Use **Export / Import** on the dashboard to move it between your laptop and phone.
