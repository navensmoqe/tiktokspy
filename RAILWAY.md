# Railway monitor worker

Create a new Railway service from this GitHub repository, then set its start command to:

```text
npm run worker
```

Add the following sensitive variables from the existing Vercel project:

```text
DATABASE_URL
DIRECT_URL
```

Railway must run one replica continuously. The Vercel deployment remains the web dashboard; this worker is the only process that maintains the TikTok LIVE connections.
