# Islo Agent Demo

Minimal demo app for the Islo SDLC loop:

1. **Credential injection** — the sandbox runs with placeholder API keys. The Islo gateway swaps in real OpenAI + fal.ai credentials at egress.
2. **Agent automation** — a GitHub issue labeled `agent-task` triggers Claude Code in a fresh sandbox that clones the latest `main`.
3. **Shareable preview** — the agent's work is exposed via an `islo share` URL posted back to the issue.

## Stack

- Express + plain HTML/CSS/JS — no bundler, no Turbopack (deliberately chosen to avoid the IPv6/worker-bind incompatibility documented in the [project log](../islo_test/islo-project-log.md)).
- OpenAI (`gpt-4.1-mini`) for slogan generation.
- fal.ai (`openai/gpt-image-2`) for poster generation.
- pm2 for in-sandbox process supervision.

## Running locally

```bash
cp .env.example .env.local       # then edit with real keys
npm install
node server.js                   # open http://127.0.0.1:3000
```

## Running in an Islo sandbox

```bash
islo use islo-agent-demo --source github://ohadza1/islo-agent-demo
# provisions sandbox, clones latest main, installs deps, starts server
islo share islo-agent-demo 3000 --ttl 24h
```

## Related artifacts

- [`/Users/ohadz/development/islo_test/islo-project-log.md`](../islo_test/islo-project-log.md) — full decision log + findings (PM artifact).
- [`/Users/ohadz/development/islo_test/islo-verified-research.md`](../islo_test/islo-verified-research.md) — verified-only Islo facts.
