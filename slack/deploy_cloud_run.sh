#!/usr/bin/env bash
# One-command deploy of the Design Mark Slack bot to Cloud Run (Socket Mode).
#
# Why these flags: Socket Mode holds an outbound WebSocket, so the service must never
# scale to zero (--min-instances 1) and must keep CPU allocated (--no-cpu-throttling).
# One instance only (--max-instances 1, --concurrency 1) — multiple would each open a
# duplicate Slack connection. No public ingress is needed (--no-allow-unauthenticated).
#
# One-time prereqs:
#   gcloud auth login && gcloud config set project <PROJECT>
#   Create the four secrets in Secret Manager (see slack/DEPLOY.md).
set -euo pipefail

PROJECT="${PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-design-mark-agent}"
REPO="${REPO:-cloud-run-source-deploy}"            # Artifact Registry repo (created on first source deploy)
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}:latest"

# Map env var name -> Secret Manager secret name. Adjust the secret names to match yours.
SECRETS="SLACK_BOT_TOKEN=design-mark-slack-bot-token:latest"
SECRETS+=",SLACK_APP_TOKEN=design-mark-slack-app-token:latest"
SECRETS+=",ANTHROPIC_API_KEY=design-mark-anthropic-key:latest"
SECRETS+=",GEMINI_API_KEY=design-mark-gemini-key:latest"

ENVVARS="IMAGE_PROVIDER=gemini,GEMINI_IMAGE_MODEL=gemini-2.5-flash-image"

# Optional: Drive write + restricted-file read. If a service-account-key secret exists,
# mount it as a file and point the bot at it (so save_to_drive / restricted fetch work).
# Skipped cleanly if the secret isn't set — public-link fetch still works either way.
GDRIVE_SECRET="${GDRIVE_SECRET:-design-mark-gdrive-sa}"
DRIVE_UPLOAD_FOLDER_ID="${DRIVE_UPLOAD_FOLDER_ID:-1nhAP7AK4sJkSV2qmC9z2cuD7CjTWXceJ}"
if gcloud secrets describe "${GDRIVE_SECRET}" >/dev/null 2>&1; then
  SECRETS+=",/secrets/gdrive-sa.json=${GDRIVE_SECRET}:latest"
  ENVVARS+=",GOOGLE_APPLICATION_CREDENTIALS=/secrets/gdrive-sa.json,DRIVE_UPLOAD_FOLDER_ID=${DRIVE_UPLOAD_FOLDER_ID}"
  echo "▸ Drive key '${GDRIVE_SECRET}' found — enabling Drive upload + restricted-file read."
else
  echo "▸ No Drive key secret ('${GDRIVE_SECRET}') — skipping Drive write (public-link fetch still works)."
fi

echo "▸ Building ${IMAGE} from Dockerfile.slack…"
gcloud builds submit --config slack/cloudbuild.yaml --substitutions=_IMAGE="${IMAGE}" .

echo "▸ Deploying ${SERVICE} to Cloud Run (${REGION})…"
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --no-allow-unauthenticated \
  --min-instances 1 --max-instances 1 \
  --no-cpu-throttling \
  --concurrency 1 \
  --memory 1Gi \
  --port 8080 \
  --set-secrets "${SECRETS}" \
  --set-env-vars "${ENVVARS}"

echo "✓ Deployed. Tail logs:  gcloud run services logs read ${SERVICE} --region ${REGION} --follow"
