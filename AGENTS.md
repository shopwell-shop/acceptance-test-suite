# Shopwell Acceptance Test Suite fork guardrails

This is the Shopwell-derived acceptance suite. Product code, documentation,
tests, manifests, paths, and metadata must not contain the upstream brand. The
only legal-text exception is the verbatim upstream license in `NOTICE`.
Project-owned manifests use Apache License 2.0.

Before publishing or reporting a successful sync, run from `/Users/goxs/Workspaces/shopwell/sync-upstream`:

```bash
./bin/syncctl audit-license acceptance-test-suite
./bin/syncctl audit-upstream-dependencies acceptance-test-suite
```

The API client dependency must use the stable `@shopwell/api-client` npm
publication produced by the complete Frontends monorepo; do not use Git URLs,
branches, commits, local paths, or workspace dependencies.
