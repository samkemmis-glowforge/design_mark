# Deploying Design Mark (Slack bot) to Cloud Run

Same pattern as the Mycroft agent: a single always-on Cloud Run service running the
Socket Mode bot, with tokens in Secret Manager. No public URL is needed (Socket Mode
is outbound), but Cloud Run still requires a `$PORT` listener — `slack/app.ts` now
binds one (`startHealthListener`).

## What the bot needs (4 secrets)
| Env var | Value | Source |
|---|---|---|
| `SLACK_BOT_TOKEN` | `xoxb-…` | Slack app → OAuth & Permissions (after install) |
| `SLACK_APP_TOKEN` | `xapp-…` (`connections:write`) | Slack app → Basic Information → App-Level Tokens |
| `ANTHROPIC_API_KEY` | `sk-ant-…` | console.anthropic.com — the agent's brain |
| `GEMINI_API_KEY` | image generation | aistudio.google.com |

(No Drive service-account key needed — the bot searches the committed asset index and
returns Drive URLs; it doesn't download from Drive. That key belongs to the indexer job.)

## One-time setup
```bash
gcloud auth login
gcloud config set project <YOUR_PROJECT>          # e.g. glowforge-internal

# Store the four secrets (paste each value when prompted, then Ctrl-D)
for s in design-mark-slack-bot-token design-mark-slack-app-token \
         design-mark-anthropic-key design-mark-gemini-key; do
  gcloud secrets create "$s" --replication-policy=automatic 2>/dev/null || true
  gcloud secrets versions add "$s" --data-file=-
done

# Let Cloud Run's runtime service account read them
PROJECT_NUM=$(gcloud projects describe "$(gcloud config get-value project)" --format='value(projectNumber)')
for s in design-mark-slack-bot-token design-mark-slack-app-token \
         design-mark-anthropic-key design-mark-gemini-key; do
  gcloud secrets add-iam-policy-binding "$s" \
    --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
    --role=roles/secretmanager.secretAccessor
done
```

## Deploy
```bash
./slack/deploy_cloud_run.sh
```
Override defaults via env: `PROJECT`, `REGION` (default us-central1), `SERVICE`
(default design-mark-agent). Edit the secret names in the script if yours differ.

## Verify
```bash
gcloud run services logs read design-mark-agent --region us-central1 --follow
# expect: "health listener on :8080" then "⚡ Glowforge design agent is running (Socket Mode)"
```
Then DM the bot or @-mention it in a thread.

## Notes
- **One instance only** (`--min/--max-instances 1`, `--concurrency 1`): a second
  instance would open a duplicate Slack socket. Keep it singular.
- **Memory 1Gi**: Chromium rendering can OOM at 512Mi; bump higher if you see crashes.
- This is a *worker*, not a web service — `--no-allow-unauthenticated` is correct;
  nothing calls it over HTTP except Cloud Run's own health probe.
