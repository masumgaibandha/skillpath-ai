import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { MongoClient, ObjectId } from "mongodb";
import { env } from "../config/env.js";
import { auth, authMongoClient, ensureAuthIndexes } from "./auth.js";

// Regression coverage for the duplicate-email signup bug: a second
// /sign-up/email for an already-registered address must never create a
// second real user/credential document, corrupt the original credential,
// or make either the original or the attempted-new password stop
// working. Exercises auth.api.* directly (the same programmatic surface
// toNodeHandler(auth) delegates every /api/auth/* request to) against the
// real database — this is an integration test, not a pure unit test, and
// requires a reachable MONGODB_URI (same one the app itself uses).

const verifyClient = new MongoClient(env.MONGODB_URI);
let db: ReturnType<typeof verifyClient.db>;

before(async () => {
  await verifyClient.connect();
  db = verifyClient.db();
  // Index creation is no longer fire-and-forget at module import — tests
  // must explicitly await it, the same way index.ts and app.ts now do,
  // otherwise the unique-index race-prevention tests below would be
  // exercising a database with no unique constraint yet.
  await ensureAuthIndexes();
});

after(async () => {
  await verifyClient.close();
  // Without this, auth.ts's own MongoClient (imported transitively via
  // `auth`) stays connected and the test process never exits on its own.
  await authMongoClient.close();
});

function uniqueTestEmail(label: string): string {
  return `auth-regression-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function countUsersByEmail(email: string): Promise<number> {
  return db.collection("user").countDocuments({ email: email.toLowerCase() });
}

async function cleanupEmail(email: string): Promise<void> {
  const users = await db.collection("user").find({ email: email.toLowerCase() }).toArray();
  const userIds = users.map((u) => new ObjectId(u._id));
  if (userIds.length === 0) return;
  await db.collection("account").deleteMany({ userId: { $in: userIds } });
  await db.collection("session").deleteMany({ userId: { $in: userIds } });
  await db.collection("user").deleteMany({ _id: { $in: userIds } });
}

describe("duplicate email signup — sequential (the exact reported sequence)", () => {
  const email = uniqueTestEmail("sequential");
  const passwordA = "RegressionPassA123!";
  const passwordB = "RegressionPassB456!";

  after(async () => {
    await cleanupEmail(email);
  });

  test("1. sign up with Password A succeeds", async () => {
    const result = await auth.api.signUpEmail({ body: { name: "Regression Test", email, password: passwordA } });
    assert.ok(result.user);
    assert.equal(result.user.email, email.toLowerCase());
  });

  test("2. Password A logs in successfully", async () => {
    const result = await auth.api.signInEmail({ body: { email, password: passwordA } });
    assert.ok(result.token);
  });

  test("3. signing up again with the same email and Password B does not throw", async () => {
    await assert.doesNotReject(() =>
      auth.api.signUpEmail({ body: { name: "Regression Test", email, password: passwordB } })
    );
  });

  test("exactly one real user document exists for this email after the duplicate attempt", async () => {
    assert.equal(await countUsersByEmail(email), 1);
  });

  test("4. Password A must still succeed after the duplicate signup attempt", async () => {
    const result = await auth.api.signInEmail({ body: { email, password: passwordA } });
    assert.ok(result.token);
  });

  test("5. Password B must fail — no real second account was ever created", async () => {
    await assert.rejects(() => auth.api.signInEmail({ body: { email, password: passwordB } }));
  });
});

describe("duplicate email signup — concurrent race (the actual corruption mechanism)", () => {
  const email = uniqueTestEmail("race");
  const passwords = ["RacePassA1!", "RacePassB2!", "RacePassC3!", "RacePassD4!", "RacePassE5!"];

  after(async () => {
    await cleanupEmail(email);
  });

  test("5 simultaneous sign-ups for one new email never create more than one real user document", async () => {
    const attempts = await Promise.allSettled(
      passwords.map((password) =>
        auth.api.signUpEmail({ body: { name: "Race Regression Test", email, password } })
      )
    );

    // At least one must succeed (someone has to win the race) — the bug
    // this regression guards against is more than one being created, not
    // whether concurrent requests are individually accepted or rejected.
    assert.ok(attempts.some((a) => a.status === "fulfilled"));

    const userCount = await countUsersByEmail(email);
    assert.equal(userCount, 1, `expected exactly 1 real user document for the raced email, found ${userCount}`);
  });

  test("exactly one credential account is linked to that single user", async () => {
    const users = await db.collection("user").find({ email: email.toLowerCase() }).toArray();
    assert.equal(users.length, 1);
    const accountCount = await db
      .collection("account")
      .countDocuments({ userId: new ObjectId(users[0]!._id), providerId: "credential" });
    assert.equal(accountCount, 1);
  });

  test("whichever password actually won the race, exactly one of the five logs in successfully", async () => {
    const results = await Promise.allSettled(
      passwords.map((password) => auth.api.signInEmail({ body: { email, password } }))
    );
    const successes = results.filter((r) => r.status === "fulfilled");
    assert.equal(successes.length, 1, `expected exactly one working password among the raced attempts, got ${successes.length}`);
  });
});

describe("email normalization", () => {
  const email = uniqueTestEmail("normalize");
  const upperVariant = email.toUpperCase();
  const spacedVariant = `  ${email}  `;
  const password = "NormalizePass123!";

  after(async () => {
    await cleanupEmail(email);
  });

  test("original signup succeeds", async () => {
    const result = await auth.api.signUpEmail({ body: { name: "Normalize Test", email, password } });
    assert.ok(result.user);
  });

  test("an uppercase variant of the same email does not create a second user", async () => {
    await assert.doesNotReject(() =>
      auth.api.signUpEmail({ body: { name: "Normalize Test", email: upperVariant, password: "OtherPass456!" } })
    );
    assert.equal(await countUsersByEmail(email), 1);
  });

  test("logging in with the uppercase variant still authenticates the same original account", async () => {
    const result = await auth.api.signInEmail({ body: { email: upperVariant, password } });
    assert.ok(result.token);
  });

  test("a whitespace-padded variant is rejected as invalid input rather than creating a second user", async () => {
    // Better Auth's own email validation rejects leading/trailing
    // whitespace outright (no user is ever created from it) — the
    // meaningful guarantee here is that this can't become a duplicate
    // account, not that it's silently trimmed and accepted server-side.
    // The client trims before submitting (see signup/login pages) so a
    // real user's copy-pasted whitespace never reaches this validation.
    await assert.rejects(() =>
      auth.api.signUpEmail({ body: { name: "Normalize Test", email: spacedVariant, password: "OtherPass789!" } })
    );
    assert.equal(await countUsersByEmail(email), 1);
  });
});
