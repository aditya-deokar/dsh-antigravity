import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizeRuntimeModelId,
  effortOfRuntimeModelId,
  isTieredRuntimeModelId,
  mergeEnabledModelIds,
  sortEfforts,
} from "../lib/catalog.js";

test("canonicalizeRuntimeModelId strips effort and tiered suffixes", () => {
  assert.equal(canonicalizeRuntimeModelId("claude-opus-5-5-medium"), "claude-opus-5-5");
  assert.equal(canonicalizeRuntimeModelId("claude-sonnet-5-5-high"), "claude-sonnet-5-5");
  assert.equal(canonicalizeRuntimeModelId("gemini-3.7-flash-tiered"), "gemini-3.7-flash");
  assert.equal(canonicalizeRuntimeModelId("gemini-3.7-flash-thinking"), "gemini-3.7-flash");
});

test("canonicalizeRuntimeModelId normalizes separators and aliases", () => {
  assert.equal(canonicalizeRuntimeModelId(" Gemini_3.1_Pro "), "gemini-3.1-pro");
  assert.equal(canonicalizeRuntimeModelId("gemini-pro-agent"), "gemini-3.1-pro");
  assert.equal(canonicalizeRuntimeModelId("gemini-3-flash-agent"), "gemini-3.5-flash");
});

test("effortOfRuntimeModelId reads the encoded effort", () => {
  assert.equal(effortOfRuntimeModelId("gemini-3.7-flash-low"), "low");
  assert.equal(effortOfRuntimeModelId("gemini-3.7-flash-extra-low"), "minimal");
  assert.equal(effortOfRuntimeModelId("gemini-3.7-flash-thinking"), "high");
  assert.equal(effortOfRuntimeModelId("gemini-3.7-flash-tiered"), undefined);
  assert.equal(effortOfRuntimeModelId("gemini-3.7-flash"), undefined);
});

test("isTieredRuntimeModelId detects tiered and thinking variants", () => {
  assert.equal(isTieredRuntimeModelId("gemini-3.7-flash-tiered"), true);
  assert.equal(isTieredRuntimeModelId("gemini-3.7-flash-thinking"), true);
  assert.equal(isTieredRuntimeModelId("gemini-3.7-flash-high"), false);
});

test("sortEfforts uses canonical order and removes duplicates", () => {
  assert.deepEqual(sortEfforts(["high", "minimal", "low", "high", "medium"]), [
    "minimal",
    "low",
    "medium",
    "high",
  ]);
});

test("mergeEnabledModelIds keeps enabled models, adds new ones, drops retired ones", () => {
  const merged = mergeEnabledModelIds({
    previousCatalogIds: ["a", "b", "c"],
    nextCatalogIds: ["b", "c", "d"],
    currentEnabled: ["a", "b"],
    explicitlyDisabled: ["c"],
  });
  assert.deepEqual(merged, ["b", "d"]);
});

test("mergeEnabledModelIds honours an explicit opt-out for new models", () => {
  const merged = mergeEnabledModelIds({
    previousCatalogIds: [],
    nextCatalogIds: ["x", "y"],
    currentEnabled: [],
    explicitlyDisabled: ["y"],
  });
  assert.deepEqual(merged, ["x"]);
});
