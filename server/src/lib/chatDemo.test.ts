import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GLOSSARY, matchGlossaryQuestion, mentionsCourseIntent } from "./chatDemo.js";

describe("matchGlossaryQuestion — acronym/definition detection", () => {
  test("full form of HTML", () => {
    const reply = matchGlossaryQuestion("full form of HTML");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.html);
    assert.deepEqual(reply.referencedCourseIds, []);
  });

  test("full form MERN (no 'of')", () => {
    const reply = matchGlossaryQuestion("full form MERN");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.mern);
    assert.match(reply.content, /MongoDB, Express\.js, React, and Node\.js/);
    assert.deepEqual(reply.referencedCourseIds, []);
  });

  test("full form CRUD (no 'of')", () => {
    const reply = matchGlossaryQuestion("full form CRUD");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.crud);
    assert.match(reply.content, /Create, Read, Update, Delete/);
    assert.deepEqual(reply.referencedCourseIds, []);
  });

  test("what does API stand for?", () => {
    const reply = matchGlossaryQuestion("what does API stand for?");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.api);
  });

  test("meaning of DOM", () => {
    const reply = matchGlossaryQuestion("meaning of DOM");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.dom);
  });

  test("what is the full form of X (embedded phrasing)", () => {
    const reply = matchGlossaryQuestion("what is the full form of HTML");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.html);
  });

  test("X stands for what", () => {
    const reply = matchGlossaryQuestion("MERN stands for what");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.mern);
  });

  test("define X", () => {
    const reply = matchGlossaryQuestion("define JWT");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.jwt);
  });

  test("what is X (simple form)", () => {
    const reply = matchGlossaryQuestion("what is Git");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.git);
  });

  test("lowercase, uppercase, and mixed-case variations all normalize the same", () => {
    const variants = ["full form of html", "FULL FORM OF HTML", "Full Form Of Html", "fUlL fOrM oF hTmL"];
    for (const v of variants) {
      const reply = matchGlossaryQuestion(v);
      assert.ok(reply, `expected a match for "${v}"`);
      assert.equal(reply.content, GLOSSARY.html);
    }
  });

  test("punctuation and extra-space variations normalize the same", () => {
    const variants = [
      "full form of HTML?",
      "full form of HTML!",
      "full form of HTML.",
      "full  form   of    HTML",
      "  full form of HTML  ",
    ];
    for (const v of variants) {
      const reply = matchGlossaryQuestion(v);
      assert.ok(reply, `expected a match for "${v}"`);
      assert.equal(reply.content, GLOSSARY.html);
    }
  });

  test("every required glossary term resolves correctly via 'full form of X'", () => {
    const required: Record<string, string> = {
      HTML: "HyperText Markup Language",
      CSS: "Cascading Style Sheets",
      API: "Application Programming Interface",
      HTTP: "HyperText Transfer Protocol",
      HTTPS: "HyperText Transfer Protocol Secure",
      URL: "Uniform Resource Locator",
      SQL: "Structured Query Language",
      CRUD: "Create, Read, Update, Delete",
      MERN: "MongoDB, Express.js, React, and Node.js",
      MEAN: "MongoDB, Express.js, Angular, and Node.js",
      DOM: "Document Object Model",
      JSON: "JavaScript Object Notation",
      JWT: "JSON Web Token",
      REST: "Representational State Transfer",
      CLI: "Command-Line Interface",
      IDE: "Integrated Development Environment",
      DBMS: "Database Management System",
      OOP: "Object-Oriented Programming",
    };
    for (const [acronym, expansion] of Object.entries(required)) {
      const reply = matchGlossaryQuestion(`full form of ${acronym}`);
      assert.ok(reply, `expected a match for "${acronym}"`);
      assert.ok(
        reply.content.includes(expansion),
        `expected "${acronym}" definition to include "${expansion}", got: ${reply.content}`
      );
      assert.deepEqual(reply.referencedCourseIds, []);
    }
  });

  test("JS resolves via the javascript alias", () => {
    const reply = matchGlossaryQuestion("full form of JS");
    assert.ok(reply);
    assert.equal(reply.content, GLOSSARY.javascript);
  });

  test("unsupported acronym gets the exact honest fallback message, never a fabricated expansion", () => {
    const reply = matchGlossaryQuestion("full form of XYZZY");
    assert.ok(reply);
    assert.equal(
      reply.content,
      "That term is not available in the Demo AI glossary yet. Ask about a course, or try another common web-development term."
    );
    assert.deepEqual(reply.referencedCourseIds, []);
  });

  test("a message that isn't a definition question returns null (falls through to other intents)", () => {
    assert.equal(matchGlossaryQuestion("recommend a react course"), null);
    assert.equal(matchGlossaryQuestion("how much does it cost"), null);
    assert.equal(matchGlossaryQuestion("hello there"), null);
  });
});

describe("mentionsCourseIntent — glossary bypass for genuine course requests", () => {
  test("'recommend a MERN course' is treated as a course request, not a glossary question", () => {
    // This is the actual mechanism generateDemoChatReply uses to decide
    // whether to even attempt matchGlossaryQuestion — asserting it's true
    // here proves such a message will search the catalog instead of only
    // returning the MERN glossary definition.
    assert.equal(mentionsCourseIntent("recommend a mern course"), true);
  });

  test("plain acronym questions do not trigger the course-intent bypass", () => {
    assert.equal(mentionsCourseIntent("full form of html"), false);
    assert.equal(mentionsCourseIntent("full form mern"), false);
    assert.equal(mentionsCourseIntent("full form crud"), false);
    assert.equal(mentionsCourseIntent("what does api stand for?"), false);
    assert.equal(mentionsCourseIntent("meaning of dom"), false);
  });

  test("genuine course follow-ups (fee/duration/suitability) still read as course intent", () => {
    assert.equal(mentionsCourseIntent("course fee"), true);
    assert.equal(mentionsCourseIntent("is it suitable for beginners?"), true);
  });
});
