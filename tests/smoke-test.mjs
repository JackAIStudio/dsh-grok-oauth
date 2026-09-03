import assert from "node:assert/strict";
import * as hostModule from "../index.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("[test] 1. Checking Host exports from index.js...");
assert.equal(typeof hostModule.apply, "function", "apply must be a function");
assert.equal(hostModule.name, "llm-grok", "name must be llm-grok");
assert.deepEqual(hostModule.inject, ["llm"], "inject must be ['llm']");
assert.ok(hostModule.Config, "Config schema must be present");
assert.equal(typeof hostModule.createGrokRpcHandler, "function", "createGrokRpcHandler must be exported");
assert.equal(typeof hostModule.createGrokAuthRuntime, "function", "createGrokAuthRuntime must be exported");
assert.equal(typeof hostModule.parseGrokBilling, "function", "parseGrokBilling must be exported");
assert.equal(typeof hostModule.parseGrokModels, "function", "parseGrokModels must be exported");
assert.equal(typeof hostModule.grokImageGenTool, "function", "grokImageGenTool must be exported");
assert.ok(Array.isArray(hostModule.GROK_OAUTH_SCOPE), "GROK_OAUTH_SCOPE must be an array");
assert.ok(hostModule.GROK_OAUTH_SCOPE.includes("grok-cli:access"), "GROK_OAUTH_SCOPE must include grok-cli:access");
assert.ok(!hostModule.GROK_OAUTH_SCOPE.includes("model:read"), "GROK_OAUTH_SCOPE must not include unknown scope model:read");
console.log("  Host exports: PASS");

console.log("[test] 2. Checking Pure Logic & Billing Parser...");
const sampleBilling = {
  config: {
    currentPeriod: {
      type: "USAGE_PERIOD_TYPE_WEEKLY",
      end: "2026-09-08T00:00:00Z"
    },
    creditUsagePercent: 42.5,
    productUsage: [
      { product: "GrokBuild", usagePercent: 12.3 },
      { product: "Imagine", usagePercent: 30.2 }
    ]
  }
};
const parsedBilling = hostModule.parseGrokBilling(sampleBilling, new Date().toISOString());
assert.ok(parsedBilling, "parseGrokBilling must succeed");
assert.equal(parsedBilling.windows.length, 3, "must parse 3 windows (SuperGrok, GrokBuild, Imagine)");
assert.equal(parsedBilling.windows[0].id, "SuperGrok");
assert.equal(parsedBilling.windows[0].used, 42.5);
assert.equal(parsedBilling.windows[1].id, "GrokBuild");
assert.equal(parsedBilling.windows[1].used, 12.3);
assert.equal(parsedBilling.windows[2].id, "Imagine");
assert.equal(parsedBilling.windows[2].used, 30.2);
console.log("  Billing Parser: PASS");

console.log("[test] 3. Checking Reasoning & Wire Resolution...");
const model46 = { id: "grok-4.6", thinking: true };
const defaultWire = hostModule.officialDefaultEffort(model46);
assert.equal(defaultWire, "high", "grok-4.6 default effort must be high");
const wired = hostModule.applyGrokReasoningWire({ reasoning: { effort: "xhigh" } }, model46);
assert.deepEqual(wired, { reasoning: { effort: "xhigh" } });
console.log("  Reasoning Wire: PASS");

console.log("[test] 4. Checking Client bundle format...");
const clientContent = readFileSync(join(__dirname, "../client.js"), "utf8");
assert.ok(
  clientContent.includes('window.__ModuleLoader__.load({'),
  "client.js must be wrapped with window.__ModuleLoader__.load"
);
assert.ok(
  clientContent.includes('id: "dsh-grok-oauth"'),
  "client.js must register plugin id dsh-grok-oauth"
);
assert.ok(
  clientContent.includes('dsh-grok-oauth/usage-dock.css'),
  "client.js must contain dock CSS"
);
console.log("  Client Bundle wrapper: PASS");

console.log("\n[test] ALL SMOKE TESTS PASSED SUCCESSFULLY!");
