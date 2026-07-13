#!/bin/bash
set -e
pnpm install --frozen-lockfile
# push-force (--force) keeps this non-interactive for automated merges;
# the runtime "session" table is excluded via tablesFilter in drizzle.config.ts
pnpm --filter @workspace/db push-force
