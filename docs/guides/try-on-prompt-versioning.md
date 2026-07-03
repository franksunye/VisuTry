# Try-on prompt versioning

Try-on prompts are immutable release artifacts registered in
`src/lib/try-on-prompt-registry.ts`. The selected version controls both the
type-specific instructions and the wrapper sent to Gemini or GrsAi.

## Inspect the active version

```bash
npm run prompt:versions
```

The default is `tryon-v1`. Production can select a different registered version
with the server-side environment variable:

```bash
TRY_ON_PROMPT_VERSION=tryon-v2
```

An unknown version fails the request instead of silently falling back.

## Create an upgrade

1. Add a new immutable entry such as `tryon-v2` to the registry. Copy the
   complete instructions and renderer; do not make `v2` depend on mutable `v1`
   content.
2. Add tests for the new version and keep the `v1` fingerprint unchanged.
3. Deploy with `TRY_ON_PROMPT_VERSION=tryon-v2` to a test environment.
4. Run the agreed image evaluation set before promoting the environment value
   to production.

## Roll back

Set the production environment variable to the previous version and redeploy:

```bash
TRY_ON_PROMPT_VERSION=tryon-v1
```

No code revert or database migration is required. Every new task records:

- `promptVersion`
- `promptSource` (`registry` or `override`)
- `effectivePrompt` (type-specific instructions)
- `renderedPrompt` (the exact complete prompt sent to the provider)

Retries reuse the task's recorded version. Tasks created before versioning are
treated as `tryon-v1` because that version is an exact snapshot of their prompt.

## Rules

- Never edit a version that has received production traffic.
- Never reuse a version name for different text.
- Promote and roll back through `TRY_ON_PROMPT_VERSION`, not by editing the
  default constant.
- Keep prompt experiments out of a released version; register a new version for
  each candidate that may receive real traffic.
