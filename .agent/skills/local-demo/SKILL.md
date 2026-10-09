---
name: local-demo
description: Canonical VisuTry Local Demo / Experience QA commands. Use these commands instead of inventing ad-hoc browser scripts.
---

# VisuTry Local Demo

Canonical Demo identity, historical Canary separation, public URL, and
provider-free continuation rules: [VisuTry Demo Environment Contract](../../../docs/ops/visutry-demo-environment-contract.md).

Use the repository-owned Local Demo commands. Do not create temporary Playwright scripts for normal Demo/QA work.

## Default routing

- Prepare or reconcile the environment: `npm run demo:local:bootstrap`
- Interactive Local product work, providers blocked: `npm run demo:local:dev`
- Full deterministic no-provider regression: `npm run demo:local:journey:e2e`
- Capture reusable sales-demo product scenes, providers blocked: `npm run demo:local:sales-demo-capture`
- Reset only the dedicated Demo shopper state/media: `npm run demo:local:reset-session`
- Real GrsAI validation **only after explicit human authorization**: `npm run demo:local:provider-smoke -- --authorized`

For sales-demo footage, use `demo:local:sales-demo-capture` rather than
desktop manual recording, temporary Playwright scripts, or a full Provider
walkthrough. It records only short Store, Face Intelligence, Recommendation,
and frame-selection scenes, and stops before Try-On submission. It is product
footage, not a QA evidence workflow.

## Provider rule

The provider-smoke command is the only canonical automated real-provider workflow.

It:
- bootstraps and resets the Local Demo;
- runs Playwright at 1024×768;
- uses real local MediaPipe and the real deterministic recommendation path;
- submits Rowan first and waits for success before making Lane the second request;
- never clicks a retry action;
- captures S01–S06 evidence under ignored `.local/demo-evidence/`;
- verifies exactly 2 GenerationRequests and 2 GenerationAttempts, all GrsAI;
- restarts the app and verifies the same Decision Result media;
- performs the final scoped reset.

Never substitute Gemini, Production/Preview, Live Stripe, Production analytics, or Vercel Blob.

If the first real provider generation fails, stop. Do not manually submit Lane or retry outside the runner.

## Agent behavior

When asked to run or validate Local Demo:
1. choose the canonical command above;
2. do not rediscover the workflow by searching unrelated files;
3. do not use a desktop/manual browser when the repository Playwright runner exists;
4. report the command result and evidence directory;
5. only debug implementation after a canonical command actually fails.
