# Codenza 👩🏻‍💻

Codenza is an online judge platform where users can practice coding problems, get instant feedback on their solutions, and track their interview readiness over time — built on the MERN stack.

## What it does

- **Solve problems** — Browse DSA problems by difficulty and topic, write code in an in-browser editor, and submit for instant evaluation.
- **Get real verdicts** — Submissions run in isolated, sandboxed containers against hidden test cases, returning results like Accepted, Wrong Answer, or Time Limit Exceeded.
- **AI-powered help** — Get hints, code reviews, and plain-language error explanations without having the solution handed to you.
- **Track your growth** — An Interview Readiness Score analyzes your submission history and tells you which topics to focus on and which companies you're ready to target.

## How it works 

1. You submit code → it's queued instantly, so the platform stays responsive even during traffic spikes.
2. A pool of workers picks up jobs and runs each one inside a short-lived, locked-down Docker container (no network access, no shared data).
3. Your code is checked against hidden test cases, and the verdict streams back to your screen live.

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js / Express (MVC architecture)
- **Database:** MongoDB
- **Queue:** Redis-backed BullMQ (or RabbitMQ)
- **Code Execution:** Docker (isolated, resource-capped containers)
- **AI:** Gemini API for hints, reviews, and readiness scoring

## Security & Reliability Highlights

- Hidden test cases are stored separately and are never exposed to users or sent to the AI.
- User-submitted code and prompts are sanitized before reaching the AI, and AI output is never trusted or executed.
- JWT-based authentication with short-lived, rotating tokens.
- Readiness scores are cached and only recalculated when your performance meaningfully changes — keeping things fast.

## Why Codenza

Most judges just tell you how many problems you've solved. Codenza tells you what you're actually ready for — surfacing weak topics, suggesting a learning path, and even mapping your skills to real target companies.

---
*Built by Geetanjali Reddy*
