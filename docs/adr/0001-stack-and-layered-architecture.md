# ADR-0001: Stack and layered backend architecture

- **Status:** Accepted
- **Date:** 2026-05-24

## Context

Acca tracks live football accumulators. The app must ingest fixture data from an external API at sub-minute cadence, evaluate user-defined multi-leg bets, and push results to clients in real time. It is also a portfolio piece intended to demonstrate competence with a stack different from the one used in a prior project (which was React + Node + MongoDB).

The system has three properties that drove the decisions below:

1. **I/O-bound, not CPU-bound.** Most work is waiting on the football API, the database, or WebSocket clients.
2. **A non-trivial pure-domain core.** Bet evaluation is independent of how data arrives or is stored. It deserves to live in code that can be unit-tested with zero infrastructure.
3. **External rate limits.** The football API costs money per call and rate-limits free tiers, so caching is required, not optional.

## Decision

**Stack:** Angular 21 (standalone components, signals, zoneless change detection) on the frontend; FastAPI on Python 3.12 with async SQLAlchemy 2.0, asyncpg, Pydantic v2, and Redis on the backend; PostgreSQL 16 as the system of record; Alembic for migrations.

**Backend layering:** every request flows through four layers, with strict one-way dependencies:

```
routers/      → HTTP boundary, request/response only
services/     → business logic, transaction boundaries, orchestration
repositories/ → data access, the only layer that touches the ORM
models/       → SQLAlchemy declarative ORM
```

Pydantic schemas in `schemas/` describe wire formats and never leak into the database. The bet evaluator lives in `services/` as a pure function: it accepts a leg and a fixture result and returns a new status, with no I/O.

**Frontend split:** containers (smart) own state and data; presentational components receive inputs and emit outputs. Cross-cutting concerns (auth, HTTP, WebSocket, toasts) live in `core/services/`. Feature routes are lazy-loaded.

## Consequences

**Positive.**

- Async-everywhere on the backend matches the I/O-bound workload. Adding a slow external call costs nothing in throughput as long as it's awaited.
- The pure-function bet evaluator is testable in isolation, satisfies the open/closed principle for new leg types, and makes the most algorithmically interesting code in the repo also the most reviewable.
- A repository layer means authorisation can be enforced once, in the data-access path, instead of being duplicated in every router. CLAUDE.md requires "a user can only read/update/delete their own bets" — this layout makes that easy to verify.
- Standalone Angular components plus signals match where the framework is going and avoid an entire category of NgModule boilerplate.

**Negative / accepted trade-offs.**

- The layered structure has a higher initial file count than a flat FastAPI app. It pays off once the second feature lands; for the first feature it's overhead.
- Async Python is harder to debug than sync. We accept this for the I/O profile.
- Two stacks to learn (Python + Angular). This is intentional — broadening the CV is a project goal.

**Out of scope until v2.**

- No event-driven cache invalidation. Cache lives by TTL, full stop.
- No multi-tenant isolation beyond per-user row ownership.
- No microservices. The whole backend is one deployable.
