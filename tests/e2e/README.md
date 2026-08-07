# E2E Tests

Phase 1 Pilot Readiness browser coverage for VisuTry.

## Rules

- Protect business-critical Consumer and Store surfaces first.
- Do not invoke Gemini, Grsai, Stripe charges, or other paid external side effects in routine E2E/smoke execution.
- Prefer deterministic route/UI assertions over model-output assertions.
- AI output quality belongs to the later AI Evaluation phase, not this suite.

## Current Coverage

### Smoke

- Homepage availability
- Face Analysis route availability
- Try-On route availability
- Store route availability

Run with:

```bash
npm run test:e2e:smoke
```

### Critical browser checks

- Consumer Face Analysis entry renders without application/server error
- Consumer Try-On entry renders without application/server error
- Store Pilot entry renders without application/server error

Run with:

```bash
npm run test:e2e:critical
```

## Production Smoke

`scripts/production-smoke.mjs` performs lightweight HTTP checks against critical public routes. It never calls generation endpoints.

Run with:

```bash
SMOKE_BASE_URL=https://www.visutry.com npm run test:smoke:production
```

Automation:

- `.github/workflows/production-smoke.yml`: after `main` pushes, every 6 hours, and manually
- `.github/workflows/e2e-smoke.yml`: scheduled/manual Chromium smoke + critical route checks

## Lifecycle E2E Policy

Full lifecycle flows such as Upload → Analysis → Result and Select Frame → Try-On → Result must use explicit test seams/mocks before they become blocking automation. Do not intercept unknown API contracts or call paid providers merely to make an E2E test appear complete.

Planned lifecycle coverage, introduced only with deterministic mocks:

- Consumer face-analysis lifecycle
- Consumer try-on lifecycle
- Checkout session lifecycle with Stripe mocked
- Merchant session lifecycle
- Merchant try-on/intent lifecycle
