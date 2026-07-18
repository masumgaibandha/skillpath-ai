// Vercel serverless entrypoint. Exporting the Express app directly (no
// app.listen()) is the documented pattern for running Express as a
// Vercel Node.js function — Vercel invokes this per-request instead of
// the app binding to a persistent socket. Local dev and traditional
// `node dist/index.js` hosting still go through src/index.ts's
// app.listen() path; this file is Vercel-only and never imported there.
export { default } from "../src/app";
