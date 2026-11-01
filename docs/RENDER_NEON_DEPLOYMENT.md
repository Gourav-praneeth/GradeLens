# Render + Neon deployment checklist

This setup keeps the Render container stateless. Neon PostgreSQL stores application records and Neon Object Storage stores uploaded solutions and submissions.

## 1. Create the Neon resources

1. Create a new Neon project and keep it empty.
2. Copy the **pooled** PostgreSQL connection string for `DATABASE_URL`.
3. Copy the **direct** PostgreSQL connection string for `DATABASE_URL_UNPOOLED`.
4. Create a private object-storage bucket.
5. Generate the bucket's S3-compatible credentials. Keep all secrets in Neon and Render; do not commit them or paste them into chat.

Use a fresh database for this migration. The repository's PostgreSQL migrations do not convert an existing SQLite file.

## 2. Create the Render service

Create a Blueprint from `render.yaml`, or create a Docker Web Service manually. If configuring it manually, use:

- Runtime: Docker
- Health check: `/api/health`
- Instance: Free while piloting
- Auto deploy: your choice; enabling it is convenient after tests pass

## 3. Add environment variables

Required database variables:

```text
DATABASE_URL=<Neon pooled connection string>
DATABASE_URL_UNPOOLED=<Neon direct connection string>
```

Required storage variables:

```text
STORAGE_DRIVER=s3
STORAGE_BUCKET=uploads
AWS_REGION=<Neon-provided region, for example us-east-2>
AWS_ACCESS_KEY_ID=<generated access key>
AWS_SECRET_ACCESS_KEY=<generated secret key>
AWS_ENDPOINT_URL_S3=<Neon S3 endpoint>
```

If Neon instructs you to use virtual-hosted bucket URLs, also set `S3_FORCE_PATH_STYLE=false`. Otherwise leave it unset; GradeLens defaults to path-style requests for custom S3 endpoints.

Required application secret:

```text
LLM_KEY_SECRET=<at least 32 random bytes>
```

Render can generate `LLM_KEY_SECRET` automatically when the included Blueprint is used. Changing it later makes previously saved instructor API keys unreadable.

Recommended email and URL variables:

```text
PUBLIC_APP_URL=https://<your-render-service>.onrender.com
RESEND_API_KEY=<Resend key>
EMAIL_FROM=GradeLens <noreply@your-domain.example>
```

Optional variables:

```text
GROQ_API_KEY=<shared fallback model key>
OPENAI_API_KEY=<shared fallback model key>
ANTHROPIC_API_KEY=<shared fallback model key>
SIGNUP_INVITE=<private invite code>
ALLOW_SIGNUP=false
FEEDBACK_ADMIN_EMAIL=<feedback destination>
# Optional bulk-grading tuning; defaults shown
GRADING_BATCH_SIZE=4
GRADING_CONCURRENCY=2
```

Instructors can save a personal model key under **Account**, so a shared model key is not required.
Keep grading concurrency low on provider free tiers. GradeLens caps the configured batch size at 10 and concurrency at 4.

## 4. Deploy and verify

The container runs `prisma migrate deploy` before starting the Next.js server. After Render reports the service healthy:

1. Open `https://<your-service>.onrender.com/api/health`.
2. Confirm the response reports both `database` and `storage` as `ok`.
3. Create the first instructor account.
4. Create a test course and assignment, upload a fake PDF, then delete the assignment.
5. Restart the Render service and confirm the course still exists.

Keep real student data out of the public pilot until access controls, retention expectations, and institutional approval have been reviewed.

## Troubleshooting

- **Migration fails:** confirm `DATABASE_URL_UNPOOLED` is the non-pooled Neon URL and allows connections from Render.
- **Database health fails:** confirm `DATABASE_URL` is the pooled URL and includes TLS settings supplied by Neon.
- **Storage health fails:** re-copy the endpoint, bucket name, and S3 credentials. Try `S3_FORCE_PATH_STYLE=false` only if Neon's bucket instructions require it.
- **Saved model keys stop working:** restore the original `LLM_KEY_SECRET`; it is an encryption key, not a disposable session secret.
- **First request is slow:** Render's free service can sleep when idle, so cold starts are expected during a pilot.
