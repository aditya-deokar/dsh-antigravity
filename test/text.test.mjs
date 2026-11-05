import assert from "node:assert/strict";
import test from "node:test";
import { maskEmail, redactSecrets, safeJsonParse, sanitizeText } from "../lib/text.js";

test("sanitizeText preserves valid emoji surrogate pairs", () => {
  assert.equal(sanitizeText("hello 👋🏽 world"), "hello 👋🏽 world");
  assert.equal(sanitizeText("🚀"), "🚀");
});

test("sanitizeText replaces lone surrogates only", () => {
  assert.equal(sanitizeText("a\uD800b"), "a\uFFFDb");
  assert.equal(sanitizeText("a\uDC00b"), "a\uFFFDb");
  assert.equal(sanitizeText("a\uD800\uDC00b"), "a\uD800\uDC00b");
});

test("sanitizeText tolerates nullish and non-string input", () => {
  assert.equal(sanitizeText(undefined), "");
  assert.equal(sanitizeText(null), "");
  assert.equal(sanitizeText(42), "42");
});

test("maskEmail keeps the domain and at most two local characters", () => {
  assert.equal(maskEmail("aditya@example.com"), "ad****@example.com");
  assert.equal(maskEmail("a@example.com"), "a*@example.com");
  assert.equal(maskEmail("not-an-email"), "not-an-email");
  assert.equal(maskEmail(""), "");
});

test("redactSecrets removes common OAuth token shapes", () => {
  const text = [
    "access_token=ya29.a0AfH6SMBexample",
    "refresh_token=1//0gExampleRefreshTokenValue",
    "Authorization: Bearer abc.def.ghi",
    '{"client_secret":"super-secret"}',
  ].join("\n");
  const redacted = redactSecrets(text);
  assert.ok(!redacted.includes("ya29.a0AfH6SMBexample"));
  assert.ok(!redacted.includes("0gExampleRefreshTokenValue"));
  assert.ok(!redacted.includes("abc.def.ghi"));
  assert.ok(!redacted.includes("super-secret"));
  assert.ok(redacted.includes("[redacted"));
});

test("safeJsonParse returns undefined instead of throwing", () => {
  assert.deepEqual(safeJsonParse('{"ok":true}'), { ok: true });
  assert.equal(safeJsonParse("{not json"), undefined);
  assert.equal(safeJsonParse(undefined), undefined);
});
