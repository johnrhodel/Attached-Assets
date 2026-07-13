---
name: Solana mint outcome safety
description: Policy for classifying on-chain errors by outcome certainty in mint flows — when to retry/rollback vs. keep pending.
---

# Rule
In mint flows, classify blockchain errors by **outcome certainty**, not success/failure:
- **Definite pre-send failures** (simulation failed, insufficient funds/lamports, blockhash not found, DNS/connection-refused): safe to retry once and to roll back (mark mint failed, release supply slot, reactivate claim session).
- **Timeout or any ambiguous error** (`SOLANA_TIMEOUT` / `SOLANA_UNKNOWN`): the tx may have landed on-chain. NEVER retry, NEVER roll back — keep the pending mint record and the reserved slot, return 504, and rely on reconciliation.

**Why:** retrying or rolling back an ambiguous error can double-mint an NFT or free a supply slot for a mint that actually succeeded, corrupting `minted_count`.

**How to apply:** classification lives in `isDefiniteFailure()` in the Solana service; route catch blocks must treat `SOLANA_UNKNOWN` exactly like `SOLANA_TIMEOUT`. Any new mint endpoint must follow the flow: atomic session consume → atomic slot reserve → pending record → chain call → confirm, with compensation only on definite failures. Reconciliation of stuck pendings is a proposed follow-up task.
