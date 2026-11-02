# Retired queue worker

The current development generation API handles requests in memory without a
server job queue. `python -m app.worker` prints its disabled status and exits
without connecting to Postgres or processing old queued jobs. See ADR 0003.
A production generation queue/recovery design remains a release prerequisite.
The original queue implementation is preserved in Git history.
