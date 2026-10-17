# RCA — run 45fd6e61-cb0f-4cdb-b4ca-204ed6db3171 (aluminito-esquadrias)

## Symptom
Redeploy failed at `deploy_k8s`: "deployment failed to become ready: timed out waiting for the condition". The new pod's backend crashes on startup, nginx then shuts down, readiness never goes green, deploy times out.

## Root Cause (PROVEN — source bug)
The backend crashes during FastAPI startup with:

```
pymongo.errors.OperationFailure: not authorized on test_database to execute command
{ find: "reviews", ... $db: "test_database" }, code: 13, codeName: 'Unauthorized'
  File "/app/backend/server.py", line 222, in migrate_legacy_reviews
    async for review in legacy_reviews.find({}, {"_id": 0}):
```

Relevant source (`backend/server.py`):
- Line 21: `legacy_db_name = os.environ.get('LEGACY_DB_NAME', 'test_database')`
- Lines 220–222: a `@app.on_event("startup")` hook `migrate_legacy_reviews()` unconditionally runs `client[legacy_db_name]['reviews'].find({})`.

In production:
- The resolved production database is **`aluminito-esquadrias-base`** (confirmed via read-only DB query).
- The production `MONGO_URL` credential is scoped to that database only and has **no access to `test_database`**.
- `LEGACY_DB_NAME` is not set, so `legacy_db_name` falls back to the preview name `test_database`.

So on every boot the startup hook tries to read `test_database.reviews`, gets `Unauthorized (code 13)`, the exception propagates out of the startup lifespan, and uvicorn exits ("Application startup failed. Exiting." → "Backend died, shutting down nginx..."). The pod never becomes ready.

This is unrelated to the two earlier failures in this job (runs 0e480bb1 / daa6acfa / 6e3cecd6), which failed earlier at `pull_source` because `backend/.env` / `frontend/.env` were missing. The .env restoration fixed those; this run got all the way to `deploy_k8s` and exposed a new, pre-existing source bug.

## Why this is not a manifest / secret / tier issue
- Not manifest: the base image and entrypoint behaved correctly (they started uvicorn, which then exited due to the app's own exception).
- Not a settable secret: the migration hardcodes a default of `test_database`, a preview-only DB the prod user can never access. Pointing `LEGACY_DB_NAME` elsewhere is not a real fix; the one-time preview→prod migration simply must not run (or must not crash) in production.
- Not tier: no OOM/CPU involvement.

## Suggested Fix (Code — E1)
In `backend/server.py`, make `migrate_legacy_reviews` safe for production. Any of:
1. Guard it so it only runs when `LEGACY_DB_NAME` is explicitly set **and** differs from `DB_NAME`, AND wrap the body in `try/except` so a failed/unauthorized legacy read is logged and swallowed — never crashing startup. (Recommended — belt and suspenders.)
2. Remove the one-time legacy migration entirely now that production data lives in `aluminito-esquadrias-base`.

After the code fix, redeploy.
